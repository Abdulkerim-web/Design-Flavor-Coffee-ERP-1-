/* Responsive: mobile ≤640 | tablet 641–1024 | laptop 1025–1440 | desktop >1440 */
import { useState, useEffect, useRef, useCallback, type KeyboardEvent } from 'react'
import { useBreakpoint } from '../hooks/useBreakpoint'

/* ── Static data — production data comes from PHP/backend ── */
const RECENT_SEARCHES = [
  'Guji Grade 1 Lot #882',
  'Batch RB-2847 — Limu Espresso',
  'ORD-4821 — Hilton Addis Ababa',
]

/* Simulated entity search results keyed by lowercase query substring */
interface EntityResult {
  id: string; type: 'customer' | 'order' | 'inventory' | 'payment' | 'delivery'; label: string; meta: string; status?: string; statusColor?: string
}

const ENTITY_DATABASE: EntityResult[] = [
  // customers
  { id: 'c1', type: 'customer', label: 'Sunrise Café',               meta: 'Bole Branch · Addis Ababa',      status: 'Active',     statusColor: '#16A34A' },
  { id: 'c2', type: 'customer', label: 'Sunrise Café — Kazanchis',   meta: 'Branch · Addis Ababa',           status: 'Active',     statusColor: '#16A34A' },
  { id: 'c3', type: 'customer', label: 'Hilton Addis Ababa',         meta: 'Key Account · Bole',             status: 'Active',     statusColor: '#16A34A' },
  { id: 'c4', type: 'customer', label: 'Ethiopian Airlines Catering', meta: 'Corporate · Bole International', status: 'Overdue',    statusColor: '#DC2626' },
  { id: 'c5', type: 'customer', label: 'Harar Coffee Exporters',     meta: 'Export · Harar',                 status: 'Active',     statusColor: '#16A34A' },
  { id: 'c6', type: 'customer', label: 'Bole Supermarket',           meta: 'Retail · Bole',                  status: 'Active',     statusColor: '#16A34A' },
  // orders
  { id: 'o1', type: 'order', label: '#ORD-1042',   meta: 'Sunrise Café · Guji Medium, 50 KG',          status: 'Pending',    statusColor: '#D97706' },
  { id: 'o2', type: 'order', label: '#ORD-1038',   meta: 'Hilton Addis Ababa · Limu Espresso, 25 KG',  status: 'Delivered',  statusColor: '#16A34A' },
  { id: 'o3', type: 'order', label: '#ORD-4821',   meta: 'Hilton Addis Ababa · Yirgacheffe, 100 KG',   status: 'Processing', statusColor: '#2563EB' },
  { id: 'o4', type: 'order', label: '#ORD-1039',   meta: 'Bole Supermarket · Sidama Grade 1, 120 KG',  status: 'Approved',   statusColor: '#16A34A' },
  // inventory
  { id: 'i1', type: 'inventory', label: 'Guji Grade 1 · Lot #882',     meta: '200 KG on hand',  status: 'Low stock', statusColor: '#D97706' },
  { id: 'i2', type: 'inventory', label: 'Yirgacheffe Grade 1 · #GR-0291', meta: '120 KG on hand', status: 'Quarantined', statusColor: '#DC2626' },
  { id: 'i3', type: 'inventory', label: 'Sidama Grade 1 · Lot #794',   meta: '450 KG on hand',  status: 'OK',        statusColor: '#16A34A' },
  { id: 'i4', type: 'inventory', label: 'Limu Espresso · Lot #801',    meta: '310 KG on hand',  status: 'OK',        statusColor: '#16A34A' },
  // payments
  { id: 'p1', type: 'payment', label: 'INV-2024-0819', meta: 'Ethiopian Airlines · ETB 156,000', status: 'Overdue',  statusColor: '#DC2626' },
  { id: 'p2', type: 'payment', label: 'INV-2024-0812', meta: 'Hilton Addis Ababa · ETB 88,500',  status: 'Paid',     statusColor: '#16A34A' },
  // deliveries
  { id: 'd1', type: 'delivery', label: 'DEL-0291', meta: 'ORD-1038 → Hilton Addis Ababa', status: 'Completed', statusColor: '#16A34A' },
  { id: 'd2', type: 'delivery', label: 'DEL-0292', meta: 'ORD-1042 → Sunrise Café · Bole', status: 'En route', statusColor: '#2563EB' },
]

