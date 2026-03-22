// Simple test server to debug Catalyst deployment
const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;

console.log('=== STARTUP DEBUG ===');
console.log('PORT:', PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'SET' : 'NOT SET');
console.log('SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? 'SET (length: ' + process.env.SUPABASE_SERVICE_KEY.length + ')' : 'NOT SET');
console.log('=====================');

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Simple test server' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Test server listening on 0.0.0.0:${PORT}`);
});
