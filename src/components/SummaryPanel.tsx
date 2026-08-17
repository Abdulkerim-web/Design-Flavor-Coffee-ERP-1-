/**
 * SummaryPanel — structured label/value metadata display for detail pages.
 * Renders backend-supplied values. Never calculates or derives values.
 *
 * Used for: order summaries, customer details, payment info, employee profiles.
 */
import type { FC, ReactNode, CSSProperties } from "react"

export interface SummaryRow {
  label: string
  value: ReactNode
  /** Full-width row (e.g. for descriptions, addresses) */
  wide?: boolean
  /** Monospace font hint (e.g. amounts, references, weights) */
  mono?: boolean
  /** Suppress row when value is empty/null */
  hideIfEmpty?: boolean
}

interface SummaryPanelProps {
  title?: string
  rows: SummaryRow[]
  /** Number of columns on desktop (default 2) */
  cols?: 1 | 2 | 3
  style?: CSSProperties
  children?: ReactNode
}

export const SummaryPanel: FC<SummaryPanelProps> = ({
  title,
  rows,
  cols = 2,
  style,
  children,
}) => {
  const visible = rows.filter(
    (r) =>
      !r.hideIfEmpty ||
      (r.value !== null && r.value !== undefined && r.value !== ""),
  )

  return (
    <div
      style={{
        background: "var(--surface-01)",
        border: "1px solid var(--border-neutral)",
        borderRadius: 12,
        overflow: "hidden",
        ...style,
      }}
    >
      {title && (
        <div
          style={{
            padding: "11px 16px",
            borderBottom: "1px solid var(--border-neutral)",
            fontSize: 12,
            fontWeight: 700,
            color: "var(--text-secondary)",
            fontFamily: "Inter, sans-serif",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            background: "var(--surface-02)",
          }}
        >
          {title}
        </div>
      )}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: 0,
          padding: "4px 0",
        }}
      >
        {visible.map((row, i) => (
          <div
            key={i}
            style={{
              gridColumn: row.wide ? `1 / -1` : undefined,
              padding: "9px 16px",
              borderBottom:
                i < visible.length - 1
                  ? "1px solid var(--border-neutral)"
                  : "none",
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "var(--text-muted)",
                fontFamily: "Inter, sans-serif",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              {row.label}
            </span>
            <span
              style={{
                fontSize: 13.5,
                color: "var(--text-primary)",
                fontWeight: 500,
                fontFamily: row.mono
                  ? "DM Mono, monospace"
                  : "Inter, sans-serif",
                lineHeight: "18px",
              }}
            >
              {row.value ?? (
                <span
                  style={{
                    color: "var(--text-muted)",
                    fontStyle: "italic",
                    fontWeight: 400,
                  }}
                >
                  —
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
      {children && (
        <div
          style={{
            padding: "12px 16px",
            borderTop: "1px solid var(--border-neutral)",
          }}
        >
          {children}
        </div>
      )}
    </div>
  )
}

/**
 * MetaRow — inline label: value for use in compact header meta strips.
 */
export const MetaRow: FC<{ label: string value: ReactNode mono?: boolean }> = ({
  label,
  value,
  mono,
}) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
    <span
      style={{
        fontSize: 10.5,
        fontWeight: 600,
        color: "var(--text-muted)",
        fontFamily: "Inter",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
      }}
    >
      {label}
    </span>
    <span
      style={{
        fontSize: 13,
        color: "var(--text-primary)",
        fontWeight: 500,
        fontFamily: mono ? "DM Mono, monospace" : "Inter",
      }}
    >
      {value ?? "—"}
    </span>
  </div>
)

export default SummaryPanel
