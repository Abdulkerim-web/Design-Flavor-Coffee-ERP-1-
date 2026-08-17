You are continuing the frontend UI/UX implementation of the Coffee-Roasting ERP.

COMPLETED:

F3-01 — Frontend Architecture
F3-02 — Design Tokens, Theme, Responsive Foundation & Dark Mode
F3-03 — Application Shell, Navigation & RBAC-Aware Structure
F3-04 — Core Component Library, States & Reusable UI Components
F3-05 — Reusable Page Patterns, Composite UI & Screen Templates
F3-06 — Orders & Customer Experience

NOW BUILD:

F3-07 — ROASTING, PRODUCTION WORKFLOW & ROASTING JOB EXPERIENCE

==================================================
IMPORTANT IMPLEMENTATION BOUNDARY
==================================================

This is a FRONTEND UI/UX implementation.

Use:

- HTML
- CSS
- JavaScript only where necessary for interface interaction
- established design tokens
- established reusable components
- established page templates

The eventual backend will use PHP.

DO NOT implement PHP in this prompt.

DO NOT implement:

- database logic
- roasting calculations
- yield calculations
- stock calculations
- inventory calculations
- production calculations
- authorization enforcement
- backend workflow transitions
- financial calculations

The frontend must only display values and actions supplied by the backend.

IMPORTANT:

The frontend must never independently calculate the expected roasting requirement.

If the backend provides:

- expected green requirement
- allowed range
- remaining quantity
- expected output
- tolerance
- yield
- loss
- discrepancy

the frontend renders those values.

It does not recalculate them.

==================================================
1. PRIMARY OBJECTIVE
==================================================

Create the complete frontend experience for the roasting workflow.

The roasting experience must make it immediately obvious:

- which orders require roasting
- what needs to be roasted
- how much remains
- what range is allowed
- which batches have already been recorded
- which batches succeeded
- which batches failed
- whether a discrepancy exists
- whether managerial review is required
- what the roaster is allowed to do
- what the next action is

The experience must be optimized for operational speed.

The roaster should not need to understand the entire ERP architecture.

They should simply understand:

WHAT DO I NEED TO ROAST?

HOW MUCH?

WHAT RANGE IS ACCEPTABLE?

WHAT DO I RECORD?

WHAT HAPPENS NEXT?

==================================================
2. ROASTING MODULE STRUCTURE
==================================================

Create the roasting module with these major views:

1. Roasting Dashboard
2. Roasting Queue
3. Roasting Job Detail
4. Batch Recording
5. Batch History
6. Failed Batch State
7. Discrepancy Review State
8. Completed Roasting State
9. Mobile Roasting View

==================================================
3. ROASTING DASHBOARD
==================================================

Use the established DashboardTemplate.

Page title:

Roasting

Production overview and active roasting jobs.

The dashboard should prioritize operational information.

Suggested sections:

TODAY'S ROASTING

NEEDS ATTENTION

ACTIVE BATCHES

RECENTLY COMPLETED

Do not fill the page with decorative analytics.

The primary purpose is operational execution.

==================================================
4. ROASTING SUMMARY METRICS
==================================================

Where backend values are available, display:

- Jobs Waiting
- Active Jobs
- Completed Today
- Jobs Needing Review

These values must come directly from backend responses.

Do not calculate them from locally loaded records.

==================================================
5. ROASTING QUEUE
==================================================

Create the main roasting queue.

Each job should clearly communicate:

Order
Customer
Coffee
Required Quantity
Remaining Quantity
Status
Priority
Action

Example:

#ORD-10482

Addis Coffee House

Sidamo Natural

Required:
120 KG

Remaining:
60 KG

Status:
Ready for Roasting

[Open Job]

==================================================
6. PRIORITY
==================================================

Urgent orders must be visually distinguishable.

Example:

⚡ URGENT

Do not make urgency visually louder than actual operational danger.

Use the established semantic system.

==================================================
7. QUEUE FILTERS
==================================================

Provide filters such as:

- Status
- Roast Level
- Customer
- Branch
- Urgency
- Date

