/* Responsive: mobile ≤640 | tablet 641–1024 | laptop 1025–1440 | desktop >1440 */
import { useState } from "react"
import { useBreakpoint } from "../hooks/useBreakpoint"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts"

/* ── Historical yield data — last 20 batches ─────────── */
const HISTORY = [
  {
    batch: "BAT-072",
    yield: 84.2,
    input: 30,
    output: 25.26,
    date: "2026-07-01",
    profile: "Guji Medium",
  },
  {
    batch: "BAT-073",
    yield: 86.1,
    input: 30,
    output: 25.83,
    date: "2026-07-02",
    profile: "Guji Medium",
  },
  {
    batch: "BAT-074",
    yield: 83.5,
    input: 30,
    output: 25.05,
    date: "2026-07-03",
    profile: "Guji Medium",
  },
  {
    batch: "BAT-075",
    yield: 85.7,
    input: 30,
    output: 25.71,
    date: "2026-07-05",
    profile: "Guji Medium",
  },
  {
    batch: "BAT-076",
    yield: 87.0,
    input: 30,
    output: 26.1,
    date: "2026-07-06",
    profile: "Guji Medium",
  },
  {
    batch: "BAT-077",
    yield: 82.9,
    input: 30,
    output: 24.87,
    date: "2026-07-08",
    profile: "Guji Medium",
  },
  {
    batch: "BAT-078",
    yield: 86.4,
    input: 30,
    output: 25.92,
    date: "2026-07-09",
    profile: "Guji Medium",
  },
  {
    batch: "BAT-079",
    yield: 85.0,
    input: 30,
    output: 25.5,
    date: "2026-07-11",
    profile: "Guji Medium",
  },
  {
    batch: "BAT-080",
    yield: 88.2,
    input: 30,
    output: 26.46,
    date: "2026-07-12",
    profile: "Guji Medium",
  },
  {
    batch: "BAT-081",
    yield: 84.8,
    input: 30,
    output: 25.44,
    date: "2026-07-14",
    profile: "Guji Medium",
  },
  {
    batch: "BAT-082",
    yield: 85.3,
    input: 30,
    output: 25.59,
    date: "2026-07-15",
    profile: "Guji Medium",
  },
  {
    batch: "BAT-083",
    yield: 81.6,
    input: 30,
    output: 24.48,
    date: "2026-07-17",
    profile: "Guji Medium",
  },
  {
    batch: "BAT-084",
    yield: 86.7,
    input: 30,
    output: 26.01,
    date: "2026-07-18",
    profile: "Guji Medium",
  },
  {
    batch: "BAT-085",
    yield: 85.9,
    input: 30,
    output: 25.77,
    date: "2026-07-20",
    profile: "Guji Medium",
  },
  {
    batch: "BAT-086",
    yield: 87.4,
    input: 30,
    output: 26.22,
    date: "2026-07-21",
    profile: "Guji Medium",
  },
  {
    batch: "BAT-087",
    yield: 83.1,
    input: 30,
    output: 24.93,
    date: "2026-07-23",
    profile: "Guji Medium",
  },
  {
    batch: "BAT-088",
    yield: 85.5,
    input: 30,
    output: 25.65,
    date: "2026-07-24",
    profile: "Guji Medium",
  },
  {
    batch: "BAT-089",
    yield: 84.6,
    input: 30,
    output: 25.38,
    date: "2026-07-26",
    profile: "Guji Medium",
  },
  {
    batch: "BAT-090",
    yield: 86.0,
    input: 30,
    output: 25.8,
    date: "2026-07-28",
    profile: "Guji Medium",
  },
  {
    batch: "BAT-091",
    yield: 85.0,
    input: 30,
    output: 25.5,
    date: "2026-07-30",
    profile: "Guji Medium",
  },
]

/* ── Demo batch ─────────────────────────────────────── */
interface VerificationBatch {
  id: string
  roaster: string
  storekeeper: string
  greenKg: number
  roasterOutput: number
  roasterTime: string
  lot: string
  profile: string
  targetYield: number
}

const DEMO_BATCHES: VerificationBatch[] = [
  {
    id: "BAT-2026-091A",
    roaster: "Markos Tadesse",
    storekeeper: "Bekele Vance",
    greenKg: 30,
    roasterOutput: 25.5,
    roasterTime: "10:15 AM",
    lot: "GRN-GUJ-2026-001",
    profile: "Guji Medium Roast",
    targetYield: 85.0,
  },
  {
    id: "BAT-2026-091B",
    roaster: "Dawit Haile",
    storekeeper: "Bekele Vance",
    greenKg: 30,
    roasterOutput: 25.8,
    roasterTime: "11:05 AM",
    lot: "GRN-GUJ-2026-001",
    profile: "Guji Medium Roast",
    targetYield: 85.0,
  },
  {
    id: "BAT-2026-092A",
    roaster: "Meseret Girma",
    storekeeper: "Sara Hailu",
    greenKg: 30,
    roasterOutput: 24.1,
    roasterTime: "12:30 PM",
    lot: "GRN-YRG-2026-014",
    profile: "Yirgacheffe Light",
    targetYield: 86.0,
  },
  {
    id: "BAT-2026-093A",
    roaster: "Dawit Haile",
    storekeeper: "Bekele Vance",
    greenKg: 30,
    roasterOutput: 23.8,
    roasterTime: "08:45 AM",
    lot: "GRN-LMU-2026-003",
    profile: "Limu Dark Roast",
    targetYield: 84.0,
  },
]

