# Seed Database

Populates the local Supabase database with realistic test data for development.

## Usage

```
/seed-db [--reset]
```

Pass `--reset` to truncate all tables before seeding.

## What gets seeded

1. **3 profiles** with distinct personas:
   - `alice` — Senior Software Engineer looking for new role (jobseeker)
   - `marcus` — UX/Product designer with portfolio (creator/freelancer)
   - `priya` — Data scientist, open to consulting (freelancer)

2. **1 persona per profile** with `is_public = true`

3. **2–3 documents per persona** (sample CV text, bio, portfolio summary)

4. **Pre-computed embeddings** using the configured local model

5. **1–2 chat sessions** with mock conversation history per persona

## Notes

- All seeded users use `test+{name}@askme.dev` emails with password `TestPass123!`
- Seeded data is identifiable by `metadata->>'seeded': 'true'`
- Run `npm run db:seed` to execute; or use MCP supabase server directly
