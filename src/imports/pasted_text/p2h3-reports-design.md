P2H3 — REPORTS, NOTIFICATIONS, SETTINGS & FINAL GLOBAL UX

COFFEE-ROASTING ERP — FRONTEND DESIGN SYSTEM

This is P2H3 of the P2H sequence.

P2H1 covered:
- Delivery
- Customer verification
- Payments

P2H2 covered:
- Finance
- Banking
- Expenses
- Payroll

P2H3 covers:
- Reports
- Notifications
- Settings
- Global search/filter/export behavior
- System-wide UX consistency
- Final cross-module quality requirements

TECH STACK:
- HTML
- CSS
- JavaScript
- PHP backend

The frontend must be fully feasible using standard CSS, HTML, and JavaScript.
PHP is authoritative for business logic, calculations, permissions, workflow transitions, data, and security.

============================================================
01 — REPORTS MODULE
============================================================

Create a dedicated:

"Reports"

page.

Subtitle:

"Understand business performance, inventory, operations, finance, sales, roasting, delivery, and other authorized activity."

Reports must feel like a controlled business intelligence area, not a generic analytics template.

The interface should prioritize:

- clarity
- comparison
- filtering
- traceability
- export
- readability
- role-based access

============================================================
02 — REPORT ACCESS
============================================================

CRITICAL RBAC RULE:

Users only see reports they are authorized to access.

Do not display inaccessible reports and then show:

"Access denied."

Instead, unauthorized reports should not appear in the user's Reports navigation or report catalog.

The backend/PHP permission system is authoritative.

Frontend visibility is only a UX layer.

============================================================
03 — REPORT CATALOG
============================================================

Create a report catalog organized into logical groups.

Possible groups:

SALES

INVENTORY

ROASTING

DELIVERY

FINANCE

PAYMENTS

EXPENSES

PAYROLL

OPERATIONS

CUSTOMER

The exact reports displayed must come from the actual backend permission/report matrix.

Do not invent reports that do not exist in the backend contract.

============================================================
04 — REPORT CARD
============================================================

Each report should appear as a clean card/list item.

Include:

Report name

Short description

Category

Optional last generated date

Primary action:

"Open Report"

Optional:

"Export"

Use a restrained visual hierarchy.

Do not overload report cards with unnecessary metrics.

============================================================
05 — REPORT VIEW
============================================================

Create a reusable report layout.

Structure:

REPORT HEADER

Report title

Description

Date range

Filters

Actions

↓

REPORT SUMMARY

Key figures

↓

REPORT CONTENT

Table/chart/summary depending on report type

↓

REPORT FOOTER

Optional generated metadata

Export actions

============================================================
06 — REPORT FILTERS
============================================================

Filters must be backend-driven.

Possible filters:

Date range

Branch

Customer

Sales representative

Coffee type

Origin

Roast level

Order status

Payment status

Employee

Bank account

Expense category

Payroll period

Inventory type

The exact filters depend on the report.

Do not display irrelevant filters.

============================================================
07 — DATE RANGE
============================================================

Create a consistent date-range component.

Options may include:

Today

This Week

This Month

Last Month

This Quarter

This Year

Custom Range

The actual report query is sent to PHP.

The frontend does not calculate the report itself.

============================================================
08 — REPORT TABLES
============================================================

Reports containing tabular data must use a consistent report table.

Requirements:

- clear headers
- sortable columns where supported
- pagination where needed
- readable numeric alignment
- sticky headers on long desktop tables where appropriate
- responsive mobile transformation

Financial numbers should be right-aligned.

Quantities should use consistent units.

============================================================
09 — REPORT SUMMARY CARDS
============================================================

Where appropriate, reports can show summary cards.

Examples:

Total Sales

Total Orders

Total Delivered

Total Paid

Outstanding

Total Green Coffee

Total Roasted Coffee

Total Expenses

Total Payroll

These values MUST come from PHP.

Never reproduce backend calculations in JavaScript.

============================================================
10 — REPORT VISUALIZATIONS
============================================================

Use charts only when they improve understanding.

Possible visualizations:

Bar charts

Line charts

Donut charts

Progress indicators

Trend summaries

Do not turn every report into a dashboard.

Tables remain the authoritative detailed representation.

Charts are supplementary.

============================================================
11 — CHART DESIGN
============================================================

