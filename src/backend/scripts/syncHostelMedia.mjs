import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";
import sharp from "sharp";
import dotenv from "dotenv";
import { UPLOADS_DIR, DATA_DIR, BACKEND_ROOT } from "../shared/paths.js";

dotenv.config({ path: path.join(BACKEND_ROOT, ".env") });

const DB = {
  host: process.env.DB_HOST || "127.0.0.1",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "uni_finder",
};

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const PHOTO_DIR = path.join(UPLOADS_DIR, "hostels", "photos");
const CACHE_PATH = path.join(DATA_DIR, "hostel-media-cache.json");
const OVERRIDES_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "hostel-media-overrides.json",
);

const argv = process.argv.slice(2);
const flag = (k) => argv.includes(`--${k}`);

const overrides = JSON.parse(await fs.readFile(OVERRIDES_PATH, "utf8"));

let cache = {};
try {
  cache = JSON.parse(await fs.readFile(CACHE_PATH, "utf8"));
} catch {
  cache = {};
}

await fs.mkdir(PHOTO_DIR, { recursive: true });

const allUrls = new Set();
for (const entry of [...overrides.privateHostels, ...overrides.campusHostels]) {
  for (const url of entry.images || []) allUrls.add(url);
  if (entry.cover) allUrls.add(entry.cover);
}

async function ensureLocal(url) {
  const cached = cache[url];
  if (cached) {
    const abs = path.join(UPLOADS_DIR, cached.replace(/^\/uploads\//, ""));
    try {
      const stat = await fs.stat(abs);
      if (stat.size > 10000) return cached;
    } catch {
      // fall through and re-download
    }
  }

  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      Accept: "image/avif,image/webp,image/jpeg,image/png,*/*;q=0.8",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(90000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.startsWith("image/")) throw new Error(`not an image: ${contentType}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 10000) throw new Error(`too small: ${buf.length} bytes`);

  const processed = await sharp(buf)
    .rotate()
    .resize(1600, 1067, { fit: "cover", position: "centre" })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();

  const fileName = `${randomUUID()}.jpg`;
  await fs.writeFile(path.join(PHOTO_DIR, fileName), processed);
  const publicPath = `/uploads/hostels/photos/${fileName}`;
  cache[url] = publicPath;
  await fs.writeFile(CACHE_PATH, JSON.stringify(cache, null, 2));
  console.log(`downloaded ${fileName} <- ${url.slice(0, 90)}`);
  return publicPath;
}

console.log(`Preparing ${allUrls.size} unique images...`);
const localByUrl = new Map();
for (const url of allUrls) {
  try {
    localByUrl.set(url, await ensureLocal(url));
  } catch (e) {
    console.error(`FAILED ${url.slice(0, 100)} :: ${e.message}`);
  }
}

async function syncPrivateHostels(conn) {
  for (const entry of overrides.privateHostels) {
    const existing = (
      await conn.query(
        `SELECT id FROM hostel_photos WHERE hostel_id = ?
         ORDER BY is_cover DESC, created_at ASC`,
        [entry.id],
      )
    )[0];

    if (entry.preserveExisting) {
      const cover = localByUrl.get(entry.cover);
      if (!cover) {
        console.error(`SKIP ${entry.name}: cover download failed`);
        continue;
      }
      await conn.query(`UPDATE hostel_photos SET is_cover = 0 WHERE hostel_id = ?`, [entry.id]);
      await conn.query(
        `INSERT INTO hostel_photos (id, hostel_id, image_url, caption, is_cover)
         VALUES (?, ?, ?, NULL, 1)`,
        [randomUUID(), entry.id, cover],
      );
      console.log(`kept ${existing.length} existing photos + new cover for ${entry.name}`);
      continue;
    }

    const targets = entry.images.map((url) => localByUrl.get(url));
    if (targets.some((t) => !t)) {
      console.error(`SKIP ${entry.name}: some images failed to download`);
      continue;
    }

    for (let i = 0; i < targets.length; i++) {
      if (existing[i]) {
        await conn.query(
          `UPDATE hostel_photos SET image_url = ?, is_cover = ? WHERE id = ?`,
          [targets[i], i === 0 ? 1 : 0, existing[i].id],
        );
      } else {
        await conn.query(
          `INSERT INTO hostel_photos (id, hostel_id, image_url, caption, is_cover)
           VALUES (?, ?, ?, NULL, ?)`,
          [randomUUID(), entry.id, targets[i], i === 0 ? 1 : 0],
        );
      }
    }
    if (existing.length > targets.length) {
      const extra = existing.slice(targets.length).map((row) => row.id);
      await conn.query(
        `UPDATE hostel_photos SET is_cover = 0 WHERE id IN (${extra.map(() => "?").join(",")})`,
        extra,
      );
    }
    console.log(`synced ${targets.length} photos for ${entry.name}`);
  }
}

async function syncCampusHostels(conn) {
  for (const entry of overrides.campusHostels) {
    const existing = (
      await conn.query(
        `SELECT id FROM campus_hostel_photos WHERE hostel_id = ?
         ORDER BY is_cover DESC, sort_order ASC, created_at ASC`,
        [entry.id],
      )
    )[0];

    const targets = entry.images.map((url) => localByUrl.get(url));
    if (targets.some((t) => !t)) {
      console.error(`SKIP ${entry.name}: some images failed to download`);
      continue;
    }

    for (let i = 0; i < targets.length; i++) {
      if (existing[i]) {
        await conn.query(
          `UPDATE campus_hostel_photos
           SET image_url = ?, is_cover = ?, sort_order = ?
           WHERE id = ?`,
          [targets[i], i === 0 ? 1 : 0, i + 1, existing[i].id],
        );
      } else {
        await conn.query(
          `INSERT INTO campus_hostel_photos
             (id, hostel_id, image_url, caption, is_cover, sort_order)
           VALUES (?, ?, ?, NULL, ?, ?)`,
          [randomUUID(), entry.id, targets[i], i === 0 ? 1 : 0, i + 1],
        );
      }
    }
    if (existing.length > targets.length) {
      const extra = existing.slice(targets.length).map((row) => row.id);
      await conn.query(
        `UPDATE campus_hostel_photos SET is_cover = 0 WHERE id IN (${extra.map(() => "?").join(",")})`,
        extra,
      );
    }
    console.log(`synced ${targets.length} photos for ${entry.name}`);
  }
}

if (!flag("download-only")) {
  const conn = await mysql.createConnection(DB);
  try {
    await syncPrivateHostels(conn);
    await syncCampusHostels(conn);
  } finally {
    await conn.end();
  }
}

console.log("Done.");
