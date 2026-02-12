-- Add new fields to transporters table (for existing databases)
-- Run: mysql -u root -p gatekeeping_db < database/migrations/003_add_transporters_fields.sql
ALTER TABLE transporters ADD COLUMN contact_person VARCHAR(150) AFTER name;
ALTER TABLE transporters ADD COLUMN email VARCHAR(255) AFTER contact_phone;
ALTER TABLE transporters ADD COLUMN service_type VARCHAR(50) AFTER email;
ALTER TABLE transporters ADD COLUMN notes TEXT AFTER service_type;
ALTER TABLE transporters ADD COLUMN status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active' AFTER notes;
ALTER TABLE transporters ADD INDEX idx_transporters_status (status);
