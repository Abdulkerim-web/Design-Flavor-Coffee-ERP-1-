# F3-01 — COFFEE-ROASTING ERP
# FRONTEND ARCHITECTURE & IMPLEMENTATION FOUNDATION

You are now beginning the implementation phase of the Coffee-Roasting ERP frontend.

IMPORTANT:

This prompt is ONLY about the frontend.

Do NOT build PHP.
Do NOT build the database.
Do NOT build backend APIs.
Do NOT create server-side business logic.
Do NOT attempt to design the backend architecture.

The backend will be designed and implemented later as a completely separate phase.

Your responsibility now is to create a clean, scalable, production-quality frontend foundation that can later connect to the backend without requiring a redesign.

The frontend technology direction is:

- HTML
- CSS
- JavaScript

Use CSS as the primary styling system.

Do not introduce a heavy frontend framework unless the existing project explicitly requires one and there is a compelling reason to retain it.

The frontend must be maintainable, modular, responsive, accessible, visually sophisticated, and easy to connect to a future PHP backend.

==================================================
1. SOURCE OF TRUTH
==================================================

Treat the previously established ERP architecture and frontend/UI/UX prompts as the source of truth.

Do not invent new business rules.

Do not simplify away important workflows.

Do not change established terminology.

Do not invent new roles.

Do not invent new permissions.

Do not invent new statuses.

Do not change established visual principles merely because another implementation would be easier.

If something is not yet defined, create a clearly marked frontend placeholder rather than silently inventing business behavior.

The frontend must represent the business system described in the previous specifications.

==================================================
2. PRIMARY OBJECTIVE
==================================================

Create the architectural foundation from which the entire ERP frontend can be built consistently.

The foundation must support:

- multiple ERP modules
- multiple user roles
- RBAC-aware navigation
- responsive layouts
- desktop and mobile experiences
- dark mode
- reusable components
- complex tables
- forms
- dashboards
- modals
- drawers
- notifications
- status indicators
- timelines
- cards
- data visualization
- loading states
- error states
- empty states
- confirmation flows
- mock data
- future API integration

The architecture must make it easy to add another ERP module without creating a completely different implementation pattern.

==================================================
3. DO NOT BUILD INDIVIDUAL ERP MODULES YET
==================================================

Do NOT yet build the complete:

- Orders module
- Customers module
- Roasting module
- Inventory module
- Packing module
- Delivery module
- Finance module
- Banking module
- Payroll module
- Reports module
- Settings module

Those will be implemented in later prompts.

For this prompt, establish the foundation that all of those modules will use.

You may create demonstration/example screens purely to prove that the foundation works.

==================================================
4. FRONTEND ARCHITECTURE PRINCIPLE
==================================================

Organize the frontend into clear layers.

Use a structure conceptually similar to:

/assets
    /icons
    /images

/css
    /tokens
    /base
    /layout
    /components
    /utilities
    /themes
    /pages

/js
    /core
    /components
    /services
    /state
    /utils
    /mock

/pages

/data

Do not blindly copy this exact structure if the existing project has a better established structure.

The important principle is separation of responsibility.

Keep:

- global styles separate from component styles
- reusable components separate from page-specific styles
- mock data separate from UI rendering
- state management separate from presentation
- utility functions separate from components
- theme definitions separate from individual components

Avoid creating one giant CSS file or one giant JavaScript file.

==================================================
5. CSS ARCHITECTURE
==================================================

CSS must be treated as a first-class architectural system.

Use:

- CSS custom properties
- semantic design tokens
- reusable utility patterns where appropriate
- component classes
- predictable naming conventions
- responsive media queries
- theme variables

Do NOT scatter raw colors throughout the application.

Do NOT repeatedly write arbitrary spacing values.

Do NOT create slightly different versions of the same component.

Do NOT use inline styles for normal UI styling unless there is a legitimate dynamic requirement.

The following principle must always hold:

RAW VALUE
    ↓
DESIGN TOKEN
    ↓
COMPONENT
    ↓
SCREEN

not:

SCREEN
    ↓
random custom CSS

==================================================
6. DESIGN TOKEN SYSTEM
==================================================

Create the infrastructure for the design tokens already established in the UI/UX specification.

Tokens must include at minimum:

COLORS

