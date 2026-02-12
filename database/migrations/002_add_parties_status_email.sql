-- Add status and email columns to parties table (for existing databases)
-- Run: mysql -u root -p gatekeeping_db < database/migrations/002_add_parties_status_email.sql
ALTER TABLE parties ADD COLUMN email VARCHAR(255) AFTER party_name;
ALTER TABLE parties ADD COLUMN status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active' AFTER contact_phone;
ALTER TABLE parties ADD INDEX idx_parties_status (status);
