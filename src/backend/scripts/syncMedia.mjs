import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";
import sharp from "sharp";
import ExcelJS from "exceljs";
import dotenv from "dotenv";
import { UPLOADS_DIR, DATA_DIR } from "../shared/paths.js";

dotenv.config();

const DB = {
  host: process.env.DB_HOST || "127.0.0.1",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "uni_finder",
};

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const WIKI = "https://en.wikipedia.org/w/api.php";
const COMMONS = "https://api.wikimedia.org/core/v1/commons";
const WIKIDATA = "https://www.wikidata.org";

const argv = process.argv.slice(2);
const opt = (k, d) => {
  const hit = argv.find((a) => a.startsWith(`--${k}=`));
  return hit ? hit.split("=").slice(1).join("=") : d;
};
const flag = (k) => argv.includes(`--${k}`);
const LIMIT = Number(opt("limit", "0"));
const ONLY = opt("only", "").toLowerCase();
const UNI_DIR = path.join(UPLOADS_DIR, "universities");
const CAMPUS_DIR = path.join(UPLOADS_DIR, "campuses");
const LOG_PATH = path.join(DATA_DIR, "media-sync-log.json");
const WD_CACHE_PATH = path.join(DATA_DIR, "wikidata-cache.json");
const OVERRIDES_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), "media-overrides.json");

let OVERRIDES = { universities: {}, campuses: {} };
try {
  OVERRIDES = JSON.parse(await fs.readFile(OVERRIDES_PATH, "utf8"));
} catch {
  OVERRIDES = { universities: {}, campuses: {} };
}

const STOP = new Set(["of", "the", "and", "for", "in", "at", "a", "an", "pakistan", "pvt", "ltd"]);
const GENERIC = new Set([
  "university", "sciences", "science", "technology", "institute", "college", "degree",
  "higher", "education", "management", "engineering", "information", "arts", "campus",
]);

const nameKey = (s) =>
  String(s || "").toLowerCase().replace(/\(.*?\)/g, " ").replace(/[^a-z0-9]+/g, "");

function tokens(s, keepGeneric = false) {
  return new Set(
    String(s || "")
      .toLowerCase()
      .replace(/\(.*?\)/g, " ")
      .replace(/[^a-z0-9 ]+/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 2 && !STOP.has(t) && (keepGeneric || !GENERIC.has(t))),
  );
}

function similarity(a, b) {
  const A = a instanceof Set ? a : tokens(a);
  const B = b instanceof Set ? b : tokens(b);
  if (!A.size || !B.size) return 0;
  let hit = 0;
  for (const t of A) if (B.has(t)) hit++;
  return hit / Math.min(A.size, B.size);
}

const JUNK =
  /(sprite|favicon|icon[-_]|_icon|placeholder|avatar|payment|partner|flag[-_]|loader|spinner|arrow|banner-ad|advert|pixel|tracking|facebook|instagram|twitter|linkedin|whatsapp|logo)/i;
const CAMPUS_WORDS =
  /(campus|building|block|library|ground|gate|auditorium|laborator|lab[-_]|academic|classroom|hostel|lawn|main[-_]?office|view|architecture|premises|college|department)/i;

function absUrl(src, base) {
  if (!src) return null;
  src = src.trim().replace(/&amp;/g, "&");
  if (/^(data|blob|javascript):/i.test(src)) return null;
  try {
    const u = new URL(src, base);
    return /^https?:$/.test(u.protocol) ? u.toString() : null;
  } catch {
    return null;
  }
}

