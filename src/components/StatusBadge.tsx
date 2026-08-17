/**
 * Unified status badge — icon + semantic color + label.
 * Every status in the ERP must use this component so visual language is identical
 * across modules. Never use color alone (WCAG 2.1 AA).
 */
import type { FC, CSSProperties } from 'react'

export type StatusVariant =
  | 'completed'
  | 'paid'
  | 'verified'
  | 'available'
  | 'accepted'
  | 'pending'
  | 'in-progress'
  | 'reserved'
  | 'needs-review'
  | 'low-stock'
  | 'approaching-deadline'
  | 'awaiting'
  | 'insufficient'
  | 'overdue'
  | 'rejected'
  | 'disputed'
  | 'cancelled'
  | 'info'
  | 'roasting'
  | 'partially-paid'
  | 'ready'
  | 'draft'

interface StatusConfig {
  label: string
  color: string
  bg: string
  border: string
  darkColor: string
  darkBg: string
  darkBorder: string
  icon: string  // SVG path d attribute
}

const CONFIGS: Record<StatusVariant, StatusConfig> = {
  completed: {
    label: 'Completed',
    color: '#15803D', bg: '#DCFCE7', border: '#BBF7D0',
    darkColor: '#4ADE80', darkBg: 'rgba(34,197,94,0.12)', darkBorder: 'rgba(34,197,94,0.25)',
    icon: 'M20 6L9 17l-5-5',
  },
  paid: {
    label: 'Paid',
    color: '#15803D', bg: '#DCFCE7', border: '#BBF7D0',
    darkColor: '#4ADE80', darkBg: 'rgba(34,197,94,0.12)', darkBorder: 'rgba(34,197,94,0.25)',
    icon: 'M20 6L9 17l-5-5',
  },
  verified: {
    label: 'Verified',
    color: '#15803D', bg: '#DCFCE7', border: '#BBF7D0',
    darkColor: '#4ADE80', darkBg: 'rgba(34,197,94,0.12)', darkBorder: 'rgba(34,197,94,0.25)',
    icon: 'M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11',
  },
  available: {
    label: 'Available',
    color: '#15803D', bg: '#DCFCE7', border: '#BBF7D0',
    darkColor: '#4ADE80', darkBg: 'rgba(34,197,94,0.12)', darkBorder: 'rgba(34,197,94,0.25)',
    icon: 'M20 6L9 17l-5-5',
  },
  accepted: {
    label: 'Accepted',
    color: '#15803D', bg: '#DCFCE7', border: '#BBF7D0',
    darkColor: '#4ADE80', darkBg: 'rgba(34,197,94,0.12)', darkBorder: 'rgba(34,197,94,0.25)',
    icon: 'M20 6L9 17l-5-5',
  },
  ready: {
    label: 'Ready for Delivery',
    color: '#15803D', bg: '#DCFCE7', border: '#BBF7D0',
    darkColor: '#4ADE80', darkBg: 'rgba(34,197,94,0.12)', darkBorder: 'rgba(34,197,94,0.25)',
    icon: 'M20 6L9 17l-5-5',
  },
  pending: {
    label: 'Pending',
    color: '#1D4ED8', bg: '#DBEAFE', border: '#BFDBFE',
    darkColor: '#93C5FD', darkBg: 'rgba(96,165,250,0.12)', darkBorder: 'rgba(96,165,250,0.25)',
    icon: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 6v6l4 2',
  },
  awaiting: {
    label: 'Awaiting',
    color: '#1D4ED8', bg: '#DBEAFE', border: '#BFDBFE',
    darkColor: '#93C5FD', darkBg: 'rgba(96,165,250,0.12)', darkBorder: 'rgba(96,165,250,0.25)',
    icon: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 6v6l4 2',
  },
  'in-progress': {
    label: 'In Progress',
    color: '#1D4ED8', bg: '#DBEAFE', border: '#BFDBFE',
    darkColor: '#93C5FD', darkBg: 'rgba(96,165,250,0.12)', darkBorder: 'rgba(96,165,250,0.25)',
    icon: 'M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83',
  },
  reserved: {
    label: 'Green Reserved',
    color: '#1D4ED8', bg: '#DBEAFE', border: '#BFDBFE',
    darkColor: '#93C5FD', darkBg: 'rgba(96,165,250,0.12)', darkBorder: 'rgba(96,165,250,0.25)',
    icon: 'M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z',
  },
  roasting: {
    label: 'Roasting',
    color: '#B45309', bg: '#FEF3C7', border: '#FDE68A',
    darkColor: '#FCD34D', darkBg: 'rgba(251,191,36,0.12)', darkBorder: 'rgba(251,191,36,0.25)',
    icon: 'M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 3z',
  },
  'needs-review': {
    label: 'Needs Review',
    color: '#B45309', bg: '#FEF3C7', border: '#FDE68A',
    darkColor: '#FCD34D', darkBg: 'rgba(251,191,36,0.12)', darkBorder: 'rgba(251,191,36,0.25)',
    icon: 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01',
  },
  'low-stock': {
    label: 'Low Stock',
    color: '#B45309', bg: '#FEF3C7', border: '#FDE68A',
    darkColor: '#FCD34D', darkBg: 'rgba(251,191,36,0.12)', darkBorder: 'rgba(251,191,36,0.25)',
    icon: 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01',
  },
  'approaching-deadline': {
    label: 'Approaching Deadline',
    color: '#B45309', bg: '#FEF3C7', border: '#FDE68A',
    darkColor: '#FCD34D', darkBg: 'rgba(251,191,36,0.12)', darkBorder: 'rgba(251,191,36,0.25)',
    icon: 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01',
  },
  'partially-paid': {
    label: 'Partially Paid',
    color: '#B45309', bg: '#FEF3C7', border: '#FDE68A',
    darkColor: '#FCD34D', darkBg: 'rgba(251,191,36,0.12)', darkBorder: 'rgba(251,191,36,0.25)',
    icon: 'M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6',
  },
  insufficient: {
    label: 'Insufficient Stock',
    color: '#B91C1C', bg: '#FEE2E2', border: '#FECACA',
    darkColor: '#FCA5A5', darkBg: 'rgba(248,113,113,0.12)', darkBorder: 'rgba(248,113,113,0.25)',
    icon: 'M18 6L6 18M6 6l12 12',
  },
  overdue: {
    label: 'Overdue',
    color: '#B91C1C', bg: '#FEE2E2', border: '#FECACA',
    darkColor: '#FCA5A5', darkBg: 'rgba(248,113,113,0.12)', darkBorder: 'rgba(248,113,113,0.25)',
    icon: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 8v4M12 16h.01',
  },
  rejected: {
    label: 'Rejected',
    color: '#B91C1C', bg: '#FEE2E2', border: '#FECACA',
    darkColor: '#FCA5A5', darkBg: 'rgba(248,113,113,0.12)', darkBorder: 'rgba(248,113,113,0.25)',
    icon: 'M18 6L6 18M6 6l12 12',
  },
  disputed: {
    label: 'Disputed',
    color: '#B91C1C', bg: '#FEE2E2', border: '#FECACA',
    darkColor: '#FCA5A5', darkBg: 'rgba(248,113,113,0.12)', darkBorder: 'rgba(248,113,113,0.25)',
    icon: 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01',
  },
  cancelled: {
    label: 'Cancelled',
    color: '#4B5563', bg: '#F3F4F6', border: '#E5E7EB',
    darkColor: '#D1D5DB', darkBg: 'rgba(107,114,128,0.12)', darkBorder: 'rgba(107,114,128,0.25)',
    icon: 'M18 6L6 18M6 6l12 12',
  },
  draft: {
    label: 'Draft',
    color: '#4B5563', bg: '#F3F4F6', border: '#E5E7EB',
    darkColor: '#D1D5DB', darkBg: 'rgba(107,114,128,0.12)', darkBorder: 'rgba(107,114,128,0.25)',
    icon: 'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z',
  },
  info: {
    label: 'Info',
    color: '#1D4ED8', bg: '#DBEAFE', border: '#BFDBFE',
    darkColor: '#93C5FD', darkBg: 'rgba(96,165,250,0.12)', darkBorder: 'rgba(96,165,250,0.25)',
    icon: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 16v-4M12 8h.01',
  },
}

interface StatusBadgeProps {
  variant: StatusVariant
  /** Override label text */
  label?: string
  size?: 'sm' | 'md'
  style?: CSSProperties
}

export const StatusBadge: FC<StatusBadgeProps> = ({ variant, label, size = 'md', style }) => {
  const cfg = CONFIGS[variant]
  const iconSize = size === 'sm' ? 10 : 12
  const fontSize = size === 'sm' ? 11 : 12
  const padding = size === 'sm' ? '2px 7px' : '3px 9px'
  const gap = size === 'sm' ? 4 : 5

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap,
        padding,
        borderRadius: 999,
        fontSize,
        fontWeight: 500,
        lineHeight: '16px',
        whiteSpace: 'nowrap',
        letterSpacing: '0.01em',
        fontFamily: 'Inter, sans-serif',
        background: `var(--status-bg, ${cfg.bg})`,
        color: `var(--status-color, ${cfg.color})`,
        border: `1px solid var(--status-border, ${cfg.border})`,
        ...style,
      } as CSSProperties}
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ flexShrink: 0 }}
      >
        <path d={cfg.icon} />
      </svg>
      {label ?? cfg.label}
    </span>
  )
}

export default StatusBadge
