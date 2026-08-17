P2H2 — FINANCE, BANKING, EXPENSES & PAYROLL

COFFEE-ROASTING ERP — FRONTEND DESIGN SYSTEM

This is P2H2 of the final P2H sequence.

P2H1 covered:

DELIVERY
CUSTOMER VERIFICATION
PAYMENTS

P2H2 now covers the internal financial-control side of the ERP:

FINANCE
BANKING
EXPENSES
PAYROLL

The design must remain visually and structurally consistent with every previous prompt.

============================================================
01 — TECHNOLOGY & ARCHITECTURE
============================================================

The frontend will be implemented using:

HTML
CSS
JavaScript

The backend will be implemented using:

PHP

Do not introduce a frontend framework as a requirement.

CSS must handle:

- layout
- responsive design
- visual hierarchy
- components
- dark mode
- transitions
- states
- tables
- cards
- forms

JavaScript may handle:

- tabs
- drawers
- modals
- filtering interactions
- form interactions
- previews
- client-side UI state

PHP is the authoritative source for:

- financial records
- balances
- transactions
- expenses
- approvals
- payroll
- employee data
- calculations
- permissions
- workflow transitions
- audit records

NEVER make the frontend the source of truth.

============================================================
02 — DESIGN CONTINUITY
============================================================

Do NOT create a new design system.

Reuse the established:

- coffee-inspired palette
- typography
- spacing
- radii
- shadows
- buttons
- forms
- tables
- badges
- status icons
- modals
- drawers
- navigation
- responsive breakpoints
- dark mode
- accessibility patterns

Finance must look like part of the same ERP.

It must NOT look like a separate accounting application.

============================================================
03 — FINANCIAL UX PHILOSOPHY
============================================================

The financial area must communicate:

CONTROL

ACCURACY

TRACEABILITY

ACCOUNTABILITY

CLARITY

SECURITY

The user should always understand:

WHAT happened?

HOW MUCH?

WHEN?

WHO recorded it?

WHO approved it?

WHICH ACCOUNT?

WHAT REMAINS?

WHAT NEEDS ACTION?

Do not overwhelm users with accounting terminology when plain language is possible.

============================================================
04 — FINANCE MODULE
============================================================

Create:

"Finance"

Subtitle:

"Monitor financial activity, obligations, expenses, payments, and financial controls."

The Finance area should provide a high-level financial overview without duplicating the dedicated Banking, Expenses, or Payroll modules.

============================================================
05 — FINANCE DASHBOARD
============================================================

Create a professional Finance Dashboard.

Top summary cards may include:

TOTAL CUSTOMER PAYMENTS

OUTSTANDING CUSTOMER BALANCES

EXPENSES

PENDING EXPENSE APPROVALS

PAYROLL

BANK BALANCE

The exact figures displayed must come from PHP.

Do not calculate financial totals independently in JavaScript.

============================================================
06 — FINANCE DASHBOARD HIERARCHY
============================================================

The page should prioritize:

1. Financial alerts / items requiring action

2. Cash and bank overview

3. Customer payment position

4. Expenses

5. Payroll

6. Financial activity

Do not turn the dashboard into a wall of charts.

============================================================
07 — FINANCIAL SUMMARY CARDS
============================================================

Every financial card should include:

Title

Value

Currency

Relevant status

Optional comparison where supplied by backend

Icon

Do not invent percentage changes.

If PHP does not provide a comparison:

Do not display a fake trend.

============================================================
08 — CURRENCY SYSTEM
============================================================

All monetary values use:

ETB

Formatting:

ETB X,XXX.XX

Examples:

ETB 50,000.00

ETB 125,500.00

ETB 0.00

Never use inconsistent financial formatting.

The same formatting must be used throughout:

Finance

Banking

Expenses

Payroll

Payments

Reports

============================================================
09 — FINANCE TRANSACTION VIEW
============================================================

Create:

"Financial Activity"

Display:

Date

Transaction Type

