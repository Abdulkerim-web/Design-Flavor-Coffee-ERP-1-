# Flavor Coffee Roasters ERP — Frontend Architecture

React 19 · Vite 8 · TypeScript 5.7 · Tailwind CSS v4

---

## 1. Folder Structure

```
src/
  assets/          Static assets (fonts resolved via Google Fonts CSS2 import)
  components/      Reusable UI components — never page-specific logic
    FormControls   TextInput, NumberInput, SelectField, Textarea, Toggle, Checkbox, RadioGroup
    EmptyState     Icon + title + description + action
    SkeletonLoader Skeleton, SkeletonKPICard, SkeletonTableRow, SkeletonDashboard
    StatusBadge    Generic status badge (color + icon + label)
    InlineAlert    Inline contextual alert strip
    PageHeader     Page title + eyebrow + action slot
    Sidebar        RBAC-aware sidebar navigation
    TopBar         Header bar with search, quick-create, alerts, user profile
    BottomNav      Mobile bottom navigation
    AlertsDrawer   Slide-in alerts panel
    Toast          Toast notification container
    CommandPalette ⌘K global search / navigation
    ApprovalModal  Re-usable approval/rejection dialog
    ExportButton   CSV/PDF export trigger
  contexts/        React contexts (global shared state)
    AuthContext    currentUser, login(), logout()
    ThemeContext   theme, toggleTheme()
    ToastContext   toast.success(), toast.error(), toast.info(), toast.warning(), toast.loading()
    ConfirmContext confirm() → Promise<boolean>
  hooks/           Custom React hooks
    useBreakpoint  isMobile ≤640, isTablet 641-1024, isLaptop 1025-1440, isDesktop >1440
  lib/             Pure logic modules — no JSX, no side effects
    rbac           Roles, INITIAL_MATRIX, canRead(), ROLES, INITIAL_USERS
    can            UIAction type, can(role, action) helper — builds on rbac matrix
    orderStatus    ORDER_STATUS_MAP, FEASIBILITY_MAP, PAYMENT_STATUS_MAP, getStatusConfig()
    format         Currency, date, number formatters
  pages/           Full-page module components (one per ERP module)
    Dashboard      Manager operations dashboard (P2D)
    Orders         Order management — list/detail/new (P2F)
    Customers      Customer management — list/detail/form (P2E)
    Inventory, Production, Delivery, Finance, Payments, Banking …
  services/        Data abstraction layer — UI talks to services, not raw data
    api.ts         ServiceResult<T>, mockRequest(), safeRequest(), LoadState
    orders.ts      listOrders(), getOrder(), createOrder(), confirmOrder(), rejectOrder()
    customers.ts   listCustomers(), getCustomer(), createCustomer(), approveCustomer() …
    inventory.ts   listGreenStock(), listRoastedStock(), listPackagingStock()
    finance.ts     getFinanceSummary(), listExpenses()
    mock/          Mock data files — deleted/replaced when PHP API is ready
  index.css        Tailwind v4 import + all design tokens + component CSS classes
  App.tsx          App shell: providers, sidebar, topbar, module router
  main.tsx         React entry point
```

---

## 2. CSS Architecture

`src/index.css` is the single source of CSS truth. Structure:

```
@import Google Fonts (Inter, DM Mono, Fraunces)
@import tailwindcss
@theme inline { ... Tailwind token mappings ... }

:root { ... light-mode design tokens ... }
[data-theme="dark"] { ... dark-mode overrides (all tokens) ... }

/* Reset & Base */
/* Typography Scale */
/* Scrollbars */
/* Component classes: .btn-*, .badge, .input-field, .data-table, .sidebar-item, .stat-card … */
/* Responsive utilities: .resp-grid-*, .page-padding, .resp-hide-mobile … */
/* Dark mode component overrides */
/* Skeleton shimmer animation */
/* Focus ring (:focus-visible) */
/* Form validation states */
```

