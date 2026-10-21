# Claim lifecycle

## States

`DRAFT`, `PENDING`, `REJECTED`, `APPROVED`, `REIMBURSED`

## Allowed transitions

| From | Action | To |
|------|--------|-----|
| (none) | Create | DRAFT |
| DRAFT | Submit | PENDING |
| REJECTED | Edit | REJECTED |
| REJECTED | Resubmit | PENDING |
| PENDING | Approve | APPROVED |
| PENDING | Reject | REJECTED |
| APPROVED | Reimburse | REIMBURSED |

No other transitions are valid. Status must not be changed by direct field edits on update requests.

## History

Append-only events: CREATED, EDITED, SUBMITTED, RESUBMITTED, REJECTED, APPROVED, REIMBURSED. Each records actor, timestamp, optional comment, and previous/new status where relevant.
