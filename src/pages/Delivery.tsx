/**
 * P2H1 — Delivery Module
 * Coffee-Roasting ERP · React 19 + TypeScript + Tailwind CSS v4
 *
 * ALL quantities and amounts are opaque strings from the backend.
 * Frontend never calculates remaining qty, completion, or percentages.
 */

import { useState, useEffect, useRef, useCallback } from "react"
import { useAuth } from "../contexts/AuthContext"
import { can } from "../lib/can"
import { useBreakpoint } from "../hooks/useBreakpoint"
import {
  getDeliverySummary,
  listDeliveries,
  getDelivery,
  assignDriver,
  startDelivery,
  uploadProofDocument,
  verifyCustomerAcceptance,
  reportFailedAttempt,
} from "../services/delivery"
import type {
  DeliveryRecord,
  DeliveryStatus,
  DeliverySummary,
  DeliveryTimelineEvent,
  DeliveryEvent,
  DriverOption,
} from "../services/delivery"

/* ─── View routing ─────────────────────────────────────────── */
type View = "list" | "detail"

/* ─── Status config map ────────────────────────────────────── */
interface StatusCfg {
  label: string
  color: string
  bg: string
  icon: React.ReactNode
}

const STATUS_CONFIG: Record<DeliveryStatus, StatusCfg> = {
  "ready-for-delivery": {
    label: "Ready for Delivery",
    color: "var(--sem-success)",
    bg: "#e8f5ee",
    icon: (
      <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
        <path
          d="M1 8h13v8H1V8zM14 10l5 2v4h-5V10zM4 16a2 2 0 100-4 2 2 0 000 4zM16 16a2 2 0 100-4 2 2 0 000 4z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  assigned: {
    label: "Assigned",
    color: "#2563eb",
    bg: "#eff6ff",
    icon: (
      <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M3 18c0-3.314 3.134-6 7-6s7 2.686 7 6"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  "out-for-delivery": {
    label: "Out for Delivery",
    color: "#2563eb",
    bg: "#eff6ff",
    icon: (
      <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
        <path
          d="M1 8h13v8H1V8zM14 10l5 2v4h-5V10zM4 16a2 2 0 100-4 2 2 0 000 4zM16 16a2 2 0 100-4 2 2 0 000 4z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M5 8V5h7"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  "partially-delivered": {
    label: "Partially Delivered",
    color: "#d97706",
    bg: "#fffbeb",
    icon: (
      <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M10 2v8l5 3"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  "awaiting-confirmation": {
    label: "Awaiting Confirmation",
    color: "#d97706",
    bg: "#fffbeb",
    icon: (
      <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M10 6v4l3 2"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  "fully-delivered": {
    label: "Fully Delivered",
    color: "var(--sem-success)",
    bg: "#e8f5ee",
    icon: (
      <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
        <path
          d="M4 10l4 4 8-8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  "delivery-disputed": {
    label: "Delivery Disputed",
    color: "var(--sem-danger)",
    bg: "#fff0f0",
    icon: (
      <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
        <path
          d="M10 3L18 17H2L10 3z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M10 9v3M10 14h.01"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  "failed-attempt": {
    label: "Failed Attempt",
    color: "var(--sem-danger)",
    bg: "#fff0f0",
    icon: (
      <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M7 7l6 6M13 7l-6 6"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  verified: {
    label: "Verified",
    color: "var(--sem-success)",
    bg: "#e8f5ee",
    icon: (
      <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
        <path
          d="M10 2l2.5 4.5L18 7.5l-4 3.5 1 5.5-5-2.5-5 2.5 1-5.5-4-3.5 5.5-1L10 2z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M7.5 10l2 2 3-3"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
}

const PAYMENT_CFG: Record<string, { label: string color: string bg: string }> =
  {
    "payment-pending": {
      label: "Payment Pending",
      color: "#d97706",
      bg: "#fffbeb",
    },
    "partially-paid": {
      label: "Partially Paid",
      color: "#2563eb",
      bg: "#eff6ff",
    },
    paid: { label: "Paid", color: "var(--sem-success)", bg: "#e8f5ee" },
    overdue: { label: "Overdue", color: "var(--sem-danger)", bg: "#fff0f0" },
  }

/* ─── Shared tiny components ────────────────────────────────── */

function StatusBadge({ status }: { status: DeliveryStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 9px",
        borderRadius: 20,
        background: cfg.bg,
        color: cfg.color,
        fontSize: 11,
        fontWeight: 600,
        fontFamily: "Inter",
        whiteSpace: "nowrap",
      }}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  )
}

function PaymentBadge({ status }: { status: string }) {
  const cfg = PAYMENT_CFG[status] ?? {
    label: status,
    color: "var(--text-muted)",
    bg: "var(--surface-01)",
  }
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 9px",
        borderRadius: 20,
        background: cfg.bg,
        color: cfg.color,
        fontSize: 11,
        fontWeight: 600,
        fontFamily: "Inter",
        whiteSpace: "nowrap",
      }}
    >
      {cfg.label}
    </span>
  )
}

function Skeleton({ h = 14, w = "100%" }: { h?: number w?: string | number }) {
  return (
    <div
      style={{
        height: h,
        width: w,
        borderRadius: 4,
        background:
          "linear-gradient(90deg,var(--surface-01) 25%,var(--surface-02) 50%,var(--surface-01) 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.4s ease infinite",
      }}
    />
  )
}

function UrgentBadge() {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        padding: "2px 7px",
        borderRadius: 4,
        background: "#fff0f0",
        color: "var(--sem-danger)",
        fontSize: 10,
        fontWeight: 700,
        fontFamily: "DM Mono",
        letterSpacing: "0.06em",
        textTransform: "uppercase",
      }}
    >
      ⚡ URGENT
    </span>
  )
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontFamily: "DM Mono",
        color: "var(--text-muted)",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        marginBottom: 3,
      }}
    >
      {children}
    </div>
  )
}

function Qty({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontFamily: "DM Mono",
        fontSize: 14,
        fontWeight: 700,
        color: "var(--text-primary)",
      }}
    >
      {children}
    </span>
  )
}

function RefBadge({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontFamily: "DM Mono",
        fontSize: 12,
        fontWeight: 700,
        color: "#2B4D3A",
        background: "#e8f5ee",
        padding: "2px 8px",
        borderRadius: 4,
      }}
    >
      {children}
    </span>
  )
}

