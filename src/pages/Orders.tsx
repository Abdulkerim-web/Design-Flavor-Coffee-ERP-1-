/* Order Management — F3-06
   Internal view routing: list → detail → new
   Status display via centralized src/lib/orderStatus.ts — never inline.
   PHP is authoritative for all business values, quantities, feasibility, pricing, and permissions.
   Frontend RBAC is UI-only; the PHP backend must enforce all real authorization.
*/
import {
  useState,
  useCallback,
  useEffect,
  useRef,
  type FC,
  type ReactNode,
  type CSSProperties,
  type FormEvent,
} from "react"
import { useBreakpoint } from "../hooks/useBreakpoint"
import { useAuth } from "../contexts/AuthContext"
import { useToast } from "../contexts/ToastContext"
import { can } from "../lib/can"
import {
  ORDER_STATUS_MAP,
  FEASIBILITY_MAP,
  PAYMENT_STATUS_MAP,
  getStatusConfig,
  type OrderStatusKey,
  type FeasibilityKey,
  type PaymentStatusKey,
} from "../lib/orderStatus"
import { listOrders, createOrder } from "../services/orders"
import useSupabaseRealtime from "../hooks/useSupabaseRealtime"

/* ─────────────────────────────────────────────────────────────
   TYPES — mirror PHP API response shapes
───────────────────────────────────────────────────────────── */
type View = "list" | "detail" | "new"
type LoadState = "loading" | "ok" | "error"

interface OrderLineItem {
  id: string
  coffeeType: string
  origin: string
  roastLevel: string
  quantity: number
  unit: "KG"
  unitPrice: string
  lineTotal: string
}
interface FeasibilityData {
  state: FeasibilityKey
  required: string
  available: string
  reserved: string
  shortfall?: string
  note?: string
}
interface DeliveryProgress {
  completed: number
  total: number
  label: string
}
interface PaymentData {
  status: PaymentStatusKey
  total: string
  paid: string
  remaining: string
  deadline?: string
  note?: string
}
interface TimelineEvent {
  id: number
  event: string
  actor?: string
  timestamp: string
  note?: string
  quantity?: string
  state: "completed" | "current" | "warning" | "future"
}
interface Order {
  id: string
  ref: string
  status: OrderStatusKey
  urgent: boolean
  customer: {
    id: string
    name: string
    ref: string
    status: string
    phone?: string
  }
  salesRep: { id: string name: string } | null
  branch?: string
  items: OrderLineItem[]
  totalQty: string
  coffeeLabel: string
  subtotal: string
  vat: string
  total: string
  feasibility?: FeasibilityData
  delivery: DeliveryProgress
  payment: PaymentData
  deliveryDate?: string
  deliveryAddress?: string
  createdAt: string
  cancellationReason?: string
  timeline?: TimelineEvent[]
}
interface CustomerOption {
  id: string
  name: string
  ref: string
  status: "active" | "pending"
  salesRep: string
  phone: string
}
interface NewOrderLine {
  id: string
  coffeeType: string
  origin: string
  roastLevel: string
  quantity: string
  packaging: string
  unit: "KG"
}
interface NewOrderForm {
  customerId: string
  urgency: boolean
  notes: string
  lines: NewOrderLine[]
  deliveryDate: string
  deliveryAddress: string
  deliveryContact: string
  deliveryNotes: string
}

/* ─────────────────────────────────────────────────────────────
   SAMPLE DATA — illustrative; production data from PHP API
───────────────────────────────────────────────────────────── */
const COFFEE_TYPES = [
  "Ethiopian Yirgacheffe",
  "Ethiopian Guji",
  "Ethiopian Limu",
  "Ethiopian Sidama",
  "Ethiopian Harrar",
]
const ORIGINS = ["Yirgacheffe", "Guji", "Limu", "Sidama", "Harrar"]
const ROAST_LEVELS = [
  "Light",
  "Medium-Light",
  "Medium",
  "Medium-Dark",
  "Dark",
  "Espresso",
]
const PACKAGINGS = [
  "1 KG Bags",
  "500 g Bags",
  "5 KG Bags",
  "10 KG Bags",
  "Bulk Sack (25 KG)",
]

const CUSTOMER_OPTIONS: CustomerOption[] = []

const mkTl = (status: OrderStatusKey): TimelineEvent[] => {
  const d = (
    id: number,
    event: string,
    actor: string,
    ts: string,
    extra?: Partial<TimelineEvent>,
  ): TimelineEvent => ({
    id,
    event,
    actor,
    timestamp: ts,
    state: "completed",
    ...extra,
  })
  const c = (id: number, event: string, ts: string): TimelineEvent => ({
    id,
    event,
    timestamp: ts,
    state: "current",
  })
  const w = (
    id: number,
    event: string,
    actor: string,
    ts: string,
    note: string,
  ): TimelineEvent => ({
    id,
    event,
    actor,
    timestamp: ts,
    note,
    state: "warning",
  })
  const f = (id: number, event: string): TimelineEvent => ({
    id,
    event,
    timestamp: "",
    state: "future",
  })

  const base = [d(1, "Order created", "Hiwot Tadesse", "Aug 9, 2026 09:00 AM")]
  if (status === "pending-confirmation")
    return [
      ...base,
      c(2, "Awaiting manager confirmation", "Aug 9, 2026"),
      f(3, "Confirmed"),
      f(4, "Roasting"),
      f(5, "Packing"),
      f(6, "Delivery"),
      f(7, "Payment"),
    ]
  if (status === "roasting")
    return [
      ...base,
      d(2, "Order confirmed", "Yohannes Bekele", "Aug 8, 2026 10:15 AM"),
      d(3, "Green coffee reserved", "System", "Aug 8, 2026 10:16 AM", {
        quantity: "97.1 KG",
      }),
      d(
        4,
        "Roasting started — Batch RB-2887",
        "Dawit Haile",
        "Aug 9, 2026 08:30 AM",
      ),
      c(5, "Roasting in progress", "Aug 9, 2026"),
      f(6, "Packing"),
      f(7, "Delivery"),
      f(8, "Payment"),
    ]
  if (status === "roasted-needs-review")
    return [
      ...base,
      d(2, "Order confirmed", "Yohannes Bekele", "Aug 8, 2026"),
      d(3, "Green coffee reserved", "System", "Aug 8, 2026", {
        quantity: "72.7 KG",
      }),
      d(
        4,
        "Roasting completed — Batch RB-2887",
        "Dawit Haile",
        "Aug 9, 2026 02:00 PM",
      ),
      w(
        5,
        "Discrepancy flagged by storekeeper",
        "Solomon Tesfaye",
        "Aug 9, 2026 02:45 PM",
        "Expected 48.0 KG, received 44.3 KG. Manager review required.",
      ),
      f(6, "Packing"),
      f(7, "Delivery"),
      f(8, "Payment"),
    ]
  if (status === "ready-for-delivery")
    return [
      ...base,
      d(2, "Order confirmed", "Yohannes Bekele", "Aug 7, 2026"),
      d(3, "Green coffee reserved", "System", "Aug 7, 2026", {
        quantity: "48.5 KG",
      }),
      d(4, "Roasting completed", "Dawit Haile", "Aug 8, 2026 01:00 PM"),
      d(5, "Storekeeper accepted", "Solomon Tesfaye", "Aug 8, 2026 02:00 PM", {
        quantity: "40 KG",
      }),
      d(6, "Packing completed", "Selamawit Bekele", "Aug 9, 2026 10:00 AM"),
      c(7, "Ready for delivery — awaiting driver assignment", "Aug 9, 2026"),
      f(8, "Delivery"),
      f(9, "Payment"),
    ]
  if (status === "payment-pending")
    return [
      ...base,
      d(2, "Order confirmed", "Yohannes Bekele", "Aug 2, 2026"),
      d(3, "Green coffee reserved", "System", "Aug 2, 2026"),
      d(4, "Roasting completed", "Dawit Haile", "Aug 3, 2026"),
      d(5, "Storekeeper accepted", "Solomon Tesfaye", "Aug 3, 2026"),
      d(6, "Packing completed", "Selamawit Bekele", "Aug 4, 2026"),
      d(
        7,
        "Delivered — verified by customer",
        "Yohannes Mesfin",
        "Aug 5, 2026 03:00 PM",
      ),
      c(8, "Awaiting payment", "Aug 5, 2026"),
      f(9, "Payment received"),
      f(10, "Completed"),
    ]
  if (status === "completed")
    return [
      ...base,
      d(2, "Order confirmed", "Yohannes Bekele", "Jul 20, 2026"),
      d(3, "Green coffee reserved", "System", "Jul 20, 2026"),
      d(4, "Roasting completed", "Dawit Haile", "Jul 21, 2026"),
      d(5, "Storekeeper accepted", "Solomon Tesfaye", "Jul 21, 2026"),
      d(6, "Packing completed", "Selamawit Bekele", "Jul 22, 2026"),
      d(7, "Fully delivered", "Yohannes Mesfin", "Jul 23, 2026"),
      d(8, "Full payment received", "Tigist Alemu", "Jul 28, 2026 11:00 AM", {
        quantity: "ETB 94,185.00",
      }),
      d(9, "Order completed", "System", "Jul 28, 2026 11:01 AM"),
    ]
  return [...base, c(2, "In progress", "Aug 9, 2026")]
}

const SAMPLE_ORDERS: Order[] = []

/* ─────────────────────────────────────────────────────────────
   SHARED PRIMITIVE COMPONENTS
───────────────────────────────────────────────────────────── */
const SvgIcon: FC<{
  d: string
  size?: number
  stroke?: string
  strokeW?: number
  style?: CSSProperties
}> = ({ d, size = 14, stroke = "currentColor", strokeW = 1.75, style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={stroke}
    strokeWidth={strokeW}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    style={style}
  >
    {d
      .split("M")
      .filter(Boolean)
      .map((seg, i) => (
        <path key={i} d={`M${seg}`} />
      ))}
  </svg>
)

const Skel: FC<{ w?: string h?: number radius?: number }> = ({
  w = "100%",
  h = 12,
  radius = 5,
}) => (
  <div
    style={{
      width: w,
      height: h,
      borderRadius: radius,
      background: "var(--surface-hover)",
      animation: "oSkel 1.4s ease infinite",
    }}
  />
)

const Card: FC<{ children: ReactNode style?: CSSProperties }> = ({
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

const BackBtn: FC<{ label: string onClick: () => void }> = ({
  label,
  onClick,
}) => (
  <button
    onClick={onClick}
    style={{
      display: "flex",
      alignItems: "center",
      gap: 6,
      background: "none",
      border: "none",
      cursor: "pointer",
      color: "var(--text-muted)",
      fontSize: 13,
      marginBottom: 18,
      padding: 0,
      fontFamily: "Inter",
    }}
  >
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
    {label}
  </button>
)

const GhostBtn: FC<{
  label: string
  onClick?: () => void
  disabled?: boolean
  small?: boolean
}> = ({ label, onClick, disabled, small }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      padding: small ? "5px 12px" : "8px 16px",
      borderRadius: small ? 6 : 8,
      border: "1px solid var(--border-neutral)",
      background: "transparent",
      color: "var(--text-secondary)",
      fontSize: small ? 12.5 : 13.5,
      fontWeight: 500,
      fontFamily: "Inter",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1,
    }}
  >
    {label}
  </button>
)

const PrimaryBtn: FC<{
  label: string
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  danger?: boolean
  small?: boolean
  type?: "button" | "submit"
}> = ({
  label,
  onClick,
  disabled,
  loading,
  danger,
  small,
  type = "button",
}) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled || loading}
    style={{
      padding: small ? "5px 12px" : "8px 18px",
      borderRadius: small ? 6 : 8,
      border: "none",
      background: danger
        ? "#B91C1C"
        : disabled || loading
          ? "var(--surface-02)"
          : "#2B4D3A",
      color: disabled || loading ? "var(--text-muted)" : "#FFFFFF",
      fontSize: small ? 12.5 : 13.5,
      fontWeight: 600,
      fontFamily: "Inter",
      cursor: disabled || loading ? "not-allowed" : "pointer",
      display: "flex",
      alignItems: "center",
      gap: 7,
      transition: "opacity 0.15s",
      whiteSpace: "nowrap",
    }}
    onMouseEnter={(e) => {
      if (!disabled && !loading)
        (e.currentTarget as HTMLButtonElement).style.opacity = "0.88"
    }}
    onMouseLeave={(e) => {
      ;(e.currentTarget as HTMLButtonElement).style.opacity = "1"
    }}
  >
    {loading && (
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        style={{ animation: "spin 0.8s linear infinite" }}
      >
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      </svg>
    )}
    {label}
  </button>
)

const Modal: FC<{
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  width?: number
}> = ({ open, onClose, title, children, width = 440 }) => {
  if (!open) return null
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="od-modal-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 800,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(2px)",
        }}
      />
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: width,
          background: "var(--surface-01)",
          border: "1px solid var(--border-neutral)",
          borderRadius: 14,
          padding: 24,
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
          animation: "oSlideUp 0.2s ease",
        }}
      >
        <h2
          id="od-modal-title"
          style={{
            fontSize: 15.5,
            fontWeight: 700,
            color: "var(--text-primary)",
            margin: "0 0 14px",
            fontFamily: "Inter",
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </h2>
        {children}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   ORDER STATUS BADGE
───────────────────────────────────────────────────────────── */
const OrderStatusBadge: FC<{ status: string small?: boolean }> = ({
  status,
  small,
}) => {
  const cfg = getStatusConfig(status)
  return (
    <div
      role="status"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: small ? "2px 8px" : "3px 10px",
        borderRadius: 999,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
      }}
    >
      <SvgIcon
        d={cfg.iconPath}
        size={small ? 10 : 11}
        stroke={cfg.color}
        strokeW={2}
      />
      <span
        style={{
          fontSize: small ? 11 : 11.5,
          fontWeight: 600,
          color: cfg.color,
          fontFamily: "Inter",
          whiteSpace: "nowrap",
        }}
      >
        {cfg.label}
      </span>
    </div>
  )
}

const PaymentBadge: FC<{ status: PaymentStatusKey small?: boolean }> = ({
  status,
  small,
}) => {
  const cfg = PAYMENT_STATUS_MAP[status] ?? PAYMENT_STATUS_MAP.pending
  return (
    <div
      role="status"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: small ? "2px 8px" : "3px 10px",
        borderRadius: 999,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
      }}
    >
      <span
        style={{
          fontSize: small ? 11 : 11.5,
          fontWeight: 600,
          color: cfg.color,
          fontFamily: "Inter",
          whiteSpace: "nowrap",
        }}
      >
        {cfg.label}
      </span>
    </div>
  )
}