function attr(tag, name) {
  const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']+)["']`, "i"));
  return m ? m[1] : null;
}

function pickSrcset(srcset, base) {
  if (!srcset) return null;
  const parts = srcset.split(",").map((p) => p.trim().split(/\s+/)).filter((p) => p[0]);
  parts.sort((a, b) => (parseInt(b[1]) || 0) - (parseInt(a[1]) || 0));
  return parts.length ? absUrl(parts[0][0], base) : null;
}

function extractImages(html, base) {
  const out = [];
  const push = (u) => {
    if (!u || !/^https?:\/\//i.test(u)) return;
    if (/\.(svg|gif|ico)(\?|$)/i.test(u)) return;
    if (JUNK.test(u)) return;
    out.push(u);
  };
  const metaRe =
    /<meta[^>]+(?:property|name)\s*=\s*["'](?:og:image(?::url|:secure_url)?|twitter:image)["'][^>]*>/gi;
  for (const m of html.matchAll(metaRe)) push(absUrl(attr(m[0], "content"), base));
  for (const tag of html.matchAll(/<img\b[^>]*>/gi)) {
    push(
      absUrl(
        attr(tag[0], "src") || attr(tag[0], "data-src") || attr(tag[0], "data-lazy-src") || attr(tag[0], "data-original"),
        base,
      ),
    );
    push(pickSrcset(attr(tag[0], "srcset") || attr(tag[0], "data-srcset"), base));
  }
  for (const m of html.matchAll(/url\(\s*["']?([^"')]+\.(?:jpe?g|png|webp)[^"')]*)/gi)) {
    push(absUrl(m[1], base));
  }
  return [...new Set(out)];
}

function extractLinks(html, base, re) {
  const out = [];
  for (const m of html.matchAll(/<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>/gi)) {
    const u = absUrl(m[1], base);
    if (!u) continue;
    try {
      if (new URL(u).host !== new URL(base).host) continue;
    } catch {
      continue;
    }
    if (re.test(u)) out.push(u);
  }
  return [...new Set(out)];
}

async function fetchText(url, referer) {
  try {
    const res = await fetch(url, {
      headers: {
        "user-agent": UA,
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,application/json,*/*;q=0.8",
        "accept-language": "en-US,en;q=0.9",
        ...(referer ? { referer } : {}),
      },
      redirect: "follow",
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return null;
    const type = res.headers.get("content-type") || "";
    if (!/text\/html|application\/json/.test(type)) return null;
    return await res.text();
  } catch {
    return null;
  }
}

async function fetchJson(url, referer) {
  if (/wikimedia\.org|wikipedia\.org/.test(url)) referer = undefined;
  const txt = await fetchText(url, referer);
  if (!txt) return null;
  try {
    return JSON.parse(txt);
  } catch {
    return null;
  }
}

async function fetchImage(url, referer) {
  try {
    const res = await fetch(url, {
      headers: {
        "user-agent": UA,
        accept: "image/avif,image/webp,image/png,image/jpeg,*/*",
        ...(referer ? { referer } : {}),
      },
      redirect: "follow",
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return null;
    const type = res.headers.get("content-type") || "";
    if (!/image\//.test(type)) return null;
    const len = Number(res.headers.get("content-length") || 0);
    if (len > 9 * 1024 * 1024) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 2500 || buf.length > 9 * 1024 * 1024) return null;
    return buf;
  } catch {
    return null;
  }
}

async function inspect(buf) {
  try {
    const meta = await sharp(buf).metadata();
    return meta.width && meta.height ? meta : null;
  } catch {
    return null;
  }
}

async function validPhoto(url, referer, minW = 800, minH = 480) {
  const buf = await fetchImage(url, referer);
  if (!buf) return null;
  const meta = await inspect(buf);
  if (!meta) return null;
  const ratio = meta.width / meta.height;
  if (meta.width < minW || meta.height < minH || ratio < 0.85 || ratio > 3.8) return null;
  if (meta.width * meta.height > 60e6) return null;
  return { buf, meta, url };
}

async function validLogo(url, referer) {
  const buf = await fetchImage(url, referer);
  if (!buf) return null;
  const meta = await inspect(buf);
  if (!meta || meta.width < 60 || meta.height < 60) return null;
  if (meta.width / meta.height > 5 || meta.height / meta.width > 5) return null;
  return { buf, meta, url };
}

async function wikiFileUrls(titles, width = 1600) {
  const out = [];
  for (let i = 0; i < titles.length; i += 20) {
    const batch = titles.slice(i, i + 20).join("|");
    const data = await fetchJson(
      `${WIKI}?action=query&format=json&titles=${encodeURIComponent(
        batch,
      )}&prop=imageinfo&iiprop=url%7Csize&iiurlwidth=${width}`,
    );
    for (const p of Object.values(data?.query?.pages || {})) {
      const info = p.imageinfo?.[0];
      if (!info?.thumburl) continue;
      out.push({ title: p.title, url: info.thumburl.split("?")[0], width: info.thumbwidth, height: info.thumbheight });
    }
  }
  return out;
}

async function wikiArticle(name, city) {
  const os = await fetchJson(`${WIKI}?action=opensearch&format=json&limit=1&search=${encodeURIComponent(name)}`);
  let title = os?.[1]?.[0];
  if (!title || similarity(title, name) < 0.5) {
    const data = await fetchJson(
      `${WIKI}?action=query&format=json&generator=search&gsrsearch=${encodeURIComponent(
        `${name} Pakistan`,
      )}&gsrlimit=3&prop=images&imlimit=50`,
    );
    const pages = Object.values(data?.query?.pages || {}).sort((a, b) => (a.index || 9) - (b.index || 9));
    const best = pages.find((p) => similarity(p.title, name) >= 0.6);
    title = best?.title;
  }
  if (!title) return null;
  const data = await fetchJson(`${WIKI}?action=query&format=json&titles=${encodeURIComponent(title)}&prop=images&imlimit=60`);
  const page = Object.values(data?.query?.pages || {})[0];
  if (!page || page.missing !== undefined) return null;
  return { title, images: (page.images || []).map((i) => i.title) };
}

async function wikiCandidates(name, city) {
  const page = await wikiArticle(name, city);
  if (!page) return { photos: [], logo: null };
  const files = page.images.filter((t) => /\.(jpe?g|png|webp|svg)$/i.test(t));
  const filtered = files.filter(
    (t) => !/commons-logo|wikimedia|question|ambox|edit|symbol|flag|map|disambig|icon/i.test(t),
  );
  const logoFile = filtered.find((t) => /logo|seal|emblem|monogram/i.test(t));
  const photoFiles = filtered.filter((t) => /\.(jpe?g|png|webp)$/i.test(t) && CAMPUS_WORDS.test(t));
  const infos = await wikiFileUrls(photoFiles.slice(0, 24), 1600);
  const photos = infos.map((i) => i.url);
  let logo = null;
  if (logoFile) {
    const li = await wikiFileUrls([logoFile], 512);
    logo = li[0]?.url || null;
  }
  return { photos, logo };
}

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return out;
}

async function commonsSearch(query, mustMatch, limit = 8) {
  const data = await fetchJson(`${COMMONS}/search/page?q=${encodeURIComponent(query)}&limit=${limit}`);
  const titles = (data?.pages || [])
    .map((p) => p.title || p.key)
    .filter((t) => t && /\.(jpe?g|png|webp)$/i.test(t))
    .filter((t) => !JUNK.test(t))
    .filter((t) => !mustMatch.length || mustMatch.some((m) => t.toLowerCase().includes(m)))
    .slice(0, 6);
  const found = await mapLimit(titles, 4, async (title) => {
    const f = await fetchJson(`${COMMONS}/file/${encodeURIComponent(title)}`);
    let url = f?.original?.url;
    const w = f?.original?.width || 0;
    if (!url || w > 6000) url = f?.preferred?.url;
    return url ? url.split("?")[0] : null;
  });
  return found.filter(Boolean);
}

async function wpMedia(domain) {
  const data = await fetchJson(`https://${domain}/wp-json/wp/v2/media?per_page=60&media_type=image`);
  if (!Array.isArray(data)) return [];
  return data
    .map((m) => ({ url: m.source_url, alt: `${m.alt_text || ""} ${m.title?.rendered || ""}` }))
    .filter((m) => m.url && /\.(jpe?g|png|webp)$/i.test(m.url))
    .filter((m) => !JUNK.test(m.url))
    .filter((m) => CAMPUS_WORDS.test(m.url) || CAMPUS_WORDS.test(m.alt))
    .map((m) => m.url)
    .slice(0, 20);
}

