-- Migration: Add password and phoneVerified columns to users table
-- Run this migration against your PostgreSQL database

-- Add password column (move password storage from phone field to dedicated column)
ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT;

-- Add phoneVerified column for OTP verification status
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;

-- Make phone column unique (for phone-based login)
-- Note: This may fail if there are duplicate phone numbers. Clean up duplicates first if needed.
-- ALTER TABLE users ADD CONSTRAINT users_phone_unique UNIQUE (phone);

-- Optional: Migrate existing passwords from phone field to password field
-- This should be run manually if you have existing users with passwords stored in phone field
-- UPDATE users SET password = phone WHERE password IS NULL AND phone LIKE '$2%';
-- Then clear the phone field for those records
-- UPDATE users SET phone = NULL WHERE phone LIKE '$2%';
