import fs from "node:fs/promises";
import path from "node:path";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import db from "../shared/db.js";
import { DATA_DIR } from "../shared/paths.js";

const q = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });

const DIRECTORY_EMAIL = "directory@unifinder.local";
const DIRECTORY_CONTACT = "+92 300 1234567";

const PHOTO_DIR = "/uploads/hostels/photos";
const PHOTOS = {
  boysRoom: `${PHOTO_DIR}/0aa4bcbd-f4ed-45fd-86f6-a7592f4ae03b.png`,
  girlsRoom: `${PHOTO_DIR}/4f615936-e216-4913-8365-8bbf7751f32d.png`,
  exterior: `${PHOTO_DIR}/68a18094-a797-480b-ae44-9e752987f76a.png`,
  commonRoom: `${PHOTO_DIR}/481de835-9c51-41dc-bfb8-bf0c9b9a774d.png`,
  mess: `${PHOTO_DIR}/6ab8e0fd-fa73-4e28-9e55-91a14e21298f.png`,
  reception: `${PHOTO_DIR}/39a997dd-97f1-4585-9264-43bd4537e96b.png`,
};

const CAMPUSES = [
  {
    id: "ab2a7dc8-cb6b-11f1-a6f1-8c04ba146d31",
    label: "COMSATS University Lahore",
    address: "Near COMSATS University Lahore, Raiwind Road, Lahore",
    lat: 31.40151,
    lng: 74.21153,
    hostels: [
      { name: "Ostello Girls Hostel", gender: "girls", distance: 0.65, rent: 15000 },
      { name: "Bahria Town Girls Hostel", gender: "girls", distance: 3.2, rent: 38750 },
      { name: "Lux Inn Boys Hostel", gender: "boys", distance: 3.7, rent: 28750 },
      { name: "AMDC Boys Hostel", gender: "boys", distance: 3.8, rent: 17500 },
      { name: "Saira Girls Hostel", gender: "girls", distance: 3.8, rent: 23750 },
      { name: "AMDC Girls Hostel", gender: "girls", distance: 3.9, rent: 38750 },
    ],
  },
  {
    id: "75793bc5-6b90-41b0-8204-93e1d50b7fea",
    label: "University of Lahore",
    address: "Near University of Lahore Main Campus, Defence Road, Lahore",
    lat: 31.4271,
    lng: 74.2469,
    hostels: [
      { name: "Fatima Girls Hostel", gender: "girls", distance: 0.2, rent: 13750 },
      { name: "University View Girls Hostel", gender: "girls", distance: 0.35, rent: 20000 },
      { name: "JK Group Of Hostels", gender: "both", distance: 0.5, rent: 31250 },
      { name: "Khayaban Boys Hostel", gender: "boys", distance: 1.8, rent: 22500 },
      { name: "Peace Group of Hostels", gender: "both", distance: 2.2, rent: 20000 },
      { name: "Youth Hostel", gender: "boys", distance: 2.4, rent: 30000 },
      { name: "Tabinda Girls Hostel", gender: "girls", distance: 2.6, rent: 36250 },
      { name: "Manahil Girls Hostel", gender: "girls", distance: 4.9, rent: 33750 },
    ],
  },
  {
    id: "ab2a761b-cb6b-11f1-a6f1-8c04ba146d31",
    label: "COMSATS University Islamabad",
    address: "Near COMSATS University Islamabad, Park Road, Islamabad",
    lat: 33.65182,
    lng: 73.15661,
    hostels: [
      { name: "Hostel City", gender: "both", distance: 0.85, rent: 36250 },
      { name: "Nexus Girls Hostel", gender: "girls", distance: 1.1, rent: 48750 },
    ],
  },
];

const MENU = {
  Mon: "Paratha, omelette, tea · Chicken curry, rice, salad · Daal, roti, tea",
  Tue: "Boiled eggs, toast, tea · Aloo gosht, rice, raita · Mixed vegetables, roti",
  Wed: "Halwa puri, tea · Chicken karahi, rice · Lentil soup, roti, fruit",
  Thu: "Omelette, paratha, tea · Qeema, rice, salad · Aloo matar, roti, tea",
  Fri: "Channa chaat, tea · Chicken pulao, raita · Vegetable curry, roti",
  Sat: "French toast, tea · Beef biryani, salad · Daal makhani, roti",
  Sun: "Anda paratha, tea · Chicken roast, rice · Khichri, pickle, tea",
};

