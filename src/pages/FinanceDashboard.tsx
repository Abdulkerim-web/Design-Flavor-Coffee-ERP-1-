import { useState, useEffect } from "react"
import { apiRequest } from "../services/api"

interface FinanceSummary {
  totalCustomerPayments: string
  outstandingBalances: string
  overdueCount: number
  thisMonthExpenses: string
  pendingExpenseApprovals: string
  pendingExpenseCount: number
  currentPayrollTotal: string
  totalBankBalance: string
}

export default function FinanceDashboard({
  onNavigate,
}: {
  onNavigate?: (id: string) => void
}) {
  const [data, setData] = useState<FinanceSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    apiRequest<FinanceSummary>("/dashboard/finance", "GET")
      .then((res) => {
        if (res) setData(res)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div
      style={{
        padding: "24px 28px",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <h1 style={{ fontSize: 21, fontWeight: 700, margin: "0 0 4px" }}>
        Finance Dashboard
      </h1>
      <p style={{ color: "var(--text-secondary)", margin: "0 0 24px", fontSize: 13 }}>
        Live financial statistics authoritative from the backend.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        {/* Total Payments Received */}
        <div
          style={{
            padding: 20,
            background: "var(--surface-01)",
            border: "1px solid var(--border-neutral)",
            borderRadius: 12,
          }}
        >
          <h3 style={{ margin: "0 0 10px", fontSize: 14, color: "var(--text-secondary)", fontWeight: 500 }}>
            Total Payments Received
          </h3>
          <p
            style={{
              fontSize: 24,
              fontWeight: 700,
              margin: 0,
              color: "#16A34A",
            }}
          >
            {loading ? "…" : (data?.totalCustomerPayments || "ETB 0")}
          </p>
        </div>

        {/* Outstanding Receivables */}
        <div
          style={{
            padding: 20,
            background: "var(--surface-01)",
            border: "1px solid var(--border-neutral)",
            borderRadius: 12,
          }}
        >
          <h3 style={{ margin: "0 0 10px", fontSize: 14, color: "var(--text-secondary)", fontWeight: 500 }}>
            Outstanding Receivables
          </h3>
          <p
            style={{
              fontSize: 24,
              fontWeight: 700,
              margin: 0,
              color: (data?.overdueCount ?? 0) > 0 ? "#DC2626" : "var(--text-primary)",
            }}
          >
            {loading ? "…" : (data?.outstandingBalances || "ETB 0")}
          </p>
          <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--text-muted)" }}>
            {data?.overdueCount ? `${data.overdueCount} payment(s) overdue` : "No overdue invoices"}
          </p>
        </div>

        {/* Pending Expenses */}
        <div
          style={{
            padding: 20,
            background: "var(--surface-01)",
            border: "1px solid var(--border-neutral)",
            borderRadius: 12,
          }}
        >
          <h3 style={{ margin: "0 0 10px", fontSize: 14, color: "var(--text-secondary)", fontWeight: 500 }}>
            Pending Expenses
          </h3>
          <p
            style={{
              fontSize: 24,
              fontWeight: 700,
              margin: 0,
              color: "#D97706",
            }}
          >
            {loading ? "…" : (data?.pendingExpenseApprovals || "ETB 0")}
          </p>
          <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--text-muted)" }}>
            {data?.pendingExpenseCount ? `${data.pendingExpenseCount} expense(s) awaiting approval` : "No pending approvals"}
          </p>
        </div>

        {/* Total Bank Balance */}
        <div
          style={{
            padding: 20,
            background: "var(--surface-01)",
            border: "1px solid var(--border-neutral)",
            borderRadius: 12,
          }}
        >
          <h3 style={{ margin: "0 0 10px", fontSize: 14, color: "var(--text-secondary)", fontWeight: 500 }}>
            Total Bank Balance
          </h3>
          <p
            style={{
              fontSize: 24,
              fontWeight: 700,
              margin: 0,
              color: "#2563EB",
            }}
          >
            {loading ? "…" : (data?.totalBankBalance || "ETB 0")}
          </p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={() => onNavigate?.("payments")}
          style={{
            padding: "10px 18px",
            background: "#2B4D3A",
            color: "white",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          View Payments & Ledgers
        </button>
        <button
          onClick={() => onNavigate?.("expenses")}
          style={{
            padding: "10px 16px",
            background: "transparent",
            border: "1px solid var(--border-neutral)",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 13,
            color: "var(--text-secondary)",
          }}
        >
          View Expenses
        </button>
      </div>
    </div>
  )
}
