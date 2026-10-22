# UniFinder — App Flow Document

**Document status:** Draft v1.0 — assumptions flagged inline as `> ASSUMPTION:`

This document maps every screen and the transitions between them, so an AI coding agent can build routes and navigation without guessing. Screens already implemented (per your uploaded screenshots) are marked **[BUILT]**; others are **[TO BUILD]**.

---

## 1. Route Map (proposed)

```
/                              Landing Page [BUILT]
/universities                  Home Page — campus search/filter grid [BUILT]
/universities/:id               University Detail Page [BUILT]
/universities/:id/campuses/:cid Campus Detail Page [BUILT] (tabbed)
/compare?ids=1,2,3               Compare Campuses matrix [TO BUILD — UI slot exists]
/hostels                        Hostel listing / search [TO BUILD, static data]
/hostels/:id                     Hostel Detail Page [TO BUILD]
/how-to-compare                  Explainer page (linked from navbar) [TO BUILD]
/login, /signup                   Auth (role-aware) [TO BUILD]
/profile                          Student profile management [TO BUILD]
/dashboard/campus-admin           Campus Admin dashboard [TO BUILD]
/dashboard/university-admin        University Admin dashboard [TO BUILD]
/dashboard/hostel-owner             Hostel Owner dashboard [TO BUILD]
/dashboard/super-admin               Super Admin dashboard [TO BUILD]
```

> ASSUMPTION: URL structure nests campus under university (`/universities/:id/campuses/:cid`) to reflect the real-world hierarchy and make breadcrumbs natural. Adjust if flat `/campuses/:cid` is preferred for simpler routing.

---

## 2. Public / Student-Facing Flow

