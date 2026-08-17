export default function Approvals() {
  return (
    <div style={{ padding: 32, fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              fontSize: 11,
              fontFamily: "DM Mono",
              letterSpacing: "0.09em",
              textTransform: "uppercase",
              color: "var(--text-muted)",
              marginBottom: 6,
            }}
          >
            Management
          </div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "var(--text-primary)",
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            Approvals
          </h1>
          <p
            style={{
              fontSize: 13.5,
              color: "var(--text-secondary)",
              marginTop: 6,
              lineHeight: 1.5,
            }}
          >
            Review and action pending approvals — orders, expenses, and
            operational requests.
          </p>
        </div>

        {/* Pending badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 12px",
            borderRadius: 999,
            marginBottom: 20,
            background: "#FFFBEB",
            border: "1px solid #FDE68A",
            fontSize: 12,
            fontFamily: "DM Mono",
            color: "#B45309",
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#F59E0B",
            }}
          />
          3 items awaiting your approval
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            {
              id: "ORD-1042",
              type: "Order Approval",
              desc: "Guji Medium — 50 KG — Harar Coffee Exporters",
              urgency: "amber",
            },
            {
              id: "EXP-0098",
              type: "Expense Approval",
              desc: "Vehicle maintenance — Delivery truck ETB 8,500",
              urgency: "amber",
            },
            {
              id: "ORD-1039",
              type: "Order Approval",
              desc: "Sidama Grade 1 — 120 KG — Bole Supermarket",
              urgency: "amber",
            },
          ].map((item) => (
            <div
              key={item.id}
              style={{
                background: "var(--surface-01)",
                border: "1px solid var(--border-neutral)",
                borderRadius: 9,
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
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
                  <span
                    style={{
                      fontSize: 10.5,
                      fontFamily: "DM Mono",
                      color: "#B45309",
                      background: "#FFFBEB",
                      border: "1px solid #FDE68A",
                      padding: "1px 7px",
                      borderRadius: 999,
                    }}
                  >
                    {item.type}
                  </span>
                  <span
                    style={{
                      fontSize: 11.5,
                      fontFamily: "DM Mono",
                      color: "var(--text-muted)",
                    }}
                  >
                    {item.id}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 13.5,
                    color: "var(--text-primary)",
                    fontWeight: 500,
                  }}
                >
                  {item.desc}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button
                  style={{
                    padding: "6px 14px",
                    borderRadius: 6,
                    border: "1px solid var(--border-neutral)",
                    background: "var(--bg-primary)",
                    color: "var(--text-secondary)",
                    fontSize: 12.5,
                    fontFamily: "Inter",
                    cursor: "pointer",
                  }}
                >
                  Reject
                </button>
                <button
                  style={{
                    padding: "6px 14px",
                    borderRadius: 6,
                    border: "none",
                    background: "#2B4D3A",
                    color: "#FFFFFF",
                    fontSize: 12.5,
                    fontWeight: 600,
                    fontFamily: "Inter",
                    cursor: "pointer",
                  }}
                >
                  Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
