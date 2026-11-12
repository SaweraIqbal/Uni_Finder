import { v4 as uuidv4 } from "uuid";
import db, { dbReady } from "../shared/db.js";

const UNIVERSITY_ID = "c0bd39b1-db6a-445d-b64a-393edc9e2cb0";
const CAMPUS_ID = "40c84350-82fb-4e28-9cc2-3ebf25bfe50f";
const APPLY = process.argv.includes("--apply");

const programs = [
  {
    original: "BS Software Engineering",
    tuition: 102600,
    admission: 10000,
    card: 100,
    exam: 12600,
    enrollment: 19800,
    creditHours: 136,
  },
  {
    original: "BS Computer Science",
    tuition: 109650,
    admission: 10000,
    card: 100,
    exam: 9510,
    enrollment: 15840,
    creditHours: 136,
  },
  {
    original: "BS Cyber Security",
    tuition: 103320,
    admission: 10000,
    card: 100,
    exam: 11880,
    enrollment: 19800,
    creditHours: 136,
  },
  {
    original: "BS Data Science",
    tuition: 103320,
    admission: 10000,
    card: 100,
    exam: 11880,
    enrollment: 19800,
    creditHours: 136,
  },
  {
    original: "BS Artificial Intelligence",
    tuition: 102750,
    admission: 10000,
    card: 100,
    exam: 12090,
    enrollment: 20160,
    creditHours: 136,
  },
  {
    original: "BS Information Technology",
    tuition: 99570,
    admission: 10000,
    card: 100,
    exam: 13290,
    enrollment: 22140,
    creditHours: 136,
  },
  {
    original: "BS Computer Graphics & Visualization",
    tuition: 103410,
    admission: 10000,
    card: 100,
    exam: 10530,
    enrollment: 21060,
    creditHours: 130,
  },
];

const query = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
  });

const norm = (value) =>
  String(value ?? "").trim().replace(/\s+/g, " ").toLowerCase();

function makeDetails(program, existing = {}) {
  const fees = [
    { head: "Tuition Fee", amount: program.tuition, frequency: "Per Semester" },
    { head: "Admission Fee", amount: program.admission, frequency: "One Time" },
    { head: "Card Fee", amount: program.card, frequency: "One Time" },
    { head: "Exam Fee", amount: program.exam, frequency: "Per Semester" },
    { head: "Enrollment Fee", amount: program.enrollment, frequency: "Per Semester" },
  ];

  const firstSemesterTotal =
    program.tuition +
    program.admission +
    program.card +
    program.exam +
    program.enrollment;

  if (firstSemesterTotal !== 145100) {
    throw new Error(`Fee total mismatch: ${program.original}`);
  }

  return {
    ...existing,
    fees,
    totalSemesters: 8,
    creditHours: program.creditHours,
    firstSemesterTotal,
    feeSource: "https://riphah.edu.pk/admissions/fee-structure/",
    feeNote:
      "Tuition is based on the published first-semester credit-hour load. Later semester fees may vary.",
    deliveryMode: "On-Campus",
  };
}

function parseDetails(value) {
  if (!value) return {};
  const parsed = typeof value === "string" ? JSON.parse(value) : value;

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Invalid existing details JSON");
  }

  return parsed;
}

async function main() {
  await dbReady;

  console.log("Mode:", APPLY ? "APPLY" : "DRY RUN");

  const campuses = await query(
    "SELECT id, name, university_id FROM campuses WHERE id = ?",
    [CAMPUS_ID]
  );

  if (
    campuses.length !== 1 ||
    campuses[0].university_id !== UNIVERSITY_ID
  ) {
    throw new Error("QIE Campus or university ID mismatch");
  }

  console.log("Campus:", campuses[0].name);

  const masters = await query(
    `SELECT id, original_name, degree_type
     FROM programs
     WHERE university_id = ?`,
    [UNIVERSITY_ID]
  );

  const existingLinks = await query(
    `SELECT program_id, details, status
     FROM campus_programs
     WHERE campus_id = ?`,
    [CAMPUS_ID]
  );

  const linksByProgram = new Map(
    existingLinks.map((row) => [row.program_id, row])
  );

  const plan = [];

  for (const program of programs) {
    const matches = masters.filter(
      (master) =>
        norm(master.original_name) === norm(program.original) &&
        norm(master.degree_type) === "bs"
    );

    if (matches.length !== 1) {
      throw new Error(
        `${program.original}: expected exactly 1 BS master, found ${matches.length}. No writes performed.`
      );
    }

    const master = matches[0];
    const existing = linksByProgram.get(master.id);

    const details = makeDetails(
      program,
      existing ? parseDetails(existing.details) : {}
    );

    plan.push({
      program,
      programId: master.id,
      existing,
      details,
    });

    console.log(
      `${existing ? "UPDATE" : "INSERT"} ${program.original}` +
      ` | firstSemester=${details.firstSemesterTotal}` +
      ` | duration=4 Years`
    );
  }

  console.log("Total programs:", plan.length);
  console.log(
    "New campus links:",
    plan.filter((item) => !item.existing).length
  );
  console.log(
    "Existing campus links:",
    plan.filter((item) => item.existing).length
  );

  if (!APPLY) {
    console.log("DRY RUN complete. No database changes.");
    return;
  }

  await query("START TRANSACTION");

  try {
    for (const item of plan) {
      const json = JSON.stringify(item.details);

      if (item.existing) {
        await query(
          `UPDATE campus_programs
           SET duration = ?, details = ?, updated_at = NOW()
           WHERE campus_id = ? AND program_id = ?`,
          ["4 Years", json, CAMPUS_ID, item.programId]
        );
      } else {
        await query(
          `INSERT INTO campus_programs
           (id, campus_id, program_id, duration, details, status,
            created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, 'draft', NOW(), NOW())`,
          [
            uuidv4(),
            CAMPUS_ID,
            item.programId,
            "4 Years",
            json,
          ]
        );
      }
    }

    await query("COMMIT");
    console.log("SUCCESS: 7 QIE Campus programs processed.");
  } catch (error) {
    await query("ROLLBACK");
    throw error;
  }
}

main()
  .catch((error) => {
    console.error("FAILED:", error.message);
    process.exitCode = 1;
  })
  .finally(() => {
    db.end();
  });