Reference

Description

Amount

Account

Status

Recorded By

Actions

Use the established ERP table component.

============================================================
10 — SERVER-SIDE FILTERING
============================================================

Financial lists must support backend-driven filtering.

Possible filters:

Date

Transaction Type

Account

Status

Reference

Actor

Amount range where supported

The frontend sends filters to PHP.

Do not load an unlimited financial dataset and filter it only in JavaScript.

============================================================
11 — FINANCIAL DETAIL
============================================================

Create a reusable:

"Financial Record Detail"

Display:

Reference

Date

Type

Amount

Account

Description

Actor

Status

Related Entity

Supporting Documents where applicable

Audit History

============================================================
12 — BANKING MODULE
============================================================

Create:

"Banking"

Subtitle:

"Monitor company bank accounts, transactions, and reconciliation."

This module is for the company's internal bank accounts.

The company has:

TWO BANK ACCOUNTS

at:

TWO DIFFERENT BANKS.

Both accounts are officially recognized company accounts.

============================================================
13 — TWO BANK ACCOUNT DESIGN
============================================================

Never visually merge the two bank accounts into one generic account.

Create separate account cards.

Example:

BANK ACCOUNT 01

[Bank Name]

Account Identifier

Calculated Balance

Status

BANK ACCOUNT 02

[Bank Name]

Account Identifier

Calculated Balance

Status

Sensitive account details should be masked where appropriate.

============================================================
14 — BANK ACCOUNT CARDS
============================================================

Each account card should show:

Bank Name

Account Name

Masked Account Number

Calculated Balance

Last Transaction

Reconciliation Status

Primary Action:

"View Account"

Do not expose unnecessary sensitive information.

============================================================
15 — CALCULATED BALANCE
============================================================

CRITICAL BUSINESS RULE:

The displayed bank balance is a:

CALCULATED BALANCE

It is based on:

Opening Balance

+

Recorded Transactions

The balance must NOT be manually editable.

Do NOT design:

"Edit Balance"

"Set Balance"

"Overwrite Balance"

or similar controls.

============================================================
16 — BALANCE CORRECTIONS
============================================================

If a balance is incorrect:

The user must correct the underlying transaction/reconciliation issue.

Do NOT provide a direct balance-edit field.

The UI should explain:

"Balances are calculated from the opening balance and recorded transactions. Corrections must be made through the reconciliation or adjustment workflow."

============================================================
17 — BANK ACCOUNT DETAIL
============================================================

Create:

"Bank Account Detail"

Top section:

Bank Name

Account Name

Masked Account Number

Calculated Balance

Reconciliation Status

Then:

Transaction History

Reconciliation

Account Activity

Audit History

============================================================
18 — BANK TRANSACTION TABLE
============================================================

Columns:

Date

Reference

Description

Type

Debit

Credit

Calculated Balance

Status

Recorded By

Actions

Use precise financial alignment.

Numbers should be right-aligned.

Descriptions should remain readable.

============================================================
19 — DEBIT / CREDIT VISUALIZATION
============================================================

Do not rely solely on color.

Use:

Debit:

Minus / outgoing icon

Credit:

Plus / incoming icon

Every amount should include a clear semantic label or table column.

Use green/red carefully.

Do not turn the entire financial table into a colorful interface.

============================================================
20 — BANK TRANSACTION DETAIL
============================================================

Create:

"Transaction Detail"

Display:

Transaction Reference

Bank Account

Date

Transaction Type

Amount

Description

Related Entity

Recorded By

Created Date

Status

Audit History

Supporting Document if available.

============================================================
21 — BANK RECONCILIATION
============================================================

Create:

"Bank Reconciliation"

The purpose is to compare recorded ERP transactions with the relevant bank information.

Display:

Bank Account

Statement Period

ERP Calculated Balance

Statement Balance where supplied

Difference

Reconciliation Status

Outstanding Items

============================================================
22 — RECONCILIATION STATUS
============================================================

