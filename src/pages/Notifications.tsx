/* Responsive: mobile ≤640 | tablet 641–1024 | laptop 1025–1440 | desktop >1440 */
import { useState, useEffect } from "react"
import useSupabaseRealtime from "../hooks/useSupabaseRealtime"
import { useBreakpoint } from "../hooks/useBreakpoint"
import { useToast } from "../contexts/ToastContext"
import { useAuth } from "../contexts/AuthContext"

type Category = "urgent" | "approval" | "warning" | "info"
type LoadState = "loading" | "ok" | "error"

interface Notif {
  id: number
  category: Category
  title: string
  what: string
  why: string
  action?: string
  module: string
  moduleId: string // nav target
  time: string
  timeRaw: number // ms ago for sorting
  read: boolean
}

const CATEGORY_CFG: Record<Category, {
  label: string
  color: string
  bg: string
  border: string
  darkBg: string
  iconPath: string
}> = {
  urgent: {
    label: "Urgent",
    color: "#B91C1C",
    bg: "#FEF2F2",
    border: "#FECACA",
    darkBg: "rgba(248,113,113,0.1)",
    iconPath:
      "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01",
  },
  approval: {
    label: "Needs Approval",
    color: "#B45309",
    bg: "#FFFBEB",
    border: "#FDE68A",
    darkBg: "rgba(251,191,36,0.1)",
    iconPath:
      "M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11",
  },
  warning: {
    label: "Warning",
    color: "#92400E",
    bg: "#FFF7ED",
    border: "#FED7AA",
    darkBg: "rgba(251,146,60,0.1)",
    iconPath:
      "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 8v4M12 16h.01",
  },
  info: {
    label: "Information",
    color: "#1D4ED8",
    bg: "#EFF6FF",
    border: "#BFDBFE",
    darkBg: "rgba(96,165,250,0.1)",
    iconPath:
      "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 16v-4M12 8h.01",
  },
}

const SAMPLE_NOTIFS: Notif[] = []

type FilterKey = "all" | Category | "unread"

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "urgent", label: "Urgent" },
  { key: "approval", label: "Needs Approval" },
  { key: "warning", label: "Warnings" },
  { key: "info", label: "Information" },
]

