/* Responsive: mobile ≤640 | tablet 641–1024 | laptop 1025–1440 | desktop >1440 */
import { useState, useEffect, type FC, type ReactNode } from "react"
import { useBreakpoint } from "../hooks/useBreakpoint"
import { useAuth } from "../contexts/AuthContext"
import { canRead } from "../lib/rbac"
import { CustomerFormModal } from "../components/CustomerFormModal"

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
  severity: "urgent" | "warning" | "approval"
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
const ATTENTION_CARDS: AttentionCard[] = [
  {
    id: "ac1",
    severity: "urgent",
    category: "Stock Conflict",
    module: "orders",
    age: "12 min ago",
    title: "Order #ORD-1042 cannot be safely fulfilled",
    description:
      "Sunrise Café requested Guji Medium. Available green coffee is below the required amount for safe roasting.",
    details: [
      { label: "Required green coffee", value: "60.6 KG" },
      { label: "Available green coffee", value: "50.0 KG" },
      { label: "Shortfall", value: "10.6 KG" },
    ],
    feasibility: "insufficient",
    primaryAction: "Review Order",
    secondaryAction: "View Inventory",
  },
  {
    id: "ac2",
    severity: "urgent",
    category: "Roasting Discrepancy",
    module: "production",
    age: "2h ago",
    title: "Roasting output discrepancy — Batch RB-2891",
    description:
      "Roasting for Order #ORD-1038 was reported complete, but the storekeeper recorded a different output weight.",
    details: [
      { label: "Expected output", value: "48.0 KG" },
      { label: "Reported output", value: "44.3 KG" },
      { label: "Discrepancy", value: "3.7 KG" },
      { label: "Roaster", value: "Dawit Haile" },
    ],
    primaryAction: "Review Discrepancy",
  },
  {
    id: "ac3",
    severity: "warning",
    category: "Overdue Payment",
    module: "finance",
    age: "3d ago",
    title: "Payment overdue — Ethiopian Airlines Catering",
    description:
      "Invoice INV-2024-0819 is past its payment deadline. Customer follow-up required.",
    details: [
      { label: "Invoice total", value: "ETB 156,000.00" },
      { label: "Amount paid", value: "ETB 0.00" },
      { label: "Remaining", value: "ETB 156,000.00" },
      { label: "Overdue since", value: "Aug 7, 2026" },
    ],
    primaryAction: "Review Payment",
  },
  {
    id: "ac4",
    severity: "approval",
    category: "Pending Approvals",
    module: "approvals",
    age: "ongoing",
    title: "3 items require your approval",
    description:
      "One customer submission, one expense, and one order decision are awaiting manager sign-off.",
    primaryAction: "Review Approvals",
  },
]

const KPI_CARDS: KpiCard[] = [
  {
    label: "Orders in Progress",
    value: "14",
    sub: "5 awaiting confirmation",
    icon: "M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18",
    trend: "up",
    trendVal: "+2 today",
  },
  {
    label: "Active Roasting",
    value: "3 batches",
    sub: "210 KG in progress",
    icon: "M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0",
    trend: "flat",
    trendVal: "on schedule",
  },
  {
    label: "Active Packing",
    value: "2 orders",
    sub: "88 KG being packed",
    icon: "M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z",
    trend: "flat",
    trendVal: "",
  },
  {
    label: "Ready for Delivery",
    value: "4 orders",
    sub: "245 KG packed & ready",
    icon: "M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11",
    trend: "up",
    trendVal: "+1 today",
  },
  {
    label: "Today's Deliveries",
    value: "6 deliveries",
    sub: "2 completed, 4 en route",
    icon: "M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM5.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM18.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5z",
    trend: "up",
    trendVal: "on schedule",
  },
  {
    label: "Pending Payments",
    value: "ETB 412,000",
    sub: "6 outstanding invoices",
    icon: "M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6",
    trend: "down",
    trendVal: "+ETB 156K overdue",
  },
]

