/* Responsive: mobile ≤640 | tablet 641–1024 | laptop 1025–1440 | desktop >1440 */
import { useState } from "react"
import { useBreakpoint } from "../hooks/useBreakpoint"
import { useAuth } from "../contexts/AuthContext"
import { can } from "../lib/can"

type TabId = "general" | "yield" | "vat" | "pricing" | "packaging" | "expense-cats" | "locations" | "system"

interface Location {
  id: string
  name: string
  city: string
  type: string
  active: boolean
  isPrimary: boolean
}
interface BackupRecord {
  id: string
  ts: string
  size: string
  status: "success" | "failed" | "running"
  type: "auto" | "manual"
}
interface AuditEntry {
  id: string
  field: string
  oldValue: string
  newValue: string
  changedBy: string
  changedAt: string
  reason?: string
}
interface ExpenseCategory {
  id: string
  name: string
  status: "active" | "disabled"
  createdAt: string
  usageCount: number
}
interface PackagingItem {
  id: string
  name: string
  size: string
  unit: string
  price: string
  available: boolean
}
interface PricingEntry {
  id: string
  product: string
  origin: string
  roastLevel: string
  pricePerKg: string
  effectiveFrom: string
  lastUpdated: string
  updatedBy: string
}
interface YieldRange {
  id: string
  origin: string
  roastLevel: string
  minYield: string
  maxYield: string
  targetYield: string
  lastUpdated: string
  updatedBy: string
}

const TABS: { id: TabId label: string icon: string }[] = [
  {
    id: "general",
    label: "General",
    icon: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10",
  },
  {
    id: "yield",
    label: "Yield Settings",
    icon: "M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 3z",
  },
  {
    id: "vat",
    label: "VAT",
    icon: "M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6",
  },
  { id: "pricing", label: "Pricing", icon: "M18 20V10M12 20V4M6 20v-6" },
  {
    id: "packaging",
    label: "Packaging",
    icon: "M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z",
  },
  {
    id: "expense-cats",
    label: "Expense Categories",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  },
  {
    id: "locations",
    label: "Locations",
    icon: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 7a3 3 0 100 6 3 3 0 000-6z",
  },
  {
    id: "system",
    label: "System",
    icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  },
]

const LOCATIONS: Location[] = [
  {
    id: "LOC-001",
    name: "Addis Ababa Processing Plant",
    city: "Addis Ababa",
    type: "Primary Plant",
    active: true,
    isPrimary: true,
  },
  {
    id: "LOC-002",
    name: "Dire Dawa Export Facility",
    city: "Dire Dawa",
    type: "Export Warehouse",
    active: true,
    isPrimary: false,
  },
  {
    id: "LOC-003",
    name: "Yirgacheffe Collection Hub",
    city: "Yirgacheffe",
    type: "Collection Hub",
    active: true,
    isPrimary: false,
  },
  {
    id: "LOC-004",
    name: "Sidama Field Office",
    city: "Hawassa",
    type: "Regional Office",
    active: false,
    isPrimary: false,
  },
]
const BACKUPS: BackupRecord[] = [
  {
    id: "BKP-0041",
    ts: "2026-08-07 03:00",
    size: "142 MB",
    status: "success",
    type: "auto",
  },
  {
    id: "BKP-0040",
    ts: "2026-08-06 03:00",
    size: "139 MB",
    status: "success",
    type: "auto",
  },
  {
    id: "BKP-0039",
    ts: "2026-08-05 16:22",
    size: "138 MB",
    status: "success",
    type: "manual",
  },
  {
    id: "BKP-0038",
    ts: "2026-08-05 03:00",
    size: "137 MB",
    status: "success",
    type: "auto",
  },
  {
    id: "BKP-0037",
    ts: "2026-08-04 03:00",
    size: "141 MB",
    status: "failed",
    type: "auto",
  },
]
const YIELD_RANGES: YieldRange[] = [
  {
    id: "yr-001",
    origin: "Guji",
    roastLevel: "Light",
    minYield: "82%",
    maxYield: "88%",
    targetYield: "85%",
    lastUpdated: "2026-07-01",
    updatedBy: "",
  },
  {
    id: "yr-002",
    origin: "Guji",
    roastLevel: "Medium",
    minYield: "80%",
    maxYield: "86%",
    targetYield: "83%",
    lastUpdated: "2026-07-01",
    updatedBy: "",
  },
  {
    id: "yr-003",
    origin: "Yirgacheffe",
    roastLevel: "Light",
    minYield: "84%",
    maxYield: "90%",
    targetYield: "87%",
    lastUpdated: "2026-07-15",
    updatedBy: "",
  },
  {
    id: "yr-004",
    origin: "Yirgacheffe",
    roastLevel: "Medium",
    minYield: "82%",
    maxYield: "88%",
    targetYield: "85%",
    lastUpdated: "2026-07-15",
    updatedBy: "",
  },
  {
    id: "yr-005",
    origin: "Harrar",
    roastLevel: "Medium",
    minYield: "79%",
    maxYield: "85%",
    targetYield: "82%",
    lastUpdated: "2026-06-20",
    updatedBy: "",
  },
  {
    id: "yr-006",
    origin: "Harrar",
    roastLevel: "Dark",
    minYield: "76%",
    maxYield: "82%",
    targetYield: "79%",
    lastUpdated: "2026-06-20",
    updatedBy: "",
  },
]
const YIELD_AUDIT: AuditEntry[] = [
  {
    id: "ya-001",
    field: "Guji Light Target Yield",
    oldValue: "84%",
    newValue: "85%",
    changedBy: "",
    changedAt: "2026-07-01 09:14",
    reason: "Adjusted based on July production data",
  },
  {
    id: "ya-002",
    field: "Yirgacheffe Light Target",
    oldValue: "86%",
    newValue: "87%",
    changedBy: "",
    changedAt: "2026-07-15 11:30",
    reason: "Updated after Q2 yield review",
  },
]
const VAT_AUDIT: AuditEntry[] = [
  {
    id: "va-001",
    field: "VAT Rate",
    oldValue: "14%",
    newValue: "15%",
    changedBy: "",
    changedAt: "2026-01-01 00:00",
    reason: "EAR mandate effective 1 Jan 2026",
  },
  {
    id: "va-002",
    field: "VAT Rate",
    oldValue: "10%",
    newValue: "14%",
    changedBy: "",
    changedAt: "2025-01-01 00:00",
    reason: "Annual rate update per EAR directive",
  },
]
const PRICING_DATA: PricingEntry[] = [
  {
    id: "pr-001",
    product: "Roasted Coffee",
    origin: "Guji",
    roastLevel: "Light",
    pricePerKg: "ETB 1,450",
    effectiveFrom: "2026-08-01",
    lastUpdated: "2026-07-28",
    updatedBy: "",
  },
  {
    id: "pr-002",
    product: "Roasted Coffee",
    origin: "Guji",
    roastLevel: "Medium",
    pricePerKg: "ETB 1,380",
    effectiveFrom: "2026-08-01",
    lastUpdated: "2026-07-28",
    updatedBy: "",
  },
  {
    id: "pr-003",
    product: "Roasted Coffee",
    origin: "Yirgacheffe",
    roastLevel: "Light",
    pricePerKg: "ETB 1,620",
    effectiveFrom: "2026-08-01",
    lastUpdated: "2026-07-28",
    updatedBy: "",
  },
  {
    id: "pr-004",
    product: "Roasted Coffee",
    origin: "Yirgacheffe",
    roastLevel: "Medium",
    pricePerKg: "ETB 1,540",
    effectiveFrom: "2026-08-01",
    lastUpdated: "2026-07-28",
    updatedBy: "",
  },
  {
    id: "pr-005",
    product: "Roasted Coffee",
    origin: "Harrar",
    roastLevel: "Medium",
    pricePerKg: "ETB 1,290",
    effectiveFrom: "2026-08-01",
    lastUpdated: "2026-07-28",
    updatedBy: "",
  },
  {
    id: "pr-006",
    product: "Roasted Coffee",
    origin: "Harrar",
    roastLevel: "Dark",
    pricePerKg: "ETB 1,220",
    effectiveFrom: "2026-08-01",
    lastUpdated: "2026-07-28",
    updatedBy: "",
  },
]
const PACKAGING_DATA: PackagingItem[] = [
  {
    id: "pkg-001",
    name: "250g Bag",
    size: "250",
    unit: "g",
    price: "ETB 18.50",
    available: true,
  },
  {
    id: "pkg-002",
    name: "500g Bag",
    size: "500",
    unit: "g",
    price: "ETB 32.00",
    available: true,
  },
  {
    id: "pkg-003",
    name: "1 KG Bag",
    size: "1000",
    unit: "g",
    price: "ETB 58.00",
    available: true,
  },
  {
    id: "pkg-004",
    name: "2 KG Bag",
    size: "2000",
    unit: "g",
    price: "ETB 108.00",
    available: true,
  },
  {
    id: "pkg-005",
    name: "5 KG Bulk Sack",
    size: "5",
    unit: "kg",
    price: "ETB 245.00",
    available: false,
  },
]
const EXPENSE_CATS: ExpenseCategory[] = [
  {
    id: "ec-001",
    name: "Transport",
    status: "active",
    createdAt: "2024-01-15",
    usageCount: 48,
  },
  {
    id: "ec-002",
    name: "Utilities",
    status: "active",
    createdAt: "2024-01-15",
    usageCount: 24,
  },
  {
    id: "ec-003",
    name: "Supplies",
    status: "active",
    createdAt: "2024-01-15",
    usageCount: 37,
  },
  {
    id: "ec-004",
    name: "Maintenance",
    status: "active",
    createdAt: "2024-02-01",
    usageCount: 19,
  },
  {
    id: "ec-005",
    name: "Office",
    status: "active",
    createdAt: "2024-02-01",
    usageCount: 12,
  },
  {
    id: "ec-006",
    name: "Marketing",
    status: "disabled",
    createdAt: "2024-03-10",
    usageCount: 6,
  },
  {
    id: "ec-007",
    name: "Other",
    status: "active",
    createdAt: "2024-01-15",
    usageCount: 31,
  },
]

