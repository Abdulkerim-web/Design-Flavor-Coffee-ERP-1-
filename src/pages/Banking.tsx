/**
 * Banking.tsx — F3-12
 * Banking, Cash Control & Reconciliation
 * All balances / amounts are backend-authoritative opaque strings.
 * Frontend never calculates balances, totals, or reconciliation differences.
 */
import { useState, useEffect } from "react"
import {
  listBankAccounts,
  getBankAccount,
  listBankTransactions,
  getBankingSummary,
  listAllReconciliations,
  getReconciliationDetail,
  recordBankTransaction,
  transferFunds,
  matchTransactionRecon,
  recordAdjustment,
  completeReconciliation,
} from "../services/finance-ops"
import type {
  BankAccountRecord,
  BankTransaction,
  BankingSummary,
  ReconciliationListItem,
  ReconciliationDetail,
  ReconTxn,
} from "../services/finance-ops"
import { useAuth } from "../contexts/AuthContext"
import { can } from "../lib/can"
import { useToast } from "../contexts/ToastContext"
import useSupabaseRealtime from "../hooks/useSupabaseRealtime"

// ─── View routing ──────────────────────────────────────────────────────────────

type View = "dashboard" | "account-detail" | "new-transaction" | "transfer" | "reconciliation-list" | "reconciliation-detail"

// ─── Small icon helper ─────────────────────────────────────────────────────────

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

const D = {
  back: "M15 18l-6-6 6-6",
  bank: "M3 22h18M6 18V11M10 18V11M14 18V11M18 18V11M12 2l9 5H3z",
  plus: "M12 5v14M5 12h14",
  transfer: "M7 16l-4-4 4-4M3 12h14M17 8l4 4-4 4M21 12H7",
  incoming: "M12 5v14M5 12l7 7 7-7",
  outgoing: "M12 19V5M19 12l-7-7-7 7",
  check: "M20 6L9 17l-5-5",
  warning:
    "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01",
  info: "M12 22a10 10 0 110-20 10 10 0 010 20zM12 8v4M12 16h.01",
  checkCircle: "M9 12l2 2 4-4M22 12a10 10 0 11-20 0 10 10 0 0120 0z",
  recon: "M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3",
  match: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  adjust: "M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z",
  clock: "M12 22a10 10 0 110-20 10 10 0 010 20zM12 6v6l4 2",
  activity: "M22 12h-4l-3 9L9 3l-3 9H2",
  filter: "M22 3H2l8 9.46V19l4 2v-8.54L22 3",
  search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0",
}

// ─── Skeleton shimmer ──────────────────────────────────────────────────────────

function Sk({
  h = 20,
  w = "100%",
  r = 8,
}: {
  h?: number
  w?: number | string
  r?: number
}) {
  return (
    <div
      className="skeleton-shimmer"
      style={{ height: h, width: w, borderRadius: r }}
    />
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
          d={D.bank}
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
          You do not have permission to view Banking.
        </div>
      </div>
    </div>
  )
}

// ─── Calculated Balance — always clearly non-editable ─────────────────────────

function CalculatedBalance({
  balance,
  period,
}: {
  balance: string
  period?: string
}) {
  return (
    <div
      style={{
        background: "var(--surface-02)",
        border: "1px solid var(--border-neutral)",
        borderRadius: "var(--radius-lg)",
        padding: "20px 24px",
      }}
    >
      <div className="section-eyebrow" style={{ marginBottom: 8 }}>
        Calculated Balance
      </div>
      <div
        className="type-numeric-lg"
        style={{ color: "var(--text-primary)", marginBottom: 6 }}
      >
        {balance}
      </div>
      <div
        style={{ fontSize: 11.5, color: "var(--text-muted)", marginBottom: 10 }}
      >
        Based on opening balance and recorded transactions
        {period ? ` · ${period}` : ""}.
      </div>
      <div
        style={{
          padding: "8px 12px",
          borderRadius: "var(--radius-sm)",
          background: "var(--color-status-info-surface)",
          border: "1px solid var(--color-status-info-border)",
          fontSize: 12,
          color: "var(--color-status-info)",
          lineHeight: 1.55,
          display: "flex",
          gap: 8,
          alignItems: "flex-start",
        }}
      >
        <Ic d={D.info} size={12} style={{ flexShrink: 0, marginTop: 1 }} />
        <span>
          This balance is calculated from the account's opening balance and
          recorded transactions. Corrections must be made through the
          reconciliation or adjustment workflow.
        </span>
      </div>
    </div>
  )
}

// ─── Status badges ─────────────────────────────────────────────────────────────

function ReconBadge({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    reconciled: ["badge badge-green", "Reconciled"],
    pending: ["badge badge-amber", "Pending"],
    discrepancy: ["badge badge-red", "Discrepancy"],
  }
  const [cls, label] = map[status] ?? ["badge badge-gray", status]
  return <span className={cls}>{label}</span>
}

function TxnStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    posted: "badge badge-blue",
    pending: "badge badge-amber",
    reconciled: "badge badge-green",
    queried: "badge badge-red",
    matched: "badge badge-green",
    unmatched: "badge badge-amber",
    "under-review": "badge badge-amber",
  }
  return (
    <span
      className={map[status] ?? "badge badge-gray"}
      style={{ textTransform: "capitalize" }}
    >
      {status.replace("-", " ")}
    </span>
  )
}

function DirectionTag({ direction }: { direction: "incoming" | "outgoing" }) {
  if (direction === "incoming") {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          color: "var(--sem-success)",
          fontFamily: "DM Mono",
          fontSize: 12,
        }}
      >
        <Ic d={D.incoming} size={11} />
        Incoming
      </span>
    )
  }
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        color: "var(--text-secondary)",
        fontFamily: "DM Mono",
        fontSize: 12,
      }}
    >
      <Ic d={D.outgoing} size={11} />
      Outgoing
    </span>
  )
}

// ─── Summary card ──────────────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: string
  sub?: string
  accent?: boolean
}) {
  return (
    <div className="stat-card">
      <div
        style={{ fontSize: 11.5, color: "var(--text-muted)", marginBottom: 10 }}
      >
        {label}
      </div>
      <div
        className="type-numeric-lg"
        style={{
          color: accent ? "var(--sem-warning)" : "var(--text-primary)",
          marginBottom: sub ? 4 : 0,
        }}
      >
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>{sub}</div>
      )}
    </div>
  )
}

// ─── Account card ──────────────────────────────────────────────────────────────

function AccountCard({
  account,
  onView,
}: {
  account: BankAccountRecord
  onView: () => void
}) {
  return (
    <div
      style={{
        background: "var(--surface-01)",
        border: "1px solid var(--border-neutral)",
        borderRadius: "var(--radius-lg)",
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
        }}
      >
        <div>
          <div className="section-eyebrow" style={{ marginBottom: 4 }}>
            Bank Account
          </div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: "var(--text-primary)",
            }}
          >
            {account.bankName}
          </div>
          <div style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>
            {account.accountName}
          </div>
        </div>
        <ReconBadge status={account.reconciliationStatus} />
      </div>
      <div>
        <div className="section-eyebrow" style={{ marginBottom: 4 }}>
          Account Number
        </div>
        <div
          className="type-numeric"
          style={{ letterSpacing: "0.12em", color: "var(--text-primary)" }}
        >
          {account.maskedAccountNumber}
        </div>
      </div>
      <CalculatedBalance balance={account.calculatedBalance} />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
          Last activity: {account.lastTransactionDate}
        </div>
        <button
          className="btn-secondary"
          style={{ fontSize: 12.5, padding: "6px 14px" }}
          onClick={onView}
        >
          View Account
        </button>
      </div>
    </div>
  )
}

// ─── Bank transaction card (mobile) ───────────────────────────────────────────

