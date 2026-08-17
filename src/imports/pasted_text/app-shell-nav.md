# F3-03 — COFFEE-ROASTING ERP
# APPLICATION SHELL, GLOBAL NAVIGATION & RBAC-AWARE UI STRUCTURE

You are continuing the implementation of the Coffee-Roasting ERP frontend.

F3-01 established the frontend architecture.

F3-02 established the centralized visual/design-token system.

This prompt focuses ONLY on the GLOBAL APPLICATION SHELL and NAVIGATION EXPERIENCE.

Do not build the individual ERP modules yet.

Do not build PHP.

Do not build the database.

Do not implement backend APIs.

Do not invent backend business logic.

Build the reusable application shell that every ERP screen will live inside.

==================================================
1. OBJECTIVE
==================================================

Create a polished, professional ERP application shell containing:

- desktop sidebar
- collapsible sidebar
- mobile navigation
- top application bar
- page header area
- breadcrumbs
- global search
- notifications
- user/account menu
- theme switcher
- responsive page container
- navigation groups
- navigation badges
- active navigation states
- RBAC-aware navigation structure
- mobile navigation drawer
- contextual page actions area
- global loading behavior
- global error behavior
- global empty-state foundation

The shell must feel like one coherent application.

Every future module will plug into this shell.

==================================================
2. CORE EXPERIENCE
==================================================

The application should immediately communicate:

"This is a serious professional coffee-roasting business operating system."

The shell should feel:

- clean
- calm
- premium
- highly organized
- efficient
- data-oriented
- modern
- approachable

Avoid the typical generic admin-dashboard appearance.

Do not create unnecessary visual decoration.

The interface should prioritize:

1. understanding
2. navigation
3. operational speed
4. information hierarchy
5. consistency

==================================================
3. APPLICATION STRUCTURE
==================================================

Establish the following conceptual structure:

APPLICATION

├── Sidebar
│
├── Top Bar
│
└── Main Content
    ├── Breadcrumbs
    ├── Page Header
    ├── Page Actions
    └── Page Content

On smaller screens:

APPLICATION

├── Mobile Top Bar
│
├── Mobile Navigation Drawer
│
└── Main Content

The shell must be reusable.

Do not duplicate shell markup separately for every future page.

==================================================
4. DESKTOP SIDEBAR
==================================================

Create the primary desktop navigation sidebar.

The sidebar should be visually stable and easy to scan.

Include:

- brand/logo area
- navigation groups
- navigation items
- optional section labels
- notification/count badges where appropriate
- collapse control
- bottom utility area
- user/account shortcut if appropriate

The sidebar should remain visually subordinate to the actual content.

==================================================
5. SIDEBAR WIDTH
==================================================

Establish two primary desktop states:

EXPANDED

The expanded sidebar displays:

- icon
- text label
- badge where applicable

COLLAPSED

The collapsed sidebar displays:

- icon
- no full text
- tooltip on hover/focus
- badge where appropriate

The transition between these states must be smooth and predictable.

Do not make the collapsed sidebar so narrow that icons feel cramped.

==================================================
6. SIDEBAR COLLAPSE BEHAVIOR
==================================================

When collapsed:

- preserve active-state indication
- preserve navigation hierarchy
- show accessible tooltips
- maintain keyboard navigation
- do not remove access to functionality

The user's preference may persist if the architecture supports local preference storage.

Do not allow the sidebar to randomly expand because of page changes.

==================================================
7. SIDEBAR BRAND AREA
==================================================

At the top of the sidebar create a restrained brand area.

Include:

- company/product logo
- application name if appropriate

When collapsed:

- show the compact brand mark

When expanded:

- show full brand identity

Do not make the logo area excessively large.

The ERP is a working tool, not a marketing website.

==================================================
8. PRIMARY NAVIGATION GROUPS
==================================================

Prepare the navigation structure for the complete ERP.

Use the previously established business areas.

The navigation architecture should accommodate areas such as:

- Dashboard
- Orders
- Customers
- Roasting
- Inventory
- Packing
- Delivery
- Finance
- Payments
- Banking
- Expenses
- Payroll
- Reports
- Notifications
- Settings

