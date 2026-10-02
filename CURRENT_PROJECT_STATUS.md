# CURRENT PROJECT STATUS — Uni Finder

> **Audit Date:** 2026-08-21  
> **Audited By:** Automated Codebase Audit  
> **Method:** Direct source code inspection only — NO assumptions from documentation or planned features.

---

# 1. Project Overview

| Field | Details |
|---|---|
| **Project Name** | Uni Finder |
| **Project Type** | Web Application (University Discovery & Comparison Platform) |
| **Current Purpose** | Helps students find, compare, and explore Pakistani universities and their campuses |
| **Frontend** | React 19 (Vite) with Tailwind CSS |
| **Backend** | Express.js 5 (Node.js) — separate package inside `src/backend/` |
| **Database** | MySQL (via `mysql2` driver, intended for XAMPP local MySQL) |
| **Overall Architecture** | Monorepo: React frontend + Express backend in same repository, Dockerized with `docker-compose.yml` |
| **Development Status** | Active development — partial full-stack integration |
| **Stack Type** | Full-stack (frontend + backend + database) with partial integration |
| **Main User Roles** | `student`, `university`, `campus`, `admin` (+ `hostel` in signup URL but no dashboard) |
| **Major Modules** | Landing, Auth, Student Profile, University Dashboard, Campus Dashboard, Admin Dashboard, University Browse/Detail, Campus Detail |

---

### Current Status Summary

| Area | Status | Details |
|---|---|---|
| Frontend | ✅ Implemented | 12 active pages, 47+ components, Tailwind CSS styling |
| Backend | ✅ Implemented | Express.js API, 4 route groups, ~30 endpoints |
| Database | ✅ Implemented | MySQL with 11 tables, auto-schema creation, SQL dumps present |
| Authentication | ✅ Implemented | JWT-based signup/login with role-based access, bcrypt hashing |
| Student Module | 🟡 Partial | Registration + Profile editing works; no student dashboard page |
| University Module | ✅ Implemented | Full CRUD via dashboard, verification flow, public listing + detail |
| Hostel Module | ⚠️ UI Only | Landing page hostel showcase exists but hardcoded; no backend |
| Application Module | 🔴 Not Implemented | No apply/application workflow in code |
| Admin Module | ✅ Implemented | Verification review (approve/reject), account search, notifications |
| Search/Filtering | 🟡 Partial | SearchBar fetches real data; AdvancedFilters UI exists but client-side only |
| Comparison | ⚠️ UI Only | Landing CTA exists; comparison page and route are **commented out** |
| Deployment | 🟡 Partial | Dockerfile + docker-compose + nginx.conf present; not deployed to production |

---

# 2. Technology Stack and Libraries

## Frontend

| Category | Technology | Details |
|---|---|---|
| Framework | React 19.2.5 | Core UI library |
| Build Tool | Vite 8.0.10 | Fast dev server with HMR |
| Language | JavaScript (JSX) | No TypeScript in use (types packages installed but unused) |
| Routing | react-router-dom 7.14.2 | BrowserRouter with Routes/Route |
| State Management | React Context API | `AuthContext.jsx` for auth state |
| Data Fetching | Native `fetch()` | Direct fetch calls in API wrapper files |
| Form Handling | Manual `useState` | No form library (Formik, React Hook Form, etc.) |
| Validation | Manual inline validation | Custom `validate()` functions in Login/Signup |
| UI Libraries | Tailwind CSS 3.4.19 | Utility-first CSS framework |
| Icon Libraries | `lucide-react` 1.31.0, `react-icons` 5.6.0 | Icons throughout the app |
| Animation | CSS keyframes + Tailwind transitions | Custom float, shimmer, pulse-glow animations |
| Map Libraries | `leaflet` 1.9.4, `react-leaflet` 5.0.0 | Used in `HomeLocationPicker.jsx` (comparison module — commented out route) |
| Toast Notifications | `react-toastify` 11.1.0 | Used for success/error notifications throughout |
| Chart Libraries | None | ❌ Not installed |

**Libraries installed but usage not verified in active code:**
- `@types/react`, `@types/react-dom` — TypeScript type definitions (project uses plain JS)
- `leaflet`, `react-leaflet` — imported only in `HomeLocationPicker.jsx` which belongs to the commented-out comparison feature

## Backend

| Category | Technology | Details |
|---|---|---|
| Framework | Express.js 5.2.1 | HTTP server |
| Language | JavaScript (ESM) | ES modules with `"type": "module"` |
| API Architecture | REST | Standard RESTful routes |
| Authentication | JWT (`jsonwebtoken` 9.0.3) + bcryptjs 3.0.3 | Token-based auth with password hashing |
| Middleware | Custom `authMiddleware.js` | `verifyToken` + `authorizeRoles` middleware |
| File Upload | `multer` 2.1.1 | Disk storage for documents, images, avatars |
| ORM/Database | `mysql2` 3.22.3 (raw SQL) | No ORM — direct SQL queries |
| Process Manager | `nodemon` 3.1.14 | Auto-restart on file changes |
| UUID | `uuid` 14.0.0 | UUID v4 for all primary keys |
| Environment | `dotenv` 17.3.1 | Environment variable loading |
| CORS | `cors` 2.8.6 | Cross-origin enabled for all origins |

## Database

| Field | Details |
|---|---|
| Technology | MySQL (via XAMPP) |
| Driver | `mysql2` (raw queries, no ORM) |
| Connection | `localhost:3306` (or `host.docker.internal` in Docker) |
| Database Name | `uni_finder` |
| Schema | Auto-created on server start via `config/schema.js` |
| Tables | 11 tables (see Section 14) |
| Data | Real test data — 23 user accounts, 2 universities, 5 verifications, 4 notifications |
| SQL Dumps | `uni_finder_data.sql` (data only), `uni_finder_dump.sql` (full dump) |

## Development Tools

| Tool | Version / Details |
|---|---|
| Build | Vite 8.0.10 |
| Linter | ESLint 10.2.1 + react-hooks + react-refresh plugins |
| Formatter | None configured (no Prettier) |
| TypeScript | ❌ Not used (type packages installed but no TS files) |
| Testing | ❌ No testing libraries installed or test files found |
| PostCSS | postcss 8.5.13 + autoprefixer 10.5.0 + @tailwindcss/postcss 4.2.4 |
| Containerization | Docker + docker-compose (node:22-alpine + nginx:alpine) |
| Environment Config | `.env` via dotenv (env vars: `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`, `JWT_SECRET`) |

---

# 3. Complete Project Folder/File Structure

```text
uni-finder/
├── index.html                    # App HTML entry point (Inter font, Material Symbols)
├── package.json                  # Frontend dependencies
├── vite.config.js                # Vite dev server config (Docker-aware)
├── tailwind.config.js            # Root Tailwind config (Inter font family)
├── postcss.config.cjs            # PostCSS with Tailwind + Autoprefixer
├── eslint.config.js              # ESLint configuration
├── Dockerfile                    # Production build (multi-stage: node → nginx)
├── docker-compose.yml            # Dev containers (frontend + backend, XAMPP MySQL)
├── nginx.conf                    # SPA fallback for nginx production serving
├── uni_finder_data.sql           # Database data dump
├── uni_finder_dump.sql           # Full database schema + data dump
├── public/
│   ├── Logo1.png                 # Favicon/logo
│   ├── favicon.svg               # SVG favicon
│   ├── icons.svg                 # Icon sprite
│   └── vite.svg                  # Default Vite icon
│
└── src/
    ├── main.jsx                  # React DOM render entry
    ├── App.jsx                   # Root component with routing
    ├── index.css                 # Global CSS (Tailwind directives, animations)
    ├── App.css                   # Empty
    │
    ├── api/                      # Frontend API wrapper functions
    │   ├── client.js             # Base URL (localhost:5000), auth headers helper
    │   ├── university.js         # University CRUD API calls (13 functions)
    │   ├── campus.js             # Campus CRUD API calls (14 functions)
    │   └── verification.js       # Admin verification API calls (6 functions)
    │
    ├── assets/                   # Static media assets
    │   ├── Logo.png, Logo1.png   # Application logos
    │   ├── login.png, signup.png # Auth page illustrations
    │   ├── screen.png            # Decorative screenshot
    │   ├── video1.mp4, video2.mp4 # Hero background videos (~170MB total)
    │   └── [icons: budget, compare, hostel, search, profile, etc.]
    │
    ├── backend/                  # Express.js backend (separate package.json)
    │   ├── server.js             # Express server entry (port 5000)
    │   ├── package.json          # Backend dependencies
    │   ├── config/
    │   │   ├── db.js             # MySQL connection setup
    │   │   ├── schema.js         # Auto-creates 9 tables + column migrations
    │   │   ├── seedAdmin.js      # Seeds SuperAdmin account
    │   │   ├── backfillIds.js    # Backfills assigned_id for university/campus users
    │   │   └── dropAllTables.js  # Utility to drop all tables
    │   ├── controllers/
    │   │   ├── auth_controller/
    │   │   │   ├── authController.js     # signup + login
    │   │   │   └── profilecontroll.js    # Student profile CRUD
    │   │   ├── university_controller/
    │   │   │   ├── universityController.js    # University CRUD + account management
    │   │   │   ├── verificationController.js  # Document submission + admin review
    │   │   │   ├── imagesController.js        # University image gallery CRUD
    │   │   │   └── programsController.js      # University programs CRUD
    │   │   ├── campus_controller/
    │   │   │   ├── campusController.js         # Campus CRUD + search
    │   │   │   ├── campusVerificationController.js # Campus approval workflow
    │   │   │   ├── campusImagesController.js   # Campus image CRUD
    │   │   │   └── campusProgramsController.js # Campus programs CRUD
    │   │   └── admin_controller/
    │   │       └── searchController.js   # Admin account search
    │   ├── middleware/
    │   │   ├── authMiddleware.js  # JWT verify + role-based authorization
    │   │   └── upload.js         # Multer file upload config (10MB limit)
    │   ├── models/
    │   │   └── auth_model/
    │   │       └── studentModel.js  # Legacy model file (not used by controllers)
    │   ├── routes/
    │   │   ├── auth_route/
    │   │   │   └── authRoutes.js    # /api/auth/* routes
    │   │   ├── dashboardRoutes.js   # Dashboard welcome endpoints
    │   │   ├── universityRoutes.js  # University + admin verification routes
    │   │   └── campusRoutes.js      # Campus management routes
    │   ├── utils/
    │   │   ├── assignedId.js     # Generates UNI-XXXXXX / CMP-XXXXXX IDs
    │   │   └── notify.js         # Simulated email notifications (saves to DB)
    │   └── uploads/              # File upload storage directory
    │
    ├── components/               # Reusable UI components
    │   ├── Navbar.jsx            # Main navigation bar
    │   ├── Layout.jsx            # App shell (Navbar + Outlet + Footer)
    │   ├── ProtectedRoute.jsx    # Role-based route guard
    │   ├── SearchBar.jsx         # Search bar with dropdowns
    │   ├── AdvancedFilters.jsx   # Filter sidebar for university listing
    │   ├── heroSection.jsx       # University detail hero banner
    │   ├── footer.jsx            # Site footer
    │   ├── Features.jsx          # Landing page features section
    │   ├── HowItWorks.jsx        # Landing page "How It Works" steps
    │   ├── CompareUniversities.jsx  # Landing CTA for comparison
    │   ├── Universities.jsx      # University card grid (landing)
    │   ├── Hostels.jsx           # Hostel showcase section (landing)
    │   ├── Reviews.jsx           # Reviews section (landing)
    │   ├── ProblemFuture.jsx     # Before/After + budget calculator (landing)
    │   ├── PopularUniversities.jsx  # Popular unis cards (landing)
    │   ├── WhyChooseSection.jsx  # Why choose us cards (landing)
    │   ├── StatsSection.jsx      # Statistics counters (landing)
    │   ├── AvatarUploader.jsx    # Profile picture upload widget
    │   ├── StatusBadge.jsx       # Colored status badge
    │   ├── ShimmerCard.jsx       # Loading skeleton card
    │   ├── Skeleton.jsx          # Loading skeleton element
    │   ├── universityInfo.jsx    # University detail info sections
    │   ├── universityStats.jsx   # University stats display
    │   ├── universityPrograms.jsx # University programs list
    │   ├── universityGallery.jsx  # University image gallery
    │   ├── universityCampuses.jsx # University campuses list
    │   ├── hostelCarousel.jsx    # Hostel image carousel
    │   ├── navbar.css            # Custom navbar CSS
    │   │
    │   ├── admin/
    │   │   ├── AccountSearch.jsx  # Admin account search component
    │   │   ├── ReviewDrawer.jsx   # Verification review drawer
    │   │   └── RejectModal.jsx    # Rejection reason modal
    │   │
    │   ├── campus/
    │   │   ├── CampusPanel.jsx    # Campus admin dashboard panel
    │   │   ├── CampusHeroSection.jsx  # Campus detail hero
    │   │   ├── BentoStats.jsx     # Campus bento-grid stats display
    │   │   ├── campusDetail.jsx   # Campus full detail view (programs, facilities, etc.)
    │   │   ├── CampusDetailsTab.jsx   # Campus profile editing tab
    │   │   ├── CampusImagesTab.jsx    # Campus images management tab
    │   │   ├── CampusProgramsTab.jsx  # Campus programs management tab
    │   │   └── ApplyCard.jsx      # Campus apply CTA card
    │   │
    │   ├── comparison/
    │   │   ├── ComparisonTable.jsx      # University comparison table (NOT routed)
    │   │   ├── HomeLocationPicker.jsx   # Leaflet map location picker (NOT routed)
    │   │   └── StackedCard.jsx          # Stacked university comparison cards (NOT routed)
    │   │
    │   └── university/
    │       ├── UniversityPanel.jsx    # University admin dashboard panel
    │       ├── DetailsTab.jsx         # University details editing form
    │       ├── ProfileTab.jsx         # University profile/account editing
    │       ├── ImagesTab.jsx          # University image management
    │       ├── ProgramsTab.jsx        # University programs management
    │       └── CampusRequestsTab.jsx  # Campus request approval tab
    │
    ├── context/
    │   └── AuthContext.jsx       # Auth provider (login, logout, updateUser)
    │
    ├── data/
    │   └── universities.js       # Hardcoded university data (8 unis) + distance utilities
    │
    └── utils/
        ├── flash.js              # Flash message utility (sessionStorage-based)
        ├── tailwind.config.js    # Additional tailwind config (slide-in, progress animations)
        └── postcss.config.js     # Duplicate PostCSS config
```

