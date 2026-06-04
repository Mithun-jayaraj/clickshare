import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import 'dotenv/config';

import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import urlRoutes from './routes/urlRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import workspaceRoutes from './routes/workspaceRoutes.js';
import { redirectUrl } from './controllers/urlController.js';
import errorHandler from './middleware/errorHandler.js';

// Startup environment validation
const REQUIRED_ENV = ['MONGO_URI', 'JWT_SECRET'];
REQUIRED_ENV.forEach((key) => {
  if (!process.env[key]) {
    console.error(`❌ Critical Error: Environment variable '${key}' is missing!`);
    process.exit(1);
  }
});

// Connect to MongoDB
connectDB();

const app = express();

// Trust proxy for Render/Vercel (important for express-rate-limit)
app.set('trust proxy', 1);

// Security middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// Setup allowed CORS origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
];
if (process.env.CLIENT_URL) {
  const urls = process.env.CLIENT_URL.split(',').map(url => url.trim().replace(/\/$/, ''));
  allowedOrigins.push(...urls);
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or Postman)
    if (!origin) return callback(null, true);

    const normalizedOrigin = origin.replace(/\/$/, '');
    const isAllowed = allowedOrigins.includes(normalizedOrigin) || 
                      normalizedOrigin.endsWith('.vercel.app') || 
                      /^http:\/\/localhost(:\d+)?$/.test(normalizedOrigin);

    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`[CORS Blocked] Request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { success: false, message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many auth attempts. Please try again later.' },
});

app.use(limiter);

// Body parsers
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// Root route (friendly health check and welcome)
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the ClickSphere API. Everything is running smoothly!',
    status: 'healthy',
    timestamp: new Date()
  });
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'ClickSphere API is running.', timestamp: new Date() });
});

// API routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/urls', urlRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/workspaces', workspaceRoutes);

// Public short URL redirect (must come last before error handler)
app.get('/:shortCode', redirectUrl);

// 404 for unknown API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: 'API endpoint not found.' });
});

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 ClickSphere server running on http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
});
