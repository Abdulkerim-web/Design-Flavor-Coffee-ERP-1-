/* Responsive: mobile ≤640 | tablet 641–1024 | laptop 1025–1440 | desktop >1440 */
import { useState, type FC, type CSSProperties } from 'react'
import { canRead, type RoleId, ROLES } from '../lib/rbac'
import { useBreakpoint } from '../hooks/useBreakpoint'
import { useTheme } from '../contexts/ThemeContext'
import type { AuthUser } from '../contexts/AuthContext'

/* ── Brand Mark ─────────────────────────────────────────────── */
/* Abstract bean-geometry mark. Two overlapping ellipses on a transparent base,
   representing the coffee bean cross-section. Works at 16–64 px. */
const BrandMark: FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    {/* Left bean half */}
    <path d="M12 3 C8.5 3 6 7 6 12 C6 17 8.5 21 12 21" stroke="rgba(255,255,255,0.9)" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
    {/* Right bean half */}
    <path d="M12 3 C15.5 3 18 7 18 12 C18 17 15.5 21 12 21" stroke="rgba(255,255,255,0.9)" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
    {/* Center spine — the groove of a coffee bean */}
    <line x1="12" y1="3" x2="12" y2="21" stroke="rgba(255,255,255,0.35)" strokeWidth="0.9" strokeLinecap="round"/>
  </svg>
)

/* ── Icons ─────────────────────────────────────────────────── */
const Icon: FC<{ d: string; size?: number }> = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)
const icons = {
  dashboard:     'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
  inventory:     'M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z',
  quality:       'M14 2v6l3 5c1.5 2.6-.3 5-2.7 5H9.7C7.3 18 5.5 15.6 7 13l3-5V2M6 2h12',
  production:    'M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 3z',
  finished:      'M21 8 21 21 3 21 3 8M1 3h22v5H1zM10 12h4',
  verification:  'M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11',
  orders:        'M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0',
  packaging:     'M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16zM3.27 6.96L12 12.01l8.73-5.05M12 22.08V12',
  delivery:      'M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM5.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM18.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5z',
  suppliers:     'M6 22V4a2 2 0 012-2h8a2 2 0 012 2v18zM6 12H4a2 2 0 00-2 2v6a2 2 0 002 2h2M18 9h2a2 2 0 012 2v9a2 2 0 01-2 2h-2M10 6h4M10 10h4M10 14h4M10 18h4',
  finance:       'M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6',
  reports:       'M18 20V10M12 20V4M6 20v-6',
  audit:         'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8',
  users:         'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
  settings:      'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z',
  customers:     'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
  payments:      'M1 4h22v16H1zM1 10h22',
  banking:       'M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 10v11M12 10v11M16 10v11',
  expenses:      'M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16zM12 2v20M2 12h20',
  payroll:       'M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 3H8L6 7h12l-2-4zM12 14a2 2 0 100-4 2 2 0 000 4z',
  approvals:     'M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11',
  notifications: 'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0',
  chevronDown:   'M6 9l6 6 6-6',
  chevronRight:  'M9 18l6-6-6-6',
  lock:          'M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zM7 11V7a5 5 0 0110 0v4',
  collapse:      'M11 19l-7-7 7-7M21 5l-7 7 7 7',
  expand:        'M13 5l7 7-7 7M3 19l7-7-7-7',
}

/* ── Nav badges — amber = action required, red = urgent ───────── */
const NAV_BADGES: Record<string, { count: number; urgency: 'amber' | 'red' }> = {
  orders:        { count: 5, urgency: 'amber' },
  approvals:     { count: 3, urgency: 'amber' },
  notifications: { count: 2, urgency: 'red'   },
  finance:       { count: 2, urgency: 'amber' },
  delivery:      { count: 3, urgency: 'amber' },
}

const BADGE_COLORS = {
  amber: { bg: '#FEF3C7', color: '#B45309', border: '#FDE68A', darkBg: 'rgba(251,191,36,0.15)', darkColor: '#FCD34D', darkBorder: 'rgba(251,191,36,0.3)' },
  red:   { bg: '#FEE2E2', color: '#B91C1C', border: '#FECACA', darkBg: 'rgba(248,113,113,0.15)', darkColor: '#FCA5A5', darkBorder: 'rgba(248,113,113,0.3)' },
}

