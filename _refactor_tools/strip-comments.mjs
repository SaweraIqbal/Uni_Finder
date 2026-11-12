import fs from "fs";
import path from "path";
import { parse } from "@babel/parser";

const ROOT = "C:/Users/haide/Downloads/Uni_Finder-feature-uni-finder-updates";
const SKIP_DIRS = new Set(["node_modules", "uploads", "private_uploads", "private", "data", "backups", "dist", ".git"]);

const KEEP = /^\s*(eslint|@ts-|prettier-ignore|vite-ignore|global\s|istanbul|c8\s|webpackChunkName)/;

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(path.join(dir, entry.name), out);
    } else {
      out.push(path.join(dir, entry.name));
    }
  }
  return out;
}

function collectFiles() {
  const files = [];
  for (const target of ["src", "index.html", "vite.config.js", "eslint.config.js"]) {
    const p = path.join(ROOT, target);
    if (!fs.existsSync(p)) continue;
    const stat = fs.statSync(p);
    if (stat.isDirectory()) files.push(...walk(p));
    else files.push(p);
  }
  return files.filter((f) => /\.(js|jsx|css|html)$/.test(f));
}

function mergeRanges(ranges) {
  ranges.sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const r of ranges) {
    const last = merged[merged.length - 1];
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
    else merged.push([...r]);
  }
  return merged;
}

function findJsxCommentContainers(node, out = []) {
  if (!node || typeof node !== "object") return out;
  if (Array.isArray(node)) {
    for (const child of node) findJsxCommentContainers(child, out);
    return out;
  }
  if (node.type === "JSXExpressionContainer" && node.expression?.type === "JSXEmptyExpression") {
    out.push(node);
  }
  for (const key of Object.keys(node)) {
    if (key === "loc" || key === "leadingComments" || key === "trailingComments" || key === "innerComments") continue;
    const value = node[key];
    if (value && typeof value === "object") findJsxCommentContainers(value, out);
  }
  return out;
}

function stripJs(code, file) {
  let ast;
  try {
    ast = parse(code, {
      sourceType: "module",
      plugins: ["jsx", "classProperties", "objectRestSpread", "dynamicImport", "optionalChaining", "nullishCoalescingOperator"],
      errorRecovery: true,
      allowReturnOutsideFunction: true,
    });
  } catch (err) {
    console.log(`PARSE FAIL ${path.relative(ROOT, file)}: ${err.message}`);
    return null;
  }

  const containers = findJsxCommentContainers(ast.program);
  const containerRanges = containers.map((n) => [n.start, n.end]);
  const inContainer = (c) => containerRanges.some(([s, e]) => c.start >= s && c.end <= e);

  const removals = [];
  let removed = 0;

  for (const container of containers) {
    const comments = container.expression.innerComments || [];
    const keep = comments.some((c) => KEEP.test(c.value));
    if (!keep) {
      removals.push([container.start, container.end]);
      removed += comments.length || 1;
    }
  }

  for (const c of ast.comments || []) {
    if (KEEP.test(c.value) || inContainer(c)) continue;
    removals.push([c.start, c.end]);
    removed++;
  }

  if (!removals.length) return { code, removed: 0 };

  let out = code;
  for (const [start, end] of mergeRanges(removals).reverse()) {
    out = out.slice(0, start) + out.slice(end);
  }

  out = out
    .split("\n")
    .map((line) => (line.trim() === "" ? "" : line.replace(/[ \t]+$/, "")))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^\n+/, "");

  return { code: out, removed };
}

function stripCss(code) {
  let removed = 0;
  const out = code
    .replace(/\/\*(?!\!)[\s\S]*?\*\//g, () => {
      removed++;
      return "";
    })
    .split("\n")
    .map((line) => (line.trim() === "" ? "" : line.replace(/[ \t]+$/, "")))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^\n+/, "");
  return { code: out, removed };
}

const files = collectFiles();
let totalRemoved = 0;
let changedFiles = 0;
const report = [];

for (const file of files) {
  const code = fs.readFileSync(file, "utf8");
  let result;
  if (file.endsWith(".css")) result = stripCss(code);
  else if (file.endsWith(".html")) {
    let removed = 0;
    const out = code.replace(/<!--(?!\[)[\s\S]*?-->/g, () => {
      removed++;
      return "";
    });
    result = { code: out, removed };
  } else result = stripJs(code, file);

  if (!result) continue;
  if (result.removed > 0) {
    fs.writeFileSync(file, result.code, "utf8");
    totalRemoved += result.removed;
    changedFiles++;
    report.push(`${String(result.removed).padStart(3)}  ${path.relative(ROOT, file)}`);
  }
}

report.sort((a, b) => parseInt(b) - parseInt(a));
console.log(report.join("\n"));
console.log(`\nRemoved ${totalRemoved} comments from ${changedFiles} files (scanned ${files.length}).`);
