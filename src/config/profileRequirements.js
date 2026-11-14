/**
 * profileRequirements.js  — Single source of truth for all profile rules.
 *
 * This file is imported by:
 *   - Every section component (to show required markers and validate)
 *   - ProfileReadinessCard   (to build the missing-items checklist)
 *   - DocumentsVault         (to flag Missing docs)
 *   - Backend controller     (completeness computation — logic replicated there
 *                             to avoid ESM cross-boundary issues)
 *
 * To change a rule, change it ONLY here.
 */

// ── Levels ────────────────────────────────────────────────────────────────────
export const LEVELS = ["ADP", "BS", "MS", "MPhil", "PhD"];

// ── Section visibility ────────────────────────────────────────────────────────
// Sections not listed here are visible for ALL levels.
export const SECTION_VISIBILITY = {
  researchProfile: ["MS", "MPhil", "PhD"],
  references:      ["MS", "MPhil", "PhD"],
};

export const isSectionVisible = (sectionKey, level) => {
  const rule = SECTION_VISIBILITY[sectionKey];
  if (!rule) return true; // visible for all
  return rule.includes(level);
};

// ── Personal Information ──────────────────────────────────────────────────────
// Same required set for every level.
export const PERSONAL_REQUIRED_FIELDS = [
  "full_name",
  "father_name",
  "dob",
  "gender",
  "cnic",
  "nationality",
  "domicile_province",
  "domicile_district",
  "mobile",
  "address",
  "city",
  "photo_url",
  "cnic_doc_url",
];

export const PERSONAL_FIELD_LABELS = {
  full_name:          "Full Name (as on CNIC)",
  father_name:        "Father / Guardian Name",
  dob:                "Date of Birth",
  gender:             "Gender",
  cnic:               "CNIC / B-Form Number",
  nationality:        "Nationality",
  domicile_province:  "Domicile Province",
  domicile_district:  "Domicile District",
  mobile:             "Mobile Number",
  address:            "Permanent Address",
  city:               "City",
  photo_url:          "Profile Photo",
  cnic_doc_url:       "CNIC / B-Form Copy (upload)",
};

// ── Academic Records ──────────────────────────────────────────────────────────
// Which record level_types are required for each target level.
export const ACADEMIC_REQUIRED_TYPES = {
  ADP:   ["Matric", "Intermediate"],
  BS:    ["Matric", "Intermediate"],
  MS:    ["Matric", "Intermediate", "Bachelor"],
  MPhil: ["Matric", "Intermediate", "Bachelor"],
  PhD:   ["Matric", "Intermediate", "Bachelor", "MS_MPhil"],
};

export const ACADEMIC_LEVEL_LABELS = {
  Matric:        "Matric / O-Level",
  Intermediate:  "Intermediate / A-Level",
  ADP:           "ADP (Associate Degree)",
  Bachelor:      "Bachelor's Degree",
  Master:        "Master's Degree",
  MS_MPhil:      "MS / MPhil",
  PhD:           "PhD",
};

// PhD requires thesis title + supervisor on the MS/MPhil record
export const PHD_RECORD_EXTRA_FIELDS = ["thesis_title", "supervisor"];

// ── Entry Test Scores ─────────────────────────────────────────────────────────
// null = optional for that level; a string = one of these test types required
export const TEST_REQUIRED = {
  ADP:   null,
  BS:    null,   // flagged as "Required for medical/engineering; recommended otherwise"
  MS:    "GAT General",
  MPhil: "GAT General",
  PhD:   "GAT Subject",
};

export const TEST_TYPES = [
  "MDCAT",
  "ECAT",
  "NAT",
  "SAT",
  "GAT General",
  "GAT Subject",
  "GRE",
  "University-specific",
  "Other",
];

export const GAT_HELPER = {
  "GAT General": "HEC minimum: 50 percentile",
  "GAT Subject": "HEC minimum: 60 percentile",
  GRE:           "Score 150+ Verbal, 150+ Quantitative recommended",
};

// ── Research Profile ──────────────────────────────────────────────────────────
export const RESEARCH_RULES = {
  MS:    { interests: false, sop: false, proposal: false },
  MPhil: { interests: true,  sop: true,  proposal: false },
  PhD:   { interests: true,  sop: true,  proposal: true  },
};

// ── References ────────────────────────────────────────────────────────────────
export const REFERENCES_RULES = {
  MS:    { min: 0, max: 2 },
  MPhil: { min: 2, max: 2 },
  PhD:   { min: 2, max: 3 },
};

// ── Experience / CV ───────────────────────────────────────────────────────────
export const CV_REQUIRED_LEVELS = ["MS", "MPhil", "PhD"];

export const EXPERIENCE_ENTRY_TYPES = [
  { value: "work",             label: "Work Experience" },
  { value: "internship",       label: "Internship" },
  { value: "award",            label: "Award / Scholarship" },
  { value: "certification",    label: "Certification" },
  { value: "extracurricular",  label: "Extracurricular" },
  { value: "cv",               label: "CV / Resume" },
];

// ── Documents Vault ───────────────────────────────────────────────────────────
export const DOC_TYPE_META = {
  photo:       { label: "Profile Photo",              section: "personal",    sectionLabel: "Personal Information" },
  cnic_doc:    { label: "CNIC / B-Form Copy",         section: "personal",    sectionLabel: "Personal Information" },
  transcript:  { label: "Certificate / Transcript",   section: "academic",    sectionLabel: "Academic Records" },
  equivalence: { label: "IBCC / HEC Equivalence",     section: "academic",    sectionLabel: "Academic Records" },
  scorecard:   { label: "Score Card",                 section: "tests",       sectionLabel: "Entry Test Scores" },
  sop:         { label: "Statement of Purpose",       section: "research",    sectionLabel: "Research Profile" },
  proposal:    { label: "Research Proposal",          section: "research",    sectionLabel: "Research Profile" },
  cv:          { label: "CV / Resume",                section: "experience",  sectionLabel: "Experience & Achievements" },
};

