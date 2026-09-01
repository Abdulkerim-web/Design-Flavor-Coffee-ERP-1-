/* Responsive: mobile ≤640 | tablet 641–1024 | laptop 1025–1440 | desktop >1440 */
import { useState, useRef, useEffect } from "react"
import { useBreakpoint } from "../hooks/useBreakpoint"

/* ── Palette ──────────────────────────────────────────── */
const C = {
  espresso: "#1C1108",
  espresso2: "#2A1A0E",
  cream: "#F7F0E6",
  creamBorder: "#E8DDD0",
  creamDark: "#EDE3D6",
  brand: "#2B4D3A",
  brandHover: "#1F382A",
  gold: "#C4922A",
  goldLight: "#F5E7C8",
  textDark: "#2A1A0E",
  textMid: "#5A4630",
  textMuted: "#9A856E",
  white: "#FFFFFF",
  success: "#16A34A",
  telegram: "#0088CC",
}

/* ── Data ─────────────────────────────────────────────── */
type OriginId = "guji" | "yirgacheffe" | "harrar" | "limu" | "bench-maji"
type RoastId = "medium" | "medium-dark" | "dark"
type BagId = "250g" | "500g" | "1000g"

interface Origin {
  id: OriginId
  name: string
  region: string
  altitude: string
  grade: string
  cupScore: number
  process: string
  flavor: string[]
  accent: string
  prices: Record<BagId, number>
  roastPremium: Record<RoastId, number>
  img: string
  heroDesc: string
}

const ORIGINS: Origin[] = [
  {
    id: "guji",
    name: "Guji Grade 1",
    region: "Guji Zone, Oromia",
    altitude: "1,800–2,200 m",
    grade: "Grade 1 Specialty",
    cupScore: 88.5,
    process: "Natural & Washed",
    flavor: ["Dark Chocolate", "Blueberry", "Cedar"],
    accent: "#6B3E26",
    prices: { "250g": 185, "500g": 355, "1000g": 640 },
    roastPremium: { medium: 0, "medium-dark": 0.04, dark: 0.08 },
    img: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=600&h=380&fit=crop&auto=format",
    heroDesc:
      "Deep forest aromatics with a chocolate-blueberry finish and cedar-wood undertone.",
  },
  {
    id: "yirgacheffe",
    name: "Yirgacheffe G1",
    region: "Gedeo Zone, SNNP",
    altitude: "1,700–2,100 m",
    grade: "Grade 1 Specialty",
    cupScore: 90.2,
    process: "Fully Washed",
    flavor: ["Jasmine", "White Peach", "Bright Acidity"],
    accent: "#2B4D3A",
    prices: { "250g": 210, "500g": 400, "1000g": 720 },
    roastPremium: { medium: 0, "medium-dark": 0.04, dark: 0.08 },
    img: "https://images.unsplash.com/photo-1541469406036-71229832e06e?w=600&h=380&fit=crop&auto=format",
    heroDesc:
      "Ethiopia's crown jewel. Floral jasmine top notes, stone fruit mid-palate, radiant brightness.",
  },
  {
    id: "harrar",
    name: "Harrar Grade 2",
    region: "Harari Region",
    altitude: "1,400–2,000 m",
    grade: "Grade 2 Premium",
    cupScore: 86.0,
    process: "Natural (Dry)",
    flavor: ["Wild Berry", "Red Wine", "Earthy Spice"],
    accent: "#8B2500",
    prices: { "250g": 160, "500g": 305, "1000g": 550 },
    roastPremium: { medium: 0, "medium-dark": 0.04, dark: 0.08 },
    img: "https://images.unsplash.com/photo-1606486544554-164d98da4889?w=600&h=380&fit=crop&auto=format",
    heroDesc:
      "Ancient heirloom cultivars. Bold wild-fermented character with wine-like complexity.",
  },
  {
    id: "limu",
    name: "Limu Espresso",
    region: "Jimma Zone, Oromia",
    altitude: "1,400–1,800 m",
    grade: "Grade 2 Premium",
    cupScore: 85.5,
    process: "Fully Washed",
    flavor: ["Caramel", "Citrus Peel", "Smooth Body"],
    accent: "#0A3D2E",
    prices: { "250g": 155, "500g": 295, "1000g": 530 },
    roastPremium: { medium: 0, "medium-dark": 0.04, dark: 0.08 },
    img: "https://images.unsplash.com/photo-1559556064-4161b6be179b?w=600&h=380&fit=crop&auto=format",
    heroDesc:
      "Ideal for espresso blends. Smooth caramel sweetness with lingering citrus brightness.",
  },
  {
    id: "bench-maji",
    name: "Bench Maji Wild",
    region: "Bench Maji Zone, SNNP",
    altitude: "1,600–2,000 m",
    grade: "Grade 2 Premium",
    cupScore: 87.0,
    process: "Natural Forest",
    flavor: ["Tropical Mango", "Honey", "Wild Forest"],
    accent: "#4A6B2A",
    prices: { "250g": 170, "500g": 325, "1000g": 585 },
    roastPremium: { medium: 0, "medium-dark": 0.04, dark: 0.08 },
    img: "https://images.unsplash.com/photo-1544015759-237f87d55ef3?w=600&h=380&fit=crop&auto=format",
    heroDesc:
      "Wild forest-grown at elevation. Tropical mango sweetness kissed with raw honey.",
  },
]

const ROASTS = [
  {
    id: "medium" as RoastId,
    label: "Medium",
    emoji: "",
    sub: "Bright & nuanced",
    temp: "196°C",
  },
  {
    id: "medium-dark" as RoastId,
    label: "Medium-Dark",
    emoji: "🌗",
    sub: "Balanced & round",
    temp: "210°C",
  },
  {
    id: "dark" as RoastId,
    label: "Dark",
    emoji: "🌑",
    sub: "Bold & intense",
    temp: "224°C",
  },
]

const BAGS = [
  { id: "250g" as BagId, label: "250 g", sub: "Trial / Retail", kg: 0.25 },
  { id: "500g" as BagId, label: "500 g", sub: "Small Café", kg: 0.5 },
  { id: "1000g" as BagId, label: "1 KG", sub: "Wholesale Standard", kg: 1 },
]

const TIERS = [
  { min: 1, max: 49, label: "Standard", badge: "", discount: 0 },
  { min: 50, max: 99, label: "Bronze", badge: "🥉", discount: 0.05 },
  { min: 100, max: 249, label: "Silver", badge: "🥈", discount: 0.1 },
  { min: 250, max: Infinity, label: "Gold", badge: "🥇", discount: 0.15 },
]

