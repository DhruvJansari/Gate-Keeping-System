-- 1. Create counter table
CREATE TABLE IF NOT EXISTS transaction_counters (
    fy_start_year INT PRIMARY KEY,
    current_serial INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Add new columns
ALTER TABLE transactions 
ADD COLUMN fy_start_year INT NULL AFTER gate_pass_no,
ADD COLUMN fy_serial INT NULL AFTER fy_start_year;

-- 3. Calculate FY start year adjusting dynamically for IST (UTC +5:30)
UPDATE transactions 
SET fy_start_year = IF(MONTH(created_at + INTERVAL 5 HOUR + INTERVAL 30 MINUTE) >= 4, 
                       YEAR(created_at + INTERVAL 5 HOUR + INTERVAL 30 MINUTE), 
                       YEAR(created_at + INTERVAL 5 HOUR + INTERVAL 30 MINUTE) - 1);

-- 4. Calculate partitioned row numbers for fy_serial
SET @row_number = 0;
SET @current_fy = 0;

CREATE TEMPORARY TABLE IF NOT EXISTS temp_fy_mappings AS
SELECT 
    transaction_id,
    @row_number := IF(@current_fy = fy_start_year, @row_number + 1, 1) as rn,
    @current_fy := fy_start_year as fy
FROM (SELECT transaction_id, fy_start_year FROM transactions ORDER BY fy_start_year ASC, created_at ASC, transaction_id ASC) ordered_txns;

-- 5. Apply the mapped serials to main table
UPDATE transactions t
JOIN temp_fy_mappings m ON t.transaction_id = m.transaction_id
SET t.fy_serial = m.rn;

-- 6. Format gate_pass_no reflecting new structure
UPDATE transactions
SET gate_pass_no = CONCAT('GP-', LPAD(fy_serial, 2, '0'), '-', DATE_FORMAT(created_at + INTERVAL 5 HOUR + INTERVAL 30 MINUTE, '%Y%m%d'))
WHERE fy_serial IS NOT NULL;

-- 7. Sync Initial States into atomic Counter table
INSERT INTO transaction_counters (fy_start_year, current_serial)
SELECT fy_start_year, MAX(fy_serial)
FROM transactions
WHERE fy_start_year IS NOT NULL
GROUP BY fy_start_year
ON DUPLICATE KEY UPDATE current_serial = VALUES(current_serial);

-- 8. Add Unique Constraint 
ALTER TABLE transactions 
ADD UNIQUE KEY idx_fy_unique (fy_start_year, fy_serial);

DROP TEMPORARY TABLE IF EXISTS temp_fy_mappings;