const QUICK_ACTIONS = [
  { id: 'new-order',      label: 'New Customer Order',          icon: 'M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0', kbd: 'N O' },
  { id: 'record-receive', label: 'Record Green Bean Receiving', icon: 'M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z', kbd: 'N R' },
  { id: 'qc-entry',       label: 'Create QC Inspection',        icon: 'M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11', kbd: 'N Q' },
  { id: 'new-batch',      label: 'Schedule Roasting Batch',     icon: 'M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 3z', kbd: 'N B' },
]

const NAV_MODULES = [
  { id: 'dashboard',     label: 'Dashboard',     icon: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z' },
  { id: 'customers',     label: 'My Customers',  icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8z' },
  { id: 'orders',        label: 'Orders',        icon: 'M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18' },
  { id: 'production',    label: 'Roasting',      icon: 'M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0' },
  { id: 'inventory',     label: 'Inventory',     icon: 'M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z' },
  { id: 'delivery',      label: 'Deliveries',    icon: 'M1 3h15v13H1zM16 8h4l3 3v5h-7V8z' },
  { id: 'finance',       label: 'Finance',       icon: 'M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6' },
  { id: 'reports',       label: 'Reports',       icon: 'M18 20V10M12 20V4M6 20v-6' },
  { id: 'approvals',     label: 'Approvals',     icon: 'M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11' },
  { id: 'notifications', label: 'Notifications', icon: 'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0' },
  { id: 'settings',      label: 'Settings',      icon: 'M12 15a3 3 0 100-6 3 3 0 000 6z' },
]

const ENTITY_ICONS: Record<string, string> = {
  customer:  'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8z',
  order:     'M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18',
  inventory: 'M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z',
  payment:   'M1 4h22v16H1zM1 10h22',
  delivery:  'M1 3h15v13H1zM16 8h4l3 3v5h-7V8z',
}

const ENTITY_LABELS: Record<string, string> = {
  customer: 'Customers', order: 'Orders', inventory: 'Inventory', payment: 'Payments', delivery: 'Deliveries',
}

type SearchState = 'idle' | 'loading' | 'results' | 'no-results' | 'error'

interface Props { open: boolean; onClose: () => void; onNavigate: (id: string) => void }

export default function CommandPalette({ open, onClose, onNavigate }: Props) {
  const { isMobile } = useBreakpoint()
  const [query, setQuery]         = useState('')
  const [cursor, setCursor]       = useState(0)
  const [searchState, setSearchState] = useState<SearchState>('idle')
  const [results, setResults]     = useState<EntityResult[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (open) { setQuery(''); setCursor(0); setSearchState('idle'); setResults([]); setTimeout(() => inputRef.current?.focus(), 40) }
  }, [open])

  useEffect(() => {
    const h = (e: globalThis.KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose])

  // Debounced search simulation
  const runSearch = useCallback((q: string) => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    if (!q.trim()) { setSearchState('idle'); setResults([]); return }

    setSearchState('loading')
    searchTimer.current = setTimeout(() => {
      const lower = q.toLowerCase()
      const found = ENTITY_DATABASE.filter(e =>
        e.label.toLowerCase().includes(lower) || e.meta.toLowerCase().includes(lower)
      )
      setResults(found)
      setSearchState(found.length > 0 ? 'results' : 'no-results')
      setCursor(0)
    }, 320)
  }, [])

  const q = query.trim().toLowerCase()

  useEffect(() => { runSearch(query) }, [query, runSearch])

  // Group results by type
  const grouped = results.reduce<Record<string, EntityResult[]>>((acc, r) => {
    ;(acc[r.type] ??= []).push(r)
    return acc
  }, {})

  const typeOrder = ['customer', 'order', 'inventory', 'payment', 'delivery']

  // Idle mode items
  const idleActions  = QUICK_ACTIONS
  const idleModules  = NAV_MODULES.slice(0, 6)

  const allNavItems = q ? [] : idleModules
  const allActionItems = q ? [] : idleActions

  // Flat list for keyboard navigation
  const flatItems: Array<{ section: string; id?: string; label: string; entity?: EntityResult }> = []
  if (searchState === 'idle' || searchState === 'loading') {
    RECENT_SEARCHES.forEach(r => flatItems.push({ section: 'recent', label: r }))
    idleActions.forEach(a => flatItems.push({ section: 'action', id: a.id, label: a.label }))
    idleModules.forEach(m => flatItems.push({ section: 'module', id: m.id, label: m.label }))
  } else if (searchState === 'results') {
    typeOrder.forEach(type => {
      ;(grouped[type] ?? []).forEach(e => flatItems.push({ section: 'entity', id: e.id, label: e.label, entity: e }))
    })
  }

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(c => Math.min(c + 1, flatItems.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)) }
    if (e.key === 'Enter' && flatItems[cursor]) {
      const item = flatItems[cursor]
      if (item.section === 'module' && item.id) { onNavigate(item.id); onClose() }
    }
  }

  if (!open) return null

  /* ── Mini icon SVG ─── */
  const SvgIcon = ({ d, size = 14, color = 'currentColor' }: { d: string; size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      {d.split('M').filter(Boolean).map((seg, i) => <path key={i} d={`M${seg}`} />)}
    </svg>
  )

  /* ── Row component ─── */
  let rowIdx = 0
  const Row = ({ label, icon, meta, status, statusColor, kbd, onClick }: {
    label: string; icon?: string; meta?: string; status?: string; statusColor?: string; kbd?: string; onClick?: () => void
  }) => {
    const idx = rowIdx++
    const active = idx === cursor
    return (
      <button
        onMouseEnter={() => setCursor(idx)}
        onClick={onClick ?? onClose}
        style={{
          display: 'flex', alignItems: 'center', gap: 10, width: '100%',
          padding: '9px 16px', border: 'none', textAlign: 'left',
          background: active ? 'var(--surface-02)' : 'transparent',
          cursor: 'pointer',
          borderLeft: `2px solid ${active ? '#2B4D3A' : 'transparent'}`,
          transition: 'background 0.08s, border-color 0.08s',
        }}
      >
        {icon && (
          <div style={{ width: 26, height: 26, borderRadius: 6, background: active ? '#E8EDE9' : 'var(--surface-02)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid var(--border-neutral)', transition: 'background 0.08s' }}>
            <SvgIcon d={icon} size={13} color={active ? '#2B4D3A' : 'var(--text-secondary)'} />
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, color: 'var(--text-primary)', fontWeight: active ? 500 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {label}
          </div>
          {meta && <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontFamily: 'Inter', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 1 }}>{meta}</div>}
        </div>
        {status && <div style={{ fontSize: 10.5, fontFamily: 'DM Mono', color: statusColor ?? 'var(--text-muted)', background: statusColor ? `${statusColor}18` : 'var(--surface-02)', border: `1px solid ${statusColor ? `${statusColor}40` : 'var(--border-neutral)'}`, padding: '2px 7px', borderRadius: 999, flexShrink: 0 }}>{status}</div>}
        {kbd && <span style={{ fontSize: 10.5, fontFamily: 'DM Mono', color: 'var(--text-muted)', background: 'var(--surface-02)', padding: '1px 6px', borderRadius: 4, border: '1px solid var(--border-neutral)', flexShrink: 0 }}>{kbd}</span>}
      </button>
    )
  }

  /* ── Section header ─── */
  const SectionHead = ({ label, first }: { label: string; first?: boolean }) => (
    <div style={{ padding: `${first ? 10 : 14}px 16px 4px`, fontSize: 10, fontFamily: 'DM Mono', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>
      {label}
    </div>
  )

  /* ── Skeleton loader ─── */
  const Skeleton = ({ w = '60%' }: { w?: string }) => (
    <div style={{ height: 10, borderRadius: 5, background: 'var(--surface-hover)', width: w, animation: 'cpSkeleton 1.4s ease infinite' }} />
  )

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(15,15,15,0.35)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: isMobile ? 8 : '13vh',
        animation: 'cpFadeIn 0.14s ease',
      }}
    >
      <style>{`
        @keyframes cpFadeIn   { from { opacity:0 } to { opacity:1 } }
        @keyframes cpSlide    { from { opacity:0; transform:translateY(-10px) scale(0.98) } to { opacity:1; transform:translateY(0) scale(1) } }
        @keyframes cpSpin     { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        @keyframes cpSkeleton { 0%,100% { opacity:0.4 } 50% { opacity:0.9 } }
      `}</style>

      <div style={{
        width: isMobile ? 'calc(100vw - 16px)' : 660, maxWidth: '90vw',
        background: 'var(--surface-01)', border: '1px solid var(--border-neutral)',
        borderRadius: 14,
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.04)',
        overflow: 'hidden',
        animation: 'cpSlide 0.18s cubic-bezier(0.16,1,0.3,1)',
      }}>

        {/* ── Search input ─────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px 12px', borderBottom: '1px solid var(--border-neutral)' }}>
          {searchState === 'loading' ? (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0, animation: 'cpSpin 0.7s linear infinite' }}>
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
          ) : (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          )}
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setCursor(0) }}
            onKeyDown={handleKey}
            inputMode="search"
            placeholder="Search customers, orders, inventory…"
            aria-label="Global search"
            style={{
              flex: 1, border: 'none', outline: 'none',
              fontSize: 15.5, color: 'var(--text-primary)', background: 'transparent',
              fontFamily: 'Inter',
            }}
          />
          {query && (
            <button onClick={() => { setQuery(''); setSearchState('idle'); inputRef.current?.focus() }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 4, borderRadius: 4 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          )}
          <button onClick={onClose} style={{ background: 'var(--surface-02)', border: '1px solid var(--border-neutral)', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 11, fontFamily: 'DM Mono', padding: '3px 8px', borderRadius: 5, flexShrink: 0 }}>
            Esc
          </button>
        </div>

        {/* ── Results area ─────────────────────────────── */}
        <div style={{ maxHeight: isMobile ? '60vh' : 460, overflowY: 'auto' }}>

          {/* Loading skeleton */}
          {searchState === 'loading' && (
            <div style={{ padding: '12px 16px 8px' }}>
              <div style={{ fontSize: 10, fontFamily: 'DM Mono', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Searching…</div>
              {[80, 60, 70, 50, 65].map((w, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 16 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 6, background: 'var(--surface-hover)', flexShrink: 0, animation: 'cpSkeleton 1.4s ease infinite' }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <Skeleton w={`${w}%`} />
                    <Skeleton w={`${Math.round(w * 0.6)}%`} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No results */}
          {searchState === 'no-results' && (
            <div style={{ padding: '40px 24px', textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--surface-02)', border: '1px solid var(--border-neutral)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.75" strokeLinecap="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </div>
              <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 5 }}>No results found</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Try a different name, order number, or keyword.
              </div>
            </div>
          )}

          {/* Error state */}
          {searchState === 'error' && (
            <div style={{ padding: '40px 24px', textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: '#FEF2F2', border: '1px solid #FCA5A5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="1.75" strokeLinecap="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"/>
                </svg>
              </div>
              <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 5 }}>Search unavailable</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>Something went wrong while searching. Please try again.</div>
              <button onClick={() => runSearch(query)} style={{ padding: '7px 18px', borderRadius: 7, border: '1.5px solid #2B4D3A', background: 'none', color: '#2B4D3A', fontSize: 13, fontWeight: 600, fontFamily: 'Inter', cursor: 'pointer' }}>
                Try Again
              </button>
            </div>
          )}

          {/* Entity results */}
          {searchState === 'results' && (
            <div>
              {typeOrder.map(type => {
                const items = grouped[type]
                if (!items?.length) return null
                return (
                  <div key={type} style={{ borderBottom: '1px solid var(--border-neutral)' }}>
                    <div style={{ padding: '10px 16px 4px', display: 'flex', alignItems: 'center', gap: 7 }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round">
                        {ENTITY_ICONS[type].split('M').filter(Boolean).map((seg, i) => <path key={i} d={`M${seg}`} />)}
                      </svg>
                      <span style={{ fontSize: 10, fontFamily: 'DM Mono', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>
                        {ENTITY_LABELS[type]}
                      </span>
                    </div>
                    {items.map(e => (
                      <Row
                        key={e.id}
                        label={e.label}
                        icon={ENTITY_ICONS[e.type]}
                        meta={e.meta}
                        status={e.status}
                        statusColor={e.statusColor}
                        onClick={() => onClose()}
                      />
                    ))}
                  </div>
                )
              })}
            </div>
          )}

          {/* Idle: recent + quick actions + navigation */}
          {(searchState === 'idle') && (
            <div>
              {/* Recent searches */}
              <div>
                <SectionHead label="Recent Searches" first />
                {RECENT_SEARCHES.map((r, i) => (
                  <button
                    key={i}
                    onMouseEnter={() => setCursor(i)}
                    onClick={() => { setQuery(r); runSearch(r) }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                      padding: '8px 16px', border: 'none', textAlign: 'left',
                      background: cursor === i ? 'var(--surface-02)' : 'transparent',
                      cursor: 'pointer',
                      borderLeft: `2px solid ${cursor === i ? '#2B4D3A' : 'transparent'}`,
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
                      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'Inter' }}>{r}</span>
                  </button>
                ))}
              </div>

              {/* Quick actions */}
              <div style={{ borderTop: '1px solid var(--border-neutral)' }}>
                <SectionHead label="Quick Actions" />
                {allActionItems.map(a => {
                  void (rowIdx = RECENT_SEARCHES.length + allActionItems.indexOf(a))
                  return (
                    <Row key={a.id} label={a.label} icon={a.icon} kbd={a.kbd} onClick={onClose} />
                  )
                })}
              </div>

              {/* Navigation */}
              <div style={{ borderTop: '1px solid var(--border-neutral)' }}>
                <SectionHead label="Navigate To" />
                {allNavItems.map((m) => {
                  void (rowIdx = RECENT_SEARCHES.length + allActionItems.length + allNavItems.indexOf(m))
                  return (
                    <Row key={m.id} label={m.label} icon={m.icon} onClick={() => { onNavigate(m.id); onClose() }} />
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ───────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 16, padding: '9px 16px', borderTop: '1px solid var(--border-neutral)', background: 'var(--bg-primary)', alignItems: 'center' }}>
          {[{ key: '↑↓', desc: 'navigate' }, { key: '↵', desc: 'select' }, { key: 'Esc', desc: 'close' }].map(h => (
            <div key={h.key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 10, fontFamily: 'DM Mono', color: 'var(--text-secondary)', background: 'var(--surface-hover)', padding: '1px 6px', borderRadius: 4, border: '1px solid var(--border-neutral)' }}>{h.key}</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{h.desc}</span>
            </div>
          ))}
          <div style={{ marginLeft: 'auto', fontSize: 10.5, fontFamily: 'DM Mono', color: 'var(--text-muted)' }}>
            Results filtered by your permissions
          </div>
        </div>
      </div>
    </div>
  )
}
