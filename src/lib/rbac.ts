/**
 * SECURITY NOTE: This file is the client-side RBAC layer — used only for UI filtering
 * (hiding menu items, showing EmptyState for unauthorised routes). It is NOT a security
 * boundary. Real access control MUST be enforced server-side on every API endpoint.
 * Never trust the client-side matrix as the authoritative permission check.
 */

export type RoleId =
  | 'general-manager'
  | 'vice-manager'
  | 'sales-rep'
  | 'inventory-manager'
  | 'head-roaster'
  | 'accountant'
  | 'delivery-staff'

export type Scope = 'create' | 'read' | 'update' | 'delete' | 'approve'

export type ModuleKey =
  | 'user-admin'
  | 'customers'
  | 'orders'
  | 'roasting'
  | 'green-inventory'
  | 'packing'
  | 'delivery'
  | 'finance'
  | 'payments'
  | 'banking'
  | 'expenses'
  | 'payroll'
  | 'reports'
  | 'approvals'
  | 'notifications'
  // Legacy keys kept for existing pages (quality, audit, etc.)
  | 'quality-control'
  | 'roasting-exec'
  | 'finance-ledger'
  | 'audit-logs'
  | 'packaging'

export type Status = 'active' | 'disabled'

export interface User {
  id: string
  name: string
  email: string
  role: RoleId
  status: Status
  lastActive: string
  avatar: string
  avatarColor: string
  department: string
  createdAt: string
}