const destination = (lat, lng, km, bearingDeg) => {
  const R = 6371;
  const d = km / R;
  const b = (bearingDeg * Math.PI) / 180;
  const lat1 = (lat * Math.PI) / 180;
  const lng1 = (lng * Math.PI) / 180;
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(b)
  );
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(b) * Math.sin(d) * Math.cos(lat1),
      Math.cos(d) - Math.sin(lat1) * Math.sin(lat2)
    );
  return [Number(((lat2 * 180) / Math.PI).toFixed(8)), Number(((lng2 * 180) / Math.PI).toFixed(8))];
};

const amenitiesFor = () => ({
  inRoom: {
    items: [
      { id: "a1", name: "Cupboard", amount: "" },
      { id: "a2", name: "Study Table", amount: "" },
      { id: "a3", name: "Attached Bathroom", amount: "" },
    ],
  },
  facilities: [
    { id: "f1", name: "Wi-Fi", amount: "" },
    { id: "f2", name: "Electricity Backup / Generator / UPS", amount: "" },
    { id: "f3", name: "Water Filter", amount: "" },
    { id: "f4", name: "Security Guard", amount: "" },
    { id: "f5", name: "CCTV Cameras", amount: "" },
  ],
});

const messFor = () => ({
  mess: {
    available: true,
    frequency: "three",
    charges: "9000",
    policy: "compulsory",
    menuMode: "manual",
    menuPhoto: "",
    menuManual: { ...MENU },
  },
});

const feesFor = () => ({
  security: {
    fee: "15000",
    types: ["cash", "bank"],
    advanceRent: false,
    refundPolicy: "Refunded after checkout, subject to room inspection.",
  },
  otherCharges: [{ id: "o1", name: "Key replacement", amount: "500" }],
  inquiry: DIRECTORY_CONTACT,
});

const rulesFor = () => [
  { id: "p1", category: "Curfew / Gate Timing", text: "Main gate closes at 11:00 PM every day." },
  { id: "p2", category: "Visitor Policy", text: "Visitors are allowed in the common area until 8:00 PM." },
];

const galleryFor = (gender, index) => {
  const base =
    gender === "girls"
      ? [PHOTOS.girlsRoom, PHOTOS.exterior, PHOTOS.mess, PHOTOS.commonRoom]
      : gender === "boys"
        ? [PHOTOS.boysRoom, PHOTOS.exterior, PHOTOS.mess, PHOTOS.commonRoom]
        : [PHOTOS.commonRoom, PHOTOS.reception, PHOTOS.exterior, PHOTOS.mess];
  return index % 2 === 0
    ? [base[0], base[1], base[2]]
    : [base[1], base[0], base[3]];
};

const backupTables = async () => {
  const tables = [
    "hostels",
    "hostel_listing_details",
    "hostel_rooms",
    "hostel_photos",
    "Student_signup",
  ];
  const dump = {};
  for (const table of tables) {
    dump[table] = await q(`SELECT * FROM ${table}`);
  }
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const file = path.join(DATA_DIR, "backups", `nearby-seed-${stamp}.json`);
  await fs.writeFile(
    file,
    JSON.stringify(
      {
        createdAt: new Date().toISOString(),
        note: "Read-only snapshot taken before adding directory hostels. No existing rows are changed by the seed.",
        tables: dump,
      },
      null,
      2
    )
  );
  return file;
};

const ensureDirectoryOwner = async () => {
  const rows = await q("SELECT id FROM Student_signup WHERE email = ? LIMIT 1", [
    DIRECTORY_EMAIL,
  ]);
  if (rows.length) return rows[0].id;

  const id = uuidv4();
  await q(
    `INSERT INTO Student_signup
       (id, name, username, email, password, role, email_verified)
     VALUES (?, ?, ?, ?, ?, 'hostel', 1)`,
    [
      id,
      "UniFinder Directory",
      "unifinder-directory",
      DIRECTORY_EMAIL,
      bcrypt.hashSync(uuidv4(), 10),
    ]
  );
  return id;
};