function SectionHeader({
  title,
  sub,
  badge,
}: {
  title: string
  sub: string
  badge?: string
}) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 5,
        }}
      >
        <h2
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: "var(--text-primary)",
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </h2>
        {badge && (
          <span
            style={{
              fontSize: 10,
              fontFamily: "DM Mono",
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: 4,
              background: "#FEF3C7",
              color: "#B45309",
              border: "1px solid #FDE68A",
            }}
          >
            {badge}
          </span>
        )}
      </div>
      <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
        {sub}
      </p>
    </div>
  )
}

function SettingsRow({
  label,
  sub,
  children,
}: {
  label: string
  sub?: string
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: sub ? "flex-start" : "center",
        padding: "16px 0",
        borderBottom: "1px solid #F0EDE8",
        gap: 24,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 13.5,
            fontWeight: 600,
            color: "var(--text-primary)",
          }}
        >
          {label}
        </div>
        {sub && (
          <div
            style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}
          >
            {sub}
          </div>
        )}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  )
}

function Toggle({ value, onChange }: { value: boolean onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      style={{
        width: 42,
        height: 24,
        borderRadius: 999,
        background: value ? "#2B4D3A" : "#D1D5DB",
        border: "none",
        cursor: "pointer",
        position: "relative",
        transition: "background 0.2s",
        padding: 0,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 3,
          left: value ? 21 : 3,
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "var(--surface-01)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          transition: "left 0.2s cubic-bezier(0.16,1,0.3,1)",
        }}
      />
    </button>
  )
}

function SettingsSelect({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string label: string }[]
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        paddingTop: 8,
        paddingBottom: 8,
        paddingLeft: 12,
        paddingRight: 30,
        borderRadius: 8,
        border: "1.5px solid var(--border-neutral)",
        background: "var(--surface-01)",
        fontSize: 13,
        fontFamily: "Inter",
        color: "var(--text-primary)",
        outline: "none",
        cursor: "pointer",
        minWidth: 240,
        appearance: "none",
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 10px center",
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

function AuditTrail({ entries }: { entries: AuditEntry[] }) {
  return (
    <div style={{ marginTop: 28 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "var(--text-muted)",
          fontFamily: "DM Mono",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: 12,
        }}
      >
        Change History
      </div>
      {entries.map((e) => (
        <div
          key={e.id}
          style={{
            padding: "12px 14px",
            background: "var(--bg-primary)",
            border: "1px solid #F0EDE8",
            borderRadius: 9,
            marginBottom: 8,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 16,
              marginBottom: 6,
            }}
          >
            <div
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                color: "var(--text-primary)",
              }}
            >
              {e.field}
            </div>
            <div
              style={{
                fontSize: 11,
                fontFamily: "DM Mono",
                color: "var(--text-muted)",
                flexShrink: 0,
              }}
            >
              {e.changedAt}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 5,
            }}
          >
            <span
              style={{
                fontSize: 11.5,
                fontFamily: "DM Mono",
                padding: "2px 8px",
                borderRadius: 4,
                background: "#FEF2F2",
                color: "#B91C1C",
                border: "1px solid #FECACA",
              }}
            >
              {e.oldValue}
            </span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#9CA3AF"
              strokeWidth="2"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
            <span
              style={{
                fontSize: 11.5,
                fontFamily: "DM Mono",
                padding: "2px 8px",
                borderRadius: 4,
                background: "#F0FDF4",
                color: "#15803D",
                border: "1px solid #DCFCE7",
              }}
            >
              {e.newValue}
            </span>
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
            {e.changedBy}
            {e.reason ? ` · ${e.reason}` : ""}
          </div>
        </div>
      ))}
    </div>
  )
}