### 2.1 Landing Page → Home Page
- Entry point: `/` — shows hero search bar (Program / City / University selectors + "Explore Now"), university marketing cards ("All Institutions"), hostel teaser cards, feature/USP sections, "4-step process" explainer, stats band.
- **Compare CTA is intentionally removed from Landing Page** (locked decision) — comparison is only accessible from the Home Page or the dedicated "How to Compare" explainer.
- Navbar item **"How To Compare"** links to `/how-to-compare` (explainer content, currently embedded mid-page — should become its own route so it's linkable/shareable).
- Clicking "Explore Now" (with or without filled selectors) routes to `/universities` (Home Page), carrying selected filters as query params.

### 2.2 Home Page (campus search results)
- Shows **Campus cards** (not university cards) — reflects the core Landing-vs-Home distinction.
- Filter sidebar: University Type (Govt/Semi-Govt/Pvt), Campus Category (Main/Sub — renamed from "Main/City"), Admission Status, Campus Gender Type, Minimum Marks slider, Tuition Fee Range, Entry Test Requirement, Hostel Availability, Scholarship Available.
- Page-level **"Select Campuses"** toggle (left of grid/list view toggle) enters comparison-selection mode.
- **Visual behavior once selection mode is active:**
  - Every campus card gets a checkbox overlay in its top-left corner (unchecked = white circle with border; checked = filled `orange-500` circle with a white checkmark).
  - A selected card gets a `border-2 border-orange-500` highlight.
  - An unselected, still-selectable card gets a subtle hover affordance (slight shadow lift) suggesting it's clickable.
  - Once **3 campuses are selected**, all remaining unselected cards drop to `opacity-50` and `pointer-events-none` until the user deselects one.
- Selecting a campus card in this mode adds it to a **sticky bottom bar**, which slides up from the bottom of the viewport once **2+ campuses** are selected (not on the first selection — the bar's purpose is comparison, which needs at least 2).
  - Bar layout: `~64px` tall, `bg-white`, top border, `shadow-lg`. Left side: a chip per selected campus (name + small "×" to remove). Center: helper text "Select up to 3 campuses." Right side: `orange-500` "Compare Campuses (n)" button, disabled/greyed while fewer than 2 are selected.
- **3-campus cap**: once 3 are selected, remaining cards become visually non-selectable until one is deselected (see opacity rule above).
- Sticky bottom bar's "Compare Campuses" CTA → routes to `/compare?ids=...`.
- Each card's "View Details" routes to the Campus Detail Page.

### 2.3 University Detail Page
- Shows university-level aggregate stats: Total Campuses, Total Programs, Active Students, Established Year.
- "Explore Our Campuses" carousel — each campus card links to its Campus Detail Page.
- **Note:** this page is reached either from a university card on the Landing Page, or by drilling up from a Campus Detail Page (breadcrumb/back arrow).

### 2.4 Campus Detail Page
- Header: campus name, HEC rank badge, Private/Public tag, location, hero image, "Main Campus"/"Sub Campus" badge.
- Stat blocks: **PhD Faculty, Active Students (campus-specific), Employment Rate, Offered Programs (campus-specific)** — deliberately different metric set from the University page, per the locked "scope placement" principle (aggregated metrics mislead at this level).
- Tabs: Overview, Programs, Admissions & Fees, Scholarships, Facilities, Transport, Hostels, Reviews.
  - **Reviews tab exists in the design but is postponed from MVP** — render it with placeholder/empty state, don't wire submission.
  - Scholarships tab: filterable by type (Government, Need-Based, Merit-Based, Sports Quota) — matches uploaded screenshot exactly.
- Back arrow returns to previous list context (Home Page or University Detail Page — should preserve scroll/filter state where feasible).

### 2.5 Compare Campuses (`/compare`)
> ASSUMPTION: not yet screenshotted, so this flow is inferred from the locked feature decisions:
- Reads campus IDs from query string, fetches full detail for each (2–3 campuses).
- Renders a side-by-side matrix as columns per campus, rows in this exact order:

  1. University Name (parent)
  2. Campus Name
  3. Campus Category (Main/Sub)
  4. City
  5. HEC Rank
  6. Ownership Type (Public/Private/Semi-Govt)
  7. Gender Type (Co-Ed/Women Only/Men Only)
  8. Admission Status (Open/Closed)
  9. Programs Offered (count + expandable list)
  10. Tuition Fee per Semester (min–max, if the campus offers multiple programs)
  11. Eligibility: Minimum Marks %
  12. Entry Test Requirement
  13. Scholarships Available (count, filterable by category)
  14. PhD Faculty %
  15. Active Students
  16. Employment Rate %
  17. Hostel Available (Yes/No)
  18. Distance from your location — **stretch goal**, render as "Coming soon" or a static mock value for the MVP demo rather than leaving the row out entirely.

- Each column has a "Remove from comparison" and a link back to that campus's full Detail Page.
- Empty/error state if fewer than 2 valid IDs are passed.

### 2.6 Hostels (`/hostels`, `/hostels/:id`)
> ASSUMPTION: no screenshot provided yet; inferring from Landing Page's hostel teaser cards and PRD scope:
- List view mirrors the Landing Page's hostel card style (type badge — Boys/Girls Hostel, price range, amenity icons, "View Details").
- Filterable by proximity to a selected campus, price range, gender type.
- Detail page: rooms, amenities, mess menu, pricing, an audit badge (Physically Audited / Zero Commission), and a "Request Booking" button that is **view-only / disabled with a "Coming Soon" state** for MVP, since booking transactions are out of scope.

---

## 3. Authenticated Student Flow

- `/login`, `/signup` — role selector defaults to Student for public signup; other roles (Campus Admin, University Admin, Hostel Owner) register through a separate flow (see §4) since they require approval before activation.
- `/profile` — student completes personal/academic profile, uploads documents (for future One-Profile Multi-Apply — build the form even if the "Apply" action itself is stubbed for MVP).
- Logged-in state changes navbar ("Log In"/"Sign Up" buttons → avatar/profile menu) but does **not** gate browsing — universities, campuses, and comparison remain accessible without login, matching current screenshots where Log In/Sign Up appear on browsing pages.

### 3.1 Password Reset Flow
- Login page has a "Forgot Password?" link → `/forgot-password`: student enters email → backend creates a row in `password_reset_tokens` and sends (or, for MVP, logs to console) a reset link.
- Link routes to `/reset-password?token=...` → new password form → on submit, backend validates token (not expired, not used), updates `users.password_hash`, marks token `used=true`.

### 3.2 Email Verification Flow
- On signup, backend creates an `email_verification_tokens` row and sends (or logs) a verification link.
- Link routes to `/verify-email?token=...` → backend validates and sets `users.email_verified = true`. Unverified accounts can still browse but should see a persistent banner prompting verification before applying or submitting anything role-gated.
- `/profile` (or the relevant dashboard) shows a "Resend verification email" action if `email_verified = false`.

### 3.3 Application (stub route — build the shell, not the backend wiring)
- `/apply/:campusProgramId` — reachable from a (disabled or "Coming Soon" for MVP) "Apply" button on the Campus Detail → Programs tab.
- Route and page shell should exist (pre-filled with the student's profile data, matching the One-Profile Multi-Apply concept) even if the final submit action is stubbed/disabled for the FYP 2 demo. This keeps the `applications` table (see Backend Schema Doc §4) meaningfully connected to a visible UI slot rather than orphaned.

---

## 4. Admin / Owner Flows (dashboard side)

### 4.1 Campus Admin Dashboard
- Manage own Campus Profile (programs, fees, eligibility, scholarships, geo-coordinates/address, hostel availability toggle).
- **Program Request flow:** fill "propose new program" form → submits with status `PENDING_TIER1` → visible in University Admin's review queue → on approval, forwarded automatically to Super Admin queue (`PENDING_TIER2`) → on final approval, program appears in the global master list and becomes assignable to the campus.
- **Hostel affiliation review (tier-1):** sees incoming "Campus Hostel" registration requests naming their campus → approve/reject before it proceeds to Super Admin.

### 4.2 University Admin Dashboard
- University Profile management.
- **Campus Approvals:** review/approve new branch-campus registration requests.
- **Program Management:** view/manage the set of programs approved for use across all of this university's branch campuses.
- **Tier-2 Program Approvals queue:** review campus-submitted program requests forwarded from Campus Admins; approve → auto-forwards to Super Admin.

### 4.3 Hostel Owner Dashboard

**Registration — two distinct paths from one form:**
1. Owner fills core hostel info (name, address, gender type, price range) and selects **Hostel Type**: *Private* or *Campus Hostel*.
2. If **Campus Hostel** is selected, an additional required field appears: **Affiliated Campus** (searchable dropdown of existing campuses) — this populates `hostels.affiliated_campus_id` and determines which Campus Admin's queue the tier-1 review lands in.
3. If **Private** is selected, no campus field is shown — submission creates a `verifications` row starting directly at `pending_tier2` (see Backend Schema Doc §7 rule table), skipping straight to the Super Admin queue.
4. On submit, owner sees a confirmation screen reflecting which path they're on: *"Your hostel will be reviewed by [Campus Name]'s admin, then finalized by the platform team"* (Campus type) vs. *"Your hostel will be reviewed by the platform team"* (Private type).

- Listing management: rooms, amenities, pricing.
- **Status Tracking widget:** shows live state as a visual pipeline — `Pending Campus Approval → Pending Super Admin Approval → Live` for Campus Hostels, or `Pending Super Admin Approval → Live` for Private hostels (fewer steps shown, not a greyed-out skipped step, so the owner isn't confused about a stage that will never apply to them).

### 4.4 Super Admin Dashboard
- University Management: approve/reject new university registrations.
- **Final Program Creation:** tier-2 queue — approving here instantly updates the global master program list.
- **Final Hostel Approvals:** single-tier authority for Private Hostels; final-tier authority for Campus Hostels that already cleared Campus Admin review.
- System Analytics: chart-based view of active universities/campuses/hostels/students (can use the same stats-band component style as the Landing Page, in chart form).
- Master Control: exclusive rights to directly add/edit the master program list outside the request flow (for seeding/corrections).

---

## 5. Cross-Cutting Navigation Rules

- **Landing Page vs. Home Page separation is architectural, not cosmetic** — never merge their card types (university vs. campus) or their CTAs. This is a repeatedly locked decision and should be treated as a hard constraint by any coding agent.
- Every dashboard is role-gated at both the route level (redirect if wrong/no role) and the API level (see TRD §5).
- Breadcrumb pattern recommended for the University → Campus drill-down (`University of Central Punjab / Lahore (Gulberg)`) to reinforce the hierarchy visually, matching the back-arrow already present in the Campus Detail screenshot.