Do not assume every role sees every section.

Visibility must be permission-aware.

==================================================
9. NAVIGATION GROUPING
==================================================

Organize navigation logically rather than presenting a giant flat list.

Possible conceptual grouping:

OVERVIEW
- Dashboard

SALES & ORDERS
- Orders
- Customers

OPERATIONS
- Roasting
- Inventory
- Packing
- Delivery

FINANCE
- Finance
- Payments
- Banking
- Expenses
- Payroll

INSIGHTS
- Reports

SYSTEM
- Notifications
- Settings

The exact grouping should follow the established ERP information architecture.

Do not introduce unnecessary categories simply to make the sidebar look organized.

==================================================
10. RBAC IS A HARD REQUIREMENT
==================================================

The frontend MUST be designed around the established RBAC model.

Do not treat role-based access as an afterthought.

The shell must assume that:

- different users have different permissions
- different users see different navigation
- different users see different actions
- some users can view but not modify
- some users can approve
- some users can execute operational tasks
- some users have restricted visibility

The frontend should consume permission information from the authenticated application state when the real backend is connected.

==================================================
11. DO NOT BUILD ROLE-BASED UI WITH RANDOM IF/ELSE
==================================================

Do not scatter logic like:

if manager
show X

if accountant
show Y

if sales
hide Z

throughout the application.

Instead create a centralized navigation/action configuration.

Conceptually:

NAVIGATION ITEM
→ required permission(s)
→ route
→ icon
→ label
→ group
→ badge source
→ visibility rule

This creates one source of truth.

==================================================
12. RBAC NAVIGATION MODEL
==================================================

Prepare a centralized configuration capable of representing:

- route
- label
- icon
- navigation group
- required permission
- optional alternative permissions
- badge/count
- mobile visibility
- desktop visibility
- active-route behavior

The UI should render navigation from this configuration.

Do not hardcode the same navigation item in multiple places.

==================================================
13. PERMISSION VS ROLE
==================================================

Prefer permission-driven UI rather than purely role-name-driven UI.

The shell should conceptually ask:

"Does this user have permission to access this area?"

rather than:

"Is this user a manager?"

This keeps the frontend compatible with the granular RBAC architecture.

Roles may still be displayed in user/account information.

But authorization-aware visibility should be based on permissions.

==================================================
14. IMPORTANT RBAC RULE
==================================================

Hiding a navigation item is NOT authorization.

The frontend should only control what the user sees.

The backend will ultimately enforce actual authorization.

Therefore:

Frontend:
→ hide unavailable functionality

Backend:
→ enforce permission

Never design the frontend under the assumption that hidden UI equals security.

==================================================
15. NAVIGATION ACTIVE STATE
==================================================

The active navigation item must be unmistakable.

Use:

- subtle background
- brand accent
- icon treatment
- text weight
- optional left/right indicator

Do not rely only on color.

The active state should remain obvious in both light and dark themes.

==================================================
16. NESTED NAVIGATION
==================================================

If nested navigation is required:

- use controlled expansion
- clearly show hierarchy
- preserve active child state
- automatically reveal the active section when appropriate

Do not create deeply nested navigation.

Keep navigation hierarchy shallow.

==================================================
17. NAVIGATION BADGES
==================================================

Support badges for meaningful counts.

Examples:

- pending approvals
- urgent orders
- notifications
- overdue items
- tasks requiring attention

Badges must represent real backend-derived values once connected.

Do not invent fake counts in the production architecture.

During UI prototyping, use clearly marked mock data only.

==================================================
18. BADGE VISUAL LANGUAGE
==================================================

Badge semantics should follow the design system.

Examples:

NORMAL COUNT
→ neutral/informational

ACTION REQUIRED
→ warning

URGENT
→ danger

Do not make every badge red.

Red should indicate meaningful urgency.

==================================================
19. TOP APPLICATION BAR
==================================================

Create a professional top bar containing, where appropriate:

- mobile menu trigger
- page/global search
- branch/context indicator if required
- notifications
- theme control
- user menu

The top bar must not become overcrowded.

Prioritize the most frequently used controls.

