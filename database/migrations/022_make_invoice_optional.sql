-- Migration 022: Make Invoice Fields Optional

ALTER TABLE transactions MODIFY COLUMN invoice_number VARCHAR(80) NULL;
ALTER TABLE transactions MODIFY COLUMN invoice_date DATE NULL;
ALTER TABLE transactions MODIFY COLUMN invoice_quantity DECIMAL(18, 4) NULL;
