// test-db.js (temporary — delete after testing)
const pool = require('./src/config/db');

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Connection failed:', err);
  } else {
    console.log('Connected! Server time:', res.rows[0]);
  }
  pool.end();
});