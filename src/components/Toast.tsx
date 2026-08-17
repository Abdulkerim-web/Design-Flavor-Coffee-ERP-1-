/* Responsive: mobile ≤640 | tablet 641–1024 | laptop 1025–1440 | desktop >1440 */
import { useState, useEffect, type FC } from 'react'
import { useToast, type Toast, type ToastType } from '../contexts/ToastContext'
import { useBreakpoint } from '../hooks/useBreakpoint'

/* ── Config per toast type ───────────────────────────────── */
const CFG: Record<ToastType, {
  bg: string; border: string; iconColor: string; textColor: string;
  iconPath: string; label: string
}> = {
  success: {
    bg: '#F0FDF4', border: '#86EFAC', iconColor: '#16A34A', textColor: '#14532D',
    iconPath: 'M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11',
    label: 'Success',
  },
  warning: {
    bg: '#FFFBEB', border: '#FCD34D', iconColor: '#D97706', textColor: '#78350F',
    iconPath: 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01',
    label: 'Warning',
  },
  error: {
    bg: '#FEF2F2', border: '#FCA5A5', iconColor: '#DC2626', textColor: '#7F1D1D',
    iconPath: 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01',
    label: 'Error',
  },
  info: {
    bg: '#EFF6FF', border: '#93C5FD', iconColor: '#2563EB', textColor: '#1E3A8A',
    iconPath: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 16v-4M12 8h.01',
    label: 'Information',
  },
  loading: {
    bg: 'var(--surface-01)', border: 'var(--border-neutral)', iconColor: '#6B7280', textColor: 'var(--text-primary)',
    iconPath: '',
    label: 'Loading',
  },
}

/* ── Single toast item ───────────────────────────────────── */
const ToastItem: FC<{ toast: Toast; onRemove: () => void }> = ({ toast, onRemove }) => {
  const [visible, setVisible] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const cfg = CFG[toast.type]

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 20)
    return () => clearTimeout(t)
  }, [])

  const dismiss = () => {
    setLeaving(true)
    setTimeout(onRemove, 260)
  }

  // If duration > 0, add a shrinking progress bar
  const hasDuration = toast.type !== 'loading' && (toast.duration ?? 4500) > 0

  return (
    <div
      role="alert"
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
      style={{
        position: 'relative', overflow: 'hidden',
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        borderRadius: 10,
        boxShadow: '0 4px 20px rgba(0,0,0,0.1), 0 1px 4px rgba(0,0,0,0.06)',
        padding: '12px 14px',
        display: 'flex', gap: 10, alignItems: 'flex-start',
        minWidth: 280, maxWidth: 380,
        opacity: visible && !leaving ? 1 : 0,
        transform: visible && !leaving ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.97)',
        transition: 'opacity 0.24s ease, transform 0.24s cubic-bezier(0.16,1,0.3,1)',
        cursor: 'default',
      }}
    >
      {/* Progress bar */}
      {hasDuration && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0,
          height: 2, background: cfg.border,
          animation: `toastProgress ${toast.duration ?? 4500}ms linear forwards`,
        }} />
      )}

      {/* Icon */}
      <div style={{ flexShrink: 0, width: 20, height: 20, marginTop: 1 }}>
        {toast.type === 'loading' ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={cfg.iconColor} strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'toastSpin 0.75s linear infinite' }}>
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={cfg.iconColor} strokeWidth="2" strokeLinecap="round">
            <path d={cfg.iconPath} />
          </svg>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: cfg.textColor, lineHeight: '18px', fontFamily: 'Inter' }}>
          {toast.message}
        </div>
        {toast.description && (
          <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 2, lineHeight: '16px', fontFamily: 'Inter' }}>
            {toast.description}
          </div>
        )}
        {toast.action && (
          <button
            onClick={toast.action.onClick}
            style={{
              marginTop: 6, background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 600, color: cfg.iconColor, fontFamily: 'Inter',
              padding: 0, textDecoration: 'underline',
            }}
          >
            {toast.action.label}
          </button>
        )}
      </div>

      {/* Dismiss button */}
      {toast.dismissible !== false && (
        <button
          onClick={dismiss}
          aria-label="Dismiss notification"
          style={{
            flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer',
            color: cfg.iconColor, opacity: 0.5, padding: 2, borderRadius: 4,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.5' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      )}
    </div>
  )
}

/* ── Toast container ─────────────────────────────────────── */
export default function ToastContainer() {
  const { toasts, removeToast } = useToast()
  const { isMobile } = useBreakpoint()

  if (toasts.length === 0) return null

  return (
    <>
      <style>{`
        @keyframes toastSpin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        @keyframes toastProgress { from { width: 100% } to { width: 0% } }
      `}</style>
      <div
        aria-live="polite"
        aria-atomic="false"
        style={{
          position: 'fixed',
          bottom: isMobile ? 72 : 24,
          right: isMobile ? 0 : 24,
          left: isMobile ? 0 : 'auto',
          zIndex: 2000,
          display: 'flex', flexDirection: 'column', gap: 8,
          alignItems: isMobile ? 'center' : 'flex-end',
          pointerEvents: 'none',
          padding: isMobile ? '0 16px' : 0,
        }}
      >
        {toasts.map(t => (
          <div key={t.id} style={{ pointerEvents: 'all', width: isMobile ? '100%' : 'auto', maxWidth: isMobile ? 420 : 380 }}>
            <ToastItem toast={t} onRemove={() => removeToast(t.id)} />
          </div>
        ))}
      </div>
    </>
  )
}
