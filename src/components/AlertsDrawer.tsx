/* Responsive: mobile ≤640 | tablet 641–1024 | laptop 1025–1440 | desktop >1440 */
import { useEffect, type FC } from 'react'
import { useBreakpoint } from '../hooks/useBreakpoint'

interface Alert {
  id: string
  type: 'danger' | 'warning' | 'info'
  category: string
  title: string
  detail: string
  time: string
  action?: string
}

const MOCK_ALERTS: Alert[] = [
  {
    id: 'a1',
    type: 'danger',
    category: 'Low Stock',
    title: 'Yirgacheffe Grade 1 critically low',
    detail: '42 kg remaining — below 50 kg reorder threshold',
    time: '8 min ago',
    action: 'View Inventory',
  },
  {
    id: 'a2',
    type: 'danger',
    category: 'Discrepancy',
    title: 'Batch R-2024-089 weight variance exceeded',
    detail: '8.2% loss vs. 5% allowance — dual verification required',
    time: '34 min ago',
    action: 'Review Batch',
  },
  {
    id: 'a3',
    type: 'warning',
    category: 'Low Stock',
    title: '1KG Kraft bags running low',
    detail: '186 units remaining — reorder point is 200',
    time: '1h 12m ago',
    action: 'View Packaging',
  },
  {
    id: 'a4',
    type: 'warning',
    category: 'QC Pending',
    title: '3 cupping inspections awaiting sign-off',
    detail: 'Batches R-2024-091, 092, 093 pending QC manager approval',
    time: '2h 5m ago',
    action: 'Open QC',
  },
  {
    id: 'a5',
    type: 'info',
    category: 'Delivery',
    title: 'Route D-204 check-in overdue by 18 min',
    detail: 'Driver Tesfaye Alemu — Bole Road drop, 4 stops remaining',
    time: '3h ago',
    action: 'Track Route',
  },
]

const typeColor: Record<Alert['type'], string> = {
  danger:  'var(--sem-danger)',
  warning: 'var(--sem-warning)',
  info:    'var(--sem-info)',
}

const typeBg: Record<Alert['type'], string> = {
  danger:  'rgba(220,38,38,0.08)',
  warning: 'rgba(245,158,11,0.08)',
  info:    'rgba(37,99,235,0.08)',
}

const AlertIcon: FC<{ type: Alert['type'] }> = ({ type }) => {
  const d = type === 'danger'
    ? 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01'
    : type === 'warning'
    ? 'M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-7v2m0-6v2'
    : 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  )
}

interface AlertsDrawerProps {
  open: boolean
  onClose: () => void
}

export default function AlertsDrawer({ open, onClose }: AlertsDrawerProps) {
  const { isMobile } = useBreakpoint()
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 240,
          background: 'rgba(0,0,0,0.45)',
          animation: 'fadeInOverlay 0.2s ease',
        }}
      />
      <div
        style={isMobile ? {
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 241,
          background: 'var(--surface-01)',
          borderRadius: 0,
          boxShadow: '0 -8px 32px rgba(0,0,0,0.12)',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideUpDrawer 0.28s cubic-bezier(0.16,1,0.3,1)',
        } : {
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 241,
          background: 'var(--surface-01)',
          borderRadius: '16px 16px 0 0',
          boxShadow: '0 -8px 32px rgba(0,0,0,0.12)',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideUpDrawer 0.28s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        <style>{`
          @keyframes slideUpDrawer {
            from { transform: translateY(100%); opacity: 0; }
            to   { transform: translateY(0);    opacity: 1; }
          }
        `}</style>

        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, paddingBottom: 4, flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-neutral)' }} />
        </div>

        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingLeft: 20,
          paddingRight: 20,
          paddingTop: 8,
          paddingBottom: 14,
          borderBottom: '1px solid var(--border-neutral)',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'Inter' }}>
              Operations Alerts
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'DM Mono', marginTop: 2 }}>
              {MOCK_ALERTS.length} active · updated just now
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border-neutral)',
              background: 'var(--surface-02)', color: 'var(--text-secondary)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Alert List */}
        <div style={{ overflowY: 'auto', flex: 1, paddingBottom: isMobile ? 'env(safe-area-inset-bottom, 24px)' : 24 }}>
          {MOCK_ALERTS.map((alert, i) => (
            <div
              key={alert.id}
              style={{
                paddingLeft: 20,
                paddingRight: 20,
                paddingTop: 14,
                paddingBottom: 14,
                borderBottom: i < MOCK_ALERTS.length - 1 ? '1px solid var(--border-neutral)' : 'none',
                display: 'flex',
                gap: 12,
                alignItems: 'flex-start',
              }}
            >
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: typeBg[alert.type],
                color: typeColor[alert.type],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: 1,
              }}>
                <AlertIcon type={alert.type} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <span style={{
                    fontSize: 10,
                    fontFamily: 'DM Mono',
                    color: typeColor[alert.type],
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}>
                    {alert.category}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'DM Mono' }}>
                    {alert.time}
                  </span>
                </div>
                <div style={{
                  fontSize: 13.5,
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  fontFamily: 'Inter',
                  marginBottom: 3,
                  lineHeight: '1.3',
                }}>
                  {alert.title}
                </div>
                <div style={{
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  fontFamily: 'Inter',
                  lineHeight: '1.4',
                }}>
                  {alert.detail}
                </div>
                {alert.action && (
                  <button style={{
                    marginTop: 8,
                    fontSize: 11.5,
                    fontFamily: 'Inter',
                    fontWeight: 500,
                    color: 'var(--brand-primary)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    textDecoration: 'underline',
                    textUnderlineOffset: 2,
                  }}>
                    {alert.action} →
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
