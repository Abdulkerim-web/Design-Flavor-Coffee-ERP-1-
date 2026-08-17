/**
 * Inventory.tsx — F3-08
 * Inventory & Stock Management Experience
 *
 * Views: dashboard | green | roasted | packaging | lot-list | lot-detail | adjustment | transfer
 *
 * THE FRONTEND DOES NOT CALCULATE INVENTORY.
 * THE FRONTEND VISUALIZES AUTHORITATIVE INVENTORY DATA.
 */

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "../contexts/AuthContext"
import { can } from "../lib/can"
import { useBreakpoint } from "../hooks/useBreakpoint"
import {
  getInventoryDashboardStats,
  getAttentionItems,
  getGreenLots,
  getRoastedLots,
  getPackagingLots,
  listLots,
  getLot,
  getLotMovements,
  getLotDiscrepancy,
  recordInventoryAdjustment,
  recordInventoryTransfer,
  reviewDiscrepancy,
  WAREHOUSE_LOCATIONS,
} from "../services/inventory"
import type {
  InventoryDashboardStats,
  AttentionItem,
  InventoryLot,
  InventoryMovement,
  InventoryDiscrepancy,
  StockStatus,
  InventoryCategory,
  MovementDirection,
} from "../services/inventory"

/* ─── View type ───────────────────────────────────────────────── */

type View = "dashboard" | "green" | "roasted" | "packaging" | "lot-list" | "lot-detail" | "adjustment" | "transfer"

/* ─── Icon helper ──────────────────────────────────────────────── */

function Ic({
  d,
  size = 16,
  style,
}: {
  d: string
  size?: number
  style?: React.CSSProperties
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={style}
    >
      <path d={d} />
    </svg>
  )
}

const D = {
  warn: "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01",
  check: "M20 6L9 17l-5-5",
  checkFull: "M9 12l2 2 4-4M22 12a10 10 0 11-20 0 10 10 0 0120 0z",
  info: "M12 22a10 10 0 110-20 10 10 0 010 20zM12 8v4M12 16h.01",
  boxes:
    "M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z",
  arrowUp: "M12 19V5M5 12l7-7 7 7",
  arrowDown: "M12 5v14M19 12l-7 7-7-7",
  arrowBoth: "M7 16V8M17 16V8M3 12h18",
  retry:
    "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15",
  adjust: "M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z",
  transfer: "M8 7h12M8 12h12M8 17h12M3 7h.01M3 12h.01M3 17h.01",
  back: "M15 18l-6-6 6-6",
  search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0",
  filter: "M22 3H2l8 9.46V19l4 2v-8.54L22 3",
  sort: "M8 6h13M8 12h9M8 18h5",
  lot: "M3 3h18v7H3zM3 14h18v7H3z",
}

/* ─── Status badge ─────────────────────────────────────────────── */

const STATUS_CONFIG: Record<StockStatus, {
  cls: string
  label: string
  icon: string
}> = {
  healthy: { cls: "badge badge-green", label: "Healthy", icon: D.checkFull },
  low: { cls: "badge badge-amber", label: "Low Stock", icon: D.warn },
  critical: { cls: "badge badge-red", label: "Critical", icon: D.warn },
  depleted: { cls: "badge badge-gray", label: "Depleted", icon: D.warn },
  "under-review": {
    cls: "badge badge-amber",
    label: "Under Review",
    icon: D.info,
  },
  "partially-reserved": {
    cls: "badge badge-blue",
    label: "Partially Reserved",
    icon: D.info,
  },
}

function StockStatus({ status }: { status: StockStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG["healthy"]
  return (
    <span
      className={cfg.cls}
      style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
    >
      <Ic d={cfg.icon} size={10} />
      {cfg.label}
    </span>
  )
}

/* ─── Typography helpers ───────────────────────────────────────── */

function Eyebrow({
  children,
  style,
}: {
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <div className="section-eyebrow" style={{ marginBottom: 4, ...style }}>
      {children}
    </div>
  )
}

function Qty({
  children,
  color,
}: {
  children: React.ReactNode
  color?: string
}) {
  return (
    <div
      style={{
        fontFamily: "DM Mono, monospace",
        fontSize: 22,
        fontWeight: 800,
        color: color ?? "var(--text-primary)",
        lineHeight: 1.1,
      }}
    >
      {children}
    </div>
  )
}

/* ─── Skeleton ────────────────────────────────────────────────── */

function Sk({ h = 40, r = 8 }: { h?: number r?: number }) {
  return (
    <div className="skeleton-shimmer" style={{ height: h, borderRadius: r }} />
  )
}

/* ─── Back button ─────────────────────────────────────────────── */

function BackBtn({
  onClick,
  label = "Back",
}: {
  onClick: () => void
  label?: string
}) {
  return (
    <button
      onClick={onClick}
      className="btn-ghost"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 13,
        marginBottom: 20,
      }}
    >
      <Ic d={D.back} size={13} /> {label}
    </button>
  )
}

/* ─── Error panel ─────────────────────────────────────────────── */

function ErrorPanel({ msg, onRetry }: { msg: string onRetry: () => void }) {
  return (
    <div
      style={{
        padding: "14px 18px",
        borderRadius: "var(--radius-md)",
        background: "var(--color-status-danger-surface)",
        border: "1px solid var(--color-status-danger-border)",
        color: "var(--sem-danger)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
      }}
    >
      <span
        style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}
      >
        <Ic d={D.warn} size={14} /> {msg}
      </span>
      <button
        onClick={onRetry}
        className="btn-ghost"
        style={{ fontSize: 12.5, color: "var(--sem-danger)", flexShrink: 0 }}
      >
        <Ic
          d={D.retry}
          size={13}
          style={{ display: "inline", marginRight: 4 }}
        />
        Retry
      </button>
    </div>
  )
}

/* ─── AvailabilityPanel ────────────────────────────────────────── */

function AvailabilityPanel({
  lot,
  large,
}: {
  lot: InventoryLot
  large?: boolean
}) {
  const sz = large ? 28 : 22
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 12,
        padding: "18px 20px",
        background: "var(--surface-01)",
        border: "1.5px solid var(--border-neutral)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          paddingRight: 12,
          borderRight: "1px solid var(--border-neutral)",
        }}
      >
        <Eyebrow>Physical Stock</Eyebrow>
        <div
          style={{
            fontFamily: "DM Mono, monospace",
            fontSize: sz,
            fontWeight: 800,
            color: "var(--text-primary)",
            lineHeight: 1.1,
          }}
        >
          {lot.onHand}
        </div>
        <div
          style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 4 }}
        >
          on hand
        </div>
      </div>
      <div
        style={{
          paddingRight: 12,
          paddingLeft: 4,
          borderRight: "1px solid var(--border-neutral)",
        }}
      >
        <Eyebrow>Reserved for Orders</Eyebrow>
        <div
          style={{
            fontFamily: "DM Mono, monospace",
            fontSize: sz,
            fontWeight: 800,
            color: "var(--text-secondary)",
            lineHeight: 1.1,
          }}
        >
          {lot.reserved}
        </div>
        <div
          style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 4 }}
        >
          locked
        </div>
      </div>
      <div style={{ paddingLeft: 4 }}>
        <Eyebrow>Available to Allocate</Eyebrow>
        <div
          style={{
            fontFamily: "DM Mono, monospace",
            fontSize: sz,
            fontWeight: 800,
            color:
              lot.status === "critical"
                ? "var(--sem-danger)"
                : lot.status === "low"
                  ? "var(--sem-warning)"
                  : "var(--sem-success)",
            lineHeight: 1.1,
          }}
        >
          {lot.available}
        </div>
        <div
          style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 4 }}
        >
          free
        </div>
      </div>
    </div>
  )
}

/* ─── Inventory Summary Card (dashboard) ──────────────────────── */

function InventorySummaryCard({
  title,
  data,
  icon,
  onNavigate,
}: {
  title: string
  data: {
    onHand: string
    reserved: string
    available: string
    status: StockStatus
    lotCount?: number
    skuCount?: number
  }
  icon: string
  onNavigate: () => void
}) {
  const borderColor =
    data.status === "critical"
      ? "var(--sem-danger)"
      : data.status === "low"
        ? "var(--sem-warning)"
        : "var(--border-neutral)"
  return (
    <div
      style={{
        background: "var(--surface-01)",
        border: `1.5px solid ${borderColor}`,
        borderRadius: "var(--radius-lg)",
        padding: "18px 20px",
        cursor: "pointer",
      }}
      onClick={onNavigate}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onNavigate()}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "var(--radius-md)",
              background: "var(--surface-02)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ic d={icon} size={16} style={{ color: "var(--text-secondary)" }} />
          </div>
          <div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "var(--text-primary)",
              }}
            >
              {title}
            </div>
            {(data.lotCount !== undefined || data.skuCount !== undefined) && (
              <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
                {data.lotCount !== undefined
                  ? `${data.lotCount} lots`
                  : `${data.skuCount} SKUs`}
              </div>
            )}
          </div>
        </div>
        <StockStatus status={data.status} />
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 8,
        }}
      >
        {[
          { label: "On Hand", value: data.onHand },
          { label: "Reserved", value: data.reserved, dim: true },
          {
            label: "Available",
            value: data.available,
            color:
              data.status === "critical"
                ? "var(--sem-danger)"
                : data.status === "low"
                  ? "var(--sem-warning)"
                  : undefined,
          },
        ].map(({ label, value, dim, color }) => (
          <div key={label}>
            <div
              style={{
                fontSize: 10.5,
                color: "var(--text-muted)",
                textTransform: "uppercase" as const,
                letterSpacing: "0.07em",
                fontFamily: "DM Mono, monospace",
                marginBottom: 3,
              }}
            >
              {label}
            </div>
            <div
              style={{
                fontFamily: "DM Mono, monospace",
                fontSize: 15,
                fontWeight: 700,
                color:
                  color ??
                  (dim ? "var(--text-secondary)" : "var(--text-primary)"),
              }}
            >
              {value}
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          marginTop: 12,
          fontSize: 12,
          color: "var(--brand-primary)",
          fontWeight: 600,
        }}
      >
        View {title} →
      </div>
    </div>
  )
}

