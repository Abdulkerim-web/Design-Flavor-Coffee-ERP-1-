/**
 * Modal — reusable dialog foundation with size variants, keyboard trap, and focus return.
 * Use for forms, confirmations, detail previews, and approval flows.
 */
import {
  useEffect,
  useRef,
  type FC,
  type ReactNode,
  type CSSProperties,
} from "react"

type ModalSize = "sm" | "md" | "lg" | "xl"

const SIZE_WIDTH: Record<ModalSize, number> = {
  sm: 380,
  md: 520,
  lg: 680,
  xl: 860,
}

export interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  size?: ModalSize
  children: ReactNode
  footer?: ReactNode
  /** Prevent closing by clicking backdrop or pressing Escape */
  locked?: boolean
  style?: CSSProperties
}

export const Modal: FC<ModalProps> = ({
  open,
  onClose,
  title,
  subtitle,
  size = "md",
  children,
  footer,
  locked,
  style,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null)
  const prevFocus = useRef<Element | null>(null)

  useEffect(() => {
    if (!open) return

    prevFocus.current = document.activeElement

    // Focus first focusable element inside
    const timer = setTimeout(() => {
      const first = dialogRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      first?.focus()
    }, 30)

    // Keyboard trap + Escape
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !locked) {
        onClose()
        return
      }
      if (e.key !== "Tab") return

      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      if (!focusable?.length) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener("keydown", handleKey)
    document.body.style.overflow = "hidden"

    return () => {
      clearTimeout(timer)
      document.removeEventListener("keydown", handleKey)
      document.body.style.overflow = ""
      if (prevFocus.current instanceof HTMLElement) prevFocus.current.focus()
    }
  }, [open, onClose, locked])

  if (!open) return null

  return (
    <div
      role="presentation"
      onClick={locked ? undefined : onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 700,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        animation: "modalFadeIn 0.18s ease",
      }}
    >
      <style>{`
        @keyframes modalFadeIn  { from { opacity:0 } to { opacity:1 } }
        @keyframes modalSlideUp { from { opacity:0; transform:translateY(10px) scale(0.97) } to { opacity:1; transform:translateY(0) scale(1) } }
      `}</style>

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--surface-01)",
          border: "1px solid var(--border-neutral)",
          borderRadius: 14,
          boxShadow:
            "0 24px 48px rgba(0,0,0,0.18), 0 6px 12px rgba(0,0,0,0.08)",
          width: "100%",
          maxWidth: SIZE_WIDTH[size],
          maxHeight: "calc(100vh - 64px)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          animation: "modalSlideUp 0.2s cubic-bezier(0.16,1,0.3,1)",
          ...style,
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 20px 14px",
            borderBottom: "1px solid var(--border-neutral)",
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            flexShrink: 0,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2
              id="modal-title"
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "var(--text-primary)",
                margin: 0,
                letterSpacing: "-0.01em",
                fontFamily: "Inter",
              }}
            >
              {title}
            </h2>
            {subtitle && (
              <p
                style={{
                  margin: "3px 0 0",
                  fontSize: 12.5,
                  color: "var(--text-secondary)",
                  fontFamily: "Inter",
                  lineHeight: "17px",
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
          {!locked && (
            <button
              onClick={onClose}
              aria-label="Close dialog"
              style={{
                width: 30,
                height: 30,
                borderRadius: 7,
                border: "none",
                background: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-muted)",
                transition: "all 0.12s ease",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--surface-02)"
                e.currentTarget.style.color = "var(--text-primary)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "none"
                e.currentTarget.style.color = "var(--text-muted)"
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
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "18px 20px" }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            style={{
              padding: "14px 20px",
              borderTop: "1px solid var(--border-neutral)",
              display: "flex",
              gap: 10,
              justifyContent: "flex-end",
              flexShrink: 0,
              flexWrap: "wrap",
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Confirmation dialog ─────────────────────────────────────── */

type ConfirmVariant = "danger" | "warning" | "info"

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  /** What will happen and why it matters */
  body: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: ConfirmVariant
  loading?: boolean
}

const CONFIRM_ICON: Record<ConfirmVariant, {
  path: string
  bg: string
  stroke: string
}> = {
  danger: {
    bg: "linear-gradient(135deg,#FEF2F2,#FEE2E2)",
    stroke: "#DC2626",
    path: "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01",
  },
  warning: {
    bg: "linear-gradient(135deg,#FFFBEB,#FEF3C7)",
    stroke: "#D97706",
    path: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 8v4M12 16h.01",
  },
  info: {
    bg: "linear-gradient(135deg,#EFF6FF,#DBEAFE)",
    stroke: "#2563EB",
    path: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 16v-4M12 8h.01",
  },
}

const CONFIRM_BTN_BG: Record<ConfirmVariant, string> = {
  danger: "var(--sem-danger)",
  warning: "#D97706",
  info: "#2563EB",
}

export const ConfirmDialog: FC<ConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  body,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  loading,
}) => {
  const ic = CONFIRM_ICON[variant]
  return (
    <Modal
      open={open}
      onClose={onClose}
      title=""
      size="sm"
      locked={loading}
      footer={
        <>
          <button
            onClick={onClose}
            disabled={loading}
            className="btn-secondary"
            style={{ minWidth: 90 }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              minWidth: 110,
              height: 38,
              borderRadius: 8,
              border: "none",
              background: CONFIRM_BTN_BG[variant],
              color: "#fff",
              fontSize: 13.5,
              fontWeight: 600,
              fontFamily: "Inter",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
              transition: "all 0.15s",
            }}
          >
            {loading && (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                style={{ animation: "spin 0.75s linear infinite" }}
              >
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            )}
            {confirmLabel}
          </button>
        </>
      }
    >
      <div style={{ textAlign: "center", padding: "8px 0 4px" }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            margin: "0 auto 16px",
            background: ic.bg,
            border: `1px solid ${ic.stroke}30`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke={ic.stroke}
            strokeWidth="1.75"
            strokeLinecap="round"
          >
            <path d={ic.path} />
          </svg>
        </div>
        <h3
          style={{
            fontSize: 17,
            fontWeight: 700,
            color: "var(--text-primary)",
            margin: "0 0 10px",
            fontFamily: "Inter",
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </h3>
        <p
          style={{
            fontSize: 13.5,
            color: "var(--text-secondary)",
            lineHeight: 1.6,
            margin: 0,
            fontFamily: "Inter",
          }}
        >
          {body}
        </p>
      </div>
    </Modal>
  )
}

export default Modal
