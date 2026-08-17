/**
 * StatCard — metric/KPI tile for dashboards.
 * Displays a label, primary value, optional change indicator, and icon.
 * Does NOT calculate values — renders backend-supplied strings.
 */
import type { FC, CSSProperties, ReactNode } from 'react'
import { useTheme } from '../contexts/ThemeContext'

type StatVariant = 'default' | 'success' | 'warning' | 'danger' | 'info'

const VARIANT_TOKENS: Record<StatVariant, { iconBg: string; iconColor: string; darkIconBg: string; darkIconColor: string }> = {
  default: { iconBg: '#F0F4F2', iconColor: '#2B4D3A', darkIconBg: 'rgba(43,77,58,0.2)', darkIconColor: '#4ADE80' },
  success: { iconBg: '#DCFCE7', iconColor: '#15803D', darkIconBg: 'rgba(34,197,94,0.15)', darkIconColor: '#4ADE80' },
  warning: { iconBg: '#FEF3C7', iconColor: '#B45309', darkIconBg: 'rgba(251,191,36,0.15)', darkIconColor: '#FCD34D' },
  danger:  { iconBg: '#FEE2E2', iconColor: '#B91C1C', darkIconBg: 'rgba(248,113,113,0.15)', darkIconColor: '#FCA5A5' },
  info:    { iconBg: '#DBEAFE', iconColor: '#1D4ED8', darkIconBg: 'rgba(96,165,250,0.15)', darkIconColor: '#93C5FD' },
}

interface StatCardProps {
  label: string
  /** Primary value — opaque backend string, never re-calculated */
  value: string
  /** Supplementary context, e.g. "vs last month" or "ETB 12,400 remaining" */
  sub?: string
  /** Change label, e.g. "+12%" or "−3" */
  change?: string
  changeDir?: 'up' | 'down' | 'neutral'
  /** SVG path d for the icon */
  icon?: string
  variant?: StatVariant
  loading?: boolean
  style?: CSSProperties
  /** Additional content below the value row */
  children?: ReactNode
}

export const StatCard: FC<StatCardProps> = ({
  label, value, sub, change, changeDir = 'neutral',
  icon, variant = 'default', loading, style, children,
}) => {
  const { isDark } = useTheme()
  const vt = VARIANT_TOKENS[variant]

  const changeColor = changeDir === 'up'
    ? (isDark ? '#4ADE80' : '#15803D')
    : changeDir === 'down'
      ? (isDark ? '#FCA5A5' : '#B91C1C')
      : 'var(--text-muted)'

  if (loading) {
    return (
      <div style={{ background: 'var(--surface-01)', border: '1px solid var(--border-neutral)', borderRadius: 12, padding: 20, ...style }}>
        <div className="skeleton-shimmer" style={{ height: 12, width: 90, borderRadius: 6, marginBottom: 14 }} />
        <div className="skeleton-shimmer" style={{ height: 28, width: 140, borderRadius: 6, marginBottom: 8 }} />
        <div className="skeleton-shimmer" style={{ height: 11, width: 80, borderRadius: 5 }} />
      </div>
    )
  }

  return (
    <div style={{
      background: 'var(--surface-01)',
      border: '1px solid var(--border-neutral)',
      borderRadius: 12,
      padding: 20,
      display: 'flex',
      flexDirection: 'column',
      gap: 0,
      ...style,
    }}>
      {/* Header row: label + icon */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{
          fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)',
          fontFamily: 'Inter', textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>
          {label}
        </span>
        {icon && (
          <div style={{
            width: 34, height: 34, borderRadius: 9, flexShrink: 0,
            background: isDark ? vt.darkIconBg : vt.iconBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: isDark ? vt.darkIconColor : vt.iconColor,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d={icon} />
            </svg>
          </div>
        )}
      </div>

      {/* Primary value */}
      <div style={{
        fontSize: 26, fontWeight: 700, color: 'var(--text-primary)',
        fontFamily: 'DM Mono, monospace', letterSpacing: '-0.02em', lineHeight: 1.1,
        marginBottom: 6,
      }}>
        {value}
      </div>

      {/* Sub + change */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {sub && (
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'Inter' }}>{sub}</span>
        )}
        {change && (
          <span style={{
            fontSize: 11.5, fontWeight: 600, color: changeColor,
            fontFamily: 'DM Mono', display: 'inline-flex', alignItems: 'center', gap: 2,
          }}>
            {changeDir === 'up' && '↑'}
            {changeDir === 'down' && '↓'}
            {change}
          </span>
        )}
      </div>

      {children && <div style={{ marginTop: 12 }}>{children}</div>}
    </div>
  )
}

export default StatCard