async function siteMedia(domain, filters = []) {
  const root = `https://${domain}`;
  const html = await fetchText(root);
  const out = [];
  if (html) {
    const imgs = extractImages(html, root).filter(
      (u) => !/admission|news|event|notice|apply|job|result/i.test(u),
    );
    const pages = extractLinks(html, root, /(campus|campuses|gallery|photo|media|tour|life-at|virtual)/i).slice(0, 2);
    const subs = await mapLimit(pages, 2, (p) => fetchText(p, root));
    pages.forEach((p, i) => {
      if (subs[i]) out.push(...extractImages(subs[i], p).filter((u) => !/admission|news|event|notice/i.test(u)));
    });
    out.unshift(...imgs);
  }
  out.push(...(await wpMedia(domain)));
  const uniq = [...new Set(out)];
  if (!filters.length) return uniq;
  const hit = uniq.filter((u) => filters.some((f) => u.toLowerCase().includes(f)));
  const other = uniq.filter((u) => CAMPUS_WORDS.test(u));
  return [...new Set([...hit, ...other, ...uniq])];
}

async function siteIcon(domain) {
  const root = `https://${domain}`;
  const html = await fetchText(root);
  if (html) {
    for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
      const rel = (attr(m[0], "rel") || "").toLowerCase();
      if (!/apple-touch-icon|icon/.test(rel)) continue;
      const href = absUrl(attr(m[0], "href"), root);
      if (href) return href;
    }
    const logoImg = extractImages(html, root).find((u) => /logo/i.test(u));
    if (logoImg) return logoImg;
  }
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=256`;
}

let wdCache = {};
try {
  wdCache = JSON.parse(await fs.readFile(WD_CACHE_PATH, "utf8"));
} catch {}

function wdFileUrl(file) {
  const t = file.startsWith("File:") ? file : `File:${file}`;
  return t;
}

async function wikidataLookup(name) {
  if (wdCache[name]) return wdCache[name];
  const data = await fetchJson(
    `${WIKIDATA}/w/api.php?action=wbsearchentities&search=${encodeURIComponent(
      name,
    )}&language=en&format=json&limit=5`,
  );
  const best = (data?.search || []).find((e) => similarity(e.label || e.title, name) >= 0.6);
  let result = null;
  if (best) {
    const ent = await fetchJson(`${WIKIDATA}/wiki/Special:EntityData/${best.id}.json`);
    const e = ent?.entities?.[best.id];
    if (e) {
      const val = (k) => e.claims?.[k]?.[0]?.mainsnak?.datavalue?.value;
      const site = val("P856");
      result = {
        qid: best.id,
        label: e.labels?.en?.value || best.label,
        website: site?.startsWith("http") ? site : site ? `https://${site}` : null,
        logo: val("P154") || null,
        image: val("P18") || null,
      };
    }
  }
  wdCache[name] = result;
  await fs.writeFile(WD_CACHE_PATH, JSON.stringify(wdCache, null, 2));
  return result;
}

