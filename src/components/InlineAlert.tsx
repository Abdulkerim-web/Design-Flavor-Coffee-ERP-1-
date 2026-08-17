/**
 * Inline alert — INFO / WARNING / DANGER / SUCCESS.
 * Structure: Icon + Title + Explanation + Optional Action.
 * Use for operational risks, system notices, and business-logic warnings.
 * Do NOT use for every success action — prefer toasts for confirmations.
 */
import type { FC, ReactNode } from "react"

export type AlertVariant = "info" | "warning" | "danger" | "success"

interface AlertConfig {
  icon: string
  color: string
  bg: string
  border: string
  darkColor: string
  darkBg: string
  darkBorder: string
}

const CONFIGS: Record<AlertVariant, AlertConfig> = {
  success: {
    icon: "M20 6L9 17l-5-5",
    color: "#15803D",
    bg: "#F0FDF4",
    border: "#BBF7D0",
    darkColor: "#4ADE80",
    darkBg: "rgba(34,197,94,0.08)",
    darkBorder: "rgba(34,197,94,0.2)",
  },
  info: {
    icon: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 16v-4M12 8h.01",
    color: "#1D4ED8",
    bg: "#EFF6FF",
    border: "#BFDBFE",
    darkColor: "#93C5FD",
    darkBg: "rgba(96,165,250,0.08)",
    darkBorder: "rgba(96,165,250,0.2)",
  },
  warning: {
    icon: "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01",
    color: "#92400E",
    bg: "#FFFBEB",
    border: "#FDE68A",
    darkColor: "#FCD34D",
    darkBg: "rgba(251,191,36,0.08)",
    darkBorder: "rgba(251,191,36,0.2)",
  },
  danger: {
    icon: "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01",
    color: "#991B1B",
    bg: "#FFF5F5",
    border: "#FECACA",
    darkColor: "#FCA5A5",
    darkBg: "rgba(248,113,113,0.08)",
    darkBorder: "rgba(248,113,113,0.2)",
  },
}

interface InlineAlertProps {
  variant: AlertVariant
  title: string
  description?: ReactNode
  action?: {
    label: string
    onClick: () => void
  }
  compact?: boolean
}

export const InlineAlert: FC<InlineAlertProps> = ({
  variant,
  title,
  description,
  action,
  compact = false,
}) => {
  const cfg = CONFIGS[variant]

  return (
    <div
      role={variant === "danger" || variant === "warning" ? "alert" : "status"}
      style={{
        display: "flex",
        gap: compact ? 10 : 12,
        padding: compact ? "10px 14px" : "12px 16px",
        borderRadius: "var(--radius-md, 8px)",
        border: `1px solid ${cfg.border}`,
        background: cfg.bg,
        alignItems: description ? "flex-start" : "center",
      }}
    >
      {/* Icon */}
      <div style={{ flexShrink: 0, marginTop: description ? 1 : 0 }}>
        <svg
          width={compact ? 14 : 16}
          height={compact ? 14 : 16}
          viewBox="0 0 24 24"
          fill="none"
          stroke={cfg.color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d={cfg.icon} />
        </svg>
      </div>

      {/* Body */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: compact ? 12.5 : 13,
            fontWeight: 600,
            color: cfg.color,
            fontFamily: "Inter, sans-serif",
            lineHeight: "18px",
          }}
        >
          {title}
        </p>
        {description && (
          <p
            style={{
              margin: "3px 0 0",
              fontSize: compact ? 12 : 12.5,
              color: cfg.color,
              opacity: 0.8,
              fontFamily: "Inter, sans-serif",
              lineHeight: "17px",
            }}
          >
            {description}
          </p>
        )}
        {action && (
          <button
            onClick={action.onClick}
            style={{
              marginTop: 8,
              padding: "4px 12px",
              borderRadius: "var(--radius-sm, 4px)",
              border: `1px solid ${cfg.border}`,
              background: "transparent",
              color: cfg.color,
              fontSize: 12,
              fontWeight: 600,
              fontFamily: "Inter, sans-serif",
              cursor: "pointer",
              transition: "background 0.15s ease",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = `${cfg.border}`)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  )
}

export default InlineAlert
