/* Centralized order-status mapping — single source of truth.
   All components must import from here. Never write status strings inline.
   When PHP introduces a new status, add it here and it propagates everywhere. */

export type OrderStatusKey =
  | 'pending-confirmation'
  | 'confirmed'
  | 'stock-shortage'
  | 'roasting'
  | 'awaiting-storekeeper'
  | 'roasted-needs-review'
  | 'packing'
  | 'packing-needs-review'
  | 'ready-for-delivery'
  | 'partially-delivered'
  | 'awaiting-customer-confirmation'
  | 'fully-delivered'
  | 'payment-pending'
  | 'partially-paid'
  | 'overdue'
  | 'paid'
  | 'completed'
  | 'cancelled'

export type FeasibilityKey = 'safe' | 'warning' | 'insufficient'
export type PaymentStatusKey = 'pending' | 'partial' | 'paid' | 'overdue'

export interface StatusConfig {
  label: string
  color: string
  bg: string
  border: string
  bar: string
  iconPath: string
  group: 'pending' | 'active' | 'warning' | 'financial' | 'terminal'
  description: string
}

export const ORDER_STATUS_MAP: Record<OrderStatusKey, StatusConfig> = {
  'pending-confirmation': {
    label: 'Pending Confirmation', color: '#B45309', bg: '#FFFBEB', border: '#FDE68A', bar: '#F59E0B',
    iconPath: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 8v4M12 16h.01',
    group: 'pending', description: 'Awaiting manager review and confirmation.',
  },
  'confirmed': {
    label: 'Confirmed', color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE', bar: '#2563EB',
    iconPath: 'M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11',
    group: 'active', description: 'Confirmed and green coffee reserved.',
  },
  'stock-shortage': {
    label: 'Stock Shortage', color: '#B91C1C', bg: '#FEF2F2', border: '#FCA5A5', bar: '#DC2626',
    iconPath: 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01',
    group: 'warning', description: 'Awaiting managerial decision due to insufficient stock.',
  },
  'roasting': {
    label: 'Roasting', color: '#92400E', bg: '#FFFBEB', border: '#FDE68A', bar: '#D97706',
    iconPath: 'M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0',
    group: 'active', description: 'Green coffee is currently being roasted.',
  },
  'awaiting-storekeeper': {
    label: 'Awaiting Storekeeper', color: '#6D28D9', bg: '#F5F3FF', border: '#DDD6FE', bar: '#7C3AED',
    iconPath: 'M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z',
    group: 'active', description: 'Roasting complete. Storekeeper must accept roasted output.',
  },
  'roasted-needs-review': {
    label: 'Roasted — Needs Review', color: '#B45309', bg: '#FFFBEB', border: '#FDE68A', bar: '#F59E0B',
    iconPath: 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01',
    group: 'warning', description: 'Output weight discrepancy. Manager review required.',
  },
  'packing': {
    label: 'Packing', color: '#0E7490', bg: '#ECFEFF', border: '#A5F3FC', bar: '#0891B2',
    iconPath: 'M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 3H8L6 7h12l-2-4z',
    group: 'active', description: 'Roasted coffee is being packed for delivery.',
  },
  'packing-needs-review': {
    label: 'Packing — Needs Review', color: '#B45309', bg: '#FFFBEB', border: '#FDE68A', bar: '#F59E0B',
    iconPath: 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01',
    group: 'warning', description: 'Packing weight discrepancy. Manager review required.',
  },
  'ready-for-delivery': {
    label: 'Ready for Delivery', color: '#15803D', bg: '#F0FDF4', border: '#86EFAC', bar: '#16A34A',
    iconPath: 'M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11',
    group: 'active', description: 'Order is packed and ready for the delivery team.',
  },
  'partially-delivered': {
    label: 'Partially Delivered', color: '#0369A1', bg: '#F0F9FF', border: '#BAE6FD', bar: '#0284C7',
    iconPath: 'M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM5.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM18.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5z',
    group: 'active', description: 'Some deliveries complete; remaining scheduled.',
  },
  'awaiting-customer-confirmation': {
    label: 'Awaiting Customer Confirmation', color: '#B45309', bg: '#FFFBEB', border: '#FDE68A', bar: '#F59E0B',
    iconPath: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 8v4M12 16h.01',
    group: 'active', description: 'Awaiting customer receipt confirmation.',
  },
  'fully-delivered': {
    label: 'Fully Delivered', color: '#15803D', bg: '#F0FDF4', border: '#86EFAC', bar: '#16A34A',
    iconPath: 'M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3',
    group: 'financial', description: 'All deliveries verified. Awaiting payment.',
  },
  'payment-pending': {
    label: 'Payment Pending', color: '#B45309', bg: '#FFFBEB', border: '#FDE68A', bar: '#F59E0B',
    iconPath: 'M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6',
    group: 'financial', description: 'Delivered. Awaiting full payment.',
  },
  'partially-paid': {
    label: 'Partially Paid', color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE', bar: '#2563EB',
    iconPath: 'M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6',
    group: 'financial', description: 'Partial payment received. Remaining balance outstanding.',
  },
  'overdue': {
    label: 'Overdue', color: '#B91C1C', bg: '#FEF2F2', border: '#FCA5A5', bar: '#DC2626',
    iconPath: 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01',
    group: 'financial', description: 'Payment deadline has passed.',
  },
  'paid': {
    label: 'Paid', color: '#15803D', bg: '#F0FDF4', border: '#86EFAC', bar: '#16A34A',
    iconPath: 'M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3',
    group: 'terminal', description: 'Fully paid.',
  },
  'completed': {
    label: 'Completed', color: '#15803D', bg: '#F0FDF4', border: '#86EFAC', bar: '#16A34A',
    iconPath: 'M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3',
    group: 'terminal', description: 'Order fully delivered and paid. No further action required.',
  },
  'cancelled': {
    label: 'Cancelled', color: '#6B7280', bg: '#F9FAFB', border: '#E5E7EB', bar: '#9CA3AF',
    iconPath: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636',
    group: 'terminal', description: 'This order has been cancelled.',
  },
}

