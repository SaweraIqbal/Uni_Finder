const mysql = require('D:\\sawera\\uni-finder\\src\\backend\\node_modules\\mysql2');
const conn = mysql.createConnection({ host:'127.0.0.1', user:'root', password:'', database:'uni_finder' });

conn.query('SHOW TABLES', (e, r) => {
  if (e) { console.log('SHOW TABLES error:', e.message); conn.end(); return; }
  const tables = r.map(row => Object.values(row)[0]);
  console.log('TABLES:', tables.join(', '));

  // Test the exact query adminListUniversities runs
  const sql = `
    SELECT u.id, u.name, u.hec_rank, u.university_type, u.oric_domain,
           u.campus_count, u.focal_person_name, u.focal_person_email, u.owner_uid,
           (SELECT COUNT(*) FROM programs p WHERE p.university_id = u.id AND p.status = 'approved') AS program_count,
           CASE
             WHEN u.owner_uid IS NOT NULL THEN 'claimed'
             WHEN EXISTS (
               SELECT 1 FROM applications a
               WHERE a.university_id COLLATE utf8mb4_general_ci = u.id
                 AND LOWER(a.status) IN ('pending','awaiting')
             ) THEN 'pending'
             ELSE 'unclaimed'
           END AS claim_state,
           up.established_year, up.logo_path, up.banner_path, up.active_students
         FROM universities u
         LEFT JOIN university_profiles up ON up.university_id COLLATE utf8mb4_general_ci = u.id COLLATE utf8mb4_general_ci
         WHERE u.is_hec_listed = 1
         ORDER BY u.hec_rank IS NULL, u.hec_rank, u.name
         LIMIT 2 OFFSET 0`;

  conn.query(sql, (e2, r2) => {
    if (e2) console.log('ADMIN QUERY ERROR:', e2.message, '| code:', e2.code);
    else console.log('ADMIN QUERY OK, rows:', r2.length, '| sample:', JSON.stringify(r2[0]));
    conn.end();
  });
});
