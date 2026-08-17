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

NOW BUILD:

F3-12 — BANKING, CASH CONTROL & RECONCILIATION EXPERIENCE


==================================================
IMPORTANT IMPLEMENTATION BOUNDARY
==================================================

This is FRONTEND UI/UX ONLY.

Use:

- HTML
- CSS
- JavaScript only where necessary for interface interactions
- the established design system
- existing reusable components
- existing page templates
- centralized RBAC/permission architecture

The eventual backend will use PHP.

DO NOT implement PHP.

DO NOT implement database logic.

DO NOT implement accounting calculations.

DO NOT implement reconciliation calculations.

DO NOT make the frontend authoritative for balances.

The backend will eventually be authoritative for:

- bank accounts
- opening balances
- transactions
- calculated balances
- deposits
- withdrawals
- transfers
- reconciliation
- reconciliation differences
- financial corrections
- approval states
- permissions

The frontend is responsible for:

DISPLAY
+
INPUT
+
AUTHORIZED ACTIONS
+
CLEAR FINANCIAL UX


==================================================
1. PRIMARY OBJECTIVE
==================================================

Create the complete Banking and Reconciliation experience.

The interface must allow authorized users to understand:

- which bank accounts exist
- current calculated balance
- recent transactions
- incoming money
- outgoing money
- transfers
- reconciliation state
- discrepancies
- items requiring review
- historical financial activity

The interface must make a critical distinction:

CALCULATED BALANCE

is not the same thing as:

A MANUALLY EDITABLE BALANCE.


==================================================
2. CORE BANKING PRINCIPLE
==================================================

The system must never present the calculated bank balance as a normal editable field.

The calculated balance comes from:

Opening Balance
+
Recorded Transactions

according to backend financial logic.

The frontend displays the result supplied by the backend.

Never create:

Current Balance
[ ETB 100,000 ]
[Save]

as a balance-editing interface.

If a correction is required, the user must be guided toward the appropriate transaction/reconciliation/exception workflow.


==================================================
3. BANKING MODULE STRUCTURE
==================================================

Create:

1. Banking Dashboard
2. Bank Accounts
3. Bank Account Detail
4. Transaction List
5. Transaction Detail
6. New Transaction
7. Transfer
8. Reconciliation
9. Reconciliation Detail
10. Reconciliation Discrepancy
11. Financial Activity
12. Banking Empty/Error/Loading States


==================================================
4. BANKING DASHBOARD
==================================================

Page title:

Banking

Subtitle:

Monitor bank balances, transactions, and reconciliation activity.

Use the established DashboardTemplate.

Summary cards may include:

Total Calculated Balance
Incoming
Outgoing
Needs Reconciliation

All values must come from backend-provided fields.

Do not calculate totals in the frontend.


==================================================
5. BANK ACCOUNT CARDS
==================================================

Create a reusable BankAccountCard.

Example:

COMMERCIAL BANK

Operating Account

Calculated Balance

ETB 485,250.00

Last Activity:

12 Aug 2026

Status:

Active

[View Account]


==================================================
6. BANK ACCOUNT LIST
==================================================

Create a structured account list.

Recommended columns:

Account
Bank
Account Type
Calculated Balance
Last Transaction
Status
Action

Example:

Operating Account
Commercial Bank
Business
ETB 485,250.00
12 Aug 2026
Active
[View]


==================================================
7. ACCOUNT STATUS
==================================================

Use the centralized status system.

Potential states:

Active
Inactive
Needs Reconciliation

If the backend defines additional states, integrate them through the centralized status mapping.

Do not create local status strings inside the banking module.


==================================================
8. BANK ACCOUNT DETAIL
==================================================

Create a dedicated Bank Account Detail screen.

Header:

Operating Account

Commercial Bank

Status:

Active

Show:

Calculated Balance
Account information
Recent transactions
Reconciliation status
Activity/history


==================================================
9. CALCULATED BALANCE
==================================================

Make this highly visible.

Example:

CALCULATED BALANCE

