P2G — COFFEE OPERATIONS: ROASTING, INVENTORY, STOREKEEPING & PACKING

Design the complete operational-production experience for the Coffee-Roasting ERP.

This is Part 2G of the 8-part frontend design sequence.

IMPORTANT:
This part covers the physical coffee workflow after an order has been accepted and reserved, including:

- Green Coffee Inventory
- Inventory Lot Management
- Roasting Jobs
- Roasting Batches
- Roasted Coffee Receipt
- Roasting Discrepancy Review
- Storekeeper Confirmation
- Packing
- Packing Materials
- Packing Discrepancy Review
- Ready-for-Delivery transition

Do NOT design the Delivery Driver workflow, Banking, Expenses, Payroll, or detailed Financial Reports in this part.

Those belong to the remaining frontend sections.

Continue using exactly the Design System established in Part 1 and the application shell established in P2A.

The final frontend will be implemented using HTML + CSS + JavaScript.
The backend will use PHP.

PHP is the authoritative source for:

- inventory quantities
- reservations
- stock availability
- green coffee acceptance
- QC results
- roasting requirements
- roasting tolerances
- batch quantities
- roasted output
- yield calculations
- discrepancies
- packing requirements
- packing quantities
- packing-material usage
- workflow transitions
- permissions
- audit history

The frontend must NEVER recreate these business rules.

==================================================
1. OPERATIONS MODULE PURPOSE
==================================================

This module represents the physical movement of coffee through the ERP.

The core operational journey is:

GREEN COFFEE
    ↓
QC
    ↓
ACCEPTED GREEN COFFEE
    ↓
AVAILABLE / RESERVED
    ↓
ROASTING
    ↓
ROASTED OUTPUT
    ↓
STOREKEEPER CONFIRMATION
    ↓
PACKING
    ↓
PACKING CONFIRMATION
    ↓
MANAGER CONFIRMATION
    ↓
READY FOR DELIVERY

The interface must make this physical workflow extremely easy to understand.

Every operational user should immediately know:

- what they are responsible for
- what quantity they are expected to handle
- what has already happened
- what remains
- whether there is a discrepancy
- whether they need approval
- what action comes next

==================================================
2. IMPORTANT WORKFLOW RULE
==================================================

The Roaster does NOT have to roast an exact predetermined amount.

The Roaster may take whatever amount they choose within the allowed operational rules.

The important requirement is:

The Roaster must report that the roasting for the specific order has been successfully completed.

When the Roaster announces completion:

The roasted output becomes pending for:

- Storekeeper
- Manager

The Storekeeper must confirm that they accepted the roasted coffee belonging to that specific order.

If there is a difference between expected and received roasted output:

The Manager handles the discrepancy and manually decides/adjusts it where authorized.

Once the roasted coffee is accepted and any discrepancy is resolved:

The order proceeds toward packing.

Do NOT design the Roaster interface as though they must always produce an exact quantity.

==================================================
3. INVENTORY OVERVIEW
==================================================

Create an Inventory overview page.

The inventory interface must cover:

1. Green Coffee
2. Roasted Coffee
3. Packaging Materials

Use the same inventory information structure throughout.

Every inventory type should clearly display:

ON HAND

RESERVED

AVAILABLE

The exact values come from PHP.

Do NOT calculate:

Available = On Hand - Reserved

in JavaScript.

The backend provides the authoritative values.

==================================================
4. INVENTORY PAGE STRUCTURE
==================================================

Page title:

"Inventory"

Supporting text:

"Monitor coffee stock, reservations, and available quantities."

Provide tabs or clearly separated sections:

Green Coffee

Roasted Coffee

Packaging

Each section should use the same visual pattern.

==================================================
5. GREEN COFFEE INVENTORY
==================================================

Create a Green Coffee inventory view.

Show useful information such as:

Coffee

Origin

Lot

On Hand

Reserved

Available

QC Status

Location

Last Movement

Actions

Do not display information that the backend does not provide.

==================================================
6. GREEN COFFEE QC RULE
==================================================

Green coffee MUST NOT enter accepted available inventory if it fails QC.

This is a critical business rule.

The UI must visually distinguish:

Pending QC

QC Passed

QC Failed

Accepted

Rejected

Only accepted coffee can become available according to the backend inventory workflow.

Never make a failed QC lot appear as normal available stock.

==================================================
7. ACCEPTED GREEN COFFEE
==================================================

When green coffee passes QC:

The accepted quantity is registered in the system.