export default function Notifications() {
  const { isMobile } = useBreakpoint()
  const toast = useToast()
  const { currentUser } = useAuth()
  const [filter, setFilter] = useState<FilterKey>("all")
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [loadState, setLoadState] = useState<LoadState>("loading")

  // Load notifications from Supabase on mount
  useEffect(() => {
    setLoadState("loading")
    import("../services/api").then(({ apiRequest }) => {
      apiRequest<any[]>(`/notifications?userId=${currentUser?.id || ""}`, "GET")
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setNotifs(data.map((n: any) => ({
              id: n.id,
              category: (n.category || "info") as Category,
              title: n.title || "Notification",
              what: n.what || n.message || "",
              why: n.why || n.reason || "",
              action: n.action ?? undefined,
              module: n.module || n.related_entity_type || "",
              moduleId: n.moduleId || n.related_entity_id || "",
              time: n.time || n.created_at || new Date().toLocaleString(),
              timeRaw: n.timeRaw || (n.created_at ? new Date(n.created_at).getTime() : Date.now()),
              read: !!n.read || !!n.is_read,
            })))
          } else {
            // Fallback to localStorage if Supabase has no data yet
            try {
              const raw = localStorage.getItem("erp_notifications_list")
              if (raw) setNotifs(JSON.parse(raw))
            } catch {}
          }
          setLoadState("ok")
        })
        .catch(() => {
          // Fallback to localStorage on network error
          try {
            const raw = localStorage.getItem("erp_notifications_list")
            if (raw) setNotifs(JSON.parse(raw))
          } catch {}
          setLoadState("ok")
        })
    })
  }, [])

  // Realtime: listen for notifications inserted/updated/deleted
  useSupabaseRealtime("notifications", (payload) => {
    const ev = (payload.eventType || (payload as any).event || "").toString().toLowerCase()
    const rec = payload.record
    if (!rec) return
    if (ev.includes("insert")) {
      setNotifs((ns) => [
        {
          id: rec.id,
          category: rec.category ?? "info",
          title: rec.title ?? "Notification",
          what: rec.what ?? "",
          why: rec.why ?? "",
          action: rec.action ?? undefined,
          module: rec.module ?? "",
          moduleId: rec.module_id ?? rec.moduleId ?? "",
          time: rec.time ?? new Date().toLocaleString(),
          timeRaw: rec.time_raw ?? Date.now(),
          read: !!rec.read,
        },
        ...ns,
      ])
    } else if (ev.includes("update")) {
      setNotifs((ns) => ns.map((n) => (n.id === rec.id ? { ...n, ...rec } : n)))
    } else if (ev.includes("delete")) {
      setNotifs((ns) => ns.filter((n) => n.id !== rec.id))
    }
  })

  const unreadCount = notifs.filter((n) => !n.read).length

  const filtered = notifs.filter((n) => {
    if (filter === "all") return true
    if (filter === "unread") return !n.read
    return n.category === filter
  })

  const markRead = (id: number) => {
    setNotifs((ns) => ns.map((n) => (n.id === id ? { ...n, read: true } : n)))
    // Persist to Supabase
    import("../services/api").then(({ apiRequest }) => {
      apiRequest("/notifications", "POST", { action: "mark-read", id }).catch(() => {})
    })
  }
  const markAll = () => {
    setNotifs((ns) => ns.map((n) => ({ ...n, read: true })))
    import("../services/api").then(({ apiRequest }) => {
      apiRequest("/notifications", "POST", { action: "mark-all-read", userId: currentUser?.id }).catch(() => {})
    })
    toast.success("All notifications marked as read.")
  }

  /* ── Skeleton row ─── */
  const SkeletonRow = ({ i }: { i: number }) => (
    <div
      style={{
        padding: "16px 20px",
        borderBottom: "1px solid var(--border-neutral)",
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
      }}
    >
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: "var(--surface-hover)",
          flexShrink: 0,
          marginTop: 6,
          animation: "nSkel 1.4s ease infinite",
          animationDelay: `${i * 0.1}s`,
        }}
      />
      <div
        style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}
      >
        <div
          style={{
            height: 12,
            borderRadius: 6,
            background: "var(--surface-hover)",
            width: "45%",
            animation: "nSkel 1.4s ease infinite",
            animationDelay: `${i * 0.1}s`,
          }}
        />
        <div
          style={{
            height: 10,
            borderRadius: 5,
            background: "var(--surface-hover)",
            width: "75%",
            animation: "nSkel 1.4s ease infinite",
            animationDelay: `${i * 0.1 + 0.1}s`,
          }}
        />
        <div
          style={{
            height: 10,
            borderRadius: 5,
            background: "var(--surface-hover)",
            width: "55%",
            animation: "nSkel 1.4s ease infinite",
            animationDelay: `${i * 0.1 + 0.15}s`,
          }}
        />
      </div>
    </div>
  )

  return (
    <div
      style={{
        padding: isMobile ? "20px 16px" : "28px 32px",
        fontFamily: "Inter, system-ui, sans-serif",
        maxWidth: 860,
        margin: "0 auto",
      }}
    >
      <style>{`
        @keyframes nSkel { 0%,100% { opacity:0.4 } 50% { opacity:0.9 } }
        .notif-row:hover { background: var(--surface-hover) !important; }
      `}</style>

      {/* ── Page header ───────────────────────────────── */}
      <div
        style={{
          marginBottom: 24,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              fontFamily: "DM Mono",
              letterSpacing: "0.09em",
              textTransform: "uppercase",
              color: "var(--text-muted)",
              marginBottom: 5,
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
            Notifications
          </h1>
          {loadState === "ok" && unreadCount > 0 && (
            <div
              style={{
                fontSize: 13,
                color: "var(--text-secondary)",
                marginTop: 4,
              }}
            >
              {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
            </div>
          )}
        </div>
        {loadState === "ok" && unreadCount > 0 && (
          <button
            onClick={markAll}
            style={{
              padding: "7px 14px",
              borderRadius: 7,
              border: "1px solid var(--border-neutral)",
              background: "var(--surface-01)",
              color: "var(--brand-primary)",
              fontSize: 13,
              fontWeight: 500,
              fontFamily: "Inter",
              cursor: "pointer",
              transition: "all 0.15s",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget
              el.style.background = "#F5F3EF"
              el.style.borderColor = "#2B4D3A"
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget
              el.style.background = "var(--surface-01)"
              el.style.borderColor = "var(--border-neutral)"
            }}
          >
            Mark all read
          </button>
        )}
      </div>

      {/* ── Filter tabs ───────────────────────────────── */}
      <div
        style={{
          display: "flex",
          gap: 4,
          overflowX: "auto",
          marginBottom: 16,
          paddingBottom: 4,
          scrollbarWidth: "none",
        }}
      >
        {FILTERS.map((f) => {
          const count =
            f.key === "all"
              ? notifs.length
              : f.key === "unread"
                ? notifs.filter((n) => !n.read).length
                : notifs.filter((n) => n.category === f.key).length
          const active = filter === f.key
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                padding: "6px 12px",
                borderRadius: 7,
                border: `1.5px solid ${
                  active ? "#2B4D3A" : "var(--border-neutral)"
                }`,
                background: active ? "#2B4D3A" : "var(--surface-01)",
                color: active ? "#FFFFFF" : "var(--text-secondary)",
                fontSize: 12.5,
                fontWeight: active ? 600 : 400,
                fontFamily: "Inter",
                cursor: "pointer",
                flexShrink: 0,
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  const el = e.currentTarget
                  el.style.borderColor = "#2B4D3A"
                  el.style.color = "#2B4D3A"
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  const el = e.currentTarget
                  el.style.borderColor = "var(--border-neutral)"
                  el.style.color = "var(--text-secondary)"
                }
              }}
            >
              {f.label}
              {count > 0 && (
                <span
                  style={{
                    fontSize: 10,
                    fontFamily: "DM Mono",
                    fontWeight: 700,
                    background: active
                      ? "rgba(255,255,255,0.2)"
                      : "var(--surface-02)",
                    color: active ? "#FFFFFF" : "var(--text-muted)",
                    padding: "0 5px",
                    borderRadius: 999,
                    lineHeight: "16px",
                    minWidth: 16,
                    textAlign: "center",
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── Content ───────────────────────────────────── */}
      <div
        style={{
          background: "var(--surface-01)",
          border: "1px solid var(--border-neutral)",
          borderRadius: 11,
          overflow: "hidden",
        }}
      >
        {/* Loading */}
        {loadState === "loading" && (
          <div>
            {[0, 1, 2, 3, 4].map((i) => (
              <SkeletonRow key={i} i={i} />
            ))}
          </div>
        )}

        {/* Error */}
        {loadState === "error" && (
          <div style={{ padding: "52px 24px", textAlign: "center" }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 13,
                background: "#FEF2F2",
                border: "1px solid #FCA5A5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 18px",
              }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#DC2626"
                strokeWidth="1.75"
                strokeLinecap="round"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" />
              </svg>
            </div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "var(--text-primary)",
                marginBottom: 5,
              }}
            >
              Unable to load notifications
            </div>
            <div
              style={{
                fontSize: 13,
                color: "var(--text-muted)",
                marginBottom: 18,
              }}
            >
              Please try again.
            </div>
            <button
              onClick={() => {
                setLoadState("loading")
                setTimeout(() => setLoadState("ok"), 900)
              }}
              style={{
                padding: "8px 20px",
                borderRadius: 8,
                background: "#2B4D3A",
                border: "none",
                color: "#FFFFFF",
                fontSize: 13.5,
                fontWeight: 600,
                fontFamily: "Inter",
                cursor: "pointer",
              }}
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty */}
        {loadState === "ok" && filtered.length === 0 && (
          <div style={{ padding: "52px 24px", textAlign: "center" }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 13,
                background: "#F0FDF4",
                border: "1px solid #86EFAC",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 18px",
              }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#16A34A"
                strokeWidth="1.75"
                strokeLinecap="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "var(--text-primary)",
                marginBottom: 5,
              }}
            >
              You're all caught up
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
              You have no new notifications
              {filter !== "all" ? " in this category" : ""}.
            </div>
          </div>
        )}

        {/* Notification rows */}
        {loadState === "ok" &&
          filtered.length > 0 &&
          filtered.map((n, i) => {
            const cfg = CATEGORY_CFG[n.category]
            return (
              <div
                key={n.id}
                className="notif-row"
                onClick={() => markRead(n.id)}
                style={{
                  padding: "16px 20px",
                  borderBottom:
                    i < filtered.length - 1
                      ? "1px solid var(--border-neutral)"
                      : "none",
                  background: n.read ? "var(--surface-01)" : cfg.bg,
                  cursor: "pointer",
                  transition: "background 0.1s",
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                }}
              >
                {/* Unread dot */}
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    flexShrink: 0,
                    marginTop: 7,
                    background: n.read ? "transparent" : cfg.color,
                    transition: "background 0.2s",
                  }}
                />

                {/* Category icon */}
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    flexShrink: 0,
                    background: n.read ? "var(--surface-02)" : cfg.bg,
                    border: `1px solid ${
                      n.read ? "var(--border-neutral)" : cfg.border
                    }`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.15s",
                  }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={n.read ? "var(--text-muted)" : cfg.color}
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d={cfg.iconPath} />
                  </svg>
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13.5,
                        fontWeight: n.read ? 500 : 700,
                        color: "var(--text-primary)",
                        lineHeight: "18px",
                      }}
                    >
                      {n.title}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        flexShrink: 0,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10,
                          fontFamily: "DM Mono",
                          color: cfg.color,
                          background: cfg.bg,
                          border: `1px solid ${cfg.border}`,
                          padding: "1px 7px",
                          borderRadius: 999,
                        }}
                      >
                        {cfg.label}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          fontFamily: "DM Mono",
                          color: "var(--text-muted)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {n.time}
                      </span>
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "var(--text-secondary)",
                      lineHeight: 1.5,
                      marginTop: 4,
                    }}
                  >
                    {n.what}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--text-muted)",
                      lineHeight: 1.5,
                      marginTop: 3,
                      fontStyle: "italic",
                    }}
                  >
                    {n.why}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginTop: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    {n.action && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          markRead(n.id)
                        }}
                        style={{
                          padding: "4px 12px",
                          borderRadius: 5,
                          border: `1px solid ${cfg.border}`,
                          background: "transparent",
                          color: cfg.color,
                          fontSize: 12,
                          fontWeight: 600,
                          fontFamily: "Inter",
                          cursor: "pointer",
                          transition: "background 0.1s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = cfg.bg)
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        {n.action}
                      </button>
                    )}
                    <span
                      style={{
                        fontSize: 10.5,
                        fontFamily: "DM Mono",
                        color: "var(--text-muted)",
                        background: "var(--surface-02)",
                        padding: "2px 7px",
                        borderRadius: 4,
                        border: "1px solid var(--border-neutral)",
                      }}
                    >
                      {n.module}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
      </div>
    </div>
  )
}
