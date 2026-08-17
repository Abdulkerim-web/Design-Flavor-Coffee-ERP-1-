/* Responsive: mobile ≤640 | tablet 641–1024 | laptop 1025–1440 | desktop >1440 */
import { useState } from 'react'
import { useBreakpoint } from '../hooks/useBreakpoint'
import {
  ROLES, INITIAL_MATRIX, LOCKED_CELLS, INITIAL_USERS,
  type RoleId, type Scope, type ModuleKey, type Status, type User, type PermMatrix,
} from '../lib/rbac'

interface PermRow {
  module: ModuleKey
  label: string
  icon: string
  locked?: Partial<Record<Scope, boolean>>
}

const SCOPES: { id: Scope; label: string }[] = [
  { id: 'create',  label: 'Create' },
  { id: 'read',    label: 'Read'   },
  { id: 'update',  label: 'Update' },
  { id: 'delete',  label: 'Delete' },
  { id: 'approve', label: 'Approve / Override' },
]

const MODULES: PermRow[] = [
  { module: 'user-admin',      label: 'User Administration',  icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75' },
  { module: 'green-inventory', label: 'Green Inventory',      icon: 'M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z' },
  { module: 'quality-control', label: 'Quality Control',      icon: 'M14 2v6l3 5c1.5 2.6-.3 5-2.7 5H9.7C7.3 18 5.5 15.6 7 13l3-5V2M6 2h12' },
  { module: 'roasting-exec',   label: 'Roasting Execution',   icon: 'M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 3z' },
  { module: 'finance-ledger',  label: 'Finance Ledger',       icon: 'M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6' },
  { module: 'audit-logs',      label: 'Audit Logs',           icon: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8' },
  { module: 'orders',          label: 'Orders Pipeline',      icon: 'M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18' },
  { module: 'packaging',       label: 'Packaging & FG',       icon: 'M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8M12 22.08V12' },
  { module: 'delivery',        label: 'Delivery & Logistics', icon: 'M1 3h15v13H1zM16 8h4l3 3v5h-7V8z' },
  { module: 'reports',         label: 'Reports & Analytics',  icon: 'M18 20V10M12 20V4M6 20v-6' },
]


/* ── Create User Modal ─────────────────────────────────── */
function CreateUserModal({ onClose, onSave }: { onClose: () => void; onSave: (u: User) => void }) {
  const { isMobile } = useBreakpoint()
  const [name,  setName]  = useState('')
  const [email, setEmail] = useState('')
  const [role,  setRole]  = useState<RoleId>('inventory-manager')
  const [done,  setDone]  = useState(false)

  const canSave = name.trim().length > 1 && email.includes('@')

  const handleSave = () => {
    if (!canSave) return
    setDone(true)
    setTimeout(() => {
      const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
      onSave({
        id: `USR-0${11 + Math.floor(Math.random() * 10)}`,
        name: name.trim(), email: email.trim(), role,
        status: 'active', lastActive: 'Just now',
        avatar: initials, avatarColor: ROLES[role].color,
        department: 'Operations', createdAt: '2026-08-07',
      })
      onClose()
    }, 600)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)' }} />
      <div style={{ position: 'relative', width: isMobile ? 'calc(100vw - 32px)' : '100%', maxWidth: isMobile ? undefined : 480, maxHeight: 'calc(100vh - 48px)', overflowY: 'auto', background: 'var(--surface-01)', borderRadius: 16, overflowX: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.2)', animation: 'slideInPalette 0.2s cubic-bezier(0.16,1,0.3,1)' }}>
        <style>{`@keyframes slideInPalette { from{opacity:0;transform:translateY(-12px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }`}</style>

        <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid var(--border-neutral)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Create System User</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>New account · Credentials emailed on save</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div style={{ padding: '20px 24px' }}>
          <div style={{ display: 'grid', gap: 14, marginBottom: 18 }}>
            {[['Full Name', name, setName, 'text', 'e.g. Almaz Bekele'], ['Email Address', email, setEmail, 'email', 'e.g. almaz.b@flavorcoffee.et']].map(([label, val, fn, type, placeholder]) => (
              <div key={label as string}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 7 }}>{label as string} <span style={{ color: '#DC2626' }}>*</span></label>
                <input type={type as string} value={val as string} onChange={e => (fn as (v: string) => void)(e.target.value)} placeholder={placeholder as string}
                  style={{ width: '100%', padding: '9px 11px', borderRadius: 8, border: '1.5px solid var(--border-neutral)', background: 'var(--bg-primary)', fontSize: 13.5, fontFamily: 'Inter', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' as const }} />
              </div>
            ))}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 7 }}>Assigned Role <span style={{ color: '#DC2626' }}>*</span></label>
              <select value={role} onChange={e => setRole(e.target.value as RoleId)} style={{ width: '100%', padding: '9px 11px', borderRadius: 8, border: '1.5px solid var(--border-neutral)', background: 'var(--bg-primary)', fontSize: 13, fontFamily: 'Inter', color: 'var(--text-primary)', outline: 'none', appearance: 'none' as const }}>
                {(Object.entries(ROLES) as [RoleId, typeof ROLES[RoleId]][]).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              {role && (
                <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 7, background: ROLES[role].bg, border: `1px solid ${ROLES[role].border}`, fontSize: 12, color: ROLES[role].color, fontFamily: 'DM Mono' }}>
                  Tier {ROLES[role].tier} · {Object.values(INITIAL_MATRIX[role]).filter(v => Object.values(v).some(Boolean)).length} modules accessible
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
            <button onClick={handleSave} disabled={!canSave || done} style={{ flex: 2, padding: '11px 0', borderRadius: 8, border: 'none', background: done ? '#16A34A' : !canSave ? '#E5E3DC' : '#2B4D3A', color: !canSave ? '#9CA3AF' : '#FFFFFF', fontSize: 14, fontWeight: 700, cursor: canSave ? 'pointer' : 'not-allowed', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
              {done ? <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg> User Created</> : 'Create & Send Credentials →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Permission checkbox ───────────────────────────────── */
function PermCheck({
  checked, locked, roleColor, onChange,
}: {
  checked: boolean; locked: boolean; roleColor: string; onChange: () => void
}) {
  if (locked) {
    return (
      <div title="Security-hardcoded · Cannot be changed" style={{ width: 22, height: 22, borderRadius: 5, background: '#F3F4F6', border: '1.5px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'not-allowed', opacity: 0.45 }}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
      </div>
    )
  }
  return (
    <button onClick={onChange} style={{ width: 22, height: 22, borderRadius: 5, border: `1.5px solid ${checked ? roleColor : '#D1D5DB'}`, background: checked ? roleColor : '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.12s', padding: 0, outline: 'none' }}>
      {checked && <svg width="11" height="11" viewBox="0 0 12 12"><polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/></svg>}
    </button>
  )
}

/* ── Main ──────────────────────────────────────────────── */
export default function Users() {
  const { isMobile, isTablet, isLaptop, isDesktop, isNarrow } = useBreakpoint()
  const pagePadding = isMobile ? '12px 12px' : isTablet ? '18px 20px' : isLaptop ? '24px 28px' : '28px 32px'
  const maxWidthStyle = isDesktop ? { maxWidth: 1600, margin: '0 auto' } : {}
  const [users,      setUsers]      = useState<User[]>(INITIAL_USERS)
  const [matrix,     setMatrix]     = useState<PermMatrix>(INITIAL_MATRIX)
  const [activeRole, setActiveRole] = useState<RoleId>('head-roaster')
  const [showCreate, setShowCreate] = useState(false)
  const [editUser,   setEditUser]   = useState<User | null>(null)
  const [resetTarget, setResetTarget] = useState<string | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [search,     setSearch]     = useState('')
  const [savedAnim,  setSavedAnim]  = useState(false)

  const filteredUsers = users.filter(u => {
    const q = search.toLowerCase()
    return !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || ROLES[u.role].label.toLowerCase().includes(q)
  })

  const activeCount  = users.filter(u => u.status === 'active').length
  const roleColor    = ROLES[activeRole].color

  const togglePerm = (role: RoleId, mod: ModuleKey, scope: Scope) => {
    const locked = LOCKED_CELLS[role]?.[mod]?.[scope]
    if (locked) return
    setMatrix(prev => {
      const curr = prev[role][mod][scope]
      return {
        ...prev,
        [role]: { ...prev[role], [mod]: { ...prev[role][mod], [scope]: !curr } },
      }
    })
  }

  const toggleStatus = (id: string) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: u.status === 'active' ? 'disabled' : 'active' } : u))
  }

  const handleSaveMatrix = () => {
    setSavedAnim(true)
    setTimeout(() => setSavedAnim(false), 2000)
  }

  const permCountForRole = (role: RoleId) => {
    let count = 0
    MODULES.forEach(m => SCOPES.forEach(s => { if (matrix[role][m.module][s.id]) count++ }))
    return count
  }

  return (
    <div className="page-enter" style={{ height: '100%', display: 'flex', flexDirection: 'column', ...maxWidthStyle }}>

      {/* Header */}
      <div style={{ padding: '22px 28px 16px', borderBottom: '1px solid var(--border-neutral)', background: 'var(--surface-01)', flexShrink: 0 }}>
        <div className="section-eyebrow">Governance</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 4 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px', letterSpacing: '-0.025em' }}>User Management &amp; RBAC</h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>Account directory · Role permission matrix · Security token control</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: isMobile ? 'wrap' as const : 'nowrap' as const }}>
            <div style={{ padding: '6px 12px', borderRadius: 8, background: '#F0FDF4', border: '1px solid #DCFCE7', fontSize: 12, fontFamily: 'DM Mono', fontWeight: 700, color: '#15803D', display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#16A34A' }} />
              {activeCount} Active
            </div>
            <button className="btn-primary" onClick={() => setShowCreate(true)}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Create New User
            </button>
          </div>
        </div>
      </div>

      {/* Body split */}
      <div style={{ flex: 1, display: isNarrow ? 'block' : 'flex', overflow: 'hidden', overflowY: isNarrow ? 'auto' : 'hidden' }}>

        {/* ── Left: User Directory ──────────────────────── */}
        <div style={{ width: isNarrow ? '100%' : 420, minWidth: isNarrow ? undefined : 420, borderRight: isNarrow ? 'none' : '1px solid var(--border-neutral)', borderBottom: isNarrow ? '1px solid var(--border-neutral)' : 'none', display: 'flex', flexDirection: 'column', background: 'var(--surface-01)' }}>

          {/* Search */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #F0EDE8' }}>
            <div style={{ position: 'relative' as const }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" style={{ position: 'absolute' as const, left: 10, top: '50%', transform: 'translateY(-50%)' }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users, roles, emails…"
                style={{ width: '100%', paddingLeft: 30, paddingRight: 10, paddingTop: 7, paddingBottom: 7, borderRadius: 8, border: '1px solid var(--border-neutral)', fontSize: 12.5, fontFamily: 'DM Mono', color: 'var(--text-primary)', background: 'var(--bg-primary)', outline: 'none', boxSizing: 'border-box' as const }} />
            </div>
          </div>

          {/* User list */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredUsers.map((u, i) => {
              const rl = ROLES[u.role]
              const isDisabled = u.status === 'disabled'
              return (
                <div key={u.id} style={{ padding: '13px 16px', borderBottom: '1px solid #F5F3EF', background: 'var(--surface-01)', transition: 'background 0.1s', opacity: isDisabled ? 0.65 : 1 }}
                  onMouseEnter={e => e.currentTarget.style.background = '#FAFAF8'} onMouseLeave={e => e.currentTarget.style.background = '#FFFFFF'}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>

                    {/* Avatar */}
                    <div style={{ position: 'relative' as const, flexShrink: 0 }}>
                      <div style={{ width: 38, height: 38, borderRadius: '50%', background: `linear-gradient(135deg, ${u.avatarColor}, ${u.avatarColor}cc)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#FFFFFF', border: '2px solid var(--border-neutral)' }}>
                        {u.avatar}
                      </div>
                      <div style={{ position: 'absolute' as const, bottom: 0, right: -1, width: 10, height: 10, borderRadius: '50%', background: u.status === 'active' ? '#16A34A' : '#D1D5DB', border: '2px solid #FFFFFF' }} />
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                        <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name}</span>
                        <span style={{ fontSize: 10, fontFamily: 'DM Mono', fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: rl.bg, color: rl.color, border: `1px solid ${rl.border}`, whiteSpace: 'nowrap' as const }}>{rl.label}</span>
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontFamily: 'DM Mono', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{u.email}</div>
                      <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 2 }}>Last active: {u.lastActive}</div>
                    </div>

                    {/* Status toggle */}
                    <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                      <button onClick={() => toggleStatus(u.id)} title={u.status === 'active' ? 'Disable account' : 'Enable account'} style={{ width: 36, height: 20, borderRadius: 999, background: u.status === 'active' ? '#16A34A' : '#D1D5DB', border: 'none', cursor: 'pointer', position: 'relative' as const, transition: 'background 0.2s', padding: 0 }}>
                        <div style={{ position: 'absolute' as const, top: 2, left: u.status === 'active' ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: 'var(--surface-01)', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s cubic-bezier(0.16,1,0.3,1)' }} />
                      </button>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <button onClick={() => setEditUser(u)} style={{ fontSize: 10.5, padding: '3px 8px', borderRadius: 5, border: '1px solid var(--border-neutral)', background: 'transparent', color: '#374151', cursor: 'pointer', fontFamily: 'DM Mono', transition: 'all 0.1s', whiteSpace: 'nowrap' as const }}
                          onMouseEnter={e => e.currentTarget.style.background = '#F5F3EF'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          Edit Role
                        </button>
                        <button onClick={() => { setResetTarget(u.id); setConfirmReset(false) }} style={{ fontSize: 10.5, padding: '3px 8px', borderRadius: 5, border: '1px solid var(--border-neutral)', background: 'transparent', color: '#DC2626', cursor: 'pointer', fontFamily: 'DM Mono', transition: 'all 0.1s', whiteSpace: 'nowrap' as const }}
                          onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          Reset PW
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer stats */}
          <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border-neutral)', background: 'var(--bg-primary)', display: 'flex', gap: 18 }}>
            {[
              { label: 'Total Users', value: users.length },
              { label: 'Active', value: activeCount },
              { label: 'Disabled', value: users.length - activeCount },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontSize: 14, fontFamily: 'DM Mono', fontWeight: 700, color: 'var(--text-primary)' }}>{s.value}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: Permission Matrix ───────────────────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: isNarrow ? 'visible' : 'hidden', background: 'var(--surface-02)', marginTop: isNarrow ? 16 : 0 }}>

          {/* Role tabs */}
          <div style={{ padding: '14px 22px 0', background: 'var(--surface-01)', borderBottom: '1px solid var(--border-neutral)', flexShrink: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>Role Permissions Configuration Matrix</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' as const }}>
              {(Object.entries(ROLES) as [RoleId, typeof ROLES[RoleId]][]).map(([k, v]) => {
                const isActive = k === activeRole
                const count = permCountForRole(k)
                return (
                  <button key={k} onClick={() => setActiveRole(k)}
                    style={{ padding: '8px 14px', borderRadius: '8px 8px 0 0', border: `1.5px solid ${isActive ? v.color : '#E5E3DC'}`, borderBottom: isActive ? `2px solid ${v.color}` : '1.5px solid #E5E3DC', background: isActive ? v.bg : '#FFFFFF', cursor: 'pointer', transition: 'all 0.12s', marginBottom: isActive ? -1 : 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: isActive ? v.color : '#6B7280', whiteSpace: 'nowrap' as const }}>{v.label}</div>
                    <div style={{ fontSize: 10, fontFamily: 'DM Mono', color: isActive ? v.color + 'AA' : '#9CA3AF', marginTop: 1 }}>Tier {v.tier} · {count}p</div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Matrix */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px' }}>

            {/* Role summary card */}
            <div style={{ background: 'var(--surface-01)', border: `1.5px solid ${ROLES[activeRole].border}`, borderRadius: 12, padding: '14px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: ROLES[activeRole].bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={roleColor} strokeWidth="1.75">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{ROLES[activeRole].label}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                  {permCountForRole(activeRole)} active permissions · Tier {ROLES[activeRole].tier} access level ·
                  {' '}{users.filter(u => u.role === activeRole).length} users assigned
                </div>
              </div>
              {activeRole === 'general-manager' && (
                <div style={{ padding: '5px 10px', borderRadius: 6, background: '#FEF2F2', border: '1px solid #FECACA', fontSize: 11.5, fontFamily: 'DM Mono', color: '#DC2626', fontWeight: 600 }}>
                  Super Admin · Protected
                </div>
              )}
            </div>

            {/* Matrix grid */}
            <div style={{ background: 'var(--surface-01)', border: '1px solid var(--border-neutral)', borderRadius: 12, overflow: 'hidden' }}>
              {isMobile ? (
                /* Mobile: card-per-module layout */
                <div>
                  {MODULES.map((mod, mi) => {
                    const modPerms = matrix[activeRole][mod.module]
                    const rowPerms = SCOPES.map(s => ({
                      scope: s,
                      checked: !!modPerms[s.id],
                      locked: !!LOCKED_CELLS[activeRole]?.[mod.module]?.[s.id],
                    }))
                    const anyEnabled = rowPerms.some(r => r.checked && !r.locked)
                    return (
                      <div key={mod.module} style={{ padding: '12px 14px', borderBottom: mi < MODULES.length - 1 ? '1px solid #F0EDE8' : 'none', background: mi % 2 === 0 ? '#FFFFFF' : '#FAFAF8' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                          <div style={{ width: 24, height: 24, borderRadius: 6, background: anyEnabled ? ROLES[activeRole].bg : '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={anyEnabled ? roleColor : '#9CA3AF'} strokeWidth="1.75">
                              {mod.icon.split('M').filter(Boolean).map((s, i) => <path key={i} d={`M${s}`} />)}
                            </svg>
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{mod.label}</span>
                        </div>
                        {rowPerms.map(p => (
                          <div key={p.scope.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F5F3EF' }}>
                            <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'DM Mono' }}>{p.scope.label}</span>
                            <PermCheck checked={p.checked} locked={p.locked} roleColor={roleColor} onChange={() => togglePerm(activeRole, mod.module, p.scope.id)} />
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <>
                  {/* Column headers */}
                  <div style={{ display: 'grid', gridTemplateColumns: '220px repeat(5, 1fr)', background: 'var(--bg-primary)', borderBottom: '2px solid #E5E3DC' }}>
                    <div style={{ padding: '10px 16px', fontSize: 11, fontFamily: 'DM Mono', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>Module</div>
                    {SCOPES.map(s => (
                      <div key={s.id} style={{ padding: '10px 8px', fontSize: 10, fontFamily: 'DM Mono', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' as const, textAlign: 'center' as const, borderLeft: '1px solid #F0EDE8' }}>{s.label}</div>
                    ))}
                  </div>

                  {/* Module rows */}
                  {MODULES.map((mod, mi) => {
                    const modPerms = matrix[activeRole][mod.module]
                    const rowPerms = SCOPES.map(s => ({
                      scope: s,
                      checked: !!modPerms[s.id],
                      locked: !!LOCKED_CELLS[activeRole]?.[mod.module]?.[s.id],
                    }))
                    const anyEnabled = rowPerms.some(r => r.checked && !r.locked)
                    return (
                      <div key={mod.module} style={{ display: 'grid', gridTemplateColumns: '220px repeat(5, 1fr)', borderBottom: mi < MODULES.length - 1 ? '1px solid #F0EDE8' : 'none', background: mi % 2 === 0 ? '#FFFFFF' : '#FAFAF8', transition: 'background 0.1s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#F5F3EF'} onMouseLeave={e => e.currentTarget.style.background = mi % 2 === 0 ? '#FFFFFF' : '#FAFAF8'}>

                        {/* Module label */}
                        <div style={{ padding: '11px 16px', display: 'flex', alignItems: 'center', gap: 9 }}>
                          <div style={{ width: 26, height: 26, borderRadius: 7, background: anyEnabled ? ROLES[activeRole].bg : '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.2s' }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={anyEnabled ? roleColor : '#9CA3AF'} strokeWidth="1.75">
                              {mod.icon.split('M').filter(Boolean).map((s, i) => <path key={i} d={`M${s}`} />)}
                            </svg>
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 500, color: '#374151', whiteSpace: 'nowrap' as const }}>{mod.label}</span>
                        </div>

                        {/* Permission checkboxes */}
                        {rowPerms.map(p => (
                          <div key={p.scope.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: '1px solid #F0EDE8' }}>
                            <PermCheck
                              checked={p.checked}
                              locked={p.locked}
                              roleColor={roleColor}
                              onChange={() => togglePerm(activeRole, mod.module, p.scope.id)}
                            />
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </>
              )}
            </div>

            {/* Legend + Save */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
              <div style={{ display: 'flex', gap: 14, fontSize: 11.5, fontFamily: 'DM Mono', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: roleColor }} />
                  Permission granted
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, border: '1.5px solid #D1D5DB', background: 'var(--surface-01)' }} />
                  Not granted
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: '#F3F4F6', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                  </div>
                  Security-locked
                </div>
              </div>

              <button onClick={handleSaveMatrix} style={{ padding: '10px 20px', borderRadius: 9, border: 'none', background: savedAnim ? '#16A34A' : '#2B4D3A', color: '#FFFFFF', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 7, boxShadow: '0 3px 10px rgba(43,77,58,0.25)' }}>
                {savedAnim
                  ? <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg> Permissions Saved</>
                  : 'Save Permission Matrix →'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reset password confirmation */}
      {resetTarget && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={() => setResetTarget(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)' }} />
          <div style={{ position: 'relative', width: 380, background: 'var(--surface-01)', borderRadius: 14, padding: '24px', boxShadow: '0 25px 50px rgba(0,0,0,0.2)', animation: 'slideInPalette 0.2s cubic-bezier(0.16,1,0.3,1)' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#FEF2F2', border: '1px solid #FECACA', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="1.75"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>Reset Password?</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 18, lineHeight: '19px' }}>
              A secure reset link will be emailed to <strong style={{ color: 'var(--text-primary)' }}>{users.find(u => u.id === resetTarget)?.email}</strong>. All active sessions will be revoked immediately.
            </div>
            <div style={{ display: 'flex', gap: 9 }}>
              <button onClick={() => setResetTarget(null)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
              <button onClick={() => { setConfirmReset(true); setTimeout(() => setResetTarget(null), 1200) }}
                style={{ flex: 2, padding: '10px 0', borderRadius: 8, border: 'none', background: confirmReset ? '#16A34A' : '#DC2626', color: '#FFFFFF', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', transition: 'background 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {confirmReset ? <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg> Reset Sent</> : 'Confirm Reset & Revoke Tokens'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit user modal */}
      {editUser && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={() => setEditUser(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)' }} />
          <div style={{ position: 'relative', width: 420, background: 'var(--surface-01)', borderRadius: 14, padding: '22px 24px', boxShadow: '0 25px 50px rgba(0,0,0,0.2)', animation: 'slideInPalette 0.2s cubic-bezier(0.16,1,0.3,1)' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>Edit Role — {editUser.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 18, fontFamily: 'DM Mono' }}>{editUser.email} · {editUser.id}</div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>Assigned Role</label>
            <select defaultValue={editUser.role} onChange={e => setUsers(prev => prev.map(u => u.id === editUser.id ? { ...u, role: e.target.value as RoleId, avatarColor: ROLES[e.target.value as RoleId].color } : u))}
              style={{ width: '100%', padding: '9px 11px', borderRadius: 8, border: '1.5px solid var(--border-neutral)', background: 'var(--bg-primary)', fontSize: 13, fontFamily: 'Inter', color: 'var(--text-primary)', outline: 'none', appearance: 'none' as const, marginBottom: 18 }}>
              {(Object.entries(ROLES) as [RoleId, typeof ROLES[RoleId]][]).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <div style={{ display: 'flex', gap: 9 }}>
              <button onClick={() => setEditUser(null)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
              <button onClick={() => setEditUser(null)} style={{ flex: 2, padding: '10px 0', borderRadius: 8, border: 'none', background: '#2B4D3A', color: '#FFFFFF', fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}>Save Role Change</button>
            </div>
          </div>
        </div>
      )}

      {showCreate && <CreateUserModal onClose={() => setShowCreate(false)} onSave={u => setUsers(prev => [u, ...prev])} />}
    </div>
  )
}
