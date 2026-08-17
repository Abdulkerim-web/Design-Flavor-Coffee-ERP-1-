P2H — DELIVERY, CUSTOMER VERIFICATION & PAYMENTS

COFFEE-ROASTING ERP — FRONTEND DESIGN SYSTEM

This is P2H1 of the final P2H sequence.

This prompt is specifically responsible for designing the complete customer-facing operational flow after packing:

PACKING
↓
READY FOR DELIVERY
↓
DELIVERY ASSIGNMENT
↓
OUT FOR DELIVERY
↓
CUSTOMER RECEIVES COFFEE
↓
SIGNED CUSTOMER ACCEPTANCE
↓
MANAGER CUSTOMER VERIFICATION
↓
DELIVERY VERIFIED
↓
PAYMENT WINDOW
↓
PARTIAL / FULL PAYMENT
↓
PAYMENT COMPLETED

Do not design Finance, Banking, Expenses, Payroll, Reports, Notifications, or Settings in this prompt. Those belong to P2H2 and P2H3.

============================================================
01 — TECHNOLOGY & ARCHITECTURE RULES
============================================================

The final frontend will be implemented using:

HTML
CSS
JavaScript

The backend will be implemented using:

PHP

The design must therefore be realistic and implementable using standard:

HTML
CSS
JavaScript

Do not design interactions that require a proprietary frontend framework.

CSS must handle:

- layout
- responsive behavior
- states
- transitions
- visual hierarchy
- dark mode
- component styling
- responsive tables/cards
- loading states
- focus states

JavaScript may handle frontend interaction such as:

- opening dialogs
- tabs
- drawers
- previews
- UI state
- form interaction
- uploads
- navigation behavior

PHP is the authoritative source for:

- authentication
- authorization
- RBAC
- delivery status
- delivery quantities
- order quantities
- payment amounts
- payment deadlines
- payment status
- customer verification
- workflow transitions
- calculations
- audit history
- database records

NEVER make the frontend the source of truth.

============================================================
02 — CONTINUITY WITH PREVIOUS DESIGN PARTS
============================================================

This prompt continues the design system already established in:

Part 1
P2A
P2B
P2C
P2D
P2E
P2F
P2G

Do NOT create a new visual language.

Reuse the existing:

- color tokens
- typography
- spacing scale
- border radius
- shadows
- buttons
- inputs
- tables
- cards
- badges
- icons
- modal system
- drawer system
- navigation
- responsive breakpoints
- dark mode
- status vocabulary

P2H1 must look like the same application.

============================================================
03 — CORE DESIGN PHILOSOPHY
============================================================

The Delivery and Payment experience must feel:

Professional

Calm

Precise

Trustworthy

Fast

Operational

Easy to understand

The system deals with real physical coffee deliveries and real money.

Therefore:

Avoid decorative complexity.

Avoid excessive animation.

Avoid confusing dashboards.

Avoid unnecessary charts.

Prioritize:

STATUS

QUANTITY

RESPONSIBILITY

PROOF

VERIFICATION

PAYMENT

DEADLINE

ACTION

============================================================
04 — DELIVERY MODULE
============================================================

Create a professional Manager-facing:

DELIVERY

module.

Page title:

"Delivery"

Subtitle:

"Monitor outgoing orders, delivery progress, customer confirmation, and delivery exceptions."

The Manager should immediately understand:

- what is ready
- what has been assigned
- what is currently out for delivery
- what has been partially delivered
- what is awaiting customer confirmation
- what requires attention
- what has been verified
- what has failed

============================================================
05 — DELIVERY DASHBOARD
============================================================

Create a Delivery overview at the top.

Use summary cards.

Possible cards:

READY FOR DELIVERY

OUT FOR DELIVERY

AWAITING CONFIRMATION

PARTIALLY DELIVERED

DELIVERY DISPUTES

FULLY DELIVERED

Only show states supported by the backend.

The numbers must come from PHP.

Do not calculate counts from frontend-loaded data.

============================================================
06 — DELIVERY LIST
============================================================

