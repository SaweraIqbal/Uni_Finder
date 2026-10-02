#!/usr/bin/env python3
"""
build_program_catalog.py
Scans data/*.xlsx (all except hec_universities.xlsx), extracts (program, level)
using the shared scripts/degree_map.json rules, dedupes by (normalized_name, level),
writes data/program_catalog.json, and upserts into the program_catalog DB table.

Usage:
    python scripts/build_program_catalog.py

Requires: openpyxl, mysql-connector-python, python-dotenv
    pip install openpyxl mysql-connector-python python-dotenv
"""

import json
import os
import re
import sys
from pathlib import Path
from collections import defaultdict

# ── Optional DB upsert ────────────────────────────────────────────────────────
try:
    import mysql.connector
    from dotenv import load_dotenv
    HAS_DB = True
except ImportError:
    HAS_DB = False
    print("[catalog] mysql-connector or python-dotenv not installed — DB upsert skipped.")

try:
    import openpyxl
except ImportError:
    sys.exit("[catalog] ERROR: openpyxl not installed. Run: pip install openpyxl")


# ── Paths ─────────────────────────────────────────────────────────────────────
SCRIPT_DIR   = Path(__file__).resolve().parent
DATA_DIR     = SCRIPT_DIR.parent / "src" / "backend" / "data"
DEGREE_MAP   = SCRIPT_DIR / "degree_map.json"
OUTPUT_JSON  = DATA_DIR / "program_catalog.json"
ENV_FILE     = SCRIPT_DIR.parent / "src" / "backend" / ".env"

with open(DEGREE_MAP, encoding="utf-8") as f:
    dmap = json.load(f)

LEVEL_MAP    = dmap["levelFromSheetValue"]      # sheet value → canonical or "SPLIT"
PREFIX_LIST  = sorted(dmap["prefixMap"], key=lambda x: -len(x["prefix"]))  # longest first
TRACK_PAT    = dmap["trackPatterns"]
SPEC_PHRASES = dmap["specializationPhrases"]


# ── Normalization ─────────────────────────────────────────────────────────────

def normalize_name(text: str) -> str:
    """Lowercase, strip punctuation, collapse whitespace, and→&."""
    t = text.lower()
    t = t.replace("&", "and")
    t = re.sub(r"[^a-z0-9 ]", " ", t)
    t = re.sub(r"\s+", " ", t).strip()
    return t


def resolve_levels(sheet_level: str) -> list:
    """Map a sheet Level value to one or more canonical level strings."""
    val = sheet_level.strip()
    mapped = LEVEL_MAP.get(val)
    if not mapped:
        return [None]
    if mapped == "SPLIT":
        return ["MS", "MPhil"]
    return [mapped]


def extract_track(name: str):
    for pattern in TRACK_PAT:
        regex = re.compile(
            r"[\s\(\-–]*" + re.escape(pattern) + r"[\s\)]*$", re.IGNORECASE
        )
        if regex.search(name):
            track = pattern
            name = regex.sub("", name).strip()
            return name, track
    return name, None


def extract_specialization(name: str, spec_col: str):
    if spec_col and spec_col.strip():
        return name, spec_col.strip()
    for phrase in SPEC_PHRASES:
        idx = name.find(phrase)
        if idx != -1:
            spec = name[idx + len(phrase):].strip().strip("()")
            name = name[:idx].strip()
            return name, spec or None
    return name, None


def strip_prefix(raw: str, level):
    for entry in PREFIX_LIST:
        prefix = entry["prefix"]
        regex = re.compile(
            r"^" + re.escape(prefix) + r"[\s\(]?", re.IGNORECASE
        )
        m = regex.match(raw)
        if m:
            stripped = raw[m.end():].strip()
            display = stripped if stripped else raw
            return display, entry["degree_type"]
    level_hint = {
        "Undergraduate": "BS", "MS": "MS", "MPhil": "MPhil",
        "PhD": "PhD", "ADP": "ADP", "Diploma": "Diploma",
    }
    return raw, level_hint.get(level, "")


def parse_row(raw_name: str, sheet_level: str, spec_col: str):
    """Returns list of dicts: {name, normalized_name, level, degree_type, specialization, track}"""
    if not raw_name:
        return []
    levels = resolve_levels(sheet_level)
    results = []
    for level in levels:
        name_after_track, track = extract_track(raw_name)
        name_after_spec, specialization = extract_specialization(name_after_track, spec_col)
        display_name, degree_type = strip_prefix(name_after_spec, level or sheet_level)
        results.append({
            "name":            display_name or raw_name,
            "normalized_name": normalize_name(display_name or raw_name),
            "level":           level,
            "degree_type":     degree_type,
            "specialization":  specialization,
            "track":           track,
            "original_name":   raw_name,
        })
    return results


# ── Excel scanning ────────────────────────────────────────────────────────────

