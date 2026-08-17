You are continuing the frontend UI/UX implementation of the Coffee-Roasting ERP.

COMPLETED:

F3-01 — Frontend Architecture
F3-02 — Design Tokens, Theme, Responsive Foundation & Dark Mode
F3-03 — Application Shell, Navigation & RBAC-Aware Structure
F3-04 — Core Component Library, States & Reusable UI Components
F3-05 — Reusable Page Patterns, Composite UI & Screen Templates
F3-06 — Orders & Customer Experience
F3-07 — Roasting, Production Workflow & Roasting Job Experience
F3-08 — Inventory & Stock Management Experience
F3-09 — Customers, Sales & Customer Management Experience
F3-10 — Packing, Delivery & Dispatch Experience
F3-11 — Finance, Payments & Financial Control Experience
F3-12 — Banking, Cash Control & Reconciliation Experience

NOW BUILD:

F3-13 — EXPENSES, EXPENSE APPROVAL & EXPENSE CONTROL EXPERIENCE


==================================================
IMPORTANT IMPLEMENTATION BOUNDARY
==================================================

THIS IS FRONTEND UI/UX ONLY.

Use:

- HTML
- CSS
- JavaScript only where necessary for interface behavior
- the established design system
- existing reusable components
- existing page templates
- centralized RBAC/permission architecture

The eventual backend will use PHP.

DO NOT implement PHP.

DO NOT implement database logic.

DO NOT implement accounting/business calculations.

DO NOT make the frontend authoritative for financial values.

The backend will eventually be authoritative for:

- expense records
- expense categories
- expense amounts
- expense dates
- payment methods
- approval state
- rejection state
- approval history
- expense totals
- accounting treatment
- financial references
- permissions

The frontend is responsible for:

DISPLAY
+
INPUT
+
AUTHORIZED ACTIONS
+
CLEAR APPROVAL UX


==================================================
1. PRIMARY OBJECTIVE
==================================================

Create the complete Expenses experience.

The interface must make it easy for authorized users to:

- see expenses
- search expenses
- filter expenses
- create an expense
- review an expense
- approve an expense
- reject an expense
- understand why an expense is pending
- see who approved/rejected it
- see the financial amount
- understand expense categories
- review expense history
- identify expenses requiring attention

The experience must feel like a professional ERP financial-control system.


==================================================
2. CORE EXPENSE PRINCIPLE
==================================================

An expense is a financial record.

It must never feel like an informal note.

Every expense should have clear:

- amount
- date
- category
- description
- payment method where applicable
- status
- creator
- approval history
- reference
- supporting documentation where supported

The UI should communicate financial accountability.


==================================================
3. EXPENSE MODULE STRUCTURE
==================================================

Create:

1. Expense Dashboard
2. Expense List
3. Expense Detail
4. New Expense
5. Edit Expense where permitted
6. Expense Approval
7. Expense Rejection
8. Expense Activity/Timeline
9. Expense Categories
10. Expense Empty/Loading/Error States


==================================================
4. EXPENSE DASHBOARD
==================================================

Page title:

Expenses

Subtitle:

Track, review, and manage business expenses.

Use the established DashboardTemplate.

Summary cards may include:

Total Expenses
Pending Approval
Approved
Rejected

All values must come from backend-provided data.

Do not calculate authoritative totals in the frontend.


==================================================
5. EXPENSE SUMMARY CARDS
==================================================

Create reusable:

ExpenseSummaryCard

Example:

TOTAL EXPENSES

ETB 245,850.00

Another:

PENDING APPROVAL

12

Another:

APPROVED

ETB 221,400.00

Another:

REJECTED

8

Use existing card styling and typography.


==================================================
6. EXPENSE ATTENTION PANEL
==================================================

Where authorized, show:

Needs Attention

Examples:

12 expenses awaiting approval

3 expenses require review

2 expenses were rejected

Each item should deep-link to the relevant expense.

Do not create fake counts.

Counts must come from backend responses.


==================================================
7. EXPENSE LIST
==================================================

Create a professional expense table.

Recommended columns:

Date
Reference
Category
Description
Amount
Submitted By
Status
Action

Example:

12 Aug 2026
EXP-1042
Transport
Delivery fuel
ETB 4,500.00
Abebe
Pending Approval
[View]


