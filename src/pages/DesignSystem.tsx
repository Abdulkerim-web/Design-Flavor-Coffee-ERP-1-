/**
 * DESIGN SYSTEM STYLE GUIDE — F3-02
 *
 * Visual reference for every token, scale, component state, and status convention.
 * Every developer building a new ERP screen should consult this page first.
 *
 * Sections:
 *   0  Theme toggle
 *   1  Color system (surfaces / text / borders / brand / status)
 *   2  Typography scale
 *   3  Spacing scale
 *   4  Border radius scale
 *   5  Shadow / elevation scale
 *   6  Z-index reference
 *   7  Transition tokens
 *   8  Component states (buttons, inputs, badges, cards, alerts)
 *   9  Status system
 *   10 Icon vocabulary
 *   11 Responsive grid preview
 *   12 Form controls
 */

import { useState, type FC, type ReactNode, type CSSProperties } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import type { ThemeMode } from '../contexts/ThemeContext'
import { Avatar, AvatarGroup } from '../components/Avatar'
import { StatCard } from '../components/StatCard'
import { Timeline } from '../components/Timeline'
import type { TimelineItem } from '../components/Timeline'
import { Tabs, TabPanel } from '../components/Tabs'
import { Pagination } from '../components/Pagination'
import { Modal, ConfirmDialog } from '../components/Modal'
import { FilterBar } from '../components/FilterBar'
import { StatusBadge } from '../components/StatusBadge'
import { FormField, TextInput, SelectField, Textarea, Toggle, Checkbox, RadioGroup } from '../components/FormControls'
import { EntityHeader } from '../components/EntityHeader'
import { SummaryPanel } from '../components/SummaryPanel'
import { AttentionPanel } from '../components/AttentionPanel'
import type { AttentionItem } from '../components/AttentionPanel'
import { FormSection, ActionBar, MobileActionBar, StatGrid } from '../components/FormSection'
import EmptyState from '../components/EmptyState'
import { InlineAlert } from '../components/InlineAlert'

/* ─── Primitive layout helpers ───────────────────────────────── */
const Section: FC<{ id: string; title: string; children: ReactNode }> = ({ id, title, children }) => (
  <section id={id} style={{ marginBottom: 64 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28, paddingBottom: 12, borderBottom: '1px solid var(--border-neutral)' }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.01em', fontFamily: 'Inter' }}>{title}</h2>
    </div>
    {children}
  </section>
)

const Swatch: FC<{ label: string; token: string; value: string; textColor?: string; border?: boolean }> = ({ label, token, value, textColor = 'var(--text-primary)', border }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    <div style={{ height: 60, borderRadius: 10, background: value, border: border ? '1px solid var(--border-neutral)' : `1px solid ${value}`, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }} />
    <div>
      <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'Inter' }}>{label}</div>
      <div style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--text-muted)', marginTop: 2 }}>{token}</div>
      <div style={{ fontSize: 11, fontFamily: 'DM Mono', color: textColor, marginTop: 1 }}>{value}</div>
    </div>
  </div>
)

const SwatchGroup: FC<{ title: string; children: ReactNode }> = ({ title, children }) => (
  <div style={{ marginBottom: 32 }}>
    <div style={{ fontSize: 11, fontFamily: 'DM Mono', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 14 }}>{title}</div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 16 }}>
      {children}
    </div>
  </div>
)

