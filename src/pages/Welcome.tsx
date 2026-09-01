/* Responsive: mobile ≤640 | tablet 641–1024 | laptop 1025–1440 | desktop >1440 */
import { useEffect, useState } from "react"
import { useBreakpoint } from "../hooks/useBreakpoint"

interface WelcomeProps {
  onSignIn: () => void
  onTeam: () => void
}

const GREEN_BEANS_URL =
  "https://images.unsplash.com/photo-1703646619157-eb553d16d402?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxncmVlbiUyMGNvZmZlZSUyMGJlYW5zJTIwbWFjcm8lMjBjbG9zZS11cCUyMHJhd3xlbnwxfHx8fDE3ODYyNjYxODV8MA&ixlib=rb-4.1.0&q=80&w=1080"
const ROASTED_BEANS_URL =
  "https://images.unsplash.com/photo-1626790477331-add9bde2fdce?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwzfHxkYXJrJTIwcm9hc3RlZCUyMGNvZmZlZSUyMGJlYW5zJTIwY2xvc2UtdXAlMjBtYWNyb3xlbnwxfHx8fDE3ODYyNjYxODZ8MA&ixlib=rb-4.1.0&q=80&w=1080"

const BeanSplitPanel = () => (
  <div
    style={{
      position: "relative",
      width: "100%",
      paddingBottom: "62%",
      borderRadius: "inherit",
      overflow: "hidden",
    }}
  >
    {/* Left: green beans */}
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage: `url(${GREEN_BEANS_URL})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        clipPath: "polygon(0 0, 58% 0, 42% 100%, 0 100%)",
        transition: "transform 0.6s ease",
      }}
    />
    {/* Right: dark roasted beans */}
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage: `url(${ROASTED_BEANS_URL})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        clipPath: "polygon(58% 0, 100% 0, 100% 100%, 42% 100%)",
        transition: "transform 0.6s ease",
      }}
    />
    {/* Diagonal blend strip */}
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "linear-gradient(105deg, transparent 36%, rgba(15, 23, 18, 0.75) 48%, transparent 60%)",
        pointerEvents: "none",
      }}
    />
    {/* Overlay subtle Vignette */}
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "radial-gradient(circle at center, transparent 40%, rgba(10,14,12,0.6) 100%)",
        pointerEvents: "none",
      }}
    />
    {/* Labels */}
    <div
      style={{
        position: "absolute",
        bottom: 16,
        left: 20,
        fontSize: 11,
        fontFamily: "DM Mono, monospace",
        fontWeight: 600,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "#A7F3D0",
        background: "rgba(6, 78, 59, 0.75)",
        backdropFilter: "blur(8px)",
        padding: "4px 12px",
        borderRadius: 6,
        border: "1px solid rgba(52, 211, 153, 0.3)",
      }}
    >
      🌱 Green · Specialty Import
    </div>
    <div
      style={{
        position: "absolute",
        bottom: 16,
        right: 20,
        fontSize: 11,
        fontFamily: "DM Mono, monospace",
        fontWeight: 600,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "#FDE68A",
        background: "rgba(120, 53, 15, 0.75)",
        backdropFilter: "blur(8px)",
        padding: "4px 12px",
        borderRadius: 6,
        border: "1px solid rgba(251, 191, 36, 0.3)",
      }}
    >
       Dark · Artisanal Roast
    </div>
    {/* Center badge */}
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        padding: "8px 16px",
        borderRadius: 30,
        background: "rgba(15, 23, 18, 0.85)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255, 255, 255, 0.2)",
        display: "flex",
        alignItems: "center",
        gap: 8,
        boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
      }}
    >
      <span style={{ fontSize: 13, color: "#10B981" }}>⚡</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: "#FFF", fontFamily: "DM Mono, monospace" }}>
        PRECISION TRANSFORM
      </span>
    </div>
  </div>
)