The Storekeeper is responsible for confirming the actual accepted weight.

Then:

Manager reviews the relevant information and approves after matching the required records.

Create a clear workflow visualization:

QC Passed
→
Storekeeper Weight Confirmation
→
Manager Approval
→
Accepted Inventory

The actual status transitions come from PHP.

==================================================
8. STOREKEEPER WEIGHT CONFIRMATION
==================================================

Create a Storekeeper confirmation screen.

Display:

Coffee

Origin

Lot

QC result

Expected/received quantity where applicable

Unit

Storage location

Relevant reference

Provide:

"Confirm Weight"

The Storekeeper should be able to record the actual accepted weight according to backend rules.

Do not allow frontend logic to decide whether the quantity is acceptable.

PHP validates the transaction.

==================================================
9. MANAGER GREEN COFFEE APPROVAL
==================================================

Create a Manager review state.

Show:

Expected quantity

Storekeeper-confirmed quantity

QC information

Relevant lot

Difference, if any

Provide:

"Approve"

and other backend-supported actions.

The Manager must be able to understand what is being matched before approving.

==================================================
10. QC FAILURE STATE
==================================================

If coffee fails QC:

Show prominently:

"QC Failed"

Supporting explanation:

"This coffee cannot enter accepted inventory."

Show:

- lot
- coffee
- quantity
- QC result
- reason if provided
- timestamp
- actor

Do NOT provide an "Add to Available Stock" action.

==================================================
11. INVENTORY LOT DETAIL
==================================================

Create an Inventory Lot Detail page.

Show:

Lot number

Coffee

Origin

Supplier information where supported

Initial quantity

Accepted quantity

Rejected quantity where applicable

Current on-hand quantity

Reserved quantity

Available quantity

QC status

Storage location

Creation/receipt date

Then:

"Movement History"

==================================================
12. INVENTORY MOVEMENT HISTORY
==================================================

The movement history is a real inventory ledger view.

Each event should display:

Movement type

Quantity

Direction

Reference

Date/time

Actor

Examples:

Received

QC Accepted

Reserved

Issued to Roasting

Roasted Consumption

Adjustment

Transfer

Other backend-defined movement types

Do not reconstruct inventory history from the current stock balance.

Render actual backend ledger records.

==================================================
13. INVENTORY STATUS VISUALIZATION
==================================================

Use the established status system.

Safe:

Healthy / available stock

Warning:

Low stock / approaching threshold

Danger:

Insufficient / blocked / rejected

Info:

Pending / informational

Always combine:

Icon + Label + Color

Never rely on color alone.

==================================================
14. INVENTORY SEARCH AND FILTERING
==================================================

Provide server-side search and filtering.

Possible filters:

Coffee

Origin

Lot

QC status

Availability

Storage location

Low stock

Reservation state

Date

The exact filters depend on backend fields.

Do not load the entire inventory database into the browser.

==================================================
15. ROASTING MODULE
==================================================

Create a dedicated Roasting workspace.

Page title:

"Roasting"

Supporting text:

"Manage assigned roasting jobs and report completed roasted output."

The Roaster should see jobs they are authorized to work on.

==================================================
16. ROASTING JOB LIST
==================================================

Show a list of roasting jobs.

Suggested information:

Order

Customer

Coffee

Required quantity

Allowed range

Current roasted output

Remaining requirement

Status

Assigned Roaster

Created/issued date

Action

Use compact operational cards on mobile.

==================================================
17. ROASTING JOB DETAIL
==================================================

Create the primary Roasting Job Detail page.

Show:

Order number

Customer

Coffee

Required quantity

Allowed range

Roasted output recorded so far

Remaining requirement

Current status

Batch history

Primary action

==================================================
18. ALLOWED ROASTING RANGE
==================================================

Before roasting, clearly display:

"Allowed Range"

Example:

"Expected: 30 KG"

"Allowed: 27–33 KG"

The values are examples only.

The actual allowed range MUST come from PHP.

The frontend must not calculate:

expected quantity ± tolerance

itself.

This includes cases where the Manager has manually configured a different range for that specific order.

==================================================
19. ROASTING BATCHES
==================================================

The Roaster may complete an order through multiple batches.

Create a batch list:

Batch 1

Batch 2

Batch 3

etc.

Each batch may display:

Batch number

Input quantity

Output quantity

Loss

Status

Start time

Completion time

Notes/reason where applicable

The actual values come from PHP.

==================================================
20. ADD BATCH
==================================================

Provide:

"Add Batch"

