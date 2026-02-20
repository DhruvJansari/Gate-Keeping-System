-- Add Driver Role
INSERT IGNORE INTO roles (name, description) VALUES ('Driver', 'Vehicle Driver for verifying logistic stages');

-- Get the Role ID
SET @driver_role_id = (SELECT role_id FROM roles WHERE name = 'Driver');

-- Insert Permissions if not exist
INSERT IGNORE INTO permissions (code, name) VALUES 
('view_logistic_entry', 'View assigned logistic entry'),
('confirm_logistic_stages', 'Confirm logistic stages');

-- Add Basic Permissions for Driver
-- They need to view their own entry and confirm stages
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT @driver_role_id, permission_id FROM permissions 
WHERE code IN ('view_logistic_entry', 'confirm_logistic_stages');
