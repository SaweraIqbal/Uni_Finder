# UniFinder — Technical Requirements Document (TRD)

**Document status:** Draft v1.0 — assumptions flagged inline as `> ASSUMPTION:`

---

## 1. Confirmed Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend | **React 19 + Vite** | Fast dev server, modern React features |
| Styling | **Tailwind CSS** | Utility-first; design tokens below |
| Backend | **Express.js 5** | REST API |
| Database access | **`mysql2`, raw parameterized queries** | No ORM — explicit SQL, per confirmed decision |
| Database | **MySQL** | Relational schema, see Backend Schema Doc |
| File uploads | **Multer → local disk storage** | Supersedes earlier MinIO/Object Storage plan from FYP-1 |
| Auth | **JWT** | Role-based claims (student / campus_admin / university_admin / hostel_owner / super_admin) |
| Charts | **Recharts 2.x** | React-native, lightweight — used for the Super Admin analytics dashboard (bar/line/pie) |

> **Colors/typography are out of scope for this document** — the design system (colors, fonts, spacing, component variants) is defined once, authoritatively, in the UI/UX Design Brief. If any color/font value appears elsewhere in this document set that conflicts with the UI/UX Brief, the Brief wins.

> ASSUMPTION: The FYP-1 Part-1 PDF references AWS/Object Storage and a "polyglot persistence" strategy. That plan has since been replaced by local disk storage via Multer — this TRD treats the local-disk decision as current and authoritative. If reviving cloud storage later, only the upload service layer needs to change (see §4).

## 2. Repository Structure

> ASSUMPTION: Following your established convention (frontend in `src/pages/` / `src/components/`, backend in a `backend/` subdirectory), proposing this concrete layout:

```
/frontend
  /src
    /pages          # route-level pages (LandingPage, HomePage, CampusDetail, ...)
    /components      # shared UI (CampusCard, CompareBar, StatBlock, ...)
    /services         # axios API client, one file per resource
    /context          # auth context, compare-selection context
    /utils
/backend
  /routes            # thin route definitions
  /controllers        # request handling
  /services           # business logic (verification workflow lives here)
  /middleware          # auth, role guard, error handler, multer config
  /db                  # mysql2 pool + query helpers
  /uploads             # local disk storage target (gitignored)
/database
  schema.sql
  seed.sql
/docs                  # this document set
```

## 3. API Design Principles

- REST, resource-based routes: `/api/universities`, `/api/campuses`, `/api/campuses/:id/compare`, `/api/programs`, `/api/hostels`, `/api/applications` (future).
- All list endpoints support pagination (`?page=&limit=`) and filtering via query params (city, program, campus category, fee range, admission status) — mirrors the filter sidebar already designed on the Home page.
- Verification/approval endpoints are **state-transition endpoints**, not generic PATCH: e.g. `POST /api/programs/:id/approve` (tier-1), `POST /api/programs/:id/final-approve` (Super Admin) — keeps the two-tier logic explicit and auditable.
- Every mutating endpoint requires JWT + role middleware; role checks happen server-side even though the UI already hides unauthorized actions.
- **Note on URL nesting vs. API routes:** the frontend uses nested URLs for hierarchy display (e.g. `/universities/:id/campuses/:cid` — see App Flow Doc). The underlying API endpoints stay flat and resource-based regardless (`GET /api/campuses/:cid`) — URL nesting is a frontend routing/breadcrumb concern only, not an API design constraint.
- CORS: `app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }))` — restrict to the known frontend origin rather than `origin: '*'`.

### Standard API Response Format

All endpoints return this shape so frontend service files can handle responses uniformly.

**Success:**
```json
{
  "success": true,
  "data": { },
  "message": "optional human-readable message",
  "pagination": { "page": 1, "limit": 10, "total": 50, "totalPages": 5 }
}
```
(`pagination` only present on list endpoints.)

**Error:**
```json
{
  "success": false,
  "error": "short error label",
  "details": [{ "field": "email", "message": "Invalid format" }]
}
```
(`details` only present on validation errors.)

**HTTP status codes used:** `200` OK, `201` Created, `400` Bad Request, `401` Unauthorized, `403` Forbidden, `404` Not Found, `409` Conflict (e.g. duplicate email), `500` Server Error.

## 4. File Upload Strategy

