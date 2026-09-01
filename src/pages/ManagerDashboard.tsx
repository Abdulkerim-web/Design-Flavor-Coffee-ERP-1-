/* Responsive: mobile ≤640 | tablet 641–1024 | laptop 1025–1440 | desktop >1440 */
import { useState, useEffect, useCallback, type FC, type ReactNode } from "react"
import { useBreakpoint } from "../hooks/useBreakpoint"
import { useAuth } from "../contexts/AuthContext"
import { canRead } from "../lib/rbac"
import { CustomerFormModal } from "../components/CustomerFormModal"
import { approveCustomer, rejectCustomer } from "../services/customers"
import useSupabaseRealtime from "../hooks/useSupabaseRealtime"

/* ─────────────────────────────────────────────────────────────
   TYPES — These mirror the shape of PHP API responses.
   All business values are backend-provided; the frontend only
   renders what it receives.
───────────────────────────────────────────────────────────── */
type LoadState = "loading" | "ok" | "error"
type FeasibilityState = "safe" | "warning" | "insufficient"
type DateRange = "today" | "week" | "month" | "quarter" | "custom"

interface AttentionCard {
  id: string
  severity: "urgent" | "warning" | "approval" | "info"
  category: string
  title: string
  description: string
  details?: { label: string value: string }[]
  feasibility?: FeasibilityState
  primaryAction: string
  secondaryAction?: string
  module: string
  age: string
}

interface KpiCard {
  label: string
  value: string
  sub: string
  icon: string
  trend?: "up" | "down" | "flat"
  trendVal?: string
}
interface OrderStatus {
  label: string
  count: number
  color: string
}
interface InventoryItem {
  label: string
  onHand: string
  reserved: string
  available: string
  unit: string
  alert?: boolean
}
interface FinanceRow {
  label: string
  value: string
  sub?: string
  emphasis?: boolean
  isSeparator?: boolean
}
interface ActivityEvent {
  id: number
  time: string
  event: string
  record: string
  actor?: string
  module: string
  iconPath: string
  iconColor: string
}

/* ─────────────────────────────────────────────────────────────
   ILLUSTRATIVE DATA — production data comes from PHP backend.
   All values here are placeholders for visual design purposes.
   NOTHING in this file calculates business logic.
───────────────────────────────────────────────────────────── */
const ATTENTION_CARDS: AttentionCard[] = []

const KPI_CARDS: KpiCard[] = [
  {
    label: "Orders in Progress",
    value: "0",
    sub: "0 awaiting confirmation",
    icon: "M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18",
    trend: "flat",
    trendVal: "0 today",
  },
  {
    label: "Active Roasting",
    value: "0 batches",
    sub: "0 KG in progress",
    icon: "M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0",
    trend: "flat",
    trendVal: "on schedule",
  },
  {
    label: "Active Packing",
    value: "0 orders",
    sub: "0 KG being packed",
    icon: "M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z",
    trend: "flat",
    trendVal: "",
  },
  {
    label: "Ready for Delivery",
    value: "0 orders",
    sub: "0 KG packed & ready",
    icon: "M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11",
    trend: "flat",
    trendVal: "0 today",
  },
  {
    label: "Today's Deliveries",
    value: "0 deliveries",
    sub: "0 completed, 0 en route",
    icon: "M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM5.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM18.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5z",
    trend: "flat",
    trendVal: "on schedule",
  },
  {
    label: "Pending Payments",
    value: "ETB 0.00",
    sub: "0 outstanding invoices",
    icon: "M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6",
    trend: "flat",
    trendVal: "ETB 0 overdue",
  },
]

const ORDER_STATUSES: OrderStatus[] = [
  { label: "Awaiting Confirmation", count: 0, color: "#F59E0B" },
  { label: "Confirmed / Reserved", count: 0, color: "#2563EB" },
  { label: "Roasting", count: 0, color: "#D97706" },
  { label: "Awaiting Storekeeper", count: 0, color: "#7C3AED" },
  { label: "Packing", count: 0, color: "#0891B2" },
  { label: "Ready for Delivery", count: 0, color: "#16A34A" },
  { label: "Partially Delivered", count: 0, color: "#6B7280" },
  { label: "Payment Pending", count: 0, color: "#DC2626" },
]

const INVENTORY_CATEGORIES: InventoryItem[] = []

const LOW_STOCK_COUNT = 0

const FINANCE_ROWS: Record<DateRange, FinanceRow[]> = {
  today: [
    { label: "Revenue", value: "ETB 0.00" },
    { label: "VAT (15%)", value: "ETB 0.00", sub: "collected" },
    { label: "Expenses", value: "ETB 0.00" },
    {
      label: "Outstanding Receivables",
      value: "ETB 0.00",
      sub: "0 invoices",
    },
    { label: "Net (after expenses)", value: "ETB 0.00", emphasis: true },
  ],
  week: [
    { label: "Revenue", value: "ETB 0.00" },
    { label: "VAT (15%)", value: "ETB 0.00", sub: "collected" },
    { label: "Expenses", value: "ETB 0.00" },
    { label: "Payroll", value: "ETB 0.00" },
    {
      label: "Outstanding Receivables",
      value: "ETB 0.00",
      sub: "0 invoices",
    },
    { label: "Net (after expenses)", value: "ETB 0.00", emphasis: true },
  ],
  month: [
    { label: "Revenue", value: "ETB 0.00" },
    { label: "VAT (15%)", value: "ETB 0.00", sub: "collected" },
    { label: "Expenses", value: "ETB 0.00" },
    { label: "Payroll", value: "ETB 0.00" },
    {
      label: "Outstanding Receivables",
      value: "ETB 0.00",
      sub: "0 invoices",
    },
    { label: "Net Profit", value: "ETB 0.00", emphasis: true },
  ],
  quarter: [
    { label: "Revenue", value: "ETB 0.00" },
    { label: "VAT (15%)", value: "ETB 0.00", sub: "collected" },
    { label: "Expenses", value: "ETB 0.00" },
    { label: "Payroll", value: "ETB 0.00" },
    {
      label: "Outstanding Receivables",
      value: "ETB 0.00",
      sub: "0 invoices",
    },
    { label: "Net Profit", value: "ETB 0.00", emphasis: true },
  ],
  custom: [
    { label: "Revenue", value: "ETB 0.00" },
    { label: "VAT (15%)", value: "ETB 0.00", sub: "collected" },
    { label: "Expenses", value: "ETB 0.00" },
    {
      label: "Outstanding Receivables",
      value: "ETB 0.00",
      sub: "0 invoices",
    },
    { label: "Net (after expenses)", value: "ETB 0.00", emphasis: true },
  ],
}

