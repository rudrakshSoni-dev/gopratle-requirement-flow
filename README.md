# GoPratle — Requirement Posting Flow

A 4-step flow for posting an event requirement (Event Planner, Performer or Crew), built with **Next.js** on the frontend and **Node.js + Express + MongoDB** on the backend.

- **Live app:** https://gopratle-requirement-flow-ecru.vercel.app
- **API:** https://gopratle-requirements-api-6s9f.onrender.com/api/health (free Render tier — the first request after a while can take ~30–60s while it wakes up)

| Step | What it collects |
|---|---|
| 1. Event basics | Event name, type, single date or date range, location, optional venue, and the category |
| 2. Category step A | Planner → services, guest count, budget · Performer → act type, genres, headcount, duration · Crew → roles and how many of each |
| 3. Category step B | Planner → theme, experience, notes · Performer → languages, equipment, fee, notes · Crew → call time, hours, per-person budget, equipment, notes |
| 4. Review & post | Read-only summary with "Edit" links to each step, contact details, submit |

Submitted requirements are stored in MongoDB tagged with their category, and can be browsed at `/requirements` (filterable by category) and `/requirements/:id`.

---

## Repo layout

```
backend/    Express + TypeScript + Mongoose + Zod     → deployed on Render
frontend/   Next.js 16 (App Router) + Tailwind + RHF   → deployed on Vercel
docker-compose.yml   local MongoDB
render.yaml          Render blueprint for the API
```

Two independently deployable apps in one repo; no shared package, to keep both builds simple.

## Key decisions

**One collection, Mongoose discriminators.** Every requirement lives in `requirements`, with `category` as the discriminator key. The common event fields are defined once on the base schema; each category (`planner`, `performer`, `crew`) is a discriminator model with its own `details` sub-schema. This gives:
- one place to list/filter/paginate all requirements (`find({ category })`, indexed on `{ category, createdAt }`),
- per-category schema enforcement at the database layer,
- a clear answer to "categorized under the selected type" — the type is a first-class, indexed field on every document.

**Zod validation on the server is the source of truth.** `POST /api/requirements` validates the body with a Zod `discriminatedUnion` on `category`, so a planner payload is checked against planner rules only. Fields that belong to another category are stripped, not stored. Cross-field rules (date range order, no past dates, min ≤ max budget, no duplicate crew roles) live here too. Errors come back as `400 { error, details: [{ path, message }] }`.

**Per-step validation on the client.** The frontend mirrors those rules in `frontend/lib/schema.ts`, split into one schema per step. "Continue" validates only the current step. I validate steps explicitly instead of using a single resolver because Zod skips object-level refinements while any field is invalid — that would hide "end date must be after start date" until everything else on the step was fixed. If the server still rejects something, its error paths are mapped back to the right step and field.

**Config-driven category steps.** `stepsByCategory` (components) and `detailSteps` (schemas) are small registries keyed by category. Adding a new category means adding one schema pair, one component pair and one discriminator — the wizard itself doesn't change.

**Single react-hook-form instance across all steps.** Values persist when moving back and forth, the review step reads from the same state, and the draft is saved to `localStorage` so a refresh doesn't lose progress (cleared after a successful post).

**Dates travel as `YYYY-MM-DD`.** The calendar day the user picks is never shifted by time zones. The server allows "yesterday in UTC" as the earliest date so a user in IST isn't rejected around midnight.

## API

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/requirements` | Create a requirement. `201 { data }` or `400 { error, details }` |
| `GET` | `/api/requirements?category=&page=&limit=` | Paginated list, newest first, plus counts per category |
| `GET` | `/api/requirements/:id` | Single requirement. `400` for a malformed id, `404` if missing |
| `GET` | `/api/health` | Liveness + DB connection status |

<details>
<summary>Example request / response</summary>

```http
POST /api/requirements
Content-Type: application/json

