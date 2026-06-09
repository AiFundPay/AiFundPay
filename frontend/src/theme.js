/**
 * AiFund Pay — Theme System
 * Generates inline styles from config.theme.
 * All components import this instead of hardcoding colors.
 * https://aifund.com/pay
 */
import config from './config';

const t = config.theme;

const theme = {
  // Buttons
  connectBtn: {
    padding: '10px 24px', background: t.gradient, color: t.textPrimary,
    border: 'none', borderRadius: t.radiusFull, fontSize: '14px',
    fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s',
  },
  demoBtn: {
    padding: '10px 20px', background: `linear-gradient(to right, ${t.secondary}, #2563EB)`,
    color: t.textPrimary, border: `2px solid ${t.secondary}40`, borderRadius: t.radiusFull,
    fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s',
  },
  primaryBtn: {
    width: '100%', padding: '12px', background: t.gradient, color: t.textPrimary,
    border: 'none', borderRadius: t.radius, fontSize: '14px',
    fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s',
  },
  secondaryBtn: {
    width: '100%', padding: '10px', background: t.bgTertiary, color: t.textPrimary,
    border: 'none', borderRadius: t.radius, fontSize: '12px',
    fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s',
  },
  successBtn: {
    flex: 1, padding: '10px', background: t.gradientSuccess, color: t.textPrimary,
    border: 'none', borderRadius: t.radius, fontSize: '12px',
    fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s',
  },
  dangerBtn: {
    width: '100%', padding: '8px', background: `${t.danger}18`, color: '#F87171',
    border: 'none', borderRadius: '8px', fontSize: '12px',
    fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s',
  },
  switchBtn: {
    width: '100%', padding: '8px', background: `${t.primary}30`, color: '#A78BFA',
    border: 'none', borderRadius: '8px', fontSize: '12px',
    fontWeight: '600', cursor: 'pointer', marginBottom: '4px', transition: 'all 0.2s',
  },

  // Account menu
  accountBtn: {
    display: 'flex', alignItems: 'center', padding: '6px 12px',
    background: t.bgTertiary, border: `1px solid ${t.border}`,
    borderRadius: '8px', color: t.textPrimary, cursor: 'pointer', fontSize: '12px',
    transition: 'all 0.2s',
  },
  dropdown: {
    position: 'absolute', right: 0, top: '100%', marginTop: '4px', width: '260px',
    background: t.bgSecondary, border: `1px solid ${t.border}`,
    borderRadius: t.radius, boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
    padding: '12px', zIndex: 50,
  },

  // Overlays & Modals
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 60, padding: '8px',
  },
  modal: {
    background: `linear-gradient(to bottom right, ${t.bgSecondary}, ${t.bgPrimary})`,
    borderRadius: t.radiusLg, maxWidth: '480px', width: '100%',
    padding: '20px', border: `1px solid ${t.primary}30`,
  },
  modalWide: {
    background: `linear-gradient(to bottom right, ${t.bgSecondary}, ${t.bgPrimary})`,
    borderRadius: t.radiusLg, maxWidth: '480px', width: '100%',
    padding: '20px', border: `1px solid ${t.primary}30`,
    maxHeight: '85vh', overflow: 'auto',
  },

  // Headers
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px',
  },
  title: { color: t.textPrimary, fontSize: '18px', fontWeight: 'bold', margin: 0 },
  closeBtn: { background: 'none', border: 'none', color: t.textSecondary, fontSize: '24px', cursor: 'pointer' },

  // Cards & Info
  card: {
    padding: '10px', background: t.bgTertiary, borderRadius: t.radius,
    border: `1px solid ${t.border}`,
  },
  cardSelected: {
    borderColor: t.primary, background: `${t.primary}15`,
  },
  walletInfo: {
    marginBottom: '12px', padding: '10px', background: t.bgTertiary, borderRadius: '8px',
  },

  // Warnings
  warnBox: {
    padding: '10px', background: `${t.warning}15`, border: `1px solid ${t.warning}30`,
    borderRadius: t.radius, color: '#FDE047', fontSize: '11px', marginBottom: '12px',
  },
  dangerBox: {
    padding: '10px', background: `${t.danger}15`, border: `1px solid ${t.danger}30`,
    borderRadius: t.radius, color: '#FCA5A5', fontSize: '11px', marginBottom: '12px',
  },

  // Inputs
  input: {
    width: '100%', padding: '8px', background: 'rgba(0,0,0,0.3)',
    border: `1px solid ${t.border}`, borderRadius: '8px',
    color: t.textPrimary, fontSize: '11px', fontFamily: 'monospace', boxSizing: 'border-box',
  },

  // Chain grid
  chainGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '12px' },

  // QR
  qrContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '12px' },
  qrWhiteBg: { background: '#fff', borderRadius: t.radius, padding: '8px' },

  // Verify
  verifyBox: (verified) => ({
    padding: '16px', borderRadius: t.radius,
    border: `1px solid ${verified ? t.success : t.primary}`,
    background: `${verified ? t.success : t.primary}15`,
  }),

  // Address
  addressBox: {
    padding: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', marginBottom: '8px',
  },
  addressText: { color: t.textPrimary, fontFamily: 'monospace', fontSize: '10px', wordBreak: 'break-all' },

  // Powered by
  poweredBy: {
    textAlign: 'center', paddingTop: '8px', borderTop: `1px solid ${t.border}`, marginTop: '12px',
  },
  poweredByLink: { color: t.textMuted, fontSize: '9px', textDecoration: 'none' },
  poweredByBrand: { color: t.primary },

  // Misc
  stepLabel: { color: t.textPrimary, fontSize: '13px', fontWeight: 600, marginBottom: '12px' },
  hint: { textAlign: 'center', fontSize: '9px', color: t.textMuted, marginTop: '8px' },
  balanceRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px', marginBottom: '12px' },
  chevron: { marginLeft: '6px', fontSize: '8px', color: t.textSecondary },
  chainIcon: { marginRight: '6px', fontSize: '14px' },

  // Wallet guide
  chromeLink: {
    display: 'flex', alignItems: 'center', padding: '10px', marginBottom: '12px',
    background: '#3B82F610', border: '1px solid #3B82F630',
    borderRadius: t.radius, textDecoration: 'none',
  },
  walletCard: {
    padding: '10px', background: t.bgTertiary, borderRadius: t.radius,
    border: `1px solid ${t.border}`,
  },
  linkBtn: {
    flex: 1, textAlign: 'center', padding: '6px', background: `${t.primary}30`,
    color: '#A78BFA', borderRadius: '8px', fontSize: '11px', fontWeight: 600, textDecoration: 'none',
  },
  chromeLinkBtn: {
    flex: 1, textAlign: 'center', padding: '6px', background: `${t.secondary}30`,
    color: '#67E8F9', borderRadius: '8px', fontSize: '11px', fontWeight: 600, textDecoration: 'none',
  },
  demoHint: {
    padding: '10px', background: `${t.secondary}15`, border: `1px solid ${t.secondary}30`,
    borderRadius: t.radius, color: '#67E8F9', fontSize: '12px', marginBottom: '12px',
  },
};

export default theme;
