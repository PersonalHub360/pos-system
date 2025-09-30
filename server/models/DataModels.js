/**
 * Shared Data Models and Business Logic for POS System
 * This module provides consistent data structures and algorithms across all modules
 */

class DataModels {
  constructor() {
    this.validationRules = {
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      phone: /^\+?[\d\s\-\(\)]+$/,
      price: /^\d+(\.\d{1,2})?$/,
      percentage: /^(100(\.0{1,2})?|[1-9]?\d(\.\d{1,2})?)$/
    };
  }

  // ============================================================================
  // USER DATA MODELS
  // ============================================================================
  
  createUserModel(data = {}) {
    return {
      id: data.id || null,
      username: data.username || '',
      email: data.email || '',
      password_hash: data.password_hash || '',
      full_name: data.full_name || '',
      phone: data.phone || '',
      role: data.role || 'staff',
      is_active: data.is_active !== undefined ? data.is_active : true,
      last_login: data.last_login || null,
      created_at: data.created_at || new Date().toISOString(),
      updated_at: data.updated_at || new Date().toISOString()
    };
  }

  validateUser(userData) {
    const errors = [];
    
    if (!userData.username || userData.username.length < 3) {
      errors.push('Username must be at least 3 characters long');
    }
    
    if (!userData.email || !this.validationRules.email.test(userData.email)) {
      errors.push('Valid email address is required');
    }
    
    if (!userData.full_name || userData.full_name.length < 2) {
      errors.push('Full name must be at least 2 characters long');
    }
    
    if (!['admin', 'manager', 'staff'].includes(userData.role)) {
      errors.push('Invalid user role');
    }
    
    return { isValid: errors.length === 0, errors };
  }

  // ============================================================================
  // PRODUCT DATA MODELS
  // ============================================================================
  
  createProductModel(data = {}) {
    return {
      id: data.id || null,
      name: data.name || '',
      description: data.description || '',
      category_id: data.category_id || null,
      price: data.price || 0,
      cost: data.cost || 0,
      sku: data.sku || '',
      barcode: data.barcode || '',
      image_url: data.image_url || '',
      is_active: data.is_active !== undefined ? data.is_active : true,
      created_at: data.created_at || new Date().toISOString(),
      updated_at: data.updated_at || new Date().toISOString()
    };
  }

  validateProduct(productData) {
    const errors = [];
    
    if (!productData.name || productData.name.length < 2) {
      errors.push('Product name must be at least 2 characters long');
    }
    
    if (!productData.price || productData.price <= 0) {
      errors.push('Product price must be greater than 0');
    }
    
    if (productData.cost && productData.cost < 0) {
      errors.push('Product cost cannot be negative');
    }
    
    if (!productData.category_id) {
      errors.push('Product category is required');
    }
    
    return { isValid: errors.length === 0, errors };
  }

  // ============================================================================
  // ORDER DATA MODELS
  // ============================================================================
  
  createOrderModel(data = {}) {
    return {
      id: data.id || null,
      table_id: data.table_id || null,
      customer_name: data.customer_name || '',
      customer_phone: data.customer_phone || '',
      order_type: data.order_type || 'dine_in', // dine_in, takeaway, delivery
      status: data.status || 'pending', // pending, preparing, ready, completed, cancelled
      subtotal: data.subtotal || 0,
      tax_amount: data.tax_amount || 0,
      discount_amount: data.discount_amount || 0,
      total_amount: data.total_amount || 0,
      payment_status: data.payment_status || 'pending', // pending, paid, refunded
      payment_method: data.payment_method || '',
      notes: data.notes || '',
      created_by: data.created_by || null,
      created_at: data.created_at || new Date().toISOString(),
      updated_at: data.updated_at || new Date().toISOString(),
      items: data.items || []
    };
  }

  createOrderItemModel(data = {}) {
    return {
      id: data.id || null,
      order_id: data.order_id || null,
      product_id: data.product_id || null,
      quantity: data.quantity || 1,
      unit_price: data.unit_price || 0,
      total_price: data.total_price || 0,
      notes: data.notes || '',
      created_at: data.created_at || new Date().toISOString()
    };
  }

