/**
 * Avatar — initials or image, optional online/away/offline dot.
 * Use for employees, customers, user accounts throughout the ERP.
 */
import type { FC, CSSProperties } from "react"

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl"
type AvatarStatus = "online" | "away" | "offline" | "busy"

const SIZE: Record<AvatarSize, {
  box: number
  font: number
  dot: number
  dotOffset: number
  radius: number
}> = {
  xs: { box: 24, font: 9, dot: 7, dotOffset: -1, radius: 6 },
  sm: { box: 32, font: 11, dot: 8, dotOffset: -1, radius: 8 },
  md: { box: 40, font: 13, dot: 10, dotOffset: -1, radius: 10 },
  lg: { box: 48, font: 15, dot: 11, dotOffset: -1, radius: 12 },
  xl: { box: 64, font: 18, dot: 13, dotOffset: -2, radius: 16 },
}

const STATUS_COLOR: Record<AvatarStatus, string> = {
  online: "#16A34A",
  away: "#D97706",
  offline: "#9CA3AF",
  busy: "#DC2626",
}

function initials(name?: string): string {
  if (!name) return "?"
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

interface AvatarProps {
  name?: string
  src?: string
  color?: string
  size?: AvatarSize
  status?: AvatarStatus
  style?: CSSProperties
  /** Override initials text (e.g. already-computed "AG") */
  monogram?: string
}

export const Avatar: FC<AvatarProps> = ({
  name,
  src,
  color = "#2B4D3A",
  size = "md",
  status,
  style,
  monogram,
}) => {
  const s = SIZE[size]
  return (
    <div
      style={{
        position: "relative",
        display: "inline-flex",
        flexShrink: 0,
        ...style,
      }}
    >
      {src ? (
        <img
          src={src}
          alt={name ?? "Avatar"}
          style={{
            width: s.box,
            height: s.box,
            borderRadius: s.radius,
            objectFit: "cover",
            border: "2px solid var(--border-neutral)",
            display: "block",
          }}
        />
      ) : (
        <div
          style={{
            width: s.box,
            height: s.box,
            borderRadius: s.radius,
            background: `linear-gradient(135deg, ${color}CC, ${color})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: s.font,
            fontWeight: 700,
            color: "#fff",
            fontFamily: "Inter, sans-serif",
            border: "2px solid var(--border-neutral)",
            userSelect: "none",
            letterSpacing: "0.02em",
          }}
        >
          {monogram ?? initials(name)}
        </div>
      )}

      {status && (
        <span
          style={{
            position: "absolute",
            bottom: s.dotOffset,
            right: s.dotOffset,
            width: s.dot,
            height: s.dot,
            borderRadius: "50%",
            background: STATUS_COLOR[status],
            border: "2px solid var(--surface-01)",
            display: "block",
          }}
          aria-label={status}
        />
      )}
    </div>
  )
}

/** Stacked avatar group (overlapping) */
interface AvatarGroupProps {
  users: Array<{ name?: string color?: string monogram?: string }>
  max?: number
  size?: AvatarSize
}

export const AvatarGroup: FC<AvatarGroupProps> = ({
  users,
  max = 4,
  size = "sm",
}) => {
  const shown = users.slice(0, max)
  const hidden = users.length - shown.length
  const s = SIZE[size]
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {shown.map((u, i) => (
        <div
          key={i}
          style={{
            marginLeft: i > 0 ? -(s.box * 0.3) : 0,
            position: "relative",
            zIndex: shown.length - i,
          }}
        >
          <Avatar
            name={u.name}
            color={u.color}
            monogram={u.monogram}
            size={size}
            style={{
              border: "2px solid var(--surface-01)",
              borderRadius: SIZE[size].radius + 2,
            }}
          />
        </div>
      ))}
      {hidden > 0 && (
        <div
          style={{
            marginLeft: -(s.box * 0.3),
            width: s.box,
            height: s.box,
            borderRadius: s.radius,
            background: "var(--surface-02)",
            border: "2px solid var(--border-neutral)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: s.font,
            fontWeight: 600,
            color: "var(--text-secondary)",
            fontFamily: "DM Mono, monospace",
          }}
        >
          +{hidden}
        </div>
      )}
    </div>
  )
}

export default Avatar
