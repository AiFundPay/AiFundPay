/**
 * AiFund Pay — WalletGuide
 * Installation guide for users without a wallet extension.
 * https://aifund.com/pay
 */
import React from 'react';
import config from '../config';
import theme from '../theme';

export function WalletGuide({ onClose, onDemo }) {
  return (
    <div style={theme.overlay}>
      <div style={theme.modalWide}>
        <div style={theme.header}>
          <h3 style={theme.title}>Don't have a wallet?</h3>
          <button onClick={onClose} style={theme.closeBtn}>&times;</button>
        </div>

        <p style={{ color: config.theme.textSecondary, fontSize: '12px', marginBottom: '16px' }}>
          A crypto wallet is your gateway to Web3. Pick one and install in 3 minutes.
        </p>

        <a href="https://www.google.com/chrome/" target="_blank" rel="noopener noreferrer" style={theme.chromeLink}>
          <span style={{ fontSize: '20px', marginRight: '10px' }}>🌐</span>
          <div>
            <div style={{ color: config.theme.textPrimary, fontSize: '13px', fontWeight: 600 }}>Download Chrome Browser</div>
            <div style={{ color: config.theme.textSecondary, fontSize: '11px' }}>Required for browser extension wallets</div>
          </div>
        </a>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
          {config.wallets.map((w) => (
            <div key={w.name} style={theme.walletCard}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '20px', marginRight: '10px' }}>{w.icon}</span>
                <div>
                  <div style={{ color: config.theme.textPrimary, fontSize: '13px', fontWeight: 600 }}>{w.name}</div>
                  <div style={{ color: config.theme.textSecondary, fontSize: '11px' }}>{w.desc}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginLeft: '30px' }}>
                <a href={w.url} target="_blank" rel="noopener noreferrer" style={theme.linkBtn}>Official Site ↗</a>
                <a href={w.chrome} target="_blank" rel="noopener noreferrer" style={theme.chromeLinkBtn}>Chrome Store ↗</a>
              </div>
            </div>
          ))}
        </div>

        {onDemo && (
          <div style={theme.demoHint}>
            <strong>Don't want to install?</strong> Try the{' '}
            <button onClick={() => { onClose(); onDemo(); }}
              style={{ background: 'none', border: 'none', color: '#22D3EE', textDecoration: 'underline', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
              Free Demo
            </button> instead!
          </div>
        )}

        <button onClick={onClose} style={theme.secondaryBtn}>Got it</button>
      </div>
    </div>
  );
}
