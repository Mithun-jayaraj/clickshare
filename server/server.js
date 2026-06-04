import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import 'dotenv/config';

import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import urlRoutes from './routes/urlRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import { redirectUrl } from './controllers/urlController.js';
import errorHandler from './middleware/errorHandler.js';

// ─── Startup Environment Validation ──────────────────────────
const REQUIRED_ENV = ['MONGO_URI', 'JWT_SECRET'];
REQUIRED_ENV.forEach((key) => {
  if (!process.env[key]) {
    console.error(`❌ FATAL: Missing required environment variable: ${key}`);
    process.exit(1);
  }
});

// ─── Connect to MongoDB ───────────────────────────────────────
connectDB();

const app = express();

// ─── Trust proxy (REQUIRED for Render / any reverse proxy) ───
// Without this, express-rate-limit uses the proxy's IP, rate-limiting everyone globally.
app.set('trust proxy', 1);

// ─── Security Middlewares ─────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// ─── CORS Configuration ───────────────────────────────────────
// Supports: localhost, any *.vercel.app preview, and the CLIENT_URL env var
// CLIENT_URL can be a comma-separated list of allowed origins
const buildAllowedOrigins = () => {
  const origins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:4173', // vite preview
  ];
  if (process.env.CLIENT_URL) {
    process.env.CLIENT_URL
      .split(',')
      .map((u) => u.trim().replace(/\/$/, ''))
      .filter(Boolean)
      .forEach((u) => origins.push(u));
  }
  return origins;
};

const allowedOrigins = buildAllowedOrigins();

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (Postman, curl, mobile apps)
    if (!origin) return callback(null, true);

    const normalized = origin.replace(/\/$/, '');
    const allowed =
      allowedOrigins.includes(normalized) ||
      normalized.endsWith('.vercel.app') ||
      normalized.endsWith('.onrender.com') ||
      /^http:\/\/localhost(:\d+)?$/.test(normalized);

    if (allowed) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked origin: ${origin}`);
      callback(new Error(`CORS: Origin "${origin}" is not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Rate Limiting ────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many auth attempts. Please try again later.' },
});

app.use(globalLimiter);

// ─── Path Normalization Middleware ───────────────────────────
// Normalizes multiple leading slashes in URL path (e.g. //mofcvr -> /mofcvr)
app.use((req, res, next) => {
  if (req.url.startsWith('//')) {
    req.url = req.url.replace(/^\/+/, '/');
  }
  next();
});

// ─── Body Parsers ─────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Root Route (fixes "Cannot GET /" on Render) ─────────────
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ClickSphere API is running ✅',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// ─── Health Check ─────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ClickSphere API is healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ───────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/urls', urlRoutes);
app.use('/api/analytics', analyticsRoutes);

// ─── Short URL Redirect (must be AFTER /api routes) ──────────
// This catches /:shortCode — put it last so it doesn't shadow API paths
app.get('/:shortCode', redirectUrl);

// ─── 404 Handler for Unknown API Routes ──────────────────────
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: 'API endpoint not found.' });
});

// ─── Global Error Handler ─────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 ClickSphere server running on port ${PORT}`);
  console.log(`   Environment : ${process.env.NODE_ENV || 'development'}`);
  console.log(`   CORS origins: ${allowedOrigins.join(', ')} + *.vercel.app`);
});
