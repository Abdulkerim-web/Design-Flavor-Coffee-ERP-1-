/**
 * Production.tsx — F3-07
 * Roasting, Production Workflow & Roasting Job Experience
 *
 * Views: list | detail
 * All quantities/tolerances/ranges are opaque strings from backend.
 * Frontend RENDERS. Backend CALCULATES.
 * No yield, loss, discrepancy, or range calculations in this file.
 */

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "../contexts/AuthContext"
import { can } from "../lib/can"
import { useBreakpoint } from "../hooks/useBreakpoint"
import {
  listRoastingJobs,
  getRoastingJob,
  getRoastingDashboardStats,
  startRoasting,
  completeBatch,
  reportRoastingComplete,
  confirmRoastedReceipt,
  reviewRoastingDiscrepancy,
} from "../services/operations"
import { apiRequest } from "../services/api"
import useSupabaseRealtime from "../hooks/useSupabaseRealtime"
import type {
  RoastingJob,
  RoastingBatch,
  RoastingJobStatus,
  OperationalEvent,
  RoastingDashboardStats,
} from "../services/operations"

/* ─── View routing ────────────────────────────────────────────── */

type View = "list" | "detail"

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
  back: "M15 18l-6-6 6-6",
  warn: "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01",
  bolt: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  check: "M20 6L9 17l-5-5",
  xCircle: "M22 12a10 10 0 11-20 0 10 10 0 0120 0zM15 9l-6 6M9 9l6 6",
  clock: "M12 22a10 10 0 110-20 10 10 0 010 20zM12 6v6l4 2",
  checkOk: "M9 12l2 2 4-4M22 12a10 10 0 11-20 0 10 10 0 0120 0z",
  flame:
    "M12 2c0 0-5 5-5 11a5 5 0 0010 0c0-6-5-11-5-11zM9.5 14a3 3 0 005.5-1.5c0-3.5-3-6.5-3-6.5S9.5 10 9.5 14z",
  retry:
    "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15",
  adjust: "M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z",
  info: "M12 22a10 10 0 110-20 10 10 0 010 20zM12 8v4M12 16h.01",
}

/* ─── Status badge ─────────────────────────────────────────────── */

const STATUS_BADGE: Record<RoastingJobStatus, { cls: string label: string }> = {
  pending: { cls: "badge badge-gray", label: "Pending" },
  "in-progress": { cls: "badge badge-blue", label: "In Progress" },
  "awaiting-storekeeper": {
    cls: "badge badge-amber",
    label: "Awaiting Storekeeper",
  },
  "awaiting-manager": { cls: "badge badge-amber", label: "Awaiting Manager" },
  discrepancy: { cls: "badge badge-red", label: "Discrepancy" },
  accepted: { cls: "badge badge-green", label: "Accepted" },
  completed: { cls: "badge badge-green", label: "Completed" },
  failed: { cls: "badge badge-red", label: "Failed" },
}

function StatusBadge({ status }: { status: RoastingJobStatus }) {
  const cfg = STATUS_BADGE[status] ?? STATUS_BADGE["pending"]
  return <span className={cfg.cls}>{cfg.label}</span>
}

/* ─── Typography helpers ───────────────────────────────────────── */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="section-eyebrow" style={{ marginBottom: 4 }}>
      {children}
    </div>
  )
}

function Qty({
  children,
  large,
}: {
  children: React.ReactNode
  large?: boolean
}) {
  return (
    <div
      style={{
        fontFamily: "DM Mono, monospace",
        fontSize: large ? 26 : 18,
        fontWeight: 700,
        color: "var(--text-primary)",
        lineHeight: 1.1,
      }}
    >
      {children}
    </div>
  )
}

/* ─── Back button ─────────────────────────────────────────────── */

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="btn-ghost"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontSize: 13,
        marginBottom: 20,
      }}
    >
      <Ic d={D.back} size={14} /> All Jobs
    </button>
  )
}

/* ─── Skeleton ────────────────────────────────────────────────── */

function Sk({ h = 40, r = 8 }: { h?: number r?: number }) {
  return (
    <div className="skeleton-shimmer" style={{ height: h, borderRadius: r }} />
  )
}

/* ─── Urgency pill ────────────────────────────────────────────── */

function UrgentPill() {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 8px",
        borderRadius: "var(--radius-pill)",
        background: "var(--color-status-danger-surface)",
        border: "1px solid var(--color-status-danger-border)",
        fontSize: 11,
        fontWeight: 700,
        color: "var(--sem-danger)",
        letterSpacing: "0.04em",
        textTransform: "uppercase" as const,
      }}
    >
      <Ic d={D.bolt} size={10} /> Urgent
    </span>
  )
}

/* ─── Roasting Requirement Panel ──────────────────────────────── */

