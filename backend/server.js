// server.js
// entry point for backend server
// imports Express app from app.js and starts the server on the specified port, defaulting to 3000 if not set in environment variables

require('dotenv').config();       // loads .env
const app = require('./src/app'); // imports Express app configured in app.js

const PORT = process.env.PORT || 3000;

// starts Express server and binds it to a specified port
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});