{
  "eventName": "TechConf Pune 2026",
  "eventType": "corporate",
  "dateType": "range",
  "startDate": "2026-12-12",
  "endDate": "2026-12-13",
  "location": "Pune",
  "category": "crew",
  "details": {
    "roles": [{ "role": "photographer", "count": 2 }, { "role": "sound_technician", "count": 1 }],
    "callTime": "08:30",
    "hoursPerDay": 10,
    "budgetPerPerson": 6000,
    "equipmentProvided": false
  },
  "contact": { "name": "Rudraksh", "email": "r@example.com", "phone": "+91 98765 43210" }
}
```

```json
201 Created
{
  "data": {
    "id": "6ae9b1589c38923ca2f89df4",
    "category": "crew",
    "eventName": "TechConf Pune 2026",
    "dateType": "range",
    "startDate": "2026-12-12T00:00:00.000Z",
    "endDate": "2026-12-13T00:00:00.000Z",
    "details": { "roles": [ ... ], "callTime": "08:30", ... },
    "status": "open",
    "createdAt": "2026-11-03T10:03:04.978Z",
    ...
  }
}
```

```json
400 Bad Request
{
  "error": "Validation failed",
  "details": [{ "path": "endDate", "message": "End date must be on or after start date" }]
}
```
</details>

## Running locally

Requirements: Node 20+, Docker (or any MongoDB).

```bash
docker compose up -d                      # MongoDB on :27017

cd backend
cp .env.example .env
npm install
npm run dev                               # http://localhost:4000

cd ../frontend
cp .env.example .env.local
npm install
npm run dev                               # http://localhost:3000
```

## Testing

```bash
cd backend && npm test     # 21 API tests (Vitest + Supertest + in-memory MongoDB)
cd frontend && npm test    # 11 step-validation tests (Vitest)
```

Backend tests cover: a successful post for each category (and that the stored document carries the right `category`), missing fields, unknown category, reversed or missing range end date, past dates, min > max budget, empty/duplicate crew roles, other categories' fields being stripped, malformed JSON, list filtering, pagination, counts per category, invalid/missing ids, and the 404 handler.

The full UI flow was also tested by hand for all three categories: per-step errors, live re-validation after a failed "Continue", switching category (with a confirmation before discarding details), draft restore after refresh, and the review → edit → submit loop.

### Edge cases handled
- Switching category after filling details asks before clearing them; switching back is free if nothing was filled.
- A single-day event never stores an `endDate`, even if one was left in the form.
- Whitespace-only text is treated as empty; optional empty fields are omitted, not stored as `""`.
- Number inputs left blank are reported as "Required" instead of `NaN` errors.
- Crew role dropdowns disable roles already chosen in another row.
- Double submits are blocked while a request is in flight.
- Render's free tier sleeps when idle — requests that take over 3s show a "waking up the server" hint instead of looking frozen.

## Deployment

1. **MongoDB Atlas** — create a free M0 cluster and database user; allow network access from `0.0.0.0/0` (Render has no static outbound IP on the free tier). Copy the connection string, with a database name, e.g. `.../gopratle`.
2. **Render** — New → Blueprint → this repo (uses `render.yaml`). Set `MONGODB_URI` and `FRONTEND_URL` (the Vercel URL; comma-separate several origins).
3. **Vercel** — import the repo with **Root Directory = `frontend`** and set `NEXT_PUBLIC_API_URL` to the Render URL.

## Assumptions
- No authentication; the poster leaves contact details on the review step.
- Location is free text (city/area); venue is optional free text.
- Budgets are whole rupees (INR).
- The enum lists (event types, services, performer types, crew roles) are sensible starting sets, kept in `options.ts` on each side.

## Limitations & possible improvements
- **Auth & ownership** — "my requirements", editing and closing a requirement (`status` already exists on the model).
- **Shared validation package** — the client schemas mirror the server's by hand; a shared workspace package would remove the duplication.
- **Location autocomplete** (Google Places) and structured city data for search.
- **Attachments** — reference images / mood boards.
- **E2E tests** with Playwright, and component tests for the wizard.
- **Rate limiting / spam protection** on `POST` (e.g. `express-rate-limit`, captcha).
- **Notifications** to matching professionals when a requirement is posted.