function RoastingRequirementPanel({ job }: { job: RoastingJob }) {
  const range = job.managerAdjustedRange

  return (
    <div
      style={{
        background: "var(--surface-01)",
        border: "1.5px solid var(--border-neutral)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "10px 18px",
          background: "var(--surface-02)",
          borderBottom: "1px solid var(--border-neutral)",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Ic d={D.flame} size={13} style={{ color: "var(--text-muted)" }} />
        <span className="section-eyebrow" style={{ margin: 0 }}>
          Roasting Requirement
        </span>
      </div>

      <div style={{ padding: "18px 20px" }}>
        {/* Required green + allowed range */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px 24px",
            marginBottom: 16,
          }}
        >
          <div>
            <Eyebrow>Required Green Coffee</Eyebrow>
            <Qty large>{job.requiredGreenQty}</Qty>
          </div>
          <div>
            <Eyebrow>Expected Roasted Output</Eyebrow>
            <Qty>{job.expectedOutput}</Qty>
          </div>
        </div>

        {/* Allowed range — prominent */}
        <div
          style={{
            padding: "12px 16px",
            background: range
              ? "var(--color-status-warning-surface)"
              : "var(--color-status-info-surface)",
            border: `1.5px solid ${
              range
                ? "var(--color-status-warning-border)"
                : "var(--color-status-info-border)"
            }`,
            borderRadius: "var(--radius-md)",
            marginBottom: range ? 12 : 0,
          }}
        >
          <div
            className="section-eyebrow"
            style={{
              marginBottom: 6,
              color: range ? "var(--sem-warning)" : "var(--color-status-info)",
            }}
          >
            {range ? "Manager-Adjusted Accepted Range" : "Accepted Input Range"}
          </div>
          <div
            style={{
              fontFamily: "DM Mono, monospace",
              fontSize: 20,
              fontWeight: 800,
              color: range ? "var(--sem-warning)" : "var(--color-status-info)",
              letterSpacing: "-0.01em",
            }}
          >
            {range
              ? `${range.min} — ${range.max}`
              : `${job.allowedMin} — ${job.allowedMax}`}
          </div>
          <div
            style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}
          >
            PHP determines whether the recorded input is within range.
          </div>
        </div>

        {/* Manager-adjusted range detail */}
        {range && (
          <div
            style={{
              padding: "10px 14px",
              background: "var(--surface-02)",
              border: "1px solid var(--border-neutral)",
              borderRadius: "var(--radius-sm)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 4,
              }}
            >
              <Ic
                d={D.adjust}
                size={12}
                style={{ color: "var(--text-muted)" }}
              />
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                }}
              >
                Manager-adjusted range
              </span>
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--text-secondary)",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 4,
              }}
            >
              <span>
                Adjusted by:{" "}
                <strong style={{ color: "var(--text-primary)" }}>
                  {range.adjustedBy}
                </strong>
              </span>
              <span
                style={{ fontFamily: "DM Mono, monospace", fontSize: 11.5 }}
              >
                {range.adjustedAt}
              </span>
              {range.reason && (
                <span style={{ gridColumn: "1 / -1", fontStyle: "italic" }}>
                  Reason: {range.reason}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Remaining Requirement ───────────────────────────────────── */

function RemainingRequirement({
  remainingReq,
  status,
}: {
  remainingReq: string
  status: RoastingJobStatus
}) {
  const isDone = remainingReq === "0 KG" || remainingReq === "0"
  return (
    <div
      style={{
        padding: "14px 18px",
        background: isDone
          ? "var(--color-status-safe-surface)"
          : "var(--surface-01)",
        border: `1.5px solid ${
          isDone ? "var(--color-status-safe-border)" : "var(--border-neutral)"
        }`,
        borderRadius: "var(--radius-lg)",
        display: "flex",
        alignItems: "center",
        gap: 14,
      }}
    >
      {isDone ? (
        <Ic
          d={D.checkOk}
          size={20}
          style={{ color: "var(--sem-success)", flexShrink: 0 }}
        />
      ) : (
        <Ic
          d={D.flame}
          size={20}
          style={{ color: "var(--text-muted)", flexShrink: 0 }}
        />
      )}
      <div>
        <Eyebrow>
          {isDone ? "Requirement Fulfilled" : "Remaining to Roast"}
        </Eyebrow>
        <div
          style={{
            fontFamily: "DM Mono, monospace",
            fontSize: 24,
            fontWeight: 800,
            color: isDone ? "var(--sem-success)" : "var(--text-primary)",
          }}
        >
          {remainingReq}
        </div>
        {!isDone && (
          <div
            style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}
          >
            Value supplied by backend — not calculated in frontend.
          </div>
        )}
        {isDone && status === "in-progress" && (
          <div
            style={{ fontSize: 12, color: "var(--sem-success)", marginTop: 2 }}
          >
            All required roasting batches have been recorded. Mark complete when
            ready.
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Timeline ────────────────────────────────────────────────── */

function Timeline({ events }: { events: OperationalEvent[] }) {
  if (!events.length)
    return (
      <div
        style={{
          padding: "24px 0",
          textAlign: "center",
          color: "var(--text-muted)",
          fontSize: 13,
        }}
      >
        No activity recorded yet.
      </div>
    )
  return (
    <div style={{ position: "relative", paddingLeft: 28 }}>
      {events.map((ev, idx) => {
        const isLast = idx === events.length - 1
        let dotColor = "var(--border-neutral)"
        let pulse = false
        if (ev.state === "completed") dotColor = "var(--sem-success)"
        else if (ev.state === "current") {
          dotColor = "var(--sem-info)"
          pulse = true
        } else if (ev.state === "warning") dotColor = "var(--sem-warning)"

        return (
          <div
            key={ev.id}
            style={{ position: "relative", paddingBottom: isLast ? 0 : 20 }}
          >
            {!isLast && (
              <div
                style={{
                  position: "absolute",
                  left: -20,
                  top: 20,
                  bottom: 0,
                  width: 2,
                  background: "var(--border-neutral)",
                }}
              />
            )}
            <div
              style={{
                position: "absolute",
                left: -26,
                top: 3,
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: ev.state === "pending" ? "transparent" : dotColor,
                border: `2px solid ${dotColor}`,
                ...(pulse
                  ? { animation: "timelinePulse 2s ease-in-out infinite" }
                  : {}),
              }}
            />
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  lineHeight: 1.4,
                }}
              >
                {ev.event}
              </div>
              {ev.actor && (
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-secondary)",
                    marginTop: 2,
                  }}
                >
                  {ev.actor}
                </div>
              )}
              {ev.quantity && (
                <div
                  style={{
                    fontSize: 12,
                    fontFamily: "DM Mono, monospace",
                    color: "var(--text-secondary)",
                    marginTop: 2,
                  }}
                >
                  {ev.quantity}
                </div>
              )}
              {ev.notes && (
                <div
                  style={{
                    fontSize: 11.5,
                    color: "var(--text-muted)",
                    marginTop: 2,
                    fontStyle: "italic",
                  }}
                >
                  {ev.notes}
                </div>
              )}
              <div
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                  marginTop: 4,
                  fontFamily: "DM Mono, monospace",
                }}
              >
                {ev.timestamp}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ─── Batch Card ──────────────────────────────────────────────── */

function BatchCard({ batch }: { batch: RoastingBatch }) {
  const failed = batch.status === "failed"
  const inProgress = batch.status === "in-progress"
  const completed = batch.status === "completed"

  return (
    <div
      style={{
        border: `1.5px solid ${
          failed
            ? "var(--sem-danger)"
            : inProgress
              ? "var(--sem-info)"
              : "var(--border-neutral)"
        }`,
        borderRadius: "var(--radius-md)",
        padding: "14px 18px",
        marginBottom: 10,
        background: failed
          ? "var(--color-status-danger-surface)"
          : "var(--bg-primary)",
      }}
    >
      {/* Batch header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <div
          style={{
            fontFamily: "DM Mono, monospace",
            fontWeight: 700,
            fontSize: 13,
            color: "var(--text-primary)",
          }}
        >
          Batch #{batch.batchNumber}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {inProgress && <span className="badge badge-blue">In Progress</span>}
          {completed && <span className="badge badge-green">Completed</span>}
          {failed && (
            <span
              style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
              className="badge badge-red"
            >
              <Ic d={D.xCircle} size={10} /> Failed
            </span>
          )}
        </div>
      </div>

      {/* Quantity grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "8px 16px",
          marginBottom: 10,
        }}
      >
        <div>
          <Eyebrow>Green Input</Eyebrow>
          <div
            style={{
              fontFamily: "DM Mono, monospace",
              fontSize: 16,
              fontWeight: 700,
              color: "var(--text-primary)",
            }}
          >
            {batch.inputQty}
          </div>
        </div>
        <div>
          <Eyebrow>Roasted Output</Eyebrow>
          <div
            style={{
              fontFamily: "DM Mono, monospace",
              fontSize: 16,
              fontWeight: 700,
              color: completed ? "var(--sem-success)" : "var(--text-primary)",
            }}
          >
            {batch.outputQty}
          </div>
        </div>
        <div>
          <Eyebrow>Loss</Eyebrow>
          <div
            style={{
              fontFamily: "DM Mono, monospace",
              fontSize: 14,
              fontWeight: 600,
              color: "var(--text-secondary)",
            }}
          >
            {batch.loss}{" "}
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
              ({batch.lossPercent})
            </span>
          </div>
        </div>
      </div>

      {/* Meta */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "4px 16px",
          fontSize: 12.5,
          color: "var(--text-secondary)",
        }}
      >
        <span>
          Roaster:{" "}
          <strong style={{ color: "var(--text-primary)" }}>
            {batch.roaster}
          </strong>
        </span>
        <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11.5 }}>
          {batch.startedAt}
        </span>
        {batch.completedAt && (
          <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11.5 }}>
            Done: {batch.completedAt}
          </span>
        )}
      </div>

      {batch.notes && (
        <div
          style={{
            marginTop: 8,
            fontSize: 12.5,
            color: "var(--text-secondary)",
            fontStyle: "italic",
          }}
        >
          {batch.notes}
        </div>
      )}

      {failed && batch.failureReason && (
        <div
          style={{
            marginTop: 10,
            padding: "8px 12px",
            borderRadius: "var(--radius-sm)",
            background: "var(--color-status-danger-surface)",
            border: "1px solid var(--color-status-danger-border)",
            color: "var(--sem-danger)",
            fontSize: 12.5,
          }}
        >
          <Ic
            d={D.warn}
            size={12}
            style={{ display: "inline", marginRight: 5 }}
          />
          <strong>Failure reason:</strong> {batch.failureReason}
        </div>
      )}
    </div>
  )
}

/* ─── Add Batch Modal ─────────────────────────────────────────── */