const domainOf = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
};

async function resolveSources(conn) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path.join(DATA_DIR, "hec_universities.xlsx"));
  const map = new Map();
  wb.worksheets[0].eachRow((row, idx) => {
    if (idx === 1) return;
    const name = String(row.getCell(2).value || "").trim();
    const oric = String(row.getCell(6).value || "").trim();
    if (!name || !oric) return;
    const d = oric.replace(/^@/, "").replace(/^https?:\/\//, "").replace(/\/.*$/, "").toLowerCase();
    if (d.includes(".")) map.set(nameKey(name), d);
  });

  const [rows] = await conn.query("SELECT id,name,domain,website FROM universities");
  let fromSheet = 0;
  let fromWd = 0;
  const missing = [];
  for (const r of rows) {
    let domain = r.domain;
    let website = r.website;
    if (!domain) {
      domain = map.get(nameKey(r.name)) || null;
      if (!domain) {
        let best = null;
        let bestScore = 0.72;
        for (const [k, d] of map) {
          const s = similarity(k, nameKey(r.name));
          if (s > bestScore) {
            best = d;
            bestScore = s;
          }
        }
        domain = best;
      }
      if (domain) fromSheet++;
    }
    if (!domain) {
      const wd = await wikidataLookup(r.name);
      if (wd?.website) {
        domain = domainOf(wd.website);
        website = website || wd.website;
        fromWd++;
      }
    }
    if (!domain) missing.push(r.name);
    if (domain && domain !== r.domain) await conn.query("UPDATE universities SET domain=? WHERE id=?", [domain, r.id]);
    if (website && !r.website) await conn.query("UPDATE universities SET website=? WHERE id=?", [website, r.id]);
  }
  console.log(
    `[sources] sheet=${fromSheet} wikidata=${fromWd} missing=${missing.length}${missing.length ? ` (${missing.slice(0, 8).join(" | ")}${missing.length > 8 ? " ..." : ""})` : ""}`,
  );
  return { missing };
}

