const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Allow multiple dev origins
const defaultOrigins = [
  'http://localhost:8080',
  'http://localhost:8081',
  'http://127.0.0.1:8080',
  'http://127.0.0.1:8081',
  'http://192.168.29.196:8080',
  'http://192.168.29.196:8081'
];
const allowedOrigins = (process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
  : defaultOrigins);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
}));
app.use(express.json());
// Global request logger for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Use environment variable for MongoDB URI, fallback to local test database
const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/test';
// Mongoose v8 uses modern MongoDB driver defaults; legacy options are deprecated
mongoose.connect(uri);
const connection = mongoose.connection;
connection.once('open', () => {
  // console.log("MongoDB database connection established successfully");
});

connection.on('error', (err) => {
  // console.error('MongoDB connection error:', err);
});

app.get('/', (req, res) => {
  res.send('Server is running!');
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!', timestamp: new Date().toISOString() });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/addresses', require('./routes/addresses'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/wishlist', require('./routes/wishlist'));

app.use('/api/farmers', require('./routes/farmers'));
app.use('/api/analytics', require('./routes/analytics'));

app.use('/api/admin', require('./routes/admin'));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const server = app.listen(port, () => {
  // console.log(`Server is running on port: ${port}`);
});

// Graceful shutdown for nodemon and OS signals to free the port cleanly
const shutdown = (signal) => {
  try {
    server.close(() => {
      process.exit(0);
    });
  } catch (err) {
    process.exit(1);
  }
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
// Nodemon uses SIGUSR2 on restart in many environments
process.once('SIGUSR2', () => {
  server.close(() => {
    process.kill(process.pid, 'SIGUSR2');
  });
});