ETB 485,250.00

Supporting text:

Based on opening balance and recorded transactions.

Do not display a misleading "Edit Balance" button.


==================================================
10. BALANCE EXPLANATION
==================================================

Where appropriate, provide a subtle informational explanation:

This balance is calculated from the account's opening balance and recorded transactions. Corrections should be made through the appropriate transaction or reconciliation workflow.

This should educate users without overwhelming them.


==================================================
11. ACCOUNT INFORMATION
==================================================

Show non-sensitive account information such as:

Bank Name
Account Name
Account Type
Currency
Status
Opening Balance Date where supported

Do not expose:

passwords
PINs
authentication credentials
secret banking credentials
private keys


==================================================
12. TRANSACTION LIST
==================================================

Create a transaction list within Bank Account Detail.

Recommended columns:

Date
Reference
Type
Description
Incoming
Outgoing
Calculated Balance
Status
Action

Example:

12 Aug
TRX-1842
Deposit
Customer Payment
ETB 45,000.00
—
ETB 485,250.00
Recorded


==================================================
13. TRANSACTION VISUAL HIERARCHY
==================================================

Incoming and outgoing transactions should be visually distinguishable.

Incoming:

status.safe or neutral positive treatment

Outgoing:

neutral or carefully differentiated treatment

Do not use red for every outgoing transaction.

Outgoing money is not necessarily a problem.

Danger styling is reserved for:

failed
disputed
invalid
unreconciled/problematic

states.


==================================================
14. TRANSACTION TYPES
==================================================

Potential prototype transaction types:

Deposit
Withdrawal
Transfer
Adjustment
Other

These are examples.

Final transaction types must come from the backend contract/master data.

Do not hardcode assumptions into business logic.


==================================================
15. TRANSACTION DETAIL
==================================================

Create:

Transaction Detail

Show:

Reference
Date
Account
Type
Description
Amount
Direction
Calculated Balance After Transaction
Recorded By
Status
Notes
Activity


==================================================
16. TRANSACTION DIRECTION
==================================================

Clearly display:

INCOMING

or:

OUTGOING

Example:

Incoming

ETB 45,000.00

Avoid ambiguous positive/negative numbers without labels.


==================================================
17. TRANSACTION AMOUNT
==================================================

Use centralized ETB formatting.

Example:

ETB 45,000.00

Do not display:

+45K

as the primary financial representation.

Precision matters.


==================================================
18. NEW TRANSACTION
==================================================

Create:

New Bank Transaction

Fields may include:

Bank Account
Transaction Type
Direction
Amount
Date
Reference
Description
Notes
Attachment where supported

Use existing form components.

Do not create independent form styling.


==================================================
19. TRANSACTION SUBMISSION
==================================================

Primary action:

[Record Transaction]

During submission:

[Recording...]

Prevent duplicate submissions.

After successful submission:

Transaction recorded successfully.

Display the backend-returned transaction reference/status.


==================================================
20. TRANSFERS
==================================================

Create a dedicated transfer experience where the backend supports bank-to-bank transfers.

Page:

Transfer Funds

Fields:

From Account
To Account
Amount
Date
Reference
Notes

Make the direction extremely clear.

Example:

FROM

Operating Account

TO

Savings Account

Amount

ETB 50,000.00


==================================================
21. TRANSFER CONFIRMATION
==================================================

Before submitting:

Confirm Transfer

From:
Operating Account

To:
Savings Account

Amount:
ETB 50,000.00

[Cancel]

[Confirm Transfer]


==================================================
22. TRANSFER STATUS
==================================================

Display backend-provided state.

Potential prototype states:

Pending
Completed
Failed
Cancelled

Do not infer completion merely because the form submission succeeded.

Backend response determines final state.


==================================================
23. RECONCILIATION MODULE
==================================================

Create a dedicated Reconciliation experience.

Page title:

Bank Reconciliation

Subtitle:

Compare recorded transactions with the bank's financial records and resolve differences.

This should feel like a controlled financial review workflow.


