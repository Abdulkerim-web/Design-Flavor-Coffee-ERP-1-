/* Responsive: mobile ≤640 | tablet 641–1024 | laptop 1025–1440 | desktop >1440 */
import { useState } from 'react'
import { useBreakpoint } from '../hooks/useBreakpoint'
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts'

/* ── Data ───────────────────────────────────────────── */
const RECEIVING_QUEUE = [
  {
    id: 'INSP-2026-8813', arrivalDate: '2026-08-06 07:30', supplier: 'Hambela Wamena Coffee Estate',
    origin: 'Guji Zone', declaredWeight: 600.00, vehicle: 'AA 3-71829 (Isuzu NPR)',
    driver: 'Mulatu Haile', poRef: 'PO-2835', priority: 'normal',
  },
  {
    id: 'INSP-2026-8812', arrivalDate: '2026-08-06 06:45', supplier: 'Jimma Farmers Coop',
    origin: 'Jimma Zone', declaredWeight: 980.00, vehicle: 'AA 4-10234 (Mitsubishi Canter)',
    driver: 'Tesfaye Worku', poRef: 'PO-2828', priority: 'high',
  },
]

const COMPLETED = [
  { id: 'QC-9024', lot: 'GRN-SID-2026-011', supplier: 'Bekele Agro Export',    origin: 'Sidama',      date: '2026-08-04', inspector: 'Selamawit Bekele', moisture: 13.9, defects: 12, screenSize: 95, visual: 5.5, aroma: 5.0, cupScore: 76.2, verdict: 'rejected',  weight: 620  },
  { id: 'QC-9023', lot: 'GRN-LMU-2026-003', supplier: 'Jimma Farmers Coop',    origin: 'Limu',        date: '2026-08-04', inspector: 'Henok Tadesse',    moisture: 11.4, defects:  2, screenSize: 97, visual: 8.5, aroma: 8.2, cupScore: 85.8, verdict: 'approved', weight: 980  },
  { id: 'QC-9022', lot: 'GRN-BMJ-2026-002', supplier: 'Kaffa Forest Coffee',   origin: 'Bench Maji',  date: '2026-08-03', inspector: 'Selamawit Bekele', moisture: 11.0, defects:  4, screenSize: 94, visual: 8.8, aroma: 9.0, cupScore: 87.3, verdict: 'approved', weight: 1800 },
  { id: 'QC-9021', lot: 'GRN-HRR-2026-007', supplier: 'Harar Coffee Union',    origin: 'Harrar',      date: '2026-08-02', inspector: 'Henok Tadesse',    moisture: 11.8, defects:  6, screenSize: 91, visual: 7.8, aroma: 7.5, cupScore: 82.4, verdict: 'approved', weight: 700  },
  { id: 'QC-9020', lot: 'GRN-GUJ-2026-001', supplier: 'Kayon Mountain Farm',   origin: 'Guji',        date: '2026-08-01', inspector: 'Selamawit Bekele', moisture: 11.2, defects:  3, screenSize: 96, visual: 9.0, aroma: 8.8, cupScore: 88.5, verdict: 'approved', weight: 500  },
  { id: 'QC-9019', lot: 'GRN-YRG-2026-014', supplier: 'Worka Washing Station', origin: 'Yirgacheffe', date: '2026-07-28', inspector: 'Henok Tadesse',    moisture: 10.8, defects:  1, screenSize: 98, visual: 9.5, aroma: 9.2, cupScore: 90.1, verdict: 'approved', weight: 1200 },
]

const SPEC_THRESHOLDS = {
  moisture:   { min: 10.0, max: 12.0, unit: '%',     label: 'Optimal: 10.0% – 12.0%' },
  defects:    { min: 0,    max: 8,    unit: '/300g',  label: 'Max allowed: 8 defects / 300g' },
  screenSize: { min: 88,   max: 100,  unit: '%',      label: 'Uniformity ≥ 88%' },
  visual:     { min: 7,    max: 10,   unit: '/10',    label: 'Acceptable: ≥ 7.0 / 10' },
  aroma:      { min: 7,    max: 10,   unit: '/10',    label: 'Acceptable: ≥ 7.0 / 10' },
}

type WorkspaceState = 'queue' | 'inspect' | 'committed'

/* ── Helpers ────────────────────────────────────────── */
function fieldStatus(key: keyof typeof SPEC_THRESHOLDS, val: number | '') {
  if (val === '') return 'empty'
  const t = SPEC_THRESHOLDS[key]
  return val >= t.min && val <= t.max ? 'pass' : 'fail'
}

function FieldIcon({ status }: { status: 'pass' | 'fail' | 'empty' }) {
  if (status === 'empty') return <div style={{ width: 20, height: 20 }} />
  return status === 'pass' ? (
    <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#F0FDF4', border: '1.5px solid #16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
    </div>
  ) : (
    <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#FEF2F2', border: '1.5px solid #DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </div>
  )
}

