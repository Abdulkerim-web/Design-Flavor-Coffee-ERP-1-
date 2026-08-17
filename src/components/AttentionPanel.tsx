/**
 * AttentionPanel — "Needs Attention" list for dashboards and detail pages.
 * Renders backend-supplied alerts; never calculates or fabricates conditions.
 */
import type { FC, ReactNode, CSSProperties } from 'react'
import { useTheme } from '../contexts/ThemeContext'

type AttentionSeverity = 'danger' | 'warning' | 'info'

const SEV: Record<AttentionSeverity, {
  color: string; bg: string; border: string
  darkColor: string; darkBg: string; darkBorder: string
  icon: string; label: string
}> = {
  danger: {
    color: '#B91C1C', bg: '#FEF2F2', border: '#FECACA',
    darkColor: '#FCA5A5', darkBg: 'rgba(248,113,113,0.10)', darkBorder: 'rgba(248,113,113,0.25)',
    icon: 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01',
    label: 'Urgent',
  },
  warning: {
    color: '#B45309', bg: '#FFFBEB', border: '#FDE68A',
    darkColor: '#FCD34D', darkBg: 'rgba(251,191,36,0.10)', darkBorder: 'rgba(251,191,36,0.25)',
    icon: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 8v4M12 16h.01',
    label: 'Attention',
  },
  info: {
    color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE',
    darkColor: '#93C5FD', darkBg: 'rgba(96,165,250,0.10)', darkBorder: 'rgba(96,165,250,0.25)',
    icon: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 16v-4M12 8h.01',
    label: 'Info',
  },
}

export interface AttentionItem {
  id:        string | number
  severity:  AttentionSeverity
  title:     string
  body?:     string
  entity?:   string   // e.g. "Order #10482"
  timestamp?: string
  action?:   { label: string; onClick: () => void }
}

interface AttentionPanelProps {
  title?:   string
  items:    AttentionItem[]
  loading?: boolean
  /** Maximum items to show before "n more" truncation */
  limit?:   number
  onViewAll?: () => void
  style?:   CSSProperties
  /** Empty state message when items is empty */
  emptyMessage?: string
}

export const AttentionPanel: FC<AttentionPanelProps> = ({
  title = 'Needs Attention',
  items, loading, limit, onViewAll, style, emptyMessage = 'Nothing needs your attention right now.',
}) => {
  const { isDark } = useTheme()
  const shown  = limit ? items.slice(0, limit) : items
  const hidden = limit ? Math.max(0, items.length - limit) : 0

  return (
    <div style={{
      background: 'var(--surface-01)',
      border: '1px solid var(--border-neutral)',
      borderRadius: 12,
      overflow: 'hidden',
      ...style,
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px', borderBottom: '1px solid var(--border-neutral)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'Inter' }}>
            {title}
          </span>
          {!loading && items.length > 0 && (
            <span style={{
              minWidth: 20, height: 20, borderRadius: 10, padding: '0 5px',
              background: items.some(i => i.severity === 'danger') ? '#DC2626' : '#D97706',
              color: '#fff', fontSize: 10.5, fontFamily: 'DM Mono', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {items.length > 99 ? '99+' : items.length}
            </span>
          )}
        </div>
        {onViewAll && (
          <button onClick={onViewAll} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12.5, color: 'var(--brand-primary)', fontWeight: 600, fontFamily: 'Inter', padding: 0 }}>
            View all →
          </button>
        )}
      </div>

      {/* Body */}
      {loading ? (
        <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: 10 }}>
              <div className="skeleton-shimmer" style={{ width: 28, height: 28, borderRadius: 7, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton-shimmer" style={{ height: 12, width: '70%', borderRadius: 5, marginBottom: 6 }} />
                <div className="skeleton-shimmer" style={{ height: 11, width: '50%', borderRadius: 5 }} />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div style={{ padding: '20px 16px', textAlign: 'center' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: '#DCFCE7',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#15803D" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-muted)', fontFamily: 'Inter' }}>{emptyMessage}</p>
        </div>
      ) : (
        <>
          {shown.map((item, idx) => {
            const s = SEV[item.severity]
            const color  = isDark ? s.darkColor  : s.color
            const bg     = isDark ? s.darkBg     : s.bg
            const border = isDark ? s.darkBorder : s.border
            return (
              <div
                key={item.id}
                style={{
                  padding: '12px 16px',
                  borderBottom: idx < shown.length - 1 ? '1px solid var(--border-neutral)' : 'none',
                  display: 'flex', gap: 10, alignItems: 'flex-start',
                }}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                  background: bg, border: `1px solid ${border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color,
                }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={s.icon} />
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'Inter', marginBottom: item.body ? 2 : 0 }}>
                    {item.title}
                  </div>
                  {item.body && (
                    <p style={{ margin: '0 0 4px', fontSize: 12.5, color: 'var(--text-secondary)', fontFamily: 'Inter', lineHeight: '16px' }}>
                      {item.body}
                    </p>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    {item.entity && (
                      <span style={{ fontSize: 11.5, fontFamily: 'DM Mono', color, background: bg, border: `1px solid ${border}`, padding: '1px 6px', borderRadius: 4 }}>
                        {item.entity}
                      </span>
                    )}
                    {item.timestamp && (
                      <span style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--text-muted)' }}>{item.timestamp}</span>
                    )}
                    {item.action && (
                      <button
                        onClick={item.action.onClick}
                        style={{
                          background: 'none', border: `1px solid ${border}`, borderRadius: 5,
                          padding: '2px 9px', cursor: 'pointer', fontSize: 11.5, fontWeight: 600,
                          color, fontFamily: 'Inter', transition: 'background 0.1s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = bg}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                      >
                        {item.action.label}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
          {hidden > 0 && (
            <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border-neutral)', textAlign: 'center' }}>
              <button onClick={onViewAll} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12.5, color: 'var(--brand-primary)', fontWeight: 600, fontFamily: 'Inter' }}>
                {hidden} more item{hidden !== 1 ? 's' : ''} →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default AttentionPanel
