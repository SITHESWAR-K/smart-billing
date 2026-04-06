// Load dotenv only for non-production environments.
if (process.env.NODE_ENV !== 'production') {
  try {
    require('dotenv').config();
  } catch (e) {
    // Ignore if dotenv fails
  }
}

const express = require('express');
const helmet = require('helmet');
const { initDatabase } = require('./database/supabase');

const app = express();
const PORT =  process.env.X_ZOHO_CATALYST_LISTEN_PORT || 8080;

console.log('Starting Smart Billing API...');
console.log('PORT:', PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'SET' : 'MISSING');

// Security middleware
app.use(helmet());
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
app.use('/api/health', require('./routes/health'));
app.use('/api/shops', require('./routes/shops'));
app.use('/api/shopkeepers', require('./routes/shopkeepers'));
app.use('/api/products', require('./routes/products'));
app.use('/api/bills', require('./routes/bills'));
app.use('/api/daily-codes', require('./routes/dailyCodes'));
app.use('/api/ai-parse', require('./routes/ai-parse'));
app.use('/api/reports', require('./routes/reports'));

// Optional legacy route kept for compatibility
app.use('/api/voice', require('./routes/voice'));

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
