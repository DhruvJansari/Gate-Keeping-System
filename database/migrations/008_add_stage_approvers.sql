-- Migration 008: Add stage approver tracking
-- Run: mysql -u root -p gatekeeping_db < database/migrations/008_add_stage_approvers.sql
-- Date: 2026-02-09

-- Add confirmed_by columns for each stage
ALTER TABLE transactions
ADD COLUMN parking_confirmed_by INT AFTER parking_confirmed_at,
ADD COLUMN gate_in_confirmed_by INT AFTER gate_in_at,
ADD COLUMN gate_out_confirmed_by INT AFTER gate_out_at,
ADD COLUMN first_weigh_confirmed_by INT AFTER first_weigh_at,
ADD COLUMN second_weigh_confirmed_by INT AFTER second_weigh_at,
ADD COLUMN gate_pass_confirmed_by INT AFTER gate_pass_finalized_at,
ADD COLUMN campus_in_confirmed_by INT AFTER campus_in_at,
ADD COLUMN campus_out_confirmed_by INT AFTER campus_out_at;

-- Add foreign key constraints
ALTER TABLE transactions
ADD CONSTRAINT fk_parking_confirmed_by FOREIGN KEY (parking_confirmed_by) REFERENCES users(user_id),
ADD CONSTRAINT fk_gate_in_confirmed_by FOREIGN KEY (gate_in_confirmed_by) REFERENCES users(user_id),
ADD CONSTRAINT fk_gate_out_confirmed_by FOREIGN KEY (gate_out_confirmed_by) REFERENCES users(user_id),
ADD CONSTRAINT fk_first_weigh_confirmed_by FOREIGN KEY (first_weigh_confirmed_by) REFERENCES users(user_id),
ADD CONSTRAINT fk_second_weigh_confirmed_by FOREIGN KEY (second_weigh_confirmed_by) REFERENCES users(user_id),
ADD CONSTRAINT fk_gate_pass_confirmed_by FOREIGN KEY (gate_pass_confirmed_by) REFERENCES users(user_id),
ADD CONSTRAINT fk_campus_in_confirmed_by FOREIGN KEY (campus_in_confirmed_by) REFERENCES users(user_id),
ADD CONSTRAINT fk_campus_out_confirmed_by FOREIGN KEY (campus_out_confirmed_by) REFERENCES users(user_id);

-- Set created_by as parking_confirmed_by for existing records
UPDATE transactions 
SET parking_confirmed_by = created_by 
WHERE parking_confirmed_at IS NOT NULL AND parking_confirmed_by IS NULL;