Use the established FilterBar.

The eventual filtering must be performed server-side through the PHP backend.

==================================================
8. ROASTING JOB DETAIL
==================================================

Use DetailTemplate.

Header:

Roasting Job

#ORD-10482

Sidamo Natural

120 KG

Status:

Ready for Roasting

Primary action:

[Start Roasting]

Only display actions permitted for the current authenticated user and current backend state.

==================================================
9. JOB SUMMARY
==================================================

Show:

Order
Customer
Coffee
Roast Level
Required Quantity
Completed Quantity
Remaining Quantity
Current Status

Use a clean summary layout.

Do not overwhelm the user with every available order field.

==================================================
10. ROASTING REQUIREMENT PANEL
==================================================

Create a prominent Requirement Panel.

Example:

ROASTING REQUIREMENT

Required green coffee

60.6 KG

Allowed range

57.6–63.6 KG

The numbers are examples only.

The actual values must come from backend-provided fields.

Do not calculate:

required quantity
tolerance
minimum
maximum

in the frontend.

==================================================
11. ALLOWED RANGE
==================================================

The allowed range must be visually prominent before the roaster starts a batch.

Example:

Accepted input range

57.6 KG — 63.6 KG

Use:

minimum
maximum

and optionally:

Expected: 60.6 KG

The user should understand the range without reading technical documentation.

==================================================
12. MANUALLY ADJUSTED RANGE
==================================================

If the backend reports that a manager has manually adjusted the allowed range, clearly communicate that.

Example:

Manager-adjusted range

58 KG — 65 KG

Adjusted by:
Manager

Reason:
Operational adjustment

Do not imply that the roaster calculated or changed the range.

==================================================
13. START ROASTING
==================================================

Create the primary Start Roasting action.

Before starting, show a concise confirmation or preparation state containing:

Coffee
Required amount
Allowed range
Batch capacity if supplied
Current remaining requirement

Example:

Ready to start

Roast:

Sidamo Natural

Allowed green input:

57.6–63.6 KG

[Start Roasting]

==================================================
14. ACTIVE BATCH EXPERIENCE
==================================================

Once a batch is active, switch the interface into an operational recording state.

Show:

Batch number
Coffee
Order
Expected/allowed quantity
Input quantity
Output quantity
Status

The interface should prioritize data entry.

==================================================
15. MULTIPLE BATCHES
==================================================

A single order may require multiple batches.

Design the job around a batch list.

Example:

BATCH 1
30 KG
Completed

BATCH 2
30 KG
Completed

BATCH 3
30 KG
In Progress

Remaining:
30 KG

Provide:

[+ Add Batch]

when appropriate.

Do not assume a single batch permanently.

==================================================
16. BATCH CARD
==================================================

Create a reusable BatchCard.

It should support:

- batch number
- input quantity
- output quantity
- start state
- completion state
- failed state
- notes
- timestamp
- actor
- discrepancy indicator

The component must adapt to different states without changing its fundamental visual structure.

==================================================
17. BATCH INPUT
==================================================

Provide an obvious quantity field.

Example:

Green Coffee Used

[ 30.0 ] KG

The field should support:

- default
- focus
- validation
- invalid
- disabled
- loading

Use the existing form components.

==================================================
18. BATCH OUTPUT
==================================================

Provide:

Roasted Coffee Output

[ 25.8 ] KG

The frontend displays the entered or backend-confirmed value.

Do not calculate yield from input/output.

==================================================
19. BATCH NOTES
==================================================

Provide optional notes where permitted.

Example:

Notes

[................................]

Keep notes secondary to the operational quantities.

==================================================
20. BATCH COMPLETION
==================================================

When a batch is completed, show a clear completed state.

Example:

✓ Batch 1 completed

Green input:
30 KG

Roasted output:
25.8 KG

Completed:
10:42 AM

Do not visually imply that the batch is the entire order if more quantity remains.

==================================================
21. REMAINING REQUIREMENT
==================================================

After every completed batch, clearly display:

Remaining to roast

30 KG

The value must come from the backend.

DO NOT perform:

