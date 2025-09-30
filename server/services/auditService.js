const moment = require('moment');

class AuditService {
  constructor(db) {
    this.db = db;
  }

  // Log audit events
  async logAuditEvent(eventData) {
    try {
      const {
        table_name,
        record_id,
        action, // CREATE, UPDATE, DELETE, LOGIN, LOGOUT, etc.
        old_values = null,
        new_values = null,
        user_id,
        ip_address = null,
        user_agent = null,
        additional_info = null
      } = eventData;

      const query = `
        INSERT INTO audit_logs (
          table_name, record_id, action, old_values, new_values,
          user_id, ip_address, user_agent, additional_info, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        table_name,
        record_id,
        action,
        old_values ? JSON.stringify(old_values) : null,
        new_values ? JSON.stringify(new_values) : null,
        user_id,
        ip_address,
        user_agent,
        additional_info ? JSON.stringify(additional_info) : null,
        moment().format('YYYY-MM-DD HH:mm:ss')
      ];

      await this.executeQuery(query, params);
    } catch (error) {
      console.error('Audit logging error:', error);
      // Don't throw error to prevent disrupting main operations
    }
  }

  // Log database operations
  async logDatabaseOperation(tableName, recordId, action, oldData, newData, userId, req = null) {
    const auditData = {
      table_name: tableName,
      record_id: recordId,
      action: action.toUpperCase(),
      old_values: oldData,
      new_values: newData,
      user_id: userId,
      ip_address: req ? this.getClientIP(req) : null,
      user_agent: req ? req.get('User-Agent') : null
    };

    await this.logAuditEvent(auditData);
  }

  // Log authentication events
  async logAuthEvent(action, userId, username, success, req, additionalInfo = null) {
    const auditData = {
      table_name: 'users',
      record_id: userId,
      action: `AUTH_${action.toUpperCase()}`,
      old_values: null,
      new_values: { username, success },
      user_id: userId,
      ip_address: this.getClientIP(req),
      user_agent: req.get('User-Agent'),
      additional_info: additionalInfo
    };

    await this.logAuditEvent(auditData);
  }

  // Log security events
  async logSecurityEvent(eventType, userId, req, details = null) {
    const auditData = {
      table_name: 'security_events',
      record_id: null,
      action: `SECURITY_${eventType.toUpperCase()}`,
      old_values: null,
      new_values: details,
      user_id: userId,
      ip_address: this.getClientIP(req),
      user_agent: req.get('User-Agent'),
      additional_info: { event_type: eventType }
    };

    await this.logAuditEvent(auditData);
  }

  // Get audit trail for a specific record
  async getAuditTrail(tableName, recordId, limit = 50) {
    try {
      const query = `
        SELECT 
          al.*,
          u.username,
          u.full_name
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        WHERE al.table_name = ? AND al.record_id = ?
        ORDER BY al.created_at DESC
        LIMIT ?
      `;

      return await this.executeQuery(query, [tableName, recordId, limit]);
    } catch (error) {
      console.error('Get audit trail error:', error);
      return [];
    }
  }

  // Get audit summary for a date range
  async getAuditSummary(dateFrom, dateTo, userId = null) {
    try {
      let query = `
        SELECT 
          table_name,
          action,
          COUNT(*) as event_count,
          COUNT(DISTINCT user_id) as unique_users,
          MIN(created_at) as first_event,
          MAX(created_at) as last_event
        FROM audit_logs
        WHERE DATE(created_at) BETWEEN ? AND ?
      `;

      const params = [dateFrom, dateTo];

      if (userId) {
        query += ' AND user_id = ?';
        params.push(userId);
      }

      query += `
        GROUP BY table_name, action
        ORDER BY event_count DESC
      `;

      return await this.executeQuery(query, params);
    } catch (error) {
      console.error('Get audit summary error:', error);
      return [];
    }
  }

  // Data integrity checks
  async performIntegrityChecks() {
    const results = {
      timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
      checks: []
    };

    try {
      // Check for orphaned records
      const orphanChecks = await this.checkOrphanedRecords();
      results.checks.push(...orphanChecks);

      // Check data consistency
      const consistencyChecks = await this.checkDataConsistency();
      results.checks.push(...consistencyChecks);

      // Check for duplicate records
      const duplicateChecks = await this.checkDuplicateRecords();
      results.checks.push(...duplicateChecks);

      // Check referential integrity
      const referentialChecks = await this.checkReferentialIntegrity();
      results.checks.push(...referentialChecks);

      return results;
    } catch (error) {
      console.error('Integrity check error:', error);
      results.checks.push({
        check_name: 'integrity_check_error',
        status: 'ERROR',
        message: error.message,
        details: null
      });
      return results;
    }
  }

  // Check for orphaned records
  async checkOrphanedRecords() {
    const checks = [];

    try {
      // Check orphaned order items
      const orphanedOrderItems = await this.executeQuery(`
        SELECT COUNT(*) as count
        FROM order_items oi
        LEFT JOIN orders o ON oi.order_id = o.id
        WHERE o.id IS NULL
      `);

      checks.push({
        check_name: 'orphaned_order_items',
        status: orphanedOrderItems[0].count > 0 ? 'FAIL' : 'PASS',
        message: `Found ${orphanedOrderItems[0].count} orphaned order items`,
        details: { count: orphanedOrderItems[0].count }
      });

      // Check orphaned inventory records
      const orphanedInventory = await this.executeQuery(`
        SELECT COUNT(*) as count
        FROM inventory i
        LEFT JOIN products p ON i.product_id = p.id
        WHERE p.id IS NULL
      `);

      checks.push({
        check_name: 'orphaned_inventory',
        status: orphanedInventory[0].count > 0 ? 'FAIL' : 'PASS',
        message: `Found ${orphanedInventory[0].count} orphaned inventory records`,
        details: { count: orphanedInventory[0].count }
      });

      // Check orphaned stock movements
      const orphanedStockMovements = await this.executeQuery(`
        SELECT COUNT(*) as count
        FROM stock_movements sm
        LEFT JOIN products p ON sm.product_id = p.id
        WHERE p.id IS NULL
      `);

      checks.push({
        check_name: 'orphaned_stock_movements',
        status: orphanedStockMovements[0].count > 0 ? 'FAIL' : 'PASS',
        message: `Found ${orphanedStockMovements[0].count} orphaned stock movements`,
        details: { count: orphanedStockMovements[0].count }
      });

    } catch (error) {
      checks.push({
        check_name: 'orphaned_records_check',
        status: 'ERROR',
        message: `Error checking orphaned records: ${error.message}`,
        details: null
      });
    }

    return checks;
  }

  // Check data consistency
  async checkDataConsistency() {
    const checks = [];

    try {
      // Check inventory vs stock movements consistency
      const inventoryConsistency = await this.executeQuery(`
        SELECT 
          i.product_id,
          i.current_stock as inventory_stock,
          COALESCE(SUM(CASE 
            WHEN sm.movement_type = 'IN' THEN sm.quantity 
            WHEN sm.movement_type = 'OUT' THEN -sm.quantity 
            ELSE 0 
          END), 0) as calculated_stock
        FROM inventory i
        LEFT JOIN stock_movements sm ON i.product_id = sm.product_id
        GROUP BY i.product_id, i.current_stock
        HAVING inventory_stock != calculated_stock
      `);

      checks.push({
        check_name: 'inventory_stock_consistency',
        status: inventoryConsistency.length > 0 ? 'FAIL' : 'PASS',
        message: `Found ${inventoryConsistency.length} products with inconsistent stock levels`,
        details: { inconsistent_products: inventoryConsistency.length }
      });

      // Check order totals consistency
      const orderTotalsConsistency = await this.executeQuery(`
        SELECT 
          o.id,
          o.total as order_total,
          COALESCE(SUM(oi.total_price), 0) + COALESCE(o.tax_amount, 0) + COALESCE(o.service_charge, 0) - COALESCE(o.discount_amount, 0) as calculated_total
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        GROUP BY o.id, o.total, o.tax_amount, o.service_charge, o.discount_amount
        HAVING ABS(order_total - calculated_total) > 0.01
      `);

      checks.push({
        check_name: 'order_totals_consistency',
        status: orderTotalsConsistency.length > 0 ? 'FAIL' : 'PASS',
        message: `Found ${orderTotalsConsistency.length} orders with inconsistent totals`,
        details: { inconsistent_orders: orderTotalsConsistency.length }
      });

    } catch (error) {
      checks.push({
        check_name: 'data_consistency_check',
        status: 'ERROR',
        message: `Error checking data consistency: ${error.message}`,
        details: null
      });
    }

    return checks;
  }

  // Check for duplicate records
  async checkDuplicateRecords() {
    const checks = [];

    try {
      // Check duplicate products
      const duplicateProducts = await this.executeQuery(`
        SELECT name, COUNT(*) as count
        FROM products
        WHERE is_active = 1
        GROUP BY name
        HAVING count > 1
      `);

      checks.push({
        check_name: 'duplicate_products',
        status: duplicateProducts.length > 0 ? 'WARN' : 'PASS',
        message: `Found ${duplicateProducts.length} duplicate product names`,
        details: { duplicate_names: duplicateProducts.length }
      });

      // Check duplicate categories
      const duplicateCategories = await this.executeQuery(`
        SELECT name, COUNT(*) as count
        FROM categories
        WHERE is_active = 1
        GROUP BY name
        HAVING count > 1
      `);

      checks.push({
        check_name: 'duplicate_categories',
        status: duplicateCategories.length > 0 ? 'WARN' : 'PASS',
        message: `Found ${duplicateCategories.length} duplicate category names`,
        details: { duplicate_names: duplicateCategories.length }
      });

      // Check duplicate users
      const duplicateUsers = await this.executeQuery(`
        SELECT email, COUNT(*) as count
        FROM users
        WHERE is_active = 1
        GROUP BY email
        HAVING count > 1
      `);

      checks.push({
        check_name: 'duplicate_users',
        status: duplicateUsers.length > 0 ? 'FAIL' : 'PASS',
        message: `Found ${duplicateUsers.length} duplicate user emails`,
        details: { duplicate_emails: duplicateUsers.length }
      });

    } catch (error) {
      checks.push({
        check_name: 'duplicate_records_check',
        status: 'ERROR',
        message: `Error checking duplicate records: ${error.message}`,
        details: null
      });
    }

    return checks;
  }

  // Check referential integrity
  async checkReferentialIntegrity() {
    const checks = [];

    try {
      // Check products without categories
      const productsWithoutCategories = await this.executeQuery(`
        SELECT COUNT(*) as count
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.is_active = 1 AND (c.id IS NULL OR c.is_active = 0)
      `);

      checks.push({
        check_name: 'products_without_categories',
        status: productsWithoutCategories[0].count > 0 ? 'FAIL' : 'PASS',
        message: `Found ${productsWithoutCategories[0].count} products without valid categories`,
        details: { count: productsWithoutCategories[0].count }
      });

      // Check orders without valid tables
      const ordersWithoutTables = await this.executeQuery(`
        SELECT COUNT(*) as count
        FROM orders o
        LEFT JOIN tables t ON o.table_id = t.id
        WHERE o.order_type = 'dine_in' AND (t.id IS NULL OR t.is_active = 0)
      `);

      checks.push({
        check_name: 'orders_without_tables',
        status: ordersWithoutTables[0].count > 0 ? 'FAIL' : 'PASS',
        message: `Found ${ordersWithoutTables[0].count} dine-in orders without valid tables`,
        details: { count: ordersWithoutTables[0].count }
      });

    } catch (error) {
      checks.push({
        check_name: 'referential_integrity_check',
        status: 'ERROR',
        message: `Error checking referential integrity: ${error.message}`,
        details: null
      });
    }

    return checks;
  }

  // Helper method to get client IP
  getClientIP(req) {
    return req.ip || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
           req.headers['x-forwarded-for']?.split(',')[0] ||
           'unknown';
  }

  // Database helper method
  async executeQuery(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }
}

module.exports = AuditService;