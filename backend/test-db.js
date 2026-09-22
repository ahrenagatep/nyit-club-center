// test-db.js (temporary ,, used to verify pg Pool can connect to the database and execute a simple query)

const pool = require('./src/config/db');

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Connection failed:', err);
  } else {
    console.log('Connected! Server time:', res.rows[0]);
  }
  pool.end(); // close pool's connections after query so script can exit cleanly
});