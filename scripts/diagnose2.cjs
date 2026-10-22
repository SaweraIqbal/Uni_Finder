const mysql = require('D:\\sawera\\uni-finder\\src\\backend\\node_modules\\mysql2');
const conn = mysql.createConnection({ host:'127.0.0.1', user:'root', password:'', database:'uni_finder' });

// Test each sub-expression in isolation to find the one still colliding
const tests = [
  ['programs subquery alone',
   "SELECT (SELECT COUNT(*) FROM programs p WHERE p.university_id = u.id AND p.status='approved') AS pc FROM universities u LIMIT 1"],
  ['university_profiles LEFT JOIN',
   "SELECT up.established_year FROM universities u LEFT JOIN university_profiles up ON up.university_id COLLATE utf8mb4_general_ci = u.id COLLATE utf8mb4_general_ci LIMIT 1"],
  ['applications COLLATE subquery',
   "SELECT CASE WHEN EXISTS(SELECT 1 FROM applications a WHERE a.university_id COLLATE utf8mb4_general_ci = u.id AND LOWER(a.status)='pending') THEN 1 ELSE 0 END AS x FROM universities u LIMIT 1"],
  ['programs p.university_id = u.id collation check',
   "SELECT TABLE_NAME, COLUMN_NAME, COLLATION_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME IN ('universities','programs','university_profiles','applications') AND COLUMN_NAME IN ('id','university_id')"],
];

let i = 0;
function next() {
  if (i >= tests.length) { conn.end(); return; }
  const [label, sql] = tests[i++];
  conn.query(sql, (e, r) => {
    if (e) console.log('FAIL ['+label+']:', e.message);
    else   console.log('OK   ['+label+']:', JSON.stringify(r.slice(0,3)));
    next();
  });
}
next();
