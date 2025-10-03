/**
 * Real-time Data Synchronization Middleware
 * Handles automatic data propagation between modules using database triggers and event listeners
 */

const EventEmitter = require('events');

class RealTimeSyncManager extends EventEmitter {
  constructor(db, io = null) {
    super();
    this.db = db;
    this.io = io; // Socket.IO instance for real-time updates
    this.setupDatabaseTriggers();
    this.setupEventListeners();
  }

  /**
   * Setup database triggers for automatic data synchronization
   */
  setupDatabaseTriggers() {
    const triggers = [
      // Inventory update trigger when order is created
      `
      CREATE TRIGGER IF NOT EXISTS update_inventory_on_order_item
      AFTER INSERT ON order_items
      BEGIN
        UPDATE inventory 
        SET current_stock = current_stock - NEW.quantity,
            updated_at = datetime('now')
        WHERE product_id = NEW.product_id 
        AND current_stock IS NOT NULL;
        
        INSERT INTO stock_movements (
          product_id, movement_type, quantity, 
          reference_id, reference_type,
          notes, created_at
        )
        SELECT 
          NEW.product_id, 'sale', NEW.quantity,
          NEW.order_id, 'order',
          'Automatic stock reduction from order #' || NEW.order_id,
          datetime('now')
        FROM inventory i 
        WHERE i.product_id = NEW.product_id AND i.current_stock IS NOT NULL;
      END;
      `,

      // Restore inventory when order is cancelled
      `
      CREATE TRIGGER IF NOT EXISTS restore_inventory_on_order_cancel
      AFTER UPDATE OF status ON orders
      WHEN NEW.status = 'cancelled' AND OLD.status != 'cancelled'
      BEGIN
        UPDATE inventory 
        SET current_stock = current_stock + (
          SELECT SUM(oi.quantity) 
          FROM order_items oi 
          WHERE oi.order_id = NEW.id
        ),
        updated_at = datetime('now')
        WHERE product_id IN (
          SELECT DISTINCT oi.product_id 
          FROM order_items oi 
          WHERE oi.order_id = NEW.id
        ) AND current_stock IS NOT NULL;
        
        INSERT INTO stock_movements (
          product_id, movement_type, quantity, 
          reference_id, reference_type,
          notes, created_at
        )
        SELECT 
          oi.product_id, 'return', oi.quantity,
          NEW.id, 'order_cancel',
          'Automatic stock restoration from cancelled order #' || NEW.id,
          datetime('now')
        FROM order_items oi
        JOIN inventory i ON i.product_id = oi.product_id
        WHERE oi.order_id = NEW.id AND i.current_stock IS NOT NULL;
      END;
      `,

      // Note: Table management triggers removed as orders table doesn't have table_id column

      // Update daily sales summary
      `
      CREATE TRIGGER IF NOT EXISTS update_daily_sales_on_order_complete
      AFTER UPDATE OF status ON orders
      WHEN NEW.status = 'completed' AND OLD.status != 'completed'
      BEGIN
        INSERT OR REPLACE INTO daily_sales_summary (
          date, total_orders, total_revenue, created_at, updated_at
        )
        SELECT 
          date(NEW.created_at) as date,
          COUNT(*) as total_orders,
          SUM(total) as total_revenue,
          datetime('now') as created_at,
          datetime('now') as updated_at
        FROM orders o
        WHERE date(o.created_at) = date(NEW.created_at)
        AND o.status = 'completed';
      END;
      `,

      // Audit log trigger for sensitive operations
      `
      CREATE TRIGGER IF NOT EXISTS audit_product_changes
      AFTER UPDATE ON products
      BEGIN
        INSERT INTO audit_log (
          table_name, record_id, action, old_values, new_values,
          user_id, created_at
        )
        VALUES (
          'products', NEW.id, 'UPDATE',
          json_object(
            'name', OLD.name, 'price', OLD.price, 'cost', OLD.cost,
            'is_active', OLD.is_active
          ),
          json_object(
            'name', NEW.name, 'price', NEW.price, 'cost', NEW.cost,
            'is_active', NEW.is_active
          ),
          NULL, -- Will be updated by application layer
          datetime('now')
        );
      END;
      `,

      `
      CREATE TRIGGER IF NOT EXISTS audit_user_changes
      AFTER UPDATE ON users
      BEGIN
        INSERT INTO audit_log (
          table_name, record_id, action, old_values, new_values,
          user_id, created_at
        )
        VALUES (
          'users', NEW.id, 'UPDATE',
          json_object(
            'username', OLD.username, 'email', OLD.email, 'role', OLD.role,
            'status', OLD.status
          ),
          json_object(
            'username', NEW.username, 'email', NEW.email, 'role', NEW.role,
            'status', NEW.status
          ),
          NULL,
          datetime('now')
        );
      END;
      `
    ];

    // Execute all triggers
    triggers.forEach((trigger, index) => {
      this.db.exec(trigger, (err) => {
        if (err) {
          console.error(`Error creating trigger ${index + 1}:`, err);
        } else {
          console.log(`Database trigger ${index + 1} created successfully`);
        }
      });
    });
  }

