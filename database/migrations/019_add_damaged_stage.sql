CREATE TABLE IF NOT EXISTS `transactions` (
    `transaction_id` INT AUTO_INCREMENT PRIMARY KEY
);

-- Note: Safe ALTER TABLE commands
SET @dbname = DATABASE();

SET @is_damaged_exists = (SELECT COUNT(*) FROM information_schema.columns WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'transactions' AND COLUMN_NAME = 'is_damaged');
SET @s = IF(@is_damaged_exists = 0, 'ALTER TABLE transactions ADD COLUMN is_damaged BOOLEAN DEFAULT FALSE', 'SELECT "is_damaged exists"');
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @damaged_at_exists = (SELECT COUNT(*) FROM information_schema.columns WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'transactions' AND COLUMN_NAME = 'damaged_at');
SET @s = IF(@damaged_at_exists = 0, 'ALTER TABLE transactions ADD COLUMN damaged_at DATETIME NULL', 'SELECT "damaged_at exists"');
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @damaged_by_exists = (SELECT COUNT(*) FROM information_schema.columns WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'transactions' AND COLUMN_NAME = 'damaged_by');
SET @s = IF(@damaged_by_exists = 0, 'ALTER TABLE transactions ADD COLUMN damaged_by INT NULL', 'SELECT "damaged_by exists"');
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @damaged_reason_exists = (SELECT COUNT(*) FROM information_schema.columns WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'transactions' AND COLUMN_NAME = 'damaged_reason');
SET @s = IF(@damaged_reason_exists = 0, 'ALTER TABLE transactions ADD COLUMN damaged_reason TEXT NULL', 'SELECT "damaged_reason exists"');
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