Possible states:

RECONCILED

PENDING RECONCILIATION

DISCREPANCY

Use the centralized status system.

A discrepancy must be immediately understandable.

============================================================
23 — RECONCILIATION DISCREPANCY
============================================================

Create a dedicated discrepancy panel.

Show:

ERP Calculated Balance

Bank Statement Balance

Difference

Affected Period

Potential Unmatched Transactions

Required Action

Do not silently modify balances.

============================================================
24 — RECONCILIATION ACTIONS
============================================================

Actions depend on backend permissions.

Possible actions:

Review

Match Transaction

Mark as Reconciled

Create Adjustment

Escalate

Do NOT provide direct balance editing.

Every adjustment must be recorded and auditable.

============================================================
25 — BANK ACCOUNT SWITCHER
============================================================

Because there are two company bank accounts, create a clear account selector.

Desktop:

Tabs or account cards.

Mobile:

Dropdown/select.

The selected account must be visually obvious.

Never make users wonder which bank account they are viewing.

============================================================
26 — EXPENSE MODULE
============================================================

Create:

"Expenses"

Subtitle:

"Record, review, approve, and track company expenses."

The expense experience should be simple.

============================================================
27 — EXPENSE DASHBOARD
============================================================

Summary cards:

This Month

Pending Approval

Approved

Paid

Rejected

Total Expense Amount

Values come from PHP.

============================================================
28 — EXPENSE LIST
============================================================

Create an expense table.

Columns:

Expense ID

Date

Category

Description

Amount

Requested By

Status

Approved By

Payment Status

Actions

============================================================
29 — EXPENSE STATUS
============================================================

Use centralized status styling.

Possible states:

Pending Approval

Approved

Rejected

Paid

Cancelled

Do not invent additional status strings without backend support.

============================================================
30 — CREATE EXPENSE
============================================================

Create:

"New Expense"

Fields:

Expense Category

Description

Amount

Date

Supporting Document

Notes

The form must be clean and easy to complete.

============================================================
31 — EXPENSE CATEGORY
============================================================

Expense categories must come from backend-controlled master data.

Do not hardcode a permanent category list into the frontend.

If the backend provides:

Transport

Utilities

Supplies

Maintenance

Other

display the returned categories.

============================================================
32 — EXPENSE DOCUMENT
============================================================

Create a reusable document upload component.

States:

Default

Uploading

Uploaded

Preview

Error

Replace

Use the same component pattern established in P2H1.

============================================================
33 — EXPENSE SUBMISSION
============================================================

When an expense is submitted:

Show confirmation:

Expense

Category

Amount

Supporting document

Submit action

The frontend sends the request to PHP.

PHP determines whether the submission is valid.

============================================================
34 — MANAGER EXPENSE APPROVAL
============================================================

CRITICAL BUSINESS RULE:

The Accountant submits/request an expense.

The Manager confirms the request.

Then the Manager pays it.

The Manager is the approving authority.

Do not design the Accountant as the final approval authority.

============================================================
35 — ACCOUNTANT EXPENSE EXPERIENCE
============================================================

The Accountant can:

Create expense request

Provide details

Attach supporting documentation

Submit for Manager confirmation

View permitted expense status

The Accountant must NOT receive a Manager-only approval control.

============================================================
36 — MANAGER EXPENSE QUEUE
============================================================

Create:

"Expense Approvals"

Each item should show:

Expense ID

Category

Description

Requested Amount

Requested By

Date

Supporting Document

Status

Primary Action:

"Review"

============================================================
37 — EXPENSE REVIEW
============================================================

Create:

"Review Expense"

Show:

Expense Information

Requested Amount

Category

Description

Supporting Document

Requester

Date

Financial context where authorized

Actions:

APPROVE

REJECT

The exact permissions come from PHP/RBAC.

============================================================
38 — EXPENSE APPROVAL CONFIRMATION
============================================================

When Manager selects:

APPROVE