function Card({
  children,
  style,
}: {
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <div
      style={{
        background: "var(--surface-01)",
        border: "1px solid var(--border-neutral)",
        borderRadius: 10,
        padding: "16px 18px",
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/* ─── Operational Timeline ──────────────────────────────────── */
function OperationalTimeline({ events }: { events: DeliveryTimelineEvent[] }) {
  return (
    <div>
      {events.map((ev, i) => {
        const isLast = i === events.length - 1
        const dotBg =
          ev.state === "completed"
            ? "var(--sem-success)"
            : ev.state === "current"
              ? "#2563eb"
              : ev.state === "warning"
                ? "#d97706"
                : "transparent"
        const dotBorder =
          ev.state === "pending" ? "2px dashed var(--border-neutral)" : "none"
        return (
          <div key={ev.id} style={{ display: "flex", gap: 12 }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                minWidth: 20,
              }}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: ev.state === "warning" ? 3 : "50%",
                  background: dotBg,
                  border: dotBorder,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  animation:
                    ev.state === "current"
                      ? "pulse 2s ease-in-out infinite"
                      : undefined,
                  boxShadow:
                    ev.state === "current"
                      ? "0 0 0 4px rgba(37,99,235,0.18)"
                      : undefined,
                }}
              >
                {ev.state === "completed" && (
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M2 6l3 3 5-5"
                      stroke="#fff"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
                {ev.state === "warning" && (
                  <span
                    style={{ color: "#fff", fontSize: 10, fontWeight: 800 }}
                  >
                    !
                  </span>
                )}
              </div>
              {!isLast && (
                <div
                  style={{
                    width: 2,
                    flex: 1,
                    minHeight: 14,
                    background: "var(--border-neutral)",
                    margin: "2px 0",
                  }}
                />
              )}
            </div>
            <div style={{ paddingBottom: isLast ? 0 : 14, flex: 1 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  fontFamily: "Inter",
                }}
              >
                {ev.event}
              </div>
              {ev.actor && (
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--text-secondary)",
                    marginTop: 1,
                  }}
                >
                  {ev.actor}
                </div>
              )}
              {ev.quantity && (
                <div
                  style={{
                    fontFamily: "DM Mono",
                    fontSize: 11,
                    color: "#2B4D3A",
                    marginTop: 2,
                  }}
                >
                  {ev.quantity}
                </div>
              )}
              <div
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                  fontFamily: "DM Mono",
                  marginTop: 2,
                }}
              >
                {ev.timestamp}
              </div>
              {ev.notes && (
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--text-secondary)",
                    marginTop: 2,
                    fontStyle: "italic",
                  }}
                >
                  {ev.notes}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ─── Summary strip ─────────────────────────────────────────── */
function SummaryStrip({
  summary,
  loading,
}: {
  summary: DeliverySummary | null
  loading: boolean
}) {
  const cards = [
    {
      label: "Ready for Delivery",
      value: summary?.readyForDelivery,
      color: "var(--sem-success)",
    },
    {
      label: "Out for Delivery",
      value: summary?.outForDelivery,
      color: "#2563eb",
    },
    {
      label: "Awaiting Confirmation",
      value: summary?.awaitingConfirmation,
      color: "#d97706",
    },
    {
      label: "Partially Delivered",
      value: summary?.partiallyDelivered,
      color: "#d97706",
    },
    {
      label: "Delivery Disputes",
      value: summary?.deliveryDisputes,
      color: "var(--sem-danger)",
    },
    {
      label: "Fully Delivered",
      value: summary?.fullyDelivered,
      color: "#2B4D3A",
    },
  ]
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))",
        gap: 10,
        marginBottom: 20,
      }}
    >
      {cards.map((c) => (
        <div
          key={c.label}
          style={{
            background: "var(--surface-01)",
            border: "1px solid var(--border-neutral)",
            borderRadius: 10,
            padding: "14px 16px",
          }}
        >
          <Eyebrow>{c.label}</Eyebrow>
          {loading ? (
            <Skeleton h={26} w={44} />
          ) : (
            <div
              style={{
                fontSize: 26,
                fontWeight: 800,
                fontFamily: "DM Mono",
                color: c.color,
                lineHeight: 1,
              }}
            >
              {c.value ?? "—"}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

/* ─── Delivery Events list ──────────────────────────────────── */
function DeliveryEventsList({ events }: { events: DeliveryEvent[] }) {
  if (!events.length) return null
  return (
    <div>
      {events.map((ev) => (
        <div
          key={ev.id}
          style={{
            border: "1px solid var(--border-neutral)",
            borderRadius: 10,
            padding: "14px 16px",
            marginBottom: 10,
            background: "var(--surface-01)",
          }}
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
                fontSize: 13,
                fontWeight: 700,
                color: "var(--text-primary)",
                fontFamily: "Inter",
              }}
            >
              Delivery #{ev.deliveryNumber}
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                fontFamily: "Inter",
                color:
                  ev.status === "verified"
                    ? "var(--sem-success)"
                    : ev.status === "failed"
                      ? "var(--sem-danger)"
                      : "#d97706",
                background:
                  ev.status === "verified"
                    ? "#e8f5ee"
                    : ev.status === "failed"
                      ? "#fff0f0"
                      : "#fffbeb",
                padding: "2px 8px",
                borderRadius: 20,
              }}
            >
              {ev.status === "verified"
                ? "✓ Verified"
                : ev.status === "failed"
                  ? "✗ Failed"
                  : ev.status === "awaiting-confirmation"
                    ? "⏳ Awaiting Confirmation"
                    : "In Progress"}
            </span>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(110px,1fr))",
              gap: "8px 14px",
              marginBottom: 8,
            }}
          >
            <div>
              <Eyebrow>Quantity</Eyebrow>
              <Qty>{ev.quantity}</Qty>
            </div>
            <div>
              <Eyebrow>Driver</Eyebrow>
              <div style={{ fontSize: 13, color: "var(--text-primary)" }}>
                {ev.driver}
              </div>
            </div>
            <div>
              <Eyebrow>Date</Eyebrow>
              <div
                style={{
                  fontSize: 13,
                  fontFamily: "DM Mono",
                  color: "var(--text-secondary)",
                }}
              >
                {ev.date}
              </div>
            </div>
          </div>
          {ev.proofDocument && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 10px",
                background: "var(--surface-02)",
                borderRadius: 6,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                <rect
                  x="3"
                  y="2"
                  width="14"
                  height="16"
                  rx="2"
                  stroke="var(--text-secondary)"
                  strokeWidth="1.5"
                />
                <path
                  d="M7 7h6M7 10h6M7 13h4"
                  stroke="var(--text-secondary)"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                />
              </svg>
              <span
                style={{
                  fontSize: 12,
                  color: "#2563eb",
                  fontFamily: "DM Mono",
                }}
              >
                {ev.proofDocument.name}
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                  marginLeft: "auto",
                  whiteSpace: "nowrap",
                }}
              >
                Uploaded {ev.proofDocument.uploadedAt}
              </span>
            </div>
          )}
          {ev.customerVerified === true && (
            <div
              style={{
                fontSize: 11,
                color: "var(--sem-success)",
                marginTop: 6,
              }}
            >
              ✓ Customer confirmed — verified by {ev.verifiedBy} on{" "}
              {ev.verifiedAt}
            </div>
          )}
          {ev.notes && (
            <div
              style={{
                fontSize: 12,
                color: "var(--text-secondary)",
                marginTop: 6,
                fontStyle: "italic",
                borderLeft: "3px solid var(--border-neutral)",
                paddingLeft: 8,
              }}
            >
              {ev.notes}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

/* ─── Assign Driver Modal ───────────────────────────────────── */
function AssignDriverModal({
  drivers,
  onClose,
  onAssign,
}: {
  drivers: DriverOption[]
  onClose: () => void
  onAssign: (id: string) => Promise<void>
}) {
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const filtered = drivers.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()),
  )

  async function handle() {
    if (!selected) return
    setLoading(true)
    await onAssign(selected)
    setLoading(false)
    onClose()
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        style={{
          background: "var(--bg-primary)",
          borderRadius: 14,
          width: 420,
          boxShadow: "0 16px 48px rgba(0,0,0,0.18)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "20px 24px 16px",
            borderBottom: "1px solid var(--border-neutral)",
          }}
        >
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "var(--text-primary)",
              fontFamily: "Inter",
            }}
          >
            Assign Delivery Person
          </div>
          <div
            style={{
              fontSize: 13,
              color: "var(--text-secondary)",
              marginTop: 4,
            }}
          >
            Select a driver to assign to this delivery.
          </div>
        </div>
        <div style={{ padding: "14px 24px 0" }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search drivers…"
            style={{
              width: "100%",
              height: 38,
              borderRadius: 7,
              border: "1px solid var(--border-neutral)",
              background: "var(--surface-01)",
              color: "var(--text-primary)",
              fontSize: 13,
              padding: "0 12px",
              fontFamily: "Inter",
              boxSizing: "border-box",
              outline: "none",
            }}
          />
        </div>
        <div
          style={{ padding: "10px 24px", maxHeight: 260, overflowY: "auto" }}
        >
          {filtered.map((d) => (
            <div
              key={d.id}
              onClick={() => d.available && setSelected(d.id)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 12px",
                borderRadius: 8,
                cursor: d.available ? "pointer" : "default",
                background: selected === d.id ? "#e8f5ee" : "transparent",
                border: `1.5px solid ${
                  selected === d.id ? "#2B4D3A" : "transparent"
                }`,
                marginBottom: 4,
                opacity: d.available ? 1 : 0.45,
                transition: "background 0.15s",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    fontFamily: "Inter",
                  }}
                >
                  {d.name}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--text-muted)",
                    fontFamily: "DM Mono",
                  }}
                >
                  {d.currentAssignments} active assignment
                  {d.currentAssignments !== 1 ? "s" : ""}
                </div>
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  fontFamily: "Inter",
                  color: d.available
                    ? "var(--sem-success)"
                    : "var(--text-muted)",
                }}
              >
                {d.available ? "Available" : "Unavailable"}
              </div>
            </div>
          ))}
          {!filtered.length && (
            <div
              style={{
                fontSize: 13,
                color: "var(--text-muted)",
                padding: "16px 0",
                textAlign: "center",
              }}
            >
              No matching drivers.
            </div>
          )}
        </div>
        <div
          style={{
            padding: "14px 24px 20px",
            display: "flex",
            gap: 10,
            justifyContent: "flex-end",
            borderTop: "1px solid var(--border-neutral)",
          }}
        >
          <button
            onClick={onClose}
            style={{
              height: 38,
              padding: "0 18px",
              borderRadius: 7,
              border: "1px solid var(--border-neutral)",
              background: "var(--surface-01)",
              color: "var(--text-primary)",
              fontSize: 13,
              fontWeight: 600,
              fontFamily: "Inter",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handle}
            disabled={!selected || loading}
            style={{
              height: 38,
              padding: "0 20px",
              borderRadius: 7,
              border: "none",
              background: selected ? "#2B4D3A" : "var(--border-neutral)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              fontFamily: "Inter",
              cursor: selected ? "pointer" : "default",
            }}
          >
            {loading ? "Assigning…" : "Assign Driver"}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Customer Verification Modal ───────────────────────────── */
function CustomerVerificationModal({
  delivery,
  event,
  onClose,
  onVerify,
}: {
  delivery: DeliveryRecord
  event: DeliveryEvent
  onClose: () => void
  onVerify: (confirmed: boolean, notes: string) => Promise<void>
}) {
  const [confirmed, setConfirmed] = useState<boolean | null>(null)
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)

  async function handle() {
    if (confirmed === null) return
    setLoading(true)
    await onVerify(confirmed, notes)
    setLoading(false)
    onClose()
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        style={{
          background: "var(--bg-primary)",
          borderRadius: 14,
          width: 500,
          boxShadow: "0 16px 48px rgba(0,0,0,0.18)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "20px 24px 16px",
            borderBottom: "1px solid var(--border-neutral)",
          }}
        >
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "var(--text-primary)",
              fontFamily: "Inter",
            }}
          >
            Customer Delivery Confirmation
          </div>
          <div
            style={{
              fontSize: 13,
              color: "var(--text-secondary)",
              marginTop: 4,
            }}
          >
            Call the customer and confirm that the delivered coffee was received
            before verifying this delivery.
          </div>
        </div>
        <div style={{ padding: "18px 24px" }}>
          <div
            style={{
              background: "var(--surface-01)",
              borderRadius: 8,
              padding: "12px 16px",
              marginBottom: 16,
              border: "1px solid var(--border-neutral)",
            }}
          >
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <div>
                <Eyebrow>Order</Eyebrow>
                <div
                  style={{
                    fontFamily: "DM Mono",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "var(--text-primary)",
                  }}
                >
                  {delivery.orderRef}
                </div>
              </div>
              <div>
                <Eyebrow>Customer</Eyebrow>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                  }}
                >
                  {delivery.customer.name}
                </div>
              </div>
              <div>
                <Eyebrow>Quantity</Eyebrow>
                <Qty>{event.quantity}</Qty>
              </div>
              <div>
                <Eyebrow>Driver</Eyebrow>
                <div style={{ fontSize: 13, color: "var(--text-primary)" }}>
                  {event.driver}
                </div>
              </div>
            </div>
            {event.proofDocument && (
              <div
                style={{
                  marginTop: 10,
                  fontSize: 12,
                  color: "#2563eb",
                  fontFamily: "DM Mono",
                }}
              >
                📄 {event.proofDocument.name}
              </div>
            )}
          </div>
          <div style={{ marginBottom: 14 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text-primary)",
                marginBottom: 8,
                fontFamily: "Inter",
              }}
            >
              Customer Confirmation
            </div>
            {([
              {
                value: true,
                label: "Customer Confirmed — delivery received as expected",
              },
              {
                value: false,
                label:
                  "Customer Did Not Confirm — quantity or condition disputed",
              },
            ] as const).map((opt) => (
              <label
                key={String(opt.value)}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  marginBottom: 8,
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  name="confirmation"
                  checked={confirmed === opt.value}
                  onChange={() => setConfirmed(opt.value)}
                  style={{
                    marginTop: 2,
                    accentColor: "#2B4D3A",
                    width: 15,
                    height: 15,
                  }}
                />
                <span
                  style={{
                    fontSize: 13,
                    color: "var(--text-primary)",
                    fontFamily: "Inter",
                  }}
                >
                  {opt.label}
                </span>
              </label>
            ))}
          </div>
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--text-secondary)",
                marginBottom: 6,
                fontFamily: "Inter",
              }}
            >
              Notes (optional)
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Add any notes about this verification…"
              style={{
                width: "100%",
                borderRadius: 7,
                border: "1px solid var(--border-neutral)",
                background: "var(--surface-01)",
                color: "var(--text-primary)",
                fontSize: 13,
                padding: "8px 12px",
                fontFamily: "Inter",
                resize: "vertical",
                boxSizing: "border-box",
                outline: "none",
              }}
            />
          </div>
        </div>
        <div
          style={{
            padding: "12px 24px 20px",
            display: "flex",
            gap: 10,
            justifyContent: "flex-end",
            borderTop: "1px solid var(--border-neutral)",
          }}
        >
          <button
            onClick={onClose}
            style={{
              height: 38,
              padding: "0 18px",
              borderRadius: 7,
              border: "1px solid var(--border-neutral)",
              background: "var(--surface-01)",
              color: "var(--text-primary)",
              fontSize: 13,
              fontWeight: 600,
              fontFamily: "Inter",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handle}
            disabled={confirmed === null || loading}
            style={{
              height: 38,
              padding: "0 20px",
              borderRadius: 7,
              border: "none",
              background:
                confirmed === null
                  ? "var(--border-neutral)"
                  : confirmed
                    ? "#2B4D3A"
                    : "var(--sem-danger)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              fontFamily: "Inter",
              cursor: confirmed !== null ? "pointer" : "default",
            }}
          >
            {loading
              ? "Submitting…"
              : confirmed === true
                ? "Confirm Delivery"
                : confirmed === false
                  ? "Mark as Disputed"
                  : "Submit"}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Dispute Review Modal ───────────────────────────────────── */
function DisputeReviewModal({
  delivery,
  onClose,
  onResolved,
}: {
  delivery: DeliveryRecord
  onClose: () => void
  onResolved: (msg: string) => void
}) {
  const [resolution, setResolution] =
    useState<"accept-delivery" | "reject-delivery" | "">("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)

  async function handle() {
    if (!resolution) return
    setLoading(true)
    await new Promise((r) => setTimeout(r, 1000))
    setLoading(false)
    onResolved(
      resolution === "accept-delivery"
        ? "Dispute resolved — delivery accepted."
        : "Dispute resolved — delivery rejected for re-attempt.",
    )
    onClose()
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        style={{
          background: "var(--bg-primary)",
          borderRadius: 14,
          width: 520,
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 16px 48px rgba(0,0,0,0.2)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "20px 24px 16px",
            borderBottom: "1px solid var(--border-neutral)",
            background: "#fff0f0",
          }}
        >
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "var(--sem-danger)",
              fontFamily: "Inter",
            }}
          >
            Delivery Dispute Review
          </div>
          <div
            style={{
              fontSize: 13,
              color: "var(--text-secondary)",
              marginTop: 4,
            }}
          >
            Review the dispute details and select a resolution. This action is
            recorded in the audit log.
          </div>
        </div>
        <div style={{ padding: "18px 24px" }}>
          <div
            style={{
              background: "var(--surface-01)",
              borderRadius: 8,
              padding: "14px 16px",
              border: "1px solid var(--border-neutral)",
              marginBottom: 16,
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill,minmax(120px,1fr))",
                gap: "10px 16px",
              }}
            >
              <div>
                <Eyebrow>Order</Eyebrow>
                <div
                  style={{
                    fontFamily: "DM Mono",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "var(--text-primary)",
                  }}
                >
                  {delivery.orderRef}
                </div>
              </div>
              <div>
                <Eyebrow>Customer</Eyebrow>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                  }}
                >
                  {delivery.customer.name}
                </div>
              </div>
              <div>
                <Eyebrow>Ordered</Eyebrow>
                <Qty>{delivery.orderedQty}</Qty>
              </div>
              <div>
                <Eyebrow>Delivered</Eyebrow>
                <Qty>{delivery.deliveredQty}</Qty>
              </div>
              <div>
                <Eyebrow>Driver</Eyebrow>
                <div style={{ fontSize: 13, color: "var(--text-primary)" }}>
                  {delivery.assignedDriver ?? "—"}
                </div>
              </div>
              <div>
                <Eyebrow>Branch</Eyebrow>
                <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                  {delivery.customer.branch ?? "—"}
                </div>
              </div>
            </div>
            {delivery.events.map((ev) =>
              ev.notes ? (
                <div
                  key={ev.id}
                  style={{
                    marginTop: 10,
                    padding: "8px 12px",
                    background: "#fff0f0",
                    borderRadius: 6,
                    fontSize: 12,
                    color: "var(--sem-danger)",
                    fontStyle: "italic",
                  }}
                >
                  {ev.notes}
                </div>
              ) : null,
            )}
          </div>
          <div style={{ marginBottom: 14 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text-primary)",
                marginBottom: 8,
                fontFamily: "Inter",
              }}
            >
              Resolution
            </div>
            {([
              {
                value: "accept-delivery",
                label: "Accept delivery — customer confirmation issue resolved",
                desc: "Marks the delivery as verified and closes the dispute.",
              },
              {
                value: "reject-delivery",
                label: "Reject delivery — schedule re-attempt",
                desc: "Returns the order to an active delivery state for another attempt.",
              },
            ] as const).map((opt) => (
              <label
                key={opt.value}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  marginBottom: 10,
                  cursor: "pointer",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: `1.5px solid ${
                    resolution === opt.value
                      ? opt.value === "accept-delivery"
                        ? "#2B4D3A"
                        : "var(--sem-danger)"
                      : "var(--border-neutral)"
                  }`,
                  background:
                    resolution === opt.value
                      ? opt.value === "accept-delivery"
                        ? "#e8f5ee"
                        : "#fff0f0"
                      : "transparent",
                  transition: "all 0.15s",
                }}
              >
                <input
                  type="radio"
                  name="resolution"
                  checked={resolution === opt.value}
                  onChange={() => setResolution(opt.value)}
                  style={{
                    marginTop: 3,
                    accentColor: "#2B4D3A",
                    width: 14,
                    height: 14,
                    flexShrink: 0,
                  }}
                />
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      fontFamily: "Inter",
                    }}
                  >
                    {opt.label}
                  </div>
                  <div
                    style={{
                      fontSize: 11.5,
                      color: "var(--text-secondary)",
                      marginTop: 2,
                    }}
                  >
                    {opt.desc}
                  </div>
                </div>
              </label>
            ))}
          </div>
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--text-secondary)",
                marginBottom: 6,
                fontFamily: "Inter",
              }}
            >
              Notes (required for audit)
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Describe the outcome and supporting evidence reviewed…"
              style={{
                width: "100%",
                borderRadius: 7,
                border: "1px solid var(--border-neutral)",
                background: "var(--surface-01)",
                color: "var(--text-primary)",
                fontSize: 13,
                padding: "8px 12px",
                fontFamily: "Inter",
                resize: "vertical",
                boxSizing: "border-box",
                outline: "none",
              }}
            />
          </div>
        </div>
        <div
          style={{
            padding: "12px 24px 20px",
            display: "flex",
            gap: 10,
            justifyContent: "flex-end",
            borderTop: "1px solid var(--border-neutral)",
          }}
        >
          <button
            onClick={onClose}
            style={{
              height: 38,
              padding: "0 18px",
              borderRadius: 7,
              border: "1px solid var(--border-neutral)",
              background: "var(--surface-01)",
              color: "var(--text-primary)",
              fontSize: 13,
              fontWeight: 600,
              fontFamily: "Inter",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handle}
            disabled={!resolution || loading}
            style={{
              height: 38,
              padding: "0 20px",
              borderRadius: 7,
              border: "none",
              background: !resolution
                ? "var(--border-neutral)"
                : resolution === "accept-delivery"
                  ? "#2B4D3A"
                  : "var(--sem-danger)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              fontFamily: "Inter",
              cursor: resolution ? "pointer" : "default",
            }}
          >
            {loading ? "Submitting…" : "Submit Resolution"}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Manager Detail View ────────────────────────────────────── */
function ManagerDetailView({
  delivery,
  role,
  onBack,
  onRefresh,
}: {
  delivery: DeliveryRecord
  role: string
  onBack: () => void
  onRefresh: () => void
}) {
  const [showAssign, setShowAssign] = useState(false)
  const [showVerify, setShowVerify] = useState(false)
  const [showDispute, setShowDispute] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const awaitingEvent = delivery.events.find(
    (e) => e.status === "awaiting-confirmation",
  )
  const isPartial = delivery.deliveryStatus === "partially-delivered"
  const isDisputed = delivery.deliveryStatus === "delivery-disputed"
  const isAwaiting = delivery.deliveryStatus === "awaiting-confirmation"

  function fire(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function handleAssign(driverId: string) {
    const drv = delivery.availableDrivers?.find((d) => d.id === driverId)
    await assignDriver(delivery.id, driverId)
    fire(`Driver ${drv?.name ?? ""} assigned.`)
    onRefresh()
  }

  async function handleVerify(confirmed: boolean, notes: string) {
    if (!awaitingEvent) return
    await verifyCustomerAcceptance(
      delivery.id,
      awaitingEvent.id,
      confirmed,
      notes,
    )
    fire(confirmed ? "Delivery confirmed." : "Delivery marked as disputed.")
    onRefresh()
  }

  return (
    <div>
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            zIndex: 2000,
            background: "#2B4D3A",
            color: "#fff",
            padding: "12px 20px",
            borderRadius: 8,
            fontSize: 13,
            fontFamily: "Inter",
            fontWeight: 600,
            boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
            animation: "fadeIn 0.2s ease",
          }}
        >
          {toast}
        </div>
      )}

      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={onBack}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            height: 36,
            padding: "0 14px",
            borderRadius: 7,
            border: "1px solid var(--border-neutral)",
            background: "var(--surface-01)",
            color: "var(--text-primary)",
            fontSize: 13,
            fontWeight: 600,
            fontFamily: "Inter",
            cursor: "pointer",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path
              d="M10 3L5 8l5 5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back to Deliveries
        </button>
        <RefBadge>{delivery.ref}</RefBadge>
        <span
          style={{
            fontFamily: "DM Mono",
            fontSize: 12,
            color: "var(--text-muted)",
          }}
        >
          {delivery.orderRef}
        </span>
        {delivery.urgent && <UrgentBadge />}
        <StatusBadge status={delivery.deliveryStatus} />
        <PaymentBadge status={delivery.paymentStatus} />
      </div>

      {/* FULLY DELIVERED ≠ PAID banner */}
      <div
        style={{
          background: "#fffbeb",
          border: "1px solid #fde68a",
          borderRadius: 8,
          padding: "9px 14px",
          marginBottom: 16,
          fontSize: 12,
          color: "#92400e",
          fontFamily: "Inter",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
          <path
            d="M10 3L18 17H2L10 3z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M10 9v3M10 14h.01"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
        <strong>Important:</strong>&nbsp;Delivery status and payment status are
        tracked separately. A fully delivered order does not mean payment has
        been received.
      </div>

      {/* Two-column layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 320px",
          gap: 18,
          alignItems: "start",
        }}
      >
        {/* LEFT */}
        <div>
          {/* Order summary */}
          <Card style={{ marginBottom: 14 }}>
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "var(--text-primary)",
                fontFamily: "Inter",
                marginBottom: 4,
              }}
            >
              {delivery.customer.name}
            </div>
            {delivery.customer.branch && (
              <div
                style={{
                  fontSize: 12,
                  color: "var(--text-secondary)",
                  marginBottom: 10,
                }}
              >
                {delivery.customer.branch}
              </div>
            )}

            {/* Qty — all opaque backend strings, NEVER calculated */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3,1fr)",
                gap: 10,
                marginBottom: 12,
              }}
            >
              {([
                { label: "Ordered", val: delivery.orderedQty },
                { label: "Delivered", val: delivery.deliveredQty },
                { label: "Remaining", val: delivery.remainingQty },
              ] as const).map((row) => (
                <div
                  key={row.label}
                  style={{
                    background: "var(--surface-02)",
                    borderRadius: 8,
                    padding: "10px 12px",
                  }}
                >
                  <Eyebrow>{row.label}</Eyebrow>
                  <span
                    style={{
                      fontFamily: "DM Mono",
                      fontSize: 18,
                      fontWeight: 700,
                      color: "var(--text-primary)",
                    }}
                  >
                    {row.val}
                  </span>
                </div>
              ))}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
              }}
            >
              <div>
                <Eyebrow>Delivery Address</Eyebrow>
                <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                  {delivery.deliveryAddress}
                </div>
              </div>
              <div>
                <Eyebrow>Contact</Eyebrow>
                <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                  {delivery.customer.contactName} ·{" "}
                  {delivery.customer.contactPhone}
                </div>
              </div>
              {delivery.scheduledDate && (
                <div>
                  <Eyebrow>Scheduled</Eyebrow>
                  <div
                    style={{
                      fontSize: 12,
                      fontFamily: "DM Mono",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {delivery.scheduledDate}
                  </div>
                </div>
              )}
              <div>
                <Eyebrow>Sales Rep</Eyebrow>
                <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                  {delivery.salesRep}
                </div>
              </div>
            </div>
          </Card>

          {/* Partial delivery notice */}
          {isPartial && (
            <div
              style={{
                background: "#fffbeb",
                border: "1px solid #fde68a",
                borderRadius: 8,
                padding: "10px 14px",
                marginBottom: 14,
                fontSize: 12,
                color: "#92400e",
                fontFamily: "Inter",
              }}
            >
              <strong>Multiple deliveries — one sales order.</strong> This order
              has been partially fulfilled. The remaining quantity (
              {delivery.remainingQty}) is still active and additional delivery
              runs are expected. All delivery events below belong to order{" "}
              {delivery.orderRef}.
            </div>
          )}

          {/* Delivery events */}
          {delivery.events.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  marginBottom: 10,
                  fontFamily: "Inter",
                }}
              >
                Delivery Events
              </div>
              <DeliveryEventsList events={delivery.events} />
            </div>
          )}

          {/* Awaiting confirmation panel */}
          {isAwaiting && awaitingEvent && (
            <div
              style={{
                background: "#fffbeb",
                border: "1.5px solid #fde68a",
                borderRadius: 10,
                padding: "16px 18px",
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#92400e",
                  marginBottom: 6,
                  fontFamily: "Inter",
                }}
              >
                ⏳ Customer Confirmation Required
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "#92400e",
                  marginBottom: 12,
                  lineHeight: 1.5,
                }}
              >
                Customer confirmation is required before this delivery is
                considered verified. Call the customer and confirm that the
                delivered coffee was received before verifying this delivery.
              </div>
              {can(role as any, "delivery.customer-verify") && (
                <button
                  onClick={() => setShowVerify(true)}
                  style={{
                    height: 40,
                    padding: "0 20px",
                    borderRadius: 7,
                    border: "none",
                    background: "#2B4D3A",
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 700,
                    fontFamily: "Inter",
                    cursor: "pointer",
                  }}
                >
                  Verify Customer Acceptance
                </button>
              )}
            </div>
          )}

          {/* Disputed panel */}
          {isDisputed && (
            <div
              style={{
                background: "#fff0f0",
                border: "1.5px solid #fecaca",
                borderRadius: 10,
                padding: "16px 18px",
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "var(--sem-danger)",
                  marginBottom: 6,
                  fontFamily: "Inter",
                }}
              >
                ⚠ Delivery Disputed
              </div>
              {delivery.events.map((ev) =>
                ev.notes ? (
                  <div
                    key={ev.id}
                    style={{
                      fontSize: 13,
                      color: "var(--sem-danger)",
                      marginBottom: 8,
                    }}
                  >
                    {ev.notes}
                  </div>
                ) : null,
              )}
              <div
                style={{
                  fontSize: 12,
                  color: "var(--text-secondary)",
                  marginBottom: 10,
                }}
              >
                This delivery is under investigation. Review the timeline and
                contact both the driver and customer to resolve the discrepancy.
              </div>
              {can(role as any, "delivery.dispute") && (
                <button
                  onClick={() => setShowDispute(true)}
                  style={{
                    height: 38,
                    padding: "0 16px",
                    borderRadius: 7,
                    border: "none",
                    background: "var(--sem-danger)",
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 700,
                    fontFamily: "Inter",
                    cursor: "pointer",
                  }}
                >
                  Review &amp; Resolve Dispute
                </button>
              )}
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div>
          {/* Driver assignment */}
          <Card style={{ marginBottom: 14 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "var(--text-primary)",
                marginBottom: 10,
                fontFamily: "Inter",
              }}
            >
              Driver Assignment
            </div>
            {delivery.assignedDriver ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "#2B4D3A",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: 14,
                    fontWeight: 700,
                    fontFamily: "Inter",
                    flexShrink: 0,
                  }}
                >
                  {delivery.assignedDriver[0]}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      fontFamily: "Inter",
                    }}
                  >
                    {delivery.assignedDriver}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted)",
                      fontFamily: "DM Mono",
                    }}
                  >
                    Assigned Driver
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-secondary)",
                    marginBottom: 10,
                  }}
                >
                  No driver assigned yet.
                </div>
                {can(role as any, "delivery.assign-driver") && (
                  <button
                    onClick={() => setShowAssign(true)}
                    style={{
                      height: 40,
                      padding: "0 18px",
                      borderRadius: 7,
                      border: "none",
                      background: "#2B4D3A",
                      color: "#fff",
                      fontSize: 13,
                      fontWeight: 700,
                      fontFamily: "Inter",
                      cursor: "pointer",
                      width: "100%",
                    }}
                  >
                    Assign Delivery Person
                  </button>
                )}
              </div>
            )}
          </Card>

          {/* Timeline */}
          <Card>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "var(--text-primary)",
                marginBottom: 14,
                fontFamily: "Inter",
              }}
            >
              Operational Timeline
            </div>
            <OperationalTimeline events={delivery.timeline} />
          </Card>
        </div>
      </div>

      {showAssign && (
        <AssignDriverModal
          drivers={delivery.availableDrivers ?? []}
          onClose={() => setShowAssign(false)}
          onAssign={handleAssign}
        />
      )}
      {showVerify && awaitingEvent && (
        <CustomerVerificationModal
          delivery={delivery}
          event={awaitingEvent}
          onClose={() => setShowVerify(false)}
          onVerify={handleVerify}
        />
      )}
      {showDispute && (
        <DisputeReviewModal
          delivery={delivery}
          onClose={() => setShowDispute(false)}
          onResolved={(msg) => {
            fire(msg)
            onRefresh()
          }}
        />
      )}
    </div>
  )
}

