-- Enhanced Centralized Database Schema for Comprehensive POS System
-- This schema supports interconnected modules: POS, Items Management, Inventory, Table Management, and Reports

-- =============================================
-- CORE SYSTEM TABLES
-- =============================================

-- Users and Authentication
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'cashier', -- admin, manager, cashier, waiter
    status TEXT NOT NULL DEFAULT 'active', -- active, inactive, suspended
    permissions TEXT, -- JSON string of permissions
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Company/Store Information
CREATE TABLE IF NOT EXISTS company_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    tax_id TEXT,
    logo_url TEXT,
    currency TEXT DEFAULT 'USD',
    timezone TEXT DEFAULT 'UTC',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- PRODUCT AND INVENTORY MANAGEMENT
-- =============================================

-- Categories (Enhanced)
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    parent_id INTEGER, -- For subcategories
    image_url TEXT,
    sort_order INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories (id)
);

-- Products (Enhanced)
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    sku TEXT UNIQUE,
    barcode TEXT,
    category_id INTEGER,
    price DECIMAL(10,2) NOT NULL,
    cost_price DECIMAL(10,2),
    tax_rate DECIMAL(5,2) DEFAULT 0,
    image_url TEXT,
    status TEXT DEFAULT 'active', -- active, inactive, discontinued
    is_trackable BOOLEAN DEFAULT 1, -- Whether to track inventory
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories (id),
    FOREIGN KEY (created_by) REFERENCES users (id)
);

-- Inventory Management
CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    current_stock INTEGER DEFAULT 0,
    min_stock INTEGER DEFAULT 0,
    max_stock INTEGER DEFAULT 0,
    unit TEXT DEFAULT 'pieces', -- pieces, kg, liters, etc.
    location TEXT, -- Storage location
    last_restocked DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
);

-- Stock Movements (Audit Trail)
CREATE TABLE IF NOT EXISTS stock_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    movement_type TEXT NOT NULL, -- in, out, adjustment, transfer
    quantity INTEGER NOT NULL,
    reference_type TEXT, -- order, purchase, adjustment, transfer
    reference_id INTEGER,
    notes TEXT,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products (id),
    FOREIGN KEY (created_by) REFERENCES users (id)
);

-- Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Product Suppliers Relationship
CREATE TABLE IF NOT EXISTS product_suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    supplier_id INTEGER NOT NULL,
    supplier_sku TEXT,
    cost_price DECIMAL(10,2),
    lead_time_days INTEGER,
    is_primary BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES suppliers (id)
);

-- =============================================
-- TABLE MANAGEMENT
-- =============================================

-- Tables/Dining Areas
CREATE TABLE IF NOT EXISTS tables (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_number TEXT NOT NULL UNIQUE,
    table_name TEXT,
    capacity INTEGER DEFAULT 4,
    location TEXT, -- indoor, outdoor, private, etc.
    status TEXT DEFAULT 'available', -- available, occupied, reserved, maintenance
    qr_code TEXT, -- For QR code ordering
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table Reservations
CREATE TABLE IF NOT EXISTS reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_id INTEGER NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    customer_email TEXT,
    party_size INTEGER NOT NULL,
    reservation_date DATE NOT NULL,
    reservation_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 120,
    status TEXT DEFAULT 'confirmed', -- confirmed, cancelled, completed, no_show
    notes TEXT,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (table_id) REFERENCES tables (id),
    FOREIGN KEY (created_by) REFERENCES users (id)
);

-- =============================================
-- ORDER MANAGEMENT
-- =============================================

-- Orders (Enhanced)
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number TEXT UNIQUE NOT NULL,
    table_id INTEGER,
    customer_name TEXT,
    customer_phone TEXT,
    customer_email TEXT,
    order_type TEXT DEFAULT 'dine_in', -- dine_in, takeaway, delivery
    subtotal DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    discount_type TEXT, -- percentage, fixed, coupon
    tax_amount DECIMAL(10,2) DEFAULT 0,
    service_charge DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    payment_status TEXT DEFAULT 'pending', -- pending, partial, paid, refunded
    order_status TEXT DEFAULT 'pending', -- pending, confirmed, preparing, ready, served, completed, cancelled
    payment_method TEXT, -- cash, card, digital_wallet, etc.
    notes TEXT,
    served_by INTEGER, -- Waiter/Server
    created_by INTEGER, -- Cashier/User who created the order
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (table_id) REFERENCES tables (id),
    FOREIGN KEY (served_by) REFERENCES users (id),
    FOREIGN KEY (created_by) REFERENCES users (id)
);

