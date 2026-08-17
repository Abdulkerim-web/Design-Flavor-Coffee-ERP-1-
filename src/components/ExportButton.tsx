/**
 * Reusable export control — CSV and PDF options in a compact dropdown.
 * Section 11 of the App Shell spec.
 * CSV for operational/tabular data; PDF for formal reports and financial documents.
 */
import { useState, useRef, useEffect, type FC } from "react"

interface ExportButtonProps {
  onExportCSV?: () => void
  onExportPDF?: () => void
  /** Override which formats are available */
  formats?: ("csv" | "pdf")[]
  disabled?: boolean
  size?: "sm" | "md"
}

export const ExportButton: FC<ExportButtonProps> = ({
  onExportCSV,
  onExportPDF,
  formats = ["csv", "pdf"],
  disabled = false,
  size = "md",
}) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  const h = size === "sm" ? 28 : 34
  const fs = size === "sm" ? 12 : 13

  const handle = (fn?: () => void) => {
    fn?.()
    setOpen(false)
  }

  const FORMAT_CONFIG = {
    csv: {
      label: "Export as CSV",
      desc: "Spreadsheet · operational data",
      icon: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M8 13h8M8 17h6",
    },
    pdf: {
      label: "Export as PDF",
      desc: "Document · formal reports",
      icon: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M10 12a2 2 0 100 4 2 2 0 000-4zM14 12v4",
    },
  }

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        className="btn-secondary"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        style={{
          height: h,
          fontSize: fs,
          gap: 5,
          padding: "0 12px",
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
        </svg>
        Export
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            width: 220,
            background: "var(--surface-01)",
            border: "1px solid var(--border-neutral)",
            borderRadius: 8,
            boxShadow: "var(--shadow-flyout)",
            zIndex: 200,
            overflow: "hidden",
            animation: "slideDown 0.15s cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          <style>{`@keyframes slideDown { from { opacity:0; transform:translateY(-6px) } to { opacity:1; transform:translateY(0) } }`}</style>
          <div
            style={{
              padding: "8px 12px 5px",
              fontSize: 10,
              fontFamily: "DM Mono",
              color: "var(--text-muted)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Export Format
          </div>
          {formats.map((fmt) => {
            const cfg = FORMAT_CONFIG[fmt]
            const handler = fmt === "csv" ? onExportCSV : onExportPDF
            return (
              <button
                key={fmt}
                onClick={() => handle(handler)}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  width: "100%",
                  padding: "9px 12px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--surface-hover)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "none")
                }
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--text-secondary)"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ flexShrink: 0, marginTop: 2 }}
                >
                  <path d={cfg.icon} />
                </svg>
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: "var(--text-primary)",
                      fontFamily: "Inter",
                      lineHeight: "17px",
                    }}
                  >
                    {cfg.label}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted)",
                      fontFamily: "DM Mono",
                      marginTop: 1,
                    }}
                  >
                    {cfg.desc}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ExportButton