function AddBatchModal({
  job,
  onClose,
  onSuccess,
}: {
  job: RoastingJob
  onClose: () => void
  onSuccess: () => void
}) {
  const [greenInput, setGreenInput] = useState("")
  const [outputQty, setOutputQty] = useState("")
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!greenInput.trim()) {
      setError("Green coffee input quantity is required.")
      return
    }
    if (!outputQty.trim()) {
      setError("Roasted output quantity is required.")
      return
    }
    setError("")
    setSubmitting(true)
    try {
      await completeBatch(job.id, {
        greenInputQty: greenInput.trim(),
        outputQty: outputQty.trim(),
        notes: notes.trim() || undefined,
      })
      onSuccess()
    } catch {
      setError(
        "Failed to record batch. Please check your connection and try again.",
      )
    } finally {
      setSubmitting(false)
    }
  }

  const batchNum = job.batches.length + 1

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="batch-modal-title"
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
          padding: "28px",
          width: "100%",
          maxWidth: 500,
          boxShadow: "var(--shadow-modal)",
        }}
      >
        <div
          id="batch-modal-title"
          style={{
            fontSize: 18,
            fontWeight: 700,
            fontFamily: "Fraunces, serif",
            color: "var(--text-primary)",
            marginBottom: 4,
          }}
        >
          Record Batch {batchNum}
        </div>
        <div
          style={{
            fontSize: 13,
            color: "var(--text-secondary)",
            marginBottom: 20,
          }}
        >
          <span style={{ fontFamily: "DM Mono, monospace" }}>{job.ref}</span> —{" "}
          {job.coffee}
        </div>

        {/* Allowed range panel */}
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "var(--radius-md)",
            background: "var(--color-status-info-surface)",
            border: "1.5px solid var(--color-status-info-border)",
            marginBottom: 20,
          }}
        >
          <div
            className="section-eyebrow"
            style={{ marginBottom: 4, color: "var(--color-status-info)" }}
          >
            {job.managerAdjustedRange
              ? "Manager-Adjusted Accepted Range"
              : "Accepted Input Range"}
          </div>
          <div
            style={{
              fontFamily: "DM Mono, monospace",
              fontSize: 20,
              fontWeight: 800,
              color: "var(--color-status-info)",
            }}
          >
            {job.managerAdjustedRange
              ? `${job.managerAdjustedRange.min} — ${job.managerAdjustedRange.max}`
              : `${job.allowedMin} — ${job.allowedMax}`}
          </div>
          <div
            style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 4 }}
          >
            Expected output: {job.expectedOutput}. PHP validates whether the
            recorded quantities are within range.
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Green input qty */}
          <div style={{ marginBottom: 16 }}>
            <label
              htmlFor="greenInput"
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text-primary)",
                marginBottom: 6,
              }}
            >
              Green Coffee Used (KG){" "}
              <span style={{ color: "var(--sem-danger)" }}>*</span>
            </label>
            <input
              id="greenInput"
              type="text"
              className="input-field"
              style={{
                width: "100%",
                fontFamily: "DM Mono, monospace",
                fontSize: 16,
              }}
              value={greenInput}
              onChange={(e) => setGreenInput(e.target.value)}
              placeholder="e.g. 30.0"
              autoComplete="off"
            />
            <div
              style={{
                fontSize: 11.5,
                color: "var(--text-muted)",
                marginTop: 4,
              }}
            >
              Actual green coffee loaded into the roaster.
            </div>
          </div>

          {/* Roasted output qty */}
          <div style={{ marginBottom: 16 }}>
            <label
              htmlFor="outputQty"
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text-primary)",
                marginBottom: 6,
              }}
            >
              Roasted Coffee Output (KG){" "}
              <span style={{ color: "var(--sem-danger)" }}>*</span>
            </label>
            <input
              id="outputQty"
              type="text"
              className="input-field"
              style={{
                width: "100%",
                fontFamily: "DM Mono, monospace",
                fontSize: 16,
              }}
              value={outputQty}
              onChange={(e) => setOutputQty(e.target.value)}
              placeholder="e.g. 25.8"
              autoComplete="off"
            />
            <div
              style={{
                fontSize: 11.5,
                color: "var(--text-muted)",
                marginTop: 4,
              }}
            >
              Weighed roasted output. Loss and yield calculated by PHP.
            </div>
          </div>

          {/* Notes */}
          <div style={{ marginBottom: 20 }}>
            <label
              htmlFor="batchNotes"
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text-primary)",
                marginBottom: 6,
              }}
            >
              Notes (optional)
            </label>
            <textarea
              id="batchNotes"
              className="input-field"
              rows={3}
              style={{ width: "100%", resize: "vertical" }}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observations, equipment notes, etc."
            />
          </div>

          {error && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "var(--radius-sm)",
                marginBottom: 16,
                background: "var(--color-status-danger-surface)",
                border: "1px solid var(--color-status-danger-border)",
                fontSize: 13,
                color: "var(--sem-danger)",
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "Recording…" : "Record Batch"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─── Report Complete Modal ───────────────────────────────────── */

function ReportCompleteModal({
  job,
  onClose,
  onSuccess,
}: {
  job: RoastingJob
  onClose: () => void
  onSuccess: () => void
}) {
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  async function handleConfirm() {
    setSubmitting(true)
    setError("")
    try {
      await reportRoastingComplete(
        job.id,
        job.roastedOutput,
        notes.trim() || undefined,
      )
      onSuccess()
    } catch {
      setError("Failed to report completion. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="complete-modal-title"
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
          maxWidth: 480,
          boxShadow: "var(--shadow-modal)",
        }}
      >
        <div
          id="complete-modal-title"
          style={{
            fontSize: 18,
            fontWeight: 700,
            fontFamily: "Fraunces, serif",
            color: "var(--text-primary)",
            marginBottom: 4,
          }}
        >
          Report Roasting Complete
        </div>
        <div
          style={{
            fontSize: 13,
            color: "var(--text-secondary)",
            marginBottom: 20,
          }}
        >
          <span style={{ fontFamily: "DM Mono, monospace" }}>{job.ref}</span>
        </div>

        <div
          style={{
            padding: "14px 16px",
            borderRadius: "var(--radius-md)",
            background: "var(--surface-02)",
            border: "1px solid var(--border-neutral)",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontSize: 13.5,
              color: "var(--text-secondary)",
              marginBottom: 12,
              lineHeight: 1.6,
            }}
          >
            This will notify the Storekeeper and Manager that the roasted coffee
            is ready for physical receipt. Ensure all batches have been recorded
            before proceeding.
          </div>
          <Eyebrow>Total Roasted Output Recorded</Eyebrow>
          <Qty>{job.roastedOutput}</Qty>
          <div style={{ marginTop: 10 }}>
            <Eyebrow>Remaining Requirement</Eyebrow>
            <div
              style={{
                fontFamily: "DM Mono, monospace",
                fontSize: 15,
                fontWeight: 600,
                color: "var(--text-secondary)",
              }}
            >
              {job.remainingReq}
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label
            htmlFor="completeNotes"
            style={{
              display: "block",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text-primary)",
              marginBottom: 6,
            }}
          >
            Notes (optional)
          </label>
          <textarea
            id="completeNotes"
            className="input-field"
            rows={3}
            style={{ width: "100%", resize: "vertical" }}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Final notes for the storekeeper or manager…"
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

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            className="btn-secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={handleConfirm}
            disabled={submitting}
          >
            {submitting ? "Reporting…" : "Confirm & Notify"}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Confirm Receipt Modal ───────────────────────────────────── */

function ConfirmReceiptModal({
  job,
  onClose,
  onSuccess,
}: {
  job: RoastingJob
  onClose: () => void
  onSuccess: () => void
}) {
  const [confirmedQty, setConfirmedQty] = useState("")
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!confirmedQty.trim()) {
      setError("Confirmed quantity is required.")
      return
    }
    setSubmitting(true)
    setError("")
    try {
      await confirmRoastedReceipt(
        job.id,
        confirmedQty.trim(),
        notes.trim() || undefined,
      )
      onSuccess()
    } catch {
      setError("Failed to confirm receipt. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-modal-title"
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
          maxWidth: 480,
          boxShadow: "var(--shadow-modal)",
        }}
      >
        <div
          id="receipt-modal-title"
          style={{
            fontSize: 18,
            fontWeight: 700,
            fontFamily: "Fraunces, serif",
            color: "var(--text-primary)",
            marginBottom: 4,
          }}
        >
          Confirm Roasted Receipt
        </div>
        <div
          style={{
            fontSize: 13,
            color: "var(--text-secondary)",
            marginBottom: 20,
          }}
        >
          <span style={{ fontFamily: "DM Mono, monospace" }}>{job.ref}</span> —{" "}
          {job.coffee}
        </div>

        <div
          style={{
            padding: "12px 16px",
            borderRadius: "var(--radius-md)",
            background: "var(--surface-02)",
            border: "1px solid var(--border-neutral)",
            marginBottom: 16,
          }}
        >
          <Eyebrow>Reported Roasted Output</Eyebrow>
          <Qty>{job.roastedOutput}</Qty>
          {job.completedAt && (
            <div
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                marginTop: 4,
                fontFamily: "DM Mono, monospace",
              }}
            >
              Reported at: {job.completedAt}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label
              htmlFor="confirmedQty"
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text-primary)",
                marginBottom: 6,
              }}
            >
              Physically Confirmed Quantity (KG){" "}
              <span style={{ color: "var(--sem-danger)" }}>*</span>
            </label>
            <input
              id="confirmedQty"
              type="text"
              className="input-field"
              style={{
                width: "100%",
                fontFamily: "DM Mono, monospace",
                fontSize: 16,
              }}
              value={confirmedQty}
              onChange={(e) => setConfirmedQty(e.target.value)}
              placeholder="Physical count in KG"
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label
              htmlFor="receiptNotes"
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text-primary)",
                marginBottom: 6,
              }}
            >
              Notes (optional)
            </label>
            <textarea
              id="receiptNotes"
              className="input-field"
              rows={3}
              style={{ width: "100%", resize: "vertical" }}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Storage location, condition notes, etc."
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
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "Confirming…" : "Confirm Receipt"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─── Discrepancy Review Modal ────────────────────────────────── */