export const FEASIBILITY_MAP: Record<FeasibilityKey, { label: string; color: string; bg: string; border: string; iconPath: string; description: string }> = {
  safe: {
    label: 'Safe to Fulfil',
    color: '#15803D', bg: '#F0FDF4', border: '#86EFAC',
    iconPath: 'M9 11l3 3L22 4',
    description: 'Sufficient green coffee is available for this order.',
  },
  warning: {
    label: 'Approaching Limit',
    color: '#B45309', bg: '#FFFBEB', border: '#FDE68A',
    iconPath: 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01',
    description: 'Order can be fulfilled, but stock is approaching the minimum threshold.',
  },
  insufficient: {
    label: 'Stock Insufficient',
    color: '#B91C1C', bg: '#FEF2F2', border: '#FCA5A5',
    iconPath: 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01',
    description: 'Insufficient green coffee is currently available to safely fulfil this order.',
  },
}

export const PAYMENT_STATUS_MAP: Record<PaymentStatusKey, { label: string; color: string; bg: string; border: string }> = {
  pending:  { label: 'Payment Pending',  color: '#B45309', bg: '#FFFBEB', border: '#FDE68A' },
  partial:  { label: 'Partially Paid',   color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE' },
  paid:     { label: 'Paid',             color: '#15803D', bg: '#F0FDF4', border: '#86EFAC' },
  overdue:  { label: 'Overdue',          color: '#B91C1C', bg: '#FEF2F2', border: '#FCA5A5' },
}

/** Safely resolve a backend status string to a config — fallback for unknown values */
export function getStatusConfig(status: string): StatusConfig {
  return ORDER_STATUS_MAP[status as OrderStatusKey] ?? {
    label: status,
    color: '#6B7280', bg: '#F9FAFB', border: '#E5E7EB', bar: '#9CA3AF',
    iconPath: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z',
    group: 'active' as const,
    description: '',
  }
}