Charts must use the existing design tokens.

Do not introduce random colors.

Use semantic colors where appropriate.

Example:

Green:
positive/healthy/completed

Amber:
warning/pending

Red:
problem/negative

Espresso/brand:
primary data series

Blue/info:
secondary informational series

Never use color alone to communicate meaning.

============================================================
12 — REPORT EMPTY STATE
============================================================

If a report contains no records:

Show:

"No data available for the selected period."

Also show:

"Try changing your filters or date range."

Do not show an empty chart frame.

============================================================
13 — REPORT ERROR
============================================================

If a report fails:

"Unable to generate this report."

Provide:

Retry

Do not expose backend/PHP/database errors.

============================================================
14 — REPORT LOADING
============================================================

Use report-specific skeleton loading.

Show placeholders for:

Header

Summary cards

Table

Charts where applicable

Avoid a completely blank screen.

============================================================
15 — REPORT EXPORT
============================================================

The system supports:

CSV

PDF

CSV is primarily for:

- structured tables
- data analysis
- spreadsheet workflows
- transaction data
- operational datasets

PDF is primarily for:

- formal reports
- financial statements
- professional sharing
- printing
- management documents

============================================================
16 — EXPORT CONTROL
============================================================

Create a reusable:

"Export"

control.

Options:

Export CSV

Export PDF

The available formats depend on the report.

Do not show PDF if that report is not designed for a meaningful PDF representation.

============================================================
17 — EXPORT STATES
============================================================

Create:

Preparing export...

Export ready

Download

Export failed

Retry

Do not freeze the page while an export is generated.

============================================================
18 — REPORT PDF PREVIEW
============================================================

Where appropriate, provide a clean PDF-oriented preview.

The PDF should have:

Company identity

Report title

Reporting period

Generated date

Relevant filters

Report content

Page numbering where appropriate

Professional spacing

Do not design PDFs like screenshots of the web application.

============================================================
19 — REPORT PERMISSION UX
============================================================

If a user has:

reports.sales.view

they can access authorized sales reports.

If they have:

reports.finance.view

they can access authorized financial reports.

If they lack a permission:

the report should not appear.

Use the real backend permission names once the API contract is available.

============================================================
20 — REPORT SECURITY
============================================================

Never assume that hiding a report card secures the report.

The PHP backend must enforce report authorization.

The frontend only renders what the backend permits.

============================================================
21 — NOTIFICATIONS MODULE
============================================================

Create:

"Notifications"

Notifications are operational signals.

They should help users answer:

"What needs my attention?"

"What changed?"

"What do I need to approve?"

"What happened?"

============================================================
22 — NOTIFICATION GROUPS
============================================================

Use four primary groups:

URGENT

NEEDS APPROVAL

WARNINGS

INFORMATION

These categories come from backend severity/type data.

Do not classify notifications by analyzing message text.

============================================================
23 — URGENT NOTIFICATIONS
============================================================

Urgent examples may include:

Urgent customer order

Critical stock shortage

Delivery problem

Disputed delivery

Critical discrepancy

Other backend-defined urgent events

Use:

danger/urgent visual treatment

alert icon

clear title

short explanation

primary action

============================================================
24 — NEEDS APPROVAL
============================================================

Examples:

Expense awaiting Manager approval

Payroll awaiting approval

Roasted output awaiting Manager review

Packing discrepancy requiring approval

Urgent customer request requiring confirmation

Each notification should include:

What needs approval

Related record

Who/what triggered it

Time

Action

============================================================
25 — WARNING NOTIFICATIONS
============================================================

Examples:

Low stock

Approaching payment deadline

Inventory discrepancy

Pending reconciliation

Potential operational issue

Use the warning token.

Do not make every warning look like an emergency.

============================================================
26 — INFORMATION NOTIFICATIONS
============================================================

Examples:

Order completed

Payment received

Delivery verified

Expense paid

Payroll finalized

Use calm informational styling.

============================================================
27 — NOTIFICATION CARD
============================================================

Each notification contains:

Icon

Title

Short description

Timestamp

Severity indicator

Read/unread state

Related entity

Action/deep link

Example:

"Expense #EXP-1024 requires approval."

[Review Expense]

============================================================
28 — DEEP LINKING
============================================================

CRITICAL RULE:

Every actionable notification should contain:

related_entity_type

related_entity_id

or equivalent backend-supported identifiers.

Clicking the notification should navigate directly to the relevant record.

Examples:

Order notification
→ Order Detail

Expense notification
→ Expense Detail

Payroll notification
→ Payroll Run

Delivery notification
→ Delivery Detail

Bank notification
→ Reconciliation

Do not create notifications that describe an object but have nowhere useful to go.

============================================================
29 — NOTIFICATION CENTER
============================================================

Create:

"Notification Center"

Top:

All

Urgent

Needs Approval

Warnings

Information

Then:

Notification list

Support:

Mark as read

Mark all as read

Open related record

============================================================
30 — UNREAD STATE
============================================================

Unread notifications should have a subtle visual distinction.

Possible:

- slightly raised background
- unread indicator dot
- stronger title weight

Do not rely on color alone.

============================================================
31 — NOTIFICATION BADGE
============================================================

The global navigation may show:

Notification count

Approval count

Urgent count where appropriate

Counts must come from PHP.

Do not calculate them from currently loaded frontend data.

============================================================
32 — NOTIFICATION REFRESH
============================================================

Use one consistent strategy across the application.

For example:

- refresh on navigation
- refresh after important actions
- lightweight polling where supported

Do not create separate notification-refresh logic for every page.

============================================================
33 — NOTIFICATION EMPTY STATE
============================================================

If there are no notifications:

"You're all caught up."

Secondary:

"No new notifications require your attention."

Use a calm, positive visual.

============================================================
34 — SETTINGS MODULE
============================================================

Create:

"Settings"

Subtitle:

"Manage configurable business rules and system preferences."

Settings must be treated as controlled configuration.

Do not make the page feel like a random collection of forms.

============================================================
35 — SETTINGS CATEGORIES
============================================================

Organize settings into clear categories.

Possible categories:

General

Yield Settings

VAT

Pricing

Packaging

Expense Categories

Coffee Master Data

Operational Settings

Notifications

System Preferences

The exact list follows the backend settings/master-data model.

============================================================
36 — SETTINGS STRUCTURE
============================================================

Desktop:

Left category navigation

Right settings content

Tablet:

Compact category navigation

Mobile:

Settings category selector

Then:

Setting sections

============================================================
37 — SETTINGS EDITOR
============================================================

Settings should be rendered from backend-defined configuration where practical.

Each setting should have:

Name

Description

Current value

Input type

Unit

Validation

Save behavior

Where appropriate:

Default value

Last updated

Updated by

============================================================
38 — SETTINGS TYPES
============================================================

Support:

Text

Number

Percentage

Currency

Boolean

Select

Multi-select where authorized

Date/time where required

Do not create a new bespoke component for every setting.

Use reusable setting field components.

============================================================
39 — YIELD SETTINGS
============================================================

Create:

"Yield Settings"

Show relevant configured yield percentages/ranges.

These values influence important business calculations.

Therefore:

The frontend must never silently calculate operational results from them.

The backend remains authoritative.

============================================================
40 — VAT SETTINGS
============================================================

Create:

"VAT"

Show:

Current VAT rate

Effective date where applicable

Last updated

Updated by

Any backend-provided explanation.

Because VAT is financially sensitive:

Require explicit confirmation before changing it.

============================================================
41 — VAT CHANGE CONFIRMATION
============================================================

When changing VAT:

Show:

Current value

New value

Difference

Effective behavior if provided

Warning:

"This setting affects future financial calculations."

Actions:

Cancel

Confirm Change

Do not hide consequences.

============================================================
42 — PRICING SETTINGS
============================================================

Create:

"Pricing"

Allow authorized users to manage backend-defined pricing configuration.

Display:

Current price

Unit

Applicable coffee/product

Effective period where applicable

Last updated

Do not make pricing rules into free-form undocumented fields.

============================================================
43 — PACKAGING SETTINGS
============================================================

Create:

"Packaging"

Allow authorized configuration of packaging-related values defined by backend.

Examples:

Packaging types

Sizes

Units

Prices

Availability

Use structured master-data tables where appropriate.

============================================================
44 — EXPENSE CATEGORIES
============================================================

Create:

"Expense Categories"

Display:

Category

Status

Created date

Actions

Authorized Manager/admin users may add/edit/disable categories according to backend permissions.

