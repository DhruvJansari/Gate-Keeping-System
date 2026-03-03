-- ============================================
-- Migration 018
-- Add contract_from_date to contracts
-- Add driver_id to logistic_entries
-- Add FK constraint to drivers table
-- ============================================

-- --------------------------------------------
-- 1. Add contract_from_date to contracts
-- --------------------------------------------
ALTER TABLE contracts
ADD COLUMN contract_from_date DATE NULL AFTER contract_due_date;


-- --------------------------------------------
-- 2. Add driver_id to logistic_entries
-- --------------------------------------------
ALTER TABLE logistic_entries
ADD COLUMN driver_id INT NULL AFTER truck_no;


-- --------------------------------------------
-- 3. Add Foreign Key constraint
-- --------------------------------------------
ALTER TABLE logistic_entries
ADD CONSTRAINT fk_logistic_driver
FOREIGN KEY (driver_id)
REFERENCES drivers(driver_id)
ON DELETE SET NULL;