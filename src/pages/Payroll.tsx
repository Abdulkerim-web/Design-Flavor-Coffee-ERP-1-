import { useState, useEffect } from "react"
import {
  getPayrollRun,
  updatePayrollAmount,
  submitPayrollForApproval,
  approvePayrollRun,
  finalizePayrollRun,
} from "../services/finance-ops"
import type {
  PayrollRun,
  PayrollEmployee,
  PayrollRunStatus,
} from "../services/finance-ops"
import { useAuth } from "../contexts/AuthContext"
import { can } from "../lib/can"
import useSupabaseRealtime from "../hooks/useSupabaseRealtime"

type View = "dashboard" | "run-detail" | "employee-detail"

function Skeleton({ h, className = "" }: { h?: string className?: string }) {
  return (
    <div
      className={`bg-[var(--border-neutral)] rounded animate-pulse ${className}`}
      style={{ height: h }}
    />
  )
}

const RUN_STATUS_CFG: Record<PayrollRunStatus, { label: string cls: string }> =
  {
    draft: {
      label: "Draft",
      cls: "bg-[var(--border-neutral)] text-[var(--text-muted)]",
    },
    "pending-approval": {
      label: "Pending Approval",
      cls: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
    },
    approved: {
      label: "Approved",
      cls: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
    },
    paid: {
      label: "Paid",
      cls: "bg-[var(--sem-success)]/15 text-[var(--sem-success)]",
    },
    closed: {
      label: "Closed",
      cls: "bg-[var(--border-neutral)] text-[var(--text-muted)]",
    },
  }

function RunStatusBadge({ status }: { status: PayrollRunStatus }) {
  const c = RUN_STATUS_CFG[status]
  return (
    <span className={`text-[11px] font-mono px-2.5 py-1 rounded-full ${c.cls}`}>
      {c.label}
    </span>
  )
}

function ReviewBadge({ status }: { status: "ok" | "needs-review" }) {
  if (status === "ok")
    return (
      <span className="text-[11px] font-mono text-[var(--sem-success)]">
        OK
      </span>
    )
  return (
    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
      Needs Review
    </span>
  )
}

function Row({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-[12px] text-[var(--text-muted)]">{label}</span>
      <span
        className={`text-[13px] text-[var(--text-primary)] text-right ${
          mono ? "font-mono font-semibold" : ""
        }`}
      >
        {value}
      </span>
    </div>
  )
}

// ─── Edit Amount Modal ─────────────────────────────────────────────────────────

