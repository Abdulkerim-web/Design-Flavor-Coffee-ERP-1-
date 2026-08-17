COFFEE-ROASTING ERP
PART 1B — APPLICATION SHELL + GLOBAL UX + ROLE-AWARE FOUNDATION
ACT AS A WORLD-CLASS ENTERPRISE UX ARCHITECT, PRODUCT DESIGNER, APPLICATION SHELL DESIGNER, AND ENTERPRISE SOFTWARE DESIGNER.
Continue from the existing Coffee-Roasting ERP Design System.
DO NOT redesign the brand or create an unrelated visual language.
Use the existing:
• brand
• logo
• colors
• typography
• spacing
• radius
• shadows
• iconography
• status system
• alerts
• forms
• tables
• timelines
• light mode
• dark mode
Everything created here must use those established design tokens.
The goal of this prompt is to create the complete GLOBAL APPLICATION EXPERIENCE.
This is not a generic admin dashboard.
It is the operational shell for a real coffee-roasting ERP.
============================================================
1.RESPONSIVE APPLICATION STRUCTURE
============================================================
Design explicitly for:
MOBILE
TABLET
LAPTOP
DESKTOP
Desktop is the primary environment for:
• Manager
• Accountant
• Finance
• Reports
• Inventory
• Roasting
• Packing
Mobile is especially important for:
• Sales Representatives
• Manager approvals
• Notifications
• Delivery Personnel
• quick inventory checks
There is NO offline requirement for delivery.
Assume active internet connectivity.
DO NOT create offline synchronization UI.
============================================================
2. GLOBAL APPLICATION SHELL
Create a professional ERP shell.
Structure:
┌────────────────────────────────────────────────────┐
│ TOP HEADER │
├───────────────┬────────────────────────────────────┤
│ │ │
│ SIDEBAR │ MAIN CONTENT │
│ │ │
│ │ │
└───────────────┴────────────────────────────────────┘
SIDEBAR:
• brand/logo
• navigation
• section grouping
• pending badges
• active state
• collapse control
• user area
TOP HEADER:
• page/context title
• breadcrumb where useful
• global search where appropriate
• notifications
• user profile
• contextual actions
MAIN CONTENT:
• page header
• primary action
• content
• supporting information
• responsive layout
Do not overcrowd the header.
============================================================
3. PRIMARY NAVIGATION
Create the application structure:
DASHBOARD
ORDERS
CUSTOMERS
SALES
INVENTORY
ROASTING
PACKING
DELIVERIES
FINANCE
REPORTS
NOTIFICATIONS
SETTINGS
Navigation must clearly communicate hierarchy.
Use:
• elegant line icons
• active indicator
• labels
• optional attention badges
• collapse control
Avoid excessive icon-only navigation.
============================================================
4. PERMISSION-AWARE EXPERIENCE
The ERP has different operational roles.
The interface must adapt according to permissions.
Do not simply build one giant dashboard and hide random buttons.
Each role should feel intentionally designed for their actual job.
A SALES REPRESENTATIVE should not see:
• Payroll
• Bank Reconciliation
• Internal Expense Approval
A ROASTER should primarily see:
• assigned roasting work
• roasting history
• relevant inventory
• completed batches
A DELIVERY PERSON should primarily see:
• assigned deliveries
• today's deliveries
• delivery details
• proof/acceptance submission
A MANAGER should have broad operational visibility.
An ACCOUNTANT should have finance-focused visibility.
============================================================
5. ROLE-BASED NAVIGATION
Create conceptual permission-aware navigation.
Every navigation item should conceptually contain:
NAME
ICON
ROUTE
REQUIRED PERMISSION
OPTIONAL BADGE
Demonstrate role-specific navigation.
MANAGER:
Dashboard
Orders
Customers
Sales
Inventory
Roasting
Packing
Deliveries
Finance
Reports
Notifications
Settings
SALES:
Dashboard
Customers
Sales
Orders
Notifications
ROASTER:
Dashboard
Roasting
Relevant Inventory
Notifications
DELIVERY:
Dashboard
Deliveries
Notifications
ACCOUNTANT:
Dashboard
Finance
Payments
Reports
Notifications
These are UX examples.
The final implementation will later follow the actual PHP backend permission model.
============================================================
6. NAVIGATION BADGES
Use elegant actionable count badges.
Examples:
Orders [5]
Notifications [3]
Finance [2]
A badge should mean:
"Something here requires attention."
Do not show meaningless totals.
Badge meanings:
Neutral:
normal information
Amber:
requires action
Red:
urgent/genuine problem
Do not flood the interface with red.
============================================================
7. PAGE HEADER SYSTEM
Every major page must use a consistent header.
Example:
Orders
Manage customer orders and approval workflow.
[Search] [Filters] [Create Order]
Another example:
Inventory
Monitor green, roasted and packaging stock.
[Receive Stock] [Adjust] [Export]
Use:
TITLE
SHORT CONTEXTUAL DESCRIPTION
PRIMARY ACTION
OPTIONAL SECONDARY ACTIONS
Do not create oversized headers.
============================================================
8. DASHBOARD CARD LANGUAGE
Cards must have purpose.
Good:
PENDING ORDERS
5
Orders waiting for manager confirmation
[Review]
Bad:
ORDERS
5
without explanation.
Every dashboard card should answer:
What is this?
Why does it matter?
Can I act on it?
============================================================
9. GLOBAL SEARCH
Design a powerful but simple global search experience.
Eventually support:
• orders
• customers
• branches
• inventory lots
• deliveries
• payments
Create:
• search field
• keyboard-friendly interaction
• grouped results
• entity icons
• entity labels
• quick navigation
Example:
Search: "ABC"
CUSTOMERS
ABC Coffee
ORDERS
#1042 — ABC Coffee — 50 KG
DELIVERIES
ABC Coffee — Branch 2
Keep results clean and easy to scan.
============================================================
10. GLOBAL NOTIFICATION CENTER
Create a global notification icon in the header.
Show:
• unread count
• urgency
• notification preview
Categories:
URGENT
NEEDS APPROVAL
WARNING
INFORMATION
Every notification should communicate:
WHAT happened
WHY it matters
WHAT action is available
Example:
⚠ Stock Shortage
Order #1042 may require more green coffee.
[Review Order]
Notifications are operational intelligence, not generic system messages.
============================================================
11. GLOBAL EXPORT UX
Create a reusable export control:
[Export ▾]
CSV
PDF
CSV is appropriate for:
• tables
• inventory
• orders
• operational data
• transaction records
PDF is appropriate for:
• financial summaries
• formal reports
• VAT reports
• professional statements
• printable/sharable documents
Keep export controls unobtrusive.
============================================================
12. LOGIN EXPERIENCE
Create a premium login screen that belongs to the established brand.
Include:
Logo
ERP/company name
Welcome message
Email/username
Password
Remember option
Sign in
Forgot password
Keep it minimal.
No unnecessary marketing content.
Use subtle coffee-inspired visual treatment.
Do not make the login screen heavier than the application.
Create:
LIGHT
DARK
============================================================
13. PROFILE / USER MENU
Create a clean user menu containing:
Name
Role
Profile
Preferences
Theme
Notifications
Logout
Theme:
Light
Dark
System
Keep it simple.
============================================================
14. GLOBAL RESPONSIVE BEHAVIOR
Demonstrate how the shell behaves across:
Desktop
Tablet
Mobile
Desktop:
Persistent sidebar
Full navigation
Full data density
Tablet:
Adapt sidebar and content width
Preserve important controls
Mobile:
Use compact navigation
Prioritize critical actions
Use mobile-friendly controls
Use bottom navigation or a suitable mobile navigation pattern where appropriate
Preserve access to notifications and approvals
Avoid horizontal overflow
Do not simply shrink the desktop design.
Actually redesign the information hierarchy for smaller screens.
============================================================
15. ROLE-SPECIFIC SHELL EXAMPLES
Create shell examples for:
MANAGER
SALES REPRESENTATIVE
ROASTER
STOREKEEPER
ACCOUNTANT
DELIVERY PERSONNEL
Demonstrate how the navigation, dashboard emphasis, available actions, and notifications change according to responsibility.
Do not make the interfaces look like six unrelated applications.
They must clearly belong to one ERP.
============================================================
16. OPERATIONAL LANGUAGE
Use human-facing business language.
Never expose technical backend statuses.
DO NOT display:
INSUFFICIENT_STOCK_ON_HOLD
Display:
Stock Shortage — Awaiting Decision
DO NOT display:
ROASTING_IN_PROGRESS
Display:
Roasting
DO NOT display:
DELIVERED_PENDING_VERIFICATION
Display:
Awaiting Customer Confirmation
DO NOT display:
DISCREPANCY_REVIEW
Display:
Needs Review
Technical state identifiers belong to the backend.
The frontend is human-facing.
============================================================
17. APPROVAL CENTER EXPERIENCE
Create a manager approval experience that works from:
• notification
• dashboard
• order list
• order detail
The manager must quickly understand:
WHAT
QUANTITY
CUSTOMER
CURRENT STATUS
WHY APPROVAL IS REQUIRED
STOCK FEASIBILITY
RISKS
AVAILABLE ACTIONS
Example:
ORDER #1042
ABC Coffee — Main Branch
50 KG
Guji Medium
Stock feasibility:
⚠ INSUFFICIENT
Expected green:
60.6 KG
Available:
50 KG
Shortfall:
10.6 KG
[Confirm]
[Wait for Stock]
[Reject]
The manager must understand the consequences before acting.
============================================================
18. APPLICATION STATES
Demonstrate global states using the established component system:
DEFAULT
HOVER
FOCUS
ACTIVE
DISABLED
LOADING
ERROR
SUCCESS
EMPTY
Apply them to:
• navigation
• buttons
• forms
• tables
• cards
• notifications
• approval actions
• detail panels
============================================================
19. PROTOTYPE / USER FLOWS
Create representative prototype flows showing:
FLOW 1 — Manager Login
Login
→ Manager Dashboard
→ Pending Order
→ Order Detail
→ Review Stock
→ Confirm Order
FLOW 2 — Sales Login
Login
→ Sales Dashboard
→ Customers
→ Select Customer
→ Create Order
→ Submit Order
→ Pending Manager Confirmation
FLOW 3 — Manager Notification
Notification
→ Stock Warning
→ Related Order
→ Review
FLOW 4 — Delivery
Login
→ Today's Deliveries
→ Delivery Detail
→ Customer Confirmation
→ Completion
These are shell-level prototype flows.
Do not fully design all detailed business modules yet.
============================================================
20. FIGMA FILE ORGANIZATION
Organize the file professionally using:
01 — Brand & Design System
02 — Application Shell
03 — Dashboard Foundation
04 — Orders
05 — Customers & Sales
06 — Inventory
07 — Roasting
08 — Packing
09 — Delivery
10 — Finance
11 — Reports
12 — Notifications
13 — Settings
14 — Components
15 — Prototype / User Flows
For this prompt, focus on:
01 — Brand & Design System
02 — Application Shell
03 — Dashboard Foundation
15 — Prototype / User Flows
Do not fully build detailed business modules.
============================================================
21. REALISTIC DATA
Use realistic coffee-company data.
Examples:
50 KG
60.6 KG
125 KG
1,250 KG
Financial:
ETB 25,000.00
ETB 150,000.00
Statuses:
Pending Manager Confirmation
Green Reserved
Roasting
Awaiting Storekeeper
Needs Review
Ready for Delivery
Awaiting Customer Confirmation
Partially Paid
Overdue
Completed
Never use:
Lorem ipsum
Test Customer
123
Sample Data
============================================================
22. FINAL APPLICATION-SHELL QUALITY BAR
Before considering this foundation complete, demonstrate:
✓ coherent global application shell
✓ professional sidebar
✓ professional top header
✓ responsive behavior
✓ mobile behavior
✓ tablet behavior
✓ desktop behavior
✓ role-aware navigation
✓ manager experience
✓ sales experience
✓ roaster experience
✓ storekeeper experience
✓ accountant experience
✓ delivery experience
✓ global search
✓ notification access
✓ actionable notification previews
✓ navigation badges
✓ page header system
✓ dashboard card language
✓ approval experience
✓ export control
✓ login
✓ profile/user menu
✓ theme selection
✓ light mode
✓ dark mode
✓ loading states
✓ error states
✓ success states
✓ empty states
✓ accessibility foundation
✓ prototype flows
============================================================
23. MOST IMPORTANT RULE
DO NOT DESIGN THIS AS A COLLECTION OF UNRELATED ERP SCREENS.
Design ONE coherent product.
Every screen must look like it belongs to the same software.
Every component must follow the established design system.
Every role must receive the interface appropriate to its responsibility.
Every action must communicate its consequence.
Every important operational number must be understandable.
The final impression should be:
"THIS SOFTWARE IS SIMPLE, PROFESSIONAL, TRUSTWORTHY, AND BEAUTIFUL."
Not:
"THIS IS A COMPLICATED ERP."
============================================================
FINAL INSTRUCTION
Think like:
WORLD-CLASS UX DESIGNER
+
WORLD-CLASS ENTERPRISE SOFTWARE DESIGNER
+
PREMIUM PRODUCT DESIGNER
+
SENIOR DESIGN SYSTEM ENGINEER
+
COFFEE INDUSTRY OPERATIONS EXPERT
Build the global application experience on top of the existing design system.
Do not redesign the brand from scratch.
Do not jump into detailed module workflows.
Establish the shell, role-aware navigation, global interactions, responsive behavior, approval experience, and prototype foundation first.
Make it:
SIMPLE.
BEAUTIFUL.
INTELLIGENT.
PRECISE.
CONSISTENT.
PREMIUM.
ACCESSIBLE.
RESPONSIVE.