function UnsavedBar({
  dirty,
  saving,
  onSave,
  onDiscard,
}: {
  dirty: boolean
  saving: boolean
  onSave: () => void
  onDiscard: () => void
}) {
  if (!dirty && !saving) return null
  return (
    <div
      style={{
        marginTop: 20,
        padding: "12px 16px",
        background: "#FFFBEB",
        border: "1px solid #FEF3C7",
        borderRadius: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
      }}
    >
      <div style={{ fontSize: 12.5, fontFamily: "DM Mono", color: "#78350F" }}>
        Unsaved changes
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={onDiscard}
          className="btn-secondary"
          style={{ fontSize: 12 }}
        >
          Discard
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          style={{
            padding: "7px 16px",
            borderRadius: 7,
            border: "none",
            background: saving ? "#4A7C5A" : "#2B4D3A",
            color: "#FFFFFF",
            fontSize: 13,
            fontWeight: 700,
            cursor: saving ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  )
}

/* ── Pane: General ─────────────────────────────────────── */
function GeneralPane() {
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState("Flavor Coffee PLC")
  const [tin, setTin] = useState("0023-401-882")
  const [email, setEmail] = useState("info@flavorcoffee.et")
  const [phone, setPhone] = useState("+251 11 551 8800")
  const [addr, setAddr] = useState("Bole Sub-city, Addis Ababa, Ethiopia")
  const [timezone, setTimezone] = useState("Africa/Addis_Ababa")
  const [calendar, setCalendar] = useState("dual")
  const [language, setLanguage] = useState("en")
  const [dateFormat, setDateFormat] = useState("Aug 5, 2026")
  const touch = () => setDirty(true)
  const handleSave = () => {
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      setDirty(false)
    }, 1200)
  }

  return (
    <div>
      <SectionHeader
        title="General"
        sub="Company identity, localization, and regional preferences"
      />
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "var(--text-muted)",
          fontFamily: "DM Mono",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          paddingBottom: 8,
          marginBottom: 4,
          borderBottom: "2px solid #F0EDE8",
        }}
      >
        Company Profile
      </div>
      {([
        ["Legal Company Name", name, setName, "text"],
        ["Tax ID (TIN)", tin, setTin, "text"],
        ["Official Email", email, setEmail, "email"],
        ["Phone Number", phone, setPhone, "tel"],
        ["Registered Address", addr, setAddr, "text"],
      ] as [string, string, (v: string) => void, string][]).map(
        ([label, val, fn, type]) => (
          <div
            key={label}
            style={{
              padding: "13px 0",
              borderBottom: "1px solid #F0EDE8",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 24,
            }}
          >
            <div
              style={{
                fontSize: 13.5,
                fontWeight: 600,
                color: "var(--text-primary)",
                flexShrink: 0,
                minWidth: 200,
              }}
            >
              {label}
            </div>
            <input
              type={type}
              value={val}
              onChange={(e) => {
                fn(e.target.value)
                touch()
              }}
              style={{
                flex: 1,
                maxWidth: 320,
                padding: "7px 11px",
                borderRadius: 8,
                border: "1.5px solid var(--border-neutral)",
                background: "var(--bg-primary)",
                fontSize: 13,
                fontFamily: "Inter",
                color: "var(--text-primary)",
                outline: "none",
              }}
            />
          </div>
        ),
      )}
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "var(--text-muted)",
          fontFamily: "DM Mono",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          paddingBottom: 8,
          marginBottom: 4,
          borderBottom: "2px solid #F0EDE8",
          marginTop: 24,
        }}
      >
        Localization
      </div>
      <SettingsRow
        label="System Timezone"
        sub="All timestamps stored in UTC, displayed in this zone"
      >
        <SettingsSelect
          value={timezone}
          onChange={(v) => {
            setTimezone(v)
            touch()
          }}
          options={[
            {
              value: "Africa/Addis_Ababa",
              label: "East Africa Time (EAT) UTC+3",
            },
            { value: "UTC", label: "Coordinated Universal Time UTC+0" },
          ]}
        />
      </SettingsRow>
      <SettingsRow
        label="Calendar Display"
        sub="How dates are shown across all modules"
      >
        <SettingsSelect
          value={calendar}
          onChange={(v) => {
            setCalendar(v)
            touch()
          }}
          options={[
            { value: "dual", label: "Dual (Gregorian + Ethiopian E.C.)" },
            { value: "gregorian", label: "Gregorian Only" },
            { value: "ethiopian", label: "Ethiopian Ge'ez Only" },
          ]}
        />
      </SettingsRow>
      <SettingsRow label="Date Format">
        <SettingsSelect
          value={dateFormat}
          onChange={(v) => {
            setDateFormat(v)
            touch()
          }}
          options={[
            { value: "Aug 5, 2026", label: "Aug 5, 2026" },
            { value: "05/08/2026", label: "05/08/2026 (DD/MM/YYYY)" },
            { value: "2026-08-05", label: "2026-08-05 (ISO 8601)" },
          ]}
        />
      </SettingsRow>
      <SettingsRow label="Interface Language">
        <SettingsSelect
          value={language}
          onChange={(v) => {
            setLanguage(v)
            touch()
          }}
          options={[
            { value: "en", label: "English" },
            { value: "am", label: "Amharic" },
          ]}
        />
      </SettingsRow>
      <UnsavedBar
        dirty={dirty}
        saving={saving}
        onSave={handleSave}
        onDiscard={() => setDirty(false)}
      />
    </div>
  )
}