==================================================
20. GLOBAL SEARCH
==================================================

Create a global search entry point.

The search interface should be designed to eventually support searching across relevant ERP entities such as:

- orders
- customers
- inventory
- delivery records
- other permitted records

Do not implement backend search logic.

Design the interaction pattern only.

==================================================
21. SEARCH INTERACTION
==================================================

The search experience should support:

- keyboard activation
- search field
- recent searches if later supported
- categorized results
- loading state
- no-result state
- error state
- result navigation

Results must eventually respect RBAC.

A user should never be presented with search results they are not permitted to access.

==================================================
22. SEARCH OVERLAY
==================================================

On desktop, the search can use:

- command-palette style overlay
- centered search dialog
- top-bar expandable search

Choose the approach that best fits the established visual system.

It should feel fast and lightweight.

Avoid turning search into an oversized application within the application.

==================================================
23. NOTIFICATION CONTROL
==================================================

Create a global notification trigger.

It should display:

- notification icon
- unread count when applicable

Clicking it should reveal the notification experience.

The visual system must support:

- urgent
- approval
- warning
- information

as established in the ERP specification.

==================================================
24. NOTIFICATION PANEL
==================================================

Create a clean notification panel containing:

- notification grouping
- notification title
- concise message
- timestamp
- severity indicator
- read/unread state
- related-record navigation

The notification system must support deep linking to the relevant ERP record.

Do not build the actual backend notification engine.

==================================================
25. USER ACCOUNT MENU
==================================================

Create a user menu containing appropriate options such as:

- user name
- role
- account/profile
- theme preference
- settings where appropriate
- sign out

Do not overload the menu with operational navigation.

Operational navigation belongs in the sidebar.

==================================================
26. USER ROLE DISPLAY
==================================================

The user's role may be shown in the account area.

Examples:

Manager
Accountant
Sales Representative
Roaster
Storekeeper
Delivery Personnel

Use the real role names established by the ERP architecture.

Do not use the role display as the primary RBAC mechanism.

==================================================
27. THEME CONTROL
==================================================

Provide access to:

- Light
- Dark
- System

This must use the theme infrastructure from F3-02.

Do not implement a second theme system.

The selected mode should be visually clear.

==================================================
28. BREADCRUMBS
==================================================

Create a reusable breadcrumb component.

Example:

Orders
/
Order #10482
/
Details

Breadcrumbs should:

- clarify location
- remain compact
- support navigation
- disappear or simplify on small screens when necessary

Do not create overly long breadcrumb chains.

==================================================
29. PAGE HEADER
==================================================

Create a reusable page-header structure.

Possible hierarchy:

BREADCRUMB

PAGE TITLE

Supporting description

PAGE ACTIONS

Example:

Orders

Manage customer orders and track their progress.

[Create Order]

The hierarchy should remain consistent throughout the ERP.

==================================================
30. PAGE ACTION AREA
==================================================

The shell must provide a consistent place for page-level actions.

Examples:

- Create Order
- Add Customer
- Export
- Approve
- Review
- Save

Actions shown on an actual page will depend on permissions and context.

The shell should support:

- one primary action
- secondary actions
- overflow actions

without forcing every page to have all three.

==================================================
31. RESPONSIVE PAGE HEADER
==================================================

On mobile:

- title remains visible
- description may collapse or move below
- primary action remains accessible
- secondary actions may move into an overflow menu

Do not allow action buttons to create horizontal overflow.

==================================================
32. MAIN CONTENT AREA
==================================================

Create a reusable main-content container.

It should support:

- standard pages
- wide tables
- dashboards
- forms
- detail screens
- split layouts

The shell should not impose one fixed width on every module.

==================================================
33. PAGE WIDTH MODES
==================================================

Support conceptual modes such as:

STANDARD
→ normal business pages

WIDE
→ tables and operational dashboards

NARROW
→ focused forms/detail content

FULL
→ advanced data-heavy experiences

The page can select an appropriate mode.

Do not create unnecessary custom width values for individual pages.

==================================================
34. MOBILE NAVIGATION
==================================================

On mobile, replace the desktop sidebar with a navigation drawer.