Create a professional desktop table.

Columns:

Order Number

Customer

Branch

Sales Representative

Delivery Person

Delivery Status

Ordered Quantity

Delivered Quantity

Remaining Quantity

Delivery Date

Customer Confirmation

Payment Status

Actions

The table should be:

Clean

Compact

Readable

Scannable

Suitable for an ERP.

Do not use excessive decoration.

============================================================
07 — DELIVERY RESPONSIVE BEHAVIOR
============================================================

Desktop:

Use a structured table.

Tablet:

Reduce secondary columns and maintain usability.

Mobile:

Transform each delivery record into a card.

Mobile card priority:

Order Number

Customer

Quantity

Delivery Status

Customer Confirmation

Primary Action

Do NOT simply shrink the desktop table until it becomes unreadable.

============================================================
08 — DELIVERY FILTERS
============================================================

Provide:

Search

Customer

Branch

Sales Representative

Delivery Person

Delivery Status

Date

Payment Status

Urgency

Partial Delivery

Customer Confirmation

Filters must be server-side.

The frontend sends filter parameters to PHP.

Never load every delivery and perform security-sensitive filtering only in JavaScript.

============================================================
09 — DELIVERY SEARCH
============================================================

Provide a prominent search field.

Allow searching according to backend-supported fields.

Examples:

Order Number

Customer

Delivery reference

Customer name

The search should have:

Search icon

Clear button

Loading state

No-results state

Error state

============================================================
10 — DELIVERY DETAIL
============================================================

Create:

"Delivery Detail"

Use a strong page hierarchy.

TOP:

Order Number

Customer

Delivery Status

Payment Status

Then:

DELIVERY SUMMARY

DELIVERY ASSIGNMENT

CUSTOMER VERIFICATION

DOCUMENTS

DELIVERY HISTORY

AUDIT TIMELINE

============================================================
11 — DELIVERY SUMMARY
============================================================

Create a large summary component.

Example:

ORDERED

100 KG

DELIVERED

40 KG

REMAINING

60 KG

STATUS

PARTIALLY DELIVERED

The values are supplied by PHP.

The frontend must NOT calculate:

remaining quantity

delivery percentage

delivery completion

============================================================
12 — ONE SALES ORDER, MULTIPLE DELIVERIES
============================================================

CRITICAL BUSINESS RULE:

Multiple deliveries must remain part of ONE sales order.

Example:

Original Sales Order:

100 KG

Delivery 1:

40 KG

Delivery 2:

30 KG

Delivery 3:

30 KG

The system must NOT create:

Order 1 = 40 KG

Order 2 = 30 KG

Order 3 = 30 KG

Instead:

ONE SALES ORDER

with:

MULTIPLE DELIVERY EVENTS

Design the UI to make this relationship visually obvious.

============================================================
13 — DELIVERY HISTORY
============================================================

Create:

"Delivery History"

Each delivery event should display:

Delivery Number

Quantity

Delivery Person

Date

Time

Status

Proof Document

Customer Verification

Notes

Example:

DELIVERY 01
40 KG
Verified

DELIVERY 02
30 KG
Verified

DELIVERY 03
30 KG
Awaiting Verification

Use a vertical timeline or structured event list.

============================================================
14 — PARTIAL DELIVERY
============================================================

Create a clear partial-delivery visual state.

Example:

ORDER TOTAL
100 KG

DELIVERED
40 KG

REMAINING
60 KG

STATUS
Partially Delivered

The design should communicate that:

The order is still active.

The customer has not necessarily received the entire order.

Additional deliveries may still occur.

Do not visually imply that the order is completed.

============================================================
15 — DELIVERY STATUS
============================================================

Use the centralized backend-to-frontend status mapping established earlier.

Possible display labels include:

Ready for Delivery

Out for Delivery

Partially Delivered

Awaiting Customer Confirmation

Fully Delivered

Delivery Disputed

Failed Delivery Attempt

Do not invent independent status strings.

Do not hardcode status labels into individual components.

