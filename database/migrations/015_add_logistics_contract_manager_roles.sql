-- Migration 015: Add Logistics Manager and Contract Manager roles
-- DO NOT ALTER existing roles, permissions, or tables

-- Add new roles
INSERT IGNORE INTO roles (name, description) VALUES 
  ('Logistics Manager', 'Manages logistics entries, vehicles, and items'),
  ('Contract Manager', 'Manages contracts, parties, brokers, and items');

-- Get the Role IDs
SET @logistics_role_id = (SELECT role_id FROM roles WHERE name = 'Logistics Manager');
SET @contract_role_id = (SELECT role_id FROM roles WHERE name = 'Contract Manager');

-- Insert new permissions if not exist
INSERT IGNORE INTO permissions (code, name) VALUES 
  ('manage_logistics', 'Full access to logistic entries and related masters'),
  ('manage_contracts', 'Full access to contracts and related masters');

-- Assign permissions to Logistics Manager
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT @logistics_role_id, permission_id FROM permissions 
WHERE code IN (
  'manage_logistics',
  'view_reports',
  'view_masters',
  'manage_masters'
);

-- Assign permissions to Contract Manager
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT @contract_role_id, permission_id FROM permissions 
WHERE code IN (
  'manage_contracts',
  'manage_contracts_data',
  'view_reports',
  'view_masters',
  'manage_masters',
  'export_data'
);
