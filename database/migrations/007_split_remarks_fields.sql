-- Migration 007: Split remarks into separate remark1 and remark2 fields
-- Run: mysql -u root -p gatekeeping_db < database/migrations/007_split_remarks_fields.sql
-- Date: 2026-02-07

-- Add new remark1 and remark2 columns
ALTER TABLE transactions 
ADD COLUMN remark1 TEXT AFTER mobile_number,
ADD COLUMN remark2 TEXT AFTER remark1;

-- Migrate existing data (split by ' | ' delimiter)
UPDATE transactions 
SET remark1 = SUBSTRING_INDEX(remarks, ' | ', 1),
    remark2 = IF(LOCATE(' | ', remarks) > 0, 
                 SUBSTRING_INDEX(remarks, ' | ', -1), 
                 NULL)
WHERE remarks IS NOT NULL;

-- Drop old remarks column
ALTER TABLE transactions DROP COLUMN remarks;
