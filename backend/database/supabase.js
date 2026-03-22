const { createClient } = require('@supabase/supabase-js');

let supabase = null;

const initDatabase = () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials!');
    console.error('SUPABASE_URL:', supabaseUrl ? 'SET' : 'MISSING');
    console.error('SUPABASE_SERVICE_KEY:', supabaseKey ? 'SET' : 'MISSING');
    throw new Error('Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_KEY');
  }
  
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('Supabase database connected to:', supabaseUrl);
  return supabase;
};

const getDatabase = () => {
  if (!supabase) {
    initDatabase();
  }
  return supabase;
};

module.exports = {
  initDatabase,
  getDatabase
};