async function saveWebp(buf, file, width, height, quality, fit = "cover", position = "centre") {
  await fs.mkdir(path.dirname(file), { recursive: true });
  let img = sharp(buf).rotate();
  img =
    fit === "contain"
      ? img.resize(width, height, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
      : img.resize(width, height, { fit: "cover", position });
  await img.webp({ quality }).toFile(file);
  return file;
}

function photoScore(url) {
  const l = url.toLowerCase();
  let s = 0;
  if (/campus|building|block|academic|library|architecture|main|gate|lawn|facade|exterior/.test(l)) s += 6;
  if (/event|funfair|festival|sports|conference|seminar|ceremony|trip|tour|student-life|research|news|admission|banner|convocation|workshop/.test(l)) s -= 3;
  if (/all-campuses|collage|montage|network|infographic|poster|brochure|flyer/.test(l)) s -= 12;
  if (/\.(jpe?g|webp)(\?|$)/.test(l)) s += 1;
  return s;
}

async function pickPhotos(candidates, referer, needed, used = new Set(), minW = 800) {
  const picked = [];
  const queue = candidates.filter((u) => u && !used.has(u));
  for (let i = 0; i < queue.length && picked.length < needed; i += 8) {
    const chunk = queue.slice(i, i + 8);
    chunk.forEach((u) => used.add(u));
    const results = await Promise.all(
      chunk.map((u) => validPhoto(u, referer, minW, Math.round(minW * 0.6))),
    );
    for (const r of results) {
      if (r && picked.length < needed) picked.push(r);
    }
  }
  return picked;
}

async function pickLogo(candidates, referer) {
  for (const url of candidates) {
    if (!url) continue;
    const ok = await validLogo(url, referer);
    if (ok) return ok;
  }
  return null;
}

async function syncUniversity(conn, uni) {
  const result = {
    kind: "university",
    id: uni.id,
    name: uni.name,
    domain: uni.domain,
    logo: null,
    cover: null,
    gallery: [],
    sources: [],
  };
  const used = new Set();
  const dir = path.join(UNI_DIR, uni.id);
  const referer = uni.domain ? `https://${uni.domain}/` : undefined;
  const nameTokens = [...tokens(uni.name)];
  const city = (uni.city || "").toLowerCase();

  const step = (msg) => flag("debug") && console.log(`  [debug] ${uni.name}: ${msg}`);
  const ov = OVERRIDES.universities?.[uni.id];
  let wd = null;
  let wiki = { photos: [], logo: null };
  let coverPick = null;
  let galleryPicks = [];

  if (ov?.cover) {
    step("override");
    const cb = await fetchImage(ov.cover, referer);
    if (cb) coverPick = { url: ov.cover, buf: cb };
    for (const g of ov.gallery || []) {
      if (galleryPicks.length >= 3) break;
      const gb = await fetchImage(g, referer);
      if (gb) galleryPicks.push({ url: g, buf: gb });
    }
  } else {
    step("wikidata/wiki");
    wd = await wikidataLookup(uni.name);
    wiki = await wikiCandidates(uni.name, uni.city);
    step(`wiki done photos=${wiki.photos.length}`);
    let wdImage = null;
    if (wd?.image) {
      const inf = await wikiFileUrls([wdFileUrl(wd.image)], 1600);
      wdImage = inf[0]?.url || null;
    }

    const site = uni.domain ? await siteMedia(uni.domain, nameTokens.slice(0, 2)) : [];
    step(`site done=${site.length}`);
    let commons = [];
    if (site.length < 5) {
      commons = await commonsSearch(
        `${uni.name} ${uni.city || ""} campus`,
        [nameTokens[0], city].filter((t) => t && t.length > 3),
        8,
      );
    }
    if (flag("debug")) {
      console.log(`  [debug] ${uni.name}: site=${site.length} commons=${commons.length} wiki=${wiki.photos.length}`);
    }

    const cityWord = (uni.city || "").toLowerCase().split(/\s+/)[0];
    const rank = (u) =>
      photoScore(u) + (cityWord.length > 3 && u.toLowerCase().includes(cityWord) ? 8 : 0);
    const photos = [...site, ...commons, ...wiki.photos, ...(wdImage ? [wdImage] : [])].sort(
      (a, b) => rank(b) - rank(a),
    );

    step(`picking cover from ${photos.length}`);
    const coverOk = await pickPhotos(photos, referer, 1, used);
    coverPick = coverOk[0];
    step(`cover=${coverPick?.url || "none"}, picking gallery`);
    galleryPicks = await pickPhotos(photos, referer, 3, used);
    step(`gallery=${galleryPicks.length}`);
  }

  if (coverPick) {
    await saveWebp(coverPick.buf, path.join(dir, "cover.webp"), 1600, 900, 84, "cover", "attention");
    result.cover = `/uploads/universities/${uni.id}/cover.webp`;
    result.sources.push(`cover:${coverPick.url}`);
  }
  for (let i = 0; i < galleryPicks.length; i++) {
    await saveWebp(galleryPicks[i].buf, path.join(dir, `gallery-${i + 1}.webp`), 1400, 900, 82, "cover", "attention");
    result.gallery.push(`/uploads/universities/${uni.id}/gallery-${i + 1}.webp`);
    result.sources.push(`gallery${i + 1}:${galleryPicks[i].url}`);
  }

  if (ov?.cover) {
    step("logo kept (override)");
  } else {
    step("picking logo");
    const logoCandidates = [];
    if (wd?.logo) {
      const inf = await wikiFileUrls([wdFileUrl(wd.logo)], 512);
      if (inf[0]) logoCandidates.push(inf[0].url);
    }
    if (wiki.logo) logoCandidates.push(wiki.logo);
    if (uni.domain) logoCandidates.push(await siteIcon(uni.domain));
    const logoPick = await pickLogo(logoCandidates, referer);
    if (logoPick) {
      await saveWebp(logoPick.buf, path.join(dir, "logo.webp"), 512, 512, 90, "contain");
      result.logo = `/uploads/universities/${uni.id}/logo.webp`;
      result.sources.push(`logo:${logoPick.url}`);
    }
  }

  const sets = [];
  const params = [];
  if (result.logo) {
    sets.push("logo_url=?");
    params.push(result.logo);
  }
  if (result.cover) {
    sets.push("banner_url=?");
    params.push(result.cover);
  }
  if (sets.length) {
    params.push(uni.id);
    await conn.query(`UPDATE universities SET ${sets.join(",")} WHERE id=?`, params);
    await conn.query(
      `INSERT INTO university_profiles (university_id, logo_path, banner_path, active_students)
       VALUES (?,?,?,0)
       ON DUPLICATE KEY UPDATE
         logo_path=COALESCE(VALUES(logo_path), logo_path),
         banner_path=COALESCE(VALUES(banner_path), banner_path)`,
      [
        uni.id,
        result.logo ? path.join(dir, "logo.webp") : null,
        result.cover ? path.join(dir, "cover.webp") : null,
      ],
    );
  }

  if (result.gallery.length >= 2) {
    const all = [result.cover, ...result.gallery].filter(Boolean);
    await conn.query("DELETE FROM university_images WHERE university_id=?", [uni.id]);
    const captions = ["Main Campus", "Campus View", "Academic Block", "Student Life"];
    for (let i = 0; i < all.length; i++) {
      await conn.query(
        `INSERT INTO university_images (id, university_id, image_url, caption, created_at)
         VALUES (?,?,?,?,DATE_ADD(NOW(), INTERVAL ? SECOND))`,
        [randomUUID(), uni.id, all[i], captions[i] || "Campus", all.length - i],
      );
    }
  }

  return result;
}

async function syncCampus(conn, campus) {
  const result = {
    kind: "campus",
    id: campus.id,
    name: campus.name,
    city: campus.city,
    university: campus.university_name,
    cover: null,
    gallery: [],
    sources: [],
  };
  const dir = path.join(CAMPUS_DIR, campus.id);
  const ov = OVERRIDES.campuses?.[campus.id];
  let picks = [];

  if (ov?.cover) {
    const cb = await fetchImage(ov.cover);
    if (cb) picks.push({ url: ov.cover, buf: cb });
    for (const g of ov.gallery || []) {
      if (picks.length >= 4) break;
      const gb = await fetchImage(g);
      if (gb) picks.push({ url: g, buf: gb });
    }
  } else {
    const used = new Set();
    const localName = campus.name.split(/[–—?|]/).pop();
    const localWords = [...tokens(localName)].filter((t) => t !== "campus" && t.length > 2);
    const cityWords = (campus.city || "")
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2);

    const candidates = [];
    if (campus.domain) {
      candidates.push(...(await siteMedia(campus.domain, [...localWords, ...cityWords])));
    }
    const commons = await commonsSearch(
      `${campus.name} ${campus.city || ""} ${campus.university_name}`,
      [...localWords, ...cityWords],
      10,
    );
    candidates.push(...commons);

    const isLocal = (u) => localWords.some((w) => u.toLowerCase().includes(w));
    const isCity = (u) => cityWords.some((w) => u.toLowerCase().includes(w));
    const specific = [...new Set(candidates)].filter((u) => isLocal(u) || isCity(u));
    picks = await pickPhotos(
      specific.sort(
        (a, b) => (isLocal(b) ? 10 : 0) + (isCity(b) ? 5 : 0) + photoScore(b) -
          ((isLocal(a) ? 10 : 0) + (isCity(a) ? 5 : 0) + photoScore(a)),
      ),
      undefined,
      4,
      used,
      360,
    );
  }
  if (!picks.length) return result;

  const [coverQ, galleryQ, pos] = ov?.cover ? [84, 82, "attention"] : [82, 80, "centre"];
  await saveWebp(picks[0].buf, path.join(dir, "cover.webp"), 1600, 900, coverQ, "cover", pos);
  result.cover = `/uploads/campuses/${campus.id}/cover.webp`;
  result.sources.push(`cover:${picks[0].url}`);
  for (let i = 1; i < picks.length; i++) {
    await saveWebp(picks[i].buf, path.join(dir, `gallery-${i}.webp`), 1400, 900, galleryQ, "cover", pos);
    result.gallery.push(`/uploads/campuses/${campus.id}/gallery-${i}.webp`);
    result.sources.push(`gallery${i}:${picks[i].url}`);
  }

  await conn.query("UPDATE campuses SET cover_image=? WHERE id=?", [result.cover, campus.id]);
  if (!(ov?.cover && !result.gallery.length)) {
    await conn.query("DELETE FROM campus_images WHERE campus_id=?", [campus.id]);
    const all = [result.cover, ...result.gallery];
    const captions = ["Main Campus", "Campus Building", "Academic Block", "Student Life"];
    for (let i = 0; i < all.length; i++) {
      await conn.query(
        `INSERT INTO campus_images (id, campus_id, image_url, caption, category, featured, created_at)
         VALUES (?,?,?,?,?,?,DATE_ADD(NOW(), INTERVAL ? SECOND))`,
        [
          randomUUID(),
          campus.id,
          all[i],
          captions[i] || "Campus",
          "Campus Building",
          i === 0 ? 1 : 0,
          all.length - i,
        ],
      );
    }
  }
  return result;
}

