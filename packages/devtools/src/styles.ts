// ---------------------------------------------------------------------------
// Devtools styles — CSS-in-JS (zero dependencies)
// ---------------------------------------------------------------------------
// Modern dark theme, lightweight, no external CSS files needed.
// ---------------------------------------------------------------------------

import type { CSSProperties } from 'react';

// Palette
const C = {
  bg: '#0f0f1a',
  bgPanel: '#16162a',
  bgCard: '#1c1c36',
  bgHover: '#24244a',
  bgInput: '#12122a',
  border: '#2d2d5e',
  borderFocus: '#6366f1',
  text: '#e2e8f0',
  textMuted: '#94a3b8',
  textDim: '#64748b',
  accent: '#6366f1',
  accentHover: '#818cf8',
  green: '#22c55e',
  red: '#ef4444',
  orange: '#f59e0b',
  blue: '#3b82f6',
  purple: '#a855f7',
  cyan: '#06b6d4',
} as const;

const font = "'Inter', 'SF Pro Text', -apple-system, system-ui, sans-serif";
const mono = "'JetBrains Mono', 'Fira Code', 'SF Mono', ui-monospace, monospace";

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

export const positions: Record<string, CSSProperties> = {
  'bottom-right': { bottom: 16, right: 16 },
  'bottom-left': { bottom: 16, left: 16 },
  'top-right': { top: 16, right: 16 },
  'top-left': { top: 16, left: 16 },
};

export const container: CSSProperties = {
  position: 'fixed',
  zIndex: 2147483647,
  fontFamily: font,
  fontSize: 13,
  lineHeight: 1.5,
  color: C.text,
  WebkitFontSmoothing: 'antialiased',
};

export const panel: CSSProperties = {
  background: C.bgPanel,
  border: `1px solid ${C.border}`,
  borderRadius: 12,
  width: 420,
  maxHeight: 560,
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.1)',
  overflow: 'hidden',
  marginBottom: 8,
};

export const header: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '10px 14px',
  borderBottom: `1px solid ${C.border}`,
  background: C.bg,
  flexShrink: 0,
};

export const headerTitle: CSSProperties = {
  fontWeight: 700,
  fontSize: 13,
  color: C.accent,
  display: 'flex',
  alignItems: 'center',
  gap: 6,
};

export const headerActions: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
};

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

export const tabBar: CSSProperties = {
  display: 'flex',
  borderBottom: `1px solid ${C.border}`,
  background: C.bg,
  flexShrink: 0,
  overflowX: 'auto',
};

export const tab = (active: boolean): CSSProperties => ({
  padding: '7px 12px',
  fontSize: 11,
  fontWeight: active ? 600 : 400,
  color: active ? C.accent : C.textMuted,
  background: 'transparent',
  border: 'none',
  borderBottom: active ? `2px solid ${C.accent}` : '2px solid transparent',
  cursor: 'pointer',
  fontFamily: font,
  whiteSpace: 'nowrap',
  transition: 'color 0.15s, border-color 0.15s',
});

// ---------------------------------------------------------------------------
// Content area
// ---------------------------------------------------------------------------

export const content: CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: 12,
};

// ---------------------------------------------------------------------------
// Search / Filter bar
// ---------------------------------------------------------------------------

export const filterBar: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '8px 12px',
  borderBottom: `1px solid ${C.border}`,
  flexShrink: 0,
};

export const filterInput: CSSProperties = {
  flex: 1,
  padding: '5px 10px',
  fontSize: 12,
  fontFamily: mono,
  color: C.text,
  background: C.bgInput,
  border: `1px solid ${C.border}`,
  borderRadius: 6,
  outline: 'none',
};

// ---------------------------------------------------------------------------
// Cards / Entries
// ---------------------------------------------------------------------------

export const card: CSSProperties = {
  background: C.bgCard,
  border: `1px solid ${C.border}`,
  borderRadius: 8,
  padding: '10px 12px',
  marginBottom: 6,
};

export const logEntry = (type: string): CSSProperties => {
  const leftColor =
    type === 'access-check'
      ? C.blue
      : type === 'feature-eval'
        ? C.cyan
        : type === 'policy-eval'
          ? C.purple
          : type === 'experiment-assign'
            ? C.orange
            : type === 'render-denied'
              ? C.red
              : C.textDim;

  return {
    ...card,
    borderLeft: `3px solid ${leftColor}`,
    fontSize: 12,
  };
};

export const entryHeader: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 4,
};

export const entryType: CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  color: C.textMuted,
};

