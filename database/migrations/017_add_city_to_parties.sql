-- Migration 017: Add city column to parties table
-- This was applied via API route /api/migrations/add-party-city

ALTER TABLE parties
  ADD COLUMN IF NOT EXISTS city VARCHAR(150) NULL AFTER address;
