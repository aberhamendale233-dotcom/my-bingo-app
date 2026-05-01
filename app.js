const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware ---
app.use(cors()); // Allows cross-origin requests
app.use(morgan('dev')); // Logs requests to the console
app.use(express.json()); // Parses incoming JSON requests
app.use(express.static('public')); // Serves static files from a 'public' folder

// --- Routes ---

// Health Check / Home Route
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is up and running!'
  });
});

// Example API Route
app.get('/api/v1/resource', (req, res) => {
  res.json({ data: "Your data goes here" });
});

// --- Error Handling ---

// 404 Catch-all
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong on the server' });
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