const ORDER_STATUSES: OrderStatus[] = [
  { label: "Awaiting Confirmation", count: 5, color: "#F59E0B" },
  { label: "Confirmed / Reserved", count: 3, color: "#2563EB" },
  { label: "Roasting", count: 3, color: "#D97706" },
  { label: "Awaiting Storekeeper", count: 2, color: "#7C3AED" },
  { label: "Packing", count: 2, color: "#0891B2" },
  { label: "Ready for Delivery", count: 4, color: "#16A34A" },
  { label: "Partially Delivered", count: 2, color: "#6B7280" },
  { label: "Payment Pending", count: 6, color: "#DC2626" },
]

const INVENTORY_CATEGORIES: InventoryItem[] = [
  {
    label: "Green Coffee",
    onHand: "2,450 KG",
    reserved: "1,200 KG",
    available: "1,250 KG",
    unit: "KG",
    alert: true,
  },
  {
    label: "Roasted Coffee",
    onHand: "320 KG",
    reserved: "245 KG",
    available: "75 KG",
    unit: "KG",
  },
  {
    label: "Packaging Materials",
    onHand: "8,200",
    reserved: "3,400",
    available: "4,800",
    unit: "units",
  },
]

const LOW_STOCK_COUNT = 5

const FINANCE_ROWS: Record<DateRange, FinanceRow[]> = {
  today: [
    { label: "Revenue", value: "ETB 42,000.00" },
    { label: "VAT (15%)", value: "ETB 6,300.00", sub: "collected" },
    { label: "Expenses", value: "ETB 14,200.00" },
    {
      label: "Outstanding Receivables",
      value: "ETB 412,000.00",
      sub: "6 invoices",
    },
    { label: "Net (after expenses)", value: "ETB 27,800.00", emphasis: true },
  ],
  week: [
    { label: "Revenue", value: "ETB 248,500.00" },
    { label: "VAT (15%)", value: "ETB 37,275.00", sub: "collected" },
    { label: "Expenses", value: "ETB 89,400.00" },
    { label: "Payroll", value: "ETB 41,200.00" },
    {
      label: "Outstanding Receivables",
      value: "ETB 412,000.00",
      sub: "6 invoices",
    },
    { label: "Net (after expenses)", value: "ETB 159,100.00", emphasis: true },
  ],
  month: [
    { label: "Revenue", value: "ETB 1,250,000.00" },
    { label: "VAT (15%)", value: "ETB 187,500.00", sub: "collected" },
    { label: "Expenses", value: "ETB 420,000.00" },
    { label: "Payroll", value: "ETB 164,800.00" },
    {
      label: "Outstanding Receivables",
      value: "ETB 412,000.00",
      sub: "6 invoices",
    },
    { label: "Net Profit", value: "ETB 477,700.00", emphasis: true },
  ],
  quarter: [
    { label: "Revenue", value: "ETB 3,720,000.00" },
    { label: "VAT (15%)", value: "ETB 558,000.00", sub: "collected" },
    { label: "Expenses", value: "ETB 1,240,000.00" },
    { label: "Payroll", value: "ETB 494,400.00" },
    {
      label: "Outstanding Receivables",
      value: "ETB 412,000.00",
      sub: "6 invoices",
    },
    { label: "Net Profit", value: "ETB 1,527,600.00", emphasis: true },
  ],
  custom: [
    { label: "Revenue", value: "ETB 87,500.00" },
    { label: "VAT (15%)", value: "ETB 13,125.00", sub: "collected" },
    { label: "Expenses", value: "ETB 31,200.00" },
    {
      label: "Outstanding Receivables",
      value: "ETB 412,000.00",
      sub: "6 invoices",
    },
    { label: "Net (after expenses)", value: "ETB 56,300.00", emphasis: true },
  ],
}