============================================================
16 — DELIVERY STATUS VISUAL SYSTEM
============================================================

Use the existing semantic status tokens.

SAFE:

Verified

Completed

Fully Delivered

WARNING:

Awaiting Confirmation

Pending

Partial Delivery

DANGER:

Delivery Disputed

Failed / Exception where appropriate

INFO:

Out for Delivery

In Progress

Every status must include:

Color

Icon

Text

Never rely on color alone.

============================================================
17 — DELIVERY ASSIGNMENT
============================================================

Create:

"Delivery Assignment"

Display:

Order

Customer

Quantity

Destination

Delivery Person

Scheduled Date

Current Status

Authorized Manager action:

"Assign Delivery Person"

The exact available actions must come from backend permissions.

============================================================
18 — DELIVERY PERSON SELECTOR
============================================================

Create a professional selection component.

Display:

Delivery Person

Current assignments

Availability where supported

Use a searchable dropdown.

Do not expose unauthorized employee information.

After assignment:

Show:

Assigned to:

[Employee Name]

Assignment timestamp where provided.

============================================================
19 — DELIVERY PERSON EXPERIENCE
============================================================

The Delivery Person must NOT receive the full Manager Delivery interface.

Create a separate, simplified mobile-first operational experience.

The Delivery Person should primarily see:

Today's Deliveries

My Deliveries

Delivery Details

Customer

Address

Order contents

Delivery action

Proof upload

Customer acceptance

Failed attempt

Notifications where authorized

============================================================
20 — DELIVERY PERSON MOBILE HOME
============================================================

Create:

"TODAY'S DELIVERIES"

Each card should display:

Order Number

Customer

Address

Quantity

Status

Primary Action

Examples:

"Start Delivery"

"View Delivery"

"Continue Delivery"

Use large touch targets.

The interface should be usable outdoors on a phone.

============================================================
21 — DELIVERY PERSON NAVIGATION
============================================================

Use a minimal navigation.

Possible structure:

Today

My Deliveries

Notifications

Profile

Do not show:

Payroll

Banking

Expenses

Finance

Reports

Settings

unless the backend explicitly grants those permissions.

RBAC is enforced by PHP.

============================================================
22 — DELIVERY PERSON DETAIL
============================================================

Create a mobile-first:

"Delivery Detail"

Prioritize:

Customer

Phone/contact where authorized

Address

Order Number

Coffee

Quantity

Delivery status

Delivery instructions where supported

Primary action

The most important action should always be obvious.

============================================================
23 — MARK OUT FOR DELIVERY
============================================================

Create:

"Start Delivery"

Before action:

Show confirmation information:

Order

Customer

Quantity

Destination

Delivery Person

Then:

START DELIVERY

After PHP confirms:

Display:

OUT FOR DELIVERY

The backend records the actual workflow transition.

============================================================
24 — DELIVERY PROOF
============================================================

The Delivery Person must provide proof that the customer accepted the coffee.

The required evidence is:

A signed paper/document from the customer.

Create:

"CUSTOMER ACCEPTANCE"

Provide:

Upload Document

Take/Upload Photo where supported

Preview

Replace

Submit

The design should make it clear that this document is important evidence.

============================================================
25 — DOCUMENT UPLOAD
============================================================

Create a professional upload component.

States:

Default

Dragging/uploading if supported

Uploading

Uploaded

Preview

Replacing

Error

Success

The component should show:

File name

File type

File size

Upload status

Preview

Remove/Replace where authorized

============================================================
26 — DOCUMENT PREVIEW
============================================================

Create a modal/drawer:

"Customer Acceptance Document"

Display:

Large document preview

Order Number

Customer

Uploaded By

Uploaded Date

Document Status

Manager verification status

Allow authorized users to inspect the evidence without leaving the delivery record.

============================================================
27 — CUSTOMER ACCEPTANCE
============================================================

After the Delivery Person uploads the signed document:

The delivery enters:

AWAITING CUSTOMER CONFIRMATION

The Manager must independently contact the customer.

This is a critical anti-theft control.