---

# 4. Complete Page Inventory

| # | Page | Route | File | Status | Purpose |
|---|---|---|---|---|---|
| 1 | Landing Page | `/` | `pages/landing.jsx` | ✅ Implemented | Main marketing/entry page |
| 2 | Home / Search Results | `/homepage` | `pages/homepage.jsx` | ✅ Implemented | University browse with search + filters |
| 3 | Login | `/login` | `pages/Login.jsx` | ✅ Implemented | User authentication |
| 4 | Signup | `/signup` or `/signup/:role` | `pages/Signup.jsx` | ✅ Implemented | User registration with role selection |
| 5 | Student Profile | `/profile` | `pages/profile.jsx` | ✅ Implemented | 3-step profile wizard |
| 6 | University Detail | `/university?id=X` | `pages/UniversityDetailPage.jsx` | ✅ Implemented | Public university profile page |
| 7 | University Dashboard | `/university/dashboard` | `pages/UniversityDashboard.jsx` | ✅ Implemented | University admin panel (protected) |
| 8 | University Documents | `/university/documents` | `pages/UniversityDocuments.jsx` | ✅ Implemented | Document upload for verification |
| 9 | Campus Detail | `/campus?id=X` | `pages/CampusDetailPage.jsx` | ✅ Implemented | Public campus profile page |
| 10 | Campus Dashboard | `/campus/dashboard` | `pages/CampusDashboard.jsx` | ✅ Implemented | Campus admin panel (protected) |
| 11 | Admin Dashboard | `/admin/dashboard` | `pages/AdminDashboard.jsx` | ✅ Implemented | Super admin verification panel (protected) |
| 12 | Campus Page (static) | Not actively routed | `pages/campusPage.jsx` | 🔵 Placeholder | Static campus template with hardcoded data |
| 13 | Explore Page | Not routed | `pages/ExplorePage.jsx` | 🔴 Commented Out | Entirely commented-out code |
| 14 | Compare Universities | Not routed | `pages/compareUniversities.jsx` | 🔴 Commented Out | Entirely commented-out code |

**Active Pages: 11** | **Commented Out/Dead: 3**

---

# 5. Detailed Page-by-Page UI Breakdown

## Landing Page `/`

### Page Structure

```text
LandingPage
│
├── Fixed Scroll Progress Bar (orange gradient at top)
│
├── Hero Section (video background)
│   ├── Background Video (video2.mp4 — looping autoplay)
│   ├── Dark Overlay
│   └── SearchBar Component
│       ├── Program Dropdown (hardcoded list: Computer Science, Business, Engineering, etc.)
│       ├── City Dropdown (fetched from API — university cities)
│       ├── University Dropdown (fetched from API — university names)
│       └── "Explore Now" Button → navigates to /homepage with state
│
├── Features Section (id="features")
│   ├── Section Header
│   └── 6 Feature Cards (Smart Search, Compare, Hostel Finder, etc.)
│
├── HowItWorks Section
│   ├── 4-Step Interactive Timeline
│   └── Step Cards with CTA buttons (navigate to /signup, /profile, /#hostels)
│
├── CompareUniversities Section
│   ├── Badge + Heading + Description
│   ├── Video placeholder demo
│   └── "Compare Now" button → /compareUniversitiesPage (⚠️ route is commented out)
│
├── Universities Section (id="universities")
│   ├── Search + Category + City filters
│   └── University Card Grid (fetched from API, with hardcoded fallback)
│
├── Hostels Section (id="hostels")
│   ├── Hostel Showcase (hardcoded 3 hostels: Iqra, Scholar's Haven, Pinnacle)
│   ├── Photo Gallery
│   ├── Details Card
│   └── Booking Modal (toast only — no backend)
│
├── Reviews Section
│   └── Testimonial Cards (hardcoded reviews)
│
├── ProblemFuture Section
│   ├── Before/After Toggle View
│   └── Budget Calculator (interactive sliders)
│
├── StatsSection
│   └── 4 Counter Cards (500+ Universities, 10k+ Students, etc.)
│
└── Scroll-to-Top FAB (appears on scroll > 300px)
```

### Navbar (visible on all Layout-wrapped pages)

- **File:** `components/Navbar.jsx`
- **Logo:** Uses `assets/Logo1.png`, navigates to `/`
- **Nav Links:** Anchor links to `#features`, `#universities`, `#hostels` sections on landing page
- **Auth State:** Conditionally renders:
  - **Logged out:** Login button → `/login`, Sign Up dropdown (Student, University, Campus) → `/signup/:role`
  - **Logged in:** User avatar + name dropdown with Profile link and Logout button
- **Responsive:** Hides nav links on mobile (`hidden lg:flex`), mobile hamburger not implemented
- **Sticky:** Fixed to top (`sticky top-0 z-50`)

### Hero Section

- Full-screen video background with `video2.mp4`
- Dark gradient overlay
- SearchBar component overlaid in center
- No heading text — just the search bar

### SearchBar

- **File:** `components/SearchBar.jsx`
- Pill-shaped container with 3 dropdown fields
- **Program:** Hardcoded list (Computer Science, BBA, Engineering, MBBS, etc.)
- **City & University:** Fetched via `listUniversities()` API, dynamically populated
- **"Explore Now"** button navigates to `/homepage` passing `searchValues` as state
- Dropdown filtering with text input search

### Hostels Section

- **Data Source:** 🔵 Completely hardcoded in `Hostels.jsx`
- 3 hostels with mock names, images, amenities, pricing
- Booking modal triggers `toast.success` — **no backend connection**

### Reviews Section

- **Data Source:** 🔵 Hardcoded testimonials in `Reviews.jsx`

### StatsSection

- **Data Source:** 🔵 Hardcoded numbers (500+, 10,000+, 50+, 95%)

---

## Home / University Search Page `/homepage`

### Page Structure

```text
HomePage
│
├── Hero Section (video background with search bar overlay)
│
├── Content Area
│   ├── AdvancedFilters Sidebar (left column, desktop)
│   │   ├── Admission Status (Open/Closed checkboxes)
│   │   ├── Campus Gender Type (Co-Education/Male/Female)
│   │   ├── Minimum Marks (range slider 0-100)
│   │   ├── Tuition Fee Range (min/max inputs)
│   │   ├── Entry Test Requirement (checkboxes)
│   │   ├── Hostel Availability (toggle)
│   │   └── Reset All button
│   │
│   └── UniversityGrid (right column)
│       ├── Grid/List view toggle
│       ├── ShimmerCard loaders (while fetching)
│       └── UniversityCard grid
│           ├── University image/logo
│           ├── Name, City, Tagline
│           └── Click → navigate to /campus?id=X
│
└── Footer
```

- **Data Source:** ✅ Real API data via `listUniversities()`
- **Filters:** ⚠️ UI exists but **filtering is client-side only** — the filter state is maintained but the universities displayed are simply the API response. No backend filter endpoint exists.
- **Navigation:** Each card click navigates to `/campus?id=X` (goes to campus detail page)
- **Search from Landing:** Receives search state from SearchBar via `useLocation().state`

---

## Login Page `/login`

### Page Structure

```text
Login
│
├── Centered Card
│   ├── Left Column: Login Form
│   │   ├── Logo
│   │   ├── "Sign In" Heading
│   │   ├── Email Input (with icon)
│   │   ├── Password Input (with show/hide toggle)
│   │   ├── "Log In" Button
│   │   └── "Don't have an account?" → /signup
│   │
│   └── Right Column: Decorative Image (login.png, hidden on mobile)
│
└── ToastContainer
```

- **API Call:** ✅ `POST /api/auth/login` — real backend authentication
- **Validation:** Client-side email regex + empty field checks
- **Post-login redirect:** Based on role:
  - `admin` → `/admin/dashboard`
  - `student` → `/`
  - `university` → `/university/dashboard`
  - `campus` → `/campus/dashboard`
  - `hostel` → `/` (no hostel dashboard exists)
- **Auth Storage:** `sessionStorage` for user data + token via `AuthContext.login()`

---