required - completed batches

in frontend code.

==================================================
22. FAILED BATCH
==================================================

A failed batch needs a dedicated visual state.

Example:

Batch 2

FAILED

Recorded loss:
[backend-provided value]

Reason:
Roasting issue

Status:

Failed

The failed batch should remain in history.

==================================================
23. FAILED BATCH DOES NOT NECESSARILY BLOCK
==================================================

The UI must support the established workflow where a failed batch does not automatically prevent another batch from being started toward the same order's remaining requirement.

If the backend says another batch may proceed, display:

Remaining requirement:

30 KG

[Start Another Batch]

Do not create a frontend rule that blocks the roaster.

The backend is authoritative.

==================================================
24. FAILED BATCH DETAILS
==================================================

When expanded, show:

Batch number
Time
Input
Output
Loss if supplied
Reason
Recorded by
Notes

Keep the failure visually clear without making the entire page look like an error state.

==================================================
25. DISCREPANCY STATE
==================================================

Create a dedicated discrepancy presentation.

Examples:

Roasting output requires review

or:

Roasting discrepancy

Use the established warning/danger visual language.

Do not invent a new color system.

==================================================
26. DISCREPANCY INFORMATION
==================================================

Where backend values are available, display:

Expected output
Recorded output
Difference
Reason
Current review status

Example:

Expected:
28.0 KG

Recorded:
25.8 KG

Needs Manager Review

These values are supplied by the backend.

Do not calculate the difference on the frontend.

==================================================
27. MANAGER REVIEW
==================================================

If the current user has permission to review the discrepancy, provide a clear action:

[Review Discrepancy]

The review experience should explain:

What happened?

What was expected?

What was recorded?

What decision is required?

==================================================
28. DISCREPANCY REVIEW PANEL
==================================================

Create a focused review panel.

Example:

ROASTING DISCREPANCY

Expected:
28.0 KG

Recorded:
25.8 KG

Difference:
2.2 KG

Reason:
Production loss

Manager decision:

[Accept]
[Reject]
[Request Review]

The exact actions must eventually come from backend permissions and workflow state.

Do not hardcode the final business decision model.

==================================================
29. MANAGER DECISION CONFIRMATION
==================================================

Important review actions should require confirmation.

Example:

Accept this roasting discrepancy?

This will mark the discrepancy as reviewed.

[Cancel]
[Accept Discrepancy]

If a reason is required by backend rules, the interface must provide a required reason field.

==================================================
30. STOREKEEPER HANDOFF
==================================================

When roasting is complete and output must be accepted by the storekeeper, clearly show:

Awaiting Storekeeper

Example:

Roasting complete

120 KG production requirement fulfilled.

Awaiting storekeeper acceptance.

Do not present this as fully completed if backend status says acceptance is pending.

==================================================
31. ROASTING COMPLETE STATE
==================================================

Create a clean completion state.

Example:

✓ Roasting complete

All required roasting batches have been recorded.

Next step:

Storekeeper acceptance

[View Order]

Do not prematurely display the order as fully completed.

==================================================
32. ROASTING JOB TIMELINE
==================================================

Use the established ActivityTimeline.

Potential events:

Job created
Batch started
Batch completed
Batch failed
Batch recorded
Discrepancy detected
Manager reviewed
Roasting completed
Storekeeper notified

These are possible event types.

Actual events must come from backend records.

==================================================
33. BATCH HISTORY
==================================================

Create a batch-history section.

Each batch should show:

Batch
Date
Input
Output
Status
Recorded By
Action

Use the same table language as the rest of the ERP.

==================================================
34. ROASTING TABLE DENSITY
==================================================

Roasting users need high information density.

Use the established Dense table variant where appropriate.

Do not sacrifice readability.

==================================================
35. MOBILE ROASTING
==================================================

The mobile roasting experience must be intentionally designed.

Do not simply shrink the desktop page.

Mobile priority:

1. Order
2. Coffee
3. Remaining requirement
4. Allowed range
5. Current batch
6. Primary action
7. Batch history