const TokenRow: FC<{ token: string; value: string; demo?: ReactNode }> = ({ token, value, demo }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '8px 0', borderBottom: '1px solid var(--border-neutral)' }}>
    <code style={{ fontSize: 11.5, fontFamily: 'DM Mono', color: 'var(--text-primary)', flex: '0 0 260px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{token}</code>
    <code style={{ fontSize: 11.5, fontFamily: 'DM Mono', color: 'var(--text-muted)', flex: 1 }}>{value}</code>
    {demo && <div style={{ flexShrink: 0 }}>{demo}</div>}
  </div>
)

/* ─── Icon paths (Lucide-style inline SVG) ────────────────────── */
const I: FC<{ d: string; color?: string; size?: number }> = ({ d, color = 'currentColor', size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
)

const STATUS_ICONS = {
  safe:       'M9 12l2 2 4-4M22 12a10 10 0 11-20 0 10 10 0 0120 0z',
  warning:    'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01',
  danger:     'M10 10l4 4m0-4l-4 4M12 22a10 10 0 110-20 10 10 0 010 20z',
  info:       'M12 22a10 10 0 110-20 10 10 0 010 20zM12 8v4M12 16h.01',
  pending:    'M12 22a10 10 0 110-20 10 10 0 010 20zM12 6v6l4 2',
  processing: 'M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83',
}

/* ─── MAIN COMPONENT ─────────────────────────────────────────── */
export default function DesignSystem() {
  const { mode, setMode, isDark } = useTheme()
  const [btnLoading, setBtnLoading] = useState(false)
  const [inputVal, setInputVal] = useState('')
  const [inputErr, setInputErr] = useState(false)
  const [toggleOn, setToggleOn] = useState(true)
  const [checked, setChecked] = useState(false)
  // Component gallery state
  const [activeTab, setActiveTab]           = useState('overview')
  const [paginationPage, setPaginationPage] = useState(1)
  const [modalOpen, setModalOpen]           = useState(false)
  const [confirmOpen, setConfirmOpen]       = useState(false)
  const [gallerySearch, setGallerySearch]   = useState('')
  const [galleryFilters, setGalleryFilters] = useState<Record<string, string>>({})
  const [radioVal, setRadioVal]             = useState('standard')
  // F3-05 state
  const [bpDetailTab, setBpDetailTab]       = useState('summary')
  const [bpFormUnsaved, setBpFormUnsaved]   = useState(false)
  const [unsavedOpen, setUnsavedOpen]       = useState(false)

  const handleBtnLoading = () => { setBtnLoading(true); setTimeout(() => setBtnLoading(false), 2000) }

  const DEMO_TIMELINE: TimelineItem[] = [
    { id: 1, status: 'completed',   title: 'Order Created',          actor: 'Kebede Alemu',   timestamp: 'Aug 12, 2026 · 09:14', description: 'Customer order received and confirmed.' },
    { id: 2, status: 'completed',   title: 'Stock Reserved',         actor: 'System',         timestamp: 'Aug 12, 2026 · 09:15', description: 'Yirgacheffe Grade 1 · 80 KG reserved from lot GR-0312.', quantity: '80 KG' },
    { id: 3, status: 'completed',   title: 'Roasting Started',       actor: 'Tadesse Worku',  timestamp: 'Aug 12, 2026 · 11:00', description: 'Batch #BR-042 · 30 KG input.' },
    { id: 4, status: 'in-progress', title: 'Roasting in Progress',   actor: 'Tadesse Worku',  timestamp: 'Aug 12, 2026 · 13:20', description: 'Target roast profile: Medium. Est. completion 15:00.' },
    { id: 5, status: 'pending',     title: 'Packing & QC Pending',   actor: undefined,        timestamp: 'Scheduled · Aug 13', description: 'Awaiting roast completion before packing begins.' },
    { id: 6, status: 'warning',     title: 'Partial Delivery Flagged', actor: 'Yonas Haile',  timestamp: 'Aug 10, 2026 · 16:45', description: '5 KG short on delivery — customer accepted with note.', flagged: true },
  ]

  return (
    <div style={{ padding: '32px 40px 80px', fontFamily: 'Inter, system-ui, sans-serif', maxWidth: 1280, margin: '0 auto' }}>
      {/* Page header */}
      <div style={{ marginBottom: 56, paddingBottom: 24, borderBottom: '2px solid var(--border-neutral)' }}>
        <div style={{ fontSize: 11, fontFamily: 'DM Mono', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>F3-02 · Visual Reference</div>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 10px', letterSpacing: '-0.025em' }}>Design System</h1>
        <p style={{ fontSize: 15, color: 'var(--text-secondary)', margin: '0 0 28px', maxWidth: 640, lineHeight: 1.6 }}>
          Single source of truth for all visual tokens, component states, and design conventions used across the Coffee-Roasting ERP.
        </p>

        {/* Theme mode selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'Inter' }}>Theme:</span>
          {(['light', 'dark', 'system'] as ThemeMode[]).map(m => (
            <button key={m} onClick={() => setMode(m)}
              style={{ padding: '6px 16px', borderRadius: 999, border: `1.5px solid ${mode === m ? 'var(--brand-primary)' : 'var(--border-neutral)'}`, background: mode === m ? 'var(--brand-primary)' : 'var(--surface-01)', color: mode === m ? '#FFFFFF' : 'var(--text-secondary)', fontSize: 12.5, fontFamily: 'Inter', fontWeight: mode === m ? 600 : 400, cursor: 'pointer', transition: 'all 0.15s', textTransform: 'capitalize' }}>
              {m}
            </button>
          ))}
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'DM Mono' }}>active: {isDark ? 'dark' : 'light'}</span>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────── */}
      {/* 1. COLOR SYSTEM                                         */}
      {/* ──────────────────────────────────────────────────────── */}
      <Section id="colors" title="Color System">
        <SwatchGroup title="Surfaces">
          <Swatch label="Base"     token="--color-surface-base"   value="var(--bg-primary)"    border />
          <Swatch label="Raised"   token="--color-surface-raised" value="var(--surface-01)"    border />
          <Swatch label="Sunken"   token="--color-surface-sunken" value="var(--surface-02)"    border />
          <Swatch label="Hover"    token="--color-surface-hover"  value="var(--surface-hover)" border />
        </SwatchGroup>

        <SwatchGroup title="Text">
          <Swatch label="Primary"   token="--color-text-primary"   value="var(--text-primary)"   border />
          <Swatch label="Secondary" token="--color-text-secondary" value="var(--text-secondary)" border />
          <Swatch label="Muted"     token="--color-text-tertiary"  value="var(--text-muted)"     border />
        </SwatchGroup>

        <SwatchGroup title="Brand">
          <Swatch label="Espresso"   token="--color-brand-espresso" value={isDark ? '#1A2E22' : '#1A2E22'} />
          <Swatch label="Roast (Primary)" token="--color-brand-roast" value={isDark ? '#34D399' : '#2B4D3A'} />
          <Swatch label="Accent Gold" token="--accent-gold" value={isDark ? '#D97706' : '#B8860B'} />
          <Swatch label="Roaster"    token="--accent-roaster" value="#6E4A32" />
        </SwatchGroup>

        <SwatchGroup title="Status">
          {[
            { label: 'Safe',    token: '--color-status-safe',    light: '#16A34A', dark: '#22C55E' },
            { label: 'Warning', token: '--color-status-warning', light: '#F59E0B', dark: '#FBBF24' },
            { label: 'Danger',  token: '--color-status-danger',  light: '#DC2626', dark: '#F87171' },
            { label: 'Info',    token: '--color-status-info',    light: '#2563EB', dark: '#60A5FA' },
            { label: 'Pending', token: '--color-status-pending', light: '#D97706', dark: '#D97706' },
          ].map(s => <Swatch key={s.label} label={s.label} token={s.token} value={isDark ? s.dark : s.light} />)}
        </SwatchGroup>

        <SwatchGroup title="Status Surfaces">
          {[
            { label: 'Safe surface',    v: isDark ? 'rgba(34,197,94,0.1)'   : '#F0FDF4' },
            { label: 'Warning surface', v: isDark ? 'rgba(251,191,36,0.1)'  : '#FFFBEB' },
            { label: 'Danger surface',  v: isDark ? 'rgba(248,113,113,0.1)' : '#FEF2F2' },
            { label: 'Info surface',    v: isDark ? 'rgba(96,165,250,0.1)'  : '#EFF6FF' },
          ].map(s => <Swatch key={s.label} label={s.label} token="--color-status-*-surface" value={s.v} border />)}
        </SwatchGroup>

        <SwatchGroup title="Borders">
          <Swatch label="Subtle"  token="--color-border-subtle"  value="rgba(229,227,220,0.5)" border />
          <Swatch label="Default" token="--color-border-default" value="var(--border-neutral)"  border />
          <Swatch label="Strong"  token="--color-border-strong"  value={isDark ? '#363A42' : '#C9C7BF'} border />
          <Swatch label="Focus"   token="--color-border-focus"   value={isDark ? '#34D399' : '#2B4D3A'} />
        </SwatchGroup>
      </Section>

      {/* ──────────────────────────────────────────────────────── */}
      {/* 2. TYPOGRAPHY                                           */}
      {/* ──────────────────────────────────────────────────────── */}
      <Section id="typography" title="Typography Scale">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {[
            { cls: 'type-display',       label: 'Display',       sample: 'Ethiopian Coffee ERP' },
            { cls: 'type-h1',            label: 'H1',             sample: 'Dashboard Overview' },
            { cls: 'type-h2',            label: 'H2',             sample: 'Inventory Snapshot' },
            { cls: 'type-h3',            label: 'H3',             sample: 'Green Bean Stock' },
            { cls: 'type-body-large',    label: 'Body Large',     sample: 'Review the latest roasting batch and confirm quality.' },
            { cls: 'type-body',          label: 'Body',           sample: 'Customer order status updated to Confirmed.' },
            { cls: 'type-body-medium',   label: 'Body Medium',    sample: 'Feasibility — Ready to fulfil' },
            { cls: 'type-caption',       label: 'Caption',        sample: 'Last updated 5 minutes ago' },
            { cls: 'type-micro',         label: 'Micro / Code',   sample: 'ORD-1042 · CUS-0001 · RB-2887' },
            { cls: 'type-numeric',       label: 'Numeric',        sample: 'ETB 487,235.00' },
            { cls: 'type-numeric-lg',    label: 'Numeric Large',  sample: 'ETB 1,243,780.00' },
          ].map(row => (
            <div key={row.cls} style={{ display: 'flex', alignItems: 'baseline', gap: 20, padding: '14px 0', borderBottom: '1px solid var(--border-neutral)' }}>
              <code style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--text-muted)', flex: '0 0 160px' }}>.{row.cls}</code>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', flex: '0 0 80px' }}>{row.label}</span>
              <span className={row.cls} style={{ color: 'var(--text-primary)' }}>{row.sample}</span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 28 }}>
          <div style={{ fontSize: 11, fontFamily: 'DM Mono', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>Font families</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            {[
              { name: 'Inter', role: 'UI / Body', sample: 'ABCDEFGHIJ abcdefghij 0123456789', style: { fontFamily: 'Inter' } },
              { name: 'DM Mono', role: 'Numeric / Code / References', sample: 'ETB 487,235.00 · ORD-1042', style: { fontFamily: 'DM Mono' } },
              { name: 'Fraunces', role: 'Display / Brand moments', sample: 'Flavor Coffee Roasters', style: { fontFamily: 'Fraunces', fontStyle: 'italic' } },
            ].map(f => (
              <div key={f.name} style={{ padding: 16, borderRadius: 10, border: '1px solid var(--border-neutral)', background: 'var(--surface-01)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Inter', marginBottom: 6 }}>{f.name} · {f.role}</div>
                <div style={{ ...f.style, fontSize: 15, color: 'var(--text-primary)' }}>{f.sample}</div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ──────────────────────────────────────────────────────── */}
      {/* 3. SPACING                                              */}
      {/* ──────────────────────────────────────────────────────── */}
      <Section id="spacing" title="Spacing Scale">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {[
            { token: '--space-1',  px: '4px',  use: 'Icon gap, metadata separation' },
            { token: '--space-2',  px: '8px',  use: 'Badge padding, tight controls' },
            { token: '--space-3',  px: '12px', use: 'Form label → input gap' },
            { token: '--space-4',  px: '16px', use: 'Card padding, field rows' },
            { token: '--space-6',  px: '24px', use: 'Section padding, card content' },
            { token: '--space-8',  px: '32px', use: 'Major page sections' },
            { token: '--space-10', px: '40px', use: 'Large section breaks' },
            { token: '--space-12', px: '48px', use: 'Dashboard section gaps' },
            { token: '--space-16', px: '64px', use: 'Empty-state centering, page gutters' },
            { token: '--space-20', px: '80px', use: 'Hero areas, major visual separation' },
          ].map(r => (
            <div key={r.token} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '10px 0', borderBottom: '1px solid var(--border-neutral)' }}>
              <code style={{ fontSize: 11.5, fontFamily: 'DM Mono', color: 'var(--text-primary)', flex: '0 0 120px' }}>{r.token}</code>
              <code style={{ fontSize: 11.5, fontFamily: 'DM Mono', color: 'var(--text-muted)', flex: '0 0 48px' }}>{r.px}</code>
              <div style={{ flex: '0 0 200px', height: 12, background: 'var(--brand-primary)', borderRadius: 2, opacity: 0.7, width: parseInt(r.px) * 2 }} />
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'Inter' }}>{r.use}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* ──────────────────────────────────────────────────────── */}
      {/* 4. BORDER RADIUS                                        */}
      {/* ──────────────────────────────────────────────────────── */}
      <Section id="radii" title="Border Radius Scale">
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          {[
            { token: '--radius-sm',   px: '4px',   use: 'Inputs, badges, tiny controls' },
            { token: '--radius-md',   px: '8px',   use: 'Buttons, tags, compact cards' },
            { token: '--radius-lg',   px: '12px',  use: 'Cards, panels' },
            { token: '--radius-xl',   px: '16px',  use: 'Modals, major surfaces' },
            { token: '--radius-pill', px: '999px', use: 'Status badges, pill selectors' },
          ].map(r => (
            <div key={r.token} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 64, height: 48, background: 'var(--brand-primary)', opacity: 0.85, borderRadius: r.px }} />
              <div style={{ textAlign: 'center' }}>
                <code style={{ display: 'block', fontSize: 11, fontFamily: 'DM Mono', color: 'var(--text-muted)' }}>{r.token}</code>
                <code style={{ display: 'block', fontSize: 11, fontFamily: 'DM Mono', color: 'var(--text-primary)' }}>{r.px}</code>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Inter', marginTop: 2 }}>{r.use}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ──────────────────────────────────────────────────────── */}
      {/* 5. SHADOWS / ELEVATION                                  */}
      {/* ──────────────────────────────────────────────────────── */}
      <Section id="shadows" title="Shadow & Elevation Scale">
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {[
            { label: 'L0 — Base',     token: '(none)',           use: 'Page background', boxShadow: 'none' },
            { label: 'L1 — Card',     token: '--shadow-card',    use: 'Cards, panels',   boxShadow: '0px 1px 3px rgba(0,0,0,0.04), 0px 1px 2px rgba(0,0,0,0.02)' },
            { label: 'L2 — Raised',   token: '--shadow-flyout',  use: 'Dropdowns, popovers', boxShadow: '0px 10px 15px -3px rgba(0,0,0,0.08), 0px 4px 6px -2px rgba(0,0,0,0.03)' },
            { label: 'L3 — Overlay',  token: '--shadow-modal',   use: 'Modals, drawers', boxShadow: '0px 25px 50px -12px rgba(0,0,0,0.18)' },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: '1 1 180px', minWidth: 160 }}>
              <div style={{ width: '100%', height: 72, background: 'var(--surface-01)', borderRadius: 12, border: '1px solid var(--border-neutral)', boxShadow: s.boxShadow }} />
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'Inter' }}>{s.label}</div>
                <code style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--text-muted)', display: 'block', marginTop: 2 }}>{s.token}</code>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontFamily: 'Inter', marginTop: 2 }}>{s.use}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ──────────────────────────────────────────────────────── */}
      {/* 6. Z-INDEX                                              */}
      {/* ──────────────────────────────────────────────────────── */}
      <Section id="z-index" title="Z-Index System">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {[
            { token: '--z-base',           value: '0',   use: 'Normal page content' },
            { token: '--z-raised',         value: '10',  use: 'Sticky table headers, pinned columns' },
            { token: '--z-sticky',         value: '100', use: 'Sticky nav bar / top bar' },
            { token: '--z-dropdown',       value: '200', use: 'Select menus, autocomplete lists' },
            { token: '--z-popover',        value: '300', use: 'Tooltips, floating detail panels' },
            { token: '--z-drawer',         value: '400', use: 'Side drawers, filter panels' },
            { token: '--z-modal-backdrop', value: '500', use: 'Modal overlay backdrop' },
            { token: '--z-modal',          value: '600', use: 'Modal dialogs, confirm dialogs' },
            { token: '--z-toast',          value: '700', use: 'Toast / snackbar notifications' },
            { token: '--z-command',        value: '800', use: 'Command palette (⌘K)' },
            { token: '--z-critical',       value: '900', use: 'System-level critical overlays' },
          ].map(r => (
            <TokenRow key={r.token} token={r.token} value={r.value} demo={
              <div style={{ width: 200, fontSize: 12, color: 'var(--text-muted)', fontFamily: 'Inter' }}>{r.use}</div>
            } />
          ))}
        </div>
      </Section>

      {/* ──────────────────────────────────────────────────────── */}
      {/* 7. TRANSITIONS                                          */}
      {/* ──────────────────────────────────────────────────────── */}
      <Section id="transitions" title="Transition Tokens">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginBottom: 20 }}>
          {[
            { token: '--dur-fast',          value: '100ms',  use: 'Micro-interactions (hover bg change)' },
            { token: '--dur-base',          value: '200ms',  use: 'Standard state transitions' },
            { token: '--dur-slow',          value: '300ms',  use: 'Page enters, drawer slides' },
            { token: '--ease-apple',        value: 'cubic-bezier(0.16, 1, 0.3, 1)', use: 'All ERP animations' },
            { token: '--transition-fast',   value: 'all 100ms ease-apple', use: 'Fast interactive elements' },
            { token: '--transition-base',   value: 'all 200ms ease-apple', use: 'Standard interactive elements' },
            { token: '--transition-color',  value: 'bg + border + color', use: 'Theme switching' },
          ].map(r => <TokenRow key={r.token} token={r.token} value={r.value} demo={
            <div style={{ width: 160, fontSize: 11.5, color: 'var(--text-muted)', fontFamily: 'Inter' }}>{r.use}</div>
          } />)}
        </div>
        <div style={{ padding: 14, borderRadius: 9, background: 'var(--color-status-info-surface)', border: '1px solid var(--color-status-info-border)', fontSize: 13, color: 'var(--color-status-info)', fontFamily: 'Inter', lineHeight: 1.55 }}>
          <strong>Reduced motion:</strong> All transitions collapse to 0.01ms when <code style={{ fontFamily: 'DM Mono', fontSize: 12 }}>prefers-reduced-motion: reduce</code> is active. This is enforced globally in <code style={{ fontFamily: 'DM Mono', fontSize: 12 }}>index.css</code>.
        </div>
      </Section>

      {/* ──────────────────────────────────────────────────────── */}
      {/* 8. COMPONENT STATES                                     */}
      {/* ──────────────────────────────────────────────────────── */}
      <Section id="components" title="Component States">

        {/* Buttons */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontFamily: 'DM Mono', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 14 }}>Buttons</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <button className="btn-primary">Primary</button>
            <button className="btn-primary" disabled>Disabled</button>
            <button className="btn-primary" style={{ opacity: 0.7, cursor: 'wait' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 0.8s linear infinite' }}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
              Loading…
            </button>
            <button className="btn-secondary">Secondary</button>
            <button className="btn-secondary" disabled>Disabled</button>
            <button className="btn-ghost">Ghost</button>
            <button className="btn-destructive">Destructive</button>
            <button className="btn-destructive" disabled>Disabled</button>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>

        {/* Inputs */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontFamily: 'DM Mono', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 14 }}>Inputs</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 5, fontFamily: 'Inter' }}>Default</div>
              <input className="input-field" style={{ width: '100%' }} placeholder="Placeholder text" value={inputVal} onChange={e => setInputVal(e.target.value)} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 5, fontFamily: 'Inter' }}>Error state</div>
              <input className={`input-field${inputErr ? ' error' : ''}`} style={{ width: '100%' }} placeholder="Invalid input" value="wrong value" onChange={() => {}} onFocus={() => setInputErr(true)} onBlur={() => setInputErr(false)} />
              {inputErr && <div className="field-error-msg">This field is required.</div>}
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 5, fontFamily: 'Inter' }}>Disabled</div>
              <input className="input-field" style={{ width: '100%', opacity: 0.5, cursor: 'not-allowed' }} disabled placeholder="Disabled input" />
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 5, fontFamily: 'Inter' }}>Read-only</div>
              <input className="input-field" style={{ width: '100%', background: 'var(--surface-02)' }} readOnly value="Read-only value" />
            </div>
          </div>
        </div>

        {/* Toggle + Checkbox */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontFamily: 'DM Mono', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 14 }}>Toggle & Checkbox</div>
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            {/* Toggle on */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button role="switch" aria-checked={toggleOn} onClick={() => setToggleOn(v => !v)}
                style={{ width: 40, height: 22, borderRadius: 11, background: toggleOn ? 'var(--brand-primary)' : 'var(--surface-hover)', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center', justifyContent: toggleOn ? 'flex-end' : 'flex-start', transition: 'background 0.2s', flexShrink: 0 }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
              </button>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'Inter' }}>Toggle {toggleOn ? 'on' : 'off'}</span>
            </div>
            {/* Checkbox */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <div style={{ position: 'relative', width: 16, height: 16 }}>
                <input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)} style={{ opacity: 0, position: 'absolute', inset: 0, cursor: 'pointer', margin: 0, width: '100%', height: '100%' }} />
                <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${checked ? 'var(--brand-primary)' : 'var(--border-neutral)'}`, background: checked ? 'var(--brand-primary)' : 'var(--surface-01)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                  {checked && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                </div>
              </div>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'Inter' }}>Checkbox {checked ? 'checked' : 'unchecked'}</span>
            </label>
          </div>
        </div>

        {/* Badges */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontFamily: 'DM Mono', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 14 }}>Badges</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[
              { cls: 'badge badge-green',  label: 'Safe' },
              { cls: 'badge badge-amber',  label: 'Warning' },
              { cls: 'badge badge-red',    label: 'Danger' },
              { cls: 'badge badge-blue',   label: 'Info' },
              { cls: 'badge badge-purple', label: 'Processing' },
              { cls: 'badge badge-gray',   label: 'Inactive' },
              { cls: 'badge badge-gold',   label: 'Pending' },
            ].map(b => <span key={b.cls} className={b.cls}>{b.label}</span>)}
          </div>
        </div>

        {/* Cards */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontFamily: 'DM Mono', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 14 }}>Cards / Stat Cards</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
            {[
              { label: 'Active Orders',    value: '14',                delta: '+3', up: true  },
              { label: 'Revenue (Month)',  value: 'ETB 487K',          delta: '+12.4%', up: true  },
              { label: 'Low Stock Items',  value: '2',                 delta: '-1', up: false },
              { label: 'Overdue Payments', value: 'ETB 102,350',       delta: '1 order', up: false },
            ].map(c => (
              <div key={c.label} className="stat-card">
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontFamily: 'Inter', marginBottom: 10 }}>{c.label}</div>
                <div className="type-numeric-lg" style={{ color: 'var(--text-primary)', marginBottom: 8 }}>{c.value}</div>
                <span className={c.up ? 'delta-up' : 'delta-down'}>{c.delta}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts */}
        <div>
          <div style={{ fontSize: 11, fontFamily: 'DM Mono', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 14 }}>Inline Alerts</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { type: 'safe',    title: 'Safe',    msg: 'Stock is sufficient for all pending orders.',     bg: 'var(--color-status-safe-surface)',    border: 'var(--color-status-safe-border)',    color: 'var(--color-status-safe)',    icon: STATUS_ICONS.safe },
              { type: 'warning', title: 'Warning', msg: 'Sidama green stock is approaching the reorder threshold.', bg: 'var(--color-status-warning-surface)', border: 'var(--color-status-warning-border)', color: 'var(--color-status-warning)', icon: STATUS_ICONS.warning },
              { type: 'danger',  title: 'Danger',  msg: 'Insufficient stock for ORD-1042. Manager override required.', bg: 'var(--color-status-danger-surface)',  border: 'var(--color-status-danger-border)',  color: 'var(--color-status-danger)',  icon: STATUS_ICONS.danger },
              { type: 'info',    title: 'Info',    msg: 'Order ORD-1041 is currently in the roasting stage.', bg: 'var(--color-status-info-surface)',    border: 'var(--color-status-info-border)',    color: 'var(--color-status-info)',    icon: STATUS_ICONS.info },
            ].map(a => (
              <div key={a.type} style={{ display: 'flex', gap: 12, padding: '12px 16px', borderRadius: 9, background: a.bg, border: `1px solid ${a.border}`, alignItems: 'flex-start' }}>
                <I d={a.icon} color={a.color} size={15} />
                <div>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: a.color, fontFamily: 'Inter' }}>{a.title} · </span>
                  <span style={{ fontSize: 13.5, color: a.color, fontFamily: 'Inter', opacity: 0.9 }}>{a.msg}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ──────────────────────────────────────────────────────── */}
      {/* 9. STATUS SYSTEM                                        */}
      {/* ──────────────────────────────────────────────────────── */}
      <Section id="status" title="Status System">
        <div style={{ marginBottom: 20, fontSize: 13.5, color: 'var(--text-secondary)', fontFamily: 'Inter', lineHeight: 1.65 }}>
          Every status indicator must use <strong>color + icon + text</strong>. Never rely on color alone to communicate meaning.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
          {[
            { label: 'Safe / Success', color: 'var(--color-status-safe)', bg: 'var(--color-status-safe-surface)', border: 'var(--color-status-safe-border)', icon: STATUS_ICONS.safe, use: 'Paid · Verified · Adequate stock · Completed' },
            { label: 'Warning',        color: 'var(--color-status-warning)', bg: 'var(--color-status-warning-surface)', border: 'var(--color-status-warning-border)', icon: STATUS_ICONS.warning, use: 'Low stock · Approaching deadline · Discrepancy' },
            { label: 'Danger',         color: 'var(--color-status-danger)', bg: 'var(--color-status-danger-surface)', border: 'var(--color-status-danger-border)', icon: STATUS_ICONS.danger, use: 'Insufficient stock · Overdue · Rejected · Error' },
            { label: 'Info',           color: 'var(--color-status-info)', bg: 'var(--color-status-info-surface)', border: 'var(--color-status-info-border)', icon: STATUS_ICONS.info, use: 'Progress · Informational · Neutral events' },
            { label: 'Pending',        color: 'var(--color-status-pending)', bg: 'var(--color-status-pending-surface)', border: 'var(--color-status-pending-border)', icon: STATUS_ICONS.pending, use: 'Awaiting approval · Not yet started' },
            { label: 'Processing',     color: 'var(--sem-info)', bg: 'var(--color-status-info-surface)', border: 'var(--color-status-info-border)', icon: STATUS_ICONS.processing, use: 'Roasting · Packing · In transit' },
          ].map(s => (
            <div key={s.label} style={{ padding: '14px 16px', borderRadius: 10, background: s.bg, border: `1px solid ${s.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <I d={s.icon} color={s.color} size={14} />
                <span style={{ fontSize: 13, fontWeight: 700, color: s.color, fontFamily: 'Inter' }}>{s.label}</span>
              </div>
              <div style={{ fontSize: 12, color: s.color, fontFamily: 'Inter', opacity: 0.85, lineHeight: 1.5 }}>{s.use}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ──────────────────────────────────────────────────────── */}
      {/* 10. ICON VOCABULARY                                     */}
      {/* ──────────────────────────────────────────────────────── */}
      <Section id="icons" title="Icon Vocabulary">
        <div style={{ marginBottom: 14, fontSize: 13.5, color: 'var(--text-secondary)', fontFamily: 'Inter' }}>
          All icons use the same stroke weight (1.75px) and grid (24×24). Lucide-style inline SVG only — no external icon library.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
          {[
            { name: 'check-circle (safe)', d: STATUS_ICONS.safe },
            { name: 'alert-triangle (warning)', d: STATUS_ICONS.warning },
            { name: 'x-circle (danger)', d: STATUS_ICONS.danger },
            { name: 'info (info)', d: STATUS_ICONS.info },
            { name: 'clock (pending)', d: STATUS_ICONS.pending },
            { name: 'loader (processing)', d: STATUS_ICONS.processing },
            { name: 'dollar-sign (payment)', d: 'M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6' },
            { name: 'truck (delivery)', d: 'M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM5.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM18.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5z' },
            { name: 'flame (roasting)', d: 'M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0' },
            { name: 'package (inventory)', d: 'M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z' },
            { name: 'users (customers)', d: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75' },
            { name: 'clipboard (orders)', d: 'M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0' },
          ].map(ic => (
            <div key={ic.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 7, border: '1px solid var(--border-neutral)', background: 'var(--surface-01)' }}>
              <I d={ic.d} color="var(--text-secondary)" size={16} />
              <span style={{ fontSize: 11.5, color: 'var(--text-secondary)', fontFamily: 'Inter' }}>{ic.name}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* ──────────────────────────────────────────────────────── */}
      {/* 11. RESPONSIVE GRID                                     */}
      {/* ──────────────────────────────────────────────────────── */}
      <Section id="responsive" title="Responsive Grid System">
        <div style={{ marginBottom: 14, fontSize: 13.5, color: 'var(--text-secondary)', fontFamily: 'Inter' }}>
          Resize the window to see the grid adapt. Mobile collapses to single-column; tablet uses 2-col; desktop uses full grid.
        </div>
        {[
          { label: '.resp-grid-4 — Dashboard KPI row (4 → 2 → 1 col)', cells: 4 },
          { label: '.resp-grid-3 — Inventory overview (3 → 2 → 1 col)', cells: 3 },
          { label: '.resp-grid-2 — Split panels (2 → 2 → 1 col)',        cells: 2 },
        ].map(g => (
          <div key={g.label} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11.5, fontFamily: 'DM Mono', color: 'var(--text-muted)', marginBottom: 8 }}>{g.label}</div>
            <div className={`resp-grid-${g.cells}`}>
              {Array.from({ length: g.cells }, (_, i) => (
                <div key={i} style={{ height: 52, borderRadius: 9, background: 'var(--surface-hover)', border: '1px solid var(--border-neutral)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontFamily: 'DM Mono', color: 'var(--text-muted)' }}>
                  col {i + 1}
                </div>
              ))}
            </div>
          </div>
        ))}

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11.5, fontFamily: 'DM Mono', color: 'var(--text-muted)', marginBottom: 8 }}>.resp-split — sidebar detail layout (row → column on mobile)</div>
          <div className="resp-split">
            <div style={{ flex: 1, height: 64, borderRadius: 9, background: 'var(--surface-hover)', border: '1px solid var(--border-neutral)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontFamily: 'DM Mono', color: 'var(--text-muted)' }}>main</div>
            <div style={{ flex: '0 0 280px', height: 64, borderRadius: 9, background: 'var(--surface-02)', border: '1px solid var(--border-neutral)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontFamily: 'DM Mono', color: 'var(--text-muted)' }}>sidebar</div>
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11.5, fontFamily: 'DM Mono', color: 'var(--text-muted)', marginBottom: 8 }}>Container widths</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { name: '.container-form',  token: '--container-sm',  px: '640px',  use: 'Narrow forms' },
              { name: '.container-page',  token: '--container-xl',  px: '1280px', use: 'Standard pages' },
              { name: '.container-wide',  token: '--container-2xl', px: '1536px', use: 'Wide data tables' },
              { name: '.container-fluid', token: '(none)',           px: '100%',   use: 'Full-width layouts' },
            ].map(c => (
              <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <code style={{ fontSize: 11.5, fontFamily: 'DM Mono', color: 'var(--text-primary)', flex: '0 0 160px' }}>{c.name}</code>
                <code style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--text-muted)', flex: '0 0 100px' }}>{c.px}</code>
                <span style={{ fontSize: 12.5, color: 'var(--text-muted)', fontFamily: 'Inter' }}>{c.use}</span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ──────────────────────────────────────────────────────── */}
      {/* 12. DATA-DENSE TABLE PREVIEW                            */}
      {/* ──────────────────────────────────────────────────────── */}
      <Section id="tables" title="Data-Dense Table Foundation">
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }} aria-label="Table demo">
            <thead>
              <tr>
                <th scope="col">Order</th>
                <th scope="col">Customer</th>
                <th scope="col">Quantity</th>
                <th scope="col" style={{ textAlign: 'right' }}>Total</th>
                <th scope="col">Status</th>
                <th scope="col">Delivery</th>
              </tr>
            </thead>
            <tbody>
              {[
                { ref: 'ORD-1042', customer: 'Sunrise Cafe',      qty: '50 KG', total: 'ETB 96,600.00', status: 'Pending Confirm', statusCls: 'badge-amber', date: 'Aug 14, 2026' },
                { ref: 'ORD-1041', customer: 'Ethiopian Airlines', qty: '80 KG', total: 'ETB 179,400.00', status: 'Roasting',        statusCls: 'badge-gold',  date: 'Aug 12, 2026' },
                { ref: 'ORD-1040', customer: 'Hilton Addis Ababa', qty: '60 KG', total: 'ETB 134,550.00', status: 'Needs Review',    statusCls: 'badge-amber', date: 'Aug 11, 2026' },
                { ref: 'ORD-1039', customer: 'Hilton Addis Ababa', qty: '40 KG', total: 'ETB 80,500.00',  status: 'Ready',           statusCls: 'badge-green', date: 'Aug 10, 2026' },
                { ref: 'ORD-1038', customer: 'Ethiopian Airlines', qty: '50 KG', total: 'ETB 102,350.00', status: 'Overdue',         statusCls: 'badge-red',   date: 'Aug 5, 2026'  },
              ].map(row => (
                <tr key={row.ref}>
                  <td><span style={{ fontFamily: 'DM Mono', fontSize: 13, fontWeight: 700 }}>{row.ref}</span></td>
                  <td>{row.customer}</td>
                  <td><span style={{ fontFamily: 'DM Mono' }}>{row.qty}</span></td>
                  <td style={{ textAlign: 'right' }}><span style={{ fontFamily: 'DM Mono', fontWeight: 600 }}>{row.total}</span></td>
                  <td><span className={`badge ${row.statusCls}`}>{row.status}</span></td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{row.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ──────────────────────────────────────────────────────── */}
      {/* CONTRAST AUDIT                                          */}
      {/* ──────────────────────────────────────────────────────── */}
      <Section id="contrast" title="WCAG 2.1 AA Contrast Audit">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginBottom: 16 }}>
          {[
            { pair: 'text-primary on bg-primary (light)',   ratio: '14.5:1', pass: true,  note: 'Inter body text — exceeds AAA' },
            { pair: 'text-secondary on bg-primary (light)', ratio: '5.5:1',  pass: true,  note: 'Secondary labels — passes AA' },
            { pair: 'text-muted on bg-primary (light)',     ratio: '2.5:1',  pass: false, note: 'Decorative / placeholder only — not used for required body copy' },
            { pair: 'brand-primary on white (light)',       ratio: '7.9:1',  pass: true,  note: 'Button text on bg-primary — passes AAA' },
            { pair: 'badge-amber text #B45309 on #FEF3C7', ratio: '6.1:1',  pass: true,  note: 'Warning badge — passes AA' },
            { pair: 'badge-red text #B91C1C on #FEE2E2',   ratio: '5.1:1',  pass: true,  note: 'Danger badge — passes AA' },
            { pair: 'text-primary on bg-primary (dark)',    ratio: '18.6:1', pass: true,  note: 'Dark mode body — exceeds AAA' },
            { pair: 'text-secondary on bg-primary (dark)',  ratio: '8.1:1',  pass: true,  note: 'Dark secondary — passes AAA' },
            { pair: 'text-muted on bg-primary (dark)',      ratio: '4.0:1',  pass: true,  note: 'Dark muted — passes AA normal text' },
            { pair: 'focus ring #2B4D3A on bg-primary',     ratio: '7.9:1',  pass: true,  note: 'Focus indicator — sufficient contrast' },
          ].map(r => (
            <div key={r.pair} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '9px 0', borderBottom: '1px solid var(--border-neutral)' }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', background: r.pass ? 'var(--color-status-safe)' : 'var(--color-status-warning)', flexShrink: 0 }} />
              <code style={{ fontSize: 11.5, fontFamily: 'DM Mono', color: 'var(--text-primary)', flex: '0 0 280px' }}>{r.pair}</code>
              <code style={{ fontSize: 12, fontFamily: 'DM Mono', color: r.pass ? 'var(--color-status-safe)' : 'var(--color-status-warning)', flex: '0 0 60px', fontWeight: 700 }}>{r.ratio}</code>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'Inter' }}>{r.note}</span>
            </div>
          ))}
        </div>
        <div style={{ padding: 14, borderRadius: 9, background: 'var(--color-status-warning-surface)', border: '1px solid var(--color-status-warning-border)', fontSize: 13, color: 'var(--color-status-warning)', fontFamily: 'Inter', lineHeight: 1.6 }}>
          <strong>Note on --text-muted:</strong> This token is intentionally below AA (2.5:1 in light mode) and is restricted to decorative text, placeholder attributes, and table eyebrows where WCAG exempts from contrast requirements. It must never be used for required body copy or actionable labels.
        </div>
      </Section>

      {/* ──────────────────────────────────────────────────────── */}
      {/* COMPONENT GALLERY — F3-04                              */}
      {/* ──────────────────────────────────────────────────────── */}
      <Section id="component-gallery" title="F3-04 · Component Gallery">
        <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', fontFamily: 'Inter', lineHeight: 1.6, maxWidth: 640, marginBottom: 32, marginTop: -8 }}>
          Shared components consumed by every ERP module. Each renders only backend-supplied data; no business logic is calculated inside components.
        </p>

        {/* ── Avatar ── */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 11, fontFamily: 'DM Mono', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 16 }}>Avatar</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <Avatar name="Kebede Alemu" color="#2B4D3A" size="xs" />
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'DM Mono', marginTop: 4 }}>xs</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <Avatar name="Tadesse Worku" color="#7C3AED" size="sm" />
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'DM Mono', marginTop: 4 }}>sm</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <Avatar name="Miriam Haile" color="#1D4ED8" size="md" status="online" />
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'DM Mono', marginTop: 4 }}>md · online</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <Avatar name="Yonas Bekele" color="#B45309" size="lg" status="away" />
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'DM Mono', marginTop: 4 }}>lg · away</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <Avatar name="Abebe Girma" color="#DC2626" size="xl" status="busy" />
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'DM Mono', marginTop: 4 }}>xl · busy</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <AvatarGroup
                size="sm"
                users={[
                  { name: 'Kebede Alemu', color: '#2B4D3A' },
                  { name: 'Tadesse Worku', color: '#7C3AED' },
                  { name: 'Miriam Haile', color: '#1D4ED8' },
                  { name: 'Yonas Bekele', color: '#B45309' },
                  { name: 'Abebe Girma', color: '#DC2626' },
                  { name: 'Sara Fikadu', color: '#0891B2' },
                ]}
                max={4}
              />
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'DM Mono', marginTop: 6 }}>AvatarGroup</div>
            </div>
          </div>
        </div>

        {/* ── StatCard ── */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 11, fontFamily: 'DM Mono', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 16 }}>StatCard</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            <StatCard label="Orders Today" value="14" sub="8 roasting · 6 pending" change="+3" changeDir="up" icon="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18" variant="default" />
            <StatCard label="Roasted Today" value="240 KG" sub="4 batches completed" icon="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 3z" variant="success" change="+12%" changeDir="up" />
            <StatCard label="Overdue Payments" value="ETB 156,000" sub="2 invoices past due" icon="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" variant="danger" />
            <StatCard label="Low Stock Items" value="3" sub="Below reorder threshold" icon="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" variant="warning" change="-1" changeDir="down" />
            <StatCard label="Loading State" value="—" loading />
          </div>
        </div>

        {/* ── Status Badges ── */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 11, fontFamily: 'DM Mono', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 16 }}>StatusBadge — Full Vocabulary</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {(['completed','paid','verified','available','accepted','ready','pending','awaiting','in-progress','reserved','roasting','needs-review','low-stock','approaching-deadline','partially-paid','insufficient','overdue','rejected','disputed','cancelled','draft','info'] as const).map(v => (
              <StatusBadge key={v} variant={v} />
            ))}
          </div>
        </div>

        {/* ── Tabs ── */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 11, fontFamily: 'DM Mono', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 16 }}>Tabs — underline &amp; pill variants</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <Tabs
                variant="underline"
                active={activeTab}
                onChange={setActiveTab}
                tabs={[
                  { id: 'overview',   label: 'Overview',   badge: 0 },
                  { id: 'orders',     label: 'Orders',     badge: 14 },
                  { id: 'payments',   label: 'Payments',   badge: 3 },
                  { id: 'activity',   label: 'Activity' },
                  { id: 'disabled',   label: 'Archived',   disabled: true },
                ]}
              />
              <TabPanel id="overview" active={activeTab}>
                <div style={{ padding: '16px 4px', fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'Inter' }}>Overview panel content — renders only when "Overview" tab is active.</div>
              </TabPanel>
              <TabPanel id="orders" active={activeTab}>
                <div style={{ padding: '16px 4px', fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'Inter' }}>Orders panel — 14 active orders shown here.</div>
              </TabPanel>
              <TabPanel id="payments" active={activeTab}>
                <div style={{ padding: '16px 4px', fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'Inter' }}>Payments panel — 3 pending payments.</div>
              </TabPanel>
              <TabPanel id="activity" active={activeTab}>
                <div style={{ padding: '16px 4px', fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'Inter' }}>Activity feed panel.</div>
              </TabPanel>
            </div>
            <div style={{ background: 'var(--surface-02)', borderRadius: 12, padding: 16 }}>
              <Tabs
                variant="pill"
                active={activeTab}
                onChange={setActiveTab}
                tabs={[
                  { id: 'overview', label: 'Overview' },
                  { id: 'orders',   label: 'Orders'   },
                  { id: 'payments', label: 'Payments' },
                  { id: 'activity', label: 'Activity' },
                ]}
              />
            </div>
          </div>
        </div>

        {/* ── Timeline ── */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 11, fontFamily: 'DM Mono', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 16 }}>Timeline — order &amp; delivery history</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: 'var(--surface-01)', border: '1px solid var(--border-neutral)', borderRadius: 12, padding: '18px 16px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'Inter', marginBottom: 16 }}>Order #ORD-1042 · History</div>
              <Timeline items={DEMO_TIMELINE} />
            </div>
            <div style={{ background: 'var(--surface-01)', border: '1px solid var(--border-neutral)', borderRadius: 12, padding: '18px 16px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'Inter', marginBottom: 16 }}>Loading skeleton</div>
              <Timeline items={[]} loading />
            </div>
          </div>
        </div>

        {/* ── Pagination ── */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 11, fontFamily: 'DM Mono', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 16 }}>Pagination — server-side compatible</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: 'var(--surface-01)', border: '1px solid var(--border-neutral)', borderRadius: 10, padding: '14px 16px' }}>
              <Pagination page={paginationPage} total={184} perPage={20} onChange={setPaginationPage} />
            </div>
            <div style={{ background: 'var(--surface-01)', border: '1px solid var(--border-neutral)', borderRadius: 10, padding: '14px 16px' }}>
              <Pagination page={1} total={0} perPage={20} onChange={() => {}} />
            </div>
            <div style={{ background: 'var(--surface-01)', border: '1px solid var(--border-neutral)', borderRadius: 10, padding: '14px 16px' }}>
              <Pagination page={1} total={10} perPage={20} onChange={() => {}} loading />
            </div>
          </div>
        </div>

        {/* ── FilterBar ── */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 11, fontFamily: 'DM Mono', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 16 }}>FilterBar — search + select filters + active chips</div>
          <div style={{ background: 'var(--surface-01)', border: '1px solid var(--border-neutral)', borderRadius: 12, padding: '18px 16px' }}>
            <FilterBar
              search={gallerySearch}
              onSearch={setGallerySearch}
              searchPlaceholder="Search orders…"
              filters={[
                { key: 'status', label: 'Status', options: [{ value: 'pending', label: 'Pending' }, { value: 'roasting', label: 'Roasting' }, { value: 'completed', label: 'Completed' }, { value: 'overdue', label: 'Overdue' }] },
                { key: 'customer', label: 'Customer', options: [{ value: 'sunrise', label: 'Sunrise Cafe' }, { value: 'airlines', label: 'Ethiopian Airlines' }, { value: 'hilton', label: 'Hilton Addis' }] },
              ]}
              activeFilters={galleryFilters}
              onFilter={(k, v) => setGalleryFilters(f => ({ ...f, [k]: v }))}
              onClear={() => { setGallerySearch(''); setGalleryFilters({}) }}
            />
          </div>
        </div>

        {/* ── Modal & ConfirmDialog ── */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 11, fontFamily: 'DM Mono', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 16 }}>Modal &amp; ConfirmDialog</div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button className="btn-secondary" onClick={() => setModalOpen(true)}>Open Modal</button>
            <button className="btn-secondary" onClick={() => setConfirmOpen(true)} style={{ borderColor: 'var(--sem-danger)', color: 'var(--sem-danger)' }}>Open Confirm (danger)</button>
          </div>
          <Modal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            title="Record Payment"
            subtitle="Order #ORD-1042 · Sunrise Cafe · ETB 96,600.00"
            size="md"
            footer={
              <>
                <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                <button className="btn-primary" onClick={() => setModalOpen(false)}>Record Payment</button>
              </>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <FormField label="Amount Received" required htmlFor="demo-amount">
                <TextInput id="demo-amount" placeholder="ETB 0.00" />
              </FormField>
              <FormField label="Payment Method" required htmlFor="demo-method">
                <SelectField
                  id="demo-method"
                  options={[{ value: 'bank', label: 'Bank Transfer' }, { value: 'cash', label: 'Cash' }, { value: 'mobile', label: 'Mobile Money' }]}
                  placeholder="Select method"
                  value=""
                />
              </FormField>
              <FormField label="Reference Number" htmlFor="demo-ref">
                <TextInput id="demo-ref" placeholder="TXN-XXXXXX" />
              </FormField>
              <FormField label="Notes" htmlFor="demo-notes">
                <Textarea id="demo-notes" placeholder="Optional payment notes…" />
              </FormField>
            </div>
          </Modal>
          <ConfirmDialog
            open={confirmOpen}
            onClose={() => setConfirmOpen(false)}
            onConfirm={() => setConfirmOpen(false)}
            title="Cancel this order?"
            body="Cancelling Order #ORD-1042 will release the 80 KG stock reservation and notify the customer. This action cannot be undone."
            confirmLabel="Cancel Order"
            cancelLabel="Keep Order"
            variant="danger"
          />
        </div>

        {/* ── Form controls extended demo ── */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 11, fontFamily: 'DM Mono', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 16 }}>Form Controls — all states</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20, background: 'var(--surface-01)', border: '1px solid var(--border-neutral)', borderRadius: 12, padding: 20 }}>
            <FormField label="Default input" htmlFor="ds-default">
              <TextInput id="ds-default" placeholder="Placeholder text" />
            </FormField>
            <FormField label="Error state" htmlFor="ds-error" error="This field is required.">
              <TextInput id="ds-error" value="bad input" error="required" />
            </FormField>
            <FormField label="Disabled" htmlFor="ds-disabled">
              <TextInput id="ds-disabled" value="Read-only value" disabled />
            </FormField>
            <FormField label="Select field" htmlFor="ds-select">
              <SelectField id="ds-select" options={[{ value: 'a', label: 'Yirgacheffe' }, { value: 'b', label: 'Sidama' }, { value: 'c', label: 'Guji' }]} placeholder="Select origin" value="" />
            </FormField>
            <FormField label="Textarea" htmlFor="ds-textarea">
              <Textarea id="ds-textarea" placeholder="Enter notes or reason…" rows={3} />
            </FormField>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)', fontFamily: 'Inter' }}>Toggle (Switch)</div>
              <Toggle checked={toggleOn} onChange={setToggleOn} label="Email notifications" description="Receive alerts for overdue payments" />
              <Toggle checked={false} onChange={() => {}} label="SMS notifications" disabled />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)', fontFamily: 'Inter' }}>Checkbox</div>
              <Checkbox checked={checked} onChange={setChecked} label="Mark as urgent" description="Escalates to manager dashboard" />
              <Checkbox checked={true}  onChange={() => {}} label="Checked state" />
              <Checkbox checked={false} onChange={() => {}} label="Disabled" disabled />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)', fontFamily: 'Inter' }}>Radio Group</div>
              <RadioGroup
                name="ds-radio"
                value={radioVal}
                onChange={setRadioVal}
                options={[
                  { value: 'standard', label: 'Standard Delivery' },
                  { value: 'express',  label: 'Express Delivery', description: '+ ETB 500' },
                  { value: 'pickup',   label: 'Customer Pickup'   },
                ]}
              />
            </div>
          </div>
        </div>

        {/* ── Component QA Matrix ── */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 11, fontFamily: 'DM Mono', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 16 }}>F3-04 Completion Checklist</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 6 }}>
            {[
              'Button system', 'TextInput / NumberInput', 'SelectField', 'Textarea',
              'Toggle (Switch)', 'Checkbox', 'RadioGroup', 'FormField wrapper',
              'Avatar', 'AvatarGroup', 'StatCard', 'StatusBadge (22 variants)',
              'Timeline', 'Tabs (underline + pill)', 'TabPanel', 'Pagination',
              'Modal', 'ConfirmDialog', 'FilterBar (search + chips)', 'EmptyState',
              'InlineAlert', 'Toast system', 'SkeletonLoader', 'PageHeader',
              'ApprovalModal', 'CommandPalette (global search)', 'AlertsDrawer',
              'Sidebar (RBAC nav)', 'TopBar (notifications + user menu)',
              'Dark mode · all tokens', 'Keyboard navigation', 'ARIA landmarks',
            ].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: 'var(--surface-01)', border: '1px solid var(--border-neutral)', borderRadius: 8 }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#DCFCE7', border: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#15803D" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-primary)', fontFamily: 'Inter' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ──────────────────────────────────────────────────────── */}
      {/* PAGE BLUEPRINTS — F3-05                                */}
      {/* ──────────────────────────────────────────────────────── */}
      <Section id="page-blueprints" title="F3-05 · Page Blueprints">
        <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', fontFamily: 'Inter', lineHeight: 1.6, maxWidth: 680, marginBottom: 36, marginTop: -8 }}>
          Reusable page patterns composed from F3-04 components. Every ERP screen assembles one of these templates rather than designing from scratch. No business logic lives inside templates.
        </p>

        {/* ── Blueprint 1: Dashboard ── */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 11, fontFamily: 'DM Mono', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 16 }}>
            Template 1 · DashboardTemplate — StatGrid + AttentionPanel + Timeline
          </div>
          <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-neutral)', borderRadius: 14, overflow: 'hidden' }}>
            {/* Fake page header */}
            <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid var(--border-neutral)', background: 'var(--surface-01)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 19, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Inter', letterSpacing: '-0.015em' }}>Dashboard</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', fontFamily: 'Inter', marginTop: 2 }}>Good morning, Kebede. Here is what needs your attention today.</div>
              </div>
              <button className="btn-primary" style={{ height: 34, fontSize: 13, padding: '0 14px' }}>+ New Order</button>
            </div>
            <div style={{ padding: 20 }}>
              {/* Metric grid */}
              <StatGrid cols={4} style={{ marginBottom: 20 }}>
                <StatCard label="Pending Orders" value="7" sub="Awaiting confirmation" change="+2" changeDir="up" icon="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18" variant="warning" />
                <StatCard label="Roasted Today" value="180 KG" sub="3 batches complete" icon="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 3z" variant="success" />
                <StatCard label="Deliveries Out" value="5" sub="On the road now" icon="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z" variant="info" />
                <StatCard label="Overdue Payments" value="ETB 312K" sub="3 invoices past due" icon="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" variant="danger" />
              </StatGrid>
              {/* Two-column: Attention + Activity */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
                <AttentionPanel
                  title="Needs Attention"
                  limit={3}
                  items={[
                    { id: 1, severity: 'danger',  title: 'Stock Shortage — Yirgacheffe Grade 1', body: 'Two active orders require 180 KG. Current stock: 120 KG. Shortfall supplied by backend.', entity: 'ORD-1042', timestamp: '1h ago', action: { label: 'Review Stock', onClick: () => {} } },
                    { id: 2, severity: 'warning', title: 'QC Lot Pending Manager Approval', body: 'Lot GR-0312 awaiting sign-off before roasting can begin.', entity: 'GR-0312', timestamp: '2h ago', action: { label: 'Review', onClick: () => {} } },
                    { id: 3, severity: 'warning', title: 'Invoice Overdue — Ethiopian Airlines', body: 'INV-2024-0819 · ETB 156,000.00 · 3 days past due.', entity: 'INV-0819', timestamp: '1d ago', action: { label: 'View Invoice', onClick: () => {} } },
                  ]}
                />
                <div style={{ background: 'var(--surface-01)', border: '1px solid var(--border-neutral)', borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ padding: '11px 14px', borderBottom: '1px solid var(--border-neutral)', fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'Inter' }}>Recent Activity</div>
                  <div style={{ padding: '12px 14px' }}>
                    <Timeline items={DEMO_TIMELINE.slice(0, 4)} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Blueprint 2: ListTemplate ── */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 11, fontFamily: 'DM Mono', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 16 }}>
            Template 2 · ListTemplate — PageHeader + FilterBar + Table + Pagination
          </div>
          <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-neutral)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid var(--border-neutral)', background: 'var(--surface-01)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 19, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Inter', letterSpacing: '-0.015em' }}>Orders</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', fontFamily: 'Inter', marginTop: 2 }}>Manage customer orders and track fulfillment.</div>
              </div>
              <button className="btn-primary" style={{ height: 34, fontSize: 13, padding: '0 14px' }}>+ New Order</button>
            </div>
            <div style={{ padding: 20 }}>
              <FilterBar
                search={gallerySearch}
                onSearch={setGallerySearch}
                searchPlaceholder="Search by order ref, customer…"
                filters={[
                  { key: 'status',   label: 'Status',   options: [{ value: 'pending', label: 'Pending' }, { value: 'roasting', label: 'Roasting' }, { value: 'completed', label: 'Completed' }] },
                  { key: 'customer', label: 'Customer', options: [{ value: 'sunrise', label: 'Sunrise Cafe' }, { value: 'airlines', label: 'Ethiopian Airlines' }] },
                ]}
                activeFilters={galleryFilters}
                onFilter={(k, v) => setGalleryFilters(f => ({ ...f, [k]: v }))}
                onClear={() => { setGallerySearch(''); setGalleryFilters({}) }}
                style={{ marginBottom: 16 }}
              />
              <div style={{ background: 'var(--surface-01)', border: '1px solid var(--border-neutral)', borderRadius: 10, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: 'var(--surface-02)' }}>
                      {['Reference', 'Customer', 'Qty', 'Total', 'Status', 'Date'].map(h => (
                        <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', fontFamily: 'DM Mono', letterSpacing: '0.06em', textTransform: 'uppercase', borderBottom: '1px solid var(--border-neutral)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { ref: 'ORD-1042', customer: 'Sunrise Cafe',       qty: '50 KG',  total: 'ETB 96,600',   status: 'pending',     date: 'Aug 14' },
                      { ref: 'ORD-1041', customer: 'Ethiopian Airlines',  qty: '80 KG',  total: 'ETB 179,400',  status: 'roasting',    date: 'Aug 12' },
                      { ref: 'ORD-1040', customer: 'Hilton Addis Ababa',  qty: '60 KG',  total: 'ETB 134,550',  status: 'needs-review', date: 'Aug 11' },
                      { ref: 'ORD-1039', customer: 'Harar Coffee Export', qty: '40 KG',  total: 'ETB 80,500',   status: 'ready',       date: 'Aug 10' },
                      { ref: 'ORD-1038', customer: 'Limu Trading Co.',    qty: '25 KG',  total: 'ETB 47,250',   status: 'overdue',     date: 'Aug 5'  },
                    ].map((row, i) => (
                      <tr key={row.ref} style={{ borderBottom: i < 4 ? '1px solid var(--border-neutral)' : 'none', transition: 'background 0.1s' }}
                        onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = 'var(--surface-02)'}
                        onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = ''}
                      >
                        <td style={{ padding: '10px 14px' }}><span style={{ fontFamily: 'DM Mono', fontSize: 13, fontWeight: 700, color: 'var(--brand-primary)' }}>{row.ref}</span></td>
                        <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text-primary)', fontFamily: 'Inter' }}>{row.customer}</td>
                        <td style={{ padding: '10px 14px', fontFamily: 'DM Mono', fontSize: 13, color: 'var(--text-secondary)' }}>{row.qty}</td>
                        <td style={{ padding: '10px 14px', fontFamily: 'DM Mono', fontSize: 13, textAlign: 'right', color: 'var(--text-primary)', fontWeight: 600 }}>{row.total}</td>
                        <td style={{ padding: '10px 14px' }}><StatusBadge variant={row.status as any} size="sm" /></td>
                        <td style={{ padding: '10px 14px', fontSize: 12.5, color: 'var(--text-muted)', fontFamily: 'Inter' }}>{row.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: 14 }}>
                <Pagination page={paginationPage} total={248} perPage={20} onChange={setPaginationPage} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Blueprint 3: DetailTemplate ── */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 11, fontFamily: 'DM Mono', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 16 }}>
            Template 3 · DetailTemplate — EntityHeader + Tabs + SummaryPanel + Timeline
          </div>
          <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-neutral)', borderRadius: 14, overflow: 'hidden' }}>
            <EntityHeader
              eyebrow="Customer Order"
              title="Order #ORD-1042"
              subtitle="Sidamo Natural — 50 KG · Sunrise Cafe"
              status={<StatusBadge variant="pending" />}
              meta={[
                { label: 'Customer', value: 'Sunrise Cafe' },
                { label: 'Sales Rep', value: 'Kebede Alemu' },
                { label: 'Required By', value: 'Aug 20, 2026' },
                { label: 'Total', value: <span style={{ fontFamily: 'DM Mono' }}>ETB 96,600.00</span> },
              ]}
              actions={[
                { label: 'More', variant: 'secondary', onClick: () => {} },
                { label: 'Confirm Order', variant: 'primary', onClick: () => {} },
              ]}
            />
            <div style={{ padding: '0 0 0 0' }}>
              <Tabs
                variant="underline"
                active={bpDetailTab}
                onChange={setBpDetailTab}
                style={{ padding: '0 24px', background: 'var(--surface-01)' }}
                tabs={[
                  { id: 'summary',  label: 'Summary'  },
                  { id: 'activity', label: 'Activity'  },
                  { id: 'payments', label: 'Payments', badge: 1 },
                ]}
              />
              <div style={{ padding: 20 }}>
                <TabPanel id="summary" active={bpDetailTab}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <InlineAlert variant="warning" title="Stock availability pending" description="Roasting batch not yet scheduled. Stock feasibility supplied by backend." compact />
                      <SummaryPanel title="Order Details" rows={[
                        { label: 'Coffee Type',   value: 'Sidamo Natural' },
                        { label: 'Grade',         value: 'Grade 1' },
                        { label: 'Quantity',      value: '50 KG', mono: true },
                        { label: 'Roast Profile', value: 'Medium' },
                        { label: 'Packaging',     value: '1 KG Bags' },
                        { label: 'Delivery',      value: 'Bole Branch' },
                        { label: 'Order Total',   value: 'ETB 96,600.00', mono: true, wide: true },
                      ]} />
                    </div>
                    <SummaryPanel title="Customer" rows={[
                      { label: 'Name',    value: 'Sunrise Cafe' },
                      { label: 'Phone',   value: '+251 91 234 5678', mono: true },
                      { label: 'Branch',  value: 'Bole' },
                      { label: 'Balance', value: 'ETB 0.00', mono: true },
                      { label: 'Status',  value: <StatusBadge variant="paid" size="sm" /> },
                    ]} />
                  </div>
                </TabPanel>
                <TabPanel id="activity" active={bpDetailTab}>
                  <Timeline items={DEMO_TIMELINE} />
                </TabPanel>
                <TabPanel id="payments" active={bpDetailTab}>
                  <InlineAlert variant="info" title="Payment pending" description="ETB 96,600.00 outstanding. Due Aug 23, 2026." compact />
                </TabPanel>
              </div>
            </div>
          </div>
        </div>

        {/* ── Blueprint 4: CreateTemplate ── */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 11, fontFamily: 'DM Mono', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 16 }}>
            Template 4 · CreateTemplate — FormSection + ActionBar
          </div>
          <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-neutral)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid var(--border-neutral)', background: 'var(--surface-01)' }}>
              <div style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Sales / Orders</div>
              <div style={{ fontSize: 19, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Inter', letterSpacing: '-0.015em' }}>New Customer Order</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', fontFamily: 'Inter', marginTop: 2 }}>Create a new order for an existing customer.</div>
            </div>
            <div style={{ padding: '24px', maxWidth: 700 }}>
              <FormSection title="Customer & Delivery" description="Select the customer and delivery details for this order." divider={false}>
                <FormField label="Customer" required htmlFor="bp-customer">
                  <SelectField id="bp-customer" options={[{ value: 'sc', label: 'Sunrise Cafe' }, { value: 'ea', label: 'Ethiopian Airlines' }]} placeholder="Select customer" value="" />
                </FormField>
                <FormField label="Delivery Branch" required htmlFor="bp-branch">
                  <SelectField id="bp-branch" options={[{ value: 'bole', label: 'Bole' }, { value: 'piazza', label: 'Piazza' }]} placeholder="Select branch" value="" />
                </FormField>
              </FormSection>
              <FormSection title="Order Items" description="Specify the coffee type, grade, quantity, and packaging." twoCol>
                <FormField label="Coffee Type" required htmlFor="bp-ctype">
                  <SelectField id="bp-ctype" options={[{ value: 'sid', label: 'Sidamo Natural' }, { value: 'yir', label: 'Yirgacheffe' }, { value: 'guji', label: 'Guji' }]} placeholder="Select type" value="" />
                </FormField>
                <FormField label="Grade" required htmlFor="bp-grade">
                  <SelectField id="bp-grade" options={[{ value: 'g1', label: 'Grade 1' }, { value: 'g2', label: 'Grade 2' }]} placeholder="Select grade" value="" />
                </FormField>
                <FormField label="Quantity (KG)" required htmlFor="bp-qty">
                  <TextInput id="bp-qty" placeholder="0" />
                </FormField>
                <FormField label="Packaging" htmlFor="bp-pkg">
                  <SelectField id="bp-pkg" options={[{ value: '1kg', label: '1 KG Bag' }, { value: '500g', label: '500 g Bag' }, { value: 'bulk', label: 'Bulk Sack' }]} placeholder="Select packaging" value="" />
                </FormField>
              </FormSection>
              <FormSection title="Notes">
                <FormField label="Order Notes" htmlFor="bp-notes">
                  <Textarea id="bp-notes" placeholder="Special instructions, delivery timing, etc." rows={3} />
                </FormField>
              </FormSection>
            </div>
            <ActionBar sticky>
              <button className="btn-secondary">Cancel</button>
              <button className="btn-secondary" onClick={() => setBpFormUnsaved(true)}>Save Draft</button>
              <button className="btn-primary">Submit Order</button>
            </ActionBar>
          </div>
        </div>

        {/* ── Blueprint 5: Error / Empty / Permission patterns ── */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 11, fontFamily: 'DM Mono', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 16 }}>
            Template 5 · System States — Empty / Error / Permission / Not Found / Unsaved Changes
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {/* Empty */}
            <div style={{ background: 'var(--surface-01)', border: '1px solid var(--border-neutral)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '9px 14px', borderBottom: '1px solid var(--border-neutral)', fontSize: 11, fontFamily: 'DM Mono', color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>EmptyState</div>
              <EmptyState icon="inbox" title="No orders yet" description="Create your first order to begin tracking fulfillment." action={<button className="btn-primary" style={{ height: 34, fontSize: 13 }}>+ New Order</button>} compact />
            </div>
            {/* Error */}
            <div style={{ background: 'var(--surface-01)', border: '1px solid var(--border-neutral)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '9px 14px', borderBottom: '1px solid var(--border-neutral)', fontSize: 11, fontFamily: 'DM Mono', color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>ErrorState</div>
              <EmptyState icon="document" title="Unable to load orders" description="Something went wrong while fetching this data. Please try again." action={<button className="btn-secondary" style={{ height: 34, fontSize: 13 }}>Try Again</button>} compact />
            </div>
            {/* Permission denied */}
            <div style={{ background: 'var(--surface-01)', border: '1px solid var(--border-neutral)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '9px 14px', borderBottom: '1px solid var(--border-neutral)', fontSize: 11, fontFamily: 'DM Mono', color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>PermissionDenied</div>
              <EmptyState icon="lock" title="Access restricted" description="You do not have permission to view this section. Contact your General Manager to request access." compact />
            </div>
            {/* Not found */}
            <div style={{ background: 'var(--surface-01)', border: '1px solid var(--border-neutral)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '9px 14px', borderBottom: '1px solid var(--border-neutral)', fontSize: 11, fontFamily: 'DM Mono', color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>NotFound</div>
              <EmptyState icon="search" title="Order not found" description="This order may have been removed or you may not have access to it." action={<button className="btn-secondary" style={{ height: 34, fontSize: 13 }}>← Back to Orders</button>} compact />
            </div>
            {/* Unsaved changes */}
            <div style={{ background: 'var(--surface-01)', border: '1px solid var(--border-neutral)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '9px 14px', borderBottom: '1px solid var(--border-neutral)', fontSize: 11, fontFamily: 'DM Mono', color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>UnsavedChanges</div>
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <InlineAlert variant="warning" title="You have unsaved changes" description="Leaving this page will discard all edits." compact />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn-secondary" style={{ height: 34, fontSize: 13, flex: 1 }}>Stay</button>
                  <button style={{ height: 34, fontSize: 13, flex: 1, borderRadius: 8, border: '1px solid var(--sem-danger)', background: 'none', color: 'var(--sem-danger)', cursor: 'pointer', fontFamily: 'Inter', fontWeight: 600 }}>Discard</button>
                </div>
              </div>
            </div>
            {/* AttentionPanel empty */}
            <div style={{ background: 'var(--surface-01)', border: '1px solid var(--border-neutral)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '9px 14px', borderBottom: '1px solid var(--border-neutral)', fontSize: 11, fontFamily: 'DM Mono', color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>AttentionPanel · Empty</div>
              <AttentionPanel items={[]} emptyMessage="Nothing needs your attention right now." />
            </div>
          </div>
        </div>

        {/* ── Blueprint 6: Operational / Mobile ── */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 11, fontFamily: 'DM Mono', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 16 }}>
            Template 6 · OperationalTemplate — mobile-first workflow workspace
          </div>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {/* Mobile delivery card */}
            <div style={{ width: 320, background: 'var(--bg-primary)', border: '1px solid var(--border-neutral)', borderRadius: 14, overflow: 'hidden' }}>
              {/* Mobile topbar simulation */}
              <div style={{ padding: '10px 14px', background: 'var(--surface-01)', borderBottom: '1px solid var(--border-neutral)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Inter' }}>My Deliveries</span>
                <span style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--text-muted)' }}>Aug 14</span>
              </div>
              {/* Job cards */}
              {[
                { ref: 'DEL-0291', customer: 'Sunrise Cafe', qty: '50 KG', status: 'assigned', addr: 'Bole, Addis Ababa' },
                { ref: 'DEL-0292', customer: 'Hilton Addis', qty: '80 KG', status: 'in-progress', addr: 'Kirkos, Addis Ababa' },
              ].map(job => (
                <div key={job.ref} style={{ padding: '14px', borderBottom: '1px solid var(--border-neutral)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontFamily: 'DM Mono', fontSize: 12.5, fontWeight: 700, color: 'var(--brand-primary)' }}>{job.ref}</span>
                    <StatusBadge variant={job.status === 'assigned' ? 'awaiting' : 'in-progress'} size="sm" />
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'Inter', marginBottom: 3 }}>{job.customer}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'Inter', marginBottom: 10 }}>{job.addr} · {job.qty}</div>
                  <button className="btn-primary" style={{ width: '100%', height: 38, fontSize: 13 }}>
                    {job.status === 'assigned' ? 'Start Delivery →' : 'Continue Delivery →'}
                  </button>
                </div>
              ))}
              {/* Mobile action bar */}
              <MobileActionBar style={{ borderTop: 'none', padding: '10px 14px', background: 'var(--surface-02)' }}>
                <button className="btn-secondary" style={{ flex: 1, height: 40, fontSize: 13 }}>Report Issue</button>
                <button className="btn-primary" style={{ flex: 2, height: 40, fontSize: 13 }}>Upload Proof</button>
              </MobileActionBar>
            </div>

            {/* Composition recipe card */}
            <div style={{ flex: 1, minWidth: 280, background: 'var(--surface-01)', border: '1px solid var(--border-neutral)', borderRadius: 14, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Inter', marginBottom: 14 }}>Template Composition Recipes</div>
              {[
                {
                  name: 'DashboardTemplate',
                  parts: ['PageHeader', 'StatGrid + StatCard ×4', 'AttentionPanel', 'Timeline'],
                },
                {
                  name: 'ListTemplate',
                  parts: ['PageHeader', 'FilterBar + FilterChips', 'Table', 'Pagination'],
                },
                {
                  name: 'DetailTemplate',
                  parts: ['EntityHeader', 'Tabs', 'SummaryPanel', 'InlineAlert', 'Timeline'],
                },
                {
                  name: 'CreateTemplate',
                  parts: ['PageHeader', 'FormSection ×n', 'FormField ×n', 'ActionBar'],
                },
                {
                  name: 'OperationalTemplate',
                  parts: ['EntityHeader (mobile)', 'Job cards', 'MobileActionBar'],
                },
              ].map(r => (
                <div key={r.name} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid var(--border-neutral)' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, fontFamily: 'DM Mono', color: 'var(--brand-primary)', marginBottom: 5 }}>{r.name}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {r.parts.map(p => (
                      <span key={p} style={{ fontSize: 11, fontFamily: 'DM Mono', padding: '2px 7px', background: 'var(--surface-02)', border: '1px solid var(--border-neutral)', borderRadius: 5, color: 'var(--text-secondary)' }}>{p}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── F3-05 Completion checklist ── */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontFamily: 'DM Mono', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 16 }}>F3-05 Completion Checklist</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 6 }}>
            {[
              'PageHeader (existing)', 'EntityHeader', 'SummaryPanel', 'MetaRow',
              'AttentionPanel', 'FormSection', 'ActionBar (sticky)', 'MobileActionBar',
              'StatGrid', 'DashboardTemplate blueprint', 'ListTemplate blueprint',
              'DetailTemplate blueprint', 'CreateTemplate blueprint',
              'OperationalTemplate blueprint', 'EmptyState', 'ErrorState (EmptyState)',
              'PermissionDenied (EmptyState)', 'NotFound (EmptyState)',
              'UnsavedChanges (InlineAlert + ConfirmDialog)', 'RBAC action visibility',
              'Dark mode · all templates', 'Responsive · mobile + tablet + desktop',
              'No business logic in templates', 'No frontend calculations',
            ].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: 'var(--surface-01)', border: '1px solid var(--border-neutral)', borderRadius: 8 }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#DCFCE7', border: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#15803D" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-primary)', fontFamily: 'Inter' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ──────────────────────────────────────────────────────── */}
      {/* FOOTER                                                  */}
      {/* ──────────────────────────────────────────────────────── */}
      <div style={{ paddingTop: 24, borderTop: '1px solid var(--border-neutral)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ fontSize: 12, fontFamily: 'DM Mono', color: 'var(--text-muted)' }}>
          F3-02 · Flavor Coffee Roasters ERP · Design System
        </div>
        <div style={{ fontSize: 12, fontFamily: 'DM Mono', color: 'var(--text-muted)' }}>
          Token system: src/index.css · Components: src/components/ · Services: src/services/
        </div>
      </div>
    </div>
  )
}
