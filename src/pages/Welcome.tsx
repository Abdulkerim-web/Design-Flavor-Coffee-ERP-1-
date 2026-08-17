/* Responsive: mobile ≤640 | tablet 641–1024 | laptop 1025–1440 | desktop >1440 */
import { useEffect, useState } from 'react'
import { useBreakpoint } from '../hooks/useBreakpoint'

interface WelcomeProps {
  onSignIn: () => void
  onTeam:   () => void
}

const GREEN_BEANS_URL = "https://images.unsplash.com/photo-1703646619157-eb553d16d402?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxncmVlbiUyMGNvZmZlZSUyMGJlYW5zJTIwbWFjcm8lMjBjbG9zZS11cCUyMHJhd3xlbnwxfHx8fDE3ODYyNjYxODV8MA&ixlib=rb-4.1.0&q=80&w=1080"
const ROASTED_BEANS_URL = "https://images.unsplash.com/photo-1626790477331-add9bde2fdce?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwzfHxkYXJrJTIwcm9hc3RlZCUyMGNvZmZlZSUyMGJlYW5zJTIwY2xvc2UtdXAlMjBtYWNyb3xlbnwxfHx8fDE3ODYyNjYxODZ8MA&ixlib=rb-4.1.0&q=80&w=1080"

const BeanSplitPanel = () => (
  <div style={{ position: 'relative', width: '100%', paddingBottom: '66%', borderRadius: 'inherit', overflow: 'hidden' }}>
    {/* Left: green beans */}
    <div style={{
      position: 'absolute', inset: 0,
      backgroundImage: `url(${GREEN_BEANS_URL})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      clipPath: 'polygon(0 0, 58% 0, 42% 100%, 0 100%)',
    }} />
    {/* Right: dark roasted beans */}
    <div style={{
      position: 'absolute', inset: 0,
      backgroundImage: `url(${ROASTED_BEANS_URL})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      clipPath: 'polygon(58% 0, 100% 0, 100% 100%, 42% 100%)',
    }} />
    {/* Diagonal blend strip */}
    <div style={{
      position: 'absolute', inset: 0,
      background: 'linear-gradient(105deg, transparent 38%, rgba(26,14,6,0.55) 48%, transparent 58%)',
      pointerEvents: 'none',
    }} />
    {/* Labels */}
    <div style={{
      position: 'absolute', bottom: 14, left: 16,
      fontSize: 10, fontFamily: 'DM Mono', fontWeight: 600,
      letterSpacing: '0.1em', textTransform: 'uppercase',
      color: 'rgba(255,255,255,0.85)',
      textShadow: '0 1px 4px rgba(0,0,0,0.6)',
    }}>
      Green · Unroasted
    </div>
    <div style={{
      position: 'absolute', bottom: 14, right: 16,
      fontSize: 10, fontFamily: 'DM Mono', fontWeight: 600,
      letterSpacing: '0.1em', textTransform: 'uppercase',
      color: 'rgba(255,255,255,0.85)',
      textShadow: '0 1px 4px rgba(0,0,0,0.6)',
    }}>
      Dark · Roasted
    </div>
    {/* Center arrow mark */}
    <div style={{
      position: 'absolute', top: '50%', left: '50%',
      transform: 'translate(-50%, -50%)',
      width: 28, height: 28, borderRadius: '50%',
      background: 'rgba(255,255,255,0.12)',
      backdropFilter: 'blur(4px)',
      border: '1px solid rgba(255,255,255,0.25)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
        <path d="M5 12h14M12 5l7 7-7 7"/>
      </svg>
    </div>
  </div>
)

export default function Welcome({ onSignIn, onTeam }: WelcomeProps) {
  const { isMobile, isTablet, isDesktop } = useBreakpoint()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60)
    return () => clearTimeout(t)
  }, [])

  const isNarrow = isMobile || isTablet

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Inter, system-ui, sans-serif',
      overflow: 'hidden',
    }}>
      <style>{`
        @keyframes wFadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .w-enter { animation: wFadeUp 0.55s cubic-bezier(0.16,1,0.3,1) both; }
        .w-enter-2 { animation: wFadeUp 0.55s cubic-bezier(0.16,1,0.3,1) 0.1s both; }
        .w-enter-3 { animation: wFadeUp 0.55s cubic-bezier(0.16,1,0.3,1) 0.2s both; }
        .w-enter-4 { animation: wFadeUp 0.55s cubic-bezier(0.16,1,0.3,1) 0.3s both; }
        .w-btn-primary:hover { background: #1F382A !important; }
        .w-btn-secondary:hover { background: var(--surface-hover) !important; border-color: var(--brand-primary) !important; color: var(--brand-primary) !important; }
      `}</style>

      {/* ── Top accent bar ─────────────────────────────────────── */}
      <div style={{
        height: 3,
        background: 'linear-gradient(90deg, #2B4D3A 0%, #4A7C5A 50%, #B8860B 100%)',
        flexShrink: 0,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.4s ease',
      }} />

      {/* ── Main content ───────────────────────────────────────── */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: isNarrow ? 'column' : 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '32px 20px 24px' : isTablet ? '48px 40px' : '0 80px',
        gap: isMobile ? 32 : isTablet ? 40 : 72,
        maxWidth: isDesktop ? 1400 : '100%',
        margin: '0 auto',
        width: '100%',
      }}>

        {/* ── Left: Brand + CTAs ─────────────────────────────── */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: isNarrow ? 'center' : 'flex-start',
          textAlign: isNarrow ? 'center' : 'left',
          maxWidth: isNarrow ? 480 : 420,
          width: '100%',
          flexShrink: 0,
        }}>
          {/* Logo mark — abstract bean geometry */}
          <div
            className="w-enter"
            style={{
              width: 56, height: 56, borderRadius: 16,
              background: 'linear-gradient(135deg, #2B4D3A 0%, #3D6B54 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(43,77,58,0.22)',
              marginBottom: 20,
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 3 C8.5 3 6 7 6 12 C6 17 8.5 21 12 21" stroke="rgba(255,255,255,0.92)" strokeWidth="1.6" strokeLinecap="round"/>
              <path d="M12 3 C15.5 3 18 7 18 12 C18 17 15.5 21 12 21" stroke="rgba(255,255,255,0.92)" strokeWidth="1.6" strokeLinecap="round"/>
              <line x1="12" y1="3" x2="12" y2="21" stroke="rgba(255,255,255,0.32)" strokeWidth="0.9" strokeLinecap="round"/>
            </svg>
          </div>

          {/* Eyebrow label */}
          <div
            className="w-enter"
            style={{
              fontSize: 11, fontFamily: 'DM Mono',
              letterSpacing: '0.1em', textTransform: 'uppercase',
              color: 'var(--text-muted)', marginBottom: 10,
            }}
          >
            Internal Operations Platform
          </div>

          {/* Company name */}
          <h1
            className="w-enter-2"
            style={{
              fontSize: isMobile ? 30 : isTablet ? 36 : 44,
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              margin: '0 0 12px',
            }}
          >
            Flavor Coffee<br />
            <span style={{ color: '#2B4D3A' }}>Roasters PLC</span>
          </h1>

          {/* Description */}
          <p
            className="w-enter-3"
            style={{
              fontSize: isMobile ? 14 : 15,
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              margin: '0 0 32px',
              maxWidth: 340,
            }}
          >
            Enterprise resource planning for green bean receiving,
            roasting production, quality control, delivery logistics,
            and financial reporting — all in one place.
          </p>

          {/* Actions */}
          <div
            className="w-enter-4"
            style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              gap: 12,
              width: isMobile ? '100%' : 'auto',
            }}
          >
            <button
              className="w-btn-primary"
              onClick={onSignIn}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                height: 46,
                padding: '0 28px',
                borderRadius: 10, border: 'none',
                background: '#2B4D3A', color: '#FFFFFF',
                fontSize: 14.5, fontWeight: 600, fontFamily: 'Inter',
                cursor: 'pointer',
                transition: 'background 0.15s ease, box-shadow 0.15s ease',
                boxShadow: '0 4px 14px rgba(43,77,58,0.28)',
                width: isMobile ? '100%' : 'auto',
              }}
            >
              Sign In
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>

            <button
              className="w-btn-secondary"
              onClick={onTeam}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                height: 46,
                padding: '0 22px',
                borderRadius: 10,
                border: '1.5px solid var(--border-neutral)',
                background: 'var(--surface-01)',
                color: 'var(--text-secondary)',
                fontSize: 14.5, fontWeight: 500, fontFamily: 'Inter',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                width: isMobile ? '100%' : 'auto',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
              </svg>
              Meet the Team
            </button>
          </div>

          {/* System status — desktop only inline */}
          {!isNarrow && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 7,
              marginTop: 32,
              fontSize: 12, color: 'var(--text-muted)', fontFamily: 'DM Mono',
            }}>
              <div style={{
                width: 7, height: 7, borderRadius: '50%',
                background: '#16A34A',
                boxShadow: '0 0 0 3px rgba(22,163,74,0.18)',
              }} />
              All systems operational · Addis Ababa, ET
            </div>
          )}
        </div>

        {/* ── Right: Illustration ────────────────────────────── */}
        <div style={{
          flex: isNarrow ? 'none' : 1,
          maxWidth: isNarrow ? 280 : 480,
          width: '100%',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(12px)',
          transition: 'opacity 0.6s ease 0.15s, transform 0.6s cubic-bezier(0.16,1,0.3,1) 0.15s',
        }}>
          {/* Illustration card */}
          <div style={{
            background: '#0D0B09',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: isNarrow ? 16 : 20,
            overflow: 'hidden',
            boxShadow: '0 20px 48px rgba(0,0,0,0.22), 0 4px 12px rgba(0,0,0,0.12)',
          }}>
            <BeanSplitPanel />

            {/* Caption row */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px',
              borderTop: '1px solid rgba(255,255,255,0.07)',
            }}>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: 'rgba(255,255,255,0.88)', fontFamily: 'Inter' }}>
                  Flavor Coffee Roasters
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'DM Mono', marginTop: 1 }}>
                  Est. 2019 · Addis Ababa
                </div>
              </div>
              <div style={{
                fontSize: 10.5, fontFamily: 'DM Mono',
                color: '#4ADE80',
                background: 'rgba(74,222,128,0.1)',
                border: '1px solid rgba(74,222,128,0.2)',
                padding: '3px 10px', borderRadius: 999,
              }}>
                ERP v2.6
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <div style={{
        flexShrink: 0,
        padding: isMobile ? '12px 20px' : '16px 80px',
        borderTop: '1px solid var(--border-neutral)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.4s ease 0.4s',
      }}>
        <span style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
          © 2026 Flavor Coffee Roasters PLC · Internal Use Only
        </span>
      </div>
    </div>
  )
}
