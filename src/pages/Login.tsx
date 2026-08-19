/* Responsive: mobile ≤640 | tablet 641–1024 | laptop 1025–1440 | desktop >1440 */
import { useState, useEffect, useRef, type FormEvent } from "react"
import { useAuth } from "../contexts/AuthContext"
import { ROLES, INITIAL_USERS } from "../lib/rbac"
import { useBreakpoint } from "../hooks/useBreakpoint"

/* ─────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────── */
type Screen = "login" | "forgot" | "reset-sent" | "new-password" | "reset-success" | "session-expired" | "access-denied" | "account-unavailable" | "auth-error"

type FieldError = {
  email?: string
  password?: string
  newPw?: string
  confirmPw?: string
}

/* ─────────────────────────────────────────────────────────
   Demo accounts
───────────────────────────────────────────────────────── */
const DEMO_ACCOUNTS = [
  { email: "abebe.g@flavorcoffee.et", label: "General Manager" },
  { email: "meron.b@flavorcoffee.et", label: "Sales Rep" },
  { email: "dawit.h@flavorcoffee.et", label: "Head Roaster" },
  { email: "tigist.a@flavorcoffee.et", label: "Accountant" },
  { email: "yohannes.m@flavorcoffee.et", label: "Delivery Staff" },
  { email: "biruk.a@flavorcoffee.et", label: "Disabled Account" },
]
const ROLE_MAP = Object.fromEntries(INITIAL_USERS.map((u) => [u.email, u.role]))

/* ─────────────────────────────────────────────────────────
   Icon atoms
───────────────────────────────────────────────────────── */
const EyeOpen = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)
const EyeOff = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
  >
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
)
const BrandMark = ({ size = 24 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M12 3 C8.5 3 6 7 6 12 C6 17 8.5 21 12 21"
      stroke="rgba(255,255,255,0.92)"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <path
      d="M12 3 C15.5 3 18 7 18 12 C18 17 15.5 21 12 21"
      stroke="rgba(255,255,255,0.92)"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <line
      x1="12"
      y1="3"
      x2="12"
      y2="21"
      stroke="rgba(255,255,255,0.32)"
      strokeWidth="0.9"
      strokeLinecap="round"
    />
  </svg>
)

/* ─────────────────────────────────────────────────────────
   Shared sub-components
───────────────────────────────────────────────────────── */
const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <label
    style={{
      display: "block",
      fontSize: 12.5,
      fontWeight: 500,
      color: "var(--text-primary)",
      marginBottom: 6,
      fontFamily: "Inter",
    }}
  >
    {children}
  </label>
)

const Input = ({
  id,
  type = "text",
  value,
  onChange,
  placeholder,
  disabled,
  hasError,
  autoComplete,
  autoFocus,
  right,
}: {
  id?: string
  type?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  disabled?: boolean
  hasError?: boolean
  autoComplete?: string
  autoFocus?: boolean
  right?: React.ReactNode
}) => (
  <div style={{ position: "relative" }}>
    <input
      id={id}
      className="auth-input"
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoComplete={autoComplete}
      autoFocus={autoFocus}
      disabled={disabled}
      aria-invalid={hasError}
      style={{
        width: "100%",
        boxSizing: "border-box",
        height: 42,
        padding: right ? "0 42px 0 12px" : "0 12px",
        borderRadius: 8,
        border: `1.5px solid ${
          hasError ? "var(--sem-danger)" : "var(--border-neutral)"
        }`,
        background: disabled ? "var(--surface-02)" : "var(--bg-primary)",
        fontSize: 13.5,
        color: "var(--text-primary)",
        fontFamily: "Inter",
        transition: "border-color 0.15s, box-shadow 0.15s",
        opacity: disabled ? 0.65 : 1,
      }}
    />
    {right && (
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          display: "flex",
          alignItems: "center",
          paddingRight: 10,
        }}
      >
        {right}
      </div>
    )}
  </div>
)

const FieldError = ({ msg }: { msg?: string }) =>
  msg ? (
    <div
      role="alert"
      style={{
        marginTop: 5,
        fontSize: 12,
        color: "var(--sem-danger)",
        display: "flex",
        gap: 5,
        alignItems: "center",
      }}
    >
      <svg
        width="11"
        height="11"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      {msg}
    </div>
  ) : null

const AlertBanner = ({
  title,
  message,
  variant = "danger",
}: {
  title: string
  message: string
  variant?: "danger" | "warning" | "info"
}) => {
  const cfg = {
    danger: {
      bg: "rgba(220,38,38,0.06)",
      border: "rgba(220,38,38,0.2)",
      color: "#DC2626",
      icon: "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01",
    },
    warning: {
      bg: "rgba(180,83,9,0.06)",
      border: "rgba(180,83,9,0.2)",
      color: "#B45309",
      icon: "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01",
    },
    info: {
      bg: "rgba(29,78,216,0.06)",
      border: "rgba(29,78,216,0.18)",
      color: "#1D4ED8",
      icon: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 16v-4M12 8h.01",
    },
  }[variant]
  return (
    <div
      role="alert"
      style={{
        padding: "11px 12px",
        borderRadius: 8,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
      }}
    >
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke={cfg.color}
        strokeWidth="2"
        strokeLinecap="round"
        style={{ flexShrink: 0, marginTop: 1 }}
      >
        <path d={cfg.icon} />
      </svg>
      <div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: cfg.color,
            lineHeight: "17px",
          }}
        >
          {title}
        </div>
        {message && (
          <div
            style={{
              fontSize: 12.5,
              color: "var(--text-secondary)",
              lineHeight: "16px",
              marginTop: 2,
            }}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  )
}