function VerdictBadge({ verdict }: { verdict: string }) {
  const m: Record<string, { bg: string; text: string; label: string }> = {
    approved: { bg: '#F0FDF4', text: '#15803D', label: 'Approved' },
    rejected: { bg: '#FEF2F2', text: '#B91C1C', label: 'Rejected' },
    hold:     { bg: '#FEF3C7', text: '#B45309', label: 'On Hold'  },
  }
  const s = m[verdict] ?? { bg: '#F5F3EF', text: '#6B7280', label: verdict }
  return <span style={{ fontSize: 11.5, fontFamily: 'DM Mono', padding: '3px 9px', borderRadius: 999, background: s.bg, color: s.text, fontWeight: 700, letterSpacing: '0.03em' }}>{s.label}</span>
}

/* ── Inspection Workspace ───────────────────────────── */
function InspectionWorkspace({
  lot, onBack, onCommit,
}: {
  lot: typeof RECEIVING_QUEUE[0]
  onBack: () => void
  onCommit: (verdict: 'approved' | 'rejected', data: any) => void
}) {
  const { isMobile } = useBreakpoint()
  const [moisture,   setMoisture]   = useState<number | ''>('')
  const [defects,    setDefects]    = useState<number | ''>('')
  const [screenSize, setScreenSize] = useState<number | ''>('')
  const [visual,     setVisual]     = useState<number | ''>('')
  const [aroma,      setAroma]      = useState<number | ''>('')
  const [notes,      setNotes]      = useState('')
  const [decision,   setDecision]   = useState<'approved' | 'rejected' | null>(null)
  const [rejReason,  setRejReason]  = useState('')
  const [submitting, setSubmitting] = useState(false)

  const mStatus = fieldStatus('moisture',   moisture)
  const dStatus = fieldStatus('defects',    defects)
  const sStatus = fieldStatus('screenSize', screenSize)
  const vStatus = fieldStatus('visual',     visual)
  const aStatus = fieldStatus('aroma',      aroma)

  const allFilled   = moisture !== '' && defects !== '' && screenSize !== '' && visual !== '' && aroma !== ''
  const allPass     = allFilled && [mStatus, dStatus, sStatus, vStatus, aStatus].every(s => s === 'pass')
  const anyFail     = allFilled && [mStatus, dStatus, sStatus, vStatus, aStatus].some(s => s === 'fail')
  const autoDecision = allFilled ? (allPass ? 'approved' : 'rejected') : null

  // Auto-set decision when all fields filled
  const effectiveDecision = decision ?? autoDecision

  const cupScore = (moisture !== '' && visual !== '' && aroma !== '')
    ? +((Number(visual) * 10 + Number(aroma) * 10) / 2).toFixed(1)
    : null

  const canCommit = allFilled && effectiveDecision !== null && (effectiveDecision === 'approved' || rejReason !== '')

  const handleCommit = () => {
    if (!canCommit) return
    setSubmitting(true)
    setTimeout(() => {
      onCommit(effectiveDecision!, { moisture, defects, screenSize, visual, aroma, notes, rejReason, cupScore })
    }, 800)
  }

  const NumInput = ({
    label, value, onChange, spec, step = 0.1, max = 100, status,
  }: {
    label: string; value: number | ''; onChange: (v: number | '') => void
    spec: string; step?: number; max?: number; status: 'pass' | 'fail' | 'empty'
  }) => (
    <div>
      <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', fontFamily: 'Inter', display: 'block', marginBottom: 8 }}>{label}</label>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            type="number" min={0} max={max} step={step} value={value}
            onChange={e => onChange(e.target.value === '' ? '' : parseFloat(e.target.value))}
            style={{
              width: '100%', padding: '9px 12px', borderRadius: 8,
              border: `1.5px solid ${status === 'fail' ? '#DC2626' : status === 'pass' ? '#16A34A' : '#E5E3DC'}`,
              background: status === 'fail' ? '#FEF2F2' : status === 'pass' ? '#F0FDF4' : '#FAFAF8',
              fontSize: 14, fontFamily: 'DM Mono', color: 'var(--text-primary)', outline: 'none',
              fontWeight: 600, boxSizing: 'border-box' as const,
              transition: 'border-color 0.15s, background 0.15s',
            }}
          />
        </div>
        <FieldIcon status={status} />
      </div>
      <div style={{ marginTop: 5, fontSize: 11.5, fontFamily: 'DM Mono', color: status === 'fail' ? '#DC2626' : '#9CA3AF' }}>
        {status === 'fail' ? '⚠ Out of specification' : spec}
      </div>
    </div>
  )

  return (
    <div style={{ padding: '0 0 40px' }}>
      {/* Workspace header */}
      <div style={{ background: 'var(--surface-01)', borderBottom: '1px solid var(--border-neutral)', padding: '18px 32px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-secondary)', fontSize: 13, fontFamily: 'Inter', padding: 0, transition: 'color 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.color = '#2B4D3A'}
          onMouseLeave={e => e.currentTarget.style.color = '#6B7280'}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          Back to Queue
        </button>
        <div style={{ width: 1, height: 20, background: 'var(--border-neutral)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B', boxShadow: '0 0 0 3px rgba(245,158,11,0.2)', animation: 'statusPulse 2.5s ease-in-out infinite' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Quality Inspection Engine</span>
          <span style={{ fontFamily: 'DM Mono', fontSize: 13, color: '#2B4D3A', fontWeight: 700 }}>{lot.id}</span>
        </div>
        <div style={{ display: 'flex', gap: 16, flexShrink: 0 }}>
          {[
            ['Supplier',  lot.supplier],
            ['Origin',    lot.origin],
            ['Weight',    `${lot.declaredWeight.toLocaleString(undefined,{minimumFractionDigits:2})} KG`],
            ['PO Ref',    lot.poRef],
          ].map(([k, v]) => (
            <div key={String(k)} style={{ textAlign: 'right' as const }}>
              <div style={{ fontSize: 10, fontFamily: 'DM Mono', color: 'var(--text-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>{k}</div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', marginTop: 1 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '28px 32px' }}>
        {/* Live status strip */}
        {allFilled && (
          <div style={{
            marginBottom: 20, padding: '12px 18px',
            background: anyFail ? '#FEF3C7' : '#F0FDF4',
            border: `1px solid ${anyFail ? '#FEF3C7' : '#DCFCE7'}`,
            borderLeft: `4px solid ${anyFail ? '#F59E0B' : '#16A34A'}`,
            borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={anyFail ? '#F59E0B' : '#16A34A'} strokeWidth="2">
              {anyFail
                ? <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>
                : <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>
              }
            </svg>
            <div style={{ fontSize: 13, fontWeight: 600, color: anyFail ? '#B45309' : '#15803D' }}>
              {anyFail
                ? 'One or more parameters outside specification — recommended decision: Reject'
                : 'All parameters within specification — lot qualifies for approval'
              }
            </div>
            {cupScore !== null && (
              <div style={{ marginLeft: 'auto', fontFamily: 'DM Mono', fontSize: 13, fontWeight: 700, color: anyFail ? '#B45309' : '#15803D' }}>
                Est. Cup Score: {cupScore}/100
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 400px', gap: 24, alignItems: 'start' }}>

          {/* ── LEFT: Inspection Form ── */}
          <div>
            <div className="stat-card">
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Inspection Parameters</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 22 }}>Measure and enter all values against ECFSA specification thresholds</div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                <NumInput label="Moisture Content (%)" value={moisture} onChange={setMoisture}
                  spec={SPEC_THRESHOLDS.moisture.label} step={0.1} max={25} status={mStatus} />
                <NumInput label="Defect Count (per 300g)" value={defects} onChange={setDefects}
                  spec={SPEC_THRESHOLDS.defects.label} step={1} max={100} status={dStatus} />
                <NumInput label="Screen Size Uniformity (%)" value={screenSize} onChange={setScreenSize}
                  spec={SPEC_THRESHOLDS.screenSize.label} step={1} max={100} status={sStatus} />

                {/* Visual Score — custom range slider */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', fontFamily: 'Inter', display: 'block', marginBottom: 8 }}>
                    Visual Assessment Score (1–10)
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input type="range" min={1} max={10} step={0.5} value={visual === '' ? 5 : visual}
                      onChange={e => setVisual(parseFloat(e.target.value))}
                      style={{ flex: 1, accentColor: vStatus === 'pass' ? '#16A34A' : vStatus === 'fail' ? '#DC2626' : '#2B4D3A', height: 4, cursor: 'pointer' }}
                    />
                    <div style={{
                      minWidth: 44, padding: '4px 8px', borderRadius: 6, textAlign: 'center' as const,
                      border: `1.5px solid ${vStatus === 'pass' ? '#16A34A' : vStatus === 'fail' ? '#DC2626' : '#E5E3DC'}`,
                      background: vStatus === 'pass' ? '#F0FDF4' : vStatus === 'fail' ? '#FEF2F2' : '#FAFAF8',
                      fontFamily: 'DM Mono', fontSize: 14, fontWeight: 700,
                      color: vStatus === 'pass' ? '#15803D' : vStatus === 'fail' ? '#B91C1C' : '#6B7280',
                    }}>
                      {visual === '' ? '—' : Number(visual).toFixed(1)}
                    </div>
                    <FieldIcon status={vStatus} />
                  </div>
                  <div style={{ marginTop: 5, fontSize: 11.5, fontFamily: 'DM Mono', color: 'var(--text-muted)' }}>{SPEC_THRESHOLDS.visual.label}</div>
                </div>

                {/* Aroma Score */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', fontFamily: 'Inter', display: 'block', marginBottom: 8 }}>
                    Aroma & Cupping Profile (1–10)
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input type="range" min={1} max={10} step={0.5} value={aroma === '' ? 5 : aroma}
                      onChange={e => setAroma(parseFloat(e.target.value))}
                      style={{ flex: 1, accentColor: aStatus === 'pass' ? '#16A34A' : aStatus === 'fail' ? '#DC2626' : '#2B4D3A', height: 4, cursor: 'pointer' }}
                    />
                    <div style={{
                      minWidth: 44, padding: '4px 8px', borderRadius: 6, textAlign: 'center' as const,
                      border: `1.5px solid ${aStatus === 'pass' ? '#16A34A' : aStatus === 'fail' ? '#DC2626' : '#E5E3DC'}`,
                      background: aStatus === 'pass' ? '#F0FDF4' : aStatus === 'fail' ? '#FEF2F2' : '#FAFAF8',
                      fontFamily: 'DM Mono', fontSize: 14, fontWeight: 700,
                      color: aStatus === 'pass' ? '#15803D' : aStatus === 'fail' ? '#B91C1C' : '#6B7280',
                    }}>
                      {aroma === '' ? '—' : Number(aroma).toFixed(1)}
                    </div>
                    <FieldIcon status={aStatus} />
                  </div>
                  <div style={{ marginTop: 5, fontSize: 11.5, fontFamily: 'DM Mono', color: 'var(--text-muted)' }}>{SPEC_THRESHOLDS.aroma.label}</div>
                </div>
              </div>

              {/* Inspector Notes */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', fontFamily: 'Inter', display: 'block', marginBottom: 8 }}>
                  Inspector Notes
                </label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="Describe cup profile, any concerns, storage conditions observed..."
                  rows={3}
                  style={{
                    width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid var(--border-neutral)',
                    background: 'var(--bg-primary)', fontSize: 13, color: 'var(--text-primary)', fontFamily: 'Inter',
                    outline: 'none', resize: 'vertical' as const, boxSizing: 'border-box' as const, lineHeight: '20px',
                  }}
                />
              </div>

              {/* Inspector stamp */}
              <div style={{ marginTop: 16, padding: '10px 14px', background: 'var(--surface-02)', borderRadius: 8, border: '1px solid var(--border-neutral)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#2B4D3A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#FFF' }}>SB</div>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>Selamawit Bekele</div>
                    <div style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--text-muted)' }}>QC Inspector · USR-006</div>
                  </div>
                </div>
                <div style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--text-muted)' }}>
                  {new Date().toLocaleDateString()} · {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Decision Engine ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Spec Checklist */}
            <div className="stat-card">
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>Parameter Check</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Moisture Content',      status: mStatus, value: moisture,   unit: '%'    },
                  { label: 'Defect Count',           status: dStatus, value: defects,    unit: '/300g' },
                  { label: 'Screen Uniformity',      status: sStatus, value: screenSize, unit: '%'    },
                  { label: 'Visual Assessment',      status: vStatus, value: visual,     unit: '/10'  },
                  { label: 'Aroma / Cupping',        status: aStatus, value: aroma,      unit: '/10'  },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: 7, background: item.status === 'pass' ? '#F0FDF4' : item.status === 'fail' ? '#FEF2F2' : '#FAFAF8', border: `1px solid ${item.status === 'pass' ? '#DCFCE7' : item.status === 'fail' ? '#FECACA' : '#E5E3DC'}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: item.status === 'pass' ? '#16A34A' : item.status === 'fail' ? '#DC2626' : '#D0CEC6', flexShrink: 0 }} />
                      <span style={{ fontSize: 12.5, color: 'var(--text-primary)', fontWeight: 500 }}>{item.label}</span>
                    </div>
                    <span style={{ fontFamily: 'DM Mono', fontSize: 12.5, fontWeight: 700, color: item.status === 'pass' ? '#15803D' : item.status === 'fail' ? '#B91C1C' : '#9CA3AF' }}>
                      {item.value === '' ? '—' : `${item.value}${item.unit}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Decision Toggle */}
            <div className="stat-card" style={{ padding: '20px' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Quality Decision Engine</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>Select final verdict for lot {lot.id}</div>

              {/* Segmented toggle */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
                <button
                  onClick={() => setDecision('approved')}
                  style={{
                    padding: '14px 10px', borderRadius: 10, cursor: 'pointer', fontFamily: 'Inter',
                    border: `2px solid ${effectiveDecision === 'approved' ? '#16A34A' : '#E5E3DC'}`,
                    background: effectiveDecision === 'approved' ? '#F0FDF4' : '#FAFAF8',
                    transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: effectiveDecision === 'approved' ? '#16A34A' : '#E5E3DC',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background 0.2s',
                  }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={effectiveDecision === 'approved' ? '#FFFFFF' : '#9CA3AF'} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: effectiveDecision === 'approved' ? '#15803D' : '#6B7280', letterSpacing: '0.03em' }}>APPROVED</div>
                </button>

                <button
                  onClick={() => setDecision('rejected')}
                  style={{
                    padding: '14px 10px', borderRadius: 10, cursor: 'pointer', fontFamily: 'Inter',
                    border: `2px solid ${effectiveDecision === 'rejected' ? '#DC2626' : '#E5E3DC'}`,
                    background: effectiveDecision === 'rejected' ? '#FEF2F2' : '#FAFAF8',
                    transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: effectiveDecision === 'rejected' ? '#DC2626' : '#E5E3DC',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background 0.2s',
                  }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={effectiveDecision === 'rejected' ? '#FFFFFF' : '#9CA3AF'} strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: effectiveDecision === 'rejected' ? '#B91C1C' : '#6B7280', letterSpacing: '0.03em' }}>REJECTED</div>
                </button>
              </div>

              {/* Dynamic decision banner */}
              {effectiveDecision === 'approved' && (
                <div style={{ marginBottom: 16, padding: '14px 16px', background: '#F0FDF4', border: '1px solid #DCFCE7', borderLeft: '4px solid #16A34A', borderRadius: 8, animation: 'expandRow 0.2s ease' }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: '#15803D', marginBottom: 5 }}>
                    ✓ PASS — All parameters within specification
                  </div>
                  <div style={{ fontSize: 12, color: '#16A34A', lineHeight: '18px', marginBottom: 8 }}>
                    Approval unlocks entry into Green Coffee Inventory. System will auto-assign a Batch SKU and generate a receiving record.
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
                    <span style={{ fontSize: 11, fontFamily: 'DM Mono', padding: '2px 8px', background: '#DCFCE7', color: '#15803D', borderRadius: 4 }}>Inventory unlocked</span>
                    <span style={{ fontSize: 11, fontFamily: 'DM Mono', padding: '2px 8px', background: '#DCFCE7', color: '#15803D', borderRadius: 4 }}>SKU auto-assigned</span>
                    <span style={{ fontSize: 11, fontFamily: 'DM Mono', padding: '2px 8px', background: '#DCFCE7', color: '#15803D', borderRadius: 4 }}>Audit trail created</span>
                  </div>
                </div>
              )}

              {effectiveDecision === 'rejected' && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ padding: '14px 16px', background: '#FEF2F2', border: '1px solid #FECACA', borderLeft: '4px solid #DC2626', borderRadius: 8, marginBottom: 12, animation: 'expandRow 0.2s ease' }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#B91C1C', marginBottom: 5 }}>
                      ✕ LOT LOCKED — Entry into inventory prevented
                    </div>
                    <div style={{ fontSize: 12, color: '#DC2626', lineHeight: '18px', marginBottom: 8 }}>
                      This lot is blocked from entering inventory. A Supplier Return Voucher will be auto-generated and sent to Procurement.
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
                      <span style={{ fontSize: 11, fontFamily: 'DM Mono', padding: '2px 8px', background: '#FEE2E2', color: '#B91C1C', borderRadius: 4 }}>Inventory blocked</span>
                      <span style={{ fontSize: 11, fontFamily: 'DM Mono', padding: '2px 8px', background: '#FEE2E2', color: '#B91C1C', borderRadius: 4 }}>Return voucher issued</span>
                    </div>
                  </div>
                  {/* Rejection reason */}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', fontFamily: 'Inter', display: 'block', marginBottom: 6 }}>
                      Rejection Reason <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <select value={rejReason} onChange={e => setRejReason(e.target.value)} style={{
                      width: '100%', padding: '9px 12px', borderRadius: 8,
                      border: `1.5px solid ${rejReason ? '#DC2626' : '#FECACA'}`,
                      background: '#FEF2F2', fontSize: 13, color: rejReason ? '#B91C1C' : '#9CA3AF',
                      fontFamily: 'Inter', outline: 'none', cursor: 'pointer', appearance: 'none' as const,
                    }}>
                      <option value="">Select rejection reason...</option>
                      <option value="moisture">High Moisture Content (&gt; 12.0%)</option>
                      <option value="defects">Excessive Primary Defects (&gt; 8 / 300g)</option>
                      <option value="flavor">Off-Flavor / Mold / Contamination</option>
                      <option value="screensize">Screen Size Below Specification</option>
                      <option value="weight">Declared Weight Discrepancy</option>
                      <option value="other">Other — See Inspector Notes</option>
                    </select>
                  </div>
                </div>
              )}

              {/* CTA */}
              <button
                onClick={handleCommit}
                disabled={!canCommit}
                style={{
                  width: '100%', padding: '12px 0', borderRadius: 9, border: 'none',
                  cursor: canCommit ? 'pointer' : 'not-allowed',
                  background: !canCommit ? '#E5E3DC'
                    : effectiveDecision === 'approved' ? '#16A34A' : '#DC2626',
                  color: !canCommit ? '#9CA3AF' : '#FFFFFF',
                  fontSize: 14, fontWeight: 700, fontFamily: 'Inter',
                  boxShadow: !canCommit ? 'none'
                    : effectiveDecision === 'approved' ? '0 2px 8px rgba(22,163,74,0.3)' : '0 2px 8px rgba(220,38,38,0.3)',
                  transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {submitting ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 0.8s linear infinite' }}>
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                    </svg>
                    <style>{`@keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }`}</style>
                    Processing…
                  </span>
                ) : !allFilled ? 'Complete all fields to proceed'
                  : effectiveDecision === 'approved' ? '✓ Sign & Approve Lot into Inventory'
                  : effectiveDecision === 'rejected' ? '✕ Issue Rejection & Return Note'
                  : 'Select a decision to continue'
                }
              </button>
            </div>

            {/* Radar mini-preview */}
            {allFilled && (
              <div className="stat-card" style={{ padding: '14px 16px' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>Cup Profile Preview</div>
                <ResponsiveContainer width="100%" height={160}>
                  <RadarChart data={[
                    { axis: 'Moisture',   value: Math.max(0, 100 - Math.abs((Number(moisture) - 11) * 10)) },
                    { axis: 'Defects',    value: Math.max(0, 100 - Number(defects) * 8) },
                    { axis: 'Screen',     value: Number(screenSize) },
                    { axis: 'Visual',     value: Number(visual) * 10 },
                    { axis: 'Aroma',      value: Number(aroma) * 10 },
                  ]} margin={{ top: 0, right: 20, bottom: 0, left: 20 }}>
                    <PolarGrid stroke="#E5E3DC" />
                    <PolarAngleAxis dataKey="axis" tick={{ fill: '#9CA3AF', fontSize: 9.5, fontFamily: 'DM Mono' }} />
                    <Radar dataKey="value"
                      stroke={effectiveDecision === 'rejected' ? '#DC2626' : '#2B4D3A'}
                      fill={effectiveDecision === 'rejected' ? '#DC2626' : '#2B4D3A'}
                      fillOpacity={0.12} strokeWidth={2} />
                    <Tooltip contentStyle={{ background: '#1F2937', border: 'none', borderRadius: 6, fontSize: 11 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Main ───────────────────────────────────────────── */
export default function Quality() {
  const { isMobile, isTablet, isLaptop, isDesktop, isNarrow } = useBreakpoint()
  const pagePadding = isMobile ? '12px 12px' : isTablet ? '18px 20px' : isLaptop ? '24px 28px' : '28px 32px'
  const maxWidthStyle = isDesktop ? { maxWidth: 1600, margin: '0 auto' } : {}
  const [view,         setView]         = useState<WorkspaceState>('queue')
  const [activeLot,    setActiveLot]    = useState<typeof RECEIVING_QUEUE[0] | null>(null)
  const [committed,    setCommitted]    = useState<{ verdict: 'approved' | 'rejected'; data: any } | null>(null)
  const [completedLog, setCompletedLog] = useState(COMPLETED)

  const handleCommit = (verdict: 'approved' | 'rejected', data: any) => {
    if (!activeLot) return
    const newEntry = {
      id: `QC-${9025 + completedLog.length}`,
      lot: `GRN-${activeLot.origin.slice(0,3).toUpperCase()}-2026-0${Math.floor(Math.random()*90)+10}`,
      supplier: activeLot.supplier, origin: activeLot.origin,
      date: new Date().toISOString().slice(0,10),
      inspector: 'Selamawit Bekele',
      moisture: data.moisture, defects: data.defects, screenSize: data.screenSize,
      visual: data.visual, aroma: data.aroma,
      cupScore: data.cupScore ?? 0,
      verdict, weight: activeLot.declaredWeight,
    }
    setCompletedLog(prev => [newEntry, ...prev])
    setCommitted({ verdict, data })
    setView('committed')
  }

  const pendingCount   = RECEIVING_QUEUE.length
  const approvedMonth  = completedLog.filter(l => l.verdict === 'approved').length
  const rejectedCount  = completedLog.filter(l => l.verdict === 'rejected').length

  if (view === 'inspect' && activeLot) {
    return (
      <div className="page-enter" style={{ background: 'var(--bg-primary)', minHeight: '100%' }}>
        <InspectionWorkspace lot={activeLot} onBack={() => setView('queue')} onCommit={handleCommit} />
      </div>
    )
  }

  if (view === 'committed' && committed && activeLot) {
    const isApproved = committed.verdict === 'approved'
    return (
      <div className="page-enter" style={{ padding: '60px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, background: 'var(--bg-primary)', minHeight: '100%' }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: isApproved ? '#F0FDF4' : '#FEF2F2',
          border: `2px solid ${isApproved ? '#16A34A' : '#DC2626'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'expandRow 0.3s ease',
          boxShadow: `0 0 0 8px ${isApproved ? 'rgba(22,163,74,0.08)' : 'rgba(220,38,38,0.08)'}`,
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={isApproved ? '#16A34A' : '#DC2626'} strokeWidth="2.5">
            {isApproved
              ? <polyline points="20 6 9 17 4 12"/>
              : <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
            }
          </svg>
        </div>
        <div style={{ textAlign: 'center' as const }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
            Lot {isApproved ? 'Approved' : 'Rejected'}
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 400, lineHeight: '22px' }}>
            {isApproved
              ? `${activeLot.id} has been cleared and committed to Green Coffee Inventory. Batch SKU auto-assigned.`
              : `${activeLot.id} has been rejected and locked. A supplier return voucher has been generated.`
            }
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, padding: '16px 24px', background: isApproved ? '#F0FDF4' : '#FEF2F2', borderRadius: 10, border: `1px solid ${isApproved ? '#DCFCE7' : '#FECACA'}` }}>
          {[
            ['Inspection ID', completedLog[0]?.id ?? 'QC-9025'],
            ['Lot',           activeLot.id],
            ['Supplier',      activeLot.supplier],
            ['Decision',      isApproved ? 'APPROVED ✓' : 'REJECTED ✕'],
          ].map(([k, v]) => (
            <div key={String(k)} style={{ textAlign: 'center' as const, padding: '0 16px', borderRight: '1px solid rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize: 10.5, fontFamily: 'DM Mono', color: isApproved ? '#15803D' : '#B91C1C', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 3 }}>{k}</div>
              <div style={{ fontSize: 13, fontFamily: 'DM Mono', fontWeight: 700, color: 'var(--text-primary)' }}>{v}</div>
            </div>
          ))}
        </div>
        <button onClick={() => { setView('queue'); setActiveLot(null); setCommitted(null) }} style={{
          padding: '10px 28px', borderRadius: 8, border: 'none', background: '#2B4D3A', color: '#FFFFFF',
          cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: 'Inter',
        }}>
          Back to Inspection Queue
        </button>
      </div>
    )
  }

  return (
    <div className="page-enter" style={{ padding: pagePadding, ...maxWidthStyle }}>
      <style>{`@keyframes expandRow { from { opacity:0; transform:translateY(-6px) } to { opacity:1; transform:translateY(0) } }`}</style>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div className="section-eyebrow">Quality Control</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 4, gap: 16, flexWrap: 'wrap' as const }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 5px', letterSpacing: '-0.025em' }}>QC Inspection Gate</h1>
            <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', margin: 0 }}>Business Rule BR-INV-001 · All incoming lots must clear QC before inventory entry</p>
          </div>
          <button className="btn-secondary" style={{ gap: 5 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            Export QC Log
          </button>
        </div>
      </div>

      {/* Top-bar metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Pending Inspections', value: `${pendingCount}`, sub: 'Lots awaiting QC gate', color: '#F59E0B', icon: '⏳' },
          { label: 'Approved This Month', value: `${approvedMonth}`, sub: 'Lots cleared for inventory', color: '#16A34A', icon: '✅' },
          { label: 'Rejected Lots',       value: `${rejectedCount}`, sub: 'Supplier return pending', color: '#DC2626', icon: '❌' },
          { label: 'Avg Cup Score',        value: `${(completedLog.filter(l=>l.verdict==='approved').reduce((s,l)=>s+l.cupScore,0)/Math.max(1,completedLog.filter(l=>l.verdict==='approved').length)).toFixed(1)}`, sub: 'Approved lots avg', color: '#2B4D3A', icon: '☕' },
        ].map(c => (
          <div key={c.label} className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>{c.label}</div>
              <span style={{ fontSize: 18 }}>{c.icon}</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: c.color, fontFamily: 'DM Mono', letterSpacing: '-0.02em', marginBottom: 5 }}>{c.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Incoming Receiving Queue */}
      {RECEIVING_QUEUE.length > 0 && (
        <div className="stat-card" style={{ padding: 0, overflow: 'hidden', overflowX: 'auto', marginBottom: 20 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-neutral)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Incoming Receiving Queue</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 2 }}>Lots arrived — awaiting QC clearance before inventory entry</div>
            </div>
            <span style={{ fontSize: 11.5, fontFamily: 'DM Mono', color: '#F59E0B', background: '#FFFBEB', padding: '3px 10px', borderRadius: 999, border: '1px solid #FEF3C7', fontWeight: 600 }}>
              {pendingCount} lots pending
            </span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-neutral)' }}>
                {['Arrival Date','Supplier','Origin Region','Declared Weight','Vehicle Tag','PO Reference','Priority',''].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left' as const, fontSize: 10.5, fontFamily: 'DM Mono', color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' as const, fontWeight: 500, whiteSpace: 'nowrap' as const }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RECEIVING_QUEUE.map((lot, i) => (
                <tr key={lot.id} style={{ borderBottom: i < RECEIVING_QUEUE.length - 1 ? '1px solid #F5F3EF' : 'none', background: lot.priority === 'high' ? '#FFFBEB' : 'transparent', transition: 'background 0.1s' }}
                  onMouseEnter={e => { if (lot.priority !== 'high') e.currentTarget.style.background = '#FAFAF8' }}
                  onMouseLeave={e => { if (lot.priority !== 'high') e.currentTarget.style.background = 'transparent' }}
                >
                  <td style={{ padding: '14px 16px', fontFamily: 'DM Mono', fontSize: 12, color: 'var(--text-muted)' }}>{lot.arrivalDate}</td>
                  <td style={{ padding: '14px 16px', fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>{lot.supplier}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ fontSize: 11.5, fontFamily: 'DM Mono', padding: '2px 9px', borderRadius: 999, background: '#EFF6FF', color: '#1D4ED8', fontWeight: 600 }}>{lot.origin}</span>
                  </td>
                  <td style={{ padding: '14px 16px', fontFamily: 'DM Mono', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {lot.declaredWeight.toLocaleString(undefined, { minimumFractionDigits: 2 })} KG
                  </td>
                  <td style={{ padding: '14px 16px', fontFamily: 'DM Mono', fontSize: 12, color: 'var(--text-secondary)' }}>{lot.vehicle}</td>
                  <td style={{ padding: '14px 16px', fontFamily: 'DM Mono', fontSize: 12, color: '#2B4D3A', fontWeight: 600 }}>{lot.poRef}</td>
                  <td style={{ padding: '14px 16px' }}>
                    {lot.priority === 'high' ? (
                      <span style={{ fontSize: 11, fontFamily: 'DM Mono', padding: '2px 8px', borderRadius: 999, background: '#FEF3C7', color: '#B45309', fontWeight: 700 }}>⚡ HIGH</span>
                    ) : (
                      <span style={{ fontSize: 11, fontFamily: 'DM Mono', padding: '2px 8px', borderRadius: 999, background: 'var(--surface-02)', color: 'var(--text-secondary)' }}>Normal</span>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <button
                      onClick={() => { setActiveLot(lot); setView('inspect') }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 7,
                        border: 'none', background: '#2B4D3A', color: '#FFFFFF', cursor: 'pointer',
                        fontSize: 12.5, fontWeight: 600, fontFamily: 'Inter', whiteSpace: 'nowrap' as const,
                        boxShadow: '0 1px 3px rgba(43,77,58,0.3)', transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#1F382A'}
                      onMouseLeave={e => e.currentTarget.style.background = '#2B4D3A'}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                      Begin Inspection
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Completed Inspections Log */}
      <div className="stat-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-neutral)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Completed Inspection Log</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 2 }}>All finalized QC decisions — August 2026</div>
          </div>
          <span style={{ fontSize: 11.5, fontFamily: 'DM Mono', color: 'var(--text-muted)' }}>{completedLog.length} records</span>
        </div>
        {isMobile ? (
          <div>
            {completedLog.map((entry, i) => (
              <div key={entry.id} style={{ padding: '12px 12px', borderBottom: i < completedLog.length - 1 ? '1px solid var(--border-neutral)' : 'none', background: 'var(--surface-01)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'Inter' }}>{entry.lot}</span>
                  <VerdictBadge verdict={entry.verdict} />
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', flexWrap: 'wrap' as const, gap: '3px 10px' }}>
                  <span>{entry.origin} · {entry.inspector ?? 'Inspector'}</span>
                  <span style={{ fontFamily: 'DM Mono', fontWeight: 700, color: entry.cupScore >= 85 ? '#16A34A' : '#F59E0B' }}>{entry.cupScore.toFixed(1)} pts</span>
                  <span style={{ fontFamily: 'DM Mono', color: entry.moisture > 12 ? '#DC2626' : 'var(--text-muted)' }}>{entry.moisture}% moisture</span>
                  <span>{entry.date}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
              <thead>
                <tr style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-neutral)' }}>
                  {['QC ID','Lot','Supplier','Origin','Date','Moisture','Defects','Cup Score','Weight','Verdict'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left' as const, fontSize: 10.5, fontFamily: 'DM Mono', color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' as const, fontWeight: 500, whiteSpace: 'nowrap' as const }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {completedLog.map((entry, i) => (
                  <tr key={entry.id} style={{ borderBottom: i < completedLog.length - 1 ? '1px solid #F5F3EF' : 'none', background: entry.verdict === 'rejected' ? '#FFF8F8' : 'transparent', transition: 'background 0.1s' }}
                    onMouseEnter={e => { if (entry.verdict !== 'rejected') e.currentTarget.style.background = '#FAFAF8' }}
                    onMouseLeave={e => { if (entry.verdict !== 'rejected') e.currentTarget.style.background = 'transparent' }}
                  >
                    <td style={{ padding: '12px 16px', fontFamily: 'DM Mono', fontSize: 12, color: '#2B4D3A', fontWeight: 600 }}>{entry.id}</td>
                    <td style={{ padding: '12px 16px', fontFamily: 'DM Mono', fontSize: 12, color: 'var(--text-secondary)' }}>{entry.lot}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{entry.supplier}</td>
                    <td style={{ padding: '12px 16px', fontSize: 12.5, color: 'var(--text-secondary)' }}>{entry.origin}</td>
                    <td style={{ padding: '12px 16px', fontFamily: 'DM Mono', fontSize: 12, color: 'var(--text-muted)' }}>{entry.date}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontFamily: 'DM Mono', fontSize: 12.5, fontWeight: 600, color: entry.moisture > 12 ? '#DC2626' : '#16A34A' }}>
                        {entry.moisture}%
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontFamily: 'DM Mono', fontSize: 12.5, fontWeight: 600, color: entry.defects > 8 ? '#DC2626' : '#16A34A' }}>
                        {entry.defects}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontFamily: 'DM Mono', fontSize: 12.5, fontWeight: 700, color: entry.cupScore >= 85 ? '#16A34A' : entry.cupScore >= 80 ? '#F59E0B' : '#DC2626' }}>
                        {entry.cupScore.toFixed(1)}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontFamily: 'DM Mono', fontSize: 12.5, color: 'var(--text-secondary)' }}>
                      {entry.weight.toLocaleString()} KG
                    </td>
                    <td style={{ padding: '12px 16px' }}><VerdictBadge verdict={entry.verdict} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