const NAV = [
  {
    group: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: icons.dashboard },
    ],
  },
  {
    group: 'Sales',
    items: [
      { id: 'customers', label: 'My Customers', icon: icons.customers },
      { id: 'orders',    label: 'Orders',        icon: icons.orders },
    ],
  },
  {
    group: 'Operations',
    items: [
      { id: 'production', label: 'Roasting',    icon: icons.production },
      { id: 'inventory',  label: 'Inventory',   icon: icons.inventory },
      { id: 'packaging',  label: 'Packing',     icon: icons.packaging },
      { id: 'delivery',   label: 'Deliveries',  icon: icons.delivery },
    ],
  },
  {
    group: 'Finance',
    items: [
      { id: 'finance',  label: 'Finance',  icon: icons.finance },
      { id: 'payments', label: 'Payments', icon: icons.payments },
      { id: 'banking',  label: 'Banking',  icon: icons.banking },
      { id: 'expenses', label: 'Expenses', icon: icons.expenses },
      { id: 'payroll',  label: 'Payroll',  icon: icons.payroll },
    ],
  },
  {
    group: 'Management',
    items: [
      { id: 'reports',       label: 'Reports',       icon: icons.reports },
      { id: 'notifications', label: 'Notifications', icon: icons.notifications },
      { id: 'approvals',     label: 'Approvals',     icon: icons.approvals },
    ],
  },
  {
    group: 'System',
    items: [
      { id: 'settings',       label: 'Settings',      icon: icons.settings },
      { id: 'design-system',  label: 'Design System', icon: 'M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zM7 12a5 5 0 0010 0M7 12a5 5 0 0110 0M12 7v10' },
    ],
  },
]

interface SidebarProps {
  active: string
  onNavigate: (id: string) => void
  collapsed: boolean
  onToggleCollapse: () => void
  onOpenSearch: () => void
  isMobile?: boolean
  isOpen?: boolean
  onClose?: () => void
  currentRole?: RoleId
  currentUser?: AuthUser | null
  onLogout?: () => void
}