/* ─── Attention card ──────────────────────────────────────────── */

function AttentionCard({
  item,
  onNavigate,
}: {
  item: AttentionItem
  onNavigate: (lotId?: string) => void
}) {
  const isCritical = item.severity === "critical"
  const isWarning = item.severity === "warning"
  return (
    <div
      style={{
        padding: "12px 16px",
        borderRadius: "var(--radius-md)",
        background: isCritical
          ? "var(--color-status-danger-surface)"
          : isWarning
            ? "var(--color-status-warning-surface)"
            : "var(--color-status-info-surface)",
        border: `1.5px solid ${
          isCritical
            ? "var(--color-status-danger-border)"
            : isWarning
              ? "var(--color-status-warning-border)"
              : "var(--color-status-info-border)"
        }`,
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
      }}
    >
      <Ic
        d={D.warn}
        size={15}
        style={{
          color: isCritical
            ? "var(--sem-danger)"
            : isWarning
              ? "var(--sem-warning)"
              : "var(--sem-info)",
          flexShrink: 0,
          marginTop: 1,
        }}
      />
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: 2,
          }}
        >
          {item.title}
        </div>
        <div style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>
          {item.description}
        </div>
      </div>
      {item.lotId && (
        <button
          onClick={() => onNavigate(item.lotId)}
          className="btn-ghost"
          style={{ fontSize: 12, flexShrink: 0, padding: "4px 10px" }}
        >
          View
        </button>
      )}
    </div>
  )
}

/* ─── Stock warning panel (inline) ────────────────────────────── */

function StockWarningPanel({ lot }: { lot: InventoryLot }) {
  const isCrit = lot.status === "critical"
  return (
    <div
      style={{
        padding: "14px 18px",
        borderRadius: "var(--radius-lg)",
        background: isCrit
          ? "var(--color-status-danger-surface)"
          : "var(--color-status-warning-surface)",
        border: `1.5px solid ${
          isCrit
            ? "var(--color-status-danger-border)"
            : "var(--color-status-warning-border)"
        }`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 10,
        }}
      >
        <Ic
          d={D.warn}
          size={16}
          style={{
            color: isCrit ? "var(--sem-danger)" : "var(--sem-warning)",
            flexShrink: 0,
          }}
        />
        <div
          style={{
            fontWeight: 700,
            fontSize: 13.5,
            color: isCrit ? "var(--sem-danger)" : "var(--sem-warning)",
          }}
        >
          {isCrit ? "Critical Stock Level" : "Low Stock Warning"}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <Eyebrow>Available</Eyebrow>
          <div
            style={{
              fontFamily: "DM Mono, monospace",
              fontSize: 20,
              fontWeight: 800,
              color: isCrit ? "var(--sem-danger)" : "var(--sem-warning)",
            }}
          >
            {lot.available}
          </div>
        </div>
        {lot.threshold && (
          <div>
            <Eyebrow>Minimum Threshold</Eyebrow>
            <div
              style={{
                fontFamily: "DM Mono, monospace",
                fontSize: 16,
                fontWeight: 700,
                color: "var(--text-secondary)",
              }}
            >
              {lot.threshold}
            </div>
          </div>
        )}
      </div>
      <div style={{ marginTop: 8, fontSize: 12, color: "var(--text-muted)" }}>
        Threshold and status values are supplied by the backend.
      </div>
    </div>
  )
}

/* ─── Discrepancy panel ───────────────────────────────────────── */

function DiscrepancyPanel({ disc }: { disc: InventoryDiscrepancy }) {
  return (
    <div
      style={{
        padding: "14px 18px",
        borderRadius: "var(--radius-lg)",
        background: "var(--color-status-danger-surface)",
        border: "1.5px solid var(--color-status-danger-border)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 12,
        }}
      >
        <Ic
          d={D.warn}
          size={15}
          style={{ color: "var(--sem-danger)", flexShrink: 0 }}
        />
        <div
          style={{
            fontWeight: 700,
            fontSize: 13.5,
            color: "var(--sem-danger)",
          }}
        >
          Inventory Discrepancy — Needs Review
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <div>
          <Eyebrow>Expected</Eyebrow>
          <Qty>{disc.expected}</Qty>
        </div>
        <div>
          <Eyebrow>Recorded</Eyebrow>
          <Qty>{disc.recorded}</Qty>
        </div>
        <div>
          <Eyebrow>Difference</Eyebrow>
          <div
            style={{
              fontFamily: "DM Mono, monospace",
              fontSize: 18,
              fontWeight: 700,
              color: "var(--sem-danger)",
            }}
          >
            {disc.difference}
          </div>
        </div>
      </div>
      <div
        style={{
          fontSize: 12.5,
          color: "var(--text-secondary)",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 6,
        }}
      >
        <span>
          Detected by:{" "}
          <strong style={{ color: "var(--text-primary)" }}>
            {disc.detectedBy}
          </strong>
        </span>
        <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11.5 }}>
          {disc.detectedAt}
        </span>
        {disc.reason && (
          <span style={{ gridColumn: "1/-1", fontStyle: "italic" }}>
            Reason: {disc.reason}
          </span>
        )}
        {disc.reference && (
          <span>
            Reference:{" "}
            <span style={{ fontFamily: "DM Mono, monospace" }}>
              {disc.reference}
            </span>
          </span>
        )}
      </div>
    </div>
  )
}

/* ─── Movement direction indicator ────────────────────────────── */

function DirectionIcon({ direction }: { direction: MovementDirection }) {
  const cfg = {
    inbound: { d: D.arrowUp, color: "var(--sem-success)", label: "Inbound" },
    outbound: { d: D.arrowDown, color: "var(--sem-danger)", label: "Outbound" },
    internal: { d: D.arrowBoth, color: "var(--sem-info)", label: "Internal" },
  }[direction]
  return (
    <span
      title={cfg.label}
      aria-label={cfg.label}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 28,
        height: 28,
        borderRadius: "var(--radius-sm)",
        background: "var(--surface-02)",
        flexShrink: 0,
      }}
    >
      <Ic d={cfg.d} size={13} style={{ color: cfg.color }} />
    </span>
  )
}

/* ─── Movement log ────────────────────────────────────────────── */