- surface.base
- surface.raised
- surface.sunken
- border.subtle
- border.default
- text.primary
- text.secondary
- text.disabled
- brand.espresso
- brand.roast
- status.safe
- status.warning
- status.danger
- status.info

TYPOGRAPHY

- display
- h1
- h2
- h3
- body-large
- body
- body-small
- caption

SPACING

Use the established spacing scale consistently.

Do not introduce arbitrary spacing values when an existing token can be used.

RADII

Create the established radius levels.

SHADOWS

Create the established shadow levels.

BREAKPOINTS

Create centralized responsive breakpoints.

Do not allow individual components to invent their own breakpoint system.

==================================================
7. DARK MODE
==================================================

Dark mode is REQUIRED.

Do not implement dark mode by simply applying a dark background to the entire page.

Every semantic color must have an appropriate dark-mode equivalent.

Dark mode must preserve:

- hierarchy
- readability
- status meaning
- contrast
- focus visibility
- disabled-state distinction
- card hierarchy
- borders
- tables
- forms
- modals
- navigation
- notifications

Components must consume semantic tokens rather than hardcoded light-mode colors so theme switching remains centralized.

==================================================
8. RESPONSIVE ARCHITECTURE
==================================================

The application must support:

- mobile
- tablet
- laptop
- desktop
- large desktop

Use the established breakpoints from the design specification.

Do not treat mobile as merely a smaller desktop.

Important mobile priorities include:

- delivery personnel
- operational users
- quick actions
- readable status information
- touch-friendly controls
- simplified navigation
- compact tables
- appropriate cards
- bottom sheets/drawers where useful

Desktop can provide greater information density.

Mobile must prioritize clarity and action.

==================================================
9. RBAC-AWARE FRONTEND FOUNDATION
==================================================

RBAC must be considered from the beginning.

The frontend should have a centralized concept of:

- current user
- current role
- permissions
- visible navigation
- permitted UI actions

Do NOT create scattered logic such as:

if user is manager...
if user is accountant...
if user is sales...

throughout individual components.

Instead establish a centralized permission-aware UI mechanism.

For example, conceptually:

can("orders.confirm")
can("finance.expense.approve")
can("payroll.edit")
can("delivery.verify")

The exact implementation may differ, but the principle is mandatory.

IMPORTANT:

Frontend RBAC is for UI presentation and user experience.

It is NOT a security boundary.

The future PHP backend will enforce actual authorization.

Therefore:

- hide actions the user cannot perform
- disable actions when appropriate
- show appropriate unauthorized states
- never assume frontend hiding provides security

==================================================
10. MOCK DATA ARCHITECTURE
==================================================

Because the PHP backend does not exist yet, the frontend must support realistic mock data.

Create a clean mock-data/service layer.

Do NOT hardcode business data directly inside HTML components.

Instead use a structure conceptually like:

UI
 ↓
Frontend service
 ↓
Mock data

Later this becomes:

UI
 ↓
Frontend service
 ↓
PHP API

The UI should not need to be rewritten when the backend becomes available.

Mock data should represent realistic ERP data including:

- users
- customers
- orders
- inventory
- roasting batches
- deliveries
- payments
- expenses
- payroll
- notifications
- reports

Use realistic Ethiopian context where appropriate, including ETB monetary values, but do not create fake business rules.

==================================================
11. FRONTEND STATE
==================================================

Establish a clean approach for UI state.

The foundation must be capable of representing:

- loading
- loaded
- empty
- error
- submitting
- success
- failed submission
- disabled
- unauthorized
- stale data
- confirmation required

Do not make components assume that data always exists.

Every major reusable component must be able to gracefully handle missing or delayed data.

==================================================
12. COMPONENT PHILOSOPHY
==================================================

Build components as reusable visual/interaction primitives.

Examples:

- Button
- IconButton
- Input
- Select
- SearchInput
- Checkbox
- Radio
- Toggle
- Badge
- StatusBadge
- Avatar
- Card
- StatCard
- Table
- TableToolbar
- Pagination
- Modal
- Drawer
- ConfirmationDialog
- Toast
- Alert
- EmptyState
- LoadingState
- ErrorState
- Skeleton
- Tabs
- Breadcrumb
- Timeline
- TimelineItem
- Dropdown
- Tooltip
- DatePicker
- FileUpload
- ProgressIndicator

Do not build every screen using completely unique components.

