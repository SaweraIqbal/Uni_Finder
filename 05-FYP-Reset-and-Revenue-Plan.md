# UniFinder: FYP Reset, Product Direction, and Revenue Validation Plan

**Prepared:** 6 November 2026  
**Purpose:** Turn the current UniFinder codebase into a focused, defensible FYP and test whether it can become a business.  
**Important:** This is a product and feasibility plan, not a promise that revenue is guaranteed.

## 1. The short answer

Your work is not wasted, and the evaluator's criticism is not a verdict on you or your ability. The project already has a functioning full-stack base and real role-based workflows. The product problem is that the demo currently looks like a directory with admin panels: a student can filter listings, but the important decision—“Which options can I realistically afford and qualify for, and why?”—is not completed.

**Do not add more dashboards, more scraped universities, or an AI chatbot yet.** Make the student decision measurable and trustworthy:

> **UniFinder helps Pakistani undergraduate applicants compare current, campus-specific admission requirements and costs, then build an explainable shortlist with official sources and last-checked dates.**

Start with the seven universities already researched, but choose **one applicant cohort, one program family, and one geographic catchment** after speaking with students. Do not claim that all seven are fully covered until the live data and source checks confirm it.

The FYP contribution is not “we have university data.” It is testing whether **source-attributed, comparable, campus-level eligibility and affordability information** helps a student make a better shortlist with less effort than switching between websites and messages.

## 2. What I checked in the running project

I signed into the local student, university, campus, and super-admin experiences using the demo accounts you supplied. The local API health endpoint returned `ok` and `db: connected`. This is a walkthrough of the current local system, not an external audit of university facts.

| Area | What works now | What is missing or weak for the product story |
|---|---|---|
| Student discovery | `/homepage` loads a searchable/filterable list; the connected API returns 34 campus records across 6 universities. A profile has Basic, Personal, and Document steps. | There is no distinct student decision dashboard or saved shortlist journey. The profile does not drive a demonstrated personal recommendation. Filtering is not the same as proving a student is eligible or a campus is affordable. |
| Search and “best match” | Filters cover campus/program attributes; program search results show campus, fee, duration, and shifts. | I found no individualized match score or eligibility decision based on a student's profile. Results do not explain why one choice fits better than another. |
| Compare | The student can enter comparison-selection mode. | The actual [CompareCampusesPage](./src/pages/CompareCampusesPage.jsx) displays “Comparison view coming soon” and selected IDs, not a comparison. |
| University panel | The COMSATS university account opened a live overview, profile, campus/program workflows, and activity. The overview displayed 7 campuses, 139 programs, and 39,100 active students. | These are dashboard figures, not independently validated impact or enrollment evidence. The panel does not yet show qualified student demand, enquiries, or a measurable benefit for a university paying for the service. |
| Campus panel | The COMSATS Islamabad campus account opened its dashboard and live campus data. It displayed profile completeness and program, image, hostel, and society counts. | This is useful data maintenance, but completeness is not student impact. The product needs a reason for staff to keep fees, criteria, and deadlines current. |
| Super-admin panel | University verification, campus/program approval, and management sections are present. | The default queue was empty in this session. Hostel notifications include hard-coded entries, and [Analytics](./src/components/admin/Analytics.jsx) uses fixed chart/card values rather than measured platform metrics. Clearly label or replace demo data before presenting it as real. |
| Data quality | The live campus endpoint returned 34 records and 6 distinct universities. | Only 12/34 records had fee ranges, 14/34 had admission dates, and 20/34 had program arrays populated. The endpoint did not expose a source URL or last-verified timestamp for those facts. The seven hand-researched universities and the six live universities need reconciling. |
| Marketing promise | The landing page communicates search, comparison, application, and hostel discovery. | Application submission and physical hostel auditing are not demonstrated end-to-end. Treat them as future ideas, not current features. Avoid “verified,” “best,” “AI,” or outcome claims unless the system can show the evidence. |

### What this means

The evaluator's “why not use the university website?” question is fair **for a directory**. It is not a reason to throw away the data. A university website remains the source of truth; UniFinder should make facts from multiple official sources **comparable, campus-specific, dated, and useful for a student's constraints**. If interviews show that students do not need that, change direction before building more.