show a confirmation dialog.

Example:

"Approve this expense request?"

Display:

Category

Amount

Requester

Explain:

"Approval authorizes this expense to proceed to payment."

Then:

CANCEL

APPROVE EXPENSE

============================================================
39 — EXPENSE REJECTION
============================================================

If Manager rejects:

Require a reason where the backend requires one.

Form:

Rejection Reason

Then:

REJECT EXPENSE

Display:

"Expense rejected."

The rejection must become part of the audit history.

============================================================
40 — MANAGER PAYMENT ACTION
============================================================

After Manager approval, show the authorized payment action.

Example:

[ PAY EXPENSE ]

The interface must clearly distinguish:

APPROVED

from:

PAID

Approval does not automatically mean payment has occurred.

============================================================
41 — EXPENSE PAYMENT
============================================================

Create:

"Pay Expense"

Display:

Expense

Amount

Approved By

Payment Account

Payment Reference

Payment Date

Supporting Information

The actual payment operation is confirmed by PHP.

============================================================
42 — EXPENSE LIFECYCLE
============================================================

Represent visually:

REQUESTED

↓

PENDING MANAGER CONFIRMATION

↓

APPROVED

↓

PAID

or:

REQUESTED

↓

REJECTED

Use the existing timeline component.

============================================================
43 — EXPENSE DETAIL
============================================================

Create:

"Expense Detail"

Sections:

Expense Summary

Requester

Amount

Category

Supporting Documents

Approval

Payment

Audit Timeline

============================================================
44 — EXPENSE AUDIT TRAIL
============================================================

Show:

Created By

Created Date

Submitted

Approved/Rejected

Approved By

Approval Date

Paid By

Payment Date

Any adjustments

All events must come from backend audit records.

============================================================
45 — PAYROLL MODULE
============================================================

Create:

"Payroll"

Subtitle:

"Manage monthly payroll runs and employee compensation."

Payroll is a highly controlled Manager-facing area.

============================================================
46 — PAYROLL BUSINESS RULE
============================================================

Payroll operates as a:

PAYROLL RUN

A run covers all employees for a specific period.

Example:

August 2026 Payroll

The interface should therefore emphasize the RUN.

Do NOT design payroll as disconnected individual employee payments.

============================================================
47 — PAYROLL RUN DASHBOARD
============================================================

Create:

"Payroll"

Top section:

Current Payroll Run

Period

Employee Count

Total Payroll

Status

Approval State

Payment State where supported

============================================================
48 — PAYROLL RUN STATUS
============================================================

Possible states may include:

Draft

Pending Approval

Approved

Paid

Closed

Use backend status mapping.

Do not invent backend states.

============================================================
49 — PAYROLL EMPLOYEE TABLE
============================================================

Create a payroll table.

Columns:

Employee

Role

Base Amount

Adjustments

Final Amount

Review Status

Payment Status

Actions

The exact fields displayed depend on backend data.

============================================================
50 — MANAGER PAYROLL CONTROL
============================================================

CRITICAL BUSINESS RULE:

The Manager is the only person who decides and edits employee payroll amounts.

Design the interface accordingly.

The Manager can:

Review

Edit authorized payroll amount

Approve

Reject/return where supported

Finalize the payroll run

============================================================
51 — ACCOUNTANT PAYROLL ACCESS
============================================================

If the Accountant has payroll visibility:

They may view permitted information and perform explicitly authorized accounting actions.

They must NOT receive Manager-only controls for determining employee payroll amounts.

RBAC must come from PHP permissions.

============================================================
52 — PAYROLL AMOUNT EDITOR
============================================================

Create a professional:

"Edit Payroll Amount"

dialog.

Show:

Employee

Current Amount

New Amount

Reason

Save

Cancel

The Manager must clearly understand that the amount is being changed.

============================================================
53 — PAYROLL CHANGE REASON
============================================================

Whenever the Manager edits a payroll amount:

Require a reason if supported by the backend policy.