The UI must explicitly communicate:

"Customer confirmation is required before this delivery is considered verified."

============================================================
28 — MANAGER VERIFICATION PANEL
============================================================

Create:

"Customer Verification"

The Manager sees:

Customer

Customer contact information where authorized

Order

Delivered Quantity

Delivery Person

Delivery Date

Signed Document

Verification Status

Verification history

Primary actions:

CUSTOMER CONFIRMED

CUSTOMER DID NOT CONFIRM

============================================================
29 — VERIFICATION INSTRUCTION
============================================================

Display a short instructional message:

"Call the customer and confirm that the delivered coffee was received before verifying this delivery."

This should be visible but not overwhelming.

The interface should make the purpose of the control obvious.

============================================================
30 — CUSTOMER CONFIRMED
============================================================

When the Manager confirms:

Show:

Customer Acceptance

CONFIRMED

Verified By

Manager

Verified Date/Time

Delivered Quantity

Supporting Document

The frontend then reflects the backend-confirmed state.

Do NOT independently move the order to another workflow state.

============================================================
31 — CUSTOMER DID NOT CONFIRM
============================================================

If the customer does not confirm:

Do NOT mark the delivery verified.

Show:

"Customer did not confirm delivery."

Then route the case into the backend-supported exception/dispute workflow.

The Manager should see the next authorized actions.

============================================================
32 — DELIVERY DISPUTE
============================================================

Create:

"Delivery Disputed"

Use danger styling.

Show:

Order

Customer

Delivery Person

Quantity

Signed Document

Customer Verification

Reason

Notes

Timeline

Authorized Manager actions.

Do not make ordinary failed deliveries look like fraud.

============================================================
33 — FAILED DELIVERY ATTEMPT
============================================================

Create:

"Failed Delivery Attempt"

The Delivery Person selects a backend-supported reason.

Possible examples:

Customer unavailable

Incorrect address

Customer refused

Logistics issue

Other

Then:

Notes

Submit Attempt

The backend records:

Actor

Date/Time

Reason

Delivery event

============================================================
34 — DELIVERY TIMELINE
============================================================

Create a professional timeline.

Possible events:

Ready for Delivery

Assigned

Out for Delivery

Delivery Attempted

Customer Document Uploaded

Awaiting Customer Confirmation

Customer Confirmed

Delivery Verified

Partially Delivered

Fully Delivered

Delivery Disputed

The timeline must be based on actual backend audit/history records.

Do NOT reconstruct history from the current status.

============================================================
35 — FULL DELIVERY
============================================================

When all required quantities are successfully delivered and customer verification is complete:

Display:

FULLY DELIVERED

Use safe/completed styling.

IMPORTANT:

FULLY DELIVERED ≠ PAID

Delivery completion and payment completion remain separate.

============================================================
36 — DELIVERY VS PAYMENT
============================================================

The UI must always show:

DELIVERY STATUS

and

PAYMENT STATUS

as separate concepts.

Example:

Delivery:
Fully Delivered

Payment:
Partially Paid

This is valid.

Another example:

Delivery:
Partially Delivered

Payment:
Payment Pending

Never combine them into one ambiguous status.

============================================================
37 — PAYMENT MODULE
============================================================

Create:

"Payments"

Subtitle:

"Track customer payments, outstanding balances, and payment deadlines."

The module should feel financially trustworthy and precise.

============================================================
38 — PAYMENT SUMMARY
============================================================

Create summary cards:

Payment Pending

Partially Paid

Paid

Overdue

Outstanding Amount

All values come from PHP.

Do not calculate dashboard totals in JavaScript.

============================================================
39 — PAYMENT BUSINESS RULE
============================================================

Customers may pay separately.

A single order may have multiple payments.

Example:

TOTAL:

ETB 100,000.00

PAYMENT 1:

ETB 40,000.00

PAYMENT 2:

ETB 30,000.00

PAYMENT 3:

ETB 30,000.00

The UI must clearly communicate:

Total

Paid

Remaining

Payment Status