==================================================
24. RECONCILIATION DASHBOARD
==================================================

Show:

Accounts Requiring Reconciliation
Recently Reconciled
Open Differences

Only use backend-provided counts.


==================================================
25. RECONCILIATION LIST
==================================================

Recommended columns:

Account
Period
System Balance
Bank Balance / Statement Balance where supplied
Difference
Status
Last Reconciled
Action

Example:

Operating Account
August 2026

System Balance:
ETB 485,250.00

Statement Balance:
ETB 482,250.00

Difference:
ETB 3,000.00

Needs Review


==================================================
26. RECONCILIATION DIFFERENCE
==================================================

Make discrepancies immediately visible.

Example:

RECONCILIATION DIFFERENCE

System Balance

ETB 485,250.00

Statement Balance

ETB 482,250.00

Difference

ETB 3,000.00

Status:

Needs Review


==================================================
27. DIFFERENCE VISUAL LANGUAGE
==================================================

Use the existing discrepancy treatment.

Do not create a unique banking warning language.

Use:

status.warning

for reviewable differences.

Use:

status.danger

only when the backend identifies a serious exception/dispute/problem.


==================================================
28. RECONCILIATION DETAIL
==================================================

Create:

Reconciliation Detail

Sections:

Account
Period
System Balance
Statement Balance
Difference
Matched Transactions
Unmatched Transactions
Notes
Review Actions
Activity


==================================================
29. MATCHED TRANSACTIONS
==================================================

Provide a clear matched section.

Example:

Matched Transactions

12 Aug
TRX-1842
Customer Payment
ETB 45,000.00

Status:

Matched


==================================================
30. UNMATCHED TRANSACTIONS
==================================================

Create a distinct section:

Unmatched Transactions

Show:

Date
Reference
Description
Amount
Direction
Potential status
Action

Example:

10 Aug
TRX-1834
Bank Deposit
ETB 3,000.00

Status:

Unmatched

[Review]


==================================================
31. RECONCILIATION REVIEW
==================================================

Create a review interface.

Header:

Review Reconciliation Difference

Show:

Account
Period
System value
Statement value
Difference
Related transactions

Then available authorized actions.


==================================================
32. RECONCILIATION ACTIONS
==================================================

Possible actions depending on backend workflow:

[Match Transaction]

[Mark for Review]

[Record Adjustment]

[Escalate]

[Complete Reconciliation]

These are UI examples.

Only expose actions actually supported by the backend state and permissions.


==================================================
33. MATCH TRANSACTION
==================================================

Where supported:

Match Transaction

Show:

Bank transaction

System transaction

Amount

Date

Reference

Then:

[Cancel]

[Match]


==================================================
34. ADJUSTMENT UX
==================================================

If the backend permits a financial adjustment workflow:

DO NOT make it look like direct balance editing.

Use:

Record Adjustment

instead of:

Edit Balance

Show:

Affected account
Amount
Reason
Reference
Supporting note/document

The adjustment must become a proper financial record.


==================================================
35. ADJUSTMENT CONFIRMATION
==================================================

Before submission:

Record Adjustment?

This will create a financial adjustment record for the selected account.

Amount:
ETB 3,000.00

Reason:
[reason]

[Cancel]

[Record Adjustment]


==================================================
36. COMPLETING RECONCILIATION
==================================================

If the backend indicates the account is reconciled:

Show:

Reconciliation Complete

Account:

Operating Account

Period:

August 2026

Status:

Reconciled

Include:

Completed By
Completed At

where supplied.


==================================================
37. OPEN RECONCILIATION
==================================================

If unresolved:

Status:

Needs Review

Show the unresolved difference prominently.

Do not allow the screen to visually imply reconciliation is complete.


==================================================
38. RECONCILIATION TIMELINE
==================================================

Use the established activity/timeline component.

Possible events:

Reconciliation Started
Transaction Matched
Difference Detected
Adjustment Recorded
Review Submitted
Reconciliation Completed

Only display actual backend audit records.


