/**
 * AiFund Pay — PaymentFlow
 * 3-step USDT payment with on-chain verification.
 * https://aifund.com/pay
 */
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import config from '../config';
import theme from '../theme';

export function PaymentFlow({ walletAddress, amount, paymentType = 'payment', onClose, onSuccess, backendUrl }) {
  const api = `${backendUrl || config.backendUrl}/api`;
  const [selectedChain, setSelectedChain] = useState('trc20');
  const [step, setStep] = useState('select');
  const [copied, setCopied] = useState(false);
  const [autoPolling, setAutoPolling] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [txHash, setTxHash] = useState('');
  const pollRef = useRef(null);

  useEffect(() => { return () => { if (pollRef.current) clearInterval(pollRef.current); }; }, []);

  const currentAddr = config.receivingAddresses[selectedChain];
  const chainInfo = config.chains[selectedChain];
  const qrUrl = currentAddr ? `${config.payment.qrApiUrl}?size=180x180&data=${encodeURIComponent(currentAddr.address)}` : '';

  const handleCopy = () => { navigator.clipboard.writeText(currentAddr?.address || '').catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const doVerify = async () => {
    setVerifying(true);
    try {
      const res = await axios.post(`${api}/payment/verify`, { wallet_address: walletAddress, amount: amount * config.payment.gasTolerance, chain: selectedChain, payment_type: paymentType });
      setVerifyResult(res.data);
      if (res.data.verified) { stopPolling(); setTimeout(() => onSuccess && onSuccess(), 1500); }
    } catch (e) { setVerifyResult({ verified: false, message: 'Check failed, retrying...' }); }
    setVerifying(false);
  };

  const startPolling = () => {
    setAutoPolling(true); setVerifyResult(null); setPollCount(0); doVerify();
    pollRef.current = setInterval(() => {
      setPollCount(prev => { if (prev >= config.payment.maxPolls) { stopPolling(); return prev; } doVerify(); return prev + 1; });
    }, config.payment.pollInterval);
  };

  const stopPolling = () => { if (pollRef.current) clearInterval(pollRef.current); setAutoPolling(false); };

  const handleManualConfirm = async () => {
    if (!txHash) return; setVerifying(true); stopPolling();
    try {
      await axios.post(`${api}/payment/manual-confirm`, { wallet_address: walletAddress, tx_hash: txHash, amount, chain: selectedChain, payment_type: paymentType });
      setVerifyResult({ verified: true, message: 'Payment confirmed!' }); setTimeout(() => onSuccess && onSuccess(), 1500);
    } catch (e) { setVerifyResult({ verified: false, message: 'Submission failed.' }); }
    setVerifying(false);
  };

  return (
    <div style={theme.overlay}>
      <div style={theme.modal}>
        <div style={theme.header}>
          <h3 style={theme.title}>Pay {amount} USDT</h3>
          <button onClick={() => { stopPolling(); onClose(); }} style={theme.closeBtn}>&times;</button>
        </div>

        {/* Step 1 */}
        {step === 'select' && (
          <div>
            <p style={theme.stepLabel}>1. Select payment network</p>
            <div style={theme.chainGrid}>
              {Object.entries(config.chains).map(([id, info]) => (
                <button key={id} onClick={() => setSelectedChain(id)}
                  style={{ ...theme.card, ...(selectedChain === id ? theme.cardSelected : {}), cursor: 'pointer', textAlign: 'left' }}>
                  <div style={{ fontSize: '20px' }}>{info.icon}</div>
                  <div style={{ color: config.theme.textPrimary, fontSize: '11px', fontWeight: 600, marginTop: '4px' }}>{info.name}</div>
                  <div style={{ color: config.theme.textMuted, fontSize: '10px' }}>{info.fee}</div>
                </button>
              ))}
            </div>
            <div style={theme.warnBox}>⚠️ Please pay from the same wallet you used to log in.</div>
            <button onClick={() => setStep('pay')} style={theme.primaryBtn}>Continue →</button>
          </div>
        )}

        {/* Step 2 */}
        {step === 'pay' && currentAddr && (
          <div>
            <p style={theme.stepLabel}>2. Send {amount} USDT ({chainInfo.icon} {chainInfo.name})</p>
            <div style={theme.qrContainer}>
              <div style={theme.qrWhiteBg}><img src={qrUrl} alt="QR" style={{ width: '160px', height: '160px' }} /></div>
              <p style={{ color: config.theme.textSecondary, fontSize: '11px', margin: '8px 0 4px' }}>Scan QR or copy address</p>
            </div>
            <div style={theme.addressBox}><p style={theme.addressText}>{currentAddr.address}</p></div>
            <button onClick={handleCopy} style={{ ...theme.secondaryBtn, background: copied ? config.theme.success : config.theme.bgTertiary }}>
              {copied ? '✓ Copied!' : 'Copy Address'}
            </button>
            <div style={theme.dangerBox}>⚠️ Ensure at least {amount} USDT arrives after gas. Wrong network = lost funds.</div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={() => setStep('select')} style={theme.secondaryBtn}>Back</button>
              <button onClick={() => { setStep('verify'); startPolling(); }} style={theme.successBtn}>I've Sent Payment</button>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 'verify' && (
          <div>
            <p style={theme.stepLabel}>3. Verifying payment</p>
            <div style={theme.verifyBox(verifyResult?.verified)}>
              <div style={{ fontSize: '32px', textAlign: 'center', marginBottom: '8px' }}>{verifyResult?.verified ? '✅' : autoPolling ? '🔄' : '⏳'}</div>
              <p style={{ textAlign: 'center', color: verifyResult?.verified ? '#6EE7B7' : config.theme.textPrimary, fontWeight: 600, fontSize: '13px' }}>
                {verifyResult?.verified ? 'Payment Verified!' : autoPolling ? 'Scanning blockchain...' : 'Waiting'}
              </p>
              {autoPolling && !verifyResult?.verified && (
                <p style={{ textAlign: 'center', color: config.theme.textSecondary, fontSize: '11px', marginTop: '4px' }}>
                  Auto-checking every {config.payment.pollInterval/1000}s ({pollCount + 1}/{config.payment.maxPolls})
                </p>
              )}
            </div>
            {!verifyResult?.verified && (
              <div style={{ marginTop: '12px', padding: '12px', background: config.theme.bgTertiary, borderRadius: config.theme.radius }}>
                <p style={{ color: config.theme.textSecondary, fontSize: '11px', marginBottom: '8px' }}>Or paste transaction hash:</p>
                <input type="text" value={txHash} onChange={(e) => setTxHash(e.target.value)} placeholder="TX hash..." style={theme.input} />
                <button onClick={handleManualConfirm} disabled={!txHash || verifying}
                  style={{ ...theme.secondaryBtn, opacity: !txHash ? 0.4 : 1, marginTop: '8px' }}>Confirm with TX Hash</button>
              </div>
            )}
            <button onClick={() => { stopPolling(); setStep('pay'); }} style={{ ...theme.secondaryBtn, marginTop: '12px' }}>Back</button>
          </div>
        )}

        {/* Powered by */}
        {config.theme.showPoweredBy && (
          <div style={theme.poweredBy}>
            <a href="https://aifund.com/pay" target="_blank" rel="noopener noreferrer" style={theme.poweredByLink}>
              Powered by <span style={theme.poweredByBrand}>AiFund Pay</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
