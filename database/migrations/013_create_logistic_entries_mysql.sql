-- Create logistic_entries table (MySQL Compatible)
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
    deduction_2 DECIMAL(10,2) DEFAULT 0,
    holtage DECIMAL(10,2) DEFAULT 0,
    start_km DECIMAL(10,2) DEFAULT 0,
    end_km DECIMAL(10,2) DEFAULT 0,
    
    -- Meta
    entry_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'Active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT
);

-- Index for faster dashboard loading
CREATE INDEX idx_logistic_entries_created_at ON logistic_entries(created_at);
