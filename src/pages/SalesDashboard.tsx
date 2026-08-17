import React, { useState } from "react"
import { CustomerFormModal } from "../components/CustomerFormModal"

export default function SalesDashboard({
  onNavigate,
}: {
  onNavigate?: (id: string) => void
}) {
  const [customerModalOpen, setCustomerModalOpen] = useState(false)

  return (
    <div
      style={{
        padding: "24px 28px",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <h1 style={{ fontSize: 21, fontWeight: 700, margin: "0 0 16px" }}>
        Sales Dashboard
      </h1>
      <p style={{ color: "var(--text-secondary)" }}>
        Welcome to the sales portal.
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
            Your Active Orders
          </h3>
          <p
            style={{
              fontSize: 24,
              fontWeight: 700,
              margin: 0,
              color: "#2563EB",
            }}
          >
            14
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
            Pending Customers
          </h3>
          <p
            style={{
              fontSize: 24,
              fontWeight: 700,
              margin: 0,
              color: "#D97706",
            }}
          >
            2
          </p>
        </div>
      </div>

      <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
        <button
          onClick={() => setCustomerModalOpen(true)}
          style={{
            padding: "10px 16px",
            background: "#2B4D3A",
            color: "white",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
          }}
        >
          Add New Customer
        </button>
        <button
          onClick={() => onNavigate?.("customers")}
          style={{
            padding: "10px 16px",
            background: "transparent",
            border: "1px solid var(--border-neutral)",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          View All Customers
        </button>
      </div>

      <CustomerFormModal
        open={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
      />
    </div>
  )
}