const ACTIVITY: ActivityEvent[] = []

/* ─────────────────────────────────────────────────────────────
   PRIMITIVE COMPONENTS
───────────────────────────────────────────────────────────── */
const SvgIcon: FC<{
  d?: string
  size?: number
  stroke?: string
  strokeW?: number
}> = ({ d, size = 14, stroke = "currentColor", strokeW = 1.75 }) => {
  if (!d || !d.startsWith("M")) {
    return <span style={{ fontSize: size }}>{d || ""}</span>
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeW}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {d
        .split("M")
        .filter(Boolean)
        .map((seg, i) => (
          <path key={i} d={`M${seg}`} />
        ))}
    </svg>
  )
}

const SectionHeading: FC<{ title: string sub?: string action?: ReactNode }> = ({
  title,
  sub,
  action,
}) => (
  <div
    style={{
      display: "flex",
      alignItems: "baseline",
      justifyContent: "space-between",
      marginBottom: 14,
      gap: 12,
    }}
  >
    <div>
      <h2
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: "var(--text-primary)",
          margin: 0,
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </h2>
      {sub && (
        <div
          style={{
            fontSize: 12,
            color: "var(--text-muted)",
            marginTop: 2,
            fontFamily: "Inter",
          }}
        >
          {sub}
        </div>
      )}
    </div>
    {action}
  </div>
)

const TextBtn: FC<{ label: string onClick?: () => void }> = ({
  label,
  onClick,
}) => (
  <button
    onClick={onClick}
    style={{
      background: "none",
      border: "none",
      cursor: "pointer",
      fontSize: 12.5,
      color: "var(--brand-primary)",
      fontWeight: 600,
      fontFamily: "Inter",
      padding: 0,
      display: "flex",
      alignItems: "center",
      gap: 4,
      whiteSpace: "nowrap",
    }}
  >
    {label}
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  </button>
)

const Card: FC<{ children: ReactNode style?: React.CSSProperties }> = ({
  children,
  style,
}) => (
  <div
    style={{
      background: "var(--surface-01)",
      border: "1px solid var(--border-neutral)",
      borderRadius: 11,
      overflow: "hidden",
      ...style,
    }}
  >
    {children}
  </div>
)

const Divider = () => (
  <div style={{ height: 1, background: "var(--border-neutral)" }} />
)

/* ─────────────────────────────────────────────────────────────
   SKELETON LOADER
───────────────────────────────────────────────────────────── */
const Skel: FC<{
  w?: string
  h?: number
  radius?: number
  style?: React.CSSProperties
}> = ({ w = "100%", h = 12, radius = 5, style }) => (
  <div
    style={{
      width: w,
      height: h,
      borderRadius: radius,
      background: "var(--surface-hover)",
      animation: "dSkel 1.4s ease infinite",
      ...style,
    }}
  />
)