type VerificationStatus = "pending" | "verified" | "discrepancy" | "override"

const TOLERANCE_KG = 0.5

/* ── Yield color helper ─────────────────────────────── */
function yieldColor(pct: number) {
  if (pct >= 80 && pct <= 90) return "#16A34A"
  if (pct >= 75 && pct < 80) return "#F59E0B"
  if (pct > 90) return "#F59E0B"
  return "#DC2626"
}

function yieldBg(pct: number) {
  if (pct >= 80 && pct <= 90) return "#F0FDF4"
  if (pct >= 75) return "#FFFBEB"
  return "#FEF2F2"
}

/* ── Custom tooltip ─────────────────────────────────── */
function YieldTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const v = payload[0].value as number
  return (
    <div
      style={{
        background: "#1F2937",
        border: "1px solid #374151",
        borderRadius: 8,
        padding: "10px 14px",
        fontSize: 12,
        fontFamily: "DM Mono",
        minWidth: 160,
      }}
    >
      <div style={{ color: "var(--text-muted)", marginBottom: 4 }}>{label}</div>
      <div style={{ color: yieldColor(v), fontWeight: 700, fontSize: 14 }}>
        {v.toFixed(1)}%
      </div>
      <div
        style={{ color: "var(--text-secondary)", fontSize: 10.5, marginTop: 2 }}
      >
        Target: 85.0% ±1.5%
      </div>
    </div>
  )
}

/* ── Metric tile ─────────────────────────────────────── */
function MetricTile({
  label,
  value,
  unit,
  sub,
  color,
}: {
  label: string
  value: string
  unit?: string
  sub?: string
  color?: string
}) {
  return (
    <div
      style={{
        padding: "16px 20px",
        background: "var(--surface-01)",
        borderRadius: 10,
        border: "1px solid var(--border-neutral)",
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: "var(--text-muted)",
          fontWeight: 500,
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 4,
          marginBottom: 4,
        }}
      >
        <span
          style={{
            fontSize: 26,
            fontFamily: "DM Mono",
            fontWeight: 700,
            color: color ?? "#1F2937",
            letterSpacing: "-0.02em",
          }}
        >
          {value}
        </span>
        {unit && (
          <span
            style={{
              fontSize: 14,
              fontFamily: "DM Mono",
              color: "var(--text-muted)",
            }}
          >
            {unit}
          </span>
        )}
      </div>
      {sub && (
        <div style={{ fontSize: 11.5, color: "var(--text-secondary)" }}>
          {sub}
        </div>
      )}
    </div>
  )
}

/* ── Step header chip ───────────────────────────────── */
function StepChip({
  n,
  label,
  done,
}: {
  n: number
  label: string
  done: boolean
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: "50%",
          flexShrink: 0,
          background: done ? "#16A34A" : "#2B4D3A",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          fontWeight: 700,
          color: "#FFFFFF",
        }}
      >
        {done ? (
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="3"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          n
        )}
      </div>
      <span
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: "var(--text-primary)",
          letterSpacing: "0.03em",
          fontFamily: "DM Mono",
          textTransform: "uppercase" as const,
        }}
      >
        {label}
      </span>
    </div>
  )
}