while the backend indicates that additional roasting is required.

Do not calculate remaining quantity in the frontend.

PHP provides:

remaining requirement

and determines whether another batch may be created.

==================================================
21. START ROASTING
==================================================

Create a clear primary action:

"Start Roasting"

Before starting, display:

Order

Coffee

Allowed range

Relevant inventory information

The frontend submits the request.

PHP validates:

- authorization
- order state
- inventory availability
- roasting eligibility
- other business rules

==================================================
22. ROASTING IN PROGRESS
==================================================

Create a roasting-in-progress state.

Show:

Roasting

Order

Coffee

Current batch

Start time

Relevant quantity

The interface should be simple enough for operational use.

Avoid unnecessary dashboards.

==================================================
23. COMPLETE BATCH
==================================================

Create a:

"Complete Batch"

interaction.

Allow the Roaster to report the actual roasted output according to backend-supported fields.

Do not force the interface to require an exact expected quantity.

The actual result is what the Roaster reports.

PHP determines whether it is within the allowed range and what happens next.

==================================================
24. FAILED BATCH
==================================================

Create a distinct failed-batch state.

A failed batch should show:

Failed

Reason

Recorded quantity where relevant

Time

Roaster

The failed batch must NOT prevent the Roaster from starting another batch if the backend says another batch can proceed.

Use warning/danger treatment appropriately.

==================================================
25. ROASTING COMPLETION
==================================================

When the Roaster has completed roasting for a specific order:

Primary action:

"Report Roasting Complete"

This is an important workflow transition.

The interface must clearly explain:

"This will notify the Storekeeper and Manager that the roasted coffee is ready for receipt and review."

The exact wording can be refined to match backend behavior.

After PHP confirms the action:

The order should enter the appropriate:

"Awaiting Storekeeper"

or backend-equivalent state.

==================================================
26. ROASTING COMPLETION — IMPORTANT
==================================================

Do NOT automatically mark the order as completed after the Roaster reports completion.

Roasting completion means:

The Roaster has reported successful completion.

It does NOT mean:

Storekeeper accepted it.

It does NOT mean:

Manager approved it.

It does NOT mean:

Packing completed.

It does NOT mean:

The order is ready for delivery.

The frontend must visually preserve these distinctions.

==================================================
27. ROASTED RECEIPT
==================================================

Create a Storekeeper roasted-coffee receipt screen.

Show:

Order

Customer

Coffee

Roasted output reported

Relevant expected/allowed information

Roasting batches

Roaster

Completion time

Provide:

"Confirm Received"

The Storekeeper confirms that they accepted the roasted coffee for that specific order.

==================================================
28. ROASTED RECEIPT PENDING STATE
==================================================

Create a clear state:

"Awaiting Storekeeper"

Supporting text:

"Roasting has been reported complete. The roasted coffee is waiting for storekeeper confirmation."

If the current user is not authorized to confirm receipt:

Do not display the confirmation action.

==================================================
29. ROASTING DISCREPANCY
==================================================

If the actual roasted output differs from the expected requirement/range:

Show:

"Roasted Output — Needs Review"

Clearly display:

Expected

Actual

Difference

Order

Roaster

Relevant batch information

The actual discrepancy comes from PHP.

Do NOT calculate it in JavaScript.

==================================================
30. MANAGER DISCREPANCY REVIEW
==================================================

Create a Manager review interface.

The Manager can inspect:

- expected quantity
- actual output
- relevant batches
- loss
- reason
- Storekeeper-confirmed amount
- discrepancy
- history

The Manager may manually configure/approve the difference according to the established business rules.

Do not imply that the frontend automatically approves a discrepancy.

==================================================
31. ROASTED COFFEE INVENTORY
==================================================

After Storekeeper confirmation and required managerial approval:

The accepted roasted coffee is registered appropriately in inventory according to the backend workflow.

Show:

On Hand

Reserved

Available

The values are backend-authoritative.

==================================================
32. PACKING MODULE
==================================================

Create the Packing workspace.

Page title:

"Packing"

Supporting text:

"Prepare accepted roasted coffee for delivery."

Show orders that are eligible for packing.

==================================================
33. PACKING JOB LIST
==================================================

Show:

Order

Customer

Coffee

Required quantity

Packed quantity

Remaining quantity

Packing status

Storekeeper

Delivery information where relevant

Action

Only backend-eligible orders should appear.

==================================================
34. PACKING JOB DETAIL
==================================================

Create:

Packing Job Detail

Show:

Order information

Accepted roasted quantity

Required packed quantity

Packing progress

Packing materials

Current status

Primary action

==================================================
35. PACKING MATERIALS
==================================================

Create a packing-material usage section.

The Storekeeper must be able to report:

How much packing material was used for this specific order.

Examples may include:

bags

labels

boxes

other backend-defined packaging materials

Do not hardcode a fixed list if the backend supports configurable material types.

==================================================
36. FINAL PACKED ORDER
==================================================

The Storekeeper must report the final packed order.

Show:

Required quantity

Packed quantity

Packing material used

Remaining/unpacked quantity if applicable

Relevant notes

Then provide:

"Confirm Packing"

The backend determines whether the submission is valid.

==================================================
37. PACKING DISCREPANCY
==================================================

If required and packed quantities do not match:

Show:

"Packing — Needs Review"

Display:

Required

Packed

Difference

Packing material usage

Storekeeper

Timestamp

Do not calculate the difference in JavaScript.

PHP supplies authoritative values.

==================================================
38. MANAGER PACKING CONFIRMATION
==================================================

After the Storekeeper confirms packing:

The Manager receives the appropriate pending action.

Create:

"Review Packed Order"

Show:

Required amount

Packed amount

Packing materials

Discrepancies if any

Relevant history

Actions supplied by backend.

If everything matches:

"Confirm Packing"

After Manager confirmation:

The order can transition toward:

"Ready for Delivery"

according to PHP workflow.

==================================================
39. READY FOR DELIVERY
==================================================

Create a clear terminal state for this operational module:

"Ready for Delivery"

Show:

Order

Customer

Packed quantity

Delivery requirements

Packing completion

Manager confirmation

Timestamp

Do NOT assign a driver in this part.

The Delivery workflow belongs to the next operational section.

==================================================
40. OPERATIONAL TIMELINE
==================================================

Roasting, receipt, and packing screens should expose relevant history.

Examples:

Issued to Roasting

Batch Started

Batch Completed

Roasting Completed

Storekeeper Received

Discrepancy Reported

Manager Reviewed

Packing Started

Packing Completed

Manager Confirmed Packing

Ready for Delivery

These events must come from backend audit/history records.

Do not infer history from current status.

==================================================
41. RBAC — OPERATIONS
==================================================

RBAC is mandatory.

The frontend must respect backend permissions for:

ROASTER

- view authorized roasting jobs
- start roasting
- record batches
- report roasting completion

STOREKEEPER

- view authorized inventory
- confirm green coffee weight
- confirm roasted coffee receipt
- manage packing
- record packing-material usage
- confirm packing

MANAGER

- review/approve inventory acceptance
- review roasting discrepancies
- review packing discrepancies
- approve required operational decisions
- access broader operational information according to permissions

Other roles:

Only see operational screens/actions authorized by their permissions.

These are functional concepts, NOT a replacement for the actual PHP permission model.

The frontend must consume the actual permission set.

PHP enforces authorization.

==================================================
42. ROLE-SPECIFIC EXPERIENCE
==================================================

Do NOT create one giant interface where every role sees every control.

Roaster experience:

Focus on:

Assigned roasting jobs

Allowed range

Batch recording

Completion reporting

Storekeeper experience:

Focus on:

Inventory

Green coffee acceptance

Roasted receipt

Packing

Packing materials

Manager experience:

Focus on:

Approvals

Discrepancies

Exceptions

Inventory oversight

Operational decisions

Each role should have a simple task-focused interface.

==================================================
43. INVENTORY ACTION PERMISSIONS
==================================================

Actions must be permission-controlled.

Examples:

inventory.view

inventory.receive

inventory.qc.confirm

inventory.approve

inventory.adjust

roasting.view

roasting.start

roasting.batch.record

roasting.complete

roasting.discrepancy.review

packing.view

packing.record

packing.complete

packing.discrepancy.review

These are examples only.

Use actual PHP permissions once available.

==================================================
44. NO FRONTEND BUSINESS LOGIC
==================================================

Do NOT implement business calculations in JavaScript.

Never calculate in the frontend:

- available inventory
- reserved inventory
- roast requirement
- expected yield
- roast loss
- allowed roasting range
- roasting discrepancy
- packing discrepancy
- inventory balances
- accepted quantities
- workflow eligibility

PHP returns the authoritative result.

The frontend renders it.

==================================================
45. INVENTORY ADJUSTMENT
==================================================

Where authorized, create an inventory adjustment interface.

