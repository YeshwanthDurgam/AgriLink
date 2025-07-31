const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
  origin: 'http://localhost:8080',
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
}));
app.use(express.json());

// Use environment variable for MongoDB URI, fallback to local test database
const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/test';
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
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

app.listen(port, () => {
    // console.log(`Server is running on port: ${port}`);
}); 