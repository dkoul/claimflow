# Persistence rules

Data files live under `data/`:

- `users.json` — user profiles (no passwords)
- `claims.json` — all claims
- `categories.json` — expense categories
- `app-config.json` — limits and defaults

Password hashes live in server-only fixtures, not in `users.json`.

Writes use a temporary file and atomic rename. A write queue serializes updates to each file. Seed copies for reset live under `data/seed/`.

The reset script restores seed files into `data/`.
