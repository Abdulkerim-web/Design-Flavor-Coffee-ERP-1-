/**
 * Expenses.tsx — F3-13
 * Expense Control, Approval & Category Management
 * All amounts are backend-authoritative opaque strings (ETB format).
 * Frontend never calculates totals, approval eligibility, or accounting treatment.
 */
import { useState, useEffect } from "react"
import { apiRequest } from "../services/api"
import {
  getExpenseSummary,
  listExpensesFull,
  getExpense,
  createExpense,
  approveExpense,
  rejectExpense,
  payExpense,
  cancelExpense,
  editExpense,
  exportExpenses,
  listExpenseCategories,
  createExpenseCategory,
  updateExpenseCategory,
  deactivateExpenseCategory,
  EXPENSE_CATEGORIES,
} from "../services/finance-ops"
import type {
  FullExpense,
  ExpenseSummaryData,
  ExpenseStatus,
  ExpenseCategory,
} from "../services/finance-ops"
import { useAuth } from "../contexts/AuthContext"
import { can } from "../lib/can"
import { useToast } from "../contexts/ToastContext"
import useSupabaseRealtime from "../hooks/useSupabaseRealtime"

// ─── View routing ──────────────────────────────────────────────────────────────

type View = "list" | "approval-queue" | "detail" | "create" | "edit" | "categories"

// ─── Shared helpers ────────────────────────────────────────────────────────────

function Sk({ h = 40, r = 8 }: { h?: number r?: number }) {
  return (
    <div className="skeleton-shimmer" style={{ height: h, borderRadius: r }} />
  )
}

function Ic({
  d,
  size = 16,
  style,
}: {
  d: string
  size?: number
  style?: React.CSSProperties
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={style}
    >
      <path d={d} />
    </svg>
  )
}

const ICONS = {
  back: "M15 18l-6-6 6-6",
  plus: "M12 5v14M5 12h14",
  search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0",
  filter: "M22 3H2l8 9.46V19l4 2v-8.54L22 3",
  check: "M20 6L9 17l-5-5",
  warn: "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01",
  info: "M12 22a10 10 0 110-20 10 10 0 010 20zM12 8v4M12 16h.01",
  receipt:
    "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8",
  export: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3",
  clock: "M12 22a10 10 0 110-20 10 10 0 010 20zM12 6v6l4 2",
  tag: "M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01",
  edit: "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
  xCircle: "M22 12a10 10 0 11-20 0 10 10 0 0120 0zM15 9l-6 6M9 9l6 6",
  checkCircle: "M9 12l2 2 4-4M22 12a10 10 0 11-20 0 10 10 0 0120 0z",
  upload: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12",
}

// ─── Status config ─────────────────────────────────────────────────────────────

const STATUS_CFG: Record<ExpenseStatus, {
  label: string
  badge: string
  icon: string
}> = {
  "pending-approval": {
    label: "Pending Approval",
    badge: "badge badge-amber",
    icon: ICONS.clock,
  },
  approved: {
    label: "Approved",
    badge: "badge badge-blue",
    icon: ICONS.checkCircle,
  },
  rejected: {
    label: "Rejected",
    badge: "badge badge-red",
    icon: ICONS.xCircle,
  },
  paid: { label: "Paid", badge: "badge badge-green", icon: ICONS.check },
  cancelled: {
    label: "Cancelled",
    badge: "badge badge-gray",
    icon: ICONS.xCircle,
  },
}

function StatusBadge({ status }: { status: ExpenseStatus }) {
  const c = STATUS_CFG[status]
  return (
    <span
      className={c.badge}
      style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
    >
      <Ic d={c.icon} size={10} />
      {c.label}
    </span>
  )
}

function CategoryBadge({ status }: { status: "active" | "inactive" }) {
  return status === "active" ? (
    <span className="badge badge-green">Active</span>
  ) : (
    <span className="badge badge-gray">Inactive</span>
  )
}

// ─── Small data row ────────────────────────────────────────────────────────────

function DRow({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 12,
      }}
    >
      <span style={{ fontSize: 12, color: "var(--text-muted)", flexShrink: 0 }}>
        {label}
      </span>
      <span
        style={{
          fontSize: 13,
          color: "var(--text-primary)",
          textAlign: "right",
          fontFamily: mono ? "DM Mono, monospace" : undefined,
          fontWeight: mono ? 600 : undefined,
        }}
      >
        {value}
      </span>
    </div>
  )
}

// ─── Access Denied ─────────────────────────────────────────────────────────────

function AccessDenied() {
  return (
    <div style={{ padding: 32 }}>
      <div
        style={{
          background: "var(--surface-01)",
          border: "1px solid var(--border-neutral)",
          borderRadius: "var(--radius-lg)",
          padding: "64px 32px",
          textAlign: "center",
          maxWidth: 480,
          margin: "0 auto",
        }}
      >
        <Ic
          d={ICONS.receipt}
          size={32}
          style={{
            color: "var(--text-muted)",
            display: "block",
            margin: "0 auto 16px",
          }}
        />
        <div
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: "var(--text-primary)",
            marginBottom: 8,
          }}
        >
          Access Restricted
        </div>
        <div style={{ fontSize: 13.5, color: "var(--text-muted)" }}>
          You do not have permission to view Expenses.
        </div>
      </div>
    </div>
  )
}

// ─── Modal backdrop ────────────────────────────────────────────────────────────

function Modal({
  title,
  children,
  onClose,
  footer,
}: {
  title: string
  children: React.ReactNode
  onClose: () => void
  footer: React.ReactNode
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          background: "var(--surface-01)",
          border: "1px solid var(--border-neutral)",
          borderRadius: "var(--radius-xl)",
          padding: 28,
          width: "100%",
          maxWidth: 460,
          boxShadow: "var(--shadow-modal)",
        }}
      >
        <div
          id="modal-title"
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: "var(--text-primary)",
            marginBottom: 20,
          }}
        >
          {title}
        </div>
        <div style={{ marginBottom: 24 }}>{children}</div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          {footer}
        </div>
      </div>
    </div>
  )
}

// ─── Approve modal ─────────────────────────────────────────────────────────────

function ApproveModal({
  expense,
  onConfirm,
  onClose,
}: {
  expense: FullExpense
  onConfirm: () => Promise<void>
  onClose: () => void
}) {
  const [loading, setLoading] = useState(false)
  async function handle() {
    setLoading(true)
    await onConfirm()
    setLoading(false)
  }
  return (
    <Modal
      title="Approve Expense?"
      onClose={onClose}
      footer={
        <>
          <button
            className="btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button className="btn-primary" onClick={handle} disabled={loading}>
            {loading ? "Approving…" : "Approve Expense"}
          </button>
        </>
      }
    >
      <div
        style={{
          padding: "14px 16px",
          background: "var(--surface-02)",
          borderRadius: "var(--radius-md)",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            fontSize: 22,
            fontWeight: 700,
            fontFamily: "DM Mono, monospace",
            color: "var(--text-primary)",
            textAlign: "center",
            padding: "8px 0",
          }}
        >
          {expense.amount}
        </div>
        <DRow label="Category" value={expense.category} />
        <DRow label="Submitted By" value={expense.requestedBy} />
        <DRow label="Date" value={expense.date} />
        <DRow label="Description" value={expense.description} />
      </div>
      <div
        style={{
          padding: "10px 14px",
          background: "var(--color-status-warning-surface)",
          border: "1px solid var(--color-status-warning-border)",
          borderRadius: "var(--radius-sm)",
          fontSize: 12.5,
          color: "var(--color-status-warning)",
          lineHeight: 1.55,
        }}
      >
        You are approving a financial expense. This action authorizes it to
        proceed to payment.
      </div>
    </Modal>
  )
}

// ─── Reject modal ──────────────────────────────────────────────────────────────

function RejectModal({
  expense,
  onConfirm,
  onClose,
}: {
  expense: FullExpense
  onConfirm: (reason: string) => Promise<void>
  onClose: () => void
}) {
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)
  async function handle() {
    if (!reason.trim()) return
    setLoading(true)
    await onConfirm(reason)
    setLoading(false)
  }
  return (
    <Modal
      title="Reject Expense"
      onClose={onClose}
      footer={
        <>
          <button
            className="btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handle}
            disabled={loading || !reason.trim()}
            style={{
              padding: "8px 18px",
              background: "var(--sem-danger)",
              color: "#fff",
              border: "none",
              borderRadius: "var(--radius-md)",
              fontSize: 13,
              fontWeight: 600,
              cursor: loading || !reason.trim() ? "not-allowed" : "pointer",
              opacity: loading || !reason.trim() ? 0.6 : 1,
            }}
          >
            {loading ? "Rejecting…" : "Reject Expense"}
          </button>
        </>
      }
    >
      <div style={{ marginBottom: 14 }}>
        <DRow label="Expense" value={expense.ref} mono />
        <div style={{ marginTop: 8 }}>
          <DRow label="Amount" value={expense.amount} mono />
        </div>
      </div>
      <div
        style={{
          padding: "10px 14px",
          background: "var(--color-status-danger-surface)",
          border: "1px solid var(--color-status-danger-border)",
          borderRadius: "var(--radius-sm)",
          fontSize: 12.5,
          color: "var(--sem-danger)",
          marginBottom: 14,
          lineHeight: 1.55,
        }}
      >
        A rejection reason will be recorded and visible to the submitter.
      </div>
      <label
        style={{
          display: "block",
          fontSize: 12.5,
          fontWeight: 500,
          color: "var(--text-secondary)",
          marginBottom: 6,
        }}
      >
        Reason for rejection{" "}
        <span style={{ color: "var(--sem-danger)" }}>*</span>
      </label>
      <textarea
        className="input-field"
        rows={3}
        style={{ width: "100%", resize: "vertical" }}
        placeholder="State the reason for rejection…"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
    </Modal>
  )
}

