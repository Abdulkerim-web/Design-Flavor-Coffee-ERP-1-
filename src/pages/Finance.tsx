import { useState, useEffect } from "react"
import {
  getFinanceDashboard,
  listFinanceActivity,
  listExpensesFull,
} from "../services/finance-ops"
import type {
  FinanceDashboardSummary,
  FinanceActivityRecord,
  FinanceAlert,
  FullExpense,
} from "../services/finance-ops"
import { listPayments } from "../services/delivery"
import type { PaymentRecord } from "../services/delivery"
import { useAuth } from "../contexts/AuthContext"
import { can } from "../lib/can"
import useSupabaseRealtime from "../hooks/useSupabaseRealtime"

// ─── Shared atoms ──────────────────────────────────────────────────────────────

function PageHeader() {
  return (
    <div className="mb-6">
      <div className="text-[11px] font-mono tracking-widest uppercase text-[var(--text-muted)] mb-1">
        Finance
      </div>
      <h1 className="text-[22px] font-bold text-[var(--text-primary)] tracking-tight">
        Finance
      </h1>
      <p className="text-[13.5px] text-[var(--text-secondary)] mt-1">
        Monitor financial activity, obligations, expenses, payments, and
        financial controls.
      </p>
    </div>
  )
}

function Skeleton({ h, className = "" }: { h?: string className?: string }) {
  return (
    <div
      className={`bg-[var(--border-neutral)] rounded animate-pulse ${className}`}
      style={{ height: h }}
    />
  )
}

function AlertBanner({ alert }: { alert: FinanceAlert }) {
  const cfg: Record<string, {
    bg: string
    border: string
    icon: string
    text: string
  }> = {
    critical: {
      bg: "bg-red-50 dark:bg-red-950/20",
      border: "border-red-200 dark:border-red-800",
      icon: "!",
      text: "text-red-700 dark:text-red-400",
    },
    warning: {
      bg: "bg-amber-50 dark:bg-amber-950/20",
      border: "border-amber-200 dark:border-amber-800",
      icon: "!",
      text: "text-amber-700 dark:text-amber-400",
    },
    info: {
      bg: "bg-blue-50 dark:bg-blue-950/20",
      border: "border-blue-200 dark:border-blue-800",
      icon: "i",
      text: "text-blue-700 dark:text-blue-400",
    },
  }
  const c = cfg[alert.severity]
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${c.bg} ${c.border}`}
    >
      <span
        className={`text-[12px] font-bold font-mono w-5 h-5 flex items-center justify-center rounded-full border ${c.border} ${c.text} flex-shrink-0`}
      >
        {c.icon}
      </span>
      <span className={`text-[13px] ${c.text} flex-1`}>{alert.message}</span>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  icon,
  sub,
  subColor,
}: {
  label: string
  value: string
  icon: React.ReactNode
  sub?: string
  subColor?: string
}) {
  return (
    <div className="bg-[var(--surface-01)] border border-[var(--border-neutral)] rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className="text-[11px] font-mono tracking-widest uppercase text-[var(--text-muted)] leading-tight">
          {label}
        </div>
        <div className="text-[var(--text-muted)] flex-shrink-0">{icon}</div>
      </div>
      <div className="font-mono text-[18px] font-semibold text-[var(--text-primary)] leading-none">
        {value}
      </div>
      {sub && (
        <div
          className={`text-[11px] font-mono ${subColor ?? "text-[var(--text-muted)]"}`}
        >
          {sub}
        </div>
      )}
    </div>
  )
}

function IconMoney() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  )
}
function IconBalance() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  )
}
function IconExpense() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="12" y2="17" />
    </svg>
  )
}
function IconPayroll() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  )
}
function IconBank() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <line x1="3" y1="22" x2="21" y2="22" />
      <line x1="6" y1="18" x2="6" y2="11" />
      <line x1="10" y1="18" x2="10" y2="11" />
      <line x1="14" y1="18" x2="14" y2="11" />
      <line x1="18" y1="18" x2="18" y2="11" />
      <polygon points="12 2 20 7 4 7" />
    </svg>
  )
}
function IconPending() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function StatusPill({ status }: { status: string }) {
  const s = status.toLowerCase()
  let cls = "bg-[var(--border-neutral)] text-[var(--text-muted)]"
  if (s.includes("verif") || s.includes("paid") || s.includes("reconcil"))
    cls = "bg-[var(--sem-success)]/15 text-[var(--sem-success)]"
  else if (s.includes("pending"))
    cls = "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
  else if (s.includes("posted"))
    cls = "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
  return (
    <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${cls}`}>
      {status}
    </span>
  )
}