This should NOT look like editing a stock number directly.

Instead show:

"Inventory Adjustment"

Reason

Quantity

Direction

Reference

Notes

Confirmation

The backend records the adjustment as a proper inventory transaction.

Do not create a simple:

"Current Stock = ____"

editable field.

==================================================
46. INVENTORY MOVEMENT DETAIL
==================================================

For each important inventory transaction, provide a clear reference.

Examples:

Order #ORD-1042

Roasting Job #R-204

Receiving Record #REC-103

Adjustment #ADJ-20

This helps users trace physical coffee movement.

==================================================
47. LOADING STATES
==================================================

Create loading/skeleton states for:

Inventory list

Lot detail

Roasting jobs

Roasting detail

Batch list

Storekeeper receipt

Packing jobs

Packing detail

Discrepancy review

==================================================
48. ERROR STATES
==================================================

Create meaningful operational errors.

Examples:

"Unable to load inventory."

"Unable to load roasting job."

"Unable to submit batch."

"Unable to confirm receipt."

"Unable to confirm packing."

Always provide:

Try Again

where appropriate.

Never expose PHP/database errors directly.

==================================================
49. EMPTY STATES
==================================================

Create role-specific empty states.

Roaster:

"No roasting jobs require your action."

Storekeeper:

"No coffee is currently waiting for receipt."

Packing:

"No orders are currently ready for packing."

Inventory:

"No inventory records found."

Manager:

"No operational approvals require your attention."

These should feel positive and intentional.

==================================================
50. RESPONSIVE DESIGN
==================================================

Desktop:

Use efficient operational tables and two-column detail layouts.

Tablet:

Reduce secondary information.

Mobile:

Prioritize task completion.

For Roasters and Storekeepers, mobile usability is particularly important.

The primary action should always be obvious.

Examples:

START ROASTING

COMPLETE BATCH

REPORT ROASTING COMPLETE

CONFIRM RECEIVED

CONFIRM PACKING

Do not hide these actions inside complicated menus.

==================================================
51. MOBILE ROASTING
==================================================

The Roasting screen should be usable in an operational environment.

Prioritize:

Order

Coffee

Allowed range

Current batch

Input/output

Batch status

Primary action

Avoid unnecessary decorative elements.

==================================================
52. MOBILE STOREKEEPING
==================================================

Prioritize:

Order

Coffee

Quantity

QC status

Receipt status

Packing status

Material usage

Primary action

Forms should be large enough for practical touch use.

==================================================
53. DARK MODE
==================================================

Create a complete dark-mode version of:

Inventory

Lot detail

Roasting

Batch recording

Receipt

Packing

Discrepancy review

Approval states

Empty states

Errors

Maintain accessible status colors.

==================================================
54. ACCESSIBILITY
==================================================

Target WCAG 2.1 AA.

Ensure:

- visible focus states
- accessible tables
- accessible forms
- keyboard operation
- accessible dialogs
- status icon + text
- sufficient contrast
- clear error messages
- no color-only meaning

==================================================
55. VISUAL DIRECTION
==================================================

The Operations module should feel:

- practical
- precise
- fast
- industrial but premium
- coffee-business specific
- highly trustworthy

Avoid:

- excessive decoration
- giant analytics dashboards
- unnecessary charts
- complicated animations
- generic warehouse-management aesthetics

The user should always understand:

WHAT COFFEE?

HOW MUCH?

WHICH ORDER?

WHAT STATE?

WHO MUST ACT?

WHAT HAPPENS NEXT?

==================================================
56. REQUIRED FIGMA FRAMES
==================================================

INVENTORY

1. Inventory — Green Coffee Desktop
2. Inventory — Roasted Coffee Desktop
3. Inventory — Packaging Desktop
4. Inventory — Mobile
5. Inventory — Loading
6. Inventory — Empty
7. Inventory — Error
8. Inventory — Dark Mode

LOT MANAGEMENT

9. Inventory Lot Detail
10. Inventory Movement History
11. QC Passed
12. QC Failed
13. Storekeeper Weight Confirmation
14. Manager Green Coffee Approval

ROASTING

15. Roasting Job List
16. Roasting Job Detail
17. Start Roasting
18. Roasting In Progress
19. Add Batch
20. Batch Completed
21. Failed Batch
22. Report Roasting Complete
23. Awaiting Storekeeper
24. Roasting Discrepancy
25. Manager Discrepancy Review

STOREKEEPER RECEIPT