const PrimaryButton = ({
  children,
  loading,
  disabled,
  onClick,
  type = "submit",
  danger,
}: {
  children: React.ReactNode
  loading?: boolean
  disabled?: boolean
  onClick?: () => void
  type?: "submit" | "button"
  danger?: boolean
}) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled || loading}
    style={{
      width: "100%",
      height: 44,
      borderRadius: 9,
      border: "none",
      background: danger ? "var(--sem-danger)" : "#2B4D3A",
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: 600,
      fontFamily: "Inter",
      cursor: disabled || loading ? "not-allowed" : "pointer",
      opacity: disabled || loading ? 0.75 : 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      transition:
        "background 0.15s ease, transform 0.1s ease, box-shadow 0.15s ease",
      boxShadow:
        disabled || loading
          ? "none"
          : danger
            ? "0 4px 12px rgba(220,38,38,0.25)"
            : "0 4px 12px rgba(43,77,58,0.25)",
    }}
    onMouseEnter={(e) => {
      if (!disabled && !loading) {
        const el = e.currentTarget as HTMLButtonElement
        el.style.background = danger ? "#B91C1C" : "#1F382A"
        el.style.transform = "translateY(-1px)"
        el.style.boxShadow = danger
          ? "0 6px 16px rgba(220,38,38,0.3)"
          : "0 6px 16px rgba(43,77,58,0.32)"
      }
    }}
    onMouseLeave={(e) => {
      const el = e.currentTarget as HTMLButtonElement
      el.style.background = danger ? "var(--sem-danger)" : "#2B4D3A"
      el.style.transform = "translateY(0)"
      el.style.boxShadow = danger
        ? "0 4px 12px rgba(220,38,38,0.25)"
        : "0 4px 12px rgba(43,77,58,0.25)"
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
        style={{ animation: "authSpin 0.7s linear infinite", flexShrink: 0 }}
      >
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      </svg>
    )}
    {children}
  </button>
)

const GhostButton = ({
  children,
  onClick,
}: {
  children: React.ReactNode
  onClick?: () => void
}) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      background: "none",
      border: "none",
      cursor: "pointer",
      fontSize: 13,
      color: "var(--brand-primary)",
      fontFamily: "Inter",
      fontWeight: 500,
      padding: "4px 0",
      display: "flex",
      alignItems: "center",
      gap: 5,
      transition: "opacity 0.15s",
    }}
    onMouseEnter={(e) => {
      ;(e.currentTarget as HTMLButtonElement).style.opacity = "0.75"
    }}
    onMouseLeave={(e) => {
      ;(e.currentTarget as HTMLButtonElement).style.opacity = "1"
    }}
  >
    {children}
  </button>
)

/* ─────────────────────────────────────────────────────────
   Left brand panel (desktop only)
───────────────────────────────────────────────────────── */
const BrandPanel = () => (
  <div
    style={{
      position: "relative",
      overflow: "hidden",
      background:
        "linear-gradient(160deg, #1C2E22 0%, #0E1A12 50%, #1A1108 100%)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      padding: "48px 48px 40px",
    }}
  >
    {/* Texture overlay — subtle noise */}
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: 0.04,
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        pointerEvents: "none",
      }}
    />

    {/* Abstract bean rings — decorative SVG */}
    <div
      style={{
        position: "absolute",
        right: -60,
        top: -60,
        opacity: 0.06,
        pointerEvents: "none",
      }}
    >
      <svg width="360" height="360" viewBox="0 0 360 360" fill="none">
        <circle cx="180" cy="180" r="170" stroke="white" strokeWidth="1" />
        <circle cx="180" cy="180" r="130" stroke="white" strokeWidth="1" />
        <circle cx="180" cy="180" r="90" stroke="white" strokeWidth="1" />
        <circle cx="180" cy="180" r="50" stroke="white" strokeWidth="1" />
      </svg>
    </div>
    <div
      style={{
        position: "absolute",
        left: -80,
        bottom: -80,
        opacity: 0.04,
        pointerEvents: "none",
      }}
    >
      <svg width="280" height="280" viewBox="0 0 280 280" fill="none">
        <circle cx="140" cy="140" r="130" stroke="white" strokeWidth="1" />
        <circle cx="140" cy="140" r="90" stroke="white" strokeWidth="1" />
        <circle cx="140" cy="140" r="50" stroke="white" strokeWidth="1" />
      </svg>
    </div>

    {/* Top: logo + wordmark */}
    <div style={{ position: "relative", zIndex: 1 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 48,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            flexShrink: 0,
            background: "linear-gradient(135deg, #3D6B54 0%, #2B4D3A 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          }}
        >
          <BrandMark size={20} />
        </div>
        <div>
          <div
            style={{
              fontSize: 13.5,
              fontWeight: 700,
              color: "rgba(255,255,255,0.92)",
              letterSpacing: "-0.01em",
              lineHeight: "18px",
            }}
          >
            Flavor Coffee Roasters
          </div>
          <div
            style={{
              fontSize: 10,
              fontFamily: "DM Mono",
              color: "rgba(255,255,255,0.35)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginTop: 1,
            }}
          >
            Enterprise Platform
          </div>
        </div>
      </div>

      {/* Main headline */}
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontSize: 11,
            fontFamily: "DM Mono",
            color: "rgba(74,222,128,0.7)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            marginBottom: 10,
          }}
        >
          Coffee ERP
        </div>
        <h1
          style={{
            fontSize: 34,
            fontWeight: 700,
            color: "#FFFFFF",
            letterSpacing: "-0.03em",
            lineHeight: 1.15,
            margin: "0 0 14px",
          }}
        >
          Roast, track,
          <br />
          <span style={{ color: "rgba(255,255,255,0.45)" }}>and deliver</span>
          <br />
          with precision.
        </h1>
        <p
          style={{
            fontSize: 13.5,
            color: "rgba(255,255,255,0.48)",
            lineHeight: 1.6,
            margin: 0,
            maxWidth: 260,
          }}
        >
          End-to-end ERP for green bean procurement, roasting production,
          quality assurance, and delivery logistics.
        </p>
      </div>

      {/* Stat row */}
      <div style={{ display: "flex", gap: 24, marginTop: 32 }}>
        {[
          { value: "2,400 KG", label: "Roasted this month" },
          { value: "11", label: "Active staff accounts" },
          { value: "97%", label: "On-time delivery rate" },
        ].map((s) => (
          <div key={s.label}>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "rgba(255,255,255,0.88)",
                fontFamily: "DM Mono",
                letterSpacing: "-0.02em",
              }}
            >
              {s.value}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "rgba(255,255,255,0.35)",
                marginTop: 2,
                lineHeight: 1.3,
                fontFamily: "Inter",
              }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Bottom: status + version */}
    <div style={{ position: "relative", zIndex: 1 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 8,
        }}
      >
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#4ADE80",
            boxShadow: "0 0 0 3px rgba(74,222,128,0.18)",
          }}
        />
        <span
          style={{
            fontSize: 11.5,
            color: "rgba(255,255,255,0.45)",
            fontFamily: "Inter",
          }}
        >
          All systems operational
        </span>
      </div>
      <div
        style={{
          fontSize: 10.5,
          fontFamily: "DM Mono",
          color: "rgba(255,255,255,0.22)",
          letterSpacing: "0.06em",
        }}
      >
        FCR-ERP v2.6 · Addis Ababa, Ethiopia
      </div>
    </div>
  </div>
)

