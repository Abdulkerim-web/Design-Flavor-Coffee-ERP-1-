/**
 * FormSection — titled section wrapper for multi-section forms.
 * Divides long forms into logical groups without heavy nesting.
 */
import type { FC, ReactNode, CSSProperties } from 'react'
import { useBreakpoint } from '../hooks/useBreakpoint'

interface FormSectionProps {
  title:        string
  description?: string
  children:     ReactNode
  /** 2-column grid on desktop for short field groups */
  twoCol?:      boolean
  /** Visual separation: divider above section (default true after first section) */
  divider?:     boolean
  style?:       CSSProperties
}

export const FormSection: FC<FormSectionProps> = ({
  title, description, children, twoCol, divider = true, style,
}) => {
  const { isMobile } = useBreakpoint()
  return (
    <div style={{
      paddingTop: divider ? 24 : 0,
      marginTop:  divider ? 24 : 0,
      borderTop:  divider ? '1px solid var(--border-neutral)' : 'none',
      ...style,
    }}>
      {/* Section heading */}
      <div style={{ marginBottom: 16 }}>
        <h3 style={{
          margin: 0, fontSize: 14, fontWeight: 700,
          color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.01em',
        }}>
          {title}
        </h3>
        {description && (
          <p style={{ margin: '3px 0 0', fontSize: 12.5, color: 'var(--text-muted)', fontFamily: 'Inter', lineHeight: '17px' }}>
            {description}
          </p>
        )}
      </div>

      {/* Fields */}
      <div style={
        twoCol && !isMobile
          ? { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px' }
          : { display: 'flex', flexDirection: 'column', gap: 14 }
      }>
        {children}
      </div>
    </div>
  )
}

/**
 * ActionBar — sticky form/page action footer.
 * Always keeps primary action visible without obscuring content.
 */
interface ActionBarProps {
  children:  ReactNode
  sticky?:   boolean
  style?:    CSSProperties
  /** Pad bottom when mobile bottom-nav is present */
  mobileOffset?: boolean
}

export const ActionBar: FC<ActionBarProps> = ({ children, sticky, style, mobileOffset }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    padding: '14px 24px',
    borderTop: '1px solid var(--border-neutral)',
    background: 'var(--surface-01)',
    flexShrink: 0,
    flexWrap: 'wrap',
    ...(sticky ? { position: 'sticky', bottom: mobileOffset ? 64 : 0, zIndex: 10 } : {}),
    ...style,
  }}>
    {children}
  </div>
)

/**
 * MobileActionBar — bottom action strip for operational mobile screens.
 * Sits above the BottomNav when present.
 */
interface MobileActionBarProps {
  children:  ReactNode
  /** Float above page content */
  floating?: boolean
  style?:    CSSProperties
}

export const MobileActionBar: FC<MobileActionBarProps> = ({ children, floating, style }) => (
  <div style={{
    display: 'flex',
    gap: 10,
    padding: '12px 16px',
    background: 'var(--surface-01)',
    borderTop: '1px solid var(--border-neutral)',
    ...(floating ? {
      position: 'fixed', bottom: 64, left: 0, right: 0, zIndex: 100,
      boxShadow: '0 -4px 16px rgba(0,0,0,0.08)',
    } : {}),
    ...style,
  }}>
    {children}
  </div>
)

/**
 * StatGrid — responsive metric card grid wrapper.
 */
interface StatGridProps {
  children:  ReactNode
  cols?:     2 | 3 | 4
  style?:    CSSProperties
}

export const StatGrid: FC<StatGridProps> = ({ children, cols = 4, style }) => (
  <div style={{
    display: 'grid',
    gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
    gap: 16,
    ...style,
  }}>
    {children}
  </div>
)

export default FormSection
