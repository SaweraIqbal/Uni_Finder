# UniFinder — UI/UX Design Brief

**Document status:** Draft v1.0, based on 4 implemented screenshots (Campus Detail — Scholarships tab, University Detail Page, Landing Page, Home Page/campus search grid) plus locked design decisions. Assumptions flagged as `> ASSUMPTION:`.

---

## 1. Design System (confirmed)

### Color tokens
| Token | Usage |
|---|---|
| `bg-white`, `bg-orange-50`, `bg-gray-50` | Alternating section backgrounds |
| `slate-800` / `slate-900` | Dark hero sections, CTA bands, footer |
| `orange-500` | **Sole accent color** — buttons, badges, active tab underline, icons, links. Never used as a large background surface. |
| `text-slate-800` | Headings |
| `text-slate-500` | Body/secondary text |

### Shape & elevation
- Cards: `rounded-2xl` / `rounded-3xl`
- Shadows: `shadow-sm` at rest, `hover:shadow-md`
- Hover interaction: subtle `-translate-y` lift on cards (visible on university/hostel/campus cards)
- Buttons: pill-ish rounded, orange-500 fill for primary, white/outline for secondary ("Explore University," "View Details")

### Typography
- Font: Google Fonts **Inter** (fallback: `system-ui`)
- Hero H1: `text-4xl md:text-5xl lg:text-6xl font-extrabold`
- Section H2: `text-3xl md:text-4xl font-bold`
- Card Title H3: `text-lg md:text-xl font-semibold`
- Body: `text-base text-slate-500`
- Small/Caption: `text-sm text-slate-400`
- Button label: `text-sm md:text-base font-semibold`

### Iconography
- Simple line icons in stat blocks (graduation cap, people, chart, building) — consistent icon-in-rounded-square treatment (light gray/orange-tinted square background)

### Button Variants
| Variant | Classes |
|---|---|
| Primary | `bg-orange-500 hover:bg-orange-600 text-white rounded-full px-6 py-3 font-semibold transition-colors` |
| Secondary | `border-2 border-orange-500 text-orange-500 hover:bg-orange-50 rounded-full px-6 py-3 font-semibold` |
| Ghost | `text-slate-500 hover:text-orange-500 hover:bg-orange-50 rounded-lg px-4 py-2` |
| Danger | `bg-red-500 hover:bg-red-600 text-white rounded-full px-6 py-3 font-semibold` |

### Input Fields
- Base: `border border-slate-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent`
- Label: `text-sm font-medium text-slate-700 mb-1`
- Error text: `text-red-500 text-xs mt-1`

### Status Badges
| Status | Classes |
|---|---|
| Open | `bg-green-100 text-green-700` |
| Closed | `bg-red-100 text-red-700` |
| Unknown | `bg-slate-100 text-slate-600` |
| Pending (any approval stage) | `bg-yellow-100 text-yellow-700` |
| Approved / Live | `bg-green-100 text-green-700` |
| Rejected | `bg-red-100 text-red-700` |
| Private (ownership) | `bg-blue-100 text-blue-700` |
| Public / Semi-Govt (ownership) | `bg-purple-100 text-purple-700` |

### Responsive Breakpoints
| Name | Min width | Layout changes |
|---|---|---|
| Mobile | `0px` | Single column; sidebar collapses to a hamburger/drawer; filter sidebar becomes an accordion or bottom-sheet; comparison matrix stacks as vertical cards instead of a side-by-side table |
| Tablet | `640px` (`sm`) | 2-column card grids; dashboard sidebar becomes collapsible (icon-only, expandable) |
| Desktop | `1024px` (`lg`) | Full layout as specified elsewhere in this brief — 3-column card grids, persistent sidebars |
| Wide | `1280px` (`xl`) | Max-width container (`max-w-[1280px] mx-auto`), content stays centered rather than stretching edge-to-edge |

---

## 2. Page-by-Page Breakdown

### 2.1 Landing Page **[BUILT — Image 3]**
**Purpose:** marketing/discovery entry point, university-level.

- Sticky navbar: logo, nav links (Universities, Hostels, Features, How It Works, **How To Compare**), Log In / Sign Up.
- Hero: full-bleed background photo (library/campus), dark overlay, headline + subcopy, search bar with 3 dropdowns (Program/City/University) + orange "Explore Now" CTA.
- **"All Institutions" carousel** — university-level cards with: cover photo, ownership badge (Private/Public), Admissions Open badge, name, program tags, fee range, "Explore University" button. Horizontal scroll with prev/next arrows.
- **"Universities Hostels" carousel** — same card pattern applied to hostels: type badge (Boys/Girls Hostel), name, price range, amenity chips, "View Details." A row of trust badges beneath: Physically Audited · Zero Commission · Real Photos · Mess Menus Available.
- **"Why Choose UniFinder"** — 4-up feature grid (Smart University Search, Side-by-Side Comparison, 1-Click Submissions, Hostel Discovery), each on `bg-orange-50` cards with icon-in-square, heading, description, "Explore Feature Details" link.
- **"4-Step Process"** — dark (`slate-900`) full-width band: step tabs (Create Single Profile / Search & Compare / 1-Click Apply / Hostel Discovery) with an active-step detail panel showing a progress bar and checklist, plus a phase-status side card mimicking an in-app dashboard preview.
- **"Compare Campuses Side-by-Side"** section with an embedded video placeholder demoing the comparison tool.
- **"Without UniFinder vs. With UniFinder"** — two-column comparison card (red X list vs. green check list) making the value prop concrete.
- **Stats band** (150+ Partner Universities / 25K+ Active Students / 1M+ Monthly Searches / 500+ Verified Hostels) — noted as **UI placeholders, not real counts**.
- Footer: 4-column link structure (Support / Discover / Company) + brand blurb, standard dark footer.