/* ── Pane: Yield Settings ──────────────────────────────── */
function YieldPane({ canEdit }: { canEdit: boolean }) {
  return (
    <div>
      <SectionHeader
        title="Yield Settings"
        sub="Configured yield percentages by origin and roast level"
        badge="HIGH-IMPACT"
      />
      <div
        style={{
          padding: "10px 14px",
          background: "#FFFBEB",
          border: "1px solid #FEF3C7",
          borderRadius: 9,
          marginBottom: 20,
          fontSize: 12.5,
          color: "#78350F",
        }}
      >
        <strong>Important:</strong> These thresholds affect roasting batch and
        QC calculations. Values are backend-authoritative — the frontend never
        recalculates operational results from them.
      </div>
      <div
        style={{
          border: "1px solid var(--border-neutral)",
          borderRadius: 10,
          overflow: "auto",
          marginBottom: 20,
        }}
      >
        <table
          style={{ width: "100%", borderCollapse: "collapse", minWidth: 580 }}
        >
          <thead>
            <tr style={{ background: "var(--surface-02)" }}>
              {[
                "Origin",
                "Roast",
                "Min",
                "Target",
                "Max",
                "Last Updated",
                "By",
              ].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "9px 14px",
                    textAlign: ["Min", "Target", "Max"].includes(h)
                      ? "right"
                      : "left",
                    fontSize: 10,
                    fontFamily: "DM Mono",
                    fontWeight: 700,
                    color: "var(--text-muted)",
                    letterSpacing: "0.07em",
                    textTransform: "uppercase",
                    borderBottom: "1px solid var(--border-neutral)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {h}
                </th>
              ))}
              {canEdit && (
                <th
                  style={{
                    padding: "9px 14px",
                    borderBottom: "1px solid var(--border-neutral)",
                  }}
                />
              )}
            </tr>
          </thead>
          <tbody>
            {YIELD_RANGES.map((y, i) => (
              <tr
                key={y.id}
                style={{
                  borderBottom:
                    i < YIELD_RANGES.length - 1 ? "1px solid #F0EDE8" : "none",
                  background: i % 2 === 0 ? "#FFFFFF" : "#FAFAF8",
                }}
              >
                <td
                  style={{
                    padding: "10px 14px",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                  }}
                >
                  {y.origin}
                </td>
                <td
                  style={{
                    padding: "10px 14px",
                    fontSize: 12.5,
                    color: "var(--text-secondary)",
                  }}
                >
                  {y.roastLevel}
                </td>
                <td
                  style={{
                    padding: "10px 14px",
                    fontSize: 12.5,
                    fontFamily: "DM Mono",
                    color: "var(--text-muted)",
                    textAlign: "right",
                  }}
                >
                  {y.minYield}
                </td>
                <td style={{ padding: "10px 14px", textAlign: "right" }}>
                  <span
                    style={{
                      fontSize: 12.5,
                      fontFamily: "DM Mono",
                      fontWeight: 700,
                      color: "#2B4D3A",
                      background: "#F0FDF4",
                      padding: "2px 8px",
                      borderRadius: 4,
                      border: "1px solid #DCFCE7",
                    }}
                  >
                    {y.targetYield}
                  </span>
                </td>
                <td
                  style={{
                    padding: "10px 14px",
                    fontSize: 12.5,
                    fontFamily: "DM Mono",
                    color: "var(--text-muted)",
                    textAlign: "right",
                  }}
                >
                  {y.maxYield}
                </td>
                <td
                  style={{
                    padding: "10px 14px",
                    fontSize: 11.5,
                    fontFamily: "DM Mono",
                    color: "var(--text-muted)",
                  }}
                >
                  {y.lastUpdated}
                </td>
                <td
                  style={{
                    padding: "10px 14px",
                    fontSize: 11.5,
                    color: "var(--text-muted)",
                  }}
                >
                  {y.updatedBy}
                </td>
                {canEdit && (
                  <td style={{ padding: "10px 14px" }}>
                    <button
                      className="btn-secondary"
                      style={{ fontSize: 11, padding: "3px 9px" }}
                    >
                      Edit
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AuditTrail entries={YIELD_AUDIT} />
    </div>
  )
}

/* ── Pane: VAT ─────────────────────────────────────────── */
function VatPane({ canEdit }: { canEdit: boolean }) {
  const [currentRate] = useState("15%")
  const [newRate, setNewRate] = useState("")
  const [reason, setReason] = useState("")
  const [showConfirm, setShowConfirm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleConfirm = () => {
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      setSaved(true)
      setShowConfirm(false)
      setNewRate("")
      setReason("")
      setTimeout(() => setSaved(false), 3000)
    }, 1200)
  }

  return (
    <div>
      <SectionHeader
        title="VAT Settings"
        sub="Ethiopian Value-Added Tax configuration — changes affect all future financial calculations"
        badge="HIGH-IMPACT"
      />

      <div
        style={{
          padding: "20px 22px",
          background: "var(--surface-01)",
          border: "1.5px solid var(--border-neutral)",
          borderRadius: 12,
          marginBottom: 22,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                fontFamily: "DM Mono",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 8,
              }}
            >
              Current VAT Rate
            </div>
            <div
              style={{
                fontSize: 36,
                fontFamily: "DM Mono",
                fontWeight: 700,
                color: "var(--text-primary)",
                lineHeight: 1,
              }}
            >
              {currentRate}
            </div>
            <div
              style={{
                fontSize: 12.5,
                color: "var(--text-secondary)",
                marginTop: 10,
              }}
            >
              Effective from 1 January 2026
            </div>
            <div
              style={{
                fontSize: 11.5,
                fontFamily: "DM Mono",
                color: "var(--text-muted)",
                marginTop: 4,
              }}
            >
              Last updated by Abebe Girma · 2026-01-01
            </div>
          </div>
          <span
            style={{
              padding: "4px 10px",
              background: "#F0FDF4",
              border: "1px solid #DCFCE7",
              borderRadius: 7,
              fontSize: 11,
              fontFamily: "DM Mono",
              fontWeight: 700,
              color: "#15803D",
            }}
          >
            ACTIVE
          </span>
        </div>
      </div>

      {saved && (
        <div
          style={{
            padding: "10px 14px",
            background: "#F0FDF4",
            border: "1px solid #DCFCE7",
            borderRadius: 9,
            fontSize: 13,
            color: "#15803D",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#16A34A"
            strokeWidth="2.5"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          VAT setting updated successfully.
        </div>
      )}

      {canEdit && (
        <div
          style={{
            background: "var(--surface-01)",
            border: "1.5px solid var(--border-neutral)",
            borderRadius: 12,
            padding: "20px 22px",
            marginBottom: 22,
          }}
        >
          <div
            style={{
              fontSize: 13.5,
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: 4,
            }}
          >
            Change VAT Rate
          </div>
          <div
            style={{
              fontSize: 12.5,
              color: "var(--text-secondary)",
              marginBottom: 16,
            }}
          >
            This change will apply to all future invoices and financial
            statements. Requires explicit confirmation.
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "200px 1fr",
              gap: 16,
              marginBottom: 14,
              alignItems: "end",
            }}
          >
            <div>
              <label
                style={{
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: "#374151",
                  display: "block",
                  marginBottom: 5,
                }}
              >
                New VAT Rate (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={newRate}
                onChange={(e) => setNewRate(e.target.value)}
                placeholder="e.g. 16"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1.5px solid var(--border-neutral)",
                  background: "var(--bg-primary)",
                  fontSize: 13,
                  fontFamily: "DM Mono",
                  color: "var(--text-primary)",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label
              style={{
                fontSize: 11.5,
                fontWeight: 600,
                color: "#374151",
                display: "block",
                marginBottom: 5,
              }}
            >
              Reason for change
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="e.g. EAR directive effective date..."
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 8,
                border: "1.5px solid var(--border-neutral)",
                background: "var(--bg-primary)",
                fontSize: 13,
                fontFamily: "Inter",
                color: "var(--text-primary)",
                outline: "none",
                resize: "vertical",
                boxSizing: "border-box",
              }}
            />
          </div>
          <button
            onClick={() => setShowConfirm(true)}
            disabled={!newRate || !reason.trim()}
            style={{
              padding: "9px 20px",
              borderRadius: 8,
              border: "none",
              background: newRate && reason.trim() ? "#2B4D3A" : "#E5E3DC",
              color: newRate && reason.trim() ? "#FFFFFF" : "#9CA3AF",
              fontSize: 13.5,
              fontWeight: 700,
              cursor: newRate && reason.trim() ? "pointer" : "not-allowed",
              transition: "all 0.2s",
            }}
          >
            Review Change →
          </button>
        </div>
      )}

      {showConfirm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            style={{
              background: "var(--surface-01)",
              borderRadius: 16,
              padding: "28px 32px",
              maxWidth: 440,
              width: "100%",
              boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "#FEF3C7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#B45309"
                strokeWidth="2"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" />
              </svg>
            </div>
            <div
              style={{
                fontSize: 17,
                fontWeight: 700,
                color: "var(--text-primary)",
                marginBottom: 6,
              }}
            >
              Confirm VAT Rate Change
            </div>
            <div
              style={{
                fontSize: 13,
                color: "var(--text-secondary)",
                marginBottom: 20,
              }}
            >
              Please review carefully before confirming.
            </div>
            <div
              style={{
                background: "var(--surface-02)",
                border: "1px solid var(--border-neutral)",
                borderRadius: 10,
                padding: "16px",
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  marginBottom: 10,
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: 10,
                      fontFamily: "DM Mono",
                      color: "var(--text-muted)",
                      marginBottom: 4,
                    }}
                  >
                    CURRENT
                  </div>
                  <div
                    style={{
                      fontSize: 24,
                      fontFamily: "DM Mono",
                      fontWeight: 700,
                      color: "var(--text-primary)",
                    }}
                  >
                    {currentRate}
                  </div>
                </div>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#9CA3AF"
                  strokeWidth="2"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: 10,
                      fontFamily: "DM Mono",
                      color: "var(--text-muted)",
                      marginBottom: 4,
                    }}
                  >
                    NEW
                  </div>
                  <div
                    style={{
                      fontSize: 24,
                      fontFamily: "DM Mono",
                      fontWeight: 700,
                      color: "#2B4D3A",
                    }}
                  >
                    {newRate}%
                  </div>
                </div>
                <div style={{ marginLeft: "auto", textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: 10,
                      fontFamily: "DM Mono",
                      color: "var(--text-muted)",
                      marginBottom: 4,
                    }}
                  >
                    DIFF
                  </div>
                  <div
                    style={{
                      fontSize: 16,
                      fontFamily: "DM Mono",
                      fontWeight: 700,
                      color: parseFloat(newRate) > 15 ? "#DC2626" : "#16A34A",
                    }}
                  >
                    {parseFloat(newRate) > 15 ? "+" : ""}
                    {(parseFloat(newRate || "15") - 15).toFixed(1)}%
                  </div>
                </div>
              </div>
              <div
                style={{
                  fontSize: 11.5,
                  color: "var(--text-muted)",
                  borderTop: "1px solid #F0EDE8",
                  paddingTop: 8,
                }}
              >
                Reason: {reason}
              </div>
            </div>
            <div
              style={{
                padding: "10px 14px",
                background: "#FEF2F2",
                border: "1px solid #FECACA",
                borderRadius: 8,
                fontSize: 12.5,
                color: "#B91C1C",
                marginBottom: 20,
              }}
            >
              <strong>Warning:</strong> This setting affects future financial
              calculations. All invoices created after this change will use the
              new rate.
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setShowConfirm(false)}
                className="btn-secondary"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={saving}
                style={{
                  flex: 1,
                  padding: "9px 0",
                  borderRadius: 8,
                  border: "none",
                  background: saving ? "#4A7C5A" : "#2B4D3A",
                  color: "#FFFFFF",
                  fontSize: 13.5,
                  fontWeight: 700,
                  cursor: saving ? "not-allowed" : "pointer",
                }}
              >
                {saving ? "Saving…" : "Confirm Change"}
              </button>
            </div>
          </div>
        </div>
      )}

      <AuditTrail entries={VAT_AUDIT} />
    </div>
  )
}

