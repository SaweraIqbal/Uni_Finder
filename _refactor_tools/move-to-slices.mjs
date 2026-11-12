import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");
const BACKEND = path.join(SRC, "backend");

const frontendRules = [
  ["App.jsx", "app/App.jsx"],
  ["main.jsx", "app/main.jsx"],
  ["api/client.js", "shared/api/client.js"],
  ["api/verification.js", "features/auth/api/verification.js"],
  ["api/university.js", "features/university/api/university.js"],
  ["api/campus.js", "features/campus/api/campus.js"],
  ["context/AuthContext.jsx", "features/auth/AuthContext.jsx"],
  ["context/CampusRegistrationContext.jsx", "features/campusRegistration/CampusRegistrationContext.jsx"],
  ["utils/flash.js", "shared/utils/flash.js"],
  ["constants/campusRegistration.js", "features/campusRegistration/constants.js"],
  ["data/", "shared/data/"],
  ["components/Layout.jsx", "shared/components/Layout.jsx"],
  ["components/Reviews.jsx", "features/landing/components/Reviews.jsx"],
  ["components/shared/", "shared/components/"],
  ["components/admin/", "features/admin/components/"],
  ["components/campus/", "features/campus/components/"],
  ["components/campusAdmin/", "features/campusAdmin/components/"],
  ["components/campusReg/", "features/campusRegistration/components/"],
  ["components/home/", "features/landing/components/"],
  ["components/hostel/", "features/hostel/components/"],
  ["components/hostelOwner/", "features/hostel/owner/"],
  ["components/university/", "features/university/components/"],
  ["components/universityAdmin/", "features/universityAdmin/components/"],
  ["pages/Login.jsx", "features/auth/pages/Login.jsx"],
  ["pages/Signup.jsx", "features/auth/pages/Signup.jsx"],
  ["pages/ResetPassword.jsx", "features/auth/pages/ResetPassword.jsx"],
  ["pages/VerifyEmail.jsx", "features/auth/pages/VerifyEmail.jsx"],
  ["pages/CampusDetailPage.jsx", "features/campus/pages/CampusDetailPage.jsx"],
  ["pages/CompareCampusesPage.jsx", "features/campus/pages/CompareCampusesPage.jsx"],
  ["pages/CampusRegisterPage.jsx", "features/campusRegistration/pages/CampusRegisterPage.jsx"],
  ["pages/CampusRegistrationStatusPage.jsx", "features/campusRegistration/pages/CampusRegistrationStatusPage.jsx"],
  ["pages/UniversityDetailPage.jsx", "features/university/pages/UniversityDetailPage.jsx"],
  ["pages/UniversityDocuments.jsx", "features/university/pages/UniversityDocuments.jsx"],
  ["pages/UniversityDashboard.jsx", "features/university/pages/UniversityDashboard.jsx"],
  ["pages/ProgramSearchResults.jsx", "features/search/pages/ProgramSearchResults.jsx"],
  ["pages/landing.jsx", "features/landing/pages/landing.jsx"],
  ["pages/homepage.jsx", "features/home/pages/homepage.jsx"],
  ["pages/profile.jsx", "features/profile/pages/profile.jsx"],
  ["pages/superAdmin/", "features/admin/pages/"],
  ["pages/campusAdmin/", "features/campusAdmin/pages/"],
  ["pages/universityAdmin/", "features/universityAdmin/pages/"],
  ["pages/hostel/", "features/hostel/pages/"],
];

const backendRules = [
  ["config/db.js", "shared/db.js"],
  ["config/schema.js", "shared/schema.js"],
  ["config/hostelSchema.js", "shared/hostelSchema.js"],
  ["config/", "seeds/"],
  ["controllers/auth_controller/", "features/auth/controllers/"],
  ["routes/auth_route/", "features/auth/"],
  ["controllers/campus_controller/", "features/campus/controllers/"],
  ["routes/campusRoutes.js", "features/campus/campusRoutes.js"],
  ["routes/registrationRoutes.js", "features/campus/registrationRoutes.js"],
  ["controllers/hostel_controller/", "features/hostel/controllers/"],
  ["routes/hostelRoutes.js", "features/hostel/hostelRoutes.js"],
  ["routes/hostelModuleRoutes.js", "features/hostel/hostelModuleRoutes.js"],
  ["routes/hostelProfileRoutes.js", "features/hostel/hostelProfileRoutes.js"],
  ["controllers/university_controller/", "features/university/controllers/"],
  ["routes/universityRoutes.js", "features/university/universityRoutes.js"],
  ["controllers/admin_controller/", "features/admin/controllers/"],
  ["routes/dashboardRoutes.js", "features/admin/dashboardRoutes.js"],
  ["controllers/programSearchController.js", "features/programs/programSearchController.js"],
  ["utils/programSearchQuery.js", "features/programs/searchQuery.js"],
  ["utils/programSearchQuery.test.js", "features/programs/searchQuery.test.js"],
  ["controllers/contactController.js", "features/contact/contactController.js"],
  ["routes/contactRoutes.js", "features/contact/contactRoutes.js"],
  ["middleware/authMiddleware.js", "shared/middleware/authMiddleware.js"],
  ["middleware/upload.js", "shared/middleware/upload.js"],
  ["middleware/hostelUpload.js", "features/hostel/middleware/hostelUpload.js"],
  ["middleware/hostelRegistrationUpload.js", "features/hostel/middleware/hostelRegistrationUpload.js"],
  ["middleware/campusHostelUpload.js", "features/campus/middleware/campusHostelUpload.js"],
  ["utils/assignedId.js", "shared/utils/assignedId.js"],
  ["utils/emailService.js", "shared/email/emailService.js"],
  ["utils/emailValidation.js", "shared/email/emailValidation.js"],
  ["utils/emailValidation.test.js", "shared/email/emailValidation.test.js"],
  ["utils/registrationEmail.js", "shared/email/registrationEmail.js"],
  ["utils/notify.js", "shared/email/notify.js"],
  ["utils/cleanupUnverifiedAccounts.js", "features/auth/cleanupUnverifiedAccounts.js"],
  ["utils/cleanupUnverifiedAccounts.test.js", "features/auth/cleanupUnverifiedAccounts.test.js"],
  ["utils/hostelCompleteness.js", "features/hostel/hostelCompleteness.js"],
  ["models/auth_model/studentModel.js", "features/auth/studentModel.js"],
];

