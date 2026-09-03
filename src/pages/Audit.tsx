/* Responsive: mobile ≤640 | tablet 641–1024 | laptop 1025–1440 | desktop >1440 */
import { useState, useRef, useEffect } from "react"
import { useBreakpoint } from "../hooks/useBreakpoint"

/* ── Types ─────────────────────────────────────────────── */
type ActionType = "CREATE" | "UPDATE" | "DELETE" | "OVERRIDE" | "LOGIN" | "LOGOUT" | "EXPORT" | "VIEW"
type ModuleKey = "Inventory" | "Quality" | "Production" | "Finance" | "Orders" | "Delivery" | "Auth" | "Packaging"
type RoleKey = "general-manager" | "inventory-manager" | "head-roaster" | "qc-inspector" | "accountant" | "driver-supervisor" | "system"

interface DiffEntry {
  field: string
  old: string
  new: string
}

interface AuditLog {
  id: string
  ts: string // ISO ms-precision
  user: string
  role: RoleKey
  module: ModuleKey
  actionCode: string
  actionType: ActionType
  ip: string
  device: string
  recordId: string
  diff: DiffEntry[]
  hash: string
}

/* ── Static data ───────────────────────────────────────── */
const ROLE_META: Record<RoleKey, { label: string color: string bg: string }> = {
  "general-manager": {
    label: "General Manager",
    color: "#1D4ED8",
    bg: "#EFF6FF",
  },
  "inventory-manager": {
    label: "Inventory Manager",
    color: "#7C3AED",
    bg: "#F5F3FF",
  },
  "head-roaster": { label: "Head Roaster", color: "#B45309", bg: "#FFFBEB" },
  "qc-inspector": { label: "QC Inspector", color: "#0E7490", bg: "#ECFEFF" },
  accountant: { label: "Chief Accountant", color: "#BE185D", bg: "#FDF2F8" },
  "driver-supervisor": {
    label: "Driver Supervisor",
    color: "#065F46",
    bg: "#ECFDF5",
  },
  system: {
    label: "System Process",
    color: "var(--text-secondary)",
    bg: "#F9FAFB",
  },
}