The drawer should:

- slide in predictably
- have a clear close action
- preserve active navigation
- support nested groups
- respect RBAC
- be keyboard accessible
- trap focus appropriately while open
- close through an appropriate backdrop interaction

==================================================
35. MOBILE TOP BAR
==================================================

Create a dedicated mobile top bar.

It should prioritize:

- menu trigger
- brand identity
- notifications
- optional search

Do not attempt to squeeze the entire desktop top bar into mobile.

==================================================
36. MOBILE TOUCH TARGETS
==================================================

Interactive elements must be comfortable for touch.

Prioritize appropriate target sizes for:

- navigation
- buttons
- menu controls
- notification controls
- table actions
- form controls

Avoid tiny icon buttons for critical operational actions.

==================================================
37. SIDEBAR ON TABLET
==================================================

Tablet behavior should be intentional.

Depending on viewport:

- sidebar may remain expanded
- sidebar may collapse
- navigation may become a drawer

Use the centralized responsive system from F3-02.

Do not create arbitrary tablet behavior for each page.

==================================================
38. STICKY BEHAVIOR
==================================================

Where appropriate, support:

- sticky sidebar
- sticky top bar
- sticky table headers
- sticky action areas

But do not make everything sticky.

Sticky elements should never obscure important content.

==================================================
39. GLOBAL LOADING EXPERIENCE
==================================================

Create reusable shell-level loading patterns.

Support:

- initial application loading
- route transition/loading
- navigation loading
- search loading
- notification loading

Use restrained skeletons/spinners.

Do not display a giant loading spinner for every small operation.

==================================================
40. GLOBAL ERROR EXPERIENCE
==================================================

Create a reusable global error state.

It should communicate:

- something went wrong
- what the user can do
- retry where appropriate

Avoid technical error messages as the primary user-facing explanation.

The UI should remain calm and professional.

==================================================
41. GLOBAL EMPTY EXPERIENCE
==================================================

Create the visual foundation for meaningful empty states.

Examples:

No orders yet.

No notifications.

Nothing needs your attention.

No customers found.

Empty states should:

- explain what is empty
- explain why when useful
- offer a next action when appropriate

Do not use meaningless blank areas.

==================================================
42. ACCESSIBILITY
==================================================

The shell must support:

- keyboard navigation
- visible focus
- semantic navigation landmarks
- accessible labels
- screen-reader-friendly controls
- keyboard-accessible dropdowns
- accessible mobile drawer
- accessible modal/overlay behavior
- appropriate ARIA only where necessary

The sidebar must have an appropriate navigation landmark.

The main content must have an appropriate main landmark.

==================================================
43. KEYBOARD NAVIGATION
==================================================

Ensure logical keyboard flow through:

- sidebar
- top bar
- search
- notifications
- user menu
- page actions
- mobile drawer

If a command-palette/search overlay is used:

- focus moves into it
- Escape closes it
- focus returns appropriately

==================================================
44. TOOLTIP BEHAVIOR
==================================================

Tooltips are particularly important for collapsed sidebar icons.

They must:

- appear on hover
- work with keyboard focus
- identify the control
- not contain essential information unavailable elsewhere

Do not use tooltips for long explanations.

==================================================
45. SHELL TRANSITIONS
==================================================

Use the transition tokens from F3-02.

Transitions should cover:

- sidebar collapse
- mobile drawer
- dropdowns
- notification panel
- user menu
- search overlay
- theme switching

Keep animations subtle.

Respect reduced-motion preferences.

==================================================
46. ROUTE-AWARE SHELL
==================================================

The shell should understand the current route sufficiently to:

- identify active navigation
- generate breadcrumb context where configured
- highlight the appropriate section
- provide appropriate page-header structure

Do not hardcode route detection separately inside every page.

Create a centralized route/navigation configuration where possible.

==================================================
47. ROUTE + RBAC RELATIONSHIP
==================================================

Navigation visibility and route access are related but separate.

The shell should:

1. determine what navigation is visible
2. identify the current route
3. visually mark the current route
4. allow navigation only to appropriate destinations

Actual authorization must eventually be enforced by the backend.