/* ─────────────────────────────────────────────────────────
   Auth card shell
───────────────────────────────────────────────────────── */
const AuthCard = ({
  children,
  shake,
}: {
  children: React.ReactNode
  shake?: boolean
}) => (
  <div
    className={`auth-card${shake ? " auth-shake" : ""}`}
    style={{
      background: "var(--surface-01)",
      border: "1px solid var(--border-neutral)",
      borderRadius: 14,
      boxShadow: "0 20px 40px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.04)",
      padding: "32px 32px 28px",
      width: "100%",
    }}
  >
    {children}
  </div>
)

const AuthHeading = ({
  title,
  subtitle,
}: {
  title: string
  subtitle?: string
}) => (
  <div style={{ marginBottom: 24 }}>
    <h2
      style={{
        fontSize: 19,
        fontWeight: 700,
        color: "var(--text-primary)",
        letterSpacing: "-0.02em",
        margin: "0 0 5px",
      }}
    >
      {title}
    </h2>
    {subtitle && (
      <p
        style={{
          fontSize: 13.5,
          color: "var(--text-secondary)",
          margin: 0,
          lineHeight: 1.5,
        }}
      >
        {subtitle}
      </p>
    )}
  </div>
)

/* ─────────────────────────────────────────────────────────
   Screen: Login
───────────────────────────────────────────────────────── */
function LoginScreen({
  onForgot,
  onSessionExpired,
  onAccessDenied,
  onAccountUnavailable,
  onAuthError,
}: {
  onForgot: () => void
  onSessionExpired: () => void
  onAccessDenied: () => void
  onAccountUnavailable: () => void
  onAuthError: () => void
}) {
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [remember, setRemember] = useState(false)
  const [loading, setLoading] = useState(false)
  const [banner, setBanner] = useState<{
    title: string
    message: string
  } | null>(null)
  const [errors, setErrors] = useState<FieldError>({})
  const [shake, setShake] = useState(false)

  const triggerShake = () => {
    setShake(true)
    setTimeout(() => setShake(false), 400)
  }

  const validate = (): boolean => {
    const e: FieldError = {}
    if (!email.trim()) e.email = "Enter your username or email."
    if (!password) e.password = "Enter your password."
    setErrors(e)
    if (Object.keys(e).length) {
      triggerShake()
      return false
    }
    return true
  }

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault()
    if (!validate()) return
    setLoading(true)
    setBanner(null)
    const result = await login(email, password)
    setLoading(false)
    if (!result.ok) {
      triggerShake()
      if (result.error === "disabled") {
        onAccountUnavailable()
      } else if (
        result.error === "unknown-email" ||
        result.error === "invalid-password"
      ) {
        setBanner({
          title: "Unable to sign in",
          message: "Your username or password is incorrect.",
        })
      } else {
        onAuthError()
      }
    }
  }

  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail)
    setPassword("demo")
    setBanner(null)
    setErrors({})
  }

  return (
    <AuthCard shake={shake}>
      <AuthHeading
        title="Sign in to your workspace"
        subtitle="Access your Coffee-Roasting ERP workspace."
      />

      {banner && (
        <div style={{ marginBottom: 16 }}>
          <AlertBanner title={banner.title} message={banner.message} />
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        noValidate
        style={{ display: "flex", flexDirection: "column", gap: 14 }}
      >
        {/* Email */}
        <div>
          <FieldLabel>Email or username</FieldLabel>
          <Input
            id="login-email"
            type="email"
            value={email}
            onChange={(v) => {
              setEmail(v)
              setErrors((e) => ({ ...e, email: undefined }))
            }}
            placeholder="you@flavorcoffee.et"
            autoComplete="email"
            autoFocus
            disabled={loading}
            hasError={!!errors.email}
          />
          <FieldError msg={errors.email} />
        </div>

        {/* Password */}
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 6,
            }}
          >
            <FieldLabel>Password</FieldLabel>
            <GhostButton onClick={onForgot}>Forgot password?</GhostButton>
          </div>
          <Input
            id="login-password"
            type={showPw ? "text" : "password"}
            value={password}
            onChange={(v) => {
              setPassword(v)
              setErrors((e) => ({ ...e, password: undefined }))
            }}
            placeholder="Enter your password"
            autoComplete="current-password"
            disabled={loading}
            hasError={!!errors.password}
            right={
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? "Hide password" : "Show password"}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  display: "flex",
                  alignItems: "center",
                  padding: 4,
                  borderRadius: 4,
                }}
              >
                {showPw ? <EyeOff /> : <EyeOpen />}
              </button>
            }
          />
          <FieldError msg={errors.password} />
        </div>

        {/* Remember me */}
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
            userSelect: "none",
            marginTop: 2,
          }}
        >
          <div
            role="checkbox"
            aria-checked={remember}
            tabIndex={0}
            onClick={() => setRemember((v) => !v)}
            onKeyDown={(e) => e.key === " " && setRemember((v) => !v)}
            style={{
              width: 16,
              height: 16,
              borderRadius: 4,
              flexShrink: 0,
              border: `1.5px solid ${
                remember ? "#2B4D3A" : "var(--border-neutral)"
              }`,
              background: remember ? "#2B4D3A" : "var(--bg-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {remember && (
              <svg
                width="9"
                height="9"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="3.5"
                strokeLinecap="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>
          <span
            style={{
              fontSize: 13,
              color: "var(--text-secondary)",
              fontFamily: "Inter",
            }}
          >
            Remember this device
          </span>
        </label>

        <div style={{ marginTop: 4 }}>
          <PrimaryButton loading={loading}>
            {loading ? (
              "Signing in…"
            ) : (
              <>
                Sign In
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </>
            )}
          </PrimaryButton>
        </div>
      </form>

      {/* Interactive Demo Account Presets */}
      <div
        style={{
          marginTop: 24,
          paddingTop: 20,
          borderTop: "1px solid var(--border-neutral)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          <div
            style={{
              fontSize: 10.5,
              fontFamily: "DM Mono",
              color: "var(--text-muted)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            Quick Role Presets — Click to Fill & Sign In
          </div>
          <span style={{ fontSize: 10, color: "#2B4D3A", fontFamily: "DM Mono", fontWeight: 700 }}>
            1-Click Access
          </span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {DEMO_ACCOUNTS.map((acc) => {
            const role = ROLE_MAP[acc.email]
            const rc = role ? ROLES[role] : null
            const isDisabled = acc.label === "Disabled Account"
            return (
              <div
                key={acc.email}
                style={{
                  padding: "3px 9px",
                  borderRadius: 999,
                  border: `1px solid ${
                    isDisabled ? "#FECACA" : "var(--border-neutral)"
                  }`,
                  background: isDisabled
                    ? "rgba(220,38,38,0.04)"
                    : "var(--surface-02)",
                  fontSize: 11.5,
                  fontFamily: "Inter",
                  cursor: "pointer",
                  color: isDisabled
                    ? "var(--sem-danger)"
                    : (rc?.color ?? "var(--text-secondary)"),
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  lineHeight: "20px",
                  transition: "all 0.12s ease",
                }}
              >
                {isDisabled && (
                  <svg
                    width="9"
                    height="9"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  >
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                )}
                {acc.label}
              </div>
            )
          })}
        </div>
        <div
          style={{
            marginTop: 9,
            fontSize: 11.5,
            color: "var(--text-muted)",
            fontFamily: "Inter",
          }}
        >
          Any password works for active accounts ·{" "}
          <span style={{ fontFamily: "DM Mono" }}>demo</span> is fine
        </div>
      </div>

      {/* Dev shortcut links for other screens */}
      <div
        style={{
          marginTop: 14,
          paddingTop: 14,
          borderTop: "1px solid var(--border-neutral)",
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <span
          style={{
            fontSize: 10.5,
            fontFamily: "DM Mono",
            color: "var(--text-muted)",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            width: "100%",
            marginBottom: 2,
          }}
        >
          Preview auth states
        </span>
        {[
          { label: "Session expired", action: onSessionExpired },
          { label: "Access denied", action: onAccessDenied },
          { label: "Account unavailable", action: onAccountUnavailable },
          { label: "Auth error", action: onAuthError },
        ].map((s) => (
          <button
            key={s.label}
            onClick={s.action}
            style={{
              padding: "2px 8px",
              borderRadius: 4,
              border: "1px solid var(--border-neutral)",
              background: "var(--surface-02)",
              fontSize: 11,
              fontFamily: "DM Mono",
              color: "var(--text-muted)",
              cursor: "pointer",
              transition: "all 0.12s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--text-primary)"
              e.currentTarget.style.borderColor = "var(--brand-primary)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-muted)"
              e.currentTarget.style.borderColor = "var(--border-neutral)"
            }}
          >
            {s.label}
          </button>
        ))}
      </div>
    </AuthCard>
  )
}

/* ─────────────────────────────────────────────────────────
   Screen: Forgot Password
───────────────────────────────────────────────────────── */
function ForgotScreen({
  onBack,
  onSent,
}: {
  onBack: () => void
  onSent: () => void
}) {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<FieldError>({})

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault()
    if (!email.trim()) {
      setErrors({ email: "Enter your email address." })
      return
    }
    setLoading(true)
    await new Promise((r) => setTimeout(r, 1200))
    setLoading(false)
    onSent()
  }

  return (
    <AuthCard>
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 11,
            marginBottom: 18,
            background: "linear-gradient(135deg, #FEF3C7, #FDE68A)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid #FCD34D",
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#B45309"
            strokeWidth="1.75"
            strokeLinecap="round"
          >
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M2 7l10 7 10-7" />
          </svg>
        </div>
        <AuthHeading
          title="Reset your password"
          subtitle="Enter your email address and we'll help you reset your password."
        />
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        style={{ display: "flex", flexDirection: "column", gap: 14 }}
      >
        <div>
          <FieldLabel>Email address</FieldLabel>
          <Input
            id="forgot-email"
            type="email"
            value={email}
            onChange={(v) => {
              setEmail(v)
              setErrors({})
            }}
            placeholder="you@flavorcoffee.et"
            autoComplete="email"
            autoFocus
            disabled={loading}
            hasError={!!errors.email}
          />
          <FieldError msg={errors.email} />
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            marginTop: 4,
          }}
        >
          <PrimaryButton loading={loading}>
            {loading ? "Sending…" : "Continue"}
          </PrimaryButton>
          <button
            type="button"
            onClick={onBack}
            style={{
              background: "none",
              border: "1.5px solid var(--border-neutral)",
              borderRadius: 9,
              height: 44,
              fontSize: 13.5,
              fontFamily: "Inter",
              color: "var(--text-secondary)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget
              el.style.borderColor = "#2B4D3A"
              el.style.color = "#2B4D3A"
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget
              el.style.borderColor = "var(--border-neutral)"
              el.style.color = "var(--text-secondary)"
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
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Back to Sign In
          </button>
        </div>
      </form>
    </AuthCard>
  )
}

/* ─────────────────────────────────────────────────────────
   Screen: Reset Sent
───────────────────────────────────────────────────────── */
function ResetSentScreen({ onBack }: { onBack: () => void }) {
  return (
    <AuthCard>
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 13,
          marginBottom: 20,
          background: "linear-gradient(135deg, #DCFCE7, #BBF7D0)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid #86EFAC",
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#16A34A"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <AuthHeading
        title="Check your email"
        subtitle="If an account exists for this email, you'll receive instructions to reset your password."
      />
      <div
        style={{
          marginTop: 8,
          padding: "10px 12px",
          borderRadius: 8,
          background: "var(--surface-02)",
          border: "1px solid var(--border-neutral)",
          fontSize: 12.5,
          color: "var(--text-muted)",
          fontFamily: "Inter",
          lineHeight: 1.5,
        }}
      >
        Didn't get an email? Check your spam folder, or verify the address you
        entered is correct.
      </div>
      <div style={{ marginTop: 20 }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            width: "100%",
            height: 44,
            borderRadius: 9,
            border: "1.5px solid var(--border-neutral)",
            background: "none",
            fontSize: 14,
            fontWeight: 600,
            fontFamily: "Inter",
            color: "var(--text-primary)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget
            el.style.borderColor = "#2B4D3A"
            el.style.background = "rgba(43,77,58,0.04)"
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget
            el.style.borderColor = "var(--border-neutral)"
            el.style.background = "none"
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
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Back to Sign In
        </button>
      </div>
    </AuthCard>
  )
}

/* ─────────────────────────────────────────────────────────
   Screen: New Password
───────────────────────────────────────────────────────── */
function NewPasswordScreen({ onSuccess }: { onSuccess: () => void }) {
  const [newPw, setNewPw] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showNew, setShowNew] = useState(false)
  const [showConf, setShowConf] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<FieldError>({})

  const strength = (pw: string): {
    score: number
    label: string
    color: string
  } => {
    if (pw.length === 0) return { score: 0, label: "", color: "#E5E3DC" }
    if (pw.length < 6) return { score: 1, label: "Too short", color: "#EF4444" }
    if (pw.length < 10) return { score: 2, label: "Weak", color: "#F59E0B" }
    if (pw.length < 14) return { score: 3, label: "Good", color: "#22C55E" }
    return { score: 4, label: "Strong", color: "#16A34A" }
  }
  const str = strength(newPw)

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault()
    const e: FieldError = {}
    if (!newPw) e.newPw = "Enter your new password."
    else if (newPw.length < 8)
      e.newPw = "Password must be at least 8 characters."
    if (!confirm) e.confirmPw = "Confirm your new password."
    else if (newPw && confirm !== newPw) e.confirmPw = "Passwords do not match."
    setErrors(e)
    if (Object.keys(e).length) return
    setLoading(true)
    await new Promise((r) => setTimeout(r, 1200))
    setLoading(false)
    onSuccess()
  }

  return (
    <AuthCard>
      <AuthHeading
        title="Create new password"
        subtitle="Choose a strong password for your account."
      />
      <form
        onSubmit={handleSubmit}
        noValidate
        style={{ display: "flex", flexDirection: "column", gap: 14 }}
      >
        <div>
          <FieldLabel>New password</FieldLabel>
          <Input
            id="new-pw"
            type={showNew ? "text" : "password"}
            value={newPw}
            onChange={(v) => {
              setNewPw(v)
              setErrors((e) => ({ ...e, newPw: undefined }))
            }}
            placeholder="Choose a password"
            autoComplete="new-password"
            autoFocus
            disabled={loading}
            hasError={!!errors.newPw}
            right={
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                aria-label={showNew ? "Hide" : "Show"}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  display: "flex",
                  padding: 4,
                }}
              >
                {showNew ? <EyeOff /> : <EyeOpen />}
              </button>
            }
          />
          {/* Strength bar */}
          {newPw.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ display: "flex", gap: 3, marginBottom: 4 }}>
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: 3,
                      borderRadius: 2,
                      background:
                        i <= str.score ? str.color : "var(--border-neutral)",
                      transition: "background 0.2s",
                    }}
                  />
                ))}
              </div>
              {str.label && (
                <div
                  style={{
                    fontSize: 11.5,
                    color: str.color,
                    fontFamily: "DM Mono",
                  }}
                >
                  {str.label}
                </div>
              )}
            </div>
          )}
          <FieldError msg={errors.newPw} />
        </div>

        <div>
          <FieldLabel>Confirm password</FieldLabel>
          <Input
            id="confirm-pw"
            type={showConf ? "text" : "password"}
            value={confirm}
            onChange={(v) => {
              setConfirm(v)
              setErrors((e) => ({ ...e, confirmPw: undefined }))
            }}
            placeholder="Re-enter your password"
            autoComplete="new-password"
            disabled={loading}
            hasError={!!errors.confirmPw}
            right={
              <button
                type="button"
                onClick={() => setShowConf((v) => !v)}
                aria-label={showConf ? "Hide" : "Show"}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  display: "flex",
                  padding: 4,
                }}
              >
                {showConf ? <EyeOff /> : <EyeOpen />}
              </button>
            }
          />
          <FieldError msg={errors.confirmPw} />
        </div>

        {/* Requirements */}
        <div
          style={{
            padding: "10px 12px",
            background: "var(--surface-02)",
            borderRadius: 8,
            border: "1px solid var(--border-neutral)",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontFamily: "DM Mono",
              color: "var(--text-muted)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            Requirements
          </div>
          {[
            { label: "At least 8 characters", ok: newPw.length >= 8 },
            { label: "Contains a letter", ok: /[a-zA-Z]/.test(newPw) },
            { label: "Contains a number", ok: /[0-9]/.test(newPw) },
          ].map((r) => (
            <div
              key={r.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                marginBottom: 4,
              }}
            >
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: r.ok ? "#DCFCE7" : "var(--surface-hover)",
                  border: `1.5px solid ${
                    r.ok ? "#86EFAC" : "var(--border-neutral)"
                  }`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "all 0.2s",
                }}
              >
                {r.ok && (
                  <svg
                    width="8"
                    height="8"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#16A34A"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <span
                style={{
                  fontSize: 12,
                  color: r.ok ? "#15803D" : "var(--text-muted)",
                  fontFamily: "Inter",
                  transition: "color 0.2s",
                }}
              >
                {r.label}
              </span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 4 }}>
          <PrimaryButton loading={loading}>
            {loading ? "Updating…" : "Reset Password"}
          </PrimaryButton>
        </div>
      </form>
    </AuthCard>
  )
}

