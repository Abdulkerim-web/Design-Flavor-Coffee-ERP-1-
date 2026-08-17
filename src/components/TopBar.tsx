/* Responsive: mobile ≤640 | tablet 641–1024 | laptop 1025–1440 | desktop >1440 */
import { useState, useEffect, useRef } from 'react'
import { useBreakpoint } from '../hooks/useBreakpoint'
import { useTheme, type ThemeMode } from '../contexts/ThemeContext'
import type { AuthUser } from '../contexts/AuthContext'
import { ROLES } from '../lib/rbac'

/* ── Notifications data ──────────────────────────────────────── */
type NotifCategory = 'urgent' | 'approval' | 'warning' | 'info'

interface Notification {
  id: number
  category: NotifCategory
  title: string
  what: string
  why: string
  action?: string
  time: string
  module: string
  read: boolean
}

const NOTIFICATIONS: Notification[] = [
  {
    id: 1, category: 'approval', read: false,
    title: 'Order Awaiting Approval',
    what: 'Order #ORD-1042 — Guji Medium, 50 KG, Harar Coffee Exporters',
    why: 'Stock feasibility check shows a potential shortfall of 10.6 KG. Manager confirmation required before roasting can begin.',
    action: 'Review Order',
    time: '12 min ago', module: 'Orders',
  },
  {
    id: 2, category: 'urgent', read: false,
    title: 'Stock Shortage — Yirgacheffe Grade 1',
    what: 'Current stock: 120 KG. Reorder threshold: 200 KG.',
    why: 'Two active orders totalling 180 KG may not be fulfilled without immediate restocking.',
    action: 'Review Stock',
    time: '1h ago', module: 'Inventory',
  },
  {
    id: 3, category: 'urgent', read: false,
    title: 'QC Rejection — Lot #GR-0291',
    what: 'Moisture content 14.6% exceeded the 13% maximum threshold.',
    why: 'Lot quarantined. 500 KG of Sidama Grade 1 cannot proceed to roasting until reviewed.',
    action: 'Open QC Report',
    time: '2h ago', module: 'Quality',
  },
  {
    id: 4, category: 'warning', read: true,
    title: 'Invoice Overdue — Ethiopian Airlines Catering',
    what: 'INV-2024-0819 — ETB 156,000.00 — 3 days past due date.',
    why: 'Payment has not been received. Customer contact may be required to avoid dispute.',
    action: 'View Invoice',
    time: '1d ago', module: 'Finance',
  },
  {
    id: 5, category: 'info', read: true,
    title: 'Delivery Completed — Order #ORD-1038',
    what: '25 KG Limu Espresso delivered to Hilton Addis Ababa — Main Kitchen.',
    why: 'Customer signature received. Awaiting payment confirmation within 3 business days.',
    time: '2d ago', module: 'Delivery',
  },
]