export default function Welcome({ onSignIn, onTeam }: WelcomeProps) {
  const { isMobile, isTablet, isDesktop } = useBreakpoint()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 40)
    return () => clearTimeout(t)
  }, [])

  const isNarrow = isMobile || isTablet

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#080C0A",
        color: "#E2E8F0",
        display: "flex",
        flexDirection: "column",
        fontFamily: "Inter, system-ui, sans-serif",
        position: "relative",
        overflowX: "hidden",
      }}
    >
      <style>{`
        @keyframes wFadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.35; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.08); }
        }
        .w-enter { animation: wFadeUp 0.6s cubic-bezier(0.16,1,0.3,1) both; }
        .w-enter-2 { animation: wFadeUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.12s both; }
        .w-enter-3 { animation: wFadeUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.22s both; }
        .w-enter-4 { animation: wFadeUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.32s both; }
        .w-btn-primary {
          background: linear-gradient(135deg, #2B4D3A 0%, #1B3628 100%);
          border: 1px solid rgba(74, 222, 128, 0.3);
          box-shadow: 0 8px 24px rgba(43, 77, 58, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2);
          transition: all 0.25s ease;
        }
        .w-btn-primary:hover {
          transform: translateY(-2px);
          background: linear-gradient(135deg, #355E47 0%, #234534 100%);
          box-shadow: 0 12px 32px rgba(43, 77, 58, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.3);
          border-color: rgba(74, 222, 128, 0.6);
        }
        .w-btn-secondary {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(12px);
          border: 1.5px solid rgba(255, 255, 255, 0.14);
          transition: all 0.25s ease;
        }
        .w-btn-secondary:hover {
          transform: translateY(-2px);
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.35);
          color: #FFFFFF !important;
        }
        .feature-card {
          background: rgba(18, 26, 21, 0.65);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          padding: 18px 20px;
          transition: all 0.3s ease;
        }
        .feature-card:hover {
          transform: translateY(-4px);
          background: rgba(26, 38, 30, 0.85);
          border-color: rgba(52, 211, 153, 0.3);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4);
        }
      `}</style>

      {/* ── Background Glow Effects ─────────────────────────── */}
      <div
        style={{
          position: "absolute",
          top: "-120px",
          left: "20%",
          width: "550px",
          height: "550px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(43, 77, 58, 0.35) 0%, transparent 70%)",
          filter: "blur(80px)",
          pointerEvents: "none",
          animation: "pulseGlow 8s ease-in-out infinite",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-100px",
          right: "10%",
          width: "450px",
          height: "450px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(180, 130, 40, 0.15) 0%, transparent 70%)",
          filter: "blur(90px)",
          pointerEvents: "none",
        }}
      />

      {/* ── Floating Header Navbar ───────────────────────────── */}
      <header
        style={{
          width: "100%",
          maxWidth: 1280,
          margin: "0 auto",
          padding: isMobile ? "16px 20px" : "24px 40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 20,
          opacity: visible ? 1 : 0,
          transition: "opacity 0.4s ease",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: "linear-gradient(135deg, #2B4D3A 0%, #4A7C5A 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 16px rgba(43,77,58,0.4)",
              border: "1px solid rgba(255,255,255,0.2)",
            }}
          >
            <span style={{ fontSize: 20 }}></span>
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#FFFFFF", fontFamily: "Fraunces, serif", letterSpacing: "-0.01em" }}>
              Flavor Coffee ERP
            </div>
            <div style={{ fontSize: 10.5, fontFamily: "DM Mono, monospace", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Addis Ababa · Operations
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {!isMobile && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 14px",
                borderRadius: 20,
                background: "rgba(16, 185, 129, 0.1)",
                border: "1px solid rgba(16, 185, 129, 0.25)",
                fontSize: 12,
                fontFamily: "DM Mono, monospace",
                color: "#34D399",
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10B981", boxShadow: "0 0 10px #10B981" }} />
              All Systems Operational
            </div>
          )}
          <button
            onClick={onSignIn}
            className="w-btn-primary"
            style={{
              padding: "9px 20px",
              borderRadius: 9,
              color: "#FFF",
              fontSize: 13.5,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Sign In →
          </button>
        </div>
      </header>

      {/* ── Main Hero Content ──────────────────────────────────── */}
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: isNarrow ? "column" : "row",
          alignItems: "center",
          justifyContent: "space-between",
          padding: isMobile ? "24px 20px 40px" : isTablet ? "36px 40px" : "40px 60px",
          gap: isNarrow ? 36 : 60,
          maxWidth: 1280,
          margin: "0 auto",
          width: "100%",
          zIndex: 10,
        }}
      >
        {/* Left Column: Brand & Hero Copy */}
        <div
          style={{
            flex: isNarrow ? "none" : 1,
            maxWidth: isNarrow ? 560 : 540,
            width: "100%",
            textAlign: isNarrow ? "center" : "left",
          }}
        >
          {/* Eyebrow Pill */}
          <div
            className="w-enter"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "5px 14px",
              borderRadius: 20,
              background: "rgba(43, 77, 58, 0.35)",
              border: "1px solid rgba(74, 222, 128, 0.25)",
              color: "#A7F3D0",
              fontSize: 11.5,
              fontFamily: "DM Mono, monospace",
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginBottom: 20,
            }}
          >
            <span>✨</span> Enterprise Coffee Platform v2.6
          </div>

          {/* Hero Headline */}
          <h1
            className="w-enter-2"
            style={{
              fontSize: isMobile ? 32 : isTablet ? 42 : 52,
              fontWeight: 700,
              fontFamily: "Fraunces, serif",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              color: "#FFFFFF",
              margin: "0 0 18px",
            }}
          >
            Precision ERP for <br />
            <span
              style={{
                background: "linear-gradient(135deg, #4ADE80 0%, #A7F3D0 50%, #FDE68A 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Artisanal Coffee
            </span>
          </h1>

          {/* Subtitle */}
          <p
            className="w-enter-3"
            style={{
              fontSize: isMobile ? 14.5 : 16,
              color: "#94A3B8",
              lineHeight: 1.65,
              margin: "0 0 32px",
              maxWidth: isNarrow ? "100%" : 480,
            }}
          >
            Streamline green bean receiving, roast batch profiling, quality control, customer deliveries, and live financial accounting — engineered for Ethiopia's top coffee roasters.
          </p>

          {/* CTA Buttons */}
          <div
            className="w-enter-4"
            style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              gap: 14,
              justifyContent: isNarrow ? "center" : "flex-start",
              marginBottom: 44,
            }}
          >
            <button
              className="w-btn-primary"
              onClick={onSignIn}
              style={{
                height: 50,
                padding: "0 32px",
                borderRadius: 11,
                color: "#FFFFFF",
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
              }}
            >
              Sign In to ERP
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>

            <button
              className="w-btn-secondary"
              onClick={onTeam}
              style={{
                height: 50,
                padding: "0 26px",
                borderRadius: 11,
                color: "#CBD5E1",
                fontSize: 15,
                fontWeight: 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 9,
              }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
              </svg>
              Meet the Team
            </button>
          </div>

          {/* Module Highlights Grid */}
          <div
            className="w-enter-4"
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
              gap: 12,
            }}
          >
            {[
              { icon: "", title: "Roasting & QC", desc: "Batch profiling & yield calculations" },
              { icon: "🚚", title: "Delivery Logistics", desc: "Driver assignment & dispatch tracking" },
              { icon: "💵", title: "Financial Core", desc: "Real-time payments & expense approvals" },
              { icon: "", title: "Live Intelligence", desc: "Stock feasibility & automated reporting" },
            ].map((f) => (
              <div key={f.title} className="feature-card">
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <span style={{ fontSize: 16 }}>{f.icon}</span>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: "#F8FAFC" }}>{f.title}</div>
                </div>
                <div style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.4 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: High-Impact Visual Card */}
        <div
          style={{
            flex: isNarrow ? "none" : 1,
            maxWidth: isNarrow ? 480 : 540,
            width: "100%",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(16px)",
            transition: "opacity 0.7s ease 0.2s, transform 0.7s cubic-bezier(0.16,1,0.3,1) 0.2s",
          }}
        >
          <div
            style={{
              background: "rgba(15, 23, 18, 0.8)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: 22,
              overflow: "hidden",
              boxShadow: "0 25px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(43, 77, 58, 0.25)",
            }}
          >
            <BeanSplitPanel />

            {/* Live Operational Status Bar */}
            <div
              style={{
                padding: "16px 22px",
                background: "rgba(10, 15, 12, 0.95)",
                borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: "#F8FAFC" }}>
                  Flavor Coffee Roasters PLC
                </div>
                <div style={{ fontSize: 11.5, fontFamily: "DM Mono, monospace", color: "#64748B", marginTop: 2 }}>
                  Est. 2019 · Addis Ababa Headquarters
                </div>
              </div>

              <div
                style={{
                  padding: "5px 12px",
                  borderRadius: 20,
                  background: "rgba(52, 211, 153, 0.12)",
                  border: "1px solid rgba(52, 211, 153, 0.3)",
                  color: "#34D399",
                  fontSize: 11,
                  fontFamily: "DM Mono, monospace",
                  fontWeight: 700,
                }}
              >
                ERP ONLINE
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer
        style={{
          width: "100%",
          padding: isMobile ? "20px" : "24px 60px",
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          background: "rgba(6, 10, 8, 0.9)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexDirection: isMobile ? "column" : "row",
          gap: 12,
          zIndex: 10,
          opacity: visible ? 1 : 0,
          transition: "opacity 0.4s ease 0.3s",
        }}
      >
        <div style={{ fontSize: 12, color: "#64748B", fontFamily: "DM Mono, monospace" }}>
          © 2026 Flavor Coffee Roasters PLC · Internal Enterprise System
        </div>
        <div style={{ display: "flex", gap: 18, fontSize: 12, color: "#94A3B8" }}>
          <span style={{ cursor: "pointer" }} onClick={onSignIn}>System Login</span>
          <span>·</span>
          <span style={{ cursor: "pointer" }} onClick={onTeam}>Engineering Team</span>
        </div>
      </footer>
    </div>
  )
}