  /**
   * Calculate real-time sales metrics
   */
  async calculateSalesMetrics() {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const salesQuery = `
        SELECT 
          SUM(CASE WHEN DATE(created_at) = ? AND order_status = 'completed' THEN total ELSE 0 END) as today_sales,
          COUNT(CASE WHEN DATE(created_at) = ? AND order_status = 'completed' THEN 1 END) as today_orders,
          SUM(CASE WHEN DATE(created_at) = ? AND order_status = 'completed' THEN discount_amount ELSE 0 END) as today_discounts,
          AVG(CASE WHEN DATE(created_at) = ? AND order_status = 'completed' THEN total END) as avg_order_value,
          SUM(CASE WHEN DATE(created_at) >= DATE('now', '-7 days') AND order_status = 'completed' THEN total ELSE 0 END) as weekly_sales,
          SUM(CASE WHEN DATE(created_at) >= DATE('now', 'start of month') AND order_status = 'completed' THEN total ELSE 0 END) as monthly_sales
        FROM orders
      `;

      const result = await this.executeQuery(salesQuery, [today, today, today, today]);
      
      return result[0] || {
        today_sales: 0,
        today_orders: 0,
        today_discounts: 0,
        avg_order_value: 0,
        weekly_sales: 0,
        monthly_sales: 0
      };
    } catch (error) {
      console.error('Error calculating sales metrics:', error);
      return {};
    }
  }

  /**
   * Calculate inventory metrics
   */
  async calculateInventoryMetrics() {
    try {
      const inventoryQuery = `
        SELECT 
          COUNT(*) as total_products,
          SUM(CASE WHEN current_stock <= min_stock THEN 1 ELSE 0 END) as low_stock_items,
          SUM(CASE WHEN current_stock = 0 THEN 1 ELSE 0 END) as out_of_stock_items,
          SUM(current_stock * (SELECT price FROM products WHERE id = inventory.product_id)) as total_inventory_value
        FROM inventory 
        WHERE is_trackable = 1
      `;

      const result = await this.executeQuery(inventoryQuery);
      
      return result[0] || {
        total_products: 0,
        low_stock_items: 0,
        out_of_stock_items: 0,
        total_inventory_value: 0
      };
    } catch (error) {
      console.error('Error calculating inventory metrics:', error);
      return {};
    }
  }

  /**
   * Database query helper
   */
  executeQuery(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }
  setupEventListeners() {
    // Order events
    this.on('order:created', this.handleOrderCreated.bind(this));
    this.on('order:updated', this.handleOrderUpdated.bind(this));
    this.on('order:cancelled', this.handleOrderCancelled.bind(this));

    // Listen for order completion events
    this.on('order:completed', async (orderData) => {
      try {
        // Calculate updated metrics
        const salesMetrics = await this.calculateSalesMetrics();
        const inventoryMetrics = await this.calculateInventoryMetrics();
        
        // Emit real-time dashboard update with comprehensive metrics
        this.io.emit('dashboard:update', {
          type: 'order_completed',
          data: orderData,
          metrics: {
            sales: salesMetrics,
            inventory: inventoryMetrics
          },
          timestamp: new Date()
        });

        // Emit sales metrics update
        this.io.emit('dashboard:sales_update', {
          ...salesMetrics,
          last_order: orderData,
          timestamp: new Date()
        });

        // Emit inventory update if items were sold
        if (orderData.items && orderData.items.length > 0) {
          this.io.emit('inventory:update', {
            type: 'items_sold',
            items: orderData.items.map(item => ({
              product_id: item.product_id,
              quantity_sold: item.quantity,
              timestamp: new Date()
            })),
            timestamp: new Date()
          });
        }

        console.log('Real-time dashboard updates sent for completed order:', orderData.id);
      } catch (error) {
        console.error('Error handling order completion event:', error);
      }
    });

    // Inventory events
    this.on('inventory:updated', this.handleInventoryUpdated.bind(this));
    this.on('inventory:low_stock', this.handleLowStockAlert.bind(this));

    // Table events
    this.on('table:status_changed', this.handleTableStatusChanged.bind(this));
    this.on('reservation:created', this.handleReservationCreated.bind(this));

    // Product events
    this.on('product:updated', this.handleProductUpdated.bind(this));
    this.on('category:updated', this.handleCategoryUpdated.bind(this));

    // User events
    this.on('user:login', this.handleUserLogin.bind(this));
    this.on('user:logout', this.handleUserLogout.bind(this));
  }

  /**
   * Event handlers for real-time synchronization
   */
  async handleOrderCreated(orderData) {
    try {
      // Emit to all connected clients
      if (this.io) {
        this.io.emit('order:new', {
          order: orderData,
          timestamp: new Date().toISOString()
        });
      }

      // Check for low stock items
      await this.checkLowStockItems(orderData.items);

      // Note: Table management removed as orders table doesn't have table_id column

      console.log(`Order ${orderData.id} created and synchronized`);
    } catch (error) {
      console.error('Error handling order creation:', error);
    }
  }

  async handleOrderUpdated(orderData) {
    try {
      if (this.io) {
        this.io.emit('order:updated', {
          order: orderData,
          timestamp: new Date().toISOString()
        });
      }

      // Note: Table management removed as orders table doesn't have table_id column

      console.log(`Order ${orderData.id} updated and synchronized`);
    } catch (error) {
      console.error('Error handling order update:', error);
    }
  }

  async handleOrderCancelled(orderData) {
    try {
      if (this.io) {
        this.io.emit('order:cancelled', {
          order: orderData,
          timestamp: new Date().toISOString()
        });
      }

      // Note: Table management removed as orders table doesn't have table_id column

      console.log(`Order ${orderData.id} cancelled and synchronized`);
    } catch (error) {
      console.error('Error handling order cancellation:', error);
    }
  }

  async handleInventoryUpdated(inventoryData) {
    try {
      if (this.io) {
        this.io.emit('inventory:updated', {
          inventory: inventoryData,
          timestamp: new Date().toISOString()
        });
      }

      // Check if item is now low stock
      if (inventoryData.current_stock <= inventoryData.reorder_point) {
        this.emit('inventory:low_stock', inventoryData);
      }

      console.log(`Inventory for product ${inventoryData.product_id} updated`);
    } catch (error) {
      console.error('Error handling inventory update:', error);
    }
  }

  async handleLowStockAlert(inventoryData) {
    try {
      if (this.io) {
        this.io.emit('inventory:low_stock_alert', {
          product_id: inventoryData.product_id,
          product_name: inventoryData.product_name,
          current_stock: inventoryData.current_stock,
          reorder_point: inventoryData.reorder_point,
          timestamp: new Date().toISOString()
        });
      }

      // Log the alert
      console.warn(`LOW STOCK ALERT: Product ${inventoryData.product_name} (ID: ${inventoryData.product_id}) - Current: ${inventoryData.current_stock}, Reorder Point: ${inventoryData.reorder_point}`);
    } catch (error) {
      console.error('Error handling low stock alert:', error);
    }
  }

  async handleTableStatusChanged(tableData) {
    try {
      if (this.io) {
        this.io.emit('table:status_changed', {
          table: tableData,
          timestamp: new Date().toISOString()
        });
      }

      console.log(`Table ${tableData.table_id} status changed to ${tableData.status}`);
    } catch (error) {
      console.error('Error handling table status change:', error);
    }
  }

  async handleReservationCreated(reservationData) {
    try {
      if (this.io) {
        this.io.emit('reservation:new', {
          reservation: reservationData,
          timestamp: new Date().toISOString()
        });
      }

      console.log(`New reservation created for table ${reservationData.table_id}`);
    } catch (error) {
      console.error('Error handling reservation creation:', error);
    }
  }

  async handleProductUpdated(productData) {
    try {
      if (this.io) {
        this.io.emit('product:updated', {
          product: productData,
          timestamp: new Date().toISOString()
        });
      }

      console.log(`Product ${productData.id} updated`);
    } catch (error) {
      console.error('Error handling product update:', error);
    }
  }

  async handleCategoryUpdated(categoryData) {
    try {
      if (this.io) {
        this.io.emit('category:updated', {
          category: categoryData,
          timestamp: new Date().toISOString()
        });
      }

      console.log(`Category ${categoryData.id} updated`);
    } catch (error) {
      console.error('Error handling category update:', error);
    }
  }

  async handleUserLogin(userData) {
    try {
      if (this.io) {
        this.io.emit('user:online', {
          user_id: userData.id,
          username: userData.username,
          timestamp: new Date().toISOString()
        });
      }

      console.log(`User ${userData.username} logged in`);
    } catch (error) {
      console.error('Error handling user login:', error);
    }
  }

  async handleUserLogout(userData) {
    try {
      if (this.io) {
        this.io.emit('user:offline', {
          user_id: userData.id,
          username: userData.username,
          timestamp: new Date().toISOString()
        });
      }

      console.log(`User ${userData.username} logged out`);
    } catch (error) {
      console.error('Error handling user logout:', error);
    }
  }

  /**
   * Helper methods
   */
  async checkLowStockItems(orderItems) {
    for (const item of orderItems) {
      const query = `
        SELECT i.*, p.name as product_name
        FROM inventory i
        JOIN products p ON i.product_id = p.id
        WHERE i.product_id = ? AND i.current_stock <= i.reorder_point
      `;
      
      this.db.get(query, [item.product_id], (err, row) => {
        if (err) {
          console.error('Error checking low stock:', err);
          return;
        }
        
        if (row) {
          this.emit('inventory:low_stock', row);
        }
      });
    }
  }

  // Note: checkAndFreeTable method removed as orders table doesn't have table_id column

  /**
   * Manual synchronization methods
   */
  async syncInventoryData() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT i.*, p.name as product_name
        FROM inventory i
        JOIN products p ON i.product_id = p.id
        WHERE i.current_stock IS NOT NULL
      `;
      
      this.db.all(query, (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (this.io) {
          this.io.emit('inventory:sync', {
            inventory: rows,
            timestamp: new Date().toISOString()
          });
        }
        
        resolve(rows);
      });
    });
  }

  async syncTableData() {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM tables WHERE is_active = 1';
      
      this.db.all(query, (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (this.io) {
          this.io.emit('tables:sync', {
            tables: rows,
            timestamp: new Date().toISOString()
          });
        }
        
        resolve(rows);
      });
    });
  }

  async syncOrderData() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT o.*, 
               GROUP_CONCAT(
                 json_object(
                   'product_id', oi.product_id,
                   'product_name', p.name,
                   'quantity', oi.quantity,
                   'unit_price', oi.unit_price,
                   'total_price', oi.total_price
                 )
               ) as items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE o.status IN ('pending', 'preparing', 'ready')
        GROUP BY o.id
        ORDER BY o.created_at DESC
      `;
      
      this.db.all(query, (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        
        // Parse items JSON
        const orders = rows.map(order => ({
          ...order,
          items: order.items ? JSON.parse(`[${order.items}]`) : []
        }));
        
        if (this.io) {
          this.io.emit('orders:sync', {
            orders: orders,
            timestamp: new Date().toISOString()
          });
        }
        
        resolve(orders);
      });
    });
  }

  /**
   * Transaction wrapper for atomic operations
   */
  async executeTransaction(operations) {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run('BEGIN TRANSACTION');
        
        let completed = 0;
        let hasError = false;
        
        const handleComplete = (err) => {
          if (err && !hasError) {
            hasError = true;
            this.db.run('ROLLBACK', () => {
              reject(err);
            });
            return;
          }
          
          completed++;
          if (completed === operations.length && !hasError) {
            this.db.run('COMMIT', (err) => {
              if (err) {
                reject(err);
              } else {
                resolve();
              }
            });
          }
        };
        
        operations.forEach(operation => {
          operation(handleComplete);
        });
      });
    });
  }

  /**
   * Calculate sales metrics for dashboard updates
   */
  async calculateSalesMetrics() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          COUNT(*) as total_orders,
          SUM(total_amount) as total_revenue,
          AVG(total_amount) as average_order_value,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_orders
        FROM orders 
        WHERE date(created_at) = date('now')
      `;
      
      this.db.get(query, (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        
        resolve({
          total_orders: row.total_orders || 0,
          total_revenue: row.total_revenue || 0,
          average_order_value: row.average_order_value || 0,
          completed_orders: row.completed_orders || 0,
          timestamp: new Date().toISOString()
        });
      });
    });
  }

  /**
   * Cleanup method
   */
  cleanup() {
    this.removeAllListeners();
    console.log('Real-time sync manager cleaned up');
  }
}

module.exports = RealTimeSyncManager;