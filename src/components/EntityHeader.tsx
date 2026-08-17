/**
 * EntityHeader — detail-page header for a named ERP entity.
 * Renders: entity type eyebrow, title, status badge, key metadata, and action row.
 * Used on Orders, Customers, Payments, Deliveries, Expenses, etc.
 * Never calculates values — renders backend-supplied strings.
 */
import type { FC, ReactNode, CSSProperties } from "react"
import { useBreakpoint } from "../hooks/useBreakpoint"

interface MetaItem {
  label: string
  value: ReactNode
}

interface EntityHeaderAction {
  label: string
  onClick: () => void
  variant?: "primary" | "secondary" | "ghost" | "danger"
  icon?: string // SVG path d attribute
  disabled?: boolean
  hidden?: boolean // RBAC: hide when user lacks permission
}

interface EntityHeaderProps {
  /** Short type label, e.g. "Customer Order" or "Expense Report" */
  eyebrow?: string
  /** Primary identifier displayed large, e.g. "Order #10482" */
  title: string
  /** Optional subtitle, e.g. "Sidamo Natural — 120 KG" */
  subtitle?: string
  /** Status badge or pill — pass a StatusBadge component */
  status?: ReactNode
  /** Key metadata shown as a horizontal pill row below the title */
  meta?: MetaItem[]
  /** RBAC-filtered actions. Hide items with hidden:true */
  actions?: EntityHeaderAction[]
  /** Back navigation handler — renders a back arrow on mobile */
  onBack?: () => void
  /** Extra content below the action row */
  children?: ReactNode
  style?: CSSProperties
}

const VARIANT_CLASS: Record<string, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  ghost: "btn-ghost",
  danger: "btn-danger",
}

export const EntityHeader: FC<EntityHeaderProps> = ({
  eyebrow,
  title,
  subtitle,
  status,
  meta = [],
  actions = [],
  onBack,
  children,
  style,
}) => {
  const { isMobile } = useBreakpoint()
  const visibleActions = actions.filter((a) => !a.hidden)

  return (
    <div
      style={{
        padding: isMobile ? "14px 16px 12px" : "20px 32px 16px",
        borderBottom: "1px solid var(--border-neutral)",
        background: "var(--surface-01)",
        flexShrink: 0,
        ...style,
      }}
    >
      {/* Back button (mobile) */}
      {onBack && isMobile && (
        <button
          onClick={onBack}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--text-secondary)",
            fontSize: 13,
            fontFamily: "Inter",
            padding: "0 0 10px",
            marginLeft: -2,
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </button>
      )}

      {/* Top row: eyebrow + actions */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          {eyebrow && (
            <div
              style={{
                fontSize: 11,
                fontFamily: "DM Mono, monospace",
                fontWeight: 600,
                color: "var(--text-muted)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: 4,
              }}
            >
              {eyebrow}
            </div>
          )}

          {/* Title + status */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <h1
              style={{
                margin: 0,
                fontSize: isMobile ? 20 : 24,
                fontWeight: 700,
                color: "var(--text-primary)",
                letterSpacing: "-0.02em",
                lineHeight: "30px",
                fontFamily: "Inter, sans-serif",
              }}
            >
              {title}
            </h1>
            {status && (
              <div style={{ marginTop: 4, flexShrink: 0 }}>{status}</div>
            )}
          </div>

          {subtitle && (
            <div
              style={{
                fontSize: 14,
                color: "var(--text-secondary)",
                fontFamily: "Inter",
                marginTop: 3,
                lineHeight: "19px",
              }}
            >
              {subtitle}
            </div>
          )}
        </div>

        {/* Actions (desktop: inline; mobile: full-width row below) */}
        {visibleActions.length > 0 && !isMobile && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexShrink: 0,
            }}
          >
            {visibleActions.map((a, i) => (
              <button
                key={i}
                onClick={a.onClick}
                disabled={a.disabled}
                className={VARIANT_CLASS[a.variant ?? "secondary"]}
                style={{
                  height: 36,
                  fontSize: 13,
                  padding: "0 16px",
                  gap: 6,
                  opacity: a.disabled ? 0.5 : 1,
                }}
              >
                {a.icon && (
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d={a.icon} />
                  </svg>
                )}
                {a.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Meta row */}
      {meta.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "6px 20px",
            marginTop: 10,
            paddingTop: 10,
            borderTop: "1px solid var(--border-neutral)",
          }}
        >
          {meta.map((m, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 6,
                fontSize: 12.5,
                fontFamily: "Inter",
              }}
            >
              <span
                style={{ color: "var(--text-muted)", whiteSpace: "nowrap" }}
              >
                {m.label}:
              </span>
              <span
                style={{
                  color: "var(--text-secondary)",
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                }}
              >
                {m.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Actions row (mobile) */}
      {visibleActions.length > 0 && isMobile && (
        <div
          style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}
        >
          {visibleActions.map((a, i) => (
            <button
              key={i}
              onClick={a.onClick}
              disabled={a.disabled}
              className={VARIANT_CLASS[a.variant ?? "secondary"]}
              style={{
                height: 40,
                fontSize: 13,
                padding: "0 16px",
                gap: 6,
                flex: i === 0 && visibleActions.length === 1 ? 1 : undefined,
              }}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}

      {children && <div style={{ marginTop: 12 }}>{children}</div>}
    </div>
  )
}

export default EntityHeader