/* ─────────────────────────────────────────────────────────
   Screen: Reset Success
───────────────────────────────────────────────────────── */
function ResetSuccessScreen({ onSignIn }: { onSignIn: () => void }) {
  return (
    <AuthCard>
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 13,
          marginBottom: 20,
          background: "linear-gradient(135deg, #DCFCE7, #BBF7D0)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid #86EFAC",
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#16A34A"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <polyline points="9 12 11 14 15 10" />
        </svg>
      </div>
      <AuthHeading
        title="Password updated"
        subtitle="Your password has been successfully updated. You can now sign in with your new credentials."
      />
      <div style={{ marginTop: 4 }}>
        <PrimaryButton type="button" onClick={onSignIn}>
          Sign In
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </PrimaryButton>
      </div>
    </AuthCard>
  )
}

/* ─────────────────────────────────────────────────────────
   Screen: Session Expired
───────────────────────────────────────────────────────── */
function SessionExpiredScreen({ onSignIn }: { onSignIn: () => void }) {
  return (
    <AuthCard>
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 13,
          marginBottom: 20,
          background: "linear-gradient(135deg, #FEF3C7, #FDE68A)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid #FCD34D",
        }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#B45309"
          strokeWidth="1.75"
          strokeLinecap="round"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      </div>
      <AuthHeading
        title="Session expired"
        subtitle="Your session has expired. Please sign in again to continue."
      />
      <div style={{ marginBottom: 20 }}>
        <AlertBanner
          title=""
          message="For security, sessions automatically expire after a period of inactivity."
          variant="warning"
        />
      </div>
      <PrimaryButton type="button" onClick={onSignIn}>
        Sign In
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </PrimaryButton>
    </AuthCard>
  )
}

