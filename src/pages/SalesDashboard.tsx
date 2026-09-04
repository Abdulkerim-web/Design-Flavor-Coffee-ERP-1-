import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import { apiRequest } from "../services/api"

interface SalesDashboardCounts {
  activeOrders: number
  pendingCustomers: number
  totalCustomers: number
}

export default function SalesDashboard({
  onNavigate,
}: {
  onNavigate?: (id: string) => void
}) {
  const { currentUser } = useAuth()
  const [counts, setCounts] = useState<SalesDashboardCounts | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentUser?.id) return
    setLoading(true)
    apiRequest<SalesDashboardCounts>(
      `/dashboard/sales?salesRepId=${encodeURIComponent(currentUser.id)}`,
      "GET"
    )
      .then((data) => {
        if (data && typeof data.activeOrders === "number") {
          setCounts(data)
        } else {
          setCounts({ activeOrders: 0, pendingCustomers: 0, totalCustomers: 0 })
        }
      })
      .catch(() => {
        setCounts({ activeOrders: 0, pendingCustomers: 0, totalCustomers: 0 })
      })
      .finally(() => setLoading(false))
  }, [currentUser?.id])

  return (
    <div
      style={{
        padding: "24px 28px",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <h1 style={{ fontSize: 21, fontWeight: 700, margin: "0 0 4px" }}>
        Sales Dashboard
      </h1>
      <p style={{ color: "var(--text-secondary)", margin: "0 0 24px", fontSize: 13 }}>
        Welcome back{currentUser?.name ? `, ${currentUser.name}` : ""}. Here is your live overview.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 16,
          marginBottom: 24,
        }}
      >
        {/* Active Orders */}
        <div
          style={{
            padding: 20,
            background: "var(--surface-01)",
            border: "1px solid var(--border-neutral)",
            borderRadius: 12,
          }}
        >
          <h3 style={{ margin: "0 0 10px", fontSize: 14, color: "var(--text-secondary)", fontWeight: 500 }}>
            Your Active Orders
          </h3>
          <p
            style={{
              fontSize: 32,
              fontWeight: 700,
              margin: 0,
              color: loading ? "var(--text-muted)" : "#2563EB",
              transition: "color 0.3s",
            }}
          >
            {loading ? "—" : (counts?.activeOrders ?? 0)}
          </p>
          <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--text-muted)" }}>
            {loading ? "Loading…" : "Not yet delivered or cancelled"}
          </p>
        </div>

        {/* Pending Customers */}
        <div
          style={{
            padding: 20,
            background: "var(--surface-01)",
            border: "1px solid var(--border-neutral)",
            borderRadius: 12,
          }}
        >
          <h3 style={{ margin: "0 0 10px", fontSize: 14, color: "var(--text-secondary)", fontWeight: 500 }}>
            Pending Approval
          </h3>
          <p
            style={{
              fontSize: 32,
              fontWeight: 700,
              margin: 0,
              color: loading ? "var(--text-muted)" : (counts?.pendingCustomers ?? 0) > 0 ? "#D97706" : "var(--text-primary)",
              transition: "color 0.3s",
            }}
          >
            {loading ? "—" : (counts?.pendingCustomers ?? 0)}
          </p>
          <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--text-muted)" }}>
            {loading ? "Loading…" : "Customers awaiting manager review"}
          </p>
        </div>

        {/* Total Customers */}
        <div
          style={{
            padding: 20,
            background: "var(--surface-01)",
            border: "1px solid var(--border-neutral)",
            borderRadius: 12,
          }}
        >
          <h3 style={{ margin: "0 0 10px", fontSize: 14, color: "var(--text-secondary)", fontWeight: 500 }}>
            My Customers
          </h3>
          <p
            style={{
              fontSize: 32,
              fontWeight: 700,
              margin: 0,
              color: loading ? "var(--text-muted)" : "#16A34A",
              transition: "color 0.3s",
            }}
          >
            {loading ? "—" : (counts?.totalCustomers ?? 0)}
          </p>
          <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--text-muted)" }}>
            {loading ? "Loading…" : "Total assigned to you"}
          </p>
        </div>
      </div>

      {/* Actions — single entry point for customer management */}
      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={() => onNavigate?.("customers")}
          style={{
            padding: "10px 18px",
            background: "#2B4D3A",
            color: "white",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8z" />
          </svg>
          Manage My Customers
        </button>
        <button
          onClick={() => onNavigate?.("orders")}
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
          View My Orders
        </button>
      </div>
    </div>
  )
}
