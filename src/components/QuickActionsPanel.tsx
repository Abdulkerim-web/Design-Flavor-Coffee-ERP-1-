import React from "react"

export default function QuickActionsPanel({
  onNavigate,
  onOpenQuickCreate,
}: {
  onNavigate: (id: string, params?: any) => void
  onOpenQuickCreate: () => void
}) {
  return (
    <div
      style={{
        position: "fixed",
        left: 88,
        top: 120,
        width: 56,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        zIndex: 250,
      }}
    >
      {[{
        id: "orders",
        label: "New Order",
      }, {
        id: "customers",
        label: "Customer",
      }, {
        id: "production",
        label: "Roast",
      }, {
        id: "delivery",
        label: "Delivery",
      }, {
        id: "payments",
        label: "Pay",
      }, {
        id: "expenses",
        label: "Expense",
      }, {
        id: "approvals",
        label: "Approve",
      }, {
        id: "notifications",
        label: "Notes",
      }].map((b) => (
        <button
          key={b.id}
          title={b.label}
          onClick={() => onNavigate(b.id)}
          style={{
            width: 56,
            height: 56,
            borderRadius: 12,
            border: "1px solid var(--border-neutral)",
            background: "var(--surface-01)",
            color: "var(--text-primary)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 700,
            padding: 6,
            boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ textAlign: "center" }}>{b.label.split(" ")[0]}</div>
        </button>
      ))}
      <button
        onClick={onOpenQuickCreate}
        title="Quick Create"
        style={{
          width: 56,
          height: 42,
          borderRadius: 10,
          border: "1px solid var(--border-neutral)",
          background: "linear-gradient(90deg,#2B4D3A,#3D6B54)",
          color: "#fff",
          cursor: "pointer",
          fontSize: 12,
          fontWeight: 700,
        }}
      >
        +
      </button>
    </div>
  )
}
