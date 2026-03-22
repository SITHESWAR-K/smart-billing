// Load dotenv only if .env file exists and not in production
try {
  require('dotenv').config();
} catch (e) {
  // Ignore if dotenv fails
}
const express = require('express');

const helmet = require('helmet');
const { initDatabase } = require('./database/supabase');

const app = express();
const PORT = process.env.X_ZOHO_CATALYST_LISTEN_PORT || 8080;

console.log('Starting Smart Billing API...');
console.log('PORT:', PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'SET' : 'MISSING');

// Security middleware
app.use(helmet());

// CORS configuration for production



app.use(express.json({ limit: '10mb' }));

// Initialize Supabase with error handling
try {
  initDatabase();
} catch (error) {
  console.error('Failed to initialize database:', error.message);
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'Smart Billing API',
    version: '1.0.0',
    status: 'running'
  });
});

// API Routes
app.use('/api/shops', require('./routes/shops.prod'));
app.use('/api/shopkeepers', require('./routes/shopkeepers.prod'));
app.use('/api/products', require('./routes/products.prod'));
app.use('/api/bills', require('./routes/bills.prod'));
app.use('/api/daily-codes', require('./routes/dailyCodes.prod'));
app.use('/api/ai-parse', require('./routes/ai-parse.prod'));

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