==================================================
36. MOBILE ACTIVE BATCH
==================================================

Create a focused mobile operational view.

Example:

#ORD-10482

Sidamo Natural

Remaining:
30 KG

Allowed:
28–32 KG

Current Batch:

Green Coffee Used
[ 30.0 ] KG

Roasted Output
[ 25.8 ] KG

[Complete Batch]

The interface should minimize unnecessary navigation.

==================================================
37. MOBILE ACTION BAR
==================================================

Use the established MobileActionBar.

Possible primary actions:

Start Batch
Complete Batch
Record Batch
Continue
Review

Only show actions permitted by backend state and user permission.

==================================================
38. ROASTING DASHBOARD EMPTY STATE
==================================================

If there are no jobs:

No roasting jobs right now.

All current roasting work has been completed.

Keep the state positive and useful.

==================================================
39. NO RESULTS
==================================================

If filters produce no jobs:

No roasting jobs match your filters.

[Clear Filters]

==================================================
40. LOADING STATE
==================================================

Create skeleton states for:

- queue
- job detail
- batch history
- requirement panel

Avoid unnecessary full-screen loading spinners.

==================================================
41. ERROR STATE
==================================================

Example:

Unable to load this roasting job.

[Try Again]

Never expose technical backend errors.

==================================================
42. OFFLINE / CONNECTION INTERRUPTION
==================================================

Because roasting is operational work, prepare a clear connection-loss state.

Example:

Connection interrupted

Your latest changes may not have been submitted.

[Retry]

Do not falsely tell the user that an action was successfully saved when the backend has not confirmed it.

==================================================
43. SUBMISSION CONFIRMATION
==================================================

For important actions such as:

Start Batch
Complete Batch
Record Failed Batch

the interface should provide appropriate feedback.

Use:

loading
success
error

states.

Do not immediately display success before backend confirmation in the production architecture.

==================================================
44. DUPLICATE SUBMISSION PROTECTION UX
==================================================

Important submission buttons must visually indicate loading after activation.

Example:

[Saving...]

Disable repeated clicks while a request is pending.

This is a frontend interaction safeguard.

The backend must also be designed to protect against duplicate requests later.

==================================================
45. RBAC
==================================================

Roasting UI must be permission-aware.

Potential permission concepts:

roasting.view
roasting.start
roasting.record
roasting.complete
roasting.review
roasting.override

These names are illustrative only.

Use the actual permission identifiers when the PHP backend architecture is created.

Do not scatter role checks throughout components.

Use the centralized permission abstraction.

==================================================
46. ROLE EXPERIENCE
==================================================

Potential experiences:

ROASTER

Can see assigned/relevant roasting jobs and perform authorized roasting operations.

MANAGER

Can review discrepancies and perform managerial actions where authorized.

STOREKEEPER

Can see the handoff state and accept roasted output where authorized.

OTHER USERS

Should only see roasting information if their permissions allow it.

Never assume that "Manager" automatically means every manager action.

Permissions are authoritative.

==================================================
47. ORDER CONNECTION
==================================================

Roasting must remain visually connected to the Order.

Provide easy navigation:

Roasting Job
→ Order #ORD-10482

Do not duplicate the entire order screen inside roasting.

Show only the order information required for the roasting task.

==================================================
48. CUSTOMER CONNECTION
==================================================

Where useful:

Customer:
Addis Coffee House

Provide a link to the customer record.

Do not clutter the operational roasting screen with customer information that has no relevance to the roasting task.

==================================================
49. STATUS LANGUAGE
==================================================

Use the centralized status mapping established earlier.

Possible user-facing concepts include:

Ready for Roasting
Roasting
Awaiting Storekeeper
Roasted Output — Needs Review

These are display concepts.

Never invent independent status strings inside individual components.

==================================================
50. STATUS ICONS
==================================================

Maintain the global status icon system.

Examples:

Safe:
check-circle

Warning:
alert-triangle

Danger:
x-circle

Pending:
clock

Information:
info

Use both:

icon + text.

==================================================
51. COFFEE VISUAL IDENTITY
==================================================

