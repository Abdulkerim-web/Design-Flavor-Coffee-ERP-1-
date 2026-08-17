import type { FC, CSSProperties } from "react"

interface SkeletonProps {
  width?: number | string
  height?: number | string
  borderRadius?: number | string
  style?: CSSProperties
}

export const Skeleton: FC<SkeletonProps> = ({
  width = "100%",
  height = 16,
  borderRadius = 6,
  style,
}) => (
  <div
    className="skeleton-shimmer"
    style={{
      width,
      height,
      borderRadius,
      background: "var(--surface-02)",
      flexShrink: 0,
      ...style,
    }}
  />
)

export const SkeletonKPICard: FC = () => (
  <div
    style={{
      background: "var(--surface-01)",
      border: "1px solid var(--border-neutral)",
      borderRadius: 10,
      padding: "18px 20px",
      display: "flex",
      flexDirection: "column",
      gap: 12,
    }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
      }}
    >
      <Skeleton width={80} height={11} borderRadius={4} />
      <Skeleton width={32} height={32} borderRadius={8} />
    </div>
    <Skeleton width={120} height={28} borderRadius={6} />
    <Skeleton width={90} height={10} borderRadius={4} />
  </div>
)

export const SkeletonTableRow: FC<{ cols?: number }> = ({ cols = 5 }) => (
  <div
    style={{
      display: "flex",
      gap: 16,
      alignItems: "center",
      padding: "12px 16px",
      borderBottom: "1px solid var(--border-neutral)",
    }}
  >
    {Array.from({ length: cols }, (_, i) => (
      <Skeleton
        key={i}
        width={i === 0 ? 120 : i === cols - 1 ? 64 : "100%"}
        height={12}
        borderRadius={4}
      />
    ))}
  </div>
)

export const SkeletonDashboard: FC = () => (
  <div
    style={{
      padding: "28px 32px",
      display: "flex",
      flexDirection: "column",
      gap: 24,
    }}
  >
    {/* KPI row */}
    <div
      style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}
    >
      {[0, 1, 2, 3].map((i) => (
        <SkeletonKPICard key={i} />
      ))}
    </div>
    {/* Two panels */}
    <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 16 }}>
      <div
        style={{
          background: "var(--surface-01)",
          border: "1px solid var(--border-neutral)",
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "14px 18px",
            borderBottom: "1px solid var(--border-neutral)",
          }}
        >
          <Skeleton width={140} height={13} />
        </div>
        {[0, 1, 2, 3, 4].map((i) => (
          <SkeletonTableRow key={i} cols={4} />
        ))}
      </div>
      <div
        style={{
          background: "var(--surface-01)",
          border: "1px solid var(--border-neutral)",
          borderRadius: 10,
          padding: 18,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <Skeleton width={100} height={13} />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            style={{ display: "flex", gap: 10, alignItems: "center" }}
          >
            <Skeleton width={32} height={32} borderRadius={8} />
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <Skeleton width="70%" height={11} borderRadius={4} />
              <Skeleton width="45%" height={9} borderRadius={4} />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
)
