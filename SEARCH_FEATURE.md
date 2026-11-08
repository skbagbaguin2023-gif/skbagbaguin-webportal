# Global search

The public header search queries the Supabase `search_public_content` RPC and
also checks the small, reviewed index of public UI/help copy in
`src/services/search.ts`. Results are limited to public programs, events,
published announcements, public Facebook updates, public transparency
documents, council officials, active services, and approved public help text.

Applications, event registrations, feedback, KK profiles, maintenance issues,
drafts, private documents, and admin-only records are not searchable. The
database function repeats these visibility checks, so hiding a result in the
React UI is not the privacy boundary.

## Adding a searchable content type

1. Add the collection and its publication predicate to `visible` in
   `supabase/global_search_migration.sql`.
2. Map its title, snippet, date, and public page in the same function.
3. Add the type to `SearchType` and the filter list in `SearchView.tsx`.
4. Add a migration test covering a published result and a private/unpublished
   record.

For static public copy, add a reviewed entry to
`STATIC_PUBLIC_SEARCH_CONTENT`. Always link it to an existing public page or
section; do not scrape the DOM or add private/admin text.

## Deploying and reindexing

Run [`supabase/rate_limits.sql`](./supabase/rate_limits.sql) first, then run
[`supabase/global_search_migration.sql`](./supabase/global_search_migration.sql)
in the Supabase SQL Editor after the base schema. The search migration uses the
existing rate-limit function. The `pg_trgm` index is
maintained by Postgres as records change; there is no separate search service
or manual reindex job. If the index is rebuilt, run:

```sql
reindex index public.portal_records_public_search_idx;
```

The client debounces suggestions by 300 ms, cancels stale requests, caches
completed queries, and supports `/search?q=...` links. `Ctrl/Cmd+K`, `/`, and
`Escape` control the header search.