async function supplementGalleries(conn) {
  const [unis] = await conn.query(
    `SELECT u.id,u.name FROM universities u
     WHERE EXISTS (SELECT 1 FROM campuses c WHERE c.university_id=u.id)`,
  );
  for (const uni of unis) {
    const [existing] = await conn.query(
      "SELECT image_url FROM university_images WHERE university_id=?",
      [uni.id],
    );
    if (existing.length >= 4) continue;
    const [campusPhotos] = await conn.query(
      `SELECT ci.image_url FROM campus_images ci
       JOIN campuses c ON c.id = ci.campus_id
       WHERE c.university_id = ?
       ORDER BY ci.featured DESC, ci.created_at DESC LIMIT 12`,
      [uni.id],
    );
    const have = new Set(existing.map((r) => r.image_url));
    let added = 0;
    for (const photo of campusPhotos) {
      if (existing.length + added >= 4) break;
      if (have.has(photo.image_url)) continue;
      const from = path.join(UPLOADS_DIR, photo.image_url.replace(/^\/uploads\//, ""));
      const name = `gallery-c${added + 1}.webp`;
      try {
        await fs.mkdir(path.join(UNI_DIR, uni.id), { recursive: true });
        await fs.copyFile(from, path.join(UNI_DIR, uni.id, name));
      } catch {
        continue;
      }
      const url = `/uploads/universities/${uni.id}/${name}`;
      await conn.query(
        `INSERT INTO university_images (id, university_id, image_url, caption, created_at)
         VALUES (?,?,?,?,DATE_ADD(NOW(), INTERVAL ? SECOND))`,
        [randomUUID(), uni.id, url, "Campus View", 10 - added],
      );
      have.add(url);
      added++;
    }
    if (added) console.log(`[gallery] ${uni.name} +${added} campus photos`);
  }
}

async function main() {
  const conn = await mysql.createConnection(DB);
  console.log("[db] connected");

  if (!flag("skip-sources")) await resolveSources(conn);
  if (flag("sources-only")) {
    await conn.end();
    return;
  }

  let log = [];
  if (!flag("fresh")) {
    try {
      log = JSON.parse(await fs.readFile(LOG_PATH, "utf8"));
    } catch {}
  }
  const done = new Set(log.map((r) => r.id));

  if (!flag("skip-universities")) {
    let [unis] = await conn.query(
      `SELECT u.id,u.name,u.city,u.domain FROM universities u ${
        flag("partner") ? "WHERE EXISTS (SELECT 1 FROM campuses c WHERE c.university_id=u.id)" : ""
      } ORDER BY u.name`,
    );
    if (ONLY) unis = unis.filter((u) => u.name.toLowerCase().includes(ONLY) || u.id === ONLY);
    if (!flag("force")) unis = unis.filter((u) => !done.has(u.id));
    if (LIMIT) unis = unis.slice(0, LIMIT);
    for (let i = 0; i < unis.length; i++) {
      const uni = unis[i];
      try {
        const r = await syncUniversity(conn, uni);
        log.push(r);
        const status = [r.logo && "logo", r.cover && "cover", r.gallery.length && `${r.gallery.length}g`]
          .filter(Boolean)
          .join(",");
        console.log(`[uni ${i + 1}/${unis.length}] ${uni.name} -> ${status || "NONE"} (${uni.domain || "no-domain"})`);
      } catch (e) {
        console.log(`[uni ${i + 1}/${unis.length}] ${uni.name} -> ERROR ${e.message}`);
      }
      await fs.writeFile(LOG_PATH, JSON.stringify(log, null, 2));
    }
  }

  if (!flag("skip-campuses")) {
    let [campuses] = await conn.query(
      `SELECT c.id,c.university_id,c.name,c.city,u.name AS university_name,u.domain
       FROM campuses c LEFT JOIN universities u ON u.id=c.university_id
       ORDER BY u.name, c.name`,
    );
    if (flag("partner")) {
      const [ids] = await conn.query("SELECT DISTINCT university_id FROM campuses");
      const set = new Set(ids.map((r) => r.university_id));
      campuses = campuses.filter((c) => set.has(c.university_id));
    }
    if (ONLY) {
      campuses = campuses.filter(
        (c) => c.university_name?.toLowerCase().includes(ONLY) || c.id === ONLY,
      );
    }
    for (let j = 0; j < campuses.length; j++) {
      const c = campuses[j];
      try {
        const r = await syncCampus(conn, c);
        log.push(r);
        console.log(
          `[campus ${j + 1}/${campuses.length}] ${c.university_name} - ${c.name} -> ${
            r.cover ? `cover+${r.gallery.length}g` : "NONE"
          }`,
        );
      } catch (e) {
        console.log(`[campus ${j + 1}/${campuses.length}] ${c.name} -> ERROR ${e.message}`);
      }
      await fs.writeFile(LOG_PATH, JSON.stringify(log, null, 2));
    }
  }

  if (flag("supplement-galleries")) await supplementGalleries(conn);

  const unis = log.filter((r) => r.kind === "university");
  const camps = log.filter((r) => r.kind === "campus");
  console.log(
    `[done] universities=${unis.length} cover=${unis.filter((r) => r.cover).length} logo=${unis.filter((r) => r.logo).length} | campuses=${camps.length} cover=${camps.filter((r) => r.cover).length}`,
  );
  await conn.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
