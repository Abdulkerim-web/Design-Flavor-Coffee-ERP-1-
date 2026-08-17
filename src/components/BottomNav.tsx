/* Responsive: mobile ≤640 | tablet 641–1024 | laptop 1025–1440 | desktop >1440 */
import type { FC } from "react"

interface BottomNavProps {
  active: string
  onNavigate: (id: string) => void
  onOpenAlerts: () => void
  alertCount?: number
}

const Icon: FC<{ d: string size?: number }> = ({ d, size = 22 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={d} />
  </svg>
)

const TABS = [
  {
    id: "dashboard",
    label: "Home",
    d: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2zM9 22V12h6v10",
  },
  {
    id: "orders",
    label: "Orders",
    d: "M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0",
  },
  {
    id: "delivery",
    label: "Deliveries",
    d: "M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM5.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM18.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5z",
  },
  {
    id: "_alerts",
    label: "Alerts",
    d: "M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0",
  },
]

export default function BottomNav({
  active,
  onNavigate,
  onOpenAlerts,
  alertCount = 0,
}: BottomNavProps) {
  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 150,
        background: "var(--surface-01)",
        borderTop: "1px solid var(--border-neutral)",
        display: "flex",
        alignItems: "stretch",
        paddingBottom: "env(safe-area-inset-bottom, 8px)",
        boxShadow: "0 -4px 24px rgba(0,0,0,0.06)",
      }}
    >
      {TABS.map((tab) => {
        const isAlert = tab.id === "_alerts"
        const isActive = isAlert ? false : active === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => (isAlert ? onOpenAlerts() : onNavigate(tab.id))}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
              paddingTop: 10,
              paddingBottom: 10,
              border: "none",
              background: "none",
              cursor: "pointer",
              color: isActive
                ? "var(--brand-primary)"
                : "var(--text-secondary)",
              transition: "color 0.15s ease",
              position: "relative",
            }}
          >
            {isAlert && alertCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: 6,
                  right: "50%",
                  transform: "translateX(8px)",
                  background: "var(--sem-danger)",
                  color: "#FFFFFF",
                  fontSize: 9,
                  fontFamily: "DM Mono",
                  fontWeight: 500,
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  lineHeight: 1,
                }}
              >
                {alertCount > 9 ? "9+" : alertCount}
              </span>
            )}
            <Icon d={tab.d} size={22} />
            <span
              style={{
                fontSize: 10,
                fontFamily: "Inter",
                fontWeight: isActive ? 600 : 400,
                letterSpacing: "0.01em",
              }}
            >
              {tab.label}
            </span>
            {isActive && (
              <span
                style={{
                  position: "absolute",
                  top: 0,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 24,
                  height: 2,
                  borderRadius: "0 0 2px 2px",
                  background: "var(--brand-primary)",
                }}
              />
            )}
          </button>
        )
      })}
    </nav>
  )
}