function ReviewDiscrepancyModal({
  job,
  onClose,
  onSuccess,
}: {
  job: RoastingJob
  onClose: () => void
  onSuccess: () => void
}) {
  const [decision, setDecision] = useState<"approve" | "adjust" | "">("")
  const [adjustedQty, setAdjustedQty] = useState("")
  const [reason, setReason] = useState("")
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!decision) {
      setError("Please select a decision.")
      return
    }
    if (decision === "adjust" && !adjustedQty.trim()) {
      setError("Adjusted quantity is required.")
      return
    }
    if (!reason.trim()) {
      setError("A reason is required for the decision.")
      return
    }
    setShowConfirm(true)
  }

  async function handleConfirm() {
    setSubmitting(true)
    setError("")
    try {
      await reviewRoastingDiscrepancy(
        job.id,
        decision as "approve" | "adjust",
        adjustedQty.trim() || undefined,
        reason.trim(),
      )
      onSuccess()
    } catch {
      setError("Review could not be submitted. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const disc = job.discrepancy

  if (showConfirm) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="disc-confirm-title"
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
            id="disc-confirm-title"
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: 16,
            }}
          >
            {decision === "approve"
              ? "Accept this roasting discrepancy?"
              : "Adjust and accept discrepancy?"}
          </div>
          <div
            style={{
              fontSize: 13.5,
              color: "var(--text-secondary)",
              lineHeight: 1.6,
              marginBottom: 16,
            }}
          >
            This will mark the discrepancy as reviewed. The decision and reason
            will be recorded in the audit trail.
          </div>
          <div
            style={{
              padding: "12px 16px",
              background: "var(--surface-02)",
              borderRadius: "var(--radius-md)",
              fontSize: 13,
              color: "var(--text-secondary)",
              marginBottom: 20,
            }}
          >
            <strong>Decision:</strong>{" "}
            {decision === "approve" ? "Accept as-is" : "Adjust and accept"}
            <br />
            {adjustedQty && (
              <>
                <strong>Adjusted qty:</strong> {adjustedQty}
                <br />
              </>
            )}
            <strong>Reason:</strong> {reason}
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
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button
              className="btn-secondary"
              onClick={() => setShowConfirm(false)}
              disabled={submitting}
            >
              Back
            </button>
            <button
              className="btn-primary"
              onClick={handleConfirm}
              disabled={submitting}
            >
              {submitting
                ? "Submitting…"
                : decision === "approve"
                  ? "Accept Discrepancy"
                  : "Adjust & Accept"}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="disc-modal-title"
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
          id="disc-modal-title"
          style={{
            fontSize: 18,
            fontWeight: 700,
            fontFamily: "Fraunces, serif",
            color: "var(--text-primary)",
            marginBottom: 4,
          }}
        >
          Roasting Discrepancy Review
        </div>
        <div
          style={{
            fontSize: 13,
            color: "var(--text-secondary)",
            marginBottom: 20,
          }}
        >
          <span style={{ fontFamily: "DM Mono, monospace" }}>{job.ref}</span> —{" "}
          {job.coffee}
        </div>

        {/* Discrepancy facts */}
        {disc && (
          <div
            style={{
              padding: "14px 16px",
              borderRadius: "var(--radius-md)",
              background: "var(--color-status-danger-surface)",
              border: "1.5px solid var(--color-status-danger-border)",
              marginBottom: 20,
            }}
          >
            <div
              style={{
                fontSize: 13.5,
                fontWeight: 600,
                color: "var(--sem-danger)",
                marginBottom: 10,
              }}
            >
              Roasting Output — Needs Review
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 12,
              }}
            >
              <div>
                <Eyebrow>Expected</Eyebrow>
                <Qty>{disc.expected}</Qty>
              </div>
              <div>
                <Eyebrow>Actual</Eyebrow>
                <Qty>{disc.actual}</Qty>
              </div>
              <div>
                <Eyebrow>Difference</Eyebrow>
                <div
                  style={{
                    fontFamily: "DM Mono, monospace",
                    fontSize: 14,
                    fontWeight: 700,
                    color: "var(--sem-danger)",
                  }}
                >
                  {disc.difference}
                </div>
              </div>
            </div>
            {disc.reason && (
              <div
                style={{
                  marginTop: 10,
                  fontSize: 12.5,
                  color: "var(--text-secondary)",
                  fontStyle: "italic",
                }}
              >
                Reason: {disc.reason}
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text-primary)",
                marginBottom: 8,
              }}
            >
              Manager Decision
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                {
                  val: "approve",
                  label: "Accept as-is",
                  sub: "Accept the discrepancy without quantity adjustment.",
                },
                {
                  val: "adjust",
                  label: "Adjust and accept",
                  sub: "Override with an adjusted accepted quantity.",
                },
              ].map((opt) => (
                <label
                  key={opt.val}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    padding: "10px 14px",
                    border: `1px solid ${
                      decision === opt.val
                        ? "var(--brand-primary)"
                        : "var(--border-neutral)"
                    }`,
                    borderRadius: "var(--radius-md)",
                    cursor: "pointer",
                    background:
                      decision === opt.val
                        ? "var(--color-status-info-surface)"
                        : "transparent",
                  }}
                >
                  <input
                    type="radio"
                    name="decision"
                    value={opt.val}
                    checked={decision === opt.val}
                    onChange={() =>
                      setDecision(opt.val as "approve" | "adjust")
                    }
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
          </div>

          {decision === "adjust" && (
            <div style={{ marginBottom: 16 }}>
              <label
                htmlFor="adjustedQty"
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  marginBottom: 6,
                }}
              >
                Adjusted Accepted Quantity (KG){" "}
                <span style={{ color: "var(--sem-danger)" }}>*</span>
              </label>
              <input
                id="adjustedQty"
                type="text"
                className="input-field"
                style={{ width: "100%", fontFamily: "DM Mono, monospace" }}
                value={adjustedQty}
                onChange={(e) => setAdjustedQty(e.target.value)}
                placeholder="Manager-approved accepted quantity"
              />
            </div>
          )}

          <div style={{ marginBottom: 20 }}>
            <label
              htmlFor="discReason"
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
              id="discReason"
              className="input-field"
              rows={3}
              style={{ width: "100%", resize: "vertical" }}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Document the reason for this decision…"
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

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={!decision || submitting}
            >
              Review Decision
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─── Awaiting / Complete status panels ───────────────────────── */

function AwaitingStorekeeperPanel({ job }: { job: RoastingJob }) {
  return (
    <div
      style={{
        padding: "16px 20px",
        borderRadius: "var(--radius-lg)",
        background: "var(--color-status-warning-surface)",
        border: "1.5px solid var(--color-status-warning-border)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 8,
        }}
      >
        <Ic
          d={D.clock}
          size={16}
          style={{ color: "var(--sem-warning)", flexShrink: 0 }}
        />
        <div
          style={{ fontWeight: 700, color: "var(--sem-warning)", fontSize: 14 }}
        >
          Awaiting Storekeeper Confirmation
        </div>
      </div>
      <div
        style={{
          fontSize: 13,
          color: "var(--text-secondary)",
          lineHeight: 1.6,
          marginBottom: job.storekeeperName ? 10 : 0,
        }}
      >
        Roasting has been reported complete. The roasted coffee is waiting for
        storekeeper confirmation of physical receipt.
      </div>
      {job.storekeeperName && (
        <div
          style={{
            fontSize: 12.5,
            color: "var(--text-secondary)",
            fontStyle: "italic",
          }}
        >
          Confirmed by: <strong>{job.storekeeperName}</strong> —{" "}
          {job.storekeeperConfirmedAt}
        </div>
      )}
      {job.storekeeperConfirmedQty && (
        <div style={{ marginTop: 8 }}>
          <Eyebrow>Storekeeper Confirmed Qty</Eyebrow>
          <Qty>{job.storekeeperConfirmedQty}</Qty>
        </div>
      )}
    </div>
  )
}