==================================================
39. FINANCIAL ACTIVITY
==================================================

Create a banking activity feed.

Potential entries:

Transaction Recorded
Transfer Created
Transfer Completed
Transaction Matched
Reconciliation Started
Difference Identified
Adjustment Recorded
Reconciliation Completed

Each event should include:

Actor
Timestamp
Reference
Relevant record


==================================================
40. SEARCH AND FILTERS
==================================================

Support server-side filtering.

Possible filters:

Bank Account
Transaction Type
Direction
Status
Date Range
Reference

Search:

Reference
Description

Do not load all transactions and filter entirely in JavaScript.


==================================================
41. DATE RANGE
==================================================

Create a reusable financial date-range control.

Potential options:

Today
This Week
This Month
Previous Month
Custom Range

The backend remains responsible for actual filtering.


==================================================
42. BANK ACCOUNT FILTER
==================================================

Where multiple accounts exist:

[All Accounts]

[Operating Account]

[Savings Account]

etc.

Final account list must come from backend data.


==================================================
43. EMPTY STATES
==================================================

Banking with no accounts:

No bank accounts have been configured yet.

Transactions with none:

No transactions found for this account.

Reconciliation with none:

No reconciliation items need your attention.


==================================================
44. NO RESULTS
==================================================

When filters produce no results:

No transactions match these filters.

[Clear Filters]


==================================================
45. LOADING STATES
==================================================

Create loading states for:

Banking dashboard
Bank account list
Bank account detail
Transaction list
Transaction detail
New transaction
Transfer
Reconciliation list
Reconciliation detail
Matching
Adjustment
Completion


==================================================
46. ERROR STATES
==================================================

Create human-readable errors.

Examples:

Unable to load bank accounts.

Unable to load transactions.

Transaction could not be recorded.

Transfer could not be completed.

Reconciliation data could not be loaded.

The reconciliation action could not be completed.

Never expose raw technical/database errors.


==================================================
47. NETWORK FAILURE
==================================================

Never show fake financial success.

Example:

We couldn't record this transaction.

The transaction may not have been saved.

Please check your connection and try again.

[Try Again]


==================================================
48. DUPLICATE SUBMISSION
==================================================

Prevent duplicate:

transactions
transfers
adjustments
matching actions
reconciliation completion

Disable the relevant action while processing.


==================================================
49. RBAC
==================================================

CRITICAL.

Banking must use centralized RBAC.

Potential permissions:

banking.view
banking.account.view
banking.transaction.view
banking.transaction.create
banking.transfer.create
banking.reconciliation.view
banking.reconciliation.match
banking.reconciliation.adjust
banking.reconciliation.complete

These are illustrative.

Use the project's actual permission model.

Do not use scattered role checks.

Do not assume:

Manager = everything.

The backend permission model is authoritative.


==================================================
50. ROLE EXPERIENCE
==================================================

MANAGER / AUTHORIZED FINANCE USER:

May see banking dashboards, accounts, transactions, reconciliation and approved financial controls according to permission.

SALES REPRESENTATIVE:

May see relevant payment/order information but should not automatically gain bank-account administration.

STOREKEEPER:

Should not see banking controls unless explicitly authorized.

DELIVERY PERSONNEL:

Should not see banking administration.

Only expose banking navigation when the authenticated user has the required permission.


==================================================
51. NAVIGATION
==================================================

Banking should appear in the application navigation only when the user has the required access.

Do not render:

Banking

then display:

Access Denied

for users who simply do not have the module.

Use the centralized navigation visibility architecture.


==================================================
52. SECURITY UX
==================================================

Do not display sensitive banking credentials.

Never expose:

Passwords
PINs
API credentials
Authentication secrets
Private keys

Account identifiers should be shown only as permitted.


==================================================
53. BANK ACCOUNT DETAIL MOBILE
==================================================

On mobile, prioritize:

Account Name
Calculated Balance
Status
Recent Activity
Primary Action

Transaction rows may become cards.


==================================================
54. TRANSACTION MOBILE CARD
==================================================

