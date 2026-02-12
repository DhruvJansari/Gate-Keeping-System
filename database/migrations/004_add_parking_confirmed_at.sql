-- Add parking_confirmed_at for stage confirmation (run once on existing DB)
ALTER TABLE transactions ADD COLUMN parking_confirmed_at TIMESTAMP NULL AFTER net_weight;
UPDATE transactions SET parking_confirmed_at = created_at WHERE parking_confirmed_at IS NULL AND created_at IS NOT NULL;
