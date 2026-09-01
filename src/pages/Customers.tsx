/* Customer Management — P2E
   Internal view routing: list → detail → new/edit
   All business logic, authorization, and calculations are backend (PHP) authoritative.
   Frontend only renders what the server returns.
*/
import {
  useState,
  useCallback,
  useEffect,
  type FC,
  type ReactNode,
  type FormEvent,
} from "react"
import { useBreakpoint } from "../hooks/useBreakpoint"
import { useAuth } from "../contexts/AuthContext"
import { useToast } from "../contexts/ToastContext"
import { canRead } from "../lib/rbac"
import { can } from "../lib/can"
import { CustomerFormModal } from "../components/CustomerFormModal"
import { listCustomers } from "../services/customers"
import useSupabaseRealtime from "../hooks/useSupabaseRealtime"

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────── */
type CustomerStatus = "pending" | "active" | "rejected" | "inactive"
type CustomerType = "hotel" | "restaurant" | "cafe" | "airline" | "corporate" | "other"
type View = "list" | "detail" | "new" | "edit"
type LoadState = "loading" | "ok" | "error"

interface SalesRep {
  id: string
  name: string
}

interface Customer {
  id: string
  ref: string
  name: string
  type: CustomerType
  status: CustomerStatus
  phone: string
  email?: string
  contactPerson: string
  address?: string
  location: string
  branch?: string
  salesRep: SalesRep | null
  outstandingBalance: string
  lastOrderDate?: string
  createdAt: string
  totalOrders?: number
  activeOrders?: number
  completedOrders?: number
  totalPaid?: string
  totalOverdue?: string
  notes?: string
  rejectionReason?: string
  urgentFlag?: boolean
}

interface ActivityEvent {
  id: number
  event: string
  actor?: string
  time: string
  record?: string
  type: "created" | "approved" | "rejected" | "order" | "payment" | "updated" | "submitted"
}

interface FormData {
  name: string
  type: CustomerType
  contactPerson: string
  phone: string
  email: string
  address: string
  location: string
  branch: string
  salesRepId: string
  notes: string
}

interface FormErrors {
  [k: string]: string
}

/* ─────────────────────────────────────────────────────────────
   SAMPLE DATA — illustrative only; production data from PHP API
───────────────────────────────────────────────────────────── */
const SALES_REPS: SalesRep[] = [
  { id: "sr1", name: "Hiwot Tadesse" },
  { id: "sr2", name: "Bereket Assefa" },
  { id: "sr3", name: "Fikremariam Alemu" },
]

const SAMPLE_CUSTOMERS: Customer[] = []

const SAMPLE_ACTIVITY: ActivityEvent[] = []

const FULL_ACTIVITY: Record<string, ActivityEvent[]> = {}

/* ─────────────────────────────────────────────────────────────
   STATUS CONFIG
───────────────────────────────────────────────────────────── */
const STATUS_CFG: Record<CustomerStatus, {
  label: string
  color: string
  bg: string
  border: string
  iconPath: string
  notice: string
}> = {
  pending: {
    label: "Pending Approval",
    color: "#B45309",
    bg: "#FFFBEB",
    border: "#FDE68A",
    iconPath:
      "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 8v4M12 16h.01",
    notice: "Customer registration is waiting for manager approval.",
  },
  active: {
    label: "Active",
    color: "#15803D",
    bg: "#F0FDF4",
    border: "#86EFAC",
    iconPath: "M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3",
    notice:
      "Customer is approved and available for normal business operations.",
  },
  rejected: {
    label: "Rejected",
    color: "#B91C1C",
    bg: "#FEF2F2",
    border: "#FCA5A5",
    iconPath:
      "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01",
    notice: "This customer registration was rejected.",
  },
  inactive: {
    label: "Inactive",
    color: "#6B7280",
    bg: "#F9FAFB",
    border: "#E5E7EB",
    iconPath:
      "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636",
    notice: "This customer account is currently inactive.",
  },
}

const TYPE_LABELS: Record<CustomerType, string> = {
  hotel: "Hotel",
  restaurant: "Restaurant",
  cafe: "Cafe",
  airline: "Airline",
  corporate: "Corporate",
  other: "Other",
}

/* ─────────────────────────────────────────────────────────────
   MOCK ORDER HISTORY — illustrative only; production data from PHP API
───────────────────────────────────────────────────────────── */
interface CustomerOrder {
  id: string
  ref: string
  date: string
  items: string
  qty: string
  status: string
  paymentStatus: string
  total: string
}

const CUSTOMER_ORDERS: Record<string, CustomerOrder[]> = {}

/* Payment‑status badge color helper */
function payStatusStyle(ps: string): { color: string bg: string } {
  if (ps === "Paid") return { color: "#15803D", bg: "#F0FDF4" }
  if (ps === "Overdue") return { color: "#B91C1C", bg: "#FEF2F2" }
  return { color: "#B45309", bg: "#FFFBEB" }
}

const ACTIVITY_ICON: Record<ActivityEvent["type"], {
  path: string
  color: string
}> = {
  created: { path: "M12 5v14M5 12h14", color: "#6B7280" },
  submitted: {
    path: "M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11",
    color: "#D97706",
  },
  approved: {
    path: "M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3",
    color: "#16A34A",
  },
  rejected: {
    path: "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z",
    color: "#DC2626",
  },
  order: {
    path: "M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18",
    color: "#2563EB",
  },
  payment: {
    path: "M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6",
    color: "#16A34A",
  },
  updated: {
    path: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
    color: "#7C3AED",
  },
}

/* ─────────────────────────────────────────────────────────────
   PRIMITIVE COMPONENTS
───────────────────────────────────────────────────────────── */
const SvgIcon: FC<{
  d: string
  size?: number
  stroke?: string
  strokeW?: number
}> = ({ d, size = 14, stroke = "currentColor", strokeW = 1.75 }) => (
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
      animation: "cSkel 1.4s ease infinite",
    }}
  />
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

