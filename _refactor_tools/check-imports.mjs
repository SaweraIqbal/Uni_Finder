import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");
const problems = [];

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", "dist", "uploads", "private_uploads", "private", "assets"].includes(entry.name)) continue;
      walk(full, acc);
    } else if (/\.(js|jsx)$/.test(entry.name)) {
      acc.push(full);
    }
  }
  return acc;
}

const importRe = /(?:from\s*|import\s*\(\s*|import\s+|require\s*\(\s*)(["'])([^"']+)\1/g;

for (const file of walk(SRC)) {
  const text = fs.readFileSync(file, "utf8");
  let m;
  while ((m = importRe.exec(text))) {
    const spec = m[2];
    if (!spec.startsWith(".")) continue;
    const base = path.resolve(path.dirname(file), spec);
    const ok = [
      base, base + ".js", base + ".jsx", base + ".json", base + ".css",
      base + ".png", base + ".jpg", base + ".jpeg", base + ".webp", base + ".svg",
      base + ".gif", base + ".mp4",
      path.join(base, "index.js"), path.join(base, "index.jsx"),
    ].some((c) => fs.existsSync(c) && fs.statSync(c).isFile());
    if (!ok) problems.push(path.relative(ROOT, file) + " -> " + spec);
  }
}

console.log("unresolved imports:", problems.length);
problems.forEach((p) => console.log("  " + p));