Display:

Previous Amount

New Amount

Difference

Reason

Changed By

Date/Time

This is an audit-sensitive operation.

============================================================
54 — PAYROLL RUN APPROVAL
============================================================

Create:

"Approve Payroll Run"

Show:

Payroll Period

Employee Count

Total Payroll

Employees Requiring Review

Changes Made

Then:

APPROVE PAYROLL RUN

The Manager should understand what will happen before approving.

============================================================
55 — INDIVIDUAL PAYROLL REVIEW
============================================================

An individual employee line can be flagged for review.

Create:

"Needs Review"

The issue should not automatically imply that the entire payroll run is invalid unless PHP says so.

Display:

Employee

Amount

Reason

Review status

Authorized action

============================================================
56 — PAYROLL RUN STATES
============================================================

Create visual states for:

Draft

Editing

Pending Approval

Approved

Payment Processing where supported

Completed

Rejected/Returned where supported

Use centralized status components.

============================================================
57 — PAYROLL DETAIL
============================================================

Create:

"Payroll Run Detail"

Top:

Payroll Period

Run Status

Total Employees

Total Amount

Approval Status

Then:

Employee Payroll Table

Then:

Run Timeline

Then:

Audit History

============================================================
58 — PAYROLL EMPLOYEE DETAIL
============================================================

Create:

"Employee Payroll Detail"

Show only information the authenticated role is authorized to view.

Display:

Employee

Period

Payroll Amount

Adjustments

Final Amount

Review Status

Audit History

Do not expose sensitive employee information unnecessarily.

============================================================
59 — PAYROLL AUDIT
============================================================

Payroll changes must be traceable.

Show:

Original amount

New amount

Changed by

Reason

Timestamp

Approval action

Finalization

Any other backend audit events.

============================================================
60 — PAYROLL FINALIZATION
============================================================

Create a strong finalization confirmation.

Before finalization:

Show:

Payroll Period

Employee Count

Total Amount

Unresolved Review Items

Approval State

Then explain:

"Finalizing this payroll run records the approved payroll amounts for this period."

Use:

CANCEL

FINALIZE PAYROLL

Only authorized users may see this action.

============================================================
61 — FINANCE + BANKING RELATIONSHIP
============================================================

The UI must make the relationship between financial activity and bank activity understandable.

For example:

Customer Payment

↓

Bank Transaction

↓

Bank Account

↓

Calculated Balance

Similarly:

Expense Approval

↓

Expense Payment

↓

Bank Transaction

↓

Calculated Balance

Do not create fake automatic relationships in the frontend.

Display relationships supplied by PHP.

============================================================
62 — BANK TRANSACTION RELATIONSHIPS
============================================================

Where a bank transaction has a related entity:

Show:

Related Order

Related Expense

Related Payment

or relevant backend-supported entity.

Use clickable references where authorized.

============================================================
63 — FINANCIAL SEARCH
============================================================

Provide global search within authorized financial data.

Possible searchable fields:

Transaction Reference

Expense ID

Payment Reference

Order Number

Employee

Customer

Search results must respect RBAC and backend scoping.

============================================================
64 — FINANCIAL EXPORTS
============================================================

The ERP supports:

CSV

and

PDF

exports.

CSV should be used for:

tables

transaction lists

expense lists

payroll data where authorized

reconciliation data where appropriate

PDF should be used for:

formal financial statements

professional financial documents

reports intended for printing/sharing

The export operation should be backend-generated where appropriate.

Do not generate security-sensitive complete financial exports entirely in browser JavaScript.

============================================================
65 — EXPORT UI
============================================================

Create a reusable:

"Export"

button/dropdown.

Options:

Export CSV

Export PDF

Only display formats appropriate for that specific dataset.

Show:

Preparing export...

Download ready

Export failed

============================================================
66 — RBAC
============================================================

RBAC is fundamental to this module.

The frontend must receive the authenticated user's role/permission information from PHP.

