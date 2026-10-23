const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { connectDB } = require('./config/db');
const { getHealth } = require('./controllers/batchController');
const batchRoutes = require('./routes/batchRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

// 1. CORS Configuration for Vite Frontend
app.use(
  cors({
    origin: [FRONTEND_ORIGIN, 'http://127.0.0.1:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// 2. Request body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// 3. Request logger in development
if (process.env.NODE_ENV !== 'test') {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`[API] ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`);
    });
    next();
  });
}

// 4. Health Check Endpoint
app.get('/api/health', getHealth);

// 5. Batch & Metadata Routes
app.use('/api/batches', batchRoutes);

// 6. 404 Handler for undefined API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `API route '${req.originalUrl}' not found`,
    timestamp: new Date().toISOString(),
  });
});

// 7. Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('[Error]', err.stack || err.message);

  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal Server Error',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// Connect to MongoDB asynchronously (non-blocking)
connectDB();

let server = null;
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, () => {
    console.log(`[MediChain Backend] Server running on http://localhost:${PORT}`);
    console.log(`[MediChain Backend] Accepting requests from origin: ${FRONTEND_ORIGIN}`);
  });
}

module.exports = { app, server };
