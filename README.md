# e-Sevai Phase 2 — Backend + Admin Panel

The middle layer of the e-Sevai Smart Data Entry System: syncs citizen session
data from the Phase 1 Android app, hands it off to the Phase 3 Chrome
extension via a 6-digit code, centralizes learned document templates and
form-field mappings, and gives a program admin a mobile-first dashboard over
the whole deployment.

Next.js (App Router) on Vercel, Supabase (Postgres + Auth) as the only
datastore. See `../e-Sevai` for the Phase 1 Android app this syncs from.

## Setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the Supabase SQL editor (creates all tables,
   RLS, and the version-bump RPC functions).
3. In Supabase Auth, create at least one admin user (Authentication > Users >
   Add user) — this is the program admin's login for `/admin`.
4. Copy `.env.local.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Project
     Settings > API
   - `SUPABASE_SERVICE_ROLE_KEY` — same page (server-only, never exposed to
     the client)
   - `GROQ_API_KEY` — used server-side only, by `POST /api/match`
5. `npm install && npm run dev`, then visit `http://localhost:3000/admin`.

## Registering a center + staff device

Center and staff records (with their API keys) are created from the admin
panel: **Centers → Add center**, then **Center detail → Add staff**. The
staff API key is shown exactly once on creation (and again on "Reset
access") — enter it into the Phase 1 Android app's Settings screen for that
staff member's device. It authenticates every `/api/*` call as a
`Authorization: Bearer <key>` header; this is separate from the Supabase Auth
login used by the admin panel.

## API surface

All routes require the staff bearer key above.

| Route | Method | Purpose |
|---|---|---|
| `/api/sessions` | POST | Android pushes a synced session, gets back a 6-digit handoff code |
| `/api/sessions/:code` | GET | One-time read of a session by its code (Chrome extension) |
| `/api/match` | POST | Server-side Groq call: form fields → citizen data key mapping |
| `/api/templates/:docType` | GET / POST | Fetch/push a learned document template (versioned) |
| `/api/form-mappings/:urlHash` | GET / POST | Fetch/push a learned form-field mapping (versioned) |
| `/api/document-types` | GET | Active document types + their expected fields (admin-managed under More → Document Types) |

## Deploying

Push to a git remote, import into Vercel, set the four env vars above in the
Vercel project, deploy. No other infra — Supabase is the only backing
service.

## Known gaps (see plan doc for detail)

- `ai_usage_log` "parse" rows are logged approximately at session-sync time
  (Phase 1 doesn't report exact Groq token/cost usage for its on-device parse
  calls today).
- Wiring the Android app to actually call `/api/sessions`, poll
  `/api/templates/:docType`, etc. is Phase 1 follow-up work, not done here.