function findRule(rules, rel) {
  for (const [from, to] of rules) {
    if (rel === from) return to;
    if (from.endsWith("/") && rel.startsWith(from)) return to + rel.slice(from.length);
  }
  return null;
}

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", "dist", "uploads", "private_uploads", "private", "data", "assets"].includes(entry.name)) continue;
      walk(full, acc);
    } else if (/\.(js|jsx)$/.test(entry.name)) {
      acc.push(full);
    }
  }
  return acc;
}

const sourceFiles = walk(SRC).filter((f) => !f.startsWith(path.join(SRC, "backend", "node_modules")));
const moves = new Map();
const unmatched = [];

for (const file of sourceFiles) {
  if (file.startsWith(BACKEND + path.sep)) {
    const rel = path.relative(BACKEND, file).split(path.sep).join("/");
    if (rel === "server.js" || rel === "test-mail.js") continue;
    const target = findRule(backendRules, rel);
    if (target) moves.set(file, path.join(BACKEND, target));
    else unmatched.push("backend: " + rel);
  } else {
    const rel = path.relative(SRC, file).split(path.sep).join("/");
    if (rel.endsWith(".css")) continue;
    const target = findRule(frontendRules, rel);
    if (target) moves.set(file, path.join(SRC, target));
    else unmatched.push("frontend: " + rel);
  }
}

const resolveImport = (fromFile, spec) => {
  const base = path.resolve(path.dirname(fromFile), spec);
  const candidates = [
    base,
    base + ".js",
    base + ".jsx",
    base + ".json",
    base + ".css",
    base + ".png",
    base + ".jpg",
    base + ".jpeg",
    base + ".webp",
    base + ".svg",
    base + ".gif",
    base + ".mp4",
    base + ".xlsx",
    path.join(base, "index.js"),
    path.join(base, "index.jsx"),
  ];
  return candidates.find((c) => fs.existsSync(c) && fs.statSync(c).isFile()) || null;
};

const importRe = /(?:from\s*|import\s*\(\s*|import\s+|require\s*\(\s*)(["'])([^"']+)\1/g;

const plan = [];
const warnings = [];
const allFiles = walk(SRC);

function rewriteSpecifier(movedFile, newFile, spec) {
  if (!spec.startsWith(".")) return null;
  const resolved = resolveImport(movedFile, spec);
  if (!resolved) {
    warnings.push("unresolved: " + path.relative(ROOT, movedFile) + " -> " + spec);
    return null;
  }
  const target = moves.get(resolved) || resolved;
  let rel = path.relative(path.dirname(newFile), target).split(path.sep).join("/");
  if (!rel.startsWith(".")) rel = "./" + rel;
  const hadExt = /\.[a-z0-9]+$/i.test(spec);
  if (!hadExt) {
    rel = rel.replace(/\.(js|jsx)$/i, "");
    rel = rel.replace(/\/index\.(js|jsx)$/i, "");
  }
  return rel === spec ? null : rel;
}

for (const file of allFiles) {
  const newFile = moves.get(file) || file;
  const original = fs.readFileSync(file, "utf8");
  const replacements = [];
  let match;
  while ((match = importRe.exec(original))) {
    const spec = match[2];
    const next = rewriteSpecifier(file, newFile, spec);
    if (next) {
      const specStart = match.index + match[0].lastIndexOf(spec);
      replacements.push({ start: specStart, end: specStart + spec.length, text: next });
    }
  }
  if (replacements.length) plan.push({ file, newFile, original, replacements });
}

let moved = 0;
for (const [from, to] of moves) {
  if (from === to) continue;
  fs.mkdirSync(path.dirname(to), { recursive: true });
  if (fs.existsSync(to)) throw new Error("target exists: " + to);
  fs.renameSync(from, to);
  moved++;
}

let rewritten = 0;
for (const item of plan) {
  let text = item.original;
  for (const r of item.replacements.sort((a, b) => b.start - a.start)) {
    text = text.slice(0, r.start) + r.text + text.slice(r.end);
  }
  fs.writeFileSync(item.newFile, text);
  rewritten++;
}

const htmlPath = path.join(ROOT, "index.html");
let html = fs.readFileSync(htmlPath, "utf8");
html = html.replace('src="/src/main.jsx"', 'src="/src/app/main.jsx"');
fs.writeFileSync(htmlPath, html);

console.log("moved files:", moved);
console.log("rewritten files:", rewritten);
console.log("unmatched files:", unmatched.length);
unmatched.forEach((u) => console.log("  ?", u));
console.log("import warnings:", warnings.length);
warnings.slice(0, 40).forEach((w) => console.log("  !", w));