- Multer disk storage, target `/backend/uploads/{entity-type}/{entity-id}/filename`.
- Store only the relative path in MySQL (`varchar`), not the binary.
- Serve uploads via a static Express route (e.g., `/uploads/...`) guarded by basic checks (no directory traversal).

> ASSUMPTION: File size cap of 5MB per image, common formats only (jpg/png/webp) — reasonable default for campus photos and hostel images, adjust if the team wants larger media.

## 5. Authentication & Authorization

- JWT issued on login, containing `{ userId, role, entityId }` where `entityId` links a Campus Admin to their specific campus, a University Admin to their university, a Hostel Owner to their hostel(s).
- Middleware chain: `verifyToken` → `requireRole(['campus_admin'])` → `requireOwnership(campusId)` (i.e., a Campus Admin can only edit *their* campus, not any campus).
- Password hashing: bcrypt, cost factor 10–12.
- Refresh strategy: for FYP scope, a single JWT with a reasonable expiry (e.g., 7 days) is sufficient — refresh tokens are a nice-to-have, not required.

## 6. State Machine: Verification Workflow (core technical differentiator)

This is the piece worth designing carefully since it's reused across Programs, Campus registration, and Hostels.

**Generic states:**
```
DRAFT → PENDING_TIER1 → PENDING_TIER2 (SUPER_ADMIN) → APPROVED
                     ↘ REJECTED             ↘ REJECTED
```

**Applied per entity:**

| Entity | Submitted by | Tier-1 reviewer | Tier-2 (final) reviewer |
|---|---|---|---|
| New Program | Campus Admin | University Admin | Super Admin |
| New Campus registration | Campus Admin | University Admin | Super Admin |
| Private Hostel | Hostel Owner | — (skips tier-1) | Super Admin |
| Campus Hostel | Hostel Owner | Campus Admin | Super Admin |

> ASSUMPTION: Recommend a single `verifications` table (see Backend Schema Doc) with `entity_type` + `entity_id` + `status` + `tier1_reviewer_id` + `tier2_reviewer_id`, rather than duplicating status columns across `programs`, `campuses`, and `hostels`. This keeps the approval logic in one service module (`verificationService.js`) instead of three near-identical copies — directly reduces implementation time for a 2-person team.

## 7. Frontend State & Data Flow

- **Static-first pattern (confirmed):** every page starts with a mock data object at the top, clearly marked `// TODO: Replace with GET /api/...`, so UI work isn't blocked on backend completion.
- **Compare selection state:** lives in a lightweight React Context (`CompareContext`) — holds selected campus IDs (max 3), exposed to both the "Select Campuses" toggle and the sticky bottom bar, persists only for the session (no need for localStorage given artifact/browser constraints in some environments; in the real deployed app, localStorage is fine).
- **Auth state:** React Context wrapping the app, JWT stored in memory + httpOnly-style handling if possible; for FYP scope, storing JWT in localStorage is an acceptable simplification.

## 8. Deployment (FYP scope)

> ASSUMPTION: Given this is an academic project, not a production SaaS, propose the simplest viable path:
- Local dev: Vite dev server (frontend) + `nodemon` (backend) + local MySQL instance.
- Demo/deployment: either (a) a single VM/shared host running both, or (b) Vercel-style static hosting for frontend + a small VPS for backend + MySQL — pick whichever the team has free access to. Full Docker/AWS setup from the FYP-1 plan is **not required** to hit MVP; can be mentioned in the report as "future production hardening" without being built.

## 9. Testing Approach

- Backend: a small set of integration tests per module (Postman collection is acceptable for FYP evaluation instead of full Jest coverage) — prioritize testing the verification state machine, since it's the highest-risk logic.
- Frontend: manual QA against the design system checklist (spacing, color tokens, responsive breakpoints) is sufficient; automated E2E is a stretch goal, not required.

## 10. Environment Variables (baseline)

```
DB_HOST=
DB_USER=
DB_PASSWORD=
DB_NAME=
JWT_SECRET=
JWT_EXPIRY=7d
UPLOAD_DIR=./uploads
PORT=5000
CLIENT_URL=http://localhost:5173

# University-admin verification and status email delivery
BACKEND_URL=http://localhost:5000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=noreply@unifinder.pk
# Optional local/testing redirect only. Ignored (with a warning) in production.
EMAIL_OVERRIDE=
```
