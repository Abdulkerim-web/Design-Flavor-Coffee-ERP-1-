import React from "react"

export default function OperationsDashboard({
  onNavigate,
}: {
  onNavigate?: (id: string) => void
}) {
  return (
    <div
      style={{
        padding: "24px 28px",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <h1 style={{ fontSize: 21, fontWeight: 700, margin: "0 0 16px" }}>
        Operations Dashboard
      </h1>
      <p style={{ color: "var(--text-secondary)" }}>
        Welcome to the operations portal (Inventory / Roasting / Delivery).
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginTop: 24,
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
          <h3 style={{ margin: "0 0 10px", fontSize: 16 }}>Low Stock Items</h3>
          <p
            style={{
              fontSize: 24,
              fontWeight: 700,
              margin: 0,
              color: "#DC2626",
            }}
          >
            5
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
          <h3 style={{ margin: "0 0 10px", fontSize: 16 }}>
            Pending Deliveries
          </h3>
          <p
            style={{
              fontSize: 24,
              fontWeight: 700,
              margin: 0,
              color: "#D97706",
            }}
          >
            12
          </p>
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <button
          onClick={() => onNavigate?.("inventory")}
          style={{
            padding: "10px 16px",
            background: "#2B4D3A",
            color: "white",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
          }}
        >
          Manage Inventory
        </button>
      </div>
    </div>
  )
}
