## Goal

Produce a complete, developer-facing reference document of the Supabase database schema and deliver it as a downloadable markdown artifact at `/mnt/documents/unigramm-db-schema.md`.

## Approach

1. Run a series of read-only SQL queries against `information_schema` / `pg_catalog` to extract:
   - All tables in `public` (columns, defaults, nullability, PK/UNIQUE/CHECK constraints with full expressions)
   - All foreign keys with `ON DELETE` / `ON UPDATE` behavior
   - All indexes (name, columns, method, unique flag)
   - RLS status per table + every policy with raw `USING` and `WITH CHECK` expressions
   - All triggers per table (timing, event, function called)
   - All `public` functions / RPCs (args, return type, security mode, language, leading-comment description)
   - All custom enum types and their values
   - All installed extensions

2. Dump the raw query results to JSON in `/tmp/`, then run a Python script to render the markdown reference document with:
   - One section per table in the format requested (Columns / Indexes / RLS / Policies / Triggers / Foreign Keys)
   - Core tables (profiles, posts, messages, conversations, etc.) ordered first, then everything else alphabetically
   - Dedicated appendix sections for:
     - All RPCs / Functions
     - All Triggers (cross-table table)
     - Enum types
     - Extensions

3. Save the final file to `/mnt/documents/unigramm-db-schema.md` and surface it via a `presentation-artifact` tag so it can be downloaded.

## Notes

- This is a read-only documentation task. No database changes will be made and no project source files will be modified.
- The document is generated from live database state, so it will reflect the current schema exactly (including the recent `messages` / `notify_message` / `device_tokens` fixes).
- Expected size: large (likely 100KB+ markdown given the breadth of the schema). Will be delivered as a single file for easy search.