## Signup Page `/signup` and `/signup/:role`

### Page Structure

```text
Signup
│
├── Centered Card
│   ├── Left Column: Decorative Image (signup.png, hidden on mobile)
│   │
│   └── Right Column: Registration Form
│       ├── Logo
│       ├── "Create Account" Heading
│       ├── Full Name Input
│       ├── Username Input
│       ├── Email Input
│       ├── Password Input (with toggle)
│       ├── Confirm Password Input (with toggle)
│       ├── "Create Account" Button
│       └── "Already have an account?" → /login
│
└── ToastContainer
```

- **API Call:** ✅ `POST /api/auth/signup` — real backend registration
- **Role Handling:** Extracted from URL params (`/signup/student`, `/signup/university`, `/signup/campus`)
- **Validation:** Full Name required, email regex, password length ≥ 8, password match
- **Post-signup redirect:** Same role-based routing as login
- **Accepted Roles:** `student`, `university`, `hostel`, `campus`

---

## Student Profile Page `/profile`

### Page Structure

```text
Profile (3-Step Wizard)
│
├── Progress Bar (Step 1 / 2 / 3)
│
├── Step 1: Basic Info
│   ├── Avatar Upload (AvatarUploader component)
│   ├── Full Name Input
│   ├── Username Input
│   └── Email Input
│
├── Step 2: Personal Info
│   ├── Date of Birth
│   ├── Age
│   ├── Gender (Male/Female/Other)
│   ├── CNIC
│   └── Address
│
├── Step 3: Document Info
│   ├── Document Type Selector
│   ├── File Upload
│   └── Note Field
│
└── Next/Previous/Update Buttons
```

- **API Calls:** ✅ Real API integration
  - `GET /api/auth/user/:id` — fetch user data
  - `GET /api/auth/student_profile/:id` — fetch existing profile
  - `POST /api/auth/Student_profile` — create profile
  - `PUT /api/auth/Student_profile/update` — update profile
  - `uploadAvatar()` — profile picture upload
- **Document Upload (Step 3):** ⚠️ UI exists but document storage/retrieval not fully connected — the step is visible but the file upload endpoint for student documents is not present in the backend routes

---

## University Detail Page `/university?id=X`

### Page Structure

```text
UniversityDetailPage
│
├── HeroSection (banner image, university name, tagline)
│
├── UniversityInfo (comprehensive details)
│   ├── About Section (about_title, about_text)
│   ├── Mission & Vision
│   ├── Contact Info (email, phone, website)
│   └── Tabbed sections
│
├── UniversityStats (ranking, students, employment rate, campuses, partners)
│
├── UniversityPrograms (fetched from API — program cards)
│
├── UniversityGallery (fetched from API — image grid)
│
├── UniversityCampuses (fetched from API — campus cards)
│
└── HostelCarousel (hardcoded hostel data)
```

- **Data Source:** ✅ Real API data via `getUniversityById(id)` — reads `id` from URL search params
- **Hostel Carousel:** 🔵 Hardcoded static data — not connected to any backend hostel data
- **Programs/Images/Campuses:** ✅ Fetched from API

---

## University Dashboard `/university/dashboard` (Protected: role=university)

### Page Structure

```text
UniversityDashboard
│
├── IF verification NOT approved:
│   ├── Header (logo + logout)
│   ├── StatusCard showing:
│   │   ├── "Loading..." state
│   │   ├── "No submission" → link to /university/documents
│   │   ├── "Pending" status card
│   │   └── "Rejected" status card + resubmit link
│
├── IF verification approved:
│   └── UniversityPanel (tabbed dashboard)
│       ├── Details Tab — Edit university info (name, tagline, description, mission, vision, stats, etc.)
│       ├── Images Tab — Upload/delete gallery images
│       ├── Programs Tab — Add/remove programs (name, level, duration, fee)
│       ├── Profile Tab — Edit account (name, username, email, password)
│       └── Campus Requests Tab — Approve/reject campus registration requests
```

- **Data Source:** ✅ Fully connected to backend
- **Verification Flow:** `getMyVerification(uid)` checks status before showing panel
- **CRUD Operations:** ✅ All tabs make real API calls

---

## University Documents Page `/university/documents`

- **Purpose:** Upload verification documents (HEC certificate, Charter, Accreditation, Logo)
- **API Call:** ✅ `POST /api/university/documents` with `FormData`
- **Fields:** University name, registration number, address, contact number + 4 file uploads

---

## Campus Dashboard `/campus/dashboard` (Protected: role=campus)

### Page Structure

```text
CampusDashboard
│
├── IF campus request NOT approved:
│   ├── RequestForm (select university, campus name, city, address, contact)
│   ├── "Pending" status card
│   └── "Rejected" status card + resubmit button
│
├── IF approved:
│   └── CampusPanel (tabbed dashboard)
│       ├── Details Tab — Edit campus info
│       ├── Images Tab — Upload/delete gallery images
│       ├── Programs Tab — Manage campus programs
│       └── Profile Tab — Account management
```

- **Data Source:** ✅ Real API connections
- **Verification Flow:** Campus requests go to the parent university admin for approval

---

## Admin Dashboard `/admin/dashboard` (Protected: role=admin)

### Page Structure

```text
AdminDashboard
│
├── Sidebar
│   ├── Avatar + Admin Info
│   └── Navigation links
│
├── Stat Cards (Pending / Approved / Rejected counts)
│
├── Filter Tabs (All / Pending / Approved / Rejected)
│
├── Verification Requests Table
│   ├── University Name, Admin Name, Email, Status, Date
│   └── Actions (Review / Approve / Reject)
│
├── ReviewDrawer (slide-out detail panel)
│   ├── All verification document links
│   └── Approve / Reject buttons
│
├── RejectModal (reason input)
│
└── AccountSearch (search by assigned_id/email/name)
```

- **Data Source:** ✅ Fully connected to backend
- **API Calls:** `listVerifications()`, `approveVerification()`, `rejectVerification()`, `searchAccount()`
- **Notifications:** ✅ Sends simulated email notifications on approve/reject (stored in DB)

---

## Campus Detail Page `/campus?id=X`

```text
CampusDetailPage
│
├── CampusHeroSection (hero image, campus name, university name)
├── BentoStats (grid of stats/info cards)
├── CampusDetail (programs, facilities, hostels, transport, reviews — HARDCODED)
└── ApplyCard (CTA → redirects to /login)
```

- **Data Source:** 🟡 Partial — Campus header data fetched via `getCampusDetail(id)`, but the detailed sections (facilities, hostels, transport, reviews) are **hardcoded constants** inside `campusDetail.jsx`
- **Apply Button:** Redirects to `/login` — no actual application workflow

---

# 6. User Journey / Complete Application Flow

```text
Landing Page (/)
     │
     ├── "Explore Now" (SearchBar)
     │         ↓
     │   Home/Search Page (/homepage)
     │         │
     │         ├── Browse University Cards (API data)
     │         ├── Apply Filters (client-side only)
     │         └── Click University Card
     │                   ↓
     │             Campus Detail Page (/campus?id=X)
     │                   │
     │                   └── "Apply Now" → /login
     │
     ├── Click University Card (Landing section)
     │         ↓
     │   University Detail Page (/university?id=X)
     │         ├── View Programs, Gallery, Stats, Campuses
     │         └── No apply workflow
     │
     ├── Login Button (Navbar)
     │         ↓
     │   Login Page (/login)
     │         │
     │         ├── Student Login → / (landing page)
     │         ├── University Admin Login → /university/dashboard
     │         ├── Campus Admin Login → /campus/dashboard
     │         └── Super Admin Login → /admin/dashboard
     │
     ├── Sign Up (Navbar dropdown)
     │         ↓
     │   Signup Page (/signup/:role)
     │         └── After signup → role-based redirect (same as login)
     │
     └── Profile Link (Navbar, logged in)
               ↓
         Profile Page (/profile)
               └── 3-step profile wizard (Basic → Personal → Document)
```

### University Admin Flow

```text
Signup as "university" → /university/dashboard
     │
     ├── First visit: No verification → "Upload Documents" link
     │         ↓
     │   /university/documents → Upload HEC cert, Charter, etc.
     │         ↓
     │   Status: "Pending" → Wait for admin approval
     │         ↓
     │   Admin approves → Status: "Approved"
     │         ↓
     │   UniversityPanel loads → Manage Details, Images, Programs, Campus Requests
     │
     └── If rejected → Resubmit documents
```

### Campus Admin Flow

```text
Signup as "campus" → /campus/dashboard
     │
     ├── First visit: Submit campus request (select parent university)
     │         ↓
     │   University admin reviews and approves/rejects
     │         ↓
     │   If approved → CampusPanel loads → Manage Details, Images, Programs
     │
     └── If rejected → Resubmit with corrections
```

### Super Admin Flow

```text
Login as admin → /admin/dashboard
     │
     ├── View verification request stats
     ├── Filter by status (All/Pending/Approved/Rejected)
     ├── Review request details in drawer
     ├── Approve or Reject with reason
     ├── Search any account by ID/email
     └── Logout
```

---

# 7. Complete Route / Navigation Map

## Route Table

| Route | Page | Component | Access | Navigation From | Navigation To | Status |
|---|---|---|---|---|---|---|
| `/` | Landing | `LandingPage` | Public | Direct | `/homepage`, `/login`, `/signup/:role` | ✅ Active |
| `/login` | Login | `Login` | Public | Navbar, Links | Role-based dashboard | ✅ Active |
| `/signup` | Signup | `Signup` | Public | Navbar | Role-based dashboard | ✅ Active |
| `/signup/:role` | Signup | `Signup` | Public | Navbar dropdown | Role-based dashboard | ✅ Active |
| `/homepage` | Search Results | `HomePage` | Public (Layout) | SearchBar Explore | `/campus?id=X` | ✅ Active |
| `/profile` | Student Profile | `Profile` | Public* (Layout) | Navbar | — | ✅ Active |
| `/university` | University Detail | `UniversityDetailPage` | Public (Layout) | University cards | — | ✅ Active |
| `/campus` | Campus Detail | `CampusDetailPage` | Public (Layout) | University cards | `/login` | ✅ Active |
| `/university/documents` | Upload Docs | `UniversityDocuments` | Public* (Layout) | University Dashboard | `/university/dashboard` | ✅ Active |
| `/university/dashboard` | Uni Dashboard | `UniversityDashboard` | Protected (university) | Login | `/university/documents` | ✅ Active |
| `/campus/dashboard` | Campus Dashboard | `CampusDashboard` | Protected (campus) | Login | — | ✅ Active |
| `/admin/dashboard` | Admin Panel | `AdminDashboard` | Protected (admin, Layout) | Login | — | ✅ Active |
| `/compareUniversitiesPage` | Compare | `CompareUniversitiesPage` | — | Landing CTA | — | 🔴 **Commented out** |

*Note: `/profile` and `/university/documents` don't use ProtectedRoute but check sessionStorage internally.*

## Visual Route Map

```text
/
├── /login
├── /signup
├── /signup/:role
├── /homepage
├── /profile
├── /university          (public detail, ?id=X)
├── /university/dashboard (protected: university)
├── /university/documents
├── /campus              (public detail, ?id=X)
├── /campus/dashboard    (protected: campus)
└── /admin/dashboard     (protected: admin)

DEAD ROUTES:
├── /compareUniversitiesPage (commented out in App.jsx)
└── CompareUniversities CTA button points to this dead route
```