============================================================
40 — PAYMENT DEADLINE
============================================================

The customer must complete the bill within:

7 DAYS

from the FIRST VERIFIED DELIVERY.

CRITICAL:

The frontend must NOT calculate this deadline.

PHP provides:

First Verified Delivery Date

Payment Deadline

Days Remaining

Overdue State

The frontend only displays these values.

============================================================
41 — PAYMENT DEADLINE CARD
============================================================

Create:

"Payment Deadline"

Display:

Deadline Date

Days Remaining

Status

Example:

PAYMENT DEADLINE

August 16, 2026

7 DAYS REMAINING

PAYMENT PENDING

Use:

Safe

Warning

Danger

depending on the authoritative backend state.

============================================================
42 — PAYMENT LIST
============================================================

Create a professional payment table.

Columns:

Order

Customer

Total Amount

Paid Amount

Remaining Amount

First Verified Delivery

Payment Deadline

Days Remaining

Payment Status

Actions

Use responsive cards on mobile.

============================================================
43 — PAYMENT STATUS
============================================================

Use centralized status mapping.

Possible labels:

Payment Pending

Partially Paid

Paid

Overdue

Use established status colors and icons.

Do not use red for every unpaid payment.

============================================================
44 — PAYMENT METHOD
============================================================

The ONLY supported customer payment method is:

BANK TRANSFER

Do NOT design:

Cash

Credit Card

Cheque

Mobile Money

Other payment methods

unless the backend is later changed to support them.

============================================================
45 — COMPANY BANK DESTINATION
============================================================

Customer payments are transferred into the company's recognized bank accounts.

The company has:

TWO BANK ACCOUNTS

at:

TWO DIFFERENT BANKS.

The payment interface should allow an authorized finance user to identify which company bank account received the transfer.

Do not merge the two accounts visually.

Banking administration itself belongs to P2H2.

============================================================
46 — RECORD PAYMENT
============================================================

Create:

"Record Payment"

Fields:

Customer

Order

Payment Amount

Destination Bank Account

Transfer Reference

Payment Date

Supporting Document if applicable

Notes

The form should show authoritative context:

Total Bill

Previously Paid

Current Remaining

The final result is determined by PHP.

============================================================
47 — PAYMENT AMOUNT
============================================================

The user enters:

Payment Amount

The frontend should not independently calculate the resulting balance.

After submission:

PHP returns:

Updated Paid Amount

Updated Remaining Amount

Updated Payment Status

Updated Payment History

Render the response.

============================================================
48 — PAYMENT DETAIL
============================================================

Create:

"Payment Detail"

Show:

Order

Customer

Total Bill

Paid Amount

Remaining Amount

Payment Deadline

Payment Status

Payment History

============================================================
49 — PAYMENT HISTORY
============================================================

Create a clean financial transaction history.

Each payment:

Payment Number

Amount

Date

Bank Account

Transfer Reference

Recorded By

Verification Status

Example:

PAYMENT 01
ETB 40,000.00
Verified

PAYMENT 02
ETB 30,000.00
Verified

PAYMENT 03
ETB 30,000.00
Pending Verification

============================================================
50 — PAYMENT VERIFICATION
============================================================

Where backend workflow requires verification:

Create:

"Verify Payment"

Display:

Customer

Order

Amount

Transfer Reference

Destination Bank

Date

Supporting Document

Current Verification State

Provide only backend-authorized actions.

============================================================
51 — PARTIAL PAYMENT
============================================================

Create a strong partial-payment state.

Example:

TOTAL BILL

ETB 100,000.00

PAID

ETB 40,000.00

REMAINING

ETB 60,000.00

STATUS

PARTIALLY PAID

The design must make the outstanding amount impossible to misunderstand.

============================================================
52 — FULL PAYMENT
============================================================

When the customer has completed the full bill:

Show:

PAID

Use safe styling.

Display:

Total

Paid

Remaining

Payment History

The remaining amount should be:

ETB 0.00

only if PHP returns that value.

============================================================
53 — OVERDUE PAYMENT
============================================================