export const entryTime: CSSProperties = {
  fontSize: 10,
  color: C.textDim,
  fontFamily: mono,
};

export const entryKey: CSSProperties = {
  fontFamily: mono,
  fontSize: 12,
  fontWeight: 600,
  color: C.text,
};

export const badge = (variant: 'success' | 'error' | 'info' | 'warn'): CSSProperties => {
  const colors = {
    success: { bg: 'rgba(34,197,94,0.15)', color: C.green },
    error: { bg: 'rgba(239,68,68,0.15)', color: C.red },
    info: { bg: 'rgba(99,102,241,0.15)', color: C.accent },
    warn: { bg: 'rgba(245,158,11,0.15)', color: C.orange },
  };
  const c = colors[variant];
  return {
    display: 'inline-block',
    padding: '1px 6px',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 600,
    fontFamily: mono,
    background: c.bg,
    color: c.color,
  };
};

// ---------------------------------------------------------------------------
// Stat grid (overview)
// ---------------------------------------------------------------------------

export const statGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 8,
  marginBottom: 12,
};

export const statCard: CSSProperties = {
  ...card,
  textAlign: 'center' as const,
  padding: '12px 8px',
};

export const statValue: CSSProperties = {
  fontSize: 22,
  fontWeight: 700,
  color: C.accent,
  fontFamily: mono,
};

export const statLabel: CSSProperties = {
  fontSize: 10,
  color: C.textMuted,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  marginTop: 2,
};

// ---------------------------------------------------------------------------
// Toggle button
// ---------------------------------------------------------------------------

export const toggleButton = (open: boolean): CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  width: open ? 36 : 'auto',
  height: 36,
  padding: open ? 0 : '0 14px',
  background: open ? C.red : C.accent,
  color: '#fff',
  border: 'none',
  borderRadius: open ? '50%' : 18,
  cursor: 'pointer',
  fontFamily: font,
  fontSize: 12,
  fontWeight: 600,
  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
  transition: 'all 0.2s',
});

// ---------------------------------------------------------------------------
// Small button (actions)
// ---------------------------------------------------------------------------

export const smallButton: CSSProperties = {
  padding: '4px 8px',
  fontSize: 10,
  fontWeight: 600,
  fontFamily: font,
  color: C.textMuted,
  background: 'transparent',
  border: `1px solid ${C.border}`,
  borderRadius: 4,
  cursor: 'pointer',
  transition: 'color 0.15s, border-color 0.15s',
};

// ---------------------------------------------------------------------------
// Details row / key-value
// ---------------------------------------------------------------------------

export const kvRow: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '3px 0',
  fontSize: 12,
};

export const kvKey: CSSProperties = {
  color: C.textMuted,
  fontFamily: mono,
  fontSize: 11,
};

export const kvValue: CSSProperties = {
  color: C.text,
  fontFamily: mono,
  fontSize: 11,
  fontWeight: 500,
};

// ---------------------------------------------------------------------------
// Section heading
// ---------------------------------------------------------------------------

export const sectionHeading: CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
  color: C.textMuted,
  marginBottom: 8,
  marginTop: 12,
};

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

export const emptyState: CSSProperties = {
  textAlign: 'center' as const,
  padding: '24px 16px',
  color: C.textDim,
  fontSize: 12,
};

// ---------------------------------------------------------------------------
// Pill list (roles, permissions)
// ---------------------------------------------------------------------------

export const pillContainer: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap' as const,
  gap: 4,
};

export const pill: CSSProperties = {
  display: 'inline-block',
  padding: '2px 8px',
  borderRadius: 12,
  fontSize: 11,
  fontFamily: mono,
  fontWeight: 500,
  background: 'rgba(99,102,241,0.12)',
  color: C.accent,
};

// ---------------------------------------------------------------------------
// Feature list row
// ---------------------------------------------------------------------------

export const featureRow: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '6px 0',
  borderBottom: `1px solid ${C.border}`,
};

export const featureName: CSSProperties = {
  fontFamily: mono,
  fontSize: 12,
  fontWeight: 500,
  color: C.text,
};

// ---------------------------------------------------------------------------
// Keyboard shortcut hint
// ---------------------------------------------------------------------------

export const kbd: CSSProperties = {
  display: 'inline-block',
  padding: '1px 5px',
  fontSize: 10,
  fontFamily: mono,
  color: C.textDim,
  background: C.bgCard,
  border: `1px solid ${C.border}`,
  borderRadius: 3,
};