const SkeletonAttention = () => (
  <Card style={{ padding: "18px 20px" }}>
    <div style={{ display: "flex", gap: 12 }}>
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 9,
          background: "var(--surface-hover)",
          flexShrink: 0,
          animation: "dSkel 1.4s ease infinite",
        }}
      />
      <div
        style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}
      >
        <Skel w="30%" h={10} />
        <Skel w="65%" h={14} />
        <Skel w="80%" h={11} />
        <div style={{ display: "flex", gap: 16, marginTop: 4 }}>
          {[55, 70, 60].map((w, i) => (
            <Skel key={i} w={`${w}%`} h={10} />
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          <Skel w="100px" h={30} radius={8} />
        </div>
      </div>
    </div>
  </Card>
)

const SkeletonKpi = () => (
  <Card style={{ padding: "16px 18px" }}>
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <Skel w="50%" h={10} />
      <Skel w="40%" h={22} />
      <Skel w="65%" h={10} />
    </div>
  </Card>
)

/* ─────────────────────────────────────────────────────────────
   FEASIBILITY BADGE
───────────────────────────────────────────────────────────── */
const FeasibilityBadge: FC<{ state: FeasibilityState }> = ({ state }) => {
  const cfg = {
    safe: {
      label: "Safe to fulfil",
      color: "#16A34A",
      bg: "#F0FDF4",
      border: "#86EFAC",
      icon: "M9 11l3 3L22 4",
    },
    warning: {
      label: "Approaching limit",
      color: "#D97706",
      bg: "#FFFBEB",
      border: "#FCD34D",
      icon: "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01",
    },
    insufficient: {
      label: "Stock insufficient",
      color: "#DC2626",
      bg: "#FEF2F2",
      border: "#FCA5A5",
      icon: "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01",
    },
  }[state]
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 9px",
        borderRadius: 999,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
      }}
    >
      <SvgIcon d={cfg.icon} size={11} stroke={cfg.color} strokeW={2.5} />
      <span
        style={{
          fontSize: 11,
          fontFamily: "DM Mono",
          fontWeight: 600,
          color: cfg.color,
          letterSpacing: "0.04em",
        }}
      >
        {cfg.label}
      </span>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   ATTENTION CARD
───────────────────────────────────────────────────────────── */
const SEVERITY_CFG = {
  urgent: {
    color: "#B91C1C",
    bg: "#FEF2F2",
    border: "#FCA5A5",
    bar: "#DC2626",
    iconPath:
      "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01",
  },
  warning: {
    color: "#B45309",
    bg: "#FFFBEB",
    border: "#FDE68A",
    bar: "#F59E0B",
    iconPath:
      "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 8v4M12 16h.01",
  },
  approval: {
    color: "#1D4ED8",
    bg: "#EFF6FF",
    border: "#BFDBFE",
    bar: "#2563EB",
    iconPath:
      "M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11",
  },
  info: {
    color: "#0369A1",
    bg: "#F0F9FF",
    border: "#BAE6FD",
    bar: "#0284C7",
    iconPath:
      "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
}

const AttentionCardUI: FC<{
  card: AttentionCard
  onNavigate?: (id: string, params?: any) => void
  onResolveCard?: (cardId: string) => void
}> = ({ card, onNavigate, onResolveCard }) => {
  const cfg = SEVERITY_CFG[card.severity] || SEVERITY_CFG.info
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [rejectErr, setRejectErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleApproveCustomer = async () => {
    setLoading(true)
    const custId = card.id.replace("cus-", "")
    await approveCustomer(custId, "General Manager")

    // Send system notification
    try {
      const raw = localStorage.getItem("erp_notifications_list")
      const list = raw ? JSON.parse(raw) : []
      const notif = {
        id: Date.now(),
        category: "info",
        title: "Customer Registration Approved",
        what: `Customer request "${card.title}" has been approved by management and is now active.`,
        why: "Approved by General Manager via Manager Dashboard.",
        module: "customers",
        moduleId: custId,
        time: "Just now",
        timeRaw: Date.now(),
        read: false,
      }
      localStorage.setItem("erp_notifications_list", JSON.stringify([notif, ...list]))
    } catch {}

    setLoading(false)
    onResolveCard?.(card.id)
  }

  const handleRejectCustomerSubmit = async () => {
    if (!rejectReason.trim()) {
      setRejectErr("Rejection reason is required.")
      return
    }
    setRejectErr(null)
    setLoading(true)
    const custId = card.id.replace("cus-", "")
    const reasonText = rejectReason.trim()
    await rejectCustomer(custId, reasonText, "General Manager")

    // Send system notification
    try {
      const raw = localStorage.getItem("erp_notifications_list")
      const list = raw ? JSON.parse(raw) : []
      const notif = {
        id: Date.now(),
        category: "warning",
        title: "Customer Registration Rejected",
        what: `Customer registration request "${card.title}" has been rejected.`,
        why: `Reason: ${reasonText}`,
        module: "customers",
        moduleId: custId,
        time: "Just now",
        timeRaw: Date.now(),
        read: false,
      }
      localStorage.setItem("erp_notifications_list", JSON.stringify([notif, ...list]))
    } catch {}

    setLoading(false)
    setRejectModalOpen(false)
    onResolveCard?.(card.id)
  }

  return (
    <div
      style={{
        background: "var(--surface-01)",
        border: `1px solid ${cfg.border}`,
        borderLeft: `3px solid ${cfg.bar}`,
        borderRadius: 10,
        padding: "16px 18px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 11 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            flexShrink: 0,
            background: cfg.bg,
            border: `1px solid ${cfg.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <SvgIcon d={cfg.iconPath} size={15} stroke={cfg.color} strokeW={2} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              marginBottom: 3,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontFamily: "DM Mono",
                fontWeight: 700,
                color: cfg.color,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              {card.category}
            </span>
            <span
              style={{
                fontSize: 10.5,
                fontFamily: "DM Mono",
                color: "var(--text-muted)",
              }}
            >
              {card.age}
            </span>
          </div>
          <div
            style={{
              fontSize: 13.5,
              fontWeight: 700,
              color: "var(--text-primary)",
              lineHeight: "18px",
            }}
          >
            {card.title}
          </div>
        </div>
      </div>

      <p
        style={{
          fontSize: 13,
          color: "var(--text-secondary)",
          lineHeight: 1.55,
          margin: 0,
        }}
      >
        {card.description}
      </p>

      {/* Feasibility */}
      {card.feasibility && (
        <div>
          <FeasibilityBadge state={card.feasibility} />
        </div>
      )}

      {/* Detail grid */}
      {card.details && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
            gap: "6px 16px",
            background: "var(--surface-02)",
            border: "1px solid var(--border-neutral)",
            borderRadius: 7,
            padding: "10px 12px",
          }}
        >
          {card.details.map((d) => (
            <div key={d.label}>
              <div
                style={{
                  fontSize: 10.5,
                  fontFamily: "DM Mono",
                  color: "var(--text-muted)",
                  letterSpacing: "0.04em",
                  marginBottom: 2,
                }}
              >
                {d.label}
              </div>
              <div
                style={{
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  fontFamily: "DM Mono",
                }}
              >
                {d.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <button
          style={{
            padding: "7px 16px",
            borderRadius: 7,
            border: "none",
            background: cfg.color,
            color: "#FFFFFF",
            fontSize: 12.5,
            fontWeight: 600,
            fontFamily: "Inter",
            cursor: "pointer",
            transition: "opacity 0.15s",
          }}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.opacity = "0.88"
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.opacity = "1"
          }}
          onClick={() => {
            if (card.module === "customers") {
              onNavigate?.("customers", { view: "detail", id: card.id.replace("cus-", "") })
            } else if (card.module === "orders") {
              onNavigate?.("orders", { view: "detail", id: card.id.replace("ord-", "") })
            } else {
              onNavigate?.(card.module)
            }
          }}
        >
          {card.primaryAction}
        </button>

        {card.module === "customers" && (
          <>
            <button
              disabled={loading}
              onClick={handleApproveCustomer}
              style={{
                padding: "7px 14px",
                borderRadius: 7,
                border: "none",
                background: "#059669",
                color: "#FFFFFF",
                fontSize: 12.5,
                fontWeight: 600,
                cursor: loading ? "wait" : "pointer",
              }}
            >
              Approve
            </button>
            <button
              disabled={loading}
              onClick={() => setRejectModalOpen(true)}
              style={{
                padding: "7px 14px",
                borderRadius: 7,
                border: "1px solid #FCA5A5",
                background: "#FEF2F2",
                color: "#DC2626",
                fontSize: 12.5,
                fontWeight: 600,
                cursor: loading ? "wait" : "pointer",
              }}
            >
              Reject
            </button>
          </>
        )}

        {card.secondaryAction && (
          <button
            onClick={() => onNavigate?.('inventory')}
            style={{
              padding: "7px 14px",
              borderRadius: 7,
              border: `1px solid ${cfg.border}`,
              background: "transparent",
              color: cfg.color,
              fontSize: 12.5,
              fontWeight: 500,
              fontFamily: "Inter",
              cursor: "pointer",
            }}
          >
            {card.secondaryAction}
          </button>
        )}
      </div>

      {/* Rejection Reason Required Modal */}
      {rejectModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              background: "var(--surface-01)",
              border: "1px solid var(--border-neutral)",
              borderRadius: 12,
              padding: 24,
              maxWidth: 440,
              width: "100%",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 8px", color: "var(--text-primary)" }}>
              Reject Customer Registration
            </h3>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 14px" }}>
              Please enter the required reason for rejecting <strong>{card.title}</strong>. The responsible sales representative will be notified with this reason.
            </p>
            {rejectErr && (
              <div style={{ color: "#DC2626", fontSize: 12.5, marginBottom: 10, fontWeight: 600 }}>
                {rejectErr}
              </div>
            )}
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => {
                setRejectReason(e.target.value)
                if (e.target.value.trim()) setRejectErr(null)
              }}
              placeholder="Enter rejection reason (required)..."
              style={{
                width: "100%",
                borderRadius: 8,
                border: "1px solid var(--border-neutral)",
                padding: "10px 12px",
                fontSize: 13,
                fontFamily: "Inter, sans-serif",
                background: "var(--surface-02)",
                color: "var(--text-primary)",
                marginBottom: 16,
              }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                onClick={() => {
                  setRejectModalOpen(false)
                  setRejectErr(null)
                }}
                style={{
                  padding: "8px 16px",
                  borderRadius: 7,
                  border: "1px solid var(--border-neutral)",
                  background: "transparent",
                  color: "var(--text-primary)",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                disabled={loading}
                onClick={handleRejectCustomerSubmit}
                style={{
                  padding: "8px 18px",
                  borderRadius: 7,
                  border: "none",
                  background: "#DC2626",
                  color: "#FFFFFF",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: loading ? "wait" : "pointer",
                }}
              >
                {loading ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   KPI CARD
───────────────────────────────────────────────────────────── */
const KpiCardUI: FC<{
  card: KpiCard
  financeRange: DateRange
  setFinanceRange: (r: DateRange) => void
  onNavigate?: (id: string) => void
}> = ({ card, financeRange, setFinanceRange, onNavigate }) => (
  <Card
    style={{
      padding: "18px 20px",
      transition: "transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease",
      cursor: "pointer",
      position: "relative",
      overflow: "hidden",
      background: "var(--surface-01)",
    }}
    onMouseEnter={(e) => {
      const el = e.currentTarget as HTMLDivElement
      el.style.transform = "translateY(-3px)"
      el.style.boxShadow = "0 8px 20px rgba(0,0,0,0.06)"
      el.style.borderColor = "#2B4D3A"
    }}
    onMouseLeave={(e) => {
      const el = e.currentTarget as HTMLDivElement
      el.style.transform = "translateY(0)"
      el.style.boxShadow = "none"
      el.style.borderColor = "var(--border-neutral)"
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 8,
        marginBottom: 10,
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: "var(--text-muted)",
          fontFamily: "Inter",
          lineHeight: 1.3,
          flex: 1,
          letterSpacing: "0.01em",
        }}
      >
        {card.label}
      </div>
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 7,
          background: "var(--surface-02)",
          border: "1px solid var(--border-neutral)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <SvgIcon d={card.icon} size={13} stroke="var(--text-secondary)" />
      </div>
    </div>
    <div
      style={{
        fontSize: 20,
        fontWeight: 700,
        color: "var(--text-primary)",
        fontFamily: "DM Mono",
        letterSpacing: "-0.02em",
        lineHeight: 1,
        marginBottom: 6,
      }}
    >
      {card.value}
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      {card.trend && card.trend !== "flat" && (
        <svg
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill="none"
          stroke={card.trend === "down" ? "#DC2626" : "#16A34A"}
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <path
            d={
              card.trend === "down"
                ? "M18 15l-6 6-6-6M12 9v12"
                : "M6 9l6-6 6 6M12 15V3"
            }
          />
        </svg>
      )}
      <span
        style={{
          fontSize: 11.5,
          color:
            card.trend === "down" ? "var(--sem-danger)" : "var(--text-muted)",
          fontFamily: "Inter",
        }}
      >
        {card.sub}
      </span>
    </div>
  </Card>
)

/* ─────────────────────────────────────────────────────────────
   DATE RANGE SELECTOR
───────────────────────────────────────────────────────────── */
const RANGE_LABELS: Record<DateRange, string> = {
  today: "Today",
  week: "This Week",
  month: "This Month",
  quarter: "This Quarter",
  custom: "Custom",
}

const DateRangePicker: FC<{
  value: DateRange
  onChange: (v: DateRange) => void
}> = ({ value, onChange }) => (
  <div
    style={{
      display: "flex",
      gap: 3,
      background: "var(--surface-02)",
      padding: 3,
      borderRadius: 8,
      border: "1px solid var(--border-neutral)",
    }}
  >
    {(Object.keys(RANGE_LABELS) as DateRange[]).map((r) => (
      <button
        key={r}
        onClick={() => onChange(r)}
        style={{
          padding: "4px 10px",
          borderRadius: 5,
          border: "none",
          background: value === r ? "var(--surface-01)" : "transparent",
          color: value === r ? "var(--text-primary)" : "var(--text-muted)",
          fontSize: 11.5,
          fontFamily: "Inter",
          fontWeight: value === r ? 600 : 400,
          cursor: "pointer",
          transition: "all 0.12s ease",
          boxShadow: value === r ? "0 1px 3px rgba(0,0,0,0.07)" : "none",
          whiteSpace: "nowrap",
        }}
      >
        {RANGE_LABELS[r]}
      </button>
    ))}
  </div>
)

/* ─────────────────────────────────────────────────────────────
   INVENTORY ROW
───────────────────────────────────────────────────────────── */
const InventoryRow: FC<{ item: InventoryItem; isLast?: boolean }> = ({
  item,
  isLast,
}) => (
  <div
    style={{
      padding: "14px 18px",
      borderBottom: isLast ? "none" : "1px solid var(--border-neutral)",
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text-primary)",
            fontFamily: "Inter",
          }}
        >
          {item.label}
        </span>
        {item.alert && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "1px 7px",
              borderRadius: 999,
              background: "#FEF2F2",
              border: "1px solid #FECACA",
            }}
          >
            <div
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: "#DC2626",
              }}
            />
            <span
              style={{
                fontSize: 10,
                fontFamily: "DM Mono",
                fontWeight: 700,
                color: "#DC2626",
              }}
            >
              Low stock
            </span>
          </div>
        )}
      </div>
    </div>
    <div
      style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}
    >
      {[
        { label: "On Hand", value: item.onHand, color: "var(--text-primary)" },
        { label: "Reserved", value: item.reserved, color: "#D97706" },
        { label: "Available", value: item.available, color: "#16A34A" },
      ].map((col) => (
        <div
          key={col.label}
          style={{
            background: "var(--surface-02)",
            borderRadius: 7,
            padding: "8px 10px",
            border: "1px solid var(--border-neutral)",
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontFamily: "DM Mono",
              color: "var(--text-muted)",
              letterSpacing: "0.05em",
              marginBottom: 3,
            }}
          >
            {col.label}
          </div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: col.color,
              fontFamily: "DM Mono",
              letterSpacing: "-0.01em",
            }}
          >
            {col.value}
          </div>
          <div
            style={{
              fontSize: 9.5,
              color: "var(--text-muted)",
              fontFamily: "DM Mono",
              marginTop: 1,
            }}
          >
            {item.unit}
          </div>
        </div>
      ))}
    </div>
  </div>
)

/* ─────────────────────────────────────────────────────────────
   ACTIVITY ROW
───────────────────────────────────────────────────────────── */
const ActivityRow: FC<{ ev: ActivityEvent; isLast?: boolean }> = ({
  ev,
  isLast,
}) => (
  <div
    style={{
      display: "flex",
      gap: 12,
      padding: "12px 18px",
      borderBottom: isLast ? "none" : "1px solid var(--border-neutral)",
      alignItems: "flex-start",
    }}
  >
    <div
      style={{
        width: 28,
        height: 28,
        borderRadius: 7,
        flexShrink: 0,
        background: "var(--surface-02)",
        border: "1px solid var(--border-neutral)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <SvgIcon d={ev.iconPath} size={12} stroke={ev.iconColor} strokeW={2} />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div
        style={{
          fontSize: 13,
          color: "var(--text-primary)",
          lineHeight: "17px",
          marginBottom: 2,
        }}
      >
        {ev.event}{" "}
        <span
          style={{
            fontFamily: "DM Mono",
            fontSize: 12,
            color: "var(--brand-primary)",
            fontWeight: 500,
          }}
        >
          {ev.record}
        </span>
      </div>
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        {ev.actor && (
          <span
            style={{
              fontSize: 11.5,
              color: "var(--text-muted)",
              fontFamily: "Inter",
            }}
          >
            {ev.actor}
          </span>
        )}
        <span
          style={{
            fontSize: 10.5,
            fontFamily: "DM Mono",
            color: "var(--text-muted)",
            background: "var(--surface-02)",
            padding: "1px 6px",
            borderRadius: 4,
            border: "1px solid var(--border-neutral)",
          }}
        >
          {ev.module}
        </span>
        <span
          style={{
            fontSize: 10.5,
            fontFamily: "DM Mono",
            color: "var(--text-muted)",
          }}
        >
          {ev.time}
        </span>
      </div>
    </div>
  </div>
)

/* ─────────────────────────────────────────────────────────────
   ERROR STATE
───────────────────────────────────────────────────────── */
const SectionError: FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <div style={{ padding: "24px", textAlign: "center" }}>
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: 10,
        background: "#FEF2F2",
        border: "1px solid #FCA5A5",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "0 auto 12px",
      }}
    >
      <svg
        width="18"
        height="18"
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
        fontSize: 13.5,
        fontWeight: 600,
        color: "var(--text-primary)",
        marginBottom: 4,
      }}
    >
      Unable to load this section
    </div>
    <div
      style={{ fontSize: 12.5, color: "var(--text-muted)", marginBottom: 12 }}
    >
      Please try again.
    </div>
    <button
      onClick={onRetry}
      style={{
        padding: "6px 14px",
        borderRadius: 7,
        background: "#2B4D3A",
        border: "none",
        color: "#FFFFFF",
        fontSize: 12.5,
        fontWeight: 600,
        fontFamily: "Inter",
        cursor: "pointer",
      }}
    >
      Try Again
    </button>
  </div>
)

/* ─────────────────────────────────────────────────────────────
   MAIN DASHBOARD
───────────────────────────────────────────────────────────── */
export default function ManagerDashboard({
  onNavigate,
}: {
  onNavigate?: (id: string) => void
}) {
  const { currentUser } = useAuth()
  const { isMobile, isTablet } = useBreakpoint()
  const isNarrow = isMobile || isTablet

  const [loadState, setLoadState] = useState<LoadState>("loading")
  const [financeRange, setFinanceRange] = useState<DateRange>("month")
  const [financeState, setFinanceState] = useState<LoadState>("loading")
  const [activityState, setActivityState] = useState<LoadState>("loading")
  const [inventoryState, setInventoryState] = useState<LoadState>("loading")
  const [lastUpdated, setLastUpdated] = useState<string>("just now")
  const [attentionItems, setAttentionItems] = useState<AttentionCard[]>([])
  const [kpis, setKpis] = useState<KpiCard[]>([])
  const [statuses, setStatuses] = useState<OrderStatus[]>([])
  const [finances, setFinances] = useState<FinanceRow[]>([])
  const [activities, setActivities] = useState<ActivityEvent[]>([])
  const [customerModalOpen, setCustomerModalOpen] = useState(false)

  const loadDashboard = useCallback(async () => {
    try {
      const { apiRequest } = await import("../services/api")
      const data = await apiRequest<any>("/dashboard/manager")
      setAttentionItems(data.attentionCards || [])
      setKpis(data.kpiCards || [])
      setStatuses(data.orderStatuses || [])
      setFinances(data.financeRows || [])
      setActivities(data.activityFeed || [])
      setLoadState("ok")
      setFinanceState("ok")
      setActivityState("ok")
      setInventoryState("ok")
    } catch (err) {
      setLoadState("error")
    }
  }, [])

  // Fetch real data from backend
  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  // Realtime: refresh dashboard whenever orders, customers, or roasting data changes
  useSupabaseRealtime("orders", loadDashboard)
  useSupabaseRealtime("customers", loadDashboard)
  useSupabaseRealtime("roasting_batches", loadDashboard)

  // Update finance when range changes
  useEffect(() => {
    if (loadState !== "ok") return
    setFinanceState("loading")
    const t = setTimeout(() => setFinanceState("ok"), 500)
    return () => clearTimeout(t)
  }, [financeRange, loadState])

  const role = currentUser?.role ?? "general-manager"
  const canSeeFinance = canRead(role, "finance")
  const canSeeApprovals = canRead(role, "approvals")
  const canSeeInventory = canRead(role, "inventory")
  const canSeeOrders = canRead(role, "orders")

  // Quick actions — filtered by role
  const QUICK_ACTIONS = [
    {
      label: "Add Customer",
      icon: "M12 5v14M5 12h14",
      module: "add_customer",
      show: true,
    },
    {
      label: "Review Orders",
      icon: "M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18",
      module: "orders",
      show: canSeeOrders,
    },
    {
      label: "Review Approvals",
      icon: "M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11",
      module: "approvals",
      show: canSeeApprovals,
    },
    {
      label: "View Inventory",
      icon: "M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z",
      module: "inventory",
      show: canSeeInventory,
    },
    {
      label: "Review Payments",
      icon: "M1 4h22v16H1zM1 10h22",
      module: "payments",
      show: canSeeFinance,
    },
    {
      label: "View Reports",
      icon: "M18 20V10M12 20V4M6 20v-6",
      module: "reports",
      show: canRead(role, "reports"),
    },
  ].filter((a) => a.show)

  // ── Layout helpers ──
  const col2 = isNarrow ? "1fr" : "1fr 1fr"
  const col3 = isMobile ? "1fr" : isTablet ? "1fr 1fr" : "1fr 1fr 1fr"
  const kpiCols = isMobile
    ? "1fr 1fr"
    : isTablet
      ? "1fr 1fr 1fr"
      : "repeat(6, 1fr)"

  return (
    <div
      style={{
        padding: isMobile ? "16px 14px 24px" : "24px 28px 32px",
        fontFamily: "Inter, system-ui, sans-serif",
        minHeight: "100%",
      }}
    >
      <style>{`
        @keyframes dSkel { 0%,100% { opacity:0.4 } 50% { opacity:0.9 } }
        @keyframes dFadeIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        .dash-section { animation: dFadeIn 0.35s ease both; }
        .qa-btn:hover { background: var(--surface-hover) !important; border-color: #2B4D3A !important; color: #2B4D3A !important; }
      `}</style>

      {/* ── Page header ─────────────────────────────────── */}
      <div
        style={{
          background: "linear-gradient(135deg, #1C2E22 0%, #2B4D3A 100%)",
          borderRadius: 16,
          padding: isMobile ? "20px 18px" : "24px 28px",
          marginBottom: 24,
          color: "#FFFFFF",
          boxShadow: "0 10px 25px rgba(0,0,0,0.12)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "relative", zIndex: 1 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "3px 10px",
              borderRadius: 20,
              background: "rgba(255,255,255,0.12)",
              backdropFilter: "blur(4px)",
              fontSize: 11,
              fontFamily: "DM Mono",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#E2E8F0",
              marginBottom: 8,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ADE80" }} />
            General Manager Portal • Real-Time ERP Operations
          </div>
          <h1
            style={{
              fontSize: isMobile ? 22 : 26,
              fontWeight: 800,
              color: "#FFFFFF",
              margin: 0,
              letterSpacing: "-0.03em",
              lineHeight: 1.2,
            }}
          >
            Welcome back, {currentUser?.name || "General Manager"}
          </h1>
          <p
            style={{
              fontSize: 13.5,
              color: "rgba(255,255,255,0.72)",
              margin: "6px 0 0",
              lineHeight: 1.4,
              maxWidth: 540,
            }}
          >
            Here is your live real-time executive dashboard summarizing coffee roasting schedules, inventory, and pending approvals.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, position: "relative", zIndex: 1 }}>
          {loadState === "ok" && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                borderRadius: 20,
                background: "rgba(255,255,255,0.14)",
                fontSize: 11.5,
                color: "#FFFFFF",
                fontFamily: "DM Mono",
                fontWeight: 600,
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#4ADE80",
                  boxShadow: "0 0 0 3px rgba(74,222,128,0.3)",
                }}
              />
              Synced {lastUpdated}
            </div>
          )}
          <button
            onClick={() => {
              setLoadState("loading")
              setTimeout(() => {
                setLoadState("ok")
                setLastUpdated("just now")
              }, 600)
            }}
            style={{
              padding: "7px 16px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.25)",
              background: "rgba(255,255,255,0.15)",
              color: "#FFFFFF",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12.5,
              fontWeight: 600,
              fontFamily: "Inter",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.28)"
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.15)"
            }}
          >
            <SvgIcon d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" size={14} stroke="#FFFFFF" />
            Refresh Data
          </button>
        </div>
      </div>

      {/* ── Full-page loading ─────────────────────────────── */}
      {loadState === "loading" && (
        <div className="dash-section">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 18,
            }}
          >
            <Skel w="120px" h={14} />
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              marginBottom: 28,
            }}
          >
            <SkeletonAttention />
            <SkeletonAttention />
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: kpiCols,
              gap: 10,
              marginBottom: 24,
            }}
          >
            {[...Array(6)].map((_, i) => (
              <SkeletonKpi key={i} />
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: col2, gap: 16 }}>
            <Card style={{ padding: "18px", height: 200 }}>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                <Skel w="40%" h={12} />
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Skel w="50%" />
                    <Skel w="20%" />
                  </div>
                ))}
              </div>
            </Card>
            <Card style={{ padding: "18px", height: 200 }}>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                <Skel w="40%" h={12} />
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Skel w="50%" />
                    <Skel w="20%" />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ── Full-page error ───────────────────────────────── */}
      {loadState === "error" && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 400,
          }}
        >
          <div style={{ textAlign: "center", maxWidth: 380 }}>
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
                width="24"
                height="24"
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
                fontSize: 17,
                fontWeight: 700,
                color: "var(--text-primary)",
                marginBottom: 6,
              }}
            >
              Dashboard data unavailable
            </div>
            <div
              style={{
                fontSize: 13.5,
                color: "var(--text-secondary)",
                marginBottom: 20,
                lineHeight: 1.5,
              }}
            >
              Some information could not be loaded. Other sections of the ERP
              are still available.
            </div>
            <button
              onClick={() => {
                setLoadState("loading")
                setTimeout(() => setLoadState("ok"), 800)
              }}
              style={{
                padding: "9px 22px",
                borderRadius: 8,
                background: "#2B4D3A",
                border: "none",
                color: "#FFFFFF",
                fontSize: 14,
                fontWeight: 600,
                fontFamily: "Inter",
                cursor: "pointer",
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* ══ DASHBOARD BODY ═════════════════════════════════ */}
      {loadState === "ok" && (
        <div
          className="dash-section"
          style={{ display: "flex", flexDirection: "column", gap: 28 }}
        >
          {/* ── 1. NEEDS ATTENTION ─────────────────────────── */}
          <section>
            <SectionHeading
              title="Needs Attention"
              sub={`${attentionItems.length} items require your review`}
              action={
                <TextBtn
                  label="View Actions"
                  onClick={() => onNavigate?.("approvals")}
                />
              }
            />
            {attentionItems.length === 0 ? (
              <Card style={{ padding: "28px 24px", textAlign: "center" }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 11,
                    background: "#F0FDF4",
                    border: "1px solid #86EFAC",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 14px",
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#16A34A"
                    strokeWidth="2"
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
                  Nothing needs your attention
                </div>
                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  All current operations are progressing normally.
                </div>
              </Card>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isNarrow
                    ? "1fr"
                    : "repeat(auto-fill, minmax(420px, 1fr))",
                  gap: 12,
                }}
              >
                {attentionItems.map((card) => (
                  <AttentionCardUI
                    key={card.id}
                    card={card}
                    onNavigate={onNavigate}
                    onResolveCard={(resolvedId) => {
                      // Remove the card from the attention list
                      setAttentionItems((prev) => prev.filter((item) => item.id !== resolvedId))
                      // Smart KPI Update: dynamically adjust dashboard numbers
                      setKpis((prev) =>
                        prev.map((kpi) => {
                          // If a customer card was resolved, reduce the "Total Active Customers" count
                          if (resolvedId.startsWith("cus-") && kpi.label === "Total Active Customers") {
                            const currentNum = parseInt(kpi.value) || 0
                            return {
                              ...kpi,
                              value: `${Math.max(0, currentNum - 1)} clients`,
                            }
                          }
                          return kpi
                        })
                      )
                    }}
                  />
                ))}
              </div>
            )}
          </section>

          {/* ── 2. OPERATIONAL OVERVIEW (KPI cards) ─────────── */}
          <section>
            <SectionHeading title="Operational Overview" />
            <div
              style={{ display: "grid", gridTemplateColumns: kpiCols, gap: 10 }}
            >
              {kpis.map((c) => (
                <KpiCardUI
                  key={c.label}
                  card={c}
                  financeRange={financeRange}
                  setFinanceRange={setFinanceRange}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </section>

          {/* ── 3. ORDERS + INVENTORY side by side ──────────── */}
          <div style={{ display: "grid", gridTemplateColumns: col2, gap: 16 }}>
            {/* Orders overview */}
            {canSeeOrders && (
              <section>
                <SectionHeading
                  title="Order Status"
                  action={
                    <TextBtn
                      label="View Orders"
                      onClick={() => onNavigate?.("orders")}
                    />
                  }
                />
                <Card>
                  {statuses.map((s, i) => (
                    <div
                      key={s.label}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "11px 16px",
                        borderBottom:
                          i < statuses.length - 1
                            ? "1px solid var(--border-neutral)"
                            : "none",
                        cursor: "pointer",
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={(e) => {
                        ;(e.currentTarget as HTMLDivElement).style.background =
                          "var(--surface-02)"
                      }}
                      onMouseLeave={(e) => {
                        ;(e.currentTarget as HTMLDivElement).style.background =
                          "transparent"
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 9,
                        }}
                      >
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 2,
                            background: s.color,
                            flexShrink: 0,
                          }}
                        />
                        <span
                          style={{
                            fontSize: 13,
                            color: "var(--text-secondary)",
                            fontFamily: "Inter",
                          }}
                        >
                          {s.label}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: "var(--text-primary)",
                            fontFamily: "DM Mono",
                          }}
                        >
                          {s.count}
                        </span>
                        {/* Bar */}
                        <div
                          style={{
                            width: 60,
                            height: 4,
                            borderRadius: 2,
                            background: "var(--surface-02)",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              width: `${Math.min(100, (s.count / 14) * 100)}%`,
                              background: s.color,
                              borderRadius: 2,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <div
                    style={{
                      padding: "10px 16px",
                      borderTop: "1px solid var(--border-neutral)",
                      background: "var(--bg-primary)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11.5,
                        fontFamily: "DM Mono",
                        color: "var(--text-muted)",
                      }}
                    >
                      Total active orders
                    </span>
                    <span
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: "var(--text-primary)",
                        fontFamily: "DM Mono",
                      }}
                    >
                      {statuses.reduce((a, s) => a + s.count, 0)}
                    </span>
                  </div>
                </Card>
              </section>
            )}

            {/* Quick actions */}
            <section>
              <SectionHeading title="Quick Actions" />
              <Card style={{ padding: "14px" }}>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 7 }}
                >
                  {QUICK_ACTIONS.map((a) => (
                    <button
                      key={a.label}
                      onClick={() =>
                        a.module === "add_customer"
                          ? setCustomerModalOpen(true)
                          : onNavigate?.(a.module)
                      }
                      className="qa-btn"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 14px",
                        borderRadius: 8,
                        border: "1px solid var(--border-neutral)",
                        background: "var(--surface-01)",
                        color: "var(--text-secondary)",
                        fontSize: 13.5,
                        fontFamily: "Inter",
                        cursor: "pointer",
                        textAlign: "left",
                        width: "100%",
                        transition: "all 0.12s ease",
                      }}
                    >
                      <div
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 6,
                          background: "var(--surface-02)",
                          border: "1px solid var(--border-neutral)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <SvgIcon
                          d={a.icon}
                          size={12}
                          stroke="var(--text-secondary)"
                        />
                      </div>
                      {a.label}
                      <svg
                        width="11"
                        height="11"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        style={{ marginLeft: "auto", flexShrink: 0 }}
                      >
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))}
                </div>
              </Card>
            </section>
          </div>

          {/* ── 4. INVENTORY SNAPSHOT ─────────────────────────── */}
          {canSeeInventory && (
            <section>
              <SectionHeading
                title="Inventory Snapshot"
                sub="Values provided by the backend — not calculated client-side"
                action={
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <TextBtn
                      label="View Inventory"
                      onClick={() => onNavigate?.("inventory")}
                    />
                  </div>
                }
              />
              {inventoryState === "error" ? (
                <Card>
                  <SectionError onRetry={() => setInventoryState("ok")} />
                </Card>
              ) : (
                <Card>
                  {/* Assuming INVENTORY_CATEGORIES is replaced or maintained elsewhere */}
                  {[]}
                </Card>
              )}
            </section>
          )}

          {/* ── 5. FINANCE SNAPSHOT ───────────────────────────── */}
          {canSeeFinance && (
            <section>
              <SectionHeading
                title="Finance Snapshot"
                action={
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      flexWrap: "wrap",
                      justifyContent: "flex-end",
                    }}
                  >
                    {!isMobile && (
                      <DateRangePicker
                        value={financeRange}
                        onChange={(v) => setFinanceRange(v)}
                      />
                    )}
                    <TextBtn
                      label="View Finance"
                      onClick={() => onNavigate?.("finance")}
                    />
                  </div>
                }
              />
              {isMobile && (
                <div style={{ marginBottom: 10, overflowX: "auto" }}>
                  <DateRangePicker
                    value={financeRange}
                    onChange={(v) => setFinanceRange(v)}
                  />
                </div>
              )}
              {financeState === "error" ? (
                <Card>
                  <SectionError onRetry={() => setFinanceState("ok")} />
                </Card>
              ) : financeState === "loading" ? (
                <Card style={{ padding: "18px 20px" }}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Skel w="40%" h={11} />
                        <Skel w="25%" h={11} />
                      </div>
                    ))}
                  </div>
                </Card>
              ) : (
                <Card>
                  {finances.map((row, i) => (
                    <div
                      key={row.label}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        padding: row.emphasis ? "13px 18px" : "11px 18px",
                        borderBottom:
                          i < finances.length - 1
                            ? "1px solid var(--border-neutral)"
                            : "none",
                        background: row.emphasis
                          ? "var(--surface-02)"
                          : "var(--surface-01)",
                        borderTop: row.emphasis
                          ? "1px solid var(--border-neutral)"
                          : "none",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: 13,
                            color: row.emphasis
                              ? "var(--text-primary)"
                              : "var(--text-secondary)",
                            fontWeight: row.emphasis ? 600 : 400,
                            fontFamily: "Inter",
                          }}
                        >
                          {row.label}
                        </div>
                        {row.sub && (
                          <div
                            style={{
                              fontSize: 11,
                              color: "var(--text-muted)",
                              fontFamily: "Inter",
                              marginTop: 1,
                            }}
                          >
                            {row.sub}
                          </div>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: row.emphasis ? 16 : 14,
                          fontWeight: row.emphasis ? 700 : 600,
                          color: "var(--text-primary)",
                          fontFamily: "DM Mono",
                          letterSpacing: "-0.01em",
                          flexShrink: 0,
                        }}
                      >
                        {row.value}
                      </div>
                    </div>
                  ))}
                  <div
                    style={{
                      padding: "8px 18px 10px",
                      background: "var(--bg-primary)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10.5,
                        color: "var(--text-muted)",
                        fontFamily: "DM Mono",
                        fontStyle: "italic",
                      }}
                    >
                      All figures calculated and provided by the backend.
                      Frontend does not perform financial calculations.
                    </div>
                  </div>
                </Card>
              )}
            </section>
          )}

          {/* ── 6. RECENT ACTIVITY ────────────────────────────── */}
          <section>
            <SectionHeading
              title="Recent Activity"
              action={
                <TextBtn
                  label="View full log"
                  onClick={() => onNavigate?.("activity")}
                />
              }
            />
            {activityState === "error" ? (
              <Card>
                <SectionError onRetry={() => setActivityState("ok")} />
              </Card>
            ) : (
              <Card>
                {activities.map((ev, i) => (
                  <ActivityRow
                    key={ev.id}
                    ev={ev}
                    isLast={i === activities.length - 1}
                  />
                ))}
              </Card>
            )}
          </section>
        </div>
      )}
      <CustomerFormModal
        open={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        onSuccess={loadDashboard}
      />
    </div>
  )
}