**Principle: RAW VALUE → DESIGN TOKEN → COMPONENT → SCREEN**

Never write raw hex colors or arbitrary spacing outside `index.css`.

---

## 3. Design Token System

All tokens live in `:root` in `src/index.css`. Dark-mode overrides live in `[data-theme="dark"]`.

### Color tokens

| Token                | Light                  | Dark              |
|----------------------|------------------------|-------------------|
| `--bg-primary`       | #FAFAF8                | #0C0D0E           |
| `--surface-01`       | #FFFFFF                | #141619           |
| `--surface-02`       | #F5F3EF                | #1C1F24           |
| `--surface-hover`    | #EEEDE8                | #26292E           |
| `--border-neutral`   | #E5E3DC                | #26292E           |
| `--border-focus`     | #2B4D3A                | #34D399           |
| `--brand-primary`    | #2B4D3A (espresso green)| #34D399 (emerald) |
| `--sem-success`      | #16A34A                | #22C55E           |
| `--sem-warning`      | #F59E0B                | #FBBF24           |
| `--sem-danger`       | #DC2626                | #F87171           |
| `--sem-info`         | #2563EB                | #60A5FA           |
| `--text-primary`     | #1F2937                | #F3F4F6           |
| `--text-secondary`   | #6B7280                | #9CA3AF           |
| `--text-muted`       | #9CA3AF                | #6B7280           |

### Typography classes

`.type-display`, `.type-h1`, `.type-h2`, `.type-h3`, `.type-body-large`, `.type-body`, `.type-caption`, `.type-micro`, `.type-numeric`, `.type-numeric-lg`, `.etb-currency`

### Spacing scale (reference)

`--space-1` (4px) through `--space-16` (64px)

### Shadow scale

`--shadow-card`, `--shadow-flyout`, `--shadow-modal`

### Motion tokens

`--ease-apple`, `--dur-fast` (100ms), `--dur-base` (200ms), `--dur-slow` (300ms)

---

## 4. Dark Mode Strategy

Dark mode is toggled by setting `data-theme="dark"` on `document.documentElement`.
`ThemeContext` manages this and persists the preference to `localStorage`.

Every semantic color token has an explicit dark-mode override in `[data-theme="dark"]`.
Components consume tokens only — they never hardcode light-mode colors — so switching
themes requires zero component changes.

Smooth theme transitions are applied to `background-color`, `border-color`, `color`, and `box-shadow` globally via a CSS transition rule scoped to `html:not([data-no-transition])`.

---

## 5. Responsive Strategy

Breakpoints (matching `useBreakpoint()` hook):

| Breakpoint  | Range       | CSS media query       |
|-------------|-------------|----------------------|
| Mobile      | ≤ 640px     | `max-width: 767px`   |
| Tablet      | 641–1024px  | up to `1023px`       |
| Laptop      | 1025–1440px | default              |
| Desktop     | > 1440px    | default              |

Mobile priorities: delivery staff, quick actions, touch targets ≥ 44px, compact cards, bottom navigation, simplified tables (cards replace rows).
Desktop: higher information density, sidebar, full tables.

Responsive utility classes: `.resp-grid-4`, `.resp-grid-3`, `.resp-grid-2`, `.resp-split`, `.resp-hide-mobile`, `.resp-hide-desktop`, `.page-padding`, `.resp-table-scroll`.

---

## 6. Component Architecture

Reusable components live in `src/components/`. Rules:

- **Never define inline primitives (Button, Card, Modal) inside a page.** Use shared components.
- Use `src/components/FormControls.tsx` for all form elements.
- Use `src/components/EmptyState.tsx` for empty/error/unauthorized states.
- Use `src/components/SkeletonLoader.tsx` for loading states.
- CSS class-based components (`.btn-primary`, `.badge`, `.input-field`, `.data-table`) are defined in `src/index.css` and applied in JSX via `className`.

### Component state contract

