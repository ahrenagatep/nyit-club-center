// src/config/db.js

// sets up PostgreSQL connection pool using the 'pg' library and environment variables for configuration.
// !! routes that require database access imports this pool to execute queries instead of creating separate connections each time

// parses to a number instead of string to match frontend expectations
const { Pool, types } = require('pg');
require('dotenv').config();

types.setTypeParser(20, (val) => parseInt(val, 10));

// Pool manages set of reusable connections to the database instead of opening/closing a new connection for each query
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

module.exports = pool; // exports pool so other files can import run queries thru it