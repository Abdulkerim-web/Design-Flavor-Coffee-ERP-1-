P2A — APPLICATION SHELL & GLOBAL NAVIGATION

Design the core application shell for the Coffee-Roasting ERP.

Do not design the detailed business modules yet. This prompt is ONLY for the main application structure, navigation, header, and responsive shell.

The final frontend will be implemented with HTML, CSS, and JavaScript, with PHP as the backend. Everything you design must be realistically achievable with standard CSS, Flexbox, CSS Grid, responsive media queries, and simple JavaScript interactions.

DESIGN DIRECTION

Continue the visual language established in Part 1:

- premium
- modern
- coffee-inspired
- clean
- calm
- professional
- highly usable
- sophisticated but not decorative

Use the established espresso-brown, roasted-brown, warm-neutral, green, amber, red, and information colors from Part 1.

Do not introduce a new visual language.

--------------------------------------------------
1. DESKTOP APPLICATION SHELL
--------------------------------------------------

Create the primary desktop ERP layout.

Structure:

LEFT:
Persistent navigation sidebar.

TOP:
Clean application header.

MAIN:
Large, spacious content area.

The overall interface should feel like a serious professional ERP, not a generic admin template.

Use generous whitespace and strong visual hierarchy.

--------------------------------------------------
2. SIDEBAR
--------------------------------------------------

Create a refined vertical sidebar.

Top of sidebar:

Coffee ERP logo / wordmark.

Navigation groups:

OVERVIEW
- Dashboard

SALES
- My Customers
- Orders

OPERATIONS
- Roasting
- Inventory
- Packing
- Deliveries

FINANCE
- Finance
- Payments
- Banking
- Expenses
- Payroll

MANAGEMENT
- Reports
- Notifications
- Approvals

SYSTEM
- Settings

These are the complete navigation categories, but not every role sees every item.

The navigation must visually support permission-based visibility.

--------------------------------------------------
3. ACTIVE NAVIGATION
--------------------------------------------------

Create a clear active navigation state.

The active item should use:

- subtle highlighted background
- espresso/roast accent
- appropriate icon
- stronger text weight Do not use extremely bright colors.

The active state must be immediately recognizable.

--------------------------------------------------
4. SIDEBAR COLLAPSED STATE
--------------------------------------------------

Create a second desktop state where the sidebar collapses.

Expanded:

icon + label

Collapsed:

icon only

When collapsed:

- retain the active state
- show tooltips on hover
- maintain easy navigation
- keep the visual hierarchy clean

Create both expanded and collapsed versions.

--------------------------------------------------
5. TOP HEADER
--------------------------------------------------

Create a clean global header.

LEFT:

Current page title.

RIGHT:

- global search icon/input
- notification icon with unread badge
- user avatar
- user name/profile menu

Keep the header minimal.

Do not overcrowd it.

--------------------------------------------------
6. USER PROFILE MENU
--------------------------------------------------

Design the profile dropdown.

Show:

User name
Role

Options:

- Profile
- Settings
- Logout

Keep it compact and polished.

--------------------------------------------------
7. NOTIFICATION ICON
--------------------------------------------------

Add a notification bell to the header.

Use a small unread-count badge.

The badge should be visually noticeable without being distracting.

Clicking the bell should open a notification panel in the later notification design.

For this prompt, only establish the header control and its interaction state.

--------------------------------------------------
8. ROLE-BASED NAVIGATION
--------------------------------------------------

The navigation must be designed to support different user roles.

Create visual examples for:

SALES REPRESENTATIVE:
Dashboard
My Customers
Orders
Notifications

ROASTER:
Dashboard
Roasting
Notifications

STOREKEEPER:
Dashboard
Inventory
Packing
Deliveries
Notifications

DELIVERY PERSON:
Today's Deliveries
Delivery History
Notifications

ACCOUNTANT:
Dashboard
Finance
Payments
Banking
Expenses
Payroll
Reports
Notifications

MANAGER:
Broad operational and management access.

Important:

The frontend should eventually receive permissions from the PHP backend.

Do not design separate completely different applications for each role.

Use one consistent shell whose navigation changes according to permissions.

--------------------------------------------------
9. MOBILE SHELL
--------------------------------------------------

Create a mobile version.

Do NOT simply shrink the desktop sidebar.

On mobile:

- use a compact top header
- show a hamburger/menu button
- open navigation as a full-height drawer
- keep the content area full width

The mobile navigation drawer should contain the permitted navigation items.

--------------------------------------------------
10. TABLET / RESPONSIVE BEHAVIOR
--------------------------------------------------

Design the shell so it adapts naturally between:

Mobile
Tablet
Laptop
Desktop

The layout should progressively change rather than simply scale down.

Desktop:
Persistent sidebar.

Tablet:
Reduced sidebar or collapsible navigation.

Mobile:
Navigation drawer.

--------------------------------------------------
11. BREADCRUMB / PAGE CONTEXT
--------------------------------------------------

Create a simple page-context area below the header.

Example:

Orders

or:

Orders / Order #ORD-1024

Use breadcrumbs only where they genuinely help users understand hierarchy.

Keep them subtle.

--------------------------------------------------
12. SHELL STATES
--------------------------------------------------

Create these states:

1. Desktop — sidebar expanded
2. Desktop — sidebar collapsed
3. Desktop — active navigation
4. Mobile — navigation closed
5. Mobile — navigation drawer open
6. Header — normal
7. Header — notification badge
8. Header — profile menu open

--------------------------------------------------
13. VISUAL QUALITY
--------------------------------------------------

The final shell should feel:

- premium
- spacious
- balanced
- highly readable
- operationally efficient

Use restrained borders and subtle shadows.

Avoid:

- excessive rounded cards
- excessive gradients
- excessive shadows
- huge decorative elements
- unnecessary animations
- visual clutter

The interface should feel like a high-end coffee company's internal operating system.

--------------------------------------------------
14. RESPONSIVE PRIORITY
--------------------------------------------------

Desktop should feel powerful and organized.

Mobile should feel simple and fast.

Do not force desktop information density onto mobile.

The mobile shell should be especially comfortable for users such as delivery personnel who may use the ERP primarily from a phone.

--------------------------------------------------
15. OUTPUT
--------------------------------------------------

Create the following Figma frames:

1. Desktop Application Shell — Expanded
2. Desktop Application Shell — Collapsed
3. Desktop Application Shell — Active Navigation
4. Mobile Application Shell
5. Mobile Navigation Drawer
6. User Profile Menu
7. Header Notification State
8. Role-Based Navigation Examples

Keep all components reusable.

Use the existing Part 1 design system.

Do not design detailed Customers, Orders, Inventory, Roasting, Finance, Delivery, Payroll, or Reports screens yet.

This part is ONLY the shared ERP application shell and navigation foundation.
