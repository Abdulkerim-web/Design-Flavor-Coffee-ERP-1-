/**
 * Manager approval modal — shows the full operational context before action.
 * Section 17 of the App Shell spec.
 *
 * The manager must understand WHAT, QUANTITY, CUSTOMER, STATUS, WHY APPROVAL
 * IS REQUIRED, STOCK FEASIBILITY, RISKS, and AVAILABLE ACTIONS before acting.
 */
import { type FC } from 'react'
import { formatETB, formatKG } from '../lib/format'

export interface ApprovalOrder {
  orderId: string
  customer: string
  branch?: string
  product: string
  quantity: number          // KG ordered
  expectedGreen: number     // KG of green beans required (after yield loss)
  availableGreen: number    // KG currently in stock
  unitPrice?: number        // ETB per KG
  notes?: string
}

interface ApprovalModalProps {
  order: ApprovalOrder
  onConfirm: () => void
  onWaitForStock: () => void
  onReject: () => void
  onClose: () => void
  loading?: boolean
}

export const ApprovalModal: FC<ApprovalModalProps> = ({
  order, onConfirm, onWaitForStock, onReject, onClose, loading
}) => {
  const shortfall = order.expectedGreen - order.availableGreen
  const isSufficient = shortfall <= 0
  const feasibilityPct = Math.min(100, Math.round((order.availableGreen / order.expectedGreen) * 100))

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="approval-title"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
        animation: 'fadeInOverlay 0.15s ease',
      }}
    >
      <style>{`
        @keyframes fadeInOverlay { from { opacity:0 } to { opacity:1 } }
        @keyframes slideInModal { from { opacity:0; transform:scale(0.97) translateY(-8px) } to { opacity:1; transform:scale(1) translateY(0) } }
      `}</style>
      <div style={{
        width: '100%', maxWidth: 480,
        background: 'var(--surface-01)',
        border: '1px solid var(--border-neutral)',
        borderRadius: 14,
        boxShadow: 'var(--shadow-modal)',
        overflow: 'hidden',
        animation: 'slideInModal 0.2s cubic-bezier(0.16,1,0.3,1)',
      }}>
        {/* Header */}
        <div style={{ padding: '18px 20px 16px', borderBottom: '1px solid var(--border-neutral)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div style={{
                  padding: '2px 8px', borderRadius: 4,
                  background: 'var(--surface-02)', border: '1px solid var(--border-neutral)',
                  fontSize: 10.5, fontFamily: 'DM Mono', color: 'var(--text-muted)',
                }}>
                  {order.orderId}
                </div>
                <div style={{
                  padding: '2px 8px', borderRadius: 4,
                  background: '#FFFBEB', border: '1px solid #FDE68A',
                  fontSize: 10.5, fontFamily: 'DM Mono', color: '#B45309', fontWeight: 600,
                }}>
                  Awaiting Approval
                </div>
              </div>
              <h2 id="approval-title" style={{
                margin: 0, fontSize: 16, fontWeight: 700,
                color: 'var(--text-primary)', letterSpacing: '-0.01em',
                fontFamily: 'Inter',
              }}>
                {order.customer}
              </h2>
              {order.branch && (
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'Inter' }}>
                  {order.branch}
                </div>
              )}
            </div>
            <button onClick={onClose} style={{
              width: 28, height: 28, borderRadius: 6, border: '1px solid var(--border-neutral)',
              background: 'var(--surface-02)', cursor: 'pointer', color: 'var(--text-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        {/* Order summary */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-neutral)', background: 'var(--bg-primary)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px' }}>
            {[
              ['Product', order.product],
              ['Quantity', formatKG(order.quantity, 0)],
              ...(order.unitPrice ? [['Unit Price', formatETB(order.unitPrice)]] : []),
              ...(order.unitPrice ? [['Order Value', formatETB(order.quantity * order.unitPrice)]] : []),
            ].map(([k, v]) => (
              <div key={k}>
                <div style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 2 }}>{k}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'Inter' }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Stock feasibility */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-neutral)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={isSufficient ? 'var(--sem-success)' : 'var(--sem-warning)'} strokeWidth="2" strokeLinecap="round">
              <path d={isSufficient ? 'M20 6L9 17l-5-5' : 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01'} />
            </svg>
            <span style={{ fontSize: 12, fontWeight: 600, fontFamily: 'DM Mono', letterSpacing: '0.05em', textTransform: 'uppercase', color: isSufficient ? 'var(--sem-success)' : 'var(--sem-warning)' }}>
              Stock Feasibility — {isSufficient ? 'Sufficient' : 'Insufficient'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Expected green required', value: formatKG(order.expectedGreen, 1), note: 'incl. roasting yield loss' },
              { label: 'Available in stock', value: formatKG(order.availableGreen, 1), note: isSufficient ? 'sufficient' : 'insufficient', warn: !isSufficient },
              ...(!isSufficient ? [{ label: 'Shortfall', value: formatKG(shortfall, 1), note: 'must be sourced or order reduced', warn: true }] : []),
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'Inter' }}>{row.label}</span>
                  {row.note && <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'DM Mono', marginLeft: 6 }}>({row.note})</span>}
                </div>
                <span style={{
                  fontFamily: 'DM Mono', fontWeight: 600, fontSize: 13,
                  color: (row as {warn?: boolean}).warn ? 'var(--sem-warning)' : 'var(--text-primary)',
                }}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          {/* Feasibility bar */}
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'DM Mono' }}>Stock coverage</span>
              <span style={{ fontSize: 11, fontFamily: 'DM Mono', fontWeight: 600, color: isSufficient ? 'var(--sem-success)' : 'var(--sem-warning)' }}>{feasibilityPct}%</span>
            </div>
            <div style={{ height: 5, background: 'var(--surface-02)', borderRadius: 999, overflow: 'hidden', border: '1px solid var(--border-neutral)' }}>
              <div style={{
                height: '100%',
                width: `${feasibilityPct}%`,
                background: isSufficient ? 'var(--sem-success)' : feasibilityPct > 60 ? 'var(--sem-warning)' : 'var(--sem-danger)',
                borderRadius: 999,
                transition: 'width 0.4s cubic-bezier(0.16,1,0.3,1)',
              }} />
            </div>
          </div>

          {!isSufficient && (
            <div style={{
              marginTop: 10, padding: '8px 12px', borderRadius: 6,
              background: '#FFFBEB', border: '1px solid #FDE68A',
              fontSize: 12, color: '#92400E', fontFamily: 'Inter', lineHeight: '16px',
            }}>
              <strong>Risk:</strong> Confirming this order without sufficient stock may delay roasting and affect the delivery schedule.
            </div>
          )}
        </div>

        {order.notes && (
          <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--border-neutral)', background: 'var(--bg-primary)' }}>
            <div style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Notes</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'Inter', lineHeight: '17px' }}>{order.notes}</div>
          </div>
        )}

        {/* Actions */}
        <div style={{ padding: '14px 20px', display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button className="btn-ghost" onClick={onReject} disabled={loading} style={{ color: 'var(--sem-danger)', height: 36, fontSize: 13 }}>
            Reject Order
          </button>
          <button className="btn-secondary" onClick={onWaitForStock} disabled={loading} style={{ height: 36, fontSize: 13 }}>
            Wait for Stock
          </button>
          <button
            className="btn-primary"
            onClick={onConfirm}
            disabled={loading}
            style={{ height: 36, fontSize: 13, background: isSufficient ? 'var(--brand-primary)' : '#B45309', gap: 6 }}
          >
            {loading ? (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                  <path d="M21 12a9 9 0 11-6.219-8.56"/>
                </svg>
                Confirming…
              </>
            ) : (
              isSufficient ? 'Confirm Order' : 'Confirm Anyway'
            )}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

export default ApprovalModal
