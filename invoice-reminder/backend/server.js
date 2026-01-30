// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { startScheduler } = require('./jobs/EmailScheduler');

const app = express();

// CORS - Allow all origins in development for easier debugging
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000'
    ];
    
    // In development, allow all localhost origins
    if (process.env.NODE_ENV !== 'production' && origin.includes('localhost')) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Stripe webhook - MUST be before express.json()
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }), require('./routes/stripe'));

// Request logging middleware (development only)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
  });
}

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
const connectDB = async () => {
  try {
    let mongoUri = process.env.MONGO_URI;
    
    if (!mongoUri) {
      throw new Error('MONGO_URI environment variable is not set');
    }
    
    // If MONGO_DB_NAME is set, replace the database name in the URI
    if (process.env.MONGO_DB_NAME) {
      // Replace the database name in the connection string
      // Format: mongodb://host:port/dbname?options
      const dbName = process.env.MONGO_DB_NAME;
      const uriMatch = mongoUri.match(/^(mongodb(\+srv)?:\/\/[^\/]+)\/([^?]*)(.*)$/);
      
      if (uriMatch) {
        const [, baseUri, , , queryString] = uriMatch;
        mongoUri = `${baseUri}/${dbName}${queryString || ''}`;
      } else {
        // If URI format is different, append database name
        mongoUri = mongoUri.endsWith('/') 
          ? `${mongoUri}${dbName}` 
          : `${mongoUri}/${dbName}`;
      }
    }
    
    await mongoose.connect(mongoUri);
    console.log('✓ MongoDB connected');
    console.log(`✓ Database: ${mongoose.connection.name}`);
  } catch (err) {
    console.error('✗ MongoDB connection error:', err.message);
    
    // Provide helpful error message for case sensitivity issues
    if (err.message.includes('already exists with different case')) {
      console.error('\n⚠️  Database case mismatch detected!');
      console.error('Existing database: "Invoice-reminder" (capital I)');
      console.error('Expected database: "invoice-reminder" (lowercase i)');
      console.error('\nSolution: Add this to your backend/.env file:');
      console.error('MONGO_DB_NAME=Invoice-reminder');
      console.error('\nThis will use the existing database with the correct case.\n');
    }
    
    process.exit(1);
  }
};

connectDB();

// Routes
app.use('/api/auth', require('./routes/AuthRoute'));
app.use('/api/invoices', require('./routes/InvoiceRoute'));
app.use('/api/clients', require('./routes/ClientRoute'));
app.use('/api/reminders', require('./routes/ReminderRoute'));
app.use('/api/stripe', require('./routes/stripe'));
app.use('/api/test-email', require('./tests/emailRoutes'));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start email scheduler
startScheduler();

// Start server
const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✓ CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`✓ API available at: http://localhost:${PORT}/api`);
});