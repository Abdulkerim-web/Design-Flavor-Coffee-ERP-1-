/**
 * P2H1 — Payments Module
 * Coffee-Roasting ERP
 *
 * Business rules:
 *  - ONE order → MULTIPLE payment transactions
 *  - Payment deadline = 7 days from first verified delivery (backend provides, never calculated here)
 *  - Only payment method: bank transfer
 *  - Company has TWO bank accounts: CBE + Awash Bank
 *  - ALL ETB amounts are opaque strings from backend — never recalculate
 */

import { useState, useEffect, useRef } from 'react'
import {
  getPaymentSummary, listPayments, getPayment,
  recordPayment, verifyPayment, getBankAccounts,
} from '../services/delivery'
import type {
  PaymentRecord, PaymentTransaction, PaymentStatus,
  PaymentSummaryStats, BankAccount,
} from '../services/delivery'
import { can } from '../lib/can'
import { useAuth } from '../contexts/AuthContext'
import { useBreakpoint } from '../hooks/useBreakpoint'

/* ─── Internal routing ──────────────────────────────────────── */
type View = 'list' | 'detail' | 'outstanding' | 'overdue'

/* ─── Payment status meta ───────────────────────────────────── */
const STATUS_META: Record<PaymentStatus, { label: string; bg: string; text: string; dot: string; borderColor: string }> = {
  'payment-pending': { label: 'Payment Pending',  bg: '#F9FAFB', text: '#6B7280', dot: '#9CA3AF', borderColor: '#E5E7EB' },
  'partially-paid':  { label: 'Partially Paid',   bg: '#FFFBEB', text: '#B45309', dot: '#F59E0B', borderColor: '#FDE68A' },
  'paid':            { label: 'Paid',              bg: '#F0FDF4', text: '#15803D', dot: '#22C55E', borderColor: '#BBF7D0' },
  'overdue':         { label: 'Overdue',           bg: '#FEF2F2', text: '#DC2626', dot: '#EF4444', borderColor: '#FCA5A5' },
}

/* ─── Verification status meta ──────────────────────────────── */
const VERIFY_META = {
  'verified':             { label: 'Verified',             bg: '#F0FDF4', text: '#15803D' },
  'pending-verification': { label: 'Pending Verification', bg: '#FFFBEB', text: '#B45309' },
  'rejected':             { label: 'Rejected',             bg: '#FEF2F2', text: '#DC2626' },
}

/* ─── Days-remaining color (uses daysRemainingNum for styling only) ─ */
function daysColor(num?: number): string {
  if (num === undefined) return 'var(--text-muted)'
  if (num < 0) return '#DC2626'
  if (num < 5) return '#B45309'
  return '#15803D'
}

/* ─── Status icon (SVG inline) ──────────────────────────────── */
function StatusIcon({ status, size = 14 }: { status: PaymentStatus; size?: number }) {
  const color = STATUS_META[status].dot
  if (status === 'paid') return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7.5" stroke={color} />
      <path d="M4.5 8.5l2 2 5-5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
  if (status === 'overdue') return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7.5" fill="#FEE2E2" stroke={color} />
      <path d="M8 4.5v4M8 10.5v1" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
  if (status === 'partially-paid') return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M8 0.5a7.5 7.5 0 010 15A7.5 7.5 0 018 .5z" fill={color} fillOpacity="0.15" stroke={color} />
      <path d="M8 0.5A7.5 7.5 0 018 15.5" stroke={color} strokeWidth="1.5" />
    </svg>
  )
  // payment-pending: clock
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7.5" stroke={color} />
      <path d="M8 4.5V8l2.5 2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

/* ─── StatusPill ─────────────────────────────────────────────── */
function StatusPill({ status, size = 'sm' }: { status: PaymentStatus; size?: 'sm' | 'md' }) {
  const m = STATUS_META[status]
  const fs = size === 'md' ? 12 : 11
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: fs, fontFamily: 'DM Mono', padding: size === 'md' ? '4px 10px' : '3px 8px', borderRadius: 999, background: m.bg, color: m.text, fontWeight: 700, whiteSpace: 'nowrap' as const, border: `1px solid ${m.borderColor}` }}>
      <StatusIcon status={status} size={fs} />
      {m.label}
    </span>
  )
}

/* ─── ETB Amount display ─────────────────────────────────────── */
function Etb({ amount, size = 14, weight = 600, muted = false }: { amount: string; size?: number; weight?: number; muted?: boolean }) {
  return (
    <span style={{ fontFamily: 'DM Mono', fontSize: size, fontWeight: weight, color: muted ? 'var(--text-muted)' : 'var(--text-primary)', letterSpacing: '-0.01em', whiteSpace: 'nowrap' as const }}>
      {amount}
    </span>
  )
}

/* ─── Skeleton ───────────────────────────────────────────────── */
function Skeleton({ w, h = 14, radius = 4 }: { w: number | string; h?: number; radius?: number }) {
  return (
    <div style={{ width: w, height: h, borderRadius: radius, background: 'linear-gradient(90deg, var(--surface-01) 25%, var(--surface-02) 50%, var(--surface-01) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s ease infinite' }} />
  )
}

/* ─── Toast ──────────────────────────────────────────────────── */
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t) }, [onClose])
  return (
    <div style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 9999, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', borderRadius: 10, background: type === 'success' ? '#1A3C2D' : '#7F1D1D', color: '#fff', fontSize: 13.5, fontFamily: 'Inter', fontWeight: 500, boxShadow: '0 4px 20px rgba(0,0,0,0.25)', maxWidth: 360 }}>
      <span>{type === 'success' ? '✓' : '✕'}</span>
      <span>{message}</span>
      <button onClick={onClose} style={{ marginLeft: 8, background: 'none', border: 'none', color: '#fff', cursor: 'pointer', opacity: 0.7, fontSize: 16 }}>×</button>
    </div>
  )
}

