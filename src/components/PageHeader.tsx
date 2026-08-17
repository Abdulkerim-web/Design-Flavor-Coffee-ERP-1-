/**
 * Reusable page header — title + description + primary action + secondary actions.
 * Every major page uses this for consistent information hierarchy.
 * Section 7 of the App Shell spec.
 */
import type { FC, ReactNode } from 'react'
import { useBreakpoint } from '../hooks/useBreakpoint'

interface PageAction {
  label: string
  onClick: () => void
  icon?: string         // SVG path d attribute
  variant?: 'primary' | 'secondary' | 'ghost'
  disabled?: boolean
}

interface PageHeaderProps {
  title: string
  description?: string
  actions?: PageAction[]
  /** Optional content left of actions (e.g. tab group, filter pills) */
  toolbar?: ReactNode
  /** Optional status badge or context chip next to title */
  badge?: ReactNode
}

const ActionButton: FC<PageAction> = ({ label, onClick, icon, variant = 'secondary', disabled }) => {
  const cls = variant === 'primary' ? 'btn-primary' : variant === 'ghost' ? 'btn-ghost' : 'btn-secondary'
  return (
    <button className={cls} onClick={onClick} disabled={disabled} style={{ height: 34, fontSize: 13, gap: 6, padding: '0 14px', opacity: disabled ? 0.5 : 1 }}>
      {icon && (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <path d={icon} />
        </svg>
      )}
      {label}
    </button>
  )
}

export const PageHeader: FC<PageHeaderProps> = ({ title, description, actions = [], toolbar, badge }) => {
  const { isMobile } = useBreakpoint()

  return (
    <div style={{
      padding: isMobile ? '16px 16px 12px' : '24px 32px 20px',
      borderBottom: '1px solid var(--border-neutral)',
      background: 'var(--surface-01)',
      flexShrink: 0,
    }}>
      {/* Title row */}
      <div style={{
        display: 'flex',
        alignItems: isMobile ? 'flex-start' : 'center',
        justifyContent: 'space-between',
        gap: 12,
        flexDirection: isMobile && actions.length > 0 ? 'column' : 'row',
      }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1 style={{
              margin: 0,
              fontSize: isMobile ? 18 : 20,
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.015em',
              lineHeight: '26px',
              fontFamily: 'Inter, sans-serif',
            }}>
              {title}
            </h1>
            {badge}
          </div>
          {description && (
            <p style={{
              margin: '3px 0 0',
              fontSize: 13,
              color: 'var(--text-secondary)',
              lineHeight: '18px',
              fontFamily: 'Inter, sans-serif',
            }}>
              {description}
            </p>
          )}
        </div>

        {/* Actions */}
        {actions.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
            {actions.map((action, i) => (
              <ActionButton key={i} {...action} />
            ))}
          </div>
        )}
      </div>

      {/* Toolbar row (tabs, filters, etc.) */}
      {toolbar && (
        <div style={{ marginTop: 14 }}>
          {toolbar}
        </div>
      )}
    </div>
  )
}

export default PageHeader