export default function Sidebar({ active, onNavigate, collapsed, onToggleCollapse, onOpenSearch, isMobile, isOpen, onClose, currentRole, currentUser, onLogout }: SidebarProps) {
  const { isTablet } = useBreakpoint()
  const { isDark } = useTheme()
  const [companyOpen, setCompanyOpen] = useState(false)
  // Auto-collapse on tablet (icon rail only)
  const effectiveCollapsed = isTablet ? true : collapsed
  const W = isMobile ? 280 : (effectiveCollapsed ? 64 : 240)

  const asideStyle: CSSProperties = isMobile ? {
    width: 280, minWidth: 280,
    height: '100vh',
    background: 'var(--surface-01)',
    borderRight: '1px solid var(--border-neutral)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    position: 'fixed',
    top: 0, bottom: 0,
    left: isOpen ? 0 : -280,
    zIndex: 200,
    transition: 'left 250ms cubic-bezier(0.16,1,0.3,1)',
    flexShrink: 0,
  } : {
    width: W, minWidth: W,
    height: '100vh',
    background: 'var(--surface-01)',
    borderRight: '1px solid var(--border-neutral)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    transition: 'width 220ms cubic-bezier(0.16,1,0.3,1), min-width 220ms cubic-bezier(0.16,1,0.3,1)',
    position: 'relative',
    flexShrink: 0,
  }

  return (
    <>
    {isMobile && isOpen && (
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 199,
          background: 'rgba(0,0,0,0.4)',
          animation: 'fadeInOverlay 0.2s ease',
        }}
      />
    )}
    <aside style={asideStyle}>

      {/* ── Company Selector ────────────────────────────── */}
      <div style={{
        padding: effectiveCollapsed ? '14px 0' : '14px 12px',
        borderBottom: '1px solid var(--border-neutral)',
        display: 'flex',
        alignItems: effectiveCollapsed ? 'center' : undefined,
        justifyContent: effectiveCollapsed ? 'center' : undefined,
      }}>
        {effectiveCollapsed ? (
          <div style={{
            width: 34, height: 34,
            background: 'linear-gradient(135deg, #2B4D3A 0%, #3D6B54 100%)',
            borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(43,77,58,0.2)', cursor: 'pointer',
          }} onClick={() => setCompanyOpen(!companyOpen)}>
            <BrandMark size={18} />
          </div>
        ) : (
          <button onClick={() => setCompanyOpen(!companyOpen)} style={{
            display: 'flex', alignItems: 'center', gap: 10, width: '100%',
            padding: '8px 10px', borderRadius: 8, border: 'none',
            background: companyOpen ? 'var(--surface-02)' : 'transparent',
            cursor: 'pointer', textAlign: 'left',
            transition: 'background 0.15s ease',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-02)'}
          onMouseLeave={e => e.currentTarget.style.background = companyOpen ? 'var(--surface-02)' : 'transparent'}
          >
            <div style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              background: 'linear-gradient(135deg, #2B4D3A 0%, #3D6B54 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(43,77,58,0.2)',
            }}>
              <BrandMark size={16} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', lineHeight: '17px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Flavor Coffee Roasters
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--text-muted)', lineHeight: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Addis Ababa Processing Plant
              </div>
            </div>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" style={{ flexShrink: 0, transform: companyOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
        )}

        {/* Company dropdown */}
        {companyOpen && !effectiveCollapsed && (
          <div style={{
            position: 'absolute', top: 68, left: 12, right: 12, zIndex: 50,
            background: 'var(--surface-01)', border: '1px solid var(--border-neutral)', borderRadius: 10,
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.08)', overflow: 'hidden',
          }}>
            {['Addis Ababa Plant', 'Dire Dawa Facility', 'Export Warehouse'].map((loc, i) => (
              <button key={loc} onClick={() => setCompanyOpen(false)} style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                padding: '10px 14px', border: 'none', background: 'transparent',
                cursor: 'pointer', textAlign: 'left',
                borderBottom: i < 2 ? '1px solid #E5E3DC' : 'none',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#F5F3EF'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: i === 0 ? '#16A34A' : '#E5E3DC', flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{loc}</span>
                {i === 0 && <span style={{ marginLeft: 'auto', fontSize: 10.5, fontFamily: 'DM Mono', color: '#16A34A', background: '#DCFCE7', padding: '1px 6px', borderRadius: 999 }}>active</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── ⌘K Search trigger ───────────────────────────── */}
      <div style={{ padding: effectiveCollapsed ? '10px 0' : '10px 12px', borderBottom: '1px solid var(--border-neutral)', display: 'flex', justifyContent: effectiveCollapsed ? 'center' : undefined }}>
        {effectiveCollapsed ? (
          <button onClick={onOpenSearch} style={{
            width: 36, height: 36, borderRadius: 8, border: '1px solid var(--border-neutral)',
            background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-muted)', transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#F5F3EF'; e.currentTarget.style.color = '#2B4D3A'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#FAFAF8'; e.currentTarget.style.color = '#9CA3AF'; }}
          title="Search (⌘K)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </button>
        ) : (
          <button onClick={onOpenSearch} style={{
            display: 'flex', alignItems: 'center', gap: 8, width: '100%',
            padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border-neutral)',
            background: 'var(--bg-primary)', cursor: 'pointer', textAlign: 'left',
            transition: 'all 0.15s ease', boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#F5F3EF'; e.currentTarget.style.borderColor = '#D0CEC6'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#FAFAF8'; e.currentTarget.style.borderColor = '#E5E3DC'; }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <span style={{ flex: 1, fontSize: 12.5, color: 'var(--text-muted)' }}>Search or jump to…</span>
            <span style={{ fontSize: 10.5, fontFamily: 'DM Mono', color: '#C4C2BA', background: 'var(--surface-hover)', padding: '1px 6px', borderRadius: 4, border: '1px solid var(--border-neutral)' }}>⌘K</span>
          </button>
        )}
      </div>

      {/* ── Navigation ───────────────────────────────────── */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: effectiveCollapsed ? '8px 0' : '8px 8px' }}>
        {NAV.filter(group =>
          group.items.some(item => !currentRole || canRead(currentRole, item.id))
        ).map(group => (
          <div key={group.group} style={{ marginBottom: effectiveCollapsed ? 8 : 16 }}>
            {!effectiveCollapsed && (
              <div style={{
                fontSize: 10, fontWeight: 600, letterSpacing: '0.1em',
                textTransform: 'uppercase', color: '#C4C2BA',
                padding: '0 10px', marginBottom: 3, fontFamily: 'DM Mono',
              }}>{group.group}</div>
            )}
            {group.items.filter(item => !currentRole || canRead(currentRole, item.id)).map(item => {
              const isActive = active === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  title={effectiveCollapsed ? item.label : undefined}
                  style={{
                    display: 'flex', alignItems: 'center',
                    gap: effectiveCollapsed ? 0 : 8,
                    justifyContent: effectiveCollapsed ? 'center' : undefined,
                    width: effectiveCollapsed ? 64 : '100%',
                    paddingTop: effectiveCollapsed ? 9 : (isMobile ? 11 : 7),
                    paddingBottom: effectiveCollapsed ? 9 : (isMobile ? 11 : 7),
                    paddingLeft: effectiveCollapsed ? 0 : 7,
                    paddingRight: effectiveCollapsed ? 0 : 10,
                    minHeight: isMobile ? 44 : undefined,
                    borderRadius: effectiveCollapsed ? 0 : 7,
                    border: 'none',
                    borderLeft: isActive && !effectiveCollapsed ? '3px solid #2B4D3A' : effectiveCollapsed ? 'none' : '3px solid transparent',
                    background: isActive ? (effectiveCollapsed ? 'rgba(43,77,58,0.06)' : '#F5F3EF') : 'transparent',
                    color: isActive ? '#2B4D3A' : '#6B7280',
                    fontWeight: isActive ? 600 : 400,
                    fontSize: 13.5,
                    cursor: 'pointer',
                    fontFamily: 'Inter',
                    transition: 'all 0.12s ease',
                    textAlign: 'left',
                    position: 'relative',
                  }}
                  onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = '#F5F3EF'; e.currentTarget.style.color = '#1F2937'; }}}
                  onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6B7280'; }}}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    {item.icon.split('M').filter(Boolean).map((seg, i) => (
                      <path key={i} d={`M${seg}`} />
                    ))}
                  </svg>
                  {!effectiveCollapsed && <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>}

                  {/* Nav badge */}
                  {NAV_BADGES[item.id] && (() => {
                    const badge = NAV_BADGES[item.id]
                    const bc = BADGE_COLORS[badge.urgency]
                    return (
                      <div style={{
                        minWidth: 17, height: 17, borderRadius: 999,
                        background: isDark ? bc.darkBg : bc.bg,
                        color: isDark ? bc.darkColor : bc.color,
                        border: `1px solid ${isDark ? bc.darkBorder : bc.border}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 9.5, fontFamily: 'DM Mono', fontWeight: 700,
                        lineHeight: 1, padding: '0 3px', flexShrink: 0,
                      }}>
                        {badge.count}
                      </div>
                    )
                  })()}

                  {/* Tooltip for effectiveCollapsed mode */}
                  {effectiveCollapsed && (
                    <div style={{
                      position: 'absolute', left: '100%', top: '50%', transform: 'translateY(-50%)',
                      background: '#1F2937', color: '#FFFFFF', fontSize: 12, fontWeight: 500,
                      padding: '5px 10px', borderRadius: 6, marginLeft: 8, whiteSpace: 'nowrap',
                      pointerEvents: 'none', opacity: 0, transition: 'opacity 0.15s',
                      zIndex: 100, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    }} className="nav-tooltip">
                      {item.label}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </nav>

      {/* ── User Footer ──────────────────────────────────── */}
      <div style={{ padding: effectiveCollapsed ? '10px 0' : '10px 8px 12px', borderTop: '1px solid var(--border-neutral)' }}>
        {effectiveCollapsed ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <button
              onClick={onLogout}
              title={currentUser ? `${currentUser.name} · Sign out` : 'Sign out'}
              style={{
                width: 32, height: 32, borderRadius: '50%',
                background: currentUser
                  ? `linear-gradient(135deg, ${currentUser.avatarColor}CC, ${currentUser.avatarColor})`
                  : 'linear-gradient(135deg, #2B4D3A, #4A7C5A)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: 'white', cursor: 'pointer',
                border: '2px solid var(--border-neutral)',
                outline: 'none',
              }}
            >{currentUser?.avatar ?? 'AG'}</button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 10px', borderRadius: 8, cursor: 'default' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              background: currentUser
                ? `linear-gradient(135deg, ${currentUser.avatarColor}CC, ${currentUser.avatarColor})`
                : 'linear-gradient(135deg, #2B4D3A, #4A7C5A)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: 'white',
              border: '2px solid var(--border-neutral)',
            }}>{currentUser?.avatar ?? 'AG'}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentUser?.name ?? 'Unknown'}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentUser ? (ROLES[currentUser.role]?.label ?? currentUser.role) : ''}
              </div>
            </div>
            <button
              onClick={onLogout}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, borderRadius: 6, transition: 'all 0.15s', flexShrink: 0 }}
              onMouseEnter={e => { e.currentTarget.style.background = '#EEEDE8'; e.currentTarget.style.color = '#DC2626'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#9CA3AF'; }}
              title="Sign out"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* ── Collapse Toggle (desktop only) ───────────────────────────────── */}
      {!isMobile && (
        <button
          onClick={onToggleCollapse}
          style={{
            position: 'absolute', top: '50%', right: -12, transform: 'translateY(-50%)',
            width: 24, height: 24, borderRadius: '50%',
            background: 'var(--surface-01)', border: '1px solid var(--border-neutral)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-secondary)', zIndex: 10,
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#2B4D3A'; e.currentTarget.style.color = '#FFFFFF'; e.currentTarget.style.borderColor = '#2B4D3A'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.color = '#6B7280'; e.currentTarget.style.borderColor = '#E5E3DC'; }}
          title={effectiveCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            {effectiveCollapsed
              ? <><path d="M13 5l7 7-7 7"/><path d="M5 5l7 7-7 7"/></>
              : <><path d="M11 5l-7 7 7 7"/><path d="M19 5l-7 7 7 7"/></>
            }
          </svg>
        </button>
      )}
    </aside>
    </>
  )
}