Never hardcode:

if user == manager

as the primary authorization architecture.

Prefer permission-based visibility.

Examples of conceptual permissions:

finance.view

banking.view

banking.reconcile

expenses.create

expenses.approve

expenses.pay

payroll.view

payroll.edit

payroll.approve

payroll.finalize

Use the actual backend permission names when the API contract is available.

============================================================
67 — MANAGER VIEW
============================================================

The Manager may have access to:

Finance

Banking

Expense Approval

Expense Payment

Payroll

Payroll Editing

Payroll Approval

Payroll Finalization

Bank Reconciliation

But every action must still be permission-controlled.

============================================================
68 — ACCOUNTANT VIEW
============================================================

The Accountant may have access to authorized:

Finance

Banking

Expense Creation

Financial Records

Payment Recording

Reconciliation

Payroll-related financial views where permitted

The Accountant does NOT automatically gain:

Manager expense approval

Manager payroll amount control

Manager payroll finalization

unless explicitly granted by backend permissions.

============================================================
69 — ROLE-SAFE NAVIGATION
============================================================

Navigation must adapt to permissions.

Example:

Manager:

Finance
Banking
Expenses
Payroll

Accountant:

Finance
Banking
Expenses
authorized Payroll views

Other roles:

Only authorized modules.

Do not display inaccessible modules merely to show that they exist.

============================================================
70 — FINANCIAL SECURITY UX
============================================================

Financial actions should feel deliberate.

For high-impact actions:

Use confirmation dialogs.

Examples:

Approve Expense

Pay Expense

Edit Payroll

Approve Payroll

Finalize Payroll

Create Bank Adjustment

Mark Reconciliation Complete

The confirmation should summarize the action.

============================================================
71 — NO DIRECT BALANCE EDIT
============================================================

This rule must be visually enforced.

Do NOT create:

Balance input

Edit balance button

Override balance

Manual balance setter

Instead:

View transactions

Review reconciliation

Correct underlying records

Create authorized adjustment

All according to backend workflow.

============================================================
72 — FINANCIAL EMPTY STATES
============================================================

Create meaningful empty states.

Examples:

"No transactions found."

"No pending expense approvals."

"No expenses recorded for this period."

"No payroll run exists for this period."

"No reconciliation discrepancies."

"No bank transactions found."

Do not leave blank tables.

============================================================
73 — FINANCIAL LOADING STATES
============================================================

Create loading states for:

Finance Dashboard

Financial Activity

Bank Accounts

Bank Transactions

Reconciliation

Expenses

Expense Detail

Expense Approval

Payroll Run

Payroll Employee List

Payroll Detail

Exports

Use consistent skeleton components.

============================================================
74 — FINANCIAL ERROR STATES
============================================================

Create friendly errors:

"Unable to load financial activity."

"Unable to load bank account."

"Unable to reconcile transaction."

"Unable to submit expense."

"Unable to approve expense."

"Unable to process expense payment."

"Unable to update payroll."

"Unable to approve payroll."

"Unable to finalize payroll."

Never expose:

SQL

PHP stack traces

database errors

internal server details

============================================================
75 — FINANCIAL SUCCESS STATES
============================================================

Create consistent success feedback:

"Expense submitted."

"Expense approved."

"Expense paid."

"Expense rejected."

"Payroll amount updated."

"Payroll run approved."

"Payroll run finalized."

"Transaction reconciled."

Use the established success component.

============================================================
76 — DARK MODE
============================================================

All P2H2 screens must support the global dark mode.

Design dark versions of:

Finance Dashboard

Financial Activity

Bank Account List

Bank Account Detail

Bank Transaction Detail

Reconciliation

Expense List

Expense Detail

Expense Approval

Expense Payment

Payroll Dashboard

Payroll Run

Payroll Employee Detail

Payroll Editing

Payroll Approval

Payroll Finalization

Use semantic dark-mode tokens.

Do not manually invent dark colors for individual screens.

