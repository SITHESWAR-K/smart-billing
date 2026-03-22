const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('========================================');
console.log('Smart Billing Frontend Setup');
console.log('========================================\n');

const baseDir = __dirname;

// Run setup scripts in order
const scripts = [
  'setup_frontend.js',
  'setup_components.js',
  'setup_pages1.js',
  'setup_pages2.js'
];

scripts.forEach(script => {
  const scriptPath = path.join(baseDir, script);
  if (fs.existsSync(scriptPath)) {
    console.log(`\n>>> Running ${script}...`);
    console.log('----------------------------------------');
    require(scriptPath);
  } else {
    console.log(`Warning: ${script} not found`);
  }
});

console.log('\n========================================');
console.log('Setup Complete!');
console.log('========================================');
console.log('\nNext steps:');
console.log('1. cd frontend');
console.log('2. npm install');
console.log('3. npm run dev');
console.log('\nThe development server will start at http://localhost:5173');
