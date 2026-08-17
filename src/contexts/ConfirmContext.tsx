import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface ConfirmOptions {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  detail?: string        // extra sub-text below message
}

interface ConfirmContextValue {
  confirm: (opts: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null)

interface DialogState extends ConfirmOptions {
  resolve: (v: boolean) => void
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<DialogState | null>(null)

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise(resolve => {
      setDialog({ ...opts, resolve })
    })
  }, [])

  const close = (result: boolean) => {
    dialog?.resolve(result)
    setDialog(null)
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {dialog && (
        <ConfirmDialog
          title={dialog.title}
          message={dialog.message}
          detail={dialog.detail}
          confirmLabel={dialog.confirmLabel ?? 'Confirm'}
          cancelLabel={dialog.cancelLabel ?? 'Cancel'}
          danger={dialog.danger}
          onConfirm={() => close(true)}
          onCancel={() => close(false)}
        />
      )}
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used inside <ConfirmProvider>')
  return ctx.confirm
}

/* ── Dialog UI ────────────────────────────────────────────── */
function ConfirmDialog({
  title, message, detail, confirmLabel, cancelLabel, danger,
  onConfirm, onCancel,
}: {
  title: string; message: string; detail?: string;
  confirmLabel: string; cancelLabel: string; danger?: boolean;
  onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onCancel() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1800,
        background: 'rgba(0,0,0,0.42)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
        animation: 'confirmFadeIn 0.16s ease',
      }}
    >
      <style>{`
        @keyframes confirmFadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes confirmSlide { from { opacity:0; transform:translateY(10px) scale(0.97) } to { opacity:1; transform:translateY(0) scale(1) } }
      `}</style>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        style={{
          background: 'var(--surface-01)',
          border: '1px solid var(--border-neutral)',
          borderRadius: 14,
          boxShadow: '0 24px 48px rgba(0,0,0,0.2), 0 6px 12px rgba(0,0,0,0.1)',
          padding: '26px 26px 22px',
          maxWidth: 380, width: '100%',
          animation: 'confirmSlide 0.2s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {/* Icon */}
        <div style={{
          width: 44, height: 44, borderRadius: 11, marginBottom: 16,
          background: danger ? 'linear-gradient(135deg, #FEF2F2, #FEE2E2)' : 'linear-gradient(135deg, #F0FDF4, #DCFCE7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `1px solid ${danger ? '#FCA5A5' : '#86EFAC'}`,
        }}>
          {danger ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="1.75" strokeLinecap="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="1.75" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          )}
        </div>

        <div id="confirm-title" style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em', marginBottom: 6 }}>
          {title}
        </div>
        <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.55, margin: '0 0 6px' }}>
          {message}
        </p>
        {detail && (
          <p style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.5, margin: '0 0 20px', padding: '8px 10px', background: 'var(--surface-02)', borderRadius: 7, border: '1px solid var(--border-neutral)', fontFamily: 'Inter' }}>
            {detail}
          </p>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: detail ? 0 : 22 }}>
          <button
            onClick={onCancel}
            autoFocus={!danger}
            style={{
              flex: 1, height: 40, borderRadius: 8,
              border: '1.5px solid var(--border-neutral)', background: 'none',
              fontSize: 13.5, fontWeight: 500, fontFamily: 'Inter',
              color: 'var(--text-secondary)', cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor = 'var(--brand-primary)'; el.style.color = 'var(--brand-primary)' }}
            onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor = 'var(--border-neutral)'; el.style.color = 'var(--text-secondary)' }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            autoFocus={danger}
            style={{
              flex: 1, height: 40, borderRadius: 8, border: 'none',
              background: danger ? 'var(--sem-danger)' : '#2B4D3A',
              fontSize: 13.5, fontWeight: 600, fontFamily: 'Inter',
              color: '#FFFFFF', cursor: 'pointer',
              boxShadow: danger ? '0 3px 10px rgba(220,38,38,0.25)' : '0 3px 10px rgba(43,77,58,0.25)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => { const el = e.currentTarget; el.style.background = danger ? '#B91C1C' : '#1F382A'; el.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { const el = e.currentTarget; el.style.background = danger ? 'var(--sem-danger)' : '#2B4D3A'; el.style.transform = 'translateY(0)' }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
