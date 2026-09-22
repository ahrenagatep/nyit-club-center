// src/app.js
// defines Express application, sets up middleware, and defines a health check route that queries the database for the current time to verify connectivity

const express = require('express');
const cors = require('cors');
const pool = require('./config/db'); // shared connection pool from db.js for executing queries

const app = express();

app.use(cors());            // allows frontend to make requests to this API from different origin (cross-origin requests)
app.use(express.json());    // parses incoming JSON requests and puts into in req.body

app.get('/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'ok', dbTime: result.rows[0].now });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Database connection failed' });
  }
});

module.exports = app;   // export the configured app so server.js can start it