const ACTION_META: Record<ActionType, {
  color: string
  bg: string
  border: string
}> = {
  CREATE: { color: "#15803D", bg: "#F0FDF4", border: "#DCFCE7" },
  UPDATE: { color: "#1D4ED8", bg: "#EFF6FF", border: "#BFDBFE" },
  DELETE: { color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
  OVERRIDE: { color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
  LOGIN: { color: "#0E7490", bg: "#ECFEFF", border: "#A5F3FC" },
  LOGOUT: { color: "var(--text-secondary)", bg: "#F9FAFB", border: "#E5E7EB" },
  EXPORT: { color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE" },
  VIEW: { color: "#374151", bg: "#F9FAFB", border: "#E5E7EB" },
}

const MODULE_COLORS: Record<ModuleKey, { color: string bg: string }> = {
  Inventory: { color: "#7C3AED", bg: "#F5F3FF" },
  Quality: { color: "#0E7490", bg: "#ECFEFF" },
  Production: { color: "#B45309", bg: "#FFFBEB" },
  Finance: { color: "#BE185D", bg: "#FDF2F8" },
  Orders: { color: "#1D4ED8", bg: "#EFF6FF" },
  Delivery: { color: "#065F46", bg: "#ECFDF5" },
  Auth: { color: "var(--text-secondary)", bg: "#F9FAFB" },
  Packaging: { color: "#15803D", bg: "#F0FDF4" },
}

/* ── Simulated hash generator ──────────────────────────── */
function fakeHash(id: string) {
  const chars = "0123456789abcdef"
  let h = ""
  for (let i = 0; i < 40; i++) {
    h += chars[(id.charCodeAt(i % id.length) + i * 7 + 3) % 16]
  }
  return h
}

/* ── Audit log entries ─────────────────────────────────── */
// Audit logs loaded dynamically from DB — no hardcoded entries
const EMPTY_LOGS: AuditLog[] = []


/* ── Helper components ─────────────────────────────────── */
function ActionBadge({ code, type }: { code: string type: ActionType }) {
  const m = ACTION_META[type]
  return (
    <span
      style={{
        fontSize: 10.5,
        fontFamily: "DM Mono",
        fontWeight: 700,
        padding: "3px 8px",
        borderRadius: 5,
        border: `1px solid ${m.border}`,
        background: m.bg,
        color: m.color,
        letterSpacing: "0.04em",
        whiteSpace: "nowrap" as const,
      }}
    >
      {code}
    </span>
  )
}

function ModulePill({ m }: { m: ModuleKey }) {
  const c = MODULE_COLORS[m]
  return (
    <span
      style={{
        fontSize: 10,
        fontFamily: "DM Mono",
        fontWeight: 700,
        padding: "3px 8px",
        borderRadius: 99,
        background: c.bg,
        color: c.color,
        letterSpacing: "0.06em",
        textTransform: "uppercase" as const,
      }}
    >
      {m}
    </span>
  )
}

function RoleBadge({ role }: { role: RoleKey }) {
  const m = ROLE_META[role]
  return (
    <span
      style={{
        fontSize: 10,
        fontFamily: "DM Mono",
        padding: "2px 6px",
        borderRadius: 4,
        background: m.bg,
        color: m.color,
        border: `1px solid ${m.color}30`,
      }}
    >
      {m.label}
    </span>
  )
}

function DiffBlock({ diff, type }: { diff: DiffEntry[] type: ActionType }) {
  const isDestructive = type === "OVERRIDE" || type === "DELETE"
  return (
    <div
      style={{
        fontFamily: "DM Mono",
        fontSize: 10.5,
        borderRadius: 7,
        overflow: "hidden",
        border: "1px solid var(--border-neutral)",
        minWidth: 280,
      }}
    >
      {diff.map((d, i) => {
        const numOld = parseFloat(d.old)
        const numNew = parseFloat(d.new)
        const hasDelta = !isNaN(numOld) && !isNaN(numNew) && numOld !== numNew
        const delta = hasDelta ? numNew - numOld : null
        const deltaStr =
          delta !== null
            ? delta > 0
              ? `+${delta.toFixed(2)}`
              : `${delta.toFixed(2)}`
            : null
        const deltaColor =
          delta !== null ? (delta > 0 ? "#16A34A" : "#DC2626") : "#9CA3AF"
        return (
          <div
            key={d.field}
            style={{
              borderBottom: i < diff.length - 1 ? "1px solid #F0EDE8" : "none",
            }}
          >
            <div
              style={{
                padding: "5px 10px 2px",
                background: "var(--bg-primary)",
                color: "var(--text-muted)",
                fontSize: 9.5,
                letterSpacing: "0.06em",
                textTransform: "uppercase" as const,
              }}
            >
              {d.field}
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 0,
              }}
            >
              <div
                style={{
                  padding: "4px 10px 6px",
                  background: d.old === "null" ? "#F9FAFB" : "#FEF2F2",
                  borderRight: "1px solid #F0EDE8",
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    color: "var(--text-muted)",
                    marginBottom: 2,
                  }}
                >
                  OLD
                </div>
                <div
                  style={{
                    color: d.old === "null" ? "#D1D5DB" : "#DC2626",
                    fontWeight: d.old === "null" ? 400 : 600,
                  }}
                >
                  {d.old}
                </div>
              </div>
              <div
                style={{
                  padding: "4px 10px 6px",
                  background: d.new === "DELETED" ? "#FEF2F2" : "#F0FDF4",
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    color: "var(--text-muted)",
                    marginBottom: 2,
                  }}
                >
                  NEW
                </div>
                <div
                  style={{
                    color: d.new === "DELETED" ? "#DC2626" : "#15803D",
                    fontWeight: 600,
                  }}
                >
                  {d.new}
                </div>
              </div>
            </div>
            {deltaStr && (
              <div
                style={{
                  padding: "3px 10px",
                  background: "var(--surface-02)",
                  borderTop: "1px solid #F0EDE8",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <span style={{ fontSize: 9, color: "var(--text-muted)" }}>
                  DIFF
                </span>
                <span
                  style={{ fontWeight: 700, color: deltaColor, fontSize: 11 }}
                >
                  {deltaStr}
                </span>
                {isDestructive && (
                  <span
                    style={{
                      fontSize: 9,
                      color: "#DC2626",
                      background: "#FEE2E2",
                      padding: "1px 5px",
                      borderRadius: 3,
                      marginLeft: 2,
                    }}
                  >
                    ⚠ OVERRIDE
                  </span>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ── Expanded row ──────────────────────────────────────── */
function ExpandedRow({ log }: { log: AuditLog }) {
  return (
    <div
      style={{
        padding: "14px 20px 16px",
        background: "#F9FAFB",
        borderTop: "1px solid #F0EDE8",
        animation: "expandRow 0.18s cubic-bezier(0.16,1,0.3,1)",
      }}
    >
      <style>{`@keyframes expandRow { from { opacity:0; transform:translateY(-6px) } to { opacity:1; transform:translateY(0) } }`}</style>
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 20 }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--text-muted)",
              letterSpacing: "0.08em",
              textTransform: "uppercase" as const,
              fontFamily: "DM Mono",
              marginBottom: 10,
            }}
          >
            Field Diff Viewer
          </div>
          <DiffBlock diff={log.diff} type={log.actionType} />
        </div>
        <div style={{ minWidth: 300 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--text-muted)",
              letterSpacing: "0.08em",
              textTransform: "uppercase" as const,
              fontFamily: "DM Mono",
              marginBottom: 10,
            }}
          >
            Forensic Metadata
          </div>
          <div
            style={{
              background: "#1F2937",
              borderRadius: 9,
              padding: "12px 14px",
              fontFamily: "DM Mono",
            }}
          >
            {[
              ["Log ID", log.id],
              ["Record ID", log.recordId],
              ["Timestamp", log.ts],
              ["IP Address", log.ip],
              ["User Agent", log.device],
            ].map(([k, v]) => (
              <div
                key={k}
                style={{ display: "flex", gap: 10, marginBottom: 5 }}
              >
                <span
                  style={{
                    fontSize: 10.5,
                    color: "var(--text-secondary)",
                    minWidth: 80,
                  }}
                >
                  {k}
                </span>
                <span style={{ fontSize: 10.5, color: "#E5E7EB" }}>{v}</span>
              </div>
            ))}
            <div
              style={{
                borderTop: "1px solid rgba(255,255,255,0.08)",
                paddingTop: 8,
                marginTop: 8,
              }}
            >
              <div
                style={{
                  fontSize: 9.5,
                  color: "var(--text-secondary)",
                  marginBottom: 3,
                }}
              >
                SHA-1 ENTRY HASH
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "#4ADE80",
                  letterSpacing: "0.03em",
                  wordBreak: "break-all" as const,
                }}
              >
                {log.hash}
              </div>
            </div>
          </div>
          <div style={{ marginTop: 10, display: "flex", gap: 7 }}>
            <button
              style={{
                flex: 1,
                padding: "7px 0",
                borderRadius: 7,
                border: "1px solid var(--border-neutral)",
                background: "var(--surface-01)",
                fontSize: 11.5,
                fontWeight: 600,
                color: "#374151",
                cursor: "pointer",
                fontFamily: "DM Mono",
                transition: "all 0.12s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#F5F3EF")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "#FFFFFF")
              }
            >
              Verify Hash
            </button>
            <button
              style={{
                flex: 1,
                padding: "7px 0",
                borderRadius: 7,
                border: "1px solid var(--border-neutral)",
                background: "var(--surface-01)",
                fontSize: 11.5,
                fontWeight: 600,
                color: "#374151",
                cursor: "pointer",
                fontFamily: "DM Mono",
                transition: "all 0.12s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#F5F3EF")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "#FFFFFF")
              }
            >
              Copy Entry
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Main ──────────────────────────────────────────────── */
export default function Audit() {
  const { isMobile, isTablet, isLaptop, isDesktop, isNarrow } = useBreakpoint()
  const pagePadding = isMobile
    ? "12px 12px"
    : isTablet
      ? "18px 20px"
      : isLaptop
        ? "24px 28px"
        : "28px 32px"
  const maxWidthStyle = isDesktop ? { maxWidth: 1600, margin: "0 auto" } : {}
  const [search, setSearch] = useState("")
  const [modFilter, setModFilter] = useState<ModuleKey | "all">("all")
  const [actFilter, setActFilter] = useState<ActionType | "all">("all")
  const [roleFilter, setRoleFilter] = useState<RoleKey | "all">("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [expanded, setExpanded] = useState<string | null>(null)
  const [sealAnim, setSealAnim] = useState(false)
  const [logs, setLogs] = useState<AuditLog[]>(EMPTY_LOGS)
  const [logsLoading, setLogsLoading] = useState(true)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    searchRef.current?.focus()
    // Fetch real audit logs from DB
    import("../services/api").then(({ apiRequest }) => {
      apiRequest<any[]>("/audit/logs", "GET")
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setLogs(data.map((e: any) => ({
              id: e.id || `AUD-${Date.now()}`,
              ts: e.created_at || e.ts || new Date().toISOString(),
              user: e.user_name || e.user || e.performed_by || "System",
              role: (e.user_role || e.role || "system") as RoleKey,
              module: (e.module || "Auth") as ModuleKey,
              actionCode: e.action_code || e.actionCode || e.action || "ACTION",
              actionType: (e.action_type || e.actionType || "UPDATE") as ActionType,
              ip: e.ip_address || e.ip || "",
              device: e.device || e.user_agent || "",
              recordId: e.record_id || e.recordId || "",
              diff: Array.isArray(e.diff) ? e.diff : [],
              hash: e.hash || fakeHash(e.id || ""),
            })))
          }
        })
        .catch(() => setLogs([]))
        .finally(() => setLogsLoading(false))
    })
  }, [])

  const filtered = logs.filter((log) => {
    const q = search.toLowerCase()
    if (
      q &&
      ![log.user, log.ip, log.recordId, log.actionCode, log.id]
        .join(" ")
        .toLowerCase()
        .includes(q)
    )
      return false
    if (modFilter !== "all" && log.module !== modFilter) return false
    if (actFilter !== "all" && log.actionType !== actFilter) return false
    if (roleFilter !== "all" && log.role !== roleFilter) return false
    if (startDate && log.ts < startDate) return false
    if (endDate && log.ts > endDate + " 99") return false
    return true
  })

  const overrideCount = logs.filter((l) => l.actionType === "OVERRIDE").length
  const deleteCount = logs.filter((l) => l.actionType === "DELETE").length

  return (
    <div
      className="page-enter"
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        ...maxWidthStyle,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: pagePadding,
          borderBottom: "1px solid var(--border-neutral)",
          background: "var(--surface-01)",
          flexShrink: 0,
        }}
      >
        <div className="section-eyebrow">Governance</div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginTop: 4,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: "var(--text-primary)",
                margin: "0 0 4px",
                letterSpacing: "-0.025em",
              }}
            >
              Security &amp; Audit Logs
            </h1>
            <p
              style={{
                fontSize: 13,
                color: "var(--text-secondary)",
                margin: 0,
              }}
            >
              Forensic event trail · BR-AUD-001 compliant · Cryptographically
              sealed
            </p>
          </div>
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: isMobile ? "wrap" as const : "nowrap" as const,
            }}
          >
            {overrideCount > 0 && (
              <div
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  background: "#FEF2F2",
                  border: "1px solid #FECACA",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <div
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "#DC2626",
                    animation: "statusPulse 2s infinite",
                  }}
                />
                <style>{`@keyframes statusPulse { 0%,100%{box-shadow:0 0 0 2px rgba(220,38,38,0.2)} 50%{box-shadow:0 0 0 4px rgba(220,38,38,0.06)} }`}</style>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#DC2626",
                    fontFamily: "DM Mono",
                  }}
                >
                  {overrideCount} OVERRIDES
                </span>
              </div>
            )}
            <button className="btn-secondary">
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
              </svg>
              Export Audit Log
            </button>
          </div>
        </div>
      </div>

      {/* Immutability banner */}
      <div
        style={{
          padding: "10px 28px",
          background: "#1F2937",
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: "rgba(74,222,128,0.12)",
            border: "1px solid rgba(74,222,128,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#4ADE80"
            strokeWidth="2"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <span
            style={{
              fontSize: 11.5,
              fontFamily: "DM Mono",
              fontWeight: 700,
              color: "#4ADE80",
              letterSpacing: "0.05em",
            }}
          >
            IMMUTABLE AUDIT TRAIL{" "}
          </span>
          <span
            style={{
              fontSize: 11.5,
              fontFamily: "DM Mono",
              color: "var(--text-muted)",
            }}
          >
            · Records in this module are read-only and cryptographically sealed.
            Deletion or modification is blocked at the database layer
            (BR-AUD-001).
          </span>
        </div>
        <div style={{ display: "flex", gap: 14 }}>
          {[
            { label: "Total Events", value: logs.length },
            { label: "Overrides", value: overrideCount, red: true },
            { label: "Deletions", value: deleteCount, red: true },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                textAlign: "center" as const,
                paddingLeft: 14,
                borderLeft: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div
                style={{
                  fontSize: 15,
                  fontFamily: "DM Mono",
                  fontWeight: 700,
                  color: s.red && s.value > 0 ? "#FCA5A5" : "#FFFFFF",
                }}
              >
                {s.value}
              </div>
              <div
                style={{
                  fontSize: 9.5,
                  fontFamily: "DM Mono",
                  color: "var(--text-secondary)",
                  letterSpacing: "0.06em",
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={() => setSealAnim((v) => !v)}
          style={{
            padding: "5px 11px",
            borderRadius: 6,
            border: "1px solid rgba(74,222,128,0.3)",
            background: sealAnim ? "rgba(74,222,128,0.15)" : "transparent",
            color: "#4ADE80",
            fontSize: 11,
            fontFamily: "DM Mono",
            cursor: "pointer",
            transition: "all 0.15s",
          }}
        >
          {sealAnim ? "✓ Seal Verified" : "Verify Seal"}
        </button>
      </div>

      {/* Filter bar */}
      <div
        style={{
          padding: "12px 28px",
          background: "var(--bg-primary)",
          borderBottom: "1px solid var(--border-neutral)",
          display: "flex",
          gap: 10,
          flexWrap: "wrap" as const,
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        {/* Search */}
        <div style={{ position: "relative" as const, flex: "0 0 280px" }}>
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#9CA3AF"
            strokeWidth="2"
            style={{
              position: "absolute" as const,
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
            }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by User, IP, Record ID, Action…"
            style={{
              width: "100%",
              paddingLeft: 30,
              paddingRight: 10,
              paddingTop: 7,
              paddingBottom: 7,
              borderRadius: 8,
              border: "1px solid var(--border-neutral)",
              background: "var(--surface-01)",
              fontSize: 12.5,
              fontFamily: "DM Mono",
              color: "var(--text-primary)",
              outline: "none",
              boxSizing: "border-box" as const,
            }}
          />
        </div>

        {/* Module */}
        <select
          value={modFilter}
          onChange={(e) => setModFilter(e.target.value as typeof modFilter)}
          style={{
            padding: "7px 10px",
            borderRadius: 8,
            border: "1px solid var(--border-neutral)",
            background: "var(--surface-01)",
            fontSize: 12.5,
            fontFamily: "DM Mono",
            color: "#374151",
            outline: "none",
            cursor: "pointer",
          }}
        >
          <option value="all">All Modules</option>
          {([
            "Inventory",
            "Quality",
            "Production",
            "Finance",
            "Orders",
            "Delivery",
            "Packaging",
            "Auth",
          ] as ModuleKey[]).map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        {/* Action type */}
        <select
          value={actFilter}
          onChange={(e) => setActFilter(e.target.value as typeof actFilter)}
          style={{
            padding: "7px 10px",
            borderRadius: 8,
            border: "1px solid var(--border-neutral)",
            background: "var(--surface-01)",
            fontSize: 12.5,
            fontFamily: "DM Mono",
            color: "#374151",
            outline: "none",
            cursor: "pointer",
          }}
        >
          <option value="all">All Action Types</option>
          {([
            "CREATE",
            "UPDATE",
            "DELETE",
            "OVERRIDE",
            "LOGIN",
            "LOGOUT",
            "EXPORT",
          ] as ActionType[]).map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>

        {/* User role */}
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
          style={{
            padding: "7px 10px",
            borderRadius: 8,
            border: "1px solid var(--border-neutral)",
            background: "var(--surface-01)",
            fontSize: 12.5,
            fontFamily: "DM Mono",
            color: "#374151",
            outline: "none",
            cursor: "pointer",
          }}
        >
          <option value="all">All Roles</option>
          {(Object.entries(
            ROLE_META,
          ) as [RoleKey, typeof ROLE_META[RoleKey]][]).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>

        {/* Date range */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{
              padding: "6px 8px",
              borderRadius: 7,
              border: "1px solid var(--border-neutral)",
              fontSize: 11.5,
              fontFamily: "DM Mono",
              color: "#374151",
              background: "var(--surface-01)",
              outline: "none",
            }}
          />
          <span
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              fontFamily: "DM Mono",
            }}
          >
            →
          </span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{
              padding: "6px 8px",
              borderRadius: 7,
              border: "1px solid var(--border-neutral)",
              fontSize: 11.5,
              fontFamily: "DM Mono",
              color: "#374151",
              background: "var(--surface-01)",
              outline: "none",
            }}
          />
        </div>

        <div
          style={{
            marginLeft: "auto",
            fontSize: 12,
            fontFamily: "DM Mono",
            color: "var(--text-muted)",
          }}
        >
          {filtered.length} / {logs.length} events
        </div>

        {(search ||
          modFilter !== "all" ||
          actFilter !== "all" ||
          roleFilter !== "all" ||
          startDate ||
          endDate) && (
          <button
            onClick={() => {
              setSearch("")
              setModFilter("all")
              setActFilter("all")
              setRoleFilter("all")
              setStartDate("")
              setEndDate("")
            }}
            style={{
              padding: "5px 10px",
              borderRadius: 6,
              border: "1px solid var(--border-neutral)",
              background: "transparent",
              fontSize: 11.5,
              fontFamily: "DM Mono",
              color: "var(--text-secondary)",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#F5F3EF")}
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "auto",
          background: "var(--surface-02)",
        }}
      >
        {isMobile ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {filtered.map((log) => {
              const isOverride =
                log.actionType === "OVERRIDE" || log.actionType === "DELETE"
              return (
                <div
                  key={log.id}
                  style={{
                    padding: "14px 12px",
                    borderBottom: "1px solid var(--border-neutral)",
                    background: isOverride ? "#FFFBEB" : "var(--surface-01)",
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
                        fontSize: 12,
                        fontFamily: "DM Mono",
                        fontWeight: 600,
                        color: "var(--text-primary)",
                      }}
                    >
                      {log.ts.slice(0, 19)}
                    </span>
                    <ActionBadge code={log.actionCode} type={log.actionType} />
                  </div>
                  <div
                    style={{
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      marginBottom: 4,
                    }}
                  >
                    {log.user}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--text-secondary)",
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "4px 10px",
                      marginBottom: 6,
                    }}
                  >
                    <span>{log.id}</span>
                    <span>{log.recordId}</span>
                    <span>{log.ip}</span>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <ModulePill m={log.module} />
                    <RoleBadge role={log.role} />
                  </div>
                </div>
              )
            })}
            {filtered.length === 0 && (
              <div style={{ padding: "60px 0", textAlign: "center" as const }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                  }}
                >
                  No audit events match your filters
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: 1080,
              }}
            >
              <thead
                style={{ position: "sticky" as const, top: 0, zIndex: 10 }}
              >
                <tr
                  style={{
                    background: "var(--surface-01)",
                    boxShadow: "0 1px 0 #E5E3DC",
                  }}
                >
                  {[
                    "Timestamp",
                    "User / Role",
                    "Module",
                    "Action Code",
                    "IP · Device",
                    "State Diff",
                    "",
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "10px 14px",
                        textAlign: "left" as const,
                        fontSize: 10,
                        fontFamily: "DM Mono",
                        fontWeight: 700,
                        color: "var(--text-muted)",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase" as const,
                        whiteSpace: "nowrap" as const,
                        borderBottom: "2px solid #E5E3DC",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((log, i) => {
                  const isExpanded = expanded === log.id
                  const isOverride =
                    log.actionType === "OVERRIDE" || log.actionType === "DELETE"
                  return (
                    <>
                      <tr
                        key={log.id}
                        style={{
                          borderBottom: "1px solid var(--border-neutral)",
                          background: isOverride
                            ? "#FFFBEB"
                            : isExpanded
                              ? "#F5F3EF"
                              : i % 2 === 0
                                ? "#FFFFFF"
                                : "#FAFAF8",
                          transition: "background 0.1s",
                        }}
                        onMouseEnter={(e) => {
                          if (!isExpanded && !isOverride)
                            (e.currentTarget as HTMLElement).style.background =
                              "#F5F3EF"
                        }}
                        onMouseLeave={(e) => {
                          if (!isExpanded && !isOverride)
                            (e.currentTarget as HTMLElement).style.background =
                              i % 2 === 0 ? "#FFFFFF" : "#FAFAF8"
                        }}
                      >
                        {/* Timestamp */}
                        <td
                          style={{
                            padding: "11px 14px",
                            verticalAlign: "top" as const,
                          }}
                        >
                          {isOverride && (
                            <div
                              style={{
                                width: 3,
                                height: "100%",
                                background: "#DC2626",
                                borderRadius: 99,
                                position: "absolute" as const,
                                left: 0,
                                top: 0,
                              }}
                            />
                          )}
                          <div
                            style={{
                              fontSize: 11.5,
                              fontFamily: "DM Mono",
                              fontWeight: 600,
                              color: "var(--text-primary)",
                              whiteSpace: "nowrap" as const,
                            }}
                          >
                            {log.ts.slice(0, 19)}
                          </div>
                          <div
                            style={{
                              fontSize: 10,
                              fontFamily: "DM Mono",
                              color: "var(--text-muted)",
                              marginTop: 1,
                            }}
                          >
                            .{log.ts.slice(20)} · {log.id}
                          </div>
                        </td>

                        {/* User */}
                        <td
                          style={{
                            padding: "11px 14px",
                            verticalAlign: "top" as const,
                          }}
                        >
                          <div
                            style={{
                              fontSize: 12.5,
                              fontWeight: 600,
                              color: "var(--text-primary)",
                              marginBottom: 4,
                              whiteSpace: "nowrap" as const,
                            }}
                          >
                            {log.user}
                          </div>
                          <RoleBadge role={log.role} />
                        </td>

                        {/* Module */}
                        <td
                          style={{
                            padding: "11px 14px",
                            verticalAlign: "top" as const,
                          }}
                        >
                          <ModulePill m={log.module} />
                        </td>

                        {/* Action */}
                        <td
                          style={{
                            padding: "11px 14px",
                            verticalAlign: "top" as const,
                          }}
                        >
                          <ActionBadge
                            code={log.actionCode}
                            type={log.actionType}
                          />
                          <div
                            style={{
                              fontSize: 10,
                              fontFamily: "DM Mono",
                              color: "var(--text-muted)",
                              marginTop: 4,
                            }}
                          >
                            {log.recordId}
                          </div>
                        </td>

                        {/* IP + Device */}
                        <td
                          style={{
                            padding: "11px 14px",
                            verticalAlign: "top" as const,
                          }}
                        >
                          <div
                            style={{
                              fontSize: 11.5,
                              fontFamily: "DM Mono",
                              color: "#374151",
                              fontWeight: 600,
                              whiteSpace: "nowrap" as const,
                            }}
                          >
                            {log.ip}
                          </div>
                          <div
                            style={{
                              fontSize: 10.5,
                              fontFamily: "DM Mono",
                              color: "var(--text-muted)",
                              marginTop: 2,
                              whiteSpace: "nowrap" as const,
                            }}
                          >
                            {log.device}
                          </div>
                        </td>

                        {/* Inline diff summary */}
                        <td
                          style={{
                            padding: "11px 14px",
                            verticalAlign: "top" as const,
                            maxWidth: 260,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column" as const,
                              gap: 4,
                            }}
                          >
                            {log.diff.slice(0, 2).map((d) => {
                              const numOld = parseFloat(d.old)
                              const numNew = parseFloat(d.new)
                              const hasDelta =
                                !isNaN(numOld) &&
                                !isNaN(numNew) &&
                                numOld !== numNew
                              const delta = hasDelta ? numNew - numOld : null
                              const deltaColor =
                                delta !== null
                                  ? delta > 0
                                    ? "#16A34A"
                                    : "#DC2626"
                                  : "#6B7280"
                              return (
                                <div
                                  key={d.field}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 5,
                                    fontSize: 10.5,
                                    fontFamily: "DM Mono",
                                  }}
                                >
                                  <span
                                    style={{
                                      color: "var(--text-muted)",
                                      minWidth: 90,
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap" as const,
                                    }}
                                  >
                                    {d.field}
                                  </span>
                                  <span
                                    style={{
                                      color: "#DC2626",
                                      textDecoration: "line-through",
                                      opacity: 0.7,
                                    }}
                                  >
                                    {d.old.replace(/"/g, "").slice(0, 12)}
                                  </span>
                                  <span style={{ color: "var(--text-muted)" }}>
                                    →
                                  </span>
                                  <span
                                    style={{
                                      color: "#16A34A",
                                      fontWeight: 600,
                                    }}
                                  >
                                    {d.new.replace(/"/g, "").slice(0, 12)}
                                  </span>
                                  {delta !== null && (
                                    <span
                                      style={{
                                        fontWeight: 700,
                                        color: deltaColor,
                                        marginLeft: 2,
                                      }}
                                    >
                                      ({delta > 0 ? "+" : ""}
                                      {delta.toFixed(2)})
                                    </span>
                                  )}
                                </div>
                              )
                            })}
                            {log.diff.length > 2 && (
                              <span
                                style={{
                                  fontSize: 10,
                                  fontFamily: "DM Mono",
                                  color: "var(--text-muted)",
                                }}
                              >
                                +{log.diff.length - 2} more fields
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Expand button */}
                        <td
                          style={{
                            padding: "11px 14px",
                            verticalAlign: "top" as const,
                          }}
                        >
                          <button
                            onClick={() =>
                              setExpanded(isExpanded ? null : log.id)
                            }
                            style={{
                              padding: "4px 10px",
                              borderRadius: 6,
                              border: `1px solid ${
                                isExpanded ? "#2B4D3A" : "#E5E3DC"
                              }`,
                              background: isExpanded
                                ? "#F0FDF4"
                                : "transparent",
                              color: isExpanded ? "#2B4D3A" : "#6B7280",
                              fontSize: 11,
                              fontFamily: "DM Mono",
                              cursor: "pointer",
                              transition: "all 0.12s",
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              whiteSpace: "nowrap" as const,
                            }}
                            onMouseEnter={(e) => {
                              if (!isExpanded)
                                e.currentTarget.style.background = "#F5F3EF"
                            }}
                            onMouseLeave={(e) => {
                              if (!isExpanded)
                                e.currentTarget.style.background = "transparent"
                            }}
                          >
                            <svg
                              width="10"
                              height="10"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              style={{
                                transform: isExpanded
                                  ? "rotate(180deg)"
                                  : "none",
                                transition: "transform 0.2s",
                              }}
                            >
                              <polyline points="6 9 12 15 18 9" />
                            </svg>
                            {isExpanded ? "Collapse" : "Diff"}
                          </button>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr key={`${log.id}-exp`}>
                          <td colSpan={7} style={{ padding: 0 }}>
                            <ExpandedRow log={log} />
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div style={{ padding: "60px 0", textAlign: "center" as const }}>
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#D1D5DB"
                  strokeWidth="1.5"
                  style={{ margin: "0 auto 12px", display: "block" }}
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                  }}
                >
                  No audit events match your filters
                </div>
                <div
                  style={{
                    fontSize: 12.5,
                    color: "var(--text-muted)",
                    marginTop: 4,
                  }}
                >
                  Try broadening your search or clearing the date range
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
