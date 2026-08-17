/**
 * Tabs — accessible tabbed navigation.
 * Controlled: caller owns active state.
 */
import type { FC, ReactNode, CSSProperties } from 'react'

export interface TabItem {
  id:       string
  label:    string
  badge?:   number | string
  disabled?: boolean
}

type TabsVariant = 'underline' | 'pill'

interface TabsProps {
  tabs:      TabItem[]
  active:    string
  onChange:  (id: string) => void
  variant?:  TabsVariant
  style?:    CSSProperties
}

export const Tabs: FC<TabsProps> = ({ tabs, active, onChange, variant = 'underline', style }) => (
  <div
    role="tablist"
    aria-label="section tabs"
    style={{
      display: 'flex',
      gap: variant === 'pill' ? 4 : 0,
      borderBottom: variant === 'underline' ? '1px solid var(--border-neutral)' : 'none',
      background: variant === 'pill' ? 'var(--surface-02)' : 'transparent',
      borderRadius: variant === 'pill' ? 10 : 0,
      padding: variant === 'pill' ? 4 : 0,
      overflowX: 'auto',
      flexShrink: 0,
      ...style,
    }}
  >
    {tabs.map(tab => {
      const isActive = tab.id === active
      return (
        <button
          key={tab.id}
          role="tab"
          aria-selected={isActive}
          disabled={tab.disabled}
          onClick={() => !tab.disabled && onChange(tab.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: variant === 'pill' ? '6px 14px' : '10px 14px',
            border: 'none',
            borderRadius: variant === 'pill' ? 7 : 0,
            borderBottom: variant === 'underline' ? `2px solid ${isActive ? '#2B4D3A' : 'transparent'}` : 'none',
            background: variant === 'pill' ? (isActive ? 'var(--surface-01)' : 'transparent') : 'transparent',
            color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
            fontWeight: isActive ? 600 : 400,
            fontSize: 13.5,
            fontFamily: 'Inter, sans-serif',
            cursor: tab.disabled ? 'not-allowed' : 'pointer',
            opacity: tab.disabled ? 0.45 : 1,
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap',
            marginBottom: variant === 'underline' ? -1 : 0,
            boxShadow: variant === 'pill' && isActive ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            outline: 'none',
          }}
          onFocus={e => { if (!tab.disabled) e.currentTarget.style.boxShadow = '0 0 0 3px rgba(43,77,58,0.15)' }}
          onBlur={e =>  { e.currentTarget.style.boxShadow = variant === 'pill' && isActive ? '0 1px 3px rgba(0,0,0,0.08)' : 'none' }}
        >
          {tab.label}
          {tab.badge !== undefined && (
            <span style={{
              minWidth: 18, height: 18, borderRadius: 9, padding: '0 4px',
              background: isActive ? '#2B4D3A' : 'var(--surface-hover)',
              color: isActive ? '#fff' : 'var(--text-muted)',
              fontSize: 10.5, fontFamily: 'DM Mono, monospace', fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
            }}>
              {tab.badge}
            </span>
          )}
        </button>
      )
    })}
  </div>
)

/** TabPanel — renders content for the active tab */
interface TabPanelProps {
  id:       string
  active:   string
  children: ReactNode
  style?:   CSSProperties
}

export const TabPanel: FC<TabPanelProps> = ({ id, active, children, style }) => {
  if (id !== active) return null
  return (
    <div role="tabpanel" aria-labelledby={id} style={style}>
      {children}
    </div>
  )
}

export default Tabs
