// Load environment variables from .env before anything else
require('dotenv').config();

const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const rateLimit = require('express-rate-limit');
const path      = require('path');
const db        = require('./db');

const app  = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ─── Security headers (Helmet) ───────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false,   // disabled — React handles its own CSP
  crossOriginEmbedderPolicy: false,
}));
app.disable('x-powered-by'); // hide Express fingerprint

// ─── CORS ────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow no-origin requests (mobile apps, Postman, same-origin)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: Origin "${origin}" hairuhusiwi.`));
  },
  credentials: true,
}));

// ─── Body parsing (with size limit) ─────────────────────────────────────────
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));

// ─── Rate limiting ───────────────────────────────────────────────────────────
// Global limit — 200 requests per minute per IP
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Maombi mengi sana. Jaribu tena baada ya dakika moja.' },
});

// Strict limit for login — 10 attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,  // don't count successful logins
  message: { error: 'Majaribio mengi ya kuingia. Jaribu tena baada ya dakika 15.' },
});

app.use(globalLimiter);
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/setup', loginLimiter);

// ─── Routes (mounted after DB is ready) ─────────────────────────────────────
db.init().then(() => {
  const authRouter     = require('./routes/auth');
  const settingsRouter = require('./routes/settings');
  const membersRouter  = require('./routes/members');
  const entriesRouter  = require('./routes/entries');
  const mikopoRouter   = require('./routes/mikopo');

  app.use('/api/auth',     authRouter);
  app.use('/api/settings', settingsRouter);
  app.use('/api/members',  membersRouter);
  app.use('/api/entries',  entriesRouter);
  app.use('/api/mikopo',   mikopoRouter);

  // ─── Serve React production build ─────────────────────────────────────────
  const distPath = path.join(__dirname, '..', 'client', 'dist');
  const fs = require('fs');
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    // SPA fallback — send index.html for any non-API route
    app.get(/^(?!\/api).*/, (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log(`   React app          →  served from ${distPath}`);
  }

  // Health check
  app.get('/api/health', (req, res) => res.json({
    status:  'ok',
    port:    PORT,
    origins: allowedOrigins,
    env:     NODE_ENV,
  }));

  // 404 fallback for unknown /api routes
  app.use('/api', (req, res) => res.status(404).json({ error: 'Njia haikupatikana.' }));

  // ─── Global error handler ──────────────────────────────────────────────────
  app.use((err, req, res, _next) => {
    console.error('Server error:', err.message);
    res.status(err.status || 500).json({
      error: NODE_ENV === 'production'
        ? 'Hitilafu ya ndani ya seva.'
        : err.message,
    });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n✓  Kikoba API server  →  http://localhost:${PORT}`);
    console.log(`   Allowed origins    →  ${allowedOrigins.join(', ')}`);
    console.log(`   Database           →  ${path.join(__dirname, 'kikoba.db')}`);
    console.log(`   Environment        →  ${NODE_ENV}\n`);
  });
}).catch(err => {
  console.error('✗  Imeshindwa kuanzisha hifadhidata:', err);
  process.exit(1);
});
