/**
 * Nexus AI — Backend Core Server
 * 
 * Express application bootstrap orchestrator. Coordinates configurations,
 * database links, global middlewares, core router endpoints, 404 boundaries,
 * and unified error catches.
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import noteRoutes from './routes/noteRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';

// 1. Load active configurations and validate env keys
dotenv.config();

const REQUIRED_ENV_KEYS = ['MONGO_URI', 'JWT_SECRET'];
const missingKeys = REQUIRED_ENV_KEYS.filter(key => !process.env[key]);
if (missingKeys.length > 0) {
  console.error(`\x1b[31m%s\x1b[0m`, `[CRITICAL ENV ERROR] Missing required environment variables: ${missingKeys.join(', ')}`);
  process.exit(1);
}

// 2. Establish connections to MongoDB
connectDB();

const app = express();

// 3. Mount core middleware utilities
// Production-safe CORS allowlist with optional ALLOWED_ORIGINS overrides.
const defaultAllowedOrigins = [
  'https://nexus-ai-mu-one.vercel.app',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim()).filter(Boolean)
  : defaultAllowedOrigins;

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (Postman, curl, local tools, same-origin)
    if (!origin) return callback(null, true);

    // Friendly development check: allow localhost and 127.0.0.1 on any port
    const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

    const isVercelPreview = /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin);

    if (isLocalhost || isVercelPreview || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Deny other unauthorized origins safely without crashing
    const corsError = new Error(`Origin ${origin} is blocked by CORS policy.`);
    console.warn(`[CORS Blocked] Origin: ${origin}`);
    return callback(corsError, false);
  },
  credentials: true
}));

app.use(express.json()); // Allow parsing of application/json request bodies

// 4. Mount core routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/analytics', analyticsRoutes);

// Base sanity checks route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Nexus AI Portal API Node is online and operational',
    version: '1.0.0',
    telemetry: 'Neural link synchronized',
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    service: 'nexus-ai-backend',
    timestamp: new Date().toISOString(),
  });
});

// 5. Catch-All Route 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Resource not found: cannot find target endpoint [${req.method}] ${req.originalUrl}`,
  });
});

// 6. Centralized Error Handling Interceptor (500 boundary)
app.use((err, req, res, next) => {
  console.error(`\x1b[31m%s\x1b[0m`, `[Unified Error Interceptor] Capture Exception: ${err.message}`);
  if (err.stack) {
    console.error(err.stack);
  }

  const statusCode = err.status || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Central server encountered an unexpected code execution failure',
  });
});

// 7. Initialize listener
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(
    `\x1b[35m%s\x1b[0m`,
    `[Portal Status] Nexus AI Server running in ${process.env.NODE_ENV || 'production'} mode on port ${PORT}`
  );
});
