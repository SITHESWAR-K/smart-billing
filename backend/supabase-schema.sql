-- Supabase SQL Schema for Smart Billing
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Shops table
CREATE TABLE IF NOT EXISTS shops (
  id SERIAL PRIMARY KEY,
  shop_id UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
  shop_name TEXT NOT NULL,
  shopkeeper_name TEXT NOT NULL,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shopkeepers table
CREATE TABLE IF NOT EXISTS shopkeepers (
  id SERIAL PRIMARY KEY,
  shop_id UUID NOT NULL REFERENCES shops(shop_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  pin_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('main', 'alternative')),
  pitch_signature TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily codes table
CREATE TABLE IF NOT EXISTS daily_codes (
  id SERIAL PRIMARY KEY,
  shop_id UUID NOT NULL REFERENCES shops(shop_id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  date DATE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  shop_id UUID NOT NULL REFERENCES shops(shop_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  synonyms JSONB DEFAULT '[]',
  quantity DECIMAL,
  price DECIMAL NOT NULL,
  brand TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bills table
CREATE TABLE IF NOT EXISTS bills (
  id SERIAL PRIMARY KEY,
  shop_id UUID NOT NULL REFERENCES shops(shop_id) ON DELETE CASCADE,
  items JSONB NOT NULL,
  total DECIMAL NOT NULL,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shopkeepers_shop_id ON shopkeepers(shop_id);
CREATE INDEX IF NOT EXISTS idx_products_shop_id ON products(shop_id);
CREATE INDEX IF NOT EXISTS idx_bills_shop_id ON bills(shop_id);
CREATE INDEX IF NOT EXISTS idx_daily_codes_shop_id_date ON daily_codes(shop_id, date);

-- Row Level Security (optional but recommended)
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopkeepers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_codes ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (you can make these more restrictive)
CREATE POLICY "Allow all operations on shops" ON shops FOR ALL USING (true);
CREATE POLICY "Allow all operations on shopkeepers" ON shopkeepers FOR ALL USING (true);
CREATE POLICY "Allow all operations on products" ON products FOR ALL USING (true);
CREATE POLICY "Allow all operations on bills" ON bills FOR ALL USING (true);
CREATE POLICY "Allow all operations on daily_codes" ON daily_codes FOR ALL USING (true);