Create:

"Payment Overdue"

Show:

Customer

Order

Outstanding Amount

Payment Deadline

Days Overdue

Payment History

Authorized Actions

Use danger styling.

The page should communicate urgency without becoming visually aggressive.

============================================================
54 — PAYMENT DETAIL TIMELINE
============================================================

Create a payment history/timeline.

Possible events:

First Verified Delivery

Payment Window Started

Payment Recorded

Payment Verified

Partial Payment

Payment Deadline Approaching

Payment Overdue

Payment Completed

Only display events supplied by backend history where applicable.

============================================================
55 — ETB MONEY FORMAT
============================================================

Every monetary value in this module must use:

ETB X,XXX.XX

Examples:

ETB 100,000.00

ETB 40,000.00

ETB 0.00

Do not use inconsistent formats.

Do not use:

100000 ETB

100K

ETB100000

The ERP must look financially professional.

============================================================
56 — PAYMENT SECURITY / RBAC
============================================================

Payment information is permission-controlled.

Examples of possible permissions:

payments.view

payments.record

payments.verify

payments.manage

Use the actual backend permission list when available.

Do not assume that every Manager or Accountant has every permission.

PHP is the enforcement layer.

============================================================
57 — ROLE-SPECIFIC DELIVERY ACCESS
============================================================

MANAGER:

May access:

Delivery Control Center

Delivery Assignment

Delivery Verification

Delivery Disputes

Delivery History

Payment oversight according to permissions

ACCOUNTANT / FINANCE:

May access payment-related functions according to permissions.

DELIVERY PERSON:

May access:

Assigned Deliveries

Delivery Details

Customer Information required for delivery

Proof Upload

Failed Delivery Attempt

Delivery Confirmation

They should NOT see unrestricted:

Finance

Banking

Payroll

Company-wide payment data

SALES REPRESENTATIVE:

May see payment information related to their authorized customers/orders if permitted.

ROASTER:

No delivery administration unless explicitly authorized.

STOREKEEPER:

No delivery administration unless explicitly authorized.

============================================================
58 — DELIVERY PERSON RBAC
============================================================

The Delivery Person should never see another employee's unrestricted delivery list.

The backend determines which deliveries belong to them.

The frontend displays only the authorized dataset returned by PHP.

============================================================
59 — MOBILE-FIRST DELIVERY DESIGN
============================================================

The Delivery Person experience must be optimized for:

Phones

One-handed use

Outdoor environments

Quick actions

Readable text

Large buttons

Minimal typing

Clear status

The primary workflow should require as few steps as practical.

============================================================
60 — MOBILE DELIVERY ACTION BAR
============================================================

Use a persistent or sticky bottom action area where appropriate.

Example:

[ START DELIVERY ]

Later:

[ UPLOAD CUSTOMER PROOF ]

Later:

[ SUBMIT DELIVERY ]

Do not show multiple competing primary actions simultaneously.

============================================================
61 — RESPONSIVE PAYMENT DESIGN
============================================================

Desktop:

Use tables and structured financial summaries.

Tablet:

Use condensed tables/cards.

Mobile:

Use stacked payment cards.

Each mobile card prioritizes:

Customer

Order

Total

Paid

Remaining

Deadline

Status

Action

============================================================
62 — DARK MODE
============================================================

P2H1 must fully support the global dark mode.

Create dark-mode designs for:

Delivery Dashboard

Delivery Detail

Delivery Person Mobile

Customer Verification

Document Preview

Payment Dashboard

Payment Detail

Payment Recording

Payment Verification

Overdue Payment

Use the previously established dark-mode tokens.

Do not create random dark colors.

============================================================
63 — ACCESSIBILITY
============================================================

Target:

WCAG 2.1 AA

Ensure:

Keyboard navigation

Visible focus rings

Accessible buttons

Accessible forms

Accessible tables

Accessible upload controls

Accessible document previews

Accessible modals

Accessible status indicators

Readable contrast

No color-only communication

============================================================
64 — LOADING STATES
============================================================

