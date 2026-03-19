-- Migration: Add fields for Logistic Entry Refinements

ALTER TABLE logistic_entries 
ADD COLUMN transporter_name VARCHAR(255) DEFAULT NULL,
ADD COLUMN company_notes TEXT DEFAULT NULL,
ADD COLUMN final_notes TEXT DEFAULT NULL,
ADD COLUMN loss_gain DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN total_km DECIMAL(10,2) DEFAULT NULL;