============================================================
77 — RESPONSIVE FINANCE
============================================================

Desktop:

Use structured tables.

Tablet:

Condense secondary columns.

Mobile:

Transform tables into cards.

Financial numbers must remain highly readable.

Never allow:

ETB amounts

balances

payment statuses

payroll totals

to become visually ambiguous on small screens.

============================================================
78 — MOBILE PAYROLL
============================================================

Payroll is primarily desktop/tablet-oriented because of its complexity.

However, mobile should still support:

Viewing payroll status

Viewing pending approvals

Reviewing individual employee lines

Reading totals

Viewing alerts

Do not attempt to cram the full payroll table into a phone screen.

============================================================
79 — ACCESSIBILITY
============================================================

Target:

WCAG 2.1 AA.

Ensure:

Keyboard navigation

Visible focus

Accessible form labels

Accessible table headers

Accessible dialogs

Accessible dropdowns

Accessible status indicators

Sufficient contrast

No color-only financial meaning

No keyboard traps

============================================================
80 — FINANCIAL NUMBER ALIGNMENT
============================================================

Financial values should generally be right-aligned in tables.

Example:

ETB 100,000.00

ETB 25,500.00

ETB 0.00

This makes comparison and scanning easier.

Do not center large amounts unnecessarily.

============================================================
81 — FINANCE VISUAL RESTRAINT
============================================================

Avoid excessive:

Charts

Gradients

Animations

Illustrations

Decorative icons

The financial interface should feel authoritative.

Use visual emphasis only where it improves comprehension.

============================================================
82 — REUSABLE FINANCE COMPONENTS
============================================================

Create reusable components for:

Financial Summary Card

Financial Table

Financial Record

Currency Display

Bank Account Card

Bank Account Selector

Bank Transaction Row

Bank Transaction Detail

Reconciliation Panel

Reconciliation Difference

Expense Card

Expense Table

Expense Approval Card

Expense Document Upload

Expense Detail

Expense Payment Panel

Payroll Run Card

Payroll Employee Row

Payroll Amount Editor

Payroll Review Badge

Payroll Approval Dialog

Payroll Finalization Dialog

Audit Timeline

Export Menu

Confirmation Dialog

Loading Skeleton

Error Alert

Success Alert

Empty State

============================================================
83 — COMPONENT STATES
============================================================

Every reusable interactive component must have:

Default

Hover

Focus

Pressed

Disabled

Loading

Error

Success where applicable

Empty where applicable

Dark mode

Mobile

============================================================
84 — FRONTEND/BACKEND BOUNDARY
============================================================

The frontend MUST NOT calculate:

Bank balances

Reconciliation differences

Financial totals

Expense totals

Payroll totals

Payroll calculations

Payment balances

Approval state

Payment state

Reconciliation state

The frontend displays authoritative PHP responses.

============================================================
85 — AUDIT REQUIREMENT
============================================================

All financially important actions should visibly support traceability.

Examples:

Expense created

Expense approved

Expense rejected

Expense paid

Payroll amount changed

Payroll approved

Payroll finalized

Bank transaction recorded

Bank transaction reconciled

Adjustment created

Each event should show, where provided:

Actor

Timestamp

Action

Reference

Reason

============================================================
86 — FINAL FIGMA FRAMES: FINANCE
============================================================

Create:

01. Finance Dashboard

02. Finance Dashboard — Loading

03. Finance Dashboard — Empty Attention State

04. Financial Activity

05. Financial Activity — Filters

06. Financial Record Detail

07. Financial Record — Error

============================================================
87 — FINAL FIGMA FRAMES: BANKING
============================================================

Create:

08. Banking Dashboard

09. Two Bank Accounts View

10. Bank Account Detail

11. Bank Transaction List

12. Bank Transaction Detail

13. Bank Account Selector

14. Reconciliation Dashboard

15. Reconciliation Detail

16. Reconciliation Discrepancy

17. Reconciliation Confirmation