==================================================
8. EXPENSE STATUS
==================================================

Use the centralized status vocabulary.

Potential display states:

Draft
Pending Approval
Approved
Rejected
Cancelled

These are examples.

The actual backend status values must eventually map through the centralized status-mapping system.

Do not hardcode status labels independently inside expense components.


==================================================
9. STATUS VISUALIZATION
==================================================

Use the established status semantics.

Safe:

Approved

Warning:

Pending Approval

Danger:

Rejected

Neutral/info:

Draft

Cancelled should use an appropriate neutral treatment.

Every status must include an icon where appropriate.

Never rely on color alone.


==================================================
10. EXPENSE FILTERS
==================================================

Create a reusable ExpenseFilterBar.

Filters:

Category
Status
Submitted By
Payment Method
Date Range

Potential amount filter:

Minimum Amount
Maximum Amount

Search:

Reference
Description

All filtering should be structured for server-side implementation.


==================================================
11. EXPENSE SEARCH
==================================================

Search should support:

Expense reference
Description

Example:

Search expenses...

Do not create a client-only filtering architecture.

The eventual backend must receive search/filter parameters.


==================================================
12. DATE FILTER
==================================================

Provide:

Today
This Week
This Month
Previous Month
Custom Range

Use the established date-range component.

Do not introduce a new date picker style.


==================================================
13. NEW EXPENSE
==================================================

Create:

New Expense

Use the standard FormTemplate.

Fields:

Expense Category
Amount
Date
Description
Payment Method
Reference
Notes
Supporting Document where supported

Mark required fields clearly.


==================================================
14. EXPENSE CATEGORY
==================================================

Use a searchable select where the category list is large.

Example categories may include:

Transport
Fuel
Utilities
Maintenance
Office Supplies
Packaging
Equipment
Rent
Other

These are UI examples only.

The actual category list should come from backend master data/settings.


==================================================
15. AMOUNT FIELD
==================================================

Use the established ETB formatting.

Example:

Amount

ETB 4,500.00

The input should clearly communicate that the currency is ETB.

Do not allow ambiguous currency presentation.


==================================================
16. DATE FIELD
==================================================

Use the established date picker.

Show:

Expense Date

Ensure:

- clear label
- keyboard accessibility
- validation
- invalid-state styling
- consistent date formatting


==================================================
17. DESCRIPTION
==================================================

Use a textarea for:

Description

Example placeholder:

Describe what this expense was for.


==================================================
18. PAYMENT METHOD
==================================================

Where supported, provide:

Payment Method

Potential values:

Cash
Bank Transfer
Card
Other

Final values must come from backend-defined master data.


==================================================
19. SUPPORTING DOCUMENT
==================================================

Where the system supports attachments, provide:

Supporting Document

Use the established upload component.

Display:

- selected file
- file type
- file size
- upload progress
- success
- error
- remove action

Do not expose technical storage paths.


==================================================
20. EXPENSE SUBMISSION
==================================================

Primary action:

[Submit Expense]

During submission:

[Submitting...]

Prevent duplicate submissions.

After success:

Expense submitted successfully.

Display the backend-generated expense reference.


==================================================
21. EXPENSE DETAIL
==================================================

Create:

Expense Detail

Header:

Expense #EXP-1042

Status:

Pending Approval

Show:

Amount
Category
Date
Description
Payment Method
Submitted By
Reference
Supporting Document
Notes


==================================================
22. FINANCIAL INFORMATION
==================================================

Make the amount highly visible.

Example:

EXPENSE AMOUNT

ETB 4,500.00

Do not bury the amount inside a dense table.


==================================================
23. EXPENSE METADATA
==================================================

Show:

Created By
Created At
Last Updated
Reference
Status

Where backend data supports it.


==================================================
24. EXPENSE ACTIVITY
==================================================

Use the established timeline/activity component.

Potential events:

Expense Created
Expense Submitted
Expense Approved
Expense Rejected
Expense Edited
Expense Cancelled

Only show events actually returned by backend audit/history records.


==================================================
25. APPROVAL EXPERIENCE
==================================================

Create a dedicated approval section.

For a pending expense:

PENDING APPROVAL

