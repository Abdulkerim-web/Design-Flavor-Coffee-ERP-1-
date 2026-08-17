/**
 * Pagination — server-side compatible page navigation.
 * Caller passes page/total/perPage from backend response; component never
 * slices arrays or calculates which records to show.
 */
import type { FC, CSSProperties } from "react"

interface PaginationProps {
  page: number
  total: number // total record count from backend
  perPage: number
  onChange: (page: number) => void
  loading?: boolean
  style?: CSSProperties
}

export const Pagination: FC<PaginationProps> = ({
  page,
  total,
  perPage,
  onChange,
  loading,
  style,
}) => {
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  const from = total === 0 ? 0 : (page - 1) * perPage + 1
  const to = Math.min(page * perPage, total)

  if (totalPages <= 1 && total <= perPage) return null

  // Build visible page numbers with ellipsis
  const pages: Array<number | "…"> = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (page > 3) pages.push("…")
    for (
      let i = Math.max(2, page - 1);
      i <= Math.min(totalPages - 1, page + 1);
      i++
    )
      pages.push(i)
    if (page < totalPages - 2) pages.push("…")
    pages.push(totalPages)
  }

  const btnBase: CSSProperties = {
    minWidth: 32,
    height: 32,
    borderRadius: 7,
    border: "1px solid var(--border-neutral)",
    background: "var(--surface-01)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 13,
    fontFamily: "Inter, sans-serif",
    color: "var(--text-secondary)",
    transition: "all 0.15s ease",
    outline: "none",
    padding: "0 6px",
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 12,
        ...style,
      }}
    >
      {/* Result count */}
      <div
        style={{
          fontSize: 12.5,
          color: "var(--text-muted)",
          fontFamily: "DM Mono, monospace",
        }}
      >
        {loading
          ? "Loading…"
          : total === 0
            ? "No results"
            : `${from}–${to} of ${total}`}
      </div>

      {/* Page buttons */}
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        {/* Prev */}
        <button
          disabled={page <= 1 || loading}
          onClick={() => onChange(page - 1)}
          aria-label="Previous page"
          style={{
            ...btnBase,
            opacity: page <= 1 ? 0.4 : 1,
            cursor: page <= 1 ? "not-allowed" : "pointer",
          }}
          onMouseEnter={(e) => {
            if (page > 1) e.currentTarget.style.background = "var(--surface-02)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--surface-01)"
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
        </button>

        {pages.map((p, i) =>
          p === "…" ? (
            <span
              key={`e${i}`}
              style={{
                ...btnBase,
                border: "none",
                background: "none",
                cursor: "default",
                color: "var(--text-muted)",
              }}
            >
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p)}
              aria-label={`Page ${p}`}
              aria-current={p === page ? "page" : undefined}
              style={{
                ...btnBase,
                background: p === page ? "#2B4D3A" : "var(--surface-01)",
                color: p === page ? "#fff" : "var(--text-secondary)",
                borderColor: p === page ? "#2B4D3A" : "var(--border-neutral)",
                fontWeight: p === page ? 600 : 400,
              }}
              onMouseEnter={(e) => {
                if (p !== page)
                  e.currentTarget.style.background = "var(--surface-02)"
              }}
              onMouseLeave={(e) => {
                if (p !== page)
                  e.currentTarget.style.background = "var(--surface-01)"
              }}
            >
              {p}
            </button>
          ),
        )}

        {/* Next */}
        <button
          disabled={page >= totalPages || loading}
          onClick={() => onChange(page + 1)}
          aria-label="Next page"
          style={{
            ...btnBase,
            opacity: page >= totalPages ? 0.4 : 1,
            cursor: page >= totalPages ? "not-allowed" : "pointer",
          }}
          onMouseEnter={(e) => {
            if (page < totalPages)
              e.currentTarget.style.background = "var(--surface-02)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--surface-01)"
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
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default Pagination
