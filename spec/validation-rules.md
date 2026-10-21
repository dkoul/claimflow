# Validation rules

## Claim fields

| Field | Rules |
|-------|--------|
| Title | Required |
| Description | Required |
| Category | One of Travel, Meals, Accommodation, Equipment, Other |
| Expense date | Required, not in the future |
| Amount | Required, > 0, ≤ single-claim limit |
| Receipt reference | Optional text |

## Actions

- Submit: all field rules; status must be `DRAFT` or `REJECTED`.
- Reject: non-empty reason required.
- Edit save: `version` must match current record or server returns 409.

Frontend and backend both validate required fields and amounts.