The roasting module may use subtle coffee-related visual details.

Appropriate:

- espresso tones
- roast brown
- warm neutrals
- restrained amber accents

Avoid:

- coffee-shop decoration
- excessive coffee illustrations
- large background photographs
- playful consumer-style UI

This is an industrial/enterprise roasting system.

==================================================
52. ACCESSIBILITY
==================================================

All roasting screens must meet WCAG 2.1 AA.

Pay particular attention to:

- quantity inputs
- status indicators
- tables
- confirmation dialogs
- keyboard navigation
- focus states
- mobile controls
- error messages

Never rely on color alone.

==================================================
53. DARK MODE
==================================================

All roasting screens must support dark mode.

Check:

- quantity fields
- batch cards
- warning panels
- discrepancy states
- timeline
- tables
- dialogs
- action buttons

Use semantic tokens only.

==================================================
54. RESPONSIVE BEHAVIOR
==================================================

DESKTOP:

High information density.

TABLET:

Simplify tables and allow secondary information to collapse.

MOBILE:

Task-focused operational layout.

Do not simply compress the desktop interface.

==================================================
55. CSS IMPLEMENTATION
==================================================

Use CSS for the visual implementation.

Use:

- CSS variables
- Grid
- Flexbox
- media queries
- semantic tokens
- reusable classes
- state classes
- transitions

Avoid:

- inline styles
- raw hex values
- arbitrary spacing
- duplicated component CSS

Reuse the design system.

==================================================
56. NO FRONTEND CALCULATIONS
==================================================

This rule is critical.

DO NOT write frontend logic that independently calculates:

expected green coffee
expected roasted output
yield percentage
allowed range
remaining quantity
loss
discrepancy amount
stock availability

The backend will eventually provide these values.

Frontend:

RENDERS.

Backend:

CALCULATES.

==================================================
57. SAMPLE DATA
==================================================

Use realistic fictional data.

Example:

Order:
#ORD-10482

Customer:
Addis Coffee House

Coffee:
Sidamo Natural

Required:
120 KG

Batch 1:
30 KG input
25.8 KG output

Batch 2:
30 KG input
27 KG output

These are prototype values only.

Clearly structure the UI so these can later be replaced by PHP API responses.

==================================================
58. FINAL SCREEN INVENTORY
==================================================

Create:

ROASTING

1. Roasting Dashboard
2. Roasting Queue
3. Roasting Queue — Loading
4. Roasting Queue — Empty
5. Roasting Queue — No Results
6. Roasting Queue — Error

ROASTING JOB

7. Roasting Job Detail
8. Roasting Job — Ready
9. Roasting Job — Active
10. Roasting Job — Multiple Batches
11. Roasting Job — Remaining Quantity
12. Roasting Job — Complete
13. Roasting Job — Awaiting Storekeeper

BATCHES

14. Batch Card — Active
15. Batch Card — Complete
16. Batch Card — Failed
17. Batch History
18. Batch Recording Form

DISCREPANCIES

19. Roasting Discrepancy
20. Discrepancy Review
21. Manager Confirmation
22. Discrepancy Accepted

MOBILE

23. Mobile Roasting Queue
24. Mobile Roasting Job
25. Mobile Active Batch
26. Mobile Batch Completion

==================================================
59. COMPONENTS TO REUSE
==================================================

Do not create duplicate components.

Reuse:

PageHeader
EntityHeader
StatusBadge
SummaryPanel
AttentionPanel
FilterBar
FilterChip
DataTable
FormSection
QuantityInput
ActionBar
MobileActionBar
ConfirmationDialog
ActivityTimeline
EmptyState
ErrorState
Skeleton
Toast
PermissionGate

If a new roasting-specific composite component is necessary, create it on top of the existing component library.

==================================================
60. ROASTING-SPECIFIC COMPOSITES
==================================================

Create reusable:

RoastingJobCard
RoastingRequirementPanel
BatchCard
BatchStatus
BatchHistory
DiscrepancyPanel
DiscrepancyReviewPanel
RoastingQueue
RemainingRequirement
RoastingActionPanel