function EditAmountModal({
  employee,
  onConfirm,
  onClose,
}: {
  employee: PayrollEmployee
  onConfirm: (newAmount: string, reason: string) => void
  onClose: () => void
}) {
  const [newAmount, setNewAmount] = useState("")
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)

  async function handle() {
    if (!newAmount.trim() || !reason.trim()) return
    setLoading(true)
    await onConfirm(newAmount, reason)
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-[var(--surface-01)] border border-[var(--border-neutral)] rounded-2xl p-6 w-full max-w-md shadow-xl">
        <div className="text-[16px] font-semibold text-[var(--text-primary)] mb-1">
          Edit Payroll Amount
        </div>
        <div className="text-[12px] text-[var(--text-secondary)] mb-5">
          This is an audit-sensitive operation. A reason is required.
        </div>
        <div className="space-y-3 mb-5">
          <Row label="Employee" value={employee.name} />
          <Row label="Role" value={employee.role} />
          <Row label="Current Amount" value={employee.finalAmount} mono />
        </div>
        <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1.5">
          New Amount (ETB) <span className="text-[var(--sem-danger)]">*</span>
        </label>
        <input
          type="text"
          value={newAmount}
          onChange={(e) => setNewAmount(e.target.value)}
          placeholder="e.g. 15,000.00"
          className="w-full px-3 py-2.5 border border-[var(--border-neutral)] rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)] text-[13px] font-mono focus:outline-none focus:border-[#2B4D3A] mb-4"
        />
        {newAmount && employee.finalAmount && (
          <div className="p-3 bg-[var(--border-neutral)]/30 rounded-lg text-[12px] text-[var(--text-muted)] mb-4 font-mono">
            Previous: {employee.finalAmount} → New: ETB {newAmount}
          </div>
        )}
        <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1.5">
          Reason <span className="text-[var(--sem-danger)]">*</span>
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="State the reason for this change…"
          rows={3}
          className="w-full px-3 py-2 border border-[var(--border-neutral)] rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)] text-[13px] focus:outline-none focus:border-[#2B4D3A] resize-none mb-5"
        />
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-[var(--border-neutral)] rounded-xl text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handle}
            disabled={loading || !newAmount.trim() || !reason.trim()}
            className="flex-1 py-2.5 bg-[#2B4D3A] text-white rounded-xl text-[13px] font-medium hover:bg-[#3a6b50] disabled:opacity-60 transition-colors"
          >
            {loading ? "Saving…" : "Save Change"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Approve Modal ─────────────────────────────────────────────────────────────

function ApproveRunModal({
  run,
  onConfirm,
  onClose,
}: {
  run: PayrollRun
  onConfirm: () => void
  onClose: () => void
}) {
  const [loading, setLoading] = useState(false)
  async function handle() {
    setLoading(true)
    await onConfirm()
    setLoading(false)
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-[var(--surface-01)] border border-[var(--border-neutral)] rounded-2xl p-6 w-full max-w-md shadow-xl">
        <div className="text-[16px] font-semibold text-[var(--text-primary)] mb-4">
          Approve Payroll Run
        </div>
        <div className="space-y-3 mb-5">
          <Row label="Period" value={run.period} />
          <Row label="Employees" value={`${run.employeeCount}`} />
          <Row label="Total Payroll" value={run.totalAmount} mono />
          {run.pendingReviewCount > 0 && (
            <Row
              label="Needs Review"
              value={`${run.pendingReviewCount} employee${
                run.pendingReviewCount !== 1 ? "s" : ""
              }`}
            />
          )}
          {run.changesCount > 0 && (
            <Row
              label="Changes Made"
              value={`${run.changesCount} amount change${
                run.changesCount !== 1 ? "s" : ""
              }`}
            />
          )}
        </div>
        {run.pendingReviewCount > 0 && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800 text-[12px] text-amber-700 dark:text-amber-400 mb-4">
            {run.pendingReviewCount} employee line
            {run.pendingReviewCount !== 1 ? "s" : ""} flagged for review. Review
            before approving.
          </div>
        )}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-[var(--border-neutral)] rounded-xl text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handle}
            disabled={loading}
            className="flex-1 py-2.5 bg-[#2B4D3A] text-white rounded-xl text-[13px] font-medium hover:bg-[#3a6b50] disabled:opacity-60 transition-colors"
          >
            {loading ? "Approving…" : "Approve Payroll Run"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Finalize Modal ────────────────────────────────────────────────────────────

function FinalizeRunModal({
  run,
  onConfirm,
  onClose,
}: {
  run: PayrollRun
  onConfirm: () => void
  onClose: () => void
}) {
  const [loading, setLoading] = useState(false)
  async function handle() {
    setLoading(true)
    await onConfirm()
    setLoading(false)
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-[var(--surface-01)] border border-[var(--border-neutral)] rounded-2xl p-6 w-full max-w-md shadow-xl">
        <div className="text-[16px] font-semibold text-[var(--text-primary)] mb-4">
          Finalize Payroll Run
        </div>
        <div className="space-y-3 mb-4">
          <Row label="Period" value={run.period} />
          <Row label="Employees" value={`${run.employeeCount}`} />
          <Row label="Total Amount" value={run.totalAmount} mono />
          <Row
            label="Approval"
            value={
              run.approvedBy
                ? `Approved by ${run.approvedBy}`
                : "Not yet approved"
            }
          />
        </div>
        {run.pendingReviewCount > 0 && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800 text-[12px] text-amber-700 dark:text-amber-400 mb-4">
            {run.pendingReviewCount} unresolved review item
            {run.pendingReviewCount !== 1 ? "s" : ""} remain.
          </div>
        )}
        <div className="p-3 bg-[var(--border-neutral)]/30 rounded-lg text-[12px] text-[var(--text-muted)] mb-5">
          Finalizing this payroll run records the approved payroll amounts for
          this period. This action cannot be undone.
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-[var(--border-neutral)] rounded-xl text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handle}
            disabled={loading}
            className="flex-1 py-2.5 bg-[#2B4D3A] text-white rounded-xl text-[13px] font-medium hover:bg-[#3a6b50] disabled:opacity-60 transition-colors"
          >
            {loading ? "Finalizing…" : "Finalize Payroll"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Payroll Run Detail ────────────────────────────────────────────────────────

function PayrollRunDetail({
  run,
  canEdit,
  canApproveRun,
  canFinalize,
  onBack,
  onRunUpdated,
  onViewEmployee,
}: {
  run: PayrollRun
  canEdit: boolean
  canApproveRun: boolean
  canFinalize: boolean
  onBack: () => void
  onRunUpdated: (r: PayrollRun) => void
  onViewEmployee: (id: string) => void
}) {
  const [editEmployee, setEditEmployee] = useState<PayrollEmployee | null>(null)
  const [modal, setModal] = useState<"approve" | "finalize" | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function handleSubmitForApproval() {
    setSubmitting(true)
    const updatedTimeline = [
      ...(run.timeline || []),
      {
        id: `tl-${Date.now()}`,
        action: "Submitted for Approval",
        actor: "Payroll Administrator",
        timestamp: new Date().toLocaleTimeString(),
        note: "Submitted for manager review.",
      },
    ]
    const updated: PayrollRun = { ...run, status: "pending-approval", timeline: updatedTimeline }
    onRunUpdated(updated)
    try {
      const r = await submitPayrollForApproval(run.id)
      const payload = (r.data as any)?.data || r.data
      if (payload && payload.status) onRunUpdated({ ...updated, ...payload })
    } catch {}
    showToast("Payroll submitted for approval — Manager alerted!")
    setSubmitting(false)
  }

  async function handleApprove() {
    const updatedTimeline = [
      ...(run.timeline || []),
      {
        id: `tl-${Date.now()}`,
        action: "Approved",
        actor: "General Manager",
        timestamp: new Date().toLocaleTimeString(),
        note: "Approved for bank disbursement.",
      },
    ]
    const updated: PayrollRun = { ...run, status: "approved", timeline: updatedTimeline }
    onRunUpdated(updated)
    try {
      const r = await approvePayrollRun(run.id, "current-user")
      const payload = (r.data as any)?.data || r.data
      if (payload && payload.status) onRunUpdated({ ...updated, ...payload })
    } catch {}
    showToast("Payroll run approved.")
    setModal(null)
  }

  async function handleFinalize() {
    const updatedTimeline = [
      ...(run.timeline || []),
      {
        id: `tl-${Date.now()}`,
        action: "Finalized & Disbursed",
        actor: "Finance Director",
        timestamp: new Date().toLocaleTimeString(),
        note: "Salaries disbursed to staff accounts via CBE Direct.",
      },
    ]
    const updated: PayrollRun = { ...run, status: "paid", timeline: updatedTimeline }
    onRunUpdated(updated)
    try {
      const r = await finalizePayrollRun(run.id)
      const payload = (r.data as any)?.data || r.data
      if (payload && payload.status) onRunUpdated({ ...updated, ...payload })
    } catch {}
    showToast("Payroll run finalized & salaries disbursed successfully!")
    setModal(null)
  }

  async function handleEditAmount(newAmount: string, reason: string) {
    if (!editEmployee) return
    const r = await updatePayrollAmount(
      run.id,
      editEmployee.id,
      newAmount,
      reason,
    )
    if (r.data) {
      onRunUpdated(r.data)
      showToast("Payroll amount updated.")
    }
    setEditEmployee(null)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-5"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Payroll Dashboard
      </button>

      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-[var(--sem-success)] text-white text-[13px] px-4 py-2.5 rounded-xl shadow-lg">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="bg-[var(--surface-01)] border border-[var(--border-neutral)] rounded-xl p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
          <div>
            <div className="text-[11px] font-mono tracking-widest uppercase text-[var(--text-muted)] mb-1">
              Payroll Run
            </div>
            <div className="text-[20px] font-bold text-[var(--text-primary)] tracking-tight">
              {run.period}
            </div>
          </div>
          <RunStatusBadge status={run.status} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)] mb-0.5">
              Employees
            </div>
            <div className="text-[18px] font-bold text-[var(--text-primary)]">
              {run.employeeCount}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)] mb-0.5">
              Total Payroll
            </div>
            <div className="font-mono text-[18px] font-bold text-[var(--text-primary)]">
              {run.totalAmount}
            </div>
          </div>
          {run.pendingReviewCount > 0 && (
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)] mb-0.5">
                Needs Review
              </div>
              <div className="text-[18px] font-bold text-amber-600 dark:text-amber-400">
                {run.pendingReviewCount}
              </div>
            </div>
          )}
          {run.approvedBy && (
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)] mb-0.5">
                Approved By
              </div>
              <div className="text-[13px] text-[var(--text-primary)]">
                {run.approvedBy}
              </div>
              {run.approvedAt && (
                <div className="text-[11px] text-[var(--text-muted)] font-mono">
                  {run.approvedAt}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Employee table */}
        <div className="lg:col-span-2">
          <div className="bg-[var(--surface-01)] border border-[var(--border-neutral)] rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--border-neutral)] flex items-center justify-between">
              <div className="text-[13px] font-semibold text-[var(--text-primary)]">
                Employee Payroll Lines
              </div>
              <ExportMenuSmall />
            </div>
            {/* Desktop */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-[var(--border-neutral)]">
                    {[
                      "Employee",
                      "Role",
                      "Base Amount",
                      "Adjustments",
                      "Final Amount",
                      "Review",
                      "Payment",
                      "Actions",
                    ].map((h) => (
                      <th
                        key={h}
                        className={`px-4 py-3 text-[11px] font-mono tracking-wider uppercase text-[var(--text-muted)] text-left whitespace-nowrap ${
                          [
                            "Base Amount",
                            "Adjustments",
                            "Final Amount",
                          ].includes(h)
                            ? "text-right"
                            : ""
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(run.employees || []).map((emp) => (
                    <tr
                      key={emp.id}
                      className={`border-b border-[var(--border-neutral)] hover:bg-[var(--border-neutral)]/20 transition-colors ${
                        emp.reviewStatus === "needs-review"
                          ? "bg-amber-50/30 dark:bg-amber-950/10"
                          : ""
                      }`}
                    >
                      <td className="px-4 py-3 font-medium text-[var(--text-primary)] whitespace-nowrap">
                        {emp.name}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)] whitespace-nowrap text-[12px]">
                        {emp.role}
                      </td>
                      <td className="px-4 py-3 font-mono text-[13px] text-right text-[var(--text-secondary)] whitespace-nowrap">
                        {emp.baseAmount}
                      </td>
                      <td
                        className="px-4 py-3 font-mono text-[13px] text-right whitespace-nowrap"
                        style={{
                          color:
                            emp.adjustments !== "ETB 0.00"
                              ? "var(--sem-success)"
                              : "var(--text-muted)",
                        }}
                      >
                        {emp.adjustments}
                      </td>
                      <td className="px-4 py-3 font-mono text-[13px] text-right font-semibold text-[var(--text-primary)] whitespace-nowrap">
                        {emp.finalAmount}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <ReviewBadge status={emp.reviewStatus} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`text-[11px] font-mono capitalize ${
                            emp.paymentStatus === "paid"
                              ? "text-[var(--sem-success)]"
                              : "text-[var(--text-muted)]"
                          }`}
                        >
                          {emp.paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onViewEmployee(emp.id)}
                            className="text-[12px] text-[#2B4D3A] hover:underline"
                          >
                            View
                          </button>
                          {canEdit && run.status === "draft" && (
                            <button
                              onClick={() => setEditEmployee(emp)}
                              className="text-[12px] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border-neutral)] px-2 py-0.5 rounded-md transition-colors"
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile */}
            <div className="lg:hidden divide-y divide-[var(--border-neutral)]">
              {(run.employees || []).map((emp) => (
                <div
                  key={emp.id}
                  className={`px-4 py-4 ${
                    emp.reviewStatus === "needs-review"
                      ? "bg-amber-50/30 dark:bg-amber-950/10"
                      : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="font-medium text-[var(--text-primary)] text-[13px]">
                        {emp.name}
                      </div>
                      <div className="text-[12px] text-[var(--text-muted)]">
                        {emp.role}
                      </div>
                    </div>
                    <ReviewBadge status={emp.reviewStatus} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[14px] font-bold text-[var(--text-primary)]">
                      {emp.finalAmount}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onViewEmployee(emp.id)}
                        className="text-[12px] text-[#2B4D3A] hover:underline"
                      >
                        View
                      </button>
                      {canEdit && run.status === "draft" && (
                        <button
                          onClick={() => setEditEmployee(emp)}
                          className="text-[12px] border border-[var(--border-neutral)] px-2 py-0.5 rounded-md text-[var(--text-muted)]"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Manager actions */}
          {(run.status === "draft" ||
            run.status === "pending-approval" ||
            run.status === "approved") && (
            <div className="bg-[var(--surface-01)] border border-[var(--border-neutral)] rounded-xl p-5 space-y-3">
              <div className="text-[12px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
                Manager Actions
              </div>

              {run.status === "draft" && canApproveRun && (
                <button
                  onClick={handleSubmitForApproval}
                  disabled={submitting}
                  className="w-full py-2.5 bg-[#2B4D3A] text-white text-[13px] font-medium rounded-xl hover:bg-[#3a6b50] disabled:opacity-60 transition-colors"
                >
                  {submitting ? "Submitting…" : "Submit for Approval"}
                </button>
              )}

              {run.status === "pending-approval" && canApproveRun && (
                <button
                  onClick={() => setModal("approve")}
                  className="w-full py-2.5 bg-[#2B4D3A] text-white text-[13px] font-medium rounded-xl hover:bg-[#3a6b50] transition-colors"
                >
                  Approve Payroll Run
                </button>
              )}

              {run.status === "approved" && canFinalize && (
                <button
                  onClick={() => setModal("finalize")}
                  className="w-full py-2.5 bg-[#2B4D3A] text-white text-[13px] font-medium rounded-xl hover:bg-[#3a6b50] transition-colors"
                >
                  Finalize Payroll
                </button>
              )}

              {run.status === "draft" && (
                <div className="text-[11px] text-[var(--text-muted)] bg-[var(--border-neutral)]/30 rounded-lg p-3">
                  Manager is the only authorized person to edit payroll amounts
                  and approve payroll runs.
                </div>
              )}
            </div>
          )}

          {run.status === "closed" && (
            <div className="bg-[var(--sem-success)]/10 border border-[var(--sem-success)]/30 rounded-xl p-5 text-center">
              <div className="text-[14px] font-semibold text-[var(--sem-success)] mb-1">
                Payroll Completed
              </div>
              {run.finalizedBy && (
                <div className="text-[12px] text-[var(--text-muted)]">
                  Finalized by {run.finalizedBy}
                </div>
              )}
              {run.finalizedAt && (
                <div className="text-[11px] font-mono text-[var(--text-muted)] mt-0.5">
                  {run.finalizedAt}
                </div>
              )}
            </div>
          )}

          {/* Timeline */}
          <div className="bg-[var(--surface-01)] border border-[var(--border-neutral)] rounded-xl p-5">
            <div className="text-[12px] font-mono uppercase tracking-wider text-[var(--text-muted)] mb-4">
              Run Timeline
            </div>
            <div className="space-y-0">
              {(run.timeline || []).map((e, i) => (
                <div key={e.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--sem-success)] flex-shrink-0 mt-0.5" />
                    {i < (run.timeline || []).length - 1 && (
                      <div className="w-px flex-1 bg-[var(--border-neutral)] mt-1 min-h-[16px]" />
                    )}
                  </div>
                  <div className="pb-4">
                    <div className="text-[12px] font-medium text-[var(--text-primary)]">
                      {e.action}
                    </div>
                    {e.note && (
                      <div className="text-[12px] text-[var(--text-secondary)] mt-0.5">
                        {e.note}
                      </div>
                    )}
                    <div className="text-[11px] font-mono text-[var(--text-muted)] mt-0.5">
                      {e.timestamp} · {e.actor}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {editEmployee && (
        <EditAmountModal
          employee={editEmployee}
          onConfirm={handleEditAmount}
          onClose={() => setEditEmployee(null)}
        />
      )}
      {modal === "approve" && (
        <ApproveRunModal
          run={run}
          onConfirm={handleApprove}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "finalize" && (
        <FinalizeRunModal
          run={run}
          onConfirm={handleFinalize}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}

// ─── Employee Detail ───────────────────────────────────────────────────────────

function EmployeePayrollDetail({
  employee,
  run,
  onBack,
}: {
  employee: PayrollEmployee
  run: PayrollRun
  onBack: () => void
}) {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[720px] mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-5"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Payroll Run
      </button>

      <div className="bg-[var(--surface-01)] border border-[var(--border-neutral)] rounded-xl p-6 mb-5">
        <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
          <div>
            <div className="text-[11px] font-mono tracking-widest uppercase text-[var(--text-muted)] mb-1">
              Employee Payroll · {run.period}
            </div>
            <div className="text-[18px] font-bold text-[var(--text-primary)]">
              {employee.name}
            </div>
            <div className="text-[13px] text-[var(--text-secondary)]">
              {employee.role}
            </div>
          </div>
          <ReviewBadge status={employee.reviewStatus} />
        </div>
        <div className="space-y-3">
          <Row label="Base Amount" value={employee.baseAmount} mono />
          <Row label="Adjustments" value={employee.adjustments} mono />
          <div className="border-t border-[var(--border-neutral)] pt-3">
            <Row label="Final Amount" value={employee.finalAmount} mono />
          </div>
          <Row
            label="Payment Status"
            value={employee.paymentStatus === "paid" ? "Paid" : "Pending"}
          />
        </div>
        {employee.reviewReason && (
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <div className="text-[11px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">
              Review Note
            </div>
            <div className="text-[12px] text-amber-700 dark:text-amber-400">
              {employee.reviewReason}
            </div>
          </div>
        )}
      </div>

      {employee.changeHistory && employee.changeHistory.length > 0 && (
        <div className="bg-[var(--surface-01)] border border-[var(--border-neutral)] rounded-xl p-5">
          <div className="text-[12px] font-mono uppercase tracking-wider text-[var(--text-muted)] mb-4">
            Amount Change History
          </div>
          <div className="space-y-4">
            {employee.changeHistory.map((ch, i) => (
              <div
                key={i}
                className="p-3 bg-[var(--border-neutral)]/30 rounded-lg"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-mono text-[13px] text-[var(--sem-danger)]">
                    {ch.previousAmount}
                  </span>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-[var(--text-muted)]"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                  <span className="font-mono text-[13px] font-semibold text-[var(--sem-success)]">
                    {ch.newAmount}
                  </span>
                </div>
                <div className="text-[12px] text-[var(--text-secondary)] mb-1">
                  Reason: {ch.reason}
                </div>
                <div className="text-[11px] font-mono text-[var(--text-muted)]">
                  {ch.changedAt} · {ch.changedBy}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Payroll Page ─────────────────────────────────────────────────────────

export default function Payroll({ routeParams }: { routeParams?: { id?: string } }) {
  const { currentUser } = useAuth()
  const role = currentUser?.role ?? "viewer"
  const canView = can(role as any, "payroll.view")
  const canEdit = can(role as any, "payroll.edit")
  const canApproveRun = can(role as any, "payroll.approve")
  const canFinalize = can(role as any, "payroll.finalize")

  const [view, setView] = useState<View>("dashboard")
  const [run, setRun] = useState<PayrollRun | null>(null)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null)

  useEffect(() => {
    if (routeParams?.id) {
      if (routeParams.id.startsWith("run-")) {
        // Pseudo ID check logic if we were fetching specific run, but currently it just uses dummy data
        setView("run-detail")
      } else {
        setSelectedEmployeeId(routeParams.id)
        setView("employee-detail")
      }
    }
  }, [routeParams])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getPayrollRun().then((r) => {
      if (r.data) setRun(r.data)
      else setError(r.error ?? "Unable to load payroll run.")
      setLoading(false)
    })
  }, [])

  useSupabaseRealtime("payroll", async () => {
    const r = await getPayrollRun()
    if (r.data) setRun(r.data)
  })

  if (!canView)
    return (
      <div className="p-8">
        <div className="mb-6">
          <div className="text-[11px] font-mono tracking-widest uppercase text-[var(--text-muted)] mb-1">
            Finance
          </div>
          <h1 className="text-[22px] font-bold text-[var(--text-primary)] tracking-tight">
            Payroll
          </h1>
        </div>
        <div className="bg-[var(--surface-01)] border border-[var(--border-neutral)] rounded-xl p-12 text-center">
          <div className="text-[15px] font-semibold text-[var(--text-primary)] mb-2">
            Access Restricted
          </div>
          <div className="text-[13px] text-[var(--text-muted)]">
            You do not have permission to view Payroll.
          </div>
        </div>
      </div>
    )

  if (view === "run-detail" && run) {
    return (
      <PayrollRunDetail
        run={run}
        canEdit={canEdit}
        canApproveRun={canApproveRun}
        canFinalize={canFinalize}
        onBack={() => setView("dashboard")}
        onRunUpdated={(updated) => setRun(updated)}
        onViewEmployee={(id) => {
          setSelectedEmployeeId(id)
          setView("employee-detail")
        }}
      />
    )
  }

  if (view === "employee-detail" && run && selectedEmployeeId) {
    const emp = (run.employees || []).find((e) => e.id === selectedEmployeeId)
    if (emp)
      return (
        <EmployeePayrollDetail
          employee={emp}
          run={run}
          onBack={() => setView("run-detail")}
        />
      )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
      <div className="mb-6">
        <div className="text-[11px] font-mono tracking-widest uppercase text-[var(--text-muted)] mb-1">
          Finance
        </div>
        <h1 className="text-[22px] font-bold text-[var(--text-primary)] tracking-tight">
          Payroll
        </h1>
        <p className="text-[13.5px] text-[var(--text-secondary)] mt-1">
          Manage monthly payroll runs and employee compensation.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton h="160px" className="rounded-xl" />
          <Skeleton h="240px" className="rounded-xl" />
        </div>
      ) : error ? (
        <div className="p-8 text-center text-[var(--sem-danger)] text-[13px]">
          {error}
        </div>
      ) : !run ? (
        <div className="p-12 text-center bg-[var(--surface-01)] border border-[var(--border-neutral)] rounded-xl">
          <div className="text-[13.5px] text-[var(--text-muted)]">
            No payroll run exists for this period.
          </div>
        </div>
      ) : (
        <>
          {/* Current run card */}
          <div className="bg-[var(--surface-01)] border border-[var(--border-neutral)] rounded-xl p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div>
                <div className="text-[11px] font-mono tracking-widest uppercase text-[var(--text-muted)] mb-1">
                  Current Payroll Run
                </div>
                <div className="text-[20px] font-bold text-[var(--text-primary)] tracking-tight">
                  {run.period}
                </div>
              </div>
              <RunStatusBadge status={run.status} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
              <div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)] mb-0.5">
                  Employees
                </div>
                <div className="text-[22px] font-bold text-[var(--text-primary)]">
                  {run.employeeCount}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)] mb-0.5">
                  Total Payroll
                </div>
                <div className="font-mono text-[18px] font-bold text-[var(--text-primary)]">
                  {run.totalAmount}
                </div>
              </div>
              {run.pendingReviewCount > 0 && (
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)] mb-0.5">
                    Needs Review
                  </div>
                  <div className="text-[22px] font-bold text-amber-500">
                    {run.pendingReviewCount}
                  </div>
                </div>
              )}
              <div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)] mb-0.5">
                  Changes
                </div>
                <div className="text-[22px] font-bold text-[var(--text-primary)]">
                  {run.changesCount}
                </div>
              </div>
            </div>

            {run.pendingReviewCount > 0 && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800 text-[12px] text-amber-700 dark:text-amber-400 mb-4">
                {run.pendingReviewCount} employee line
                {run.pendingReviewCount !== 1 ? "s" : ""} flagged for review.
              </div>
            )}

            <button
              onClick={() => setView("run-detail")}
              className="px-5 py-2.5 bg-[#2B4D3A] text-white text-[13px] font-medium rounded-xl hover:bg-[#3a6b50] transition-colors"
            >
              Open Payroll Run
            </button>
          </div>

          {/* Employee summary (mobile-friendly preview) */}
          <div className="bg-[var(--surface-01)] border border-[var(--border-neutral)] rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--border-neutral)]">
              <div className="text-[13px] font-semibold text-[var(--text-primary)]">
                Employee Payroll Summary
              </div>
              <div className="text-[12px] text-[var(--text-muted)] mt-0.5">
                Open the payroll run to edit amounts or take action.
              </div>
            </div>
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-[var(--border-neutral)]">
                    {[
                      "Employee",
                      "Role",
                      "Final Amount",
                      "Review",
                      "Payment",
                    ].map((h) => (
                      <th
                        key={h}
                        className={`px-4 py-3 text-[11px] font-mono tracking-wider uppercase text-[var(--text-muted)] text-left whitespace-nowrap ${
                          h === "Final Amount" ? "text-right" : ""
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(run.employees || []).map((emp) => (
                    <tr
                      key={emp.id}
                      className={`border-b border-[var(--border-neutral)] ${
                        emp.reviewStatus === "needs-review"
                          ? "bg-amber-50/30 dark:bg-amber-950/10"
                          : ""
                      }`}
                    >
                      <td className="px-4 py-3 font-medium text-[var(--text-primary)] whitespace-nowrap">
                        {emp.name}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)] whitespace-nowrap text-[12px]">
                        {emp.role}
                      </td>
                      <td className="px-4 py-3 font-mono text-[13px] text-right font-semibold text-[var(--text-primary)] whitespace-nowrap">
                        {emp.finalAmount}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <ReviewBadge status={emp.reviewStatus} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`text-[11px] font-mono capitalize ${
                            emp.paymentStatus === "paid"
                              ? "text-[var(--sem-success)]"
                              : "text-[var(--text-muted)]"
                          }`}
                        >
                          {emp.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile: card list */}
            <div className="sm:hidden divide-y divide-[var(--border-neutral)]">
              {(run.employees || []).map((emp) => (
                <div
                  key={emp.id}
                  className={`px-4 py-4 ${
                    emp.reviewStatus === "needs-review"
                      ? "bg-amber-50/30 dark:bg-amber-950/10"
                      : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium text-[var(--text-primary)] text-[13px]">
                        {emp.name}
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)]">
                        {emp.role}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-[13px] font-semibold text-[var(--text-primary)]">
                        {emp.finalAmount}
                      </div>
                      <ReviewBadge status={emp.reviewStatus} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function ExportMenuSmall() {
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<"idle" | "preparing" | "ready">("idle")
  function go() {
    setOpen(false)
    setState("preparing")
    setTimeout(() => setState("ready"), 1800)
    setTimeout(() => setState("idle"), 4000)
  }
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-[12px] px-2.5 py-1.5 border border-[var(--border-neutral)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1"
      >
        {state === "preparing"
          ? "Preparing…"
          : state === "ready"
            ? "Ready"
            : "Export"}
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-40 bg-[var(--surface-01)] border border-[var(--border-neutral)] rounded-xl shadow-lg z-20 overflow-hidden">
          <button
            onClick={go}
            className="w-full text-left px-4 py-2.5 text-[12px] text-[var(--text-primary)] hover:bg-[var(--border-neutral)] transition-colors"
          >
            Export CSV
          </button>
          <button
            onClick={go}
            className="w-full text-left px-4 py-2.5 text-[12px] text-[var(--text-primary)] hover:bg-[var(--border-neutral)] transition-colors border-t border-[var(--border-neutral)]"
          >
            Export PDF
          </button>
        </div>
      )}
    </div>
  )
}