/* ─── Delivery Staff — card ─────────────────────────────────── */
function StaffCard({
  delivery,
  onSelect,
}: {
  delivery: DeliveryRecord
  onSelect: (d: DeliveryRecord) => void
}) {
  const s = delivery.deliveryStatus
  const btnLabel =
    s === "assigned"
      ? "Start Delivery"
      : s === "out-for-delivery"
        ? "Upload Proof"
        : s === "awaiting-confirmation"
          ? "Awaiting Confirmation"
          : "View Details"
  const btnBg = s === "awaiting-confirmation" ? "#d97706" : "#2B4D3A"
  return (
    <div
      style={{
        background: "var(--surface-01)",
        border: "1px solid var(--border-neutral)",
        borderRadius: 12,
        padding: "18px 18px 14px",
        marginBottom: 12,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 10,
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 4,
            }}
          >
            <RefBadge>{delivery.ref}</RefBadge>
            <span
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                fontFamily: "DM Mono",
              }}
            >
              {delivery.orderRef}
            </span>
            {delivery.urgent && <UrgentBadge />}
          </div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "var(--text-primary)",
              fontFamily: "Inter",
            }}
          >
            {delivery.customer.name}
          </div>
          {delivery.customer.branch && (
            <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              {delivery.customer.branch}
            </div>
          )}
        </div>
        <StatusBadge status={delivery.deliveryStatus} />
      </div>
      <div
        style={{
          background: "var(--surface-02)",
          borderRadius: 8,
          padding: "10px 12px",
          marginBottom: 12,
        }}
      >
        <div
          style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 2 }}
        >
          📍 {delivery.deliveryAddress}
        </div>
        <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
          Contact: <strong>{delivery.customer.contactName}</strong> ·{" "}
          {delivery.customer.contactPhone}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <Eyebrow>Quantity</Eyebrow>
          <Qty>{delivery.orderedQty}</Qty>
        </div>
        <button
          onClick={() => onSelect(delivery)}
          style={{
            minHeight: 48,
            padding: "0 22px",
            borderRadius: 9,
            border: "none",
            background: btnBg,
            color: "#fff",
            fontSize: 14,
            fontWeight: 700,
            fontFamily: "Inter",
            cursor: "pointer",
          }}
        >
          {btnLabel}
        </button>
      </div>
    </div>
  )
}

