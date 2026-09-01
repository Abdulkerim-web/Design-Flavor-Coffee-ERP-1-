/* Responsive: mobile ≤640 | tablet 641–1024 | laptop 1025–1440 | desktop >1440 */
import { useState, useRef, useEffect } from "react"
import { useBreakpoint } from "../hooks/useBreakpoint"
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts"

/* ── Data ───────────────────────────────────────────── */
const SUPPLIERS: any[] = []

type DetailTab = "overview" | "procurement" | "quality" | "docs"
type SortKey = "rating" | "volume" | "alpha"

/* ── Stars ──────────────────────────────────────────── */
function Stars({ value }: { value: number }) {
  return (
    <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill={i <= Math.round(value) ? "#B8860B" : "#E5E3DC"}
          stroke={i <= Math.round(value) ? "#B8860B" : "#D0CEC6"}
          strokeWidth="1.5"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
      <span
        style={{
          fontSize: 11.5,
          fontFamily: "DM Mono",
          color: "#B8860B",
          fontWeight: 600,
          marginLeft: 2,
        }}
      >
        {value.toFixed(1)}
      </span>
    </div>
  )
}

function RadarTip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  return (
    <div
      style={{
        background: "#1F2937",
        color: "#FFF",
        borderRadius: 8,
        padding: "8px 12px",
        fontSize: 12,
        fontFamily: "DM Mono",
      }}
    >
      <div
        style={{ color: "var(--text-muted)", fontSize: 10, marginBottom: 3 }}
      >
        {payload[0]?.payload?.axis}
      </div>
      <div style={{ fontWeight: 700, color: "#6EE7B7" }}>
        {payload[0]?.value}/100
      </div>
    </div>
  )
}

function PayBadge({ status }: { status: string }) {
  const m: Record<string, { bg: string text: string }> = {
    paid: { bg: "#F0FDF4", text: "#15803D" },
    pending: { bg: "#EFF6FF", text: "#1D4ED8" },
    overdue: { bg: "#FEF2F2", text: "#B91C1C" },
  }
  const s = m[status] ?? { bg: "#F5F3EF", text: "#6B7280" }
  return (
    <span
      style={{
        fontSize: 11.5,
        fontFamily: "DM Mono",
        padding: "2px 9px",
        borderRadius: 999,
        background: s.bg,
        color: s.text,
        fontWeight: 600,
        textTransform: "capitalize" as const,
      }}
    >
      {status}
    </span>
  )
}

function QcBadge({ status }: { status: string }) {
  const m: Record<string, { bg: string text: string label: string }> = {
    approved: { bg: "#F0FDF4", text: "#15803D", label: "Approved" },
    hold: { bg: "#FEF3C7", text: "#B45309", label: "QC Hold" },
    rejected: { bg: "#FEF2F2", text: "#B91C1C", label: "Rejected" },
  }
  const s = m[status] ?? { bg: "#F5F3EF", text: "#6B7280", label: status }
  return (
    <span
      style={{
        fontSize: 11.5,
        fontFamily: "DM Mono",
        padding: "2px 9px",
        borderRadius: 999,
        background: s.bg,
        color: s.text,
        fontWeight: 600,
      }}
    >
      {s.label}
    </span>
  )
}

