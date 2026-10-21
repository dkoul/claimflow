# Users and permissions

## Demo users

| Username | Role | Display name |
|----------|------|--------------|
| alice | EMPLOYEE | Alice Sharma |
| bob | MANAGER | Bob Mehta |
| carol | FINANCE | Carol Singh |

All demo users share the password documented in the README (`demo123`).

## Authorization

- **Employee**: Own claims only. Create claims. Edit `DRAFT` or `REJECTED`. Submit or resubmit.
- **Manager**: Claims where they are the assigned manager. Approve or reject `PENDING` claims.
- **Finance**: All claims. Mark `APPROVED` claims as `REIMBURSED`.

## Enforcement

- The server derives identity from the session cookie, never from client-supplied role fields.
- Unauthorized access returns 403 or 404 as appropriate.
- Unauthenticated API calls return 401.