Create reusable:

BankTransactionCard

Example:

TRX-1842

Customer Payment

Incoming

ETB 45,000.00

12 Aug 2026

Recorded

[View]


==================================================
55. RECONCILIATION MOBILE
==================================================

On mobile show:

Account
Period
System Balance
Statement Balance
Difference
Status
Primary action

Do not hide the difference.


==================================================
56. DARK MODE
==================================================

All banking screens must support dark mode.

Verify:

balance cards
tables
transaction cards
reconciliation panels
difference indicators
forms
dialogs
timelines
empty states
error states


==================================================
57. ACCESSIBILITY
==================================================

Target WCAG 2.1 AA.

Ensure:

- keyboard navigation
- visible focus
- semantic labels
- accessible tables
- accessible status indicators
- accessible dialogs
- accessible financial amounts
- non-color discrepancy indicators
- proper form labels


==================================================
58. CSS REQUIREMENTS
==================================================

Use the established CSS architecture.

Use:

CSS variables
semantic design tokens
Grid
Flexbox
media queries
component classes
state classes

Do not introduce:

raw hex values
arbitrary spacing
inline styling
one-off shadows
one-off radii
duplicated CSS


==================================================
59. NO FRONTEND ACCOUNTING CALCULATIONS
==================================================

CRITICAL.

The frontend must NOT independently calculate authoritative:

- account balances
- reconciliation differences
- transaction totals
- financial adjustments
- cash positions
- transfer results

The backend provides authoritative values.

Frontend:

DISPLAY
+
COLLECT INPUT
+
TRIGGER ACTION


==================================================
60. CALCULATED BALANCE RULE
==================================================

Every calculated balance must visually communicate that it is calculated.

Preferred:

Calculated Balance

ETB 485,250.00

Avoid:

Balance
[editable-looking field]

Do not create any UX that suggests a manager can simply overwrite the balance.


==================================================
61. RECONCILIATION RULE
==================================================

The frontend must not decide:

"These transactions match."

It displays backend matching/reconciliation results.

The frontend may provide UI for selecting transactions to match if the backend supports that workflow.

The backend validates and records the actual reconciliation.


==================================================
62. FINANCIAL PRECISION
==================================================

All amounts use:

ETB + thousands separators + 2 decimal places

Example:

ETB 485,250.00

Do not abbreviate primary financial values.


==================================================
63. CONFIRMATION DIALOGS
==================================================

Use consequence-aware confirmations for:

Transfers
Adjustments
Transaction deletion/cancellation if supported
Matching
Completing reconciliation

Example:

Complete Reconciliation?

All selected items will be recorded as reconciled according to the financial workflow.

[Cancel]

[Complete]


==================================================
64. VISUAL STYLE
==================================================

Banking should feel:

Precise
Stable
Professional
Trustworthy
Calm

Avoid:

large decorative charts
excessive gradients
unnecessary animation
consumer banking gimmicks
oversized illustrations

Use visual emphasis for financial exceptions and decisions.


==================================================
65. REUSABLE COMPONENTS
==================================================

Create/reuse:

BankingSummaryCard
BankAccountCard
BankAccountTable
BankAccountDetail
CalculatedBalance
TransactionTable
BankTransactionCard
TransactionForm
TransactionDetail
TransferForm
TransferConfirmation
ReconciliationTable
ReconciliationDetail
ReconciliationDifference
TransactionMatchingPanel
AdjustmentForm
FinancialTimeline
BankingFilterBar


==================================================
66. PAGE COMPOSITION
==================================================

BANKING DASHBOARD:

DashboardTemplate
+
PageHeader
+
SummaryCards
+
BankAccountCards
+
RecentTransactions
+
ReconciliationAttention

BANK ACCOUNT DETAIL:

DetailTemplate
+
AccountHeader
+
CalculatedBalance
+
AccountInformation
+
TransactionTable
+
ReconciliationSummary
+
Activity

RECONCILIATION:

PageTemplate
+
PageHeader
+
FilterBar
+
ReconciliationTable

