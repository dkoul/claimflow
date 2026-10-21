# Product overview

ClaimFlow is a lightweight expense reimbursement application for AI testing workshops. Users log in, submit claims, review approvals, and track reimbursement.

## Principles

- No database: business data lives in JSON under `data/`.
- Specifications in `spec/` are authoritative for behavior.
- A local Node backend reads and writes JSON files.
- Demo authentication uses hardcoded users (workshop only).
- Workflows are deterministic and reproducible.

## Core capabilities

- Login and role-based dashboards
- Create, edit, list, and view expense claims
- Submit, approve, reject, resubmit, and reimburse claims
- Reset demo data to seed fixtures