-- Order Items (Enhanced)
CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    notes TEXT, -- Special instructions
    status TEXT DEFAULT 'pending', -- pending, preparing, ready, served
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products (id)
);

-- =============================================
-- PAYMENT MANAGEMENT
-- =============================================

-- Payments
CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    payment_method TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    reference_number TEXT,
    status TEXT DEFAULT 'completed', -- pending, completed, failed, refunded
    processed_by INTEGER,
    processed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (order_id) REFERENCES orders (id),
    FOREIGN KEY (processed_by) REFERENCES users (id)
);

-- =============================================
-- CUSTOMER MANAGEMENT
-- =============================================

-- Customers
CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    date_of_birth DATE,
    loyalty_points INTEGER DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0,
    visit_count INTEGER DEFAULT 0,
    last_visit DATETIME,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- DISCOUNT MANAGEMENT
-- =============================================

-- Discount Plans
CREATE TABLE IF NOT EXISTS discount_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    discount_type TEXT NOT NULL, -- 'percentage', 'fixed_amount'
    discount_value DECIMAL(10,2) NOT NULL,
    min_order_amount DECIMAL(10,2) DEFAULT 0,
    max_discount_amount DECIMAL(10,2),
    valid_from DATE,
    valid_to DATE,
    usage_limit INTEGER,
    used_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active', -- 'active', 'inactive', 'expired'
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users (id)
);

-- =============================================
-- REPORTING AND ANALYTICS
-- =============================================

-- Daily Sales Summary
CREATE TABLE IF NOT EXISTS daily_sales_summary (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE NOT NULL UNIQUE,
    total_orders INTEGER DEFAULT 0,
    total_revenue DECIMAL(10,2) DEFAULT 0,
    total_discount DECIMAL(10,2) DEFAULT 0,
    total_tax DECIMAL(10,2) DEFAULT 0,
    cash_sales DECIMAL(10,2) DEFAULT 0,
    card_sales DECIMAL(10,2) DEFAULT 0,
    digital_wallet_sales DECIMAL(10,2) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- SYSTEM CONFIGURATION
-- =============================================

-- System Settings
CREATE TABLE IF NOT EXISTS system_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_key TEXT NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type TEXT DEFAULT 'string', -- string, number, boolean, json
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Audit Log
CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name TEXT NOT NULL,
    record_id INTEGER NOT NULL,
    action TEXT NOT NULL, -- INSERT, UPDATE, DELETE
    old_values TEXT, -- JSON
    new_values TEXT, -- JSON
    user_id INTEGER,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
);

-- Audit Logs for API actions and security events
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    username TEXT,
    action TEXT NOT NULL,
    method TEXT,
    url TEXT,
    ip_address TEXT,
    user_agent TEXT,
    status_code INTEGER,
    duration_ms INTEGER,
    request_body TEXT,
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
);

-- Session Management for enhanced security
CREATE TABLE IF NOT EXISTS user_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_token TEXT UNIQUE NOT NULL,
    refresh_token TEXT UNIQUE,
    ip_address TEXT,
    user_agent TEXT,
    expires_at DATETIME NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Password Reset Tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    used BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Login Attempts for security monitoring
CREATE TABLE IF NOT EXISTS login_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    ip_address TEXT,
    user_agent TEXT,
    success BOOLEAN DEFAULT 0,
    failure_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_table ON orders(table_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_table_record ON audit_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_login_attempts_username ON login_attempts(username);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_attempts_created ON login_attempts(created_at);

-- =============================================
-- TRIGGERS FOR DATA CONSISTENCY
-- =============================================

-- Update inventory when order items are inserted
CREATE TRIGGER IF NOT EXISTS update_inventory_on_order
AFTER INSERT ON order_items
BEGIN
    UPDATE inventory 
    SET current_stock = current_stock - NEW.quantity,
        updated_at = CURRENT_TIMESTAMP
    WHERE product_id = NEW.product_id 
    AND EXISTS (SELECT 1 FROM products WHERE id = NEW.product_id AND is_trackable = 1);
    
    -- Log stock movement
    INSERT INTO stock_movements (product_id, movement_type, quantity, reference_type, reference_id, created_at)
    VALUES (NEW.product_id, 'out', NEW.quantity, 'order', NEW.order_id, CURRENT_TIMESTAMP);
END;

-- Update timestamps on record updates
CREATE TRIGGER IF NOT EXISTS update_products_timestamp
AFTER UPDATE ON products
BEGIN
    UPDATE products SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_orders_timestamp
AFTER UPDATE ON orders
BEGIN
    UPDATE orders SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_inventory_timestamp
AFTER UPDATE ON inventory
BEGIN
    UPDATE inventory SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;