function CompletedPanel({ job }: { job: RoastingJob }) {
  return (
    <div
      style={{
        padding: "16px 20px",
        borderRadius: "var(--radius-lg)",
        background: "var(--color-status-safe-surface)",
        border: "1.5px solid var(--color-status-safe-border)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 8,
        }}
      >
        <Ic
          d={D.checkOk}
          size={16}
          style={{ color: "var(--sem-success)", flexShrink: 0 }}
        />
        <div
          style={{ fontWeight: 700, color: "var(--sem-success)", fontSize: 14 }}
        >
          Roasting Complete
        </div>
      </div>
      <div
        style={{
          fontSize: 13,
          color: "var(--text-secondary)",
          lineHeight: 1.6,
        }}
      >
        All required roasting batches have been recorded and accepted.
      </div>
      {job.storekeeperName && (
        <div
          style={{
            fontSize: 12.5,
            color: "var(--text-secondary)",
            marginTop: 8,
          }}
        >
          Accepted by: <strong>{job.storekeeperName}</strong> —{" "}
          {job.storekeeperConfirmedAt}
        </div>
      )}
    </div>
  )
}

function DiscrepancyPanel({ job }: { job: RoastingJob }) {
  const disc = job.discrepancy
  if (!disc) return null
  return (
    <div
      style={{
        padding: "16px 20px",
        borderRadius: "var(--radius-lg)",
        background: "var(--color-status-danger-surface)",
        border: "1.5px solid var(--color-status-danger-border)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 10,
        }}
      >
        <Ic
          d={D.warn}
          size={16}
          style={{ color: "var(--sem-danger)", flexShrink: 0 }}
        />
        <div
          style={{ fontWeight: 700, color: "var(--sem-danger)", fontSize: 14 }}
        >
          Roasted Output — Needs Review
        </div>
      </div>
      <div
        style={{
          fontSize: 13,
          color: "var(--text-secondary)",
          lineHeight: 1.6,
          marginBottom: 14,
        }}
      >
        A discrepancy was detected between the reported roasted output and the
        storekeeper's physical count. Awaiting manager review.
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
        }}
      >
        <div>
          <Eyebrow>Expected</Eyebrow>
          <Qty>{disc.expected}</Qty>
        </div>
        <div>
          <Eyebrow>Actual</Eyebrow>
          <Qty>{disc.actual}</Qty>
        </div>
        <div>
          <Eyebrow>Difference</Eyebrow>
          <div
            style={{
              fontFamily: "DM Mono, monospace",
              fontSize: 16,
              fontWeight: 700,
              color: "var(--sem-danger)",
            }}
          >
            {disc.difference}
          </div>
        </div>
      </div>
      {disc.reason && (
        <div
          style={{
            marginTop: 10,
            fontSize: 12.5,
            color: "var(--text-secondary)",
            fontStyle: "italic",
          }}
        >
          Reason: {disc.reason}
        </div>
      )}
    </div>
  )
}

/* ─── List View ───────────────────────────────────────────────── */

