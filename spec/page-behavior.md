# Page behavior

| Route | Audience | Purpose |
|-------|----------|---------|
| `/login` | All | Authenticate |
| `/dashboard` | Authenticated | Role-specific summary |
| `/claims` | Authenticated | Filterable claim list |
| `/claims/new` | Employee | Create claim |
| `/claims/:id` | Authorized | Claim detail and actions |
| `/claims/:id/edit` | Employee (owner) | Edit draft or rejected |

Protected routes redirect to login when there is no session. Navigation and actions depend on role and claim status.

List page supports search (ID or title), status filter, category filter, sort, and pagination.
