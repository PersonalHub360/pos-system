const BaseController = require('./baseController');

class SalesController extends BaseController {
  constructor(db) {
    super(db);
  }

  // ============================================================================
  // SALES MANAGEMENT
  // ============================================================================

  /**
   * Get all sales with pagination and filtering
   */
  async getAllSales(req, res) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        startDate, 
        endDate, 
        status, 
        paymentMethod,
        search 
      } = req.query;

      const offset = (page - 1) * limit;
      let whereClause = 'WHERE 1=1';
      const params = [];

      // Add filters
      if (startDate) {
        whereClause += ' AND DATE(o.created_at) >= ?';
        params.push(startDate);
      }
      if (endDate) {
        whereClause += ' AND DATE(o.created_at) <= ?';
        params.push(endDate);
      }
      if (status) {
        whereClause += ' AND o.order_status = ?';
        params.push(status);
      }
      if (paymentMethod) {
        whereClause += ' AND p.payment_method = ?';
        params.push(paymentMethod);
      }
      if (search) {
        whereClause += ' AND (o.order_number LIKE ? OR o.customer_name LIKE ? OR o.customer_phone LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      const query = `
        SELECT 
          o.id,
          o.order_number,
          o.customer_name,
          o.customer_phone,
          o.customer_email,
          o.order_type,
          o.order_status,
          o.subtotal,
          o.discount_amount,
          o.tax_amount,
          o.service_charge,
          o.total,
          o.created_at,
          o.updated_at,
          p.payment_method,
          p.status as payment_status,
          t.table_number,
          u.username as created_by_name
        FROM orders o
        LEFT JOIN payments p ON o.id = p.order_id
        LEFT JOIN tables t ON o.table_id = t.id
        LEFT JOIN users u ON o.created_by = u.id
        ${whereClause}
        ORDER BY o.created_at DESC
        LIMIT ? OFFSET ?
      `;

      params.push(parseInt(limit), offset);
      const sales = await this.executeQuery(query, params);

      // Get total count for pagination
      const countQuery = `
        SELECT COUNT(DISTINCT o.id) as total
        FROM orders o
        LEFT JOIN payments p ON o.id = p.order_id
        LEFT JOIN tables t ON o.table_id = t.id
        LEFT JOIN users u ON o.created_by = u.id
        ${whereClause}
      `;
      
      const countParams = params.slice(0, -2); // Remove limit and offset
      const totalResult = await this.executeQuerySingle(countQuery, countParams);
      const total = totalResult?.total || 0;

      res.json({
        success: true,
        data: sales,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching sales:', error);
      res.status(500).json({ error: 'Failed to fetch sales data' });
    }
  }

  /**
   * Get sales by ID with detailed information
   */
  async getSaleById(req, res) {
    try {
      const { id } = req.params;

      const saleQuery = `
        SELECT 
          o.*,
          p.payment_method,
          p.status as payment_status,
          p.reference_number,
          t.table_number,
          u.username as created_by_name
        FROM orders o
        LEFT JOIN payments p ON o.id = p.order_id
        LEFT JOIN tables t ON o.table_id = t.id
        LEFT JOIN users u ON o.created_by = u.id
        WHERE o.id = ?
      `;

      const sale = await this.executeQuerySingle(saleQuery, [id]);
      
      if (!sale) {
        return res.status(404).json({ error: 'Sale not found' });
      }

      // Get order items
      const itemsQuery = `
        SELECT 
          oi.*,
          p.name as product_name,
          p.sku,
          c.name as category_name
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE oi.order_id = ?
        ORDER BY oi.id
      `;

      const items = await this.executeQuery(itemsQuery, [id]);
      sale.items = items;

      res.json({
        success: true,
        data: sale
      });
    } catch (error) {
      console.error('Error fetching sale:', error);
      res.status(500).json({ error: 'Failed to fetch sale data' });
    }
  }

  /**
   * Create a new sale
   */
  async createSale(req, res) {
    try {
      const {
        tableId,
        customerName,
        customerPhone,
        customerEmail,
        orderType = 'dine_in',
        items,
        discountAmount = 0,
        discountType,
        serviceCharge = 0,
        notes,
        paymentMethod
      } = req.body;

      // Validate required fields
      if (!items || items.length === 0) {
        return res.status(400).json({ error: 'Sale must contain at least one item' });
      }

      // Generate order number
      const orderNumber = await this.generateOrderNumber();

      // Calculate totals
      let subtotal = 0;
      let taxAmount = 0;

      // Validate items and calculate totals
      for (const item of items) {
        if (!item.product_id || !item.quantity || item.quantity <= 0) {
          return res.status(400).json({ error: 'Invalid item data' });
        }

        // Get product details
        const product = await this.getProductById(item.product_id);
        if (!product) {
          return res.status(404).json({ error: `Product with ID ${item.product_id} not found` });
        }

        // Check stock availability
        if (product.current_stock !== null && product.current_stock < item.quantity) {
          return res.status(400).json({ 
            error: `Insufficient stock for ${product.name}. Available: ${product.current_stock}, Requested: ${item.quantity}` 
          });
        }

        const itemTotal = product.price * item.quantity;
        const itemTax = itemTotal * ((product.tax_rate || 0) / 100);
        
        subtotal += itemTotal;
        taxAmount += itemTax;
      }

      const total = subtotal + taxAmount + serviceCharge - discountAmount;

      // Start transaction
      await this.beginTransaction();

      try {
        // Create order
        const orderId = await this.insertOrder({
          orderNumber,
          tableId,
          customerName,
          customerPhone,
          customerEmail,
          orderType,
          subtotal,
          discountAmount,
          discountType,
          taxAmount,
          serviceCharge,
          total,
          notes,
          createdBy: req.user?.id
        });

        // Insert order items
        for (const item of items) {
          const product = await this.getProductById(item.product_id);
          
          await this.insertOrderItem({
            orderId,
            productId: item.product_id,
            quantity: item.quantity,
            unitPrice: product.price,
            totalPrice: product.price * item.quantity,
            notes: item.notes
          });

          // Update inventory
          if (product.current_stock !== null) {
            await this.updateInventoryStock(item.product_id, -item.quantity);
          }
        }

        // Create payment record if payment method is provided
        if (paymentMethod) {
          await this.insertPayment({
            orderId,
            paymentMethod,
            amount: total,
            processedBy: req.user?.id
          });
        }

        await this.commitTransaction();

        // Get the created sale with details
        const createdSale = await this.getSaleDetails(orderId);

        res.status(201).json({
          success: true,
          message: 'Sale created successfully',
          data: createdSale
        });

      } catch (error) {
        await this.rollbackTransaction();
        throw error;
      }

    } catch (error) {
      console.error('Error creating sale:', error);
      res.status(500).json({ error: 'Failed to create sale' });
    }
  }

  /**
   * Update sale status
   */
  async updateSaleStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      const updateQuery = `
        UPDATE orders 
        SET order_status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      const result = await this.executeUpdate(updateQuery, [status, id]);

      if (result.changes === 0) {
        return res.status(404).json({ error: 'Sale not found' });
      }

      res.json({
        success: true,
        message: 'Sale status updated successfully'
      });

    } catch (error) {
      console.error('Error updating sale status:', error);
      res.status(500).json({ error: 'Failed to update sale status' });
    }
  }

  // ============================================================================
  // DISCOUNT PLANS MANAGEMENT
  // ============================================================================

  /**
   * Get all discount plans
   */
  async getDiscountPlans(req, res) {
    try {
      const query = `
        SELECT * FROM discount_plans 
        WHERE status = 'active'
        ORDER BY created_at DESC
      `;

      const discountPlans = await this.executeQuery(query);

      res.json({
        success: true,
        data: discountPlans
      });
    } catch (error) {
      console.error('Error fetching discount plans:', error);
      res.status(500).json({ error: 'Failed to fetch discount plans' });
    }
  }

  /**
   * Create discount plan
   */
  async createDiscountPlan(req, res) {
    try {
      const {
        name,
        description,
        discountType,
        discountValue,
        minOrderAmount,
        maxDiscountAmount,
        validFrom,
        validTo,
        isActive = true
      } = req.body;

      // Validate required fields
      if (!name || !discountType || !discountValue) {
        return res.status(400).json({ error: 'Name, discount type, and discount value are required' });
      }

      const insertQuery = `
        INSERT INTO discount_plans (
          name, description, discount_type, discount_value,
          min_order_amount, max_discount_amount, valid_from, valid_to,
          status, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `;

      const result = await this.executeUpdate(insertQuery, [
        name, description, discountType, discountValue,
        minOrderAmount, maxDiscountAmount, validFrom, validTo,
        isActive ? 'active' : 'inactive', req.user?.id
      ]);

      res.status(201).json({
        success: true,
        message: 'Discount plan created successfully',
        data: { id: result.lastID }
      });

    } catch (error) {
      console.error('Error creating discount plan:', error);
      res.status(500).json({ error: 'Failed to create discount plan' });
    }
  }

  // ============================================================================
  // SALES ANALYTICS
  // ============================================================================

  /**
   * Get sales analytics
   */
  async getSalesAnalytics(req, res) {
    try {
      const { startDate, endDate } = req.query;
      
      let dateFilter = '';
      const params = [];
      
      if (startDate && endDate) {
        dateFilter = 'WHERE DATE(created_at) BETWEEN ? AND ?';
        params.push(startDate, endDate);
      }

      // Total sales
      const totalSalesQuery = `
        SELECT 
          COUNT(*) as total_orders,
          COALESCE(SUM(total), 0) as total_revenue,
          COALESCE(SUM(discount_amount), 0) as total_discount,
          COALESCE(AVG(total), 0) as average_order_value
        FROM orders 
        ${dateFilter}
      `;

      const totalSales = await this.executeQuerySingle(totalSalesQuery, params);

      // Sales by payment method
      const paymentMethodQuery = `
        SELECT 
          p.payment_method,
          COUNT(*) as count,
          COALESCE(SUM(o.total), 0) as total
        FROM orders o
        LEFT JOIN payments p ON o.id = p.order_id
        ${dateFilter}
        GROUP BY p.payment_method
      `;

      const paymentMethods = await this.executeQuery(paymentMethodQuery, params);

      // Top selling products
      const topProductsQuery = `
        SELECT 
          p.name,
          p.sku,
          SUM(oi.quantity) as total_quantity,
          COALESCE(SUM(oi.total_price), 0) as total_revenue
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN orders o ON oi.order_id = o.id
        ${dateFilter.replace('created_at', 'o.created_at')}
        GROUP BY p.id, p.name, p.sku
        ORDER BY total_quantity DESC
        LIMIT 10
      `;

      const topProducts = await this.executeQuery(topProductsQuery, params);

      res.json({
        success: true,
        data: {
          totalSales,
          paymentMethods,
          topProducts
        }
      });

    } catch (error) {
      console.error('Error fetching sales analytics:', error);
      res.status(500).json({ error: 'Failed to fetch sales analytics' });
    }
  }

  // ============================================================================
  // DISCOUNT PLANS MANAGEMENT
  // ============================================================================

  /**
   * Get all discount plans
   */
  async getDiscountPlans(req, res) {
    try {
      const query = `
        SELECT 
          id,
          name,
          description,
          discount_type,
          discount_value,
          min_order_amount,
          max_discount_amount,
          valid_from,
          valid_to,
          usage_limit,
          used_count,
          status,
          created_by,
          created_at,
          updated_at
        FROM discount_plans
        WHERE status = 'active'
        ORDER BY created_at DESC
      `;

      const discountPlans = await this.executeQuery(query);

      res.json({
        success: true,
        data: discountPlans
      });
    } catch (error) {
      console.error('Error fetching discount plans:', error);
      res.status(500).json({ error: 'Failed to fetch discount plans' });
    }
  }

  /**
   * Create new discount plan
   */
  async createDiscountPlan(req, res) {
    try {
      const {
        name,
        description,
        discountType,
        discountValue,
        minOrderAmount = 0,
        maxDiscountAmount,
        validFrom,
        validTo,
        usageLimit,
        status = 'active'
      } = req.body;

      // Validate required fields
      if (!name || !discountType || !discountValue) {
        return res.status(400).json({ 
          error: 'Name, discount type, and discount value are required' 
        });
      }

      // Validate discount type
      if (!['percentage', 'fixed'].includes(discountType)) {
        return res.status(400).json({ 
          error: 'Discount type must be either "percentage" or "fixed"' 
        });
      }

      // Validate discount value
      if (discountType === 'percentage' && (discountValue < 0 || discountValue > 100)) {
        return res.status(400).json({ 
          error: 'Percentage discount must be between 0 and 100' 
        });
      }

      if (discountType === 'fixed' && discountValue < 0) {
        return res.status(400).json({ 
          error: 'Fixed discount amount must be positive' 
        });
      }

      const query = `
        INSERT INTO discount_plans (
          name, description, discount_type, discount_value, min_order_amount,
          max_discount_amount, valid_from, valid_to, usage_limit, used_count,
          status, created_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `;

      const result = await this.executeUpdate(query, [
        name, description, discountType, discountValue, minOrderAmount,
        maxDiscountAmount, validFrom, validTo, usageLimit, status, req.user?.id
      ]);

      // Get the created discount plan
      const createdPlan = await this.executeQuerySingle(
        'SELECT * FROM discount_plans WHERE id = ?',
        [result.lastID]
      );

      res.status(201).json({
        success: true,
        message: 'Discount plan created successfully',
        data: createdPlan
      });

    } catch (error) {
      console.error('Error creating discount plan:', error);
      res.status(500).json({ error: 'Failed to create discount plan' });
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  async generateOrderNumber() {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const countQuery = `SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) = DATE('now')`;
    const result = await this.executeQuerySingle(countQuery);
    const orderCount = (result?.count || 0) + 1;
    return `ORD-${today}-${orderCount.toString().padStart(4, '0')}`;
  }

  async getProductById(productId) {
    const query = `
      SELECT p.*, i.current_stock 
      FROM products p
      LEFT JOIN inventory i ON p.id = i.product_id
      WHERE p.id = ?
    `;
    return await this.executeQuerySingle(query, [productId]);
  }

  async insertOrder(orderData) {
    const query = `
      INSERT INTO orders (
        order_number, table_id, customer_name, customer_phone, customer_email,
        order_type, subtotal, discount_amount, discount_type, tax_amount,
        service_charge, total, notes, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;

    const result = await this.executeUpdate(query, [
      orderData.orderNumber, orderData.tableId, orderData.customerName,
      orderData.customerPhone, orderData.customerEmail, orderData.orderType,
      orderData.subtotal, orderData.discountAmount, orderData.discountType,
      orderData.taxAmount, orderData.serviceCharge, orderData.total,
      orderData.notes, orderData.createdBy
    ]);

    return result.lastID;
  }

  async insertOrderItem(itemData) {
    const query = `
      INSERT INTO order_items (
        order_id, product_id, quantity, unit_price, total_price, notes
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;

    return await this.executeUpdate(query, [
      itemData.orderId, itemData.productId, itemData.quantity,
      itemData.unitPrice, itemData.totalPrice, itemData.notes
    ]);
  }

  async insertPayment(paymentData) {
    const query = `
      INSERT INTO payments (
        order_id, payment_method, amount, processed_by, processed_at
      ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;

    return await this.executeUpdate(query, [
      paymentData.orderId, paymentData.paymentMethod,
      paymentData.amount, paymentData.processedBy
    ]);
  }

  async updateInventoryStock(productId, quantityChange) {
    const query = `
      UPDATE inventory 
      SET current_stock = current_stock + ?, updated_at = CURRENT_TIMESTAMP
      WHERE product_id = ?
    `;
    return await this.executeUpdate(query, [quantityChange, productId]);
  }

  async getSaleDetails(orderId) {
    const query = `
      SELECT 
        o.*,
        p.payment_method,
        p.status as payment_status
      FROM orders o
      LEFT JOIN payments p ON o.id = p.order_id
      WHERE o.id = ?
    `;
    return await this.executeQuerySingle(query, [orderId]);
  }

  async beginTransaction() {
    return new Promise((resolve, reject) => {
      this.db.run('BEGIN TRANSACTION', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async commitTransaction() {
    return new Promise((resolve, reject) => {
      this.db.run('COMMIT', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async rollbackTransaction() {
    return new Promise((resolve, reject) => {
      this.db.run('ROLLBACK', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

module.exports = SalesController;