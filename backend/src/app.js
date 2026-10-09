// src/app.js
// defines Express application, sets up middleware, and defines a health check route that queries the database for the current time to verify connectivity

const express = require('express');
const cors = require('cors');
const pool = require('./config/db'); // shared connection pool from db.js for executing queries
const authRoutes = require('./routes/auth');
const clubsRoutes = require('./routes/clubs');
const usersRoutes = require('./routes/users');
const path = require('path'); 

const app = express();

app.use(cors());            // allows frontend to make requests to this API from different origin (cross-origin requests)
app.use(express.json());    // parses incoming JSON requests and puts into in req.body

app.use('/auth', authRoutes);
app.use('/clubs', clubsRoutes);
app.use('/users', usersRoutes);

app.get('/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'ok', dbTime: result.rows[0].now });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Database connection failed' });
  }
});

app.get('/verified', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/verified.html'));
});

// error handler (must stay last): answers malformed JSON and any unhandled error
// with a JSON error instead of Express's default HTML page, which includes a
// stack trace and server file paths
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Request body must be valid JSON' });
  }

  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request body is too large' });
  }

  const status = err.status || err.statusCode || 500;
  if (status < 500) {
    return res.status(status).json({ error: err.expose ? err.message : 'Bad request' });
  }

  console.error(err);
  return res.status(500).json({ error: 'Something went wrong on the server' });
});

module.exports = app;   // export the configured app so server.js can start it