RECONCILIATION DETAIL:

DetailTemplate
+
ReconciliationHeader
+
BalanceComparison
+
DifferencePanel
+
MatchedTransactions
+
UnmatchedTransactions
+
Actions
+
Timeline


==================================================
67. FINAL SCREEN INVENTORY
==================================================

BANKING:

1. Banking Dashboard
2. Banking Dashboard — Loading
3. Banking Dashboard — Empty
4. Banking Dashboard — Error
5. Bank Accounts
6. Bank Account — Loading
7. Bank Account — Empty
8. Bank Account Detail
9. Transaction List
10. Transaction List — Empty
11. Transaction List — No Results
12. Transaction Detail
13. New Transaction
14. Transfer Funds
15. Transfer Confirmation

RECONCILIATION:

16. Reconciliation Dashboard
17. Reconciliation List
18. Reconciliation — Loading
19. Reconciliation — Empty
20. Reconciliation — Error
21. Reconciliation Detail
22. Reconciliation Difference
23. Transaction Matching
24. Record Adjustment
25. Adjustment Confirmation
26. Reconciliation Complete
27. Reconciliation Activity


==================================================
68. DEFINITION OF DONE
==================================================

F3-12 is complete when:

[ ] Banking dashboard exists.

[ ] Bank account list exists.

[ ] Bank account detail exists.

[ ] Calculated balance display exists.

[ ] Calculated balance is clearly non-editable.

[ ] Transaction list exists.

[ ] Transaction detail exists.

[ ] New transaction form exists.

[ ] Transfer interface exists.

[ ] Transfer confirmation exists.

[ ] Reconciliation dashboard exists.

[ ] Reconciliation list exists.

[ ] Reconciliation detail exists.

[ ] Difference state exists.

[ ] Matched transactions exist.

[ ] Unmatched transactions exist.

[ ] Matching interface exists.

[ ] Adjustment workflow exists where supported.

[ ] Reconciliation completion exists.

[ ] Financial activity exists.

[ ] Server-side filter structure exists.

[ ] Loading states exist.

[ ] Empty states exist.

[ ] No-results states exist.

[ ] Error states exist.

[ ] Network failure states exist.

[ ] Duplicate submissions are prevented.

[ ] RBAC is centralized.

[ ] Unauthorized banking navigation is hidden.

[ ] Sensitive banking information is protected.

[ ] ETB formatting is consistent.

[ ] Calculated balances are backend-authoritative.

[ ] Reconciliation differences are backend-authoritative.

[ ] No accounting calculations are implemented in frontend.

[ ] No direct balance editing exists.

[ ] Dark mode works.

[ ] Responsive behavior works.

[ ] Mobile banking cards exist.

[ ] WCAG 2.1 AA principles are followed.

[ ] Existing design tokens are reused.

[ ] Existing components are reused.

[ ] No raw visual values are introduced.

[ ] No PHP is implemented.

[ ] No database logic is implemented.


==================================================
69. FINAL UX PRINCIPLE
==================================================

Banking must communicate financial control.

The user should immediately understand:

WHICH ACCOUNT?

WHAT IS THE CALCULATED BALANCE?

WHAT TRANSACTIONS OCCURRED?

WHAT MONEY CAME IN?

WHAT MONEY WENT OUT?

IS EVERYTHING RECONCILED?

IS THERE A DIFFERENCE?

WHAT NEEDS REVIEW?

WHAT ACTION IS AUTHORIZED?

Most importantly:

NEVER MAKE THE USER THINK THE CALCULATED BALANCE CAN SIMPLY BE EDITED.

Corrections must be represented as legitimate financial records or reconciliation actions.

The interface should feel like a controlled ERP financial system, not a simple spreadsheet.

Build F3-12 as a polished, precise, RBAC-aware, responsive, CSS-based banking and reconciliation experience that integrates seamlessly with the existing Finance, Payments, Orders, and Delivery modules.

Do not redesign the established system.

Extend it consistently.