const ACTIVITY: ActivityEvent[] = [
  {
    id: 1,
    time: "Just now",
    event: "Order #ORD-1042 flagged for manager review",
    record: "#ORD-1042",
    actor: "System",
    module: "Orders",
    iconPath: "M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18",
    iconColor: "#F59E0B",
  },
  {
    id: 2,
    time: "09:42 AM",
    event: "Green bean receiving recorded — Guji Grade 1",
    record: "Lot #GR-0295",
    actor: "Solomon Tesfaye",
    module: "Inventory",
    iconPath:
      "M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z",
    iconColor: "#16A34A",
  },
  {
    id: 3,
    time: "09:28 AM",
    event: "Roasting completed — Batch RB-2891",
    record: "#ORD-1038",
    actor: "Dawit Haile",
    module: "Roasting",
    iconPath:
      "M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0",
    iconColor: "#D97706",
  },
  {
    id: 4,
    time: "09:15 AM",
    event: "Payment receipt registered — ETB 89,200",
    record: "#ORD-8821",
    actor: "Tigist Alemu",
    module: "Finance",
    iconPath: "M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6",
    iconColor: "#16A34A",
  },
  {
    id: 5,
    time: "08:57 AM",
    event: "QC inspection passed — score 86.2",
    record: "Lot #GR-0294",
    actor: "Selamawit Bekele",
    module: "Quality",
    iconPath:
      "M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11",
    iconColor: "#2563EB",
  },
  {
    id: 6,
    time: "08:34 AM",
    event: "Discrepancy override approved",
    record: "BAT-09820",
    actor: "Hiwot Tadesse",
    module: "Audit",
    iconPath: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6",
    iconColor: "#7C3AED",
  },
  {
    id: 7,
    time: "08:10 AM",
    event: "Order #ORD-1039 confirmed and reserved",
    record: "#ORD-1039",
    actor: "Hiwot Tadesse",
    module: "Orders",
    iconPath: "M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18",
    iconColor: "#16A34A",
  },
  {
    id: 8,
    time: "Yesterday",
    event: "Delivery verified — Hilton Addis Ababa",
    record: "#ORD-1033",
    actor: "Yohannes Mesfin",
    module: "Delivery",
    iconPath: "M1 3h15v13H1zM16 8h4l3 3v5h-7V8z",
    iconColor: "#16A34A",
  },
]

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
    return <span style={{ fontSize: size }}>{d || "📋"}</span>
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
}

const AttentionCardUI: FC<{ card: AttentionCard }> = ({ card }) => {
  const cfg = SEVERITY_CFG[card.severity]
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
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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
        >
          {card.primaryAction}
        </button>
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
  <Card style={{ padding: "16px 18px" }}>
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 8,
        marginBottom: 8,
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: "var(--text-muted)",
          fontFamily: "Inter",
          lineHeight: 1.3,
          flex: 1,
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
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 22,
          gap: 12,
          flexWrap: "wrap",
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
            Overview
          </div>
          <h1
            style={{
              fontSize: 21,
              fontWeight: 700,
              color: "var(--text-primary)",
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            Manager Dashboard
          </h1>
          <p
            style={{
              fontSize: 13,
              color: "var(--text-secondary)",
              margin: "4px 0 0",
              lineHeight: 1.4,
            }}
          >
            Overview of today's operations and items requiring your attention.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {loadState === "ok" && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 10px",
                borderRadius: 999,
                background: "var(--surface-01)",
                border: "1px solid var(--border-neutral)",
                fontSize: 11.5,
                color: "var(--text-muted)",
                fontFamily: "DM Mono",
              }}
            >
              <div
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: "#16A34A",
                  boxShadow: "0 0 0 2px rgba(22,163,74,0.2)",
                }}
              />
              Updated {lastUpdated}
            </div>
          )}
          <button
            onClick={() => {
              setLoadState("loading")
              setTimeout(() => {
                setLoadState("ok")
                setLastUpdated("just now")
              }, 800)
            }}
            style={{
              width: 32,
              height: 32,
              borderRadius: 7,
              border: "1px solid var(--border-neutral)",
              background: "var(--surface-01)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-muted)",
              transition: "all 0.15s",
            }}
            title="Refresh dashboard"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
            </svg>
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
                  <AttentionCardUI key={card.id} card={card} />
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