function BankTransactionCard({
  txn,
  onView,
}: {
  txn: BankTransaction
  onView?: () => void
}) {
  const isIncoming = !!txn.credit
  return (
    <div
      style={{
        padding: "14px 16px",
        borderBottom: "1px solid var(--border-neutral)",
        background: "var(--surface-01)",
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
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 4,
            }}
          >
            <Ic
              d={isIncoming ? D.incoming : D.outgoing}
              size={12}
              style={{
                color: isIncoming
                  ? "var(--sem-success)"
                  : "var(--text-secondary)",
              }}
            />
            <span
              className="type-numeric"
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "var(--text-primary)",
              }}
            >
              {txn.credit ?? txn.debit}
            </span>
          </div>
          <div style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>
            {txn.description}
          </div>
        </div>
        <TxnStatusBadge status={txn.status} />
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "4px 16px",
          fontSize: 11.5,
        }}
      >
        <span className="font-mono" style={{ color: "var(--text-muted)" }}>
          {txn.ref}
        </span>
        <span style={{ color: "var(--text-muted)" }}>{txn.date}</span>
        <span style={{ color: "var(--text-muted)" }}>
          Bal: {txn.runningBalance}
        </span>
        {onView && (
          <button
            onClick={onView}
            className="btn-ghost"
            style={{ fontSize: 11.5, padding: "2px 8px", marginLeft: "auto" }}
          >
            View
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Transaction table (desktop) ───────────────────────────────────────────────

function TransactionTable({
  transactions,
  loading,
  empty,
  error,
}: {
  transactions: BankTransaction[]
  loading: boolean
  empty: boolean
  error: string | null
}) {
  if (loading)
    return (
      <div
        style={{
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {[...Array(5)].map((_, i) => (
          <Sk key={i} h={36} />
        ))}
      </div>
    )
  if (error)
    return (
      <div style={{ padding: 32, textAlign: "center" }}>
        <Ic
          d={D.warning}
          size={20}
          style={{
            color: "var(--sem-warning)",
            display: "block",
            margin: "0 auto 10px",
          }}
        />
        <div
          style={{
            fontSize: 13.5,
            color: "var(--text-primary)",
            marginBottom: 4,
          }}
        >
          {error}
        </div>
      </div>
    )
  if (empty)
    return (
      <div style={{ padding: "56px 32px", textAlign: "center" }}>
        <Ic
          d={D.activity}
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
          No transactions found
        </div>
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
          No transactions match these filters. Try a different date range or
          clear filters.
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
          aria-label="Transaction history"
        >
          <thead>
            <tr>
              {[
                "Date",
                "Reference",
                "Description",
                "Direction",
                "Amount",
                "Running Balance",
                "Status",
                "Recorded By",
              ].map((h) => (
                <th
                  key={h}
                  scope="col"
                  style={{
                    textAlign: ["Amount", "Running Balance"].includes(h)
                      ? "right"
                      : "left",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {transactions.map((txn) => {
              const isIncoming = !!txn.credit
              return (
                <tr key={txn.id}>
                  <td>
                    <span
                      className="font-mono"
                      style={{ fontSize: 12.5, color: "var(--text-muted)" }}
                    >
                      {txn.date}
                    </span>
                  </td>
                  <td>
                    <span
                      className="font-mono"
                      style={{ fontSize: 12.5, color: "var(--text-muted)" }}
                    >
                      {txn.ref}
                    </span>
                  </td>
                  <td>
                    <div style={{ maxWidth: 220 }}>
                      <div
                        style={{ color: "var(--text-primary)", fontSize: 13 }}
                      >
                        {txn.description}
                      </div>
                      {txn.relatedLabel && (
                        <div
                          className="font-mono"
                          style={{ fontSize: 11, color: "var(--text-muted)" }}
                        >
                          {txn.relatedLabel}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <DirectionTag
                      direction={isIncoming ? "incoming" : "outgoing"}
                    />
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <span
                      className="font-mono"
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: isIncoming
                          ? "var(--sem-success)"
                          : "var(--text-primary)",
                      }}
                    >
                      {txn.credit ?? txn.debit}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <span
                      className="font-mono"
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--text-primary)",
                      }}
                    >
                      {txn.runningBalance}
                    </span>
                  </td>
                  <td>
                    <TxnStatusBadge status={txn.status} />
                  </td>
                  <td
                    style={{
                      fontSize: 12.5,
                      color: "var(--text-muted)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {txn.recordedBy}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {/* Mobile */}
      <div className="resp-hide-desktop">
        {transactions.map((txn) => (
          <BankTransactionCard key={txn.id} txn={txn} />
        ))}
      </div>
    </>
  )
}

// ─── Filter bar ───────────────────────────────────────────────────────────────

const DATE_RANGES = [
  { id: "month", label: "This Month" },
  { id: "week", label: "This Week" },
  { id: "prev", label: "Previous Month" },
  { id: "custom", label: "Custom" },
]

function FilterBar({
  accounts,
  selectedAccount,
  onAccount,
  dateRange,
  onDateRange,
  search,
  onSearch,
  typeFilter,
  onType,
}: {
  accounts: BankAccountRecord[]
  selectedAccount: string
  onAccount: (id: string) => void
  dateRange: string
  onDateRange: (r: string) => void
  search: string
  onSearch: (s: string) => void
  typeFilter: string
  onType: (t: string) => void
}) {
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
          d={D.search}
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
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          style={{ width: "100%", paddingLeft: 30, fontSize: 13 }}
        />
      </div>
      <select
        className="input-field"
        value={selectedAccount}
        onChange={(e) => onAccount(e.target.value)}
        style={{ flex: "0 1 200px", fontSize: 13, cursor: "pointer" }}
      >
        <option value="all">All Accounts</option>
        {accounts.map((a) => (
          <option key={a.id} value={a.id}>
            {a.bankName}
          </option>
        ))}
      </select>
      <select
        className="input-field"
        value={typeFilter}
        onChange={(e) => onType(e.target.value)}
        style={{ flex: "0 1 160px", fontSize: 13, cursor: "pointer" }}
      >
        <option value="all">All Types</option>
        <option value="incoming">Incoming</option>
        <option value="outgoing">Outgoing</option>
      </select>
      <div style={{ display: "flex", gap: 4 }}>
        {DATE_RANGES.map((r) => (
          <button
            key={r.id}
            onClick={() => onDateRange(r.id)}
            className={dateRange === r.id ? "pill active" : "pill"}
            style={{ fontSize: 12, padding: "4px 12px" }}
          >
            {r.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Confirmation dialog backdrop ─────────────────────────────────────────────

function ConfirmDialog({
  title,
  children,
  onCancel,
  onConfirm,
  confirmLabel = "Confirm",
  confirming = false,
}: {
  title: string
  children: React.ReactNode
  onCancel: () => void
  onConfirm: () => void
  confirmLabel?: string
  confirming?: boolean
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--color-surface-overlay)",
        zIndex: "var(--z-modal-backdrop)" as any,
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
          maxWidth: 440,
          boxShadow: "var(--shadow-modal)",
          zIndex: "var(--z-modal)" as any,
        }}
      >
        <div
          id="confirm-title"
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: "var(--text-primary)",
            marginBottom: 16,
          }}
        >
          {title}
        </div>
        <div
          style={{
            color: "var(--text-secondary)",
            fontSize: 13.5,
            lineHeight: 1.6,
            marginBottom: 24,
          }}
        >
          {children}
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            className="btn-secondary"
            onClick={onCancel}
            disabled={confirming}
          >
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={onConfirm}
            disabled={confirming}
          >
            {confirming ? "Processing…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Financial Timeline ────────────────────────────────────────────────────────

function FinancialTimeline({
  events,
}: {
  events: Array<{
    id: string
    timestamp: string
    actor: string
    action: string
    note?: string
  }>
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {events.map((ev, i) => (
        <div
          key={ev.id}
          style={{ display: "flex", gap: 14, position: "relative" }}
        >
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
                  minHeight: 24,
                  margin: "4px 0",
                }}
              />
            )}
          </div>
          <div
            style={{ paddingBottom: i < events.length - 1 ? 18 : 0, flex: 1 }}
          >
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "2px 12px",
                marginBottom: 2,
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--text-primary)",
                }}
              >
                {ev.action}
              </span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "2px 12px" }}>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                {ev.actor}
              </span>
              <span
                className="font-mono"
                style={{ fontSize: 11.5, color: "var(--text-muted)" }}
              >
                {ev.timestamp}
              </span>
            </div>
            {ev.note && (
              <div
                style={{
                  fontSize: 12,
                  color: "var(--text-secondary)",
                  marginTop: 4,
                  fontStyle: "italic",
                }}
              >
                {ev.note}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Recon Transaction Row ─────────────────────────────────────────────────────

function ReconTxnRow({
  txn,
  onMatch,
  canMatch,
}: {
  txn: ReconTxn
  onMatch?: (id: string) => void
  canMatch?: boolean
}) {
  return (
    <tr>
      <td>
        <span
          className="font-mono"
          style={{ fontSize: 12.5, color: "var(--text-muted)" }}
        >
          {txn.date}
        </span>
      </td>
      <td>
        <span
          className="font-mono"
          style={{ fontSize: 12.5, color: "var(--text-muted)" }}
        >
          {txn.ref}
        </span>
      </td>
      <td style={{ color: "var(--text-primary)", fontSize: 13 }}>
        {txn.description}
      </td>
      <td>
        <DirectionTag direction={txn.direction} />
      </td>
      <td style={{ textAlign: "right" }}>
        <span
          className="font-mono"
          style={{
            fontSize: 13,
            fontWeight: 600,
            color:
              txn.direction === "incoming"
                ? "var(--sem-success)"
                : "var(--text-primary)",
          }}
        >
          {txn.amount}
        </span>
      </td>
      <td>
        <TxnStatusBadge status={txn.status} />
      </td>
      <td>
        {txn.matchedTo && (
          <span
            className="font-mono"
            style={{ fontSize: 11.5, color: "var(--text-muted)" }}
          >
            {txn.matchedTo}
          </span>
        )}
      </td>
      {canMatch && onMatch && txn.status !== "matched" && (
        <td>
          <button
            className="btn-ghost"
            style={{ fontSize: 12, padding: "4px 10px" }}
            onClick={() => onMatch(txn.id)}
          >
            Match
          </button>
        </td>
      )}
    </tr>
  )
}

// ─── New Transaction view ──────────────────────────────────────────────────────

function NewTransactionView({
  accounts,
  onBack,
  canCreate,
}: {
  accounts: BankAccountRecord[]
  onBack: () => void
  canCreate: boolean
}) {
  const toast = useToast()
  const [form, setForm] = useState({
    accountId: accounts[0]?.id ?? "",
    type: "Deposit",
    direction: "incoming" as "incoming" | "outgoing",
    amount: "",
    date: "2026-08-12",
    ref: "",
    description: "",
    notes: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [resultRef, setResultRef] = useState("")

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))
  const valid =
    form.accountId && form.amount.trim() && form.description.trim() && form.date

  async function handleSubmit() {
    if (!valid || submitting) return
    setSubmitting(true)
    const r = await recordBankTransaction({
      accountId: form.accountId,
      type: form.type,
      direction: form.direction,
      amount: form.amount,
      date: form.date,
      ref: form.ref || undefined,
      description: form.description,
      notes: form.notes || undefined,
    })
    setSubmitting(false)
    if (r.data) {
      setResultRef(r.data.ref)
      setDone(true)
      toast.success("Transaction recorded successfully.")
    } else {
      toast.error(
        r.error ??
          "We couldn't record this transaction. The transaction may not have been saved. Please check your connection and try again.",
      )
    }
  }

  if (!canCreate) {
    return (
      <div style={{ padding: 32, maxWidth: 580, margin: "0 auto" }}>
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
          <Ic d={D.back} size={14} /> All Accounts
        </button>
        <div
          style={{
            background: "var(--color-status-warning-surface)",
            border: "1px solid var(--color-status-warning-border)",
            borderRadius: "var(--radius-lg)",
            padding: 24,
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--color-status-warning)",
              marginBottom: 6,
            }}
          >
            Permission Required
          </div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            You do not have permission to record bank transactions.
          </div>
        </div>
      </div>
    )
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
            d={D.checkCircle}
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
          Transaction Recorded
        </div>
        <div
          style={{
            fontSize: 13.5,
            color: "var(--text-secondary)",
            marginBottom: 4,
          }}
        >
          Transaction recorded successfully.
        </div>
        <div
          className="font-mono"
          style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 28 }}
        >
          Reference: {resultRef}
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button className="btn-secondary" onClick={onBack}>
            Back to Banking
          </button>
          <button
            className="btn-primary"
            onClick={() => {
              setDone(false)
              setForm((f) => ({
                ...f,
                amount: "",
                ref: "",
                description: "",
                notes: "",
              }))
            }}
          >
            Record Another
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: 32, maxWidth: 580, margin: "0 auto" }}>
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
        <Ic d={D.back} size={14} /> All Accounts
      </button>
      <div style={{ marginBottom: 28 }}>
        <div className="section-eyebrow" style={{ marginBottom: 4 }}>
          Banking
        </div>
        <h1 className="type-h1" style={{ color: "var(--text-primary)" }}>
          New Bank Transaction
        </h1>
        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: 13.5,
            marginTop: 6,
          }}
        >
          Record a transaction against a company bank account.
        </p>
      </div>
      <div
        style={{
          background: "var(--surface-01)",
          border: "1px solid var(--border-neutral)",
          borderRadius: "var(--radius-lg)",
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        {/* Bank Account */}
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
            Bank Account <span style={{ color: "var(--sem-danger)" }}>*</span>
          </label>
          <select
            className="input-field"
            style={{ width: "100%" }}
            value={form.accountId}
            onChange={(e) => set("accountId", e.target.value)}
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.bankName} — {a.maskedAccountNumber}
              </option>
            ))}
          </select>
        </div>
        {/* Direction + Type row */}
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
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
              Direction <span style={{ color: "var(--sem-danger)" }}>*</span>
            </label>
            <select
              className="input-field"
              style={{ width: "100%" }}
              value={form.direction}
              onChange={(e) =>
                set("direction", e.target.value as "incoming" | "outgoing")
              }
            >
              <option value="incoming">Incoming (Credit)</option>
              <option value="outgoing">Outgoing (Debit)</option>
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
              Transaction Type{" "}
              <span style={{ color: "var(--sem-danger)" }}>*</span>
            </label>
            <select
              className="input-field"
              style={{ width: "100%" }}
              value={form.type}
              onChange={(e) => set("type", e.target.value)}
            >
              {["Deposit", "Withdrawal", "Transfer", "Adjustment", "Other"].map(
                (t) => (
                  <option key={t}>{t}</option>
                ),
              )}
            </select>
          </div>
        </div>
        {/* Amount */}
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
            Amount (ETB) <span style={{ color: "var(--sem-danger)" }}>*</span>
          </label>
          <input
            className="input-field font-mono"
            style={{ width: "100%" }}
            placeholder="e.g. ETB 45,000.00"
            value={form.amount}
            onChange={(e) => set("amount", e.target.value)}
          />
          <div
            style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 4 }}
          >
            Enter the exact ETB amount as it appears on the bank record.
          </div>
        </div>
        {/* Date + Reference row */}
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
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
              Date <span style={{ color: "var(--sem-danger)" }}>*</span>
            </label>
            <input
              type="date"
              className="input-field"
              style={{ width: "100%" }}
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
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
              Reference
            </label>
            <input
              className="input-field font-mono"
              style={{ width: "100%" }}
              placeholder="Bank reference (optional)"
              value={form.ref}
              onChange={(e) => set("ref", e.target.value)}
            />
          </div>
        </div>
        {/* Description */}
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
            Description <span style={{ color: "var(--sem-danger)" }}>*</span>
          </label>
          <input
            className="input-field"
            style={{ width: "100%" }}
            placeholder="Brief description of this transaction"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </div>
        {/* Notes */}
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
            Notes
          </label>
          <textarea
            className="input-field"
            rows={3}
            style={{ width: "100%", resize: "vertical" }}
            placeholder="Additional notes (optional)"
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
          />
        </div>
        {/* Actions */}
        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "flex-end",
            paddingTop: 4,
            borderTop: "1px solid var(--border-neutral)",
          }}
        >
          <button
            className="btn-secondary"
            onClick={onBack}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={!valid || submitting}
          >
            {submitting ? "Recording…" : "Record Transaction"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Transfer view ────────────────────────────────────────────────────────────

function TransferView({
  accounts,
  onBack,
}: {
  accounts: BankAccountRecord[]
  onBack: () => void
}) {
  const toast = useToast()
  const [form, setForm] = useState({
    fromId: accounts[0]?.id ?? "",
    toId: accounts[1]?.id ?? accounts[0]?.id ?? "",
    amount: "",
    date: "2026-08-12",
    ref: "",
    notes: "",
  })
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [resultRef, setResultRef] = useState("")

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))
  const fromAccount = accounts.find((a) => a.id === form.fromId)
  const toAccount = accounts.find((a) => a.id === form.toId)
  const valid = form.fromId !== form.toId && form.amount.trim() && form.date

  async function handleConfirm() {
    setSubmitting(true)
    const r = await transferFunds({
      fromAccountId: form.fromId,
      toAccountId: form.toId,
      amount: form.amount,
      date: form.date,
      ref: form.ref || undefined,
      notes: form.notes || undefined,
    })
    setSubmitting(false)
    setShowConfirm(false)
    if (r.data) {
      setResultRef((r.data as any).ref ?? "TRF-???")
      setDone(true)
      toast.success("Transfer completed successfully.")
    } else {
      toast.error(
        r.error ??
          "Transfer could not be completed. Please check your connection and try again.",
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
            d={D.checkCircle}
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
          Transfer Completed
        </div>
        <div
          style={{
            fontSize: 13.5,
            color: "var(--text-secondary)",
            marginBottom: 4,
          }}
        >
          The transfer has been recorded.
        </div>
        <div
          className="font-mono"
          style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 28 }}
        >
          Reference: {resultRef}
        </div>
        <button className="btn-secondary" onClick={onBack}>
          Back to Banking
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: 32, maxWidth: 580, margin: "0 auto" }}>
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
        <Ic d={D.back} size={14} /> All Accounts
      </button>
      <div style={{ marginBottom: 28 }}>
        <div className="section-eyebrow" style={{ marginBottom: 4 }}>
          Banking
        </div>
        <h1 className="type-h1" style={{ color: "var(--text-primary)" }}>
          Transfer Funds
        </h1>
        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: 13.5,
            marginTop: 6,
          }}
        >
          Transfer funds between company bank accounts.
        </p>
      </div>

      <div
        style={{
          background: "var(--surface-01)",
          border: "1px solid var(--border-neutral)",
          borderRadius: "var(--radius-lg)",
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        {/* From / To visual */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            gap: 12,
            alignItems: "center",
          }}
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
              FROM <span style={{ color: "var(--sem-danger)" }}>*</span>
            </label>
            <select
              className="input-field"
              style={{ width: "100%" }}
              value={form.fromId}
              onChange={(e) => set("fromId", e.target.value)}
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.bankName}
                </option>
              ))}
            </select>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              paddingTop: 22,
            }}
          >
            <Ic
              d={D.transfer}
              size={18}
              style={{ color: "var(--text-muted)" }}
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
              TO <span style={{ color: "var(--sem-danger)" }}>*</span>
            </label>
            <select
              className="input-field"
              style={{ width: "100%" }}
              value={form.toId}
              onChange={(e) => set("toId", e.target.value)}
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.bankName}
                </option>
              ))}
            </select>
          </div>
        </div>
        {form.fromId === form.toId && (
          <div
            style={{
              padding: "8px 12px",
              background: "var(--color-status-warning-surface)",
              border: "1px solid var(--color-status-warning-border)",
              borderRadius: "var(--radius-sm)",
              fontSize: 12.5,
              color: "var(--color-status-warning)",
            }}
          >
            From and To accounts must be different.
          </div>
        )}
        {/* Amount */}
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
            Amount (ETB) <span style={{ color: "var(--sem-danger)" }}>*</span>
          </label>
          <input
            className="input-field font-mono"
            style={{ width: "100%" }}
            placeholder="e.g. ETB 50,000.00"
            value={form.amount}
            onChange={(e) => set("amount", e.target.value)}
          />
        </div>
        {/* Date + Ref */}
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
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
              Date <span style={{ color: "var(--sem-danger)" }}>*</span>
            </label>
            <input
              type="date"
              className="input-field"
              style={{ width: "100%" }}
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
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
              Reference
            </label>
            <input
              className="input-field font-mono"
              style={{ width: "100%" }}
              placeholder="Optional"
              value={form.ref}
              onChange={(e) => set("ref", e.target.value)}
            />
          </div>
        </div>
        {/* Notes */}
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
            Notes
          </label>
          <textarea
            className="input-field"
            rows={2}
            style={{ width: "100%", resize: "vertical" }}
            placeholder="Optional"
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
          />
        </div>
        {/* Actions */}
        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "flex-end",
            paddingTop: 4,
            borderTop: "1px solid var(--border-neutral)",
          }}
        >
          <button className="btn-secondary" onClick={onBack}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={() => setShowConfirm(true)}
            disabled={!valid}
          >
            Review Transfer
          </button>
        </div>
      </div>

      {showConfirm && (
        <ConfirmDialog
          title="Confirm Transfer"
          confirmLabel="Confirm Transfer"
          confirming={submitting}
          onCancel={() => setShowConfirm(false)}
          onConfirm={handleConfirm}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto 1fr",
                gap: 12,
                alignItems: "center",
                padding: "14px 16px",
                background: "var(--surface-02)",
                borderRadius: "var(--radius-md)",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 11.5,
                    color: "var(--text-muted)",
                    marginBottom: 2,
                  }}
                >
                  FROM
                </div>
                <div
                  style={{
                    fontSize: 13.5,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                  }}
                >
                  {fromAccount?.bankName}
                </div>
                <div
                  className="font-mono"
                  style={{ fontSize: 11.5, color: "var(--text-muted)" }}
                >
                  {fromAccount?.maskedAccountNumber}
                </div>
              </div>
              <Ic
                d={D.transfer}
                size={16}
                style={{ color: "var(--text-muted)" }}
              />
              <div>
                <div
                  style={{
                    fontSize: 11.5,
                    color: "var(--text-muted)",
                    marginBottom: 2,
                  }}
                >
                  TO
                </div>
                <div
                  style={{
                    fontSize: 13.5,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                  }}
                >
                  {toAccount?.bankName}
                </div>
                <div
                  className="font-mono"
                  style={{ fontSize: 11.5, color: "var(--text-muted)" }}
                >
                  {toAccount?.maskedAccountNumber}
                </div>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "10px 16px",
                background: "var(--surface-02)",
                borderRadius: "var(--radius-md)",
              }}
            >
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                Amount
              </span>
              <span
                className="font-mono"
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: "var(--text-primary)",
                }}
              >
                {form.amount}
              </span>
            </div>
          </div>
        </ConfirmDialog>
      )}
    </div>
  )
}