/* ─────────────────────────────────────────────────────────
   Screen: Access Denied
───────────────────────────────────────────────────────── */
function AccessDeniedScreen({ onBack }: { onBack: () => void }) {
  return (
    <AuthCard>
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 13,
          marginBottom: 20,
          background: "linear-gradient(135deg, #FEE2E2, #FECACA)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid #FCA5A5",
        }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#DC2626"
          strokeWidth="1.75"
          strokeLinecap="round"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
      </div>
      <AuthHeading
        title="Access Restricted"
        subtitle="You don't have permission to access this page. Contact your manager if you believe this is an error."
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          marginTop: 4,
        }}
      >
        <PrimaryButton type="button" onClick={onBack}>
          Return to Dashboard
        </PrimaryButton>
        <div style={{ textAlign: "center" }}>
          <GhostButton onClick={onBack}>
            Sign in with a different account
          </GhostButton>
        </div>
      </div>
    </AuthCard>
  )
}

/* ─────────────────────────────────────────────────────────
   Screen: Account Unavailable
───────────────────────────────────────────────────────── */
function AccountUnavailableScreen({ onBack }: { onBack: () => void }) {
  return (
    <AuthCard>
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 13,
          marginBottom: 20,
          background: "linear-gradient(135deg, #F3F4F6, #E5E7EB)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid #D1D5DB",
        }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#6B7280"
          strokeWidth="1.75"
          strokeLinecap="round"
        >
          <circle cx="12" cy="8" r="4" />
          <path d="M6 20v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
          <line x1="2" y1="2" x2="22" y2="22" stroke="#EF4444" />
        </svg>
      </div>
      <AuthHeading
        title="Account unavailable"
        subtitle="Your account is currently unavailable. Please contact your manager."
      />
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            padding: "12px 14px",
            background: "var(--surface-02)",
            border: "1px solid var(--border-neutral)",
            borderRadius: 8,
            fontSize: 13,
            color: "var(--text-secondary)",
            fontFamily: "Inter",
            lineHeight: 1.5,
          }}
        >
          If you believe this is a mistake, reach out to your General Manager or
          IT administrator to have your account reviewed.
        </div>
      </div>
      <button
        type="button"
        onClick={onBack}
        style={{
          width: "100%",
          height: 44,
          borderRadius: 9,
          border: "1.5px solid var(--border-neutral)",
          background: "none",
          fontSize: 14,
          fontWeight: 600,
          fontFamily: "Inter",
          color: "var(--text-primary)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          transition: "all 0.15s ease",
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget
          el.style.borderColor = "#2B4D3A"
          el.style.background = "rgba(43,77,58,0.04)"
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget
          el.style.borderColor = "var(--border-neutral)"
          el.style.background = "none"
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
          <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
        Back to Sign In
      </button>
    </AuthCard>
  )
}