### Route Issues

- `/profile` and `/university/documents` are **not protected** by `ProtectedRoute` — they rely on internal `sessionStorage` checks
- `/compareUniversitiesPage` is referenced in `CompareUniversities.jsx` but the route is **commented out**
- No `/student/dashboard` route exists despite the role being used
- `campusPage.jsx` is imported as `CampusPage` in App.jsx but `CampusDetailPage.jsx` is what gets rendered at `/campus` — potential naming confusion
- No 404/Not Found page implemented

---

# 8. Navigation/Button/Interaction Audit

| Component | Button/Action | Current Behavior | Destination/Result | Status |
|---|---|---|---|---|
| Navbar | Logo Click | Navigate home | `/` | ✅ Working |
| Navbar | Features Link | Anchor scroll | `/#features` | ✅ Working |
| Navbar | Universities Link | Anchor scroll | `/#universities` | ✅ Working |
| Navbar | Hostels Link | Anchor scroll | `/#hostels` | ✅ Working |
| Navbar | Login Button | Navigate | `/login` | ✅ Working |
| Navbar | Sign Up → Student | Navigate | `/signup/student` | ✅ Working |
| Navbar | Sign Up → University | Navigate | `/signup/university` | ✅ Working |
| Navbar | Sign Up → Campus | Navigate | `/signup/campus` | ✅ Working |
| Navbar | Profile (logged in) | Navigate | `/profile` | ✅ Working |
| Navbar | Logout | Clear session, navigate | `/login` | ✅ Working |
| SearchBar | Explore Now | Navigate with state | `/homepage` | ✅ Working |
| Landing | Compare Now | Navigate | `/compareUniversitiesPage` | 🔴 **Dead link** (route commented out) |
| Landing | Hostel Booking | Show modal, toast | Toast only | ⚠️ UI only |
| HowItWorks | Step CTAs | Navigate | `/signup/student`, `/profile`, `/#hostels` | ✅ Working |
| ProblemFuture | Get Started | Navigate | `/signup/student` | ✅ Working |
| HomePage | University Card Click | Navigate | `/campus?id=X` | ✅ Working |
| HomePage | Advanced Filters | Toggle sidebar, filter | Client-side filter | ⚠️ Client-side only |
| HomePage | Reset All | Reset filter state | Clears all filters | ✅ Working |
| UniversityDetail | View university | Display data | API data rendered | ✅ Working |
| CampusDetail | Apply Now | Navigate | `/login` | ⚠️ No application workflow |
| CampusDetail | Go Back | Navigate back | `history.back()` | ✅ Working |
| Login | Log In | API call + redirect | Role-based dashboard | ✅ Working |
| Signup | Create Account | API call + redirect | Role-based dashboard | ✅ Working |
| Profile | Update Profile | API call | Update student profile | ✅ Working |
| Profile | Avatar Upload | API call | Upload profile picture | ✅ Working |
| UniDashboard | Upload Documents | Navigate | `/university/documents` | ✅ Working |
| UniDashboard | Logout | Clear session | `/login` | ✅ Working |
| AdminDashboard | Approve | API call | Update verification status | ✅ Working |
| AdminDashboard | Reject | API call + reason | Update verification status | ✅ Working |
| AdminDashboard | Search | API call | Find account by ID/email | ✅ Working |

---

# 9. Styling System

### Fonts

| Property | Value |
|---|---|
| Primary Font | Inter (Google Fonts) |
| Fallback | system-ui, sans-serif |
| Weights | 400, 500, 600, 700, 800 |
| Loading | `<link>` tag in `index.html` (loaded twice — duplicate) |
| Icon Font | Material Symbols Outlined (Google Fonts) |

### Colors

| Role | Color | Usage |
|---|---|---|
| Primary | Orange (`bg-orange-500`, `#f97316`) | Buttons, links, accents, scrollbar hover |
| Primary Hover | `bg-orange-600` | Button hover states |
| Primary Light | `bg-orange-100`, `#f3c277` | Backgrounds, badges |
| Brand Gold | `#d38a00`, `#c88410` | Navbar logo, form outlines |
| Brand Gold Hover | `#a66d0d` | Hover states |
| Dark Background | `bg-slate-900`, `bg-slate-950` | Dark sections (HowItWorks, stats) |
| Card Background | `bg-white`, `rgba(255,255,255,0.85)` | Cards, modals |
| Text Primary | `text-gray-900`, `text-slate-900` | Headings |
| Text Secondary | `text-gray-600`, `text-slate-600` | Body text |
| Text Muted | `text-gray-400`, `text-gray-500` | Labels, placeholders |
| Border | `border-gray-200`, `border-orange-100` | Card borders |
| Success | Green (Tailwind) | Approve badges, success states |
| Error | Red (Tailwind) | Reject badges, error states |
| Warning | Yellow/Amber (Tailwind) | Pending badges |
| Comparison Gold | `#F2C94C`, `#E6B800` | Comparison section (commented out) |
| Selection | `selection:bg-orange-500 selection:text-white` | Text selection highlight |

### Typography Patterns

| Element | Classes |
|---|---|
| Hero Heading | `text-3xl sm:text-5xl font-extrabold tracking-tight` |
| Section Heading | `text-2xl md:text-4xl font-bold` |
| Card Title | `text-lg font-semibold` |
| Body Text | `text-sm text-gray-600` or `text-base` |
| Button Text | `text-sm font-semibold` |
| Badge/Label | `text-xs font-medium uppercase tracking-wide` |

### Tailwind Configuration

- **Version:** 3.4.19
- **Config:** `tailwind.config.js` (root) — adds `Inter` font family
- **Custom Animations (index.css):** `animate-float`, `animate-pulse-glow`, shimmer sweep, `reveal-fade-up`
- **Custom CSS Classes:** `.glass-card-light` (glassmorphism effect), `.parallax-bg`, `.shimmer`, `.hide-scrollbar`
- **Scrollbar:** Custom WebKit scrollbar styling (orange thumb on hover)
- **Responsive Breakpoints:** Standard Tailwind (`sm:`, `md:`, `lg:`, `xl:`)

### Component Styling Pattern

- **Primary:** Tailwind utility classes (95% of styling)
- **Secondary:** Custom CSS in `index.css` for animations and special effects
- **Component CSS:** `navbar.css` for navbar-specific styles
- **No CSS Modules** or styled-components
- **Inline Styles:** Minimal — only for dynamic values (avatar sizing)

### Recurring Design Patterns

| Pattern | Implementation |
|---|---|
| Cards | `bg-white rounded-xl shadow-md p-6` with hover `shadow-lg` |
| Buttons | `bg-orange-500 text-white px-6 py-3 rounded-full hover:bg-orange-600` |
| Input Fields | `border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-orange-500` |
| Badges | `bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs` |
| Glassmorphism | `.glass-card-light` with backdrop-blur |
| Gradients | `bg-gradient-to-r from-orange-500 to-amber-500` |
| Shadows | `shadow-md`, `shadow-lg`, `shadow-xl` |
| Border Radius | `rounded-xl` (cards), `rounded-full` (buttons, badges, avatars) |

---

# 10. Responsive Design Audit

### Breakpoint Usage

| Breakpoint | Pixel Value | Usage |
|---|---|---|
| `sm:` | 640px | Typography scaling, padding adjustments |
| `md:` | 768px | Grid columns (1→2), flex direction changes |
| `lg:` | 1024px | Grid columns (2→3/4), navbar links visible, sidebar visible |
| `xl:` | 1280px | Max widths, typography scaling |

### Per-Page Responsive Assessment

| Page | Desktop | Tablet | Mobile |
|---|---|---|---|
| Landing Page | ✅ Full layout | 🟡 Stacks well, some overflow possible | 🟡 Stacks vertically, nav links hidden |
| Homepage | ✅ Sidebar + Grid | 🟡 Sidebar hides, grid cols reduce | 🟡 Single column, filters collapsed |
| Login / Signup | ✅ Two-column card | ✅ Image hides | ✅ Full-width form |
| Profile | ✅ Centered card | ✅ Adapts | ✅ Adapts |
| University Detail | ✅ Full sections | 🟡 Stacks | 🟡 Stacks |
| Admin Dashboard | ✅ Sidebar + Table | 🟡 Needs testing | ⚠️ Sidebar may overlap |
| University Dashboard | ✅ Tabbed panel | 🟡 Tabs stack | 🟡 May need attention |

### Known Issues

- **Navbar:** Mobile hamburger menu not implemented — links are simply hidden (`hidden lg:flex`)
- **Admin Dashboard:** Sidebar layout may not work well on small screens
- **Data Tables:** No horizontal scroll wrapper for small screens

---

# 11. Reusable Components

| Component | File | Used By | Purpose | Reusable? | Status |
|---|---|---|---|---|---|
| Navbar | `components/Navbar.jsx` | All Layout pages | Navigation bar | ✅ | ✅ Implemented |
| Footer | `components/footer.jsx` | All Layout pages | Site footer | ✅ | ✅ Implemented |
| Layout | `components/Layout.jsx` | App.jsx wrapper | Page shell | ✅ | ✅ Implemented |
| ProtectedRoute | `components/ProtectedRoute.jsx` | App.jsx | Route guard | ✅ | ✅ Implemented |
| SearchBar | `components/SearchBar.jsx` | Landing, Homepage | University search | ✅ | ✅ Implemented |
| AdvancedFilters | `components/AdvancedFilters.jsx` | Homepage | Filter sidebar | ✅ | ⚠️ UI only (client-side) |
| AvatarUploader | `components/AvatarUploader.jsx` | Profile, Admin | Avatar upload | ✅ | ✅ Implemented |
| StatusBadge | `components/StatusBadge.jsx` | AdminDashboard | Status chip | ✅ | ✅ Implemented |
| ShimmerCard | `components/ShimmerCard.jsx` | Homepage | Loading skeleton | ✅ | ✅ Implemented |
| Skeleton | `components/Skeleton.jsx` | AdminDashboard | Loading rows | ✅ | ✅ Implemented |
| HeroSection | `components/heroSection.jsx` | UniversityDetail | Banner hero | 🟡 | ✅ Implemented |
| UniversityInfo | `components/universityInfo.jsx` | UniversityDetail | Info display | 🟡 | ✅ Implemented |
| UniversityStats | `components/universityStats.jsx` | UniversityDetail | Stats grid | 🟡 | ✅ Implemented |
| UniversityPrograms | `components/universityPrograms.jsx` | UniversityDetail | Programs list | 🟡 | ✅ Implemented |
| UniversityGallery | `components/universityGallery.jsx` | UniversityDetail | Image gallery | 🟡 | ✅ Implemented |
| UniversityCampuses | `components/universityCampuses.jsx` | UniversityDetail | Campus cards | 🟡 | ✅ Implemented |
| HostelCarousel | `components/hostelCarousel.jsx` | UniversityDetail | Hostel display | 🟡 | 🔵 Hardcoded data |
| Features | `components/Features.jsx` | Landing | Feature cards | ❌ Specific | 🔵 Static |
| HowItWorks | `components/HowItWorks.jsx` | Landing | Step guide | ❌ Specific | 🔵 Static |
| CompareUniversities | `components/CompareUniversities.jsx` | Landing | Compare CTA | ❌ Specific | ⚠️ Dead link |
| Universities | `components/Universities.jsx` | Landing | Uni grid | 🟡 | ✅ API + fallback |
| Hostels | `components/Hostels.jsx` | Landing | Hostel showcase | ❌ Specific | 🔵 Hardcoded |
| Reviews | `components/Reviews.jsx` | Landing | Testimonials | ❌ Specific | 🔵 Hardcoded |
| ProblemFuture | `components/ProblemFuture.jsx` | Landing | Before/After | ❌ Specific | 🔵 Static |
| StatsSection | `components/StatsSection.jsx` | Landing | Counters | ❌ Specific | 🔵 Static |
| AccountSearch | `components/admin/AccountSearch.jsx` | AdminDashboard | Search users | 🟡 | ✅ Implemented |
| ReviewDrawer | `components/admin/ReviewDrawer.jsx` | AdminDashboard | Review panel | 🟡 | ✅ Implemented |
| RejectModal | `components/admin/RejectModal.jsx` | AdminDashboard | Rejection form | ✅ | ✅ Implemented |
| UniversityPanel | `components/university/UniversityPanel.jsx` | UniDashboard | Dashboard tabs | ❌ Specific | ✅ Implemented |
| CampusPanel | `components/campus/CampusPanel.jsx` | CampusDashboard | Dashboard tabs | ❌ Specific | ✅ Implemented |
| ComparisonTable | `components/comparison/ComparisonTable.jsx` | None (orphaned) | Compare table | ✅ | 🔴 Not routed |
| HomeLocationPicker | `components/comparison/HomeLocationPicker.jsx` | None (orphaned) | Map picker | ✅ | 🔴 Not routed |
| StackedCard | `components/comparison/StackedCard.jsx` | None (orphaned) | Compare card | ✅ | 🔴 Not routed |

