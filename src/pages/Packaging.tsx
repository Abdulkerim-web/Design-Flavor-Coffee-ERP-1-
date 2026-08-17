/**
 * Packaging.tsx — P2G Packing Module
 * Coffee-Roasting ERP — Packing Job management UI
 *
 * Views: list | detail | manager-review
 * All quantities, discrepancies, material amounts = opaque strings from backend.
 * Business logic lives in PHP; this file only renders and routes.
 */

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { can } from '../lib/can'
import { useBreakpoint } from '../hooks/useBreakpoint'
import {
  listPackingJobs,
  getPackingJob,
  submitPackingConfirmation,
  managerConfirmPacking,
  reviewPackingDiscrepancy,
} from '../services/operations'
import type {
  PackingJob,
  PackingMaterialEntry,
  PackingJobStatus,
  OperationalEvent,
} from '../services/operations'

/* ─── View routing ───────────────────────────────────────────── */
type View = 'list' | 'detail' | 'manager-review'

/* ─── Status badge config ────────────────────────────────────── */
const STATUS_CONFIG: Record<PackingJobStatus, { label: string; color: string; bg: string }> = {
  'pending':            { label: 'Pending',            color: 'var(--text-secondary)', bg: 'var(--surface-01)' },
  'in-progress':        { label: 'In Progress',        color: 'var(--sem-info)',        bg: 'rgba(59,130,246,0.10)' },
  'packing-complete':   { label: 'Packing Complete',   color: '#0F766E',                bg: '#CCFBF1' },
  'awaiting-manager':   { label: 'Awaiting Manager',   color: '#7C3AED',                bg: '#EDE9FE' },
  'discrepancy':        { label: 'Discrepancy',        color: 'var(--sem-danger)',      bg: 'rgba(239,68,68,0.10)' },
  'manager-confirmed':  { label: 'Manager Confirmed',  color: 'var(--sem-success)',     bg: 'rgba(34,197,94,0.10)' },
  'ready-for-delivery': { label: 'Ready for Delivery', color: '#2B4D3A',                bg: 'rgba(43,77,58,0.12)' },
}

/* ─── Helpers ────────────────────────────────────────────────── */
function StatusBadge({ status }: { status: PackingJobStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG['pending']
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: 6,
      fontSize: 11.5,
      fontFamily: 'DM Mono, monospace',
      fontWeight: 600,
      color: cfg.color,
      background: cfg.bg,
      border: `1px solid ${cfg.color}33`,
      whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  )
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
      {children}
    </div>
  )
}

function Qty({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ fontFamily: 'DM Mono, monospace', fontWeight: 600, fontSize: 13.5 }}>
      {children}
    </span>
  )
}

function Skeleton({ width = '100%', height = 16 }: { width?: string | number; height?: number }) {
  return (
    <div style={{
      width,
      height,
      background: 'linear-gradient(90deg, var(--surface-01) 25%, var(--surface-02,#f3f4f6) 50%, var(--surface-01) 75%)',
      backgroundSize: '200% 100%',
      borderRadius: 4,
      animation: 'skeletonShimmer 1.4s ease infinite',
    }} />
  )
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'var(--surface-01)',
      border: '1px solid var(--border-neutral)',
      borderRadius: 12,
      padding: '20px 24px',
      ...style,
    }}>
      {children}
    </div>
  )
}

function PrimaryButton({ onClick, disabled, children, style }: {
  onClick?: () => void
  disabled?: boolean
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        height: 40,
        padding: '0 20px',
        borderRadius: 8,
        border: 'none',
        background: disabled ? 'var(--border-neutral)' : '#2B4D3A',
        color: '#fff',
        fontSize: 13.5,
        fontWeight: 600,
        fontFamily: 'Inter, sans-serif',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.7 : 1,
        ...style,
      }}
    >
      {children}
    </button>
  )
}

function SecondaryButton({ onClick, disabled, children, style }: {
  onClick?: () => void
  disabled?: boolean
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        height: 40,
        padding: '0 20px',
        borderRadius: 8,
        border: '1px solid var(--border-neutral)',
        background: 'var(--surface-01)',
        color: 'var(--text-primary)',
        fontSize: 13.5,
        fontWeight: 600,
        fontFamily: 'Inter, sans-serif',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.7 : 1,
        ...style,
      }}
    >
      {children}
    </button>
  )
}