// ─── Cancel modal ──────────────────────────────────────────────────────────────

function CancelModal({
  expense,
  onConfirm,
  onClose,
}: {
  expense: FullExpense
  onConfirm: () => Promise<void>
  onClose: () => void
}) {
  const [loading, setLoading] = useState(false)
  async function handle() {
    setLoading(true)
    await onConfirm()
    setLoading(false)
  }
  return (
    <Modal
      title="Cancel Expense?"
      onClose={onClose}
      footer={
        <>
          <button
            className="btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Back
          </button>
          <button
            onClick={handle}
            disabled={loading}
            style={{
              padding: "8px 18px",
              background: "var(--sem-danger)",
              color: "#fff",
              border: "none",
              borderRadius: "var(--radius-md)",
              fontSize: 13,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Cancelling…" : "Confirm Cancellation"}
          </button>
        </>
      }
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          marginBottom: 16,
        }}
      >
        <DRow label="Reference" value={expense.ref} mono />
        <DRow label="Amount" value={expense.amount} mono />
      </div>
      <div
        style={{
          fontSize: 13.5,
          color: "var(--text-secondary)",
          lineHeight: 1.6,
        }}
      >
        The expense will be marked as <strong>cancelled</strong>. This action
        cannot be undone.
      </div>
    </Modal>
  )
}

// ─── Pay modal ────────────────────────────────────────────────────────────────

function PayModal({
  expense,
  onConfirm,
  onClose,
}: {
  expense: FullExpense
  onConfirm: (account: string) => Promise<void>
  onClose: () => void
}) {
  const [bankAccounts, setBankAccounts] = useState<{ id: string; label: string }[]>([])
  const [selected, setSelected] = useState("")
  const [loading, setLoading] = useState(false)
  const [accsLoading, setAccsLoading] = useState(true)

  useEffect(() => {
    setAccsLoading(true)
    apiRequest<any[]>("/finance/accounts", "GET")
      .then((accs) => {
        const list = (accs || []).map((a: any) => ({
          id: String(a.id),
          label: a.label || `${a.bankName || a.bank_name || "Bank"} — ${a.maskedAccountNumber || a.masked_account_number || "****"}`,
        }))
        setBankAccounts(list)
        if (list.length > 0) setSelected(list[0].id)
      })
      .catch(() => setBankAccounts([]))
      .finally(() => setAccsLoading(false))
  }, [])

  async function handle() {
    setLoading(true)
    await onConfirm(selected)
    setLoading(false)
  }
  return (
    <Modal
      title="Pay Expense"
      onClose={onClose}
      footer={
        <>
          <button
            className="btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button className="btn-primary" onClick={handle} disabled={loading || !selected || accsLoading}>
            {loading ? "Processing…" : "Pay Expense"}
          </button>
        </>
      }
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          marginBottom: 16,
        }}
      >
        <DRow label="Expense" value={expense.ref} mono />
        <DRow label="Amount" value={expense.amount} mono />
        {expense.approvedBy && (
          <DRow label="Approved by" value={expense.approvedBy} />
        )}
      </div>
      <label
        style={{
          display: "block",
          fontSize: 12.5,
          fontWeight: 500,
          color: "var(--text-secondary)",
          marginBottom: 8,
        }}
      >
        Payment Account
      </label>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          marginBottom: 14,
        }}
      >
        {accsLoading ? (
          <div style={{ fontSize: 13, color: "var(--text-muted)", padding: "8px 0" }}>Loading accounts…</div>
        ) : bankAccounts.length === 0 ? (
          <div style={{
            padding: "12px 14px",
            background: "var(--surface-02)",
            borderRadius: "var(--radius-md)",
            fontSize: 13,
            color: "var(--text-muted)",
          }}>
            No bank accounts configured. Add a bank account in Banking &gt; Accounts first.
          </div>
        ) : (
          bankAccounts.map((ba) => (
            <label
              key={ba.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
                border: `1px solid ${
                  selected === ba.id
                    ? "var(--brand-primary)"
                    : "var(--border-neutral)"
                }`,
                borderRadius: "var(--radius-md)",
                cursor: "pointer",
                background:
                  selected === ba.id
                    ? "var(--color-status-info-surface)"
                    : "transparent",
              }}
            >
              <input
                type="radio"
                name="payAccount"
                value={ba.id}
                checked={selected === ba.id}
                onChange={() => setSelected(ba.id)}
              />
              <span
                style={{
                  fontFamily: "DM Mono, monospace",
                  fontSize: 13,
                  color: "var(--text-primary)",
                }}
              >
                {ba.label}
              </span>
            </label>
          ))
        )}
      </div>
      <div
        style={{
          padding: "10px 14px",
          background: "var(--surface-02)",
          borderRadius: "var(--radius-sm)",
          fontSize: 12,
          color: "var(--text-muted)",
          lineHeight: 1.55,
        }}
      >
        Approval and payment are distinct steps. The backend will create a bank
        transaction entry upon confirmation.
      </div>
    </Modal>
  )
}

// ─── Export modal ──────────────────────────────────────────────────────────────