The current [Product Requirements Document](./01-Product-Requirements-Document%20(1).md), [App Flow Document](./03-App-Flow-Document%20(1).md), and [project status](./CURRENT_PROJECT_STATUS.md) describe different stages of the product. For example, the flow document calls comparison “to build,” while a route exists but is a placeholder. Update the project report and demo narrative to match working code.

## 3. FYP definition to test

### Proposed research question

> For the selected Pakistani undergraduate applicant cohort, does a source-attributed, campus-level shortlist that combines published eligibility, admission timing, and estimated first-year cost help students identify suitable programs more accurately and efficiently than their usual search process?

### Proposed system output

Ask a student for only what the decision needs: intended program/degree, self-reported marks or score range, preferred city/commute area, and a budget range. Return a short list with:

- **Eligibility:** Meets published minimum / does not meet it / cannot determine from verified information. Never imply guaranteed admission.
- **Affordability:** A clearly defined estimate, such as first-year tuition plus any separately listed required charges. Show what is excluded and avoid adding unverified hostel or transport costs.
- **Admission timing:** Open, closed, or unknown, with dates and source.
- **Fit explanation:** “Included because it offers this program in your selected area and its published minimum is below your reported score.” Show the reason, not just a score.
- **Evidence:** Official source link, the date checked, and whether a human or university representative confirmed it.

If a single score is useful after testing, let students see and adjust its criteria. Do not invent an “admission probability” without historical admissions data. A transparent rule-based shortlist is a stronger FYP than an unexplained AI score.

### Research contribution

Evaluate the decision process, not the number of records or screens. Compare the student's usual process with the prototype on realistic tasks. Measure task completion, time, errors in interpreting eligibility/cost, confidence, and whether the student can explain their shortlist. Report the study limitations; a small FYP usability study is not proof of national market demand.

## 4. Scope: what to build and what to pause

### Build for the FYP

1. Reconcile the seven researched institutions with the live database; select one program family and a manageable area.
2. Add source URL, source type, checked date, and verification state to each decision-critical field. Unknown values must say **Unknown**, not silently become zero or “best.”
3. Implement a student input → explainable eligibility/affordability shortlist → working two- or three-campus comparison → official source flow.
4. Make comparison real: program availability, published minimum criteria, admission dates, fee amount and period, location, and data freshness should line up side by side.
5. Keep an institution update flow and a super-admin verification step for the fields students rely on. These dashboards support data trust; they are not the headline product.
6. Add a simple correction/report flow so a student can flag stale information and staff can resolve it.
7. Test on a phone-sized viewport and with users who did not build the app.

### Pause until the core journey works

- One-click applications, payments, booking, and storing admissions documents.
- Physical hostel audits and “100% verified” claims.
- More institutions or nationwide coverage before the current records are complete.
- Extra dashboard charts, role-specific mock numbers, and cosmetic dashboard work.
- An AI model/chatbot added only to appear innovative.
- Collecting CNIC or sensitive documents for a shortlist. A recommendation does not need them; minimize student data and obtain clear consent.

## 5. Pakistan feasibility: what is known and what is not

There is a real, testable local problem hypothesis: prospective students may have to reconcile program availability, campus-level requirements, changing admissions dates, and fees across official sites and informal channels. Pakistan's official higher-education and education statistics help establish the sector's scope, but they do **not** prove that students want this product or that universities will pay for it.