/* ── Pane: Pricing ─────────────────────────────────────── */
function PricingPane({ canEdit }: { canEdit: boolean }) {
  return (
    <div>
      <SectionHeader
        title="Pricing"
        sub="Per-kilogram selling prices by origin and roast level"
        badge="HIGH-IMPACT"
      />
      <div
        style={{
          padding: "10px 14px",
          background: "#EFF6FF",
          border: "1px solid #BFDBFE",
          borderRadius: 9,
          marginBottom: 20,
          fontSize: 12.5,
          color: "#1D4ED8",
        }}
      >
        Prices are backend-authoritative. The frontend never recalculates order
        amounts — PHP applies pricing on all transactions.
      </div>
      <div
        style={{
          border: "1px solid var(--border-neutral)",
          borderRadius: 10,
          overflow: "auto",
          marginBottom: 16,
        }}
      >
        <table
          style={{ width: "100%", borderCollapse: "collapse", minWidth: 620 }}
        >
          <thead>
            <tr style={{ background: "var(--surface-02)" }}>
              {[
                "Product",
                "Origin",
                "Roast",
                "Price / KG",
                "Effective From",
                "Last Updated",
                "Updated By",
              ].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "9px 14px",
                    textAlign: h === "Price / KG" ? "right" : "left",
                    fontSize: 10,
                    fontFamily: "DM Mono",
                    fontWeight: 700,
                    color: "var(--text-muted)",
                    letterSpacing: "0.07em",
                    textTransform: "uppercase",
                    borderBottom: "1px solid var(--border-neutral)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {h}
                </th>
              ))}
              {canEdit && (
                <th
                  style={{
                    padding: "9px 14px",
                    borderBottom: "1px solid var(--border-neutral)",
                  }}
                />
              )}
            </tr>
          </thead>
          <tbody>
            {PRICING_DATA.map((p, i) => (
              <tr
                key={p.id}
                style={{
                  borderBottom:
                    i < PRICING_DATA.length - 1 ? "1px solid #F0EDE8" : "none",
                  background: i % 2 === 0 ? "#FFFFFF" : "#FAFAF8",
                }}
              >
                <td
                  style={{
                    padding: "10px 14px",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                  }}
                >
                  {p.product}
                </td>
                <td
                  style={{
                    padding: "10px 14px",
                    fontSize: 12.5,
                    color: "var(--text-secondary)",
                  }}
                >
                  {p.origin}
                </td>
                <td
                  style={{
                    padding: "10px 14px",
                    fontSize: 12.5,
                    color: "var(--text-secondary)",
                  }}
                >
                  {p.roastLevel}
                </td>
                <td
                  style={{
                    padding: "10px 14px",
                    fontSize: 13,
                    fontFamily: "DM Mono",
                    fontWeight: 700,
                    color: "#2B4D3A",
                    textAlign: "right",
                  }}
                >
                  {p.pricePerKg}
                </td>
                <td
                  style={{
                    padding: "10px 14px",
                    fontSize: 11.5,
                    fontFamily: "DM Mono",
                    color: "var(--text-muted)",
                  }}
                >
                  {p.effectiveFrom}
                </td>
                <td
                  style={{
                    padding: "10px 14px",
                    fontSize: 11.5,
                    fontFamily: "DM Mono",
                    color: "var(--text-muted)",
                  }}
                >
                  {p.lastUpdated}
                </td>
                <td
                  style={{
                    padding: "10px 14px",
                    fontSize: 11.5,
                    color: "var(--text-muted)",
                  }}
                >
                  {p.updatedBy}
                </td>
                {canEdit && (
                  <td style={{ padding: "10px 14px" }}>
                    <button
                      className="btn-secondary"
                      style={{ fontSize: 11, padding: "3px 9px" }}
                    >
                      Edit
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ── Pane: Packaging ───────────────────────────────────── */
function PackagingPane({ canEdit }: { canEdit: boolean }) {
  const [items, setItems] = useState<PackagingItem[]>(PACKAGING_DATA)
  const toggle = (id: string) =>
    setItems((prev) =>
      prev.map((p) => (p.id === id ? { ...p, available: !p.available } : p)),
    )

  return (
    <div>
      <SectionHeader
        title="Packaging"
        sub="Packaging types, sizes, units, prices, and availability"
      />
      <div
        style={{
          border: "1px solid var(--border-neutral)",
          borderRadius: 10,
          overflow: "hidden",
          marginBottom: 16,
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--surface-02)" }}>
              {["Name", "Size", "Unit", "Cost Price", "Available"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "9px 14px",
                    textAlign: h === "Cost Price" ? "right" : "left",
                    fontSize: 10,
                    fontFamily: "DM Mono",
                    fontWeight: 700,
                    color: "var(--text-muted)",
                    letterSpacing: "0.07em",
                    textTransform: "uppercase",
                    borderBottom: "1px solid var(--border-neutral)",
                  }}
                >
                  {h}
                </th>
              ))}
              {canEdit && (
                <th
                  style={{
                    padding: "9px 14px",
                    borderBottom: "1px solid var(--border-neutral)",
                  }}
                />
              )}
            </tr>
          </thead>
          <tbody>
            {items.map((p, i) => (
              <tr
                key={p.id}
                style={{
                  borderBottom:
                    i < items.length - 1 ? "1px solid #F0EDE8" : "none",
                  opacity: p.available ? 1 : 0.55,
                }}
              >
                <td
                  style={{
                    padding: "10px 14px",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                  }}
                >
                  {p.name}
                </td>
                <td
                  style={{
                    padding: "10px 14px",
                    fontSize: 12.5,
                    fontFamily: "DM Mono",
                    color: "var(--text-secondary)",
                  }}
                >
                  {p.size}
                </td>
                <td
                  style={{
                    padding: "10px 14px",
                    fontSize: 12.5,
                    fontFamily: "DM Mono",
                    color: "var(--text-secondary)",
                  }}
                >
                  {p.unit}
                </td>
                <td
                  style={{
                    padding: "10px 14px",
                    fontSize: 12.5,
                    fontFamily: "DM Mono",
                    color: "var(--text-secondary)",
                    textAlign: "right",
                  }}
                >
                  {p.price}
                </td>
                <td style={{ padding: "10px 14px" }}>
                  {canEdit ? (
                    <Toggle value={p.available} onChange={() => toggle(p.id)} />
                  ) : (
                    <span
                      style={{
                        fontSize: 11.5,
                        fontFamily: "DM Mono",
                        fontWeight: 700,
                        color: p.available ? "#16A34A" : "#9CA3AF",
                      }}
                    >
                      {p.available ? "Active" : "Disabled"}
                    </span>
                  )}
                </td>
                {canEdit && (
                  <td style={{ padding: "10px 14px" }}>
                    <button
                      className="btn-secondary"
                      style={{ fontSize: 11, padding: "3px 9px" }}
                    >
                      Edit
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {canEdit && (
        <button
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            padding: "9px 16px",
            borderRadius: 8,
            border: "1.5px dashed #D0CEC6",
            background: "transparent",
            color: "var(--text-secondary)",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#F5F3EF"
            e.currentTarget.style.borderColor = "#2B4D3A"
            e.currentTarget.style.color = "#2B4D3A"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent"
            e.currentTarget.style.borderColor = "#D0CEC6"
            e.currentTarget.style.color = "#6B7280"
          }}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Packaging Type
        </button>
      )}
    </div>
  )
}

/* ── Pane: Expense Categories ──────────────────────────── */
function ExpenseCatsPane({ canEdit }: { canEdit: boolean }) {
  const [cats, setCats] = useState<ExpenseCategory[]>(EXPENSE_CATS)
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState("")

  const handleAdd = () => {
    if (!newName.trim()) return
    const id = `ec-${String(cats.length + 1).padStart(3, "0")}`
    setCats((prev) => [
      ...prev,
      {
        id,
        name: newName.trim(),
        status: "active",
        createdAt: "2026-08-10",
        usageCount: 0,
      },
    ])
    setNewName("")
    setAdding(false)
  }
  const toggleStatus = (id: string) =>
    setCats((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, status: c.status === "active" ? "disabled" : "active" }
          : c,
      ),
    )

  return (
    <div>
      <SectionHeader
        title="Expense Categories"
        sub="Classification categories for expenses — authorized users can add, edit, or disable"
      />
      <div
        style={{
          border: "1px solid var(--border-neutral)",
          borderRadius: 10,
          overflow: "hidden",
          marginBottom: 16,
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--surface-02)" }}>
              {["Category", "Status", "Created", "Usage"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "9px 14px",
                    textAlign: "left",
                    fontSize: 10,
                    fontFamily: "DM Mono",
                    fontWeight: 700,
                    color: "var(--text-muted)",
                    letterSpacing: "0.07em",
                    textTransform: "uppercase",
                    borderBottom: "1px solid var(--border-neutral)",
                  }}
                >
                  {h}
                </th>
              ))}
              <th
                style={{
                  padding: "9px 14px",
                  borderBottom: "1px solid var(--border-neutral)",
                }}
              />
            </tr>
          </thead>
          <tbody>
            {cats.map((c, i) => (
              <tr
                key={c.id}
                style={{
                  borderBottom:
                    i < cats.length - 1 ? "1px solid #F0EDE8" : "none",
                  background: i % 2 === 0 ? "#FFFFFF" : "#FAFAF8",
                  opacity: c.status === "disabled" ? 0.6 : 1,
                }}
              >
                <td
                  style={{
                    padding: "10px 14px",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                  }}
                >
                  {c.name}
                </td>
                <td style={{ padding: "10px 14px" }}>
                  <span
                    style={{
                      fontSize: 10.5,
                      fontFamily: "DM Mono",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: 4,
                      background: c.status === "active" ? "#F0FDF4" : "#F3F4F6",
                      color: c.status === "active" ? "#15803D" : "#6B7280",
                      border: `1px solid ${
                        c.status === "active" ? "#DCFCE7" : "#E5E7EB"
                      }`,
                    }}
                  >
                    {c.status === "active" ? "ACTIVE" : "DISABLED"}
                  </span>
                </td>
                <td
                  style={{
                    padding: "10px 14px",
                    fontSize: 11.5,
                    fontFamily: "DM Mono",
                    color: "var(--text-muted)",
                  }}
                >
                  {c.createdAt}
                </td>
                <td
                  style={{
                    padding: "10px 14px",
                    fontSize: 12.5,
                    fontFamily: "DM Mono",
                    color: "var(--text-secondary)",
                  }}
                >
                  {c.usageCount}
                </td>
                <td style={{ padding: "10px 14px" }}>
                  {canEdit && (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        className="btn-secondary"
                        style={{ fontSize: 11, padding: "3px 9px" }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => toggleStatus(c.id)}
                        style={{
                          fontSize: 11,
                          padding: "3px 9px",
                          borderRadius: 6,
                          border: `1px solid ${
                            c.status === "active" ? "#FECACA" : "#DCFCE7"
                          }`,
                          background: "transparent",
                          color: c.status === "active" ? "#DC2626" : "#16A34A",
                          cursor: "pointer",
                          fontFamily: "DM Mono",
                        }}
                      >
                        {c.status === "active" ? "Disable" : "Enable"}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {canEdit &&
        (adding ? (
          <div
            style={{
              padding: "16px",
              background: "var(--surface-02)",
              borderRadius: 10,
              border: "1.5px dashed #D0CEC6",
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text-primary)",
                marginBottom: 12,
              }}
            >
              New Expense Category
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: "#374151",
                    display: "block",
                    marginBottom: 5,
                  }}
                >
                  Category Name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Insurance"
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 7,
                    border: "1.5px solid var(--border-neutral)",
                    background: "var(--surface-01)",
                    fontSize: 13,
                    fontFamily: "Inter",
                    color: "var(--text-primary)",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <button
                onClick={handleAdd}
                disabled={!newName.trim()}
                className="btn-primary"
                style={{ fontSize: 12 }}
              >
                Add
              </button>
              <button
                onClick={() => {
                  setAdding(false)
                  setNewName("")
                }}
                className="btn-secondary"
                style={{ fontSize: 12 }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "9px 16px",
              borderRadius: 8,
              border: "1.5px dashed #D0CEC6",
              background: "transparent",
              color: "var(--text-secondary)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#F5F3EF"
              e.currentTarget.style.borderColor = "#2B4D3A"
              e.currentTarget.style.color = "#2B4D3A"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent"
              e.currentTarget.style.borderColor = "#D0CEC6"
              e.currentTarget.style.color = "#6B7280"
            }}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Expense Category
          </button>
        ))}
    </div>
  )
}

/* ── Pane: Locations ───────────────────────────────────── */
function LocationsPane() {
  const { isMobile } = useBreakpoint()
  const [locs, setLocs] = useState<Location[]>(LOCATIONS)
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState("")
  const [newCity, setNewCity] = useState("")
  const [newType, setNewType] = useState("Regional Office")

  const toggleActive = (id: string) =>
    setLocs((prev) =>
      prev.map((l) => (l.id === id ? { ...l, active: !l.active } : l)),
    )
  const handleAdd = () => {
    if (!newName.trim()) return
    setLocs((prev) => [
      ...prev,
      {
        id: `LOC-00${prev.length + 1}`,
        name: newName.trim(),
        city: newCity.trim() || "Addis Ababa",
        type: newType,
        active: true,
        isPrimary: false,
      },
    ])
    setNewName("")
    setNewCity("")
    setAdding(false)
  }

  return (
    <div>
      <SectionHeader
        title="Facility Locations"
        sub="Processing plants, warehouses and regional offices"
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          marginBottom: 16,
        }}
      >
        {locs.map((loc) => (
          <div
            key={loc.id}
            style={{
              padding: "14px 16px",
              background: "var(--bg-primary)",
              border: `1.5px solid ${loc.isPrimary ? "#2B4D3A40" : "#E5E3DC"}`,
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 9,
                background: loc.isPrimary ? "#2B4D3A" : "#F5F3EF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke={loc.isPrimary ? "#FFFFFF" : "#9CA3AF"}
                strokeWidth="1.75"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 7a3 3 0 100 6 3 3 0 000-6z" />
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 2,
                }}
              >
                <span
                  style={{
                    fontSize: 13.5,
                    fontWeight: 600,
                    color: loc.active ? "#1F2937" : "#9CA3AF",
                  }}
                >
                  {loc.name}
                </span>
                {loc.isPrimary && (
                  <span
                    style={{
                      fontSize: 10,
                      fontFamily: "DM Mono",
                      fontWeight: 700,
                      padding: "2px 6px",
                      borderRadius: 4,
                      background: "#2B4D3A",
                      color: "#FFFFFF",
                    }}
                  >
                    PRIMARY
                  </span>
                )}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--text-muted)",
                  fontFamily: "DM Mono",
                }}
              >
                {loc.city} · {loc.type}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                style={{
                  fontSize: 11.5,
                  fontFamily: "DM Mono",
                  fontWeight: 600,
                  color: loc.active ? "#16A34A" : "#9CA3AF",
                }}
              >
                {loc.active ? "Active" : "Inactive"}
              </span>
              {!loc.isPrimary && (
                <Toggle
                  value={loc.active}
                  onChange={() => toggleActive(loc.id)}
                />
              )}
            </div>
          </div>
        ))}
      </div>
      {adding ? (
        <div
          style={{
            padding: "16px",
            background: "var(--surface-02)",
            borderRadius: 10,
            border: "1.5px dashed #D0CEC6",
            marginBottom: 12,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text-primary)",
              marginBottom: 12,
            }}
          >
            Add New Location
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr",
              gap: 10,
              marginBottom: 12,
            }}
          >
            {([
              ["Location Name", newName, setNewName, "e.g. Jimma Hub"],
              ["City", newCity, setNewCity, "e.g. Jimma"],
            ] as [string, string, (v: string) => void, string][]).map(
              ([l, v, fn, ph]) => (
                <div key={l}>
                  <label
                    style={{
                      fontSize: 11.5,
                      fontWeight: 600,
                      color: "#374151",
                      display: "block",
                      marginBottom: 5,
                    }}
                  >
                    {l}
                  </label>
                  <input
                    type="text"
                    value={v}
                    onChange={(e) => fn(e.target.value)}
                    placeholder={ph}
                    style={{
                      width: "100%",
                      padding: "7px 9px",
                      borderRadius: 7,
                      border: "1px solid var(--border-neutral)",
                      background: "var(--surface-01)",
                      fontSize: 12.5,
                      fontFamily: "Inter",
                      color: "var(--text-primary)",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              ),
            )}
            <div>
              <label
                style={{
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: "#374151",
                  display: "block",
                  marginBottom: 5,
                }}
              >
                Type
              </label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                style={{
                  width: "100%",
                  padding: "7px 9px",
                  borderRadius: 7,
                  border: "1px solid var(--border-neutral)",
                  background: "var(--surface-01)",
                  fontSize: 12.5,
                  fontFamily: "Inter",
                  color: "var(--text-primary)",
                  outline: "none",
                  appearance: "none",
                }}
              >
                {[
                  "Primary Plant",
                  "Export Warehouse",
                  "Collection Hub",
                  "Regional Office",
                  "Field Office",
                ].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setAdding(false)}
              className="btn-secondary"
              style={{ fontSize: 12 }}
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              className="btn-primary"
              style={{ fontSize: 12 }}
            >
              Add Location
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          style={{
            width: "100%",
            padding: "11px",
            borderRadius: 10,
            border: "1.5px dashed #D0CEC6",
            background: "transparent",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text-secondary)",
            transition: "all 0.15s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 7,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#F5F3EF"
            e.currentTarget.style.borderColor = "#2B4D3A"
            e.currentTarget.style.color = "#2B4D3A"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent"
            e.currentTarget.style.borderColor = "#D0CEC6"
            e.currentTarget.style.color = "#6B7280"
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Facility Location
        </button>
      )}
    </div>
  )
}

