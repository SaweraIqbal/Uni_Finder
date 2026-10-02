const mysql = require('D:\\sawera\\uni-finder\\src\\backend\\node_modules\\mysql2');
const conn = mysql.createConnection({ host:'127.0.0.1', user:'root', password:'', database:'uni_finder' });

// Get collation of programs.university_id and universities.id
conn.query(
  `SELECT TABLE_NAME, COLUMN_NAME, CHARACTER_SET_NAME, COLLATION_NAME
   FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME IN ('universities','programs')
     AND COLUMN_NAME IN ('id','university_id')
   ORDER BY TABLE_NAME, COLUMN_NAME`,
  (e, r) => {
    if (e) { console.log('ERR:', e.message); conn.end(); return; }
    console.log('COLLATIONS:');
    r.forEach(row => console.log(' ', row.TABLE_NAME+'.'+row.COLUMN_NAME, '->', row.COLLATION_NAME, '(charset:', row.CHARACTER_SET_NAME+')'));

    // Try with explicit COLLATE cast
    conn.query(
      "SELECT (SELECT COUNT(*) FROM programs p WHERE p.university_id COLLATE utf8mb4_unicode_ci = u.id AND p.status='approved') AS pc FROM universities u LIMIT 1",
      (e2, r2) => {
        if (e2) console.log('FAIL with unicode_ci cast:', e2.message);
        else    console.log('OK   with unicode_ci cast:', r2[0]);

        conn.query(
          "SELECT (SELECT COUNT(*) FROM programs p WHERE p.university_id COLLATE utf8mb4_general_ci = u.id COLLATE utf8mb4_general_ci AND p.status='approved') AS pc FROM universities u LIMIT 1",
          (e3, r3) => {
            if (e3) console.log('FAIL with both general_ci:', e3.message);
            else    console.log('OK   with both general_ci:', r3[0]);
            conn.end();
          }
        );
      }
    );
  }
);