/* ── Main component ─────────────────────────────────── */
export default function Verification() {
  const { isMobile, isTablet, isLaptop, isDesktop, isNarrow } = useBreakpoint()
  const pagePadding = isMobile
    ? "12px 12px"
    : isTablet
      ? "18px 20px"
      : isLaptop
        ? "24px 28px"
        : "28px 32px"
  const maxWidthStyle = isDesktop ? { maxWidth: 1600, margin: "0 auto" } : {}
  const [selectedId, setSelectedId] = useState(DEMO_BATCHES[0].id)
  const [skWeights, setSkWeights] = useState<Record<string, number | "">>({})
  const [statuses, setStatuses] = useState<Record<string, VerificationStatus>>(
    {},
  )
  const [overrideWt, setOverrideWt] = useState<Record<string, number | "">>({})
  const [overrideRsn, setOverrideRsn] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [histFilter, setHistFilter] = useState<"all" | "in-spec" | "out-spec">(
    "all",
  )

  const batch = DEMO_BATCHES.find((b) => b.id === selectedId)!
  const skEntry = skWeights[batch.id]
  const skNum = Number(skEntry)
  const delta =
    skEntry !== "" && skEntry !== undefined
      ? Math.abs(batch.roasterOutput - skNum)
      : null
  const hasDiscrepancy = delta !== null && delta > TOLERANCE_KG
  const batchStatus = statuses[batch.id] ?? "pending"

  const effectiveOutput =
    batchStatus === "override"
      ? Number(overrideWt[batch.id] || batch.roasterOutput)
      : batchStatus === "verified"
        ? skNum
        : batch.roasterOutput

  const yieldPct = +((effectiveOutput / batch.greenKg) * 100).toFixed(1)
  const weightLoss = +(batch.greenKg - effectiveOutput).toFixed(2)
  const inSpec = yieldPct >= 80 && yieldPct <= 90

  const handleSkSubmit = () => {
    if (!skEntry || skNum <= 0) return
    setStatuses((prev) => ({
      ...prev,
      [batch.id]: hasDiscrepancy ? "discrepancy" : "verified",
    }))
  }

  const handleOverride = () => {
    if (!overrideWt[batch.id] || !overrideRsn[batch.id]?.trim()) return
    setSubmitting(true)
    setTimeout(() => {
      setStatuses((prev) => ({ ...prev, [batch.id]: "override" }))
      setSubmitting(false)
    }, 800)
  }

  const handleReweigh = () => {
    setSkWeights((prev) => {
      const n = { ...prev }
      delete n[batch.id]
      return n
    })
    setStatuses((prev) => {
      const n = { ...prev }
      delete n[batch.id]
      return n
    })
  }

  /* history filtered */
  const histData = HISTORY.filter((h) => {
    if (histFilter === "in-spec") return h.yield >= 80 && h.yield <= 90
    if (histFilter === "out-spec") return h.yield < 80 || h.yield > 90
    return true
  })
  const avgYield = +(
    HISTORY.reduce((s, h) => s + h.yield, 0) / HISTORY.length
  ).toFixed(1)
  const inSpecCount = HISTORY.filter(
    (h) => h.yield >= 80 && h.yield <= 90,
  ).length

  return (
    <div
      className="page-enter"
      style={{ padding: pagePadding, ...maxWidthStyle }}
    >
      {/* ── Header ─────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <div className="section-eyebrow">Production · Yield Management</div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginTop: 4,
            flexWrap: "wrap" as const,
            gap: 12,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 26,
                fontWeight: 700,
                color: "var(--text-primary)",
                margin: "0 0 5px",
                letterSpacing: "-0.025em",
              }}
            >
              Yield Analysis & Dual-Verification
            </h1>
            <p
              style={{
                fontSize: 13.5,
                color: "var(--text-secondary)",
                margin: 0,
              }}
            >
              BR-PRD-001 · BR-PRD-002 · BR-PRD-004 · Tolerance ±{TOLERANCE_KG}{" "}
              KG
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {[
              {
                label: "Pending",
                count: DEMO_BATCHES.filter(
                  (b) => !statuses[b.id] || statuses[b.id] === "pending",
                ).length,
                color: "#F59E0B",
                bg: "#FFFBEB",
              },
              {
                label: "Discrepancy",
                count: Object.values(statuses).filter(
                  (s) => s === "discrepancy",
                ).length,
                color: "#DC2626",
                bg: "#FEF2F2",
              },
              {
                label: "Verified",
                count: Object.values(statuses).filter(
                  (s) => s === "verified" || s === "override",
                ).length,
                color: "#16A34A",
                bg: "#F0FDF4",
              },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  background: s.bg,
                  border: `1px solid ${s.color}30`,
                }}
              >
                <span
                  style={{
                    fontSize: 18,
                    fontFamily: "DM Mono",
                    fontWeight: 700,
                    color: s.color,
                  }}
                >
                  {s.count}
                </span>
                <span
                  style={{
                    fontSize: 11.5,
                    color: s.color,
                    marginLeft: 5,
                    fontWeight: 600,
                  }}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isNarrow ? "1fr" : "280px 1fr",
          gap: 20,
        }}
      >
        {/* ── Left: batch queue ───────────────────── */}
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--text-muted)",
              letterSpacing: "0.08em",
              textTransform: "uppercase" as const,
              marginBottom: 10,
              fontFamily: "DM Mono",
            }}
          >
            Awaiting Verification
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {DEMO_BATCHES.map((b) => {
              const st = statuses[b.id] ?? "pending"
              const isActive = b.id === selectedId
              const yPct = +((b.roasterOutput / b.greenKg) * 100).toFixed(1)
              return (
                <button
                  key={b.id}
                  onClick={() => setSelectedId(b.id)}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 10,
                    border: `1.5px solid ${isActive ? "#2B4D3A" : "#E5E3DC"}`,
                    background: isActive ? "rgba(43,77,58,0.04)" : "#FFFFFF",
                    cursor: "pointer",
                    textAlign: "left" as const,
                    transition: "all 0.12s",
                    boxShadow: isActive
                      ? "0 0 0 3px rgba(43,77,58,0.08)"
                      : "none",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.borderColor = "#D0CEC6"
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.borderColor = "#E5E3DC"
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 5,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12.5,
                        fontFamily: "DM Mono",
                        fontWeight: 700,
                        color: "#2B4D3A",
                      }}
                    >
                      {b.id}
                    </span>
                    {st === "verified" && (
                      <span
                        style={{
                          fontSize: 10,
                          fontFamily: "DM Mono",
                          background: "#F0FDF4",
                          color: "#16A34A",
                          padding: "2px 7px",
                          borderRadius: 4,
                          fontWeight: 700,
                        }}
                      >
                        ✓ VERIFIED
                      </span>
                    )}
                    {st === "discrepancy" && (
                      <span
                        style={{
                          fontSize: 10,
                          fontFamily: "DM Mono",
                          background: "#FEF2F2",
                          color: "#DC2626",
                          padding: "2px 7px",
                          borderRadius: 4,
                          fontWeight: 700,
                        }}
                      >
                        ⚠ DISCREPANCY
                      </span>
                    )}
                    {st === "override" && (
                      <span
                        style={{
                          fontSize: 10,
                          fontFamily: "DM Mono",
                          background: "#FEF3C7",
                          color: "#B45309",
                          padding: "2px 7px",
                          borderRadius: 4,
                          fontWeight: 700,
                        }}
                      >
                        ↗ OVERRIDE
                      </span>
                    )}
                    {st === "pending" && (
                      <span
                        style={{
                          fontSize: 10,
                          fontFamily: "DM Mono",
                          background: "var(--surface-02)",
                          color: "var(--text-muted)",
                          padding: "2px 7px",
                          borderRadius: 4,
                          fontWeight: 700,
                        }}
                      >
                        PENDING
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      marginBottom: 3,
                    }}
                  >
                    {b.profile}
                  </div>
                  <div
                    style={{
                      fontSize: 11.5,
                      color: "var(--text-muted)",
                      fontFamily: "DM Mono",
                    }}
                  >
                    {b.roasterOutput.toFixed(2)} KG · {yPct}% yield ·{" "}
                    {b.roasterTime}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Business Rules reference */}
          <div
            style={{
              marginTop: 16,
              padding: "14px 16px",
              background: "var(--surface-02)",
              borderRadius: 10,
              border: "1px solid var(--border-neutral)",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--text-secondary)",
                letterSpacing: "0.07em",
                textTransform: "uppercase" as const,
                marginBottom: 8,
              }}
            >
              Business Rules
            </div>
            {[
              {
                id: "BR-PRD-001",
                text: "Roaster must submit output weight before SK verification",
              },
              {
                id: "BR-PRD-002",
                text: "SK verifies independently — no roaster weight shown during entry",
              },
              {
                id: "BR-PRD-004",
                text: "Delta >0.5 KG triggers lock; GM override with reason required",
              },
            ].map((r) => (
              <div
                key={r.id}
                style={{ display: "flex", gap: 8, marginBottom: 7 }}
              >
                <span
                  style={{
                    fontSize: 10.5,
                    fontFamily: "DM Mono",
                    color: "#2B4D3A",
                    fontWeight: 700,
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                >
                  {r.id}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--text-secondary)",
                    lineHeight: 1.5,
                  }}
                >
                  {r.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: verification terminal ──────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Terminal header */}
          <div
            style={{
              background: "var(--surface-01)",
              border: "1px solid var(--border-neutral)",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "14px 20px",
                background: "#1F2937",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", gap: 5 }}>
                {["#EF4444", "#F59E0B", "#16A34A"].map((c) => (
                  <div
                    key={c}
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: c,
                      opacity: 0.8,
                    }}
                  />
                ))}
              </div>
              <div style={{ flex: 1, textAlign: "center" as const }}>
                <span
                  style={{
                    fontSize: 12,
                    fontFamily: "DM Mono",
                    color: "var(--text-muted)",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase" as const,
                  }}
                >
                  DUAL-VERIFICATION ENGINE — BATCH #{batch.id}
                </span>
              </div>
              <div style={{ width: 50 }} />
            </div>

            {/* Two-column verification layout */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 0,
              }}
            >
              {/* Step 1: Roaster submission */}
              <div
                style={{
                  padding: "20px 24px",
                  borderRight: "1px solid var(--border-neutral)",
                }}
              >
                <StepChip n={1} label="Roaster Submission" done={true} />
                <div
                  style={{
                    marginTop: 16,
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  {[
                    { label: "Roaster", value: batch.roaster },
                    {
                      label: "Input Green Weight",
                      value: `${batch.greenKg.toFixed(2)} KG`,
                    },
                    {
                      label: "Output Weight Submitted",
                      value: `${batch.roasterOutput.toFixed(2)} KG`,
                      highlight: true,
                    },
                    { label: "Submitted At", value: batch.roasterTime },
                    { label: "Lot Reference", value: batch.lot },
                  ].map((row) => (
                    <div
                      key={row.label}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{ fontSize: 12, color: "var(--text-muted)" }}
                      >
                        {row.label}
                      </span>
                      <span
                        style={{
                          fontSize: 13,
                          fontFamily: "DM Mono",
                          fontWeight: row.highlight ? 700 : 500,
                          color: row.highlight ? "#1F2937" : "#374151",
                          background: row.highlight ? "#F5F3EF" : "none",
                          padding: row.highlight ? "3px 10px" : 0,
                          borderRadius: row.highlight ? 6 : 0,
                        }}
                      >
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>
                <div
                  style={{
                    marginTop: 14,
                    padding: "8px 12px",
                    background: "#F0FDF4",
                    border: "1px solid #BBF7D0",
                    borderRadius: 7,
                    fontSize: 11.5,
                    color: "#15803D",
                    fontFamily: "DM Mono",
                  }}
                >
                  ✓ Submission locked — timestamp verified
                </div>
              </div>

              {/* Step 2: Storekeeper verification */}
              <div style={{ padding: "20px 24px" }}>
                <StepChip
                  n={2}
                  label="Storekeeper Verification"
                  done={
                    batchStatus === "verified" || batchStatus === "override"
                  }
                />
                <div
                  style={{
                    marginTop: 16,
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      Storekeeper
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        fontFamily: "DM Mono",
                        color: "#374151",
                        fontWeight: 500,
                      }}
                    >
                      {batch.storekeeper}
                    </span>
                  </div>

                  {/* SK weight input — roaster value hidden per BR-PRD-002 */}
                  <div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--text-muted)",
                        marginBottom: 6,
                      }}
                    >
                      Verified Weight Output (KG)
                    </div>
                    {batchStatus === "pending" ||
                    batchStatus === "discrepancy" ? (
                      <div style={{ display: "flex", gap: 8 }}>
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={skWeights[batch.id] ?? ""}
                          onChange={(e) =>
                            setSkWeights((prev) => ({
                              ...prev,
                              [batch.id]:
                                e.target.value === ""
                                  ? ""
                                  : parseFloat(e.target.value),
                            }))
                          }
                          placeholder="Enter verified weight…"
                          disabled={batchStatus === "discrepancy"}
                          style={{
                            flex: 1,
                            padding: "9px 12px",
                            borderRadius: 8,
                            border: `1.5px solid ${
                              batchStatus === "discrepancy"
                                ? "#DC2626"
                                : "#E5E3DC"
                            }`,
                            background:
                              batchStatus === "discrepancy"
                                ? "#FEF2F2"
                                : "#FAFAF8",
                            fontSize: 14,
                            fontFamily: "DM Mono",
                            color: "var(--text-primary)",
                            fontWeight: 700,
                            outline: "none",
                          }}
                        />
                        {batchStatus === "pending" && (
                          <button
                            onClick={handleSkSubmit}
                            disabled={!skWeights[batch.id]}
                            style={{
                              padding: "9px 16px",
                              borderRadius: 8,
                              border: "none",
                              background: skWeights[batch.id]
                                ? "#2B4D3A"
                                : "#E5E3DC",
                              color: skWeights[batch.id]
                                ? "#FFFFFF"
                                : "#9CA3AF",
                              fontSize: 12.5,
                              fontWeight: 700,
                              cursor: skWeights[batch.id]
                                ? "pointer"
                                : "not-allowed",
                              transition: "all 0.15s",
                              whiteSpace: "nowrap" as const,
                            }}
                          >
                            Confirm
                          </button>
                        )}
                      </div>
                    ) : (
                      <div
                        style={{
                          padding: "9px 12px",
                          background: "var(--surface-02)",
                          borderRadius: 8,
                          border: "1px solid var(--border-neutral)",
                          fontSize: 14,
                          fontFamily: "DM Mono",
                          fontWeight: 700,
                          color: "var(--text-primary)",
                        }}
                      >
                        {(
                          skWeights[batch.id] as number ?? batch.roasterOutput
                        ).toFixed(2)}{" "}
                        KG
                      </div>
                    )}
                  </div>

                  {skEntry !== undefined &&
                    skEntry !== "" &&
                    batchStatus === "pending" &&
                    delta !== null && (
                      <div
                        style={{
                          fontSize: 11.5,
                          fontFamily: "DM Mono",
                          color: delta <= TOLERANCE_KG ? "#16A34A" : "#F59E0B",
                        }}
                      >
                        {delta <= TOLERANCE_KG ? "✓" : "⚠"} Delta preview:{" "}
                        {delta.toFixed(2)} KG
                      </div>
                    )}

                  {(batchStatus === "verified" ||
                    batchStatus === "override") && (
                    <div
                      style={{
                        fontSize: 11.5,
                        fontFamily: "DM Mono",
                        color: "var(--text-muted)",
                      }}
                    >
                      Entered at{" "}
                      {new Date().toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* System verification result bar */}
            <div
              style={{
                borderTop: "1px solid var(--border-neutral)",
                padding: "16px 24px",
                background: "var(--bg-primary)",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase" as const,
                  marginBottom: 12,
                  fontFamily: "DM Mono",
                }}
              >
                System Verification Automation
              </div>

              {batchStatus === "pending" && delta === null && (
                <div
                  style={{
                    fontSize: 12.5,
                    color: "var(--text-muted)",
                    fontFamily: "DM Mono",
                  }}
                >
                  Waiting for storekeeper weight entry…
                </div>
              )}

              {(batchStatus === "verified" || batchStatus === "override") && (
                <div
                  style={{
                    display: "flex",
                    gap: 20,
                    flexWrap: "wrap" as const,
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "DM Mono",
                      fontSize: 12.5,
                      color: "#374151",
                    }}
                  >
                    Formula: Δ = | {batch.roasterOutput.toFixed(2)} −{" "}
                    {(skWeights[batch.id] as number).toFixed(2)} | ={" "}
                    <strong style={{ color: "var(--text-primary)" }}>
                      {delta?.toFixed(2)} KG
                    </strong>
                  </div>
                  <div
                    style={{
                      fontFamily: "DM Mono",
                      fontSize: 12.5,
                      color: "#374151",
                    }}
                  >
                    Weight Loss:{" "}
                    <strong>
                      {weightLoss.toFixed(2)} KG (
                      {((weightLoss / batch.greenKg) * 100).toFixed(1)}%)
                    </strong>
                  </div>
                  <div
                    style={{
                      fontFamily: "DM Mono",
                      fontSize: 12.5,
                      color: "#374151",
                    }}
                  >
                    Yield:{" "}
                    <strong style={{ color: yieldColor(yieldPct) }}>
                      {yieldPct}% ({inSpec ? "IN-SPEC TARGET" : "OUT OF SPEC"})
                    </strong>
                  </div>
                  <div
                    style={{
                      marginLeft: "auto",
                      padding: "7px 16px",
                      borderRadius: 8,
                      background: "#F0FDF4",
                      border: "1px solid #DCFCE7",
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                    }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#16A34A"
                      strokeWidth="2.5"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span
                      style={{
                        fontSize: 12.5,
                        fontFamily: "DM Mono",
                        fontWeight: 700,
                        color: "#16A34A",
                      }}
                    >
                      {batchStatus === "override"
                        ? "OVERRIDE APPROVED → Committed"
                        : "VERIFIED & APPROVED → Auto-Committed"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Discrepancy Lock Banner ─────────────── */}
          {batchStatus === "discrepancy" && (
            <div
              style={{ animation: "slideDown 0.2s cubic-bezier(0.16,1,0.3,1)" }}
            >
              <style>{`@keyframes slideDown { from { opacity:0; transform:translateY(-8px) } to { opacity:1; transform:translateY(0) } }`}</style>

              {/* Alert banner */}
              <div
                style={{
                  padding: "16px 20px",
                  background: "#FEE2E2",
                  border: "2px solid #DC2626",
                  borderRadius: 10,
                  marginBottom: 14,
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "flex-start", gap: 12 }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: "#DC2626",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="2.5"
                    >
                      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 13.5,
                        fontWeight: 700,
                        color: "#DC2626",
                        marginBottom: 4,
                        letterSpacing: "0.02em",
                      }}
                    >
                      DISCREPANCY LOCK ACTIVE
                    </div>
                    <div
                      style={{
                        fontSize: 12.5,
                        color: "#7F1D1D",
                        lineHeight: 1.55,
                      }}
                    >
                      Roaster and Storekeeper outputs do not match. Inventory
                      update <strong>blocked</strong>. Executive manager
                      notification dispatched.
                    </div>
                    <div style={{ marginTop: 10, display: "flex", gap: 16 }}>
                      {[
                        {
                          label: "Roaster Entry",
                          value: `${batch.roasterOutput.toFixed(2)} KG`,
                          color: "#374151",
                        },
                        {
                          label: "SK Entry",
                          value: `${(skWeights[batch.id] as number).toFixed(2)} KG`,
                          color: "#374151",
                        },
                        {
                          label: "Δ Delta",
                          value: `${delta?.toFixed(2)} KG`,
                          color: "#DC2626",
                          bold: true,
                        },
                        {
                          label: "Tolerance",
                          value: `±${TOLERANCE_KG} KG`,
                          color: "var(--text-muted)",
                        },
                      ].map((s) => (
                        <div key={s.label}>
                          <div
                            style={{
                              fontSize: 10.5,
                              fontFamily: "DM Mono",
                              color: "var(--text-muted)",
                              textTransform: "uppercase" as const,
                              marginBottom: 2,
                            }}
                          >
                            {s.label}
                          </div>
                          <div
                            style={{
                              fontSize: 14,
                              fontFamily: "DM Mono",
                              fontWeight: s.bold ? 700 : 600,
                              color: s.color,
                            }}
                          >
                            {s.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Manager Override Card */}
              <div
                style={{
                  background: "var(--surface-01)",
                  border: "1.5px solid var(--border-neutral)",
                  borderRadius: 10,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    padding: "12px 20px",
                    background: "#FFFBEB",
                    borderBottom: "1px solid #FEF3C7",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#B45309"
                    strokeWidth="2"
                  >
                    <path d="M12 22s-8-4.5-8-11.8A8 8 0 0112 2a8 8 0 018 8.2c0 7.3-8 11.8-8 11.8z" />
                  </svg>
                  <span
                    style={{
                      fontSize: 12.5,
                      fontWeight: 700,
                      color: "#B45309",
                    }}
                  >
                    Manager Override Control
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontFamily: "DM Mono",
                      background: "#FEF3C7",
                      color: "#B45309",
                      padding: "2px 8px",
                      borderRadius: 4,
                      border: "1px solid #FEE2A3",
                    }}
                  >
                    Visible to GM & Vice Manager Only
                  </span>
                </div>
                <div style={{ padding: "20px" }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 16,
                      marginBottom: 16,
                    }}
                  >
                    <div>
                      <label
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#374151",
                          display: "block",
                          marginBottom: 7,
                        }}
                      >
                        Manager Approved Weight Output (KG){" "}
                        <span style={{ color: "#DC2626" }}>*</span>
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={overrideWt[batch.id] ?? ""}
                        onChange={(e) =>
                          setOverrideWt((prev) => ({
                            ...prev,
                            [batch.id]:
                              e.target.value === ""
                                ? ""
                                : parseFloat(e.target.value),
                          }))
                        }
                        placeholder="Enter approved weight…"
                        style={{
                          width: "100%",
                          padding: "9px 12px",
                          borderRadius: 8,
                          border: "1.5px solid var(--border-neutral)",
                          background: "var(--bg-primary)",
                          fontSize: 13.5,
                          fontFamily: "DM Mono",
                          color: "var(--text-primary)",
                          fontWeight: 700,
                          outline: "none",
                          boxSizing: "border-box" as const,
                        }}
                      />
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-end",
                        gap: 8,
                        paddingBottom: 0,
                      }}
                    >
                      <div
                        style={{
                          flex: 1,
                          padding: "9px 12px",
                          background: "var(--surface-02)",
                          borderRadius: 8,
                          border: "1px solid var(--border-neutral)",
                          fontSize: 11.5,
                          fontFamily: "DM Mono",
                          color: "var(--text-muted)",
                        }}
                      >
                        <div>Roaster: {batch.roasterOutput.toFixed(2)} KG</div>
                        <div>
                          SK Entry: {(skWeights[batch.id] as number).toFixed(2)}{" "}
                          KG
                        </div>
                        <div style={{ fontWeight: 700, color: "#DC2626" }}>
                          Delta: {delta?.toFixed(2)} KG
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#374151",
                        display: "block",
                        marginBottom: 7,
                      }}
                    >
                      Reason for Discrepancy Override (Mandatory){" "}
                      <span style={{ color: "#DC2626" }}>*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={overrideRsn[batch.id] ?? ""}
                      onChange={(e) =>
                        setOverrideRsn((prev) => ({
                          ...prev,
                          [batch.id]: e.target.value,
                        }))
                      }
                      placeholder="Provide detailed justification for weight discrepancy override. This will be recorded in the audit log and requires GM or Vice Manager authentication."
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: 8,
                        border: "1.5px solid var(--border-neutral)",
                        background: "var(--bg-primary)",
                        fontSize: 12.5,
                        fontFamily: "Inter",
                        color: "var(--text-primary)",
                        outline: "none",
                        resize: "vertical" as const,
                        lineHeight: 1.55,
                        boxSizing: "border-box" as const,
                      }}
                    />
                  </div>

                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      onClick={handleReweigh}
                      style={{
                        flex: 1,
                        padding: "10px 0",
                        borderRadius: 8,
                        border: "1.5px solid var(--border-neutral)",
                        background: "var(--surface-01)",
                        color: "#374151",
                        fontSize: 13,
                        fontWeight: 600,
                        fontFamily: "Inter",
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#F5F3EF"
                        e.currentTarget.style.borderColor = "#D0CEC6"
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#FFFFFF"
                        e.currentTarget.style.borderColor = "#E5E3DC"
                      }}
                    >
                      ↩ Cancel & Request Re-weigh
                    </button>
                    <button
                      onClick={handleOverride}
                      disabled={
                        !overrideWt[batch.id] ||
                        !overrideRsn[batch.id]?.trim() ||
                        submitting
                      }
                      style={{
                        flex: 2,
                        padding: "10px 0",
                        borderRadius: 8,
                        border: "none",
                        background:
                          overrideWt[batch.id] && overrideRsn[batch.id]?.trim()
                            ? "#B45309"
                            : "#E5E3DC",
                        color:
                          overrideWt[batch.id] && overrideRsn[batch.id]?.trim()
                            ? "#FFFFFF"
                            : "#9CA3AF",
                        fontSize: 13,
                        fontWeight: 700,
                        fontFamily: "Inter",
                        cursor:
                          overrideWt[batch.id] && overrideRsn[batch.id]?.trim()
                            ? "pointer"
                            : "not-allowed",
                        transition: "all 0.15s",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 7,
                      }}
                    >
                      {submitting ? (
                        <>
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            style={{ animation: "spin 1s linear infinite" }}
                          >
                            <line x1="12" y1="2" x2="12" y2="6" />
                            <line x1="12" y1="18" x2="12" y2="22" />
                            <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
                            <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
                            <line x1="2" y1="12" x2="6" y2="12" />
                            <line x1="18" y1="12" x2="22" y2="12" />
                            <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
                            <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
                          </svg>{" "}
                          Processing…
                        </>
                      ) : (
                        <>
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>{" "}
                          Approve Override & Release Stock
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Yield metrics tiles ──────────────── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile
                ? "1fr"
                : isTablet
                  ? "repeat(2, 1fr)"
                  : "repeat(4, 1fr)",
              gap: 12,
            }}
          >
            <MetricTile
              label="Input Green Weight"
              value={batch.greenKg.toFixed(2)}
              unit="KG"
              sub="BR-PRD-001 verified"
              color="#1F2937"
            />
            <MetricTile
              label="Verified Roasted Output"
              value={effectiveOutput.toFixed(2)}
              unit="KG"
              sub={
                batchStatus === "override"
                  ? "GM override applied"
                  : batchStatus === "verified"
                    ? "SK verified"
                    : "Roaster submission"
              }
              color="#1F2937"
            />
            <MetricTile
              label="Calculated Weight Loss"
              value={weightLoss.toFixed(2)}
              unit="KG"
              sub={`${((weightLoss / batch.greenKg) * 100).toFixed(1)}% moisture loss`}
              color="#F59E0B"
            />
            <MetricTile
              label="Yield Percentage"
              value={`${yieldPct}%`}
              sub={
                inSpec
                  ? "✓ Within 80–90% benchmark"
                  : "⚠ Outside benchmark range"
              }
              color={yieldColor(yieldPct)}
            />
          </div>

          {/* ── Historical Yield Curve ───────────── */}
          <div
            style={{
              background: "var(--surface-01)",
              border: "1px solid var(--border-neutral)",
              borderRadius: 12,
              padding: "20px 24px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 16,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    marginBottom: 3,
                  }}
                >
                  Yield Consistency — Last 20 Batches
                </div>
                <div style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>
                  Guji Medium Roast · Target benchmark 85.0% ± 1.5%
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {[
                  { id: "all", label: "All", color: "var(--text-secondary)" },
                  { id: "in-spec", label: "In-Spec", color: "#16A34A" },
                  { id: "out-spec", label: "Out-Spec", color: "#DC2626" },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setHistFilter(f.id as typeof histFilter)}
                    style={{
                      padding: "5px 12px",
                      borderRadius: 6,
                      border: `1px solid ${
                        histFilter === f.id ? f.color : "#E5E3DC"
                      }`,
                      background:
                        histFilter === f.id ? `${f.color}12` : "#FFFFFF",
                      color: histFilter === f.id ? f.color : "#9CA3AF",
                      fontSize: 11.5,
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.12s",
                    }}
                  >
                    {f.label}
                  </button>
                ))}
                <div
                  style={{
                    width: 1,
                    height: 20,
                    background: "var(--border-neutral)",
                    margin: "0 4px",
                  }}
                />
                <div style={{ display: "flex", gap: 12 }}>
                  {[
                    { label: "Avg", value: `${avgYield}%`, color: "#2B4D3A" },
                    {
                      label: "In-Spec",
                      value: `${inSpecCount}/20`,
                      color: "#16A34A",
                    },
                  ].map((s) => (
                    <div key={s.label} style={{ textAlign: "right" as const }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontFamily: "DM Mono",
                          fontWeight: 700,
                          color: s.color,
                        }}
                      >
                        {s.value}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: "var(--text-muted)",
                          fontFamily: "DM Mono",
                          textTransform: "uppercase" as const,
                        }}
                      >
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={200}>
              <AreaChart
                data={histData}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="yieldGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2B4D3A" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2B4D3A" stopOpacity={0.01} />
                  </linearGradient>
                  <linearGradient id="specBand" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#16A34A" stopOpacity={0.06} />
                    <stop
                      offset="100%"
                      stopColor="#16A34A"
                      stopOpacity={0.06}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#F0EDE8"
                  vertical={false}
                />
                <XAxis
                  dataKey="batch"
                  tick={{
                    fill: "#9CA3AF",
                    fontSize: 10.5,
                    fontFamily: "DM Mono",
                  }}
                  axisLine={false}
                  tickLine={false}
                  interval={3}
                />
                <YAxis
                  domain={[78, 92]}
                  tick={{
                    fill: "#9CA3AF",
                    fontSize: 10.5,
                    fontFamily: "DM Mono",
                  }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip content={<YieldTooltip />} />
                {/* In-spec band */}
                <ReferenceLine
                  y={90}
                  stroke="#16A34A"
                  strokeDasharray="5 3"
                  strokeOpacity={0.4}
                  label={{
                    value: "90% upper",
                    fill: "#9CA3AF",
                    fontSize: 9,
                    fontFamily: "DM Mono",
                    position: "insideTopRight",
                  }}
                />
                <ReferenceLine
                  y={80}
                  stroke="#16A34A"
                  strokeDasharray="5 3"
                  strokeOpacity={0.4}
                  label={{
                    value: "80% lower",
                    fill: "#9CA3AF",
                    fontSize: 9,
                    fontFamily: "DM Mono",
                    position: "insideBottomRight",
                  }}
                />
                <ReferenceLine
                  y={85}
                  stroke="#2B4D3A"
                  strokeDasharray="4 3"
                  strokeWidth={1.5}
                  label={{
                    value: "Target 85%",
                    fill: "#2B4D3A",
                    fontSize: 9.5,
                    fontFamily: "DM Mono",
                    fontWeight: 700,
                    position: "insideTopLeft",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="yield"
                  stroke="#2B4D3A"
                  strokeWidth={2}
                  fill="url(#yieldGrad)"
                  dot={(props: any) => {
                    const { cx, cy, payload } = props
                    const inS = payload.yield >= 80 && payload.yield <= 90
                    return (
                      <circle
                        key={`dot-${payload.batch}`}
                        cx={cx}
                        cy={cy}
                        r={3.5}
                        fill={inS ? "#2B4D3A" : "#DC2626"}
                        stroke="#FFFFFF"
                        strokeWidth={1.5}
                      />
                    )
                  }}
                  activeDot={{
                    r: 5,
                    fill: "#2B4D3A",
                    stroke: "#FFFFFF",
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>

            {/* Yield distribution summary */}
            <div
              style={{
                marginTop: 14,
                display: "flex",
                gap: 8,
                flexWrap: "wrap" as const,
              }}
            >
              {[
                {
                  range: "< 80%",
                  count: HISTORY.filter((h) => h.yield < 80).length,
                  color: "#DC2626",
                  bg: "#FEF2F2",
                  label: "Below spec",
                },
                {
                  range: "80–85%",
                  count: HISTORY.filter((h) => h.yield >= 80 && h.yield < 85)
                    .length,
                  color: "#F59E0B",
                  bg: "#FFFBEB",
                  label: "Low spec",
                },
                {
                  range: "85–87%",
                  count: HISTORY.filter((h) => h.yield >= 85 && h.yield <= 87)
                    .length,
                  color: "#16A34A",
                  bg: "#F0FDF4",
                  label: "Target zone",
                },
                {
                  range: "87–90%",
                  count: HISTORY.filter((h) => h.yield > 87 && h.yield <= 90)
                    .length,
                  color: "#16A34A",
                  bg: "#F0FDF4",
                  label: "High spec",
                },
                {
                  range: "> 90%",
                  count: HISTORY.filter((h) => h.yield > 90).length,
                  color: "#F59E0B",
                  bg: "#FFFBEB",
                  label: "Above spec",
                },
              ].map((b) => (
                <div
                  key={b.range}
                  style={{
                    flex: 1,
                    minWidth: 80,
                    padding: "8px 12px",
                    background: b.bg,
                    borderRadius: 8,
                    border: `1px solid ${b.color}25`,
                    textAlign: "center" as const,
                  }}
                >
                  <div
                    style={{
                      fontSize: 18,
                      fontFamily: "DM Mono",
                      fontWeight: 700,
                      color: b.color,
                    }}
                  >
                    {b.count}
                  </div>
                  <div
                    style={{
                      fontSize: 10.5,
                      fontFamily: "DM Mono",
                      color: b.color,
                      fontWeight: 600,
                    }}
                  >
                    {b.range}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: "var(--text-muted)",
                      marginTop: 1,
                    }}
                  >
                    {b.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