This expense is waiting for an authorized reviewer.

Show:

Amount
Category
Description
Submitted By
Date
Supporting document

Actions:

[Approve]

[Reject]


==================================================
26. APPROVAL BUTTON VISIBILITY
==================================================

CRITICAL RBAC RULE.

Approve and Reject actions must be shown only when:

1. The user has the required permission.
2. The expense state allows the action.

Do not merely hide buttons based on role names.

Use the centralized permission system.


==================================================
27. APPROVAL CONFIRMATION
==================================================

When the user selects:

Approve

show:

Approve Expense?

You are about to approve:

ETB 4,500.00

Category:
Transport

Submitted By:
Abebe

[Cancel]

[Approve Expense]


==================================================
28. APPROVAL SUCCESS
==================================================

After successful backend confirmation:

Expense approved successfully.

Update the displayed status using the backend response.

Do not locally assume approval succeeded before receiving the response.


==================================================
29. REJECTION EXPERIENCE
==================================================

Rejecting an expense requires a reason.

Dialog:

Reject Expense

Reason for rejection

[textarea]

The reason should be mandatory where the backend requires it.

Actions:

[Cancel]

[Reject Expense]


==================================================
30. REJECTION CONFIRMATION
==================================================

Use clear consequence-oriented copy.

Example:

Reject this expense?

The expense will be marked as rejected and the rejection reason will be recorded.

Reason:

[required field]

[Cancel]

[Reject Expense]


==================================================
31. REJECTION DISPLAY
==================================================

Rejected expenses should show:

Rejected

Reason:

[backend-provided reason]

Rejected By:

[backend-provided actor]

Rejected At:

[backend-provided timestamp]


==================================================
32. EDITING EXPENSES
==================================================

If editing is supported:

Allow editing only when:

- backend permits it
- expense state permits it
- user has permission

Do not allow arbitrary editing of approved financial records.

If an approved expense cannot be edited, do not display an Edit button.


==================================================
33. EDIT WARNING
==================================================

If an editable expense has already entered a review process, make the consequence clear.

Example:

Editing this expense may return it to review depending on the financial workflow.

The exact behavior must come from backend rules.

Do not invent workflow behavior.


==================================================
34. EXPENSE CANCELLATION
==================================================

If cancellation is supported:

Show:

Cancel Expense?

This will mark the expense as cancelled.

[Cancel]

[Confirm Cancellation]


==================================================
35. APPROVAL QUEUE
==================================================

Create:

Expense Approval Queue

This view should prioritize:

Pending Approval

Recommended columns:

Date
Reference
Category
Amount
Submitted By
Age
Status
Action


==================================================
36. APPROVAL QUEUE PRIORITY
==================================================

Pending items should be easy to scan.

Where backend supplies urgency or age:

display it.

Example:

Pending for:

3 days

Do not calculate approval age independently in frontend if the backend already supplies the authoritative value.


==================================================
37. APPROVAL EMPTY STATE
==================================================

When nothing requires approval:

Nothing needs your attention right now.

All submitted expenses are up to date.


==================================================
38. EXPENSE DETAIL — REVIEW LAYOUT
==================================================

For approvers, organize information as:

HEADER
+
STATUS

FINANCIAL SUMMARY

Expense Amount
Category
Date

DESCRIPTION

Description
Notes

SUBMITTER

Submitted By
Created At

DOCUMENTS

Supporting Documents

APPROVAL

Available Actions

ACTIVITY

Timeline


==================================================
39. EXPENSE CATEGORY MANAGEMENT
==================================================

If the user has permission to manage master data, create:

Expense Categories

Display:

Category Name
Description
Status
Usage where supplied
Action


==================================================
40. CATEGORY CREATE
==================================================

Create:

New Expense Category

Fields:

Category Name
Description
Status

Use standard form components.


==================================================
41. CATEGORY EDIT
==================================================

Create:

Edit Expense Category

Do not create custom category-editing UI.

Reuse standard form architecture.


==================================================
42. CATEGORY DEACTIVATION
==================================================

If supported:

Deactivate Category

Use consequence-aware confirmation.

Example:

Deactivate this category?

New expenses will no longer be able to use this category.

Existing expense records will remain unchanged.

[Cancel]

