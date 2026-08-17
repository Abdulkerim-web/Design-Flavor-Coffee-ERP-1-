/* Responsive: mobile ≤640 | tablet 641–1024 | laptop 1025–1440 | desktop >1440 */
import { useEffect, useState } from "react"
import { useBreakpoint } from "../hooks/useBreakpoint"

interface TeamMember {
  id: number
  name: string
  initials: string
  degree: string
  university: string
  about: string
  color: string
  bg: string
}

const TEAM: TeamMember[] = [
  {
    id: 1,
    name: "Abdulkerim K.",
    initials: "AK",
    degree: "Information Systems (IS)",
    university: "Hawassa University",
    about:
      "Led ERP module design for inventory management and supplier workflows, shaping the core data architecture of the system.",
    color: "#1D4ED8",
    bg: "#EFF6FF",
  },
  {
    id: 2,
    name: "Abdulkerim A.",
    initials: "AA",
    degree: "Information Systems (IS)",
    university: "Hawassa University",
    about:
      "Contributed to quality control, yield verification, and the dual-verification discrepancy workflow throughout the production pipeline.",
    color: "#7C3AED",
    bg: "#F5F3FF",
  },
  {
    id: 3,
    name: "Keneni",
    initials: "KN",
    degree: "Information Systems (IS)",
    university: "Hawassa University",
    about:
      "Designed and built the financial ledger, Ministry of Revenue tax reporting modules, and enterprise analytics dashboards.",
    color: "#0E7490",
    bg: "#ECFEFF",
  },
  {
    id: 4,
    name: "Tewfik A.",
    initials: "TA",
    degree: "Information Technology (IT)",
    university: "Hawassa University",
    about:
      "Architected the RBAC access control system, user management module, and the authentication and session handling layer.",
    color: "#B45309",
    bg: "#FFFBEB",
  },
  {
    id: 5,
    name: "Zerubabel",
    initials: "ZR",
    degree: "Information Systems (IS)",
    university: "Hawassa University",
    about:
      "Built the logistics and delivery tracking module, customer portal, and responsive mobile interface across the full ERP suite.",
    color: "#065F46",
    bg: "#ECFDF5",
  },
]

interface TeamProps {
  onBack: () => void
}

export default function Team({ onBack }: TeamProps) {
  const { isMobile, isTablet, isDesktop } = useBreakpoint()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 40)
    return () => clearTimeout(t)
  }, [])

  const cols = isMobile ? 1 : isTablet ? 2 : 3

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <style>{`
        @keyframes tFadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .t-card {
          animation: tFadeUp 0.45s cubic-bezier(0.16,1,0.3,1) both;
          transition: box-shadow 0.2s ease, transform 0.2s ease;
        }
        .t-card:hover {
          box-shadow: 0 12px 32px rgba(43,77,58,0.1), 0 2px 8px rgba(0,0,0,0.04) !important;
          transform: translateY(-2px);
        }
        .t-back:hover { background: var(--surface-hover) !important; color: var(--text-primary) !important; }
      `}</style>

      {/* ── Top accent bar ──────────────────────────────── */}
      <div
        style={{
          height: 3,
          background:
            "linear-gradient(90deg, #2B4D3A 0%, #4A7C5A 50%, #B8860B 100%)",
        }}
      />

      <div
        style={{
          maxWidth: isDesktop ? 1200 : "100%",
          margin: "0 auto",
          padding: isMobile
            ? "24px 16px 40px"
            : isTablet
              ? "32px 32px 48px"
              : "40px 60px 64px",
          opacity: visible ? 1 : 0,
          transition: "opacity 0.35s ease",
        }}
      >
        {/* ── Back button ─────────────────────────────────── */}
        <button
          className="t-back"
          onClick={onBack}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            marginBottom: 32,
            padding: "7px 14px",
            borderRadius: 8,
            border: "1px solid var(--border-neutral)",
            background: "var(--surface-01)",
            color: "var(--text-secondary)",
            fontSize: 13,
            fontFamily: "Inter",
            fontWeight: 500,
            cursor: "pointer",
            transition: "all 0.15s ease",
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
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to Welcome
        </button>

        {/* ── Header ──────────────────────────────────────── */}
        <div style={{ marginBottom: isMobile ? 28 : 40 }}>
          <div
            style={{
              fontSize: 11,
              fontFamily: "DM Mono",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--text-muted)",
              marginBottom: 8,
            }}
          >
            Flavor Coffee ERP · Development Team
          </div>
          <h1
            style={{
              fontSize: isMobile ? 24 : isTablet ? 28 : 34,
              fontWeight: 700,
              color: "var(--text-primary)",
              letterSpacing: "-0.025em",
              lineHeight: 1.15,
              margin: "0 0 10px",
            }}
          >
            The Team Behind This System
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "var(--text-secondary)",
              lineHeight: 1.6,
              margin: 0,
              maxWidth: 520,
            }}
          >
            Final-year students from Hawassa University who designed and built
            this ERP from the ground up as their capstone project.
          </p>
        </div>

        {/* ── Team grid ───────────────────────────────────── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: isMobile ? 14 : 20,
          }}
        >
          {TEAM.map((member, i) => (
            <div
              key={member.id}
              className="t-card"
              style={{
                animationDelay: `${i * 0.07}s`,
                background: "var(--surface-01)",
                border: "1px solid var(--border-neutral)",
                borderRadius: 14,
                padding: isMobile ? "20px 18px" : "24px 22px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              {/* Avatar + name row */}
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    flexShrink: 0,
                    background: member.bg,
                    border: `1.5px solid ${member.color}22`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 15,
                    fontWeight: 700,
                    color: member.color,
                    fontFamily: "Inter",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {member.initials}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      letterSpacing: "-0.01em",
                      marginBottom: 2,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {member.name}
                  </div>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      fontSize: 10.5,
                      fontFamily: "DM Mono",
                      color: member.color,
                      background: member.bg,
                      padding: "2px 8px",
                      borderRadius: 999,
                    }}
                  >
                    {member.degree}
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: "var(--border-neutral)" }} />

              {/* About */}
              <p
                style={{
                  fontSize: 13,
                  color: "var(--text-secondary)",
                  lineHeight: 1.55,
                  margin: 0,
                }}
              >
                {member.about}
              </p>

              {/* University tag */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 11.5,
                  color: "var(--text-muted)",
                  fontFamily: "DM Mono",
                  marginTop: "auto",
                }}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                >
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c3 3 9 3 12 0v-5" />
                </svg>
                {member.university}
              </div>
            </div>
          ))}
        </div>

        {/* ── Footer note ─────────────────────────────────── */}
        <div
          style={{
            marginTop: isMobile ? 40 : 56,
            paddingTop: 24,
            borderTop: "1px solid var(--border-neutral)",
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "flex-start" : "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <span
            style={{
              fontSize: 12,
              color: "var(--text-muted)",
              fontFamily: "DM Mono",
              letterSpacing: "0.03em",
            }}
          >
            © 2026 Flavor Coffee Roasters PLC · Hawassa University Capstone
            Project
          </span>
          <button
            onClick={onBack}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 12.5,
              color: "var(--brand-primary)",
              fontFamily: "Inter",
              fontWeight: 500,
              padding: 0,
            }}
          >
            ← Back to home
          </button>
        </div>
      </div>
    </div>
  )
}
