/**
 * AiFund Pay — WalletButton
 * Connect/disconnect button with account dropdown.
 * https://aifund.com/pay
 */
import React, { useState, useEffect } from 'react';
import theme from '../theme';
import config from '../config';

export function WalletButton({ wallet, className = '', style: customStyle = {} }) {
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      if (showMenu && !e.target.closest('.afp-account-menu')) setShowMenu(false);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [showMenu]);

  if (!wallet.connected) {
    return (
      <div style={{ display: 'flex', gap: '8px', ...customStyle }}>
        <button onClick={() => wallet.hasWalletExtension ? wallet.connect() : wallet.connect()}
          disabled={wallet.loading} className={className}
          style={!className ? theme.connectBtn : undefined}>
          {wallet.loading ? '...' : 'Connect Wallet'}
        </button>
        {config.demo.enabled && (
          <button onClick={wallet.enterDemo} disabled={wallet.loading}
            style={theme.demoBtn}>
            {wallet.loading ? '...' : 'Demo'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="afp-account-menu" style={{ position: 'relative', ...customStyle }}>
      <button onClick={() => setShowMenu(!showMenu)} style={theme.accountBtn}>
        <span style={theme.chainIcon}>{wallet.chainIcon}</span>
        <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{wallet.displayAddress}</span>
        <span style={theme.chevron}>{showMenu ? '▲' : '▼'}</span>
      </button>

      {showMenu && (
        <div style={theme.dropdown}>
          <div style={theme.walletInfo}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: '20px', marginRight: '8px' }}>{wallet.chainIcon}</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: config.theme.textPrimary, fontSize: '11px', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>
                  {wallet.isDemoMode ? 'Demo Account' : wallet.address}
                </div>
                <div style={{ color: config.theme.textMuted, fontSize: '10px' }}>{wallet.chainLabel}</div>
              </div>
            </div>
          </div>

          {wallet.userData?.user?.balance_usd !== undefined && (
            <div style={theme.balanceRow}>
              <span style={{ color: config.theme.textSecondary, fontSize: '12px' }}>Balance</span>
              <span style={{ color: config.theme.textPrimary, fontWeight: 'bold' }}>${wallet.userData.user.balance_usd.toFixed(2)}</span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {wallet.isDemoMode && (
              <button onClick={() => { setShowMenu(false); wallet.disconnect(); setTimeout(wallet.connect, 100); }}
                style={theme.switchBtn}>Connect Real Wallet</button>
            )}
            <button onClick={() => { setShowMenu(false); wallet.disconnect(); }}
              style={theme.dangerBtn}>
              {wallet.isDemoMode ? 'Exit Demo & Switch Wallet' : 'Disconnect & Switch Wallet'}
            </button>
          </div>
          <div style={theme.hint}>
            {wallet.isDemoMode ? 'Exit to connect a different wallet' : 'Disconnect to switch address'}
          </div>
        </div>
      )}
    </div>
  );
}