Every interactive component must handle: default · hover · focus · active · disabled · loading · error · success (where applicable).

Focus states use `:focus-visible` with `outline: 2px solid var(--border-focus); outline-offset: 2px` — never removed without an accessible alternative.

---

## 7. RBAC-Aware UI

**`src/lib/rbac.ts`** defines roles, the permission matrix, and `canRead(role, navId)`.

**`src/lib/can.ts`** provides the action-based API recommended by F3-01:

```typescript
can(role, 'orders.confirm')     // → true/false
can(role, 'customers.approve')
can(role, 'finance.view')
```

Use `can()` for action-gating (confirm/reject buttons, form access).
Use `canRead(role, navId)` for navigation visibility.

**Security rule: Frontend RBAC is presentation-only. PHP enforces real authorization.**

---

## 8. Service / Data Abstraction Layer

Architecture: **UI → Service → Data Source**

```typescript
// UI component:
import { listOrders } from '../services'
const result = await listOrders({ status: 'pending-confirmation' })
// result.data, result.error, result.state

// Service (src/services/orders.ts):
export async function listOrders(filters, pagination) {
  return safeRequest(async () => {
    const all = await mockRequest(MOCK_ORDERS, 600) // ← replace with fetch()
    return filter(all, filters)
  })
}
```

When the PHP API is ready, replace `mockRequest(MOCK_DATA, delay)` with `fetch('/api/v1/orders', { ... })`. The UI components do not change.

Mock data files live in `src/services/mock/`. Delete them when moving to real API.

### ServiceResult type

```typescript
interface ServiceResult<T> {
  data: T | null
  error: string | null
  state: 'idle' | 'loading' | 'ok' | 'error'
}
```

---

## 9. Internal View Routing

Pages manage sub-views internally rather than via React Router, keeping the
App.tsx module map clean:

```typescript
type View = 'list' | 'detail' | 'new' | 'edit'
const [view, setView] = useState<View>('list')
```

This means `Dashboard`, `Orders`, `Customers`, etc. are each a single exported component
that renders different sub-views based on internal state.

---

## 10. Naming Conventions

| Entity               | Convention        | Example                          |
|----------------------|-------------------|----------------------------------|
| Components           | PascalCase        | `FormField`, `OrderStatusBadge`  |
| Hooks                | camelCase + use   | `useBreakpoint`, `useAuth`       |
| Service functions    | camelCase verb    | `listOrders`, `confirmOrder`     |
| Type/interface       | PascalCase        | `OrderStatusKey`, `ServiceResult`|
| CSS tokens           | kebab-case        | `--brand-primary`, `--sem-danger`|
| CSS component classes| kebab-case        | `.btn-primary`, `.data-table`    |
| Constants            | SCREAMING_SNAKE   | `ORDER_STATUS_MAP`, `ROLES`      |
| UI actions           | domain.verb       | `'orders.confirm'`               |

---

## 11. Business Logic Boundary

The frontend displays backend-authoritative data. It must never:

- Calculate stock quantities, yield, or shortfall
- Calculate VAT, totals, or payment deadlines
- Apply commission or profit formulas
- Make routing or fulfillment decisions

All displayed values that derive from business rules (prices, quantities,
feasibility states, deadlines) must arrive as opaque strings from the PHP API.
In the current mock phase, they are hardcoded as strings in mock data files.

---

## 12. Accessibility Target

WCAG 2.1 AA. Key requirements in place:
- Semantic HTML (`<main>`, `<nav>`, `role="dialog"`, `aria-label`, `<table>` with `<th scope>`)
- `:focus-visible` focus ring on all interactive elements
- Color + icon + text for all status indicators (never color alone)
- `aria-live` regions for toast notifications
- Dialog modals use `role="dialog" aria-modal="true" aria-labelledby`
- All form fields associated with labels via `htmlFor`/`id`
- `prefers-reduced-motion` respected via CSS `transition-duration: 0s` override (add to index.css if needed)