function MovementLog({
  movements,
  loading,
}: {
  movements: InventoryMovement[]
  loading: boolean
}) {
  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[...Array(3)].map((_, i) => (
          <Sk key={i} h={70} r={8} />
        ))}
      </div>
    )
  }
  if (!movements.length) {
    return (
      <div
        style={{
          padding: "32px 24px",
          textAlign: "center",
          background: "var(--surface-02)",
          borderRadius: "var(--radius-lg)",
          border: "1px dashed var(--border-neutral)",
        }}
      >
        <Ic
          d={D.boxes}
          size={24}
          style={{
            color: "var(--text-muted)",
            display: "block",
            margin: "0 auto 10px",
          }}
        />
        <div
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "var(--text-secondary)",
          }}
        >
          No inventory movements recorded yet.
        </div>
      </div>
    )
  }

  const TYPE_LABELS: Record<string, string> = {
    receipt: "Receipt",
    reservation: "Reservation",
    release: "Release",
    issue: "Issue",
    transfer: "Transfer",
    adjustment: "Adjustment",
    "roasting-consumption": "Roasting Consumption",
    "roasting-output": "Roasting Output",
    "packing-consumption": "Packing Consumption",
    return: "Return",
    correction: "Correction",
  }

  const REF_PREFIXES: Record<string, string> = {
    order: "Order",
    roasting: "Roasting Job",
    receipt: "Receipt",
    adjustment: "Adjustment",
    transfer: "Transfer",
    packing: "Packing Job",
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {movements.map((mv) => (
        <div
          key={mv.id}
          style={{
            display: "flex",
            gap: 12,
            padding: "12px 16px",
            background: "var(--surface-01)",
            border: "1px solid var(--border-neutral)",
            borderRadius: "var(--radius-md)",
            alignItems: "flex-start",
          }}
        >
          <DirectionIcon direction={mv.direction} />
          <div style={{ flex: 1 }}>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 10,
                flexWrap: "wrap",
                marginBottom: 4,
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--text-primary)",
                }}
              >
                {TYPE_LABELS[mv.type] ?? mv.type}
              </span>
              <span
                style={{
                  fontFamily: "DM Mono, monospace",
                  fontSize: 14,
                  fontWeight: 800,
                  color:
                    mv.direction === "inbound"
                      ? "var(--sem-success)"
                      : mv.direction === "outbound"
                        ? "var(--sem-danger)"
                        : "var(--text-primary)",
                }}
              >
                {mv.qty} {mv.unit}
              </span>
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--text-secondary)",
                display: "flex",
                flexWrap: "wrap",
                gap: "4px 14px",
              }}
            >
              {mv.reference && (
                <span>
                  {mv.referenceType
                    ? `${REF_PREFIXES[mv.referenceType] ?? ""} `
                    : ""}
                  <span style={{ fontFamily: "DM Mono, monospace" }}>
                    {mv.reference}
                  </span>
                </span>
              )}
              <span>
                by{" "}
                <strong style={{ color: "var(--text-primary)" }}>
                  {mv.actor}
                </strong>
              </span>
            </div>
            {mv.notes && (
              <div
                style={{
                  marginTop: 4,
                  fontSize: 12,
                  color: "var(--text-muted)",
                  fontStyle: "italic",
                }}
              >
                {mv.notes}
              </div>
            )}
          </div>
          <div
            style={{
              fontSize: 11,
              fontFamily: "DM Mono, monospace",
              color: "var(--text-muted)",
              flexShrink: 0,
              textAlign: "right",
            }}
          >
            {mv.timestamp}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ─── Pagination ──────────────────────────────────────────────── */

function Pagination({
  page,
  total,
  pageSize,
  onChange,
}: {
  page: number
  total: number
  pageSize: number
  onChange: (p: number) => void
}) {
  const totalPages = Math.ceil(total / pageSize) || 1
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 0",
        fontSize: 13,
        color: "var(--text-secondary)",
      }}
    >
      <span style={{ fontFamily: "DM Mono, monospace", fontSize: 12 }}>
        Page {page} of {totalPages} · {total} lots
      </span>
      <div style={{ display: "flex", gap: 6 }}>
        <button
          className="btn-ghost"
          style={{ fontSize: 13, padding: "4px 12px" }}
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          ← Prev
        </button>
        <button
          className="btn-ghost"
          style={{ fontSize: 13, padding: "4px 12px" }}
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
        >
          Next →
        </button>
      </div>
    </div>
  )
}

/* ─── Sortable column header ──────────────────────────────────── */

function SortTh({
  children,
  field,
  sortField,
  sortDir,
  onSort,
}: {
  children: React.ReactNode
  field: string
  sortField: string
  sortDir: "asc" | "desc"
  onSort: (f: string) => void
}) {
  const active = sortField === field
  return (
    <th
      onClick={() => onSort(field)}
      aria-sort={
        active ? (sortDir === "asc" ? "ascending" : "descending") : "none"
      }
      style={{
        padding: "10px 14px",
        textAlign: "right" as const,
        cursor: "pointer",
        fontSize: 11,
        fontFamily: "DM Mono, monospace",
        color: active ? "var(--text-primary)" : "var(--text-muted)",
        textTransform: "uppercase" as const,
        letterSpacing: "0.07em",
        fontWeight: 600,
        userSelect: "none",
        whiteSpace: "nowrap",
      }}
    >
      {children} {active ? (sortDir === "asc" ? "↑" : "↓") : ""}
    </th>
  )
}

/* ─── Inventory table ─────────────────────────────────────────── */