[Deactivate]


==================================================
43. CATEGORY STATUS
==================================================

Use:

Active
Inactive

through centralized status mapping.


==================================================
44. EXPENSE REPORTING PREPARATION
==================================================

The expense module should visually support future reporting.

Include clear:

date
category
amount
status
reference

information.

Do not create report calculations in the frontend.


==================================================
45. EXPENSE EXPORT
==================================================

Where export is authorized:

[Export]

Offer:

CSV
PDF

Use the project's established export UI.

The backend should eventually generate authoritative exports.

The frontend should request the export rather than constructing financial totals itself.


==================================================
46. EXPORT FORMAT UX
==================================================

Example:

Export Expenses

Choose format:

○ CSV

○ PDF

Date Range:

[This Month]

[Cancel]

[Export]


==================================================
47. LOADING STATES
==================================================

Design loading states for:

Expense dashboard
Expense list
Expense detail
Expense form
Approval queue
Approval action
Rejection action
Category list
Category form
Export request


==================================================
48. EMPTY STATES
==================================================

Expenses:

No expenses have been recorded yet.

Filtered list:

No expenses match these filters.

Approval queue:

Nothing needs your attention right now.

Categories:

No expense categories are available.


==================================================
49. ERROR STATES
==================================================

Examples:

Unable to load expenses.

Expense could not be created.

Expense could not be updated.

Expense could not be approved.

Expense could not be rejected.

Unable to load expense categories.

Export could not be generated.


==================================================
50. NETWORK FAILURE
==================================================

Never display false financial success.

Example:

We couldn't submit this expense.

Please check your connection and try again.

[Try Again]


==================================================
51. DUPLICATE ACTION PREVENTION
==================================================

Prevent duplicate:

expense submissions
approvals
rejections
cancellations
category submissions
exports

Disable the active action while processing.


==================================================
52. RBAC
==================================================

CRITICAL.

Expenses must integrate with centralized RBAC.

Potential permissions include:

expenses.view
expenses.create
expenses.edit
expenses.cancel
expenses.approve
expenses.reject
expenses.category.view
expenses.category.manage
expenses.export

These are illustrative.

Use the actual permission architecture when the backend contract is eventually created.

Do not create scattered role-based conditions.


==================================================
53. ROLE EXPERIENCE
==================================================

AUTHORIZED MANAGER / FINANCE USER:

May see expense management and approval functionality according to permission.

OTHER USERS:

May see only the expense capabilities explicitly granted to them.

A user who can submit expenses must not automatically be able to approve them.

A user who can view expenses must not automatically be able to edit them.

A user who can approve expenses must not automatically gain category-management permissions.


==================================================
54. NAVIGATION
==================================================

The Expenses navigation item must be permission-aware.

If the authenticated user lacks:

expenses.view

do not show the Expenses module in navigation.

Do not expose:

Expenses → Access Denied

when the correct behavior is simply to omit the module.


==================================================
55. APPROVAL ACTION SECURITY UX
==================================================

Do not rely on visual hiding as the only security mechanism.

The backend will ultimately enforce authorization.

The frontend must:

- hide unauthorized actions
- disable unavailable actions
- display appropriate states
- gracefully handle backend authorization failures


==================================================
56. BACKEND AUTHORIZATION FAILURE
==================================================

If an action unexpectedly returns unauthorized:

You don't have permission to perform this action.

Refresh the page if necessary.

Do not expose technical authorization errors.


==================================================
57. FINANCIAL PRECISION
==================================================

All expense amounts must use:

ETB
+
thousands separator
+
2 decimal places

Example:

ETB 12,450.00

Do not abbreviate primary amounts.


==================================================
58. EXPENSE TABLE RESPONSIVENESS
==================================================

Desktop:

Use structured table.

Tablet:

Allow horizontal scrolling only where necessary.

Mobile:

Convert expense rows into reusable ExpenseCard components.

Prioritize:

Reference
Category
Amount
Status
Date

Secondary information can move inside the card.


==================================================
59. MOBILE EXPENSE CARD
==================================================

Create:

ExpenseCard

Example:

EXP-1042

Transport

Delivery fuel

ETB 4,500.00

12 Aug 2026

Pending Approval

[View]


