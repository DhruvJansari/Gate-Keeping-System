-- Gate Keeping System - MySQL Schema
-- Run this script to create the database and tables

CREATE DATABASE IF NOT EXISTS gatekeeping_db;
USE gatekeeping_db;

-- Roles enum: Admin, Gatekeeper, Weighbridge, Yard, Viewer
-- Permissions: create_transactions, edit_transactions, weighbridge_access, view_reports

CREATE TABLE IF NOT EXISTS roles (
  role_id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permissions (
  permission_id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INT NOT NULL,
  permission_id INT NOT NULL, 
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(permission_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS users (
  user_id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(80) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role_id INT NOT NULL,
  full_name VARCHAR(150),
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(role_id),
  INDEX idx_users_username (username),
  INDEX idx_users_email (email),
  INDEX idx_users_role (role_id)
);

-- Custom permissions per user (admin-assigned, overrides or extends role)
CREATE TABLE IF NOT EXISTS user_permissions (
  user_id INT NOT NULL,
  permission_id INT NOT NULL,
  granted TINYINT(1) DEFAULT 1,
  PRIMARY KEY (user_id, permission_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(permission_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS transporters (
  transporter_id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  contact_person VARCHAR(150),
  contact_phone VARCHAR(20),
  email VARCHAR(255),
  service_type VARCHAR(50),
  notes TEXT,
  status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_transporters_name (name),
  INDEX idx_transporters_status (status)
);

CREATE TABLE IF NOT EXISTS parties (
  party_id INT PRIMARY KEY AUTO_INCREMENT,
  party_name VARCHAR(200) NOT NULL,
  email VARCHAR(255),
  gst_no VARCHAR(30),
  pan_no VARCHAR(10),
  address TEXT,
  contact_phone VARCHAR(20),
  status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_parties_name (party_name),
  INDEX idx_parties_status (status)
);

CREATE TABLE IF NOT EXISTS items (
  item_id INT PRIMARY KEY AUTO_INCREMENT,
  item_name VARCHAR(200) NOT NULL,
  description TEXT,
  status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_items_name (item_name),
  INDEX idx_items_status (status)
);

CREATE TABLE IF NOT EXISTS trucks (
  truck_id INT PRIMARY KEY AUTO_INCREMENT,
  truck_no VARCHAR(30) NOT NULL,
  transporter_id INT,
  driver_mobile VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (transporter_id) REFERENCES transporters(transporter_id),
  INDEX idx_trucks_no (truck_no),
  INDEX idx_trucks_transporter (transporter_id)
);

-- Stage statuses: In Parking, Gate In Completed, Moved to Weighbridge, First Weighbridge Completed,
-- Second Weighbridge Completed, Gate Pass Finalized, Campus In Completed, Campus Out Completed, Transaction Closed
-- gate_pass_status: ACTIVE, FINALIZED, CLOSED

CREATE TABLE IF NOT EXISTS transactions (
  transaction_id INT PRIMARY KEY AUTO_INCREMENT,
  transaction_type ENUM('Loading', 'Unloading') NOT NULL,
  truck_id INT NOT NULL,
  party_id INT NOT NULL,
  item_id INT NOT NULL,
  transporter_id INT NOT NULL,
  po_do_number VARCHAR(80),
  invoice_number VARCHAR(80),
  invoice_date DATE,
  invoice_quantity DECIMAL(18, 4),
  lr_number VARCHAR(80),
  mobile_number VARCHAR(20) NOT NULL,
  remark1 TEXT,
  remark2 TEXT,
  current_status VARCHAR(60) NOT NULL DEFAULT 'In Parking',
  step1_status VARCHAR(60) DEFAULT 'In Parking',
  step2_status VARCHAR(60),
  step3_status VARCHAR(60),
  gate_pass_no VARCHAR(40) UNIQUE,
  gate_pass_status ENUM('ACTIVE', 'FINALIZED', 'CLOSED') DEFAULT 'ACTIVE',
  first_weight DECIMAL(18, 4),
  second_weight DECIMAL(18, 4),
  net_weight DECIMAL(18, 4),
  parking_confirmed_at TIMESTAMP NULL,
  parking_confirmed_by INT,
  gate_in_at TIMESTAMP NULL,
  gate_in_confirmed_by INT,
  gate_out_at TIMESTAMP NULL,
  gate_out_confirmed_by INT,
  first_weigh_at TIMESTAMP NULL,
  first_weigh_confirmed_by INT,
  second_weigh_at TIMESTAMP NULL,
  second_weigh_confirmed_by INT,
  gate_pass_created_at TIMESTAMP NULL,
  gate_pass_finalized_at TIMESTAMP NULL,
  gate_pass_confirmed_by INT,
  campus_in_at TIMESTAMP NULL,
  campus_in_confirmed_by INT,
  campus_out_at TIMESTAMP NULL,
  campus_out_confirmed_by INT,
  closed_at TIMESTAMP NULL,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (truck_id) REFERENCES trucks(truck_id),
  FOREIGN KEY (party_id) REFERENCES parties(party_id),
  FOREIGN KEY (item_id) REFERENCES items(item_id),
  FOREIGN KEY (transporter_id) REFERENCES transporters(transporter_id),
  FOREIGN KEY (created_by) REFERENCES users(user_id),
  FOREIGN KEY (parking_confirmed_by) REFERENCES users(user_id),
  FOREIGN KEY (gate_in_confirmed_by) REFERENCES users(user_id),
  FOREIGN KEY (gate_out_confirmed_by) REFERENCES users(user_id),
  FOREIGN KEY (first_weigh_confirmed_by) REFERENCES users(user_id),
  FOREIGN KEY (second_weigh_confirmed_by) REFERENCES users(user_id),
  FOREIGN KEY (gate_pass_confirmed_by) REFERENCES users(user_id),
  FOREIGN KEY (campus_in_confirmed_by) REFERENCES users(user_id),
  FOREIGN KEY (campus_out_confirmed_by) REFERENCES users(user_id),
  INDEX idx_transactions_status (current_status),
  INDEX idx_transactions_gate_pass (gate_pass_no),
  INDEX idx_transactions_created (created_at),
  INDEX idx_transactions_truck (truck_id)
);

CREATE TABLE IF NOT EXISTS transaction_logs (
  log_id BIGINT PRIMARY KEY AUTO_INCREMENT,
  transaction_id INT NOT NULL,
  stage VARCHAR(60) NOT NULL,
  action VARCHAR(100) NOT NULL,
  user_id INT,
  previous_value TEXT,
  new_value TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (transaction_id) REFERENCES transactions(transaction_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  INDEX idx_logs_transaction (transaction_id),
  INDEX idx_logs_created (created_at)
);

-- Seed roles and permissions
INSERT IGNORE INTO roles (role_id, name, description) VALUES
(1, 'Admin', 'Full system control'),
(2, 'Gatekeeper', 'Entry & registration (Step-1)'),
(3, 'Weighbridge', 'Weighing & clearance (Step-2)'),
(4, 'Yard', 'Internal movement (Step-3)'),
(5, 'Viewer', 'View and audit only');

INSERT IGNORE INTO permissions (permission_id, code, name) VALUES
(1, 'create_transactions', 'Create transactions'),
(2, 'edit_transactions', 'Edit/delete transactions'),
(3, 'weighbridge_access', 'Access weighbridge modules'),
(4, 'view_reports', 'View/export reports'),
(5, 'manage_users', 'Create users and assign roles'),
(6, 'manage_masters', 'Manage party, item, transporter masters'),
(7, 'confirm_stages', 'Confirm transaction stages'),
(8, 'add_weight_entries', 'Add weighbridge weight entries');

INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (1, 7), (1, 8),
(2, 1), (2, 4),
(3, 3), (3, 4),
(4, 4),
(5, 4);
-- Migration Script for Vehicle, Driver, Broker, and Contract Modules

-- 1. Create Vehicles Table
CREATE TABLE IF NOT EXISTS vehicles (
    vehicle_id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_number VARCHAR(50) NOT NULL UNIQUE,
    vehicle_type VARCHAR(50) NOT NULL, -- 'Truck', 'Trailer', etc.
    owner_name VARCHAR(100) NOT NULL,
    rc_number VARCHAR(100),
    chassis_number VARCHAR(100),
    insurance_expiry DATE,
    fitness_expiry DATE,
    permit_expiry DATE,
    puc_expiry DATE,
    status ENUM('Active', 'Inactive') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Create Drivers Table
CREATE TABLE IF NOT EXISTS drivers (
    driver_id INT AUTO_INCREMENT PRIMARY KEY,
    driver_name VARCHAR(100) NOT NULL,
    address TEXT,
    mobile VARCHAR(20) NOT NULL,
    licence VARCHAR(50),
    licence_expiry DATE,
    adhar_number VARCHAR(20),
    status ENUM('Active', 'Inactive') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3. Create Brokers Table
CREATE TABLE IF NOT EXISTS brokers (
    broker_id INT AUTO_INCREMENT PRIMARY KEY,
    broker_name VARCHAR(100) NOT NULL,
    broker_address TEXT,
    mobile VARCHAR(20),
    email VARCHAR(100),
    status ENUM('Active', 'Inactive') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 4. Create Contracts Table
CREATE TABLE IF NOT EXISTS contracts (
    contract_id INT AUTO_INCREMENT PRIMARY KEY,
    contract_type VARCHAR(50) NOT NULL, -- 'Purchase Order' or 'Sales Order'
    contract_no VARCHAR(50) NOT NULL UNIQUE,
    contract_date DATE DEFAULT (CURRENT_DATE),
    party_contract_number VARCHAR(100),
    party_id INT, -- FK to parties table
    item_id INT, -- FK to items table
    broker_id INT, -- FK to brokers table
    contract_rate DECIMAL(15, 2) NOT NULL,
    contract_quantity DECIMAL(15, 2) NOT NULL,
    rec_qty DECIMAL(15, 2) DEFAULT 0.00,
    settal_qty DECIMAL(15, 2) DEFAULT 0.00,
    pending_qty DECIMAL(15, 2) DEFAULT 0.00,
    contract_status ENUM('Complete', 'Incomplete', 'Pending') DEFAULT 'Pending',
    ex_paint VARCHAR(100),
    for_field VARCHAR(100), -- 'for' is a reserved keyword, using 'for_field'
    contract_due_date DATE,
    payment_terms TEXT,
    remark1 TEXT,
    remark2 TEXT,
    status ENUM('Active', 'Inactive') DEFAULT 'Active',
    created_by INT, -- Optional: User ID who created the contract
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (broker_id) REFERENCES brokers(broker_id) ON DELETE SET NULL,
    FOREIGN KEY (party_id) REFERENCES parties(party_id) ON DELETE SET NULL,
    FOREIGN KEY (item_id) REFERENCES items(item_id) ON DELETE SET NULL
);

-- 5. Create Logistic Entries Table
CREATE TABLE IF NOT EXISTS logistic_entries (
    logistic_id INT PRIMARY KEY AUTO_INCREMENT,
    
    -- Consignor Details
    consignor_name TEXT,
    consignor_address TEXT,
    consignor_place TEXT,
    consignor_gst TEXT,
    
    -- Consignee Details
    consignee_name TEXT,
    consignee_address TEXT,
    consignee_place TEXT,
    consignee_gst TEXT,
    
    -- Load Details
    truck_no VARCHAR(255),
    driver_id INT NULL,
    transporter_name VARCHAR(255) DEFAULT NULL,
    product VARCHAR(255),
    gross_weight DECIMAL(10,2),
    tare_weight DECIMAL(10,2),
    net_weight DECIMAL(10,2),
    rate DECIMAL(10,2),
    amounts DECIMAL(10,2),
    
    -- Timestamps (Stages)
    loading_site_at DATETIME NULL,
    loading_point_in_at DATETIME NULL,
    loading_point_out_at DATETIME NULL,
    unloading_site_at DATETIME NULL,
    unloading_point_in_at DATETIME NULL,
    unloading_point_out_at DATETIME NULL,
    
    -- Step 3 Fields (Editable)
    deduction DECIMAL(10,2) DEFAULT 0,
    company_notes TEXT DEFAULT NULL,
    net_amount DECIMAL(10,2) DEFAULT 0,
    rec_amount DECIMAL(10,2) DEFAULT 0,
    rec_date DATETIME NULL,
    payment_rec_ac BOOLEAN DEFAULT 0,
    payment_rec_ac_note TEXT,
    payment_cash BOOLEAN DEFAULT 0,
    payment_cash_note TEXT,
    expense DECIMAL(10,2) DEFAULT 0,
    advance DECIMAL(10,2) DEFAULT 0,
    diesel_ltr DECIMAL(10,2) DEFAULT 0,
    diesel_rate DECIMAL(10,2) DEFAULT 0,
    unloading_wt DECIMAL(10,2) DEFAULT 0,
    loss_gain DECIMAL(10,2) DEFAULT NULL,
    final_notes TEXT DEFAULT NULL,
    deduction_2 DECIMAL(10,2) DEFAULT 0,
    holtage DECIMAL(10,2) DEFAULT 0,
    start_km DECIMAL(10,2) DEFAULT 0,
    end_km DECIMAL(10,2) DEFAULT 0,
    total_km DECIMAL(10,2) DEFAULT NULL,
    lr_no VARCHAR(80),
    
    -- Meta
    entry_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'Active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    FOREIGN KEY (driver_id) REFERENCES drivers(driver_id) ON DELETE SET NULL,
    INDEX idx_logistic_entries_created_at (created_at)
);