Do not permanently hardcode categories into frontend JavaScript.

============================================================
45 — SETTINGS PERMISSIONS
============================================================

Settings require strong RBAC.

A user may be able to:

view settings

but not:

edit settings.

Some users may edit only certain settings.

Examples:

settings.yield.view

settings.yield.edit

settings.vat.view

settings.vat.edit

settings.pricing.view

settings.pricing.edit

Use actual backend permissions when available.

============================================================
46 — HIGH-IMPACT SETTINGS
============================================================

Treat these as high-impact:

VAT

Yield percentages

Batch capacity

Pricing

Other business-critical settings defined by backend

Before saving:

show consequences.

Require explicit confirmation.

============================================================
47 — SETTINGS AUDIT
============================================================

For important settings, show:

Previous value

New value

Changed by

Date/time

Reason where required

This is especially important for:

VAT

Yield

Pricing

Batch capacity

============================================================
48 — SETTINGS SUCCESS
============================================================

After successful change:

"Setting updated successfully."

Also display the updated value.

============================================================
49 — SETTINGS ERROR
============================================================

If update fails:

"Unable to update this setting."

Keep the previous value visible.

Do not make the UI appear as though the change succeeded.

============================================================
50 — SETTINGS LOADING
============================================================

When loading settings:

Use skeleton fields.

When saving:

Disable only the relevant controls.

Show:

Saving...

Do not freeze the entire application unnecessarily.

============================================================
51 — SETTINGS UNSAVED CHANGES
============================================================

If the user edits a setting but has not saved:

Clearly show:

Unsaved changes

Actions:

Save

Discard

If navigating away:

warn the user when appropriate.

============================================================
52 — GLOBAL SEARCH
============================================================

Create a consistent global search experience.

The search may search authorized entities such as:

Orders

Customers

Inventory

Expenses

Payments

Employees

Bank transactions

Reports

The actual searchable entities depend on backend API support.

============================================================
53 — SEARCH RESULTS
============================================================

Results should be grouped:

Orders

Customers

Inventory

Finance

Other

Each result should display:

Entity type

Identifier/name

Relevant status

Short supporting information

Clicking opens the appropriate detail page.

============================================================
54 — SEARCH SECURITY
============================================================

Search results must respect RBAC.

A Sales representative must not discover unauthorized financial or customer information through search.

The PHP backend must enforce this.

============================================================
55 — GLOBAL FILTER DESIGN
============================================================

All filter controls throughout the ERP should follow the same design.

Use:

Filter button

Filter drawer/popover

Active filter chips

Clear all

Apply

The visual language must remain consistent across:

Orders

Inventory

Finance

Expenses

Reports

Banking

Payroll

============================================================
56 — TABLE BEHAVIOR
============================================================

Create one consistent table system.

Desktop:

full table

Tablet:

reduced secondary columns

Mobile:

card/list transformation

Every table should support where relevant:

Loading

Empty

Error

Pagination

Sorting

Filtering

Selection where authorized

============================================================
57 — PAGINATION
============================================================

Large datasets must be paginated.

Do not assume the frontend receives every record.

Pagination should be controlled by backend responses.

Display:

Current range

Total where provided

Previous

Next

Page controls where appropriate

============================================================
58 — GLOBAL CONFIRMATION DIALOG
============================================================

Create one reusable confirmation dialog.

Structure:

Icon

Title

Short explanation

Important consequence

Cancel

Primary action

Danger action where relevant

Examples:

Approve

Reject

Pay

Finalize

Delete

Change high-impact setting

============================================================
59 — GLOBAL DRAWER
============================================================

Create a reusable drawer for:

Filters

Quick details

Secondary information

Audit history where appropriate

On mobile:

drawer becomes a full-screen panel.

============================================================
60 — GLOBAL MODAL
============================================================

Create consistent modal behavior:

Backdrop

Centered panel

Clear title

Close button

Content

Actions

Keyboard accessible

ESC close where appropriate

No keyboard traps.

============================================================
61 — GLOBAL STATUS SYSTEM
============================================================

Use the centralized status mapping established earlier.

Never hardcode a new visual status style.

Every status has:

Label

Icon

Semantic color

Meaning

Examples:

Safe:

check-circle

Warning:

alert-triangle

Danger:

x-circle

Info/pending:

clock/info