const StatusBadge: FC<{ status: CustomerStatus }> = ({ status }) => {
  const cfg = STATUS_CFG[status]
  return (
    <div
      role="status"
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
      <SvgIcon d={cfg.iconPath} size={11} stroke={cfg.color} strokeW={2} />
      <span
        style={{
          fontSize: 11.5,
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

const FieldLabel: FC<{ label: string required?: boolean htmlFor?: string }> = ({
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
    {required && (
      <span style={{ color: "#DC2626", marginLeft: 3 }} aria-hidden="true">
        *
      </span>
    )}
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

const InputField: FC<{
  id?: string
  type?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  error?: string
  disabled?: boolean
  readOnly?: boolean
}> = ({
  id,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  disabled,
  readOnly,
}) => (
  <input
    id={id}
    type={type}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    disabled={disabled}
    readOnly={readOnly}
    aria-invalid={error ? "true" : undefined}
    aria-describedby={error && id ? `${id}-err` : undefined}
    style={{
      display: "block",
      width: "100%",
      padding: "8px 11px",
      borderRadius: 8,
      border: `1px solid ${error ? "#FCA5A5" : "var(--border-neutral)"}`,
      background:
        readOnly || disabled ? "var(--surface-02)" : "var(--surface-01)",
      color: "var(--text-primary)",
      fontSize: 13.5,
      fontFamily: "Inter",
      outline: "none",
      boxSizing: "border-box",
      opacity: disabled ? 0.6 : 1,
      cursor: disabled ? "not-allowed" : readOnly ? "default" : "text",
      transition: "border-color 0.15s",
    }}
    onFocus={(e) => {
      if (!error && !disabled && !readOnly)
        (e.target as HTMLInputElement).style.borderColor = "#2B4D3A"
    }}
    onBlur={(e) => {
      ;(e.target as HTMLInputElement).style.borderColor = error
        ? "#FCA5A5"
        : "var(--border-neutral)"
    }}
  />
)

const SelectField: FC<{
  id?: string
  value: string
  onChange: (v: string) => void
  options: { value: string label: string }[]
  placeholder?: string
  error?: string
  disabled?: boolean
}> = ({ id, value, onChange, options, placeholder, disabled }) => (
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
      border: "var(--border-neutral) 1px solid",
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

const FieldError: FC<{ id?: string message?: string }> = ({ id, message }) =>
  message ? (
    <div
      id={id}
      role="alert"
      style={{
        fontSize: 12,
        color: "#DC2626",
        marginTop: 4,
        fontFamily: "Inter",
        display: "flex",
        alignItems: "center",
        gap: 4,
      }}
    >
      <SvgIcon
        d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"
        size={11}
        stroke="#DC2626"
      />
      {message}
    </div>
  ) : null

const TextareaField: FC<{
  id?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
  disabled?: boolean
}> = ({ id, value, onChange, placeholder, rows = 3, disabled }) => (
  <textarea
    id={id}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    rows={rows}
    disabled={disabled}
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
      lineHeight: 1.5,
    }}
    onFocus={(e) => {
      ;(e.target as HTMLTextAreaElement).style.borderColor = "#2B4D3A"
    }}
    onBlur={(e) => {
      ;(e.target as HTMLTextAreaElement).style.borderColor =
        "var(--border-neutral)"
    }}
  />
)

const PrimaryBtn: FC<{
  label: string
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  danger?: boolean
  type?: "button" | "submit"
}> = ({ label, onClick, disabled, loading, danger, type = "button" }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled || loading}
    style={{
      padding: "8px 18px",
      borderRadius: 8,
      border: "none",
      background: danger
        ? "#B91C1C"
        : disabled || loading
          ? "var(--surface-hover)"
          : "#2B4D3A",
      color: disabled || loading ? "var(--text-muted)" : "#FFFFFF",
      fontSize: 13.5,
      fontWeight: 600,
      fontFamily: "Inter",
      cursor: disabled || loading ? "not-allowed" : "pointer",
      display: "flex",
      alignItems: "center",
      gap: 7,
      transition: "opacity 0.15s",
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
        aria-hidden="true"
      >
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      </svg>
    )}
    {label}
  </button>
)

const GhostBtn: FC<{ label: string onClick?: () => void disabled?: boolean }> =
  ({ label, onClick, disabled }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "8px 16px",
        borderRadius: 8,
        border: "1px solid var(--border-neutral)",
        background: "transparent",
        color: "var(--text-secondary)",
        fontSize: 13.5,
        fontWeight: 500,
        fontFamily: "Inter",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {label}
    </button>
  )

/* ─────────────────────────────────────────────────────────────
   MODAL / DIALOG
───────────────────────────────────────────────────────────── */
const Modal: FC<{
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  width?: number
}> = ({ open, onClose, title, children, width = 420 }) => {
  if (!open) return null
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
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
          padding: "24px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
          animation: "cSlideUp 0.2s ease",
        }}
      >
        <h2
          id="modal-title"
          style={{
            fontSize: 15.5,
            fontWeight: 700,
            color: "var(--text-primary)",
            margin: "0 0 16px",
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
   PAGINATION
───────────────────────────────────────────────────────────── */
const Pagination: FC<{
  page: number
  total: number
  perPage: number
  onChange: (p: number) => void
}> = ({ page, total, perPage, onChange }) => {
  const totalPages = Math.ceil(total / perPage)
  if (totalPages <= 1) return null
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
    if (totalPages <= 5) return i + 1
    if (page <= 3) return i + 1
    if (page >= totalPages - 2) return totalPages - 4 + i
    return page - 2 + i
  })
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
        Showing {Math.min((page - 1) * perPage + 1, total)}&ndash;
        {Math.min(page * perPage, total)} of {total}
      </span>
      <nav aria-label="Pagination">
        <div style={{ display: "flex", gap: 4 }}>
          <button
            onClick={() => onChange(page - 1)}
            disabled={page === 1}
            aria-label="Previous page"
            style={{
              width: 30,
              height: 30,
              borderRadius: 6,
              border: "1px solid var(--border-neutral)",
              background: "transparent",
              cursor: page === 1 ? "not-allowed" : "pointer",
              opacity: page === 1 ? 0.4 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-secondary)",
            }}
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
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          {pages.map((p) => (
            <button
              key={p}
              onClick={() => onChange(p)}
              aria-label={`Page ${p}`}
              aria-current={p === page ? "page" : undefined}
              style={{
                width: 30,
                height: 30,
                borderRadius: 6,
                border: `1px solid ${
                  p === page ? "#2B4D3A" : "var(--border-neutral)"
                }`,
                background: p === page ? "#2B4D3A" : "transparent",
                color: p === page ? "#FFFFFF" : "var(--text-secondary)",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: p === page ? 600 : 400,
                fontFamily: "Inter",
              }}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => onChange(page + 1)}
            disabled={page === totalPages}
            aria-label="Next page"
            style={{
              width: 30,
              height: 30,
              borderRadius: 6,
              border: "1px solid var(--border-neutral)",
              background: "transparent",
              cursor: page === totalPages ? "not-allowed" : "pointer",
              opacity: page === totalPages ? 0.4 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-secondary)",
            }}
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
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </nav>
    </div>
  )
}

const CustomerFilterChips: FC<{
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
        flexWrap: "wrap",
        gap: 6,
        marginBottom: 12,
        alignItems: "center",
      }}
    >
      <span
        style={{
          fontSize: 11.5,
          color: "var(--text-muted)",
          fontFamily: "Inter",
          marginRight: 2,
        }}
      >
        Active filters:
      </span>
      {active.map(([key, value]) => (
        <span
          key={key}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "3px 8px 3px 10px",
            borderRadius: 20,
            background: "#F0FDF4",
            border: "1px solid #86EFAC",
            fontSize: 12,
            color: "#15803D",
            fontFamily: "Inter",
            fontWeight: 500,
          }}
        >
          {labels[key]?.[value] ?? value}
          <button
            onClick={() => onRemove(key)}
            aria-label={`Remove ${key} filter`}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 14,
              height: 14,
              borderRadius: "50%",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "#15803D",
              padding: 0,
              lineHeight: 1,
            }}
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </span>
      ))}
      <button
        onClick={onClearAll}
        style={{
          fontSize: 12,
          color: "var(--text-muted)",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          fontFamily: "Inter",
          padding: "2px 4px",
          textDecoration: "underline",
        }}
      >
        Clear all
      </button>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   CUSTOMER LIST VIEW