/* ── Pane: System ──────────────────────────────────────── */
function SystemPane() {
  const [backups, setBackups] = useState<BackupRecord[]>(BACKUPS)
  const [retention, setRetention] = useState("30")
  const [snapshotRunning, setSnapshotRunning] = useState(false)
  const [snapshotDone, setSnapshotDone] = useState(false)
  const [progress, setProgress] = useState(0)
  const [telegram, setTelegram] = useState(true)
  const [sms, setSms] = useState(true)
  const [webhook, setWebhook] = useState(false)

  const triggerSnapshot = () => {
    setSnapshotRunning(true)
    setSnapshotDone(false)
    setProgress(0)
    const iv = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(iv)
          setSnapshotRunning(false)
          setSnapshotDone(true)
          setBackups((prev) => [
            {
              id: "BKP-0042",
              ts: "2026-08-10 14:22",
              size: "143 MB",
              status: "success",
              type: "manual",
            },
            ...prev,
          ])
          return 100
        }
        return p + Math.random() * 22
      })
    }, 150)
  }

  return (
    <div>
      <SectionHeader
        title="System"
        sub="Database backups, system health, and external service integrations"
      />

      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "var(--text-muted)",
          fontFamily: "DM Mono",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          paddingBottom: 8,
          marginBottom: 8,
          borderBottom: "2px solid #F0EDE8",
        }}
      >
        Database Backups
      </div>

      <div
        style={{
          padding: "14px 18px",
          background: "#F0FDF4",
          border: "1.5px solid #DCFCE7",
          borderRadius: 11,
          marginBottom: 18,
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 9,
            background: "#DCFCE7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#16A34A"
            strokeWidth="2"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "#15803D" }}>
            Last Backup Successful
          </div>
          <div
            style={{
              fontSize: 12,
              color: "#16A34A",
              marginTop: 2,
              fontFamily: "DM Mono",
            }}
          >
            {backups[0]?.ts} · {backups[0]?.size}
          </div>
        </div>
        <div
          style={{
            fontSize: 10,
            fontFamily: "DM Mono",
            fontWeight: 700,
            color: "#16A34A",
          }}
        >
          HEALTHY
        </div>
      </div>

      <SettingsRow
        label="Retention Policy"
        sub="How long to keep daily automated backups before pruning"
      >
        <SettingsSelect
          value={retention}
          onChange={setRetention}
          options={[
            { value: "7", label: "7 days" },
            { value: "14", label: "14 days" },
            { value: "30", label: "30 days" },
            { value: "90", label: "90 days (quarterly)" },
          ]}
        />
      </SettingsRow>

      <div
        style={{
          margin: "18px 0",
          padding: "16px 18px",
          background: "var(--bg-primary)",
          border: "1px solid var(--border-neutral)",
          borderRadius: 11,
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: 4,
          }}
        >
          Manual Snapshot
        </div>
        <div
          style={{
            fontSize: 12.5,
            color: "var(--text-secondary)",
            marginBottom: 14,
          }}
        >
          Trigger an immediate full database snapshot outside the automated
          schedule.
        </div>
        {snapshotRunning && (
          <div style={{ marginBottom: 14 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 11.5,
                fontFamily: "DM Mono",
                color: "var(--text-secondary)",
                marginBottom: 5,
              }}
            >
              <span>Creating snapshot…</span>
              <span>{Math.min(100, Math.round(progress))}%</span>
            </div>
            <div
              style={{
                height: 5,
                background: "var(--border-neutral)",
                borderRadius: 99,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${Math.min(100, progress)}%`,
                  background: "linear-gradient(90deg, #2B4D3A, #4A7C5A)",
                  borderRadius: 99,
                  transition: "width 0.15s ease",
                }}
              />
            </div>
          </div>
        )}
        <button
          onClick={triggerSnapshot}
          disabled={snapshotRunning}
          style={{
            padding: "9px 18px",
            borderRadius: 8,
            border: "none",
            background: snapshotRunning
              ? "#E5E3DC"
              : snapshotDone
                ? "#16A34A"
                : "#2B4D3A",
            color: snapshotRunning ? "#9CA3AF" : "#FFFFFF",
            fontSize: 13,
            fontWeight: 700,
            cursor: snapshotRunning ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: 7,
            transition: "all 0.2s",
            boxShadow: snapshotRunning
              ? "none"
              : "0 2px 8px rgba(43,77,58,0.2)",
          }}
        >
          {snapshotRunning
            ? "Creating Snapshot…"
            : snapshotDone
              ? "✓ Snapshot Complete"
              : "Trigger Instant Snapshot"}
        </button>
      </div>

      <div
        style={{
          border: "1px solid var(--border-neutral)",
          borderRadius: 10,
          overflow: "hidden",
          marginBottom: 28,
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--surface-02)" }}>
              {["Backup ID", "Timestamp", "Size", "Type", "Status"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "8px 14px",
                    textAlign: "left",
                    fontSize: 10,
                    fontFamily: "DM Mono",
                    fontWeight: 700,
                    color: "var(--text-muted)",
                    letterSpacing: "0.07em",
                    textTransform: "uppercase",
                    borderBottom: "1px solid var(--border-neutral)",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {backups.map((b, i) => (
              <tr
                key={b.id}
                style={{
                  borderBottom:
                    i < backups.length - 1 ? "1px solid #F0EDE8" : "none",
                  background: i % 2 === 0 ? "#FFFFFF" : "#FAFAF8",
                }}
              >
                <td
                  style={{
                    padding: "8px 14px",
                    fontSize: 11.5,
                    fontFamily: "DM Mono",
                    fontWeight: 700,
                    color: "#2B4D3A",
                  }}
                >
                  {b.id}
                </td>
                <td
                  style={{
                    padding: "8px 14px",
                    fontSize: 11.5,
                    fontFamily: "DM Mono",
                    color: "#374151",
                  }}
                >
                  {b.ts}
                </td>
                <td
                  style={{
                    padding: "8px 14px",
                    fontSize: 11.5,
                    fontFamily: "DM Mono",
                    color: "var(--text-secondary)",
                  }}
                >
                  {b.size}
                </td>
                <td style={{ padding: "8px 14px" }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontFamily: "DM Mono",
                      fontWeight: 700,
                      padding: "2px 6px",
                      borderRadius: 4,
                      background: b.type === "manual" ? "#EFF6FF" : "#F5F3EF",
                      color: b.type === "manual" ? "#1D4ED8" : "#6B7280",
                      border: `1px solid ${
                        b.type === "manual" ? "#BFDBFE" : "#E5E3DC"
                      }`,
                    }}
                  >
                    {b.type === "manual" ? "MANUAL" : "AUTO"}
                  </span>
                </td>
                <td style={{ padding: "8px 14px" }}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <div
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background:
                          b.status === "success"
                            ? "#16A34A"
                            : b.status === "failed"
                              ? "#DC2626"
                              : "#F59E0B",
                      }}
                    />
                    <span
                      style={{
                        fontSize: 11.5,
                        fontFamily: "DM Mono",
                        color:
                          b.status === "success"
                            ? "#16A34A"
                            : b.status === "failed"
                              ? "#DC2626"
                              : "#B45309",
                        fontWeight: 600,
                        textTransform: "capitalize",
                      }}
                    >
                      {b.status}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "var(--text-muted)",
          fontFamily: "DM Mono",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          paddingBottom: 8,
          marginBottom: 14,
          borderBottom: "2px solid #F0EDE8",
        }}
      >
        System Integrations
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {([
          {
            key: "telegram",
            label: "Telegram Bot Gateway",
            sub: "Order notifications and dispatch alerts",
            value: telegram,
            onChange: () => setTelegram((v) => !v),
            badge: "ACTIVE",
            bc: "#16A34A",
          },
          {
            key: "sms",
            label: "SMS Gateway (Ethio Telecom)",
            sub: "Customer delivery confirmations and OTP",
            value: sms,
            onChange: () => setSms((v) => !v),
            badge: "ACTIVE",
            bc: "#16A34A",
          },
          {
            key: "webhook",
            label: "Outbound Webhook",
            sub: "POST events to external BI or custom URLs",
            value: webhook,
            onChange: () => setWebhook((v) => !v),
            badge: "DISABLED",
            bc: "#9CA3AF",
          },
        ] as {
          key: string
          label: string
          sub: string
          value: boolean
          onChange: () => void
          badge: string
          bc: string
        }[]).map((int) => (
          <div
            key={int.key}
            style={{
              padding: "14px 16px",
              background: "var(--surface-01)",
              border: `1.5px solid ${int.value ? "#2B4D3A30" : "#E5E3DC"}`,
              borderRadius: 11,
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 3,
                }}
              >
                <span
                  style={{
                    fontSize: 13.5,
                    fontWeight: 700,
                    color: "var(--text-primary)",
                  }}
                >
                  {int.label}
                </span>
                <span
                  style={{
                    fontSize: 9.5,
                    fontFamily: "DM Mono",
                    fontWeight: 700,
                    padding: "2px 6px",
                    borderRadius: 4,
                    background: int.bc + "18",
                    color: int.bc,
                    border: `1px solid ${int.bc}40`,
                  }}
                >
                  {int.badge}
                </span>
              </div>
              <div style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>
                {int.sub}
              </div>
            </div>
            <Toggle value={int.value} onChange={int.onChange} />
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Main ──────────────────────────────────────────────── */
export default function Settings() {
  const { isDesktop, isNarrow } = useBreakpoint()
  const { currentUser } = useAuth()
  const role = currentUser?.role ?? "viewer"
  const maxWidthStyle = isDesktop ? { maxWidth: 1600, margin: "0 auto" } : {}
  const [activeTab, setActiveTab] = useState<TabId>("general")

  const canEditYield = can(role as any, "settings.yield.edit")
  const canEditVat = can(role as any, "settings.vat.edit")
  const canEditPricing = can(role as any, "settings.pricing.edit")
  const canEditPkg = can(role as any, "settings.packaging.edit")
  const canEditCats = can(role as any, "settings.expense-categories.edit")

  const PANES: Record<TabId, React.ReactNode> = {
    general: <GeneralPane />,
    yield: <YieldPane canEdit={canEditYield} />,
    vat: <VatPane canEdit={canEditVat} />,
    pricing: <PricingPane canEdit={canEditPricing} />,
    packaging: <PackagingPane canEdit={canEditPkg} />,
    "expense-cats": <ExpenseCatsPane canEdit={canEditCats} />,
    locations: <LocationsPane />,
    system: <SystemPane />,
  }

  return (
    <div
      className="page-enter"
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        ...maxWidthStyle,
      }}
    >
      <div
        style={{
          padding: "22px 28px 16px",
          borderBottom: "1px solid var(--border-neutral)",
          background: "var(--surface-01)",
          flexShrink: 0,
        }}
      >
        <div className="section-eyebrow">Governance</div>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: "var(--text-primary)",
            margin: "4px 0 4px",
            letterSpacing: "-0.025em",
          }}
        >
          Settings
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
          Manage configurable business rules and system preferences
        </p>
      </div>

      <div
        style={{
          flex: 1,
          display: isNarrow ? "block" : "flex",
          overflow: "hidden",
          overflowY: isNarrow ? "auto" : undefined,
        }}
      >
        {isNarrow ? (
          <div
            style={{
              background: "var(--surface-01)",
              borderBottom: "1px solid var(--border-neutral)",
              overflowX: "auto",
              display: "flex",
              padding: "8px 12px",
              gap: 6,
              WebkitOverflowScrolling: "touch" as any,
              scrollbarWidth: "none",
            }}
          >
            {TABS.map((tab) => {
              const active = tab.id === activeTab
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    flexShrink: 0,
                    padding: "7px 12px",
                    borderRadius: 8,
                    border: `1px solid ${
                      active ? "#2B4D3A20" : "var(--border-neutral)"
                    }`,
                    background: active ? "#F0FDF4" : "var(--surface-02)",
                    cursor: "pointer",
                    color: active ? "#2B4D3A" : "#6B7280",
                    whiteSpace: "nowrap",
                  }}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={active ? "#2B4D3A" : "#9CA3AF"}
                    strokeWidth="1.75"
                  >
                    {tab.icon
                      .split("M")
                      .filter(Boolean)
                      .map((s, i) => (
                        <path key={i} d={`M${s}`} />
                      ))}
                  </svg>
                  <span
                    style={{ fontSize: 12.5, fontWeight: active ? 600 : 500 }}
                  >
                    {tab.label}
                  </span>
                </button>
              )
            })}
          </div>
        ) : (
          <div
            style={{
              width: 224,
              minWidth: 224,
              background: "var(--surface-01)",
              borderRight: "1px solid var(--border-neutral)",
              padding: "14px 10px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {TABS.map((tab) => {
              const active = tab.id === activeTab
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    width: "100%",
                    padding: "9px 11px",
                    borderRadius: 8,
                    border: `1px solid ${active ? "#2B4D3A20" : "transparent"}`,
                    background: active ? "#F0FDF4" : "transparent",
                    cursor: "pointer",
                    textAlign: "left",
                    marginBottom: 3,
                    transition: "all 0.12s",
                    color: active ? "#2B4D3A" : "#6B7280",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) e.currentTarget.style.background = "#F5F3EF"
                  }}
                  onMouseLeave={(e) => {
                    if (!active)
                      e.currentTarget.style.background = "transparent"
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 7,
                      background: active ? "#2B4D3A" : "#F3F4F6",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      transition: "background 0.12s",
                    }}
                  >
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={active ? "#FFFFFF" : "#9CA3AF"}
                      strokeWidth="1.75"
                    >
                      {tab.icon
                        .split("M")
                        .filter(Boolean)
                        .map((s, i) => (
                          <path key={i} d={`M${s}`} />
                        ))}
                    </svg>
                  </div>
                  <span
                    style={{ fontSize: 13, fontWeight: active ? 600 : 500 }}
                  >
                    {tab.label}
                  </span>
                </button>
              )
            })}
            <div style={{ marginTop: "auto", paddingTop: 24, paddingLeft: 11 }}>
              <div
                style={{
                  fontSize: 10.5,
                  fontFamily: "DM Mono",
                  color: "#C4C2BA",
                }}
              >
                Flavor Coffee ERP
              </div>
              <div
                style={{
                  fontSize: 10,
                  fontFamily: "DM Mono",
                  color: "#D1D5DB",
                  marginTop: 2,
                }}
              >
                v4.2.1 · Build 2026.08.07
              </div>
            </div>
          </div>
        )}

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: isNarrow ? "20px 16px" : "28px 36px",
            background: "var(--bg-primary)",
          }}
        >
          <div style={{ maxWidth: 760 }}>{PANES[activeTab]}</div>
        </div>
      </div>
    </div>
  )
}
