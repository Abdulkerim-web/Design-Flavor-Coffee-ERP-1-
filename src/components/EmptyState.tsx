import type { FC, ReactNode } from 'react'

interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  action?: ReactNode
  compact?: boolean
}

const EmptyIllustration: FC<{ d: string }> = ({ d }) => (
  <svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

const ICON_PATHS: Record<string, string> = {
  inbox:    'M22 12h-6l-2 3h-4l-2-3H2M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z',
  search:   'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  document: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8',
  box:      'M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16zM3.27 6.96L12 12.01l8.73-5.05M12 22.08V12',
  truck:    'M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM5.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM18.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5z',
  users:    'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
  clipboard:'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  chart:    'M18 20V10M12 20V4M6 20v-6',
  lock:     'M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zM7 11V7a5 5 0 0110 0v4',
}

const EmptyState: FC<EmptyStateProps> = ({
  icon = 'inbox',
  title,
  description,
  action,
  compact = false,
}) => {
  const iconPath = ICON_PATHS[icon] ?? ICON_PATHS.inbox

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: compact ? 8 : 12,
      padding: compact ? '32px 24px' : '64px 24px',
      textAlign: 'center',
    }}>
      <div style={{
        width: compact ? 48 : 64,
        height: compact ? 48 : 64,
        borderRadius: compact ? 12 : 16,
        background: 'var(--surface-02)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)',
        marginBottom: 4,
      }}>
        <EmptyIllustration d={iconPath} />
      </div>

      <div style={{
        fontSize: compact ? 13.5 : 15,
        fontWeight: 500,
        color: 'var(--text-primary)',
        fontFamily: 'Inter',
      }}>
        {title}
      </div>

      {description && (
        <div style={{
          fontSize: compact ? 12 : 13,
          color: 'var(--text-secondary)',
          fontFamily: 'Inter',
          lineHeight: '1.5',
          maxWidth: 280,
        }}>
          {description}
        </div>
      )}

      {action && (
        <div style={{ marginTop: 4 }}>
          {action}
        </div>
      )}
    </div>
  )
}

export default EmptyState