26. Roasted Coffee Receipt
27. Receipt Confirmation
28. Receipt Pending
29. Receipt Discrepancy

PACKING

30. Packing Job List
31. Packing Job Detail
32. Packing Material Entry
33. Packing In Progress
34. Packing Complete
35. Packing Discrepancy
36. Manager Packing Review
37. Manager Packing Confirmation
38. Ready for Delivery

RESPONSIVE

39. Roaster Mobile Experience
40. Storekeeper Mobile Experience

THEME

41. Operations — Dark Mode

==================================================
57. REUSABLE COMPONENTS
==================================================

Create reusable components for:

Inventory Summary

Inventory Table

Inventory Mobile Card

Inventory Status Badge

Inventory Lot Card

Inventory Movement Row

QC Status

Weight Confirmation Form

Manager Approval Panel

Roasting Job Card

Roasting Batch Card

Batch Status

Allowed Range Panel

Roasting Action Bar

Roasting Completion Dialog

Discrepancy Panel

Discrepancy Review Dialog

Receipt Confirmation

Packing Job Card

Packing Material Entry

Packing Summary

Packing Discrepancy Panel

Operational Timeline

Permission-Aware Action Button

Empty State

Loading State

Error State

==================================================
58. CRITICAL BUSINESS WORKFLOW
==================================================

Preserve this exact conceptual workflow:

GREEN COFFEE

QC

↓

If QC fails:
REJECTED / NOT AVAILABLE

If QC passes:

↓

Storekeeper confirms accepted weight

↓

Manager approves/matches

↓

ACCEPTED GREEN COFFEE ENTERS INVENTORY

↓

Order is confirmed/reserved according to backend rules

↓

GREEN COFFEE ISSUED TO ROASTING

↓

ROASTER MAY USE MULTIPLE BATCHES

↓

ROASTER REPORTS ACTUAL OUTPUT

↓

ROASTER REPORTS ROASTING COMPLETE

↓

STOREKEEPER + MANAGER RECEIVE PENDING REVIEW

↓

STOREKEEPER CONFIRMS ROASTED COFFEE RECEIVED

↓

If difference exists:

MANAGER REVIEWS / DECIDES

↓

Once accepted:

ROASTED COFFEE IS REGISTERED

↓

PACKING

↓

STOREKEEPER REPORTS FINAL PACKED ORDER + MATERIAL USAGE

↓

STOREKEEPER CONFIRMS PACKING

↓

MANAGER REVIEWS

↓

If everything matches:

MANAGER CONFIRMS

↓

READY FOR DELIVERY

The frontend must visually represent this workflow without pretending that one step automatically completes another.

==================================================
59. CRITICAL STATUS DISTINCTION
==================================================

Never confuse:

Roasting Complete

with

Roasted Coffee Accepted

Never confuse:

Packing Complete

with

Manager Packing Confirmed

Never confuse:

Ready for Delivery

with

Delivered

Never confuse:

QC Passed

with

Inventory Accepted

These distinctions are essential to the ERP's auditability and theft/error prevention.

==================================================
60. AUDITABILITY
==================================================

Every important operational event should have:

Actor

Timestamp

Quantity where relevant

Reference

Status/event

Notes/reason where applicable

The frontend should make this information discoverable.

Do not allow users to believe that a status changed without a recorded backend event.

==================================================
61. FINAL SCOPE
==================================================

P2G is specifically:

GREEN COFFEE INVENTORY

QC / ACCEPTANCE

INVENTORY LOTS

INVENTORY MOVEMENTS

ROASTING JOBS

ROASTING BATCHES

ROASTING COMPLETION

ROASTED COFFEE RECEIPT

ROASTING DISCREPANCIES

PACKING

PACKING MATERIAL USAGE

PACKING DISCREPANCIES

MANAGER OPERATIONAL APPROVALS

READY-FOR-DELIVERY STATE

Do NOT design the detailed Delivery Driver interface yet.

Do NOT design Banking.

Do NOT design Expenses.

Do NOT design Payroll.

Do NOT design the complete Finance/Reports module.

Those belong to the remaining frontend prompt.

Maintain absolute visual consistency with:

Part 1
P2A
P2B
P2C
P2D
P2E
P2F

The entire ERP must look and behave like ONE coherent system.

Most importantly:

THE FRONTEND RENDERS OPERATIONAL DATA.

PHP OWNS THE BUSINESS LOGIC.

RBAC IS ENFORCED BY PHP.

THE FRONTEND NEVER BECOMES THE SOURCE OF TRUTH.