/* ─── Operational Timeline ───────────────────────────────────── */
function OperationalTimeline({ events }: { events: PaymentRecord['timeline'] }) {
  return (
    <div style={{ position: 'relative', paddingLeft: 20 }}>
      <div style={{ position: 'absolute', left: 7, top: 6, bottom: 6, width: 2, background: 'var(--border-neutral)' }} />
      {events.map((ev, i) => {
        const isLast = i === events.length - 1
        let dotBg = '#D1D5DB', dotBorder = '#9CA3AF', pulse = false
        if (ev.state === 'completed') { dotBg = '#22C55E'; dotBorder = '#16A34A' }
        else if (ev.state === 'current') { dotBg = '#3B82F6'; dotBorder = '#2563EB'; pulse = true }
        else if (ev.state === 'warning') { dotBg = '#F59E0B'; dotBorder = '#D97706' }
        return (
          <div key={ev.id} style={{ position: 'relative', paddingBottom: isLast ? 0 : 18 }}>
            <div style={{ position: 'absolute', left: -14, top: 3, width: 14, height: 14, borderRadius: '50%', background: dotBg, border: `2px solid ${dotBorder}`, ...(pulse ? { animation: 'statusPulse 2s ease-in-out infinite' } : {}) }} />
            <div style={{ paddingLeft: 6 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{ev.event}</div>
              {ev.actor && <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 1 }}>{ev.actor}</div>}
              {ev.quantity && <div style={{ fontSize: 11.5, fontFamily: 'DM Mono', color: 'var(--text-secondary)', marginTop: 1 }}>{ev.quantity}</div>}
              {ev.notes && <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 1, fontStyle: 'italic' }}>{ev.notes}</div>}
              <div style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--text-muted)', marginTop: 2 }}>{ev.timestamp}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ─── Record Payment Modal ───────────────────────────────────── */
function RecordPaymentModal({ payment, bankAccounts, onClose, onSuccess }: {
  payment: PaymentRecord
  bankAccounts: BankAccount[]
  onClose: () => void
  onSuccess: () => void
}) {
  const [amount, setAmount]         = useState('')
  const [bankId, setBankId]         = useState(bankAccounts[0]?.id ?? '')
  const [transferRef, setRef]       = useState('')
  const [date, setDate]             = useState(() => new Date().toISOString().slice(0, 10))
  const [docName, setDocName]       = useState<string | undefined>(undefined)
  const [notes, setNotes]           = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const fileRef                     = useRef<HTMLInputElement>(null)

  const handleSubmit = async () => {
    if (!amount.trim() || !bankId || !transferRef.trim() || !date) {
      setError('Please fill in all required fields.')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      await recordPayment({ paymentId: payment.id, amount: amount.trim(), bankAccountId: bankId, transferRef: transferRef.trim(), date, documentName: docName, notes: notes.trim() || undefined })
      onSuccess()
    } catch {
      setError('Failed to record payment. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'var(--bg-primary)', borderRadius: 14, width: '100%', maxWidth: 520, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        {/* Header */}
        <div style={{ padding: '22px 24px 18px', borderBottom: '1px solid var(--border-neutral)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Record Payment</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'DM Mono' }}>{payment.orderRef} · {payment.customer.name}</div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: '50%', border: '1px solid var(--border-neutral)', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: 'var(--text-muted)' }}>×</button>
        </div>

        {/* Context strip */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-neutral)' }}>
          {[
            { label: 'TOTAL BILL', value: payment.totalAmount },
            { label: 'PREVIOUSLY PAID', value: payment.paidAmount },
            { label: 'CURRENT REMAINING', value: payment.remainingAmount },
          ].map((item, i) => (
            <div key={i} style={{ flex: 1, padding: '14px 16px', borderRight: i < 2 ? '1px solid var(--border-neutral)' : undefined }}>
              <div style={{ fontSize: 10, fontFamily: 'DM Mono', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 4 }}>{item.label}</div>
              <Etb amount={item.value} size={13} weight={700} />
            </div>
          ))}
        </div>

        {/* Form */}
        <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column' as const, gap: 16 }}>
          {/* Amount */}
          <div>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Payment Amount (ETB) <span style={{ color: '#DC2626' }}>*</span></label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="e.g. 50000"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, border: '1px solid var(--border-neutral)', background: 'var(--surface-01)', color: 'var(--text-primary)', fontSize: 14, fontFamily: 'DM Mono', boxSizing: 'border-box' as const, outline: 'none' }}
            />
          </div>

          {/* Bank Account */}
          <div>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Destination Bank Account <span style={{ color: '#DC2626' }}>*</span></label>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
              {bankAccounts.map(ba => (
                <label key={ba.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 8, border: `2px solid ${bankId === ba.id ? '#2B4D3A' : 'var(--border-neutral)'}`, background: bankId === ba.id ? '#F0FDF4' : 'var(--surface-01)', cursor: 'pointer' }}>
                  <input type="radio" name="bankAccount" value={ba.id} checked={bankId === ba.id} onChange={() => setBankId(ba.id)} style={{ accentColor: '#2B4D3A' }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{ba.bankName}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontFamily: 'DM Mono', marginTop: 1 }}>{ba.accountName} · {ba.accountNumber}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Transfer Ref */}
          <div>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Transfer Reference <span style={{ color: '#DC2626' }}>*</span></label>
            <input
              type="text"
              placeholder="e.g. TRF-2026-08-XXXXX"
              value={transferRef}
              onChange={e => setRef(e.target.value)}
              style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, border: '1px solid var(--border-neutral)', background: 'var(--surface-01)', color: 'var(--text-primary)', fontSize: 13, fontFamily: 'DM Mono', boxSizing: 'border-box' as const, outline: 'none' }}
            />
          </div>

          {/* Payment Date */}
          <div>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Payment Date <span style={{ color: '#DC2626' }}>*</span></label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, border: '1px solid var(--border-neutral)', background: 'var(--surface-01)', color: 'var(--text-primary)', fontSize: 13, fontFamily: 'DM Mono', boxSizing: 'border-box' as const, outline: 'none' }}
            />
          </div>

          {/* Supporting Document */}
          <div>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Supporting Document <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span></label>
            <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={e => setDocName(e.target.files?.[0]?.name)} />
            <button onClick={() => fileRef.current?.click()} style={{ height: 38, padding: '0 14px', borderRadius: 8, border: '1px dashed var(--border-neutral)', background: 'var(--surface-01)', color: 'var(--text-secondary)', fontSize: 12.5, cursor: 'pointer', fontFamily: 'Inter', display: 'flex', alignItems: 'center', gap: 7 }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 2v9M4 6l4-4 4 4M2 13h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              {docName ? docName : 'Upload File'}
            </button>
          </div>

          {/* Notes */}
          <div>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Notes <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span></label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Any additional context..."
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-neutral)', background: 'var(--surface-01)', color: 'var(--text-primary)', fontSize: 13, fontFamily: 'Inter', resize: 'vertical' as const, boxSizing: 'border-box' as const, outline: 'none' }}
            />
          </div>

          {error && (
            <div style={{ padding: '10px 14px', borderRadius: 8, background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', fontSize: 13 }}>{error}</div>
          )}

          {/* Footer note */}
          <div style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--surface-01)', border: '1px solid var(--border-neutral)', fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Pricing and remaining balance calculated by the server. PHP determines the updated payment status.
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={onClose} disabled={submitting} style={{ height: 40, padding: '0 18px', borderRadius: 8, border: '1px solid var(--border-neutral)', background: 'none', color: 'var(--text-secondary)', fontSize: 13.5, cursor: 'pointer', fontFamily: 'Inter', fontWeight: 500 }}>Cancel</button>
            <button onClick={handleSubmit} disabled={submitting} style={{ height: 40, padding: '0 22px', borderRadius: 8, border: 'none', background: '#2B4D3A', color: '#fff', fontSize: 13.5, fontWeight: 600, fontFamily: 'Inter', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
              {submitting ? 'Recording…' : 'Record Payment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Verify Payment Modal ───────────────────────────────────── */
function VerifyPaymentModal({ transaction, payment, currentUserId, onClose, onSuccess }: {
  transaction: PaymentTransaction
  payment: PaymentRecord
  currentUserId: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [notes, setNotes]           = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState<string | null>(null)

  const handleVerify = async () => {
    setSubmitting(true)
    setError(null)
    try {
      await verifyPayment(transaction.id, currentUserId, notes.trim() || undefined)
      onSuccess()
    } catch {
      setError('Verification failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'var(--bg-primary)', borderRadius: 14, width: '100%', maxWidth: 460, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
        <div style={{ padding: '22px 24px 18px', borderBottom: '1px solid var(--border-neutral)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Verify Payment</div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: '50%', border: '1px solid var(--border-neutral)', background: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--text-muted)' }}>×</button>
        </div>
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column' as const, gap: 14 }}>
          {/* Details */}
          <div style={{ background: 'var(--surface-01)', border: '1px solid var(--border-neutral)', borderRadius: 10, padding: '14px 16px', display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
            {[
              { label: 'Customer', value: payment.customer.name, mono: false },
              { label: 'Order', value: payment.orderRef, mono: true },
              { label: 'Amount', value: transaction.amount, mono: true },
              { label: 'Transfer Ref', value: transaction.transferRef, mono: true },
              { label: 'Bank', value: `${transaction.bankAccount.bankName} · ${transaction.bankAccount.accountNumber}`, mono: true },
              { label: 'Date', value: transaction.date, mono: false },
              ...(transaction.documentName ? [{ label: 'Document', value: transaction.documentName, mono: true }] : []),
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>{row.label}</span>
                <span style={{ fontSize: 13, fontFamily: row.mono ? 'DM Mono' : 'Inter', color: 'var(--text-primary)', fontWeight: 500, textAlign: 'right' as const }}>{row.value}</span>
              </div>
            ))}
          </div>

          <div style={{ padding: '10px 14px', borderRadius: 8, background: '#FFFBEB', border: '1px solid #FDE68A', fontSize: 12.5, color: '#B45309' }}>
            Confirm you have validated this transfer against your bank statement.
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Verification Notes <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span></label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="Cross-checked with bank statement…"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-neutral)', background: 'var(--surface-01)', color: 'var(--text-primary)', fontSize: 13, fontFamily: 'Inter', resize: 'none' as const, boxSizing: 'border-box' as const, outline: 'none' }}
            />
          </div>

          {error && <div style={{ padding: '10px 14px', borderRadius: 8, background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', fontSize: 13 }}>{error}</div>}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={onClose} disabled={submitting} style={{ height: 40, padding: '0 18px', borderRadius: 8, border: '1px solid var(--border-neutral)', background: 'none', color: 'var(--text-secondary)', fontSize: 13.5, cursor: 'pointer', fontFamily: 'Inter', fontWeight: 500 }}>Cancel</button>
            <button onClick={handleVerify} disabled={submitting} style={{ height: 40, padding: '0 22px', borderRadius: 8, border: 'none', background: '#2B4D3A', color: '#fff', fontSize: 13.5, fontWeight: 600, fontFamily: 'Inter', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
              {submitting ? 'Verifying…' : 'Verify Payment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Payment History section ────────────────────────────────── */
function PaymentHistory({ transactions, canVerify, onVerify }: {
  transactions: PaymentTransaction[]
  canVerify: boolean
  onVerify: (tx: PaymentTransaction) => void
}) {
  if (transactions.length === 0) return (
    <div style={{ textAlign: 'center', padding: '28px 16px', background: 'var(--surface-01)', border: '1px solid var(--border-neutral)', borderRadius: 10 }}>
      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No payment transactions recorded yet.</div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
      {transactions.map(tx => {
        const vm = VERIFY_META[tx.verificationStatus]
        return (
          <div key={tx.id} style={{ background: 'var(--surface-01)', border: '1px solid var(--border-neutral)', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' as const }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontFamily: 'DM Mono', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Payment #{tx.paymentNumber}</span>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: vm.bg, color: vm.text, fontWeight: 600, fontFamily: 'DM Mono' }}>{vm.label}</span>
                </div>
                <Etb amount={tx.amount} size={18} weight={700} />
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, display: 'flex', flexWrap: 'wrap' as const, gap: '4px 12px' }}>
                  <span>{tx.date}</span>
                  <span style={{ fontFamily: 'DM Mono' }}>{tx.bankAccount.bankName} · {tx.bankAccount.accountNumber}</span>
                  <span style={{ fontFamily: 'DM Mono' }}>Ref: {tx.transferRef}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Recorded by {tx.recordedBy}</div>
                {tx.verifiedBy && <div style={{ fontSize: 11.5, color: '#15803D', marginTop: 2 }}>Verified by {tx.verifiedBy} · {tx.verifiedAt}</div>}
                {tx.documentName && <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'DM Mono' }}>📎 {tx.documentName}</div>}
              </div>
              {canVerify && tx.verificationStatus === 'pending-verification' && (
                <button onClick={() => onVerify(tx)} style={{ height: 32, padding: '0 14px', borderRadius: 7, border: 'none', background: '#2B4D3A', color: '#fff', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter', flexShrink: 0 }}>Verify</button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ─── List View ──────────────────────────────────────────────── */
function PaymentListView({
  onSelectPayment,
  onRecordPayment,
  onNavigate,
  role,
}: {
  onSelectPayment: (id: string) => void
  onRecordPayment: (payment: PaymentRecord) => void
  onNavigate?: (view: View) => void
  role: string
}) {
  const { isNarrow } = useBreakpoint()
  const [summary, setSummary]             = useState<PaymentSummaryStats | null>(null)
  const [payments, setPayments]           = useState<PaymentRecord[]>([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState<string | null>(null)
  const [search, setSearch]               = useState('')
  const [statusFilter, setStatusFilter]   = useState<PaymentStatus | ''>('')

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const [sumRes, listRes] = await Promise.all([
        getPaymentSummary(),
        listPayments({ status: statusFilter || undefined, search: search || undefined }),
      ])
      if (sumRes.data) setSummary(sumRes.data)
      else if (sumRes.error) throw new Error(sumRes.error)
      if (listRes.data) setPayments(listRes.data)
      else if (listRes.error) throw new Error(listRes.error)
    } catch {
      setError('Failed to load payments. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [statusFilter])

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); load() }

  if (error) return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <div style={{ fontSize: 14, color: '#DC2626', marginBottom: 12 }}>{error}</div>
      <button onClick={load} style={{ height: 36, padding: '0 18px', borderRadius: 8, border: '1px solid var(--border-neutral)', background: 'none', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer', fontFamily: 'Inter' }}>Retry</button>
    </div>
  )

  return (
    <div>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 16, flexWrap: 'wrap' as const }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Payments</h1>
          <p style={{ fontSize: 13.5, color: 'var(--text-muted)', margin: '4px 0 0', lineHeight: 1.5 }}>Track customer payments, outstanding balances, and payment deadlines.</p>
        </div>
        {can(role as any, 'payments.record') && (
          <button style={{ height: 40, padding: '0 20px', borderRadius: 8, border: 'none', background: '#2B4D3A', color: '#fff', fontSize: 13.5, fontWeight: 600, fontFamily: 'Inter', cursor: 'pointer', flexShrink: 0 }}>
            + Record Payment
          </button>
        )}
      </div>

      {/* Summary strip */}
      <div style={{ display: 'grid', gridTemplateColumns: isNarrow ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)', gap: 12, marginBottom: 24 }}>
        {loading ? Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{ background: 'var(--surface-01)', border: '1px solid var(--border-neutral)', borderRadius: 10, padding: '18px 20px' }}>
            <Skeleton w={80} h={11} />
            <div style={{ marginTop: 10 }}><Skeleton w={48} h={22} /></div>
          </div>
        )) : summary ? (
          <>
            {[
              { label: 'Payment Pending', value: summary.paymentPending, accent: 'var(--text-muted)',  danger: false, nav: null },
              { label: 'Partially Paid',  value: summary.partiallyPaid,  accent: '#B45309',            danger: false, nav: 'outstanding' as View },
              { label: 'Paid',            value: summary.paid,           accent: '#15803D',            danger: false, nav: null },
              { label: 'Overdue',         value: summary.overdue,        accent: '#DC2626',            danger: true,  nav: 'overdue' as View },
            ].map(card => (
              <div key={card.label} onClick={card.nav && onNavigate ? () => onNavigate(card.nav!) : undefined}
                style={{ background: card.danger ? '#FEF2F2' : 'var(--surface-01)', border: `1px solid ${card.danger ? '#FCA5A5' : 'var(--border-neutral)'}`, borderRadius: 10, padding: '18px 20px', cursor: card.nav ? 'pointer' : 'default', transition: 'box-shadow 0.15s' }}>
                <div style={{ fontSize: 11, fontFamily: 'DM Mono', color: card.danger ? '#DC2626' : 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 8 }}>{card.label}</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: card.accent, lineHeight: 1 }}>{card.value}</div>
                {card.nav && <div style={{ fontSize: 10.5, color: card.danger ? '#DC2626' : '#B45309', marginTop: 6, fontFamily: 'Inter', letterSpacing: '0.02em' }}>View →</div>}
              </div>
            ))}
            <div onClick={onNavigate ? () => onNavigate('outstanding') : undefined}
              style={{ background: 'var(--surface-01)', border: '1px solid var(--border-neutral)', borderRadius: 10, padding: '18px 20px', cursor: onNavigate ? 'pointer' : 'default' }}>
              <div style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 8 }}>Outstanding Amount</div>
              <Etb amount={summary.outstandingAmount} size={20} weight={700} />
              <div style={{ fontSize: 10.5, color: '#B45309', marginTop: 6, fontFamily: 'Inter' }}>View outstanding →</div>
            </div>
          </>
        ) : null}
      </div>

      {/* Search + Filter bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' as const }}>
        <form onSubmit={handleSearch} style={{ flex: 1, minWidth: 200, display: 'flex', gap: 8 }}>
          <input
            type="text"
            placeholder="Search by order, customer, reference…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, height: 38, padding: '0 12px', borderRadius: 8, border: '1px solid var(--border-neutral)', background: 'var(--surface-01)', color: 'var(--text-primary)', fontSize: 13, fontFamily: 'Inter', outline: 'none' }}
          />
          <button type="submit" style={{ height: 38, padding: '0 16px', borderRadius: 8, border: '1px solid var(--border-neutral)', background: 'var(--surface-01)', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer', fontFamily: 'Inter' }}>Search</button>
        </form>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as PaymentStatus | '')}
          style={{ height: 38, padding: '0 12px', borderRadius: 8, border: '1px solid var(--border-neutral)', background: 'var(--surface-01)', color: 'var(--text-primary)', fontSize: 13, fontFamily: 'Inter', cursor: 'pointer', outline: 'none' }}
        >
          <option value="">All Statuses</option>
          <option value="payment-pending">Payment Pending</option>
          <option value="partially-paid">Partially Paid</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      {/* Loading skeleton rows */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ background: 'var(--surface-01)', border: '1px solid var(--border-neutral)', borderRadius: 10, padding: '16px 20px', display: 'flex', gap: 16, alignItems: 'center' }}>
              <Skeleton w={100} h={12} />
              <Skeleton w={140} h={12} />
              <Skeleton w={110} h={12} />
              <Skeleton w={110} h={12} />
              <Skeleton w={80} h={20} radius={99} />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && payments.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🧾</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>No payments found</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Try adjusting your search or filter criteria.</div>
        </div>
      )}

      {/* Desktop table */}
      {!loading && payments.length > 0 && !isNarrow && (
        <div style={{ background: 'var(--surface-01)', border: '1px solid var(--border-neutral)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' as const }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--surface-02)' }}>
                  {['Order', 'Customer', 'Total Amount', 'Paid Amount', 'Remaining', 'First Delivery', 'Deadline', 'Days Remaining', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '11px 14px', textAlign: 'left' as const, fontSize: 11, fontFamily: 'DM Mono', color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' as const, fontWeight: 600, whiteSpace: 'nowrap' as const, borderBottom: '1px solid var(--border-neutral)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map(p => {
                  const overdue = p.paymentStatus === 'overdue'
                  return (
                    <tr
                      key={p.id}
                      style={{ borderBottom: '1px solid var(--border-neutral)', background: overdue ? '#FFF5F5' : 'transparent', cursor: 'pointer' }}
                      onClick={() => onSelectPayment(p.id)}
                    >
                      <td style={{ padding: '12px 14px', fontFamily: 'DM Mono', fontSize: 12.5, color: 'var(--text-primary)', fontWeight: 600, whiteSpace: 'nowrap' as const }}>{p.orderRef}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{p.customer.name}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 1 }}>{p.customer.contactName}</div>
                      </td>
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' as const }}><Etb amount={p.totalAmount} size={13} /></td>
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' as const }}><Etb amount={p.paidAmount} size={13} /></td>
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' as const }}><Etb amount={p.remainingAmount} size={13} /></td>
                      <td style={{ padding: '12px 14px', fontSize: 12.5, color: 'var(--text-secondary)', whiteSpace: 'nowrap' as const }}>{p.firstVerifiedDelivery ?? '—'}</td>
                      <td style={{ padding: '12px 14px', fontSize: 12.5, fontFamily: 'DM Mono', color: 'var(--text-secondary)', whiteSpace: 'nowrap' as const }}>{p.paymentDeadline ?? '—'}</td>
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' as const }}>
                        {p.daysRemaining
                          ? <span style={{ fontFamily: 'DM Mono', fontSize: 12.5, fontWeight: 700, color: daysColor(p.daysRemainingNum) }}>{p.daysRemaining}</span>
                          : '—'}
                      </td>
                      <td style={{ padding: '12px 14px' }}><StatusPill status={p.paymentStatus} /></td>
                      <td style={{ padding: '12px 14px' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => onSelectPayment(p.id)} style={{ height: 30, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-neutral)', background: 'none', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer', fontFamily: 'Inter' }}>View</button>
                          {can(role as any, 'payments.record') && p.paymentStatus !== 'paid' && (
                            <button onClick={() => onRecordPayment(p)} style={{ height: 30, padding: '0 12px', borderRadius: 6, border: 'none', background: '#2B4D3A', color: '#fff', fontSize: 12, cursor: 'pointer', fontFamily: 'Inter', fontWeight: 500 }}>Record</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mobile cards */}
      {!loading && payments.length > 0 && isNarrow && (
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
          {payments.map(p => {
            const overdue = p.paymentStatus === 'overdue'
            return (
              <div key={p.id} onClick={() => onSelectPayment(p.id)} style={{ background: overdue ? '#FFF5F5' : 'var(--surface-01)', border: `1px solid ${overdue ? '#FCA5A5' : 'var(--border-neutral)'}`, borderRadius: 12, padding: '16px', cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 14 }}>{p.customer.name}</div>
                    <div style={{ fontFamily: 'DM Mono', fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>{p.orderRef}</div>
                  </div>
                  <StatusPill status={p.paymentStatus} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', marginBottom: 12 }}>
                  {[
                    { label: 'Total', value: p.totalAmount },
                    { label: 'Paid', value: p.paidAmount },
                    { label: 'Remaining', value: p.remainingAmount },
                    { label: 'Deadline', value: p.paymentDeadline ?? '—' },
                  ].map(f => (
                    <div key={f.label}>
                      <div style={{ fontSize: 10, fontFamily: 'DM Mono', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 2 }}>{f.label}</div>
                      <Etb amount={f.value} size={12.5} />
                    </div>
                  ))}
                </div>
                {p.daysRemaining && (
                  <div style={{ fontSize: 12, fontFamily: 'DM Mono', color: daysColor(p.daysRemainingNum), fontWeight: 700, marginBottom: 10 }}>{p.daysRemaining}</div>
                )}
                <div style={{ display: 'flex', gap: 8 }} onClick={e => e.stopPropagation()}>
                  <button onClick={() => onSelectPayment(p.id)} style={{ flex: 1, height: 34, borderRadius: 8, border: '1px solid var(--border-neutral)', background: 'none', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer', fontFamily: 'Inter' }}>View Details</button>
                  {can(role as any, 'payments.record') && p.paymentStatus !== 'paid' && (
                    <button onClick={() => onRecordPayment(p)} style={{ flex: 1, height: 34, borderRadius: 8, border: 'none', background: '#2B4D3A', color: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'Inter', fontWeight: 500 }}>Record Payment</button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ─── Detail View ────────────────────────────────────────────── */
function PaymentDetailView({
  paymentId,
  role,
  currentUserId,
  onBack,
  onRecordPayment,
}: {
  paymentId: string
  role: string
  currentUserId: string
  onBack: () => void
  onRecordPayment: (payment: PaymentRecord) => void
}) {
  const { isNarrow } = useBreakpoint()
  const [payment, setPayment]         = useState<PaymentRecord | null>(null)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [verifyingTx, setVerifyingTx] = useState<PaymentTransaction | null>(null)

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const res = await getPayment(paymentId)
      if (res.data) setPayment(res.data)
      else throw new Error(res.error ?? 'Not found')
    } catch {
      setError('Failed to load payment details.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [paymentId])

  if (loading) return (
    <div style={{ padding: 32, display: 'flex', flexDirection: 'column' as const, gap: 16 }}>
      <Skeleton w={180} h={14} />
      <Skeleton w="100%" h={120} radius={10} />
      <Skeleton w="100%" h={80} radius={10} />
    </div>
  )

  if (error || !payment) return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <div style={{ fontSize: 14, color: '#DC2626', marginBottom: 12 }}>{error ?? 'Payment not found.'}</div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        <button onClick={onBack} style={{ height: 36, padding: '0 18px', borderRadius: 8, border: '1px solid var(--border-neutral)', background: 'none', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}>← Back</button>
        <button onClick={load} style={{ height: 36, padding: '0 18px', borderRadius: 8, border: '1px solid var(--border-neutral)', background: 'none', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}>Retry</button>
      </div>
    </div>
  )

  const isOverdue = payment.paymentStatus === 'overdue'
  const isPaid    = payment.paymentStatus === 'paid'
  const isPartial = payment.paymentStatus === 'partially-paid'
  const canRecord = can(role as any, 'payments.record')
  const canVerify = can(role as any, 'payments.verify')

  return (
    <div>
      {/* Back breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
        <button onClick={onBack} style={{ height: 34, padding: '0 14px', borderRadius: 8, border: '1px solid var(--border-neutral)', background: 'none', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer', fontFamily: 'Inter', display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Payments
        </button>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>/</span>
        <span style={{ fontSize: 12, fontFamily: 'DM Mono', color: 'var(--text-muted)' }}>{payment.ref}</span>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'flex', flexDirection: isNarrow ? 'column' : 'row', gap: 24, alignItems: 'flex-start' }}>

        {/* LEFT column */}
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 20, flex: '0 0 auto', width: isNarrow ? '100%' : 'calc(60% - 12px)' }}>

          {/* Payment header */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: 10 }}>
              <div>
                <div style={{ fontFamily: 'DM Mono', fontSize: 12, color: 'var(--text-muted)', marginBottom: 3 }}>{payment.orderRef}</div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{payment.customer.name}</h2>
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 3 }}>{payment.customer.contactName}</div>
              </div>
              <StatusPill status={payment.paymentStatus} size="md" />
            </div>
          </div>

          {/* Overdue banner */}
          {isOverdue && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9.5" fill="#FEE2E2" stroke="#EF4444" /><path d="M10 5.5v5M10 13v1.5" stroke="#DC2626" strokeWidth="1.8" strokeLinecap="round" /></svg>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#DC2626' }}>Payment Overdue</div>
                {payment.daysRemaining && <div style={{ fontSize: 12.5, color: '#B91C1C', marginTop: 1 }}>{payment.daysRemaining} · Deadline: {payment.paymentDeadline}</div>}
              </div>
            </div>
          )}

          {/* Payment Summary card */}
          <div style={{ background: 'var(--surface-01)', border: '1px solid var(--border-neutral)', borderRadius: 12, overflow: 'hidden' }}>
            {isPaid && (
              <div style={{ background: '#16A34A', color: '#fff', padding: '10px 20px', fontSize: 13, fontWeight: 700, letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7.5" stroke="#fff" /><path d="M4.5 8.5l2 2 5-5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                PAID IN FULL
              </div>
            )}
            {isPartial && (
              <div style={{ background: '#B45309', color: '#fff', padding: '10px 20px', fontSize: 13, fontWeight: 700, letterSpacing: '0.04em' }}>PARTIALLY PAID</div>
            )}
            {isOverdue && (
              <div style={{ background: '#DC2626', color: '#fff', padding: '10px 20px', fontSize: 13, fontWeight: 700, letterSpacing: '0.04em' }}>OVERDUE</div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {[
                { label: 'TOTAL BILL',  value: payment.totalAmount },
                { label: 'PAID',        value: payment.paidAmount },
                { label: 'REMAINING',   value: payment.remainingAmount },
              ].map((kpi, i) => (
                <div key={kpi.label} style={{ padding: '22px 20px', borderRight: i < 2 ? '1px solid var(--border-neutral)' : undefined }}>
                  <div style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 8 }}>{kpi.label}</div>
                  <Etb amount={kpi.value} size={isNarrow ? 15 : 22} weight={700} />
                </div>
              ))}
            </div>
          </div>

          {/* Payment Deadline card */}
          {payment.paymentDeadline && (
            <div style={{ background: 'var(--surface-01)', border: `1px solid ${isOverdue ? '#FCA5A5' : 'var(--border-neutral)'}`, borderRadius: 12, padding: '18px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' as const, gap: 10 }}>
                <div>
                  <div style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 6 }}>Payment Deadline</div>
                  <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'DM Mono', color: isOverdue ? '#DC2626' : 'var(--text-primary)' }}>{payment.paymentDeadline}</div>
                  {payment.daysRemaining && (
                    <div style={{ fontSize: 13, fontFamily: 'DM Mono', color: daysColor(payment.daysRemainingNum), fontWeight: 700, marginTop: 5 }}>{payment.daysRemaining}</div>
                  )}
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.5 }}>7 days from first verified delivery. Deadline determined by the server.</div>
                </div>
                {payment.daysRemainingNum !== undefined && (
                  <div style={{ padding: '5px 12px', borderRadius: 99, background: isOverdue ? '#FEF2F2' : (payment.daysRemainingNum < 5 ? '#FFFBEB' : '#F0FDF4'), border: `1px solid ${isOverdue ? '#FCA5A5' : (payment.daysRemainingNum < 5 ? '#FDE68A' : '#BBF7D0')}`, fontSize: 12, fontWeight: 700, color: daysColor(payment.daysRemainingNum), flexShrink: 0 }}>
                    {isOverdue ? 'Danger' : payment.daysRemainingNum < 5 ? 'Warning' : 'Safe'}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Payment History */}
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>Payment History</div>
            <PaymentHistory
              transactions={payment.transactions}
              canVerify={canVerify}
              onVerify={tx => setVerifyingTx(tx)}
            />
            {canRecord && payment.paymentStatus !== 'paid' && (
              <button
                onClick={() => onRecordPayment(payment)}
                style={{ marginTop: 14, height: 40, padding: '0 20px', borderRadius: 8, border: 'none', background: '#2B4D3A', color: '#fff', fontSize: 13.5, fontWeight: 600, fontFamily: 'Inter', cursor: 'pointer' }}
              >
                + Record Payment
              </button>
            )}
          </div>

          {/* Overdue manager actions */}
          {isOverdue && (
            <div style={{ background: 'var(--surface-01)', border: '1px solid var(--border-neutral)', borderRadius: 12, padding: '18px 20px' }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>Manager Actions</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as const }}>
                <button style={{ height: 36, padding: '0 16px', borderRadius: 8, border: '1px solid #FCA5A5', background: '#FEF2F2', color: '#DC2626', fontSize: 13, cursor: 'pointer', fontFamily: 'Inter', fontWeight: 500 }}>Follow Up</button>
                <button style={{ height: 36, padding: '0 16px', borderRadius: 8, border: '1px solid var(--border-neutral)', background: 'none', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer', fontFamily: 'Inter' }}>Escalate</button>
                <button style={{ height: 36, padding: '0 16px', borderRadius: 8, border: '1px solid var(--border-neutral)', background: 'none', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer', fontFamily: 'Inter' }}>Add Note</button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT column */}
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 20, flex: '1 1 auto' }}>

          {/* Order Context card */}
          <div style={{ background: 'var(--surface-01)', border: '1px solid var(--border-neutral)', borderRadius: 12, padding: '18px 20px' }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>Order Context</div>
            {[
              { label: 'Order Reference', value: payment.orderRef, mono: true },
              { label: 'Customer', value: payment.customer.name, mono: false },
              { label: 'Contact', value: payment.customer.contactName, mono: false },
              { label: 'First Verified Delivery', value: payment.firstVerifiedDelivery ?? '—', mono: false },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>{row.label}</span>
                <span style={{ fontSize: 13, fontFamily: row.mono ? 'DM Mono' : 'Inter', color: 'var(--text-primary)', fontWeight: 500, textAlign: 'right' as const }}>{row.value}</span>
              </div>
            ))}
          </div>

          {/* Operational Timeline */}
          <div style={{ background: 'var(--surface-01)', border: '1px solid var(--border-neutral)', borderRadius: 12, padding: '18px 20px' }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>Operational Timeline</div>
            {payment.timeline.length > 0
              ? <OperationalTimeline events={payment.timeline} />
              : <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No timeline events available.</div>
            }
          </div>

          {/* Module note */}
          <div style={{ padding: '12px 16px', borderRadius: 10, background: 'var(--surface-01)', border: '1px solid var(--border-neutral)', fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            This is not a banking or reconciliation module. Payment recording belongs to authorized finance staff only.
          </div>
        </div>
      </div>

      {/* Verify modal */}
      {verifyingTx && (
        <VerifyPaymentModal
          transaction={verifyingTx}
          payment={payment}
          currentUserId={currentUserId}
          onClose={() => setVerifyingTx(null)}
          onSuccess={() => { setVerifyingTx(null); load() }}
        />
      )}
    </div>
  )
}

/* ─── Outstanding Payments View ─────────────────────────────── */
function OutstandingPaymentsView({ onBack, onSelectPayment }: { onBack: () => void; onSelectPayment: (id: string) => void }) {
  const { isNarrow } = useBreakpoint()
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)

  const load = async () => {
    setLoading(true); setError(null)
    const r = await listPayments({ status: 'partially-paid' })
    const r2 = await listPayments({ status: 'payment-pending' })
    if (r.data && r2.data) setPayments([...r.data, ...r2.data])
    else setError(r.error ?? r2.error ?? 'Failed to load outstanding payments.')
    setLoading(false)
  }

  useEffect(() => { void load() }, [])

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={onBack} style={{ height: 36, padding: '0 14px', borderRadius: 8, border: '1px solid var(--border-neutral)', background: 'var(--surface-01)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter', display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Payments
        </button>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Outstanding Payments</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '2px 0 0', fontFamily: 'Inter' }}>Orders with pending or partial payment status.</p>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1,2,3].map(i => <div key={i} style={{ height: 80, background: 'var(--surface-01)', border: '1px solid var(--border-neutral)', borderRadius: 10, animation: 'shimmer 1.4s ease infinite', backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg,var(--surface-01) 25%,var(--border-neutral) 50%,var(--surface-01) 75%)' }} />)}
        </div>
      ) : error ? (
        <div style={{ padding: '32px 24px', textAlign: 'center', color: '#DC2626', fontSize: 13 }}>{error} <button onClick={load} style={{ marginLeft: 8, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Retry</button></div>
      ) : payments.length === 0 ? (
        <div style={{ padding: '64px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>✓</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)' }}>No outstanding payments.</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>All orders are fully paid.</div>
        </div>
      ) : (
        <div style={{ background: 'var(--surface-01)', border: '1px solid var(--border-neutral)', borderRadius: 10, overflow: 'hidden' }}>
          {isNarrow ? (
            <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {payments.map(p => (
                <div key={p.id} onClick={() => onSelectPayment(p.id)} style={{ border: '1px solid var(--border-neutral)', borderRadius: 10, padding: '14px 16px', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontFamily: 'DM Mono', fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>{p.ref}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>{p.customer.name}</div>
                    </div>
                    <StatusPill status={p.paymentStatus} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, fontSize: 12 }}>
                    <div><div style={{ fontSize: 10, fontFamily: 'DM Mono', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Total</div><Etb amount={p.totalAmount} size={12} weight={600} /></div>
                    <div><div style={{ fontSize: 10, fontFamily: 'DM Mono', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Paid</div><Etb amount={p.paidAmount} size={12} weight={600} /></div>
                    <div><div style={{ fontSize: 10, fontFamily: 'DM Mono', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Outstanding</div><Etb amount={p.remainingAmount} size={12} weight={700} /></div>
                  </div>
                  {p.paymentDeadline && <div style={{ fontSize: 11, fontFamily: 'DM Mono', color: daysColor(p.daysRemainingNum), marginTop: 8 }}>Deadline: {p.paymentDeadline} · {p.daysRemaining}</div>}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, fontFamily: 'Inter' }}>
                <thead>
                  <tr style={{ background: 'var(--surface-01)', borderBottom: '1px solid var(--border-neutral)' }}>
                    {['Reference', 'Order', 'Customer', 'Order Total', 'Paid', 'Outstanding', 'Deadline', 'Days', 'Status', ''].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: h === 'Order Total' || h === 'Paid' || h === 'Outstanding' ? 'right' : 'left', fontSize: 11, fontFamily: 'DM Mono', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p.id} onClick={() => onSelectPayment(p.id)} style={{ borderBottom: '1px solid var(--border-neutral)', cursor: 'pointer' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-02)')}
                      onMouseLeave={e => (e.currentTarget.style.background = '')}>
                      <td style={{ padding: '11px 14px', fontFamily: 'DM Mono', fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{p.ref}</td>
                      <td style={{ padding: '11px 14px', fontFamily: 'DM Mono', fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{p.orderRef}</td>
                      <td style={{ padding: '11px 14px', fontWeight: 600, color: 'var(--text-primary)' }}>{p.customer.name}</td>
                      <td style={{ padding: '11px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}><Etb amount={p.totalAmount} size={13} /></td>
                      <td style={{ padding: '11px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}><Etb amount={p.paidAmount} size={13} /></td>
                      <td style={{ padding: '11px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}><Etb amount={p.remainingAmount} size={13} weight={700} /></td>
                      <td style={{ padding: '11px 14px', fontFamily: 'DM Mono', fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{p.paymentDeadline ?? '—'}</td>
                      <td style={{ padding: '11px 14px', fontFamily: 'DM Mono', fontSize: 12, color: daysColor(p.daysRemainingNum), whiteSpace: 'nowrap' }}>{p.daysRemaining ?? '—'}</td>
                      <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}><StatusPill status={p.paymentStatus} /></td>
                      <td style={{ padding: '11px 14px' }}><button onClick={e => { e.stopPropagation(); onSelectPayment(p.id) }} style={{ height: 30, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-neutral)', background: 'var(--surface-01)', color: 'var(--text-primary)', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>View</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── Overdue Payments View ──────────────────────────────────── */
function OverduePaymentsView({ onBack, onSelectPayment }: { onBack: () => void; onSelectPayment: (id: string) => void }) {
  const { isNarrow } = useBreakpoint()
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)

  const load = async () => {
    setLoading(true); setError(null)
    const r = await listPayments({ status: 'overdue' })
    if (r.data) setPayments(r.data)
    else setError(r.error ?? 'Failed to load overdue payments.')
    setLoading(false)
  }

  useEffect(() => { void load() }, [])

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={onBack} style={{ height: 36, padding: '0 14px', borderRadius: 8, border: '1px solid var(--border-neutral)', background: 'var(--surface-01)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter', display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Payments
        </button>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#DC2626', margin: 0 }}>Overdue Payments</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '2px 0 0', fontFamily: 'Inter' }}>Payments past their deadline requiring immediate attention.</p>
        </div>
      </div>

      {!loading && payments.length > 0 && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 10, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M10 3L18 17H2L10 3z" stroke="#DC2626" strokeWidth="1.6" strokeLinejoin="round"/><path d="M10 9v3M10 14h.01" stroke="#DC2626" strokeWidth="1.8" strokeLinecap="round"/></svg>
          <span style={{ fontSize: 13, color: '#DC2626', fontWeight: 600, fontFamily: 'Inter' }}>{payments.length} payment{payments.length !== 1 ? 's' : ''} overdue. Contact customers and initiate payment collection.</span>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1,2,3].map(i => <div key={i} style={{ height: 100, background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 10, animation: 'shimmer 1.4s ease infinite' }} />)}
        </div>
      ) : error ? (
        <div style={{ padding: '32px 24px', textAlign: 'center', color: '#DC2626', fontSize: 13 }}>{error} <button onClick={load} style={{ marginLeft: 8, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Retry</button></div>
      ) : payments.length === 0 ? (
        <div style={{ padding: '64px 24px', textAlign: 'center', background: 'var(--surface-01)', border: '1px solid var(--border-neutral)', borderRadius: 10 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>✓</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)' }}>No overdue payments.</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>All outstanding payments are within their deadline.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {payments.map(p => (
            <div key={p.id} style={{ background: '#FFFAFA', border: '1.5px solid #FCA5A5', borderRadius: 12, padding: isNarrow ? '16px' : '20px 24px', cursor: 'pointer' }} onClick={() => onSelectPayment(p.id)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 14 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontFamily: 'DM Mono', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{p.ref}</span>
                    <span style={{ fontFamily: 'DM Mono', fontSize: 11.5, color: 'var(--text-muted)' }}>{p.orderRef}</span>
                    <StatusPill status={p.paymentStatus} />
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Inter' }}>{p.customer.name}</div>
                  {p.daysRemaining && <div style={{ fontSize: 12.5, color: '#DC2626', marginTop: 4, fontFamily: 'DM Mono', fontWeight: 600 }}>{p.daysRemaining}</div>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, fontFamily: 'DM Mono', color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Outstanding</div>
                  <div style={{ fontFamily: 'DM Mono', fontSize: 22, fontWeight: 800, color: '#DC2626', lineHeight: 1 }}>{p.remainingAmount}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '8px 16px', background: 'rgba(255,255,255,0.6)', borderRadius: 8, padding: '12px 14px', border: '1px solid #FCA5A5' }}>
                {[
                  { label: 'Order Total', value: p.totalAmount },
                  { label: 'Paid', value: p.paidAmount },
                  { label: 'Deadline', value: p.paymentDeadline ?? '—' },
                ].map(item => (
                  <div key={item.label}>
                    <div style={{ fontSize: 10, fontFamily: 'DM Mono', color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{item.label}</div>
                    <div style={{ fontFamily: 'DM Mono', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{item.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                <button onClick={e => { e.stopPropagation(); onSelectPayment(p.id) }} style={{ height: 34, padding: '0 16px', borderRadius: 7, border: '1.5px solid #DC2626', background: 'transparent', color: '#DC2626', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter' }}>View Payment →</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Root component ─────────────────────────────────────────── */
export default function Payments() {
  const { currentUser } = useAuth()
  const role = currentUser?.role ?? 'viewer'

  const [view, setView]                 = useState<View>('list')
  const [selectedId, setSelectedId]     = useState<string | null>(null)
  const [recordTarget, setRecordTarget] = useState<PaymentRecord | null>(null)
  const [bankAccounts]                  = useState<BankAccount[]>(() => getBankAccounts())
  const [toast, setToast]               = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [listKey, setListKey]           = useState(0)

  if (!can(role as any, 'payments.view')) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>Access Denied</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>You don't have permission to view the Payments module.</div>
      </div>
    )
  }

  const goToDetail     = (id: string) => { setSelectedId(id); setView('detail') }
  const goToList       = ()           => { setSelectedId(null); setView('list') }
  const handleNavigate = (v: View)    => setView(v)

  const handleRecordSuccess = () => {
    setRecordTarget(null)
    setToast({ message: 'Payment recorded successfully.', type: 'success' })
    if (view === 'list') setListKey(k => k + 1)
  }

  return (
    <div style={{ padding: '28px 28px 48px', maxWidth: 1400, margin: '0 auto' }}>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0 }
          100% { background-position: -200% 0 }
        }
        @keyframes statusPulse {
          0%, 100% { opacity: 1; transform: scale(1) }
          50%       { opacity: 0.6; transform: scale(1.3) }
        }
      `}</style>

      {view === 'list' && (
        <PaymentListView
          key={listKey}
          role={role}
          onSelectPayment={goToDetail}
          onRecordPayment={p => setRecordTarget(p)}
          onNavigate={handleNavigate}
        />
      )}

      {view === 'outstanding' && (
        <OutstandingPaymentsView onBack={goToList} onSelectPayment={goToDetail} />
      )}

      {view === 'overdue' && (
        <OverduePaymentsView onBack={goToList} onSelectPayment={goToDetail} />
      )}

      {view === 'detail' && selectedId && (
        <PaymentDetailView
          paymentId={selectedId}
          role={role}
          currentUserId={currentUser?.id ?? ''}
          onBack={goToList}
          onRecordPayment={p => setRecordTarget(p)}
        />
      )}

      {recordTarget && (
        <RecordPaymentModal
          payment={recordTarget}
          bankAccounts={bankAccounts}
          onClose={() => setRecordTarget(null)}
          onSuccess={handleRecordSuccess}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