============================================================
62 — STATUS ACCESSIBILITY
============================================================

Never communicate status through color alone.

Example:

Paid

✓ Paid

not merely:

green badge

Similarly:

Overdue

! Overdue

not merely:

red badge

============================================================
63 — GLOBAL TOAST SYSTEM
============================================================

Create reusable toast notifications for:

Success

Warning

Error

Information

Use them for short-lived feedback.

Do not use toasts for critical information that must remain visible.

============================================================
64 — GLOBAL LOADING SYSTEM
============================================================

Every data-driven page must support:

Initial loading

Refreshing

Submitting

Saving

Exporting

Do not leave buttons visually unchanged while requests are processing.

============================================================
65 — GLOBAL ERROR SYSTEM
============================================================

Create:

Inline field error

Section error

Page error

Network error

Permission error

Each should communicate:

What happened?

What can the user do?

============================================================
66 — PERMISSION ERROR
============================================================

If the backend returns a permission denial:

Display:

"You don't have permission to perform this action."

Do not expose implementation details.

If the user should not have reached the action at all, this is still handled gracefully.

============================================================
67 — SESSION / AUTH UX
============================================================

Create consistent states for:

Session expired

Unauthorized

Forbidden

Server unavailable

Example:

"Your session has expired. Please sign in again."

Do not expose PHP/session internals.

============================================================
68 — DARK MODE
============================================================

All Reports, Notifications, Settings, and global components must support dark mode.

Do not simply invert colors.

Use semantic design tokens.

Ensure:

Cards

Tables

Forms

Modals

Charts

Badges

Notifications

Inputs

Drawers

Navigation

all remain readable.

============================================================
69 — RESPONSIVE SYSTEM
============================================================

Use the established breakpoints.

Desktop:

rich multi-column layouts

Tablet:

condensed layouts

Mobile:

single-column layouts

Do not simply shrink desktop interfaces.

Recompose them.

============================================================
70 — MOBILE REPORTS
============================================================

On mobile:

filters become a drawer

tables become cards

summary cards stack

charts become horizontally scrollable only when necessary

export actions remain accessible

Do not force a huge desktop table into a narrow viewport.

============================================================
71 — MOBILE NOTIFICATIONS
============================================================

Notifications should be extremely simple on mobile.

Structure:

Severity

Title

Short description

Time

Action

Full-width tap target.

============================================================
72 — MOBILE SETTINGS
============================================================

Settings should become:

Category selector

↓

Setting group

↓

Setting field

↓

Save

Avoid persistent desktop sidebars on narrow screens.

============================================================
73 — TYPOGRAPHY
============================================================

Use the established typography tokens.

Hierarchy:

Display

H1

H2

H3

Body Large

Body

Body Small

Caption

Do not introduce arbitrary font sizes.

============================================================
74 — SPACING
============================================================

Use only the established spacing tokens.

No random:

13px

17px

22px

etc.

Every component must use the global spacing system.

============================================================
75 — CSS ARCHITECTURE
============================================================

Organize CSS around reusable semantic components.

Suggested structure:

/css/
  tokens.css
  reset.css
  base.css
  layout.css
  components/
  modules/
  utilities.css
  responsive.css
  dark-mode.css

Do not create one enormous stylesheet containing unrelated rules.

============================================================
76 — CSS TOKENS
============================================================

Use CSS custom properties for:

Colors

Typography

Spacing

Radius

Shadows

Breakpoints where practical

Example conceptually:

--color-brand-espresso

--color-brand-roast

--color-status-safe

--color-status-warning

--color-status-danger

--color-status-info

Never scatter raw hex colors throughout the application.

============================================================
77 — JAVASCRIPT BOUNDARY
============================================================

JavaScript handles:

interaction

visual state

dialogs

drawers

tabs

filter controls

form UX

client-side validation where appropriate

It does NOT become the business logic authority.

============================================================
78 — PHP BOUNDARY
============================================================

PHP controls:

authorization

RBAC

business rules

financial calculations

report calculations

status transitions

database operations

audit records

workflow decisions

The frontend consumes API responses.

============================================================
79 — FINAL GLOBAL UX CONSISTENCY
============================================================

Across every module:

Buttons must look consistent.

Inputs must look consistent.

Tables must look consistent.

Statuses must look consistent.

Modals must look consistent.

Notifications must look consistent.

