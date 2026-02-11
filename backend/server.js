// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { startScheduler } = require('./jobs/EmailScheduler');

const app = express();

/* -------------------- CORS CONFIG -------------------- */

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173'
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    if (
      process.env.NODE_ENV !== 'production' &&
      origin.includes('localhost')
    ) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

/* -------------------- MIDDLEWARE -------------------- */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
  });
}

/* -------------------- DATABASE -------------------- */

const connectDB = async () => {
  try {
    let mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      throw new Error('MONGO_URI is not set');
    }

    if (process.env.MONGO_DB_NAME) {
      const dbName = process.env.MONGO_DB_NAME;
      const match = mongoUri.match(/^(mongodb(\+srv)?:\/\/[^\/]+)(\/[^?]*)?(.*)$/);

      if (match) {
        const [, base, , , query] = match;
        mongoUri = `${base}/${dbName}${query || ''}`;
      }
    }

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      retryWrites: true
    });

    console.log('✓ MongoDB connected');
    console.log(`✓ Database: ${mongoose.connection.name}`);

    startScheduler();
  } catch (err) {
    console.error('✗ MongoDB connection failed:', err.message);

    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }

    console.warn('⚠️ Server running without DB connection (production)');
  }
};

connectDB();

/* -------------------- ROUTES -------------------- */

app.use('/api/auth', require('./routes/AuthRoute'));
app.use('/api/invoices', require('./routes/InvoiceRoute'));
app.use('/api/clients', require('./routes/ClientRoute'));
app.use('/api/reminders', require('./routes/ReminderRoute'));
app.use('/api/test-email', require('./tests/emailRoutes'));

/* -------------------- HEALTH CHECK -------------------- */

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    dbConnected: mongoose.connection.readyState === 1,
    timestamp: new Date().toISOString()
  });
});

/* -------------------- ERROR HANDLING -------------------- */

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, _req, res, _next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

/* -------------------- SERVER -------------------- */

const PORT = process.env.PORT || 5002;

app.listen(PORT, () => {
  console.log('✓ Server started');
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✓ Listening on port ${PORT}`);
  console.log(`✓ Allowed frontend: ${process.env.FRONTEND_URL || 'local only'}`);
});
