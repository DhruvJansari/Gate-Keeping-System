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
