-- Migration 010: Refine role permissions for strict dashboard control

-- 1. Add 'delete_masters' permission to separate it from 'manage_masters'
INSERT IGNORE INTO permissions (code, name) VALUES ('delete_masters', 'Delete master data (items, parties, transporters)');

-- 2. Ensure Admin (Role ID 1) has all permissions including new one
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 1, permission_id FROM permissions WHERE code = 'delete_masters';

-- 3. Gatekeeper (Role ID 2)
-- Needs: create_transactions, view_transactions, confirm_stages, manage_masters (for Add/Edit), view_masters, view_reports, export_data
-- Should NOT have: delete_masters
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 2, permission_id FROM permissions WHERE code IN (
  'create_transactions',
  'view_transactions',
  'confirm_stages',
  'manage_masters',
  'view_masters',
  'view_reports',
  'export_data'
);

-- Remove unwanted permissions for Gatekeeper if they exist (cleanup)
DELETE FROM role_permissions 
WHERE role_id = 2 
AND permission_id IN (SELECT permission_id FROM permissions WHERE code IN ('delete_masters', 'manage_users', 'manage_roles'));


-- 4. Weighbridge (Role ID 3)
-- Needs: view_transactions, weighbridge_access, add_weight_entries, confirm_stages
-- Should NOT have: create_transactions (except maybe implicit?), manage_masters
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 3, permission_id FROM permissions WHERE code IN (
  'view_transactions',
  'weighbridge_access',
  'add_weight_entries',
  'confirm_stages'
);

-- Remove create_transactions from Weighbridge if it was added by mistake
DELETE FROM role_permissions 
WHERE role_id = 3 
AND permission_id IN (SELECT permission_id FROM permissions WHERE code IN ('create_transactions', 'manage_masters'));


-- 5. Yard (Role ID 4)
-- Needs: view_transactions, confirm_stages
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 4, permission_id FROM permissions WHERE code IN (
  'view_transactions',
  'confirm_stages'
);

-- Remove unwanted
DELETE FROM role_permissions 
WHERE role_id = 4 
AND permission_id IN (SELECT permission_id FROM permissions WHERE code IN ('create_transactions', 'manage_masters', 'weighbridge_access'));
