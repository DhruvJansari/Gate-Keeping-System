-- Migration 006: Add PAN number field to parties table
-- Run: mysql -u root -p gatekeeping_db < database/migrations/006_add_pan_to_parties.sql
-- Date: 2026-02-07

ALTER TABLE parties 
ADD COLUMN pan_no VARCHAR(10) DEFAULT NULL AFTER gst_no;