Keep business calculations outside these components.

==================================================
61. PAGE COMPOSITION
==================================================

ROASTING DASHBOARD:

DashboardTemplate
+
PageHeader
+
StatGrid
+
AttentionPanel
+
RoastingQueue
+
ActivityTimeline

ROASTING JOB:

DetailTemplate
+
EntityHeader
+
SummaryPanel
+
RoastingRequirementPanel
+
RoastingActionPanel
+
BatchHistory
+
ActivityTimeline

ACTIVE BATCH:

OperationalTemplate
+
JobHeader
+
RequirementPanel
+
QuantityInput
+
BatchCard
+
MobileActionBar

DISCREPANCY:

DetailTemplate
+
DiscrepancyPanel
+
ReviewPanel
+
Timeline

==================================================
62. VISUAL HIERARCHY
==================================================

The roaster's primary question is:

WHAT DO I NEED TO DO NOW?

Therefore the interface hierarchy should prioritize:

1. Current job
2. Remaining quantity
3. Allowed range
4. Current batch
5. Primary action
6. Exceptions/discrepancies
7. History

Do not place historical information above the action the user needs to perform.

==================================================
63. OPERATIONAL SPEED
==================================================

Optimize for repeated use.

A roaster may perform many batch recordings.

Therefore:

- reduce unnecessary clicks
- keep quantity entry prominent
- preserve context
- avoid unnecessary navigation
- provide immediate validation feedback
- clearly indicate successful completion
- make the next action obvious

==================================================
64. DO NOT OVERDESIGN
==================================================

Do not turn every batch into a giant card.

Do not use large decorative graphics.

Do not add unnecessary charts.

Do not add animations simply for visual effect.

This is a production workspace.

Precision beats decoration.

==================================================
65. DEFINITION OF DONE
==================================================

F3-07 is complete only when:

[ ] Roasting Dashboard exists.

[ ] Roasting Queue exists.

[ ] Queue filtering exists.

[ ] Queue loading exists.

[ ] Queue empty state exists.

[ ] Queue no-results state exists.

[ ] Queue error state exists.

[ ] Roasting Job Detail exists.

[ ] Requirement Panel exists.

[ ] Backend-provided allowed range can be displayed.

[ ] Manager-adjusted range can be displayed.

[ ] Active batch experience exists.

[ ] Multiple batch experience exists.

[ ] Remaining requirement is clearly displayed.

[ ] Failed batch state exists.

[ ] Failed batch history exists.

[ ] Discrepancy state exists.

[ ] Discrepancy review exists.

[ ] Manager confirmation exists.

[ ] Storekeeper handoff state exists.

[ ] Completed roasting state exists.

[ ] Timeline exists.

[ ] Mobile roasting experience exists.

[ ] Mobile active batch experience exists.

[ ] Loading states exist.

[ ] Error states exist.

[ ] Submission states exist.

[ ] Duplicate-click protection exists.

[ ] RBAC-aware actions exist.

[ ] Dark mode works.

[ ] Responsive behavior works.

[ ] WCAG 2.1 AA principles are followed.

[ ] CSS uses the established design system.

[ ] No business calculations are implemented in the frontend.

[ ] No PHP is implemented.

[ ] No database logic is implemented.

[ ] No duplicated component styles are introduced.

[ ] F3-01 through F3-06 architecture is respected.

==================================================
66. FINAL PRINCIPLE
==================================================

The roasting module must feel like a specialized professional production workspace inside the ERP.

The roaster should open a job and immediately know:

WHAT COFFEE?

FOR WHICH ORDER?

HOW MUCH IS REQUIRED?

HOW MUCH REMAINS?

WHAT RANGE IS ACCEPTABLE?

WHAT BATCH AM I RECORDING?

IS THERE A PROBLEM?

WHAT DO I DO NEXT?

The system should never force the roaster to perform calculations that the ERP already knows.

The frontend displays trusted backend values.

The interface communicates the workflow.

The backend will ultimately enforce the workflow.

Build the roasting experience with operational clarity, precision, and speed.