/* ─── Delivery Staff — Detail ───────────────────────────────── */
function StaffDetailView({
  delivery,
  onBack,
  onRefresh,
}: {
  delivery: DeliveryRecord
  onBack: () => void
  onRefresh: () => void
}) {
  const [startLoading, setStartLoading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadState, setUploadState] =
    useState<"idle" | "uploading" | "uploaded" | "error">("idle")
  const [showFailed, setShowFailed] = useState(false)
  const [failReason, setFailReason] = useState("")
  const [failNotes, setFailNotes] = useState("")
  const [failLoading, setFailLoading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function fire(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3200)
  }

  async function handleStart() {
    setStartLoading(true)
    await startDelivery(delivery.id)
    setStartLoading(false)
    fire("Delivery started. Status updated to Out for Delivery.")
    onRefresh()
  }

  async function handleFile(file: File) {
    setUploadedFile(file)
    setUploadState("uploading")
    const ev = delivery.events[0]
    const res = await uploadProofDocument(delivery.id, ev?.id ?? "new", file)
    if (res.state === "ok") {
      setUploadState("uploaded")
      fire("Proof document uploaded.")
    } else setUploadState("error")
  }

  async function handleFailed() {
    if (!failReason) return
    setFailLoading(true)
    await reportFailedAttempt(delivery.id, failReason, failNotes)
    setFailLoading(false)
    setShowFailed(false)
    fire("Failed attempt recorded.")
    onRefresh()
  }

  const isAssigned = delivery.deliveryStatus === "assigned"
  const isOutDelivery = delivery.deliveryStatus === "out-for-delivery"

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 20,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 2000,
            background: "#2B4D3A",
            color: "#fff",
            padding: "12px 24px",
            borderRadius: 8,
            fontSize: 13,
            fontFamily: "Inter",
            fontWeight: 600,
            boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
          }}
        >
          {toast}
        </div>
      )}
      <button
        onClick={onBack}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          height: 44,
          padding: "0 16px",
          borderRadius: 8,
          border: "1px solid var(--border-neutral)",
          background: "var(--surface-01)",
          color: "var(--text-primary)",
          fontSize: 14,
          fontWeight: 600,
          fontFamily: "Inter",
          cursor: "pointer",
          marginBottom: 16,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M10 3L5 8l5 5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Back
      </button>

      {/* Order card */}
      <Card style={{ marginBottom: 14 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 12,
          }}
        >
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
              <RefBadge>{delivery.ref}</RefBadge>
              <span
                style={{
                  fontFamily: "DM Mono",
                  fontSize: 12,
                  color: "var(--text-muted)",
                }}
              >
                {delivery.orderRef}
              </span>
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "var(--text-primary)",
                fontFamily: "Inter",
              }}
            >
              {delivery.customer.name}
            </div>
            {delivery.customer.branch && (
              <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                {delivery.customer.branch}
              </div>
            )}
          </div>
          <StatusBadge status={delivery.deliveryStatus} />
        </div>
        <div
          style={{
            background: "var(--surface-02)",
            borderRadius: 8,
            padding: "10px 12px",
            marginBottom: 10,
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: "var(--text-muted)",
              marginBottom: 2,
            }}
          >
            📍 Delivery Address
          </div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--text-primary)",
              fontFamily: "Inter",
            }}
          >
            {delivery.deliveryAddress}
          </div>
        </div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <div>
            <Eyebrow>Contact</Eyebrow>
            <div style={{ fontSize: 13, color: "var(--text-primary)" }}>
              {delivery.customer.contactName}
            </div>
            <div
              style={{ fontSize: 13, fontFamily: "DM Mono", color: "#2563eb" }}
            >
              {delivery.customer.contactPhone}
            </div>
          </div>
          <div>
            <Eyebrow>Quantity</Eyebrow>
            <span
              style={{
                fontFamily: "DM Mono",
                fontSize: 18,
                fontWeight: 700,
                color: "var(--text-primary)",
              }}
            >
              {delivery.orderedQty}
            </span>
          </div>
          {delivery.scheduledDate && (
            <div>
              <Eyebrow>Scheduled</Eyebrow>
              <div
                style={{
                  fontSize: 13,
                  fontFamily: "DM Mono",
                  color: "var(--text-secondary)",
                }}
              >
                {delivery.scheduledDate}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Start delivery */}
      {isAssigned && (
        <Card style={{ marginBottom: 14 }}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: 6,
              fontFamily: "Inter",
            }}
          >
            Ready to Depart
          </div>
          <div
            style={{
              fontSize: 13,
              color: "var(--text-secondary)",
              marginBottom: 16,
            }}
          >
            Review the details above, then tap START DELIVERY when you are en
            route.
          </div>
          <button
            onClick={handleStart}
            disabled={startLoading}
            style={{
              width: "100%",
              height: 56,
              borderRadius: 10,
              border: "none",
              background: startLoading ? "#6b7c72" : "#2B4D3A",
              color: "#fff",
              fontSize: 18,
              fontWeight: 800,
              fontFamily: "Inter",
              cursor: startLoading ? "default" : "pointer",
              letterSpacing: "0.04em",
            }}
          >
            {startLoading ? "Starting…" : "START DELIVERY"}
          </button>
        </Card>
      )}

      {/* Document upload */}
      {isOutDelivery && (
        <Card style={{ marginBottom: 14 }}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: 4,
              fontFamily: "Inter",
            }}
          >
            Customer Acceptance
          </div>
          <div
            style={{
              fontSize: 13,
              color: "var(--text-secondary)",
              marginBottom: 14,
            }}
          >
            Upload the signed customer delivery document after the customer
            receives the goods.
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,application/pdf"
            style={{ display: "none" }}
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleFile(f)
            }}
          />
          {uploadState === "uploaded" && uploadedFile ? (
            <div
              style={{
                border: "2px solid var(--sem-success)",
                borderRadius: 10,
                padding: "16px",
                display: "flex",
                alignItems: "center",
                gap: 12,
                background: "#e8f5ee",
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="var(--sem-success)" />
                <path
                  d="M7 12l4 4 6-6"
                  stroke="#fff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    fontFamily: "Inter",
                  }}
                >
                  {uploadedFile.name}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--text-muted)",
                    fontFamily: "DM Mono",
                  }}
                >
                  {(uploadedFile.size / 1024).toFixed(1)} KB
                </div>
              </div>
              <button
                onClick={() => {
                  setUploadedFile(null)
                  setUploadState("idle")
                }}
                style={{
                  fontSize: 12,
                  color: "var(--text-muted)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "Inter",
                }}
              >
                Replace
              </button>
            </div>
          ) : uploadState === "uploading" ? (
            <div
              style={{
                border: "2px dashed var(--border-neutral)",
                borderRadius: 10,
                padding: "32px 16px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                Uploading…
              </div>
            </div>
          ) : uploadState === "error" ? (
            <div
              style={{
                border: "2px dashed var(--sem-danger)",
                borderRadius: 10,
                padding: "24px 16px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  color: "var(--sem-danger)",
                  marginBottom: 8,
                }}
              >
                Upload failed. Please try again.
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                style={{
                  height: 40,
                  padding: "0 20px",
                  borderRadius: 7,
                  border: "none",
                  background: "var(--sem-danger)",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: "Inter",
                  cursor: "pointer",
                }}
              >
                Retry
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              style={{
                width: "100%",
                border: "2px dashed var(--border-neutral)",
                borderRadius: 10,
                padding: "32px 16px",
                background: "var(--surface-02)",
                cursor: "pointer",
                textAlign: "center",
              }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                style={{ margin: "0 auto 8px", display: "block" }}
              >
                <rect width="32" height="32" rx="8" fill="var(--surface-01)" />
                <path
                  d="M16 10v12M10 16l6-6 6 6"
                  stroke="var(--text-muted)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  fontFamily: "Inter",
                }}
              >
                Upload signed customer document
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--text-muted)",
                  marginTop: 4,
                }}
              >
                PDF or image — tap to browse
              </div>
            </button>
          )}
        </Card>
      )}

      {/* Failed attempt */}
      {(isAssigned || isOutDelivery) && (
        <div style={{ marginBottom: 80 }}>
          <button
            onClick={() => setShowFailed((v) => !v)}
            style={{
              width: "100%",
              height: 44,
              borderRadius: 8,
              border: "1px solid var(--sem-danger)",
              background: "transparent",
              color: "var(--sem-danger)",
              fontSize: 14,
              fontWeight: 700,
              fontFamily: "Inter",
              cursor: "pointer",
            }}
          >
            {showFailed ? "Cancel" : "Report Failed Delivery Attempt"}
          </button>
          {showFailed && (
            <div
              style={{
                background: "#fff0f0",
                border: "1.5px solid #fecaca",
                borderRadius: 10,
                padding: "16px",
                marginTop: 10,
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "var(--sem-danger)",
                  marginBottom: 10,
                  fontFamily: "Inter",
                }}
              >
                Failed Attempt Details
              </div>
              <div style={{ marginBottom: 10 }}>
                <Eyebrow>Reason</Eyebrow>
                <select
                  value={failReason}
                  onChange={(e) => setFailReason(e.target.value)}
                  style={{
                    width: "100%",
                    height: 42,
                    borderRadius: 7,
                    border: "1px solid var(--border-neutral)",
                    background: "var(--bg-primary)",
                    color: "var(--text-primary)",
                    fontSize: 13,
                    padding: "0 10px",
                    fontFamily: "Inter",
                    outline: "none",
                    marginTop: 4,
                  }}
                >
                  <option value="">Select a reason…</option>
                  <option value="customer-unavailable">
                    Customer unavailable
                  </option>
                  <option value="incorrect-address">Incorrect address</option>
                  <option value="customer-refused">
                    Customer refused delivery
                  </option>
                  <option value="logistics-issue">Logistics issue</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div style={{ marginBottom: 12 }}>
                <Eyebrow>Notes</Eyebrow>
                <textarea
                  value={failNotes}
                  onChange={(e) => setFailNotes(e.target.value)}
                  rows={3}
                  placeholder="Describe what happened…"
                  style={{
                    width: "100%",
                    borderRadius: 7,
                    border: "1px solid var(--border-neutral)",
                    background: "var(--bg-primary)",
                    color: "var(--text-primary)",
                    fontSize: 13,
                    padding: "8px 10px",
                    fontFamily: "Inter",
                    resize: "vertical",
                    boxSizing: "border-box",
                    outline: "none",
                    marginTop: 4,
                  }}
                />
              </div>
              <button
                onClick={handleFailed}
                disabled={!failReason || failLoading}
                style={{
                  height: 44,
                  width: "100%",
                  borderRadius: 8,
                  border: "none",
                  background: failReason
                    ? "var(--sem-danger)"
                    : "var(--border-neutral)",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: "Inter",
                  cursor: failReason ? "pointer" : "default",
                }}
              >
                {failLoading ? "Submitting…" : "Submit Failed Attempt"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── Manager List — desktop table ──────────────────────────── */
const TH_COLS = [
  "Order",
  "Customer",
  "Branch",
  "Sales Rep",
  "Driver",
  "Delivery Status",
  "Ordered",
  "Delivered",
  "Remaining",
  "Scheduled",
  "Payment",
  "",
]

function ManagerTable({
  deliveries,
  onSelect,
}: {
  deliveries: DeliveryRecord[]
  onSelect: (d: DeliveryRecord) => void
}) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 13,
          fontFamily: "Inter",
        }}
      >
        <thead>
          <tr
            style={{
              background: "var(--surface-01)",
              borderBottom: "1px solid var(--border-neutral)",
            }}
          >
            {TH_COLS.map((h) => (
              <th
                key={h}
                style={{
                  padding: "10px 14px",
                  textAlign: "left",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  fontFamily: "DM Mono",
                  letterSpacing: "0.07em",
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {deliveries.map((d, i) => (
            <tr
              key={d.id}
              onClick={() => onSelect(d)}
              style={{
                background:
                  i % 2 === 0 ? "var(--bg-primary)" : "var(--surface-01)",
                borderBottom: "1px solid var(--border-neutral)",
                cursor: "pointer",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--surface-02)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background =
                  i % 2 === 0 ? "var(--bg-primary)" : "var(--surface-01)")
              }
            >
              <td style={{ padding: "11px 14px", whiteSpace: "nowrap" }}>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 2 }}
                >
                  <RefBadge>{d.ref}</RefBadge>
                  <span
                    style={{
                      fontFamily: "DM Mono",
                      fontSize: 11,
                      color: "var(--text-muted)",
                    }}
                  >
                    {d.orderRef}
                  </span>
                  {d.urgent && <UrgentBadge />}
                </div>
              </td>
              <td style={{ padding: "11px 14px" }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                  }}
                >
                  {d.customer.name}
                </div>
              </td>
              <td
                style={{
                  padding: "11px 14px",
                  color: "var(--text-secondary)",
                  whiteSpace: "nowrap",
                }}
              >
                {d.customer.branch ?? "—"}
              </td>
              <td
                style={{
                  padding: "11px 14px",
                  color: "var(--text-secondary)",
                  whiteSpace: "nowrap",
                }}
              >
                {d.salesRep}
              </td>
              <td
                style={{
                  padding: "11px 14px",
                  color: d.assignedDriver
                    ? "var(--text-secondary)"
                    : "var(--text-muted)",
                  whiteSpace: "nowrap",
                }}
              >
                {d.assignedDriver ?? "Unassigned"}
              </td>
              <td style={{ padding: "11px 14px" }}>
                <StatusBadge status={d.deliveryStatus} />
              </td>
              <td
                style={{
                  padding: "11px 14px",
                  fontFamily: "DM Mono",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  whiteSpace: "nowrap",
                }}
              >
                {d.orderedQty}
              </td>
              <td
                style={{
                  padding: "11px 14px",
                  fontFamily: "DM Mono",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  whiteSpace: "nowrap",
                }}
              >
                {d.deliveredQty}
              </td>
              <td
                style={{
                  padding: "11px 14px",
                  fontFamily: "DM Mono",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  whiteSpace: "nowrap",
                }}
              >
                {d.remainingQty}
              </td>
              <td
                style={{
                  padding: "11px 14px",
                  fontFamily: "DM Mono",
                  fontSize: 12,
                  color: "var(--text-secondary)",
                  whiteSpace: "nowrap",
                }}
              >
                {d.scheduledDate ?? "—"}
              </td>
              <td style={{ padding: "11px 14px" }}>
                <PaymentBadge status={d.paymentStatus} />
              </td>
              <td style={{ padding: "11px 14px" }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelect(d)
                  }}
                  style={{
                    height: 30,
                    padding: "0 12px",
                    borderRadius: 6,
                    border: "1px solid var(--border-neutral)",
                    background: "var(--surface-01)",
                    color: "var(--text-primary)",
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: "Inter",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  View →
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ─── Main component ─────────────────────────────────────────── */
export default function Delivery() {
  const { currentUser } = useAuth()
  const { isNarrow } = useBreakpoint()
  const role = currentUser?.role ?? "viewer"

  const [view, setView] = useState<View>("list")
  const [selectedId, setSelectedId] = useState<string | null>(null)

  /* List */
  const [summary, setSummary] = useState<DeliverySummary | null>(null)
  const [sumLoading, setSumLoading] = useState(true)
  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>([])
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<DeliveryStatus | "">("")

  /* Detail */
  const [detail, setDetail] = useState<DeliveryRecord | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)

  const isStaff = role === "delivery-staff"

  const fetchSummary = useCallback(async () => {
    setSumLoading(true)
    const r = await getDeliverySummary()
    if (r.state === "ok" && r.data) setSummary(r.data)
    setSumLoading(false)
  }, [])

  const fetchList = useCallback(async () => {
    setListLoading(true)
    setListError(null)
    const r = await listDeliveries(
      search || statusFilter
        ? {
            search: search || undefined,
            status: statusFilter as DeliveryStatus || undefined,
          }
        : undefined,
    )
    if (r.state === "ok" && r.data) setDeliveries(r.data)
    else setListError(r.error ?? "Failed to load deliveries.")
    setListLoading(false)
  }, [search, statusFilter])

  const fetchDetail = useCallback(async (id: string) => {
    setDetailLoading(true)
    setDetailError(null)
    const r = await getDelivery(id)
    if (r.state === "ok" && r.data) setDetail(r.data)
    else setDetailError(r.error ?? "Failed to load delivery.")
    setDetailLoading(false)
  }, [])

  useEffect(() => {
    if (!can(role as any, "delivery.view")) return
    fetchSummary()
    fetchList()
  }, [fetchSummary, fetchList, role])

  useEffect(() => {
    if (view === "detail" && selectedId) fetchDetail(selectedId)
  }, [view, selectedId, fetchDetail])

  function openDetail(d: DeliveryRecord) {
    setDetail(d) // optimistic
    setSelectedId(d.id)
    setView("detail")
  }

  function goBack() {
    setView("list")
    setSelectedId(null)
    setDetail(null)
    fetchList()
  }

  function refresh() {
    if (selectedId) fetchDetail(selectedId)
    fetchList()
    if (!isStaff) fetchSummary()
  }

  const PAGE_PAD = isNarrow ? 16 : 24

  /* Permission gate */
  if (!can(role as any, "delivery.view")) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "60vh",
          flexDirection: "column",
          gap: 12,
          color: "var(--text-muted)",
          fontFamily: "Inter",
        }}
      >
        <svg
          width="48"
          height="48"
          viewBox="0 0 48 48"
          fill="none"
          style={{ opacity: 0.3 }}
        >
          <rect
            x="8"
            y="16"
            width="32"
            height="26"
            rx="4"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M16 16v-6a8 8 0 1116 0v6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        <div style={{ fontSize: 16, fontWeight: 600 }}>
          You do not have access to the Delivery module.
        </div>
      </div>
    )
  }

  const KEYFRAMES = `
    @keyframes shimmer { from { background-position: 200% 0 } to { background-position: -200% 0 } }
    @keyframes pulse { 0%,100% { box-shadow: 0 0 0 4px rgba(37,99,235,0.18) } 50% { box-shadow: 0 0 0 8px rgba(37,99,235,0.06) } }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(-6px) } to { opacity: 1; transform: none } }
  `

  /* ── DETAIL VIEW ── */
  if (view === "detail") {
    if (detailLoading && !detail) {
      return (
        <div style={{ padding: PAGE_PAD }}>
          <style>{KEYFRAMES}</style>
          <div
            style={{
              maxWidth: 900,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} h={70} />
            ))}
          </div>
        </div>
      )
    }
    if (detailError && !detail) {
      return (
        <div style={{ padding: PAGE_PAD }}>
          <style>{KEYFRAMES}</style>
          <div
            style={{
              background: "#fff0f0",
              border: "1px solid #fecaca",
              borderRadius: 8,
              padding: "14px 18px",
              color: "var(--sem-danger)",
              fontFamily: "Inter",
              marginBottom: 12,
            }}
          >
            {detailError}
            <button
              onClick={() => selectedId && fetchDetail(selectedId)}
              style={{
                marginLeft: 12,
                fontSize: 13,
                color: "#2563eb",
                background: "none",
                border: "none",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Retry
            </button>
          </div>
          <button
            onClick={goBack}
            style={{
              height: 38,
              padding: "0 16px",
              borderRadius: 7,
              border: "1px solid var(--border-neutral)",
              background: "var(--surface-01)",
              color: "var(--text-primary)",
              fontSize: 13,
              fontWeight: 600,
              fontFamily: "Inter",
              cursor: "pointer",
            }}
          >
            ← Back
          </button>
        </div>
      )
    }
    if (!detail) return null

    return (
      <div style={{ padding: PAGE_PAD }}>
        <style>{KEYFRAMES}</style>
        {isStaff ? (
          <StaffDetailView
            delivery={detail}
            onBack={goBack}
            onRefresh={refresh}
          />
        ) : (
          <ManagerDetailView
            delivery={detail}
            role={role}
            onBack={goBack}
            onRefresh={refresh}
          />
        )}
      </div>
    )
  }

  /* ── LIST VIEW ── */
  return (
    <div style={{ padding: PAGE_PAD }}>
      <style>{KEYFRAMES}</style>

      {/* Page title */}
      <div style={{ marginBottom: isStaff ? 16 : 20 }}>
        {isStaff ? (
          <>
            <h1
              style={{
                fontSize: isNarrow ? 20 : 24,
                fontWeight: 700,
                color: "var(--text-primary)",
                margin: "0 0 2px",
                fontFamily: "Fraunces, serif",
              }}
            >
              {(() => {
                const h = new Date().getHours()
                return h < 12
                  ? "Good morning"
                  : h < 17
                    ? "Good afternoon"
                    : "Good evening"
              })()}
              {currentUser?.name ? `, ${currentUser.name.split(" ")[0]}` : ""}.
            </h1>
            {!listLoading &&
              deliveries.length > 0 &&
              (() => {
                const assigned = deliveries.filter(
                  (d) => d.deliveryStatus === "assigned",
                ).length
                const out = deliveries.filter(
                  (d) => d.deliveryStatus === "out-for-delivery",
                ).length
                const awaiting = deliveries.filter(
                  (d) => d.deliveryStatus === "awaiting-confirmation",
                ).length
                const parts = [
                  assigned ? `${assigned} Assigned` : null,
                  out ? `${out} Out for Delivery` : null,
                  awaiting ? `${awaiting} Awaiting Confirmation` : null,
                ].filter(Boolean)
                return parts.length ? (
                  <p
                    style={{
                      fontSize: 13,
                      color: "var(--text-secondary)",
                      margin: "4px 0 0",
                      fontFamily: "Inter",
                    }}
                  >
                    Today: {parts.join(" · ")}
                  </p>
                ) : null
              })()}
          </>
        ) : (
          <h1
            style={{
              fontSize: isNarrow ? 22 : 26,
              fontWeight: 700,
              color: "var(--text-primary)",
              margin: "0 0 4px",
              letterSpacing: "-0.025em",
              fontFamily: "Inter",
            }}
          >
            Delivery
          </h1>
        )}
        {!isStaff && (
          <p
            style={{
              fontSize: 13,
              color: "var(--text-secondary)",
              margin: 0,
              fontFamily: "Inter",
            }}
          >
            Monitor outgoing orders, delivery progress, customer confirmation,
            and delivery exceptions.
          </p>
        )}
      </div>

      {/* Summary strip — manager only */}
      {!isStaff && <SummaryStrip summary={summary} loading={sumLoading} />}

      {/* Search + filter */}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 16,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <svg
            width="15"
            height="15"
            viewBox="0 0 20 20"
            fill="none"
            style={{
              position: "absolute",
              left: 11,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
              pointerEvents: "none",
            }}
          >
            <circle
              cx="8"
              cy="8"
              r="6"
              stroke="currentColor"
              strokeWidth="1.8"
            />
            <path
              d="M14 14l4 4"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              isStaff
                ? "Search your deliveries…"
                : "Search deliveries, orders, customers…"
            }
            style={{
              width: "100%",
              height: 40,
              paddingLeft: 34,
              paddingRight: 12,
              borderRadius: 8,
              border: "1px solid var(--border-neutral)",
              background: "var(--surface-01)",
              color: "var(--text-primary)",
              fontSize: 13,
              fontFamily: "Inter",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as DeliveryStatus | "")
          }
          style={{
            height: 40,
            padding: "0 12px",
            borderRadius: 8,
            border: "1px solid var(--border-neutral)",
            background: "var(--surface-01)",
            color: "var(--text-primary)",
            fontSize: 13,
            fontFamily: "Inter",
            outline: "none",
            minWidth: 175,
          }}
        >
          <option value="">All Statuses</option>
          <option value="ready-for-delivery">Ready for Delivery</option>
          <option value="assigned">Assigned</option>
          <option value="out-for-delivery">Out for Delivery</option>
          <option value="partially-delivered">Partially Delivered</option>
          <option value="awaiting-confirmation">Awaiting Confirmation</option>
          <option value="fully-delivered">Fully Delivered</option>
          <option value="delivery-disputed">Delivery Disputed</option>
          <option value="failed-attempt">Failed Attempt</option>
          <option value="verified">Verified</option>
        </select>
        <button
          onClick={fetchList}
          style={{
            height: 40,
            padding: "0 16px",
            borderRadius: 8,
            border: "1px solid var(--border-neutral)",
            background: "var(--surface-01)",
            color: "var(--text-primary)",
            fontSize: 13,
            fontWeight: 600,
            fontFamily: "Inter",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Refresh
        </button>
      </div>

      {/* Error banner */}
      {listError && (
        <div
          style={{
            background: "#fff0f0",
            border: "1px solid #fecaca",
            borderRadius: 8,
            padding: "12px 16px",
            marginBottom: 14,
            display: "flex",
            alignItems: "center",
            gap: 10,
            color: "var(--sem-danger)",
            fontSize: 13,
            fontFamily: "Inter",
          }}
        >
          {listError}
          <button
            onClick={fetchList}
            style={{
              marginLeft: "auto",
              fontSize: 13,
              color: "#2563eb",
              background: "none",
              border: "none",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Delivery-staff mobile cards */}
      {isStaff ? (
        listLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  background: "var(--surface-01)",
                  border: "1px solid var(--border-neutral)",
                  borderRadius: 12,
                  padding: "18px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <Skeleton h={14} w="55%" />
                <Skeleton h={20} w="70%" />
                <Skeleton h={14} w="90%" />
              </div>
            ))}
          </div>
        ) : !deliveries.length ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px 24px",
              fontFamily: "Inter",
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>🚚</div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "var(--text-secondary)",
                marginBottom: 6,
              }}
            >
              No deliveries assigned today.
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
              Check back later or contact your manager.
            </div>
          </div>
        ) : (
          deliveries.map((d) => (
            <StaffCard key={d.id} delivery={d} onSelect={openDetail} />
          ))
        )
      ) : (
        /* Manager list */
        <div
          style={{
            background: "var(--surface-01)",
            border: "1px solid var(--border-neutral)",
            borderRadius: 10,
            overflow: "hidden",
          }}
        >
          {listLoading ? (
            <div
              style={{
                padding: "20px 24px",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} h={44} />
              ))}
            </div>
          ) : !deliveries.length ? (
            <div
              style={{
                textAlign: "center",
                padding: "60px 24px",
                color: "var(--text-muted)",
                fontFamily: "Inter",
              }}
            >
              <svg
                width="48"
                height="48"
                viewBox="0 0 48 48"
                fill="none"
                style={{
                  margin: "0 auto 12px",
                  display: "block",
                  opacity: 0.25,
                }}
              >
                <path
                  d="M4 20h32v20H4V20zM36 24l10 5v11H36V24zM10 40a5 5 0 100-10 5 5 0 000 10zM38 40a5 5 0 100-10 5 5 0 000 10z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              </svg>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  marginBottom: 6,
                }}
              >
                No deliveries found
              </div>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                Try adjusting your search or status filter.
              </div>
            </div>
          ) : isNarrow ? (
            /* Mobile card fallback for managers on narrow screens */
            <div
              style={{
                padding: 14,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              {deliveries.map((d) => (
                <div
                  key={d.id}
                  onClick={() => openDetail(d)}
                  style={{
                    border: "1px solid var(--border-neutral)",
                    borderRadius: 10,
                    padding: "12px 14px",
                    cursor: "pointer",
                    background: "var(--bg-primary)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 6,
                    }}
                  >
                    <div
                      style={{ display: "flex", gap: 8, alignItems: "center" }}
                    >
                      <RefBadge>{d.ref}</RefBadge>
                      {d.urgent && <UrgentBadge />}
                    </div>
                    <StatusBadge status={d.deliveryStatus} />
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "var(--text-primary)",
                      fontFamily: "Inter",
                      marginBottom: 4,
                    }}
                  >
                    {d.customer.name}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 14,
                      flexWrap: "wrap",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <Eyebrow>Ordered</Eyebrow>
                      <Qty>{d.orderedQty}</Qty>
                    </div>
                    <div>
                      <Eyebrow>Delivered</Eyebrow>
                      <Qty>{d.deliveredQty}</Qty>
                    </div>
                    <PaymentBadge status={d.paymentStatus} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <ManagerTable deliveries={deliveries} onSelect={openDetail} />
          )}
        </div>
      )}
    </div>
  )
}
