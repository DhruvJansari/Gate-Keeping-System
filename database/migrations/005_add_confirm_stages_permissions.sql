-- Add confirm_stages and add_weight_entries permissions (run once on existing DB)
INSERT IGNORE INTO permissions (permission_id, code, name) VALUES
(7, 'confirm_stages', 'Confirm transaction stages'),
(8, 'add_weight_entries', 'Add weighbridge weight entries');
INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (1, 7), (1, 8);