---

# 12. State Management

### State Management Approach

- **Primary:** React `useState` (component-local state)
- **Global Auth:** React Context API (`AuthContext`)
- **Persistence:** `sessionStorage` (user data, token, flash messages)
- **No Redux/Zustand/MobX** used
- **No React Query/TanStack Query** used
- **No URL query params for filter state** (except `id` via `useSearchParams`)

### AuthContext State Flow

```text
AuthContext (AuthProvider)
│
├── user: { id, email, role, name, username, assigned_id, avatar }
├── loading: boolean
├── login(userData) → fetch full user data → setUser → sessionStorage
├── logout() → setUser(null) → sessionStorage.removeItem
└── updateUser(patch) → merge into user → sessionStorage
│
├── Used by: Navbar (avatar, name, login state)
├── Used by: Login page (login function)
├── Used by: Profile (user data)
└── Used by: AdminDashboard (avatar, user data)
```

### Data Flow Patterns

```text
SearchBar (user types search)
     ↓
searchValues state (useState in parent)
     ↓
Navigate to /homepage with state
     ↓
HomePage receives via useLocation().state
     ↓
Filters state (useState)
     ↓
UniversityGrid (receives filters as props)
     ↓
Fetches listUniversities() API
     ↓
Renders UniversityCard components
```

```text
AdminDashboard
     ↓
listVerifications() API → requests state
     ↓
Filter by tab (filter state)
     ↓
Render table rows
     ↓
Click row → selected state → ReviewDrawer
     ↓
Approve/Reject → API call → refresh requests
```

---

# 13. API / Backend Integration

## Frontend API Calls

| API Function | Method | Endpoint | Called From | Purpose | Status |
|---|---|---|---|---|---|
| (direct fetch) | POST | `/api/auth/login` | Login.jsx | User login | ✅ Real |
| (direct fetch) | POST | `/api/auth/signup` | Signup.jsx | User registration | ✅ Real |
| (direct fetch) | GET | `/api/auth/user/:id` | Profile.jsx, AuthContext | Get user info | ✅ Real |
| (direct fetch) | GET | `/api/auth/student_profile/:id` | Profile.jsx | Get student profile | ✅ Real |
| (direct fetch) | POST | `/api/auth/Student_profile` | Profile.jsx | Create student profile | ✅ Real |
| (direct fetch) | PUT | `/api/auth/Student_profile/update` | Profile.jsx | Update student profile | ✅ Real |
| `listUniversities()` | GET | `/api/universities` | SearchBar, HomePage, Universities, UniversityDetail | List all universities | ✅ Real |
| `getUniversityById(id)` | GET | `/api/universities/:id` | UniversityDetailPage | Get university detail | ✅ Real |
| `getMyUniversity(uid)` | GET | `/api/university/:uid/profile` | UniversityPanel | Get own university | ✅ Real |
| `saveUniversity(formData)` | POST | `/api/university/profile` | DetailsTab | Save/update university | ✅ Real |
| `listImages(uniId)` | GET | `/api/university/:id/images` | ImagesTab, Gallery | List images | ✅ Real |
| `addImage(formData)` | POST | `/api/university/images` | ImagesTab | Upload image | ✅ Real |
| `deleteImage(imageId)` | DELETE | `/api/university/images/:id` | ImagesTab | Delete image | ✅ Real |
| `listPrograms(uniId)` | GET | `/api/university/:id/programs` | ProgramsTab, Programs | List programs | ✅ Real |
| `addProgram(payload)` | POST | `/api/university/programs` | ProgramsTab | Add program | ✅ Real |
| `deleteProgram(id)` | DELETE | `/api/university/programs/:id` | ProgramsTab | Delete program | ✅ Real |
| `getAccount(uid)` | GET | `/api/university/account/:uid` | ProfileTab, Admin | Get account details | ✅ Real |
| `updateAccount(payload)` | PUT | `/api/university/account` | ProfileTab | Update account | ✅ Real |
| `uploadAvatar(uid, file)` | POST | `/api/account/:uid/avatar` | AvatarUploader | Upload profile pic | ✅ Real |
| `getMyVerification(uid)` | GET | `/api/university/verification/:uid` | UniDashboard | Check verification status | ✅ Real |
| `submitDocuments(formData)` | POST | `/api/university/documents` | UniversityDocuments | Submit verification docs | ✅ Real |
| `listVerifications()` | GET | `/api/admin/verifications` | AdminDashboard | List all verifications | ✅ Real |
| `approveVerification(id)` | PUT | `/api/admin/verifications/:id/approve` | AdminDashboard | Approve request | ✅ Real |
| `rejectVerification(id)` | PUT | `/api/admin/verifications/:id/reject` | AdminDashboard | Reject request | ✅ Real |
| `searchAccount(q)` | GET | `/api/admin/search?q=` | AccountSearch | Search accounts | ✅ Real |
| `submitCampusRequest()` | POST | `/api/campus/request` | CampusDashboard | Submit campus request | ✅ Real |
| `getMyCampusRequest(uid)` | GET | `/api/campus/request/:uid` | CampusDashboard | Check campus request | ✅ Real |
| `getMyCampus(uid)` | GET | `/api/campus/:uid/profile` | CampusPanel | Get own campus | ✅ Real |
| `saveCampus(payload)` | POST | `/api/campus/profile` | CampusDetailsTab | Save campus | ✅ Real |
| `listCampusRequestsForOwner()` | GET | `/api/campus/requests/owner/:uid` | CampusRequestsTab | List campus requests | ✅ Real |
| `approveCampus(id)` | PUT | `/api/campus/requests/:id/approve` | CampusRequestsTab | Approve campus | ✅ Real |
| `rejectCampus(id)` | PUT | `/api/campus/requests/:id/reject` | CampusRequestsTab | Reject campus | ✅ Real |
| `searchCampuses()` | GET | `/api/campuses?city=&university=&program=` | (available) | Search campuses | ✅ Backend exists |
| `getCampusDetail(id)` | GET | `/api/campuses/:id` | CampusDetailPage | Get campus detail | ✅ Real |
| `listCampusImages()` | GET | `/api/campus/:id/images` | CampusImagesTab | List campus images | ✅ Real |
| `addCampusImage()` | POST | `/api/campus/images` | CampusImagesTab | Upload campus image | ✅ Real |
| `deleteCampusImage()` | DELETE | `/api/campus/images/:id` | CampusImagesTab | Delete campus image | ✅ Real |
| `listCampusPrograms()` | GET | `/api/campus/:id/programs` | CampusProgramsTab | List campus programs | ✅ Real |
| `addCampusProgram()` | POST | `/api/campus/programs` | CampusProgramsTab | Add campus program | ✅ Real |
| `deleteCampusProgram()` | DELETE | `/api/campus/programs/:id` | CampusProgramsTab | Delete campus program | ✅ Real |

**Total: ~35 API endpoints, all with real backend implementations.**

### Hardcoded/Mock Data (Not from API)

| Data | Location | Content |
|---|---|---|
| Hostel list | `components/Hostels.jsx` | 3 hardcoded hostels with mock names/prices |
| Hostel carousel | `components/hostelCarousel.jsx` | Hardcoded hostel images and details |
| Reviews | `components/Reviews.jsx` | Hardcoded testimonial data |
| Stats counters | `components/StatsSection.jsx` | Hardcoded numbers (500+, 10k+, etc.) |
| Feature cards | `components/Features.jsx` | Hardcoded feature descriptions |
| HowItWorks steps | `components/HowItWorks.jsx` | Hardcoded step descriptions |
| Campus detail sections | `components/campus/campusDetail.jsx` | Hardcoded facilities, hostels, transport, reviews |
| Programs list (SearchBar) | `components/SearchBar.jsx` | Hardcoded program names |
| University fallback | `data/universities.js` | 8 hardcoded universities with coordinates (used as fallback in Universities.jsx) |
| Popular Universities | `components/PopularUniversities.jsx` | Hardcoded 3 universities |

---

# 14. Database/Data Status

### Tables (11 total, auto-created by schema.js)

| Table | Fields | Purpose | CRUD Status |
|---|---|---|---|
| `Student_signup` | id (PK), name, username, email, password, role, avatar_url, assigned_id | User accounts (all roles) | ✅ Full CRUD |
| `Student_Profile` | std_id (PK), user_uid (FK→Student_signup), full_name, username, email, dob, age, cnic, address, gender | Student profile details | ✅ Full CRUD |
| `notifications` | id (PK), recipient_uid, recipient_email, subject, body, type, is_read, created_at | System notifications | ✅ Create (no read UI) |
| `university_verification` | id (PK), user_uid (FK), university_name, registration_no, address, contact_no, 4×document_urls, status, reject_reason, reviewed_by, reviewed_at | University verification requests | ✅ Full CRUD |
| `universities` | id (PK), owner_uid (FK), verification_id, name, description, logo_url, website, email, phone, city, address, established_year + extended fields (tagline, hero_subtitle, banner_url, about_title/text, mission, vision, ranking, stats) | University profiles | ✅ Full CRUD |
| `university_images` | id (PK), university_id (FK), image_url, caption | University gallery | ✅ Full CRUD |
| `programs` | id (PK), university_id (FK), name, level, duration, description, fee | University programs | ✅ Full CRUD |
| `campus_verification` | id (PK), campus_admin_uid (FK), university_id (FK), campus_name, city, address, contact_no, status, reject_reason | Campus registration requests | ✅ Full CRUD |
| `campuses` | id (PK), university_id (FK), campus_admin_uid, verification_id, name, city, address, history, duration, fee, phone, email, status | Campus profiles | ✅ Full CRUD |
| `campus_images` | id (PK), campus_id (FK), image_url, caption | Campus gallery | ✅ Full CRUD |
| `campus_programs` | id (PK), campus_id (FK), program_id (FK), fee, duration | Campus-specific programs | ✅ Full CRUD |

