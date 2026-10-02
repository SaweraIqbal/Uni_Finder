# UniFinder — Product Requirements Document (PRD)

**Project:** UniFinder (Final Year Project, Riphah International University, Lahore)
**Team:** Sawera Iqbal (50257), Ali Haider (48067)
**Supervisor:** Dr. Sheheryar Malik
**Project ID:** 03
**Document status:** Draft v1.0 — assumptions flagged inline as `> ASSUMPTION:`

---

## 1. Problem Statement

Pakistani students researching universities today face three compounding problems:

1. **Fragmentation** — information is scattered across university websites, Facebook groups, and word-of-mouth. There is no single place to compare campuses on the same criteria.
2. **Opacity at the campus level, not just the university level** — a university's marketing page rarely reflects what a specific *campus* charges, offers, or achieves in employment outcomes. A student choosing between "UCP Gulberg" and "UCP Johar Town" gets no help distinguishing them.
3. **Untrustworthy hostel listings** — accommodation near campus is usually found through unverified Facebook posts, with no guarantee the photos, mess menu, or price are current.

UniFinder's core bet is that **the campus, not the university, is the real unit of decision-making** — fees, faculty quality, employment outcomes, and hostel proximity all vary by campus, and today's platforms hide that.

## 2. Product Vision

A single platform where a student can discover Pakistani universities, drill into specific campuses, compare 2–3 campuses side-by-side on real metrics, browse verified nearby hostels, and (in a later phase) apply with one reusable profile.

## 3. Target Users & Roles

| Role | Who they are | Primary goal |
|---|---|---|
| **Student** | Prospective undergrad/grad applicant | Find the right campus, compare options, understand cost/hostel logistics |
| **Campus Admin** | Admin staff at a specific campus (e.g., UCP Gulberg) | Keep that campus's profile, programs, fees, scholarships accurate |
| **University Admin** | Admin at the university (parent) level | Approve/manage programs across all branch campuses; oversee campus registration |
| **Hostel Owner** | Independent or campus-affiliated hostel operator | List and manage hostel/room inventory, respond to booking interest |
| **Super Admin** | Platform operator (you) | Final approval authority for universities, programs, and hostels; global oversight |

> ASSUMPTION: "Campus Admin" and "University Admin" are distinct accounts (per your Dashboard Architecture doc), even though FYP-1 Part-1 PDF only modeled a single "University Admin" actor. This PRD follows the more detailed 5-role model as current source of truth.

## 4. Unique Selling Points (what makes this an FYP-worthy, differentiated product)

These are the features an evaluator or an AI coding agent should treat as **non-negotiable, headline differentiators** — not generic CRUD. Split explicitly into **build now** vs. **design-but-don't-wire**, so an agent doesn't treat a stretch goal as an MVP requirement.

**USPs to build for MVP (FYP 2 scope):**

1. **Campus-level granularity everywhere.** Stats (PhD faculty %, employment rate, active students, offered programs) are shown per-campus, not aggregated at the university level where they'd be misleading. This is a documented design principle from earlier project decisions.
2. **Compare Campuses (2–3 side-by-side).** A dedicated comparison matrix across fees, programs, eligibility, scholarships — with select-to-compare UX (sticky bottom bar, 3-campus cap) already designed on the Home page. Exact row list in App Flow Doc §2.5.
3. **Two-tier verification workflow for programs, campuses, hostels, and universities.** A Campus proposes a new program or a Campus Hostel requests affiliation → Campus/University Admin does a first-pass review → Super Admin gives final approval. This mirrors how real accreditation works and is the platform's credibility mechanism — nothing goes live unverified. This is the single most technically differentiating piece of the build; see Implementation Plan §1.
4. **Physically-audited, zero-commission hostel listings.** Per the landing page messaging ("Physically Audited," "Zero Commission," "Real Photos," "Mess Menus Available"), hostels are differentiated from Facebook-marketplace-style listings by an audit badge system (`hostels.is_physically_audited`, toggled by Super Admin after a real or simulated audit).

**USPs designed now, built post-MVP (do not build these end-to-end for the FYP 2 demo):**

5. **One-Profile, Multi-Apply.** Student uploads documents once; reusable across every campus application — removing the single biggest friction point in Pakistani admissions. Build the profile form and the `applications` table (schema reserved), and give the Campus Detail page's "Apply" button a route/shell (per App Flow §3.3), but the end-to-end submission need not be fully wired for MVP.
6. **Location & distance tool inside comparison.** Student enters/GPS-detects their location and sees live distance-to-campus for every campus in the comparison table. Render the row in the comparison matrix (App Flow §2.5, row 18) but it's acceptable to show "Coming soon" or a static mock distance for the MVP demo rather than real GPS/geolocation logic.
7. **Commute & Budget Calculator.** Referenced in the original FYP-1 report's "Proposed Solution" section (semester/degree cost estimation combining tuition + hostel + transport). **Explicitly out of MVP scope** for this document set — treat it the same as items 5–6: worth naming in the report as part of the platform's vision, but not a build target for FYP 2. If time allows after the Definition-of-Done checklist (Implementation Plan §5) is met, it's the best candidate for extra credit.

