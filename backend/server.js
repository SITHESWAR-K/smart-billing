const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { initDatabase } = require('./database/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize database
initDatabase();

// Routes
app.use('/api/health', require('./routes/health'));
app.use('/api/shops', require('./routes/shops'));
app.use('/api/shopkeepers', require('./routes/shopkeepers'));
app.use('/api/bills', require('./routes/bills'));
app.use('/api/products', require('./routes/products'));
app.use('/api/voice', require('./routes/voice'));
app.use('/api/daily-codes', require('./routes/dailyCodes'));

// Main health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Smart Billing Backend is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found'
  });
});

app.listen(PORT, () => {
  console.log(`Smart Billing Backend running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