const CATEGORY_CONFIG: Record<NotifCategory, { label: string; color: string; bg: string; border: string; icon: string }> = {
  urgent:   { label: 'Urgent',       color: '#B91C1C', bg: '#FEF2F2', border: '#FECACA', icon: 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01' },
  approval: { label: 'Needs Approval', color: '#B45309', bg: '#FFFBEB', border: '#FDE68A', icon: 'M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11' },
  warning:  { label: 'Warning',      color: '#92400E', bg: '#FFF7ED', border: '#FED7AA', icon: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 8v4M12 16h.01' },
  info:     { label: 'Information',  color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE', icon: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 16v-4M12 8h.01' },
}

const BREADCRUMB_MAP: Record<string, string[]> = {
  dashboard:     ['Overview', 'Dashboard'],
  customers:     ['Sales', 'My Customers'],
  orders:        ['Sales', 'Orders'],
  production:    ['Operations', 'Roasting'],
  inventory:     ['Operations', 'Inventory'],
  packaging:     ['Operations', 'Packing'],
  delivery:      ['Operations', 'Deliveries'],
  finance:       ['Finance', 'Finance'],
  payments:      ['Finance', 'Payments'],
  banking:       ['Finance', 'Banking'],
  expenses:      ['Finance', 'Expenses'],
  payroll:       ['Finance', 'Payroll'],
  reports:       ['Management', 'Reports'],
  notifications: ['Management', 'Notifications'],
  approvals:     ['Management', 'Approvals'],
  settings:      ['System', 'Settings'],
  // Legacy
  quality:       ['Operations', 'Quality Control'],
  verification:  ['Operations', 'Yield Verification'],
  suppliers:     ['Operations', 'Supplier Directory'],
  audit:         ['System', 'Audit Logs'],
  users:         ['System', 'User Management'],
  portal:        ['Sales', 'Customer Portal'],
}

interface TopBarProps {
  activeModule: string
  onOpenSearch: () => void
  onOpenQuickCreate: () => void
  onOpenSidebar?: () => void
  currentUser?: AuthUser | null
  onLogout?: () => void
}

export default function TopBar({ activeModule, onOpenSearch, onOpenQuickCreate, onOpenSidebar, currentUser, onLogout }: TopBarProps) {
  const [notifOpen, setNotifOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [statusHover, setStatusHover] = useState(false)
  const [notifs, setNotifs] = useState(NOTIFICATIONS)
  const notifRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const { isMobile, isTablet } = useBreakpoint()
  const { mode, setMode, isDark } = useTheme()

  const unreadCount = notifs.filter(n => !n.read).length
  const urgentCount = notifs.filter(n => !n.read && n.category === 'urgent').length

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
    }
    if (notifOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [notifOpen])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false)
    }
    if (userMenuOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [userMenuOpen])

  const crumbs = BREADCRUMB_MAP[activeModule] ?? ['Flavor Coffee', 'Dashboard']

  const markAllRead = () => setNotifs(ns => ns.map(n => ({ ...n, read: true })))

  const ThemeBtn = ({ m, label, icon }: { m: ThemeMode; label: string; icon: string }) => (
    <button
      onClick={() => setMode(m)}
      style={{
        flex: 1, padding: '6px 0', borderRadius: 5, border: 'none',
        background: mode === m ? 'var(--brand-primary)' : 'transparent',
        color: mode === m ? '#fff' : 'var(--text-secondary)',
        fontSize: 11.5, fontFamily: 'Inter', fontWeight: mode === m ? 600 : 400,
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
        transition: 'all 0.15s ease',
      }}
    >
      <span>{icon}</span>{label}
    </button>
  )

  return (
    <header style={{
      height: 56,
      flexShrink: 0,
      background: 'var(--surface-01)',
      borderBottom: '1px solid var(--border-neutral)',
      display: 'flex',
      alignItems: 'center',
      padding: isMobile ? '0 14px' : '0 24px',
      gap: 10,
      position: 'relative',
      zIndex: 40,
    }}>
      <style>{`
        @keyframes slideDown { from { opacity:0; transform:translateY(-6px) } to { opacity:1; transform:translateY(0) } }
        @keyframes statusPulse { 0%,100% { box-shadow: 0 0 0 3px rgba(22,163,74,0.18) } 50% { box-shadow: 0 0 0 5px rgba(22,163,74,0.06) } }
        @keyframes fadeInOverlay { from { opacity:0 } to { opacity:1 } }
      `}</style>

      {/* ── Hamburger (mobile) ───────────────────────────── */}
      {isMobile && (
        <button onClick={onOpenSidebar} style={{
          width: 34, height: 34, borderRadius: 7, flexShrink: 0,
          background: 'var(--surface-02)', border: '1px solid var(--border-neutral)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 3.5, cursor: 'pointer',
        }}>
          {[0,1,2].map(i => <span key={i} style={{ display: 'block', width: 14, height: 1.5, background: 'var(--text-secondary)', borderRadius: 1 }} />)}
        </button>
      )}

      {/* ── Breadcrumb ───────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flex: 1, minWidth: 0, overflow: 'hidden' }}>
        {!isMobile && !isTablet && (
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'DM Mono', whiteSpace: 'nowrap', flexShrink: 0 }}>
            Flavor Coffee
          </span>
        )}
        {(isMobile ? crumbs.slice(-1) : crumbs).map((crumb, i, arr) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: i === arr.length - 1 ? 1 : 0, minWidth: 0 }}>
            {(!isMobile || i > 0) && (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--border-neutral)" strokeWidth="2.5" style={{ flexShrink: 0 }}>
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            )}
            <span style={{
              fontSize: i === arr.length - 1 ? 13.5 : 12.5,
              fontWeight: i === arr.length - 1 ? 600 : 400,
              color: i === arr.length - 1 ? 'var(--text-primary)' : 'var(--text-muted)',
              fontFamily: 'Inter',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{crumb}</span>
          </div>
        ))}
      </div>

      {/* ── System Status pill (laptop+ only) ───────────── */}
      {!isMobile && !isTablet && (
        <div style={{ position: 'relative', flexShrink: 0 }}
          onMouseEnter={() => setStatusHover(true)}
          onMouseLeave={() => setStatusHover(false)}
        >
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '4px 10px', borderRadius: 999,
            background: isDark ? 'rgba(74,222,128,0.08)' : '#F0FDF4',
            border: `1px solid ${isDark ? 'rgba(74,222,128,0.18)' : '#DCFCE7'}`,
            cursor: 'default',
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: isDark ? '#4ADE80' : '#16A34A',
              animation: 'statusPulse 2.5s ease-in-out infinite',
            }} />
            <span style={{ fontSize: 11.5, fontWeight: 500, color: isDark ? '#4ADE80' : '#15803D', whiteSpace: 'nowrap' }}>
              All Systems Operational
            </span>
          </div>
          {statusHover && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)',
              background: 'var(--surface-02)', border: '1px solid var(--border-neutral)',
              borderRadius: 8, padding: '10px 14px', fontSize: 12,
              whiteSpace: 'nowrap', zIndex: 200, boxShadow: 'var(--shadow-flyout)',
              animation: 'slideDown 0.12s ease',
            }}>
              <div style={{ fontFamily: 'DM Mono', marginBottom: 6, color: 'var(--text-muted)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Service Health</div>
              {[['Database', '18ms', '#4ADE80'], ['API Gateway', '24ms', '#4ADE80'], ['Auth', '12ms', '#4ADE80']].map(([s, ms, c]) => (
                <div key={s} style={{ display: 'flex', justifyContent: 'space-between', gap: 24, marginBottom: 2 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{s}</span>
                  <span style={{ fontFamily: 'DM Mono', color: c }}>{ms}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Search button ────────────────────────────────── */}
      <button onClick={onOpenSearch} style={{
        display: 'flex', alignItems: 'center', gap: 6,
        height: 32, padding: isMobile ? '0 10px' : '0 12px',
        borderRadius: 7, border: '1px solid var(--border-neutral)',
        background: 'var(--bg-primary)', cursor: 'pointer',
        color: 'var(--text-muted)', fontSize: 12.5, fontFamily: 'Inter',
        flexShrink: 0, transition: 'all 0.15s ease',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-primary)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        {!isMobile && <span>Search</span>}
        {!isMobile && <span style={{ fontFamily: 'DM Mono', fontSize: 10, background: 'var(--surface-02)', padding: '1px 5px', borderRadius: 3, border: '1px solid var(--border-neutral)', marginLeft: 2 }}>⌘K</span>}
      </button>

      {/* ── Quick Create ─────────────────────────────────── */}
      <button className="btn-primary" onClick={onOpenQuickCreate} style={{ height: 32, fontSize: 13, gap: 5, padding: '0 12px', flexShrink: 0 }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        {!isMobile && 'New'}
      </button>

      {/* ── Notification Bell ────────────────────────────── */}
      <div ref={notifRef} style={{ position: 'relative', flexShrink: 0 }}>
        <button
          onClick={() => setNotifOpen(v => !v)}
          style={{
            position: 'relative', width: 34, height: 34, borderRadius: 7,
            background: notifOpen ? 'var(--surface-hover)' : 'var(--bg-primary)',
            border: `1px solid ${notifOpen ? 'var(--border-neutral)' : 'var(--border-neutral)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: unreadCount > 0 ? (urgentCount > 0 ? 'var(--sem-danger)' : 'var(--sem-warning)') : 'var(--text-secondary)',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-hover)' }}
          onMouseLeave={e => { e.currentTarget.style.background = notifOpen ? 'var(--surface-hover)' : 'var(--bg-primary)' }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 01-3.46 0"/>
          </svg>
          {unreadCount > 0 && (
            <div style={{
              position: 'absolute', top: 5, right: 5,
              minWidth: 14, height: 14, borderRadius: 7,
              background: urgentCount > 0 ? 'var(--sem-danger)' : 'var(--sem-warning)',
              border: '1.5px solid var(--surface-01)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 8, fontWeight: 700, color: 'white', lineHeight: 1,
              padding: '0 2px',
            }}>
              {unreadCount}
            </div>
          )}
        </button>

        {/* ── Notification flyout ──────────────────────── */}
        {notifOpen && (
          <div style={{
            position: 'fixed',
            top: isMobile ? 'auto' : 64,
            bottom: isMobile ? 0 : 'auto',
            left: isMobile ? 0 : 'auto',
            right: isMobile ? 0 : 0,
            width: isMobile ? '100vw' : 400,
            background: 'var(--surface-01)',
            border: '1px solid var(--border-neutral)',
            borderRadius: isMobile ? '16px 16px 0 0' : 10,
            boxShadow: 'var(--shadow-modal)',
            zIndex: 500,
            overflow: 'hidden',
            animation: 'slideDown 0.18s cubic-bezier(0.16,1,0.3,1)',
            maxHeight: isMobile ? '85vh' : '80vh',
            display: 'flex',
            flexDirection: 'column',
          }}>
            {/* Header */}
            <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid var(--border-neutral)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Notifications</div>
                {unreadCount > 0 && (
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 1 }}>
                    {unreadCount} unread · {urgentCount > 0 ? `${urgentCount} urgent` : 'no urgent items'}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 12, color: 'var(--brand-primary)', fontFamily: 'Inter', fontWeight: 500, padding: 0,
                  }}>Mark all read</button>
                )}
                <button onClick={() => setNotifOpen(false)} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', fontSize: 18, lineHeight: 1, padding: '0 2px',
                }}>×</button>
              </div>
            </div>

            {/* Notification list */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {(['urgent', 'approval', 'warning', 'info'] as NotifCategory[]).map(cat => {
                const items = notifs.filter(n => n.category === cat)
                if (items.length === 0) return null
                const cfg = CATEGORY_CONFIG[cat]
                return (
                  <div key={cat}>
                    {/* Category header */}
                    <div style={{
                      padding: '8px 16px 5px',
                      display: 'flex', alignItems: 'center', gap: 7,
                      borderTop: cat !== 'urgent' ? '1px solid var(--border-neutral)' : 'none',
                      background: 'var(--bg-primary)',
                    }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={cfg.color} strokeWidth="2.5" strokeLinecap="round">
                        <path d={cfg.icon} />
                      </svg>
                      <span style={{ fontSize: 10, fontFamily: 'DM Mono', fontWeight: 600, color: cfg.color, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        {cfg.label}
                      </span>
                      <span style={{ fontSize: 10, fontFamily: 'DM Mono', color: 'var(--text-muted)', background: 'var(--surface-02)', padding: '0 5px', borderRadius: 3 }}>
                        {items.filter(n => !n.read).length > 0 ? `${items.filter(n => !n.read).length} new` : 'seen'}
                      </span>
                    </div>

                    {items.map((n, i) => (
                      <div
                        key={n.id}
                        onClick={() => setNotifs(ns => ns.map(x => x.id === n.id ? { ...x, read: true } : x))}
                        style={{
                          padding: '12px 16px',
                          borderBottom: i < items.length - 1 ? '1px solid var(--border-neutral)' : 'none',
                          background: n.read ? 'var(--surface-01)' : cfg.bg,
                          cursor: 'pointer',
                          transition: 'background 0.1s',
                          opacity: n.read ? 0.75 : 1,
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--surface-hover)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = n.read ? 'var(--surface-01)' : cfg.bg }}
                      >
                        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                          {!n.read && <div style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.color, flexShrink: 0, marginTop: 5 }} />}
                          {n.read && <div style={{ width: 6, flexShrink: 0 }} />}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: '17px', marginBottom: 3 }}>{n.title}</div>
                            <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: '16px', marginBottom: 3 }}>{n.what}</div>
                            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: '15px', marginBottom: n.action ? 8 : 4, fontStyle: 'italic' }}>{n.why}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              {n.action && (
                                <button
                                  onClick={e => { e.stopPropagation(); setNotifOpen(false) }}
                                  style={{
                                    padding: '3px 10px', borderRadius: 4,
                                    border: `1px solid ${cfg.border}`,
                                    background: 'transparent', color: cfg.color,
                                    fontSize: 11.5, fontWeight: 600, fontFamily: 'Inter',
                                    cursor: 'pointer', transition: 'background 0.1s',
                                  }}
                                  onMouseEnter={e => e.currentTarget.style.background = cfg.bg}
                                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                  {n.action}
                                </button>
                              )}
                              <span style={{ fontSize: 10.5, fontFamily: 'DM Mono', color: 'var(--text-muted)' }}>{n.time}</span>
                              <span style={{ fontSize: 10, fontFamily: 'DM Mono', color: 'var(--text-muted)', background: 'var(--surface-02)', padding: '1px 5px', borderRadius: 3, border: '1px solid var(--border-neutral)' }}>{n.module}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>

            <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border-neutral)', flexShrink: 0, textAlign: 'center' }}>
              <button onClick={() => setNotifOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12.5, color: 'var(--brand-primary)', fontWeight: 600, fontFamily: 'Inter' }}>
                View all notifications →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Avatar + User Menu ────────────────────────────── */}
      <div ref={userMenuRef} style={{ position: 'relative', flexShrink: 0 }}>
        <button
          onClick={() => setUserMenuOpen(v => !v)}
          style={{
            width: 32, height: 32, borderRadius: '50%',
            background: currentUser
              ? `linear-gradient(135deg, ${currentUser.avatarColor}CC, ${currentUser.avatarColor})`
              : 'linear-gradient(135deg, #2B4D3A, #4A7C5A)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: 'white',
            cursor: 'pointer', border: '2px solid var(--border-neutral)',
            transition: 'border-color 0.15s', outline: 'none',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--brand-primary)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-neutral)'}
          title={currentUser ? `${currentUser.name} · ${ROLES[currentUser.role]?.label}` : 'Account'}
        >
          {currentUser?.avatar ?? 'AG'}
        </button>

        {userMenuOpen && currentUser && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 10px)', right: 0,
            width: 256, background: 'var(--surface-01)',
            border: '1px solid var(--border-neutral)', borderRadius: 10,
            boxShadow: 'var(--shadow-flyout)', zIndex: 300, overflow: 'hidden',
            animation: 'slideDown 0.18s cubic-bezier(0.16,1,0.3,1)',
          }}>
            {/* User identity */}
            <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid var(--border-neutral)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  background: `linear-gradient(135deg, ${currentUser.avatarColor}CC, ${currentUser.avatarColor})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, color: 'white',
                }}>
                  {currentUser.avatar}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', lineHeight: '18px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {currentUser.name}
                  </div>
                  <div style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {currentUser.email}
                  </div>
                </div>
              </div>
              <div style={{
                marginTop: 10,
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '2px 9px', borderRadius: 999,
                background: ROLES[currentUser.role]?.bg ?? 'var(--surface-02)',
                border: `1px solid ${ROLES[currentUser.role]?.border ?? 'var(--border-neutral)'}`,
                fontSize: 10.5, fontFamily: 'DM Mono',
                color: ROLES[currentUser.role]?.color ?? 'var(--text-secondary)',
              }}>
                {ROLES[currentUser.role]?.label}
              </div>
            </div>

            {/* Theme picker */}
            <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-neutral)' }}>
              <div style={{ fontSize: 10.5, fontFamily: 'DM Mono', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Appearance</div>
              <div style={{ display: 'flex', background: 'var(--surface-02)', borderRadius: 6, padding: 2, border: '1px solid var(--border-neutral)', gap: 2 }}>
                <ThemeBtn m="light" label="Light" icon="☀" />
                <ThemeBtn m="dark" label="Dark" icon="☾" />
                <ThemeBtn m="system" label="Auto" icon="⊙" />
              </div>
            </div>

            {/* Menu items */}
            {[
              { icon: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z', label: 'My Profile' },
              { icon: 'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0', label: 'Notification Settings' },
              { icon: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z', label: 'Preferences' },
            ].map(item => (
              <button key={item.label} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', padding: '9px 14px',
                background: 'none', border: 'none', cursor: 'pointer',
                textAlign: 'left', color: 'var(--text-secondary)',
                fontSize: 13.5, fontFamily: 'Inter', transition: 'background 0.1s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-hover)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d={item.icon} />
                </svg>
                {item.label}
              </button>
            ))}

            <div style={{ borderTop: '1px solid var(--border-neutral)', marginTop: 2 }}>
              <button
                onClick={() => { setUserMenuOpen(false); onLogout?.() }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', padding: '10px 14px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  textAlign: 'left', color: 'var(--sem-danger)',
                  fontSize: 13.5, fontFamily: 'Inter', transition: 'background 0.1s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(220,38,38,0.06)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
                </svg>
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