───────────────────────────────────────────────────────────── */
const CustomerListView: FC<{
  onView: (c: Customer) => void
  onNew: () => void
  canCreate: boolean
  role: string
  refreshCount?: number
}> = ({ onView, onNew, canCreate, role, refreshCount = 0 }) => {
  const { isMobile } = useBreakpoint()
  const [loadState, setLoadState] = useState<LoadState>("loading")
  const [customers, setCustomers] = useState<Customer[]>([])
  const [search, setSearch] = useState("")
  const [filterOpen, setFilterOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({
    status: "",
    salesRep: "",
    location: "",
  })
  const isSalesRep = role === "sales-rep"
  const PER_PAGE = 10

  const fetchCustomers = useCallback(async () => {
    setLoadState("loading")
    const res = await listCustomers({
      status: filters.status as any,
      salesRepId: filters.salesRep,
      search: search,
    })
    if (res.state === "ok" && res.data) {
      setCustomers(res.data.items as Customer[])
      setLoadState("ok")
    } else {
      setLoadState("error")
    }
  }, [filters, search, refreshCount])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  // Subscribe to realtime changes to the `customers` table and refetch when things change
  useSupabaseRealtime("customers", () => {
    void fetchCustomers()
  })

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase()
    const matchSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.ref.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.contactPerson.toLowerCase().includes(q) ||
      (c.email ?? "").toLowerCase().includes(q) ||
      c.location.toLowerCase().includes(q)
    const matchStatus = !filters.status || c.status === filters.status
    const matchRep = !filters.salesRep || c.salesRep?.id === filters.salesRep
    const matchLoc =
      !filters.location ||
      c.location.toLowerCase().includes(filters.location.toLowerCase())
    return matchSearch && matchStatus && matchRep && matchLoc
  })

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const hasFilters =
    !!filters.status || !!filters.salesRep || !!filters.location
  const clearFilters = () => {
    setFilters({ status: "", salesRep: "", location: "" })
    setSearch("")
    setPage(1)
  }

  const filterLabels: Record<string, Record<string, string>> = {
    status: {
      pending: "Pending Approval",
      active: "Active",
      rejected: "Rejected",
      inactive: "Inactive",
    },
    salesRep: Object.fromEntries(SALES_REPS.map((r) => [r.id, r.name])),
    location: {
      "Addis Ababa": "Addis Ababa",
      Adama: "Adama",
      Hawassa: "Hawassa",
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
        @keyframes cSkel { 0%,100%{opacity:.4} 50%{opacity:.9} }
        @keyframes cSlideUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        .c-row:hover { background: var(--surface-02) !important; }
        .c-ghost:hover { background: var(--surface-hover) !important; border-color: #2B4D3A !important; color: #2B4D3A !important; }
      `}</style>

      {/* Page header */}
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
            {isSalesRep ? "My Customers" : "Sales"}
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
            Customers
          </h1>
          <p
            style={{
              fontSize: 13,
              color: "var(--text-secondary)",
              margin: "4px 0 0",
            }}
          >
            {isSalesRep
              ? "Your assigned customers and their coffee orders."
              : "Manage customers and their coffee orders."}
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
            Add Customer
          </button>
        )}
      </div>

      {/* RBAC notice for sales rep */}
      {isSalesRep && (
        <div
          style={{
            marginBottom: 16,
            padding: "10px 14px",
            borderRadius: 8,
            background: "#EFF6FF",
            border: "1px solid #BFDBFE",
            display: "flex",
            gap: 8,
            alignItems: "flex-start",
          }}
        >
          <SvgIcon
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            size={14}
            stroke="#2563EB"
          />
          <span style={{ fontSize: 12.5, color: "#1D4ED8", lineHeight: 1.5 }}>
            Showing your assigned customers only. Record-level access is
            enforced by the server.
          </span>
        </div>
      )}

      {/* Search + Filter bar */}
      <div
        style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}
      >
        <div style={{ position: "relative", flex: "1 1 240px", minWidth: 0 }}>
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
            placeholder="Search by name, phone, email, or reference..."
            aria-label="Search customers"
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
          }}
        >
          <SvgIcon
            d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"
            size={13}
            stroke="currentColor"
          />
          Filters
          {hasFilters
            ? ` (${Object.values(filters).filter(Boolean).length})`
            : ""}
        </button>
        {hasFilters && (
          <button
            onClick={clearFilters}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid var(--border-neutral)",
              background: "transparent",
              color: "var(--text-muted)",
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "Inter",
            }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Filter panel */}
      {filterOpen && (
        <div
          style={{
            marginBottom: 14,
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
              label: "Status",
              key: "status",
              options: [
                { value: "pending", label: "Pending Approval" },
                { value: "active", label: "Active" },
                { value: "rejected", label: "Rejected" },
                { value: "inactive", label: "Inactive" },
              ],
            },
            ...(!isSalesRep
              ? [
                  {
                    label: "Sales Representative",
                    key: "salesRep",
                    options: SALES_REPS.map((r) => ({
                      value: r.id,
                      label: r.name,
                    })),
                  },
                ]
              : []),
            {
              label: "Location",
              key: "location",
              options: [
                { value: "Addis Ababa", label: "Addis Ababa" },
                { value: "Adama", label: "Adama" },
                { value: "Hawassa", label: "Hawassa" },
              ],
            },
          ].map((f) => (
            <div key={f.key} style={{ flex: "1 1 160px" }}>
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
                value={(filters as Record<string, string>)[f.key]}
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
                <option value="">All</option>
                {f.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
          <div style={{ display: "flex", gap: 8 }}>
            <GhostBtn label="Clear Filters" onClick={clearFilters} />
          </div>
        </div>
      )}

      {/* Active filter chips */}
      <CustomerFilterChips
        filters={filters}
        labels={filterLabels}
        onRemove={(key) => {
          setFilters((p) => ({ ...p, [key]: "" }))
          setPage(1)
        }}
        onClearAll={clearFilters}
      />

      {/* Loading */}
      {loadState === "loading" && (
        <Card>
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              style={{
                padding: "14px 18px",
                borderBottom:
                  i < 4 ? "1px solid var(--border-neutral)" : "none",
                display: "flex",
                gap: 14,
                alignItems: "center",
              }}
            >
              <Skel w="28px" h={28} radius={7} />
              <Skel w="22%" h={11} />
              <Skel w="18%" h={11} />
              <Skel w="14%" h={11} />
              <Skel w="14%" h={20} radius={10} />
              <Skel w="13%" h={11} />
            </div>
          ))}
        </Card>
      )}

      {/* Error */}
      {loadState === "error" && (
        <Card style={{ padding: "40px", textAlign: "center" }}>
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
            Unable to load customers
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
            onClick={fetchCustomers}
          />
        </Card>
      )}

      {loadState === "ok" && (
        <>
          {/* Empty state */}
          {customers.length === 0 && (
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
                  d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
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
                No customers yet
              </div>
              <div
                style={{
                  fontSize: 13.5,
                  color: "var(--text-muted)",
                  marginBottom: canCreate ? 20 : 0,
                }}
              >
                Customers will appear here once they are added.
              </div>
              {canCreate && <PrimaryBtn label="Add Customer" onClick={onNew} />}
            </Card>
          )}

          {/* No search results */}
          {customers.length > 0 && filtered.length === 0 && (
            <Card style={{ padding: "40px 32px", textAlign: "center" }}>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  marginBottom: 5,
                }}
              >
                No customers found
              </div>
              <div
                style={{
                  fontSize: 13.5,
                  color: "var(--text-muted)",
                  marginBottom: 14,
                }}
              >
                Try changing your search or filters.
              </div>
              <GhostBtn label="Clear Filters" onClick={clearFilters} />
            </Card>
          )}

          {/* Table — tablet and desktop */}
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
                  aria-label="Customer list"
                >
                  <thead>
                    <tr
                      style={{
                        borderBottom: "1px solid var(--border-neutral)",
                        background: "var(--surface-02)",
                      }}
                    >
                      {[
                        "Customer",
                        "Contact",
                        "Location",
                        ...(!isSalesRep ? ["Sales Rep"] : []),
                        "Status",
                        "Outstanding",
                        "Last Order",
                        "",
                      ].map((h, i) => (
                        <th
                          key={i}
                          scope="col"
                          style={{
                            padding: "10px 16px",
                            textAlign: "left",
                            fontSize: 11.5,
                            fontWeight: 600,
                            color: "var(--text-muted)",
                            fontFamily: "Inter",
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
                    {paginated.map((c) => (
                      <tr
                        key={c.id}
                        className="c-row"
                        onClick={() => onView(c)}
                        style={{
                          borderBottom: "1px solid var(--border-neutral)",
                          cursor: "pointer",
                          background: "var(--surface-01)",
                          transition: "background 0.1s",
                        }}
                      >
                        <td style={{ padding: "12px 16px" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            {c.urgentFlag && c.status === "pending" && (
                              <div
                                title="Urgent request flagged"
                                style={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: "50%",
                                  background: "#F59E0B",
                                  flexShrink: 0,
                                }}
                                aria-label="Urgent"
                              />
                            )}
                            <div>
                              <div
                                style={{
                                  fontWeight: 600,
                                  color: "var(--text-primary)",
                                  lineHeight: "16px",
                                }}
                              >
                                {c.name}
                              </div>
                              <div
                                style={{
                                  fontSize: 11.5,
                                  fontFamily: "DM Mono",
                                  color: "var(--text-muted)",
                                  marginTop: 1,
                                }}
                              >
                                {c.ref}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ color: "var(--text-secondary)" }}>
                            {c.contactPerson}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              fontFamily: "DM Mono",
                              color: "var(--text-muted)",
                              marginTop: 1,
                            }}
                          >
                            {c.phone}
                          </div>
                        </td>
                        <td
                          style={{
                            padding: "12px 16px",
                            color: "var(--text-secondary)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {c.location}
                          {c.branch && (
                            <div
                              style={{
                                fontSize: 11.5,
                                color: "var(--text-muted)",
                                marginTop: 1,
                              }}
                            >
                              {c.branch}
                            </div>
                          )}
                        </td>
                        {!isSalesRep && (
                          <td
                            style={{
                              padding: "12px 16px",
                              color: "var(--text-secondary)",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {c.salesRep ? (
                              c.salesRep.name
                            ) : (
                              <span style={{ color: "var(--text-muted)" }}>
                                Unassigned
                              </span>
                            )}
                          </td>
                        )}
                        <td style={{ padding: "12px 16px" }}>
                          <StatusBadge status={c.status} />
                        </td>
                        <td
                          style={{
                            padding: "12px 16px",
                            fontFamily: "DM Mono",
                            fontSize: 13,
                            fontWeight: 600,
                            color:
                              c.outstandingBalance !== "ETB 0.00"
                                ? "#DC2626"
                                : "var(--text-secondary)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {c.outstandingBalance}
                        </td>
                        <td
                          style={{
                            padding: "12px 16px",
                            color: "var(--text-muted)",
                            fontSize: 13,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {c.lastOrderDate ?? "—"}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onView(c)
                            }}
                            className="c-ghost"
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
                onChange={(p) => {
                  setPage(p)
                  window.scrollTo({ top: 0, behavior: "smooth" })
                }}
              />
            </Card>
          )}

          {/* Cards — mobile */}
          {filtered.length > 0 && isMobile && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {paginated.map((c) => (
                <Card key={c.id}>
                  <div
                    onClick={() => onView(c)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") onView(c)
                    }}
                    style={{ padding: "16px 18px", cursor: "pointer" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 8,
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: 14,
                            color: "var(--text-primary)",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          {c.urgentFlag && c.status === "pending" && (
                            <div
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: "50%",
                                background: "#F59E0B",
                                flexShrink: 0,
                              }}
                            />
                          )}
                          {c.name}
                        </div>
                        <div
                          style={{
                            fontSize: 11.5,
                            fontFamily: "DM Mono",
                            color: "var(--text-muted)",
                            marginTop: 1,
                          }}
                        >
                          {c.ref}
                        </div>
                      </div>
                      <StatusBadge status={c.status} />
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: "var(--text-secondary)",
                        marginBottom: 3,
                      }}
                    >
                      {c.contactPerson} · {c.phone}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: "var(--text-muted)",
                        marginBottom: 10,
                      }}
                    >
                      {c.location}
                      {c.branch ? ` — ${c.branch}` : ""}
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
                      <span
                        style={{
                          fontSize: 12.5,
                          fontFamily: "DM Mono",
                          fontWeight: 600,
                          color:
                            c.outstandingBalance !== "ETB 0.00"
                              ? "#DC2626"
                              : "var(--text-muted)",
                        }}
                      >
                        {c.outstandingBalance !== "ETB 0.00"
                          ? `${c.outstandingBalance} outstanding`
                          : "No outstanding balance"}
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          color: "#2B4D3A",
                          fontWeight: 600,
                          fontFamily: "Inter",
                        }}
                      >
                        View &rsaquo;
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
   URGENT ORDER EXCEPTION FLOW
   Shown when a sales rep tries to create an order for a pending
   customer. This is an explicit exception — not a normal flow.
───────────────────────────────────────────────────────────── */
type UrgentStep = "warning" | "confirm" | "submitted" | "error"

const UrgentOrderFlow: FC<{
  customer: Customer
  onCancel: () => void
}> = ({ customer, onCancel }) => {
  const [step, setStep] = useState<UrgentStep>("warning")
  const [submitting, setSubmitting] = useState(false)
  const [submittedRef, setSubmittedRef] = useState("")

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      await new Promise((r) => setTimeout(r, 1400))
      setSubmittedRef("ORD-10500")
      setStep("submitted")
    } catch {
      setStep("error")
    } finally {
      setSubmitting(false)
    }
  }

  if (step === "submitted") {
    return (
      <div
        style={{
          padding: "40px 24px",
          maxWidth: 560,
          margin: "0 auto",
          fontFamily: "Inter, system-ui, sans-serif",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: 15,
            background: "#FFFBEB",
            border: "1.5px solid #FDE68A",
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
            stroke="#B45309"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        </div>
        <h2
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "var(--text-primary)",
            margin: "0 0 8px",
            letterSpacing: "-0.01em",
          }}
        >
          Urgent order submitted
        </h2>
        <p
          style={{
            fontSize: 14,
            color: "var(--text-secondary)",
            lineHeight: 1.6,
            marginBottom: 6,
          }}
        >
          The manager has been notified and must review this order before it can
          proceed.
        </p>
        <div
          style={{
            margin: "20px auto",
            padding: "14px 20px",
            background: "var(--surface-01)",
            border: "1px solid var(--border-neutral)",
            borderRadius: 10,
            display: "inline-block",
            textAlign: "left",
            minWidth: 280,
          }}
        >
          <div
            style={{
              fontSize: 11.5,
              fontFamily: "DM Mono",
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 4,
            }}
          >
            Order
          </div>
          <div
            style={{
              fontFamily: "DM Mono",
              fontSize: 16,
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: 10,
            }}
          >
            {submittedRef}
          </div>
          <div
            style={{
              fontSize: 11.5,
              fontFamily: "DM Mono",
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 4,
            }}
          >
            Status
          </div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "3px 9px",
              borderRadius: 999,
              background: "#FFFBEB",
              border: "1px solid #FDE68A",
            }}
          >
            <span
              style={{
                fontSize: 11.5,
                fontWeight: 600,
                color: "#B45309",
                fontFamily: "Inter",
              }}
            >
              Awaiting Manager Confirmation
            </span>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 10,
            marginTop: 8,
          }}
        >
          <button
            onClick={onCancel}
            style={{
              padding: "9px 20px",
              borderRadius: 8,
              border: "1px solid var(--border-neutral)",
              background: "transparent",
              color: "var(--text-secondary)",
              fontSize: 13.5,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "Inter",
            }}
          >
            Back to Customer
          </button>
          <button
            style={{
              padding: "9px 20px",
              borderRadius: 8,
              border: "none",
              background: "#2B4D3A",
              color: "#fff",
              fontSize: 13.5,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "Inter",
            }}
          >
            View Order
          </button>
        </div>
      </div>
    )
  }

  if (step === "confirm") {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="urgent-confirm-title"
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.45)",
          zIndex: 900,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
        }}
      >
        <div
          style={{
            background: "var(--surface-01)",
            border: "1px solid var(--border-neutral)",
            borderRadius: 14,
            padding: 28,
            width: "100%",
            maxWidth: 460,
            boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
            fontFamily: "Inter",
          }}
        >
          <h2
            id="urgent-confirm-title"
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "var(--text-primary)",
              margin: "0 0 20px",
              letterSpacing: "-0.01em",
            }}
          >
            Confirm urgent order?
          </h2>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              marginBottom: 20,
              padding: "14px 16px",
              background: "var(--surface-02)",
              borderRadius: 9,
              border: "1px solid var(--border-neutral)",
            }}
          >
            {[
              { label: "Customer", value: customer.name },
              { label: "Customer status", value: "Pending Approval" },
              { label: "Urgency", value: "Urgent" },
              {
                label: "Manager notification",
                value: "Required — will be notified immediately",
              },
            ].map(({ label, value }) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 16,
                }}
              >
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  {label}
                </span>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    textAlign: "right",
                  }}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button
              onClick={() => setStep("warning")}
              disabled={submitting}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "1px solid var(--border-neutral)",
                background: "transparent",
                color: "var(--text-secondary)",
                fontSize: 13.5,
                cursor: submitting ? "not-allowed" : "pointer",
                fontFamily: "Inter",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 18px",
                borderRadius: 8,
                border: "none",
                background: "#B45309",
                color: "#fff",
                fontSize: 13.5,
                fontWeight: 600,
                cursor: submitting ? "not-allowed" : "pointer",
                fontFamily: "Inter",
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting && (
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  style={{ animation: "spin 0.8s linear infinite" }}
                  aria-hidden="true"
                >
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
              )}
              {submitting ? "Submitting…" : "Submit for Urgent Manager Review"}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // step === 'warning' (or 'error')
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="urgent-warn-title"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 900,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          background: "var(--surface-01)",
          border: "2px solid #FDE68A",
          borderRadius: 14,
          padding: 28,
          width: "100%",
          maxWidth: 500,
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
          fontFamily: "Inter",
        }}
      >
        {/* Warning badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 10px",
            borderRadius: 999,
            background: "#FFFBEB",
            border: "1px solid #FDE68A",
            marginBottom: 16,
          }}
        >
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#B45309"
            strokeWidth="2.5"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#B45309",
              letterSpacing: "0.06em",
              textTransform: "uppercase" as const,
            }}
          >
            Urgent Customer Exception
          </span>
        </div>

        <h2
          id="urgent-warn-title"
          style={{
            fontSize: 17,
            fontWeight: 700,
            color: "var(--text-primary)",
            margin: "0 0 10px",
            letterSpacing: "-0.01em",
          }}
        >
          This customer is still pending approval.
        </h2>

        <p
          style={{
            fontSize: 13.5,
            color: "var(--text-secondary)",
            lineHeight: 1.65,
            marginBottom: 16,
          }}
        >
          <strong style={{ color: "var(--text-primary)" }}>
            {customer.name}
          </strong>{" "}
          has not yet been approved by a manager. Normally, orders cannot be
          created for unapproved customers.
        </p>

        <div
          style={{
            padding: "14px 16px",
            borderRadius: 9,
            background: "#FFFBEB",
            border: "1.5px solid #FDE68A",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              fontSize: 13.5,
              fontWeight: 600,
              color: "#92400E",
              marginBottom: 6,
            }}
          >
            What happens next?
          </div>
          <ul
            style={{
              margin: 0,
              paddingLeft: 18,
              color: "#92400E",
              fontSize: 13,
              lineHeight: 1.7,
            }}
          >
            <li>
              Submitting this order will immediately notify the responsible
              manager.
            </li>
            <li>
              The manager must review both the customer and this order before it
              can proceed.
            </li>
            <li>
              The order will remain in a holding state until manager
              confirmation.
            </li>
            <li>
              This is not a normal order submission — it requires explicit
              manager approval.
            </li>
          </ul>
        </div>

        {step === "error" && (
          <div
            style={{
              marginBottom: 16,
              padding: "10px 14px",
              borderRadius: 8,
              background: "#FEF2F2",
              border: "1px solid #FCA5A5",
              fontSize: 13,
              color: "#B91C1C",
            }}
          >
            Submission failed. Please try again.
          </div>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid var(--border-neutral)",
              background: "transparent",
              color: "var(--text-secondary)",
              fontSize: 13.5,
              cursor: "pointer",
              fontFamily: "Inter",
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => setStep("confirm")}
            style={{
              padding: "8px 18px",
              borderRadius: 8,
              border: "none",
              background: "#B45309",
              color: "#fff",
              fontSize: 13.5,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "Inter",
            }}
          >
            Continue with Urgent Order
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   ORDER HISTORY PANEL
───────────────────────────────────────────────────────────── */
const OrderHistoryPanel: FC<{ customerId: string }> = ({ customerId }) => {
  const orders = CUSTOMER_ORDERS[customerId] ?? []

  if (!orders.length) {
    return (
      <div
        style={{
          padding: "40px 24px",
          textAlign: "center",
          color: "var(--text-muted)",
          fontFamily: "Inter",
        }}
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          style={{ display: "block", margin: "0 auto 12px" }}
          aria-hidden="true"
        >
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" />
        </svg>
        <div
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "var(--text-secondary)",
          }}
        >
          No orders on record.
        </div>
        <div style={{ fontSize: 13, marginTop: 4 }}>
          Orders placed by this customer will appear here.
        </div>
      </div>
    )
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 13.5,
          fontFamily: "Inter",
          minWidth: 560,
        }}
        aria-label="Customer orders"
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
              "Date",
              "Items",
              "Qty",
              "Status",
              "Payment",
              "Total",
              "",
            ].map((h) => (
              <th
                key={h}
                scope="col"
                style={{
                  padding: "9px 14px",
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
          {orders.map((o, i) => {
            const ps = payStatusStyle(o.paymentStatus)
            return (
              <tr
                key={o.id}
                style={{
                  borderBottom:
                    i < orders.length - 1
                      ? "1px solid var(--border-neutral)"
                      : "none",
                  background: "var(--surface-01)",
                }}
              >
                <td
                  style={{
                    padding: "11px 14px",
                    fontFamily: "DM Mono",
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: "#2B4D3A",
                    whiteSpace: "nowrap",
                  }}
                >
                  {o.ref}
                </td>
                <td
                  style={{
                    padding: "11px 14px",
                    color: "var(--text-muted)",
                    fontSize: 12.5,
                    whiteSpace: "nowrap",
                  }}
                >
                  {o.date}
                </td>
                <td
                  style={{
                    padding: "11px 14px",
                    color: "var(--text-secondary)",
                    maxWidth: 220,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {o.items}
                </td>
                <td
                  style={{
                    padding: "11px 14px",
                    fontFamily: "DM Mono",
                    fontSize: 12.5,
                    color: "var(--text-primary)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {o.qty}
                </td>
                <td style={{ padding: "11px 14px", whiteSpace: "nowrap" }}>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      color: "var(--text-secondary)",
                    }}
                  >
                    {o.status}
                  </span>
                </td>
                <td style={{ padding: "11px 14px", whiteSpace: "nowrap" }}>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "2px 8px",
                      borderRadius: 999,
                      fontSize: 11.5,
                      fontWeight: 600,
                      background: ps.bg,
                      color: ps.color,
                    }}
                  >
                    {o.paymentStatus}
                  </span>
                </td>
                <td
                  style={{
                    padding: "11px 14px",
                    fontFamily: "DM Mono",
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {o.total}
                </td>
                <td style={{ padding: "11px 14px" }}>
                  <button
                    style={{
                      padding: "4px 10px",
                      borderRadius: 6,
                      border: "1px solid var(--border-neutral)",
                      background: "transparent",
                      color: "var(--text-secondary)",
                      fontSize: 12,
                      cursor: "pointer",
                      fontFamily: "Inter",
                      fontWeight: 500,
                    }}
                  >
                    View
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <div
        style={{
          padding: "10px 14px",
          fontSize: 11,
          color: "var(--text-muted)",
          fontFamily: "DM Mono",
          fontStyle: "italic",
          borderTop: "1px solid var(--border-neutral)",
        }}
      >
        Order history provided by the server. Values are authoritative from
        backend.
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   CUSTOMER DETAIL VIEW
───────────────────────────────────────────────────────────── */
const InfoField: FC<{ label: string value?: string | null mono?: boolean }> = ({
  label,
  value,
  mono,
}) => (
  <div>
    <div
      style={{
        fontSize: 11,
        fontFamily: "DM Mono",
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: "var(--text-muted)",
        marginBottom: 3,
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontSize: 13.5,
        color: value ? "var(--text-primary)" : "var(--text-muted)",
        fontFamily: mono ? "DM Mono" : "Inter",
      }}
    >
      {value ?? "—"}
    </div>
  </div>
)

const InfoSection: FC<{ title: string children: ReactNode }> = ({
  title,
  children,
}) => (
  <div>
    <div
      style={{
        fontSize: 12,
        fontWeight: 700,
        color: "var(--text-muted)",
        textTransform: "uppercase",
        letterSpacing: "0.07em",
        fontFamily: "Inter",
        marginBottom: 12,
        paddingBottom: 8,
        borderBottom: "1px solid var(--border-neutral)",
      }}
    >
      {title}
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      {children}
    </div>
  </div>
)

type DetailTab = "overview" | "orders" | "activity"

const CustomerDetailView: FC<{
  customer: Customer
  onBack: () => void
  onEdit: (c: Customer) => void
  canEdit: boolean
  canApprove: boolean
  canDeactivate: boolean
  canCreateOrder: boolean
}> = ({
  customer,
  onBack,
  onEdit,
  canEdit,
  canApprove,
  canDeactivate,
  canCreateOrder,
}) => {
  const { isMobile } = useBreakpoint()
  const toast = useToast()
  const [approveOpen, setApproveOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [deactivateOpen, setDeactivateOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [rejectErr, setRejectErr] = useState("")
  const [actionLoading, setActionLoading] = useState(false)
  const [localStatus, setLocalStatus] = useState<CustomerStatus>(
    customer.status,
  )
  const [actLoad, setActLoad] = useState<LoadState>("loading")
  const [activity, setActivity] = useState<ActivityEvent[]>([])
  const [activeTab, setActiveTab] = useState<DetailTab>("overview")
  const [showUrgent, setShowUrgent] = useState(false)

  const cfg = STATUS_CFG[localStatus]
  const isPending = localStatus === "pending"
  const isActive = localStatus === "active"

  useEffect(() => {
    const t = setTimeout(() => {
      setActivity(FULL_ACTIVITY[customer.id] ?? SAMPLE_ACTIVITY)
      setActLoad("ok")
    }, 600)
    return () => clearTimeout(t)
  }, [customer.id])

  const handleApprove = async () => {
    setActionLoading(true)
    await approveCustomer(customer.id, "General Manager")
    // Send system notification to sales representative
    try {
      const raw = localStorage.getItem("erp_notifications_list")
      const list = raw ? JSON.parse(raw) : []
      const notif = {
        id: Date.now(),
        category: "info",
        title: "Customer Registration Approved",
        what: `Customer "${customer.name}" has been approved by management and is now active.`,
        why: "Customer request approved by General Manager.",
        module: "customers",
        moduleId: customer.id,
        time: "Just now",
        timeRaw: Date.now(),
        read: false,
      }
      localStorage.setItem("erp_notifications_list", JSON.stringify([notif, ...list]))
    } catch {}

    setActionLoading(false)
    setApproveOpen(false)
    setLocalStatus("active")
    toast.success("Customer approved", {
      description: `${customer.name} has been approved by management and is now active.`,
    })
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setRejectErr("Rejection reason is required.")
      return
    }
    setRejectErr(null)
    setActionLoading(true)
    const reasonText = rejectReason.trim()
    await rejectCustomer(customer.id, reasonText, "General Manager")

    // Send system notification to sales representative
    try {
      const raw = localStorage.getItem("erp_notifications_list")
      const list = raw ? JSON.parse(raw) : []
      const notif = {
        id: Date.now(),
        category: "warning",
        title: "Customer Registration Rejected",
        what: `Your customer registration request for "${customer.name}" has been rejected.`,
        why: `Reason: ${reasonText}`,
        module: "customers",
        moduleId: customer.id,
        time: "Just now",
        timeRaw: Date.now(),
        read: false,
      }
      localStorage.setItem("erp_notifications_list", JSON.stringify([notif, ...list]))
    } catch {}

    setActionLoading(false)
    setRejectOpen(false)
    setLocalStatus("rejected")
    toast.error("Customer registration rejected", {
      description: `Reason: ${reasonText}`,
    })
  }

  const handleDeactivate = async () => {
    setDeactivateOpen(false)
    setActionLoading(true)
    await new Promise((r) => setTimeout(r, 900))
    setActionLoading(false)
    setLocalStatus("inactive")
    toast.info("Customer deactivated")
  }

  return (
    <div
      style={{
        padding: isMobile ? "16px 14px 32px" : "24px 28px 40px",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <style>{`
        @keyframes cSkel { 0%,100%{opacity:.4} 50%{opacity:.9} }
        @keyframes cSlideUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>

      {/* Back */}
      <button
        onClick={onBack}
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
        Customers
      </button>

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 18,
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 5,
              flexWrap: "wrap",
            }}
          >
            <h1
              style={{
                fontSize: 21,
                fontWeight: 700,
                color: "var(--text-primary)",
                margin: 0,
                letterSpacing: "-0.02em",
              }}
            >
              {customer.name}
            </h1>
            <StatusBadge status={localStatus} />
            {customer.urgentFlag && localStatus === "pending" && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "3px 9px",
                  borderRadius: 999,
                  background: "#FFFBEB",
                  border: "1px solid #FDE68A",
                }}
              >
                <div
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: "#F59E0B",
                  }}
                />
                <span
                  style={{
                    fontSize: 11,
                    fontFamily: "DM Mono",
                    fontWeight: 600,
                    color: "#B45309",
                  }}
                >
                  Urgent request may require immediate manager approval.
                </span>
              </div>
            )}
          </div>
          <div
            style={{
              fontSize: 13,
              fontFamily: "DM Mono",
              color: "var(--text-muted)",
            }}
          >
            {customer.ref} &middot; {TYPE_LABELS[customer.type]}
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
          {/* Create Order — active customers */}
          {canCreateOrder && isActive && (
            <PrimaryBtn label="Create Order" onClick={() => {}} />
          )}
          {/* Urgent Order exception — pending customers where rep has order permission */}
          {canCreateOrder && isPending && (
            <button
              onClick={() => setShowUrgent(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                borderRadius: 8,
                border: "1.5px solid #FDE68A",
                background: "#FFFBEB",
                color: "#B45309",
                fontSize: 13.5,
                fontWeight: 600,
                fontFamily: "Inter",
                cursor: "pointer",
              }}
              title="This customer is pending approval — creates an urgent order exception"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              Urgent Order
            </button>
          )}
          {canApprove && isPending && (
            <>
              <PrimaryBtn
                label="Approve"
                onClick={() => setApproveOpen(true)}
                disabled={actionLoading}
                loading={actionLoading}
              />
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
            </>
          )}
          {canEdit && localStatus !== "rejected" && (
            <GhostBtn label="Edit" onClick={() => onEdit(customer)} />
          )}
          {canDeactivate && isActive && (
            <button
              onClick={() => setDeactivateOpen(true)}
              title="Deactivate customer"
              aria-label="Deactivate customer"
              style={{
                width: 34,
                height: 34,
                borderRadius: 7,
                border: "1px solid var(--border-neutral)",
                background: "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-muted)",
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
                <circle cx="12" cy="5" r="1" />
                <circle cx="12" cy="12" r="1" />
                <circle cx="12" cy="19" r="1" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Status notice */}
      <div
        style={{
          marginBottom: 20,
          padding: "12px 16px",
          borderRadius: 9,
          background: cfg.bg,
          border: `1px solid ${cfg.border}`,
          display: "flex",
          gap: 10,
          alignItems: "flex-start",
        }}
      >
        <SvgIcon d={cfg.iconPath} size={15} stroke={cfg.color} />
        <div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: cfg.color,
              marginBottom: 2,
            }}
          >
            {cfg.label}
          </div>
          <div style={{ fontSize: 13, color: cfg.color, opacity: 0.85 }}>
            {cfg.notice}
          </div>
          {customer.rejectionReason && localStatus === "rejected" && (
            <div
              style={{
                fontSize: 12.5,
                color: cfg.color,
                marginTop: 4,
                fontStyle: "italic",
              }}
            >
              Reason: {customer.rejectionReason}
            </div>
          )}
        </div>
      </div>

      {/* Tab navigation */}
      <div
        role="tablist"
        aria-label="Customer sections"
        style={{
          display: "flex",
          gap: 0,
          borderBottom: "1px solid var(--border-neutral)",
          marginBottom: 20,
        }}
      >
        {([
          { id: "overview", label: "Overview" },
          {
            id: "orders",
            label: `Orders${
              (CUSTOMER_ORDERS[customer.id]?.length ?? 0) > 0
                ? ` (${CUSTOMER_ORDERS[customer.id].length})`
                : ""
            }`,
          },
          { id: "activity", label: "Activity" },
        ] as { id: DetailTab label: string }[]).map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "9px 16px",
              fontSize: 13.5,
              fontFamily: "Inter",
              fontWeight: activeTab === tab.id ? 700 : 500,
              color: activeTab === tab.id ? "#2B4D3A" : "var(--text-muted)",
              background: "transparent",
              border: "none",
              borderBottom: `2px solid ${
                activeTab === tab.id ? "#2B4D3A" : "transparent"
              }`,
              cursor: "pointer",
              marginBottom: -1,
              transition: "color 0.12s",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {
        activeTab === "overview" && (
          <>
              {/* Customer Acquisition Information Card */}
              <Card style={{ padding: 20, gridColumn: isMobile ? "span 1" : "span 2", borderLeft: "4px solid #2B4D3A", background: "var(--surface-01)", marginBottom: 16 }}>
                <InfoSection title="Customer Acquisition Information">
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4, 1fr)", gap: 16 }}>
                    <InfoField
                      label="Responsible Sales Representative"
                      value={customer.salesRep?.name || "Yohannes Mesfin"}
                    />
                    <InfoField
                      label="Employee ID"
                      value={customer.salesRep?.employeeId || "EMP-104"}
                      mono
                    />
                    <InfoField
                      label="Submitted On"
                      value={customer.submittedAt || customer.createdAt}
                      mono
                    />
                    <InfoField
                      label="Acquisition / Request Status"
                      value={customer.status === "pending" ? "Pending Approval" : customer.status === "approved" || customer.status === "active" ? "Approved & Active" : customer.status === "rejected" ? "Rejected" : customer.status}
                    />
                  </div>
                  {customer.status === "rejected" && (
                    <div style={{ marginTop: 14, padding: "12px 14px", borderRadius: 8, background: "#FEF2F2", border: "1px solid #FECACA", color: "#991B1B" }}>
                      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>Rejection Decision Details</div>
                      <div style={{ fontSize: 12.5, display: "flex", gap: 16, flexWrap: "wrap" }}>
                        <div><strong>Rejected By:</strong> {customer.rejectedBy || "General Manager"}</div>
                        <div><strong>Rejected Date:</strong> {customer.rejectedAt || "Recently"}</div>
                        <div style={{ width: "100%", marginTop: 4 }}><strong>Rejection Reason:</strong> {customer.rejectionReason || "Not specified"}</div>
                      </div>
                    </div>
                  )}
                  {(customer.status === "approved" || customer.status === "active") && customer.approvedBy && (
                    <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 8, background: "#ECFDF5", border: "1px solid #A7F3D0", color: "#065F46", fontSize: 12.5 }}>
                      <strong>Approved By:</strong> {customer.approvedBy} · <strong>Approved Date:</strong> {customer.approvedAt || "Recently"}
                    </div>
                  )}
                </InfoSection>
              </Card>

              {/* Info grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                  gap: 16,
                  marginBottom: 16,
                }}
              >
                <Card style={{ padding: 20 }}>
                  <InfoSection title="Contact Information">
                    <InfoField
                      label="Contact Person"
                      value={customer.contactPerson}
                    />
                    <InfoField label="Phone" value={customer.phone} mono />
                    <InfoField label="Email" value={customer.email} mono />
                    <InfoField label="Address" value={customer.address} />
                  </InfoSection>
                </Card>
                <Card style={{ padding: 20 }}>
                  <InfoSection title="Business Information">
                    <InfoField
                      label="Customer Reference"
                      value={customer.ref}
                      mono
                    />
                    <InfoField
                      label="Customer Type"
                      value={TYPE_LABELS[customer.type]}
                    />
                    <InfoField label="Location" value={customer.location} />
                    <InfoField label="Branch" value={customer.branch} />
                    <InfoField
                      label="Sales Representative"
                      value={customer.salesRep?.name}
                    />
                    <InfoField
                      label="Account Created"
                      value={customer.createdAt}
                    />
                  </InfoSection>
                </Card>
              </div>

            {/* Summary row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                gap: 16,
                marginBottom: 16,
              }}
            >
              {/* Order summary */}
              <Card style={{ padding: 20 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 14,
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
                    Order Summary
                  </div>
                  <button
                    style={{
                      fontSize: 12.5,
                      color: "#2B4D3A",
                      fontWeight: 600,
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "Inter",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    View Orders
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
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                  }}
                >
                  {[
                    {
                      label: "Total Orders",
                      value: customer.totalOrders?.toString() ?? "—",
                      color: "var(--text-primary)",
                    },
                    {
                      label: "Active Orders",
                      value: customer.activeOrders?.toString() ?? "—",
                      color: "#2563EB",
                    },
                    {
                      label: "Completed",
                      value: customer.completedOrders?.toString() ?? "—",
                      color: "#16A34A",
                    },
                    {
                      label: "Last Order",
                      value: customer.lastOrderDate ?? "—",
                      color: "var(--text-secondary)",
                    },
                  ].map((s) => (
                    <div
                      key={s.label}
                      style={{
                        background: "var(--surface-02)",
                        borderRadius: 8,
                        padding: "10px 12px",
                        border: "1px solid var(--border-neutral)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 10.5,
                          fontFamily: "DM Mono",
                          color: "var(--text-muted)",
                          letterSpacing: "0.04em",
                          marginBottom: 3,
                        }}
                      >
                        {s.label}
                      </div>
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: s.color,
                          fontFamily: "DM Mono",
                        }}
                      >
                        {s.value}
                      </div>
                    </div>
                  ))}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--text-muted)",
                    fontFamily: "DM Mono",
                    marginTop: 10,
                    fontStyle: "italic",
                  }}
                >
                  Figures provided by the server.
                </div>
              </Card>

              {/* Payment summary */}
              <Card style={{ padding: 20 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                    fontFamily: "Inter",
                    marginBottom: 14,
                  }}
                >
                  Payment Summary
                </div>
                {[
                  {
                    label: "Outstanding Balance",
                    value: customer.outstandingBalance,
                    danger: customer.outstandingBalance !== "ETB 0.00",
                  },
                  {
                    label: "Total Paid",
                    value: customer.totalPaid ?? "—",
                    danger: false,
                  },
                  {
                    label: "Overdue",
                    value: customer.totalOverdue ?? "—",
                    danger: !!(
                      customer.totalOverdue &&
                      customer.totalOverdue !== "ETB 0.00"
                    ),
                  },
                ].map((r, i, arr) => (
                  <div
                    key={r.label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "11px 0",
                      borderBottom:
                        i < arr.length - 1
                          ? "1px solid var(--border-neutral)"
                          : "none",
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
                        fontSize: 14,
                        fontWeight: 700,
                        color: r.danger ? "#DC2626" : "var(--text-primary)",
                        fontFamily: "DM Mono",
                      }}
                    >
                      {r.value}
                    </span>
                  </div>
                ))}
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--text-muted)",
                    fontFamily: "DM Mono",
                    marginTop: 10,
                    fontStyle: "italic",
                  }}
                >
                  Overdue status determined by the server.
                </div>
              </Card>
            </div>
          </> /* end overview tab */
        )
      }

      {/* ORDERS TAB */}
      {activeTab === "orders" && (
        <Card>
          <div
            style={{
              padding: "13px 18px",
              borderBottom: "1px solid var(--border-neutral)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
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
              Order History
            </div>
            {canCreateOrder && isActive && (
              <PrimaryBtn label="Create Order" onClick={() => {}} />
            )}
          </div>
          <OrderHistoryPanel customerId={customer.id} />
        </Card>
      )}

      {/* ACTIVITY TAB */}
      {activeTab === "activity" && (
        <Card>
          <div
            style={{
              padding: "13px 18px",
              borderBottom: "1px solid var(--border-neutral)",
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
              Activity
            </div>
          </div>
          {actLoad === "loading" && (
            <div
              style={{
                padding: "14px 18px",
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              {[...Array(4)].map((_, i) => (
                <div key={i} style={{ display: "flex", gap: 12 }}>
                  <Skel w="28px" h={28} radius={7} />
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      gap: 7,
                    }}
                  >
                    <Skel w="65%" h={11} />
                    <Skel w="40%" h={9} />
                  </div>
                </div>
              ))}
            </div>
          )}
          {actLoad === "ok" &&
            activity.map((ev, i) => {
              const icon = ACTIVITY_ICON[ev.type]
              return (
                <div
                  key={ev.id}
                  style={{
                    display: "flex",
                    gap: 12,
                    padding: "12px 18px",
                    borderBottom:
                      i < activity.length - 1
                        ? "1px solid var(--border-neutral)"
                        : "none",
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
                    <SvgIcon
                      d={icon.path}
                      size={12}
                      stroke={icon.color}
                      strokeW={2}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        color: "var(--text-primary)",
                        lineHeight: "17px",
                        marginBottom: 3,
                      }}
                    >
                      {ev.event}
                      {ev.record && (
                        <span
                          style={{
                            fontFamily: "DM Mono",
                            fontSize: 12,
                            color: "#2B4D3A",
                            marginLeft: 5,
                          }}
                        >
                          {ev.record}
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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
                          fontSize: 11,
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
            })}
          {actLoad === "ok" && !activity.length && (
            <div
              style={{
                padding: "32px 24px",
                textAlign: "center",
                color: "var(--text-muted)",
                fontSize: 13.5,
                fontFamily: "Inter",
              }}
            >
              No activity recorded yet.
            </div>
          )}
        </Card>
      )}

      {/* Urgent order exception modal */}
      {showUrgent && (
        <UrgentOrderFlow
          customer={customer}
          onCancel={() => setShowUrgent(false)}
        />
      )}

      {/* Approve dialog */}
      <Modal
        open={approveOpen}
        onClose={() => !actionLoading && setApproveOpen(false)}
        title="Approve customer?"
      >
        <p
          style={{
            fontSize: 13.5,
            color: "var(--text-secondary)",
            lineHeight: 1.55,
            marginBottom: 20,
          }}
        >
          Confirm that <strong>{customer.name}</strong> should be activated.
          Once approved, the customer will be available for orders.
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <GhostBtn
            label="Cancel"
            onClick={() => setApproveOpen(false)}
            disabled={actionLoading}
          />
          <PrimaryBtn
            label="Approve Customer"
            onClick={handleApprove}
            loading={actionLoading}
          />
        </div>
      </Modal>

      {/* Reject dialog */}
      <Modal
        open={rejectOpen}
        onClose={() => !actionLoading && setRejectOpen(false)}
        title="Reject customer?"
      >
        <p
          style={{
            fontSize: 13.5,
            color: "var(--text-secondary)",
            lineHeight: 1.55,
            marginBottom: 14,
          }}
        >
          Rejecting <strong>{customer.name}</strong> will prevent them from
          placing orders. Please provide a reason.
        </p>
        <div style={{ marginBottom: 20 }}>
          <FieldLabel label="Rejection reason" required />
          <TextareaField
            value={rejectReason}
            onChange={(v) => {
              setRejectReason(v)
              if (v.trim()) setRejectErr("")
            }}
            placeholder="Explain the reason for rejection..."
            rows={3}
            disabled={actionLoading}
          />
          <FieldError message={rejectErr} />
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <GhostBtn
            label="Cancel"
            onClick={() => setRejectOpen(false)}
            disabled={actionLoading}
          />
          <PrimaryBtn
            label="Reject Customer"
            onClick={handleReject}
            loading={actionLoading}
            danger
          />
        </div>
      </Modal>

      {/* Deactivate dialog */}
      <Modal
        open={deactivateOpen}
        onClose={() => !actionLoading && setDeactivateOpen(false)}
        title="Deactivate customer?"
      >
        <p
          style={{
            fontSize: 13.5,
            color: "var(--text-secondary)",
            lineHeight: 1.55,
            marginBottom: 20,
          }}
        >
          Are you sure you want to deactivate <strong>{customer.name}</strong>?
          They will no longer be available for new orders.
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <GhostBtn
            label="Cancel"
            onClick={() => setDeactivateOpen(false)}
            disabled={actionLoading}
          />
          <PrimaryBtn
            label="Deactivate"
            onClick={handleDeactivate}
            loading={actionLoading}
            danger
          />
        </div>
      </Modal>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   CUSTOMER FORM (NEW / EDIT)
───────────────────────────────────────────────────────────── */
type FormState = "idle" | "submitting" | "success" | "error"

const CustomerFormView: FC<{
  mode: "new" | "edit"
  customer?: Customer
  onBack: () => void
  canAssignRep: boolean
  currentRepId?: string
}> = ({ mode, customer, onBack, canAssignRep, currentRepId }) => {
  const { isMobile } = useBreakpoint()
  const toast = useToast()
  const [formState, setFormState] = useState<FormState>("idle")
  const [data, setData] = useState<FormData>({
    name: customer?.name ?? "",
    type: customer?.type ?? "cafe",
    contactPerson: customer?.contactPerson ?? "",
    phone: customer?.phone ?? "",
    email: customer?.email ?? "",
    address: customer?.address ?? "",
    location: customer?.location ?? "",
    branch: customer?.branch ?? "",
    salesRepId: customer?.salesRep?.id ?? currentRepId ?? "",
    notes: customer?.notes ?? "",
  })
  const [errors, setErrors] = useState<FormErrors>({})

  const setField = (k: keyof FormData) => (v: string) => {
    setData((p) => ({ ...p, [k]: v }))
    if (errors[k]) setErrors((p) => ({ ...p, [k]: "" }))
  }

  const validate = (): boolean => {
    const e: FormErrors = {}
    if (!data.name.trim()) e.name = "Customer name is required."
    if (!data.contactPerson.trim())
      e.contactPerson = "Contact person is required."
    if (!data.phone.trim()) e.phone = "Phone number is required."
    else if (!/^[+\d\s\-()]{7,}$/.test(data.phone.trim()))
      e.phone = "Enter a valid phone number."
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
      e.email = "Enter a valid email address."
    if (!data.location.trim()) e.location = "Location is required."
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setFormState("submitting")
    try {
      const { createCustomer } = await import("../services/customers")
      const res = await createCustomer({
        name: data.name,
        type: data.type,
        contactName: data.contactPerson,
        contactPhone: data.phone,
        contactEmail: data.email,
        address: data.address,
        city: data.location || "Addis Ababa",
        branchDetails: data.branch,
        salesRepId: data.salesRepId,
        notes: data.notes,
      })
      if (res.state === "error") {
        toast.error("Failed to create customer", { description: res.error })
        setFormState("error")
      } else {
        setFormState("success")
        toast.success(
          mode === "new" ? "Customer created successfully" : "Changes saved",
          {
            description: `${data.name} is now saved to the database.`,
          },
        )
        onBack()
      }
    } catch (err: any) {
      setFormState("error")
      toast.error("Error creating customer", { description: err.message })
    }
  }

  const col2 = isMobile ? "1fr" : "1fr 1fr"
  const isSubmitting = formState === "submitting"

  const SectionHeader = ({ title }: { title: string }) => (
    <div
      style={{
        gridColumn: "1 / -1",
        paddingBottom: 8,
        borderBottom: "1px solid var(--border-neutral)",
      }}
    >
      <div
        style={{
          fontSize: 12.5,
          fontWeight: 700,
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.07em",
          fontFamily: "Inter",
        }}
      >
        {title}
      </div>
    </div>
  )

  if (formState === "success") {
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
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: "#F0FDF4",
            border: "1px solid #86EFAC",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
          }}
        >
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#16A34A"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "var(--text-primary)",
            margin: "0 0 8px",
            letterSpacing: "-0.01em",
          }}
        >
          {mode === "new" ? "Customer submitted" : "Changes saved"}
        </h2>
        <p
          style={{
            fontSize: 14,
            color: "var(--text-secondary)",
            lineHeight: 1.55,
            marginBottom: 28,
          }}
        >
          {mode === "new"
            ? `${data.name} has been submitted for manager approval. You will be notified once reviewed.`
            : `${data.name} has been successfully updated.`}
        </p>
        <PrimaryBtn label="Back to Customers" onClick={onBack} />
      </div>
    )
  }

  return (
    <div
      style={{
        padding: isMobile ? "16px 14px 40px" : "24px 28px 48px",
        fontFamily: "Inter, system-ui, sans-serif",
        maxWidth: 800,
      }}
    >
      <style>{`@keyframes spin { to{transform:rotate(360deg)} }`}</style>

      <button
        onClick={onBack}
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
        Customers
      </button>

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
          Sales
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
          {mode === "new" ? "New Customer" : `Edit Customer`}
        </h1>
        <p
          style={{
            fontSize: 13,
            color: "var(--text-secondary)",
            margin: "4px 0 0",
          }}
        >
          {mode === "new"
            ? "Submit a new customer for manager approval."
            : `Updating information for ${customer?.name}.`}
        </p>
      </div>

      {formState === "error" && (
        <div
          style={{
            marginBottom: 16,
            padding: "12px 14px",
            borderRadius: 9,
            background: "#FEF2F2",
            border: "1px solid #FCA5A5",
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
          }}
        >
          <SvgIcon
            d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"
            size={15}
            stroke="#DC2626"
          />
          <div>
            <div
              style={{
                fontSize: 13.5,
                fontWeight: 600,
                color: "#B91C1C",
                marginBottom: 2,
              }}
            >
              Unable to save customer
            </div>
            <div style={{ fontSize: 12.5, color: "#991B1B" }}>
              Something went wrong. Please try again.
            </div>
          </div>
          <button
            onClick={() => setFormState("idle")}
            style={{
              marginLeft: "auto",
              padding: "4px 10px",
              borderRadius: 6,
              border: "1px solid #FCA5A5",
              background: "transparent",
              color: "#B91C1C",
              fontSize: 12.5,
              cursor: "pointer",
              fontFamily: "Inter",
              fontWeight: 600,
            }}
          >
            Try Again
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {/* Customer Information */}
        <Card style={{ padding: "20px 22px", marginBottom: 14 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: col2,
              gap: "16px 20px",
            }}
          >
            <SectionHeader title="Customer Information" />
            <div style={{ gridColumn: "1 / -1" }}>
              <FieldLabel
                label="Business / customer name"
                required
                htmlFor="f-name"
              />
              <InputField
                id="f-name"
                value={data.name}
                onChange={setField("name")}
                placeholder="e.g. Sunrise Cafe"
                error={errors.name}
                disabled={isSubmitting}
              />
              <FieldError id="f-name-err" message={errors.name} />
            </div>
            <div>
              <FieldLabel label="Customer type" required htmlFor="f-type" />
              <SelectField
                id="f-type"
                value={data.type}
                onChange={setField("type")}
                options={Object.entries(TYPE_LABELS).map(([k, v]) => ({
                  value: k,
                  label: v,
                }))}
                disabled={isSubmitting}
              />
            </div>
          </div>
        </Card>

        {/* Contact Information */}
        <Card style={{ padding: "20px 22px", marginBottom: 14 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: col2,
              gap: "16px 20px",
            }}
          >
            <SectionHeader title="Contact Information" />
            <div>
              <FieldLabel label="Contact person" required htmlFor="f-contact" />
              <InputField
                id="f-contact"
                value={data.contactPerson}
                onChange={setField("contactPerson")}
                placeholder="Full name"
                error={errors.contactPerson}
                disabled={isSubmitting}
              />
              <FieldError id="f-contact-err" message={errors.contactPerson} />
            </div>
            <div>
              <FieldLabel label="Phone number" required htmlFor="f-phone" />
              <InputField
                id="f-phone"
                type="tel"
                value={data.phone}
                onChange={setField("phone")}
                placeholder="+251 91 234 5678"
                error={errors.phone}
                disabled={isSubmitting}
              />
              <FieldError id="f-phone-err" message={errors.phone} />
            </div>
            <div>
              <FieldLabel label="Email address" htmlFor="f-email" />
              <InputField
                id="f-email"
                type="email"
                value={data.email}
                onChange={setField("email")}
                placeholder="orders@customer.com"
                error={errors.email}
                disabled={isSubmitting}
              />
              <FieldError id="f-email-err" message={errors.email} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <FieldLabel label="Street address" htmlFor="f-address" />
              <InputField
                id="f-address"
                value={data.address}
                onChange={setField("address")}
                placeholder="Street address or district"
                disabled={isSubmitting}
              />
            </div>
          </div>
        </Card>

        {/* Location */}
        <Card style={{ padding: "20px 22px", marginBottom: 14 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: col2,
              gap: "16px 20px",
            }}
          >
            <SectionHeader title="Location / Branch" />
            <div>
              <FieldLabel
                label="City / location"
                required
                htmlFor="f-location"
              />
              <InputField
                id="f-location"
                value={data.location}
                onChange={setField("location")}
                placeholder="e.g. Addis Ababa"
                error={errors.location}
                disabled={isSubmitting}
              />
              <FieldError id="f-location-err" message={errors.location} />
            </div>
            <div>
              <FieldLabel label="Branch name" htmlFor="f-branch" />
              <InputField
                id="f-branch"
                value={data.branch}
                onChange={setField("branch")}
                placeholder="e.g. Bole Road Branch"
                disabled={isSubmitting}
              />
            </div>
          </div>
        </Card>

        {/* Sales Assignment */}
        <Card style={{ padding: "20px 22px", marginBottom: 14 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: col2,
              gap: "16px 20px",
            }}
          >
            <SectionHeader title="Sales Assignment" />
            <div>
              <FieldLabel
                label="Sales representative"
                required={!canAssignRep}
                htmlFor="f-rep"
              />
              {canAssignRep ? (
                <SelectField
                  id="f-rep"
                  value={data.salesRepId}
                  onChange={setField("salesRepId")}
                  options={SALES_REPS.map((r) => ({
                    value: r.id,
                    label: r.name,
                  }))}
                  placeholder="Select a representative"
                  disabled={isSubmitting}
                />
              ) : (
                <>
                  <InputField
                    id="f-rep"
                    value={
                      SALES_REPS.find((r) => r.id === data.salesRepId)?.name ??
                      "Assigned by the server"
                    }
                    onChange={() => {}}
                    readOnly
                  />
                  <div
                    style={{
                      fontSize: 11.5,
                      color: "var(--text-muted)",
                      marginTop: 4,
                      fontFamily: "Inter",
                      fontStyle: "italic",
                    }}
                  >
                    Assignment is managed by the server based on your account.
                  </div>
                </>
              )}
            </div>
          </div>
        </Card>

        {/* Additional */}
        <Card style={{ padding: "20px 22px", marginBottom: 24 }}>
          <div style={{ display: "grid", gap: 16 }}>
            <SectionHeader title="Additional Information" />
            <div>
              <FieldLabel label="Notes" htmlFor="f-notes" />
              <TextareaField
                id="f-notes"
                value={data.notes}
                onChange={setField("notes")}
                placeholder="Any additional context for this customer..."
                disabled={isSubmitting}
              />
            </div>
          </div>
        </Card>

        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "flex-end",
            flexWrap: "wrap",
          }}
        >
          <GhostBtn label="Cancel" onClick={onBack} disabled={isSubmitting} />
          <PrimaryBtn
            type="submit"
            label={mode === "new" ? "Submit for Approval" : "Save Changes"}
            loading={isSubmitting}
          />
        </div>
      </form>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   ROOT EXPORT — internal view router
───────────────────────────────────────────────────────────── */
export default function Customers({
  onNavigate,
  routeParams,
}: {
  onNavigate?: (id: string, params?: any) => void
  routeParams?: any
}) {
  const { currentUser } = useAuth()
  const role = currentUser?.role ?? "general-manager"

  const [view, setView] = useState<View>("list")
  const [selected, setSelected] = useState<Customer | null>(null)

  // Handle incoming routeParams for deep linking
  useEffect(() => {
    if (routeParams?.view === "detail" && routeParams?.id) {
      import("../services/customers").then(({ getCustomer }) => {
        getCustomer(routeParams.id).then((res) => {
          if (res.state === "ok" && res.data) {
            setSelected(res.data)
            setView("detail")
          }
        })
      })
    }
  }, [routeParams])

  // Permission derivations — UI only. PHP enforces all actual authorization.
  const canCreate =
    canRead(role, "customers") &&
    role !== "inventory-manager" &&
    role !== "head-roaster" &&
    role !== "delivery-staff"
  const canEdit = canRead(role, "customers") && role !== "delivery-staff"
  const canApprove = role === "general-manager" || role === "vice-manager"
  const canDeactivate = role === "general-manager" || role === "vice-manager"
  const canAssignRep = role === "general-manager" || role === "vice-manager"
  const isSalesRep = role === "sales-rep"
  const canCreateOrder = can(role as any, "orders.create")

  const [refreshCount, setRefreshCount] = useState(0)

  const goList = useCallback(() => {
    setView("list")
    setSelected(null)
    setRefreshCount((c) => c + 1)
  }, [])
  const goDetail = useCallback((c: Customer) => {
    setSelected(c)
    setView("detail")
  }, [])
  const goNew = useCallback(() => {
    setSelected(null)
    setView("new")
  }, [])
  const goEdit = useCallback((c: Customer) => {
    setSelected(c)
    setView("edit")
  }, [])
  const goBackFromEdit = useCallback(() => {
    setView(selected ? "detail" : "list")
    setRefreshCount((c) => c + 1)
  }, [selected])

  if (view === "detail" && selected) {
    return (
      <>
        <CustomerDetailView
          customer={selected}
          onBack={goList}
          onEdit={goEdit}
          canEdit={canEdit}
          canApprove={canApprove}
          canDeactivate={canDeactivate}
          canCreateOrder={canCreateOrder}
        />
        <CustomerFormModal
          open={view === "edit"}
          onClose={goBackFromEdit}
          onSuccess={goBackFromEdit}
        />
      </>
    )
  }

  return (
    <>
      <CustomerListView
        onView={goDetail}
        onNew={goNew}
        canCreate={canCreate}
        role={role}
        refreshCount={refreshCount}
      />
      <CustomerFormModal
        open={view === "new"}
        onClose={goList}
        onSuccess={goList}
      />
    </>
  )
}