/* ── Helpers ──────────────────────────────────────────── */
function fmt(n: number) {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/* ── Sub-components ───────────────────────────────────── */
function FlavorTag({ label, accent }: { label: string accent: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.03em",
        padding: "3px 9px",
        borderRadius: 999,
        border: `1px solid ${accent}40`,
        background: `${accent}12`,
        color: accent,
        fontFamily: "Inter, sans-serif",
        whiteSpace: "nowrap" as const,
      }}
    >
      {label}
    </span>
  )
}

function CupScoreBadge({ score }: { score: number }) {
  const color = score >= 90 ? "#2B4D3A" : score >= 87 ? "#C4922A" : "#6B7280"
  const bg = score >= 90 ? "#F0FDF4" : score >= 87 ? "#FFF8E8" : "#F3F4F6"
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "7px 12px",
        borderRadius: 8,
        background: bg,
        border: `1.5px solid ${color}30`,
      }}
    >
      <span
        style={{
          fontSize: 20,
          fontWeight: 800,
          fontFamily: "DM Mono, monospace",
          color,
          lineHeight: 1,
        }}
      >
        {score}
      </span>
      <span
        style={{
          fontSize: 9.5,
          fontWeight: 600,
          color,
          letterSpacing: "0.06em",
          textTransform: "uppercase" as const,
          marginTop: 2,
        }}
      >
        Cup Score
      </span>
    </div>
  )
}