def scan_data_dir():
    """
    Returns: dict keyed by (normalized_name, level) →
      { name, level, university_names: set(), count }
    """
    catalog = defaultdict(lambda: {"name": "", "level": None, "university_names": set()})
    null_level_report = []

    for xlsx_path in sorted(DATA_DIR.glob("*.xlsx")):
        if xlsx_path.name.lower() == "hec_universities.xlsx":
            continue  # skip HEC master

        print(f"[catalog] Reading {xlsx_path.name} …")
        wb = openpyxl.load_workbook(xlsx_path, read_only=True, data_only=True)

        for ws in wb.worksheets:
            headers = {}
            for col_idx, cell in enumerate(next(ws.iter_rows(max_row=1), []), start=1):
                val = str(cell.value or "").strip().lower()
                if val:
                    headers[val] = col_idx - 1  # 0-based index

            name_idx = headers.get("program name")
            level_idx = headers.get("level")
            spec_idx  = headers.get("specialization")
            uni_idx   = headers.get("university name")

            if name_idx is None or level_idx is None:
                print(f"  [catalog] Sheet '{ws.title}' missing required columns — skipped.")
                continue

            rows_iter = ws.iter_rows(min_row=2, values_only=True)
            for row in rows_iter:
                def get(idx):
                    if idx is None or idx >= len(row):
                        return ""
                    return str(row[idx] or "").strip()

                raw_name   = get(name_idx)
                sheet_level = get(level_idx)
                spec_col   = get(spec_idx) if spec_idx is not None else ""
                uni_name   = get(uni_idx)  if uni_idx  is not None else ws.title

                if not raw_name:
                    continue

                parsed = parse_row(raw_name, sheet_level, spec_col)
                for prog in parsed:
                    if prog["level"] is None:
                        null_level_report.append({
                            "file": xlsx_path.name,
                            "sheet": ws.title,
                            "name": raw_name,
                            "sheet_level": sheet_level,
                        })

                    key = (prog["normalized_name"], prog["level"])
                    entry = catalog[key]
                    # Keep the shortest/cleanest display name
                    if not entry["name"] or len(prog["name"]) < len(entry["name"]):
                        entry["name"] = prog["name"]
                    entry["level"] = prog["level"]
                    entry["university_names"].add(uni_name)

        wb.close()

    return catalog, null_level_report


# ── DB upsert ─────────────────────────────────────────────────────────────────

def upsert_catalog(rows):
    if not HAS_DB:
        print("[catalog] DB upsert skipped (missing dependencies).")
        return

    load_dotenv(ENV_FILE)
    host     = os.getenv("DB_HOST", "127.0.0.1")
    user     = os.getenv("DB_USER", "root")
    password = os.getenv("DB_PASS", "")
    database = os.getenv("DB_NAME", "uni_finder")

    try:
        conn = mysql.connector.connect(
            host=host, user=user, password=password, database=database,
            charset="utf8mb4",
        )
        cursor = conn.cursor()
        upserted = 0
        for row in rows:
            cursor.execute(
                """
                INSERT INTO program_catalog (name, normalized_name, level, university_count)
                VALUES (%s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                  name             = VALUES(name),
                  university_count = VALUES(university_count),
                  updated_at       = NOW()
                """,
                (row["name"], row["normalized_name"], row["level"], row["university_count"]),
            )
            upserted += cursor.rowcount
        conn.commit()
        cursor.close()
        conn.close()
        print(f"[catalog] DB upsert complete: {upserted} rows affected.")
    except Exception as e:
        print(f"[catalog] DB upsert failed: {e}")


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print(f"[catalog] Scanning {DATA_DIR} …")
    catalog, null_level_report = scan_data_dir()

    # Build output rows
    output_rows = []
    for (norm_name, level), entry in sorted(catalog.items(), key=lambda x: x[0][0]):
        uni_count = len(entry["university_names"])
        output_rows.append({
            "name":             entry["name"],
            "normalized_name":  norm_name,
            "level":            level,
            "university_count": uni_count,
            "universities":     sorted(entry["university_names"]),
        })

    # Write JSON
    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(output_rows, f, ensure_ascii=False, indent=2)
    print(f"[catalog] Wrote {len(output_rows)} entries to {OUTPUT_JSON.name}")

    # Summary
    level_counts = defaultdict(int)
    for r in output_rows:
        level_counts[r["level"] or "NULL"] += 1

    print("\n── Summary ──────────────────────────")
    print(f"  Unique programs:  {len(output_rows)}")
    for lvl, cnt in sorted(level_counts.items()):
        print(f"  {lvl:15s}: {cnt}")

    # Top 10 most duplicated (offered by most universities)
    top = sorted(output_rows, key=lambda r: -r["university_count"])[:10]
    print("\n── Top 10 most widely offered ───────")
    for r in top:
        print(f"  {r['name']!r:45s} level={r['level']}  unis={r['university_count']}")

    if null_level_report:
        print(f"\n── {len(null_level_report)} unrecognized level values (stored as NULL) ──")
        for r in null_level_report[:20]:
            print(f"  {r['file']}|{r['sheet']}  name={r['name']!r}  level={r['sheet_level']!r}")
        if len(null_level_report) > 20:
            print(f"  … and {len(null_level_report)-20} more")

    # DB upsert
    upsert_catalog(output_rows)
    print("[catalog] Done.")


if __name__ == "__main__":
    main()