### Current Data (from SQL dump)

| Table | Records | Notes |
|---|---|---|
| Student_signup | 23 | Mix of student, university, campus, admin accounts (test data) |
| Student_Profile | 2 | Only 2 student profiles created |
| universities | 2 | "University of Lahore" and "Comsats" |
| university_verification | 5 | 2 approved, 2 rejected, 1 pending |
| university_images | 1 | Single image for Comsats |
| notifications | 4 | 2 approval + 2 rejection notifications |
| programs | 0 | Empty |
| campuses | 0 | Empty |
| campus_verification | 0 | Empty |
| campus_images | 0 | Empty |
| campus_programs | 0 | Empty |

### Missing Tables

- ❌ No `hostels` table
- ❌ No `applications` table
- ❌ No `reviews/ratings` table
- ❌ No `bookmarks/favorites` table

---

# 15. Authentication and Authorization

### Implementation Status

| Feature | Status | Details |
|---|---|---|
| Registration | ✅ Implemented | Multi-role signup (`student`, `university`, `campus`, `hostel`) |
| Login | ✅ Implemented | Email + password, returns JWT token |
| Logout | ✅ Implemented | Clears sessionStorage, redirects to `/login` |
| Password Hashing | ✅ Implemented | `bcryptjs` with salt rounds = 10 |
| JWT Tokens | ✅ Implemented | `jsonwebtoken`, 1-day expiry, contains {id, email, role} |
| Session Storage | ✅ Implemented | User data + token in `sessionStorage` (not `localStorage`) |
| Protected Routes | ✅ Implemented | `ProtectedRoute.jsx` checks `sessionStorage` for user + role match |
| Role-Based Access | ✅ Implemented | `authorizeRoles()` middleware on backend; `ProtectedRoute` on frontend |
| Token Verification | ✅ Implemented | `verifyToken` middleware validates JWT on protected endpoints |
| Auth Persistence | 🟡 Partial | Uses `sessionStorage` — data lost on tab close (not `localStorage`) |
| Forgot Password | 🔴 Not Implemented | No password reset flow |
| Email Verification | 🔴 Not Implemented | No email confirmation on signup |
| OAuth/Social Login | 🔴 Not Implemented | Google/Facebook icons in assets but no OAuth implementation |
| Admin Super Account | ✅ Implemented | Auto-seeded on server start (superadmin@unifinder.com) |

### Roles

| Role | Frontend Routes | Backend Access | Status |
|---|---|---|---|
| `student` | `/` (landing), `/profile` | Auth routes, profile CRUD | ✅ Working |
| `university` | `/university/dashboard` | University CRUD, verification, images, programs | ✅ Working |
| `campus` | `/campus/dashboard` | Campus CRUD, request submission | ✅ Working |
| `admin` | `/admin/dashboard` | All verification management, account search | ✅ Working |
| `hostel` | None (redirects to `/`) | None | 🔴 No hostel dashboard |

### Security Notes

- CORS is open to all origins (`app.use(cors())`)
- JWT secret defaults to `"secretkey"` if env var not set
- No rate limiting on auth endpoints
- No CSRF protection
- No input sanitization (raw SQL with parameterized queries — safe from SQL injection)
- SuperAdmin password is hardcoded in source (`Admin@123`)

---

# 16. University Module Status

| Feature | Status | Details |
|---|---|---|
| University Registration/Signup | ✅ Implemented | Via `/signup/university` |
| Document Submission | ✅ Implemented | 4 document uploads (HEC, Charter, Accreditation, Logo) |
| Verification Workflow | ✅ Implemented | Pending → Admin Review → Approved/Rejected |
| University Dashboard | ✅ Implemented | 5-tab panel (Details, Images, Programs, Profile, Campus Requests) |
| University Detail Editing | ✅ Implemented | Name, tagline, description, mission, vision, ranking, stats, etc. |
| Logo/Banner Upload | ✅ Implemented | Multer file upload with university profile |
| Image Gallery | ✅ Implemented | Add/delete gallery images with captions |
| Programs Management | ✅ Implemented | Add/delete programs (name, level, duration, fee, description) |
| Account Management | ✅ Implemented | Update name, username, email, password |
| Avatar Upload | ✅ Implemented | Profile picture upload |
| Campus Request Management | ✅ Implemented | Approve/reject campus registration requests |
| Public University Listing | ✅ Implemented | `/api/universities` returns list for browse page |
| Public University Detail | ✅ Implemented | `/university?id=X` shows full profile |
| University Search | 🟡 Partial | SearchBar fetches names/cities; no full-text search backend |
| University Filters | ⚠️ UI Only | AdvancedFilters component exists but filtering is client-side only |
| University Sorting | 🔴 Not Implemented | No sort functionality |
| University Ratings/Reviews | 🔵 Hardcoded | Landing page has hardcoded reviews; no review system in DB |
| University Comparison | 🔴 Commented Out | Components exist but route is disabled |
| University Application | 🔴 Not Implemented | No apply workflow or application table |
| University Location/Map | 🔵 Static Data | `data/universities.js` has lat/lng for 8 hardcoded unis; real DB universities have no coordinates |
| Fees Display | 🔵 Hardcoded | Fee data in `data/universities.js`; real programs have fee field but display needs work |
| Scholarship Info | 🔵 Hardcoded | Only in `data/universities.js` static data |

---

# 17. Hostel Module Status

| Feature | Status | Details |
|---|---|---|
| Hostel Listing (Landing) | 🔵 Hardcoded | 3 mock hostels in `Hostels.jsx` |
| Hostel Carousel (Uni Detail) | 🔵 Hardcoded | Hardcoded data in `hostelCarousel.jsx` |
| Hostel Detail Page | 🔴 Not Implemented | No dedicated hostel detail page |
| Hostel Search/Filter | 🔴 Not Implemented | No hostel search functionality |
| Hostel Rooms | 🔵 Mock | Hardcoded room types in landing showcase |
| Hostel Amenities | 🔵 Mock | Hardcoded amenity lists |
| Hostel Availability | 🔴 Not Implemented | No availability tracking |
| Hostel Pricing | 🔵 Mock | Hardcoded prices in landing showcase |
| Hostel Location/Map | 🔴 Not Implemented | No map integration |
| University-Hostel Relationship | 🔴 Not Implemented | No DB table linking hostels to universities |
| Hostel Booking/Application | ⚠️ UI Only | Booking modal in landing shows toast; no backend |
| Hostel Admin Dashboard | 🔴 Not Implemented | `hostel` role exists in signup but no dashboard |
| Hostel Database Table | 🔴 Not Implemented | No `hostels` table in schema |
| Hostel CRUD | 🔴 Not Implemented | No backend endpoints |

---

# 18. Student Module Status

| Feature | Status | Details |
|---|---|---|
| Student Registration | ✅ Implemented | `/signup/student` |
| Student Login | ✅ Implemented | JWT-based authentication |
| Student Profile | ✅ Implemented | 3-step wizard (Basic, Personal, Document) |
| Personal Information | ✅ Implemented | Name, DOB, age, CNIC, gender, address |
| Profile Picture | ✅ Implemented | Avatar upload with preview |
| Student Dashboard | 🔴 Not Implemented | No dedicated student dashboard page |
| University Search | 🟡 Partial | Can browse and search universities via `/homepage` |
| University Comparison | 🔴 Commented Out | Route disabled |
| Distance Calculator | 🔵 Code Exists | `haversineDistance()` in `data/universities.js`, `HomeLocationPicker` component exists but not routed |
| Application Submission | 🔴 Not Implemented | No apply workflow |
| Application History | 🔴 Not Implemented | No application tracking |
| Hostel Search | 🔴 Not Implemented | No functional hostel search |
| Notifications | 🔴 Not Implemented (FE) | Backend saves notifications but no frontend notification center |
| Reviews/Ratings | 🔴 Not Implemented | No review submission capability |
| Bookmarks/Favorites | ⚠️ UI Only | Heart/favorite toggle in `Universities.jsx` but state is local only — not persisted |
| Document Upload (Student) | ⚠️ UI Only | Step 3 of profile has file upload UI but no dedicated backend endpoint for student documents |

---

# 19. Admin Module Status

| Feature | Status | Details |
|---|---|---|
| Admin Login | ✅ Implemented | Via standard login form, role check |
| SuperAdmin Seed | ✅ Implemented | Auto-created on server start |
| Admin Dashboard | ✅ Implemented | Full verification management panel |
| University Verification Management | ✅ Implemented | List, filter, review, approve, reject with reason |
| Verification Document Review | ✅ Implemented | View uploaded documents in drawer |
| Account Search | ✅ Implemented | Search by assigned_id, email, or name |
| Account Detail View | ✅ Implemented | Shows user + university/campus/profile data |
| Rejection with Reason | ✅ Implemented | Modal with reason text, sent as notification |
| Notification System | ✅ Implemented (BE) | Simulated email notifications stored in DB |
| Stats Summary | ✅ Implemented | Pending/Approved/Rejected counts |
| Campus Verification | 🟡 Partial | Campus requests go to university admin, not super admin |
| Program Management | 🔴 Not in Admin | Admin cannot manage programs directly |
| Hostel Management | 🔴 Not Implemented | No hostel management |
| User Management | 🟡 Partial | Can search users but cannot edit/delete/ban |
| Data Analytics | 🔴 Not Implemented | No charts or analytics |
| Notification Center (FE) | 🔴 Not Implemented | Notifications stored but no UI to view them |

---

# 20. Search and Filtering Logic

### SearchBar Implementation

- **Component:** `SearchBar.jsx`
- **Search Fields:** Program (hardcoded list), City (from API), University (from API)
- **Dropdowns:** Custom dropdown with text filter input
- **Data Source:** `listUniversities()` API call on mount — extracts city names and university names
- **Search Action:** "Explore Now" navigates to `/homepage` passing `{ program, city, university }` as route state
- **No debouncing or autocomplete**

### Search Data Flow

```text
User types in SearchBar dropdowns
     ↓
searchValues state updated
     ↓
Click "Explore Now"
     ↓
navigate("/homepage", { state: searchValues })
     ↓
HomePage reads useLocation().state
     ↓
Passes to UniversityGrid as props
     ↓
UniversityGrid calls listUniversities() (fetches ALL universities)
     ↓
No server-side filtering — displays all results
```

### AdvancedFilters

- **Component:** `AdvancedFilters.jsx`
- **Filter Options:** Admission Status, Gender Type, Minimum Marks (slider), Tuition Fee Range, Entry Test, Hostel Availability
- **Implementation:** ⚠️ Filter state is maintained in `HomePage` but **no actual filtering logic is applied** to the university list. The universities from API are displayed regardless of filter values.
- **Backend Support:** 🔴 No filter endpoint exists. `/api/universities` returns all universities without query parameters.
- **URL Persistence:** 🔴 Filter state is not persisted in URL

### Campus Search