/* ── Main component ───────────────────────────────────── */
export default function CustomerPortal() {
  const { isMobile, isTablet, isLaptop, isDesktop, isNarrow } = useBreakpoint()
  const [selectedId, setSelectedId] = useState<OriginId | null>(null)
  const [roast, setRoast] = useState<RoastId>("medium")
  const [bagSize, setBagSize] = useState<BagId>("1000g")
  const [qty, setQty] = useState<number>(100)
  const [step, setStep] = useState<"browse" | "checkout">("browse")
  const [bizName, setBizName] = useState("")
  const [contactPhone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [tgHandle, setTgHandle] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [hovered, setHovered] = useState<OriginId | null>(null)
  const configRef = useRef<HTMLDivElement>(null)
  const checkoutRef = useRef<HTMLDivElement>(null)

  const selected = ORIGINS.find((o) => o.id === selectedId) ?? null

  /* pricing */
  const unitBase = selected ? selected.prices[bagSize] : 640
  const roastMult = selected ? 1 + selected.roastPremium[roast] : 1
  const unitFinal = Math.round(unitBase * roastMult)
  const tier = TIERS.find((t) => qty >= t.min && qty <= t.max) ?? TIERS[0]
  const subtotal = unitFinal * qty
  const discAmt = Math.round(subtotal * tier.discount)
  const total = subtotal - discAmt
  const weightKg = BAGS.find((b) => b.id === bagSize)!.kg * qty

  const canSubmit = bizName.trim() && contactPhone.trim() && address.trim()

  function selectOrigin(id: OriginId) {
    setSelectedId(id)
    setStep("browse")
    setTimeout(
      () =>
        configRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        }),
      100,
    )
  }

  useEffect(() => {
    if (step === "checkout") {
      setTimeout(
        () =>
          checkoutRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          }),
        100,
      )
    }
  }, [step])

  /* ── Submitted screen */
  if (submitted) {
    return (
      <div
        style={{
          minHeight: "100%",
          background: C.espresso,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 24px",
        }}
      >
        <div style={{ maxWidth: 520, textAlign: "center" as const }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: C.success,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
              boxShadow: `0 0 0 16px ${C.success}20`,
            }}
          >
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2
            style={{
              fontFamily: "Fraunces, serif",
              fontSize: isMobile ? 32 : 42,
              fontWeight: 700,
              color: C.cream,
              margin: "0 0 16px",
              lineHeight: 1.1,
            }}
          >
            Order Request Received
          </h2>
          <p
            style={{
              fontSize: 15,
              color: "rgba(247,240,230,0.65)",
              marginBottom: 32,
              lineHeight: 1.6,
            }}
          >
            Your wholesale request for{" "}
            <strong style={{ color: C.cream }}>{selected?.name}</strong> has
            been submitted. Our team will contact{" "}
            <strong style={{ color: C.cream }}>{bizName}</strong> within 24
            hours to confirm quantities and arrange delivery.
          </p>
          <div
            style={{
              background: "rgba(0,136,204,0.12)",
              border: "1px solid rgba(0,136,204,0.3)",
              borderRadius: 12,
              padding: "16px 20px",
              marginBottom: 28,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill={C.telegram}>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8l-1.68 7.92c-.12.56-.46.7-.94.44l-2.6-1.92-1.25 1.2c-.14.14-.26.26-.52.26l.18-2.62 4.72-4.26c.2-.18-.04-.28-.32-.1l-5.84 3.68-2.52-.78c-.54-.18-.56-.54.12-.8l9.84-3.8c.46-.16.86.12.71.78z" />
            </svg>
            <div style={{ textAlign: "left" as const }}>
              <div
                style={{ fontSize: 12.5, fontWeight: 700, color: C.telegram }}
              >
                Telegram Notification Queued
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "rgba(247,240,230,0.55)",
                  marginTop: 2,
                }}
              >
                Order confirmation will be sent to your Telegram account{" "}
                {tgHandle ? `@${tgHandle}` : "on record"}.
              </div>
            </div>
          </div>
          <div
            style={{
              fontFamily: "DM Mono, monospace",
              fontSize: 12,
              color: C.gold,
              background: "rgba(196,146,42,0.08)",
              border: "1px solid rgba(196,146,42,0.2)",
              borderRadius: 8,
              padding: "10px 16px",
              marginBottom: 32,
            }}
          >
            ORDER REF · FCR-PRT-{String(Date.now()).slice(-6)} ·{" "}
            {new Date()
              .toLocaleDateString("en-ET", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
              .toUpperCase()}
          </div>
          <button
            onClick={() => {
              setSubmitted(false)
              setSelectedId(null)
              setStep("browse")
              setBizName("")
              setPhone("")
              setAddress("")
              setTgHandle("")
            }}
            style={{
              background: C.brand,
              color: C.white,
              border: "none",
              borderRadius: 8,
              padding: "12px 28px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = C.brandHover)
            }
            onMouseLeave={(e) => (e.currentTarget.style.background = C.brand)}
          >
            Place Another Order
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        fontFamily: "Inter, sans-serif",
        background: C.cream,
        minHeight: "100%",
      }}
    >
      {/* ── Portal Navigation Bar ───────────────────────── */}
      <header
        style={{
          background: C.espresso,
          borderBottom: `1px solid rgba(247,240,230,0.08)`,
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: isMobile ? "0 16px" : "0 40px",
            height: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: C.brand,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
              >
                <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 3z" />
              </svg>
            </div>
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: C.cream,
                  letterSpacing: "0.02em",
                  lineHeight: 1.2,
                }}
              >
                Flavor Coffee Roasters
              </div>
              {!isMobile && (
                <div
                  style={{
                    fontSize: 10,
                    fontFamily: "DM Mono, monospace",
                    color: "rgba(247,240,230,0.4)",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase" as const,
                  }}
                >
                  Wholesale Portal · Ethiopia
                </div>
              )}
            </div>
          </div>
          {/* Right */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: isMobile ? 10 : 20,
            }}
          >
            {!isMobile && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  color: "rgba(247,240,230,0.45)",
                  fontFamily: "DM Mono, monospace",
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: C.success,
                    boxShadow: `0 0 0 3px ${C.success}25`,
                  }}
                />
                ERP Connected · Live
              </div>
            )}
            <a
              href="#"
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: "rgba(247,240,230,0.55)",
                textDecoration: "none",
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = C.cream)}
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "rgba(247,240,230,0.55)")
              }
            >
              Staff Login →
            </a>
          </div>
        </div>
      </header>

      {/* ── Hero Section ───────────────────────────────── */}
      <section
        style={{
          position: "relative",
          overflow: "hidden",
          background: C.espresso2,
          minHeight: isMobile ? 380 : 480,
        }}
      >
        {/* Background image */}
        <div style={{ position: "absolute", inset: 0 }}>
          <img
            src="https://images.unsplash.com/photo-1633437805600-2c58bf56663c?w=1440&h=560&fit=crop&auto=format"
            alt="Ethiopian highland coffee landscape"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.22,
            }}
          />
          {/* Gradient overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(135deg, ${C.espresso} 0%, transparent 60%, ${C.espresso2}88 100%)`,
            }}
          />
        </div>
        {/* Content */}
        <div
          style={{
            position: "relative",
            maxWidth: 1200,
            margin: "0 auto",
            padding: isMobile ? "48px 20px 52px" : "64px 40px 72px",
          }}
        >
          <div
            style={{
              fontFamily: "DM Mono, monospace",
              fontSize: 11,
              fontWeight: 600,
              color: C.gold,
              letterSpacing: "0.12em",
              textTransform: "uppercase" as const,
              marginBottom: 18,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div style={{ width: 20, height: 1.5, background: C.gold }} />
            Wholesale Direct · Ethiopia
          </div>
          <h1
            style={{
              fontFamily: "Fraunces, serif",
              fontSize: isMobile ? 36 : isTablet ? 52 : 66,
              fontWeight: 700,
              color: C.cream,
              margin: "0 0 20px",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              maxWidth: 760,
            }}
          >
            Ethiopia's Finest
            <br />
            <em style={{ fontStyle: "italic", color: C.gold }}>Green Origin</em>{" "}
            Coffees
          </h1>
          <p
            style={{
              fontSize: isMobile ? 14 : 16,
              color: "rgba(247,240,230,0.68)",
              maxWidth: 520,
              lineHeight: 1.65,
              marginBottom: 32,
            }}
          >
            Direct-to-wholesale specialty coffee from Guji, Yirgacheffe, Harrar,
            Limu and Bench Maji — SCA-certified, Ministry of Agriculture
            registered. Configure your order and receive a live ETB quotation.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" as const }}>
            <button
              onClick={() =>
                configRef.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                })
              }
              style={{
                background: C.brand,
                color: C.white,
                border: "none",
                borderRadius: 8,
                padding: "13px 26px",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: 7,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = C.brandHover
                e.currentTarget.style.transform = "translateY(-1px)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = C.brand
                e.currentTarget.style.transform = "translateY(0)"
              }}
            >
              Browse Origins & Configure Order
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
              {[
                ["Grade 1 SCA Certified", "#2B4D3A"],
                ["MOA Licensed Exporter", "#C4922A"],
                ["Min. 50 KG Wholesale", "#6B7280"],
              ].map(([label, color]) => (
                <span
                  key={label}
                  style={{
                    fontSize: 11.5,
                    fontWeight: 600,
                    color,
                    background: `${color}18`,
                    border: `1px solid ${color}30`,
                    borderRadius: 999,
                    padding: "6px 12px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <div
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: color,
                      flexShrink: 0,
                    }}
                  />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust bar ─────────────────────────────────── */}
      <div
        style={{
          background: C.espresso,
          borderBottom: `1px solid rgba(247,240,230,0.06)`,
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "0 40px",
            display: "flex",
            alignItems: "center",
            gap: 0,
            minWidth: "max-content",
          }}
        >
          {[
            "TIN · 0023-401-882",
            "SCA Certified",
            "Exporter Lic. #EX-2019-4421",
            "MOA Reg. #AGR-1182",
            "5 Origins · Grade 1 & 2",
            "Min Order 50 KG",
            "Addis Ababa HQ",
          ].map((item, i) => (
            <div
              key={item}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 0,
                flexShrink: 0,
              }}
            >
              {i > 0 && (
                <div
                  style={{
                    width: 1,
                    height: 18,
                    background: "rgba(247,240,230,0.1)",
                    margin: "0 20px",
                  }}
                />
              )}
              <span
                style={{
                  fontFamily: "DM Mono, monospace",
                  fontSize: 10.5,
                  color: "rgba(247,240,230,0.35)",
                  letterSpacing: "0.08em",
                  whiteSpace: "nowrap" as const,
                  padding: "11px 0",
                }}
              >
                {item}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Origin Cards ──────────────────────────────── */}
      <section
        ref={configRef}
        style={{
          padding: isMobile
            ? "40px 16px"
            : isTablet
              ? "52px 24px"
              : "64px 40px",
          maxWidth: 1200,
          margin: "0 auto",
        }}
      >
        <div style={{ marginBottom: 40 }}>
          <div
            style={{
              fontFamily: "DM Mono, monospace",
              fontSize: 10.5,
              fontWeight: 600,
              color: C.gold,
              letterSpacing: "0.12em",
              textTransform: "uppercase" as const,
              marginBottom: 12,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div style={{ width: 16, height: 1.5, background: C.gold }} />
            Select Your Origin
          </div>
          <h2
            style={{
              fontFamily: "Fraunces, serif",
              fontSize: isMobile ? 26 : 36,
              fontWeight: 700,
              color: C.textDark,
              margin: "0 0 10px",
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
            }}
          >
            Five Distinct Ethiopian Terroirs
          </h2>
          <p
            style={{
              fontSize: 14,
              color: C.textMuted,
              maxWidth: 520,
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            Each origin carries its own elevation, microclimate, and processing
            tradition. Choose an origin to unlock roast profiles, packaging
            options, and live ETB pricing.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile
              ? "1fr"
              : isTablet
                ? "repeat(2, 1fr)"
                : "repeat(3, 1fr)",
            gap: 18,
            marginBottom: 18,
          }}
        >
          {ORIGINS.slice(0, 3).map((origin) => (
            <OriginCard
              key={origin.id}
              origin={origin}
              selected={selectedId === origin.id}
              hovered={hovered === origin.id}
              onSelect={() => selectOrigin(origin.id)}
              onHover={(id) => setHovered(id)}
            />
          ))}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
            gap: 18,
            maxWidth: isMobile ? "100%" : "calc(66.67% + 9px)",
          }}
        >
          {ORIGINS.slice(3).map((origin) => (
            <OriginCard
              key={origin.id}
              origin={origin}
              selected={selectedId === origin.id}
              hovered={hovered === origin.id}
              onSelect={() => selectOrigin(origin.id)}
              onHover={(id) => setHovered(id)}
            />
          ))}
        </div>
      </section>

      {/* ── Order Configurator ────────────────────────── */}
      <section
        style={{
          background: C.creamDark,
          borderTop: `1px solid ${C.creamBorder}`,
          borderBottom: `1px solid ${C.creamBorder}`,
          padding: isMobile
            ? "40px 16px"
            : isTablet
              ? "52px 24px"
              : "64px 40px",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ marginBottom: 36 }}>
            <div
              style={{
                fontFamily: "DM Mono, monospace",
                fontSize: 10.5,
                fontWeight: 600,
                color: C.gold,
                letterSpacing: "0.12em",
                textTransform: "uppercase" as const,
                marginBottom: 12,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <div style={{ width: 16, height: 1.5, background: C.gold }} />
              Configure Your Order
            </div>
            <h2
              style={{
                fontFamily: "Fraunces, serif",
                fontSize: isMobile ? 24 : 32,
                fontWeight: 700,
                color: C.textDark,
                margin: "0 0 8px",
                letterSpacing: "-0.02em",
              }}
            >
              Custom Wholesale Builder
            </h2>
            {!selected ? (
              <p style={{ fontSize: 13.5, color: C.textMuted }}>
                Select an origin above to unlock roast, packaging, and quantity
                options.
              </p>
            ) : (
              <p style={{ fontSize: 13.5, color: C.textMid }}>
                Configuring:{" "}
                <strong style={{ color: C.brand }}>{selected.name}</strong> ·
                Cup Score {selected.cupScore} · {selected.process}
              </p>
            )}
          </div>

          {/* No origin selected placeholder */}
          {!selected && (
            <div
              style={{
                border: `2px dashed ${C.creamBorder}`,
                borderRadius: 16,
                padding: "52px 24px",
                textAlign: "center" as const,
                background: C.cream,
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 16 }}></div>
              <div
                style={{
                  fontFamily: "Fraunces, serif",
                  fontSize: 20,
                  fontWeight: 600,
                  color: C.textMid,
                  marginBottom: 8,
                }}
              >
                Choose an Origin to Begin
              </div>
              <div style={{ fontSize: 13.5, color: C.textMuted }}>
                Scroll up and select one of the five Ethiopian origins to
                configure your wholesale order.
              </div>
            </div>
          )}

          {/* Configurator grid */}
          {selected && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 340px",
                gap: 24,
                alignItems: "start",
              }}
            >
              {/* ── Left: controls ─────────────────────── */}
              <div
                style={{ display: "flex", flexDirection: "column", gap: 24 }}
              >
                {/* Step 1: Roast Profile */}
                <ConfigSection
                  step="1"
                  title="Roast Profile"
                  sub="Select your roast intensity"
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
                      gap: 10,
                    }}
                  >
                    {ROASTS.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => setRoast(r.id)}
                        style={{
                          padding: "14px 14px",
                          borderRadius: 10,
                          border: `1.5px solid ${
                            roast === r.id ? C.brand : C.creamBorder
                          }`,
                          background: roast === r.id ? `${C.brand}08` : C.cream,
                          cursor: "pointer",
                          textAlign: "left" as const,
                          transition: "all 0.15s",
                          boxShadow:
                            roast === r.id ? `0 0 0 3px ${C.brand}15` : "none",
                        }}
                        onMouseEnter={(e) => {
                          if (roast !== r.id)
                            e.currentTarget.style.borderColor = C.textMuted
                        }}
                        onMouseLeave={(e) => {
                          if (roast !== r.id)
                            e.currentTarget.style.borderColor = C.creamBorder
                        }}
                      >
                        <div style={{ fontSize: 20, marginBottom: 7 }}>
                          {r.emoji}
                        </div>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: roast === r.id ? C.brand : C.textDark,
                            marginBottom: 3,
                          }}
                        >
                          {r.label}
                        </div>
                        <div style={{ fontSize: 11.5, color: C.textMuted }}>
                          {r.sub}
                        </div>
                        <div
                          style={{
                            fontFamily: "DM Mono, monospace",
                            fontSize: 10.5,
                            color: C.gold,
                            marginTop: 5,
                            fontWeight: 600,
                          }}
                        >
                          {r.temp}
                        </div>
                        {r.id !== "medium" && (
                          <div
                            style={{
                              fontFamily: "DM Mono, monospace",
                              fontSize: 10,
                              color: C.textMuted,
                              marginTop: 3,
                            }}
                          >
                            +{(selected.roastPremium[r.id] * 100).toFixed(0)}%
                            premium
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </ConfigSection>

                {/* Step 2: Bag Size */}
                <ConfigSection
                  step="2"
                  title="Packaging Size"
                  sub="Retail-branded degassing valve bags"
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: 10,
                    }}
                  >
                    {BAGS.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => setBagSize(b.id)}
                        style={{
                          padding: "14px 10px",
                          borderRadius: 10,
                          border: `1.5px solid ${
                            bagSize === b.id ? C.gold : C.creamBorder
                          }`,
                          background: bagSize === b.id ? C.goldLight : C.cream,
                          cursor: "pointer",
                          textAlign: "center" as const,
                          transition: "all 0.15s",
                          boxShadow:
                            bagSize === b.id ? `0 0 0 3px ${C.gold}20` : "none",
                        }}
                        onMouseEnter={(e) => {
                          if (bagSize !== b.id)
                            e.currentTarget.style.borderColor = C.textMuted
                        }}
                        onMouseLeave={(e) => {
                          if (bagSize !== b.id)
                            e.currentTarget.style.borderColor = C.creamBorder
                        }}
                      >
                        <div
                          style={{
                            fontFamily: "Fraunces, serif",
                            fontSize: 22,
                            fontWeight: 700,
                            color: bagSize === b.id ? C.espresso2 : C.textDark,
                            marginBottom: 4,
                          }}
                        >
                          {b.label}
                        </div>
                        <div style={{ fontSize: 11.5, color: C.textMuted }}>
                          {b.sub}
                        </div>
                        <div
                          style={{
                            fontFamily: "DM Mono, monospace",
                            fontSize: 11,
                            color: bagSize === b.id ? C.gold : C.textMuted,
                            fontWeight: 600,
                            marginTop: 6,
                          }}
                        >
                          ETB {selected.prices[b.id].toLocaleString()}
                        </div>
                      </button>
                    ))}
                  </div>
                </ConfigSection>

                {/* Step 3: Quantity */}
                <ConfigSection
                  step="3"
                  title="Quantity"
                  sub="Number of bags — minimum order 50 bags"
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        marginBottom: 18,
                      }}
                    >
                      {/* Decrement */}
                      <button
                        onClick={() =>
                          setQty((q) => Math.max(1, q - (q >= 50 ? 10 : 1)))
                        }
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 10,
                          border: `1.5px solid ${C.creamBorder}`,
                          background: C.cream,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 20,
                          color: C.textMid,
                          flexShrink: 0,
                          transition: "all 0.12s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = C.creamDark)
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = C.cream)
                        }
                      >
                        −
                      </button>
                      {/* Input */}
                      <div style={{ flex: 1, position: "relative" as const }}>
                        <input
                          type="number"
                          value={qty}
                          min={1}
                          onChange={(e) => {
                            const v = parseInt(e.target.value) || 1
                            setQty(Math.max(1, v))
                          }}
                          style={{
                            width: "100%",
                            textAlign: "center" as const,
                            fontFamily: "Fraunces, serif",
                            fontSize: 32,
                            fontWeight: 700,
                            color: C.textDark,
                            background: C.cream,
                            border: `1.5px solid ${C.creamBorder}`,
                            borderRadius: 10,
                            padding: "10px 16px",
                            outline: "none",
                            boxSizing: "border-box" as const,
                          }}
                          onFocus={(e) =>
                            (e.currentTarget.style.borderColor = C.brand)
                          }
                          onBlur={(e) =>
                            (e.currentTarget.style.borderColor = C.creamBorder)
                          }
                        />
                        <span
                          style={{
                            position: "absolute" as const,
                            right: 14,
                            top: "50%",
                            transform: "translateY(-50%)",
                            fontSize: 12,
                            color: C.textMuted,
                            fontFamily: "DM Mono, monospace",
                            pointerEvents: "none",
                          }}
                        >
                          bags
                        </span>
                      </div>
                      {/* Increment */}
                      <button
                        onClick={() => setQty((q) => q + (q >= 50 ? 10 : 1))}
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 10,
                          border: `1.5px solid ${C.creamBorder}`,
                          background: C.cream,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 20,
                          color: C.textMid,
                          flexShrink: 0,
                          transition: "all 0.12s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = C.creamDark)
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = C.cream)
                        }
                      >
                        +
                      </button>
                    </div>

                    {/* Quick qty presets */}
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap" as const,
                      }}
                    >
                      {[50, 100, 250, 500].map((n) => (
                        <button
                          key={n}
                          onClick={() => setQty(n)}
                          style={{
                            padding: "5px 14px",
                            borderRadius: 999,
                            border: `1px solid ${
                              qty === n ? C.brand : C.creamBorder
                            }`,
                            background:
                              qty === n ? `${C.brand}10` : "transparent",
                            color: qty === n ? C.brand : C.textMuted,
                            fontSize: 12.5,
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 0.12s",
                            fontFamily: "DM Mono, monospace",
                          }}
                        >
                          {n}
                        </button>
                      ))}
                      <span
                        style={{
                          fontSize: 12,
                          color: C.textMuted,
                          alignSelf: "center",
                          fontFamily: "DM Mono, monospace",
                        }}
                      >
                        = {weightKg.toLocaleString()} KG total
                      </span>
                    </div>
                  </div>
                </ConfigSection>
              </div>
              {/* end left column */}

              {/* ── Right: Live Quote Card ────────────── */}
              <div
                style={{
                  position: isMobile ? "relative" as const : "sticky" as const,
                  top: 80,
                }}
              >
                <div
                  style={{
                    background: C.espresso,
                    borderRadius: 16,
                    overflow: "hidden",
                    boxShadow: "0 20px 60px rgba(28,17,8,0.30)",
                  }}
                >
                  {/* Card header */}
                  <div
                    style={{
                      padding: "20px 22px 16px",
                      borderBottom: "1px solid rgba(247,240,230,0.08)",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "DM Mono, monospace",
                        fontSize: 10,
                        fontWeight: 600,
                        color: C.gold,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase" as const,
                        marginBottom: 6,
                      }}
                    >
                      Live Quotation
                    </div>
                    <div
                      style={{
                        fontFamily: "Fraunces, serif",
                        fontSize: 18,
                        fontWeight: 700,
                        color: C.cream,
                        lineHeight: 1.2,
                      }}
                    >
                      {selected.name}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "rgba(247,240,230,0.45)",
                        marginTop: 3,
                        fontFamily: "DM Mono, monospace",
                      }}
                    >
                      {ROASTS.find((r) => r.id === roast)?.label} ·{" "}
                      {BAGS.find((b) => b.id === bagSize)?.label} Bags · {qty}{" "}
                      units
                    </div>
                  </div>

                  {/* Price rows */}
                  <div style={{ padding: "16px 22px" }}>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                        marginBottom: 16,
                      }}
                    >
                      {[
                        {
                          label: "Unit Base Price",
                          value: `ETB ${selected.prices[bagSize].toLocaleString()}`,
                          mono: true,
                        },
                        {
                          label: "Roast Premium",
                          value:
                            roast === "medium"
                              ? "Included"
                              : `+${(selected.roastPremium[(roast as RoastId)] * 100).toFixed(0)}%`,
                          mono: false,
                        },
                        {
                          label: "Unit Final Price",
                          value: `ETB ${unitFinal.toLocaleString()}`,
                          mono: true,
                        },
                        {
                          label: `Quantity (${qty} bags)`,
                          value: `× ${qty}`,
                          mono: true,
                        },
                        {
                          label: "Subtotal",
                          value: `ETB ${fmt(subtotal)}`,
                          mono: true,
                        },
                      ].map((row) => (
                        <div
                          key={row.label}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <span
                            style={{
                              fontSize: 12,
                              color: "rgba(247,240,230,0.45)",
                            }}
                          >
                            {row.label}
                          </span>
                          <span
                            style={{
                              fontSize: 13,
                              fontFamily: row.mono
                                ? "DM Mono, monospace"
                                : "Inter",
                              fontWeight: 600,
                              color: "rgba(247,240,230,0.75)",
                            }}
                          >
                            {row.value}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Volume discount */}
                    <div
                      style={{
                        background: "rgba(247,240,230,0.04)",
                        border: "1px solid rgba(247,240,230,0.08)",
                        borderRadius: 8,
                        padding: "10px 14px",
                        marginBottom: 16,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          color: "rgba(247,240,230,0.35)",
                          marginBottom: 6,
                          fontFamily: "DM Mono, monospace",
                          letterSpacing: "0.06em",
                        }}
                      >
                        VOLUME DISCOUNT TIER
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: 6,
                          flexWrap: "wrap" as const,
                        }}
                      >
                        {TIERS.map((t) => {
                          const isActive = tier.label === t.label
                          return (
                            <div
                              key={t.label}
                              style={{
                                padding: "4px 10px",
                                borderRadius: 6,
                                background: isActive ? C.gold : "transparent",
                                border: `1px solid ${
                                  isActive ? C.gold : "rgba(247,240,230,0.1)"
                                }`,
                                transition: "all 0.2s",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: isActive
                                    ? C.espresso
                                    : "rgba(247,240,230,0.3)",
                                  fontFamily: "DM Mono, monospace",
                                }}
                              >
                                {t.badge} {t.label}{" "}
                                {t.discount > 0
                                  ? `−${(t.discount * 100).toFixed(0)}%`
                                  : ""}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                      {discAmt > 0 && (
                        <div
                          style={{
                            fontSize: 12,
                            color: C.gold,
                            marginTop: 8,
                            fontFamily: "DM Mono, monospace",
                            fontWeight: 600,
                          }}
                        >
                          You save ETB {fmt(discAmt)}
                        </div>
                      )}
                    </div>

                    {/* Total */}
                    <div
                      style={{
                        borderTop: "1px solid rgba(247,240,230,0.1)",
                        paddingTop: 16,
                        marginBottom: 18,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "baseline",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 12.5,
                            color: "rgba(247,240,230,0.5)",
                          }}
                        >
                          Estimated Total
                        </span>
                        <div style={{ textAlign: "right" as const }}>
                          <div
                            style={{
                              fontFamily: "Fraunces, serif",
                              fontSize: 28,
                              fontWeight: 700,
                              color: C.cream,
                              lineHeight: 1,
                              letterSpacing: "-0.02em",
                            }}
                          >
                            {fmt(total)}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              fontFamily: "DM Mono, monospace",
                              color: C.gold,
                              marginTop: 3,
                            }}
                          >
                            ETB · {weightKg.toLocaleString()} KG total
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* CTA */}
                    <button
                      onClick={() => setStep("checkout")}
                      style={{
                        width: "100%",
                        padding: "14px 0",
                        borderRadius: 10,
                        border: "none",
                        background: C.brand,
                        color: C.white,
                        fontSize: 14,
                        fontWeight: 700,
                        cursor: "pointer",
                        transition: "all 0.2s",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        boxShadow: `0 4px 20px ${C.brand}50`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = C.brandHover
                        e.currentTarget.style.transform = "translateY(-1px)"
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = C.brand
                        e.currentTarget.style.transform = "translateY(0)"
                      }}
                    >
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" />
                      </svg>
                      Proceed to Checkout
                    </button>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 5,
                        marginTop: 12,
                      }}
                    >
                      <svg
                        width="11"
                        height="11"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="rgba(247,240,230,0.25)"
                        strokeWidth="2"
                      >
                        <rect x="3" y="11" width="18" height="11" rx="2" />
                        <path d="M7 11V7a5 5 0 0110 0v4" />
                      </svg>
                      <span
                        style={{
                          fontSize: 11,
                          color: "rgba(247,240,230,0.25)",
                          fontFamily: "DM Mono, monospace",
                        }}
                      >
                        Prices quoted in ETB · Subject to confirmation
                      </span>
                    </div>
                  </div>
                </div>

                {/* Origin summary beneath card */}
                <div
                  style={{
                    marginTop: 12,
                    background: C.cream,
                    border: `1px solid ${C.creamBorder}`,
                    borderRadius: 10,
                    padding: "12px 16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap" as const,
                    gap: 8,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        fontFamily: "DM Mono, monospace",
                        color: C.textMuted,
                        letterSpacing: "0.06em",
                        marginBottom: 3,
                      }}
                    >
                      SELECTED ORIGIN
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: C.textDark,
                      }}
                    >
                      {selected.name} · {selected.grade}
                    </div>
                    <div
                      style={{
                        fontSize: 11.5,
                        color: C.textMuted,
                        marginTop: 2,
                      }}
                    >
                      {selected.altitude} · {selected.region}
                    </div>
                  </div>
                  <CupScoreBadge score={selected.cupScore} />
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Checkout Section ──────────────────────────── */}
      {step === "checkout" && selected && (
        <section
          ref={checkoutRef}
          style={{
            background: C.espresso,
            padding: isMobile
              ? "48px 16px"
              : isTablet
                ? "56px 24px"
                : "72px 40px",
            borderTop: `1px solid rgba(247,240,230,0.06)`,
          }}
        >
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <div style={{ marginBottom: 36 }}>
              <div
                style={{
                  fontFamily: "DM Mono, monospace",
                  fontSize: 10.5,
                  fontWeight: 600,
                  color: C.gold,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase" as const,
                  marginBottom: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div style={{ width: 16, height: 1.5, background: C.gold }} />
                Order Checkout
              </div>
              <h2
                style={{
                  fontFamily: "Fraunces, serif",
                  fontSize: isMobile ? 26 : 36,
                  fontWeight: 700,
                  color: C.cream,
                  margin: "0 0 10px",
                  letterSpacing: "-0.02em",
                }}
              >
                Complete Your Request
              </h2>
              <p
                style={{
                  fontSize: 14,
                  color: "rgba(247,240,230,0.5)",
                  margin: 0,
                }}
              >
                This request will be ingested directly into our production ERP
                and your assigned sales manager will confirm within 24 hours.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                gap: 20,
                alignItems: "start",
              }}
            >
              {/* ── Form ──────────────────────────────── */}
              <div>
                <div
                  style={{
                    fontFamily: "DM Mono, monospace",
                    fontSize: 10,
                    fontWeight: 700,
                    color: "rgba(247,240,230,0.3)",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase" as const,
                    marginBottom: 18,
                  }}
                >
                  Business Information
                </div>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 14 }}
                >
                  {[
                    {
                      label: "Business / Company Name",
                      value: bizName,
                      set: setBizName,
                      placeholder: "e.g. Tomoca Coffee PLC",
                      type: "text",
                      required: true,
                    },
                    {
                      label: "Contact Phone Number",
                      value: contactPhone,
                      set: setPhone,
                      placeholder: "+251 9XX XXX XXX",
                      type: "tel",
                      required: true,
                    },
                    {
                      label: "Delivery Address (Addis Ababa)",
                      value: address,
                      set: setAddress,
                      placeholder: "Kebele, Sub-city, Addis Ababa",
                      type: "text",
                      required: true,
                    },
                    {
                      label: "Telegram Handle (optional)",
                      value: tgHandle,
                      set: setTgHandle,
                      placeholder: "@yourbusiness",
                      type: "text",
                      required: false,
                    },
                  ].map((field) => (
                    <div key={field.label}>
                      <label
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: "rgba(247,240,230,0.5)",
                          display: "block",
                          marginBottom: 7,
                        }}
                      >
                        {field.label}
                        {field.required && (
                          <span style={{ color: "#EF4444", marginLeft: 4 }}>
                            *
                          </span>
                        )}
                      </label>
                      <input
                        type={field.type}
                        value={field.value}
                        onChange={(e) => field.set(e.target.value)}
                        placeholder={field.placeholder}
                        style={{
                          width: "100%",
                          padding: "11px 14px",
                          borderRadius: 8,
                          border: "1.5px solid rgba(247,240,230,0.1)",
                          background: "rgba(247,240,230,0.05)",
                          color: C.cream,
                          fontSize: 13.5,
                          fontFamily: "Inter, sans-serif",
                          outline: "none",
                          boxSizing: "border-box" as const,
                          transition: "border-color 0.15s",
                        }}
                        onFocus={(e) =>
                          (e.currentTarget.style.borderColor = C.brand)
                        }
                        onBlur={(e) =>
                          (e.currentTarget.style.borderColor =
                            "rgba(247,240,230,0.1)")
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Right: Summary + CTA ──────────────── */}
              <div
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                {/* Order summary card */}
                <div
                  style={{
                    background: "rgba(247,240,230,0.04)",
                    border: "1px solid rgba(247,240,230,0.1)",
                    borderRadius: 14,
                    padding: "20px 22px",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "DM Mono, monospace",
                      fontSize: 10,
                      color: "rgba(247,240,230,0.3)",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase" as const,
                      marginBottom: 14,
                    }}
                  >
                    Order Summary
                  </div>
                  {[
                    ["Origin", selected.name],
                    [
                      "Roast Profile",
                      ROASTS.find((r) => r.id === roast)?.label ?? "",
                    ],
                    [
                      "Bag Size",
                      BAGS.find((b) => b.id === bagSize)?.label ?? "",
                    ],
                    [
                      "Quantity",
                      `${qty} bags · ${weightKg.toLocaleString()} KG`,
                    ],
                    [
                      "Volume Tier",
                      `${tier.label}${
                        tier.discount > 0
                          ? ` (−${(tier.discount * 100).toFixed(0)}%)`
                          : " Rate"
                      }`,
                    ],
                    ["Total (est.)", `ETB ${fmt(total)}`],
                  ].map(([k, v], i) => (
                    <div
                      key={k}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        paddingBottom: i < 5 ? 10 : 0,
                        marginBottom: i < 5 ? 10 : 0,
                        borderBottom:
                          i < 5 ? "1px solid rgba(247,240,230,0.05)" : "none",
                      }}
                    >
                      <span
                        style={{ fontSize: 12, color: "rgba(247,240,230,0.4)" }}
                      >
                        {k}
                      </span>
                      <span
                        style={{
                          fontSize: 13,
                          fontFamily: i === 5 ? "DM Mono, monospace" : "Inter",
                          fontWeight: i === 5 ? 700 : 600,
                          color: i === 5 ? C.gold : "rgba(247,240,230,0.8)",
                        }}
                      >
                        {v}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Telegram sync card */}
                <div
                  style={{
                    background: "rgba(0,136,204,0.08)",
                    border: "1px solid rgba(0,136,204,0.2)",
                    borderRadius: 12,
                    padding: "16px 18px",
                    display: "flex",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: "rgba(0,136,204,0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill={C.telegram}
                    >
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8l-1.68 7.92c-.12.56-.46.7-.94.44l-2.6-1.92-1.25 1.2c-.14.14-.26.26-.52.26l.18-2.62 4.72-4.26c.2-.18-.04-.28-.32-.1l-5.84 3.68-2.52-.78c-.54-.18-.56-.54.12-.8l9.84-3.8c.46-.16.86.12.71.78z" />
                    </svg>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "rgba(247,240,230,0.85)",
                        marginBottom: 4,
                      }}
                    >
                      Telegram ERP Sync
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "rgba(247,240,230,0.45)",
                        lineHeight: 1.55,
                      }}
                    >
                      Your order request will be ingested directly into our
                      production ERP and synced with your Telegram account. A
                      confirmation message will arrive within minutes.
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        fontFamily: "DM Mono, monospace",
                        color: C.telegram,
                        marginTop: 8,
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      <div
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: "50%",
                          background: C.telegram,
                        }}
                      />
                      BOT ACTIVE · @FlavorCoffeeERPBot
                    </div>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  onClick={() => canSubmit && handleSubmit()}
                  disabled={!canSubmit}
                  style={{
                    width: "100%",
                    padding: "16px 0",
                    borderRadius: 10,
                    border: "none",
                    background: canSubmit ? C.brand : "rgba(247,240,230,0.08)",
                    color: canSubmit ? C.white : "rgba(247,240,230,0.2)",
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: canSubmit ? "pointer" : "not-allowed",
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 9,
                    boxShadow: canSubmit ? `0 6px 24px ${C.brand}50` : "none",
                  }}
                  onMouseEnter={(e) => {
                    if (canSubmit) {
                      e.currentTarget.style.background = C.brandHover
                      e.currentTarget.style.transform = "translateY(-1px)"
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (canSubmit) {
                      e.currentTarget.style.background = C.brand
                      e.currentTarget.style.transform = "translateY(0)"
                    }
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                  Submit Wholesale Order Request
                </button>

                {!canSubmit && (
                  <p
                    style={{
                      fontSize: 11.5,
                      color: "rgba(247,240,230,0.3)",
                      textAlign: "center" as const,
                      fontFamily: "DM Mono, monospace",
                      margin: 0,
                    }}
                  >
                    Fill in Business Name, Phone, and Address to proceed
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Footer ────────────────────────────────────── */}
      <footer
        style={{
          background: C.espresso2,
          borderTop: `1px solid rgba(247,240,230,0.05)`,
          padding: isMobile ? "28px 16px" : "32px 40px",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap" as const,
            gap: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: 6,
                background: C.brand,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
              >
                <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 3z" />
              </svg>
            </div>
            <span
              style={{
                fontSize: 12,
                color: "rgba(247,240,230,0.35)",
                fontFamily: "DM Mono, monospace",
              }}
            >
              © 2026 Flavor Coffee Roasters PLC · TIN 0023-401-882
            </span>
          </div>
          <div style={{ display: "flex", gap: 20 }}>
            {[
              "Terms of Trade",
              "Privacy Policy",
              "Wholesale FAQ",
              "+251 115 XXX XXX",
            ].map((link) => (
              <a
                key={link}
                href="#"
                style={{
                  fontSize: 11.5,
                  color: "rgba(247,240,230,0.25)",
                  textDecoration: "none",
                  fontFamily: "DM Mono, monospace",
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "rgba(247,240,230,0.6)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "rgba(247,240,230,0.25)")
                }
              >
                {link}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}

/* ── Origin Card ──────────────────────────────────────── */
function OriginCard({
  origin,
  selected,
  hovered,
  onSelect,
  onHover,
}: {
  origin: Origin
  selected: boolean
  hovered: boolean
  onSelect: () => void
  onHover: (id: OriginId | null) => void
}) {
  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => onHover(origin.id)}
      onMouseLeave={() => onHover(null)}
      style={{
        background: C.white,
        border: `2px solid ${
          selected ? origin.accent : hovered ? C.creamBorder : "transparent"
        }`,
        borderRadius: 16,
        overflow: "hidden",
        cursor: "pointer",
        transition: "all 0.2s cubic-bezier(0.16,1,0.3,1)",
        boxShadow: selected
          ? `0 0 0 4px ${origin.accent}18, 0 12px 32px ${origin.accent}20`
          : hovered
            ? "0 8px 32px rgba(28,17,8,0.12)"
            : "0 2px 8px rgba(28,17,8,0.05)",
        transform: hovered && !selected ? "translateY(-2px)" : "translateY(0)",
      }}
    >
      {/* Image */}
      <div
        style={{
          height: 160,
          overflow: "hidden",
          position: "relative",
          background: origin.accent,
        }}
      >
        <img
          src={origin.img}
          alt={`${origin.name} origin`}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.85,
            transition: "transform 0.4s cubic-bezier(0.16,1,0.3,1)",
            transform: hovered ? "scale(1.04)" : "scale(1)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(to bottom, transparent 40%, ${origin.accent}88)`,
          }}
        />

        {/* Selected indicator */}
        {selected && (
          <div
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: C.brand,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 2px 10px ${C.brand}50`,
            }}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        )}

        {/* Grade badge */}
        <div
          style={{
            position: "absolute",
            bottom: 10,
            left: 12,
            background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            borderRadius: 6,
            padding: "4px 9px",
          }}
        >
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              color: C.cream,
              fontFamily: "DM Mono, monospace",
              letterSpacing: "0.04em",
            }}
          >
            {origin.grade}
          </span>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "16px 18px 18px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 8,
            gap: 10,
          }}
        >
          <div>
            <h3
              style={{
                fontFamily: "Fraunces, serif",
                fontSize: 17,
                fontWeight: 700,
                color: C.textDark,
                margin: "0 0 3px",
                lineHeight: 1.2,
              }}
            >
              {origin.name}
            </h3>
            <div
              style={{
                fontSize: 11.5,
                color: C.textMuted,
                fontFamily: "DM Mono, monospace",
              }}
            >
              {origin.region}
            </div>
          </div>
          <CupScoreBadge score={origin.cupScore} />
        </div>

        <div
          style={{
            display: "flex",
            gap: 5,
            flexWrap: "wrap" as const,
            marginBottom: 12,
          }}
        >
          {origin.flavor.map((f) => (
            <FlavorTag key={f} label={f} accent={origin.accent} />
          ))}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 6,
            marginBottom: 14,
          }}
        >
          {[
            ["Altitude", origin.altitude],
            ["Process", origin.process],
          ].map(([k, v]) => (
            <div
              key={k}
              style={{
                background: C.creamDark,
                borderRadius: 6,
                padding: "6px 9px",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontFamily: "DM Mono, monospace",
                  color: C.textMuted,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase" as const,
                }}
              >
                {k}
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: C.textDark,
                  marginTop: 1,
                }}
              >
                {v}
              </div>
            </div>
          ))}
        </div>

        <p
          style={{
            fontSize: 12.5,
            color: C.textMuted,
            lineHeight: 1.55,
            margin: "0 0 14px",
            fontStyle: "italic",
          }}
        >
          "{origin.heroDesc}"
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontFamily: "DM Mono, monospace",
              fontSize: 12,
              color: C.textMid,
            }}
          >
            From{" "}
            <span
              style={{ fontSize: 15, fontWeight: 700, color: origin.accent }}
            >
              ETB {origin.prices["250g"].toLocaleString()}
            </span>
            <span style={{ fontSize: 10.5, color: C.textMuted }}>
              {" "}
              / 250g bag
            </span>
          </div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: selected ? C.brand : C.textMuted,
              display: "flex",
              alignItems: "center",
              gap: 4,
              transition: "color 0.2s",
            }}
          >
            {selected ? "Selected ✓" : "Select →"}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Config Section wrapper ───────────────────────────── */
function ConfigSection({
  step,
  title,
  sub,
  children,
}: {
  step: string
  title: string
  sub: string
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        background: C.cream,
        border: `1.5px solid ${C.creamBorder}`,
        borderRadius: 14,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "14px 20px 12px",
          borderBottom: `1px solid ${C.creamBorder}`,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 8,
            background: C.brand,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: C.white,
              fontFamily: "DM Mono, monospace",
            }}
          >
            {step}
          </span>
        </div>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: C.textDark }}>
            {title}
          </div>
          <div style={{ fontSize: 11.5, color: C.textMuted }}>{sub}</div>
        </div>
      </div>
      <div style={{ padding: "16px 20px 20px" }}>{children}</div>
    </div>
  )
}