==================================================
60. MOBILE APPROVAL
==================================================

Approval must remain simple on mobile.

Show:

Expense amount
Category
Description
Submitter
Status

Then:

[Approve]

[Reject]

Buttons must be large enough for touch interaction.


==================================================
61. DARK MODE
==================================================

All expense screens must fully support dark mode.

Verify:

- tables
- cards
- forms
- approval dialogs
- rejection dialogs
- status badges
- upload controls
- timelines
- empty states
- error states


==================================================
62. ACCESSIBILITY
==================================================

Target WCAG 2.1 AA.

Ensure:

- keyboard navigation
- visible focus
- semantic labels
- accessible form controls
- accessible dialogs
- accessible tables
- accessible status indicators
- non-color-only status communication
- proper error association
- sufficient contrast


==================================================
63. CSS ARCHITECTURE
==================================================

Use the existing CSS design system.

Use:

CSS variables
design tokens
Grid
Flexbox
media queries
component classes
state classes

Do not introduce:

raw hex values
arbitrary spacing
one-off shadows
one-off typography
inline style duplication
component-specific visual systems


==================================================
64. COMPONENT REUSE
==================================================

Reuse the existing:

PageHeader
DashboardTemplate
DetailTemplate
FormTemplate
DataTable
FilterBar
SearchInput
Select
DateRangePicker
CurrencyInput
StatusBadge
Button
Modal
Drawer
Timeline
EmptyState
ErrorState
LoadingState
FileUpload
ConfirmationDialog

Create new components only where the expense domain genuinely requires them.


==================================================
65. NEW REUSABLE EXPENSE COMPONENTS
==================================================

Create:

ExpenseSummaryCard
ExpenseTable
ExpenseCard
ExpenseDetail
ExpenseForm
ExpenseApprovalPanel
ExpenseApprovalQueue
ExpenseRejectionDialog
ExpenseActivity
ExpenseCategoryTable
ExpenseCategoryForm
ExpenseExportDialog


==================================================
66. EXPENSE DASHBOARD COMPOSITION
==================================================

Use:

DashboardTemplate
+
PageHeader
+
SummaryCards
+
NeedsAttention
+
RecentExpenses
+
ApprovalQueuePreview

Maintain the same visual hierarchy used throughout the ERP.


==================================================
67. EXPENSE DETAIL COMPOSITION
==================================================

Use:

DetailTemplate

HEADER:

Expense Reference
Status
Primary authorized actions

BODY:

Financial Summary
Expense Information
Description
Supporting Documents
Approval Information
Activity Timeline


==================================================
68. EXPENSE FORM COMPOSITION
==================================================

Use:

FormTemplate

SECTION 1:

Expense Information

SECTION 2:

Financial Information

SECTION 3:

Payment Information

SECTION 4:

Supporting Documents

SECTION 5:

Notes

FOOTER:

Cancel
Submit Expense


==================================================
69. APPROVAL UX PRINCIPLE
==================================================

Approvers should not need to hunt for critical information.

The approval view must answer immediately:

WHAT IS THE EXPENSE?

HOW MUCH?

WHY WAS IT INCURRED?

WHO SUBMITTED IT?

WHEN?

IS THERE SUPPORTING DOCUMENTATION?

WHAT DECISION AM I BEING ASKED TO MAKE?


==================================================
70. DO NOT OVERLOAD THE APPROVAL SCREEN
==================================================

Do not create a giant financial dashboard inside the approval dialog.

Keep the decision surface focused.

Detailed history can remain below or in a dedicated detail view.


==================================================
71. IMPORTANT BUSINESS UX
==================================================

The interface must make consequences clear before financial decisions.

For approval:

You are approving a financial expense.

For rejection:

A rejection reason will be recorded.

For cancellation:

The expense will be marked as cancelled.

For category deactivation:

Existing records remain unchanged, while future submissions cannot use the category.

Only use exact consequence language when supported by the actual backend workflow.


==================================================
72. EXPENSE ACTIVITY
==================================================

Activity should preserve accountability.

Display:

Actor
Action
Timestamp
Optional note/reason

Example:

Abebe

Submitted expense

12 Aug 2026, 10:42 AM


Manager

Approved expense

12 Aug 2026, 11:15 AM


