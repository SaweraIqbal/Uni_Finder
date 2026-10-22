const mysql = require('mysql2');
const db = mysql.createConnection({ host:'127.0.0.1', user:'root', password:'', database:'uni_finder' });
db.connect(err => {
  if (err) { console.error('CONNECT FAILED:', err.message); process.exit(1); }

  db.query(
    "SELECT id, name, normalized_name, status, owner_uid FROM universities WHERE name LIKE '%University of Lahore%' OR normalized_name LIKE '%university of lahore%'",
    (err, rows) => {
      console.log('UOL rows in DB:');
      rows.forEach(r => console.log(' -', r.id, '|', r.name, '| normalized:', r.normalized_name, '| status:', r.status));
      db.end();
    }
  );
});