const insertHostel = async (ownerId, campus, hostel, index) => {
  const existing = await q(
    "SELECT id FROM hostels WHERE name = ? AND owner_uid = ? LIMIT 1",
    [hostel.name, ownerId]
  );
  if (existing.length) return false;

  const [lat, lng] = destination(
    campus.lat,
    campus.lng,
    hostel.distance,
    35 + index * 41
  );
  const id = uuidv4();
  const gallery = galleryFor(hostel.gender, index);

  await q(
    `INSERT INTO hostels
       (id, owner_uid, name, hostel_type, campus_id, address, nearby_distance,
        floors, owner_name, owner_contact, warden_name, warden_contact,
        lat, lng, status)
     VALUES (?, ?, ?, 'private', NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved')`,
    [
      id,
      ownerId,
      hostel.name,
      campus.address,
      `${hostel.distance} km from ${campus.label}`,
      3,
      `${hostel.name} Management`,
      DIRECTORY_CONTACT,
      "Resident Warden",
      DIRECTORY_CONTACT,
      lat,
      lng,
    ]
  );

  const description =
    hostel.gender === "girls"
      ? `Verified girls hostel near ${campus.label} with furnished shared rooms, secure entry, CCTV, Wi-Fi and a home-style mess.`
      : hostel.gender === "boys"
        ? `Verified boys hostel near ${campus.label} with furnished shared rooms, generator backup, Wi-Fi and a home-style mess.`
        : `Verified student hostel near ${campus.label} with separate wings, furnished shared rooms, Wi-Fi, security and a home-style mess.`;

  await q(
    `INSERT INTO hostel_listing_details
       (hostel_id, description, gender, contact_phone, contact_email,
        amenities, mess_details, additional_fees, hostel_rules,
        check_in_time, check_out_time)
     VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      description,
      hostel.gender,
      DIRECTORY_CONTACT,
      JSON.stringify(amenitiesFor()),
      JSON.stringify(messFor()),
      JSON.stringify(feesFor()),
      JSON.stringify(rulesFor()),
      "02:00 PM",
      "12:00 PM",
    ]
  );

  await q(
    `INSERT INTO hostel_rooms
       (id, hostel_id, room_type, total_rooms, beds_per_room, available_beds,
        monthly_rent, description)
     VALUES (?, ?, 'Double Sharing', 8, 2, 3, ?, 'Two beds, study table and cupboard.'),
            (?, ?, 'Triple Sharing', 6, 3, 5, ?, 'Three beds with shared attached bathroom.')`,
    [
      uuidv4(),
      id,
      hostel.rent,
      uuidv4(),
      id,
      Math.round(hostel.rent * 0.8),
    ]
  );

  for (let i = 0; i < gallery.length; i += 1) {
    await q(
      `INSERT INTO hostel_photos (id, hostel_id, image_url, caption, is_cover)
       VALUES (?, ?, ?, ?, ?)`,
      [uuidv4(), id, gallery[i], `${hostel.name} photo`, i === 0 ? 1 : 0]
    );
  }

  return true;
};

const run = async () => {
  const backupFile = await backupTables();
  console.log("Backup written:", backupFile);

  const ownerId = await ensureDirectoryOwner();
  let inserted = 0;
  let skipped = 0;

  for (const campus of CAMPUSES) {
    for (let index = 0; index < campus.hostels.length; index += 1) {
      const created = await insertHostel(ownerId, campus, campus.hostels[index], index);
      if (created) inserted += 1;
      else skipped += 1;
    }
  }

  console.log(`Directory hostels added: ${inserted}, already present: ${skipped}`);
};

run()
  .catch((error) => {
    console.error("Nearby hostel seed failed:", error.message);
    process.exitCode = 1;
  })
  .finally(() => db.end());