> Locked decision reflected correctly in current build: **no "Compare" CTA on Landing Page** — comparison is reached via Home Page or "How To Compare" nav item only.

### 2.2 Home Page — Campus Search Grid **[BUILT — Image 4]**
**Purpose:** the actual search/discovery workhorse — campus-level, not university-level.

- Simpler navbar (no full nav links shown in this state — Log In / Sign Up only in the screenshot, consistent with a "results" page focus).
- Compact hero (shorter than Landing Page's) with the same 3-dropdown search bar, reinforcing continuity.
- **Left filter sidebar** (sticky/scrollable): Degree & Program dropdown, "Reset All," University Type checkboxes, Campus Category (Main/Sub — confirmed renamed), Admission Status (radio-style pills: Open/Closed/Unknown), Campus Gender Type checkboxes, Minimum Marks % slider, Tuition Fee Range (min/max inputs), Entry Test Requirement checkboxes (No Test/ECAT/MDCAT/NAT/GAT/NTS/University Own Test), Hostel Availability checkbox, Scholarship Available checkbox.
- **Results header row:** "Showing 19 campuses" count, **"Select Campuses"** toggle button, Sort dropdown, grid/list view toggle icons.
- **Campus card grid** (3-column desktop): status badges top-left stacked (Open/Closed + Govt./Pvt.), heart/save icon top-right, cover photo, campus name (bold), parent university name (orange link-style subtext), location line with pin icon, Co-Ed/Women Only/Men Only tag, fee-per-semester line with $ icon, "Hostel Available" line with icon, "View Details" outline button.
- Cards for closed-admission or unavailable campuses appear visually muted/grayed but still present (per "Closed" badge state visible in screenshot).

> This is the page where the **"Select Campuses" comparison entry point** lives — not yet screenshotted in an active-selection state, so the sticky bottom bar and 3-cap behavior should be built per the App Flow Document description.

### 2.3 University Detail Page **[BUILT — Image 2]**
- Full-bleed hero photo (graduation-themed), HEC Rank + Private/Public badges, large university name.
- 4-stat row: **Total Campuses, Total Programs, Active Students, Established** — university-level aggregates, distinct metric set from Campus Detail page (by design).
- "About the University" two-column section: prose + pull-quote "Our Mission" card with orange left-border accent.
- **"Explore Our Campuses" carousel** — reuses the campus-card pattern from the Home Page (badge: Main Campus/City Campus, name, location, student count, admission status pill, fee range, "View Campus Details") with prev/next carousel arrows.

### 2.4 Campus Detail Page — Scholarships tab shown **[BUILT — Image 1]**
- Hero photo with back arrow (top-left) and "Main Campus" badge (top-right).
- HEC rank + Private/Public badges, campus name (can wrap to two lines for long names), location line.
- 4-stat row: **Offered Programs, Active Students, PhD Faculty, Employment Rate** — campus-specific set, correctly differentiated from the University page's stats.
- **Tab bar:** Overview / Programs / Admissions & Fees / **Scholarships** (active, orange underline) / Facilities / Transport / Hostels / Reviews.
- Scholarships tab content: intro line, **filter chip row** (Government / Need-Based / Merit-Based / Sports Quota, all checked by default), then a **2-column card grid** — each card: category pill (color-coded per type: blue=Government, purple=Merit-Based, green=Need-Based, orange=Sports Quota), bold title, 2-line description, orange "Learn More →" link bottom-right.
- Standard footer.

> ASSUMPTION: Other tabs (Overview, Programs, Admissions & Fees, Facilities, Transport, Hostels, Reviews) are not yet screenshotted — recommend reusing this page's card-grid and stat-row patterns for consistency rather than inventing new layouts per tab. Reviews tab should render an empty/placeholder state per the postponed-scope decision.

---

### 2.5 Student Dashboard **[TO BUILD]**
- **Layout:** left sidebar (collapses to icon rail on tablet, drawer on mobile) + main content area.
- **Sidebar nav:** Logo, My Profile, My Applications, Compare, Saved Hostels, Settings, Logout.
- **Main area:**
  - Welcome header with student's name.
  - 3 `StatBlock` cards in a row: Applications Submitted, Accepted, Pending.
  - Profile-completion progress bar (only rendered if profile is incomplete) with a "Complete your profile" CTA.
  - "Recent Applications" table: columns Campus, Program, Status (badge), Date, "View" link. Empty state: illustration + "You haven't applied anywhere yet — start comparing campuses."

### 2.6 Campus Admin Dashboard **[TO BUILD]**
- **Sidebar nav:** Logo, Campus Profile, Programs, Scholarships, Hostel Approval Requests, Settings, Logout.
- **Main area:**
  - Header: campus name + admission-status badge (reuses the Open/Closed badge pattern from the Home Page cards).
  - 4 `StatBlock` cards: Programs Offered, Active Students, Pending Hostel Requests, Pending Program Requests.
  - Tabbed content area below (reuses the `TabBar` component from Campus Detail) for: Profile edit form, Programs list (with "Request New Program" button → opens the program-request form feeding into the verification workflow), Scholarships CRUD, Hostel Approval queue (Approve/Reject buttons per pending Campus Hostel request).

### 2.7 University Admin Dashboard **[TO BUILD]**
- **Sidebar nav:** Logo, University Profile, Campuses, Programs, Program Requests, Applications (read-only overview), Settings, Logout.
- **Main area:**
  - Header: university name.
  - 3 `StatBlock` cards: Total Campuses, Total Programs, Pending Approvals (combined count of campus registrations + program requests awaiting tier-1 review).
  - Tabbed content: Campus Approval queue (new campus registration requests, Approve/Reject), Program Requests queue (tier-1 review — Approve forwards to Super Admin, Reject ends it), Programs list (university-wide master view), University Profile edit form.

### 2.8 Hostel Owner Dashboard **[TO BUILD]**
- **Sidebar nav:** Logo, My Hostel(s), Rooms & Pricing, Amenities, Images, Settings, Logout.
- **Main area:**
  - **Status tracker widget** at the top: a horizontal pipeline visual (`Pending Campus Approval → Pending Super Admin Approval → Live` for Campus Hostels, or the shorter 2-step version for Private hostels — see App Flow Doc §4.3). Current stage highlighted in `orange-500`, completed stages in green, future stages in grey.
  - Hostel listing card(s) below (an owner may eventually run multiple hostels) — each with an "Edit" action opening the relevant tab (Rooms, Amenities, Images).
  - Simple forms for each management area, following the Input Field spec above.

### 2.9 Super Admin Dashboard **[TO BUILD]**
- **Sidebar nav:** Logo, Analytics, Universities, Programs, Hostels, Users, Reviews (placeholder/disabled — reviews not in MVP), Logout.
- **Main area:**
  - 4–6 `StatBlock` cards across the top: Universities, Campuses, Programs, Hostels, Students (real counts, not the marketing placeholders used on the Landing Page).
  - Approval queue tables (one per entity type, likely as tabs or separate routes): University Approvals, Final Program Approvals, Final Hostel Approvals — each row has Approve/Reject actions and shows tier-1 reviewer notes where applicable (e.g. a program request already carries the University Admin's `tier1_notes`).
  - Analytics section: Recharts bar/line/pie visualizations (e.g. campuses per city, hostel type split, application volume over time) — styled consistent with the orange-accent system, not default Recharts colors.
  - Master Program List management: direct add/edit table for Super Admin's exclusive authority to seed/correct the global program list outside the request flow.

---

## 3. Component Inventory (for the AI coding agent to build as reusable pieces)

| Component | Used on | Key props |
|---|---|---|
| `UniversityCard` | Landing Page, University carousel | badge type, name, fee range, program tags |
| `CampusCard` | Home Page, University Detail carousel | status badges, name, parent university, location, fee, hostel flag, selectable state (for compare mode) |
| `HostelCard` | Landing Page, Hostels page | type badge, price range, amenity chips |
| `StatBlock` | University Detail, Campus Detail | icon, label, value (supports `%`/`+` suffix styling) |
| `FilterSidebar` | Home Page | grouped filter sections, reset-all |
| `TabBar` | Campus Detail | active-tab orange underline pattern |
| `ScholarshipCard` | Campus Detail → Scholarships tab | category pill (color-mapped), title, description, learn-more link |
| `CompareStickyBar` | Home Page (compare mode) | selected campus chips, cap indicator (x/3), "Compare Campuses" CTA |
| `FeatureCard` | Landing Page | icon, heading, description, link |

---

## 4. Design Principles to Preserve

1. **Orange as accent, never a surface** — if a coding agent starts filling large backgrounds with orange, that's a regression from the confirmed system.
2. **Stat sets differ by page level on purpose** — never let a coding agent "simplify" by reusing the exact same 4 stats on both University and Campus pages; the distinction (aggregate vs. campus-specific, especially Employment Rate) is a deliberate anti-misleading-metric decision.
3. **Landing vs. Home are different products, visually and functionally** — Landing sells the university-level story; Home is the campus-level search tool. Don't let their card types or CTAs blur together.
4. Hostel content stays visually polished but is explicitly **placeholder data** until backend work begins — don't let styling imply more real-time accuracy than currently exists.