The purpose of the component architecture is visual consistency.

==================================================
13. COMPONENT STATE REQUIREMENT
==================================================

Every interactive component must consider:

- default
- hover
- focus
- active/pressed
- disabled
- loading
- error
- success where appropriate
- empty where appropriate

Focus states must be visible.

Never remove focus indicators without replacing them with an accessible alternative.

==================================================
14. ACCESSIBILITY
==================================================

Target WCAG 2.1 AA.

The foundation must support:

- semantic HTML
- keyboard navigation
- visible focus states
- accessible labels
- accessible buttons
- proper form associations
- meaningful headings
- sufficient contrast
- screen-reader-friendly status information
- accessible dialogs
- accessible dropdowns
- accessible tables

Do not rely on color alone to communicate status.

Status should use:

COLOR + ICON + TEXT

where appropriate.

==================================================
15. ICON SYSTEM
==================================================

Establish one consistent icon system.

Do not mix random icon styles.

Icons must:

- have consistent visual weight
- have consistent sizing
- align correctly with text
- communicate meaning clearly

Status icons must remain consistent throughout the application.

For example:

safe
→ check-circle

warning
→ alert-triangle

danger
→ x-circle

information
→ info

pending
→ clock

Use the established design language consistently.

==================================================
16. TYPOGRAPHY
==================================================

Typography must create a clear hierarchy.

Use:

- strong page titles
- readable section titles
- restrained body text
- compact metadata
- highly readable tables
- clear numerical hierarchy

Do not overuse bold text.

Do not use decorative typography where it reduces usability.

The ERP should feel premium but operationally efficient.

==================================================
17. TABLE FOUNDATION
==================================================

Tables are extremely important to this ERP.

Create a reusable table architecture capable of supporting:

- column headers
- sorting indicators
- row hover
- selected rows
- status cells
- numerical alignment
- empty state
- loading state
- error state
- pagination
- responsive behavior
- row actions
- expandable rows where appropriate

Financial and inventory numbers must align cleanly.

Dates and status indicators must remain readable.

Mobile tables must have a deliberate responsive strategy rather than simply overflowing the viewport.

==================================================
18. FORM FOUNDATION
==================================================

Forms must be consistent across the ERP.

Create standards for:

- field labels
- required indicators
- helper text
- validation errors
- disabled fields
- read-only fields
- loading submission state
- success feedback
- unsaved changes
- confirmation before destructive actions

Do not make forms visually inconsistent between modules.

==================================================
19. FEEDBACK SYSTEM
==================================================

Establish a unified feedback system.

Use appropriate patterns for:

SUCCESS
→ toast / inline confirmation

WARNING
→ alert / confirmation

DANGER
→ destructive confirmation

ERROR
→ clear actionable error message

LOADING
→ skeleton/spinner/progress depending on context

EMPTY
→ helpful empty-state explanation + relevant action

Do not use generic:

"Something went wrong"

when a more useful explanation is possible.

==================================================
20. NAVIGATION FOUNDATION
==================================================

Create the architectural foundation for:

- sidebar
- mobile navigation
- top header
- breadcrumbs
- page title
- contextual actions
- user profile menu
- notification access

Navigation must eventually adapt to the authenticated user's permissions.

Do not hardcode every role directly into the sidebar component.

Use a centralized navigation configuration.

==================================================
21. VISUAL QUALITY
==================================================

The ERP should feel:

- sophisticated
- calm
- premium
- modern
- operational
- trustworthy
- coffee-inspired
- highly readable

Avoid:

- excessive gradients
- excessive glassmorphism
- excessive shadows
- giant rounded cards everywhere
- unnecessary animations
- excessive decorative elements
- visual clutter
- overly colorful dashboards

The design should communicate:

"professional coffee business operations system"

not:

"generic startup dashboard."

==================================================
22. MICROINTERACTIONS
==================================================

Create a restrained interaction foundation.

Animations should communicate:

- state change
- hierarchy
- feedback
- navigation
- completion

Do not animate everything.

Keep transitions fast and subtle.

Respect:

prefers-reduced-motion

for users who request reduced motion.

==================================================
23. PERFORMANCE
==================================================

The frontend architecture must remain lightweight.

Avoid unnecessary dependencies.

Avoid duplicated assets.

Avoid unnecessarily large JavaScript bundles.