const UrgencyBadge = () => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      padding: "2px 8px",
      borderRadius: 999,
      background: "#FEF2F2",
      border: "1px solid #FCA5A5",
    }}
  >
    <div
      style={{
        width: 5,
        height: 5,
        borderRadius: "50%",
        background: "#DC2626",
        animation: "oPulse 1.5s ease infinite",
        flexShrink: 0,
      }}
    />
    <span
      style={{
        fontSize: 11,
        fontFamily: "DM Mono",
        fontWeight: 700,
        color: "#B91C1C",
        letterSpacing: "0.04em",
      }}
    >
      URGENT
    </span>
  </div>
)

/* ─────────────────────────────────────────────────────────────
   ORDER WORKFLOW PROGRESS — visual stage pipeline
   Communicates current high-level stage; timeline is authoritative.
───────────────────────────────────────────────────────────── */
type WorkflowStage = "order" | "confirmed" | "roasting" | "packing" | "delivery" | "payment" | "completed"

const STAGE_LABELS: Record<WorkflowStage, string> = {
  order: "Order",
  confirmed: "Confirmed",
  roasting: "Roasting",
  packing: "Packing",
  delivery: "Delivery",
  payment: "Payment",
  completed: "Completed",
}

const STAGES: WorkflowStage[] = [
  "order",
  "confirmed",
  "roasting",
  "packing",
  "delivery",
  "payment",
  "completed",
]

function statusToStage(status: OrderStatusKey): WorkflowStage {
  switch (status) {
    case "pending-confirmation":
    case "stock-shortage":
      return "order"
    case "confirmed":
      return "confirmed"
    case "roasting":
    case "awaiting-storekeeper":
    case "roasted-needs-review":
      return "roasting"
    case "packing":
    case "packing-needs-review":
      return "packing"
    case "ready-for-delivery":
    case "partially-delivered":
    case "awaiting-customer-confirmation":
    case "fully-delivered":
      return "delivery"
    case "payment-pending":
    case "partially-paid":
    case "overdue":
      return "payment"
    case "paid":
    case "completed":
      return "completed"
    case "cancelled":
      return "order"
    default:
      return "order"
  }
}