export const ROLES: Record<RoleId, { label: string; color: string; bg: string; border: string; tier: number }> = {
  'general-manager':   { label: 'General Manager',      color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE', tier: 1 },
  'vice-manager':      { label: 'Vice Manager',          color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE', tier: 2 },
  'sales-rep':         { label: 'Sales Representative',  color: '#0E7490', bg: '#ECFEFF', border: '#A5F3FC', tier: 3 },
  'inventory-manager': { label: 'Storekeeper',           color: '#B45309', bg: '#FFFBEB', border: '#FDE68A', tier: 3 },
  'head-roaster':      { label: 'Head Roaster',          color: '#92400E', bg: '#FFF7ED', border: '#FED7AA', tier: 4 },
  'accountant':        { label: 'Accountant',            color: '#BE185D', bg: '#FDF2F8', border: '#FBCFE8', tier: 4 },
  'delivery-staff':    { label: 'Delivery Staff',        color: '#065F46', bg: '#ECFDF5', border: '#A7F3D0', tier: 5 },
}

export type PermMatrix = Record<RoleId, Record<ModuleKey, Partial<Record<Scope, boolean>>>>

const grantAll  = (): Partial<Record<Scope, boolean>> => ({ create: true, read: true, update: true, delete: true, approve: true })
const readOnly  = (): Partial<Record<Scope, boolean>> => ({ read: true })
const opOnly    = (): Partial<Record<Scope, boolean>> => ({ read: true, update: true })
const none      = (): Partial<Record<Scope, boolean>> => ({})

export const INITIAL_MATRIX: PermMatrix = {
  'general-manager': {
    'user-admin':      grantAll(),
    'customers':       grantAll(),
    'orders':          grantAll(),
    'roasting':        grantAll(),
    'green-inventory': grantAll(),
    'packing':         grantAll(),
    'delivery':        grantAll(),
    'finance':         grantAll(),
    'payments':        grantAll(),
    'banking':         grantAll(),
    'expenses':        grantAll(),
    'payroll':         grantAll(),
    'reports':         grantAll(),
    'approvals':       grantAll(),
    'notifications':   readOnly(),
    // legacy
    'quality-control': grantAll(),
    'roasting-exec':   grantAll(),
    'finance-ledger':  grantAll(),
    'audit-logs':      grantAll(),
    'packaging':       grantAll(),
  },
  'vice-manager': {
    'user-admin':      readOnly(),
    'customers':       grantAll(),
    'orders':          grantAll(),
    'roasting':        opOnly(),
    'green-inventory': grantAll(),
    'packing':         grantAll(),
    'delivery':        grantAll(),
    'finance':         { read: true, approve: true },
    'payments':        readOnly(),
    'banking':         readOnly(),
    'expenses':        readOnly(),
    'payroll':         none(),
    'reports':         grantAll(),
    'approvals':       grantAll(),
    'notifications':   readOnly(),
    'quality-control': grantAll(),
    'roasting-exec':   opOnly(),
    'finance-ledger':  { read: true, approve: true },
    'audit-logs':      readOnly(),
    'packaging':       grantAll(),
  },
  'sales-rep': {
    'user-admin':      none(),
    'customers':       { create: true, read: true, update: true },
    'orders':          { create: true, read: true, update: true },
    'roasting':        none(),
    'green-inventory': none(),
    'packing':         none(),
    'delivery':        readOnly(),
    'finance':         none(),
    'payments':        none(),
    'banking':         none(),
    'expenses':        none(),
    'payroll':         none(),
    'reports':         none(),
    'approvals':       none(),
    'notifications':   readOnly(),
    'quality-control': none(),
    'roasting-exec':   none(),
    'finance-ledger':  none(),
    'audit-logs':      none(),
    'packaging':       none(),
  },
  'inventory-manager': {
    'user-admin':      none(),
    'customers':       none(),
    'orders':          readOnly(),
    'roasting':        readOnly(),
    'green-inventory': { create: true, read: true, update: true },
    'packing':         { read: true, update: true },
    'delivery':        readOnly(),
    'finance':         none(),
    'payments':        none(),
    'banking':         none(),
    'expenses':        none(),
    'payroll':         none(),
    'reports':         readOnly(),
    'approvals':       none(),
    'notifications':   readOnly(),
    'quality-control': opOnly(),
    'roasting-exec':   readOnly(),
    'finance-ledger':  none(),
    'audit-logs':      readOnly(),
    'packaging':       { read: true, update: true },
  },
  'head-roaster': {
    'user-admin':      none(),
    'customers':       none(),
    'orders':          readOnly(),
    'roasting':        { read: true, update: true, approve: true },
    'green-inventory': readOnly(),
    'packing':         readOnly(),
    'delivery':        none(),
    'finance':         none(),
    'payments':        none(),
    'banking':         none(),
    'expenses':        none(),
    'payroll':         none(),
    'reports':         readOnly(),
    'approvals':       none(),
    'notifications':   readOnly(),
    'quality-control': readOnly(),
    'roasting-exec':   { read: true, update: true, approve: true },
    'finance-ledger':  none(),
    'audit-logs':      none(),
    'packaging':       readOnly(),
  },
  'accountant': {
    'user-admin':      none(),
    'customers':       readOnly(),
    'orders':          readOnly(),
    'roasting':        none(),
    'green-inventory': readOnly(),
    'packing':         none(),
    'delivery':        none(),
    'finance':         { create: true, read: true, update: true, approve: true },
    'payments':        { create: true, read: true, update: true, approve: true },
    'banking':         { create: true, read: true, update: true },
    'expenses':        { create: true, read: true, update: true, approve: true },
    'payroll':         { create: true, read: true, update: true },
    'reports':         { read: true, create: true },
    'approvals':       none(),
    'notifications':   readOnly(),
    'quality-control': none(),
    'roasting-exec':   none(),
    'finance-ledger':  { create: true, read: true, update: true, approve: true },
    'audit-logs':      readOnly(),
    'packaging':       none(),
  },
  'delivery-staff': {
    'user-admin':      none(),
    'customers':       none(),
    'orders':          readOnly(),
    'roasting':        none(),
    'green-inventory': none(),
    'packing':         readOnly(),
    'delivery':        { read: true, update: true },
    'finance':         none(),
    'payments':        none(),
    'banking':         none(),
    'expenses':        none(),
    'payroll':         none(),
    'reports':         none(),
    'approvals':       none(),
    'notifications':   readOnly(),
    'quality-control': none(),
    'roasting-exec':   none(),
    'finance-ledger':  none(),
    'audit-logs':      none(),
    'packaging':       readOnly(),
  },
}

export const LOCKED_CELLS: Partial<Record<RoleId, Partial<Record<ModuleKey, Partial<Record<Scope, boolean>>>>>> = {
  'head-roaster': {
    'finance':      { create: true, read: true, update: true, delete: true, approve: true },
    'payments':     { create: true, read: true, update: true, delete: true, approve: true },
    'payroll':      { create: true, read: true, update: true, delete: true, approve: true },
    'user-admin':   { create: true, read: true, update: true, delete: true, approve: true },
    'audit-logs':   { create: true, read: true, update: true, delete: true, approve: true },
  },
  'delivery-staff': {
    'finance':         { create: true, read: true, update: true, delete: true, approve: true },
    'payments':        { create: true, read: true, update: true, delete: true, approve: true },
    'banking':         { create: true, read: true, update: true, delete: true, approve: true },
    'expenses':        { create: true, read: true, update: true, delete: true, approve: true },
    'payroll':         { create: true, read: true, update: true, delete: true, approve: true },
    'user-admin':      { create: true, read: true, update: true, delete: true, approve: true },
    'audit-logs':      { create: true, read: true, update: true, delete: true, approve: true },
    'quality-control': { create: true, read: true, update: true, delete: true, approve: true },
    'roasting':        { create: true, read: true, update: true, delete: true, approve: true },
  },
  'sales-rep': {
    'finance':    { create: true, read: true, update: true, delete: true, approve: true },
    'payments':   { create: true, read: true, update: true, delete: true, approve: true },
    'banking':    { create: true, read: true, update: true, delete: true, approve: true },
    'expenses':   { create: true, read: true, update: true, delete: true, approve: true },
    'payroll':    { create: true, read: true, update: true, delete: true, approve: true },
    'roasting':   { create: true, read: true, update: true, delete: true, approve: true },
    'packing':    { create: true, read: true, update: true, delete: true, approve: true },
    'user-admin': { create: true, read: true, update: true, delete: true, approve: true },
  },
  'accountant': {
    'roasting':   { create: true, read: true, update: true, delete: true, approve: true },
    'user-admin': { create: true, read: true, update: true, delete: true, approve: true },
  },
}

export const INITIAL_USERS: User[] = [
  { id: 'USR-001', name: 'Abebe Girma',       email: 'abebe.g@flavorcoffee.et',     role: 'general-manager',   status: 'active',   lastActive: '10 minutes ago', avatar: 'AG', avatarColor: '#1D4ED8', department: 'Executive',  createdAt: '2024-01-15' },
  { id: 'USR-002', name: 'Hiwot Tadesse',     email: 'hiwot.t@flavorcoffee.et',     role: 'vice-manager',      status: 'active',   lastActive: '2 hours ago',    avatar: 'HT', avatarColor: '#7C3AED', department: 'Executive',  createdAt: '2024-02-01' },
  { id: 'USR-003', name: 'Meron Bekele',      email: 'meron.b@flavorcoffee.et',     role: 'sales-rep',         status: 'active',   lastActive: '25 minutes ago', avatar: 'MB', avatarColor: '#0E7490', department: 'Sales',      createdAt: '2024-02-20' },
  { id: 'USR-004', name: 'Solomon Tesfaye',   email: 'solomon.t@flavorcoffee.et',   role: 'inventory-manager', status: 'active',   lastActive: '1 hour ago',     avatar: 'ST', avatarColor: '#B45309', department: 'Operations', createdAt: '2024-03-10' },
  { id: 'USR-005', name: 'Dawit Haile',       email: 'dawit.h@flavorcoffee.et',     role: 'head-roaster',      status: 'active',   lastActive: '3 hours ago',    avatar: 'DH', avatarColor: '#92400E', department: 'Production', createdAt: '2024-03-22' },
  { id: 'USR-006', name: 'Tigist Alemu',      email: 'tigist.a@flavorcoffee.et',    role: 'accountant',        status: 'active',   lastActive: '45 minutes ago', avatar: 'TA', avatarColor: '#BE185D', department: 'Finance',    createdAt: '2024-04-05' },
  { id: 'USR-007', name: 'Selamawit Bekele',  email: 'selamawit.b@flavorcoffee.et', role: 'inventory-manager', status: 'active',   lastActive: '30 minutes ago', avatar: 'SB', avatarColor: '#B45309', department: 'Quality',    createdAt: '2024-04-18' },
  { id: 'USR-008', name: 'Yohannes Mesfin',   email: 'yohannes.m@flavorcoffee.et',  role: 'delivery-staff',    status: 'active',   lastActive: 'Just now',       avatar: 'YM', avatarColor: '#065F46', department: 'Logistics',  createdAt: '2024-05-01' },
  { id: 'USR-009', name: 'Mekdes Hailu',      email: 'mekdes.h@flavorcoffee.et',    role: 'delivery-staff',    status: 'active',   lastActive: '4 hours ago',    avatar: 'MH', avatarColor: '#065F46', department: 'Logistics',  createdAt: '2024-06-14' },
  { id: 'USR-010', name: 'Biruk Assefa',      email: 'biruk.a@flavorcoffee.et',     role: 'head-roaster',      status: 'disabled', lastActive: '3 days ago',     avatar: 'BA', avatarColor: '#92400E', department: 'Production', createdAt: '2024-07-02' },
  { id: 'USR-011', name: 'Lidiya Worku',      email: 'lidiya.w@flavorcoffee.et',    role: 'accountant',        status: 'disabled', lastActive: '1 week ago',     avatar: 'LW', avatarColor: '#BE185D', department: 'Finance',    createdAt: '2024-08-20' },
]

/**
 * Map from sidebar nav item ID → PermMatrix ModuleKey.
 * null = always visible (dashboard, notifications).
 */
export const NAV_MODULE_MAP: Record<string, ModuleKey | null> = {
  // Primary nav (P2A spec)
  dashboard:     null,
  customers:     'customers',
  orders:        'orders',
  production:    'roasting',       // "Roasting" in nav
  inventory:     'green-inventory',
  packaging:     'packing',        // "Packing" in nav
  delivery:      'delivery',
  finance:       'finance',
  payments:      'payments',
  banking:       'banking',
  expenses:      'expenses',
  payroll:       'payroll',
  reports:       'reports',
  notifications: null,             // always visible
  approvals:     'approvals',
  settings:      'user-admin',
  // Legacy / secondary nav items (still routable, not in primary nav)
  quality:       'quality-control',
  verification:  'roasting-exec',
  suppliers:     'green-inventory',
  audit:         'audit-logs',
  users:         'user-admin',
  portal:         'orders',
  'design-system': null,   // always visible — dev/QA reference
}

/** Returns true if the given role can read the module bound to a nav item id. */
export function canRead(role: RoleId, navId: string): boolean {
  const moduleKey = NAV_MODULE_MAP[navId]
  if (moduleKey === null || moduleKey === undefined) return true
  return !!INITIAL_MATRIX[role]?.[moduleKey]?.read
}
