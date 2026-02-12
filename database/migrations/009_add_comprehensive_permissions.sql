-- Migration 009: Add comprehensive permissions for step-wise dashboard
-- Run this on existing database to add new permission entries

-- Add new permissions
INSERT IGNORE INTO permissions (permission_id, code, name) VALUES
(9, 'create_transactions', 'Create new transactions'),
(10, 'view_transactions', 'View transaction details'),
(11, 'manage_masters', 'Manage master data (items, parties, transporters)'),
(12, 'view_masters', 'View master data'),
(13, 'view_reports', 'Access reports and analytics'),
(14, 'export_data', 'Export data to Excel/PDF'),
(15, 'manage_users', 'Manage user accounts'),
(16, 'manage_roles', 'Manage roles and permissions'),
(17, 'weighbridge_access', 'Access weighbridge operations');

-- Grant all permissions to Admin role (role_id = 1)
INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES
(1, 9),   -- create_transactions
(1, 10),  -- view_transactions
(1, 11),  -- manage_masters
(1, 12),  -- view_masters
(1, 13),  -- view_reports
(1, 14),  -- export_data
(1, 15),  -- manage_users
(1, 16),  -- manage_roles
(1, 17);  -- weighbridge_access

-- Grant typical Gatekeeper permissions (role_id = 2, if exists)
-- Adjust role_id based on your actual roles table
INSERT IGNORE INTO role_permissions (role_id, permission_id) 
SELECT 2, permission_id FROM permissions WHERE code IN (
  'create_transactions',
  'view_transactions',
  'confirm_stages'
) WHERE EXISTS (SELECT 1 FROM roles WHERE role_id = 2);

-- Grant typical Weighbridge permissions (role_id = 3, if exists)
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 3, permission_id FROM permissions WHERE code IN (
  'view_transactions',
  'weighbridge_access',
  'add_weight_entries',
  'confirm_stages'
) WHERE EXISTS (SELECT 1 FROM roles WHERE role_id = 3);

-- Grant typical Yard permissions (role_id = 4, if exists)
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 4, permission_id FROM permissions WHERE code IN (
  'view_transactions',
  'confirm_stages'
) WHERE EXISTS (SELECT 1 FROM roles WHERE role_id = 4);

-- Note: Adjust role IDs above based on your actual roles table
-- To find role IDs: SELECT role_id, role_name FROM roles;
