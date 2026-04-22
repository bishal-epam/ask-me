# Generate Migration

Creates a new numbered SQL migration file in `supabase/migrations/`.

## Usage

```
/gen-migration <description>
```

Example: `/gen-migration add_analytics_events_table`

## Steps

1. Find the highest existing migration number:
   ```bash
   ls supabase/migrations/ | sort | tail -1
   ```
2. Increment by 1, zero-padded to 3 digits (e.g., `004_`)
3. Create the file: `supabase/migrations/{NNN}_{description}.sql`
4. Scaffold with standard header:

```sql
-- Migration: {NNN}_{description}
-- Created: {date}
-- Description: {one-line description}

-- ── UP ────────────────────────────────────────────────────────────────

-- your SQL here

-- ── DOWN (rollback) ──────────────────────────────────────────────────
-- DROP TABLE IF EXISTS ...;
```

5. Remind the user to run `npm run db:migrate` after editing.