==================================================
73. NO FAKE AUDIT TRAIL
==================================================

Do not generate activity events in frontend.

Do not infer:

"Approved by Manager"

merely because status = Approved.

The backend must eventually provide actual audit records.


==================================================
74. ERROR RECOVERY
==================================================

If approval fails:

Keep the expense page open.

Do not automatically change the status to Approved.

Show the error.

Allow retry if appropriate.


==================================================
75. FILTER PERSISTENCE
==================================================

When navigating between:

Expense List
→ Expense Detail
→ back to Expense List

preserve filters/search/page state where practical.

Use the established application navigation behavior.


==================================================
76. URL/ROUTE STRUCTURE
==================================================

Use the existing routing architecture.

Suggested conceptual routes:

/expenses
/expenses/new
/expenses/:id
/expenses/:id/edit
/expenses/approvals
/expenses/categories

Do not introduce a competing routing structure if one already exists.


==================================================
77. FINAL SCREEN INVENTORY
==================================================

EXPENSE CORE:

1. Expense Dashboard
2. Expense Dashboard — Loading
3. Expense Dashboard — Empty
4. Expense Dashboard — Error
5. Expense List
6. Expense List — Loading
7. Expense List — Empty
8. Expense List — No Results
9. Expense Detail
10. Expense Detail — Pending Approval
11. Expense Detail — Approved
12. Expense Detail — Rejected
13. New Expense
14. Edit Expense where supported

APPROVAL:

15. Approval Queue
16. Approval Queue — Empty
17. Approval Confirmation
18. Rejection Dialog
19. Approval Success
20. Rejection Result

CATEGORIES:

21. Expense Categories
22. New Expense Category
23. Edit Expense Category
24. Deactivate Category Confirmation

EXPORT:

25. Expense Export Dialog
26. Export Loading
27. Export Error


==================================================
78. DEFINITION OF DONE
==================================================

F3-13 is complete when:

[ ] Expense dashboard exists.

[ ] Expense summary cards exist.

[ ] Needs Attention exists where authorized.

[ ] Expense list exists.

[ ] Server-side filtering structure exists.

[ ] Search exists.

[ ] Expense detail exists.

[ ] New Expense exists.

[ ] Edit Expense exists where supported.

[ ] Approval queue exists.

[ ] Approval confirmation exists.

[ ] Rejection workflow exists.

[ ] Rejection reason exists.

[ ] Expense activity exists.

[ ] Category management exists where authorized.

[ ] Category deactivation confirmation exists.

[ ] CSV export UI exists.

[ ] PDF export UI exists.

[ ] Loading states exist.

[ ] Empty states exist.

[ ] No-results states exist.

[ ] Error states exist.

[ ] Network failure states exist.

[ ] Duplicate submissions are prevented.

[ ] RBAC is centralized.

[ ] Unauthorized navigation is hidden.

[ ] Unauthorized actions are hidden.

[ ] Backend authorization failures are handled gracefully.

[ ] ETB formatting is consistent.

[ ] No frontend accounting calculations are authoritative.

[ ] No fake audit history exists.

[ ] Approval actions use backend responses.

[ ] Rejection actions use backend responses.

[ ] Dark mode works.

[ ] Mobile layouts work.

[ ] Accessibility requirements are followed.

[ ] Existing CSS tokens are reused.

[ ] Existing components are reused.

[ ] No raw visual values are introduced.

[ ] No PHP is implemented.

[ ] No database logic is implemented.


==================================================
79. FINAL UX PRINCIPLE
==================================================

Expenses are financial-control records.

The interface should make every expense understandable and accountable.

The user should immediately know:

WHAT WAS SPENT?

HOW MUCH?

WHEN?

FOR WHAT CATEGORY?

WHO SUBMITTED IT?

IS IT APPROVED?

WHO APPROVED OR REJECTED IT?

WHY WAS IT REJECTED?

WHAT ACTION CAN I TAKE?

The experience must be:

simple
professional
precise
calm
financially trustworthy
RBAC-aware
responsive
accessible

Do not make Expenses look like a generic CRUD page.

Make it feel like an integral financial-control module of a serious coffee-roasting ERP.

Do not redesign the established system.

Extend it consistently.