function ListView({ onSelect }: { onSelect: (id: string) => void }) {
  const [jobs, setJobs] = useState<RoastingJob[]>([])
  const [stats, setStats] = useState<RoastingDashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<RoastingJobStatus | "">("")
  const [roastLevelFilter, setRoastLevelFilter] = useState("")
  const [urgentOnly, setUrgentOnly] = useState(false)
  const [showCreateDelivery, setShowCreateDelivery] = useState(false)
  const [deliveryOrderId, setDeliveryOrderId] = useState("")
  const [deliveryNotes, setDeliveryNotes] = useState("")
  const [showScheduleBatch, setShowScheduleBatch] = useState(false)
  const [batchCoffee, setBatchCoffee] = useState("Guji Grade 1 Natural")
  const [batchQty, setBatchQty] = useState("60")
  const [batchNotes, setBatchNotes] = useState("")
  const { isMobile } = useBreakpoint()

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      // Fetch roasting batches directly from Supabase via apiRequest
      const raw = await apiRequest<any[]>("/roasting", "GET").catch(() => [])
      const items: any[] = Array.isArray(raw) ? raw : []
      const mapped: RoastingJob[] = items.map((r: any) => ({
        id: r.id,
        ref: r.batchNumber || `RST-${String(r.id).slice(0, 6).toUpperCase()}`,
        orderRef: r.order?.orderNumber || r.orderId || "—",
        customer: r.customer?.name ?? r.order?.customer?.name ?? "—",
        coffee: r.coffee || "Guji Grade 1 Natural",
        roastLevel: "Medium",
        targetQty: (r.targetQuantity || r.greenInputQuantity || r.green_input_quantity || 60) + " KG",
        roastedQty: r.actualRoastedQuantity ? r.actualRoastedQuantity + " KG" : "-",
        yield: r.appliedYieldPercentage ? r.appliedYieldPercentage + "%" : "-",
        status:
          r.status === "COMPLETED" ? "completed"
          : r.status === "ROASTING" ? "active"
          : "waiting",
        urgent: r.isUrgent || false,
        roaster: "Head Roaster",
        startedAt: r.createdAt || r.created_at ? new Date(r.createdAt || r.created_at).toLocaleDateString() : "-",
        completedAt: r.updatedAt || r.updated_at ? new Date(r.updatedAt || r.updated_at).toLocaleDateString() : "-",
        machine: "Roaster 1",
        notes: r.notes || "",
        timeline: [],
      }))
      setJobs((prev) => {
        const tempItems = prev.filter((p) => p.id.startsWith("temp-"))
        const allItems = [...tempItems, ...mapped]
        // Deduplicate if needed
        const uniqueMap = new Map<string, RoastingJob>()
        allItems.forEach((item) => uniqueMap.set(item.id, item))
        const finalJobs = Array.from(uniqueMap.values())
        setStats({
          waiting: finalJobs.filter((j) => j.status === "waiting").length,
          active: finalJobs.filter((j) => j.status === "active").length,
          completedToday: finalJobs.filter((j) => j.status === "completed").length,
          needsReview: finalJobs.filter((j) => j.status === "needs-review" || j.status === "discrepancy").length,
        })
        return finalJobs
      })
    } catch {
      setError("Unable to load roasting jobs.")
    } finally {
      setLoading(false)
    }
  }, [statusFilter, search])


  useEffect(() => {
    load()
  }, [load])

  // Realtime: refresh when roasting batches or delivery records change
  useSupabaseRealtime("roasting_batches", () => {
    void load()
  })
  useSupabaseRealtime("delivery_records", () => {
    void load()
  })

  // Live orders for Create Delivery dropdown
  const [liveOrders, setLiveOrders] = useState<Array<{ id: string; ref: string; customerName: string }>>([])
  useEffect(() => {
    if (!showCreateDelivery) return
    apiRequest<any[]>("/orders", "GET")
      .then((data) => {
        if (Array.isArray(data)) {
          setLiveOrders(
            data.map((o: any) => ({
              id: o.id,
              ref: o.orderNumber || "ORD-???",
              customerName: o.customer?.name || "Customer",
            }))
          )
        }
      })
      .catch(() => {})
  }, [showCreateDelivery])

  const needsAttention = jobs.filter(
    (j) => j.status === "discrepancy" || j.status === "awaiting-manager",
  )

  const filtered = jobs.filter((j) => {
    if (urgentOnly && !j.urgent) return false
    if (roastLevelFilter && j.roastLevel !== roastLevelFilter) return false
    return true
  })

  const roastLevels = [...new Set(jobs.map((j) => j.roastLevel))]

  const statItems = [
    {
      label: "Waiting",
      value: stats?.waiting ?? "–",
      color: "var(--text-secondary)",
    },
    { label: "Active", value: stats?.active ?? "–", color: "var(--sem-info)" },
    {
      label: "Completed Today",
      value: stats?.completedToday ?? "–",
      color: "var(--sem-success)",
    },
    {
      label: "Needs Review",
      value: stats?.needsReview ?? "–",
      color: "var(--sem-danger)",
    },
  ]

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginBottom: 8 }}>
          <button
            onClick={() => setShowScheduleBatch(true)}
            className="btn-primary"
            style={{ fontSize: 13, background: "#2B4D3A", color: "#FFF", padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600 }}
          >
            + Schedule Roasting Batch
          </button>
          <button
            onClick={() => setShowCreateDelivery(true)}
            className="btn-secondary"
            style={{ fontSize: 13, padding: "8px 16px", borderRadius: 8, border: "1px solid var(--border-neutral)", background: "var(--surface-01)", cursor: "pointer", fontWeight: 600 }}
          >
            Create Delivery
          </button>
        </div>
        <div className="section-eyebrow" style={{ marginBottom: 4 }}>
          Production
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
          Roasting
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "var(--text-secondary)",
            marginTop: 6,
            marginBottom: 0,
          }}
        >
          Manage assigned roasting jobs and report completed output.
        </p>
      </div>

      {/* Schedule Batch Modal */}
      {showScheduleBatch && (
        <div
          onClick={() => setShowScheduleBatch(false)}
          style={{ position: "fixed", inset: 0, zIndex: 400, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: 500, background: "var(--surface-01)", border: "1px solid var(--border-neutral)", borderRadius: 12, padding: 24, boxShadow: "var(--shadow-modal)" }}
          >
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, fontFamily: "Fraunces, serif" }}>Schedule Roasting Batch</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 4, marginBottom: 18 }}>Schedule a new coffee roasting batch for production.</p>
            <div style={{ display: "grid", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, marginBottom: 4 }}>Coffee Profile</label>
                <select
                  value={batchCoffee}
                  onChange={(e) => setBatchCoffee(e.target.value)}
                  style={{ width: "100%", height: 38, padding: "0 12px", borderRadius: 8, border: "1px solid var(--border-neutral)", background: "var(--surface-01)" }}
                >
                  <option value="Guji Grade 1 Natural">Guji Grade 1 Natural</option>
                  <option value="Yirgacheffe AOP Washed">Yirgacheffe AOP Washed</option>
                  <option value="Sidama Reserve Specialty">Sidama Reserve Specialty</option>
                  <option value="Harrar Longberry Dark">Harrar Longberry Dark</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, marginBottom: 4 }}>Target Green Quantity (KG)</label>
                <input
                  type="number"
                  value={batchQty}
                  onChange={(e) => setBatchQty(e.target.value)}
                  style={{ width: "100%", height: 38, padding: "0 12px", borderRadius: 8, border: "1px solid var(--border-neutral)", background: "var(--surface-01)" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, marginBottom: 4 }}>Roaster Notes (optional)</label>
                <textarea
                  value={batchNotes}
                  onChange={(e) => setBatchNotes(e.target.value)}
                  rows={2}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--border-neutral)", background: "var(--surface-01)", resize: "vertical" }}
                  placeholder="Special instructions, moisture target..."
                />
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
                <button className="btn-secondary" onClick={() => setShowScheduleBatch(false)} style={{ padding: "8px 16px", borderRadius: 8 }}>Cancel</button>
                <button
                  className="btn-primary"
                  style={{ padding: "8px 18px", borderRadius: 8, background: "#2B4D3A", color: "#FFF", border: "none", fontWeight: 600, cursor: "pointer" }}
                  onClick={async () => {
                    // Optimistic update — show the new batch immediately
                    const optimisticJob = {
                      id: `temp-${Date.now()}`,
                      ref: `RST-${Math.floor(Math.random() * 9000 + 1000)}`,
                      orderRef: "—",
                      customer: "—",
                      coffee: batchCoffee,
                      roastLevel: "Medium",
                      targetQty: batchQty + " KG",
                      roastedQty: "-",
                      yield: "-",
                      status: "waiting" as const,
                      urgent: false,
                      roaster: "Head Roaster",
                      startedAt: new Date().toLocaleDateString(),
                      completedAt: "-",
                      machine: "Roaster 1",
                      notes: batchNotes,
                      timeline: [],
                    }
                    setJobs((prev) => [optimisticJob, ...prev])
                    setShowScheduleBatch(false)
                    setBatchNotes("")
                    // Save to DB and refresh with real data
                    try {
                      await apiRequest("/roasting", "POST", { coffee: batchCoffee, quantity: batchQty, notes: batchNotes })
                    } catch {
                      /* ignore */
                    }
                    void load()
                  }}
                >
                  Schedule Batch
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Delivery Modal */}
      {showCreateDelivery && (
        <div
          onClick={() => setShowCreateDelivery(false)}
          style={{ position: "fixed", inset: 0, zIndex: 400, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: 500, background: "var(--surface-01)", border: "1px solid var(--border-neutral)", borderRadius: 12, padding: 24, boxShadow: "var(--shadow-modal)" }}
          >
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, fontFamily: "Fraunces, serif" }}>Create Delivery</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 4, marginBottom: 18 }}>Create a delivery record linked to a customer order.</p>
            <div style={{ display: "grid", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, marginBottom: 4 }}>Select Order</label>
                {liveOrders.length > 0 ? (
                  <select
                    value={deliveryOrderId}
                    onChange={(e) => setDeliveryOrderId(e.target.value)}
                    style={{ width: "100%", height: 38, padding: "0 12px", borderRadius: 8, border: "1px solid var(--border-neutral)", background: "var(--surface-01)" }}
                  >
                    <option value="">-- Select an Order --</option>
                    {liveOrders.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.ref} — {o.customerName}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    placeholder="Enter Order Number or ID (e.g. ORD-1001)"
                    value={deliveryOrderId}
                    onChange={(e) => setDeliveryOrderId(e.target.value)}
                    style={{ width: "100%", height: 38, padding: "0 12px", borderRadius: 8, border: "1px solid var(--border-neutral)", background: "var(--surface-01)" }}
                  />
                )}
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, marginBottom: 4 }}>Delivery Notes (optional)</label>
                <textarea
                  placeholder="Gate instructions, special delivery terms..."
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  rows={2}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--border-neutral)", background: "var(--surface-01)", resize: "vertical" }}
                />
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
                <button className="btn-secondary" onClick={() => setShowCreateDelivery(false)} style={{ padding: "8px 16px", borderRadius: 8 }}>Cancel</button>
                <button
                  className="btn-primary"
                  style={{ padding: "8px 18px", borderRadius: 8, background: "#2B4D3A", color: "#FFF", border: "none", fontWeight: 600, cursor: "pointer" }}
                  onClick={async () => {
                    const selectedOrder = liveOrders.find((o) => o.id === deliveryOrderId)
                    setShowCreateDelivery(false)
                    setDeliveryOrderId("")
                    setDeliveryNotes("")
                    try {
                      await apiRequest("/deliveries", "POST", {
                        orderId: deliveryOrderId || undefined,
                        notes: deliveryNotes,
                      })
                    } catch {
                      /* ignore */
                    }
                    void load()
                  }}
                >
                  Create Delivery
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats — from backend */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
          marginBottom: 20,
        }}
      >
        {statItems.map((s) => (
          <div key={s.label} className="stat-card">
            <div
              style={{
                fontSize: 11.5,
                color: "var(--text-muted)",
                marginBottom: 8,
              }}
            >
              {s.label}
            </div>
            <div
              style={{
                fontFamily: "DM Mono, monospace",
                fontSize: 24,
                fontWeight: 700,
                color: loading ? "var(--text-muted)" : s.color,
              }}
            >
              {loading ? "–" : String(s.value)}
            </div>
          </div>
        ))}
      </div>

      {/* Needs Attention */}
      {!loading && needsAttention.length > 0 && (
        <div
          style={{
            padding: "14px 18px",
            borderRadius: "var(--radius-lg)",
            marginBottom: 20,
            background: "var(--color-status-warning-surface)",
            border: "1.5px solid var(--color-status-warning-border)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <Ic
              d={D.warn}
              size={15}
              style={{ color: "var(--sem-warning)", flexShrink: 0 }}
            />
            <span
              style={{
                fontWeight: 600,
                fontSize: 13.5,
                color: "var(--sem-warning)",
              }}
            >
              Needs Attention
            </span>
          </div>
          {needsAttention.map((j) => (
            <div
              key={j.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "6px 0",
                borderTop: "1px solid var(--color-status-warning-border)",
                marginTop: 4,
              }}
            >
              <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                <span
                  style={{ fontFamily: "DM Mono, monospace", marginRight: 6 }}
                >
                  {j.ref}
                </span>
                {j.coffee} — <StatusBadge status={j.status} />
              </div>
              <button
                className="btn-ghost"
                style={{ fontSize: 12.5, padding: "4px 12px" }}
                onClick={() => onSelect(j.id)}
              >
                Review
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 16,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div style={{ position: "relative", flex: "1 1 200px" }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search jobs, orders, customers…"
            className="input-field"
            style={{ width: "100%", paddingLeft: 12, fontSize: 13 }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as RoastingJobStatus | "")
          }
          className="input-field"
          style={{ flex: "0 1 160px", fontSize: 13 }}
        >
          <option value="">All Statuses</option>
          {(Object.keys(STATUS_BADGE) as RoastingJobStatus[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_BADGE[s].label}
            </option>
          ))}
        </select>
        {roastLevels.length > 0 && (
          <select
            value={roastLevelFilter}
            onChange={(e) => setRoastLevelFilter(e.target.value)}
            className="input-field"
            style={{ flex: "0 1 140px", fontSize: 13 }}
          >
            <option value="">All Roast Levels</option>
            {roastLevels.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        )}
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            color: "var(--text-secondary)",
            cursor: "pointer",
            flexShrink: 0,
            whiteSpace: "nowrap",
          }}
        >
          <input
            type="checkbox"
            checked={urgentOnly}
            onChange={(e) => setUrgentOnly(e.target.checked)}
          />
          Urgent only
        </label>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            padding: "14px 18px",
            borderRadius: "var(--radius-md)",
            marginBottom: 16,
            background: "var(--color-status-danger-surface)",
            border: "1px solid var(--color-status-danger-border)",
            color: "var(--sem-danger)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>
            <Ic
              d={D.warn}
              size={14}
              style={{ display: "inline", marginRight: 6 }}
            />
            {error}
          </span>
          <button
            onClick={load}
            className="btn-ghost"
            style={{ fontSize: 13, color: "var(--sem-danger)" }}
          >
            <Ic
              d={D.retry}
              size={13}
              style={{ display: "inline", marginRight: 4 }}
            />
            Retry
          </button>
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[...Array(4)].map((_, i) => (
            <Sk key={i} h={isMobile ? 140 : 56} r={10} />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && filtered.length === 0 && (
        <div
          style={{
            padding: "64px 32px",
            textAlign: "center",
            background: "var(--surface-01)",
            border: "1px solid var(--border-neutral)",
            borderRadius: "var(--radius-lg)",
          }}
        >
          <Ic
            d={D.flame}
            size={32}
            style={{
              color: "var(--text-muted)",
              display: "block",
              margin: "0 auto 16px",
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
            {jobs.length === 0
              ? "No roasting jobs right now."
              : "No roasting jobs match your filters."}
          </div>
          <div
            style={{
              fontSize: 13,
              color: "var(--text-muted)",
              marginBottom: jobs.length > 0 ? 16 : 0,
            }}
          >
            {jobs.length === 0
              ? "All current roasting work has been completed."
              : "Try clearing filters to see all jobs."}
          </div>
          {jobs.length > 0 && (
            <button
              className="btn-secondary"
              onClick={() => {
                setSearch("")
                setStatusFilter("")
                setRoastLevelFilter("")
                setUrgentOnly(false)
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* Desktop table */}
      {!loading && !error && filtered.length > 0 && !isMobile && (
        <div
          style={{
            background: "var(--surface-01)",
            border: "1px solid var(--border-neutral)",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
          }}
        >
          <table
            style={{ width: "100%", borderCollapse: "collapse" }}
            aria-label="Roasting jobs"
          >
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-neutral)" }}>
                {[
                  "Ref",
                  "Order",
                  "Customer",
                  "Coffee",
                  "Roast Level",
                  "Required",
                  "Remaining",
                  "Status",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 14px",
                      textAlign: "left",
                      fontSize: 11,
                      fontFamily: "DM Mono, monospace",
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((job) => (
                <tr
                  key={job.id}
                  style={{
                    borderBottom: "1px solid var(--border-neutral)",
                    cursor: "pointer",
                  }}
                  onClick={() => onSelect(job.id)}
                >
                  <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      {job.urgent && <UrgentPill />}
                      <span
                        style={{
                          fontFamily: "DM Mono, monospace",
                          fontSize: 12.5,
                          color: "var(--text-muted)",
                        }}
                      >
                        {job.ref}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <span
                      style={{
                        fontFamily: "DM Mono, monospace",
                        fontSize: 12.5,
                        color: "var(--text-muted)",
                      }}
                    >
                      {job.orderRef}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "10px 14px",
                      fontSize: 13.5,
                      color: "var(--text-secondary)",
                    }}
                  >
                    {job.customer}
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <div
                      style={{
                        fontSize: 13.5,
                        fontWeight: 600,
                        color: "var(--text-primary)",
                      }}
                    >
                      {job.coffee}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {job.origin}
                    </div>
                  </td>
                  <td
                    style={{
                      padding: "10px 14px",
                      fontSize: 13,
                      color: "var(--text-secondary)",
                    }}
                  >
                    {job.roastLevel}
                  </td>
                  <td
                    style={{
                      padding: "10px 14px",
                      fontFamily: "DM Mono, monospace",
                      fontSize: 13.5,
                      fontWeight: 700,
                      color: "var(--text-primary)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {job.requiredQty}
                  </td>
                  <td
                    style={{
                      padding: "10px 14px",
                      fontFamily: "DM Mono, monospace",
                      fontSize: 13.5,
                      fontWeight: 600,
                      color: "var(--text-secondary)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {job.remainingReq}
                  </td>
                  <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                    <StatusBadge status={job.status} />
                  </td>
                  <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                    <button
                      className="btn-ghost"
                      style={{ fontSize: 12.5, padding: "4px 12px" }}
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelect(job.id)
                      }}
                    >
                      Open →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile cards */}
      {!loading && !error && filtered.length > 0 && isMobile && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((job) => (
            <button
              key={job.id}
              onClick={() => onSelect(job.id)}
              style={{
                width: "100%",
                textAlign: "left",
                cursor: "pointer",
                background: "var(--surface-01)",
                border: `1px solid ${
                  job.urgent ? "var(--sem-danger)" : "var(--border-neutral)"
                }`,
                borderRadius: "var(--radius-lg)",
                padding: "16px",
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
                  {job.urgent && <UrgentPill />}
                  <div
                    style={{
                      fontFamily: "Fraunces, serif",
                      fontSize: 16,
                      fontWeight: 700,
                      color: "var(--text-primary)",
                      marginTop: job.urgent ? 6 : 0,
                    }}
                  >
                    {job.coffee}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--text-muted)",
                      fontFamily: "DM Mono, monospace",
                    }}
                  >
                    {job.ref} · {job.orderRef}
                  </div>
                </div>
                <StatusBadge status={job.status} />
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "var(--text-secondary)",
                  marginBottom: 10,
                }}
              >
                {job.customer}
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 10,
                }}
              >
                {[
                  { label: "Required", value: job.requiredQty },
                  { label: "Remaining", value: job.remainingReq },
                  { label: "Roast Level", value: job.roastLevel },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div
                      style={{
                        fontSize: 10,
                        color: "var(--text-muted)",
                        textTransform: "uppercase" as const,
                        letterSpacing: "0.07em",
                        fontFamily: "DM Mono, monospace",
                        marginBottom: 2,
                      }}
                    >
                      {label}
                    </div>
                    <div
                      style={{
                        fontFamily: "DM Mono, monospace",
                        fontSize: 13,
                        fontWeight: 700,
                        color: "var(--text-primary)",
                      }}
                    >
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Detail View ─────────────────────────────────────────────── */

function DetailView({
  jobId,
  onBack,
  role,
}: {
  jobId: string
  onBack: () => void
  role: string
}) {
  const [job, setJob] = useState<RoastingJob | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [modal, setModal] =
    useState<"add-batch" | "complete" | "receipt" | "discrepancy" | null>(null)
  const [starting, setStarting] = useState(false)
  const { isMobile, isNarrow } = useBreakpoint()

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const result = await getRoastingJob(jobId)
      if (result.error) throw new Error(result.error)
      setJob(result.data ?? null)
    } catch {
      setError("Unable to load this roasting job.")
    } finally {
      setLoading(false)
    }
  }, [jobId])

  useEffect(() => {
    load()
  }, [load])

  async function handleStart() {
    if (!job) return
    setStarting(true)
    try {
      await startRoasting(job.id)
      await load()
    } catch {
      setError("Failed to start roasting.")
    } finally {
      setStarting(false)
    }
  }

  const canStart = can(role as any, "roasting.start")
  const canBatch = can(role as any, "roasting.batch.record")
  const canComplete = can(role as any, "roasting.complete")
  const isStorekeeper = can(role as any, "inventory.qc.confirm")
  const isManager = can(role as any, "roasting.review-discrepancy")

  if (loading) {
    return (
      <div>
        <BackBtn onClick={onBack} />
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[28, 14, 14].map((h, i) => (
            <Sk key={i} h={h} r={6} />
          ))}
          <Sk h={160} r={10} />
          <Sk h={120} r={10} />
        </div>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div>
        <BackBtn onClick={onBack} />
        <div style={{ marginTop: 32, textAlign: "center" }}>
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
              marginBottom: 6,
            }}
          >
            {error || "Job not found."}
          </div>
          <button
            onClick={load}
            className="btn-secondary"
            style={{ marginTop: 4 }}
          >
            <Ic
              d={D.retry}
              size={13}
              style={{ display: "inline", marginRight: 5 }}
            />
            Retry
          </button>
        </div>
      </div>
    )
  }

  /* --- Actions ------------------------------------------ */
  const actions = (
    <div
      style={{
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        ...(isMobile ? { flexDirection: "column" } : {}),
      }}
    >
      {job.status === "pending" && canStart && (
        <button
          className="btn-primary"
          onClick={handleStart}
          disabled={starting}
          style={
            isMobile ? { padding: "12px 0", fontSize: 15, width: "100%" } : {}
          }
        >
          {starting ? "Starting…" : "Start Roasting"}
        </button>
      )}
      {job.status === "in-progress" && canBatch && (
        <button
          className="btn-primary"
          onClick={() => setModal("add-batch")}
          style={
            isMobile ? { padding: "12px 0", fontSize: 15, width: "100%" } : {}
          }
        >
          + Add Batch
        </button>
      )}
      {job.status === "in-progress" && canComplete && (
        <button
          className="btn-secondary"
          onClick={() => setModal("complete")}
          style={
            isMobile ? { padding: "12px 0", fontSize: 15, width: "100%" } : {}
          }
        >
          Report Roasting Complete
        </button>
      )}
      {job.status === "awaiting-storekeeper" && isStorekeeper && (
        <button
          className="btn-primary"
          onClick={() => setModal("receipt")}
          style={
            isMobile ? { padding: "12px 0", fontSize: 15, width: "100%" } : {}
          }
        >
          Confirm Receipt
        </button>
      )}
      {job.status === "discrepancy" && isManager && (
        <button
          onClick={() => setModal("discrepancy")}
          style={{
            padding: isMobile ? "12px 0" : "8px 20px",
            width: isMobile ? "100%" : undefined,
            background: "var(--sem-danger)",
            color: "#fff",
            border: "none",
            borderRadius: "var(--radius-md)",
            fontSize: isMobile ? 15 : 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Review Discrepancy
        </button>
      )}
    </div>
  )

  return (
    <div style={{ paddingBottom: isMobile ? 100 : 0 }}>
      {/* Back + header */}
      <BackBtn onClick={onBack} />
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
            Roasting Job ·{" "}
            <span style={{ fontFamily: "DM Mono, monospace" }}>{job.ref}</span>
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
            {job.coffee}
          </h1>
          <div
            style={{
              fontSize: 13.5,
              color: "var(--text-secondary)",
              marginTop: 4,
            }}
          >
            <span style={{ fontFamily: "DM Mono, monospace" }}>
              {job.orderRef}
            </span>{" "}
            · {job.customer}
          </div>
          {job.urgent && (
            <div style={{ marginTop: 6 }}>
              <UrgentPill />
            </div>
          )}
        </div>
        <StatusBadge status={job.status} />
      </div>

      {/* Two-column layout */}
      <div
        style={{
          display: isNarrow ? "block" : "grid",
          gridTemplateColumns: "1fr 340px",
          gap: 20,
        }}
      >
        {/* LEFT COLUMN ─────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Job summary */}
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
              Job Summary
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "12px 24px",
              }}
            >
              <div>
                <Eyebrow>Origin</Eyebrow>
                <div style={{ fontSize: 13.5, color: "var(--text-primary)" }}>
                  {job.origin}
                </div>
              </div>
              <div>
                <Eyebrow>Roast Level</Eyebrow>
                <div style={{ fontSize: 13.5, color: "var(--text-primary)" }}>
                  {job.roastLevel}
                </div>
              </div>
              <div>
                <Eyebrow>Assigned Roaster</Eyebrow>
                <div style={{ fontSize: 13.5, color: "var(--text-primary)" }}>
                  {job.assignedRoaster}
                </div>
              </div>
              <div>
                <Eyebrow>Issued At</Eyebrow>
                <div
                  style={{
                    fontFamily: "DM Mono, monospace",
                    fontSize: 12.5,
                    color: "var(--text-muted)",
                  }}
                >
                  {job.issuedAt}
                </div>
              </div>
              {job.completedAt && (
                <div>
                  <Eyebrow>Completed At</Eyebrow>
                  <div
                    style={{
                      fontFamily: "DM Mono, monospace",
                      fontSize: 12.5,
                      color: "var(--text-muted)",
                    }}
                  >
                    {job.completedAt}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quantity overview */}
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
              Quantity Overview
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "12px 16px",
              }}
            >
              <div>
                <Eyebrow>Required</Eyebrow>
                <Qty>{job.requiredQty}</Qty>
              </div>
              <div>
                <Eyebrow>Roasted Output</Eyebrow>
                <Qty>{job.roastedOutput}</Qty>
              </div>
              <div>
                <Eyebrow>Remaining</Eyebrow>
                <div
                  style={{
                    fontFamily: "DM Mono, monospace",
                    fontSize: 18,
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                  }}
                >
                  {job.remainingReq}
                </div>
              </div>
            </div>
          </div>

          {/* Remaining requirement — prominent */}
          <RemainingRequirement
            remainingReq={job.remainingReq}
            status={job.status}
          />

          {/* Status panels */}
          {job.status === "awaiting-storekeeper" && (
            <AwaitingStorekeeperPanel job={job} />
          )}
          {(job.status === "accepted" || job.status === "completed") && (
            <CompletedPanel job={job} />
          )}
          {job.status === "discrepancy" && <DiscrepancyPanel job={job} />}

          {/* Desktop actions */}
          {!isMobile && <div>{actions}</div>}

          {/* Batches */}
          <div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "var(--text-primary)",
                marginBottom: 12,
              }}
            >
              Batches ({job.batches.length})
            </div>
            {job.batches.length === 0 ? (
              <div
                style={{
                  padding: 24,
                  textAlign: "center",
                  color: "var(--text-muted)",
                  fontSize: 14,
                  background: "var(--surface-01)",
                  border: "1px dashed var(--border-neutral)",
                  borderRadius: "var(--radius-md)",
                }}
              >
                No batches recorded yet. Start roasting to add the first batch.
              </div>
            ) : (
              job.batches.map((b) => <BatchCard key={b.id} batch={b} />)
            )}
          </div>
        </div>

        {/* RIGHT COLUMN (sidebar) ───────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Roasting Requirement Panel */}
          <RoastingRequirementPanel job={job} />

          {/* Timeline */}
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
                marginBottom: 16,
              }}
            >
              Job Timeline
            </div>
            <Timeline events={job.timeline} />
          </div>
        </div>
      </div>

      {/* Mobile sticky action bar */}
      {isMobile && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            background: "var(--surface-01)",
            borderTop: "1px solid var(--border-neutral)",
            padding: "12px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {actions}
        </div>
      )}

      {modal === "add-batch" && (
        <AddBatchModal
          job={job}
          onClose={() => setModal(null)}
          onSuccess={() => {
            setModal(null)
            load()
          }}
        />
      )}
      {modal === "complete" && (
        <ReportCompleteModal
          job={job}
          onClose={() => setModal(null)}
          onSuccess={() => {
            setModal(null)
            load()
          }}
        />
      )}
      {modal === "receipt" && (
        <ConfirmReceiptModal
          job={job}
          onClose={() => setModal(null)}
          onSuccess={() => {
            setModal(null)
            load()
          }}
        />
      )}
      {modal === "discrepancy" && (
        <ReviewDiscrepancyModal
          job={job}
          onClose={() => setModal(null)}
          onSuccess={() => {
            setModal(null)
            load()
          }}
        />
      )}
    </div>
  )
}

/* ─── Root export ─────────────────────────────────────────────── */

export default function Production({ routeParams }: { routeParams?: { id?: string } }) {
  const { currentUser } = useAuth()
  const role = currentUser?.role ?? "viewer"

  const [view, setView] = useState<View>("list")
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)

  useEffect(() => {
    if (routeParams?.id) {
      setSelectedJobId(routeParams.id)
      setView("detail")
    }
  }, [routeParams])

  if (view === "detail" && selectedJobId) {
    return (
      <div style={{ padding: "20px 24px", maxWidth: 1200, margin: "0 auto" }}>
        <DetailView
          jobId={selectedJobId}
          onBack={() => setView("list")}
          role={role}
        />
      </div>
    )
  }

  return (
    <div style={{ padding: "20px 24px", maxWidth: 1200, margin: "0 auto" }}>
      <ListView
        onSelect={(id) => {
          setSelectedJobId(id)
          setView("detail")
        }}
      />
    </div>
  )
}