Prefer native browser capabilities and CSS where practical.

CSS should handle visual behavior whenever JavaScript is unnecessary.

JavaScript should primarily handle:

- interaction
- state
- dynamic behavior
- data rendering
- user actions

==================================================
24. CODE QUALITY
==================================================

Use clear naming.

Use predictable naming conventions.

Avoid cryptic variable names.

Avoid enormous functions.

Avoid duplicated logic.

Avoid duplicated CSS.

Avoid copy-pasting entire components when a reusable component would be appropriate.

Keep components focused.

Keep utilities generic.

Keep page-specific logic out of global components.

==================================================
25. DOCUMENTATION
==================================================

Create a short frontend architecture document explaining:

1. folder structure
2. CSS architecture
3. JavaScript architecture
4. design-token system
5. component architecture
6. responsive strategy
7. theme strategy
8. RBAC-aware UI strategy
9. mock-data strategy
10. naming conventions

This document will become the implementation reference for all subsequent frontend prompts.

==================================================
26. DO NOT OVER-ENGINEER
==================================================

Do not introduce unnecessary complexity.

The system should be sophisticated in its result, not unnecessarily complicated internally.

Prefer:

simple
predictable
reusable
maintainable

over:

clever
abstract
over-engineered

==================================================
27. IMPORTANT BUSINESS-LOGIC BOUNDARY
==================================================

The frontend may visually represent business rules.

It must NOT become the authority for those rules.

For example:

The frontend may DISPLAY:

"10.6 KG shortfall"

but should not establish the authoritative business calculation for that number.

The future PHP backend will be authoritative.

For now, use mock values to demonstrate the UI.

This same principle applies to:

- stock calculations
- yield
- payment deadlines
- payroll calculations
- financial balances
- order feasibility
- inventory quantities
- commissions
- taxes
- delivery verification

==================================================
28. PREPARE FOR FUTURE BACKEND INTEGRATION
==================================================

Create interfaces/service boundaries so that mock data can later be replaced by PHP API calls.

Do not tightly couple page components to mock-data files.

Conceptually:

PAGE
 ↓
VIEW MODEL / SERVICE
 ↓
DATA SOURCE

Current data source:

MOCK DATA

Future data source:

PHP API

The page should not care which source is currently being used.

==================================================
29. IMPLEMENTATION ORDER
==================================================

Execute this prompt in the following order:

STEP 1
Inspect the existing frontend/project if one exists.

STEP 2
Document what already exists.

STEP 3
Establish the frontend architecture.

STEP 4
Establish CSS tokens.

STEP 5
Establish theme architecture.

STEP 6
Establish responsive architecture.

STEP 7
Establish component architecture.

STEP 8
Establish mock-data/service architecture.

STEP 9
Establish RBAC-aware UI architecture.

STEP 10
Create a small foundation/demo screen proving the architecture works.

Do NOT start implementing all ERP screens in this prompt.

==================================================
30. DEFINITION OF DONE
==================================================

This prompt is complete only when:

[ ] Frontend architecture is clearly established.

[ ] Folder/file organization is clean.

[ ] CSS architecture is established.

[ ] Design tokens are centralized.

[ ] Dark-mode architecture exists.

[ ] Responsive architecture exists.

[ ] Typography system exists.

[ ] Spacing system exists.

[ ] Color system exists.

[ ] Component architecture exists.

[ ] Component states are defined.

[ ] Accessibility foundations exist.

[ ] RBAC-aware UI foundation exists.

[ ] Navigation configuration architecture exists.

[ ] Mock-data architecture exists.

[ ] Frontend service/data abstraction exists.

[ ] Loading/error/empty/success states are supported.

[ ] Table foundation exists.

[ ] Form foundation exists.

[ ] Feedback/notification foundation exists.

[ ] Modal/drawer architecture exists.

[ ] No backend implementation has been introduced.

[ ] No business rules have been invented.

[ ] No unnecessary framework/dependency has been introduced.

[ ] A small demonstration screen proves that the foundation works.

[ ] The architecture document has been created.

==================================================
31. FINAL RULE
==================================================

Do not rush into building screens.

The purpose of F3-01 is to create the foundation that allows every subsequent ERP screen to look and behave as if it was designed and built by one world-class frontend team.

Build the foundation once.

Reuse it everywhere.

Do not solve the same problem differently on every page.