Use the [HEC recognised institutions list](https://www.hec.gov.pk/english/universities/Pages/Recognised.aspx) to define the official institution universe and the [Pakistan Economic Survey 2024–25 Education chapter](https://www.finance.gov.pk/survey/chapter_25/10_Education.pdf) for national education context. Cite the publication year and the exact table/measure if your report uses a number. Do not turn a national education statistic into UniFinder's addressable market.

**Current feasibility status: unproven, but testable.** The repo contains a product hypothesis and useful seed data; I found no evidence in the checked material of completed student discovery, competitor testing, institutional letters of intent, or a paid pilot. The live API's incomplete fee/date/program coverage also means it is not ready to support broad claims of accurate recommendations.

### Two-sided feasibility checks

- **Student side:** Do applicants struggle with this specific decision? Which facts do they repeatedly search for? Will they use a cross-campus shortlist rather than existing sites, teachers, family, or WhatsApp groups?
- **Institution side:** Who owns the information and who could approve a purchase? Will an admissions team update data or pay for qualified, consented enquiries, correction workflows, or analytics? Is this better than their existing website, CRM, or ad budget?
- **Competitive alternatives:** Compare official HEC/university pages, admissions counselors, social groups, and any local discovery/lead-generation services students mention. Record what each does and where users still struggle. Do not claim “no competitors.”
- **Operational side:** Who checks changed fees and admission dates, how often, and what happens when an official source conflicts with a campus submission? “Verified” requires an actual process and audit trail.

## 6. Research plan before adding features

This is formative FYP research, not a statistically representative national survey.

### Week 1: problem discovery

- Interview **15–20 recent/prospective Pakistani applicants** from the chosen cohort. Include students who did and did not get into their preferred program, and a mix of public/private options where practical.
- Interview **at least 5 people** who advise applicants or maintain admissions information (counselors, teachers, admissions staff, or campus admins).
- Ask about the last real decision, not a hypothetical feature: “Show me how you compared your last two options”; “Which information was hard to confirm?”; “What did you do when a fee/deadline was missing?”; “What did you choose and why?”
- Ask institutions who can verify information, what update process they would accept, and what existing tool they use. Do not lead with “Would you use my app?”

### Week 2: data and competitor audit

- Pick one region/catchment and one program family based on interview evidence and the seven researched universities.
- For each pilot campus/program, record official source, exact value, academic year/intake, last checked date, checker, and confidence/status.
- Independently verify the fields students rank as most important. Track missingness instead of hiding it.
- Test the current clickable prototype with 5 students before implementation; note where they hesitate and which facts change their decision.

### Week 3–4: build and repeat

- Build only the end-to-end student journey in Section 3 and the minimum data-review workflow needed to keep it credible.
- Conduct task-based tests with **at least 15 additional applicants**. Example task: “Find three currently open programs in your area that match your score range and budget. Show why each appears and what you still need to confirm.”
- Suggested FYP decision gates (targets, not existing results): 12/20 discovery interviews describe a recent cross-source decision problem; at least 80% of usability-test participants complete the shortlist task without help; at least 80% of required fields for the pilot cohort have a current official source; 2 institutions agree in writing to try a pilot/update workflow.
- If students do not value the output, or institutions will not maintain the data, change the scope or business model rather than polishing unused features.

## 7. Revenue hypothesis: test it, do not promise it

**Primary hypothesis:** Students use the core decision tool for free. Private universities/campuses pay for an accurate profile-update workflow, source/accuracy reporting, and **opt-in** qualified enquiries or aggregate demand insights. A clearly disclosed sponsored placement may be a secondary revenue stream; it must never change an organic fit result without being labelled.

**Potential revenue paths to validate**

1. **Institution subscription:** one-campus listing/update tools, verification history, and aggregate interest analytics.
2. **Consent-based lead service:** an institution receives a student's contact/details only after the student explicitly asks to be contacted. Do not sell marks, CNIC, documents, or personal data without a necessary, explicit, lawful purpose.
3. **Clearly labelled sponsorship:** paid visibility separated from eligibility and fit ranking.

Do not charge students for basic eligibility/cost information or claim the platform will produce enrollment increases before measuring them. Do not assume universities will pay because they have dashboards.

### First willingness-to-pay experiment

- Offer **three institutions** a time-boxed pilot for one cohort/campus. Keep the student experience free.
- Show a one-page offer with the problem, fields they must maintain, data/consent boundaries, what reports they receive, and the pilot's success measure.
- Interview the actual budget owner. Ask what they currently spend, who signs, procurement timing, and what measurable result would justify renewal.
- Test a small, explicit price rather than asking only “Would you pay?” For example, use a **PKR 15,000/month per-campus price as an initial interview anchor**, clearly labelled as a hypothesis; adjust after buyer interviews. A signed paid pilot or written budget/renewal intent is stronger evidence than verbal enthusiasm.
- Calculate the opportunity bottom-up: **number of qualified, reachable paying institutions × price they actually accept**, not all Pakistani students × a made-up fee. Record customer acquisition and data-verification costs too.

**Go/no-go signal:** seek two written institutional pilot commitments and at least one buyer willing to discuss a real paid renewal. If no buyer pays, report that honestly and keep revenue as an unvalidated hypothesis; the FYP can still succeed as a tested decision-support system.

## 8. Six-week execution sequence

| Week | Focus | Deliverable / exit condition |
|---|---|---|
| 1 | User and buyer discovery | Interview notes, chosen cohort/region/program, competitor alternatives, explicit go/no-go decision. |
| 2 | Evidence-ready dataset | Reconciled institution list; source/freshness/verification fields; audited pilot data; missing-data report. |
| 3 | Student decision flow | Minimal inputs and explainable eligibility/cost shortlist; unknown/ineligible states handled honestly. |
| 4 | Comparison and trust loop | Working two-/three-option comparison, source links, correction flow, and necessary institution review. |
| 5 | User tests and partner pilot | Task observations, completion/time/error results, institution feedback, written pilot/pricing evidence. |
| 6 | Stabilize and defend | Fix observed blockers; demo seeded, verified records; final report with method, findings, limitations, and next-step business case. |

Each week, demo one completed user outcome, not a count of pages. Keep the current dashboards only where they support the decision data and approvals.

## 9. A stronger demonstration and panel answers

### 60-second demo

1. “A student wants **[selected program]** in **[selected area]**, has **[score range]**, and needs to stay under **[budget]**.”
2. Show the shortlist: eligible/uncertain/not eligible, cost basis, dates, and the exact official source/check date.
3. Compare two campuses and explain one trade-off; show what is unknown instead of guessing.
4. Show how a campus submits an update and how the platform records its review.
5. End with the user-test result and the institution pilot commitment—or state honestly that willingness to pay is still being tested.

### Concise answers to likely questions

- **“University websites already exist. Why UniFinder?”**  
  “We do not replace them. We cite them. Our job is to normalize campus/program-level facts across sources, show freshness and uncertainty, and let an applicant compare options against their own constraints. We are testing whether that saves time and improves the shortlist.”

- **“What is technically or academically new?”**  
  “The FYP evaluates an explainable, source-attributed campus-level decision workflow, including eligibility and affordability, with a defined usability study. We will not claim a novel AI model; we will measure whether the system improves the decision task.”

- **“Why should a university give you its data?”**  
  “The official page remains authoritative. We offer an update/review workflow and, if validated, consented enquiries and aggregate interest reporting. We are interviewing the people who own admissions data and will only claim institutional value after a pilot.”

- **“Where is your AI?”**  
  “AI is not needed to calculate published thresholds or compare costs, and an unexplained score could mislead students. We start with transparent rules. AI is a later option only if it can answer from cited, current data and tests show it helps.”

- **“How will it make money?”**  
  “Students get the core decision tool for free. We are testing campus subscriptions and consent-based enquiries with actual budget owners. We do not yet claim proven revenue; signed paid pilots are the next validation milestone.”

## 10. Immediate priorities and safety

1. **Change every password you posted in the chat now**, especially if any account uses it elsewhere. Do not put credentials in the report, screenshots, source code, or presentation. Use dedicated demo accounts with unique passwords for future reviews.
2. Freeze new feature work for a few days. Conduct the user interviews and select the cohort before deciding what to build.
3. Make the comparison route work before showing it again; otherwise remove the comparison claim from the demo until it does.
4. Replace or visibly label super-admin mock analytics and hostel notifications. Never present seeded/demo numbers as real operational metrics.
5. Verify the university role access guard before any public deployment: [ProtectedRoute](./src/components/shared/ProtectedRoute.jsx) currently contains a temporary university-dashboard bypass. Remove that bypass and test role authorization server-side.
6. Update the existing FYP report/spec only after the new cohort, research question, and scope are agreed. Keep claims consistent with the code and evidence.

## 11. Sources and evidence boundaries

- [HEC recognised universities and degree-awarding institutions](https://www.hec.gov.pk/english/universities/Pages/Recognised.aspx) — use to define/check institutional recognition; it does not prove applicant demand.
- [Pakistan Economic Survey 2024–25: Education chapter](https://www.finance.gov.pk/survey/chapter_25/10_Education.pdf) and [survey publication page](https://www.finance.gov.pk/survey_2025.html) — national context; cite exact tables and do not treat it as product-market validation.
- Local application evidence collected for this plan: browser walkthrough of the four supplied demo roles, local API health check, and current campus-list response on 6 November 2026. Displayed figures are system data and have not been independently verified with the institutions.

---

**Bottom line:** Keep the code and the data. Stop presenting them as the finished product. Prove one painful student decision, make one trusted comparison journey work, and ask real institutions to commit to maintaining or paying for it. That is a more credible FYP—and a more investable starting point—than adding features to satisfy a trend.
