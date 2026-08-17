/**
 * Timeline — chronological event list for orders, deliveries, audits, etc.
 * Renders backend-supplied event arrays; does not fabricate or calculate events.
 */
import type { FC, CSSProperties } from 'react'
import { useTheme } from '../contexts/ThemeContext'

type TimelineStatus = 'completed' | 'in-progress' | 'pending' | 'warning' | 'danger' | 'info' | 'neutral'

const STATUS_CONFIG: Record<TimelineStatus, { bg: string; color: string; darkBg: string; darkColor: string }> = {
  completed:   { bg: '#DCFCE7', color: '#15803D', darkBg: 'rgba(34,197,94,0.15)',    darkColor: '#4ADE80' },
  'in-progress': { bg: '#DBEAFE', color: '#1D4ED8', darkBg: 'rgba(96,165,250,0.15)', darkColor: '#93C5FD' },
  pending:     { bg: '#DBEAFE', color: '#1D4ED8', darkBg: 'rgba(96,165,250,0.15)',   darkColor: '#93C5FD' },
  warning:     { bg: '#FEF3C7', color: '#B45309', darkBg: 'rgba(251,191,36,0.15)',   darkColor: '#FCD34D' },
  danger:      { bg: '#FEE2E2', color: '#B91C1C', darkBg: 'rgba(248,113,113,0.15)', darkColor: '#FCA5A5' },
  info:        { bg: '#DBEAFE', color: '#1D4ED8', darkBg: 'rgba(96,165,250,0.15)',   darkColor: '#93C5FD' },
  neutral:     { bg: 'var(--surface-02)', color: 'var(--text-muted)', darkBg: 'var(--surface-02)', darkColor: 'var(--text-muted)' },
}

const STATUS_ICONS: Record<TimelineStatus, string> = {
  completed:     'M20 6L9 17l-5-5',
  'in-progress': 'M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83',
  pending:       'M12 22a10 10 0 110-20 10 10 0 010 20zM12 6v6l4 2',
  warning:       'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01',
  danger:        'M18 6L6 18M6 6l12 12',
  info:          'M12 22a10 10 0 110-20 10 10 0 010 20zM12 16v-4M12 8h.01',
  neutral:       'M12 22a10 10 0 110-20 10 10 0 010 20z',
}

export interface TimelineItem {
  id:        string | number
  status:    TimelineStatus
  title:     string
  actor?:    string
  timestamp: string
  description?: string
  quantity?:  string
  note?:      string
  /** highlight this item as a discrepancy/exception */
  flagged?:   boolean
}

interface TimelineProps {
  items:   TimelineItem[]
  loading?: boolean
  style?:  CSSProperties
}

export const Timeline: FC<TimelineProps> = ({ items, loading, style }) => {
  const { isDark } = useTheme()

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, ...style }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, paddingBottom: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              <div className="skeleton-shimmer" style={{ width: 28, height: 28, borderRadius: '50%' }} />
              {i < 3 && <div className="skeleton-shimmer" style={{ width: 2, flex: 1, marginTop: 6, borderRadius: 1 }} />}
            </div>
            <div style={{ flex: 1, paddingTop: 4, paddingBottom: 16 }}>
              <div className="skeleton-shimmer" style={{ height: 12, width: '60%', borderRadius: 5, marginBottom: 8 }} />
              <div className="skeleton-shimmer" style={{ height: 11, width: '40%', borderRadius: 5 }} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)', fontSize: 13, fontFamily: 'Inter' }}>
        No history recorded yet.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', ...style }}>
      {items.map((item, idx) => {
        const sc = STATUS_CONFIG[item.status]
        const iconPath = STATUS_ICONS[item.status]
        const dotBg    = isDark ? sc.darkBg    : sc.bg
        const dotColor = isDark ? sc.darkColor : sc.color
        const isLast   = idx === items.length - 1

        return (
          <div key={item.id} style={{ display: 'flex', gap: 12 }}>
            {/* Left: icon + connector line */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                background: dotBg, color: dotColor,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `2px solid ${isDark ? sc.darkBg : sc.bg}`,
                outline: item.flagged ? `2px solid ${isDark ? '#FCA5A5' : '#DC2626'}` : undefined,
                outlineOffset: 1,
                zIndex: 1,
              }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={iconPath} />
                </svg>
              </div>
              {!isLast && (
                <div style={{ width: 2, flex: 1, background: 'var(--border-neutral)', minHeight: 12, margin: '3px 0' }} />
              )}
            </div>

            {/* Right: content */}
            <div style={{ flex: 1, paddingBottom: isLast ? 0 : 20, paddingTop: 3 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '2px 8px', marginBottom: 3 }}>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'Inter' }}>
                  {item.title}
                </span>
                {item.quantity && (
                  <span style={{ fontSize: 11.5, fontFamily: 'DM Mono', color: 'var(--text-muted)', background: 'var(--surface-02)', padding: '1px 6px', borderRadius: 4, border: '1px solid var(--border-neutral)' }}>
                    {item.quantity}
                  </span>
                )}
                {item.flagged && (
                  <span style={{ fontSize: 11, fontWeight: 600, color: isDark ? '#FCA5A5' : '#DC2626', background: isDark ? 'rgba(248,113,113,0.12)' : '#FEE2E2', padding: '1px 6px', borderRadius: 4, border: `1px solid ${isDark ? 'rgba(248,113,113,0.3)' : '#FECACA'}` }}>
                    Exception
                  </span>
                )}
              </div>

              {item.description && (
                <p style={{ margin: '0 0 3px', fontSize: 12.5, color: 'var(--text-secondary)', fontFamily: 'Inter', lineHeight: '17px' }}>
                  {item.description}
                </p>
              )}

              {item.note && (
                <p style={{ margin: '0 0 3px', fontSize: 12, color: 'var(--text-muted)', fontFamily: 'Inter', fontStyle: 'italic', lineHeight: '16px' }}>
                  {item.note}
                </p>
              )}

              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 2 }}>
                {item.actor && (
                  <span style={{ fontSize: 11.5, color: 'var(--text-secondary)', fontFamily: 'Inter' }}>{item.actor}</span>
                )}
                {item.actor && <span style={{ fontSize: 10, color: 'var(--border-neutral)' }}>·</span>}
                <span style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--text-muted)' }}>{item.timestamp}</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default Timeline
