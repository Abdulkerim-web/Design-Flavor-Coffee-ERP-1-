import React from "react"

export default function FinanceDashboard({
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
        Finance Dashboard
      </h1>
      <p style={{ color: "var(--text-secondary)" }}>
        Welcome to the finance portal.
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
          <h3 style={{ margin: "0 0 10px", fontSize: 16 }}>
            Accounts Receivable
          </h3>
          <p
            style={{
              fontSize: 24,
              fontWeight: 700,
              margin: 0,
              color: "#16A34A",
            }}
          >
            ETB 452,100.00
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
          <h3 style={{ margin: "0 0 10px", fontSize: 16 }}>Accounts Payable</h3>
          <p
            style={{
              fontSize: 24,
              fontWeight: 700,
              margin: 0,
              color: "#DC2626",
            }}
          >
            ETB 128,400.00
          </p>
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <button
          onClick={() => onNavigate?.("payments")}
          style={{
            padding: "10px 16px",
            background: "#2B4D3A",
            color: "white",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
          }}
        >
          View Payments & Ledgers
        </button>
      </div>
    </div>
  )
}