/* ─── Operational Timeline ───────────────────────────────────── */
function Timeline({ events }: { events: OperationalEvent[] }) {
  return (
    <div style={{ position: 'relative', paddingLeft: 24 }}>
      <div style={{
        position: 'absolute',
        left: 9,
        top: 8,
        bottom: 8,
        width: 2,
        background: 'var(--border-neutral)',
        borderRadius: 2,
      }} />
      {events.map((ev, idx) => {
        const dotColor =
          ev.state === 'completed' ? 'var(--sem-success)' :
          ev.state === 'current'   ? 'var(--sem-info)' :
          ev.state === 'warning'   ? 'var(--sem-warning)' :
          'var(--border-neutral)'

        const isCurrentPulsing = ev.state === 'current'

        return (
          <div key={ev.id} style={{ display: 'flex', gap: 12, marginBottom: idx < events.length - 1 ? 20 : 0 }}>
            <div style={{ position: 'relative', marginLeft: -24, marginRight: 0, flexShrink: 0 }}>
              <div style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: ev.state === 'pending' ? 'var(--surface-01)' : dotColor,
                border: `2px solid ${dotColor}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: isCurrentPulsing ? 'timelinePulse 2s ease infinite' : 'none',
              }}>
                {ev.state === 'completed' && (
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                    <path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </div>
            <div style={{ flex: 1, paddingTop: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif' }}>
                {ev.event}
              </div>
              {ev.actor && (
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 1 }}>{ev.actor}</div>
              )}
              {ev.quantity && (
                <div style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', color: 'var(--text-secondary)', marginTop: 1 }}>
                  Qty: {ev.quantity}
                </div>
              )}
              {ev.notes && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, fontStyle: 'italic' }}>{ev.notes}</div>
              )}
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace', marginTop: 3 }}>
                {ev.timestamp}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ─── Confirm Packing Modal ──────────────────────────────────── */
interface ConfirmPackingModalProps {
  job: PackingJob
  onClose: () => void
  onSubmitted: () => void
}

const PACKAGING_TYPES = [
  '250 g Bag', '500 g Bag', '1 KG Bag', '2 KG Bag',
  '5 KG Bag', '10 KG Bag', 'Bulk Sack', 'Other',
]

function ConfirmPackingModal({ job, onClose, onSubmitted }: ConfirmPackingModalProps) {
  const [packedQtyInput, setPackedQtyInput] = useState('')
  const [packagingType, setPackagingType]   = useState(job.packagingType ?? '')
  const [packageCount, setPackageCount]     = useState(job.packageCount ?? '')
  const [materialInputs, setMaterialInputs] = useState<Record<string, string>>(
    Object.fromEntries(job.materials.map((m: PackingMaterialEntry) => [m.materialId, m.usedQty || '']))
  )
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const mats = job.materials.map((m: PackingMaterialEntry) => ({
        materialId: m.materialId,
        usedQty: materialInputs[m.materialId] || '',
      }))
      await submitPackingConfirmation(job.id, packedQtyInput, mats, notes || undefined)
      onSubmitted()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}>
      <div style={{
        background: 'var(--bg-primary)',
        borderRadius: 14,
        width: '100%',
        maxWidth: 520,
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid var(--border-neutral)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, fontFamily: 'Inter, sans-serif', color: 'var(--text-primary)' }}>
              Confirm Packing
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 2 }}>
              {job.ref} · {job.coffee}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 20, lineHeight: 1 }}
            aria-label="Close"
          >×</button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Note */}
          <div style={{
            padding: '10px 14px',
            background: 'rgba(59,130,246,0.07)',
            border: '1px solid rgba(59,130,246,0.2)',
            borderRadius: 8,
            fontSize: 12,
            color: 'var(--sem-info)',
          }}>
            PHP determines whether this submission is valid. Do not attempt to validate quantities here.
          </div>

          {/* Required for reference */}
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <Eyebrow>Required Packed Qty</Eyebrow>
              <Qty>{job.requiredPackedQty}</Qty>
            </div>
            <div style={{ flex: 1 }}>
              <Eyebrow>Accepted Roasted Qty</Eyebrow>
              <Qty>{job.acceptedRoastedQty}</Qty>
            </div>
          </div>

          {/* Packed Qty input */}
          <div>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Packed Qty (KG) *
            </label>
            <input
              type="text"
              value={packedQtyInput}
              onChange={e => setPackedQtyInput(e.target.value)}
              placeholder="e.g. 48.0"
              style={{
                width: '100%',
                height: 38,
                borderRadius: 8,
                border: '1px solid var(--border-neutral)',
                padding: '0 12px',
                fontSize: 13.5,
                fontFamily: 'DM Mono, monospace',
                color: 'var(--text-primary)',
                background: 'var(--surface-01)',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Packaging type + count */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Packaging Type</label>
              <select
                value={packagingType}
                onChange={e => setPackagingType(e.target.value)}
                style={{ width: '100%', height: 38, borderRadius: 8, border: '1px solid var(--border-neutral)', padding: '0 10px', fontSize: 13, fontFamily: 'Inter, sans-serif', color: 'var(--text-primary)', background: 'var(--surface-01)', boxSizing: 'border-box' }}
              >
                <option value="">— not specified —</option>
                {PACKAGING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Package Count</label>
              <input
                type="text"
                value={packageCount}
                onChange={e => setPackageCount(e.target.value)}
                placeholder="e.g. 60"
                style={{ width: '100%', height: 38, borderRadius: 8, border: '1px solid var(--border-neutral)', padding: '0 12px', fontSize: 13, fontFamily: 'DM Mono, monospace', color: 'var(--text-primary)', background: 'var(--surface-01)', boxSizing: 'border-box' }}
              />
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, fontStyle: 'italic' }}>Server determines authoritative count.</div>
            </div>
          </div>

          {/* Material usage */}
          {job.materials.length > 0 && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 10 }}>Material Usage</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {job.materials.map((m: PackingMaterialEntry) => (
                  <div key={m.materialId} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-primary)' }}>{m.materialName}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>Planned: {m.plannedQty}</div>
                    </div>
                    <div style={{ width: 120, flexShrink: 0 }}>
                      <input
                        type="text"
                        value={materialInputs[m.materialId] ?? ''}
                        onChange={e => setMaterialInputs(prev => ({ ...prev, [m.materialId]: e.target.value }))}
                        placeholder={`Used (${m.unit})`}
                        style={{
                          width: '100%',
                          height: 34,
                          borderRadius: 7,
                          border: '1px solid var(--border-neutral)',
                          padding: '0 10px',
                          fontSize: 13,
                          fontFamily: 'DM Mono, monospace',
                          color: 'var(--text-primary)',
                          background: 'var(--surface-01)',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Any observations or remarks..."
              style={{
                width: '100%',
                borderRadius: 8,
                border: '1px solid var(--border-neutral)',
                padding: '8px 12px',
                fontSize: 13,
                fontFamily: 'Inter, sans-serif',
                color: 'var(--text-primary)',
                background: 'var(--surface-01)',
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {error && (
            <div style={{
              padding: '10px 14px',
              background: 'rgba(239,68,68,0.07)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 8,
              fontSize: 13,
              color: 'var(--sem-danger)',
            }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px 20px',
          borderTop: '1px solid var(--border-neutral)',
          display: 'flex',
          gap: 10,
          justifyContent: 'flex-end',
        }}>
          <SecondaryButton onClick={onClose} disabled={submitting}>Cancel</SecondaryButton>
          <PrimaryButton onClick={handleSubmit} disabled={submitting || !packedQtyInput.trim()}>
            {submitting ? 'Submitting…' : 'CONFIRM PACKING'}
          </PrimaryButton>
        </div>
      </div>
    </div>
  )
}

/* ─── Discrepancy Panel ──────────────────────────────────────── */
function DiscrepancyPanel({
  job,
  onReview,
  canReview,
}: {
  job: PackingJob
  onReview?: () => void
  canReview: boolean
}) {
  const d = job.discrepancy
  if (!d) return null

  return (
    <div style={{
      background: 'rgba(239,68,68,0.05)',
      border: '1.5px solid rgba(239,68,68,0.35)',
      borderRadius: 10,
      padding: '16px 20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 1.5L14.5 13H1.5L8 1.5Z" stroke="var(--sem-danger)" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M8 6V9" stroke="var(--sem-danger)" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="8" cy="11" r="0.75" fill="var(--sem-danger)" />
        </svg>
        <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--sem-danger)', fontFamily: 'Inter, sans-serif' }}>
          Packing — Needs Review
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 14 }}>
        {[
          { label: 'Required', value: d.required },
          { label: 'Packed', value: d.packed },
          { label: 'Difference', value: d.difference },
        ].map(item => (
          <div key={item.label}>
            <Eyebrow>{item.label}</Eyebrow>
            <Qty>{item.value}</Qty>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: canReview && onReview ? 14 : 0 }}>
        Recorded by <strong>{d.storekeeper}</strong> on {d.timestamp}
      </div>

      {canReview && onReview && (
        <button
          onClick={onReview}
          style={{
            height: 36,
            padding: '0 16px',
            borderRadius: 7,
            border: '1.5px solid var(--sem-danger)',
            background: 'transparent',
            color: 'var(--sem-danger)',
            fontSize: 13,
            fontWeight: 600,
            fontFamily: 'Inter, sans-serif',
            cursor: 'pointer',
          }}
        >
          Review Discrepancy
        </button>
      )}
    </div>
  )
}

/* ─── Materials Table ────────────────────────────────────────── */
function MaterialsTable({
  materials,
  editable = false,
  editValues,
  onEditChange,
}: {
  materials: PackingMaterialEntry[]
  editable?: boolean
  editValues?: Record<string, string>
  onEditChange?: (materialId: string, value: string) => void
}) {
  if (materials.length === 0) {
    return <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '8px 0' }}>No materials recorded.</div>
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-neutral)' }}>
            {['Material', 'Unit', 'Planned Qty', 'Used Qty'].map(h => (
              <th key={h} style={{
                textAlign: 'left',
                padding: '6px 10px',
                fontSize: 11,
                fontFamily: 'DM Mono, monospace',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontWeight: 600,
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {materials.map((m: PackingMaterialEntry) => (
            <tr key={m.materialId} style={{ borderBottom: '1px solid var(--border-neutral)' }}>
              <td style={{ padding: '9px 10px', color: 'var(--text-primary)', fontWeight: 500 }}>{m.materialName}</td>
              <td style={{ padding: '9px 10px', color: 'var(--text-secondary)', fontFamily: 'DM Mono, monospace' }}>{m.unit}</td>
              <td style={{ padding: '9px 10px' }}><Qty>{m.plannedQty}</Qty></td>
              <td style={{ padding: '9px 10px' }}>
                {editable && editValues && onEditChange ? (
                  <input
                    type="text"
                    value={editValues[m.materialId] ?? m.usedQty}
                    onChange={e => onEditChange(m.materialId, e.target.value)}
                    style={{
                      width: 100,
                      height: 30,
                      borderRadius: 6,
                      border: '1px solid var(--border-neutral)',
                      padding: '0 8px',
                      fontSize: 13,
                      fontFamily: 'DM Mono, monospace',
                      color: 'var(--text-primary)',
                      background: 'var(--surface-01)',
                      boxSizing: 'border-box',
                    }}
                  />
                ) : (
                  <Qty>{m.usedQty || '—'}</Qty>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ─── List View ──────────────────────────────────────────────── */
function ListView({
  onSelect,
}: {
  onSelect: (job: PackingJob, view: View) => void
}) {
  const { currentUser } = useAuth()
  const { isNarrow } = useBreakpoint()
  const [jobs, setJobs] = useState<PackingJob[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<PackingJobStatus | ''>('')

  const role = currentUser?.role ?? 'viewer'

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await listPackingJobs({
        search: search || undefined,
        status: statusFilter || undefined,
      })
      if (result.error) throw new Error(result.error)
      setJobs(result.data ?? [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load packing jobs.')
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter])

  useEffect(() => { void load() }, [load])

  if (!can(role as any, 'packing.view')) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
        You do not have permission to view the Packing module.
      </div>
    )
  }

  // Status summary counts
  const counts = jobs.reduce<Record<string, number>>((acc, j) => {
    acc[j.status] = (acc[j.status] || 0) + 1
    return acc
  }, {})

  const STATUSES: PackingJobStatus[] = [
    'pending', 'in-progress', 'packing-complete', 'awaiting-manager',
    'discrepancy', 'manager-confirmed', 'ready-for-delivery',
  ]

  return (
    <div style={{ padding: isNarrow ? '16px 14px' : '24px 28px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Packing
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
          Prepare accepted roasted coffee for delivery.
        </p>
      </div>

      {/* Summary strip */}
      <div style={{
        display: 'flex',
        gap: 10,
        overflowX: 'auto',
        marginBottom: 18,
        paddingBottom: 4,
      }}>
        {STATUSES.filter(s => counts[s]).map(s => {
          const cfg = STATUS_CONFIG[s]
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(statusFilter === s ? '' : s)}
              style={{
                flexShrink: 0,
                padding: '6px 12px',
                borderRadius: 8,
                border: `1.5px solid ${statusFilter === s ? cfg.color : 'var(--border-neutral)'}`,
                background: statusFilter === s ? cfg.bg : 'var(--surface-01)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span style={{ fontSize: 15, fontWeight: 700, fontFamily: 'DM Mono, monospace', color: cfg.color }}>
                {counts[s]}
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)' }}>
                {cfg.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* Search + filter */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by ref, order, customer, coffee…"
          style={{
            flex: '1 1 220px',
            height: 38,
            borderRadius: 8,
            border: '1px solid var(--border-neutral)',
            padding: '0 12px',
            fontSize: 13.5,
            color: 'var(--text-primary)',
            background: 'var(--surface-01)',
          }}
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as PackingJobStatus | '')}
          style={{
            height: 38,
            borderRadius: 8,
            border: '1px solid var(--border-neutral)',
            padding: '0 12px',
            fontSize: 13,
            color: 'var(--text-primary)',
            background: 'var(--surface-01)',
            cursor: 'pointer',
          }}
        >
          <option value="">All statuses</option>
          {STATUSES.map(s => (
            <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
          ))}
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <Skeleton width={80} height={14} />
                <Skeleton width={100} height={14} />
                <Skeleton width={140} height={14} />
                <Skeleton width={60} height={14} />
                <Skeleton width={80} height={22} />
              </div>
            ))}
          </div>
        </Card>
      ) : error ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: 14, color: 'var(--sem-danger)', marginBottom: 12 }}>{error}</div>
            <SecondaryButton onClick={load}>Retry</SecondaryButton>
          </div>
        </Card>
      ) : jobs.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: 14 }}>
            No orders are currently ready for packing.
          </div>
        </Card>
      ) : isNarrow ? (
        /* Mobile cards */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {jobs.map(job => (
            <Card key={job.id} style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 13, fontFamily: 'DM Mono, monospace', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {job.ref}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{job.customer}</div>
                </div>
                <StatusBadge status={job.status} />
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 4 }}>
                {job.coffee} · {job.roastLevel}
              </div>
              <div style={{ display: 'flex', gap: 16, marginBottom: 10, fontSize: 12 }}>
                <div><span style={{ color: 'var(--text-muted)' }}>Req: </span><Qty>{job.requiredPackedQty}</Qty></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Packed: </span><Qty>{job.packedQty || '—'}</Qty></div>
              </div>
              <PrimaryButton
                onClick={() => onSelect(job, 'detail')}
                style={{ width: '100%', height: 36, fontSize: 13 }}
              >
                {job.status === 'in-progress' ? 'Continue Packing' :
                 job.status === 'awaiting-manager' && can(role as any, 'packing.review-discrepancy') ? 'Manager Review' :
                 'View Details'}
              </PrimaryButton>
            </Card>
          ))}
        </div>
      ) : (
        /* Desktop table */
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-neutral)', background: 'var(--surface-01)' }}>
                  {['Ref', 'Order', 'Customer', 'Coffee', 'Required', 'Packed', 'Remaining', 'Status', 'Storekeeper', 'Action'].map(h => (
                    <th key={h} style={{
                      textAlign: 'left',
                      padding: '10px 14px',
                      fontSize: 11,
                      fontFamily: 'DM Mono, monospace',
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {jobs.map(job => (
                  <tr key={job.id} style={{ borderBottom: '1px solid var(--border-neutral)' }}>
                    <td style={{ padding: '11px 14px', fontFamily: 'DM Mono, monospace', fontWeight: 700, fontSize: 12.5, color: 'var(--text-primary)' }}>
                      {job.ref}
                    </td>
                    <td style={{ padding: '11px 14px', fontFamily: 'DM Mono, monospace', fontSize: 12.5, color: 'var(--text-secondary)' }}>
                      {job.orderRef}
                    </td>
                    <td style={{ padding: '11px 14px', color: 'var(--text-primary)' }}>{job.customer}</td>
                    <td style={{ padding: '11px 14px', color: 'var(--text-secondary)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {job.coffee}
                    </td>
                    <td style={{ padding: '11px 14px' }}><Qty>{job.requiredPackedQty}</Qty></td>
                    <td style={{ padding: '11px 14px' }}><Qty>{job.packedQty || '—'}</Qty></td>
                    <td style={{ padding: '11px 14px' }}><Qty>{job.remainingQty || '—'}</Qty></td>
                    <td style={{ padding: '11px 14px' }}><StatusBadge status={job.status} /></td>
                    <td style={{ padding: '11px 14px', fontSize: 12.5, color: 'var(--text-secondary)' }}>{job.storekeeper}</td>
                    <td style={{ padding: '11px 14px' }}>
                      <button
                        onClick={() => onSelect(job, job.status === 'awaiting-manager' && can(role as any, 'packing.review-discrepancy') ? 'manager-review' : 'detail')}
                        style={{
                          height: 30,
                          padding: '0 12px',
                          borderRadius: 6,
                          border: 'none',
                          background: '#2B4D3A',
                          color: '#fff',
                          fontSize: 12,
                          fontWeight: 600,
                          fontFamily: 'Inter, sans-serif',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {job.status === 'in-progress' ? 'Continue' :
                         job.status === 'awaiting-manager' && can(role as any, 'packing.review-discrepancy') ? 'Review' :
                         'View'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}

/* ─── Detail View ────────────────────────────────────────────── */
function DetailView({
  jobId,
  onBack,
  onManagerReview,
  onRefresh,
}: {
  jobId: string
  onBack: () => void
  onManagerReview: () => void
  onRefresh?: () => void
}) {
  const { currentUser } = useAuth()
  const { isNarrow } = useBreakpoint()
  const [job, setJob] = useState<PackingJob | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const role = currentUser?.role ?? 'viewer'

  const loadJob = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getPackingJob(jobId)
      if (result.error) throw new Error(result.error)
      setJob(result.data ?? null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load packing job.')
    } finally {
      setLoading(false)
    }
  }, [jobId])

  useEffect(() => { void loadJob() }, [loadJob])

  const handleStartPacking = async () => {
    setActionLoading(true)
    setActionError(null)
    try {
      await loadJob()
      onRefresh?.()
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : 'Action failed.')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: isNarrow ? '16px 14px' : '24px 28px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ marginBottom: 20 }}>
          <Skeleton width={60} height={14} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : '1fr 340px', gap: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Card><Skeleton height={120} /></Card>
            <Card><Skeleton height={80} /></Card>
          </div>
          <div><Card><Skeleton height={200} /></Card></div>
        </div>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div style={{ padding: 32, textAlign: 'center' }}>
        <div style={{ color: 'var(--sem-danger)', marginBottom: 12 }}>{error ?? 'Job not found.'}</div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <SecondaryButton onClick={onBack}>Back to List</SecondaryButton>
          <SecondaryButton onClick={loadJob}>Retry</SecondaryButton>
        </div>
      </div>
    )
  }

  const canRecord = can(role as any, 'packing.record')
  const canComplete = can(role as any, 'packing.complete')
  const canReview = can(role as any, 'packing.review-discrepancy')

  return (
    <div style={{ padding: isNarrow ? '16px 14px' : '24px 28px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Back + header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button
          onClick={onBack}
          style={{
            height: 34,
            padding: '0 14px',
            borderRadius: 7,
            border: '1px solid var(--border-neutral)',
            background: 'var(--surface-01)',
            color: 'var(--text-secondary)',
            fontSize: 13,
            fontWeight: 600,
            fontFamily: 'Inter, sans-serif',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          ← Packing
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'DM Mono, monospace', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
              {job.ref}
            </span>
            <StatusBadge status={job.status} />
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 2 }}>
            {job.customer} · {job.coffee} · {job.roastLevel}
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isNarrow ? '1fr' : '1fr 340px',
        gap: 20,
        alignItems: 'start',
      }}>
        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Job info */}
          <Card>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>Job Information</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 }}>
              {([
                { label: 'Order Ref', value: job.orderRef },
                { label: 'Customer', value: job.customer },
                { label: 'Coffee', value: job.coffee },
                { label: 'Roast Level', value: job.roastLevel },
                { label: 'Accepted Roasted Qty', value: job.acceptedRoastedQty },
                { label: 'Required Packed Qty', value: job.requiredPackedQty },
                { label: 'Storekeeper', value: job.storekeeper },
                ...(job.startedAt ? [{ label: 'Started At', value: job.startedAt }] : []),
                ...(job.packedAt ? [{ label: 'Packed At', value: job.packedAt }] : []),
              ] as { label: string; value: string }[]).map(item => (
                <div key={item.label}>
                  <Eyebrow>{item.label}</Eyebrow>
                  <div style={{ fontSize: 13.5, color: 'var(--text-primary)', fontWeight: 500 }}>{item.value}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Packing progress */}
          <Card>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>Packing Progress</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
              {[
                { label: 'Required', value: job.requiredPackedQty },
                { label: 'Packed',   value: job.packedQty || '—' },
                { label: 'Remaining', value: job.remainingQty || '—' },
              ].map(item => (
                <div key={item.label} style={{ background: 'var(--surface-02)', borderRadius: 8, padding: '10px 12px', border: '1px solid var(--border-neutral)' }}>
                  <Eyebrow>{item.label}</Eyebrow>
                  <Qty>{item.value}</Qty>
                </div>
              ))}
            </div>
            {job.progressPercent !== undefined && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'Inter' }}>{job.packedQty} packed of {job.requiredPackedQty}</span>
                  <span style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', fontWeight: 700, color: parseFloat(job.progressPercent) >= 100 ? 'var(--sem-success)' : 'var(--sem-info)' }}>{job.progressPercent}%</span>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: 'var(--border-neutral)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(100, parseFloat(job.progressPercent))}%`, borderRadius: 4, background: parseFloat(job.progressPercent) >= 100 ? 'var(--sem-success)' : 'var(--sem-info)', transition: 'width 0.4s ease' }} />
                </div>
              </div>
            )}
            {job.packagingType && (
              <div style={{ display: 'flex', gap: 20, marginTop: 12 }}>
                <div><Eyebrow>Packaging Type</Eyebrow><div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{job.packagingType}</div></div>
                {job.packageCount && <div><Eyebrow>Package Count</Eyebrow><div style={{ fontSize: 13, fontFamily: 'DM Mono, monospace', color: 'var(--text-primary)' }}>{job.packageCount}</div></div>}
              </div>
            )}
          </Card>

          {/* Materials */}
          <Card>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>Packing Materials</div>
            <MaterialsTable
              materials={job.materials}
              editable={false}
            />
          </Card>

          {/* Discrepancy panel */}
          {job.status === 'discrepancy' && job.discrepancy && (
            <DiscrepancyPanel
              job={job}
              canReview={canReview}
              onReview={onManagerReview}
            />
          )}

          {/* Action bar */}
          <div>
            {job.status === 'pending' && canRecord && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <PrimaryButton onClick={handleStartPacking} disabled={actionLoading}>
                  {actionLoading ? 'Starting…' : 'Start Packing'}
                </PrimaryButton>
                {actionError && (
                  <span style={{ fontSize: 12.5, color: 'var(--sem-danger)' }}>{actionError}</span>
                )}
              </div>
            )}

            {job.status === 'in-progress' && canComplete && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <PrimaryButton onClick={() => setShowConfirmModal(true)}>
                  CONFIRM PACKING
                </PrimaryButton>
                {actionError && (
                  <span style={{ fontSize: 12.5, color: 'var(--sem-danger)' }}>{actionError}</span>
                )}
              </div>
            )}

            {job.status === 'awaiting-manager' && (
              <div style={{
                padding: '14px 18px',
                background: 'rgba(124,58,237,0.06)',
                border: '1px solid rgba(124,58,237,0.25)',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6.5" stroke="#7C3AED" strokeWidth="1.5" />
                  <path d="M8 5V8.5" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx="8" cy="11" r="0.75" fill="#7C3AED" />
                </svg>
                <span style={{ fontSize: 13.5, color: '#7C3AED', fontWeight: 600 }}>
                  Awaiting Manager Confirmation
                </span>
                {canReview && (
                  <button
                    onClick={onManagerReview}
                    style={{
                      marginLeft: 'auto',
                      height: 34,
                      padding: '0 14px',
                      borderRadius: 7,
                      border: '1.5px solid #7C3AED',
                      background: 'transparent',
                      color: '#7C3AED',
                      fontSize: 12.5,
                      fontWeight: 600,
                      fontFamily: 'Inter, sans-serif',
                      cursor: 'pointer',
                    }}
                  >
                    Go to Review
                  </button>
                )}
              </div>
            )}

            {(job.status === 'manager-confirmed' || job.status === 'ready-for-delivery') && (
              <div style={{
                padding: '16px 20px',
                background: 'rgba(43,77,58,0.07)',
                border: '1.5px solid rgba(43,77,58,0.3)',
                borderRadius: 10,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <circle cx="9" cy="9" r="7.5" fill="rgba(43,77,58,0.15)" stroke="#2B4D3A" strokeWidth="1.5" />
                    <path d="M5.5 9L7.5 11L12.5 6.5" stroke="#2B4D3A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#2B4D3A', fontFamily: 'Fraunces, serif' }}>
                    {job.status === 'ready-for-delivery' ? 'Ready for Delivery' : 'Manager Confirmed'}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
                  {([
                    { label: 'Order', value: job.orderRef },
                    { label: 'Customer', value: job.customer },
                    { label: 'Packed Qty', value: job.packedQty },
                    ...(job.managerName ? [{ label: 'Confirmed By', value: job.managerName }] : []),
                    ...(job.managerConfirmedAt ? [{ label: 'Confirmed At', value: job.managerConfirmedAt }] : []),
                  ] as { label: string; value: string }[]).map(item => (
                    <div key={item.label}>
                      <Eyebrow>{item.label}</Eyebrow>
                      <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{item.value}</div>
                    </div>
                  ))}
                </div>
                {job.status === 'ready-for-delivery' && (
                  <div style={{ marginTop: 10, fontSize: 12.5, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    Driver assignment is handled in the Delivery module.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Packing summary */}
          <Card>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>Packing Summary</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Accepted Roasted Qty', value: job.acceptedRoastedQty },
                { label: 'Required Packed Qty', value: job.requiredPackedQty },
                { label: 'Packed Qty', value: job.packedQty || '—' },
                { label: 'Remaining', value: job.remainingQty || '—' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{item.label}</span>
                  <Qty>{item.value}</Qty>
                </div>
              ))}
            </div>
          </Card>

          {/* Timeline */}
          {job.timeline && job.timeline.length > 0 && (
            <Card>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>Timeline</div>
              <Timeline events={job.timeline} />
            </Card>
          )}
        </div>
      </div>

      {/* Confirm packing modal */}
      {showConfirmModal && (
        <ConfirmPackingModal
          job={job}
          onClose={() => setShowConfirmModal(false)}
          onSubmitted={() => {
            setShowConfirmModal(false)
            void loadJob()
            onRefresh?.()
          }}
        />
      )}
    </div>
  )
}

/* ─── Manager Review View ────────────────────────────────────── */
function ManagerReviewView({
  jobId,
  onBack,
  onDone,
}: {
  jobId: string
  onBack: () => void
  onDone: () => void
}) {
  const { currentUser } = useAuth()
  const { isNarrow } = useBreakpoint()
  const [job, setJob] = useState<PackingJob | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [reviewDecision, setReviewDecision] = useState<'approve' | 'reject' | null>(null)

  const role = currentUser?.role ?? 'viewer'

  const loadJob = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getPackingJob(jobId)
      if (result.error) throw new Error(result.error)
      setJob(result.data ?? null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load job.')
    } finally {
      setLoading(false)
    }
  }, [jobId])

  useEffect(() => { void loadJob() }, [loadJob])

  const handleConfirm = async () => {
    if (!job || !currentUser) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      await managerConfirmPacking(job.id, currentUser.id, notes || undefined)
      onDone()
    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : 'Confirmation failed.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReviewDiscrepancy = async (decision: 'approve' | 'reject') => {
    if (!job) return
    setSubmitting(true)
    setSubmitError(null)
    setReviewDecision(decision)
    try {
      await reviewPackingDiscrepancy(job.id, decision, notes || undefined)
      onDone()
    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : 'Review failed.')
    } finally {
      setSubmitting(false)
      setReviewDecision(null)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: isNarrow ? '16px 14px' : '24px 28px', maxWidth: 860, margin: '0 auto' }}>
        <Skeleton width={80} height={14} />
        <div style={{ marginTop: 20 }}><Card><Skeleton height={200} /></Card></div>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div style={{ padding: 32, textAlign: 'center' }}>
        <div style={{ color: 'var(--sem-danger)', marginBottom: 12 }}>{error ?? 'Job not found.'}</div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <SecondaryButton onClick={onBack}>Back</SecondaryButton>
          <SecondaryButton onClick={loadJob}>Retry</SecondaryButton>
        </div>
      </div>
    )
  }

  const canReview = can(role as any, 'packing.review-discrepancy')
  const hasDiscrepancy = job.status === 'discrepancy' && !!job.discrepancy

  return (
    <div style={{ padding: isNarrow ? '16px 14px' : '24px 28px', maxWidth: 860, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
        <button
          onClick={onBack}
          style={{
            height: 34,
            padding: '0 14px',
            borderRadius: 7,
            border: '1px solid var(--border-neutral)',
            background: 'var(--surface-01)',
            color: 'var(--text-secondary)',
            fontSize: 13,
            fontWeight: 600,
            fontFamily: 'Inter, sans-serif',
            cursor: 'pointer',
          }}
        >
          ← Back
        </button>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Fraunces, serif', color: 'var(--text-primary)' }}>
            Manager Review — {job.ref}
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
            {job.customer} · {job.coffee}
          </div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <StatusBadge status={job.status} />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Job details */}
        <Card>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>Job Details</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 14 }}>
            {([
              { label: 'Order Ref', value: job.orderRef },
              { label: 'Customer', value: job.customer },
              { label: 'Coffee', value: job.coffee },
              { label: 'Roast Level', value: job.roastLevel },
              { label: 'Accepted Roasted', value: job.acceptedRoastedQty },
              { label: 'Required Packed', value: job.requiredPackedQty },
              { label: 'Packed Qty', value: job.packedQty || '—' },
              { label: 'Remaining', value: job.remainingQty || '—' },
              { label: 'Storekeeper', value: job.storekeeper },
            ] as { label: string; value: string }[]).map(item => (
              <div key={item.label}>
                <Eyebrow>{item.label}</Eyebrow>
                <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{item.value}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Materials */}
        <Card>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>Materials Used</div>
          <MaterialsTable materials={job.materials} editable={false} />
        </Card>

        {/* Discrepancy */}
        {hasDiscrepancy && (
          <DiscrepancyPanel job={job} canReview={false} />
        )}

        {/* Timeline */}
        {job.timeline && job.timeline.length > 0 && (
          <Card>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>History</div>
            <Timeline events={job.timeline} />
          </Card>
        )}

        {/* Manager action */}
        {canReview && (
          <Card>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>
              {hasDiscrepancy ? 'Discrepancy Decision' : 'Manager Confirmation'}
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                placeholder="Add a note for the record…"
                style={{
                  width: '100%',
                  borderRadius: 8,
                  border: '1px solid var(--border-neutral)',
                  padding: '8px 12px',
                  fontSize: 13,
                  fontFamily: 'Inter, sans-serif',
                  color: 'var(--text-primary)',
                  background: 'var(--surface-01)',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {submitError && (
              <div style={{
                padding: '10px 14px',
                background: 'rgba(239,68,68,0.07)',
                border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: 8,
                fontSize: 13,
                color: 'var(--sem-danger)',
                marginBottom: 14,
              }}>
                {submitError}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {hasDiscrepancy ? (
                <>
                  <PrimaryButton
                    onClick={() => handleReviewDiscrepancy('approve')}
                    disabled={submitting}
                  >
                    {submitting && reviewDecision === 'approve' ? 'Approving…' : 'Approve & Confirm Packing'}
                  </PrimaryButton>
                  <button
                    onClick={() => handleReviewDiscrepancy('reject')}
                    disabled={submitting}
                    style={{
                      height: 40,
                      padding: '0 20px',
                      borderRadius: 8,
                      border: '1.5px solid var(--sem-danger)',
                      background: 'transparent',
                      color: 'var(--sem-danger)',
                      fontSize: 13.5,
                      fontWeight: 600,
                      fontFamily: 'Inter, sans-serif',
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      opacity: submitting ? 0.7 : 1,
                    }}
                  >
                    {submitting && reviewDecision === 'reject' ? 'Rejecting…' : 'Reject — Send Back'}
                  </button>
                </>
              ) : (
                <PrimaryButton onClick={handleConfirm} disabled={submitting}>
                  {submitting ? 'Confirming…' : 'CONFIRM PACKING'}
                </PrimaryButton>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

/* ─── Global styles injected once ───────────────────────────── */
const GLOBAL_CSS = `
@keyframes skeletonShimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
@keyframes timelinePulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(59,130,246,0.4); }
  50%       { box-shadow: 0 0 0 6px rgba(59,130,246,0); }
}
`

let globalStyleInjected = false
function injectGlobalStyles() {
  if (globalStyleInjected || typeof document === 'undefined') return
  const style = document.createElement('style')
  style.textContent = GLOBAL_CSS
  document.head.appendChild(style)
  globalStyleInjected = true
}

/* ─── Root export ────────────────────────────────────────────── */
export default function Packaging() {
  injectGlobalStyles()

  const [view, setView] = useState<View>('list')
  const [selectedJob, setSelectedJob] = useState<PackingJob | null>(null)
  const [listRefreshKey, setListRefreshKey] = useState(0)

  const handleSelectJob = (job: PackingJob, targetView: View) => {
    setSelectedJob(job)
    setView(targetView)
  }

  const handleBackToList = () => {
    setSelectedJob(null)
    setView('list')
  }

  const handleRefreshList = () => {
    setListRefreshKey(k => k + 1)
  }

  if (view === 'list') {
    return <ListView key={listRefreshKey} onSelect={handleSelectJob} />
  }

  if (view === 'detail' && selectedJob) {
    return (
      <DetailView
        jobId={selectedJob.id}
        onBack={handleBackToList}
        onManagerReview={() => setView('manager-review')}
        onRefresh={handleRefreshList}
      />
    )
  }

  if (view === 'manager-review' && selectedJob) {
    return (
      <ManagerReviewView
        jobId={selectedJob.id}
        onBack={() => setView('detail')}
        onDone={() => {
          handleRefreshList()
          handleBackToList()
        }}
      />
    )
  }

  return null
}