- **Backend Endpoint:** `/api/campuses?city=&university=&program=` exists in `campusController.js`
- **Frontend Usage:** `searchCampuses()` function exists in `api/campus.js` but is **not called from any active page**

---

# 21. Comparison Feature

| Feature | Status | Details |
|---|---|---|
| Comparison Page Route | 🔴 Commented Out | `/compareUniversitiesPage` commented out in App.jsx |
| Comparison Page Component | 🔴 Commented Out | `pages/compareUniversities.jsx` is entirely commented out |
| ComparisonTable Component | ✅ Built (orphaned) | `components/comparison/ComparisonTable.jsx` — full comparison table |
| HomeLocationPicker Component | ✅ Built (orphaned) | `components/comparison/HomeLocationPicker.jsx` — Leaflet map for selecting home location |
| StackedCard Component | ✅ Built (orphaned) | `components/comparison/StackedCard.jsx` — stacked university comparison cards |
| Landing Page CTA | ⚠️ Dead Link | "Compare Now" button navigates to dead route |
| University Selection | 🔴 Not Active | Components exist but not connected |
| Distance Calculation | ✅ Code Exists | `haversineDistance()` in `data/universities.js` |
| Comparison Attributes | 🔵 Hardcoded | Uses hardcoded `data/universities.js` data, not API data |

**Summary:** The comparison feature has been **built as components** but the route has been **disabled**. The `ComparisonTable`, `HomeLocationPicker`, and `StackedCard` components exist in the codebase and use the hardcoded university data from `data/universities.js` with the Haversine distance formula. However, they are **not accessible** through any active route.

---

# 22. Distance Calculator

| Feature | Status | Details |
|---|---|---|
| Haversine Formula | ✅ Implemented | `haversineDistance()` in `data/universities.js` |
| Home Location Input | ✅ Built (orphaned) | `HomeLocationPicker.jsx` with Leaflet map |
| University Coordinates | 🔵 Hardcoded | 8 universities in `data/universities.js` have lat/lng |
| Real University Coordinates | 🔴 Not in DB | `universities` table has no lat/lng columns |
| Distance Display | 🔵 Code exists | `formatDistance()` and `getDistanceFromHome()` utilities ready |
| Map Integration | ✅ Built (orphaned) | Leaflet + OpenStreetMap tiles in `HomeLocationPicker.jsx` |
| Active Usage | 🔴 Not Active | Only available through the disabled comparison feature |

---

# 23. Assets

### Images & Media

| Asset | File | Size | Used By |
|---|---|---|---|
| Logo (small) | `assets/Logo.png` | 5KB | Not referenced |
| Logo (large) | `assets/Logo1.png` | 361KB | Navbar, Login, Signup, Dashboards |
| Logo (public) | `public/Logo1.png` | 1KB | Favicon |
| Login Illustration | `assets/login.png` | 2.4MB | Login page right column |
| Signup Illustration | `assets/signup.png` | 2.4MB | Signup page left column |
| Screen Screenshot | `assets/screen.png` | 2MB | Used as university placeholder image |
| Hero Video 1 | `assets/video1.mp4` | 50MB | Not actively used (video2 used instead) |
| Hero Video 2 | `assets/video2.mp4` | 120MB | Landing page + Homepage hero background |
| Budget Icon | `assets/budget.png` | 2KB | Possibly unused |
| Compare Icon | `assets/compare.png` | 1KB | Possibly unused |
| Hostel Icon | `assets/hostel.png` | 1KB | Possibly unused |
| Search Icon | `assets/search.png` | 1KB | Possibly unused |
| Profile Icon | `assets/profile.png` | 2KB | Possibly unused |
| Email Icon | `assets/email.png` | 32KB | Login/Signup forms |
| Password Icon | `assets/password.png` | 21KB | Login/Signup forms |
| Name Icon | `assets/name.png` | 13KB | Signup form |
| Username Icon | `assets/username.png` | 24KB | Signup form |
| Eye Icon | `assets/eye.png` | 25KB | Password visibility toggle |
| Facebook Icon | `assets/facebook.png` | 90KB | Signup page (social login — not functional) |
| Google Icon | `assets/google.png` | 90KB | Signup page (social login — not functional) |
| Favicon SVG | `public/favicon.svg` | 10KB | Browser tab icon |
| Icons SVG | `public/icons.svg` | 5KB | Icon sprite |
| React SVG | `assets/react.svg` | 4KB | Default Vite asset — unused |

### Asset Issues

- `video1.mp4` (50MB) and `video2.mp4` (120MB) are very large files committed to the repo
- `assets/Logo.png` vs `assets/Logo1.png` — naming inconsistency, unclear which is primary
- Social login icons (facebook.png, google.png) are present but **no OAuth is implemented**
- Several small icon PNGs (budget, compare, hostel, search, profile) appear to be unused — the app uses `lucide-react` and `react-icons` instead

---

# 24. Current Feature Matrix

| Module | Feature | UI | Logic | Backend | Database | Status |
|---|---|---|---|---|---|---|
| **Auth** | Registration | ✅ | ✅ | ✅ | ✅ | ✅ Fully Implemented |
| **Auth** | Login | ✅ | ✅ | ✅ | ✅ | ✅ Fully Implemented |
| **Auth** | Logout | ✅ | ✅ | N/A | N/A | ✅ Fully Implemented |
| **Auth** | JWT Tokens | N/A | ✅ | ✅ | N/A | ✅ Fully Implemented |
| **Auth** | Role-Based Access | ✅ | ✅ | ✅ | ✅ | ✅ Fully Implemented |
| **Auth** | Forgot Password | ❌ | ❌ | ❌ | ❌ | 🔴 Not Implemented |
| **Student** | Profile CRUD | ✅ | ✅ | ✅ | ✅ | ✅ Fully Implemented |
| **Student** | Avatar Upload | ✅ | ✅ | ✅ | ✅ | ✅ Fully Implemented |
| **Student** | Dashboard | ❌ | ❌ | ❌ | ❌ | 🔴 Not Implemented |
| **Student** | Favorites | ✅ | ⚠️ | ❌ | ❌ | ⚠️ UI Only (local state) |
| **University** | Verification Flow | ✅ | ✅ | ✅ | ✅ | ✅ Fully Implemented |
| **University** | Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ Fully Implemented |
| **University** | Detail Editing | ✅ | ✅ | ✅ | ✅ | ✅ Fully Implemented |
| **University** | Image Gallery | ✅ | ✅ | ✅ | ✅ | ✅ Fully Implemented |
| **University** | Programs CRUD | ✅ | ✅ | ✅ | ✅ | ✅ Fully Implemented |
| **University** | Public Listing | ✅ | ✅ | ✅ | ✅ | ✅ Fully Implemented |
| **University** | Public Detail Page | ✅ | ✅ | ✅ | ✅ | ✅ Fully Implemented |
| **University** | Search | ✅ | 🟡 | 🟡 | ❌ | 🟡 Partial (no server filter) |
| **University** | Adv. Filters | ✅ | ❌ | ❌ | ❌ | ⚠️ UI Only |
| **University** | Sorting | ❌ | ❌ | ❌ | ❌ | 🔴 Not Implemented |
| **University** | Ratings/Reviews | 🔵 | ❌ | ❌ | ❌ | 🔵 Hardcoded |
| **University** | Comparison | ✅ (orphaned) | ✅ (orphaned) | ❌ | ❌ | 🔴 Commented Out |
| **University** | Apply/Application | ❌ | ❌ | ❌ | ❌ | 🔴 Not Implemented |
| **Campus** | Registration Request | ✅ | ✅ | ✅ | ✅ | ✅ Fully Implemented |
| **Campus** | Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ Fully Implemented |
| **Campus** | Detail Page | ✅ | 🟡 | ✅ | ✅ | 🟡 Partial (hardcoded sections) |
| **Campus** | Image Gallery | ✅ | ✅ | ✅ | ✅ | ✅ Fully Implemented |
| **Campus** | Programs | ✅ | ✅ | ✅ | ✅ | ✅ Fully Implemented |
| **Hostel** | Landing Showcase | ✅ | ❌ | ❌ | ❌ | 🔵 Hardcoded |
| **Hostel** | Booking | ✅ | ❌ | ❌ | ❌ | ⚠️ UI Only (toast) |
| **Hostel** | CRUD | ❌ | ❌ | ❌ | ❌ | 🔴 Not Implemented |
| **Hostel** | Database | ❌ | ❌ | ❌ | ❌ | 🔴 Not Implemented |
| **Admin** | Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ Fully Implemented |
| **Admin** | Verification Mgmt | ✅ | ✅ | ✅ | ✅ | ✅ Fully Implemented |
| **Admin** | Account Search | ✅ | ✅ | ✅ | ✅ | ✅ Fully Implemented |
| **Admin** | Notifications | ❌ (FE) | ✅ (BE) | ✅ | ✅ | 🟡 Backend only |
| **Deployment** | Docker Config | ✅ | ✅ | ✅ | N/A | 🟡 Dev only |
| **Deployment** | Nginx/Production | ✅ | ✅ | N/A | N/A | 🟡 Config exists |

---

# 25. Current Project Flow — Human Explanation

> When a user opens the Uni Finder website, they first see the **Landing Page**. This is a visually rich page with a full-screen background video and a prominent search bar at the top. The search bar has three dropdown fields — Program, City, and University — where cities and university names are fetched from the real backend database. Below the search bar, the landing page has multiple sections: a "Why Choose Uni Finder" feature showcase, a "How It Works" 4-step guide, a "Compare Universities" call-to-action section (though the comparison page itself is currently disabled), a university card grid that loads real universities from the API, a hostel showcase with three hardcoded sample hostels, a testimonials/reviews section with hardcoded reviews, a "Before vs After" interactive section with a budget calculator, and a statistics section with hardcoded numbers.
>
> The **Navbar** at the top is sticky and shows the Uni Finder logo, anchor links to page sections, and Login/Sign Up buttons. If the user is already logged in, it instead shows their profile avatar and name with a dropdown to access their profile or logout.
>
> When the user clicks **"Explore Now"** on the search bar, they are taken to the **Homepage/Search Results page** at `/homepage`. This page shows a hero video background with the search bar again, plus a sidebar of advanced filters (admission status, gender, marks range, fee range, etc.) and a grid of university cards loaded from the API. The user can switch between grid and list views. However, the advanced filters currently only maintain state in the UI — they don't actually filter the displayed universities. Clicking on a university card takes the user to the **Campus Detail Page** at `/campus?id=X`.
>
> The **University Detail Page** at `/university?id=X` shows a comprehensive public profile of a university — including a hero banner, about section, mission/vision, statistics (ranking, students, employment rate), programs list, image gallery, related campuses, and a hostel carousel. All data except the hostel section is fetched from the real database.
>
> For **authentication**, users can sign up with different roles: Student, University Admin, or Campus Admin. The registration form collects name, username, email, and password, and the role is determined from the URL (e.g., `/signup/university`). Login validates credentials against the MySQL database and returns a JWT token. After login, users are redirected to their respective dashboards based on role.
>
> **Students** who log in are redirected to the landing page (no dedicated student dashboard exists). They can access their profile page at `/profile`, which is a 3-step form wizard where they enter basic information, personal details (DOB, CNIC, gender), and upload documents. This data is saved to the backend.
>
> **University Admins** are directed to `/university/dashboard`. On their first visit, they must submit verification documents (HEC certificate, Charter certificate, accreditation document, and university logo). The status then shows as "Pending" until the super admin reviews and approves their request. Once approved, they get access to a full tabbed dashboard where they can edit their university details, upload gallery images, manage programs, update their account profile, and review campus registration requests from campus admins.
>
> **Campus Admins** go to `/campus/dashboard`. They first submit a campus request by selecting which university they want to register a campus for. The university admin then approves or rejects this request. Once approved, they get access to a campus management panel similar to the university dashboard.
>
> The **Super Admin** (auto-seeded as superadmin@unifinder.com) accesses `/admin/dashboard`. This is a comprehensive admin panel with summary stat cards, a filterable table of all verification requests, a slide-out drawer for reviewing request details and uploaded documents, a rejection modal with reason input, and an account search feature that can look up any user by their assigned ID or email.
>
> The **comparison feature** has been partially built — the comparison table, home location picker (with Leaflet map), and stacked card components exist in the codebase. However, the route for the comparison page is commented out in the app's routing configuration, and the "Compare Now" button on the landing page leads to a dead route.
>
> The **hostel feature** is currently only a static showcase on the landing page with hardcoded data. There is no hostel database, no hostel management dashboard, and no real hostel search or booking functionality. The "hostel" role exists in the signup system but has no associated dashboard.