/* ─────────────────────────────────────────────────────────
   Screen: Auth Error (general server failure)
───────────────────────────────────────────────────────── */
function AuthErrorScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <AuthCard>
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 13,
          marginBottom: 20,
          background: "linear-gradient(135deg, #FEF2F2, #FEE2E2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid #FCA5A5",
        }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#DC2626"
          strokeWidth="1.75"
          strokeLinecap="round"
        >
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </div>
      <AuthHeading
        title="Something went wrong"
        subtitle="We couldn't complete your request. This may be a temporary issue — please try again."
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          marginTop: 4,
        }}
      >
        <PrimaryButton type="button" onClick={onRetry}>
          Try Again
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
          </svg>
        </PrimaryButton>
        <div
          style={{
            textAlign: "center",
            fontSize: 12,
            color: "var(--text-muted)",
            fontFamily: "Inter",
          }}
        >
          If this persists, contact your system administrator.
        </div>
      </div>
    </AuthCard>
  )
}

/* ─────────────────────────────────────────────────────────
   Mobile brand header (shown above form on mobile)
───────────────────────────────────────────────────────── */
const MobileBrandHeader = () => (
  <div
    style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}
  >
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: 10,
        flexShrink: 0,
        background: "linear-gradient(135deg, #2B4D3A 0%, #3D6B54 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 4px 12px rgba(43,77,58,0.25)",
      }}
    >
      <BrandMark size={20} />
    </div>
    <div>
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: "var(--text-primary)",
          letterSpacing: "-0.01em",
        }}
      >
        Flavor Coffee Roasters
      </div>
      <div
        style={{
          fontSize: 10,
          fontFamily: "DM Mono",
          color: "var(--text-muted)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginTop: 1,
        }}
      >
        Enterprise Platform
      </div>
    </div>
  </div>
)