Design loading states for:

Delivery Dashboard

Delivery List

Delivery Detail

Delivery Assignment

Document Upload

Customer Verification

Payment Dashboard

Payment List

Payment Detail

Payment Recording

Payment Verification

Use skeleton loaders where appropriate.

Never leave a large blank area with no explanation.

============================================================
65 — ERROR STATES
============================================================

Create clear user-friendly errors.

Examples:

"Unable to load deliveries."

"Unable to assign delivery."

"Unable to start delivery."

"Unable to upload customer document."

"Unable to verify customer acceptance."

"Unable to record failed delivery attempt."

"Unable to record payment."

"Unable to verify payment."

Never expose:

SQL errors

PHP stack traces

database errors

raw server exceptions

============================================================
66 — SUCCESS STATES
============================================================

Create consistent success feedback.

Examples:

"Delivery assigned."

"Delivery started."

"Customer document uploaded."

"Customer acceptance verified."

"Payment recorded."

"Payment verified."

Use restrained success animation.

============================================================
67 — EMPTY STATES
============================================================

Create meaningful empty states.

Examples:

"No deliveries assigned today."

"No deliveries match your filters."

"No payment records found."

"No overdue payments."

"No pending customer verifications."

"No payment history available."

Provide useful actions where appropriate.

============================================================
68 — CONFIRMATION DIALOGS
============================================================

Important actions should use clear confirmation dialogs.

Examples:

Start Delivery

Verify Customer Acceptance

Reject/Dispute Delivery

Record Payment

Verify Payment

The dialog should explain:

What is happening

What record is affected

What the consequence is

Primary action

Cancel

Do not use generic:

"Are you sure?"

without context.

============================================================
69 — AUDIT VISIBILITY
============================================================

Important delivery and payment records should expose:

Actor

Action

Timestamp

Relevant event

Examples:

Delivery assigned

Delivery started

Document uploaded

Customer contacted/verification recorded

Delivery verified

Payment recorded

Payment verified

Use the established audit/timeline component from earlier parts.

============================================================
70 — FINAL FIGMA FRAMES: DELIVERY
============================================================

Create these desktop/tablet/mobile frames where appropriate:

01. Delivery Dashboard

02. Delivery List

03. Delivery List — Empty

04. Delivery List — Loading

05. Delivery Detail

06. Delivery Detail — Partial Delivery

07. Delivery Detail — Fully Delivered

08. Delivery Assignment

09. Delivery Person Dashboard — Mobile

10. Delivery Person Detail — Mobile

11. Start Delivery Confirmation

12. Out for Delivery

13. Customer Acceptance Upload

14. Uploading Document

15. Document Uploaded

16. Document Preview

17. Awaiting Customer Confirmation

18. Manager Customer Verification

19. Customer Confirmed

20. Customer Did Not Confirm

21. Delivery Disputed

22. Failed Delivery Attempt

23. Delivery Timeline

============================================================
71 — FINAL FIGMA FRAMES: PAYMENTS
============================================================

Create:

24. Payments Dashboard

25. Payments List

26. Payments List — Empty

27. Payments List — Loading

28. Payment Detail

29. Record Payment

30. Payment Verification

31. Payment Pending

32. Partially Paid

33. Payment Deadline Approaching

34. Overdue Payment

35. Paid

36. Payment History

37. Payment Error

38. Payment Success

============================================================
72 — REQUIRED REUSABLE COMPONENTS
============================================================

Create reusable components for:

Delivery Card

Delivery Table

Delivery Status Badge

Delivery Summary

Delivery Progress

Delivery Assignment Selector

Delivery Person Card

Delivery Timeline

Customer Verification Panel

Customer Acceptance Upload

Document Preview

Delivery Dispute Panel

Failed Delivery Form

Payment Summary Card

Payment Status Badge

Payment Deadline Card

Payment History

Payment Recording Form

Payment Verification Panel

Payment Amount Field

Payment Detail Card

Audit Timeline

Confirmation Dialog

Error Alert

Success Alert

Empty State

Loading Skeleton