function InventoryTable({
  lots,
  category,
  onSelectLot,
  sortField,
  sortDir,
  onSort,
}: {
  lots: InventoryLot[]
  category: InventoryCategory
  onSelectLot: (id: string) => void
  sortField: string
  sortDir: "asc" | "desc"
  onSort: (f: string) => void
}) {
  const isPackaging = category === "packaging"

  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}
        aria-label="Inventory lots"
      >
        <thead>
          <tr
            style={{
              borderBottom: "1px solid var(--border-neutral)",
              background: "var(--surface-02)",
            }}
          >
            <th
              style={{
                padding: "10px 14px",
                textAlign: "left" as const,
                fontSize: 11,
                fontFamily: "DM Mono, monospace",
                color: "var(--text-muted)",
                textTransform: "uppercase" as const,
                letterSpacing: "0.07em",
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              {isPackaging ? "Item / Batch" : "Lot / Coffee"}
            </th>
            {!isPackaging && (
              <th
                style={{
                  padding: "10px 14px",
                  textAlign: "left" as const,
                  fontSize: 11,
                  fontFamily: "DM Mono, monospace",
                  color: "var(--text-muted)",
                  textTransform: "uppercase" as const,
                  letterSpacing: "0.07em",
                  fontWeight: 600,
                }}
              >
                Origin
              </th>
            )}
            <th
              style={{
                padding: "10px 14px",
                textAlign: "left" as const,
                fontSize: 11,
                fontFamily: "DM Mono, monospace",
                color: "var(--text-muted)",
                textTransform: "uppercase" as const,
                letterSpacing: "0.07em",
                fontWeight: 600,
              }}
            >
              Location
            </th>
            <SortTh
              field="onHand"
              sortField={sortField}
              sortDir={sortDir}
              onSort={onSort}
            >
              On Hand
            </SortTh>
            <SortTh
              field="reserved"
              sortField={sortField}
              sortDir={sortDir}
              onSort={onSort}
            >
              Reserved
            </SortTh>
            <SortTh
              field="available"
              sortField={sortField}
              sortDir={sortDir}
              onSort={onSort}
            >
              Available
            </SortTh>
            {isPackaging && (
              <th
                style={{
                  padding: "10px 14px",
                  textAlign: "left" as const,
                  fontSize: 11,
                  fontFamily: "DM Mono, monospace",
                  color: "var(--text-muted)",
                  textTransform: "uppercase" as const,
                  letterSpacing: "0.07em",
                  fontWeight: 600,
                }}
              >
                Unit
              </th>
            )}
            <th
              style={{
                padding: "10px 14px",
                textAlign: "left" as const,
                fontSize: 11,
                fontFamily: "DM Mono, monospace",
                color: "var(--text-muted)",
                textTransform: "uppercase" as const,
                letterSpacing: "0.07em",
                fontWeight: 600,
              }}
            >
              Status
            </th>
            <th
              style={{
                padding: "10px 14px",
                textAlign: "left" as const,
                width: 80,
              }}
            />
          </tr>
        </thead>
        <tbody>
          {lots.map((lot) => (
            <tr
              key={lot.id}
              onClick={() => onSelectLot(lot.id)}
              style={{
                borderBottom: "1px solid var(--border-neutral)",
                cursor: "pointer",
              }}
              className="table-row-hover"
            >
              <td style={{ padding: "10px 14px" }}>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 13.5,
                    color: "var(--text-primary)",
                  }}
                >
                  {lot.name}
                </div>
                <div
                  style={{
                    fontFamily: "DM Mono, monospace",
                    fontSize: 11.5,
                    color: "var(--text-muted)",
                  }}
                >
                  {lot.lotNumber}
                </div>
              </td>
              {!isPackaging && (
                <td
                  style={{
                    padding: "10px 14px",
                    fontSize: 13,
                    color: "var(--text-secondary)",
                  }}
                >
                  {lot.origin ?? "—"}
                </td>
              )}
              <td
                style={{
                  padding: "10px 14px",
                  fontSize: 12.5,
                  color: "var(--text-muted)",
                  maxWidth: 180,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {lot.location}
              </td>
              <td
                style={{
                  padding: "10px 14px",
                  textAlign: "right" as const,
                  fontFamily: "DM Mono, monospace",
                  fontSize: 13.5,
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  whiteSpace: "nowrap",
                }}
              >
                {lot.onHand}
              </td>
              <td
                style={{
                  padding: "10px 14px",
                  textAlign: "right" as const,
                  fontFamily: "DM Mono, monospace",
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  whiteSpace: "nowrap",
                }}
              >
                {lot.reserved}
              </td>
              <td
                style={{
                  padding: "10px 14px",
                  textAlign: "right" as const,
                  fontFamily: "DM Mono, monospace",
                  fontSize: 13.5,
                  fontWeight: 700,
                  color:
                    lot.status === "critical"
                      ? "var(--sem-danger)"
                      : lot.status === "low"
                        ? "var(--sem-warning)"
                        : "var(--text-primary)",
                  whiteSpace: "nowrap",
                }}
              >
                {lot.available}
              </td>
              {isPackaging && (
                <td
                  style={{
                    padding: "10px 14px",
                    fontSize: 12.5,
                    color: "var(--text-muted)",
                  }}
                >
                  {lot.unit}
                </td>
              )}
              <td style={{ padding: "10px 14px" }}>
                <StockStatus status={lot.status} />
              </td>
              <td style={{ padding: "10px 14px" }}>
                <button
                  className="btn-ghost"
                  style={{ fontSize: 12.5, padding: "4px 10px" }}
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelectLot(lot.id)
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

/* ─── Mobile lot card ─────────────────────────────────────────── */

function LotCard({
  lot,
  onSelect,
}: {
  lot: InventoryLot
  onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      style={{
        width: "100%",
        textAlign: "left",
        background: "var(--surface-01)",
        border: `1px solid ${
          lot.status === "critical"
            ? "var(--sem-danger)"
            : lot.status === "low"
              ? "var(--sem-warning)"
              : "var(--border-neutral)"
        }`,
        borderRadius: "var(--radius-lg)",
        padding: "16px",
        cursor: "pointer",
        display: "block",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 10,
          marginBottom: 10,
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
            {lot.name}
          </div>
          <div
            style={{
              fontFamily: "DM Mono, monospace",
              fontSize: 11.5,
              color: "var(--text-muted)",
              marginTop: 2,
            }}
          >
            {lot.lotNumber}
          </div>
        </div>
        <StockStatus status={lot.status} />
      </div>
      <div
        style={{ fontSize: 12.5, color: "var(--text-muted)", marginBottom: 10 }}
      >
        {lot.location}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div>
          <div
            style={{
              fontSize: 10,
              color: "var(--text-muted)",
              textTransform: "uppercase" as const,
              letterSpacing: "0.07em",
              fontFamily: "DM Mono, monospace",
            }}
          >
            Available
          </div>
          <div
            style={{
              fontFamily: "DM Mono, monospace",
              fontSize: 18,
              fontWeight: 800,
              color:
                lot.status === "critical"
                  ? "var(--sem-danger)"
                  : lot.status === "low"
                    ? "var(--sem-warning)"
                    : "var(--text-primary)",
            }}
          >
            {lot.available}
          </div>
        </div>
        <div>
          <div
            style={{
              fontSize: 10,
              color: "var(--text-muted)",
              textTransform: "uppercase" as const,
              letterSpacing: "0.07em",
              fontFamily: "DM Mono, monospace",
            }}
          >
            On Hand
          </div>
          <div
            style={{
              fontFamily: "DM Mono, monospace",
              fontSize: 14,
              fontWeight: 700,
              color: "var(--text-secondary)",
            }}
          >
            {lot.onHand}
          </div>
        </div>
      </div>
    </button>
  )
}

/* ─── Filter bar ──────────────────────────────────────────────── */

function FilterBar({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  extraFilters,
}: {
  search: string
  setSearch: (v: string) => void
  statusFilter: StockStatus | ""
  setStatusFilter: (v: StockStatus | "") => void
  extraFilters?: React.ReactNode
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        alignItems: "center",
        marginBottom: 16,
      }}
    >
      <div
        style={{
          position: "relative",
          flex: "1 1 200px",
          display: "flex",
          alignItems: "center",
        }}
      >
        <Ic
          d={D.search}
          size={14}
          style={{
            position: "absolute",
            left: 10,
            color: "var(--text-muted)",
            pointerEvents: "none",
          }}
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search lots, origins, SKUs…"
          className="input-field"
          style={{ width: "100%", paddingLeft: 32, fontSize: 13 }}
          aria-label="Search inventory"
        />
      </div>
      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value as StockStatus | "")}
        className="input-field"
        style={{ flex: "0 1 160px", fontSize: 13 }}
        aria-label="Filter by status"
      >
        <option value="">All Statuses</option>
        {(Object.keys(STATUS_CONFIG) as StockStatus[]).map((s) => (
          <option key={s} value={s}>
            {STATUS_CONFIG[s].label}
          </option>
        ))}
      </select>
      {extraFilters}
    </div>
  )
}

/* ─── Empty state ─────────────────────────────────────────────── */

function EmptyState({
  hasFilters,
  onClear,
  canReceive,
}: {
  hasFilters: boolean
  onClear: () => void
  canReceive: boolean
}) {
  return (
    <div
      style={{
        padding: "56px 32px",
        textAlign: "center",
        background: "var(--surface-01)",
        border: "1px dashed var(--border-neutral)",
        borderRadius: "var(--radius-lg)",
      }}
    >
      <Ic
        d={D.boxes}
        size={32}
        style={{
          color: "var(--text-muted)",
          display: "block",
          margin: "0 auto 14px",
        }}
      />
      <div
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: "var(--text-primary)",
          marginBottom: 6,
        }}
      >
        {hasFilters
          ? "No inventory matches your filters."
          : "No inventory recorded yet."}
      </div>
      <div
        style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}
      >
        {hasFilters
          ? "Try clearing filters to see all inventory."
          : "Once stock is received, inventory will appear here."}
      </div>
      {hasFilters && (
        <button className="btn-secondary" onClick={onClear}>
          Clear Filters
        </button>
      )}
      {!hasFilters && canReceive && (
        <button className="btn-primary">Record Receipt</button>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════ */
/*  VIEWS                                                          */
/* ═══════════════════════════════════════════════════════════════ */

/* ─── Dashboard view ──────────────────────────────────────────── */

function DashboardView({
  role,
  onNavigate,
}: {
  role: string
  onNavigate: (v: View, lotId?: string) => void
}) {
  const [stats, setStats] = useState<InventoryDashboardStats | null>(null)
  const [attention, setAttention] = useState<AttentionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const [sRes, aRes] = await Promise.all([
        getInventoryDashboardStats(),
        getAttentionItems(),
      ])
      if (sRes.error) throw new Error(sRes.error)
      setStats(sRes.data)
      setAttention(aRes.data ?? [])
    } catch {
      setError("Unable to load inventory dashboard.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div className="section-eyebrow" style={{ marginBottom: 4 }}>
          Inventory
        </div>
        <h1
          style={{
            fontFamily: "Fraunces, serif",
            fontSize: 28,
            fontWeight: 700,
            color: "var(--text-primary)",
            lineHeight: 1.2,
            margin: 0,
          }}
        >
          Stock Overview
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "var(--text-secondary)",
            marginTop: 6,
            marginBottom: 0,
          }}
        >
          Stock overview across green coffee, roasted coffee, and packaging.
        </p>
      </div>

      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 12,
            }}
          >
            {[...Array(3)].map((_, i) => (
              <Sk key={i} h={160} r={12} />
            ))}
          </div>
          <Sk h={120} r={10} />
        </div>
      )}
      {!loading && error && <ErrorPanel msg={error} onRetry={load} />}

      {!loading && !error && stats && (
        <>
          {/* Summary cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 14,
              marginBottom: 20,
            }}
          >
            <InventorySummaryCard
              title="Green Coffee"
              data={stats.green}
              icon={D.boxes}
              onNavigate={() => onNavigate("green")}
            />
            <InventorySummaryCard
              title="Roasted Coffee"
              data={stats.roasted}
              icon={D.boxes}
              onNavigate={() => onNavigate("roasted")}
            />
            <InventorySummaryCard
              title="Packaging"
              data={{
                ...stats.packaging,
                lotCount: undefined,
                skuCount: stats.packaging.skuCount,
              }}
              icon={D.boxes}
              onNavigate={() => onNavigate("packaging")}
            />
          </div>

          {/* Needs Attention */}
          {attention.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  marginBottom: 10,
                }}
              >
                Needs Attention ({attention.length})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {attention.map((item) => (
                  <AttentionCard
                    key={item.id}
                    item={item}
                    onNavigate={(lotId) => onNavigate("lot-detail", lotId)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Quick links */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 10,
            }}
          >
            {[
              { label: "Green Coffee Lots", view: "green" as View },
              { label: "Roasted Coffee", view: "roasted" as View },
              { label: "Packaging", view: "packaging" as View },
              { label: "All Lots", view: "lot-list" as View },
            ].map(({ label, view }) => (
              <button
                key={view}
                onClick={() => onNavigate(view)}
                style={{
                  padding: "12px 16px",
                  textAlign: "left",
                  cursor: "pointer",
                  background: "var(--surface-01)",
                  border: "1px solid var(--border-neutral)",
                  borderRadius: "var(--radius-md)",
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  display: "block",
                  width: "100%",
                }}
              >
                {label}{" "}
                <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>
                  →
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/* ─── Category list view (green / roasted / packaging) ────────── */

function CategoryListView({
  category,
  role,
  onSelectLot,
  onNavigateDashboard,
}: {
  category: InventoryCategory
  role: string
  onSelectLot: (id: string) => void
  onNavigateDashboard: () => void
}) {
  const [lots, setLots] = useState<InventoryLot[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StockStatus | "">("")
  const [sortField, setSortField] = useState("name")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
  const { isMobile } = useBreakpoint()

  const canReceive = can(role as any, "inventory.receive")

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const fn =
        category === "green"
          ? getGreenLots
          : category === "roasted"
            ? getRoastedLots
            : getPackagingLots
      const res = await fn({
        status: statusFilter || undefined,
        search: search || undefined,
      })
      if (res.error) throw new Error(res.error)
      setLots(res.data?.lots ?? [])
      setTotal(res.data?.total ?? 0)
    } catch {
      setError("Unable to load inventory.")
    } finally {
      setLoading(false)
    }
  }, [category, statusFilter, search, page])

  useEffect(() => {
    load()
  }, [load])

  function handleSort(field: string) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else {
      setSortField(field)
      setSortDir("asc")
    }
  }

  const TITLES: Record<InventoryCategory, string> = {
    green: "Green Coffee",
    roasted: "Roasted Coffee",
    packaging: "Packaging",
  }
  const title = TITLES[category]
  const hasFilters = !!search || !!statusFilter

  return (
    <div>
      <BackBtn onClick={onNavigateDashboard} label="Inventory" />
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 20,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <div className="section-eyebrow" style={{ marginBottom: 4 }}>
            Inventory · {title}
          </div>
          <h1
            style={{
              fontFamily: "Fraunces, serif",
              fontSize: 26,
              fontWeight: 700,
              color: "var(--text-primary)",
              margin: 0,
            }}
          >
            {title}
          </h1>
        </div>
        {canReceive && <button className="btn-primary">Record Receipt</button>}
      </div>

      <FilterBar
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[...Array(5)].map((_, i) => (
            <Sk key={i} h={isMobile ? 140 : 48} r={8} />
          ))}
        </div>
      )}
      {!loading && error && <ErrorPanel msg={error} onRetry={load} />}

      {!loading && !error && lots.length === 0 && (
        <EmptyState
          hasFilters={hasFilters}
          onClear={() => {
            setSearch("")
            setStatusFilter("")
          }}
          canReceive={canReceive}
        />
      )}

      {!loading && !error && lots.length > 0 && (
        <>
          {isMobile ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {lots.map((lot) => (
                <LotCard
                  key={lot.id}
                  lot={lot}
                  onSelect={() => onSelectLot(lot.id)}
                />
              ))}
            </div>
          ) : (
            <div
              style={{
                background: "var(--surface-01)",
                border: "1px solid var(--border-neutral)",
                borderRadius: "var(--radius-lg)",
                overflow: "hidden",
              }}
            >
              <InventoryTable
                lots={lots}
                category={category}
                onSelectLot={onSelectLot}
                sortField={sortField}
                sortDir={sortDir}
                onSort={handleSort}
              />
            </div>
          )}
          <Pagination
            page={page}
            total={total}
            pageSize={20}
            onChange={setPage}
          />
        </>
      )}
    </div>
  )
}