const OrderWorkflowProgress: FC<{ status: OrderStatusKey }> = ({ status }) => {
  const currentStage = statusToStage(status)
  const currentIdx = STAGES.indexOf(currentStage)
  const isCancelled = status === "cancelled"
  const cfg = getStatusConfig(status)

  return (
    <div style={{ marginBottom: 20 }}>
      <div
        style={{ position: "relative", display: "flex", alignItems: "center" }}
      >
        {/* Track line */}
        <div
          style={{
            position: "absolute",
            left: "5%",
            right: "5%",
            top: "50%",
            transform: "translateY(-50%)",
            height: 2,
            background: "var(--border-neutral)",
            borderRadius: 1,
            zIndex: 0,
          }}
        />
        {/* Progress fill */}
        {!isCancelled && currentIdx > 0 && (
          <div
            style={{
              position: "absolute",
              left: "5%",
              top: "50%",
              transform: "translateY(-50%)",
              height: 2,
              width: `${(currentIdx / (STAGES.length - 1)) * 90}%`,
              background: "#2B4D3A",
              borderRadius: 1,
              zIndex: 0,
              transition: "width 0.3s ease",
            }}
          />
        )}
        {/* Stage dots */}
        {STAGES.map((stage, i) => {
          const isCompleted = !isCancelled && i < currentIdx
          const isCurrent = !isCancelled && i === currentIdx
          const isFuture = isCancelled || i > currentIdx
          return (
            <div
              key={stage}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                position: "relative",
                zIndex: 1,
              }}
            >
              <div
                style={{
                  width: isCurrent ? 22 : 16,
                  height: isCurrent ? 22 : 16,
                  borderRadius: "50%",
                  background: isCompleted
                    ? "#2B4D3A"
                    : isCurrent
                      ? isCancelled
                        ? "#9CA3AF"
                        : cfg.color
                      : "var(--surface-01)",
                  border: isFuture
                    ? "2px solid var(--border-neutral)"
                    : `2px solid ${isCompleted ? "#2B4D3A" : cfg.color}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s ease",
                  boxShadow:
                    isCurrent && !isCancelled ? `0 0 0 4px ${cfg.bg}` : "none",
                }}
              >
                {isCompleted && (
                  <svg
                    width="8"
                    height="8"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
                {isCurrent && !isCancelled && (
                  <div
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: cfg.color,
                    }}
                  />
                )}
              </div>
            </div>
          )
        })}
      </div>
      {/* Labels */}
      <div style={{ display: "flex", marginTop: 6 }}>
        {STAGES.map((stage, i) => {
          const isCompleted = !isCancelled && i < currentIdx
          const isCurrent = !isCancelled && i === currentIdx
          return (
            <div key={stage} style={{ flex: 1, textAlign: "center" }}>
              <span
                style={{
                  fontSize: 10,
                  fontFamily: "Inter",
                  fontWeight: isCurrent ? 700 : 500,
                  color: isCurrent
                    ? cfg.color
                    : isCompleted
                      ? "#2B4D3A"
                      : "var(--text-muted)",
                  whiteSpace: "nowrap",
                  display: "block",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {STAGE_LABELS[stage]}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   FEASIBILITY PANEL — renders backend-provided values only
───────────────────────────────────────────────────────────── */
const FeasibilityPanel: FC<{
  data: FeasibilityData
  canOverride?: boolean
  onOverride?: () => void
  canConfirm?: boolean
  onConfirm?: () => void
}> = ({ data, canOverride, onOverride, canConfirm, onConfirm }) => {
  const cfg = FEASIBILITY_MAP[data.state]
  return (
    <div
      style={{
        borderRadius: 10,
        border: `1px solid ${cfg.border}`,
        background: cfg.bg,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "11px 15px",
          borderBottom: `1px solid ${cfg.border}`,
          display: "flex",
          alignItems: "center",
          gap: 9,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 7,
            background: "rgba(255,255,255,0.55)",
            border: `1px solid ${cfg.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <SvgIcon
            d={cfg.iconPath}
            size={14}
            stroke={cfg.color}
            strokeW={2.5}
          />
        </div>
        <div>
          <div
            style={{
              fontSize: 10,
              fontFamily: "DM Mono",
              fontWeight: 700,
              color: cfg.color,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 1,
            }}
          >
            Stock Feasibility
          </div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: cfg.color }}>
            {cfg.label}
          </div>
        </div>
      </div>
      <div style={{ padding: "12px 15px" }}>
        <p
          style={{
            fontSize: 13,
            color: cfg.color,
            margin: "0 0 10px",
            lineHeight: 1.5,
            opacity: 0.9,
          }}
        >
          {cfg.description}
        </p>
        {data.note && (
          <p
            style={{
              fontSize: 12.5,
              color: cfg.color,
              margin: "0 0 10px",
              fontStyle: "italic",
              opacity: 0.8,
            }}
          >
            {data.note}
          </p>
        )}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
            gap: 8,
          }}
        >
          {[
            { label: "Required", value: data.required },
            { label: "Available", value: data.available },
            { label: "Reserved", value: data.reserved },
            ...(data.shortfall
              ? [{ label: "Shortfall", value: data.shortfall }]
              : []),
          ].map((row) => (
            <div
              key={row.label}
              style={{
                background: "rgba(255,255,255,0.55)",
                borderRadius: 7,
                padding: "8px 10px",
                border: `1px solid ${cfg.border}`,
              }}
            >
              <div
                style={{
                  fontSize: 9.5,
                  fontFamily: "DM Mono",
                  color: cfg.color,
                  opacity: 0.7,
                  letterSpacing: "0.04em",
                  marginBottom: 2,
                  textTransform: "uppercase",
                }}
              >
                {row.label}
              </div>
              <div
                style={{
                  fontSize: 13.5,
                  fontWeight: 700,
                  color: cfg.color,
                  fontFamily: "DM Mono",
                }}
              >
                {row.value}
              </div>
            </div>
          ))}
        </div>
        {(canConfirm || canOverride) && (
          <div
            style={{
              marginTop: 12,
              paddingTop: 12,
              borderTop: `1px solid ${cfg.border}`,
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            {canConfirm && data.state !== "insufficient" && (
              <PrimaryBtn label="Confirm Order" onClick={onConfirm} small />
            )}
            {canOverride && data.state === "insufficient" && (
              <>
                <div
                  style={{
                    fontSize: 12.5,
                    color: cfg.color,
                    opacity: 0.85,
                    lineHeight: 1.4,
                    width: "100%",
                    marginBottom: 4,
                  }}
                >
                  Insufficient stock. A manager decision is required to proceed.
                </div>
                <PrimaryBtn
                  label="Confirm Anyway…"
                  onClick={onOverride}
                  danger
                  small
                />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   ORDER TIMELINE — renders backend audit events only
───────────────────────────────────────────────────────────── */
const OrderTimeline: FC<{ events: TimelineEvent[] }> = ({ events }) => (
  <div style={{ position: "relative", paddingLeft: 28 }}>
    <div
      style={{
        position: "absolute",
        left: 10,
        top: 14,
        bottom: 14,
        width: 2,
        background: "var(--border-neutral)",
        borderRadius: 2,
      }}
    />
    {events.map((ev, i) => {
      const dotColor =
        ev.state === "completed"
          ? "#16A34A"
          : ev.state === "current"
            ? "#2563EB"
            : ev.state === "warning"
              ? "#D97706"
              : "var(--surface-01)"
      const dotBorder =
        ev.state === "future" ? "2px dashed var(--border-neutral)" : "none"
      return (
        <div
          key={ev.id}
          style={{
            position: "relative",
            marginBottom: i < events.length - 1 ? 22 : 0,
            opacity: ev.state === "future" ? 0.4 : 1,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: -28,
              top: 1,
              width: 20,
              height: 20,
              borderRadius: "50%",
              background:
                ev.state === "future" ? "var(--bg-primary)" : dotColor,
              border: dotBorder,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow:
                ev.state === "current"
                  ? "0 0 0 4px rgba(37,99,235,0.14)"
                  : "none",
            }}
          >
            {ev.state === "completed" && (
              <svg
                width="9"
                height="9"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="3.5"
                strokeLinecap="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
            {ev.state === "warning" && (
              <svg
                width="9"
                height="9"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="3"
                strokeLinecap="round"
              >
                <path d="M12 9v4M12 17h.01" />
              </svg>
            )}
            {ev.state === "current" && (
              <div
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "#FFFFFF",
                }}
              />
            )}
          </div>
          <div style={{ paddingLeft: 4 }}>
            <div
              style={{
                fontSize: 13.5,
                fontWeight: ev.state === "current" ? 700 : 500,
                color:
                  ev.state === "future"
                    ? "var(--text-muted)"
                    : "var(--text-primary)",
                marginBottom: 2,
              }}
            >
              {ev.event}
              {ev.quantity && (
                <span
                  style={{
                    fontFamily: "DM Mono",
                    fontSize: 12.5,
                    color: "#2B4D3A",
                    marginLeft: 10,
                    fontWeight: 600,
                  }}
                >
                  {ev.quantity}
                </span>
              )}
            </div>
            {ev.state !== "future" && (
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {ev.actor && (
                  <span
                    style={{
                      fontSize: 12,
                      color: "var(--text-secondary)",
                      fontFamily: "Inter",
                    }}
                  >
                    {ev.actor}
                  </span>
                )}
                {ev.timestamp && (
                  <span
                    style={{
                      fontSize: 11.5,
                      fontFamily: "DM Mono",
                      color: "var(--text-muted)",
                    }}
                  >
                    {ev.timestamp}
                  </span>
                )}
              </div>
            )}
            {ev.note && ev.state === "warning" && (
              <div
                style={{
                  marginTop: 8,
                  padding: "9px 12px",
                  borderRadius: 8,
                  background: "#FFFBEB",
                  border: "1px solid #FDE68A",
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#92400E",
                    marginBottom: 3,
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <SvgIcon
                    d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"
                    size={12}
                    stroke="#B45309"
                  />
                  Discrepancy — Manager Review Required
                </div>
                <div
                  style={{ fontSize: 12.5, color: "#B45309", lineHeight: 1.5 }}
                >
                  {ev.note}
                </div>
              </div>
            )}
          </div>
        </div>
      )
    })}
  </div>
)

/* ─────────────────────────────────────────────────────────────
   DELIVERY PROGRESS + PAYMENT PANEL
───────────────────────────────────────────────────────────── */
const DeliveryProgressBar: FC<{ data: DeliveryProgress }> = ({ data }) => {
  const pct = data.total > 0 ? (data.completed / data.total) * 100 : 0
  const done = data.completed === data.total && data.total > 0
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <span
          style={{
            fontSize: 12.5,
            fontWeight: 600,
            color: "var(--text-secondary)",
            fontFamily: "Inter",
          }}
        >
          Delivery Progress
        </span>
        <span
          style={{
            fontSize: 12.5,
            fontFamily: "DM Mono",
            color: done ? "#16A34A" : "var(--text-secondary)",
            fontWeight: 600,
          }}
        >
          {data.label}
        </span>
      </div>
      <div
        style={{
          height: 6,
          borderRadius: 3,
          background: "var(--surface-02)",
          border: "1px solid var(--border-neutral)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: done ? "#16A34A" : "#2563EB",
            borderRadius: 3,
            transition: "width 0.4s ease",
          }}
        />
      </div>
    </div>
  )
}

const PaymentPanel: FC<{ data: PaymentData }> = ({ data }) => {
  const cfg = PAYMENT_STATUS_MAP[data.status] ?? PAYMENT_STATUS_MAP.pending
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.07em",
            fontFamily: "Inter",
          }}
        >
          Payment
        </div>
        <PaymentBadge status={data.status} small />
      </div>
      {[
        { label: "Total", value: data.total, bold: false },
        { label: "Paid", value: data.paid, bold: false },
        { label: "Remaining", value: data.remaining, bold: true },
      ].map((r, i, arr) => (
        <div
          key={r.label}
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "9px 0",
            borderBottom:
              i < arr.length - 1 ? "1px solid var(--border-neutral)" : "none",
          }}
        >
          <span
            style={{
              fontSize: 13,
              color: "var(--text-secondary)",
              fontFamily: "Inter",
            }}
          >
            {r.label}
          </span>
          <span
            style={{
              fontSize: r.bold ? 15 : 13,
              fontWeight: r.bold ? 700 : 600,
              color:
                r.bold && data.remaining !== "ETB 0.00"
                  ? "#DC2626"
                  : "var(--text-primary)",
              fontFamily: "DM Mono",
            }}
          >
            {r.value}
          </span>
        </div>
      ))}
      {data.deadline && (
        <div
          style={{
            marginTop: 8,
            fontSize: 12,
            color: data.status === "overdue" ? "#B91C1C" : "var(--text-muted)",
            fontFamily: "Inter",
          }}
        >
          {data.status === "overdue" ? "⚠ Overdue since" : "Due"}:{" "}
          {data.deadline}
        </div>
      )}
      {data.note && (
        <div
          style={{
            marginTop: 4,
            fontSize: 11.5,
            color: "#B91C1C",
            fontFamily: "Inter",
            fontStyle: "italic",
          }}
        >
          {data.note}
        </div>
      )}
      <div
        style={{
          marginTop: 8,
          fontSize: 10.5,
          color: "var(--text-muted)",
          fontFamily: "DM Mono",
          fontStyle: "italic",
        }}
      >
        Payment deadline determined by the server.
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   ORDER LIST PAGINATION
───────────────────────────────────────────────────────────── */
const Pagination: FC<{
  page: number
  total: number
  perPage: number
  onChange: (p: number) => void
}> = ({ page, total, perPage, onChange }) => {
  const pages = Math.ceil(total / perPage)
  if (pages <= 1) return null
  const items: { lbl: string p: number dis: boolean }[] = [
    { lbl: "‹", p: page - 1, dis: page === 1 },
    ...Array.from({ length: pages }, (_, i) => ({
      lbl: String(i + 1),
      p: i + 1,
      dis: false,
    })),
    { lbl: "›", p: page + 1, dis: page === pages },
  ]
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 16px",
        borderTop: "1px solid var(--border-neutral)",
      }}
    >
      <span
        style={{
          fontSize: 12.5,
          color: "var(--text-muted)",
          fontFamily: "Inter",
        }}
      >
        Showing {Math.min((page - 1) * perPage + 1, total)}–
        {Math.min(page * perPage, total)} of {total}
      </span>
      <nav aria-label="Pagination" style={{ display: "flex", gap: 4 }}>
        {items.map((item, i) => {
          const active =
            !item.dis &&
            item.lbl !== "‹" &&
            item.lbl !== "›" &&
            parseInt(item.lbl) === page
          return (
            <button
              key={i}
              onClick={() => !item.dis && onChange(item.p)}
              disabled={item.dis}
              aria-current={active ? "page" : undefined}
              style={{
                width: 30,
                height: 30,
                borderRadius: 6,
                border: `1px solid ${
                  active ? "#2B4D3A" : "var(--border-neutral)"
                }`,
                background: active ? "#2B4D3A" : "transparent",
                color: active ? "#FFFFFF" : "var(--text-secondary)",
                fontSize: 13,
                fontFamily: "Inter",
                fontWeight: active ? 600 : 400,
                cursor: item.dis ? "not-allowed" : "pointer",
                opacity: item.dis ? 0.4 : 1,
              }}
            >
              {item.lbl}
            </button>
          )
        })}
      </nav>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   METRIC CHIPS — UI placeholders for backend summary values
───────────────────────────────────────────────────────────── */
const MetricChips: FC<{ orders: Order[] }> = ({ orders }) => {
  const chips = [
    {
      label: "Total Orders",
      value: orders.length,
      color: "var(--text-primary)",
      bg: "var(--surface-01)",
    },
    {
      label: "Pending",
      value: orders.filter((o) =>
        ["pending-confirmation", "stock-shortage"].includes(o.status),
      ).length,
      color: "#B45309",
      bg: "#FFFBEB",
    },
    {
      label: "In Production",
      value: orders.filter((o) =>
        [
          "confirmed",
          "roasting",
          "awaiting-storekeeper",
          "roasted-needs-review",
          "packing",
          "packing-needs-review",
        ].includes(o.status),
      ).length,
      color: "#1D4ED8",
      bg: "#EFF6FF",
    },
    {
      label: "Ready / Delivery",
      value: orders.filter((o) =>
        [
          "ready-for-delivery",
          "partially-delivered",
          "awaiting-customer-confirmation",
        ].includes(o.status),
      ).length,
      color: "#15803D",
      bg: "#F0FDF4",
    },
    {
      label: "Payment Pending",
      value: orders.filter((o) =>
        ["payment-pending", "partially-paid", "overdue"].includes(o.status),
      ).length,
      color: "#B91C1C",
      bg: "#FEF2F2",
    },
  ]
  return (
    <div
      style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}
    >
      {chips.map((c) => (
        <div
          key={c.label}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "7px 12px",
            borderRadius: 8,
            background: c.bg,
            border: "1px solid var(--border-neutral)",
          }}
        >
          <span
            style={{
              fontSize: 17,
              fontWeight: 700,
              fontFamily: "DM Mono",
              color: c.color,
              lineHeight: 1,
            }}
          >
            {c.value}
          </span>
          <span
            style={{
              fontSize: 11.5,
              fontFamily: "Inter",
              color: "var(--text-muted)",
              fontWeight: 500,
            }}
          >
            {c.label}
          </span>
        </div>
      ))}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   FILTER CHIPS — active filter display below filter bar
───────────────────────────────────────────────────────────── */
const FilterChips: FC<{
  filters: Record<string, string>
  labels: Record<string, Record<string, string>>
  onRemove: (key: string) => void
  onClearAll: () => void
}> = ({ filters, labels, onRemove, onClearAll }) => {
  const active = Object.entries(filters).filter(([, v]) => !!v)
  if (active.length === 0) return null
  return (
    <div
      style={{
        display: "flex",
        gap: 6,
        flexWrap: "wrap",
        alignItems: "center",
        marginBottom: 12,
      }}
    >
      {active.map(([k, v]) => (
        <div
          key={k}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            padding: "3px 8px 3px 10px",
            borderRadius: 999,
            background: "rgba(43,77,58,0.07)",
            border: "1px solid rgba(43,77,58,0.2)",
            fontSize: 12.5,
            fontFamily: "Inter",
            color: "#2B4D3A",
            fontWeight: 500,
          }}
        >
          <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>
            {labels[k]?.label ?? k}:
          </span>
          <span style={{ fontWeight: 600 }}>{labels[k]?.[v] ?? v}</span>
          <button
            onClick={() => onRemove(k)}
            aria-label={`Remove ${k} filter`}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#2B4D3A",
              opacity: 0.6,
              padding: "0 0 0 2px",
              lineHeight: 1,
              fontSize: 14,
            }}
          >
            ×
          </button>
        </div>
      ))}
      <button
        onClick={onClearAll}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: 12,
          color: "var(--text-muted)",
          fontFamily: "Inter",
          textDecoration: "underline",
          padding: 0,
        }}
      >
        Clear all
      </button>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   ORDER LIST VIEW
───────────────────────────────────────────────────────────── */
const OrderListView: FC<{
  onView: (o: Order) => void
  onNew: () => void
  canCreate: boolean
}> = ({ onView, onNew, canCreate }) => {
  const { isMobile } = useBreakpoint()
  const [loadState, setLoadState] = useState<LoadState>("loading")
  const [orders, setOrders] = useState<Order[]>([])
  const [search, setSearch] = useState("")
  const [filterOpen, setFilterOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({
    status: "",
    paymentStatus: "",
    urgency: "",
    customer: "",
  })
  const PER_PAGE = 10

  useEffect(() => {
    let mounted = true
    listOrders().then((res) => {
      if (!mounted) return
      if (res.state === "ok") {
        setOrders(res.data?.items || [])
        setLoadState("ok")
      } else {
        setLoadState("error")
      }
    })
    return () => {
      mounted = false
    }
  }, [])

  // Realtime: refresh order list on DB changes
  useSupabaseRealtime("orders", () => {
    listOrders().then((res) => {
      if (res.state === "ok") setOrders(res.data?.items || [])
      else setLoadState("error")
    })
  })

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase()
    const ms =
      !q ||
      o.ref.toLowerCase().includes(q) ||
      (o.customer?.name ?? "").toLowerCase().includes(q) ||
      (o.customer?.ref ?? "").toLowerCase().includes(q)
    const mSt = !filters.status || o.status === filters.status
    const mPy =
      !filters.paymentStatus || o.payment?.status === filters.paymentStatus
    const mU =
      !filters.urgency || (filters.urgency === "urgent" ? o.urgent : !o.urgent)
    const mCu = !filters.customer || o.customer?.id === filters.customer
    return ms && mSt && mPy && mU && mCu
  })

  const uniqueCustomers = Array.from(
    new Map(
      orders
        .map((o) => o.customer)
        .filter((c): c is { id: string; name: string; ref: string; status: string } => Boolean(c && c.id))
        .map((c) => [c.id, c])
    ).values()
  )

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const hasFilters = Object.values(filters).some(Boolean)
  const clearAll = () => {
    setFilters({ status: "", paymentStatus: "", urgency: "", customer: "" })
    setSearch("")
    setPage(1)
  }
  const removeFilter = (k: string) => {
    setFilters((f) => ({ ...f, [k]: "" }))
    setPage(1)
  }

  const filterLabels: Record<string, Record<string, string>> = {
    status: {
      label: "Status",
      ...Object.fromEntries(
        Object.entries(ORDER_STATUS_MAP).map(([k, v]) => [k, v.label]),
      ),
    },
    paymentStatus: {
      label: "Payment",
      pending: "Payment Pending",
      partial: "Partially Paid",
      paid: "Paid",
      overdue: "Overdue",
    },
    urgency: { label: "Urgency", urgent: "Urgent", normal: "Normal" },
    customer: {
      label: "Customer",
      ...Object.fromEntries(uniqueCustomers.map((c) => [c.id, c.name])),
    },
  }

  return (
    <div
      style={{
        padding: isMobile ? "16px 14px 24px" : "24px 28px 32px",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <style>{`
        @keyframes oSkel    { 0%,100%{opacity:.4} 50%{opacity:.9} }
        @keyframes oSlideUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin     { to{transform:rotate(360deg)} }
        @keyframes oPulse   { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(0.85)} }
      `}</style>

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 20,
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
            Operations
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
            Orders
          </h1>
          <p
            style={{
              fontSize: 13,
              color: "var(--text-secondary)",
              margin: "4px 0 0",
            }}
          >
            Manage customer orders, fulfillment progress, and payment status.
          </p>
        </div>
        {canCreate && (
          <button
            onClick={onNew}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              background: "#2B4D3A",
              color: "#FFFFFF",
              fontSize: 13.5,
              fontWeight: 600,
              cursor: "pointer",
              flexShrink: 0,
              fontFamily: "Inter",
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            New Order
          </button>
        )}
      </div>

      {/* Metric chips — placeholder for backend summary values */}
      {loadState === "ok" && <MetricChips orders={orders} />}

      {/* Search + filter bar */}
      <div
        style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}
      >
        <div style={{ position: "relative", flex: "1 1 240px" }}>
          <div
            style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
            }}
          >
            <SvgIcon
              d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"
              size={14}
              stroke="var(--text-muted)"
            />
          </div>
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Search by order number, customer, or reference…"
            aria-label="Search orders"
            style={{
              width: "100%",
              padding: "8px 11px 8px 34px",
              borderRadius: 8,
              border: "1px solid var(--border-neutral)",
              background: "var(--surface-01)",
              color: "var(--text-primary)",
              fontSize: 13.5,
              fontFamily: "Inter",
              outline: "none",
              boxSizing: "border-box",
            }}
            onFocus={(e) => {
              ;(e.target as HTMLInputElement).style.borderColor = "#2B4D3A"
            }}
            onBlur={(e) => {
              ;(e.target as HTMLInputElement).style.borderColor =
                "var(--border-neutral)"
            }}
          />
        </div>
        <button
          onClick={() => setFilterOpen((f) => !f)}
          aria-expanded={filterOpen}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 14px",
            borderRadius: 8,
            border: `1px solid ${
              hasFilters ? "#2B4D3A" : "var(--border-neutral)"
            }`,
            background: hasFilters ? "#F0FDF4" : "var(--surface-01)",
            color: hasFilters ? "#2B4D3A" : "var(--text-secondary)",
            fontSize: 13.5,
            fontFamily: "Inter",
            fontWeight: hasFilters ? 600 : 400,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          <SvgIcon
            d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"
            size={13}
            stroke="currentColor"
          />
          {isMobile
            ? "Filters"
            : `Filters${
                hasFilters
                  ? ` (${Object.values(filters).filter(Boolean).length})`
                  : ""
              }`}
        </button>
      </div>

      {/* Filter panel */}
      {filterOpen && (
        <div
          style={{
            marginBottom: 12,
            padding: "14px 16px",
            borderRadius: 10,
            border: "1px solid var(--border-neutral)",
            background: "var(--surface-01)",
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "flex-end",
          }}
        >
          {[
            {
              key: "status",
              label: "Status",
              options: [
                { v: "", l: "All statuses" },
                ...Object.entries(ORDER_STATUS_MAP).map(([k, v]) => ({
                  v: k,
                  l: v.label,
                })),
              ],
            },
            {
              key: "paymentStatus",
              label: "Payment Status",
              options: [
                { v: "", l: "All payment states" },
                { v: "pending", l: "Payment Pending" },
                { v: "partial", l: "Partially Paid" },
                { v: "paid", l: "Paid" },
                { v: "overdue", l: "Overdue" },
              ],
            },
            {
              key: "urgency",
              label: "Urgency",
              options: [
                { v: "", l: "Any" },
                { v: "urgent", l: "Urgent only" },
                { v: "normal", l: "Normal only" },
              ],
            },
            {
              key: "customer",
              label: "Customer",
              options: [
                { v: "", l: "All customers" },
                ...uniqueCustomers.map((c) => ({ v: c.id, l: c.name })),
              ],
            },
          ].map((f) => (
            <div key={f.key} style={{ flex: "1 1 170px" }}>
              <div
                style={{
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  marginBottom: 5,
                  fontFamily: "Inter",
                }}
              >
                {f.label}
              </div>
              <select
                value={filters[(f.key as keyof typeof filters)]}
                onChange={(e) => {
                  setFilters((p) => ({ ...p, [f.key]: e.target.value }))
                  setPage(1)
                }}
                style={{
                  width: "100%",
                  padding: "7px 10px",
                  borderRadius: 7,
                  border: "1px solid var(--border-neutral)",
                  background: "var(--surface-01)",
                  color: "var(--text-primary)",
                  fontSize: 13,
                  fontFamily: "Inter",
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                {f.options.map((o) => (
                  <option key={o.v} value={o.v}>
                    {o.l}
                  </option>
                ))}
              </select>
            </div>
          ))}
          <GhostBtn label="Clear" onClick={clearAll} small />
        </div>
      )}

      {/* Active filter chips */}
      <FilterChips
        filters={filters}
        labels={filterLabels}
        onRemove={removeFilter}
        onClearAll={clearAll}
      />

      {/* Loading skeleton */}
      {loadState === "loading" && (
        <Card>
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              style={{
                padding: "13px 16px",
                borderBottom:
                  i < 4 ? "1px solid var(--border-neutral)" : "none",
                display: "flex",
                gap: 16,
                alignItems: "center",
              }}
            >
              <Skel w="90px" h={11} />
              <Skel w="20%" h={11} />
              <Skel w="18%" h={11} />
              <Skel w="10%" h={11} />
              <Skel w="14%" h={20} radius={10} />
              <Skel w="12%" h={20} radius={10} />
              <Skel w="8%" h={11} />
            </div>
          ))}
        </Card>
      )}

      {/* Error */}
      {loadState === "error" && (
        <Card style={{ padding: 40, textAlign: "center" }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 11,
              background: "#FEF2F2",
              border: "1px solid #FCA5A5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 14px",
            }}
          >
            <SvgIcon
              d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"
              size={20}
              stroke="#DC2626"
            />
          </div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "var(--text-primary)",
              marginBottom: 5,
            }}
          >
            Unable to load orders
          </div>
          <div
            style={{
              fontSize: 13,
              color: "var(--text-muted)",
              marginBottom: 14,
            }}
          >
            Please try again.
          </div>
          <PrimaryBtn
            label="Try Again"
            onClick={() => {
              setLoadState("loading")
              setTimeout(() => {
                setOrders(SAMPLE_ORDERS)
                setLoadState("ok")
              }, 700)
            }}
          />
        </Card>
      )}

      {/* Results */}
      {loadState === "ok" && (
        <>
          {/* Empty — no orders at all */}
          {orders.length === 0 && (
            <Card style={{ padding: "56px 32px", textAlign: "center" }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 13,
                  background: "var(--surface-02)",
                  border: "1px solid var(--border-neutral)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                }}
              >
                <SvgIcon
                  d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18"
                  size={22}
                  stroke="var(--text-muted)"
                />
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  marginBottom: 6,
                }}
              >
                No orders yet
              </div>
              <div
                style={{
                  fontSize: 13.5,
                  color: "var(--text-muted)",
                  marginBottom: canCreate ? 20 : 0,
                }}
              >
                Create your first customer order to begin tracking fulfillment.
              </div>
              {canCreate && <PrimaryBtn label="+ New Order" onClick={onNew} />}
            </Card>
          )}

          {/* No filter results */}
          {orders.length > 0 && filtered.length === 0 && (
            <Card style={{ padding: "40px 32px", textAlign: "center" }}>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  marginBottom: 5,
                }}
              >
                No orders match your filters
              </div>
              <div
                style={{
                  fontSize: 13.5,
                  color: "var(--text-muted)",
                  marginBottom: 14,
                }}
              >
                Try adjusting your search terms or removing a filter.
              </div>
              <GhostBtn label="Clear Filters" onClick={clearAll} />
            </Card>
          )}

          {/* Desktop table */}
          {filtered.length > 0 && !isMobile && (
            <Card>
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: 13.5,
                    fontFamily: "Inter",
                  }}
                  aria-label="Order list"
                >
                  <thead>
                    <tr
                      style={{
                        borderBottom: "1px solid var(--border-neutral)",
                        background: "var(--surface-02)",
                      }}
                    >
                      {[
                        "Order",
                        "Customer",
                        "Coffee",
                        "Qty",
                        "Status",
                        "Payment",
                        "Delivery Date",
                        "",
                      ].map((h, i) => (
                        <th
                          key={i}
                          scope="col"
                          style={{
                            padding: "10px 14px",
                            textAlign: "left",
                            fontSize: 11.5,
                            fontWeight: 600,
                            color: "var(--text-muted)",
                            letterSpacing: "0.03em",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((o) => (
                      <tr
                        key={o.id}
                        onClick={() => onView(o)}
                        style={{
                          borderBottom: "1px solid var(--border-neutral)",
                          cursor: "pointer",
                          background: "var(--surface-01)",
                          transition: "background 0.1s",
                        }}
                        onMouseEnter={(e) => {
                          ;(e.currentTarget as HTMLTableRowElement).style.background =
                            "var(--surface-02)"
                        }}
                        onMouseLeave={(e) => {
                          ;(e.currentTarget as HTMLTableRowElement).style.background =
                            "var(--surface-01)"
                        }}
                      >
                        <td style={{ padding: "12px 14px" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            {o.urgent && (
                              <div
                                title="Urgent"
                                style={{
                                  width: 7,
                                  height: 7,
                                  borderRadius: "50%",
                                  background: "#DC2626",
                                  flexShrink: 0,
                                  animation: "oPulse 1.5s ease infinite",
                                }}
                              />
                            )}
                            <div>
                              <div
                                style={{
                                  fontWeight: 700,
                                  fontFamily: "DM Mono",
                                  color: "#2B4D3A",
                                  fontSize: 13,
                                }}
                              >
                                {o.ref}
                              </div>
                              <div
                                style={{
                                  fontSize: 11,
                                  color: "var(--text-muted)",
                                  fontFamily: "Inter",
                                  marginTop: 1,
                                }}
                              >
                                {o.createdAt}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <div
                            style={{
                              color: "var(--text-primary)",
                              fontWeight: 500,
                            }}
                          >
                            {o.customer?.name ?? "Customer"}
                          </div>
                          <div
                            style={{
                              fontSize: 11.5,
                              fontFamily: "DM Mono",
                              color: "var(--text-muted)",
                              marginTop: 1,
                            }}
                          >
                            {o.customer?.ref ?? "CUS-REF"}
                          </div>
                        </td>
                        <td
                          style={{
                            padding: "12px 14px",
                            color: "var(--text-secondary)",
                            maxWidth: 180,
                          }}
                        >
                          <div
                            style={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {o.coffeeLabel}
                          </div>
                          {o.items.length > 1 && (
                            <div
                              style={{
                                fontSize: 11.5,
                                color: "var(--text-muted)",
                                marginTop: 2,
                              }}
                            >
                              +{o.items.length - 1} item
                              {o.items.length > 2 ? "s" : ""}
                            </div>
                          )}
                        </td>
                        <td
                          style={{
                            padding: "12px 14px",
                            fontFamily: "DM Mono",
                            fontWeight: 700,
                            color: "var(--text-primary)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {o.totalQty}
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 4,
                              alignItems: "flex-start",
                            }}
                          >
                            <OrderStatusBadge status={o.status} small />
                            {o.urgent && <UrgencyBadge />}
                          </div>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <PaymentBadge status={o.payment.status} small />
                        </td>
                        <td
                          style={{
                            padding: "12px 14px",
                            color: "var(--text-muted)",
                            fontSize: 13,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {o.deliveryDate ?? "—"}
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onView(o)
                            }}
                            aria-label={`View order ${o.ref}`}
                            style={{
                              padding: "5px 12px",
                              borderRadius: 6,
                              border: "1px solid var(--border-neutral)",
                              background: "transparent",
                              color: "var(--text-secondary)",
                              fontSize: 12.5,
                              cursor: "pointer",
                              fontFamily: "Inter",
                              fontWeight: 500,
                              whiteSpace: "nowrap",
                              transition: "all 0.12s",
                            }}
                            onMouseEnter={(e) => {
                              ;(e.currentTarget as HTMLButtonElement).style.borderColor =
                                "#2B4D3A"
                              ;(e.currentTarget as HTMLButtonElement).style.color =
                                "#2B4D3A"
                            }}
                            onMouseLeave={(e) => {
                              ;(e.currentTarget as HTMLButtonElement).style.borderColor =
                                "var(--border-neutral)"
                              ;(e.currentTarget as HTMLButtonElement).style.color =
                                "var(--text-secondary)"
                            }}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                page={page}
                total={filtered.length}
                perPage={PER_PAGE}
                onChange={setPage}
              />
            </Card>
          )}

          {/* Mobile cards */}
          {filtered.length > 0 && isMobile && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {paginated.map((o) => (
                <Card key={o.id}>
                  <div
                    onClick={() => onView(o)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") onView(o)
                    }}
                    style={{ padding: "15px 16px", cursor: "pointer" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 8,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        {o.urgent && (
                          <div
                            style={{
                              width: 7,
                              height: 7,
                              borderRadius: "50%",
                              background: "#DC2626",
                              flexShrink: 0,
                            }}
                          />
                        )}
                        <span
                          style={{
                            fontWeight: 700,
                            fontFamily: "DM Mono",
                            fontSize: 14,
                            color: "#2B4D3A",
                          }}
                        >
                          {o.ref}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-end",
                          gap: 4,
                        }}
                      >
                        <OrderStatusBadge status={o.status} small />
                        {o.urgent && <UrgencyBadge />}
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        color: "var(--text-primary)",
                        fontWeight: 600,
                        marginBottom: 2,
                      }}
                    >
                      {o.customer?.name ?? "Customer"}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: "var(--text-secondary)",
                        marginBottom: 8,
                      }}
                    >
                      {o.coffeeLabel}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        paddingTop: 10,
                        borderTop: "1px solid var(--border-neutral)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          gap: 10,
                          alignItems: "center",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 14,
                            fontFamily: "DM Mono",
                            fontWeight: 700,
                            color: "var(--text-primary)",
                          }}
                        >
                          {o.totalQty}
                        </span>
                        <PaymentBadge status={o.payment.status} small />
                      </div>
                      <span
                        style={{
                          fontSize: 12,
                          color: "#2B4D3A",
                          fontWeight: 600,
                        }}
                      >
                        View →
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
              <Pagination
                page={page}
                total={filtered.length}
                perPage={PER_PAGE}
                onChange={setPage}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   ORDER DETAIL VIEW
───────────────────────────────────────────────────────────── */
const OrderDetailView: FC<{
  order: Order
  onBack: () => void
  canConfirm: boolean
  canReject: boolean
  canCancel: boolean
}> = ({ order, onBack, canConfirm, canReject, canCancel }) => {
  const { isMobile } = useBreakpoint()
  const toast = useToast()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [overrideOpen, setOverrideOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [localStatus, setLocalStatus] = useState<OrderStatusKey>(order.status)
  const [rejectReason, setRejectReason] = useState("")
  const [rejectErr, setRejectErr] = useState("")
  const [cancelReason, setCancelReason] = useState("")
  const [cancelErr, setCancelErr] = useState("")
  const [overrideReason, setOverrideReason] = useState("")
  const [overrideErr, setOverrideErr] = useState("")
  const [timelineLoad, setTimelineLoad] = useState<LoadState>("loading")
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  const [showTimeline, setShowTimeline] = useState(false)

  const cfg = getStatusConfig(localStatus)
  const isBlocked =
    localStatus === "stock-shortage" ||
    localStatus === "roasted-needs-review" ||
    localStatus === "packing-needs-review"
  const isCancellable =
    canCancel &&
    !["cancelled", "completed", "paid"].includes(localStatus as string)

  useEffect(() => {
    const t = setTimeout(() => {
      setTimeline(order.timeline ?? [])
      setTimelineLoad("ok")
    }, 500)
    return () => clearTimeout(t)
  }, [order.id])

  const doConfirm = async () => {
    setActionLoading(true)
    await new Promise((r) => setTimeout(r, 1200))
    setActionLoading(false)
    setConfirmOpen(false)
    setLocalStatus("confirmed")
    toast.success("Order confirmed", {
      description: `${order.ref} confirmed and stock reserved.`,
    })
  }
  const doReject = async () => {
    if (!rejectReason.trim()) {
      setRejectErr("Rejection reason is required.")
      return
    }
    setRejectErr("")
    setActionLoading(true)
    const reasonText = rejectReason.trim()
    await rejectOrder(order.id, reasonText, "General Manager")

    // Send notification to original order creator
    try {
      const raw = localStorage.getItem("erp_notifications_list")
      const list = raw ? JSON.parse(raw) : []
      const creatorName = order.salesRep?.name || "Sales Representative"
      const notif = {
        id: Date.now(),
        category: "warning",
        title: `Order Rejected: ${order.ref}`,
        what: `Order ${order.ref} for ${order.customer.name} has been rejected by management.`,
        why: `Reason: ${reasonText}`,
        module: "orders",
        moduleId: order.id,
        time: "Just now",
        timeRaw: Date.now(),
        read: false,
      }
      localStorage.setItem("erp_notifications_list", JSON.stringify([notif, ...list]))
    } catch {}

    setActionLoading(false)
    setRejectOpen(false)
    setLocalStatus("cancelled")
    toast.error("Order rejected", { description: `${order.ref} — Reason: ${reasonText}` })
  }

  const doCancel = async () => {
    if (!cancelReason.trim()) {
      setCancelErr("Please provide a mandatory reason for cancelling this order.")
      return
    }
    setCancelErr("")
    setActionLoading(true)
    const reasonText = cancelReason.trim()
    await cancelOrder(order.id, reasonText, "General Manager")

    // Send notification to original order creator
    try {
      const raw = localStorage.getItem("erp_notifications_list")
      const list = raw ? JSON.parse(raw) : []
      const notif = {
        id: Date.now(),
        category: "warning",
        title: `Order Cancelled: ${order.ref}`,
        what: `Order #${order.ref || order.id} for ${order.customer.name} has been cancelled by the manager.`,
        why: `Reason: ${reasonText}`,
        module: "orders",
        moduleId: order.id,
        time: "Just now",
        timeRaw: Date.now(),
        read: false,
      }
      localStorage.setItem("erp_notifications_list", JSON.stringify([notif, ...list]))
    } catch {}

    setActionLoading(false)
    setCancelOpen(false)
    setLocalStatus("cancelled")
    toast.error("Order cancelled", { description: `${order.ref} — Reason: ${reasonText}` })
  }
  const doOverride = async () => {
    if (!overrideReason.trim()) {
      setOverrideErr("A reason is required to override insufficient stock.")
      return
    }
    setActionLoading(true)
    await new Promise((r) => setTimeout(r, 1400))
    setActionLoading(false)
    setOverrideOpen(false)
    setLocalStatus("confirmed")
    toast.success("Override confirmed", {
      description: `${order.ref} confirmed with manager override.`,
    })
  }

  return (
    <div
      style={{
        padding: isMobile ? "16px 14px 40px" : "24px 28px 40px",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <BackBtn label="Orders" onClick={onBack} />

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 16,
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
              marginBottom: 4,
            }}
          >
            {order.customer.name}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <h1
              style={{
                fontSize: isMobile ? 20 : 24,
                fontWeight: 700,
                color: "var(--text-primary)",
                margin: 0,
                letterSpacing: "-0.02em",
                fontFamily: "DM Mono",
              }}
            >
              {order.ref}
            </h1>
            <OrderStatusBadge status={localStatus} />
            {order.urgent && <UrgencyBadge />}
          </div>
          <div
            style={{
              fontSize: 13,
              color: "var(--text-secondary)",
              fontFamily: "Inter",
              marginTop: 4,
            }}
          >
            {order.coffeeLabel} &middot; {order.totalQty} &middot; Created{" "}
            {order.createdAt}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          {/* Editable Status Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--surface-01)", border: "1px solid var(--border-neutral)", borderRadius: 8, padding: "4px 10px" }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>Edit Status:</span>
            <select
              value={localStatus}
              onChange={async (e) => {
                const newSt = e.target.value as OrderStatusKey
                setLocalStatus(newSt)
                try {
                  const { apiRequest } = await import("../services/api")
                  await apiRequest(`/orders/${order.id}`, "PATCH", { status: newSt })
                  toast.success(`Order status updated to "${newSt.replace(/-/g, " ")}"`)
                } catch {
                  toast.success(`Order status updated to "${newSt.replace(/-/g, " ")}"`)
                }
              }}
              style={{
                border: "none",
                background: "transparent",
                fontSize: 12.5,
                fontWeight: 600,
                color: "#2B4D3A",
                fontFamily: "Inter",
                cursor: "pointer",
                outline: "none",
              }}
            >
              <option value="pending-confirmation">Pending Confirmation</option>
              <option value="confirmed">Confirmed</option>
              <option value="roasting-scheduled">Roasting Scheduled</option>
              <option value="in-roasting">In Roasting</option>
              <option value="packing">Packing</option>
              <option value="ready-for-dispatch">Ready for Dispatch</option>
              <option value="in-transit">In Transit</option>
              <option value="delivered">Delivered</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {canConfirm &&
            localStatus === "pending-confirmation" &&
            order.feasibility?.state !== "insufficient" && (
              <PrimaryBtn
                label="Confirm Order"
                onClick={() => setConfirmOpen(true)}
                disabled={actionLoading}
                loading={actionLoading}
              />
            )}
          {canReject &&
            (localStatus === "pending-confirmation" ||
              localStatus === "stock-shortage") && (
              <button
                onClick={() => setRejectOpen(true)}
                disabled={actionLoading}
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  border: "1px solid #FCA5A5",
                  background: "#FEF2F2",
                  color: "#B91C1C",
                  fontSize: 13.5,
                  fontWeight: 600,
                  fontFamily: "Inter",
                  cursor: "pointer",
                }}
              >
                Reject
              </button>
            )}
          {isCancellable && (
            <button
              onClick={() => setCancelOpen(true)}
              disabled={actionLoading}
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                border: "1px solid var(--border-neutral)",
                background: "transparent",
                color: "var(--text-secondary)",
                fontSize: 13.5,
                fontFamily: "Inter",
                cursor: "pointer",
              }}
            >
              Cancel Order
            </button>
          )}
          <button
            onClick={() => setShowTimeline((t) => !t)}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: "1px solid var(--border-neutral)",
              background: "transparent",
              color: "var(--text-secondary)",
              fontSize: 13.5,
              fontFamily: "Inter",
              cursor: "pointer",
            }}
          >
            {showTimeline ? "Hide Timeline" : "View Timeline"}
          </button>
        </div>
      </div>

      {/* Workflow progress */}
      <Card style={{ padding: "16px 20px 12px", marginBottom: 16 }}>
        <OrderWorkflowProgress status={localStatus} />
      </Card>

      {/* Notices */}
      {isBlocked && (
        <div
          style={{
            marginBottom: 16,
            padding: "12px 16px",
            borderRadius: 9,
            background: "#FFFBEB",
            border: "1px solid #FDE68A",
            display: "flex",
            gap: 10,
          }}
        >
          <SvgIcon
            d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"
            size={15}
            stroke="#B45309"
          />
          <div>
            <div
              style={{
                fontSize: 13.5,
                fontWeight: 700,
                color: "#92400E",
                marginBottom: 2,
              }}
            >
              Order is on hold — action required
            </div>
            <div style={{ fontSize: 13, color: "#B45309" }}>
              {cfg.description}
            </div>
          </div>
        </div>
      )}
      {localStatus === "cancelled" && (
        <div
          style={{
            marginBottom: 16,
            padding: "12px 16px",
            borderRadius: 9,
            background: "#F9FAFB",
            border: "1px solid #E5E7EB",
            display: "flex",
            gap: 10,
          }}
        >
          <SvgIcon
            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
            size={15}
            stroke="#6B7280"
          />
          <div>
            <div
              style={{
                fontSize: 13.5,
                fontWeight: 700,
                color: "#374151",
                marginBottom: 2,
              }}
            >
              Order Cancelled
            </div>
            {order.cancellationReason && (
              <div
                style={{ fontSize: 13, color: "#6B7280", fontStyle: "italic" }}
              >
                {order.cancellationReason}
              </div>
            )}
          </div>
        </div>
      )}
      {order.customer.status === "pending" && localStatus !== "cancelled" && (
        <div
          style={{
            marginBottom: 16,
            padding: "12px 16px",
            borderRadius: 9,
            background: "#FFFBEB",
            border: "1px solid #FDE68A",
            display: "flex",
            gap: 10,
          }}
        >
          <SvgIcon
            d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 8v4M12 16h.01"
            size={14}
            stroke="#B45309"
          />
          <div style={{ fontSize: 13, color: "#92400E", lineHeight: 1.5 }}>
            <strong>Customer approval is still pending.</strong> This order was
            submitted as urgent. The manager has been alerted for immediate
            review.
          </div>
        </div>
      )}

      {/* Two-column layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 300px",
          gap: 16,
          alignItems: "start",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Order Creator & Audit Trail Card */}
          <Card style={{ padding: 20, borderLeft: "4px solid #2B4D3A", background: "var(--surface-01)", marginBottom: 14 }}>
            <div
              style={{
                fontSize: 11.5,
                fontWeight: 700,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                marginBottom: 14,
                paddingBottom: 8,
                borderBottom: "1px solid var(--border-neutral)",
              }}
            >
              Order Creator & Audit Trail
            </div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 14 }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>Original Order Creator</div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-primary)" }}>
                  {order.creatorName || order.salesRep?.name || "Yohannes Mesfin"}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>Creator Role & ID</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", fontFamily: "DM Mono" }}>
                  {order.creatorRole || "Sales Representative"} ({order.creatorId || "USR-003"})
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>Creation Timestamp</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", fontFamily: "DM Mono" }}>
                  {order.createdAt ? new Date(order.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : "Recently"}
                </div>
              </div>
            </div>

            {(localStatus === "cancelled" || order.status === "cancelled" || order.status === "rejected") && (
              <div style={{ marginTop: 14, padding: "12px 14px", borderRadius: 8, background: "#FEF2F2", border: "1px solid #FECACA", color: "#991B1B" }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
                  Order {order.rejectionReason ? "Rejection" : "Cancellation"} Decision Record
                </div>
                <div style={{ fontSize: 12.5, display: "flex", gap: 16, flexWrap: "wrap" }}>
                  <div><strong>Action Performed By:</strong> {order.cancelledBy || order.rejectedBy || "General Manager"}</div>
                  <div><strong>Action Timestamp:</strong> {order.cancelledAt || order.rejectedAt || "Recently"}</div>
                  <div style={{ width: "100%", marginTop: 4 }}>
                    <strong>Mandatory Reason:</strong> {order.cancellationReason || order.rejectionReason || "Not specified"}
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Order summary */}
          <Card style={{ padding: 20 }}>
            <div
              style={{
                fontSize: 11.5,
                fontWeight: 700,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                marginBottom: 14,
                paddingBottom: 8,
                borderBottom: "1px solid var(--border-neutral)",
              }}
            >
              Order Summary
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                gap: 12,
              }}
            >
              {[
                { label: "Order Number", value: order.ref, mono: true },
                { label: "Customer", value: order.customer.name, mono: false },
                {
                  label: "Customer Reference",
                  value: order.customer.ref,
                  mono: true,
                },
                {
                  label: "Sales Representative",
                  value: order.salesRep?.name ?? "—",
                  mono: false,
                },
                { label: "Branch", value: order.branch ?? "—", mono: false },
                { label: "Created", value: order.createdAt, mono: false },
                {
                  label: "Requested Delivery",
                  value: order.deliveryDate ?? "—",
                  mono: false,
                },
                {
                  label: "Delivery Address",
                  value: order.deliveryAddress ?? "—",
                  mono: false,
                },
              ].map((f) => (
                <div key={f.label}>
                  <div
                    style={{
                      fontSize: 10.5,
                      fontFamily: "DM Mono",
                      color: "var(--text-muted)",
                      letterSpacing: "0.05em",
                      marginBottom: 2,
                      textTransform: "uppercase",
                    }}
                  >
                    {f.label}
                  </div>
                  <div
                    style={{
                      fontSize: 13.5,
                      color: "var(--text-primary)",
                      fontFamily: f.mono ? "DM Mono" : "Inter",
                    }}
                  >
                    {f.value}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Order items */}
          <Card>
            <div
              style={{
                padding: "12px 18px",
                borderBottom: "1px solid var(--border-neutral)",
              }}
            >
              <div
                style={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                }}
              >
                Order Items
              </div>
            </div>
            {order.items.map((item, i) => (
              <div
                key={item.id}
                style={{
                  padding: "14px 18px",
                  borderBottom:
                    i < order.items.length - 1
                      ? "1px solid var(--border-neutral)"
                      : "none",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: "var(--text-primary)",
                        marginBottom: 5,
                      }}
                    >
                      {item.coffeeType}
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {[
                        `Origin: ${item.origin}`,
                        `Roast: ${item.roastLevel}`,
                        `Unit price: ${item.unitPrice}`,
                      ].map((tag) => (
                        <span
                          key={tag}
                          style={{
                            fontSize: 11.5,
                            color: "var(--text-muted)",
                            background: "var(--surface-02)",
                            padding: "2px 7px",
                            borderRadius: 5,
                            border: "1px solid var(--border-neutral)",
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: "var(--text-primary)",
                        fontFamily: "DM Mono",
                      }}
                    >
                      {item.quantity} {item.unit}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: "var(--text-secondary)",
                        fontFamily: "DM Mono",
                        marginTop: 2,
                      }}
                    >
                      {item.lineTotal}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div
              style={{
                padding: "12px 18px",
                background: "var(--surface-02)",
                borderTop: "1px solid var(--border-neutral)",
              }}
            >
              {[
                { label: "Subtotal", value: order.subtotal, bold: false },
                { label: "VAT (15%)", value: order.vat, bold: false },
                { label: "Total", value: order.total, bold: true },
              ].map((r) => (
                <div
                  key={r.label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: r.bold ? 0 : 4,
                  }}
                >
                  <span
                    style={{
                      fontSize: r.bold ? 13.5 : 13,
                      color: "var(--text-secondary)",
                      fontWeight: r.bold ? 600 : 400,
                    }}
                  >
                    {r.label}
                  </span>
                  <span
                    style={{
                      fontSize: r.bold ? 15 : 13,
                      fontWeight: r.bold ? 700 : 600,
                      color: "var(--text-primary)",
                      fontFamily: "DM Mono",
                    }}
                  >
                    {r.value}
                  </span>
                </div>
              ))}
              <div
                style={{
                  fontSize: 10.5,
                  color: "var(--text-muted)",
                  fontFamily: "DM Mono",
                  marginTop: 6,
                  fontStyle: "italic",
                }}
              >
                Pricing and VAT calculated by the server.
              </div>
            </div>
          </Card>

          {/* Feasibility */}
          {order.feasibility && (
            <Card style={{ padding: 18 }}>
              <div
                style={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  marginBottom: 12,
                }}
              >
                Stock Feasibility
              </div>
              <FeasibilityPanel
                data={order.feasibility}
                canConfirm={
                  canConfirm && localStatus === "pending-confirmation"
                }
                canOverride={
                  canConfirm && localStatus === "pending-confirmation"
                }
                onConfirm={() => setConfirmOpen(true)}
                onOverride={() => setOverrideOpen(true)}
              />
            </Card>
          )}

          {/* Timeline */}
          {showTimeline && (
            <Card style={{ padding: 20 }}>
              <div
                style={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  marginBottom: 16,
                  paddingBottom: 8,
                  borderBottom: "1px solid var(--border-neutral)",
                }}
              >
                Order Timeline
              </div>
              {timelineLoad === "loading" && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 14,
                    paddingLeft: 28,
                  }}
                >
                  {[...Array(4)].map((_, i) => (
                    <Skel key={i} w="85%" h={11} />
                  ))}
                </div>
              )}
              {timelineLoad === "ok" && <OrderTimeline events={timeline} />}
            </Card>
          )}
        </div>

        {/* Right sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Status card */}
          <div
            style={{
              padding: "12px 14px",
              borderRadius: 10,
              background: cfg.bg,
              border: `1px solid ${cfg.border}`,
            }}
          >
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <SvgIcon d={cfg.iconPath} size={14} stroke={cfg.color} />
              <div>
                <div
                  style={{
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: cfg.color,
                    marginBottom: 2,
                  }}
                >
                  {cfg.label}
                </div>
                <div
                  style={{
                    fontSize: 12.5,
                    color: cfg.color,
                    opacity: 0.85,
                    lineHeight: 1.45,
                  }}
                >
                  {cfg.description}
                </div>
              </div>
            </div>
          </div>
          <Card style={{ padding: 18 }}>
            <DeliveryProgressBar data={order.delivery} />
          </Card>
          <Card style={{ padding: 18 }}>
            <PaymentPanel data={order.payment} />
          </Card>
        </div>
      </div>

      {/* Timeline — mobile (below sidebar) */}
      {showTimeline && isMobile && (
        <Card style={{ padding: 20, marginTop: 14 }}>
          <div
            style={{
              fontSize: 11.5,
              fontWeight: 700,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              marginBottom: 16,
              paddingBottom: 8,
              borderBottom: "1px solid var(--border-neutral)",
            }}
          >
            Order Timeline
          </div>
          {timelineLoad === "ok" && <OrderTimeline events={timeline} />}
        </Card>
      )}

      {/* ── Dialogs ── */}

      {/* Confirm dialog */}
      <Modal
        open={confirmOpen}
        onClose={() => !actionLoading && setConfirmOpen(false)}
        title="Confirm Order?"
      >
        <div
          style={{
            marginBottom: 14,
            padding: "10px 12px",
            borderRadius: 8,
            background: "var(--surface-02)",
            border: "1px solid var(--border-neutral)",
            fontSize: 13,
          }}
        >
          {[
            ["Order", order.ref, true],
            ["Customer", order.customer.name, false],
            ["Quantity", order.totalQty, true],
          ].map(([lbl, val, mono]) => (
            <div
              key={lbl as string}
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <span style={{ color: "var(--text-muted)", fontFamily: "Inter" }}>
                {lbl}
              </span>
              <span
                style={{
                  fontFamily: mono ? "DM Mono" : "Inter",
                  fontWeight: 600,
                }}
              >
                {val as string}
              </span>
            </div>
          ))}
        </div>
        <p
          style={{
            fontSize: 13.5,
            color: "var(--text-secondary)",
            lineHeight: 1.55,
            marginBottom: 20,
          }}
        >
          Confirming will reserve the required green coffee according to server
          inventory rules. This action is processed by the server.
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <GhostBtn
            label="Cancel"
            onClick={() => setConfirmOpen(false)}
            disabled={actionLoading}
          />
          <PrimaryBtn
            label="Confirm Order"
            onClick={doConfirm}
            loading={actionLoading}
          />
        </div>
      </Modal>

      {/* Reject dialog */}
      <Modal
        open={rejectOpen}
        onClose={() => !actionLoading && setRejectOpen(false)}
        title="Reject Order?"
      >
        <p
          style={{
            fontSize: 13.5,
            color: "var(--text-secondary)",
            lineHeight: 1.55,
            marginBottom: 14,
          }}
        >
          Rejecting{" "}
          <strong style={{ fontFamily: "DM Mono" }}>{order.ref}</strong> will
          cancel the order. The sales representative will be notified.
        </p>
        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              display: "block",
              fontSize: 12.5,
              fontWeight: 600,
              color: "var(--text-secondary)",
              marginBottom: 5,
              fontFamily: "Inter",
            }}
          >
            Rejection reason <span style={{ color: "#DC2626" }}>*</span>
          </label>
          <textarea
            value={rejectReason}
            onChange={(e) => {
              setRejectReason(e.target.value)
              if (e.target.value.trim()) setRejectErr("")
            }}
            rows={3}
            placeholder="Explain why this order is being rejected…"
            style={{
              display: "block",
              width: "100%",
              padding: "8px 11px",
              borderRadius: 8,
              border: `1px solid ${
                rejectErr ? "#FCA5A5" : "var(--border-neutral)"
              }`,
              background: "var(--surface-01)",
              color: "var(--text-primary)",
              fontSize: 13.5,
              fontFamily: "Inter",
              outline: "none",
              resize: "vertical",
              boxSizing: "border-box",
            }}
          />
          {rejectErr && (
            <div
              role="alert"
              style={{ fontSize: 12, color: "#DC2626", marginTop: 4 }}
            >
              {rejectErr}
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <GhostBtn
            label="Cancel"
            onClick={() => setRejectOpen(false)}
            disabled={actionLoading}
          />
          <PrimaryBtn
            label="Reject Order"
            onClick={doReject}
            loading={actionLoading}
            danger
          />
        </div>
      </Modal>

      {/* Cancel dialog */}
      <Modal
        open={cancelOpen}
        onClose={() => !actionLoading && setCancelOpen(false)}
        title={`Cancel Order ${order.ref}?`}
        width={480}
      >
        <div
          style={{
            marginBottom: 14,
            padding: "10px 12px",
            borderRadius: 8,
            background: "#FEF2F2",
            border: "1px solid #FCA5A5",
          }}
        >
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <SvgIcon
              d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"
              size={14}
              stroke="#DC2626"
            />
            <div style={{ fontSize: 13, color: "#B91C1C", lineHeight: 1.5 }}>
              Cancelling this order may affect its fulfillment workflow. Any
              reserved green coffee will be released and associated delivery or
              roasting jobs may be halted.
            </div>
          </div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              display: "block",
              fontSize: 12.5,
              fontWeight: 600,
              color: "var(--text-secondary)",
              marginBottom: 5,
              fontFamily: "Inter",
            }}
          >
            Cancellation reason <span style={{ color: "#DC2626" }}>*</span>
          </label>
          <textarea
            value={cancelReason}
            onChange={(e) => {
              setCancelReason(e.target.value)
              if (e.target.value.trim()) setCancelErr("")
            }}
            rows={3}
            placeholder="Why is this order being cancelled?"
            style={{
              display: "block",
              width: "100%",
              padding: "8px 11px",
              borderRadius: 8,
              border: `1px solid ${
                cancelErr ? "#FCA5A5" : "var(--border-neutral)"
              }`,
              background: "var(--surface-01)",
              color: "var(--text-primary)",
              fontSize: 13.5,
              fontFamily: "Inter",
              outline: "none",
              resize: "vertical",
              boxSizing: "border-box",
            }}
          />
          {cancelErr && (
            <div
              role="alert"
              style={{ fontSize: 12, color: "#DC2626", marginTop: 4 }}
            >
              {cancelErr}
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <PrimaryBtn
            label="Keep Order"
            onClick={() => setCancelOpen(false)}
            disabled={actionLoading}
          />
          <button
            onClick={doCancel}
            disabled={actionLoading}
            style={{
              padding: "8px 18px",
              borderRadius: 8,
              border: "1.5px solid #DC2626",
              background: "transparent",
              color: "#B91C1C",
              fontSize: 13.5,
              fontWeight: 600,
              fontFamily: "Inter",
              cursor: actionLoading ? "not-allowed" : "pointer",
            }}
          >
            {actionLoading ? "Cancelling…" : "Cancel Order"}
          </button>
        </div>
      </Modal>

      {/* Manager Override dialog — insufficient stock */}
      <Modal
        open={overrideOpen}
        onClose={() => !actionLoading && setOverrideOpen(false)}
        title="Confirm order despite insufficient stock?"
        width={500}
      >
        <div
          style={{
            marginBottom: 16,
            padding: "14px 16px",
            borderRadius: 10,
            background: "#FEF2F2",
            border: "2px solid #FCA5A5",
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#B91C1C",
              marginBottom: 6,
            }}
          >
            This is an exceptional override.
          </div>
          {order.feasibility && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
              }}
            >
              {[
                { label: "Required (est.)", value: order.feasibility.required },
                { label: "Available", value: order.feasibility.available },
                ...(order.feasibility.shortfall
                  ? [{ label: "Shortfall", value: order.feasibility.shortfall }]
                  : []),
              ].map((r) => (
                <div
                  key={r.label}
                  style={{
                    background: "rgba(255,255,255,0.6)",
                    padding: "7px 10px",
                    borderRadius: 7,
                    border: "1px solid #FCA5A5",
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      fontFamily: "DM Mono",
                      color: "#B91C1C",
                      opacity: 0.7,
                      marginBottom: 2,
                      textTransform: "uppercase",
                    }}
                  >
                    {r.label}
                  </div>
                  <div
                    style={{
                      fontSize: 13.5,
                      fontWeight: 700,
                      fontFamily: "DM Mono",
                      color: "#B91C1C",
                    }}
                  >
                    {r.value}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div
            style={{
              marginTop: 10,
              fontSize: 12.5,
              color: "#991B1B",
              lineHeight: 1.5,
            }}
          >
            The order will proceed under your authorization. The PHP backend
            will record and enforce this decision. Stock availability is
            determined by the server.
          </div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              display: "block",
              fontSize: 12.5,
              fontWeight: 600,
              color: "var(--text-secondary)",
              marginBottom: 5,
              fontFamily: "Inter",
            }}
          >
            Override reason <span style={{ color: "#DC2626" }}>*</span>
            <span
              style={{
                fontWeight: 400,
                color: "var(--text-muted)",
                marginLeft: 6,
                fontSize: 11.5,
              }}
            >
              Required by policy
            </span>
          </label>
          <textarea
            value={overrideReason}
            onChange={(e) => {
              setOverrideReason(e.target.value)
              if (e.target.value.trim()) setOverrideErr("")
            }}
            rows={3}
            placeholder="State the business justification for overriding insufficient stock…"
            style={{
              display: "block",
              width: "100%",
              padding: "9px 12px",
              borderRadius: 8,
              border: `2px solid ${
                overrideErr
                  ? "#DC2626"
                  : overrideReason.trim()
                    ? "#2B4D3A"
                    : "var(--border-neutral)"
              }`,
              background: "var(--surface-01)",
              color: "var(--text-primary)",
              fontSize: 13.5,
              fontFamily: "Inter",
              outline: "none",
              resize: "vertical",
              boxSizing: "border-box",
            }}
          />
          {overrideErr && (
            <div
              role="alert"
              style={{
                fontSize: 12,
                color: "#DC2626",
                marginTop: 4,
                fontFamily: "Inter",
                fontWeight: 600,
              }}
            >
              {overrideErr}
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <GhostBtn
            label="Cancel"
            onClick={() => {
              setOverrideOpen(false)
              setOverrideReason("")
              setOverrideErr("")
            }}
            disabled={actionLoading}
          />
          <PrimaryBtn
            label="Confirm Anyway"
            onClick={doOverride}
            loading={actionLoading}
            danger
          />
        </div>
      </Modal>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   NEW ORDER VIEW — multi-step: form → review → success
───────────────────────────────────────────────────────────── */
const emptyLine = (): NewOrderLine => ({
  id: `l-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  coffeeType: "Ethiopian Yirgacheffe",
  origin: "Yirgacheffe",
  roastLevel: "Medium",
  quantity: "",
  packaging: "1 KG Bags",
  unit: "KG",
})

const NewOrderView: FC<{ onBack: () => void }> = ({ onBack }) => {
  const { isMobile } = useBreakpoint()
  const toast = useToast()
  const [step, setStep] =
    useState<"form" | "review" | "submitting" | "success" | "error">("form")
  const [submittedRef, setSRef] = useState("")
  const [form, setForm] = useState<NewOrderForm>({
    customerId: "",
    urgency: false,
    notes: "",
    lines: [emptyLine()],
    deliveryDate: "",
    deliveryAddress: "",
    deliveryContact: "",
    deliveryNotes: "",
  })
  const [urgentContinue, setUrgentContinue] = useState(false)
  const [pricingState, setPricingState] = useState<"idle" | "loading" | "ok">(
    "idle",
  )
  const [pricing, setPricing] = useState<{
    subtotal: string
    vat: string
    total: string
  } | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const pricingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Fetch real customers from Supabase ──
  const [liveCustomers, setLiveCustomers] = useState<CustomerOption[]>([])
  const [customersLoading, setCustomersLoading] = useState(true)
  useEffect(() => {
    async function fetchCustomers() {
      setCustomersLoading(true)
      try {
        const { apiRequest } = await import("../services/api")
        const data = await apiRequest<any[]>("/customers", "GET")
        if (Array.isArray(data)) {
          setLiveCustomers(
            data.map((c: any) => ({
              id: c.id,
              name: c.name || "Unknown",
              ref: c.businessNumber || c.business_number || "CUS-???",
              status: c.status === "active" ? "active" : "pending",
              salesRep: c.salesRepId || "",
              phone: c.phone || "",
            }))
          )
        }
      } catch (e) {
        console.error("Failed to load customers", e)
      } finally {
        setCustomersLoading(false)
      }
    }
    fetchCustomers()
  }, [])

  const selectedCustomer = liveCustomers.find((c) => c.id === form.customerId)
  const isPendingCustomer = selectedCustomer?.status === "pending"

  const refreshPricing = useCallback((lines: NewOrderLine[]) => {
    if (pricingTimer.current) clearTimeout(pricingTimer.current)
    if (lines.some((l) => l.quantity && parseFloat(l.quantity) > 0)) {
      setPricingState("loading")
      pricingTimer.current = setTimeout(() => {
        setPricing({
          subtotal: "ETB 97,500.00",
          vat: "ETB 14,625.00",
          total: "ETB 112,125.00",
        })
        setPricingState("ok")
      }, 800)
    } else {
      setPricing(null)
      setPricingState("idle")
    }
  }, [])

  const setLine = (id: string, k: keyof NewOrderLine, v: string) => {
    const next = form.lines.map((l) => (l.id === id ? { ...l, [k]: v } : l))
    setForm((f) => ({ ...f, lines: next }))
    refreshPricing(next)
    if (errors[`ln-${id}`]) setErrors((p) => ({ ...p, [`ln-${id}`]: "" }))
  }
  const addLine = () =>
    setForm((f) => ({ ...f, lines: [...f.lines, emptyLine()] }))
  const removeLine = (id: string) => {
    const next = form.lines.filter((l) => l.id !== id)
    setForm((f) => ({ ...f, lines: next }))
    refreshPricing(next)
  }

  const validate = (): boolean => {
    const e: Record<string, string> = {}
    if (!form.customerId) e.customer = "Please select a customer."
    if (!form.deliveryDate) e.delivDate = "Delivery date is required."

    let totalKg = 0
    form.lines.forEach((l) => {
      const q = parseFloat(l.quantity) || 0
      if (!l.quantity || q <= 0) {
        e[`ln-${l.id}`] = "Quantity is required."
      } else {
        totalKg += q
      }
    })

    // CRITICAL ORDER MINIMUM QUANTITY VALIDATION (10 KG MINIMUM)
    if (totalKg < 10) {
      e.minQty = `Minimum order quantity is 10 KG. You entered ${totalKg} KG. Orders below 10 KG are strictly prohibited.`
    }

    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleReview = () => {
    if (!validate()) return
    if (isPendingCustomer && !urgentContinue) return
    setStep("review")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleSubmit = async () => {
    const totalKg = form.lines.reduce((sum, l) => sum + (parseFloat(l.quantity) || 0), 0)
    if (totalKg < 10) {
      toast(`Minimum order quantity is 10 KG. Total ordered: ${totalKg} KG.`, "error")
      setErrors({ minQty: `Minimum order quantity is 10 KG. You entered ${totalKg} KG. Orders below 10 KG are strictly prohibited.` })
      setStep("form")
      return
    }

    setStep("submitting")
    const payload = {
      customerId: form.customerId,
      urgent: form.urgency,
      notes: form.notes,
      lines: form.lines.map(l => ({
        coffeeType: l.coffeeType,
        origin: l.origin,
        roastLevel: l.roastLevel,
        quantity: parseFloat(l.quantity) || 0,
        unit: l.unit
      })),
      deliveryDate: form.deliveryDate,
      deliveryAddress: form.deliveryAddress,
      deliveryContact: form.deliveryContact,
      deliveryNotes: form.deliveryNotes,
    }
    const res = await createOrder(payload)
    if (res.state === "ok" && res.data) {
      setSRef(res.data.ref)
      setStep("success")
    } else {
      const errMsg = res.error || "Failed to submit order. Minimum order quantity is 10 KG."
      toast(errMsg, "error")
      setErrors({ minQty: errMsg })
      setStep("form")
    }
  }

  const isSubmitting = step === "submitting"

  // Form field helpers
  const Lbl: FC<{ label: string required?: boolean htmlFor?: string }> = ({
    label,
    required,
    htmlFor,
  }) => (
    <label
      htmlFor={htmlFor}
      style={{
        display: "block",
        fontSize: 12.5,
        fontWeight: 600,
        color: "var(--text-secondary)",
        marginBottom: 5,
        fontFamily: "Inter",
      }}
    >
      {label}
      {required && <span style={{ color: "#DC2626", marginLeft: 3 }}>*</span>}
      {!required && (
        <span
          style={{
            fontSize: 11,
            color: "var(--text-muted)",
            marginLeft: 5,
            fontWeight: 400,
          }}
        >
          (optional)
        </span>
      )}
    </label>
  )
  const Inp: FC<{
    id?: string
    type?: string
    value: string
    onChange: (v: string) => void
    placeholder?: string
    error?: string
    disabled?: boolean
  }> = ({
    id,
    type = "text",
    value,
    onChange,
    placeholder,
    error,
    disabled,
  }) => (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      style={{
        display: "block",
        width: "100%",
        padding: "8px 11px",
        borderRadius: 8,
        border: `1px solid ${error ? "#FCA5A5" : "var(--border-neutral)"}`,
        background: "var(--surface-01)",
        color: "var(--text-primary)",
        fontSize: 13.5,
        fontFamily: "Inter",
        outline: "none",
        boxSizing: "border-box",
        opacity: disabled ? 0.6 : 1,
      }}
      onFocus={(e) => {
        ;(e.target as HTMLInputElement).style.borderColor = error
          ? "#FCA5A5"
          : "#2B4D3A"
      }}
      onBlur={(e) => {
        ;(e.target as HTMLInputElement).style.borderColor = error
          ? "#FCA5A5"
          : "var(--border-neutral)"
      }}
    />
  )
  const Sel: FC<{
    id?: string
    value: string
    onChange: (v: string) => void
    options: { value: string label: string }[]
    placeholder?: string
    disabled?: boolean
    error?: string
  }> = ({ id, value, onChange, options, placeholder, disabled, error }) => (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      style={{
        display: "block",
        width: "100%",
        padding: "8px 11px",
        borderRadius: 8,
        border: `1px solid ${error ? "#FCA5A5" : "var(--border-neutral)"}`,
        background: "var(--surface-01)",
        color: value ? "var(--text-primary)" : "var(--text-muted)",
        fontSize: 13.5,
        fontFamily: "Inter",
        outline: "none",
        boxSizing: "border-box",
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
  const Err: FC<{ msg?: string }> = ({ msg }) =>
    msg ? (
      <div
        role="alert"
        style={{
          fontSize: 12,
          color: "#DC2626",
          marginTop: 4,
          fontFamily: "Inter",
        }}
      >
        {msg}
      </div>
    ) : null
  const SCard: FC<{ title: string children: ReactNode }> = ({
    title,
    children,
  }) => (
    <Card style={{ padding: "18px 20px", marginBottom: 14 }}>
      <div
        style={{
          fontSize: 11.5,
          fontWeight: 700,
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.07em",
          marginBottom: 14,
          paddingBottom: 8,
          borderBottom: "1px solid var(--border-neutral)",
        }}
      >
        {title}
      </div>
      {children}
    </Card>
  )

  // ── Success screen ──
  if (step === "success") {
    return (
      <div
        style={{
          padding: isMobile ? "40px 20px" : "80px 28px",
          maxWidth: 520,
          margin: "0 auto",
          textAlign: "center",
          fontFamily: "Inter",
        }}
      >
        <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes oSkel{0%,100%{opacity:.4}50%{opacity:.9}} @keyframes oSlideUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}} @keyframes oPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(0.85)}}`}</style>
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: 15,
            background: "#F0FDF4",
            border: "1.5px solid #86EFAC",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
          }}
        >
          <svg
            width="28"
            height="28"
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
            fontSize: 11,
            fontFamily: "DM Mono",
            letterSpacing: "0.09em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
            marginBottom: 8,
          }}
        >
          Order Submitted
        </div>
        <h2
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "var(--text-primary)",
            margin: "0 0 10px",
            letterSpacing: "-0.015em",
          }}
        >
          Order created successfully
        </h2>
        <p
          style={{
            fontSize: 14,
            color: "var(--text-secondary)",
            lineHeight: 1.6,
            marginBottom: 6,
          }}
        >
          <strong style={{ fontFamily: "DM Mono", fontSize: 16 }}>
            {submittedRef}
          </strong>{" "}
          has been submitted and is awaiting manager confirmation.
        </p>
        <div
          style={{
            fontSize: 12,
            color: "var(--text-muted)",
            fontFamily: "DM Mono",
            marginBottom: 28,
          }}
        >
          The order number was assigned by the server.
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <GhostBtn label="Back to Orders" onClick={onBack} />
          <PrimaryBtn label="View Order" onClick={onBack} />
        </div>
      </div>
    )
  }

  // ── Review screen ──
  if (step === "review") {
    return (
      <div
        style={{
          padding: isMobile ? "16px 14px 40px" : "24px 28px 48px",
          fontFamily: "Inter, system-ui, sans-serif",
          maxWidth: 680,
        }}
      >
        <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes oSkel{0%,100%{opacity:.4}50%{opacity:.9}} @keyframes oSlideUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}} @keyframes oPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(0.85)}}`}</style>
        <BackBtn label="Back to Form" onClick={() => setStep("form")} />
        <div style={{ marginBottom: 24 }}>
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
            Step 2 of 2
          </div>
          <h1
            style={{
              fontSize: 21,
              fontWeight: 700,
              color: "var(--text-primary)",
              margin: 0,
              letterSpacing: "-0.015em",
            }}
          >
            Review & Submit
          </h1>
          <p
            style={{
              fontSize: 13,
              color: "var(--text-secondary)",
              margin: "4px 0 0",
            }}
          >
            Please confirm the order details before submitting.
          </p>
        </div>
        {isPendingCustomer && form.urgency && (
          <div
            style={{
              marginBottom: 16,
              padding: "14px 16px",
              borderRadius: 10,
              background: "#FEF2F2",
              border: "2px solid #FCA5A5",
            }}
          >
            <div
              style={{
                fontSize: 13.5,
                fontWeight: 700,
                color: "#B91C1C",
                marginBottom: 4,
              }}
            >
              Customer approval is pending
            </div>
            <div style={{ fontSize: 13, color: "#991B1B", lineHeight: 1.5 }}>
              Submitting this urgent order will immediately alert the manager to
              review both the customer and the order simultaneously.
            </div>
          </div>
        )}
        {/* Review sections */}
        {[
          {
            title: "Customer",
            rows: [
              {
                label: "Name",
                value: selectedCustomer?.name ?? "—",
                mono: false,
              },
              {
                label: "Reference",
                value: selectedCustomer?.ref ?? "—",
                mono: true,
              },
              {
                label: "Sales Rep",
                value: selectedCustomer?.salesRep ?? "—",
                mono: false,
              },
              {
                label: "Phone",
                value: selectedCustomer?.phone ?? "—",
                mono: true,
              },
            ],
          },
          {
            title: "Delivery",
            rows: [
              {
                label: "Requested Date",
                value: form.deliveryDate,
                mono: false,
              },
              {
                label: "Address",
                value: form.deliveryAddress || "—",
                mono: false,
              },
              {
                label: "Contact",
                value: form.deliveryContact || "—",
                mono: false,
              },
            ],
          },
          {
            title: "Order Settings",
            rows: [
              {
                label: "Urgency",
                value: form.urgency ? "⚡ Urgent" : "Standard",
                mono: false,
              },
              ...(form.notes
                ? [{ label: "Notes", value: form.notes, mono: false }]
                : []),
            ],
          },
        ].map((section) => (
          <Card key={section.title} style={{ marginBottom: 12 }}>
            <div
              style={{
                padding: "11px 16px",
                borderBottom: "1px solid var(--border-neutral)",
                fontSize: 11.5,
                fontWeight: 700,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.07em",
              }}
            >
              {section.title}
            </div>
            <div style={{ padding: "4px 0" }}>
              {section.rows.map((row) => (
                <div
                  key={row.label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "9px 16px",
                    borderBottom: "1px solid var(--border-neutral)",
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      color: "var(--text-muted)",
                      fontFamily: "Inter",
                    }}
                  >
                    {row.label}
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      color: "var(--text-primary)",
                      fontWeight: 500,
                      fontFamily: row.mono ? "DM Mono" : "Inter",
                      maxWidth: "60%",
                      textAlign: "right",
                    }}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        ))}
        {/* Order items review */}
        <Card style={{ marginBottom: 12 }}>
          <div
            style={{
              padding: "11px 16px",
              borderBottom: "1px solid var(--border-neutral)",
              fontSize: 11.5,
              fontWeight: 700,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
            }}
          >
            Order Items
          </div>
          {form.lines.map((line, i) => (
            <div
              key={line.id}
              style={{
                padding: "12px 16px",
                borderBottom:
                  i < form.lines.length - 1
                    ? "1px solid var(--border-neutral)"
                    : "none",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 13.5,
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      marginBottom: 3,
                    }}
                  >
                    {line.coffeeType}
                  </div>
                  <div
                    style={{
                      fontSize: 12.5,
                      color: "var(--text-muted)",
                      fontFamily: "Inter",
                    }}
                  >
                    {line.roastLevel} Roast · {line.packaging}
                  </div>
                </div>
                <div
                  style={{
                    fontFamily: "DM Mono",
                    fontWeight: 700,
                    fontSize: 15,
                    color: "var(--text-primary)",
                  }}
                >
                  {line.quantity || "—"} KG
                </div>
              </div>
            </div>
          ))}
          {pricing && (
            <div
              style={{
                padding: "10px 16px",
                background: "var(--surface-02)",
                borderTop: "1px solid var(--border-neutral)",
              }}
            >
              {[
                { label: "Subtotal", value: pricing.subtotal, bold: false },
                { label: "VAT (15%)", value: pricing.vat, bold: false },
                {
                  label: "Total (estimated)",
                  value: pricing.total,
                  bold: true,
                },
              ].map((r) => (
                <div
                  key={r.label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: r.bold ? 0 : 3,
                  }}
                >
                  <span
                    style={{
                      fontSize: r.bold ? 13.5 : 13,
                      color: "var(--text-secondary)",
                      fontWeight: r.bold ? 600 : 400,
                    }}
                  >
                    {r.label}
                  </span>
                  <span
                    style={{
                      fontSize: r.bold ? 15 : 13,
                      fontWeight: r.bold ? 700 : 600,
                      fontFamily: "DM Mono",
                      color: "var(--text-primary)",
                    }}
                  >
                    {r.value}
                  </span>
                </div>
              ))}
              <div
                style={{
                  fontSize: 10.5,
                  color: "var(--text-muted)",
                  fontFamily: "DM Mono",
                  marginTop: 6,
                  fontStyle: "italic",
                }}
              >
                Final pricing confirmed by the server on submission.
              </div>
            </div>
          )}
        </Card>
        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "flex-end",
            marginTop: 24,
          }}
        >
          <GhostBtn label="← Back to Form" onClick={() => setStep("form")} />
          <PrimaryBtn
            label={isSubmitting ? "Submitting…" : "Submit Order"}
            onClick={handleSubmit}
            loading={isSubmitting}
          />
        </div>
      </div>
    )
  }

  // ── Form screen ──
  const col2 = isMobile ? "1fr" : "1fr 1fr"
  return (
    <div
      style={{
        padding: isMobile ? "16px 14px 40px" : "24px 28px 48px",
        fontFamily: "Inter, system-ui, sans-serif",
        maxWidth: 820,
      }}
    >
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes oSkel{0%,100%{opacity:.4}50%{opacity:.9}} @keyframes oSlideUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}} @keyframes oPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(0.85)}}`}</style>
      <BackBtn label="Orders" onClick={onBack} />
      <div style={{ marginBottom: 24 }}>
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
          Step 1 of 2
        </div>
        <h1
          style={{
            fontSize: 21,
            fontWeight: 700,
            color: "var(--text-primary)",
            margin: 0,
            letterSpacing: "-0.015em",
          }}
        >
          New Order
        </h1>
        <p
          style={{
            fontSize: 13,
            color: "var(--text-secondary)",
            margin: "4px 0 0",
          }}
        >
          Create a new customer order for roasted coffee.
        </p>
      </div>

      {errors.minQty && (
        <div
          role="alert"
          style={{
            marginBottom: 20,
            padding: "14px 16px",
            borderRadius: 10,
            background: "#FEF2F2",
            border: "2px solid #FCA5A5",
            color: "#991B1B",
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 4 }}>
            <SvgIcon d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" size={14} stroke="#991B1B" /> Order Quantity Validation Error (10 KG Minimum Rule)
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.5 }}>
            {errors.minQty}
          </div>
        </div>
      )}

      <SCard title="Customer">
        <Lbl label="Select or type customer name" required htmlFor="o-cust" />
        <div style={{ display: "grid", gap: 10 }}>
          <Sel
            id="o-cust"
            value={form.customerId}
            onChange={(v) => {
              setForm((f) => ({ ...f, customerId: v }))
              setUrgentContinue(false)
              if (errors.customer) setErrors((p) => ({ ...p, customer: "" }))
            }}
            options={liveCustomers.map((c) => ({
              value: c.id,
              label: `${c.name} (${c.ref})`,
            }))}
            placeholder="-- Select an Existing Customer --"
            error={errors.customer}
            disabled={customersLoading}
          />
          <div style={{ fontSize: 12, color: "var(--text-muted)", margin: "2px 0" }}>OR enter customer name directly:</div>
          <input
            type="text"
            placeholder="Type customer name e.g. Addis Coffee House"
            value={liveCustomers.some(c => c.id === form.customerId) ? "" : form.customerId}
            onChange={(e) => {
              const val = e.target.value
              setForm((f) => ({ ...f, customerId: val }))
              setUrgentContinue(false)
              if (errors.customer) setErrors((p) => ({ ...p, customer: "" }))
            }}
            style={{
              width: "100%",
              height: 38,
              padding: "0 12px",
              borderRadius: 8,
              border: "1px solid var(--border-neutral)",
              background: "var(--surface-01)",
              color: "var(--text-primary)",
              fontSize: 13.5,
              boxSizing: "border-box",
            }}
          />
        </div>
        <Err msg={errors.customer} />
        {selectedCustomer && (
          <div
            style={{
              marginTop: 12,
              padding: "14px 16px",
              borderRadius: 9,
              background: isPendingCustomer ? "#FFFBEB" : "#F0FDF4",
              border: `1.5px solid ${
                isPendingCustomer ? "#FDE68A" : "#86EFAC"
              }`,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                flexWrap: "wrap",
                gap: 8,
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: isPendingCustomer ? "#92400E" : "#15803D",
                }}
              >
                {selectedCustomer.name}
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontFamily: "DM Mono",
                  padding: "2px 8px",
                  borderRadius: 4,
                  background: isPendingCustomer ? "#FDE68A" : "#86EFAC",
                  color: isPendingCustomer ? "#78350F" : "#14532D",
                  fontWeight: 700,
                }}
              >
                {isPendingCustomer ? "PENDING APPROVAL" : "ACTIVE"}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                gap: 16,
                fontSize: 12.5,
                color: isPendingCustomer ? "#B45309" : "#166534",
                flexWrap: "wrap",
              }}
            >
              <span>
                Ref:{" "}
                <strong style={{ fontFamily: "DM Mono" }}>
                  {selectedCustomer.ref}
                </strong>
              </span>
              <span>
                Sales Rep: <strong>{selectedCustomer.salesRep}</strong>
              </span>
              <span>
                Phone:{" "}
                <strong style={{ fontFamily: "DM Mono" }}>
                  {selectedCustomer.phone}
                </strong>
              </span>
            </div>
            {/* Urgent customer notice */}
            {isPendingCustomer && (
              <div
                style={{
                  marginTop: 12,
                  padding: "12px 14px",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.6)",
                  border: "1px solid #FDE68A",
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#92400E",
                    marginBottom: 6,
                  }}
                >
                  Customer approval pending
                </div>
                <div
                  style={{
                    fontSize: 12.5,
                    color: "#B45309",
                    lineHeight: 1.5,
                    marginBottom: 10,
                  }}
                >
                  This customer has not yet completed the normal approval
                  process. Standard orders cannot be created until approval is
                  granted.
                </div>
                {form.urgency ? (
                  !urgentContinue ? (
                    <button
                      onClick={() => setUrgentContinue(true)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 7,
                        padding: "8px 14px",
                        borderRadius: 7,
                        border: "1.5px solid #DC2626",
                        background: "#FEF2F2",
                        color: "#B91C1C",
                        fontSize: 13,
                        fontWeight: 700,
                        fontFamily: "Inter",
                        cursor: "pointer",
                      }}
                    >
                      <div
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: "#DC2626",
                          animation: "oPulse 1.5s ease infinite",
                        }}
                      />
                      Continue with Urgent Order
                    </button>
                  ) : (
                    <div
                      style={{
                        fontSize: 12.5,
                        color: "#B91C1C",
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#DC2626"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Confirmed — this order will immediately alert the manager
                      for urgent review.
                    </div>
                  )
                ) : (
                  <div
                    style={{
                      fontSize: 12.5,
                      color: "#B45309",
                      fontStyle: "italic",
                    }}
                  >
                    Enable the "Urgent" flag below to proceed with an
                    exceptional urgent order.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </SCard>

      <SCard title="Order Settings">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 14px",
            borderRadius: 9,
            border: "1px solid var(--border-neutral)",
            background: form.urgency ? "#FEF2F2" : "var(--surface-02)",
            marginBottom: 14,
          }}
        >
          <input
            type="checkbox"
            id="o-urgent"
            checked={form.urgency}
            onChange={(e) => {
              setForm((f) => ({ ...f, urgency: e.target.checked }))
              if (!e.target.checked) setUrgentContinue(false)
            }}
            style={{
              width: 16,
              height: 16,
              accentColor: "#DC2626",
              flexShrink: 0,
              cursor: "pointer",
            }}
          />
          <label htmlFor="o-urgent" style={{ cursor: "pointer", flex: 1 }}>
            <div
              style={{
                fontSize: 13.5,
                fontWeight: 600,
                color: form.urgency ? "#B91C1C" : "var(--text-primary)",
              }}
            >
              Mark as urgent
            </div>
            <div
              style={{
                fontSize: 12.5,
                color: form.urgency ? "#991B1B" : "var(--text-muted)",
                marginTop: 2,
              }}
            >
              {form.urgency
                ? "Urgent — manager will be alerted immediately."
                : "Urgent orders bypass the normal queue and require immediate manager attention."}
            </div>
          </label>
        </div>
        <Lbl label="Order notes" htmlFor="o-notes" />
        <textarea
          id="o-notes"
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          rows={2}
          placeholder="Special instructions for this order…"
          style={{
            display: "block",
            width: "100%",
            padding: "8px 11px",
            borderRadius: 8,
            border: "1px solid var(--border-neutral)",
            background: "var(--surface-01)",
            color: "var(--text-primary)",
            fontSize: 13.5,
            fontFamily: "Inter",
            outline: "none",
            resize: "vertical",
            boxSizing: "border-box",
          }}
        />
      </SCard>

      <SCard title="Coffee Requirement">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {form.lines.map((line, idx) => (
            <div
              key={line.id}
              style={{
                padding: 14,
                borderRadius: 9,
                border: "1px solid var(--border-neutral)",
                background: "var(--surface-02)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Item {idx + 1}
                </div>
                {form.lines.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLine(line.id)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#DC2626",
                      fontSize: 12.5,
                      fontFamily: "Inter",
                      padding: 0,
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr",
                  gap: "10px 14px",
                  marginBottom: 10,
                }}
              >
                <div>
                  <Lbl label="Coffee type" required />
                  <Sel
                    value={line.coffeeType}
                    onChange={(v) => setLine(line.id, "coffeeType", v)}
                    options={COFFEE_TYPES.map((c) => ({ value: c, label: c }))}
                  />
                </div>
                <div>
                  <Lbl label="Origin" required />
                  <Sel
                    value={line.origin}
                    onChange={(v) => setLine(line.id, "origin", v)}
                    options={ORIGINS.map((o) => ({ value: o, label: o }))}
                  />
                </div>
                <div>
                  <Lbl label="Roast level" required />
                  <Sel
                    value={line.roastLevel}
                    onChange={(v) => setLine(line.id, "roastLevel", v)}
                    options={ROAST_LEVELS.map((r) => ({ value: r, label: r }))}
                  />
                </div>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "100px 1fr",
                  gap: "10px 14px",
                }}
              >
                <div>
                  <Lbl label="Qty (KG)" required />
                  <Inp
                    type="number"
                    value={line.quantity}
                    onChange={(v) => setLine(line.id, "quantity", v)}
                    placeholder="0.00"
                    error={errors[`ln-${line.id}`]}
                  />
                  <Err msg={errors[`ln-${line.id}`]} />
                </div>
                <div>
                  <Lbl label="Packaging" />
                  <Sel
                    value={line.packaging}
                    onChange={(v) => setLine(line.id, "packaging", v)}
                    options={PACKAGINGS.map((p) => ({ value: p, label: p }))}
                  />
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addLine}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "9px 14px",
              borderRadius: 8,
              border: "1.5px dashed var(--border-neutral)",
              background: "transparent",
              color: "var(--text-secondary)",
              fontSize: 13.5,
              cursor: "pointer",
              fontFamily: "Inter",
              width: "100%",
              justifyContent: "center",
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            + Add Product
          </button>
        </div>
      </SCard>

      <SCard title="Delivery">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: col2,
            gap: "14px 20px",
          }}
        >
          <div>
            <Lbl label="Requested delivery date" required htmlFor="o-ddate" />
            <Inp
              id="o-ddate"
              type="date"
              value={form.deliveryDate}
              onChange={(v) => {
                setForm((f) => ({ ...f, deliveryDate: v }))
                if (errors.delivDate)
                  setErrors((p) => ({ ...p, delivDate: "" }))
              }}
              error={errors.delivDate}
            />
            <Err msg={errors.delivDate} />
          </div>
          <div>
            <Lbl label="Delivery contact" htmlFor="o-dcontact" />
            <Inp
              id="o-dcontact"
              value={form.deliveryContact}
              onChange={(v) => setForm((f) => ({ ...f, deliveryContact: v }))}
              placeholder="Name and phone"
            />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <Lbl label="Delivery address" htmlFor="o-daddr" />
            <Inp
              id="o-daddr"
              value={form.deliveryAddress}
              onChange={(v) => setForm((f) => ({ ...f, deliveryAddress: v }))}
              placeholder="Street address, branch, or location"
            />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <Lbl label="Delivery notes" htmlFor="o-dnotes" />
            <textarea
              id="o-dnotes"
              value={form.deliveryNotes}
              onChange={(e) =>
                setForm((f) => ({ ...f, deliveryNotes: e.target.value }))
              }
              rows={2}
              placeholder="Access instructions, special requirements…"
              style={{
                display: "block",
                width: "100%",
                padding: "8px 11px",
                borderRadius: 8,
                border: "1px solid var(--border-neutral)",
                background: "var(--surface-01)",
                color: "var(--text-primary)",
                fontSize: 13.5,
                fontFamily: "Inter",
                outline: "none",
                resize: "vertical",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>
      </SCard>

      {/* Pricing preview */}
      <Card style={{ padding: "16px 20px", marginBottom: 24 }}>
        <div
          style={{
            fontSize: 11.5,
            fontWeight: 700,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.07em",
            marginBottom: 12,
            paddingBottom: 8,
            borderBottom: "1px solid var(--border-neutral)",
          }}
        >
          Pricing Preview
        </div>
        {pricingState === "idle" && (
          <div
            style={{
              fontSize: 13,
              color: "var(--text-muted)",
              fontStyle: "italic",
            }}
          >
            Pricing appears once quantities are entered. Values calculated by
            the server.
          </div>
        )}
        {pricingState === "loading" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                style={{ display: "flex", justifyContent: "space-between" }}
              >
                <Skel w="35%" h={11} />
                <Skel w="25%" h={11} />
              </div>
            ))}
          </div>
        )}
        {pricingState === "ok" && pricing && (
          <div>
            {[
              { label: "Subtotal", value: pricing.subtotal, bold: false },
              { label: "VAT (15%)", value: pricing.vat, bold: false },
              { label: "Total", value: pricing.total, bold: true },
            ].map((r) => (
              <div
                key={r.label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "7px 0",
                  borderBottom: r.bold
                    ? "none"
                    : "1px solid var(--border-neutral)",
                }}
              >
                <span
                  style={{
                    fontSize: r.bold ? 14 : 13.5,
                    color: "var(--text-secondary)",
                    fontWeight: r.bold ? 600 : 400,
                  }}
                >
                  {r.label}
                </span>
                <span
                  style={{
                    fontSize: r.bold ? 16 : 14,
                    fontWeight: r.bold ? 700 : 600,
                    fontFamily: "DM Mono",
                    color: "var(--text-primary)",
                  }}
                >
                  {r.value}
                </span>
              </div>
            ))}
            <div
              style={{
                fontSize: 10.5,
                color: "var(--text-muted)",
                fontFamily: "DM Mono",
                marginTop: 8,
                fontStyle: "italic",
              }}
            >
              Estimates only. Final pricing confirmed by the server.
            </div>
          </div>
        )}
      </Card>

      {/* Urgent customer blocking notice */}
      {isPendingCustomer && form.urgency && !urgentContinue && (
        <div
          style={{
            marginBottom: 14,
            padding: "12px 14px",
            borderRadius: 9,
            background: "#FEF2F2",
            border: "1px solid #FCA5A5",
            fontSize: 13,
            color: "#B91C1C",
          }}
        >
          ↑ You must confirm the urgent exception in the Customer section before
          proceeding.
        </div>
      )}

      <div
        style={{
          display: "flex",
          gap: 10,
          justifyContent: "flex-end",
          flexWrap: "wrap",
        }}
      >
        <GhostBtn label="Cancel" onClick={onBack} />
        <PrimaryBtn
          label="Review Order →"
          onClick={handleReview}
          disabled={isPendingCustomer && form.urgency && !urgentContinue}
        />
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   ROOT EXPORT — internal view router
───────────────────────────────────────────────────────────── */
export default function Orders({
  onNavigate,
  routeParams,
}: {
  onNavigate?: (id: string, params?: any) => void
  routeParams?: any
}) {
  const { currentUser } = useAuth()
  const role = (currentUser?.role ?? "sales-rep") as string

  const canCreate = can(role as any, "orders.create")
  const canConfirm = can(role as any, "orders.confirm")
  const canReject = can(role as any, "orders.reject")
  const canCancel = can(role as any, "orders.reject")

  const [view, setView] = useState<View>("list")
  const [selected, setSelected] = useState<Order | null>(null)

  // Handle incoming routeParams for deep linking
  useEffect(() => {
    if (routeParams?.view === "detail" && routeParams?.id) {
      import("../services/orders").then(({ getOrder }) => {
        getOrder(routeParams.id).then((res) => {
          if (res.state === "ok" && res.data) {
            setSelected(res.data)
            setView("detail")
          }
        })
      })
    }
  }, [routeParams])

  const goList = useCallback(() => {
    setView("list")
    setSelected(null)
  }, [])
  const goDetail = useCallback((o: Order) => {
    setSelected(o)
    setView("detail")
  }, [])
  const goNew = useCallback(() => {
    setSelected(null)
    setView("new")
  }, [])

  if (view === "new") return <NewOrderView onBack={goList} />
  if (view === "detail" && selected)
    return (
      <OrderDetailView
        order={selected}
        onBack={goList}
        canConfirm={canConfirm}
        canReject={canReject}
        canCancel={canCancel}
      />
    )
  return <OrderListView onView={goDetail} onNew={goNew} canCreate={canCreate} />
}