============================================================
73 — COMPONENT STATE REQUIREMENT
============================================================

Every reusable interactive component must have:

Default

Hover

Focus

Pressed

Disabled

Loading

Error

Success where relevant

Empty where relevant

Mobile

Dark mode

Do not design only the happy path.

============================================================
74 — BUSINESS LOGIC BOUNDARY
============================================================

The frontend must NEVER calculate or determine:

Delivery remaining quantity

Delivery completion

Payment deadline

Days remaining

Payment remaining amount

Payment status

Payment completion

Customer verification result

Workflow transitions

Financial totals

The frontend displays backend-authoritative values.

============================================================
75 — RBAC BOUNDARY
============================================================

The frontend may use the authenticated user's permission list to determine what interface to display.

However:

PHP must enforce all authorization.

Never treat:

hidden button

hidden menu

hidden page

as security.

If an unauthorized request is manually made:

PHP must reject it.

============================================================
76 — FINAL UX TEST
============================================================

The Delivery experience should allow a Manager to answer:

What deliveries are ready?

Who is delivering them?

Where are they going?

How much was delivered?

What remains?

Did the customer confirm?

Where is the proof?

Which deliveries are disputed?

What needs my attention?

The Delivery Person should answer:

What do I deliver today?

Where do I go?

Who is the customer?

What quantity do I deliver?

What do I do after delivery?

Where do I upload proof?

The Finance user should answer:

How much does the customer owe?

How much has been paid?

How much remains?

When is the deadline?

Is the payment overdue?

============================================================
77 — FINAL VISUAL QUALITY CHECK
============================================================

Before completing P2H1, verify:

- Delivery is visually consistent with all previous ERP modules.
- Delivery Person has a genuinely mobile-first interface.
- Manager has a full Delivery Control Center.
- Partial delivery is supported.
- Multiple deliveries remain one sales order.
- Delivery history is visible.
- Customer signed proof is represented.
- Document preview is represented.
- Manager customer verification is represented.
- Customer non-confirmation creates an exception path.
- Failed delivery attempts are represented.
- Delivery disputes are represented.
- Fully Delivered is distinct from Paid.
- Payment can be partial.
- Multiple payments can belong to one order.
- Only bank transfer is represented as the payment method.
- Two company bank accounts are represented separately where relevant.
- Payment deadline is represented as 7 days from first verified delivery.
- Deadline is displayed from backend data.
- Payment balances come from backend data.
- Payment statuses use centralized mapping.
- ETB formatting is consistent.
- Loading states exist.
- Error states exist.
- Success states exist.
- Empty states exist.
- Dark mode exists.
- Responsive behavior exists.
- Accessibility is considered.
- RBAC is reflected throughout the UI.
- No frontend calculation replaces PHP.
- No frontend-only permission mechanism is treated as security.

============================================================
78 — FINAL DESIGN OBJECTIVE
============================================================

P2H1 should make the ERP's final physical-business workflow feel extremely clear:

THE COFFEE IS READY

↓

THE DELIVERY IS ASSIGNED

↓

THE DELIVERY PERSON TAKES IT

↓

THE CUSTOMER RECEIVES IT

↓

THE CUSTOMER SIGNS

↓

THE MANAGER CALLS AND CONFIRMS

↓

THE DELIVERY BECOMES VERIFIED

↓

THE PAYMENT WINDOW IS ACTIVE

↓

THE CUSTOMER PAYS

↓

THE PAYMENT IS RECORDED AND VERIFIED

↓

THE CUSTOMER BALANCE IS UPDATED

The user should never have to guess:

what happened

what is happening

who is responsible

what evidence exists

what remains

what needs approval

what needs payment

or what happens next.

Design this as a world-class, premium, highly usable coffee-roasting ERP.

Do not make it look like a generic CRM.

Do not make it look like a generic accounting application.

It must visually communicate:

COFFEE OPERATIONS
+
DELIVERY CONTROL
+
CUSTOMER TRUST
+
FINANCIAL ACCOUNTABILITY
jk