// ── Completeness weights (must sum to 100) ────────────────────────────────────
export const SECTION_WEIGHTS = {
  personal:    25,
  academic:    30,
  tests:       10,
  research:    15,
  references:  10,
  experience:  5,
  preferences: 5,
};

// ── Readiness checklist builder ───────────────────────────────────────────────
/**
 * Returns an array of { id, label, done, section, sectionLabel } for every
 * required item under the given level, given the student's current data.
 *
 * @param {string} level  - Target level (ADP / BS / MS / MPhil / PhD)
 * @param {object} data   - { profile, academicRecords, testScores, research, references, experience }
 */
export const buildReadinessChecklist = (level, data = {}) => {
  const { profile = {}, academicRecords = [], testScores = [],
          research = {}, references = [], experience = [] } = data;

  const items = [];

  // Personal required fields
  for (const field of PERSONAL_REQUIRED_FIELDS) {
    items.push({
      id:           `personal_${field}`,
      label:        PERSONAL_FIELD_LABELS[field],
      done:         Boolean(profile[field]),
      section:      "personal",
      sectionLabel: "Personal Information",
    });
  }

  // Academic records
  const requiredTypes = ACADEMIC_REQUIRED_TYPES[level] || [];
  const presentTypes  = academicRecords.map((r) => r.level_type);
  for (const t of requiredTypes) {
    items.push({
      id:           `academic_${t}`,
      label:        `${ACADEMIC_LEVEL_LABELS[t] || t} record`,
      done:         presentTypes.includes(t),
      section:      "academic",
      sectionLabel: "Academic Records",
    });
  }

  // PhD: MS/MPhil record must have thesis + supervisor
  if (level === "PhD") {
    const msMphilRecord = academicRecords.find((r) => r.level_type === "MS_MPhil");
    items.push({
      id:           "academic_thesis_title",
      label:        "MS/MPhil Thesis Title",
      done:         Boolean(msMphilRecord?.thesis_title),
      section:      "academic",
      sectionLabel: "Academic Records",
    });
    items.push({
      id:           "academic_supervisor",
      label:        "MS/MPhil Supervisor Name",
      done:         Boolean(msMphilRecord?.supervisor),
      section:      "academic",
      sectionLabel: "Academic Records",
    });
  }

  // Test scores
  const reqTest = TEST_REQUIRED[level];
  if (reqTest) {
    const hasTest = testScores.some((t) => t.test_type === reqTest);
    items.push({
      id:           `test_${reqTest}`,
      label:        `${reqTest} score`,
      done:         hasTest,
      section:      "tests",
      sectionLabel: "Entry Test Scores",
    });
  }

  // Research (MS / MPhil / PhD only)
  if (isSectionVisible("researchProfile", level)) {
    const rules = RESEARCH_RULES[level] || {};
    if (rules.interests) {
      const hasInterests = research?.research_interests &&
        JSON.parse(research.research_interests || "[]").length > 0;
      items.push({
        id:           "research_interests",
        label:        "Research Interests",
        done:         Boolean(hasInterests),
        section:      "research",
        sectionLabel: "Research Profile",
      });
    }
    if (rules.sop) {
      items.push({
        id:           "research_sop",
        label:        "Statement of Purpose",
        done:         Boolean(research?.sop_url),
        section:      "research",
        sectionLabel: "Research Profile",
      });
    }
    if (rules.proposal) {
      items.push({
        id:           "research_proposal",
        label:        "Research Proposal",
        done:         Boolean(research?.proposal_url),
        section:      "research",
        sectionLabel: "Research Profile",
      });
    }
  }

  // References
  if (isSectionVisible("references", level)) {
    const rule = REFERENCES_RULES[level] || { min: 0 };
    if (rule.min > 0) {
      for (let i = 1; i <= rule.min; i++) {
        items.push({
          id:           `reference_${i}`,
          label:        `Referee ${i}`,
          done:         references.length >= i,
          section:      "references",
          sectionLabel: "References",
        });
      }
    }
  }

  // CV (MS / MPhil / PhD)
  if (CV_REQUIRED_LEVELS.includes(level)) {
    const hasCV = experience.some((e) => e.entry_type === "cv");
    items.push({
      id:           "experience_cv",
      label:        "CV / Resume",
      done:         hasCV,
      section:      "experience",
      sectionLabel: "Experience & Achievements",
    });
  }

  return items;
};

/**
 * Compute completeness percentage from a checklist.
 * Uses SECTION_WEIGHTS to weight by section, not raw item count.
 */
export const computeCompletenessFromChecklist = (checklist, level) => {
  if (!checklist.length) return 0;

  // Group by section
  const bySection = {};
  for (const item of checklist) {
    if (!bySection[item.section]) bySection[item.section] = { done: 0, total: 0 };
    bySection[item.section].total += 1;
    if (item.done) bySection[item.section].done += 1;
  }

  const isGrad = ["MS", "MPhil", "PhD"].includes(level);
  let total = 0;

  for (const [section, counts] of Object.entries(bySection)) {
    const weight = SECTION_WEIGHTS[section] ?? 5;
    // Sections not applicable get skipped
    if (section === "research"   && !isGrad) continue;
    if (section === "references" && !isGrad) continue;
    total += (counts.done / counts.total) * weight;
  }

  // Add weight for sections not in checklist (preferences — always optional)
  // Give full 5 pts for preferences always (it's optional for all levels)
  total += SECTION_WEIGHTS.preferences;

  return Math.min(Math.round(total), 100);
};