function ExportModal({ onClose }: { onClose: () => void }) {
  const toast = useToast()
  const [format, setFormat] = useState<"csv" | "pdf">("csv")
  const [dateRange, setDateRange] = useState("month")
  const [exporting, setExporting] = useState(false)

  async function handle() {
    setExporting(true)
    const r = await exportExpenses({ format, dateRange })
    setExporting(false)
    if (r.data) {
      toast.success(
        `Export request submitted (${format.toUpperCase()}). Ref: ${r.data.exportRef}`,
      )
      onClose()
    } else {
      toast.error(r.error ?? "Export could not be generated. Please try again.")
    }
  }

  return (
    <Modal
      title="Export Expenses"
      onClose={onClose}
      footer={
        <>
          <button
            className="btn-secondary"
            onClick={onClose}
            disabled={exporting}
          >
            Cancel
          </button>
          <button className="btn-primary" onClick={handle} disabled={exporting}>
            {exporting ? "Requesting…" : "Export"}
          </button>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <div
            style={{
              fontSize: 12.5,
              fontWeight: 500,
              color: "var(--text-secondary)",
              marginBottom: 8,
            }}
          >
            Format
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[
              {
                id: "csv",
                label: "CSV — spreadsheet-compatible",
                sub: "Comma-separated values for Excel or Sheets",
              },
              {
                id: "pdf",
                label: "PDF — formatted report",
                sub: "Print-ready financial report",
              },
            ].map((f) => (
              <label
                key={f.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "10px 14px",
                  border: `1px solid ${
                    format === f.id
                      ? "var(--brand-primary)"
                      : "var(--border-neutral)"
                  }`,
                  borderRadius: "var(--radius-md)",
                  cursor: "pointer",
                  background:
                    format === f.id
                      ? "var(--color-status-info-surface)"
                      : "transparent",
                }}
              >
                <input
                  type="radio"
                  name="exportFormat"
                  value={f.id}
                  checked={format === f.id as "csv" | "pdf"}
                  onChange={() => setFormat(f.id as "csv" | "pdf")}
                  style={{ marginTop: 2 }}
                />
                <div>
                  <div
                    style={{
                      fontSize: 13.5,
                      fontWeight: 500,
                      color: "var(--text-primary)",
                    }}
                  >
                    {f.label}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {f.sub}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label
            style={{
              display: "block",
              fontSize: 12.5,
              fontWeight: 500,
              color: "var(--text-secondary)",
              marginBottom: 6,
            }}
          >
            Date Range
          </label>
          <select
            className="input-field"
            style={{ width: "100%" }}
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="prev">Previous Month</option>
            <option value="all">All Time</option>
          </select>
        </div>
        <div
          style={{
            padding: "10px 14px",
            background: "var(--surface-02)",
            borderRadius: "var(--radius-sm)",
            fontSize: 12,
            color: "var(--text-muted)",
            lineHeight: 1.55,
          }}
        >
          The backend generates the authoritative export. The frontend requests
          it — no financial calculations are performed here.
        </div>
      </div>
    </Modal>
  )
}

// ─── Deactivate Category modal ─────────────────────────────────────────────────

function DeactivateCategoryModal({
  category,
  onConfirm,
  onClose,
}: {
  category: ExpenseCategory
  onConfirm: () => Promise<void>
  onClose: () => void
}) {
  const [loading, setLoading] = useState(false)
  async function handle() {
    setLoading(true)
    await onConfirm()
    setLoading(false)
  }
  return (
    <Modal
      title="Deactivate Category?"
      onClose={onClose}
      footer={
        <>
          <button
            className="btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handle}
            disabled={loading}
            style={{
              padding: "8px 18px",
              background: "var(--sem-danger)",
              color: "#fff",
              border: "none",
              borderRadius: "var(--radius-md)",
              fontSize: 13,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Deactivating…" : "Deactivate"}
          </button>
        </>
      }
    >
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--text-primary)",
            marginBottom: 4,
          }}
        >
          {category.name}
        </div>
        <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
          {category.description}
        </div>
      </div>
      <div
        style={{
          fontSize: 13.5,
          color: "var(--text-secondary)",
          lineHeight: 1.6,
        }}
      >
        New expenses will no longer be able to use this category.
        <br />
        <strong>Existing expense records will remain unchanged.</strong>
      </div>
    </Modal>
  )
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

function ExpenseTimeline({ events }: { events: FullExpense["timeline"] }) {
  if (!events.length)
    return (
      <div
        style={{
          padding: "32px 0",
          textAlign: "center",
          color: "var(--text-muted)",
          fontSize: 13,
        }}
      >
        No activity recorded.
      </div>
    )
  return (
    <div>
      {events.map((e, i) => (
        <div key={e.id} style={{ display: "flex", gap: 12 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "var(--brand-primary)",
                border: "2px solid var(--surface-01)",
                marginTop: 4,
                flexShrink: 0,
              }}
            />
            {i < events.length - 1 && (
              <div
                style={{
                  width: 1,
                  flex: 1,
                  background: "var(--border-neutral)",
                  margin: "4px 0",
                  minHeight: 20,
                }}
              />
            )}
          </div>
          <div
            style={{ paddingBottom: i < events.length - 1 ? 18 : 0, flex: 1 }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "var(--text-primary)",
              }}
            >
              {e.action}
            </div>
            {e.note && (
              <div
                style={{
                  fontSize: 12.5,
                  color: "var(--text-secondary)",
                  marginTop: 2,
                  fontStyle: "italic",
                }}
              >
                {e.note}
              </div>
            )}
            <div
              style={{
                fontSize: 11.5,
                fontFamily: "DM Mono, monospace",
                color: "var(--text-muted)",
                marginTop: 2,
              }}
            >
              {e.timestamp} · {e.actor}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Filter bar ───────────────────────────────────────────────────────────────

type DateRangeFilter = "today" | "week" | "month" | "prev" | "all"

interface Filters {
  search: string
  status: ExpenseStatus | "all"
  category: string
  dateRange: DateRangeFilter
}

function ExpenseFilterBar({
  filters,
  onFilters,
  canExport,
  onExport,
}: {
  filters: Filters
  onFilters: (f: Filters) => void
  canExport: boolean
  onExport: () => void
}) {
  const set = (k: keyof Filters, v: string) => onFilters({ ...filters, [k]: v })
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 10,
        alignItems: "center",
        padding: "12px 16px",
        background: "var(--surface-02)",
        borderBottom: "1px solid var(--border-neutral)",
      }}
    >
      <div style={{ position: "relative", flex: "1 1 200px" }}>
        <Ic
          d={ICONS.search}
          size={13}
          style={{
            position: "absolute",
            left: 10,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--text-muted)",
            pointerEvents: "none",
          }}
        />
        <input
          className="input-field"
          placeholder="Search reference or description…"
          value={filters.search}
          onChange={(e) => set("search", e.target.value)}
          style={{ width: "100%", paddingLeft: 30, fontSize: 13 }}
          aria-label="Search expenses"
        />
      </div>
      <select
        className="input-field"
        value={filters.status}
        onChange={(e) => set("status", e.target.value)}
        style={{ flex: "0 1 170px", fontSize: 13 }}
      >
        <option value="all">All Statuses</option>
        {(Object.keys(STATUS_CFG) as ExpenseStatus[]).map((s) => (
          <option key={s} value={s}>
            {STATUS_CFG[s].label}
          </option>
        ))}
      </select>
      <select
        className="input-field"
        value={filters.category}
        onChange={(e) => set("category", e.target.value)}
        style={{ flex: "0 1 160px", fontSize: 13 }}
      >
        <option value="all">All Categories</option>
        {EXPENSE_CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <div style={{ display: "flex", gap: 4 }}>
        {[
          ["today", "Today"],
          ["week", "Week"],
          ["month", "Month"],
          ["prev", "Prev Month"],
          ["all", "All"],
        ].map(([id, label]) => (
          <button
            key={id}
            className={filters.dateRange === id ? "pill active" : "pill"}
            onClick={() => set("dateRange", id)}
            style={{ fontSize: 12, padding: "4px 10px" }}
          >
            {label}
          </button>
        ))}
      </div>
      {canExport && (
        <button
          className="btn-secondary"
          onClick={onExport}
          style={{
            fontSize: 12.5,
            padding: "6px 14px",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Ic d={ICONS.export} size={13} /> Export
        </button>
      )}
    </div>
  )
}

// ─── Mobile expense card ───────────────────────────────────────────────────────

function ExpenseCard({ exp, onView }: { exp: FullExpense onView: () => void }) {
  return (
    <div
      style={{
        padding: "14px 16px",
        borderBottom: "1px solid var(--border-neutral)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
          marginBottom: 8,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "DM Mono, monospace",
              fontSize: 15,
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: 2,
            }}
          >
            {exp.amount}
          </div>
          <div style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>
            {exp.description}
          </div>
        </div>
        <StatusBadge status={exp.status} />
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "4px 16px",
          fontSize: 11.5,
          marginBottom: 10,
        }}
      >
        <span
          style={{
            fontFamily: "DM Mono, monospace",
            color: "var(--text-muted)",
          }}
        >
          {exp.ref}
        </span>
        <span style={{ color: "var(--text-muted)" }}>{exp.category}</span>
        <span style={{ color: "var(--text-muted)" }}>{exp.date}</span>
        <span style={{ color: "var(--text-muted)" }}>{exp.requestedBy}</span>
      </div>
      <button
        className="btn-secondary"
        onClick={onView}
        style={{ fontSize: 12.5, padding: "6px 14px", width: "100%" }}
      >
        View
      </button>
    </div>
  )
}

// ─── Expense table (desktop) ───────────────────────────────────────────────────

function ExpenseTable({
  expenses,
  loading,
  empty,
  noResults,
  onView,
  canApprove,
}: {
  expenses: FullExpense[]
  loading: boolean
  empty: boolean
  noResults: boolean
  onView: (id: string) => void
  canApprove: boolean
}) {
  if (loading)
    return (
      <div
        style={{
          padding: 20,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {[...Array(5)].map((_, i) => (
          <Sk key={i} />
        ))}
      </div>
    )
  if (empty)
    return (
      <div style={{ padding: "56px 32px", textAlign: "center" }}>
        <Ic
          d={ICONS.receipt}
          size={28}
          style={{
            color: "var(--text-muted)",
            display: "block",
            margin: "0 auto 12px",
          }}
        />
        <div
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "var(--text-primary)",
            marginBottom: 6,
          }}
        >
          No expenses recorded
        </div>
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
          No expenses have been recorded yet.
        </div>
      </div>
    )
  if (noResults)
    return (
      <div style={{ padding: "56px 32px", textAlign: "center" }}>
        <Ic
          d={ICONS.filter}
          size={24}
          style={{
            color: "var(--text-muted)",
            display: "block",
            margin: "0 auto 12px",
          }}
        />
        <div
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "var(--text-primary)",
            marginBottom: 6,
          }}
        >
          No expenses match these filters
        </div>
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
          Try adjusting the filters or search term.
        </div>
      </div>
    )
  return (
    <>
      {/* Desktop */}
      <div className="resp-hide-mobile resp-table-scroll">
        <table
          className="data-table"
          style={{ width: "100%", borderCollapse: "collapse" }}
          aria-label="Expense list"
        >
          <thead>
            <tr>
              {[
                "Date",
                "Reference",
                "Category",
                "Description",
                "Amount",
                "Submitted By",
                "Status",
                "Approved By",
                "",
              ].map((h) => (
                <th
                  key={h}
                  scope="col"
                  style={{ textAlign: h === "Amount" ? "right" : "left" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {expenses.map((exp) => (
              <tr key={exp.id}>
                <td>
                  <span
                    style={{
                      fontFamily: "DM Mono, monospace",
                      fontSize: 12.5,
                      color: "var(--text-muted)",
                    }}
                  >
                    {exp.date}
                  </span>
                </td>
                <td>
                  <span
                    style={{
                      fontFamily: "DM Mono, monospace",
                      fontSize: 12.5,
                      color: "var(--text-muted)",
                    }}
                  >
                    {exp.ref}
                  </span>
                </td>
                <td style={{ color: "var(--text-secondary)", fontSize: 13 }}>
                  {exp.category}
                </td>
                <td style={{ maxWidth: 220 }}>
                  <div
                    style={{
                      color: "var(--text-primary)",
                      fontSize: 13,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {exp.description}
                  </div>
                </td>
                <td style={{ textAlign: "right" }}>
                  <span
                    style={{
                      fontFamily: "DM Mono, monospace",
                      fontSize: 13,
                      fontWeight: 700,
                      color: "var(--text-primary)",
                    }}
                  >
                    {exp.amount}
                  </span>
                </td>
                <td
                  style={{
                    fontSize: 13,
                    color: "var(--text-secondary)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {exp.requestedBy}
                </td>
                <td>
                  <StatusBadge status={exp.status} />
                </td>
                <td
                  style={{
                    fontSize: 12.5,
                    color: "var(--text-muted)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {exp.approvedBy ?? "—"}
                </td>
                <td>
                  <button
                    className="btn-ghost"
                    style={{ fontSize: 12.5, padding: "4px 12px" }}
                    onClick={() => onView(exp.id)}
                  >
                    {exp.status === "pending-approval" && canApprove
                      ? "Review"
                      : "View"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Mobile */}
      <div className="resp-hide-desktop">
        {expenses.map((exp) => (
          <ExpenseCard key={exp.id} exp={exp} onView={() => onView(exp.id)} />
        ))}
      </div>
    </>
  )
}

// ─── Needs Attention panel ────────────────────────────────────────────────────

function NeedsAttentionPanel({
  summary,
  canApprove,
  onGoQueue,
}: {
  summary: ExpenseSummaryData
  canApprove: boolean
  onGoQueue: () => void
}) {
  const items: Array<{ label: string count: number urgent?: boolean }> = [
    ...(canApprove && summary.pendingCount > 0
      ? [
          {
            label: `expense${
              summary.pendingCount !== 1 ? "s" : ""
            } awaiting your approval`,
            count: summary.pendingCount,
            urgent: true,
          },
        ]
      : []),
  ]
  if (!items.length) return null
  return (
    <div
      style={{
        background: "var(--color-status-warning-surface)",
        border: "1px solid var(--color-status-warning-border)",
        borderRadius: "var(--radius-lg)",
        padding: "16px 20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 16,
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <Ic
          d={ICONS.warn}
          size={16}
          style={{ color: "var(--sem-warning)", flexShrink: 0, marginTop: 2 }}
        />
        <div>
          <div
            style={{
              fontSize: 13.5,
              fontWeight: 600,
              color: "var(--sem-warning)",
              marginBottom: 4,
            }}
          >
            Needs Attention
          </div>
          {items.map((item) => (
            <div
              key={item.label}
              style={{ fontSize: 13, color: "var(--text-secondary)" }}
            >
              <strong style={{ fontFamily: "DM Mono, monospace" }}>
                {item.count}
              </strong>{" "}
              {item.label}
            </div>
          ))}
        </div>
      </div>
      {canApprove && summary.pendingCount > 0 && (
        <button
          className="btn-secondary"
          style={{ fontSize: 12.5, padding: "7px 16px", flexShrink: 0 }}
          onClick={onGoQueue}
        >
          Open Approval Queue
        </button>
      )}
    </div>
  )
}

// ─── Approval Queue view ───────────────────────────────────────────────────────

function ApprovalQueueView({
  expenses,
  loading,
  onBack,
  onView,
}: {
  expenses: FullExpense[]
  loading: boolean
  onBack: () => void
  onView: (id: string) => void
}) {
  const pending = expenses.filter((e) => e.status === "pending-approval")
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 32 }}>
      <button
        onClick={onBack}
        className="btn-ghost"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 13,
          marginBottom: 24,
        }}
      >
        <Ic d={ICONS.back} size={14} /> All Expenses
      </button>
      <div style={{ marginBottom: 24 }}>
        <div className="section-eyebrow" style={{ marginBottom: 4 }}>
          Finance
        </div>
        <h1
          className="type-h1"
          style={{ color: "var(--text-primary)", marginBottom: 6 }}
        >
          Expense Approval Queue
        </h1>
        <p style={{ fontSize: 13.5, color: "var(--text-secondary)" }}>
          Review and act on expenses awaiting your approval.
        </p>
      </div>

      <div
        style={{
          background: "var(--surface-01)",
          border: "1px solid var(--border-neutral)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "12px 20px",
            borderBottom: "1px solid var(--border-neutral)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--text-primary)",
            }}
          >
            Pending Approval
          </div>
          <span
            style={{
              fontFamily: "DM Mono, monospace",
              fontSize: 13,
              color: "var(--text-muted)",
            }}
          >
            {pending.length} item{pending.length !== 1 ? "s" : ""}
          </span>
        </div>

        {loading ? (
          <div
            style={{
              padding: 20,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {[...Array(4)].map((_, i) => (
              <Sk key={i} h={48} />
            ))}
          </div>
        ) : pending.length === 0 ? (
          <div style={{ padding: "56px 32px", textAlign: "center" }}>
            <Ic
              d={ICONS.checkCircle}
              size={32}
              style={{
                color: "var(--sem-success)",
                display: "block",
                margin: "0 auto 12px",
              }}
            />
            <div
              style={{
                fontSize: 15,
                fontWeight: 500,
                color: "var(--text-primary)",
                marginBottom: 6,
              }}
            >
              Nothing needs your attention right now
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
              All submitted expenses are up to date.
            </div>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="resp-hide-mobile resp-table-scroll">
              <table
                className="data-table"
                style={{ width: "100%", borderCollapse: "collapse" }}
                aria-label="Approval queue"
              >
                <thead>
                  <tr>
                    {[
                      "Date",
                      "Reference",
                      "Category",
                      "Amount",
                      "Submitted By",
                      "Description",
                      "",
                    ].map((h) => (
                      <th
                        key={h}
                        scope="col"
                        style={{ textAlign: h === "Amount" ? "right" : "left" }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pending.map((exp) => (
                    <tr key={exp.id}>
                      <td>
                        <span
                          style={{
                            fontFamily: "DM Mono, monospace",
                            fontSize: 12.5,
                            color: "var(--text-muted)",
                          }}
                        >
                          {exp.date}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            fontFamily: "DM Mono, monospace",
                            fontSize: 12.5,
                            color: "var(--text-muted)",
                          }}
                        >
                          {exp.ref}
                        </span>
                      </td>
                      <td
                        style={{ fontSize: 13, color: "var(--text-secondary)" }}
                      >
                        {exp.category}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <span
                          style={{
                            fontFamily: "DM Mono, monospace",
                            fontSize: 14,
                            fontWeight: 700,
                            color: "var(--text-primary)",
                          }}
                        >
                          {exp.amount}
                        </span>
                      </td>
                      <td
                        style={{
                          fontSize: 13,
                          color: "var(--text-secondary)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {exp.requestedBy}
                      </td>
                      <td
                        style={{
                          color: "var(--text-secondary)",
                          fontSize: 13,
                          maxWidth: 200,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {exp.description}
                      </td>
                      <td>
                        <button
                          className="btn-primary"
                          style={{ fontSize: 12.5, padding: "5px 14px" }}
                          onClick={() => onView(exp.id)}
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile */}
            <div className="resp-hide-desktop">
              {pending.map((exp) => (
                <div
                  key={exp.id}
                  style={{
                    padding: "16px",
                    borderBottom: "1px solid var(--border-neutral)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      marginBottom: 10,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontFamily: "DM Mono, monospace",
                          fontSize: 16,
                          fontWeight: 700,
                          color: "var(--text-primary)",
                          marginBottom: 2,
                        }}
                      >
                        {exp.amount}
                      </div>
                      <div
                        style={{
                          fontSize: 12.5,
                          color: "var(--text-secondary)",
                          marginBottom: 2,
                        }}
                      >
                        {exp.description}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        {exp.category} · {exp.requestedBy} · {exp.date}
                      </div>
                    </div>
                    <StatusBadge status={exp.status} />
                  </div>
                  <button
                    className="btn-primary"
                    style={{ fontSize: 13, padding: "10px 0", width: "100%" }}
                    onClick={() => onView(exp.id)}
                  >
                    Review
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Expense Detail view ───────────────────────────────────────────────────────

function ExpenseDetailView({
  expenseId,
  onBack,
  canApprove,
  canPay,
  canCancel,
  onUpdated,
}: {
  expenseId: string
  onBack: () => void
  canApprove: boolean
  canPay: boolean
  canCancel: boolean
  onUpdated: () => void
}) {
  const toast = useToast()
  const [expense, setExpense] = useState<FullExpense | null>(null)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] =
    useState<"approve" | "reject" | "pay" | "cancel" | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    getExpense(expenseId).then((r) => {
      if (r.data) setExpense(r.data)
      else setError("Unable to load expense.")
      setLoading(false)
    })
  }, [expenseId])

  async function handleApprove() {
    if (!expense) return
    const r = await approveExpense(expense.id, "current-user")
    if (r.data) {
      setExpense(r.data)
      onUpdated()
      toast.success("Expense approved.")
      setModal(null)
    } else {
      toast.error(r.error ?? "Expense could not be approved.")
      setModal(null)
    }
  }

  async function handleReject(reason: string) {
    if (!expense) return
    const r = await rejectExpense(expense.id, reason)
    if (r.data) {
      setExpense(r.data)
      onUpdated()
      toast.success("Expense rejected.")
      setModal(null)
    } else {
      toast.error(r.error ?? "Expense could not be rejected.")
      setModal(null)
    }
  }

  async function handlePay(account: string) {
    if (!expense) return
    const r = await payExpense(expense.id, account, `REF-${Date.now()}`)
    if (r.data) {
      setExpense(r.data)
      onUpdated()
      toast.success("Expense paid.")
      setModal(null)
    } else {
      toast.error(r.error ?? "Expense could not be paid.")
      setModal(null)
    }
  }

  async function handleCancel() {
    if (!expense) return
    const r = await cancelExpense(expense.id)
    if (r.data) {
      setExpense(r.data)
      onUpdated()
      toast.success("Expense cancelled.")
      setModal(null)
    } else {
      toast.error(r.error ?? "Expense could not be cancelled.")
      setModal(null)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 32, maxWidth: 1100, margin: "0 auto" }}>
        <Sk h={24} r={6} />
        <div
          style={{
            marginTop: 24,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <Sk h={200} />
          <Sk h={300} />
        </div>
      </div>
    )
  }
  if (error || !expense) {
    return (
      <div style={{ padding: 32 }}>
        <button
          onClick={onBack}
          className="btn-ghost"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            marginBottom: 24,
          }}
        >
          <Ic d={ICONS.back} size={14} /> All Expenses
        </button>
        <div
          style={{
            padding: 32,
            textAlign: "center",
            color: "var(--sem-danger)",
            fontSize: 13.5,
          }}
        >
          {error ?? "Expense not found."}
        </div>
      </div>
    )
  }

  const isPending = expense.status === "pending-approval"
  const isApproved = expense.status === "approved"
  const isCancellable = canCancel && expense.status === "pending-approval"

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 32 }}>
      <button
        onClick={onBack}
        className="btn-ghost"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 13,
          marginBottom: 24,
        }}
      >
        <Ic d={ICONS.back} size={14} /> All Expenses
      </button>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fill, minmax(min(100%, 620px), 1fr))",
          gap: 20,
        }}
      >
        {/* Main column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Header card */}
          <div
            style={{
              background: "var(--surface-01)",
              border: "1px solid var(--border-neutral)",
              borderRadius: "var(--radius-lg)",
              padding: "24px 28px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 16,
                marginBottom: 20,
                flexWrap: "wrap",
              }}
            >
              <div>
                <div className="section-eyebrow" style={{ marginBottom: 4 }}>
                  {expense.ref}
                </div>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 800,
                    fontFamily: "DM Mono, monospace",
                    color: "var(--text-primary)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {expense.amount}
                </div>
                <div
                  style={{
                    fontSize: 13.5,
                    color: "var(--text-secondary)",
                    marginTop: 4,
                  }}
                >
                  {expense.description}
                </div>
              </div>
              <StatusBadge status={expense.status} />
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                gap: 16,
              }}
            >
              {[
                { label: "Category", value: expense.category },
                { label: "Date", value: expense.date },
                { label: "Submitted By", value: expense.requestedBy },
                {
                  label: "Document",
                  value: expense.hasDocument ? "Attached" : "Not attached",
                },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div className="section-eyebrow" style={{ marginBottom: 3 }}>
                    {label}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-primary)" }}>
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rejection reason */}
          {expense.rejectionReason && (
            <div
              style={{
                background: "var(--color-status-danger-surface)",
                border: "1px solid var(--color-status-danger-border)",
                borderRadius: "var(--radius-lg)",
                padding: "16px 20px",
              }}
            >
              <div
                style={{ display: "flex", gap: 10, alignItems: "flex-start" }}
              >
                <Ic
                  d={ICONS.xCircle}
                  size={16}
                  style={{
                    color: "var(--sem-danger)",
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                />
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--sem-danger)",
                      marginBottom: 6,
                    }}
                  >
                    Rejected
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "var(--text-secondary)",
                      marginBottom: 4,
                    }}
                  >
                    <strong>Reason:</strong> {expense.rejectionReason}
                  </div>
                  {expense.approvedBy && (
                    <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
                      Rejected by {expense.approvedBy}
                      {expense.approvedAt ? ` · ${expense.approvedAt}` : ""}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Approval info */}
          {expense.approvedBy && expense.status !== "rejected" && (
            <div
              style={{
                background: "var(--surface-01)",
                border: "1px solid var(--border-neutral)",
                borderRadius: "var(--radius-lg)",
                padding: "16px 20px",
              }}
            >
              <div className="section-eyebrow" style={{ marginBottom: 10 }}>
                Manager Decision
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <DRow label="Approved by" value={expense.approvedBy} />
                {expense.approvedAt && (
                  <DRow label="Approved at" value={expense.approvedAt} />
                )}
              </div>
            </div>
          )}

          {/* Payment info */}
          {expense.status === "paid" && expense.paidBy && (
            <div
              style={{
                background: "var(--surface-01)",
                border: "1px solid var(--border-neutral)",
                borderRadius: "var(--radius-lg)",
                padding: "16px 20px",
              }}
            >
              <div className="section-eyebrow" style={{ marginBottom: 10 }}>
                Payment
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <DRow label="Paid by" value={expense.paidBy} />
                {expense.paidAt && (
                  <DRow label="Paid at" value={expense.paidAt} />
                )}
                {expense.paymentAccount && (
                  <DRow label="Account" value={expense.paymentAccount} />
                )}
                {expense.paymentRef && (
                  <DRow
                    label="Transaction ref"
                    value={expense.paymentRef}
                    mono
                  />
                )}
              </div>
            </div>
          )}

          {/* Activity timeline */}
          <div
            style={{
              background: "var(--surface-01)",
              border: "1px solid var(--border-neutral)",
              borderRadius: "var(--radius-lg)",
              padding: "20px 24px",
            }}
          >
            <div className="section-eyebrow" style={{ marginBottom: 14 }}>
              Audit Timeline
            </div>
            <ExpenseTimeline events={expense.timeline} />
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Lifecycle tracker */}
          <div
            style={{
              background: "var(--surface-01)",
              border: "1px solid var(--border-neutral)",
              borderRadius: "var(--radius-lg)",
              padding: "18px 20px",
            }}
          >
            <div className="section-eyebrow" style={{ marginBottom: 14 }}>
              Expense Lifecycle
            </div>
            {[
              { label: "Requested", done: true, danger: false },
              {
                label: "Pending Approval",
                done: expense.status !== "pending-approval",
                danger: false,
              },
              {
                label: expense.status === "rejected" ? "Rejected" : "Approved",
                done: ["approved", "paid", "rejected"].includes(expense.status),
                danger: expense.status === "rejected",
                skip: expense.status === "cancelled",
              },
              {
                label: "Paid",
                done: expense.status === "paid",
                skip:
                  expense.status === "rejected" ||
                  expense.status === "cancelled",
              },
            ]
              .filter((s) => !s.skip)
              .map((step, i, arr) => (
                <div key={step.label} style={{ display: "flex", gap: 12 }}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: step.done
                          ? step.danger
                            ? "var(--sem-danger)"
                            : "var(--sem-success)"
                          : "transparent",
                        border: step.done
                          ? "none"
                          : "2px solid var(--border-neutral)",
                        marginTop: 4,
                      }}
                    />
                    {i < arr.length - 1 && (
                      <div
                        style={{
                          width: 1,
                          flex: 1,
                          background: "var(--border-neutral)",
                          margin: "4px 0",
                          minHeight: 16,
                        }}
                      />
                    )}
                  </div>
                  <div
                    style={{
                      paddingBottom: i < arr.length - 1 ? 14 : 0,
                      fontSize: 12.5,
                      fontWeight: 500,
                      color: step.done
                        ? step.danger
                          ? "var(--sem-danger)"
                          : "var(--text-primary)"
                        : "var(--text-muted)",
                    }}
                  >
                    {step.label}
                  </div>
                </div>
              ))}
          </div>

          {/* Approve/Reject actions */}
          {isPending && canApprove && (
            <div
              style={{
                background: "var(--surface-01)",
                border: "1px solid var(--border-neutral)",
                borderRadius: "var(--radius-lg)",
                padding: "18px 20px",
              }}
            >
              <div className="section-eyebrow" style={{ marginBottom: 4 }}>
                Approval Decision
              </div>
              <div
                style={{
                  fontSize: 12.5,
                  color: "var(--text-secondary)",
                  marginBottom: 14,
                  lineHeight: 1.5,
                }}
              >
                Review the expense details above before making a decision.
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button
                  className="btn-primary"
                  style={{ width: "100%", padding: "10px 0" }}
                  onClick={() => setModal("approve")}
                >
                  Approve Expense
                </button>
                <button
                  onClick={() => setModal("reject")}
                  style={{
                    width: "100%",
                    padding: "10px 0",
                    border: "1px solid var(--sem-danger)",
                    color: "var(--sem-danger)",
                    background: "transparent",
                    borderRadius: "var(--radius-md)",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Reject Expense
                </button>
              </div>
            </div>
          )}

          {/* Pay action */}
          {isApproved && canPay && (
            <div
              style={{
                background: "var(--surface-01)",
                border: "1px solid var(--border-neutral)",
                borderRadius: "var(--radius-lg)",
                padding: "18px 20px",
              }}
            >
              <div className="section-eyebrow" style={{ marginBottom: 4 }}>
                Payment
              </div>
              <div
                style={{
                  fontSize: 12.5,
                  color: "var(--text-secondary)",
                  marginBottom: 14,
                  lineHeight: 1.5,
                }}
              >
                This expense has been approved. Approval and payment are
                distinct steps.
              </div>
              <button
                className="btn-primary"
                style={{ width: "100%", padding: "10px 0" }}
                onClick={() => setModal("pay")}
              >
                Pay Expense
              </button>
            </div>
          )}

          {/* Cancel action */}
          {isCancellable && (
            <div
              style={{
                background: "var(--surface-01)",
                border: "1px solid var(--border-neutral)",
                borderRadius: "var(--radius-lg)",
                padding: "16px 20px",
              }}
            >
              <div className="section-eyebrow" style={{ marginBottom: 10 }}>
                Actions
              </div>
              <button
                onClick={() => setModal("cancel")}
                style={{
                  width: "100%",
                  padding: "8px 0",
                  border: "1px solid var(--border-neutral)",
                  color: "var(--text-secondary)",
                  background: "transparent",
                  borderRadius: "var(--radius-md)",
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Cancel Expense
              </button>
            </div>
          )}
        </div>
      </div>

      {modal === "approve" && expense && (
        <ApproveModal
          expense={expense}
          onConfirm={handleApprove}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "reject" && expense && (
        <RejectModal
          expense={expense}
          onConfirm={handleReject}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "pay" && expense && (
        <PayModal
          expense={expense}
          onConfirm={handlePay}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "cancel" && expense && (
        <CancelModal
          expense={expense}
          onConfirm={handleCancel}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}

// ─── Create / Edit Expense view ────────────────────────────────────────────────

function ExpenseFormView({
  existing,
  onBack,
  onDone,
}: {
  existing?: FullExpense | null
  onBack: () => void
  onDone: () => void
}) {
  const toast = useToast()
  const isEdit = !!existing
  const [form, setForm] = useState({
    category: existing?.category ?? "",
    description: existing?.description ?? "",
    amount: existing?.amount ?? "",
    date: existing?.date ?? "2026-08-12",
    paymentMethod: "Cash",
    ref: existing?.ref ?? "",
    notes: "",
  })
  const [uploading, setUploading] =
    useState<"idle" | "uploading" | "uploaded" | "error">("idle")
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [resultRef, setResultRef] = useState("")
  const [err, setErr] = useState<string | null>(null)

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))
  const valid =
    form.category && form.description.trim() && form.amount.trim() && form.date

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!valid || submitting) return
    setSubmitting(true)
    setErr(null)
    const r =
      isEdit && existing
        ? await editExpense(existing.id, {
            category: form.category,
            description: form.description,
            amount: form.amount,
            date: form.date,
          })
        : await createExpense({
            category: form.category,
            description: form.description,
            amount: form.amount,
            date: form.date,
            notes: form.notes,
          })
    setSubmitting(false)
    if (r.data) {
      setResultRef((r.data as FullExpense).ref)
      setDone(true)
      toast.success(isEdit ? "Expense updated." : "Expense submitted.")
      setTimeout(() => onDone(), 1500)
    } else {
      setErr(
        r.error ??
          (isEdit
            ? "Expense could not be updated."
            : "We couldn't submit this expense. Please check your connection and try again."),
      )
    }
  }

  if (done) {
    return (
      <div
        style={{
          padding: 32,
          maxWidth: 580,
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: "var(--color-status-safe-surface)",
            border: "1px solid var(--color-status-safe-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          <Ic
            d={ICONS.checkCircle}
            size={22}
            style={{ color: "var(--sem-success)" }}
          />
        </div>
        <div
          style={{
            fontSize: 17,
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: 6,
          }}
        >
          {isEdit ? "Expense updated." : "Expense submitted."}
        </div>
        {!isEdit && (
          <div
            style={{
              fontSize: 13.5,
              color: "var(--text-secondary)",
              marginBottom: 4,
            }}
          >
            Your request is pending approval.
          </div>
        )}
        <div
          style={{
            fontFamily: "DM Mono, monospace",
            fontSize: 12,
            color: "var(--text-muted)",
          }}
        >
          Reference: {resultRef}
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: 32, maxWidth: 640, margin: "0 auto" }}>
      <button
        onClick={onBack}
        className="btn-ghost"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 13,
          marginBottom: 24,
        }}
      >
        <Ic d={ICONS.back} size={14} /> All Expenses
      </button>
      <div style={{ marginBottom: 28 }}>
        <div className="section-eyebrow" style={{ marginBottom: 4 }}>
          Finance
        </div>
        <h1 className="type-h1" style={{ color: "var(--text-primary)" }}>
          {isEdit ? "Edit Expense" : "New Expense"}
        </h1>
        {isEdit && (
          <div
            style={{
              marginTop: 10,
              padding: "10px 14px",
              background: "var(--color-status-warning-surface)",
              border: "1px solid var(--color-status-warning-border)",
              borderRadius: "var(--radius-sm)",
              fontSize: 12.5,
              color: "var(--color-status-warning)",
            }}
          >
            Editing this expense may return it to review depending on the
            financial workflow.
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {/* Section 1 — Expense Information */}
        <div
          style={{
            background: "var(--surface-01)",
            border: "1px solid var(--border-neutral)",
            borderRadius: "var(--radius-lg)",
            padding: 24,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontSize: 13.5,
              fontWeight: 600,
              color: "var(--text-primary)",
              marginBottom: 18,
            }}
          >
            Expense Information
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12.5,
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                  marginBottom: 6,
                }}
              >
                Expense Category{" "}
                <span style={{ color: "var(--sem-danger)" }}>*</span>
              </label>
              <select
                className="input-field"
                style={{ width: "100%" }}
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                required
              >
                <option value="">Select a category…</option>
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12.5,
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                  marginBottom: 6,
                }}
              >
                Description{" "}
                <span style={{ color: "var(--sem-danger)" }}>*</span>
              </label>
              <textarea
                className="input-field"
                rows={3}
                style={{ width: "100%", resize: "vertical" }}
                placeholder="Describe what this expense was for."
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        {/* Section 2 — Financial Information */}
        <div
          style={{
            background: "var(--surface-01)",
            border: "1px solid var(--border-neutral)",
            borderRadius: "var(--radius-lg)",
            padding: 24,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontSize: 13.5,
              fontWeight: 600,
              color: "var(--text-primary)",
              marginBottom: 18,
            }}
          >
            Financial Information
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12.5,
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                  marginBottom: 6,
                }}
              >
                Amount (ETB){" "}
                <span style={{ color: "var(--sem-danger)" }}>*</span>
              </label>
              <input
                className="input-field"
                style={{ width: "100%", fontFamily: "DM Mono, monospace" }}
                placeholder="e.g. ETB 4,500.00"
                value={form.amount}
                onChange={(e) => set("amount", e.target.value)}
                required
              />
              <div
                style={{
                  fontSize: 11.5,
                  color: "var(--text-muted)",
                  marginTop: 4,
                }}
              >
                Currency: ETB
              </div>
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12.5,
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                  marginBottom: 6,
                }}
              >
                Expense Date{" "}
                <span style={{ color: "var(--sem-danger)" }}>*</span>
              </label>
              <input
                type="date"
                className="input-field"
                style={{ width: "100%" }}
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        {/* Section 3 — Payment Information */}
        <div
          style={{
            background: "var(--surface-01)",
            border: "1px solid var(--border-neutral)",
            borderRadius: "var(--radius-lg)",
            padding: 24,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontSize: 13.5,
              fontWeight: 600,
              color: "var(--text-primary)",
              marginBottom: 18,
            }}
          >
            Payment Information
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12.5,
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                  marginBottom: 6,
                }}
              >
                Payment Method
              </label>
              <select
                className="input-field"
                style={{ width: "100%" }}
                value={form.paymentMethod}
                onChange={(e) => set("paymentMethod", e.target.value)}
              >
                {["Cash", "Bank Transfer", "Card", "Other"].map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12.5,
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                  marginBottom: 6,
                }}
              >
                Reference
              </label>
              <input
                className="input-field"
                style={{ width: "100%", fontFamily: "DM Mono, monospace" }}
                placeholder="Optional reference"
                value={form.ref}
                onChange={(e) => set("ref", e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Section 4 — Supporting Document */}
        <div
          style={{
            background: "var(--surface-01)",
            border: "1px solid var(--border-neutral)",
            borderRadius: "var(--radius-lg)",
            padding: 24,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontSize: 13.5,
              fontWeight: 600,
              color: "var(--text-primary)",
              marginBottom: 18,
            }}
          >
            Supporting Document
          </div>
          <div
            onClick={() => {
              if (uploading === "idle") {
                setUploading("uploading")
                setTimeout(() => setUploading("uploaded"), 1500)
              } else if (uploading === "uploaded") setUploading("idle")
            }}
            role="button"
            tabIndex={0}
            style={{
              border: `2px dashed ${
                uploading === "uploaded"
                  ? "var(--sem-success)"
                  : uploading === "error"
                    ? "var(--sem-danger)"
                    : "var(--border-neutral)"
              }`,
              borderRadius: "var(--radius-md)",
              padding: "28px 20px",
              textAlign: "center",
              cursor: "pointer",
              background:
                uploading === "uploaded"
                  ? "var(--color-status-safe-surface)"
                  : "transparent",
              transition: "all 0.15s",
            }}
          >
            {uploading === "idle" && (
              <>
                <Ic
                  d={ICONS.upload}
                  size={22}
                  style={{
                    color: "var(--text-muted)",
                    display: "block",
                    margin: "0 auto 8px",
                  }}
                />
                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  Click to upload supporting document
                </div>
                <div
                  style={{
                    fontSize: 11.5,
                    color: "var(--text-muted)",
                    marginTop: 4,
                  }}
                >
                  PDF, JPG, PNG — up to 10MB
                </div>
              </>
            )}
            {uploading === "uploading" && (
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                Uploading…
              </div>
            )}
            {uploading === "uploaded" && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <Ic
                  d={ICONS.check}
                  size={16}
                  style={{ color: "var(--sem-success)" }}
                />
                <span style={{ fontSize: 13, color: "var(--sem-success)" }}>
                  Document uploaded · Click to replace
                </span>
              </div>
            )}
            {uploading === "error" && (
              <div style={{ fontSize: 13, color: "var(--sem-danger)" }}>
                Upload failed — click to retry
              </div>
            )}
          </div>
        </div>

        {/* Section 5 — Notes */}
        <div
          style={{
            background: "var(--surface-01)",
            border: "1px solid var(--border-neutral)",
            borderRadius: "var(--radius-lg)",
            padding: 24,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              fontSize: 13.5,
              fontWeight: 600,
              color: "var(--text-primary)",
              marginBottom: 18,
            }}
          >
            Notes
          </div>
          <textarea
            className="input-field"
            rows={3}
            style={{ width: "100%", resize: "vertical" }}
            placeholder="Additional context for the reviewer"
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
          />
        </div>

        {err && (
          <div
            style={{
              padding: "12px 16px",
              background: "var(--color-status-danger-surface)",
              border: "1px solid var(--color-status-danger-border)",
              borderRadius: "var(--radius-md)",
              fontSize: 13,
              color: "var(--sem-danger)",
              marginBottom: 16,
              lineHeight: 1.55,
            }}
          >
            {err}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={onBack}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={!valid || submitting}
          >
            {submitting
              ? isEdit
                ? "Saving…"
                : "Submitting…"
              : isEdit
                ? "Save Changes"
                : "Submit Expense"}
          </button>
        </div>
      </form>
    </div>
  )
}

// ─── Categories view ───────────────────────────────────────────────────────────

function CategoriesView({
  onBack,
  canManage,
}: {
  onBack: () => void
  canManage: boolean
}) {
  const toast = useToast()
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<ExpenseCategory | null>(null)
  const [deactivateTarget, setDeactivateTarget] =
    useState<ExpenseCategory | null>(null)
  const [formData, setFormData] = useState({ name: "", description: "" })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    listExpenseCategories().then((r) => {
      if (r.data) setCategories(r.data)
      else setError(r.error ?? "Unable to load expense categories.")
      setLoading(false)
    })
  }, [])

  function startEdit(cat: ExpenseCategory) {
    setEditTarget(cat)
    setFormData({ name: cat.name, description: cat.description })
    setShowForm(true)
  }

  function startNew() {
    setEditTarget(null)
    setFormData({ name: "", description: "" })
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.name.trim() || submitting) return
    setSubmitting(true)
    const r = editTarget
      ? await updateExpenseCategory(editTarget.id, formData)
      : await createExpenseCategory(formData)
    setSubmitting(false)
    if (r.data) {
      if (editTarget) {
        setCategories((cs) =>
          cs.map((c) =>
            c.id === editTarget.id ? r.data as ExpenseCategory : c,
          ),
        )
        toast.success("Category updated.")
      } else {
        setCategories((cs) => [...cs, r.data as ExpenseCategory])
        toast.success("Category created.")
      }
      setShowForm(false)
    } else {
      toast.error(r.error ?? "Category could not be saved.")
    }
  }

  async function handleDeactivate() {
    if (!deactivateTarget) return
    const r = await deactivateExpenseCategory(deactivateTarget.id)
    if (r.data) {
      setCategories((cs) =>
        cs.map((c) =>
          c.id === deactivateTarget.id
            ? { ...c, status: "inactive" as const }
            : c,
        ),
      )
      toast.success(`"${deactivateTarget.name}" deactivated.`)
    } else {
      toast.error(r.error ?? "Category could not be deactivated.")
    }
    setDeactivateTarget(null)
  }

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: 32 }}>
      <button
        onClick={onBack}
        className="btn-ghost"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 13,
          marginBottom: 24,
        }}
      >
        <Ic d={ICONS.back} size={14} /> All Expenses
      </button>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
          marginBottom: 28,
        }}
      >
        <div>
          <div className="section-eyebrow" style={{ marginBottom: 4 }}>
            Finance
          </div>
          <h1
            className="type-h1"
            style={{ color: "var(--text-primary)", marginBottom: 6 }}
          >
            Expense Categories
          </h1>
          <p style={{ fontSize: 13.5, color: "var(--text-secondary)" }}>
            Manage the expense categories available for recording expenses.
          </p>
        </div>
        {canManage && (
          <button
            className="btn-primary"
            onClick={startNew}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
            }}
          >
            <Ic d={ICONS.plus} size={14} /> New Category
          </button>
        )}
      </div>

      {/* Form panel */}
      {showForm && (
        <div
          style={{
            background: "var(--surface-01)",
            border: "1px solid var(--brand-primary)",
            borderRadius: "var(--radius-lg)",
            padding: 24,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--text-primary)",
              marginBottom: 18,
            }}
          >
            {editTarget ? "Edit Category" : "New Expense Category"}
          </div>
          <form onSubmit={handleSubmit}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 12.5,
                    fontWeight: 500,
                    color: "var(--text-secondary)",
                    marginBottom: 6,
                  }}
                >
                  Category Name{" "}
                  <span style={{ color: "var(--sem-danger)" }}>*</span>
                </label>
                <input
                  className="input-field"
                  style={{ width: "100%" }}
                  placeholder="e.g. Transport"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, name: e.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 12.5,
                    fontWeight: 500,
                    color: "var(--text-secondary)",
                    marginBottom: 6,
                  }}
                >
                  Description
                </label>
                <input
                  className="input-field"
                  style={{ width: "100%" }}
                  placeholder="Brief description of this category"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, description: e.target.value }))
                  }
                />
              </div>
            </div>
            <div
              style={{
                display: "flex",
                gap: 10,
                justifyContent: "flex-end",
                marginTop: 16,
                paddingTop: 16,
                borderTop: "1px solid var(--border-neutral)",
              }}
            >
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowForm(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={!formData.name.trim() || submitting}
              >
                {submitting
                  ? "Saving…"
                  : editTarget
                    ? "Save Changes"
                    : "Create Category"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div
        style={{
          background: "var(--surface-01)",
          border: "1px solid var(--border-neutral)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
        }}
      >
        {loading ? (
          <div
            style={{
              padding: 20,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {[...Array(5)].map((_, i) => (
              <Sk key={i} />
            ))}
          </div>
        ) : error ? (
          <div
            style={{
              padding: 32,
              textAlign: "center",
              color: "var(--sem-danger)",
              fontSize: 13.5,
            }}
          >
            {error}
          </div>
        ) : categories.length === 0 ? (
          <div style={{ padding: "56px 32px", textAlign: "center" }}>
            <Ic
              d={ICONS.tag}
              size={28}
              style={{
                color: "var(--text-muted)",
                display: "block",
                margin: "0 auto 12px",
              }}
            />
            <div
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: "var(--text-primary)",
                marginBottom: 6,
              }}
            >
              No expense categories available
            </div>
          </div>
        ) : (
          <table
            className="data-table"
            style={{ width: "100%", borderCollapse: "collapse" }}
            aria-label="Expense categories"
          >
            <thead>
              <tr>
                {[
                  "Category",
                  "Description",
                  "Status",
                  "Usage",
                  ...(canManage ? [""] : []),
                ].map((h) => (
                  <th key={h} scope="col">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id}>
                  <td
                    style={{
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      fontSize: 13,
                    }}
                  >
                    {cat.name}
                  </td>
                  <td style={{ color: "var(--text-secondary)", fontSize: 13 }}>
                    {cat.description}
                  </td>
                  <td>
                    <CategoryBadge status={cat.status} />
                  </td>
                  <td
                    style={{
                      fontFamily: "DM Mono, monospace",
                      fontSize: 13,
                      color: "var(--text-muted)",
                    }}
                  >
                    {cat.usageCount} expense{cat.usageCount !== 1 ? "s" : ""}
                  </td>
                  {canManage && (
                    <td>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          className="btn-ghost"
                          style={{ fontSize: 12, padding: "4px 10px" }}
                          onClick={() => startEdit(cat)}
                        >
                          Edit
                        </button>
                        {cat.status === "active" && (
                          <button
                            onClick={() => setDeactivateTarget(cat)}
                            style={{
                              fontSize: 12,
                              padding: "4px 10px",
                              border: "none",
                              background: "none",
                              color: "var(--text-muted)",
                              cursor: "pointer",
                            }}
                          >
                            Deactivate
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {deactivateTarget && (
        <DeactivateCategoryModal
          category={deactivateTarget}
          onConfirm={handleDeactivate}
          onClose={() => setDeactivateTarget(null)}
        />
      )}
    </div>
  )
}

// ─── Summary cards ─────────────────────────────────────────────────────────────

function SummaryCards({
  summary,
  loading,
}: {
  summary: ExpenseSummaryData | null
  loading: boolean
}) {
  if (loading) {
    return (
      <div className="resp-grid-4" style={{ marginBottom: 24, gap: 14 }}>
        {[...Array(6)].map((_, i) => (
          <Sk key={i} h={92} r={10} />
        ))}
      </div>
    )
  }
  if (!summary) return null
  const cards = [
    { label: "This Month", value: summary.thisMonth, badge: undefined },
    {
      label: "Pending Approval",
      value: summary.pendingApproval,
      badge:
        summary.pendingCount > 0 ? String(summary.pendingCount) : undefined,
      warn: true,
    },
    { label: "Approved", value: summary.approved, badge: undefined },
    { label: "Paid", value: summary.paid, badge: undefined },
    { label: "Rejected", value: summary.rejected, badge: undefined },
    { label: "Total Recorded", value: summary.total, badge: undefined },
  ]
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
        gap: 14,
        marginBottom: 24,
      }}
    >
      {cards.map((c) => (
        <div key={c.label} className="stat-card">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 10,
            }}
          >
            <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
              {c.label}
            </div>
            {c.badge && (
              <span
                style={{
                  fontSize: 10,
                  fontFamily: "DM Mono, monospace",
                  padding: "1px 6px",
                  borderRadius: "var(--radius-pill)",
                  background: "var(--sem-warning)",
                  color: "#fff",
                }}
              >
                {c.badge}
              </span>
            )}
          </div>
          <div
            className="type-numeric-lg"
            style={{
              color:
                c.warn && summary.pendingCount > 0
                  ? "var(--sem-warning)"
                  : "var(--text-primary)",
            }}
          >
            {c.value}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Main Expenses Page ────────────────────────────────────────────────────────

export default function Expenses({ routeParams }: { routeParams?: { id?: string } }) {
  // All hooks first — before any conditional returns
  const { currentUser } = useAuth()
  const role = currentUser?.role ?? "viewer"
  const canView = can(role as any, "expenses.view")
  const canCreate = can(role as any, "expenses.create")
  const canApprove = can(role as any, "expenses.approve")
  const canPay = can(role as any, "expenses.pay")
  const canCancel = can(role as any, "expenses.cancel")
  const canExport = can(role as any, "expenses.export")
  const canManageCats = can(role as any, "expenses.category.manage")

  const [view, setView] = useState<View>("list")
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(
    null,
  )
  const [editingExpense, setEditingExpense] = useState<FullExpense | null>(null)
  const [summary, setSummary] = useState<ExpenseSummaryData | null>(null)
  const [expenses, setExpenses] = useState<FullExpense[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [dataError, setDataError] = useState<string | null>(null)
  const [filters, setFilters] = useState<Filters>({
    search: "",
    status: "all",
    category: "all",
    dateRange: "month",
  })
  const [showExport, setShowExport] = useState(false)

  function loadData() {
    setLoadingData(true)
    setDataError(null)
    Promise.all([getExpenseSummary(), listExpensesFull()]).then(([s, e]) => {
      if (s.data) setSummary(s.data)
      if (e.data) setExpenses(e.data)
      else setDataError("Unable to load expenses.")
      setLoadingData(false)
    })
  }

  useEffect(() => {
    loadData()
  }, [])

  // Realtime: refresh expenses and summary when `expenses` table changes
  useSupabaseRealtime("expenses", () => {
    loadData()
  })

  function goDetail(id: string) {
    setSelectedExpenseId(id)
    setView("detail")
  }

  useEffect(() => {
    if (routeParams?.id) {
      goDetail(routeParams.id)
    }
  }, [routeParams])

  // Guard after all hooks
  if (!canView) return <AccessDenied />

  // Sub-views
  if (view === "approval-queue") {
    return (
      <ApprovalQueueView
        expenses={expenses}
        loading={loadingData}
        onBack={() => setView("list")}
        onView={goDetail}
      />
    )
  }
  if (view === "detail" && selectedExpenseId) {
    return (
      <ExpenseDetailView
        expenseId={selectedExpenseId}
        onBack={() => setView("list")}
        canApprove={canApprove}
        canPay={canPay}
        canCancel={canCancel}
        onUpdated={loadData}
      />
    )
  }
  if (view === "create") {
    return (
      <ExpenseFormView
        onBack={() => setView("list")}
        onDone={() => {
          loadData()
          setView("list")
        }}
      />
    )
  }
  if (view === "edit" && editingExpense) {
    return (
      <ExpenseFormView
        existing={editingExpense}
        onBack={() => setView("list")}
        onDone={() => {
          loadData()
          setView("list")
        }}
      />
    )
  }
  if (view === "categories") {
    return (
      <CategoriesView
        onBack={() => setView("list")}
        canManage={canManageCats}
      />
    )
  }

  // Filter expenses client-side (structure ready for server params)
  const filtered = expenses.filter((e) => {
    if (filters.status !== "all" && e.status !== filters.status) return false
    if (filters.category !== "all" && e.category !== filters.category)
      return false
    if (filters.search) {
      const q = filters.search.toLowerCase()
      if (
        !e.ref.toLowerCase().includes(q) &&
        !e.description.toLowerCase().includes(q) &&
        !e.requestedBy.toLowerCase().includes(q)
      )
        return false
    }
    return true
  })

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: 32 }}>
      {/* Page header */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div>
          <div className="section-eyebrow" style={{ marginBottom: 4 }}>
            Finance
          </div>
          <h1
            className="type-h1"
            style={{ color: "var(--text-primary)", marginBottom: 6 }}
          >
            Expenses
          </h1>
          <p style={{ fontSize: 13.5, color: "var(--text-secondary)" }}>
            Track, review, and manage business expenses.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {canManageCats && (
            <button
              className="btn-ghost"
              onClick={() => setView("categories")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 13,
              }}
            >
              <Ic d={ICONS.tag} size={14} /> Categories
            </button>
          )}
          {canApprove && (
            <button
              className="btn-secondary"
              onClick={() => setView("approval-queue")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 13,
              }}
            >
              <Ic d={ICONS.check} size={14} /> Approval Queue
              {summary && summary.pendingCount > 0 && (
                <span
                  style={{
                    fontSize: 10,
                    fontFamily: "DM Mono, monospace",
                    padding: "1px 6px",
                    borderRadius: "var(--radius-pill)",
                    background: "var(--sem-warning)",
                    color: "#fff",
                    marginLeft: 2,
                  }}
                >
                  {summary.pendingCount}
                </span>
              )}
            </button>
          )}
          {canCreate && (
            <button
              className="btn-primary"
              onClick={() => setView("create")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 13,
              }}
            >
              <Ic d={ICONS.plus} size={14} /> New Expense
            </button>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <SummaryCards summary={summary} loading={loadingData} />

      {/* Needs Attention */}
      {!loadingData && summary && canApprove && (
        <div style={{ marginBottom: 24 }}>
          <NeedsAttentionPanel
            summary={summary}
            canApprove={canApprove}
            onGoQueue={() => setView("approval-queue")}
          />
        </div>
      )}

      {/* Data error */}
      {!loadingData && dataError && (
        <div
          style={{
            padding: "14px 20px",
            background: "var(--color-status-danger-surface)",
            border: "1px solid var(--color-status-danger-border)",
            borderRadius: "var(--radius-lg)",
            marginBottom: 24,
            fontSize: 13.5,
            color: "var(--sem-danger)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Ic d={ICONS.warn} size={15} style={{ flexShrink: 0 }} />
          {dataError}
        </div>
      )}

      {/* Expense list */}
      <div
        style={{
          background: "var(--surface-01)",
          border: "1px solid var(--border-neutral)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid var(--border-neutral)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--text-primary)",
            }}
          >
            All Expenses
          </div>
          <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
            {filtered.length} record{filtered.length !== 1 ? "s" : ""}
          </div>
        </div>
        <ExpenseFilterBar
          filters={filters}
          onFilters={setFilters}
          canExport={canExport}
          onExport={() => setShowExport(true)}
        />
        <ExpenseTable
          expenses={filtered}
          loading={loadingData}
          empty={!loadingData && expenses.length === 0}
          noResults={
            !loadingData && expenses.length > 0 && filtered.length === 0
          }
          onView={goDetail}
          canApprove={canApprove}
        />
      </div>

      {showExport && <ExportModal onClose={() => setShowExport(false)} />}
    </div>
  )
}