  validateOrder(orderData) {
    const errors = [];
    
    if (!orderData.items || orderData.items.length === 0) {
      errors.push('Order must contain at least one item');
    }
    
    if (!['dine_in', 'takeaway', 'delivery'].includes(orderData.order_type)) {
      errors.push('Invalid order type');
    }
    
    if (orderData.order_type === 'dine_in' && !orderData.table_id) {
      errors.push('Table is required for dine-in orders');
    }
    
    if (orderData.order_type === 'delivery' && !orderData.customer_phone) {
      errors.push('Customer phone is required for delivery orders');
    }
    
    return { isValid: errors.length === 0, errors };
  }

  // ============================================================================
  // TABLE DATA MODELS
  // ============================================================================
  
  createTableModel(data = {}) {
    return {
      id: data.id || null,
      table_number: data.table_number || '',
      section: data.section || 'main',
      capacity: data.capacity || 4,
      status: data.status || 'available', // available, occupied, reserved, maintenance
      qr_code: data.qr_code || '',
      is_active: data.is_active !== undefined ? data.is_active : true,
      created_at: data.created_at || new Date().toISOString(),
      updated_at: data.updated_at || new Date().toISOString()
    };
  }

  createReservationModel(data = {}) {
    return {
      id: data.id || null,
      table_id: data.table_id || null,
      customer_name: data.customer_name || '',
      customer_phone: data.customer_phone || '',
      party_size: data.party_size || 1,
      reservation_date: data.reservation_date || '',
      reservation_time: data.reservation_time || '',
      status: data.status || 'confirmed', // confirmed, cancelled, completed, no_show
      notes: data.notes || '',
      created_at: data.created_at || new Date().toISOString(),
      updated_at: data.updated_at || new Date().toISOString()
    };
  }

  validateTable(tableData) {
    const errors = [];
    
    if (!tableData.table_number || tableData.table_number.length < 1) {
      errors.push('Table number is required');
    }
    
    if (!tableData.capacity || tableData.capacity < 1) {
      errors.push('Table capacity must be at least 1');
    }
    
    if (!['available', 'occupied', 'reserved', 'maintenance'].includes(tableData.status)) {
      errors.push('Invalid table status');
    }
    
    return { isValid: errors.length === 0, errors };
  }

  // ============================================================================
  // INVENTORY DATA MODELS
  // ============================================================================
  
  createInventoryModel(data = {}) {
    return {
      id: data.id || null,
      product_id: data.product_id || null,
      current_stock: data.current_stock || 0,
      minimum_stock: data.minimum_stock || 0,
      maximum_stock: data.maximum_stock || null,
      reorder_point: data.reorder_point || 0,
      unit_of_measure: data.unit_of_measure || 'piece',
      is_trackable: data.is_trackable !== undefined ? data.is_trackable : true,
      last_restocked: data.last_restocked || null,
      created_at: data.created_at || new Date().toISOString(),
      updated_at: data.updated_at || new Date().toISOString()
    };
  }

  createStockMovementModel(data = {}) {
    return {
      id: data.id || null,
      product_id: data.product_id || null,
      movement_type: data.movement_type || 'adjustment', // sale, purchase, adjustment, return, waste
      quantity_change: data.quantity_change || 0,
      previous_stock: data.previous_stock || 0,
      new_stock: data.new_stock || 0,
      reference_id: data.reference_id || null, // order_id, purchase_id, etc.
      reference_type: data.reference_type || null, // order, purchase, adjustment
      notes: data.notes || '',
      created_by: data.created_by || null,
      created_at: data.created_at || new Date().toISOString()
    };
  }

  validateInventory(inventoryData) {
    const errors = [];
    
    if (!inventoryData.product_id) {
      errors.push('Product ID is required');
    }
    
    if (inventoryData.current_stock < 0) {
      errors.push('Current stock cannot be negative');
    }
    
    if (inventoryData.minimum_stock < 0) {
      errors.push('Minimum stock cannot be negative');
    }
    
    if (inventoryData.maximum_stock && inventoryData.maximum_stock < inventoryData.minimum_stock) {
      errors.push('Maximum stock cannot be less than minimum stock');
    }
    
    return { isValid: errors.length === 0, errors };
  }

  // ============================================================================
  // BUSINESS LOGIC ALGORITHMS
  // ============================================================================
  