> Reviews/ratings are explicitly **out of MVP scope** per existing decisions — the schema reserves a `reviews` table but no submission/moderation UI or endpoints should be built (see Backend Schema Doc §8).

## 5. Core User Journeys (high-level; full flows in App Flow Document)

1. **Discover → Compare → Shortlist (Student, no login required for browsing)**
   Landing Page (university-level marketing cards) → Home Page (campus-level search results) → filter/select campuses → Compare Campuses matrix → (optional) view Campus Detail page.
2. **Campus Detail deep-dive (Student)**
   Campus Detail page tabs: Overview, Programs, Admissions & Fees, Scholarships, Facilities, Transport, Hostels, Reviews (reviews UI present but static/postponed).
3. **Campus registers & requests program approval (Campus Admin)**
   Campus Admin submits a new program not on the master list → routed to University Admin (tier-1) → if approved, auto-forwarded to Super Admin (tier-2) for final master-list creation.
4. **Hostel onboarding (Hostel Owner)**
   Hostel Owner registers, selects type: *Private* (single-tier: Super Admin only) or *Campus Hostel* (two-tier: Campus Admin → Super Admin). Owner tracks status: Pending Campus Approval → Pending Super Admin Approval → Live.
5. **Platform oversight (Super Admin)**
   Reviews pending university/program/hostel approvals, views system-wide analytics (active universities, campuses, hostels, students).

## 6. Functional Scope (MVP for FYP 2)

### In scope
- Public browsing: Landing Page (university cards), Home Page (campus cards + filters), Campus Detail Page, University Detail Page.
- Campus comparison (2–3 campuses, campus-scoped).
- Student auth (register/login), basic profile.
- Campus Admin: manage own campus profile, programs, fees, scholarships (CRUD).
- University Admin: manage university profile, approve/reject campus-submitted programs (tier-1), approve new campus registrations.
- Hostel Owner: register hostel (Private or Campus type), manage listing (static content: rooms, amenities, pricing).
- Super Admin: approve universities, final program approval, final hostel approval, basic analytics dashboard.
- Hostel listings: browsable, filterable, **static/placeholder data** — booking is view-only (no transaction).

### Explicitly out of scope for MVP
- Live hostel room booking/payment.
- Reviews & ratings submission and moderation (UI exists, data is placeholder).
- One-Profile Multi-Apply to actually submit applications (design it, don't wire it end-to-end unless time allows).
- GPS-based live distance calculator (design the UI slot; static/mock distance acceptable for MVP demo).
- Commute & Budget Calculator (semester/degree cost estimator combining tuition + hostel + transport) — named in the original FYP-1 vision but not a build target for this MVP; see §4 for phasing.
- Email/SMS notification delivery (can be stubbed/logged instead of sent — see TRD §10 for SMTP env vars reserved for when this is wired up).

> ASSUMPTION: These cuts are made to fit a realistic single-semester FYP 2 build with a 2-person team, based on the "static-first development" and "postponed from MVP" patterns already established in your working notes.

## 7. Non-Functional Requirements

- **Performance:** Page interactions should feel instant on typical Pakistani mobile broadband; paginate/limit campus lists rather than loading all 150+ at once.
- **Security:** Passwords hashed (bcrypt), JWT-based auth, role-based access control enforced server-side (not just hidden UI), parameterized queries only (no raw string SQL) to prevent injection.
- **Usability:** Mobile-first responsive design (majority of target users browse on phones). *(Full color/typography/component system is defined once, authoritatively, in the UI/UX Design Brief — this document intentionally doesn't restate specific values to avoid drift between documents.)*
- **Data integrity:** Nothing becomes publicly visible without passing its approval tier — this is a business rule, not a UI nicety.
- **Maintainability:** Static mock-data-first development, with `// TODO: Replace with GET /api/...` markers, so frontend and backend can be built in parallel by a 2-person team.

## 8. Success Metrics (for FYP evaluation, not real production KPIs)

- All 5 dashboards functionally demoable end-to-end with the tiered approval workflow working live (this is the hardest, most differentiating piece — prioritize it).
- Campus comparison feature works with real seeded data for at least 10–15 campuses.
- Clean separation between Landing Page (university marketing) and Home Page (campus search) is preserved in the final build, per locked architectural decision.

## 9. Open Questions / Risks (for awareness, not blocking)

- Two-tier approval adds real backend complexity (state machine per entity type). Recommend building this as a single reusable `verification_status` pattern (see Backend Schema Doc) rather than bespoke logic per module.
- Reconciling PDF's "Object Storage" plan with the confirmed local-disk/Multer decision — Technical Requirements Document below treats local disk as authoritative.