/* ─── Lot list (all categories) ───────────────────────────────── */

function LotListView({
  role,
  onSelectLot,
  onNavigateDashboard,
}: {
  role: string
  onSelectLot: (id: string) => void
  onNavigateDashboard: () => void
}) {
  const [lots, setLots] = useState<InventoryLot[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StockStatus | "">("")
  const [catFilter, setCatFilter] = useState<InventoryCategory | "">("")
  const [sortField, setSortField] = useState("name")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
  const { isMobile } = useBreakpoint()
  const canReceive = can(role as any, "inventory.receive")

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const res = await listLots({
        category: catFilter || undefined,
        status: statusFilter || undefined,
        search: search || undefined,
        page,
      })
      if (res.error) throw new Error(res.error)
      setLots(res.data?.lots ?? [])
      setTotal(res.data?.total ?? 0)
    } catch {
      setError("Unable to load inventory lots.")
    } finally {
      setLoading(false)
    }
  }, [catFilter, statusFilter, search, page])

  useEffect(() => {
    load()
  }, [load])

  function handleSort(field: string) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else {
      setSortField(field)
      setSortDir("asc")
    }
  }

  const hasFilters = !!search || !!statusFilter || !!catFilter

  return (
    <div>
      <BackBtn onClick={onNavigateDashboard} label="Inventory" />
      <div style={{ marginBottom: 20 }}>
        <div className="section-eyebrow" style={{ marginBottom: 4 }}>
          Inventory · All Lots
        </div>
        <h1
          style={{
            fontFamily: "Fraunces, serif",
            fontSize: 26,
            fontWeight: 700,
            color: "var(--text-primary)",
            margin: 0,
          }}
        >
          All Inventory Lots
        </h1>
      </div>

      <FilterBar
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        extraFilters={
          <select
            value={catFilter}
            onChange={(e) =>
              setCatFilter(e.target.value as InventoryCategory | "")
            }
            className="input-field"
            style={{ flex: "0 1 150px", fontSize: 13 }}
            aria-label="Filter by category"
          >
            <option value="">All Categories</option>
            <option value="green">Green Coffee</option>
            <option value="roasted">Roasted Coffee</option>
            <option value="packaging">Packaging</option>
          </select>
        }
      />

      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[...Array(6)].map((_, i) => (
            <Sk key={i} h={isMobile ? 140 : 48} r={8} />
          ))}
        </div>
      )}
      {!loading && error && <ErrorPanel msg={error} onRetry={load} />}

      {!loading && !error && lots.length === 0 && (
        <EmptyState
          hasFilters={hasFilters}
          onClear={() => {
            setSearch("")
            setStatusFilter("")
            setCatFilter("")
          }}
          canReceive={canReceive}
        />
      )}

      {!loading && !error && lots.length > 0 && (
        <>
          {isMobile ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {lots.map((lot) => (
                <LotCard
                  key={lot.id}
                  lot={lot}
                  onSelect={() => onSelectLot(lot.id)}
                />
              ))}
            </div>
          ) : (
            <div
              style={{
                background: "var(--surface-01)",
                border: "1px solid var(--border-neutral)",
                borderRadius: "var(--radius-lg)",
                overflow: "hidden",
              }}
            >
              <InventoryTable
                lots={lots}
                category="green"
                onSelectLot={onSelectLot}
                sortField={sortField}
                sortDir={sortDir}
                onSort={handleSort}
              />
            </div>
          )}
          <Pagination
            page={page}
            total={total}
            pageSize={20}
            onChange={setPage}
          />
        </>
      )}
    </div>
  )
}

/* ─── Lot detail view ─────────────────────────────────────────── */

