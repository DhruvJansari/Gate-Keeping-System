-- Migration 016: Add lr_no column to logistic_entries table
-- LR No = Lorry Receipt Number, assigned per logistic entry
-- This was applied via API route /api/migrations/add-lr-no

ALTER TABLE logistic_entries
  ADD COLUMN IF NOT EXISTS lr_no VARCHAR(20) NULL AFTER logistic_id;