  /**
   * Calculate order totals with tax and discount
   */
  calculateOrderTotals(items, taxRate = 0, discountAmount = 0, discountType = 'fixed') {
    const subtotal = items.reduce((sum, item) => {
      return sum + (item.quantity * item.unit_price);
    }, 0);

    let finalDiscountAmount = 0;
    if (discountType === 'percentage') {
      finalDiscountAmount = subtotal * (discountAmount / 100);
    } else {
      finalDiscountAmount = discountAmount;
    }

    const discountedSubtotal = Math.max(0, subtotal - finalDiscountAmount);
    const taxAmount = discountedSubtotal * (taxRate / 100);
    const totalAmount = discountedSubtotal + taxAmount;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      discount_amount: Math.round(finalDiscountAmount * 100) / 100,
      tax_amount: Math.round(taxAmount * 100) / 100,
      total_amount: Math.round(totalAmount * 100) / 100
    };
  }

  /**
   * Calculate profit margin
   */
  calculateProfitMargin(sellingPrice, cost) {
    if (!cost || cost === 0) return 0;
    return ((sellingPrice - cost) / sellingPrice) * 100;
  }

  /**
   * Determine stock status
   */
  getStockStatus(currentStock, minimumStock, reorderPoint) {
    if (currentStock <= 0) return 'out_of_stock';
    if (currentStock <= reorderPoint) return 'reorder_needed';
    if (currentStock <= minimumStock) return 'low_stock';
    return 'in_stock';
  }

  /**
   * Calculate table utilization
   */
  calculateTableUtilization(totalTables, occupiedTables) {
    if (totalTables === 0) return 0;
    return (occupiedTables / totalTables) * 100;
  }

  /**
   * Generate time-based analytics periods
   */
  getAnalyticsPeriods() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const weekStart = new Date(today.getTime() - (today.getDay() * 24 * 60 * 60 * 1000));
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    return {
      today: {
        start: today.toISOString(),
        end: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()
      },
      yesterday: {
        start: yesterday.toISOString(),
        end: today.toISOString()
      },
      thisWeek: {
        start: weekStart.toISOString(),
        end: now.toISOString()
      },
      thisMonth: {
        start: monthStart.toISOString(),
        end: now.toISOString()
      },
      thisYear: {
        start: yearStart.toISOString(),
        end: now.toISOString()
      }
    };
  }

  /**
   * Format currency values
   */
  formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  /**
   * Generate unique identifiers
   */
  generateOrderNumber() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `ORD-${timestamp}-${random}`.toUpperCase();
  }

  generateSKU(categoryCode, productName) {
    const nameCode = productName.replace(/[^a-zA-Z0-9]/g, '').substr(0, 6).toUpperCase();
    const timestamp = Date.now().toString(36).substr(-4);
    return `${categoryCode}-${nameCode}-${timestamp}`.toUpperCase();
  }

  /**
   * Data sanitization and security
   */
  sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    return input.trim().replace(/[<>]/g, '');
  }

  /**
   * Pagination helper
   */
  calculatePagination(page = 1, limit = 10, totalCount = 0) {
    const offset = (page - 1) * limit;
    const totalPages = Math.ceil(totalCount / limit);
    
    return {
      page: parseInt(page),
      limit: parseInt(limit),
      offset,
      totalPages,
      totalCount,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };
  }

  /**
   * Date range validation
   */
  validateDateRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return { isValid: false, error: 'Invalid date format' };
    }
    
    if (start > end) {
      return { isValid: false, error: 'Start date cannot be after end date' };
    }
    
    const maxRange = 365 * 24 * 60 * 60 * 1000; // 1 year in milliseconds
    if (end - start > maxRange) {
      return { isValid: false, error: 'Date range cannot exceed 1 year' };
    }
    
    return { isValid: true };
  }

  /**
   * Response formatting
   */
  formatResponse(success, data = null, message = '', errors = []) {
    return {
      success,
      data,
      message,
      errors,
      timestamp: new Date().toISOString()
    };
  }

  formatErrorResponse(message, errors = [], statusCode = 400) {
    return {
      success: false,
      data: null,
      message,
      errors: Array.isArray(errors) ? errors : [errors],
      statusCode,
      timestamp: new Date().toISOString()
    };
  }

  formatSuccessResponse(data, message = 'Success') {
    return {
      success: true,
      data,
      message,
      errors: [],
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new DataModels();