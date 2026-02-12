-- Add status column to items table (for existing databases)
-- Run: mysql -u root -p gatekeeping_db < database/migrations/001_add_items_status.sql
ALTER TABLE items ADD COLUMN status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active' AFTER description;
ALTER TABLE items ADD INDEX idx_items_status (status);