Empty states must look consistent.

Loading states must look consistent.

Errors must look consistent.

Dark mode must be consistent.

Do not allow each module to develop its own visual language.

============================================================
80 — FINAL REPORT FRAMES
============================================================

Create:

01. Reports Home

02. Report Category View

03. Report Detail

04. Report Detail — Filters

05. Report Detail — Loading

06. Report Detail — Empty

07. Report Detail — Error

08. Report Export Menu

09. PDF Report Preview

10. CSV Export State

============================================================
81 — FINAL NOTIFICATION FRAMES
============================================================

Create:

11. Notification Center

12. Notification Center — Urgent

13. Notification Center — Needs Approval

14. Notification Center — Warnings

15. Notification Center — Information

16. Notification Center — Empty

17. Notification Detail/Deep Link State

18. Global Notification Dropdown

============================================================
82 — FINAL SETTINGS FRAMES
============================================================

Create:

19. Settings Home

20. Settings Category

21. Yield Settings

22. VAT Settings

23. VAT Change Confirmation

24. Pricing Settings

25. Packaging Settings

26. Expense Categories

27. Settings Loading

28. Settings Unsaved Changes

29. Settings Success

30. Settings Error

31. Settings Audit History

============================================================
83 — FINAL GLOBAL COMPONENT FRAMES
============================================================

Create a dedicated component showcase containing:

Buttons

Inputs

Selects

Date Pickers

Tables

Cards

Badges

Status indicators

Notifications

Toasts

Modals

Drawers

Tabs

Pagination

Empty states

Loading skeletons

Error states

Confirmation dialogs

File upload states

Dark mode

Mobile states

This page is the visual reference for the entire ERP.

============================================================
84 — COMPONENT STATE AUDIT
============================================================

Every interactive component must demonstrate:

Default

Hover

Focus

Pressed

Disabled

Loading

Error

Success

Empty where applicable

Dark mode

Mobile

============================================================
85 — FINAL RBAC AUDIT
============================================================

Verify that:

Navigation follows permissions.

Reports follow permissions.

Notifications only reveal authorized records.

Settings follow permissions.

Financial information follows permissions.

Search follows permissions.

Export follows permissions.

Actions follow permissions.

The frontend must never assume that because a user can view a screen they can perform every action on that screen.

============================================================
86 — FINAL BUSINESS LOGIC AUDIT
============================================================

Verify that the frontend does NOT independently calculate:

Financial totals

Bank balances

Report totals

Payroll totals

Payment deadlines

Operational yield

Inventory feasibility

Any other authoritative business calculation.

PHP is the source of truth.

============================================================
87 — FINAL SECURITY AUDIT
============================================================

Verify:

No sensitive information unnecessarily exposed.

No authorization implemented solely in CSS/JavaScript.

No hidden button treated as security.

No direct balance editing.

No unauthorized report access.

No unauthorized export access.

No unauthorized payroll modification.

No unauthorized financial approval.

============================================================
88 — FINAL VISUAL AUDIT
============================================================

Verify:

Coffee-inspired visual identity

Premium but practical appearance

Excellent whitespace

Strong hierarchy

Restrained shadows

Subtle borders

Consistent spacing

Consistent typography

Consistent status colors

Consistent icons

No unnecessary gradients

No excessive animations

No visual clutter

No generic SaaS-template appearance

============================================================
89 — FINAL USER EXPERIENCE
============================================================

The ERP should feel like one coherent product.

A user should never feel:

"I am entering another application."

Whether they move from:

Orders

to Inventory

to Roasting

to Delivery

to Payments

to Finance

to Banking

to Reports

to Settings

the visual language remains unmistakably the same.

============================================================
90 — FINAL QUALITY STANDARD
============================================================

The final design must be:

SIMPLE FOR USERS

POWERFUL FOR MANAGERS

SAFE FOR FINANCE

CLEAR FOR OPERATIONS

STRICT ABOUT RBAC

RESPONSIVE

ACCESSIBLE

DARK-MODE READY

CSS-FEASIBLE

PHP-BACKEND COMPATIBLE

AUDIT-FRIENDLY

AND VISUALLY PREMIUM.

The goal is not to make the ERP look complicated.

The goal is to make a complicated coffee business feel simple to operate.

Every screen should answer the user's next question before they have to ask it.