/* ─────────────────────────────────────────────────────────
   Root Login component — screen router
───────────────────────────────────────────────────────── */
export default function Login() {
  const [screen, setScreen] = useState<Screen>("login")
  const [visible, setVisible] = useState(false)
  const [showSplash, setShowSplash] = useState(true)
  const [splashText, setSplashText] = useState("Initializing Enterprise Security Layer…")
  const { isMobile, isTablet } = useBreakpoint()
  const isNarrow = isMobile || isTablet

  useEffect(() => {
    const t1 = setTimeout(() => setSplashText("Syncing Real-Time Supabase Engine…"), 1000)
    const t2 = setTimeout(() => setSplashText("Loading Design Flavor Coffee ERP…"), 2000)
    const t3 = setTimeout(() => {
      setShowSplash(false)
      setVisible(true)
    }, 3000)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [])

  if (showSplash) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          background: "linear-gradient(135deg, #0D1F15 0%, #1A2E22 50%, #0B140E 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "#FFFFFF",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <style>{`
          @keyframes pulseGlow {
            0%, 100% { transform: scale(1); opacity: 0.85; filter: drop-shadow(0 0 15px rgba(74,222,128,0.4)); }
            50% { transform: scale(1.08); opacity: 1; filter: drop-shadow(0 0 35px rgba(74,222,128,0.8)); }
          }
          @keyframes progressFill {
            0% { width: 0%; }
            100% { width: 100%; }
          }
        `}</style>
        
        {/* Animated Brand Emblem */}
        <div style={{ animation: "pulseGlow 2s infinite ease-in-out", marginBottom: 24 }}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 24,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
            }}
          >
            <BrandMark size={48} />
          </div>
        </div>

        <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 26, fontWeight: 700, margin: "0 0 8px", letterSpacing: "-0.02em" }}>
          Design Flavor Coffee ERP
        </h2>
        <div style={{ fontSize: 13, color: "#A7F3D0", fontFamily: "DM Mono, monospace", marginBottom: 28, height: 20 }}>
          {splashText}
        </div>

        {/* 3-Second Loading Bar */}
        <div style={{ width: 280, height: 4, background: "rgba(255,255,255,0.12)", borderRadius: 999, overflow: "hidden", position: "relative" }}>
          <div
            style={{
              height: "100%",
              background: "linear-gradient(90deg, #34D399, #10B981, #F59E0B)",
              borderRadius: 999,
              animation: "progressFill 3s linear forwards",
            }}
          />
        </div>

        <button
          onClick={() => {
            setShowSplash(false)
            setVisible(true)
          }}
          style={{
            marginTop: 32,
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "rgba(255,255,255,0.7)",
            fontSize: 12,
            padding: "6px 16px",
            borderRadius: 20,
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => { (e.currentTarget.style.color = "#FFFFFF"); (e.currentTarget.style.borderColor = "#FFFFFF"); }}
          onMouseLeave={(e) => { (e.currentTarget.style.color = "rgba(255,255,255,0.7)"); (e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"); }}
        >
          Skip Intro →
        </button>
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
        fontFamily: "Inter, system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <style>{`
        @keyframes authSpin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        @keyframes authFadeUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
        @keyframes authShakeKf {
          0%,100% { transform: translateX(0) }
          20%,60%  { transform: translateX(-6px) }
          40%,80%  { transform: translateX(6px) }
        }
        .auth-card { animation: authFadeUp 0.4s cubic-bezier(0.16,1,0.3,1) both; }
        .auth-shake { animation: authShakeKf 0.35s ease !important; }
        .auth-input:focus { outline: none; border-color: var(--brand-primary) !important; box-shadow: 0 0 0 3px rgba(43,77,58,0.12); }
        [data-theme="dark"] .auth-input:focus { border-color: #34D399 !important; box-shadow: 0 0 0 3px rgba(52,211,153,0.1); }
        .demo-pill:hover { background: var(--surface-hover) !important; }
        [data-no-transition] * { transition: none !important; }
      `}</style>

      {/* Top accent bar */}
      <div
        style={{
          height: 3,
          background:
            "linear-gradient(90deg, #2B4D3A 0%, #4A7C5A 50%, #B8860B 100%)",
          flexShrink: 0,
          opacity: visible ? 1 : 0,
          transition: "opacity 0.4s ease",
        }}
      />

      {isNarrow ? (
        /* ── MOBILE / TABLET ── */
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: isMobile ? "24px 16px 32px" : "40px 48px",
            opacity: visible ? 1 : 0,
            transition: "opacity 0.4s ease 0.06s",
          }}
        >
          <div style={{ width: "100%", maxWidth: 440 }}>
            <MobileBrandHeader />
            {screen === "login" && (
              <LoginScreen
                onForgot={() => setScreen("forgot")}
                onSessionExpired={() => setScreen("session-expired")}
                onAccessDenied={() => setScreen("access-denied")}
                onAccountUnavailable={() => setScreen("account-unavailable")}
                onAuthError={() => setScreen("auth-error")}
              />
            )}
            {screen === "forgot" && (
              <ForgotScreen
                onBack={() => setScreen("login")}
                onSent={() => setScreen("reset-sent")}
              />
            )}
            {screen === "reset-sent" && (
              <ResetSentScreen onBack={() => setScreen("login")} />
            )}
            {screen === "new-password" && (
              <NewPasswordScreen onSuccess={() => setScreen("reset-success")} />
            )}
            {screen === "reset-success" && (
              <ResetSuccessScreen onSignIn={() => setScreen("login")} />
            )}
            {screen === "session-expired" && (
              <SessionExpiredScreen onSignIn={() => setScreen("login")} />
            )}
            {screen === "access-denied" && (
              <AccessDeniedScreen onBack={() => setScreen("login")} />
            )}
            {screen === "account-unavailable" && (
              <AccountUnavailableScreen onBack={() => setScreen("login")} />
            )}
            {screen === "auth-error" && (
              <AuthErrorScreen onRetry={() => setScreen("login")} />
            )}
            <div
              style={{
                textAlign: "center",
                marginTop: 24,
                fontSize: 11.5,
                color: "var(--text-muted)",
                fontFamily: "DM Mono",
                letterSpacing: "0.04em",
              }}
            >
              FCR-ERP v2.6 · © 2026 Flavor Coffee Roasters PLC
            </div>
          </div>
        </div>
      ) : (
        /* ── DESKTOP ── */
        <div
          style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: "440px 1fr",
            minHeight: "calc(100vh - 3px)",
          }}
        >
          {/* Left brand panel */}
          <div
            style={{
              opacity: visible ? 1 : 0,
              transition: "opacity 0.5s ease 0.08s",
            }}
          >
            <BrandPanel />
          </div>

          {/* Right form panel */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "48px 64px",
              overflowY: "auto",
              opacity: visible ? 1 : 0,
              transition: "opacity 0.4s ease 0.1s",
            }}
          >
            <div style={{ width: "100%", maxWidth: 420 }}>
              {screen === "login" && (
                <LoginScreen
                  onForgot={() => setScreen("forgot")}
                  onSessionExpired={() => setScreen("session-expired")}
                  onAccessDenied={() => setScreen("access-denied")}
                  onAccountUnavailable={() => setScreen("account-unavailable")}
                  onAuthError={() => setScreen("auth-error")}
                />
              )}
              {screen === "forgot" && (
                <ForgotScreen
                  onBack={() => setScreen("login")}
                  onSent={() => setScreen("reset-sent")}
                />
              )}
              {screen === "reset-sent" && (
                <ResetSentScreen onBack={() => setScreen("login")} />
              )}
              {screen === "new-password" && (
                <NewPasswordScreen
                  onSuccess={() => setScreen("reset-success")}
                />
              )}
              {screen === "reset-success" && (
                <ResetSuccessScreen onSignIn={() => setScreen("login")} />
              )}
              {screen === "session-expired" && (
                <SessionExpiredScreen onSignIn={() => setScreen("login")} />
              )}
              {screen === "access-denied" && (
                <AccessDeniedScreen onBack={() => setScreen("login")} />
              )}
              {screen === "account-unavailable" && (
                <AccountUnavailableScreen onBack={() => setScreen("login")} />
              )}
              {screen === "auth-error" && (
                <AuthErrorScreen onRetry={() => setScreen("login")} />
              )}

              <div
                style={{
                  marginTop: 28,
                  textAlign: "center",
                  fontSize: 11.5,
                  color: "var(--text-muted)",
                  fontFamily: "DM Mono",
                  letterSpacing: "0.04em",
                }}
              >
                FCR-ERP v2.6 · © 2026 Flavor Coffee Roasters PLC
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
