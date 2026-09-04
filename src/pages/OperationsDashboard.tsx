import { useState, useEffect } from "react"
import { apiRequest } from "../services/api"

export default function OperationsDashboard({
  onNavigate,
}: {
  onNavigate?: (id: string) => void
}) {
  const [invStats, setInvStats] = useState<any>(null)
  const [delivStats, setDelivStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      apiRequest<any>("/inventory/stats", "GET").catch(() => null),
      apiRequest<any>("/delivery/summary", "GET").catch(() => null),
    ]).then(([inv, deliv]) => {
      if (inv) setInvStats(inv)
      if (deliv) setDelivStats(deliv)
    }).finally(() => setLoading(false))
  }, [])

  const lowStockCount = invStats?.attentionCount ?? 0
  const pendingDeliveries = delivStats?.pending ?? 0

  return (
    <div
      style={{
        padding: "24px 28px",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <h1 style={{ fontSize: 21, fontWeight: 700, margin: "0 0 4px" }}>
        Operations Dashboard
      </h1>
      <p style={{ color: "var(--text-secondary)", margin: "0 0 24px", fontSize: 13 }}>
        Live operations portal (Inventory / Roasting / Delivery).
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            padding: 20,
            background: "var(--surface-01)",
            border: "1px solid var(--border-neutral)",
            borderRadius: 12,
          }}
        >
          <h3 style={{ margin: "0 0 10px", fontSize: 14, color: "var(--text-secondary)", fontWeight: 500 }}>
            Low Stock Alerts
          </h3>
          <p
            style={{
              fontSize: 28,
              fontWeight: 700,
              margin: 0,
              color: lowStockCount > 0 ? "#DC2626" : "#16A34A",
            }}
          >
            {loading ? "…" : lowStockCount}
          </p>
          <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--text-muted)" }}>
            {lowStockCount > 0 ? "Items require restocking" : "All stock levels healthy"}
          </p>
        </div>

        <div
          style={{
            padding: 20,
            background: "var(--surface-01)",
            border: "1px solid var(--border-neutral)",
            borderRadius: 12,
          }}
        >
          <h3 style={{ margin: "0 0 10px", fontSize: 14, color: "var(--text-secondary)", fontWeight: 500 }}>
            Pending Deliveries
          </h3>
          <p
            style={{
              fontSize: 28,
              fontWeight: 700,
              margin: 0,
              color: pendingDeliveries > 0 ? "#D97706" : "var(--text-primary)",
            }}
          >
            {loading ? "…" : pendingDeliveries}
          </p>
          <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--text-muted)" }}>
            {pendingDeliveries > 0 ? "Ready for driver assignment" : "No pending deliveries"}
          </p>
        </div>

        <div
          style={{
            padding: 20,
            background: "var(--surface-01)",
            border: "1px solid var(--border-neutral)",
            borderRadius: 12,
          }}
        >
          <h3 style={{ margin: "0 0 10px", fontSize: 14, color: "var(--text-secondary)", fontWeight: 500 }}>
            In-Transit / Completed
          </h3>
          <p
            style={{
              fontSize: 28,
              fontWeight: 700,
              margin: 0,
              color: "#2563EB",
            }}
          >
            {loading ? "…" : (delivStats?.completedToday ?? 0)}
          </p>
          <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--text-muted)" }}>
            Deliveries completed today
          </p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={() => onNavigate?.("inventory")}
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
          Manage Inventory
        </button>
        <button
          onClick={() => onNavigate?.("delivery")}
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
          Manage Deliveries
        </button>
      </div>
    </div>
  )
}