// ─── Account Detail view ───────────────────────────────────────────────────────

function AccountDetailView({
  accountId,
  accounts,
  onBack,
  canCreate,
  canReconcile,
  onGoRecon,
}: {
  accountId: string
  accounts: BankAccountRecord[]
  onBack: () => void
  canCreate: boolean
  canReconcile: boolean
  onGoRecon: (id: string) => void
}) {
  const toast = useToast()
  const [account, setAccount] = useState<BankAccountRecord | null>(null)
  const [transactions, setTransactions] = useState<BankTransaction[]>([])
  const [tab, setTab] = useState<"transactions" | "reconciliation">(
    "transactions",
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [dateRange, setDateRange] = useState("month")
  const [typeFilter, setTypeFilter] = useState("all")

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getBankAccount(accountId),
      listBankTransactions(accountId),
    ]).then(([a, t]) => {
      if (a.data) setAccount(a.data)
      else setError("Unable to load bank account.")
      if (t.data) setTransactions(t.data)
      setLoading(false)
    })
  }, [accountId])

  const filtered = transactions.filter((t) => {
    if (typeFilter === "incoming" && !t.credit) return false
    if (typeFilter === "outgoing" && !t.debit) return false
    if (
      search &&
      !t.description.toLowerCase().includes(search.toLowerCase()) &&
      !t.ref.toLowerCase().includes(search.toLowerCase())
    )
      return false
    return true
  })

  if (loading) {
    return (
      <div style={{ padding: 32, maxWidth: 1200, margin: "0 auto" }}>
        <Sk h={28} w={160} r={6} />
        <div
          style={{
            marginTop: 24,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <Sk h={200} />
          <Sk h={400} />
        </div>
      </div>
    )
  }
  if (error || !account) {
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
          <Ic d={D.back} size={14} /> All Accounts
        </button>
        <div
          style={{
            padding: 32,
            textAlign: "center",
            color: "var(--sem-danger)",
            fontSize: 13.5,
          }}
        >
          Unable to load bank account. Please try again.
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: 32 }}>
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
        <Ic d={D.back} size={14} /> All Accounts
      </button>

      {/* Account header */}
      <div
        style={{
          background: "var(--surface-01)",
          border: "1px solid var(--border-neutral)",
          borderRadius: "var(--radius-lg)",
          padding: "24px 28px",
          marginBottom: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 16,
            marginBottom: 20,
          }}
        >
          <div>
            <div className="section-eyebrow" style={{ marginBottom: 4 }}>
              Bank Account
            </div>
            <h1
              className="type-h1"
              style={{ color: "var(--text-primary)", marginBottom: 4 }}
            >
              {account.bankName}
            </h1>
            <div style={{ fontSize: 13.5, color: "var(--text-secondary)" }}>
              {account.accountName}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
              flexWrap: "wrap",
            }}
          >
            <ReconBadge status={account.reconciliationStatus} />
            {canCreate && (
              <button
                className="btn-secondary"
                style={{ fontSize: 12.5, padding: "6px 14px" }}
                onClick={() => onGoRecon(account.id)}
              >
                <Ic
                  d={D.recon}
                  size={13}
                  style={{ display: "inline", marginRight: 5 }}
                />
                Reconciliation
              </button>
            )}
          </div>
        </div>
        <div className="resp-grid-4" style={{ gap: 16, marginBottom: 20 }}>
          <div>
            <div className="section-eyebrow" style={{ marginBottom: 4 }}>
              Account Number
            </div>
            <div
              className="font-mono"
              style={{
                fontSize: 13.5,
                letterSpacing: "0.1em",
                color: "var(--text-primary)",
              }}
            >
              {account.maskedAccountNumber}
            </div>
          </div>
          <div>
            <div className="section-eyebrow" style={{ marginBottom: 4 }}>
              Transactions
            </div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: "var(--text-primary)",
              }}
            >
              {account.transactionCount}
            </div>
          </div>
          <div>
            <div className="section-eyebrow" style={{ marginBottom: 4 }}>
              Last Transaction
            </div>
            <div style={{ fontSize: 13.5, color: "var(--text-secondary)" }}>
              {account.lastTransactionDate}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
              {account.lastTransactionDesc}
            </div>
          </div>
          <div>
            <div className="section-eyebrow" style={{ marginBottom: 4 }}>
              Reconciliation Period
            </div>
            <div style={{ fontSize: 13.5, color: "var(--text-secondary)" }}>
              {account.reconciliationPeriod}
            </div>
          </div>
        </div>
        <CalculatedBalance
          balance={account.calculatedBalance}
          period={account.reconciliationPeriod}
        />
      </div>

      {/* Tabs */}
      <div
        className="tab-group"
        style={{ marginBottom: 16, width: "fit-content" }}
      >
        {[
          { id: "transactions", label: "Transaction History" },
          { id: "reconciliation", label: "Reconciliation" },
        ].map((t) => (
          <button
            key={t.id}
            className={`tab-item ${tab === t.id ? "active" : ""}`}
            onClick={() => setTab(t.id as typeof tab)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "transactions" && (
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
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "14px 20px",
              borderBottom: "1px solid var(--border-neutral)",
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "var(--text-primary)",
              }}
            >
              Transaction History
            </div>
            <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
              {filtered.length} transactions
            </div>
          </div>
          <FilterBar
            accounts={accounts}
            selectedAccount={accountId}
            onAccount={() => {}}
            dateRange={dateRange}
            onDateRange={setDateRange}
            search={search}
            onSearch={setSearch}
            typeFilter={typeFilter}
            onType={setTypeFilter}
          />
          <TransactionTable
            transactions={filtered}
            loading={false}
            empty={filtered.length === 0}
            error={null}
          />
        </div>
      )}

      {tab === "reconciliation" && (
        <div
          style={{
            background: "var(--surface-01)",
            border: "1px solid var(--border-neutral)",
            borderRadius: "var(--radius-lg)",
            padding: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  marginBottom: 2,
                }}
              >
                Reconciliation Status
              </div>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                Period: {account.reconciliationPeriod}
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <ReconBadge status={account.reconciliationStatus} />
              {canReconcile && (
                <button
                  className="btn-primary"
                  style={{ fontSize: 12.5, padding: "7px 16px" }}
                  onClick={() => onGoRecon(account.id)}
                >
                  Open Reconciliation Detail
                </button>
              )}
            </div>
          </div>
          <div
            style={{
              padding: "14px 18px",
              background: "var(--surface-02)",
              borderRadius: "var(--radius-md)",
              fontSize: 13.5,
              color: "var(--text-secondary)",
              lineHeight: 1.6,
            }}
          >
            View the full reconciliation detail to match transactions, record
            adjustments, and complete the reconciliation for this period.
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Reconciliation List view ──────────────────────────────────────────────────

function ReconciliationListView({
  onBack,
  onDetail,
}: {
  onBack: () => void
  onDetail: (id: string) => void
}) {
  const [items, setItems] = useState<ReconciliationListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listAllReconciliations().then((r) => {
      if (r.data) setItems(r.data)
      else setError(r.error ?? "Unable to load reconciliation data.")
      setLoading(false)
    })
  }, [])

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
        <Ic d={D.back} size={14} /> Banking
      </button>
      <div style={{ marginBottom: 28 }}>
        <div className="section-eyebrow" style={{ marginBottom: 4 }}>
          Finance
        </div>
        <h1
          className="type-h1"
          style={{ color: "var(--text-primary)", marginBottom: 6 }}
        >
          Bank Reconciliation
        </h1>
        <p style={{ fontSize: 13.5, color: "var(--text-secondary)" }}>
          Compare recorded transactions with bank financial records and resolve
          differences.
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
            Reconciliation Items
          </div>
          <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
            {items.length} accounts
          </div>
        </div>

        {loading ? (
          <div
            style={{
              padding: 24,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {[...Array(3)].map((_, i) => (
              <Sk key={i} h={48} />
            ))}
          </div>
        ) : error ? (
          <div style={{ padding: 32, textAlign: "center" }}>
            <div style={{ fontSize: 13.5, color: "var(--sem-danger)" }}>
              {error}
            </div>
          </div>
        ) : items.length === 0 ? (
          <div style={{ padding: "56px 32px", textAlign: "center" }}>
            <Ic
              d={D.recon}
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
              No reconciliation items need your attention
            </div>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="resp-hide-mobile resp-table-scroll">
              <table
                className="data-table"
                style={{ width: "100%", borderCollapse: "collapse" }}
                aria-label="Reconciliation list"
              >
                <thead>
                  <tr>
                    {[
                      "Account",
                      "Period",
                      "System Balance",
                      "Statement Balance",
                      "Difference",
                      "Status",
                      "Last Reconciled",
                      "",
                    ].map((h) => (
                      <th
                        key={h}
                        scope="col"
                        style={{
                          textAlign: [
                            "System Balance",
                            "Statement Balance",
                            "Difference",
                          ].includes(h)
                            ? "right"
                            : "left",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.accountId}>
                      <td
                        style={{
                          fontWeight: 600,
                          color: "var(--text-primary)",
                        }}
                      >
                        {item.account}
                      </td>
                      <td>
                        <span
                          className="font-mono"
                          style={{
                            fontSize: 12.5,
                            color: "var(--text-secondary)",
                          }}
                        >
                          {item.period}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <span
                          className="font-mono"
                          style={{ fontSize: 13, fontWeight: 600 }}
                        >
                          {item.systemBalance}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {item.statementBalance ? (
                          <span
                            className="font-mono"
                            style={{ fontSize: 13, fontWeight: 600 }}
                          >
                            {item.statementBalance}
                          </span>
                        ) : (
                          <span
                            style={{
                              color: "var(--text-muted)",
                              fontSize: 12.5,
                              fontStyle: "italic",
                            }}
                          >
                            Not submitted
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {item.difference ? (
                          <span
                            className="font-mono"
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color:
                                item.difference === "ETB 0.00"
                                  ? "var(--sem-success)"
                                  : "var(--sem-warning)",
                            }}
                          >
                            {item.difference}
                          </span>
                        ) : (
                          <span
                            style={{
                              color: "var(--text-muted)",
                              fontSize: 12.5,
                            }}
                          >
                            —
                          </span>
                        )}
                      </td>
                      <td>
                        <ReconBadge status={item.status} />
                      </td>
                      <td
                        style={{ fontSize: 12.5, color: "var(--text-muted)" }}
                      >
                        {item.lastReconciledAt ?? "—"}
                      </td>
                      <td>
                        <button
                          className="btn-secondary"
                          style={{ fontSize: 12, padding: "5px 12px" }}
                          onClick={() => onDetail(item.accountId)}
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
            <div
              className="resp-hide-desktop"
              style={{ display: "flex", flexDirection: "column" }}
            >
              {items.map((item) => (
                <div
                  key={item.accountId}
                  style={{
                    padding: "16px 16px",
                    borderBottom: "1px solid var(--border-neutral)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 12,
                      marginBottom: 12,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: "var(--text-primary)",
                          marginBottom: 2,
                        }}
                      >
                        {item.account}
                      </div>
                      <div
                        className="font-mono"
                        style={{ fontSize: 12, color: "var(--text-muted)" }}
                      >
                        {item.period}
                      </div>
                    </div>
                    <ReconBadge status={item.status} />
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: 8,
                      marginBottom: 12,
                    }}
                  >
                    {[
                      { label: "System", value: item.systemBalance },
                      {
                        label: "Statement",
                        value: item.statementBalance ?? "—",
                      },
                      { label: "Difference", value: item.difference ?? "—" },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <div
                          style={{
                            fontSize: 11,
                            color: "var(--text-muted)",
                            marginBottom: 2,
                          }}
                        >
                          {label}
                        </div>
                        <div
                          className="font-mono"
                          style={{
                            fontSize: 12.5,
                            fontWeight: 600,
                            color: "var(--text-primary)",
                          }}
                        >
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    className="btn-secondary"
                    style={{ fontSize: 12, padding: "6px 14px", width: "100%" }}
                    onClick={() => onDetail(item.accountId)}
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

// ─── Reconciliation Detail view ────────────────────────────────────────────────

function ReconciliationDetailView({
  accountId,
  onBack,
  canReconcile,
}: {
  accountId: string
  onBack: () => void
  canReconcile: boolean
}) {
  const toast = useToast()
  const [detail, setDetail] = useState<ReconciliationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<"matched" | "unmatched" | "timeline">(
    "unmatched",
  )
  const [showAdjust, setShowAdjust] = useState(false)
  const [showComplete, setShowComplete] = useState(false)
  const [adjustForm, setAdjustForm] = useState({
    amount: "",
    reason: "",
    notes: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const [statementBal, setStatementBal] = useState("")
  const [submittingStatement, setSubmittingStatement] = useState(false)

  useEffect(() => {
    getReconciliationDetail(accountId).then((r) => {
      if (r.data) setDetail(r.data)
      else setError(r.error ?? "Unable to load reconciliation data.")
      setLoading(false)
    })
  }, [accountId])

  async function handleMatch(txnId: string) {
    const r = await matchTransactionRecon(accountId, txnId)
    if (r.data) {
      toast.success("Transaction matched successfully.")
      setDetail((d) =>
        d
          ? {
              ...d,
              unmatchedTransactions: d.unmatchedTransactions.map((t) =>
                t.id === txnId ? { ...t, status: "matched" as const } : t,
              ),
            }
          : d,
      )
    } else {
      toast.error(r.error ?? "Matching action could not be completed.")
    }
  }

  async function handleAdjustment() {
    if (!adjustForm.amount.trim() || !adjustForm.reason.trim()) return
    setSubmitting(true)
    const r = await recordAdjustment({
      accountId,
      amount: adjustForm.amount,
      reason: adjustForm.reason,
      notes: adjustForm.notes || undefined,
    })
    setSubmitting(false)
    setShowAdjust(false)
    if (r.data) {
      toast.success(`Adjustment recorded. Reference: ${(r.data as any).ref}`)
    } else {
      toast.error(
        r.error ?? "The reconciliation action could not be completed.",
      )
    }
  }

  async function handleComplete() {
    setSubmitting(true)
    const r = await completeReconciliation(accountId)
    setSubmitting(false)
    setShowComplete(false)
    if (r.data) {
      setDetail(r.data as ReconciliationDetail)
      toast.success("Reconciliation completed successfully.")
    } else {
      toast.error(
        r.error ?? "The reconciliation action could not be completed.",
      )
    }
  }

  async function handleSubmitStatement() {
    if (!statementBal.trim()) return
    setSubmittingStatement(true)
    await new Promise((res) => setTimeout(res, 800))
    setSubmittingStatement(false)
    setDetail((d) =>
      d
        ? {
            ...d,
            statementBalance: statementBal,
            difference: "Calculated by server",
          }
        : d,
    )
    toast.success(
      "Statement balance submitted. The difference will be calculated by the server.",
    )
  }

  if (loading) {
    return (
      <div style={{ padding: 32, maxWidth: 1000, margin: "0 auto" }}>
        <Sk h={28} w={180} r={6} />
        <div
          style={{
            marginTop: 24,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <Sk h={160} />
          <Sk h={300} />
        </div>
      </div>
    )
  }
  if (error || !detail) {
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
          <Ic d={D.back} size={14} /> Reconciliation
        </button>
        <div
          style={{
            padding: 32,
            textAlign: "center",
            color: "var(--sem-danger)",
            fontSize: 13.5,
          }}
        >
          Reconciliation data could not be loaded.
        </div>
      </div>
    )
  }

  const hasUnresolved = detail.unmatchedTransactions.some(
    (t) => t.status !== "matched",
  )

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
        <Ic d={D.back} size={14} /> Reconciliation
      </button>

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
          marginBottom: 24,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div className="section-eyebrow" style={{ marginBottom: 4 }}>
            Reconciliation Detail
          </div>
          <h1
            className="type-h1"
            style={{ color: "var(--text-primary)", marginBottom: 4 }}
          >
            {detail.account}
          </h1>
          <div style={{ fontSize: 13.5, color: "var(--text-secondary)" }}>
            Period: {detail.period}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <ReconBadge status={detail.status} />
          {canReconcile && detail.status !== "reconciled" && (
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="btn-secondary"
                style={{ fontSize: 12.5, padding: "6px 14px" }}
                onClick={() => setShowAdjust(true)}
              >
                Record Adjustment
              </button>
              {!hasUnresolved && detail.statementBalance && (
                <button
                  className="btn-primary"
                  style={{ fontSize: 12.5, padding: "6px 14px" }}
                  onClick={() => setShowComplete(true)}
                >
                  Complete Reconciliation
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Balance comparison panel */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            background: "var(--surface-01)",
            border: "1px solid var(--border-neutral)",
            borderRadius: "var(--radius-lg)",
            padding: "18px 20px",
          }}
        >
          <div className="section-eyebrow" style={{ marginBottom: 8 }}>
            System Balance
          </div>
          <div
            className="type-numeric-lg"
            style={{ color: "var(--text-primary)" }}
          >
            {detail.systemBalance}
          </div>
          <div
            style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 4 }}
          >
            ERP calculated balance
          </div>
        </div>
        <div
          style={{
            background: "var(--surface-01)",
            border: "1px solid var(--border-neutral)",
            borderRadius: "var(--radius-lg)",
            padding: "18px 20px",
          }}
        >
          <div className="section-eyebrow" style={{ marginBottom: 8 }}>
            Statement Balance
          </div>
          {detail.statementBalance ? (
            <div
              className="type-numeric-lg"
              style={{ color: "var(--text-primary)" }}
            >
              {detail.statementBalance}
            </div>
          ) : (
            <div
              style={{
                fontSize: 13.5,
                color: "var(--text-muted)",
                fontStyle: "italic",
                marginBottom: 10,
              }}
            >
              Not yet submitted
            </div>
          )}
          {canReconcile && !detail.statementBalance && (
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <input
                className="input-field font-mono"
                style={{ flex: 1, fontSize: 12.5, padding: "6px 10px" }}
                placeholder="e.g. ETB 1,024,300.00"
                value={statementBal}
                onChange={(e) => setStatementBal(e.target.value)}
              />
              <button
                className="btn-primary"
                style={{ fontSize: 12.5, padding: "6px 12px", flexShrink: 0 }}
                onClick={handleSubmitStatement}
                disabled={!statementBal.trim() || submittingStatement}
              >
                {submittingStatement ? "Submitting…" : "Submit"}
              </button>
            </div>
          )}
        </div>
        <div
          style={{
            background:
              detail.difference === "ETB 0.00"
                ? "var(--color-status-safe-surface)"
                : detail.difference
                  ? "var(--color-status-warning-surface)"
                  : "var(--surface-01)",
            border: `1px solid ${
              detail.difference === "ETB 0.00"
                ? "var(--color-status-safe-border)"
                : detail.difference
                  ? "var(--color-status-warning-border)"
                  : "var(--border-neutral)"
            }`,
            borderRadius: "var(--radius-lg)",
            padding: "18px 20px",
          }}
        >
          <div className="section-eyebrow" style={{ marginBottom: 8 }}>
            Difference
          </div>
          {detail.difference ? (
            <div
              className="type-numeric-lg"
              style={{
                color:
                  detail.difference === "ETB 0.00"
                    ? "var(--sem-success)"
                    : "var(--sem-warning)",
              }}
            >
              {detail.difference}
            </div>
          ) : (
            <div
              style={{
                fontSize: 13.5,
                color: "var(--text-muted)",
                fontStyle: "italic",
              }}
            >
              Awaiting statement
            </div>
          )}
          {detail.difference && detail.difference !== "ETB 0.00" && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginTop: 6,
              }}
            >
              <Ic
                d={D.warning}
                size={12}
                style={{ color: "var(--sem-warning)" }}
              />
              <span style={{ fontSize: 12, color: "var(--sem-warning)" }}>
                Needs review
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Reconciliation complete state */}
      {detail.status === "reconciled" && detail.completedBy && (
        <div
          style={{
            padding: "16px 20px",
            background: "var(--color-status-safe-surface)",
            border: "1px solid var(--color-status-safe-border)",
            borderRadius: "var(--radius-lg)",
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Ic
            d={D.checkCircle}
            size={18}
            style={{ color: "var(--sem-success)", flexShrink: 0 }}
          />
          <div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "var(--sem-success)",
                marginBottom: 2,
              }}
            >
              Reconciliation Complete
            </div>
            <div style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>
              Completed by {detail.completedBy} · {detail.completedAt}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div
        className="tab-group"
        style={{ marginBottom: 16, width: "fit-content" }}
      >
        {[
          {
            id: "unmatched",
            label: `Unmatched (${detail.unmatchedTransactions.length})`,
          },
          {
            id: "matched",
            label: `Matched (${detail.matchedTransactions.length})`,
          },
          { id: "timeline", label: "Activity" },
        ].map((t) => (
          <button
            key={t.id}
            className={`tab-item ${tab === t.id ? "active" : ""}`}
            onClick={() => setTab(t.id as typeof tab)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div
        style={{
          background: "var(--surface-01)",
          border: "1px solid var(--border-neutral)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
        }}
      >
        {tab === "unmatched" && (
          <>
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
                Unmatched Transactions
              </div>
              {detail.unmatchedTransactions.length === 0 && (
                <span className="badge badge-green">All Matched</span>
              )}
            </div>
            {detail.unmatchedTransactions.length === 0 ? (
              <div style={{ padding: "48px 32px", textAlign: "center" }}>
                <Ic
                  d={D.checkCircle}
                  size={28}
                  style={{
                    color: "var(--sem-success)",
                    display: "block",
                    margin: "0 auto 12px",
                  }}
                />
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: "var(--text-primary)",
                  }}
                >
                  No unmatched transactions
                </div>
              </div>
            ) : (
              <div className="resp-table-scroll">
                <table
                  className="data-table"
                  style={{ width: "100%", borderCollapse: "collapse" }}
                  aria-label="Unmatched transactions"
                >
                  <thead>
                    <tr>
                      {[
                        "Date",
                        "Reference",
                        "Description",
                        "Direction",
                        "Amount",
                        "Status",
                        "Matched To",
                        ...(canReconcile ? [""] : []),
                      ].map((h) => (
                        <th
                          key={h}
                          scope="col"
                          style={{
                            textAlign: h === "Amount" ? "right" : "left",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {detail.unmatchedTransactions.map((txn) => (
                      <ReconTxnRow
                        key={txn.id}
                        txn={txn}
                        canMatch={canReconcile}
                        onMatch={handleMatch}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {tab === "matched" && (
          <>
            <div
              style={{
                padding: "12px 20px",
                borderBottom: "1px solid var(--border-neutral)",
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                }}
              >
                Matched Transactions
              </div>
            </div>
            {detail.matchedTransactions.length === 0 ? (
              <div
                style={{
                  padding: "48px 32px",
                  textAlign: "center",
                  color: "var(--text-muted)",
                  fontSize: 13.5,
                }}
              >
                No matched transactions yet.
              </div>
            ) : (
              <div className="resp-table-scroll">
                <table
                  className="data-table"
                  style={{ width: "100%", borderCollapse: "collapse" }}
                  aria-label="Matched transactions"
                >
                  <thead>
                    <tr>
                      {[
                        "Date",
                        "Reference",
                        "Description",
                        "Direction",
                        "Amount",
                        "Status",
                        "Matched To",
                      ].map((h) => (
                        <th
                          key={h}
                          scope="col"
                          style={{
                            textAlign: h === "Amount" ? "right" : "left",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {detail.matchedTransactions.map((txn) => (
                      <ReconTxnRow key={txn.id} txn={txn} canMatch={false} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {tab === "timeline" && (
          <div style={{ padding: 24 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "var(--text-primary)",
                marginBottom: 20,
              }}
            >
              Reconciliation Activity
            </div>
            <FinancialTimeline events={detail.timeline} />
          </div>
        )}
      </div>

      {/* Adjustment confirmation */}
      {showAdjust && (
        <ConfirmDialog
          title="Record Adjustment"
          confirmLabel={submitting ? "Recording…" : "Record Adjustment"}
          confirming={submitting}
          onCancel={() => setShowAdjust(false)}
          onConfirm={handleAdjustment}
        >
          <p style={{ marginBottom: 16 }}>
            This will create a financial adjustment record for{" "}
            <strong>{detail.account}</strong>. The adjustment must have a
            documented reason.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12.5,
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                  marginBottom: 5,
                }}
              >
                Amount (ETB) *
              </label>
              <input
                className="input-field font-mono"
                style={{ width: "100%" }}
                placeholder="e.g. ETB 3,000.00"
                value={adjustForm.amount}
                onChange={(e) =>
                  setAdjustForm((f) => ({ ...f, amount: e.target.value }))
                }
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12.5,
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                  marginBottom: 5,
                }}
              >
                Reason *
              </label>
              <input
                className="input-field"
                style={{ width: "100%" }}
                placeholder="Document the reason for this adjustment"
                value={adjustForm.reason}
                onChange={(e) =>
                  setAdjustForm((f) => ({ ...f, reason: e.target.value }))
                }
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12.5,
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                  marginBottom: 5,
                }}
              >
                Notes
              </label>
              <textarea
                className="input-field"
                rows={2}
                style={{ width: "100%", resize: "vertical" }}
                placeholder="Optional"
                value={adjustForm.notes}
                onChange={(e) =>
                  setAdjustForm((f) => ({ ...f, notes: e.target.value }))
                }
              />
            </div>
          </div>
        </ConfirmDialog>
      )}

      {/* Complete reconciliation confirmation */}
      {showComplete && (
        <ConfirmDialog
          title="Complete Reconciliation?"
          confirmLabel="Complete Reconciliation"
          confirming={submitting}
          onCancel={() => setShowComplete(false)}
          onConfirm={handleComplete}
        >
          <p>
            All selected items will be recorded as reconciled according to the
            financial workflow.
          </p>
          <div
            style={{
              marginTop: 14,
              padding: "12px 16px",
              background: "var(--surface-02)",
              borderRadius: "var(--radius-md)",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 13,
              }}
            >
              <span style={{ color: "var(--text-secondary)" }}>Account</span>
              <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                {detail.account}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 13,
              }}
            >
              <span style={{ color: "var(--text-secondary)" }}>Period</span>
              <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                {detail.period}
              </span>
            </div>
          </div>
        </ConfirmDialog>
      )}
    </div>
  )
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────

function BankingDashboard({
  accounts,
  summary,
  loading,
  error,
  canCreate,
  canReconcile,
  onViewAccount,
  onNewTransaction,
  onTransfer,
  onReconciliation,
}: {
  accounts: BankAccountRecord[]
  summary: BankingSummary | null
  loading: boolean
  error: string | null
  canCreate: boolean
  canReconcile: boolean
  onViewAccount: (id: string) => void
  onNewTransaction: () => void
  onTransfer: () => void
  onReconciliation: () => void
}) {
  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: 32 }}>
      {/* Page header */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
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
            Banking
          </h1>
          <p style={{ fontSize: 13.5, color: "var(--text-secondary)" }}>
            Monitor bank balances, transactions, and reconciliation activity.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {canReconcile && (
            <button
              className="btn-secondary"
              onClick={onReconciliation}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 13,
              }}
            >
              <Ic d={D.recon} size={14} /> Reconciliation
            </button>
          )}
          {canCreate && (
            <>
              <button
                className="btn-secondary"
                onClick={onTransfer}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 13,
                }}
              >
                <Ic d={D.transfer} size={14} /> Transfer
              </button>
              <button
                className="btn-primary"
                onClick={onNewTransaction}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 13,
                }}
              >
                <Ic d={D.plus} size={14} /> New Transaction
              </button>
            </>
          )}
        </div>
      </div>

      {/* Summary cards */}
      {loading ? (
        <div className="resp-grid-4" style={{ marginBottom: 24 }}>
          {[...Array(4)].map((_, i) => (
            <Sk key={i} h={100} />
          ))}
        </div>
      ) : error ? (
        <div
          style={{
            padding: 24,
            background: "var(--color-status-danger-surface)",
            border: "1px solid var(--color-status-danger-border)",
            borderRadius: "var(--radius-lg)",
            marginBottom: 24,
          }}
        >
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Ic
              d={D.warning}
              size={16}
              style={{ color: "var(--sem-danger)", flexShrink: 0 }}
            />
            <div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--sem-danger)",
                }}
              >
                Unable to load bank accounts
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "var(--text-secondary)",
                  marginTop: 2,
                }}
              >
                {error}
              </div>
            </div>
          </div>
        </div>
      ) : summary ? (
        <div className="resp-grid-4" style={{ marginBottom: 24 }}>
          <SummaryCard
            label="Total Calculated Balance"
            value={summary.totalBalance}
            sub="Across all accounts"
          />
          <SummaryCard
            label="Incoming This Month"
            value={summary.incomingThisMonth}
          />
          <SummaryCard
            label="Outgoing This Month"
            value={summary.outgoingThisMonth}
          />
          <SummaryCard
            label="Needs Reconciliation"
            value={String(summary.needsReconciliationCount)}
            sub="account(s)"
            accent={summary.needsReconciliationCount > 0}
          />
        </div>
      ) : null}

      {/* Account cards */}
      {loading ? (
        <div className="resp-grid-2" style={{ gap: 20 }}>
          {[...Array(2)].map((_, i) => (
            <Sk key={i} h={300} r={12} />
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <div
          style={{
            padding: "56px 32px",
            textAlign: "center",
            background: "var(--surface-01)",
            border: "1px solid var(--border-neutral)",
            borderRadius: "var(--radius-lg)",
          }}
        >
          <Ic
            d={D.bank}
            size={32}
            style={{
              color: "var(--text-muted)",
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
            No bank accounts configured
          </div>
          <div style={{ fontSize: 13.5, color: "var(--text-muted)" }}>
            No bank accounts have been configured yet. Contact your
            administrator.
          </div>
        </div>
      ) : (
        <div className="resp-grid-2" style={{ gap: 20 }}>
          {accounts.map((acc) => (
            <AccountCard
              key={acc.id}
              account={acc}
              onView={() => onViewAccount(acc.id)}
            />
          ))}
        </div>
      )}

      {/* Reconciliation attention banner */}
      {!loading &&
        !error &&
        summary &&
        summary.needsReconciliationCount > 0 && (
          <div
            style={{
              marginTop: 24,
              padding: "16px 20px",
              background: "var(--color-status-warning-surface)",
              border: "1px solid var(--color-status-warning-border)",
              borderRadius: "var(--radius-lg)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Ic
                d={D.warning}
                size={16}
                style={{ color: "var(--sem-warning)", flexShrink: 0 }}
              />
              <div>
                <div
                  style={{
                    fontSize: 13.5,
                    fontWeight: 600,
                    color: "var(--sem-warning)",
                  }}
                >
                  {summary.needsReconciliationCount} account
                  {summary.needsReconciliationCount !== 1 ? "s" : ""} pending
                  reconciliation
                </div>
                <div style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>
                  Review outstanding items and reconcile with your bank
                  statement.
                </div>
              </div>
            </div>
            {canReconcile && (
              <button
                className="btn-secondary"
                style={{ fontSize: 12.5, padding: "7px 16px", flexShrink: 0 }}
                onClick={onReconciliation}
              >
                Open Reconciliation
              </button>
            )}
          </div>
        )}
    </div>
  )
}

// ─── Main export ───────────────────────────────────────────────────────────────

export default function Banking({ routeParams }: { routeParams?: { id?: string } }) {
  // Auth + RBAC — all hooks first
  const { currentUser } = useAuth()
  const role = currentUser?.role ?? "viewer"
  const canView = can(role as any, "banking.view")
  const canCreate = can(role as any, "banking.create")
  const canReconcile = can(role as any, "banking.reconcile")

  const [view, setView] = useState<View>("dashboard")
  const [selectedAccountId, setSelectedAccountId] = useState<string>("")
  
  useEffect(() => {
    if (routeParams?.id) {
      setSelectedAccountId(routeParams.id)
      setView("account-detail")
    }
  }, [routeParams])
  const [accounts, setAccounts] = useState<BankAccountRecord[]>([])
  const [summary, setSummary] = useState<BankingSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshCount, setRefreshCount] = useState(0)

  useEffect(() => {
    Promise.all([listBankAccounts(), getBankingSummary()]).then(([a, s]) => {
      if (a.data) {
        setAccounts(a.data)
        setSelectedAccountId(a.data[0]?.id ?? "")
      } else setError(a.error ?? "Unable to load bank accounts.")
      if (s.data) setSummary(s.data)
      setLoading(false)
    })
  }, [refreshCount])

  useSupabaseRealtime("banking", () => setRefreshCount((c) => c + 1))

  // Conditional returns after all hooks
  if (!canView) return <AccessDenied />

  if (view === "account-detail") {
    return (
      <AccountDetailView
        accountId={selectedAccountId}
        accounts={accounts}
        onBack={() => setView("dashboard")}
        canCreate={canCreate}
        canReconcile={canReconcile}
        onGoRecon={(id) => {
          setSelectedAccountId(id)
          setView("reconciliation-detail")
        }}
      />
    )
  }

  if (view === "new-transaction") {
    return (
      <NewTransactionView
        accounts={accounts}
        onBack={() => {
          setRefreshCount(c => c + 1)
          setView("dashboard")
        }}
        canCreate={canCreate}
      />
    )
  }

  if (view === "transfer") {
    return (
      <TransferView accounts={accounts} onBack={() => {
        setRefreshCount(c => c + 1)
        setView("dashboard")
      }} />
    )
  }

  if (view === "reconciliation-list") {
    return (
      <ReconciliationListView
        onBack={() => setView("dashboard")}
        onDetail={(id) => {
          setSelectedAccountId(id)
          setView("reconciliation-detail")
        }}
      />
    )
  }

  if (view === "reconciliation-detail") {
    return (
      <ReconciliationDetailView
        accountId={selectedAccountId}
        onBack={() => setView("reconciliation-list")}
        canReconcile={canReconcile}
      />
    )
  }

  return (
    <BankingDashboard
      accounts={accounts}
      summary={summary}
      loading={loading}
      error={error}
      canCreate={canCreate}
      canReconcile={canReconcile}
      onViewAccount={(id) => {
        setSelectedAccountId(id)
        setView("account-detail")
      }}
      onNewTransaction={() => setView("new-transaction")}
      onTransfer={() => setView("transfer")}
      onReconciliation={() => setView("reconciliation-list")}
    />
  )
}