/* ── Main ───────────────────────────────────────────── */
export default function Suppliers() {
  const { isMobile, isTablet, isLaptop, isDesktop, isNarrow } = useBreakpoint()
  const pagePadding = isMobile
    ? "12px 12px"
    : isTablet
      ? "18px 20px"
      : isLaptop
        ? "24px 28px"
        : "28px 32px"
  const maxWidthStyle = isDesktop ? { maxWidth: 1600, margin: "0 auto" } : {}
  const [selected, setSelected] = useState(SUPPLIERS[0])
  const [detailTab, setDetailTab] = useState<DetailTab>("overview")
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState<SortKey>("rating")
  const [sortOpen, setSortOpen] = useState(false)
  const sortRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node))
        setSortOpen(false)
    }
    if (sortOpen) document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [sortOpen])

  const sortedList = [...SUPPLIERS]
    .filter(
      (s) =>
        !search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.origin.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "rating"
        ? b.rating - a.rating
        : sort === "volume"
          ? b.totalKg - a.totalKg
          : a.shortName.localeCompare(b.shortName),
    )

  const SORT_LABELS: Record<SortKey, string> = {
    rating: "Rating",
    volume: "Volume",
    alpha: "A → Z",
  }

  return (
    <div
      className="page-enter"
      style={{
        display: "flex",
        flexDirection: isNarrow ? "column" : "row",
        height: isNarrow ? "auto" : "calc(100vh - 64px)",
        overflow: isNarrow ? "visible" : "hidden",
        background: "var(--bg-primary)",
        ...maxWidthStyle,
      }}
    >
      {/* ═══ LEFT MASTER LIST ═══════════════════════════ */}
      <aside
        style={{
          width: isNarrow ? "100%" : 360,
          minWidth: isNarrow ? "100%" : 360,
          flexShrink: 0,
          background: "var(--surface-01)",
          borderRight: isNarrow ? "none" : "1px solid var(--border-neutral)",
          borderBottom: isNarrow ? "1px solid var(--border-neutral)" : "none",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          maxHeight: isNarrow ? 400 : undefined,
          overflowY: isNarrow ? "auto" : undefined,
        }}
      >
        <div
          style={{
            padding: "20px 16px 14px",
            borderBottom: "1px solid var(--border-neutral)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 14,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: "var(--text-primary)",
                }}
              >
                Suppliers
              </div>
              <div
                style={{
                  fontSize: 11.5,
                  fontFamily: "DM Mono",
                  color: "var(--text-muted)",
                  marginTop: 1,
                }}
              >
                {SUPPLIERS.filter((s) => s.status === "active").length} active
                suppliers
              </div>
            </div>
            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "6px 11px",
                borderRadius: 7,
                border: "none",
                background: "#2B4D3A",
                color: "#FFFFFF",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
                fontFamily: "Inter",
                boxShadow: "0 1px 3px rgba(43,77,58,0.3)",
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add
            </button>
          </div>

          <div style={{ position: "relative", marginBottom: 10 }}>
            <svg
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
              }}
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#9CA3AF"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search suppliers, origins..."
              style={{
                width: "100%",
                paddingLeft: 32,
                paddingRight: 10,
                height: 34,
                borderRadius: 8,
                border: "1.5px solid var(--border-neutral)",
                background: "var(--bg-primary)",
                fontSize: 13,
                color: "var(--text-primary)",
                fontFamily: "Inter",
                outline: "none",
                boxSizing: "border-box" as const,
              }}
            />
          </div>

          <div
            ref={sortRef}
            style={{ position: "relative", display: "inline-block" }}
          >
            <button
              onClick={() => setSortOpen((v) => !v)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "4px 10px",
                borderRadius: 6,
                border: "1px solid var(--border-neutral)",
                background: "var(--bg-primary)",
                cursor: "pointer",
                fontSize: 12,
                color: "var(--text-secondary)",
                fontFamily: "Inter",
              }}
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="15" y2="12" />
                <line x1="3" y1="18" x2="9" y2="18" />
              </svg>
              Sort:{" "}
              <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                {SORT_LABELS[sort]}
              </span>
            </button>
            {sortOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 4px)",
                  left: 0,
                  minWidth: 150,
                  background: "var(--surface-01)",
                  border: "1px solid var(--border-neutral)",
                  borderRadius: 8,
                  boxShadow: "0 8px 16px rgba(0,0,0,0.08)",
                  zIndex: 50,
                  overflow: "hidden",
                }}
              >
                {(["rating", "volume", "alpha"] as SortKey[]).map((k) => (
                  <button
                    key={k}
                    onClick={() => {
                      setSort(k)
                      setSortOpen(false)
                    }}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "8px 14px",
                      background: sort === k ? "#F5F3EF" : "none",
                      border: "none",
                      textAlign: "left" as const,
                      cursor: "pointer",
                      fontSize: 13,
                      color: sort === k ? "#2B4D3A" : "#1F2937",
                      fontWeight: sort === k ? 600 : 400,
                      fontFamily: "Inter",
                    }}
                    onMouseEnter={(e) => {
                      if (sort !== k)
                        e.currentTarget.style.background = "#FAFAF8"
                    }}
                    onMouseLeave={(e) => {
                      if (sort !== k) e.currentTarget.style.background = "none"
                    }}
                  >
                    {SORT_LABELS[k]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "8px 10px" }}>
          {sortedList.length === 0 && (
            <div
              style={{
                padding: "32px 16px",
                textAlign: "center" as const,
                color: "var(--text-muted)",
                fontSize: 13,
              }}
            >
              No results for "{search}"
            </div>
          )}
          {sortedList.map((s) => {
            const isActive = selected.id === s.id
            return (
              <button
                key={s.id}
                onClick={() => {
                  setSelected(s)
                  setDetailTab("overview")
                }}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "12px 14px",
                  marginBottom: 4,
                  borderRadius: 10,
                  border: `1.5px solid ${isActive ? s.color : "transparent"}`,
                  background: isActive ? `${s.color}08` : "transparent",
                  cursor: "pointer",
                  textAlign: "left" as const,
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "#F5F3EF"
                    e.currentTarget.style.border = "1.5px solid #E5E3DC"
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent"
                    e.currentTarget.style.border = "1.5px solid transparent"
                  }
                }}
              >
                <div
                  style={{ display: "flex", gap: 10, alignItems: "flex-start" }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      flexShrink: 0,
                      background: isActive ? s.color : "#F5F3EF",
                      border: `1.5px solid ${isActive ? s.color : "#E5E3DC"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 700,
                      color: isActive ? "#FFFFFF" : "#6B7280",
                      transition: "all 0.15s",
                    }}
                  >
                    {s.initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13.5,
                        fontWeight: 600,
                        color: "var(--text-primary)",
                        lineHeight: "18px",
                        marginBottom: 2,
                      }}
                    >
                      {s.shortName}
                    </div>
                    <div
                      style={{
                        fontSize: 11.5,
                        color: "var(--text-muted)",
                        marginBottom: 7,
                      }}
                    >
                      {s.origin}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 8,
                      }}
                    >
                      <Stars value={s.rating} />
                      <span
                        style={{
                          fontSize: 11,
                          fontFamily: "DM Mono",
                          color: "var(--text-muted)",
                        }}
                      >
                        {s.deliveries} deliveries
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: 10,
                        paddingTop: 8,
                        borderTop: `1px solid ${
                          isActive ? `${s.color}22` : "#F5F3EF"
                        }`,
                      }}
                    >
                      {[
                        {
                          k: "Volume",
                          v: `${(s.totalKg / 1000).toFixed(0)}K KG`,
                          c: "#1F2937",
                        },
                        {
                          k: "Approval",
                          v: `${s.approvalRate}%`,
                          c: s.approvalRate >= 95 ? "#16A34A" : "#F59E0B",
                        },
                        { k: "QC Avg", v: `${s.avgQcScore}`, c: "#1F2937" },
                      ].map((m, i) => (
                        <div key={m.k} style={{ flex: 1 }}>
                          {i > 0 && (
                            <div
                              style={{
                                width: 1,
                                height: "100%",
                                background: "var(--border-neutral)",
                                float: "left",
                                marginRight: 10,
                              }}
                            />
                          )}
                          <div
                            style={{
                              fontSize: 9.5,
                              fontFamily: "DM Mono",
                              color: "var(--text-muted)",
                              textTransform: "uppercase" as const,
                              letterSpacing: "0.05em",
                            }}
                          >
                            {m.k}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              fontFamily: "DM Mono",
                              fontWeight: 600,
                              color: m.c,
                              marginTop: 1,
                            }}
                          >
                            {m.v}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </aside>

      {/* ═══ RIGHT DETAIL CANVAS ════════════════════════ */}
      <main
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          background: "var(--bg-primary)",
        }}
      >
        {/* Profile Header */}
        <div
          style={{
            background: "var(--surface-01)",
            borderBottom: "1px solid var(--border-neutral)",
            padding: "24px 32px 0",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 20,
              gap: 20,
              flexWrap: "wrap" as const,
            }}
          >
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 12,
                  flexShrink: 0,
                  background: selected.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#FFFFFF",
                  boxShadow: `0 4px 12px ${selected.color}40`,
                }}
              >
                {selected.initials}
              </div>
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    flexWrap: "wrap" as const,
                    marginBottom: 6,
                  }}
                >
                  <h1
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      color: "var(--text-primary)",
                      margin: 0,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {selected.name}
                  </h1>
                  <span
                    style={{
                      fontSize: 11,
                      fontFamily: "DM Mono",
                      padding: "2px 8px",
                      borderRadius: 999,
                      background: "#F0FDF4",
                      color: "#15803D",
                      border: "1px solid #DCFCE7",
                      fontWeight: 600,
                    }}
                  >
                    Active
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 16,
                    flexWrap: "wrap" as const,
                  }}
                >
                  {[
                    {
                      path: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z",
                      text: selected.origin,
                    },
                    {
                      path: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z",
                      text: selected.phone,
                    },
                    {
                      path: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
                      text: selected.email,
                    },
                    {
                      path: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
                      text: `TIN: ${selected.tin}`,
                    },
                  ].map((item, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        fontSize: 12.5,
                        color: "var(--text-secondary)",
                      }}
                    >
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#9CA3AF"
                        strokeWidth="1.75"
                      >
                        <path d={item.path} />
                      </svg>
                      {item.text}
                    </div>
                  ))}
                </div>
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 12,
                    color: "var(--text-muted)",
                  }}
                >
                  📍 {selected.address}
                </div>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                gap: 8,
                flexShrink: 0,
                flexWrap: "wrap" as const,
              }}
            >
              <button
                className="btn-secondary"
                style={{ gap: 5, fontSize: 12.5 }}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Edit Profile
              </button>
              <button
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "7px 14px",
                  borderRadius: 8,
                  border: "none",
                  background: "#2B4D3A",
                  color: "#FFFFFF",
                  cursor: "pointer",
                  fontSize: 12.5,
                  fontWeight: 600,
                  fontFamily: "Inter",
                  boxShadow: "0 1px 3px rgba(43,77,58,0.3)",
                }}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Create PO
              </button>
              <button
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "7px 14px",
                  borderRadius: 8,
                  border: "1.5px solid #FECACA",
                  background: "#FEF2F2",
                  color: "#DC2626",
                  cursor: "pointer",
                  fontSize: 12.5,
                  fontWeight: 600,
                  fontFamily: "Inter",
                }}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                </svg>
                Deactivate
              </button>
            </div>
          </div>
          {/* Tabs */}
          <div style={{ display: "flex" }}>
            {([
              { id: "overview", label: "Overview" },
              { id: "procurement", label: "Procurement History" },
              { id: "quality", label: "Quality Performance" },
              { id: "docs", label: "Document Vault" },
            ] as { id: DetailTab label: string }[]).map((t) => (
              <button
                key={t.id}
                onClick={() => setDetailTab(t.id)}
                style={{
                  padding: "11px 18px",
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  borderBottom: `2.5px solid ${
                    detailTab === t.id ? "#2B4D3A" : "transparent"
                  }`,
                  color: detailTab === t.id ? "#2B4D3A" : "#6B7280",
                  fontSize: 13.5,
                  fontWeight: detailTab === t.id ? 600 : 400,
                  fontFamily: "Inter",
                  transition: "all 0.15s",
                  marginBottom: -1,
                  whiteSpace: "nowrap" as const,
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: pagePadding }}>
          {/* ── OVERVIEW ────────────────────────────── */}
          {detailTab === "overview" && (
            <div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile
                    ? "repeat(2,1fr)"
                    : isTablet
                      ? "repeat(2,1fr)"
                      : "repeat(4,1fr)",
                  gap: 16,
                  marginBottom: 24,
                }}
              >
                {[
                  {
                    label: "Total Volume Purchased",
                    value: `${selected.totalKg.toLocaleString()} KG`,
                    sub: `${selected.deliveries} deliveries`,
                    icon: "",
                    c: "#2B4D3A",
                  },
                  {
                    label: "Total Financial Spend",
                    value: `ETB ${(selected.totalSpend / 1000000).toFixed(2)}M`,
                    sub: "Lifetime payments",
                    icon: "",
                    c: "#1F2937",
                  },
                  {
                    label: "Avg Moisture Score",
                    value: `${selected.avgMoisture}%`,
                    sub:
                      selected.avgMoisture <= 12
                        ? "In-Spec ✓"
                        : "Above Threshold",
                    icon: "💧",
                    c: selected.avgMoisture <= 12 ? "#16A34A" : "#DC2626",
                  },
                  {
                    label: "Lot Approval Rate",
                    value: `${selected.approvalRate}%`,
                    sub: `${selected.rejectionRate}% rejection`,
                    icon: "",
                    c: selected.approvalRate >= 95 ? "#16A34A" : "#F59E0B",
                  },
                ].map((c) => (
                  <div key={c.label} className="stat-card">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 12,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--text-secondary)",
                          fontWeight: 500,
                          lineHeight: "16px",
                        }}
                      >
                        {c.label}
                      </div>
                      <span style={{ fontSize: 18 }}>{c.icon}</span>
                    </div>
                    <div
                      style={{
                        fontSize: 22,
                        fontWeight: 700,
                        color: c.c,
                        fontFamily: "DM Mono",
                        letterSpacing: "-0.02em",
                        marginBottom: 5,
                      }}
                    >
                      {c.value}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {c.sub}
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isNarrow ? "1fr" : "1fr 1fr",
                  gap: 16,
                }}
              >
                <div className="stat-card">
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      marginBottom: 14,
                    }}
                  >
                    Supplier Profile
                  </div>
                  {[
                    ["Supplier ID", selected.id],
                    ["Contact Person", selected.contact],
                    ["Phone", selected.phone],
                    ["Email", selected.email],
                    ["TIN Number", selected.tin],
                    ["Region", selected.region],
                  ].map(([k, v]) => (
                    <div
                      key={String(k)}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        paddingBottom: 9,
                        marginBottom: 9,
                        borderBottom: "1px solid #F5F3EF",
                      }}
                    >
                      <span
                        style={{ fontSize: 12.5, color: "var(--text-muted)" }}
                      >
                        {k}
                      </span>
                      <span
                        style={{
                          fontSize: 12.5,
                          fontFamily:
                            k === "Supplier ID" ||
                            k === "TIN Number" ||
                            k === "Phone"
                              ? "DM Mono"
                              : "Inter",
                          color: "var(--text-primary)",
                          fontWeight: 500,
                        }}
                      >
                        {v}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="stat-card">
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      marginBottom: 14,
                    }}
                  >
                    Coffee Varieties
                  </div>
                  {selected.variety.map((v) => (
                    <div
                      key={v}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 12px",
                        background: "var(--bg-primary)",
                        borderRadius: 8,
                        border: "1px solid var(--border-neutral)",
                        marginBottom: 8,
                      }}
                    >
                      <span style={{ fontSize: 16 }}>🫘</span>
                      <span
                        style={{
                          fontSize: 13.5,
                          fontWeight: 600,
                          color: "var(--text-primary)",
                        }}
                      >
                        {v}
                      </span>
                    </div>
                  ))}
                  <div
                    style={{
                      paddingTop: 14,
                      borderTop: "1px solid var(--border-neutral)",
                      marginTop: 6,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--text-muted)",
                        marginBottom: 10,
                      }}
                    >
                      Overall Performance Rating
                    </div>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 12 }}
                    >
                      <div
                        style={{
                          fontSize: 36,
                          fontFamily: "DM Mono",
                          fontWeight: 700,
                          color: "#B8860B",
                        }}
                      >
                        {selected.rating.toFixed(1)}
                      </div>
                      <div>
                        <Stars value={selected.rating} />
                        <div
                          style={{
                            fontSize: 11.5,
                            color: "var(--text-muted)",
                            marginTop: 4,
                          }}
                        >
                          Based on {selected.deliveries} deliveries
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── PROCUREMENT HISTORY ─────────────────── */}
          {detailTab === "procurement" && (
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: "var(--text-primary)",
                    }}
                  >
                    Procurement History
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "var(--text-secondary)",
                      marginTop: 3,
                    }}
                  >
                    All purchase orders with {selected.shortName}
                  </div>
                </div>
                <button className="btn-secondary" style={{ gap: 5 }}>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                  </svg>
                  Export CSV
                </button>
              </div>
              {isMobile ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 0,
                    background: "var(--surface-01)",
                    border: "1px solid var(--border-neutral)",
                    borderRadius: 10,
                    overflow: "hidden",
                  }}
                >
                  {selected.procurement.map((p) => (
                    <div
                      key={p.id}
                      style={{
                        padding: "14px 12px",
                        borderBottom: "1px solid var(--border-neutral)",
                        background: "var(--surface-01)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: 6,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 13.5,
                            fontWeight: 600,
                            color: "var(--text-primary)",
                            fontFamily: "DM Mono",
                          }}
                        >
                          {p.id}
                        </span>
                        <QcBadge status={p.qc} />
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--text-secondary)",
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "4px 12px",
                          marginBottom: 6,
                        }}
                      >
                        <span>Date: {p.date}</span>
                        <span>Lot: {p.lot}</span>
                        <span>Weight: {p.weight.toLocaleString()} KG</span>
                        <span>Cost: {p.cost.toLocaleString()} ETB</span>
                      </div>
                      <PayBadge status={p.payment} />
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className="stat-card"
                  style={{
                    padding: 0,
                    overflow: "hidden",
                    overflowX: isTablet ? "auto" : undefined,
                  }}
                >
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr
                        style={{
                          background: "var(--bg-primary)",
                          borderBottom: "1px solid var(--border-neutral)",
                        }}
                      >
                        {[
                          "Order ID",
                          "Date",
                          "Origin Lot",
                          "Weight (KG)",
                          "Total Cost (ETB)",
                          "QC Status",
                          "Payment",
                        ].map((h) => (
                          <th
                            key={h}
                            style={{
                              padding: "10px 16px",
                              textAlign: "left" as const,
                              fontSize: 10.5,
                              fontFamily: "DM Mono",
                              color: "var(--text-muted)",
                              letterSpacing: "0.06em",
                              textTransform: "uppercase" as const,
                              fontWeight: 500,
                              whiteSpace: "nowrap" as const,
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selected.procurement.map((p, i) => (
                        <tr
                          key={p.id}
                          style={{
                            borderBottom:
                              i < selected.procurement.length - 1
                                ? "1px solid #F5F3EF"
                                : "none",
                            transition: "background 0.1s",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = "#FAFAF8")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = "transparent")
                          }
                        >
                          <td
                            style={{
                              padding: "13px 16px",
                              fontFamily: "DM Mono",
                              fontSize: 12.5,
                              color: "#2B4D3A",
                              fontWeight: 600,
                            }}
                          >
                            {p.id}
                          </td>
                          <td
                            style={{
                              padding: "13px 16px",
                              fontFamily: "DM Mono",
                              fontSize: 12,
                              color: "var(--text-muted)",
                            }}
                          >
                            {p.date}
                          </td>
                          <td
                            style={{
                              padding: "13px 16px",
                              fontFamily: "DM Mono",
                              fontSize: 12,
                              color: "var(--text-secondary)",
                            }}
                          >
                            {p.lot}
                          </td>
                          <td
                            style={{
                              padding: "13px 16px",
                              fontFamily: "DM Mono",
                              fontSize: 13,
                              fontWeight: 600,
                              color: "var(--text-primary)",
                            }}
                          >
                            {p.weight.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                            })}
                          </td>
                          <td
                            style={{
                              padding: "13px 16px",
                              fontFamily: "DM Mono",
                              fontSize: 13,
                              fontWeight: 600,
                              color: "var(--text-primary)",
                            }}
                          >
                            {p.cost.toLocaleString()}
                          </td>
                          <td style={{ padding: "13px 16px" }}>
                            <QcBadge status={p.qc} />
                          </td>
                          <td style={{ padding: "13px 16px" }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                              }}
                            >
                              <PayBadge status={p.payment} />
                              {p.payment === "overdue" && (
                                <button
                                  style={{
                                    padding: "3px 8px",
                                    borderRadius: 5,
                                    border: "none",
                                    background: "#2B4D3A",
                                    color: "#FFFFFF",
                                    cursor: "pointer",
                                    fontSize: 11,
                                    fontWeight: 600,
                                    fontFamily: "Inter",
                                  }}
                                >
                                  Pay Now
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr
                        style={{
                          background: "var(--bg-primary)",
                          borderTop: "2px solid #E5E3DC",
                        }}
                      >
                        <td
                          colSpan={3}
                          style={{
                            padding: "11px 16px",
                            fontSize: 12.5,
                            fontWeight: 700,
                            color: "var(--text-secondary)",
                            fontFamily: "DM Mono",
                          }}
                        >
                          TOTAL
                        </td>
                        <td
                          style={{
                            padding: "11px 16px",
                            fontFamily: "DM Mono",
                            fontSize: 13,
                            fontWeight: 700,
                            color: "var(--text-primary)",
                          }}
                        >
                          {selected.procurement
                            .reduce((s, p) => s + p.weight, 0)
                            .toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                            })}{" "}
                          KG
                        </td>
                        <td
                          style={{
                            padding: "11px 16px",
                            fontFamily: "DM Mono",
                            fontSize: 13,
                            fontWeight: 700,
                            color: "var(--text-primary)",
                          }}
                        >
                          {selected.procurement
                            .reduce((s, p) => s + p.cost, 0)
                            .toLocaleString()}{" "}
                          ETB
                        </td>
                        <td colSpan={2} />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── QUALITY PERFORMANCE ─────────────────── */}
          {detailTab === "quality" && (
            <div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  marginBottom: 3,
                }}
              >
                Quality Performance Scorecard
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "var(--text-secondary)",
                  marginBottom: 24,
                }}
              >
                Attribute-level analysis from all inspected lots —{" "}
                {selected.shortName}
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.1fr 1fr",
                  gap: 20,
                }}
              >
                <div className="stat-card">
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      marginBottom: 3,
                    }}
                  >
                    Attribute Radar
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--text-secondary)",
                      marginBottom: 16,
                    }}
                  >
                    5-axis quality profile / 100
                  </div>
                  <ResponsiveContainer width="100%" height={280}>
                    <RadarChart
                      data={selected.radarData}
                      margin={{ top: 10, right: 30, bottom: 10, left: 30 }}
                    >
                      <PolarGrid stroke="#E5E3DC" />
                      <PolarAngleAxis
                        dataKey="axis"
                        tick={{
                          fill: "#6B7280",
                          fontSize: 11,
                          fontFamily: "DM Mono",
                        }}
                      />
                      <Radar
                        dataKey="value"
                        stroke={selected.color}
                        fill={selected.color}
                        fillOpacity={0.15}
                        strokeWidth={2}
                        dot={{ fill: selected.color, r: 4 }}
                      />
                      <Tooltip content={<RadarTip />} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div className="stat-card">
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      marginBottom: 16,
                    }}
                  >
                    Score Breakdown
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 15,
                    }}
                  >
                    {selected.radarData.map((attr) => {
                      const color =
                        attr.value >= 90
                          ? "#16A34A"
                          : attr.value >= 80
                            ? "#2563EB"
                            : attr.value >= 70
                              ? "#F59E0B"
                              : "#DC2626"
                      return (
                        <div key={attr.axis}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              marginBottom: 6,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 13,
                                color: "var(--text-primary)",
                                fontWeight: 500,
                              }}
                            >
                              {attr.axis}
                            </span>
                            <span
                              style={{
                                fontSize: 13,
                                fontFamily: "DM Mono",
                                fontWeight: 700,
                                color,
                              }}
                            >
                              {attr.value}/100
                            </span>
                          </div>
                          <div
                            style={{
                              height: 6,
                              background: "var(--border-neutral)",
                              borderRadius: 99,
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                height: "100%",
                                borderRadius: 99,
                                width: `${attr.value}%`,
                                background: `linear-gradient(90deg, ${color}80, ${color})`,
                                transition:
                                  "width 0.7s cubic-bezier(0.16,1,0.3,1)",
                              }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div
                    style={{
                      marginTop: 20,
                      paddingTop: 16,
                      borderTop: "1px solid var(--border-neutral)",
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 10,
                    }}
                  >
                    {[
                      {
                        label: "Avg QC Score",
                        value: `${selected.avgQcScore}/100`,
                        c: "#2B4D3A",
                      },
                      {
                        label: "Approval Rate",
                        value: `${selected.approvalRate}%`,
                        c: selected.approvalRate >= 95 ? "#16A34A" : "#F59E0B",
                      },
                      {
                        label: "Avg Moisture",
                        value: `${selected.avgMoisture}%`,
                        c: selected.avgMoisture <= 12 ? "#16A34A" : "#DC2626",
                      },
                      {
                        label: "Rejection Rate",
                        value: `${selected.rejectionRate}%`,
                        c: selected.rejectionRate === 0 ? "#16A34A" : "#DC2626",
                      },
                    ].map((m) => (
                      <div
                        key={m.label}
                        style={{
                          padding: "10px 12px",
                          background: "var(--bg-primary)",
                          borderRadius: 8,
                          border: "1px solid var(--border-neutral)",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 11,
                            color: "var(--text-muted)",
                            marginBottom: 4,
                          }}
                        >
                          {m.label}
                        </div>
                        <div
                          style={{
                            fontSize: 16,
                            fontFamily: "DM Mono",
                            fontWeight: 700,
                            color: m.c,
                          }}
                        >
                          {m.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── DOCUMENT VAULT ──────────────────────── */}
          {detailTab === "docs" && (
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: "var(--text-primary)",
                    }}
                  >
                    Document Vault
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "var(--text-secondary)",
                      marginTop: 3,
                    }}
                  >
                    Tax documents, supplier agreements & quality certificates
                  </div>
                </div>
                <button className="btn-secondary" style={{ gap: 5 }}>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Upload Document
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {selected.docs.map((doc, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "14px 20px",
                      background: "var(--surface-01)",
                      border: "1px solid var(--border-neutral)",
                      borderRadius: 10,
                      transition: "all 0.15s",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#2B4D3A"
                      e.currentTarget.style.background = "#FAFAF8"
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#E5E3DC"
                      e.currentTarget.style.background = "#FFFFFF"
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 48,
                        borderRadius: 6,
                        background: "var(--surface-02)",
                        border: "1px solid var(--border-neutral)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 20,
                        flexShrink: 0,
                        position: "relative",
                      }}
                    >
                      {doc.icon}
                      <div
                        style={{
                          position: "absolute",
                          bottom: -1,
                          right: -1,
                          padding: "1px 4px",
                          background: "#DC2626",
                          color: "#FFF",
                          fontSize: 7,
                          fontWeight: 700,
                          borderRadius: "3px 0 3px 0",
                          fontFamily: "DM Mono",
                        }}
                      >
                        PDF
                      </div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13.5,
                          fontWeight: 600,
                          color: "var(--text-primary)",
                          marginBottom: 3,
                        }}
                      >
                        {doc.name}
                      </div>
                      <div style={{ display: "flex", gap: 12 }}>
                        <span
                          style={{
                            fontSize: 11.5,
                            fontFamily: "DM Mono",
                            color: "var(--text-muted)",
                          }}
                        >
                          {doc.size}
                        </span>
                        <span
                          style={{
                            fontSize: 11.5,
                            fontFamily: "DM Mono",
                            color: "var(--text-muted)",
                          }}
                        >
                          Uploaded {doc.date}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {[
                        {
                          title: "Preview",
                          path: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M15 11a3 3 0 11-6 0 3 3 0 016 0z",
                        },
                        {
                          title: "Download",
                          path: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3",
                        },
                      ].map((btn) => (
                        <button
                          key={btn.title}
                          onClick={(e) => e.stopPropagation()}
                          title={btn.title}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 7,
                            border: "1px solid var(--border-neutral)",
                            background: "var(--bg-primary)",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "var(--text-secondary)",
                            transition: "all 0.12s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#2B4D3A"
                            e.currentTarget.style.color = "#FFF"
                            e.currentTarget.style.borderColor = "#2B4D3A"
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "#FAFAF8"
                            e.currentTarget.style.color = "#6B7280"
                            e.currentTarget.style.borderColor = "#E5E3DC"
                          }}
                        >
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d={btn.path} />
                          </svg>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                <div
                  style={{
                    padding: "28px 20px",
                    border: "2px dashed #E5E3DC",
                    borderRadius: 10,
                    textAlign: "center" as const,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#2B4D3A"
                    e.currentTarget.style.background = "#F5F3EF"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#E5E3DC"
                    e.currentTarget.style.background = "transparent"
                  }}
                >
                  <div style={{ fontSize: 24, marginBottom: 8 }}>📎</div>
                  <div
                    style={{
                      fontSize: 13.5,
                      fontWeight: 500,
                      color: "var(--text-secondary)",
                      marginBottom: 3,
                    }}
                  >
                    Drop documents here to upload
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    PDF, DOCX, XLSX — max 10 MB
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