18. Reconciliation Success

============================================================
88 — FINAL FIGMA FRAMES: EXPENSES
============================================================

Create:

19. Expenses Dashboard

20. Expense List

21. Expense List — Empty

22. New Expense

23. Expense Document Upload

24. Expense Detail

25. Expense Approval Queue

26. Review Expense

27. Approve Expense Confirmation

28. Reject Expense

29. Pay Expense

30. Expense Payment Confirmation

31. Expense Success

32. Expense Error

33. Expense Audit Timeline

============================================================
89 — FINAL FIGMA FRAMES: PAYROLL
============================================================

Create:

34. Payroll Dashboard

35. Current Payroll Run

36. Payroll Run — Loading

37. Payroll Run — Needs Review

38. Payroll Employee Detail

39. Edit Payroll Amount

40. Payroll Amount Change Confirmation

41. Payroll Approval

42. Payroll Approval Confirmation

43. Payroll Finalization

44. Payroll Finalization Confirmation

45. Payroll Completed

46. Payroll Error

47. Payroll Audit Timeline

============================================================
90 — FINAL VISUAL QUALITY CHECK
============================================================

Before completing P2H2 verify:

- Finance feels like part of the same ERP.
- Banking clearly separates the two company bank accounts.
- Bank balances are visibly calculated.
- No direct balance-edit control exists.
- Reconciliation has a dedicated workflow.
- Reconciliation discrepancies are clearly visible.
- Expenses can be created.
- Accountant can submit expense requests according to permissions.
- Manager is clearly the approval authority.
- Manager payment action is distinct from approval.
- Expense rejection is represented.
- Expense audit history exists.
- Payroll is represented as a monthly RUN.
- Manager controls employee payroll amounts.
- Payroll amount changes are auditable.
- Individual payroll lines can be reviewed.
- Payroll run approval is distinct from payroll editing.
- Payroll finalization is distinct from approval.
- RBAC controls visibility.
- RBAC controls actions.
- Frontend hiding is never treated as security.
- PHP remains the authorization layer.
- No frontend financial calculation replaces backend calculations.
- ETB formatting is consistent.
- CSV export exists.
- PDF export exists.
- Loading states exist.
- Error states exist.
- Success states exist.
- Empty states exist.
- Dark mode exists.
- Responsive layouts exist.
- Accessibility is considered.
- Sensitive financial information is not unnecessarily exposed.
- Every important financial action is traceable.
- No raw PHP/database/server errors appear in the interface.

============================================================
91 — FINAL EXPERIENCE OBJECTIVE
============================================================

The financial side of the ERP should communicate one simple idea:

EVERY BIRR MUST BE TRACEABLE.

The user should always be able to understand:

WHERE MONEY CAME FROM

↓

WHICH BANK ACCOUNT RECEIVED IT

↓

WHAT TRANSACTION RECORDED IT

↓

WHICH CUSTOMER OR EXPENSE IT RELATES TO

↓

WHO RECORDED IT

↓

WHO APPROVED IT

↓

WHAT BALANCE REMAINS

And for expenses:

EXPENSE REQUEST

↓

MANAGER REVIEW

↓

MANAGER APPROVAL

↓

PAYMENT

↓

BANK TRANSACTION

↓

AUDIT TRAIL

And for payroll:

MONTHLY PAYROLL RUN

↓

EMPLOYEE AMOUNTS

↓

MANAGER EDITS WHERE NECESSARY

↓

REVIEW

↓

MANAGER APPROVAL

↓

FINALIZATION

↓

AUDITABLE PAYROLL RECORD

The entire interface must feel:

PRECISE

CONTROLLED

TRANSPARENT

PROFESSIONAL

SIMPLE

TRUSTWORTHY

Do not make this look like a generic accounting dashboard.

It is the financial control center of a specialized coffee-roasting ERP.

Build every screen so that a real employee can understand what is happening without needing to understand the underlying PHP architecture or database.
