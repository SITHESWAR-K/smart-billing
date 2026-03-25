-- Migration: convert shop_id from UUID to 6-character TEXT IDs in Supabase
-- Run this once in Supabase SQL Editor for existing projects.

BEGIN;

-- Drop dependent foreign key constraints first.
ALTER TABLE shopkeepers DROP CONSTRAINT IF EXISTS shopkeepers_shop_id_fkey;
ALTER TABLE daily_codes DROP CONSTRAINT IF EXISTS daily_codes_shop_id_fkey;
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_shop_id_fkey;
ALTER TABLE bills DROP CONSTRAINT IF EXISTS bills_shop_id_fkey;

-- Convert UUID columns to TEXT.
ALTER TABLE shops
  ALTER COLUMN shop_id TYPE TEXT USING shop_id::text;

ALTER TABLE shopkeepers
  ALTER COLUMN shop_id TYPE TEXT USING shop_id::text;

ALTER TABLE daily_codes
  ALTER COLUMN shop_id TYPE TEXT USING shop_id::text;

ALTER TABLE products
  ALTER COLUMN shop_id TYPE TEXT USING shop_id::text;

ALTER TABLE bills
  ALTER COLUMN shop_id TYPE TEXT USING shop_id::text;

-- Enforce 6-character shop ID format for new/updated rows.
ALTER TABLE shops DROP CONSTRAINT IF EXISTS shops_shop_id_check;
ALTER TABLE shops
  ADD CONSTRAINT shops_shop_id_check
  CHECK (shop_id ~* '^[A-HJ-NP-Z2-9]{6}$') NOT VALID;

-- Recreate foreign keys.
ALTER TABLE shopkeepers
  ADD CONSTRAINT shopkeepers_shop_id_fkey
  FOREIGN KEY (shop_id) REFERENCES shops(shop_id) ON DELETE CASCADE;

ALTER TABLE daily_codes
  ADD CONSTRAINT daily_codes_shop_id_fkey
  FOREIGN KEY (shop_id) REFERENCES shops(shop_id) ON DELETE CASCADE;

ALTER TABLE products
  ADD CONSTRAINT products_shop_id_fkey
  FOREIGN KEY (shop_id) REFERENCES shops(shop_id) ON DELETE CASCADE;

ALTER TABLE bills
  ADD CONSTRAINT bills_shop_id_fkey
  FOREIGN KEY (shop_id) REFERENCES shops(shop_id) ON DELETE CASCADE;

COMMIT;