Do not pretend frontend route hiding is security.

==================================================
48. MULTI-BRANCH / BUSINESS CONTEXT
==================================================

The architecture may later require business context such as:

- company
- branch
- location

If the established ERP specification includes branch/context selection, provide a clean location in the shell for it.

Do not invent complex multi-company functionality.

Create only the UI foundation needed for the established architecture.

==================================================
49. SHELL DENSITY
==================================================

The shell must work with both:

COMFORTABLE MODE

and

DATA-DENSE ERP MODE

Do not make navigation oversized.

Users will spend significant time inside this system.

The shell should maximize useful working area.

==================================================
50. VISUAL HIERARCHY
==================================================

The visual hierarchy should be:

1. Main page content
2. Page title/context
3. Primary action
4. Navigation
5. Secondary controls

The sidebar and top bar should support the task rather than dominate it.

==================================================
51. DO NOT TURN IT INTO A LANDING PAGE
==================================================

This is an ERP.

Do not introduce:

- marketing hero sections
- giant decorative illustrations
- excessive gradients
- oversized typography
- unnecessary animations
- decorative coffee imagery everywhere

Coffee branding should be sophisticated and restrained.

==================================================
52. COMPONENT REUSABILITY
==================================================

Build the shell from reusable pieces.

Conceptually:

<AppShell>

<Sidebar>

<SidebarNavigation>

<SidebarNavigationItem>

<TopBar>

<GlobalSearch>

<NotificationMenu>

<UserMenu>

<Breadcrumbs>

<PageHeader>

<PageActions>

<MainContent>

<MobileNavigationDrawer>

Use the project's actual architecture from F3-01 rather than blindly copying these names.

==================================================
53. DO NOT DUPLICATE COMPONENTS
==================================================

If desktop and mobile versions share behavior:

- share the underlying configuration
- share tokens
- share semantics
- only change layout/interaction where necessary

Do not create two unrelated navigation systems.

==================================================
54. PROTOTYPE DATA
==================================================

If the visual implementation requires sample data, use realistic coffee-business examples.

For example:

- Order #10482
- Addis Coffee House
- 120 KG
- Sidamo Natural
- Roasting
- Pending Manager Confirmation

But clearly structure sample data so it can later be replaced by real backend data.

Do not embed business logic into sample data.

==================================================
55. RBAC DEMONSTRATION
==================================================

Create a way to visually demonstrate the shell under different permission configurations.

At minimum demonstrate several representative users:

MANAGER

ACCOUNTANT

SALES REPRESENTATIVE

ROASTER

STOREKEEPER

DELIVERY PERSONNEL

The purpose is to verify that the navigation structure can change based on permissions.

Do not create separate hardcoded applications for each role.

Use one navigation configuration + different permission sets.

==================================================
56. ROLE-SPECIFIC UX EXPECTATION
==================================================

The shell should make each role feel appropriately scoped.

For example:

MANAGER
→ broad operational visibility

ACCOUNTANT
→ finance/payment/expense/payroll-related areas according to permissions

SALES REPRESENTATIVE
→ customers/orders and permitted sales operations

ROASTER
→ roasting-related operational work

STOREKEEPER
→ inventory/receipt-related work

DELIVERY PERSONNEL
→ delivery-focused mobile experience

These are UX examples, not permission definitions.

Use the established RBAC specification as the final authority.

==================================================
57. DELIVERY PERSONNEL SPECIAL CASE
==================================================

The delivery person's shell should be especially mobile-friendly.

Prioritize:

- today's deliveries
- assigned tasks
- delivery status
- customer information
- proof/document upload
- failed delivery recording

Avoid presenting the delivery user with the same complex navigation experience as a manager.

The UI should feel task-focused.

==================================================
58. NOTIFICATION COUNTS
==================================================

Navigation and notification counts must eventually be backend-derived.

The shell should support:

- zero count
- one count
- multiple count
- large count
- loading
- error

Do not let large counts break the layout.

For example:

99+

is preferable to an overflowing badge.

==================================================
59. GLOBAL SEARCH STATES
==================================================

Design:

DEFAULT
LOADING
RESULTS
NO RESULTS
ERROR

Also design:

keyboard focus
hover
selected result

Search results should have a clear hierarchy.

==================================================
60. USER MENU STATES
==================================================

Design:

closed
open
keyboard-focused
loading if account data is loading
signed-out/expired-session foundation if applicable

Do not implement authentication logic here.

==================================================
61. MOBILE DRAWER STATES
==================================================

Design:

closed
opening
open
closing
keyboard-focused
reduced-motion

Ensure the backdrop does not interfere with accessibility.

==================================================
62. SIDEBAR STATES
==================================================

Design:

expanded
collapsed
hover
active
focused
disabled
loading if required

Ensure all states work in both themes.

==================================================
63. GLOBAL SHELL STYLE GUIDE
==================================================

Extend the design-system demonstration created in F3-02.

Add a shell section demonstrating:

- expanded sidebar
- collapsed sidebar
- active navigation
- nested navigation
- badges
- top bar
- search
- notification menu
- user menu
- breadcrumbs
- page header
- page actions
- mobile drawer
- responsive behavior

This becomes the visual reference for all future ERP pages.

==================================================
64. RESPONSIVE QA
==================================================

Test the shell at:

- mobile
- tablet
- laptop
- desktop
- large desktop

Verify:

- no horizontal overflow
- no clipped navigation
- no overlapping controls
- readable typography
- usable touch targets
- correct sidebar behavior
- correct mobile drawer behavior
- usable page-header actions

==================================================
65. DARK-MODE QA
==================================================

Test the complete shell in:

LIGHT
DARK

Check:

- sidebar
- active navigation
- badges
- top bar
- menus
- search
- breadcrumbs
- page headers
- focus indicators
- mobile drawer
- overlays

No component should visually depend on a light-only assumption.

==================================================
66. DEFINITION OF DONE
==================================================

F3-03 is complete only when:

[ ] Desktop application shell exists.

[ ] Sidebar exists.

[ ] Sidebar expanded state exists.

[ ] Sidebar collapsed state exists.

[ ] Mobile navigation drawer exists.

[ ] Mobile top bar exists.

[ ] Top application bar exists.

[ ] Navigation groups exist.

[ ] Navigation is driven by centralized configuration.

[ ] RBAC-aware navigation structure exists.

[ ] Permission-driven visibility is supported.

[ ] Active navigation state exists.

[ ] Navigation badges are supported.

[ ] Global search UI exists.

[ ] Search states exist.

[ ] Notification control exists.

[ ] Notification panel foundation exists.

[ ] User/account menu exists.

[ ] Theme control exists.

[ ] Breadcrumb component exists.

[ ] Page-header component exists.

[ ] Page-action area exists.

[ ] Responsive content containers exist.

[ ] Loading foundation exists.

[ ] Error foundation exists.

[ ] Empty-state foundation exists.

[ ] Keyboard navigation works.

[ ] Focus states work.

[ ] Mobile drawer is accessible.

[ ] Tooltips work for collapsed navigation.

[ ] Dark mode works.

[ ] Reduced-motion behavior works.

[ ] Shell works across responsive breakpoints.

[ ] Representative RBAC configurations have been demonstrated.

[ ] Delivery-personnel mobile shell has been considered.

[ ] No ERP module business logic has been implemented.

[ ] No backend/PHP code has been implemented.

[ ] No database code has been implemented.

[ ] No authorization logic has been incorrectly moved into the frontend.

==================================================
67. FINAL PRINCIPLE
==================================================

The application shell is the frame through which the entire ERP will be experienced.

It must therefore be:

CONSISTENT
+
FAST
+
ACCESSIBLE
+
RBAC-AWARE
+
RESPONSIVE
+
CALM
+
PROFESSIONAL

Build the shell once.

Every future ERP module must plug into it.

Do not redesign the navigation, header, page container, breadcrumbs, notification system, or user menu separately for every module.

ONE SHELL.

ONE NAVIGATION SYSTEM.

ONE RBAC-AWARE STRUCTURE.

ONE RESPONSIVE EXPERIENCE.

ONE VISUAL LANGUAGE.