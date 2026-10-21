# Business rules

- Currency is fixed to INR for new claims.
- Single-claim amount limit: ₹25,000 (from `app-config.json`).
- Expense date cannot be in the future.
- New claims start as `DRAFT` with employee and manager from the authenticated user record.
- Only the assigned manager may approve or reject a pending claim.
- Rejection requires a reason; employees see it on the detail page.
- Rejected claims retain full history when edited and resubmitted.
- Approved or reimbursed claims cannot be edited by employees.
- Reimbursement is allowed only from `APPROVED` and only by finance users.