export default function Finance() {
  const { currentUser } = useAuth()
  const role = currentUser?.role ?? "viewer"

  const [summary, setSummary] = useState<FinanceDashboardSummary | null>(null)
  const [activity, setActivity] = useState<FinanceActivityRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [activityLoading, setActivityLoading] = useState(true)
  const [activityError, setActivityError] = useState<string | null>(null)
  const [overduePayments, setOverduePayments] = useState<PaymentRecord[]>([])
  const [pendingExpenses, setPendingExpenses] = useState<FullExpense[]>([])
  const [attentionLoading, setAttentionLoading] = useState(true)

  useEffect(() => {
    getFinanceDashboard().then((r) => {
      if (r.data) setSummary(r.data)
      setLoading(false)
    })
    listFinanceActivity().then((r) => {
      if (r.data) setActivity(r.data)
      else setActivityError(r.error ?? "Unable to load financial activity.")
      setActivityLoading(false)
    })
    Promise.all([
      listPayments({ status: "overdue" }),
      listExpensesFull({ status: "pending-approval" }),
    ]).then(([pRes, eRes]) => {
      if (pRes.data) setOverduePayments(pRes.data)
      if (eRes.data) setPendingExpenses(eRes.data)
      setAttentionLoading(false)
    })
  }, [])

  // Realtime: refresh summary, payments, and pending expenses on DB changes
  useSupabaseRealtime("expenses", async () => {
    const [pRes, eRes, sRes] = await Promise.all([
      listPayments({ status: "overdue" }),
      listExpensesFull({ status: "pending-approval" }),
      getFinanceDashboard(),
    ])
    if (pRes.data) setOverduePayments(pRes.data)
    if (eRes.data) setPendingExpenses(eRes.data)
    if (sRes.data) setSummary(sRes.data)
  })

  useSupabaseRealtime("payments", async () => {
    const [pRes, sRes] = await Promise.all([listPayments({ status: "overdue" }), getFinanceDashboard()])
    if (pRes.data) setOverduePayments(pRes.data)
    if (sRes.data) setSummary(sRes.data)
  })

  if (!can(role as any, "finance.view")) {
    return (
      <div className="p-8">
        <PageHeader />
        <div className="bg-[var(--surface-01)] border border-[var(--border-neutral)] rounded-xl p-12 text-center">
          <div className="text-[15px] font-semibold text-[var(--text-primary)] mb-2">
            Access Restricted
          </div>
          <div className="text-[13px] text-[var(--text-muted)]">
            You do not have permission to view the Finance module.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
      <PageHeader />

      {/* Alerts */}
      {loading ? (
        <div className="mb-6 flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} h="44px" className="rounded-lg" />
          ))}
        </div>
      ) : summary && summary.alerts.length > 0 ? (
        <div className="mb-6 flex flex-col gap-2">
          {summary.alerts.map((a) => (
            <AlertBanner key={a.id} alert={a} />
          ))}
        </div>
      ) : null}

      {/* Summary Cards */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} h="120px" className="rounded-xl" />
          ))}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          <SummaryCard
            label="Customer Payments"
            value={summary.totalCustomerPayments}
            icon={<IconMoney />}
            sub="This quarter"
          />
          <SummaryCard
            label="Outstanding Balances"
            value={summary.outstandingBalances}
            icon={<IconBalance />}
            sub={
              summary.overdueCount > 0
                ? `${summary.overdueCount} overdue`
                : "All current"
            }
            subColor={
              summary.overdueCount > 0
                ? "text-[var(--sem-danger)]"
                : "text-[var(--sem-success)]"
            }
          />
          <SummaryCard
            label="This Month Expenses"
            value={summary.thisMonthExpenses}
            icon={<IconExpense />}
          />
          <SummaryCard
            label="Pending Approvals"
            value={summary.pendingExpenseApprovals}
            icon={<IconPending />}
            sub={`${summary.pendingExpenseCount} expense${
              summary.pendingExpenseCount !== 1 ? "s" : ""
            } awaiting review`}
            subColor={
              summary.pendingExpenseCount > 0
                ? "text-amber-600 dark:text-amber-400"
                : undefined
            }
          />
          <SummaryCard
            label="Payroll"
            value={summary.currentPayrollTotal}
            icon={<IconPayroll />}
            sub={`${summary.payrollPeriod} · ${summary.payrollStatus.charAt(0).toUpperCase() + summary.payrollStatus.slice(1)}`}
          />
          <SummaryCard
            label="Total Bank Balance"
            value={summary.totalBankBalance}
            icon={<IconBank />}
            sub="Across all accounts"
          />
        </div>
      ) : null}

      {/* Attention Panels */}
      {(attentionLoading ||
        overduePayments.length > 0 ||
        pendingExpenses.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
          {/* Overdue Payments */}
          <div className="bg-[var(--surface-01)] border border-[var(--border-neutral)] rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--border-neutral)] flex items-center justify-between gap-3">
              <div>
                <div className="text-[13px] font-semibold text-[var(--text-primary)]">
                  Overdue Payments
                </div>
                <div className="text-[12px] text-[var(--text-muted)] mt-0.5">
                  Payments past their deadline requiring action
                </div>
              </div>
              {overduePayments.length > 0 && (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                  {overduePayments.length} overdue
                </span>
              )}
            </div>
            {attentionLoading ? (
              <div className="p-4 flex flex-col gap-3">
                {[1, 2].map((i) => (
                  <Skeleton key={i} h="48px" className="rounded-lg" />
                ))}
              </div>
            ) : overduePayments.length === 0 ? (
              <div className="px-5 py-8 text-center text-[13px] text-[var(--text-muted)]">
                <div className="text-[22px] mb-2">✓</div>
                No overdue payments at this time.
              </div>
            ) : (
              <div className="divide-y divide-[var(--border-neutral)]">
                {overduePayments.slice(0, 4).map((p) => (
                  <div
                    key={p.id}
                    className="px-5 py-4 flex items-start justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-mono text-[12px] font-bold text-[var(--text-primary)]">
                          {p.ref}
                        </span>
                        <span className="text-[11px] text-[var(--text-muted)] font-mono">
                          {p.orderRef}
                        </span>
                      </div>
                      <div className="text-[13px] font-semibold text-[var(--text-primary)] mb-1">
                        {p.customer?.name ?? "Customer"}
                      </div>
                      <div className="text-[11px] text-red-600 dark:text-red-400 font-mono">
                        {p.daysRemaining ?? "Overdue"}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-mono text-[14px] font-bold text-red-700 dark:text-red-400">
                        {p.remainingAmount}
                      </div>
                      {p.paymentDeadline && (
                        <div className="text-[11px] text-[var(--text-muted)] mt-1">
                          {p.paymentDeadline}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {overduePayments.length > 4 && (
                  <div className="px-5 py-3 text-center text-[12px] text-[var(--text-muted)]">
                    +{overduePayments.length - 4} more overdue
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Expenses Awaiting Approval */}
          {can(role as any, "finance.approve-expense") && (
            <div className="bg-[var(--surface-01)] border border-[var(--border-neutral)] rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[var(--border-neutral)] flex items-center justify-between gap-3">
                <div>
                  <div className="text-[13px] font-semibold text-[var(--text-primary)]">
                    Expenses Awaiting Approval
                  </div>
                  <div className="text-[12px] text-[var(--text-muted)] mt-0.5">
                    Submitted expenses pending your review
                  </div>
                </div>
                {pendingExpenses.length > 0 && (
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                    {pendingExpenses.length} pending
                  </span>
                )}
              </div>
              {attentionLoading ? (
                <div className="p-4 flex flex-col gap-3">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} h="48px" className="rounded-lg" />
                  ))}
                </div>
              ) : pendingExpenses.length === 0 ? (
                <div className="px-5 py-8 text-center text-[13px] text-[var(--text-muted)]">
                  <div className="text-[22px] mb-2">✓</div>
                  No expenses are waiting for your approval.
                </div>
              ) : (
                <div className="divide-y divide-[var(--border-neutral)]">
                  {pendingExpenses.slice(0, 4).map((e) => (
                    <div
                      key={e.id}
                      className="px-5 py-4 flex items-start justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-mono text-[12px] font-bold text-[var(--text-primary)]">
                            {e.ref}
                          </span>
                          <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">
                            {e.category}
                          </span>
                        </div>
                        <div className="text-[13px] text-[var(--text-secondary)] mb-1 truncate">
                          {e.description}
                        </div>
                        <div className="text-[11px] text-[var(--text-muted)]">
                          Submitted by {e.requestedBy} · {e.date}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-mono text-[14px] font-bold text-[var(--text-primary)]">
                          {e.amount}
                        </div>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                          Pending
                        </span>
                      </div>
                    </div>
                  ))}
                  {pendingExpenses.length > 4 && (
                    <div className="px-5 py-3 text-center text-[12px] text-[var(--text-muted)]">
                      +{pendingExpenses.length - 4} more pending
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Financial Activity */}
      <div className="bg-[var(--surface-01)] border border-[var(--border-neutral)] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border-neutral)] flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[13px] font-semibold text-[var(--text-primary)]">
              Financial Activity
            </div>
            <div className="text-[12px] text-[var(--text-muted)] mt-0.5">
              Recent transactions across all financial areas
            </div>
          </div>
          <ExportMenu />
        </div>

        {activityLoading ? (
          <div className="p-5 flex flex-col gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} h="40px" className="rounded" />
            ))}
          </div>
        ) : activityError ? (
          <div className="p-8 text-center text-[13.5px] text-[var(--sem-danger)]">
            {activityError}
          </div>
        ) : activity.length === 0 ? (
          <div className="p-12 text-center text-[13.5px] text-[var(--text-muted)]">
            No transactions found.
          </div>
        ) : (
          <>
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-[var(--border-neutral)]">
                    {[
                      "Date",
                      "Type",
                      "Reference",
                      "Description",
                      "Amount",
                      "Account",
                      "Status",
                      "Recorded By",
                    ].map((h) => (
                      <th
                        key={h}
                        className={`px-4 py-3 text-[11px] font-mono tracking-wider uppercase text-[var(--text-muted)] text-left whitespace-nowrap ${
                          h === "Amount" ? "text-right" : ""
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activity.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-[var(--border-neutral)] hover:bg-[var(--surface-02,var(--bg-secondary,var(--surface-01)))] transition-colors"
                    >
                      <td className="px-4 py-3 text-[var(--text-secondary)] whitespace-nowrap font-mono text-[12px]">
                        {row.date}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-primary)] whitespace-nowrap">
                        {row.type}
                      </td>
                      <td className="px-4 py-3 font-mono text-[12px] text-[var(--text-muted)] whitespace-nowrap">
                        {row.ref}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)] max-w-[220px] truncate">
                        {row.description}
                      </td>
                      <td className="px-4 py-3 font-mono text-[13px] text-[var(--text-primary)] text-right whitespace-nowrap">
                        {row.amount}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-[var(--text-muted)] whitespace-nowrap">
                        {row.account}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusPill status={row.status} />
                      </td>
                      <td className="px-4 py-3 text-[var(--text-muted)] whitespace-nowrap">
                        {row.recordedBy}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="lg:hidden divide-y divide-[var(--border-neutral)]">
              {activity.map((row) => (
                <div key={row.id} className="px-4 py-4">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div className="font-mono text-[14px] font-semibold text-[var(--text-primary)]">
                      {row.amount}
                    </div>
                    <StatusPill status={row.status} />
                  </div>
                  <div className="text-[13px] text-[var(--text-primary)] mb-1">
                    {row.description}
                  </div>
                  <div className="flex flex-wrap gap-3 text-[11px] text-[var(--text-muted)] font-mono">
                    <span>{row.ref}</span>
                    <span>{row.date}</span>
                    <span>{row.account}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Export Menu ───────────────────────────────────────────────────────────────

function ExportMenu() {
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<"idle" | "preparing" | "ready">("idle")

  function handleExport(_format: "csv" | "pdf") {
    setOpen(false)
    setState("preparing")
    setTimeout(() => setState("ready"), 1800)
    setTimeout(() => setState("idle"), 4000)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-[13px] px-3 py-1.5 border border-[var(--border-neutral)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-muted)] transition-colors flex items-center gap-1.5"
      >
        {state === "preparing"
          ? "Preparing…"
          : state === "ready"
            ? "Download ready"
            : "Export"}
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-[var(--surface-01)] border border-[var(--border-neutral)] rounded-xl shadow-lg z-20 overflow-hidden">
          <button
            onClick={() => handleExport("csv")}
            className="w-full text-left px-4 py-3 text-[13px] text-[var(--text-primary)] hover:bg-[var(--border-neutral)] transition-colors"
          >
            Export CSV
          </button>
          <button
            onClick={() => handleExport("pdf")}
            className="w-full text-left px-4 py-3 text-[13px] text-[var(--text-primary)] hover:bg-[var(--border-neutral)] transition-colors border-t border-[var(--border-neutral)]"
          >
            Export PDF
          </button>
        </div>
      )}
    </div>
  )
}
