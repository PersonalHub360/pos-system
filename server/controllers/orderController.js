class OrderController {
  constructor(db) {
    this.db = db;
  }

  // Create new order
  async createOrder(req, res) {
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
        return res.status(400).json({ error: 'Order must contain at least one item' });
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

        // Check stock availability for products with inventory tracking
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
          paymentMethod,
          notes,
          createdBy: req.user?.id
        });

        // Insert order items and update inventory
        for (const item of items) {
          const product = await this.getProductById(item.product_id);
          const itemTotal = product.price * item.quantity;

          await this.insertOrderItem({
            orderId,
            productId: item.product_id,
            quantity: item.quantity,
            unitPrice: product.price
          });

          // Update inventory for products with inventory tracking
          if (product.current_stock !== null) {
            await this.updateInventoryStock(item.product_id, -item.quantity);
            
            // Log stock movement
            await this.logStockMovement({
              productId: item.product_id,
              movementType: 'out',
              quantity: item.quantity,
              referenceType: 'order',
              referenceId: orderId,
              createdBy: req.user?.id
            });
          }
        }

        // Update table status if table is specified
        if (tableId) {
          await this.updateTableStatus(tableId, 'occupied');
        }

        await this.commitTransaction();

        // Fetch complete order data
        const orderData = await this.getOrderById(orderId);

        res.status(201).json({
          message: 'Order created successfully',
          order: orderData
        });
      } catch (error) {
        await this.rollbackTransaction();
        throw error;
      }
    } catch (error) {
      console.error('Create order error:', error);
      res.status(500).json({ error: 'Failed to create order' });
    }
  }

  // Get all orders with filters
  async getAllOrders(req, res) {
    try {
      const {
        status,
        orderType,
        tableId,
        dateFrom,
        dateTo,
        page = 1,
        limit = 50
      } = req.query;

      let query = `
        SELECT 
          o.*,
          t.table_number,
          t.table_name,
          u1.username as created_by_username,
          u2.username as served_by_username,
          GROUP_CONCAT(
            p.name || ' x' || oi.quantity || 
            CASE WHEN oi.notes THEN ' (' || oi.notes || ')' ELSE '' END
          ) as items_summary
        FROM orders o
        LEFT JOIN users u1 ON o.created_by = u1.id
        LEFT JOIN users u2 ON o.served_by = u2.id
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE 1=1
      `;

      const params = [];

      if (status) {
        query += ' AND o.order_status = ?';
        params.push(status);
      }

      if (orderType) {
        query += ' AND o.order_type = ?';
        params.push(orderType);
      }

      // Note: tableId filter removed as orders table doesn't have table_id column

      if (dateFrom) {
        query += ' AND DATE(o.created_at) >= ?';
        params.push(dateFrom);
      }

      if (dateTo) {
        query += ' AND DATE(o.created_at) <= ?';
        params.push(dateTo);
      }

      query += ' GROUP BY o.id ORDER BY o.created_at DESC';

      // Add pagination
      const offset = (page - 1) * limit;
      query += ' LIMIT ? OFFSET ?';
      params.push(parseInt(limit), offset);

      const orders = await this.executeQuery(query, params);

      // Get total count
      let countQuery = `
        SELECT COUNT(DISTINCT o.id) as total
        FROM orders o
        WHERE 1=1
      `;
      const countParams = [];

      if (status) {
        countQuery += ' AND o.order_status = ?';
        countParams.push(status);
      }

      if (orderType) {
        countQuery += ' AND o.order_type = ?';
        countParams.push(orderType);
      }

      // Note: tableId filter removed as orders table doesn't have table_id column

      if (dateFrom) {
        countQuery += ' AND DATE(o.created_at) >= ?';
        countParams.push(dateFrom);
      }

      if (dateTo) {
        countQuery += ' AND DATE(o.created_at) <= ?';
        countParams.push(dateTo);
      }

      const countResult = await this.executeQuery(countQuery, countParams);
      const total = countResult[0].total;

      res.json({
        orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Get orders error:', error);
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  }

  // Get single order by ID
  async getOrderDetails(req, res) {
    try {
      const { id } = req.params;
      const order = await this.getOrderById(id);

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      res.json(order);
    } catch (error) {
      console.error('Get order details error:', error);
      res.status(500).json({ error: 'Failed to fetch order details' });
    }
  }

  // Update order status
  async updateOrderStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, servedBy } = req.body;

      const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid order status' });
      }

      // Check if order exists
      const existingOrder = await this.executeQuery('SELECT * FROM orders WHERE id = ?', [id]);
      if (existingOrder.length === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }

      const updateData = { status: status };
      if (servedBy) updateData.served_by = servedBy;

      await this.updateOrder(id, updateData);

      // Note: Table management removed as orders table doesn't have table_id column

      // Emit real-time event for order completion
      if (status === 'completed') {
        const completedOrder = await this.getOrderById(id);
        if (global.realTimeSync) {
          global.realTimeSync.emit('order:completed', completedOrder);
        }
      }

      res.json({ message: 'Order status updated successfully' });
    } catch (error) {
      console.error('Update order status error:', error);
      res.status(500).json({ error: 'Failed to update order status' });
    }
  }

  // Cancel order
  async cancelOrder(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      // Get order details
      const order = await this.getOrderById(id);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      if (order.order_status === 'completed') {
        return res.status(400).json({ error: 'Cannot cancel completed order' });
      }

      await this.beginTransaction();

      try {
        // Update order status
        await this.updateOrder(id, {
          order_status: 'cancelled',
          notes: order.notes ? `${order.notes}\nCancelled: ${reason}` : `Cancelled: ${reason}`
        });

        // Restore inventory for products with inventory tracking
        const orderItems = await this.getOrderItems(id);
        for (const item of orderItems) {
          const product = await this.getProductById(item.product_id);
          if (product && product.current_stock !== null) {
            await this.updateInventoryStock(item.product_id, item.quantity);
            
            // Log stock movement
            await this.logStockMovement({
              productId: item.product_id,
              movementType: 'in',
              quantity: item.quantity,
              referenceType: 'order_cancellation',
              referenceId: id,
              notes: `Order cancellation: ${reason}`,
              createdBy: req.user?.id
            });
          }
        }

        // Note: Table management removed as orders table doesn't have table_id column

        await this.commitTransaction();

        res.json({ message: 'Order cancelled successfully' });
      } catch (error) {
        await this.rollbackTransaction();
        throw error;
      }
    } catch (error) {
      console.error('Cancel order error:', error);
      res.status(500).json({ error: 'Failed to cancel order' });
    }
  }

  // Get order analytics
  async getOrderAnalytics(req, res) {
    try {
      const { dateFrom, dateTo } = req.query;
      
      let dateFilter = '';
      const params = [];
      
      if (dateFrom && dateTo) {
        dateFilter = 'WHERE DATE(created_at) BETWEEN ? AND ?';
        params.push(dateFrom, dateTo);
      } else if (dateFrom) {
        dateFilter = 'WHERE DATE(created_at) >= ?';
        params.push(dateFrom);
      } else if (dateTo) {
        dateFilter = 'WHERE DATE(created_at) <= ?';
        params.push(dateTo);
      }

      // Total orders and revenue
      const totalQuery = `
        SELECT 
          COUNT(*) as total_orders,
          SUM(total) as total_revenue,
          AVG(total) as average_order_value,
          SUM(CASE WHEN order_status = 'completed' THEN 1 ELSE 0 END) as completed_orders,
          SUM(CASE WHEN order_status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders
        FROM orders ${dateFilter}
      `;

      // Orders by status
      const statusQuery = `
        SELECT 
          order_status,
          COUNT(*) as count,
          SUM(total) as revenue
        FROM orders ${dateFilter}
        GROUP BY order_status
      `;

      // Orders by type
      const typeQuery = `
        SELECT 
          order_type,
          COUNT(*) as count,
          SUM(total) as revenue
        FROM orders ${dateFilter}
        GROUP BY order_type
      `;

      // Top selling products
      const topProductsQuery = `
        SELECT 
          p.name,
          SUM(oi.quantity) as total_quantity,
          SUM(oi.total_price) as total_revenue
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN orders o ON oi.order_id = o.id
        ${dateFilter}
        GROUP BY p.id, p.name
        ORDER BY total_quantity DESC
        LIMIT 10
      `;

      const [totals, statusBreakdown, typeBreakdown, topProducts] = await Promise.all([
        this.executeQuery(totalQuery, params),
        this.executeQuery(statusQuery, params),
        this.executeQuery(typeQuery, params),
        this.executeQuery(topProductsQuery, params)
      ]);

      res.json({
        totals: totals[0],
        statusBreakdown,
        typeBreakdown,
        topProducts
      });
    } catch (error) {
      console.error('Get order analytics error:', error);
      res.status(500).json({ error: 'Failed to fetch order analytics' });
    }
  }

  // Helper methods
  async generateOrderNumber() {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    
    // Get today's order count
    const countResult = await this.executeQuery(
      'SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) = DATE(?)',
      [date.toISOString()]
    );
    
    const orderCount = countResult[0].count + 1;
    return `ORD-${dateStr}-${orderCount.toString().padStart(4, '0')}`;
  }

  async getProductById(id) {
    const products = await this.executeQuery(`
      SELECT p.*, i.current_stock
      FROM products p
      LEFT JOIN inventory i ON p.id = i.product_id
      WHERE p.id = ?
    `, [id]);
    return products[0];
  }

  async getOrderById(id) {
    const orders = await this.executeQuery(`
      SELECT 
        o.*
      FROM orders o
      WHERE o.id = ?
    `, [id]);

    if (orders.length === 0) return null;

    const order = orders[0];
    
    // Get order items
    const items = await this.executeQuery(`
      SELECT 
        oi.*,
        p.name as product_name,
        p.image_url
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `, [id]);

    order.items = items;
    return order;
  }

  async getOrderItems(orderId) {
    return this.executeQuery('SELECT * FROM order_items WHERE order_id = ?', [orderId]);
  }

  // Database helper methods (similar to ProductController)
  async executeQuery(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
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
        // Don't reject if there's no active transaction
        if (err && err.message && err.message.includes('no transaction is active')) {
          resolve();
        } else if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async insertOrder(orderData) {
    return new Promise((resolve, reject) => {
      const {
        orderNumber, tableId, customerName, customerPhone, customerEmail,
        orderType, subtotal, discountAmount, discountType, taxAmount,
        serviceCharge, total, paymentMethod, notes, createdBy
      } = orderData;

      this.db.run(`
        INSERT INTO orders (
          order_number, subtotal, discount, total, status
        ) VALUES (?, ?, ?, ?, ?)
      `, [
        orderNumber, subtotal, discountAmount || 0, total, 'pending'
      ], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }

  async insertOrderItem(itemData) {
    return new Promise((resolve, reject) => {
      const { orderId, productId, quantity, unitPrice, totalPrice, notes } = itemData;
      
      this.db.run(`
        INSERT INTO order_items (order_id, product_id, quantity, price)
        VALUES (?, ?, ?, ?)
      `, [orderId, productId, quantity, unitPrice], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }

  async updateOrder(id, updateData) {
    const fields = [];
    const values = [];

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(updateData[key]);
      }
    });

    if (fields.length === 0) return;

    values.push(id);

    return new Promise((resolve, reject) => {
      this.db.run(`UPDATE orders SET ${fields.join(', ')} WHERE id = ?`, values, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async updateInventoryStock(productId, quantityChange) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE inventory SET current_stock = current_stock + ?, updated_at = CURRENT_TIMESTAMP WHERE product_id = ?',
        [quantityChange, productId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  async updateTableStatus(tableId, status) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE tables SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [status, tableId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  async logStockMovement(movementData) {
    return new Promise((resolve, reject) => {
      const { productId, movementType, quantity, referenceType, referenceId, notes, createdBy } = movementData;
      
      this.db.run(`
        INSERT INTO stock_movements (
          product_id, movement_type, quantity, reference_type, reference_id, notes, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [productId, movementType, quantity, referenceType, referenceId, notes, createdBy], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }
}

module.exports = OrderController;