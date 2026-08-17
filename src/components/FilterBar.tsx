/**
 * FilterBar — search + select filters + active-filter chips + clear.
 * The component manages display only; actual filtering is done by the page/service.
 */
import { useRef, type FC, type CSSProperties } from 'react'

export interface FilterOption { value: string; label: string }

export interface FilterConfig {
  key:          string
  label:        string
  options:      FilterOption[]
  placeholder?: string
}

interface FilterBarProps {
  search?:         string
  onSearch?:       (v: string) => void
  searchPlaceholder?: string
  filters?:        FilterConfig[]
  activeFilters?:  Record<string, string>
  onFilter?:       (key: string, value: string) => void
  onClear?:        () => void
  loading?:        boolean
  style?:          CSSProperties
  /** Extra content after the filter controls */
  trailing?:       React.ReactNode
}

export const FilterBar: FC<FilterBarProps> = ({
  search = '',
  onSearch,
  searchPlaceholder = 'Search…',
  filters = [],
  activeFilters = {},
  onFilter,
  onClear,
  loading,
  style,
  trailing,
}) => {
  const searchRef = useRef<HTMLInputElement>(null)

  const activeCount = Object.values(activeFilters).filter(v => v && v !== '' && v !== 'all').length
  const hasSearch   = search.trim().length > 0
  const hasAny      = activeCount > 0 || hasSearch

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, ...style }}>
      {/* Controls row */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        {onSearch !== undefined && (
          <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 180, maxWidth: 320 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"
              style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              ref={searchRef}
              type="search"
              placeholder={searchPlaceholder}
              value={search}
              onChange={e => onSearch(e.target.value)}
              disabled={loading}
              style={{
                width: '100%', height: 36, padding: '0 34px 0 34px',
                borderRadius: 8, border: '1px solid var(--border-neutral)',
                background: 'var(--surface-01)', color: 'var(--text-primary)',
                fontSize: 13, fontFamily: 'Inter', outline: 'none', boxSizing: 'border-box',
                transition: 'border-color 0.12s, box-shadow 0.12s',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = '#2B4D3A'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(43,77,58,0.08)' }}
              onBlur={e =>  { e.currentTarget.style.borderColor = 'var(--border-neutral)'; e.currentTarget.style.boxShadow = 'none' }}
            />
            {search && (
              <button onClick={() => onSearch('')} aria-label="Clear search"
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            )}
          </div>
        )}

        {/* Select filters */}
        {filters.map(f => (
          <select
            key={f.key}
            value={activeFilters[f.key] ?? ''}
            disabled={loading}
            aria-label={f.label}
            onChange={e => onFilter?.(f.key, e.target.value)}
            style={{
              height: 36, padding: '0 30px 0 10px', borderRadius: 8,
              border: `1px solid ${activeFilters[f.key] && activeFilters[f.key] !== 'all' ? '#2B4D3A' : 'var(--border-neutral)'}`,
              background: activeFilters[f.key] && activeFilters[f.key] !== 'all' ? 'rgba(43,77,58,0.06)' : 'var(--surface-01)',
              color: 'var(--text-primary)', fontSize: 13, fontFamily: 'Inter', outline: 'none',
              appearance: 'none', cursor: 'pointer', flexShrink: 0,
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center',
            }}
          >
            <option value="">{f.placeholder ?? f.label}</option>
            {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ))}

        {trailing}

        {/* Clear all */}
        {hasAny && onClear && (
          <button
            onClick={onClear}
            style={{
              height: 36, padding: '0 12px', borderRadius: 8,
              border: '1px solid var(--border-neutral)', background: 'none',
              fontSize: 12.5, color: 'var(--text-muted)', cursor: 'pointer',
              fontFamily: 'Inter', display: 'flex', alignItems: 'center', gap: 5,
              transition: 'all 0.12s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#2B4D3A'; e.currentTarget.style.color = '#2B4D3A' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-neutral)'; e.currentTarget.style.color = 'var(--text-muted)' }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            Clear{activeCount > 0 ? ` (${activeCount})` : ''}
          </button>
        )}
      </div>

      {/* Active filter chips */}
      {activeCount > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {filters.filter(f => activeFilters[f.key] && activeFilters[f.key] !== '' && activeFilters[f.key] !== 'all').map(f => {
            const opt = f.options.find(o => o.value === activeFilters[f.key])
            return (
              <div key={f.key} style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '3px 6px 3px 9px', borderRadius: 999,
                background: 'rgba(43,77,58,0.08)', border: '1px solid rgba(43,77,58,0.2)',
                fontSize: 12, color: '#2B4D3A', fontFamily: 'Inter',
              }}>
                <span style={{ fontWeight: 400, color: 'rgba(43,77,58,0.6)' }}>{f.label}:</span>
                <span style={{ fontWeight: 600 }}>{opt?.label ?? activeFilters[f.key]}</span>
                <button
                  onClick={() => onFilter?.(f.key, '')}
                  aria-label={`Remove ${f.label} filter`}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(43,77,58,0.6)', padding: 1, display: 'flex', lineHeight: 1 }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default FilterBar
