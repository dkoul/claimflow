# ClaimFlow

A lightweight expense reimbursement application for AI testing workshops. ClaimFlow demonstrates realistic business workflows—roles, state transitions, validation, and authorization—while persisting all data in repository-local JSON files.

## Quick start

```bash
npm install
npm install --prefix server
npm run dev
```

- **Web UI:** http://localhost:5173 (proxies API requests to the backend)
- **API:** http://localhost:3001

For a production-style run (built UI served by Express):

```bash
npm run start
```

Then open http://localhost:3001

## Demo credentials

| Username | Role    | Password  |
|----------|---------|-----------|
| `alice`  | Employee | `demo123` |
| `bob`    | Manager  | `demo123` |
| `carol`  | Finance  | `demo123` |

Password hashes live in `server/src/fixtures/credentials.json` (not exposed via the API).

## Features

- Login with HTTP-only session cookies
- Role-specific dashboards
- Claim list with search, filters, sort, and pagination
- Create, edit, submit, approve, reject, resubmit, and reimburse workflows
- Append-only claim history and optimistic concurrency (`version`)
- Business rules enforced on the server

## Specifications

Behavior is documented under [`spec/`](./spec/README.md), independent of the React/Express implementation. Use these documents when generating test scenarios for Surpryze workshops.

## Data and reset

Application data is stored in [`data/`](./data/):

- `users.json`, `claims.json`, `categories.json`, `app-config.json`
- Seed copies for reset: `data/seed/`

Restore demo fixtures:

```bash
npm run reset-demo
```

Validate that all spec files are present:

```bash
npm run validate-specs
```

## API overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Sign in |
| POST | `/api/auth/logout` | Sign out |
| GET | `/api/auth/me` | Current user |
| GET | `/api/dashboard` | Role dashboard |
| GET | `/api/claims` | List claims (authorized) |
| POST | `/api/claims` | Create claim (`submit: true` to submit immediately) |
| GET | `/api/claims/:id` | Claim detail |
| PATCH | `/api/claims/:id` | Update draft/rejected claim (requires `version`) |
| POST | `/api/claims/:id/submit` | Submit or resubmit |
| POST | `/api/claims/:id/approve` | Manager approve |
| POST | `/api/claims/:id/reject` | Manager reject (requires `reason`) |
| POST | `/api/claims/:id/reimburse` | Finance reimburse |

## Workshop test scenario format

`[Area] | [Condition] | [Expected outcome]`

Example:

```text
Authorization | Employee opens another employee's claim | Access is denied
```

## Security note

This is a local workshop application. Hardcoded credentials and simplified sessions are for demonstration only—not a production authentication design.