---

# 26. Current Status vs Intended FYP Scope

Based on the codebase structure, the comparison components, the hardcoded data patterns, and the database schema, here is the gap analysis:

| Intended Feature | Current Implementation | Gap | Priority |
|---|---|---|---|
| Student Dashboard | No dedicated page | Need student dashboard with application history, favorites, notifications | 🔴 Critical |
| University Comparison | Components built, route disabled | Re-enable route, connect to API data instead of hardcoded data | 🔴 Critical |
| University Search/Filters (backend) | Client-side UI only | Implement server-side filtering, sorting, pagination | 🔴 Critical |
| Application/Apply Workflow | Not implemented at all | Design application flow, create `applications` table, build apply form | 🔴 Critical |
| Hostel Module (full) | Hardcoded showcase only | Create hostel DB table, CRUD endpoints, admin dashboard, search | 🟠 High |
| Distance Calculator | Code exists, not connected | Enable comparison route, connect to real university coordinates | 🟠 High |
| Reviews/Ratings System | Hardcoded only | Create reviews table, CRUD endpoints, user submission form | 🟠 High |
| Notifications UI | Backend saves notifications | Build notification center/bell icon in navbar, mark-as-read | 🟠 High |
| Forgot Password | Not implemented | Add password reset flow (email or security questions) | 🟡 Medium |
| Mobile Navigation | Desktop only | Add hamburger menu for mobile breakpoints | 🟡 Medium |
| 404 Page | Not implemented | Add catch-all route with 404 component | 🟡 Medium |
| Favorites/Bookmarks Persistence | Local state only | Create favorites table, persist to backend | 🟡 Medium |
| Student Document Upload | UI exists, no backend endpoint | Add student document upload endpoint | 🟡 Medium |
| Campus Detail (dynamic sections) | Hardcoded facilities/hostels/transport | Replace hardcoded data with API-driven content | 🟡 Medium |
| Email Notifications | Simulated (console.log) | Integrate real email service (Nodemailer/SendGrid) | 🟢 Low |
| Analytics/Charts | Not implemented | Add charts library, admin analytics page | 🟢 Low |
| Production Deployment | Docker config only | Deploy to cloud (Vercel/Railway/AWS) | 🟢 Low |
| Testing | No tests | Add unit/integration tests | 🟢 Low |

---

# 27. FYP 2 Readiness Assessment

### ✅ Already Completed

1. **Full authentication system** — JWT-based multi-role auth with signup, login, logout, role-based routing
2. **University verification workflow** — Complete document submission → admin review → approve/reject cycle with notifications
3. **University admin dashboard** — Full CRUD for university details, images, programs, account management
4. **Campus admin dashboard** — Full CRUD with campus-to-university approval workflow
5. **Admin dashboard** — Verification management, account search, rejection with reasons
6. **Landing page** — Polished, multi-section marketing page with video background
7. **Public university browse** — API-driven university listing with card grid
8. **Public university detail** — Comprehensive university profile pages
9. **Student profile management** — 3-step wizard with avatar upload
10. **Database schema** — 11 tables with proper foreign keys and auto-migration
11. **Docker containerization** — Dev environment with docker-compose

### 🟡 Partially Completed

1. **Search functionality** — SearchBar fetches real data but no backend filtering/sorting
2. **Advanced filters** — UI exists but not connected to filtering logic
3. **Comparison feature** — Components fully built but route is disabled
4. **Campus detail page** — Header data from API but detailed sections hardcoded
5. **Notifications** — Backend creates and stores but no frontend display
6. **Distance calculator** — Haversine function and map picker built but not integrated

### 🔴 Missing

1. **Student dashboard page**
2. **Application/apply workflow** (no `applications` table or endpoints)
3. **Hostel module** (no database, no CRUD, no dashboard)
4. **Reviews/ratings system** (no database, no CRUD)
5. **Favorites/bookmarks persistence**
6. **Password reset / forgot password**
7. **Mobile navigation (hamburger menu)**
8. **404 error page**
9. **Testing suite**

### ⚠️ Technical Debt

1. **Large video files** (170MB) committed to git repository — should use CDN or external hosting
2. **Duplicate Inter font** loaded twice in `index.html`
3. **Inconsistent naming** — `campusPage.jsx` vs `CampusDetailPage.jsx`, `profilecontroll.js` (typo)
4. **No input sanitization/validation** on backend (relies solely on parameterized queries)
5. **CORS open to all origins** — security concern for production
6. **JWT secret hardcoded as fallback** (`"secretkey"`)
7. **SuperAdmin password in source code** (`Admin@123`)
8. **No API error boundary** or global error handling on frontend
9. **sessionStorage vs localStorage** — user data lost on tab close
10. **Dead route** — Compare CTA button leads to commented-out route
11. **Unused dependencies** — TypeScript types installed but not used
12. **`studentModel.js`** exists but is never imported (legacy file)
13. **Two PostCSS configs** (root + `src/utils/`) — potential confusion
14. **No pagination** on university listing or admin verification table
15. **API base URL hardcoded** to `http://localhost:5000` — should use environment variable

### 🔟 Highest Priority Next Steps

1. **Enable and complete the Comparison feature** — Re-enable the route, connect to API data, integrate the distance calculator
2. **Implement server-side search/filtering** — Add query parameters to `/api/universities` endpoint for program, city, fee range, etc.
3. **Build the Application workflow** — Create `applications` table, apply endpoint, application form, application tracking
4. **Create Student Dashboard** — Dedicated page showing applications, favorites, profile, university recommendations
5. **Complete Hostel Module** — Create `hostels` table, CRUD endpoints, hostel dashboard for hostel admins, connect to university detail page
6. **Build Reviews/Ratings System** — Create `reviews` table, submission form, average rating calculation, display on university pages
7. **Add Notification Center** — Build navbar bell icon with notification dropdown, mark-as-read functionality
8. **Fix mobile navigation** — Add hamburger menu with slide-out drawer for mobile
9. **Connect Advanced Filters to backend** — Implement server-side filtering with query parameters
10. **Add forgot password flow** — Password reset via email or security question

### 📋 Recommended Development Order

```text
1.  Fix dead routes and navigation issues (Compare CTA, 404 page, mobile nav)
2.  Enable Comparison feature (re-enable route, connect to API)
3.  Implement backend search/filter for universities
4.  Connect AdvancedFilters to actual filtering logic
5.  Build Application workflow (DB table → API → frontend form → tracking)
6.  Create Student Dashboard page
7.  Build Hostel Module (DB → API → admin dashboard → public view)
8.  Build Reviews/Ratings system
9.  Add Notification Center (frontend)
10. Complete Campus Detail page (replace hardcoded sections with API data)
11. Add forgotten password flow
12. Implement favorites/bookmarks persistence
13. Fix technical debt (video hosting, security, naming, unused deps)
14. Testing + deployment preparation
```

---

# 28. Final Summary

## Current Project Status

| Metric | Count |
|---|---|
| Total implemented pages | 11 active + 1 static placeholder + 2 commented out = **14 files, 11 functional** |
| Total routes | **12 defined** (1 commented out) |
| Total reusable components | **47+ JSX component files** |
| Major modules implemented | Auth ✅, University ✅, Campus ✅, Admin ✅, Student Profile ✅ |
| Fully functional features | 18 (auth, CRUD operations, verification workflows) |
| Partially functional features | 5 (search, filters, campus detail, notifications, comparison) |
| UI-only features | 4 (advanced filters, hostel booking, favorites, student docs) |
| Mock/static features | 6 (hostels, reviews, stats, campus detail sections, popular unis) |
| Missing major features | 5 (application workflow, hostel module, reviews system, student dashboard, notification center) |
| Backend status | ✅ **Implemented** — Express.js with ~35 API endpoints |
| Database status | ✅ **Implemented** — MySQL with 11 tables, auto-schema, seed data |
| Authentication status | ✅ **Implemented** — JWT + bcrypt, multi-role, protected routes |
| Deployment status | 🟡 **Configured** — Docker + nginx ready, not deployed to production |

## Overall Completion Estimate

| Area | Estimate | Reasoning |
|---|---|---|
| UI / Frontend Pages | **75%** | 11 of ~15 needed pages built; landing page polished; missing student dashboard, hostel pages, comparison page active |
| Routing | **85%** | All active routes work; missing 404, some routes commented out |
| Frontend Logic | **55%** | CRUD and auth logic solid; search/filter/comparison/application logic missing |
| Backend API | **70%** | ~35 endpoints built; missing hostel, application, review, filter endpoints |
| Database | **65%** | 11 tables implemented; missing hostels, applications, reviews, favorites tables |
| Integration | **70%** | Most dashboard features fully integrated; some public pages use hardcoded data |
| Authentication | **85%** | Core auth complete; missing forgot password, email verification |
| Testing | **0%** | No tests whatsoever |

**Weighted Overall: ~60%**

Calculation: UI(75×0.15) + Routing(85×0.05) + FE Logic(55×0.20) + Backend(70×0.15) + DB(65×0.10) + Integration(70×0.15) + Auth(85×0.10) + Testing(0×0.10) = 11.25 + 4.25 + 11.0 + 10.5 + 6.5 + 10.5 + 8.5 + 0 = **62.5%**

### One-Paragraph Current State

Uni Finder is a partially-complete full-stack university discovery platform built with React 19, Express.js 5, and MySQL. The project has a strong foundation with a polished landing page, complete JWT-based multi-role authentication (student, university, campus, admin), and robust admin workflows including university verification with document upload, approval/rejection with notifications, and account search. University and campus admin dashboards are fully functional with CRUD operations for profiles, images, and programs. The public-facing university browse and detail pages fetch real data from the API. However, several core FYP features remain incomplete: the university comparison feature is built but disabled, the hostel module is entirely hardcoded/mock, there is no application/apply workflow, no student dashboard, no review system, and the search/filter system has UI but no backend support. The codebase has ~60% of the intended functionality implemented, with the authentication and admin modules being the most complete, and the hostel, application, and comparison modules being the primary gaps requiring development for FYP completion.