function LotDetailView({
  lotId,
  role,
  onBack,
  onAdjust,
  onTransfer,
}: {
  lotId: string
  role: string
  onBack: () => void
  onAdjust: (lot: InventoryLot) => void
  onTransfer: (lot: InventoryLot) => void
}) {
  const [lot, setLot] = useState<InventoryLot | null>(null)
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [discrepancy, setDiscrepancy] = useState<InventoryDiscrepancy | null>(
    null,
  )
  const [loading, setLoading] = useState(true)
  const [mvLoading, setMvLoading] = useState(true)
  const [error, setError] = useState("")
  const [showDiscReview, setShowDiscReview] = useState(false)
  const [discDecision, setDiscDecision] =
    useState<"accept" | "adjust" | "investigate" | "">("")
  const [discNotes, setDiscNotes] = useState("")
  const [discAdjustedQty, setDiscAdjustedQty] = useState("")
  const [discSubmitting, setDiscSubmitting] = useState(false)
  const [discError, setDiscError] = useState("")
  const { isNarrow } = useBreakpoint()

  const canAdjust = can(role as any, "inventory.adjust")
  const canTransfer = can(role as any, "inventory.transfer")
  const canReview = can(role as any, "inventory.review")

  const load = useCallback(async () => {
    setLoading(true)
    setMvLoading(true)
    setError("")
    try {
      const [lotRes, discRes] = await Promise.all([
        getLot(lotId),
        getLotDiscrepancy(lotId),
      ])
      if (lotRes.error) throw new Error(lotRes.error)
      setLot(lotRes.data)
      setDiscrepancy(discRes.data)
    } catch {
      setError("Unable to load this inventory lot.")
    } finally {
      setLoading(false)
    }
    try {
      const mvRes = await getLotMovements(lotId)
      setMovements(mvRes.data ?? [])
    } finally {
      setMvLoading(false)
    }
  }, [lotId])

  useEffect(() => {
    load()
  }, [load])

  async function handleDiscReview(e: React.FormEvent) {
    e.preventDefault()
    if (!discDecision) {
      setDiscError("Please select a decision.")
      return
    }
    if (!discNotes.trim()) {
      setDiscError("Notes are required.")
      return
    }
    setDiscSubmitting(true)
    setDiscError("")
    try {
      await reviewDiscrepancy(discrepancy!.id, discDecision, {
        adjustedQty: discAdjustedQty || undefined,
        notes: discNotes,
      })
      setShowDiscReview(false)
      await load()
    } catch {
      setDiscError("Review could not be submitted. Please try again.")
    } finally {
      setDiscSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div>
        <BackBtn onClick={onBack} />
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Sk h={80} r={10} />
          <Sk h={140} r={10} />
          <Sk h={200} r={10} />
        </div>
      </div>
    )
  }

  if (error || !lot) {
    return (
      <div>
        <BackBtn onClick={onBack} />
        <div style={{ marginTop: 40, textAlign: "center" }}>
          <Ic
            d={D.warn}
            size={28}
            style={{
              color: "var(--sem-danger)",
              display: "block",
              margin: "0 auto 12px",
            }}
          />
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--text-primary)",
              marginBottom: 8,
            }}
          >
            Unable to load this inventory lot.
          </div>
          <button onClick={load} className="btn-secondary">
            <Ic
              d={D.retry}
              size={13}
              style={{ display: "inline", marginRight: 4 }}
            />
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const catLabel =
    lot.category === "green"
      ? "Green Coffee Lot"
      : lot.category === "roasted"
        ? "Roasted Coffee Lot"
        : "Packaging"
  const isLowOrCrit = lot.status === "low" || lot.status === "critical"

  return (
    <div style={{ paddingBottom: 40 }}>
      <BackBtn onClick={onBack} />

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 20,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <div className="section-eyebrow" style={{ marginBottom: 4 }}>
            {catLabel} ·{" "}
            <span style={{ fontFamily: "DM Mono, monospace" }}>
              {lot.lotNumber}
            </span>
          </div>
          <h1
            style={{
              fontFamily: "Fraunces, serif",
              fontSize: 26,
              fontWeight: 700,
              color: "var(--text-primary)",
              lineHeight: 1.2,
              margin: 0,
            }}
          >
            {lot.name}
          </h1>
          {lot.origin && (
            <div
              style={{
                fontSize: 14,
                color: "var(--text-secondary)",
                marginTop: 4,
              }}
            >
              {lot.origin} · {lot.supplier}
            </div>
          )}
        </div>
        <StockStatus status={lot.status} />
      </div>

      <div
        style={{
          display: isNarrow ? "block" : "grid",
          gridTemplateColumns: "1fr 320px",
          gap: 20,
        }}
      >
        {/* LEFT */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Availability panel */}
          <AvailabilityPanel lot={lot} large />

          {/* Warning panel when low/critical */}
          {isLowOrCrit && <StockWarningPanel lot={lot} />}

          {/* Discrepancy */}
          {discrepancy && <DiscrepancyPanel disc={discrepancy} />}

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {canAdjust && (
              <button
                className="btn-secondary"
                onClick={() => onAdjust(lot)}
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <Ic d={D.adjust} size={13} /> Adjust Stock
              </button>
            )}
            {canTransfer && (
              <button
                className="btn-secondary"
                onClick={() => onTransfer(lot)}
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <Ic d={D.transfer} size={13} /> Transfer
              </button>
            )}
            {canReview &&
              discrepancy &&
              discrepancy.reviewStatus === "pending" && (
                <button
                  onClick={() => setShowDiscReview(true)}
                  style={{
                    padding: "8px 18px",
                    background: "var(--sem-danger)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "var(--radius-md)",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Ic d={D.warn} size={13} /> Review Discrepancy
                </button>
              )}
          </div>

          {/* Movement history */}
          <div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "var(--text-primary)",
                marginBottom: 12,
              }}
            >
              Movement History
            </div>
            <MovementLog movements={movements} loading={mvLoading} />
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Lot details */}
          <div
            style={{
              background: "var(--surface-01)",
              border: "1px solid var(--border-neutral)",
              borderRadius: "var(--radius-lg)",
              padding: "18px 20px",
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "var(--text-primary)",
                marginBottom: 14,
              }}
            >
              Lot Details
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "Lot Number", value: lot.lotNumber, mono: true },
                { label: "Location", value: lot.location },
                lot.supplier
                  ? { label: "Supplier", value: lot.supplier }
                  : null,
                { label: "Received", value: lot.receivedDate },
                lot.initialQty
                  ? { label: "Initial Qty", value: lot.initialQty }
                  : null,
                { label: "Unit", value: lot.unit },
              ]
                .filter(Boolean)
                .map(({ label, value, mono }: any) => (
                  <div key={label}>
                    <Eyebrow>{label}</Eyebrow>
                    <div
                      style={{
                        fontSize: 13.5,
                        color: "var(--text-primary)",
                        fontFamily: mono ? "DM Mono, monospace" : undefined,
                      }}
                    >
                      {value}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Order connections */}
          {lot.orderConnections && lot.orderConnections.length > 0 && (
            <div
              style={{
                background: "var(--surface-01)",
                border: "1px solid var(--border-neutral)",
                borderRadius: "var(--radius-lg)",
                padding: "18px 20px",
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  marginBottom: 10,
                }}
              >
                Reserved for Orders
              </div>
              {lot.orderConnections.map((oc) => (
                <div
                  key={oc.orderId}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 0",
                    borderBottom: "1px solid var(--border-neutral)",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontFamily: "DM Mono, monospace",
                        fontSize: 12.5,
                        fontWeight: 700,
                        color: "var(--text-primary)",
                      }}
                    >
                      {oc.orderRef}
                    </div>
                    <div
                      style={{ fontSize: 12, color: "var(--text-secondary)" }}
                    >
                      Reserved: {oc.reservedQty}
                    </div>
                  </div>
                  <button
                    className="btn-ghost"
                    style={{ fontSize: 12, padding: "4px 8px" }}
                  >
                    View Order
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Production connections */}
          {lot.productionConnections &&
            lot.productionConnections.length > 0 && (
              <div
                style={{
                  background: "var(--surface-01)",
                  border: "1px solid var(--border-neutral)",
                  borderRadius: "var(--radius-lg)",
                  padding: "18px 20px",
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    marginBottom: 10,
                  }}
                >
                  Production Links
                </div>
                {lot.productionConnections.map((pc) => (
                  <div
                    key={pc.jobId}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 0",
                      borderBottom: "1px solid var(--border-neutral)",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontFamily: "DM Mono, monospace",
                          fontSize: 12.5,
                          fontWeight: 700,
                          color: "var(--text-primary)",
                        }}
                      >
                        {pc.jobRef}
                      </div>
                      <div
                        style={{ fontSize: 12, color: "var(--text-secondary)" }}
                      >
                        {pc.type === "roasting" ? "Roasting" : "Packing"} —{" "}
                        {pc.qty}
                      </div>
                    </div>
                    <button
                      className="btn-ghost"
                      style={{ fontSize: 12, padding: "4px 8px" }}
                    >
                      View Job
                    </button>
                  </div>
                ))}
              </div>
            )}
        </div>
      </div>

      {/* Discrepancy review dialog */}
      {showDiscReview && discrepancy && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="disc-review-title"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              background: "var(--surface-01)",
              borderRadius: "var(--radius-xl)",
              padding: 28,
              width: "100%",
              maxWidth: 520,
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "var(--shadow-modal)",
            }}
          >
            <div
              id="disc-review-title"
              style={{
                fontSize: 18,
                fontWeight: 700,
                fontFamily: "Fraunces, serif",
                color: "var(--text-primary)",
                marginBottom: 4,
              }}
            >
              Review Discrepancy
            </div>
            <div
              style={{
                fontSize: 13,
                color: "var(--text-secondary)",
                marginBottom: 18,
              }}
            >
              Lot{" "}
              <span style={{ fontFamily: "DM Mono, monospace" }}>
                {discrepancy.lotNumber}
              </span>
            </div>
            <DiscrepancyPanel disc={discrepancy} />
            <form onSubmit={handleDiscReview} style={{ marginTop: 20 }}>
              <div style={{ marginBottom: 14 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    marginBottom: 8,
                  }}
                >
                  Decision
                </div>
                {[
                  {
                    val: "accept",
                    label: "Accept as-is",
                    sub: "Accept the recorded quantity. Discrepancy will be noted.",
                  },
                  {
                    val: "adjust",
                    label: "Adjust and accept",
                    sub: "Record a corrected accepted quantity.",
                  },
                  {
                    val: "investigate",
                    label: "Request investigation",
                    sub: "Flag for further investigation before resolution.",
                  },
                ].map((opt) => (
                  <label
                    key={opt.val}
                    style={{
                      display: "flex",
                      gap: 10,
                      padding: "10px 14px",
                      marginBottom: 6,
                      border: `1px solid ${
                        discDecision === opt.val
                          ? "var(--brand-primary)"
                          : "var(--border-neutral)"
                      }`,
                      borderRadius: "var(--radius-md)",
                      cursor: "pointer",
                      background:
                        discDecision === opt.val
                          ? "var(--color-status-info-surface)"
                          : "transparent",
                    }}
                  >
                    <input
                      type="radio"
                      name="discDecision"
                      value={opt.val}
                      checked={discDecision === opt.val}
                      onChange={() => setDiscDecision(opt.val as any)}
                      style={{ marginTop: 2 }}
                    />
                    <div>
                      <div
                        style={{
                          fontSize: 13.5,
                          fontWeight: 500,
                          color: "var(--text-primary)",
                        }}
                      >
                        {opt.label}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        {opt.sub}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              {discDecision === "adjust" && (
                <div style={{ marginBottom: 14 }}>
                  <label
                    htmlFor="discAdjQty"
                    style={{
                      display: "block",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      marginBottom: 6,
                    }}
                  >
                    Corrected Quantity{" "}
                    <span style={{ color: "var(--sem-danger)" }}>*</span>
                  </label>
                  <input
                    id="discAdjQty"
                    type="text"
                    className="input-field"
                    style={{ width: "100%", fontFamily: "DM Mono, monospace" }}
                    value={discAdjustedQty}
                    onChange={(e) => setDiscAdjustedQty(e.target.value)}
                    placeholder="Accepted quantity"
                  />
                </div>
              )}
              <div style={{ marginBottom: 18 }}>
                <label
                  htmlFor="discNotes"
                  style={{
                    display: "block",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    marginBottom: 6,
                  }}
                >
                  Notes <span style={{ color: "var(--sem-danger)" }}>*</span>
                </label>
                <textarea
                  id="discNotes"
                  className="input-field"
                  rows={3}
                  style={{ width: "100%", resize: "vertical" }}
                  value={discNotes}
                  onChange={(e) => setDiscNotes(e.target.value)}
                  placeholder="Document your review decision…"
                />
              </div>
              {discError && (
                <div
                  style={{
                    color: "var(--sem-danger)",
                    fontSize: 13,
                    marginBottom: 14,
                  }}
                >
                  {discError}
                </div>
              )}
              <div
                style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}
              >
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowDiscReview(false)}
                  disabled={discSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={!discDecision || discSubmitting}
                >
                  {discSubmitting ? "Submitting…" : "Submit Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Adjustment form view ────────────────────────────────────── */

function AdjustmentView({
  lot,
  role,
  onBack,
  onSuccess,
}: {
  lot: InventoryLot
  role: string
  onBack: () => void
  onSuccess: () => void
}) {
  const [direction, setDirection] = useState<"add" | "remove">("add")
  const [quantity, setQuantity] = useState("")
  const [reason, setReason] = useState("")
  const [reference, setReference] = useState("")
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  function handleReview(e: React.FormEvent) {
    e.preventDefault()
    if (!quantity.trim()) {
      setError("Quantity is required.")
      return
    }
    if (!reason.trim()) {
      setError("Reason is required.")
      return
    }
    setError("")
    setShowConfirm(true)
  }

  async function handleConfirm() {
    setSubmitting(true)
    setError("")
    try {
      await recordInventoryAdjustment(lot.id, {
        direction,
        quantity: quantity.trim(),
        reason: reason.trim(),
        reference: reference.trim() || undefined,
      })
      onSuccess()
    } catch {
      setError("Adjustment could not be recorded. Please try again.")
      setShowConfirm(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <BackBtn onClick={onBack} label="Back to Lot" />
      <div style={{ marginBottom: 20 }}>
        <div className="section-eyebrow" style={{ marginBottom: 4 }}>
          Inventory Adjustment
        </div>
        <h1
          style={{
            fontFamily: "Fraunces, serif",
            fontSize: 24,
            fontWeight: 700,
            color: "var(--text-primary)",
            margin: 0,
          }}
        >
          {lot.name}
        </h1>
        <div
          style={{
            fontFamily: "DM Mono, monospace",
            fontSize: 12.5,
            color: "var(--text-muted)",
            marginTop: 4,
          }}
        >
          {lot.lotNumber}
        </div>
      </div>

      {/* Current stock */}
      <AvailabilityPanel lot={lot} />

      <div
        style={{
          margin: "16px 0",
          padding: "12px 16px",
          borderRadius: "var(--radius-md)",
          background: "var(--color-status-info-surface)",
          border: "1px solid var(--color-status-info-border)",
          fontSize: 13,
          color: "var(--text-secondary)",
          lineHeight: 1.6,
        }}
      >
        <Ic
          d={D.info}
          size={13}
          style={{
            display: "inline",
            marginRight: 5,
            color: "var(--sem-info)",
          }}
        />
        This creates an inventory movement. It does not directly edit the
        balance. The backend will apply the change and recalculate stock.
      </div>

      <form onSubmit={handleReview} style={{ maxWidth: 480 }}>
        {/* Direction */}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text-primary)",
              marginBottom: 8,
            }}
          >
            Adjustment Direction
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}
          >
            {[
              {
                val: "add",
                label: "+ Add Stock",
                desc: "Stock coming in or previously unrecorded.",
              },
              {
                val: "remove",
                label: "− Remove Stock",
                desc: "Correction, loss, or consumption.",
              },
            ].map((opt) => (
              <label
                key={opt.val}
                style={{
                  display: "flex",
                  gap: 10,
                  padding: "12px 14px",
                  cursor: "pointer",
                  border: `1.5px solid ${
                    direction === opt.val
                      ? "var(--brand-primary)"
                      : "var(--border-neutral)"
                  }`,
                  borderRadius: "var(--radius-md)",
                  background:
                    direction === opt.val
                      ? "var(--color-status-info-surface)"
                      : "transparent",
                }}
              >
                <input
                  type="radio"
                  name="dir"
                  value={opt.val}
                  checked={direction === opt.val}
                  onChange={() => setDirection(opt.val as "add" | "remove")}
                  style={{ marginTop: 2 }}
                />
                <div>
                  <div
                    style={{
                      fontSize: 13.5,
                      fontWeight: 600,
                      color: "var(--text-primary)",
                    }}
                  >
                    {opt.label}
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
                    {opt.desc}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label
            htmlFor="adjQty"
            style={{
              display: "block",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text-primary)",
              marginBottom: 6,
            }}
          >
            Quantity ({lot.unit}){" "}
            <span style={{ color: "var(--sem-danger)" }}>*</span>
          </label>
          <input
            id="adjQty"
            type="text"
            className="input-field"
            style={{
              width: "100%",
              fontFamily: "DM Mono, monospace",
              fontSize: 16,
            }}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder={`e.g. 20.0`}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label
            htmlFor="adjReason"
            style={{
              display: "block",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text-primary)",
              marginBottom: 6,
            }}
          >
            Reason <span style={{ color: "var(--sem-danger)" }}>*</span>
          </label>
          <textarea
            id="adjReason"
            className="input-field"
            rows={3}
            style={{ width: "100%", resize: "vertical" }}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Document why this adjustment is being recorded…"
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label
            htmlFor="adjRef"
            style={{
              display: "block",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text-primary)",
              marginBottom: 6,
            }}
          >
            Reference (optional)
          </label>
          <input
            id="adjRef"
            type="text"
            className="input-field"
            style={{ width: "100%", fontFamily: "DM Mono, monospace" }}
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="e.g. ADJ-2026-009"
          />
        </div>

        {error && (
          <div
            style={{
              color: "var(--sem-danger)",
              fontSize: 13,
              marginBottom: 14,
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" className="btn-secondary" onClick={onBack}>
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            Review Adjustment
          </button>
        </div>
      </form>

      {/* Confirmation dialog */}
      {showConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="adj-confirm-title"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              background: "var(--surface-01)",
              borderRadius: "var(--radius-xl)",
              padding: 28,
              width: "100%",
              maxWidth: 440,
              boxShadow: "var(--shadow-modal)",
            }}
          >
            <div
              id="adj-confirm-title"
              style={{
                fontSize: 17,
                fontWeight: 700,
                color: "var(--text-primary)",
                marginBottom: 16,
              }}
            >
              Record Inventory Adjustment?
            </div>
            <div
              style={{
                padding: "14px 16px",
                background: "var(--surface-02)",
                borderRadius: "var(--radius-md)",
                marginBottom: 16,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div>
                <Eyebrow>Current Available</Eyebrow>
                <Qty>{lot.available}</Qty>
              </div>
              <div>
                <Eyebrow>Adjustment</Eyebrow>
                <div
                  style={{
                    fontFamily: "DM Mono, monospace",
                    fontSize: 20,
                    fontWeight: 800,
                    color:
                      direction === "add"
                        ? "var(--sem-success)"
                        : "var(--sem-danger)",
                  }}
                >
                  {direction === "add" ? "+" : "−"}
                  {quantity} {lot.unit}
                </div>
              </div>
              <div>
                <Eyebrow>Reason</Eyebrow>
                <div style={{ fontSize: 13.5, color: "var(--text-secondary)" }}>
                  {reason}
                </div>
              </div>
            </div>
            {error && (
              <div
                style={{
                  color: "var(--sem-danger)",
                  fontSize: 13,
                  marginBottom: 14,
                }}
              >
                {error}
              </div>
            )}
            <div
              style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}
            >
              <button
                className="btn-secondary"
                onClick={() => setShowConfirm(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleConfirm}
                disabled={submitting}
              >
                {submitting ? "Recording…" : "Confirm Adjustment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Transfer form view ──────────────────────────────────────── */

function TransferView({
  lot,
  onBack,
  onSuccess,
}: {
  lot: InventoryLot
  onBack: () => void
  onSuccess: () => void
}) {
  const [fromLoc] = useState(lot.location)
  const [toLoc, setToLoc] = useState("")
  const [quantity, setQuantity] = useState("")
  const [reason, setReason] = useState("")
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const otherLocations = WAREHOUSE_LOCATIONS.filter((l) => l !== fromLoc)

  function handleReview(e: React.FormEvent) {
    e.preventDefault()
    if (!toLoc) {
      setError("Destination location is required.")
      return
    }
    if (!quantity.trim()) {
      setError("Quantity is required.")
      return
    }
    if (!reason.trim()) {
      setError("Reason is required.")
      return
    }
    setError("")
    setShowConfirm(true)
  }

  async function handleConfirm() {
    setSubmitting(true)
    setError("")
    try {
      await recordInventoryTransfer({
        lotId: lot.id,
        fromLocation: fromLoc,
        toLocation: toLoc,
        quantity: quantity.trim(),
        reason: reason.trim(),
      })
      onSuccess()
    } catch {
      setError("Transfer could not be recorded. Please try again.")
      setShowConfirm(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <BackBtn onClick={onBack} label="Back to Lot" />
      <div style={{ marginBottom: 20 }}>
        <div className="section-eyebrow" style={{ marginBottom: 4 }}>
          Stock Transfer
        </div>
        <h1
          style={{
            fontFamily: "Fraunces, serif",
            fontSize: 24,
            fontWeight: 700,
            color: "var(--text-primary)",
            margin: 0,
          }}
        >
          {lot.name}
        </h1>
        <div
          style={{
            fontFamily: "DM Mono, monospace",
            fontSize: 12.5,
            color: "var(--text-muted)",
            marginTop: 4,
          }}
        >
          {lot.lotNumber}
        </div>
      </div>

      <AvailabilityPanel lot={lot} />

      <div
        style={{
          margin: "16px 0",
          padding: "12px 16px",
          borderRadius: "var(--radius-md)",
          background: "var(--color-status-info-surface)",
          border: "1px solid var(--color-status-info-border)",
          fontSize: 13,
          color: "var(--text-secondary)",
          lineHeight: 1.6,
        }}
      >
        <Ic
          d={D.info}
          size={13}
          style={{
            display: "inline",
            marginRight: 5,
            color: "var(--sem-info)",
          }}
        />
        This creates a transfer movement. The stock remains in this lot but the
        location is updated.
      </div>

      <form onSubmit={handleReview} style={{ maxWidth: 480 }}>
        <div style={{ marginBottom: 14 }}>
          <label
            style={{
              display: "block",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text-primary)",
              marginBottom: 6,
            }}
          >
            From Location
          </label>
          <div
            style={{
              padding: "10px 14px",
              background: "var(--surface-02)",
              border: "1px solid var(--border-neutral)",
              borderRadius: "var(--radius-md)",
              fontSize: 13.5,
              color: "var(--text-secondary)",
              fontStyle: "italic",
            }}
          >
            {fromLoc}
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label
            htmlFor="toLoc"
            style={{
              display: "block",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text-primary)",
              marginBottom: 6,
            }}
          >
            To Location <span style={{ color: "var(--sem-danger)" }}>*</span>
          </label>
          <select
            id="toLoc"
            className="input-field"
            style={{ width: "100%", fontSize: 13 }}
            value={toLoc}
            onChange={(e) => setToLoc(e.target.value)}
          >
            <option value="">Select destination…</option>
            {otherLocations.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label
            htmlFor="tfrQty"
            style={{
              display: "block",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text-primary)",
              marginBottom: 6,
            }}
          >
            Quantity ({lot.unit}){" "}
            <span style={{ color: "var(--sem-danger)" }}>*</span>
          </label>
          <input
            id="tfrQty"
            type="text"
            className="input-field"
            style={{
              width: "100%",
              fontFamily: "DM Mono, monospace",
              fontSize: 16,
            }}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Quantity to transfer"
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label
            htmlFor="tfrReason"
            style={{
              display: "block",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text-primary)",
              marginBottom: 6,
            }}
          >
            Reason <span style={{ color: "var(--sem-danger)" }}>*</span>
          </label>
          <textarea
            id="tfrReason"
            className="input-field"
            rows={3}
            style={{ width: "100%", resize: "vertical" }}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for the transfer…"
          />
        </div>

        {error && (
          <div
            style={{
              color: "var(--sem-danger)",
              fontSize: 13,
              marginBottom: 14,
            }}
          >
            {error}
          </div>
        )}
        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" className="btn-secondary" onClick={onBack}>
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            Review Transfer
          </button>
        </div>
      </form>

      {/* Confirmation dialog */}
      {showConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="tfr-confirm-title"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              background: "var(--surface-01)",
              borderRadius: "var(--radius-xl)",
              padding: 28,
              width: "100%",
              maxWidth: 440,
              boxShadow: "var(--shadow-modal)",
            }}
          >
            <div
              id="tfr-confirm-title"
              style={{
                fontSize: 17,
                fontWeight: 700,
                color: "var(--text-primary)",
                marginBottom: 16,
              }}
            >
              Confirm Stock Transfer?
            </div>
            <div
              style={{
                padding: "14px 16px",
                background: "var(--surface-02)",
                borderRadius: "var(--radius-md)",
                marginBottom: 16,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div>
                <Eyebrow>Item</Eyebrow>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                  }}
                >
                  {lot.name}
                </div>
              </div>
              <div>
                <Eyebrow>Quantity</Eyebrow>
                <div
                  style={{
                    fontFamily: "DM Mono, monospace",
                    fontSize: 20,
                    fontWeight: 800,
                    color: "var(--text-primary)",
                  }}
                >
                  {quantity} {lot.unit}
                </div>
              </div>
              <div>
                <Eyebrow>From</Eyebrow>
                <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                  {fromLoc}
                </div>
              </div>
              <div>
                <Eyebrow>To</Eyebrow>
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--text-primary)",
                    fontWeight: 600,
                  }}
                >
                  {toLoc}
                </div>
              </div>
              <div>
                <Eyebrow>Reason</Eyebrow>
                <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                  {reason}
                </div>
              </div>
            </div>
            {error && (
              <div
                style={{
                  color: "var(--sem-danger)",
                  fontSize: 13,
                  marginBottom: 14,
                }}
              >
                {error}
              </div>
            )}
            <div
              style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}
            >
              <button
                className="btn-secondary"
                onClick={() => setShowConfirm(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleConfirm}
                disabled={submitting}
              >
                {submitting ? "Transferring…" : "Confirm Transfer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════ */
/*  ROOT COMPONENT                                                 */
/* ═══════════════════════════════════════════════════════════════ */

export default function Inventory() {
  const { currentUser } = useAuth()
  const role = currentUser?.role ?? "viewer"

  const [view, setView] = useState<View>("dashboard")
  const [selectedLotId, setSelectedLotId] = useState<string | null>(null)
  const [selectedLot, setSelectedLot] = useState<InventoryLot | null>(null)
  const [prevView, setPrevView] = useState<View>("dashboard")

  function navigate(v: View, lotId?: string) {
    setPrevView(view)
    setView(v)
    if (lotId) setSelectedLotId(lotId)
  }

  function selectLot(id: string) {
    setSelectedLotId(id)
    setPrevView(view)
    setView("lot-detail")
  }

  if (!can(role as any, "inventory.view")) {
    return (
      <div style={{ padding: "48px 24px", textAlign: "center" }}>
        <Ic
          d={D.warn}
          size={28}
          style={{
            color: "var(--sem-danger)",
            display: "block",
            margin: "0 auto 12px",
          }}
        />
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: 6,
          }}
        >
          Access Denied
        </div>
        <div style={{ fontSize: 14, color: "var(--text-secondary)" }}>
          You do not have permission to view inventory.
        </div>
      </div>
    )
  }

  const wrap = (children: React.ReactNode) => (
    <div style={{ padding: "20px 24px", maxWidth: 1200, margin: "0 auto" }}>
      {children}
    </div>
  )

  if (view === "lot-detail" && selectedLotId) {
    return wrap(
      <LotDetailView
        lotId={selectedLotId}
        role={role}
        onBack={() => setView(prevView)}
        onAdjust={(lot) => {
          setSelectedLot(lot)
          setView("adjustment")
        }}
        onTransfer={(lot) => {
          setSelectedLot(lot)
          setView("transfer")
        }}
      />,
    )
  }

  if (view === "adjustment" && selectedLot) {
    return wrap(
      <AdjustmentView
        lot={selectedLot}
        role={role}
        onBack={() => setView("lot-detail")}
        onSuccess={() => setView("lot-detail")}
      />,
    )
  }

  if (view === "transfer" && selectedLot) {
    return wrap(
      <TransferView
        lot={selectedLot}
        onBack={() => setView("lot-detail")}
        onSuccess={() => setView("lot-detail")}
      />,
    )
  }

  if (view === "green" || view === "roasted" || view === "packaging") {
    return wrap(
      <CategoryListView
        category={view}
        role={role}
        onSelectLot={selectLot}
        onNavigateDashboard={() => setView("dashboard")}
      />,
    )
  }

  if (view === "lot-list") {
    return wrap(
      <LotListView
        role={role}
        onSelectLot={selectLot}
        onNavigateDashboard={() => setView("dashboard")}
      />,
    )
  }

  return wrap(<DashboardView role={role} onNavigate={navigate} />)
}
