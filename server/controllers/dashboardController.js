/**
 * Dashboard Controller
 * Handles real-time dashboard metrics and analytics
 */

const BaseController = require('./baseController');

class DashboardController extends BaseController {
  constructor(db) {
    super(db);
  }

  /**
   * Get real-time dashboard metrics
   */
  async getDashboardMetrics(req, res) {
    try {
      const { dateFrom, dateTo } = req.query;
      
      // Set default date range to today if not provided
      const today = new Date();
      const startDate = dateFrom || today.toISOString().split('T')[0];
      const endDate = dateTo || today.toISOString().split('T')[0];

      // Get sales metrics
      const salesMetrics = await this.getSalesMetrics(startDate, endDate);
      
      // Get inventory metrics
      const inventoryMetrics = await this.getInventoryMetrics();
      
      // Get order metrics
      const orderMetrics = await this.getOrderMetrics(startDate, endDate);
      
      // Get profit and discount metrics
      const profitMetrics = await this.getProfitMetrics(startDate, endDate);

      const dashboardData = {
        sales: salesMetrics,
        inventory: inventoryMetrics,
        orders: orderMetrics,
        profits: profitMetrics,
        timestamp: new Date().toISOString()
      };

      res.json(dashboardData);
    } catch (error) {
      console.error('Dashboard metrics error:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
    }
  }

  /**
   * Get sales metrics for dashboard
   */
  async getSalesMetrics(startDate, endDate) {
    const query = `
      SELECT 
        SUM(CASE WHEN DATE(created_at) = DATE('now') AND order_status = 'completed' THEN total ELSE 0 END) as today_sales,
        SUM(CASE WHEN DATE(created_at) = DATE('now', '-1 day') AND order_status = 'completed' THEN total ELSE 0 END) as yesterday_sales,
        SUM(CASE WHEN DATE(created_at) >= DATE('now', '-7 days') AND order_status = 'completed' THEN total ELSE 0 END) as weekly_sales,
        SUM(CASE WHEN DATE(created_at) >= DATE('now', 'start of month') AND order_status = 'completed' THEN total ELSE 0 END) as monthly_sales,
        SUM(CASE WHEN DATE(created_at) BETWEEN ? AND ? AND order_status = 'completed' THEN total ELSE 0 END) as period_sales,
        SUM(CASE WHEN DATE(created_at) BETWEEN ? AND ? AND order_status = 'completed' THEN subtotal ELSE 0 END) as gross_sales,
        SUM(CASE WHEN DATE(created_at) BETWEEN ? AND ? AND order_status = 'completed' THEN discount_amount ELSE 0 END) as total_discounts,
        SUM(CASE WHEN DATE(created_at) BETWEEN ? AND ? AND order_status = 'completed' THEN tax_amount ELSE 0 END) as total_tax,
        AVG(CASE WHEN DATE(created_at) BETWEEN ? AND ? AND order_status = 'completed' THEN total END) as avg_order_value
      FROM orders
    `;

    const params = [startDate, endDate, startDate, endDate, startDate, endDate, startDate, endDate, startDate, endDate];
    const result = await this.executeQuery(query, params);
    
    return result[0] || {
      today_sales: 0,
      yesterday_sales: 0,
      weekly_sales: 0,
      monthly_sales: 0,
      period_sales: 0,
      gross_sales: 0,
      total_discounts: 0,
      total_tax: 0,
      avg_order_value: 0
    };
  }

  /**
   * Get inventory metrics for dashboard
   */
  async getInventoryMetrics() {
    const query = `
      SELECT 
        COUNT(*) as total_products,
        SUM(CASE WHEN current_stock <= reorder_point THEN 1 ELSE 0 END) as low_stock_items,
        SUM(CASE WHEN current_stock = 0 THEN 1 ELSE 0 END) as out_of_stock_items,
        SUM(current_stock * (SELECT price FROM products WHERE id = inventory.product_id)) as total_inventory_value
      FROM inventory 
      WHERE is_trackable = 1
    `;

    const result = await this.executeQuery(query);
    
    return result[0] || {
      total_products: 0,
      low_stock_items: 0,
      out_of_stock_items: 0,
      total_inventory_value: 0
    };
  }

  /**
   * Get order metrics for dashboard
   */
  async getOrderMetrics(startDate, endDate) {
    const query = `
      SELECT 
        COUNT(CASE WHEN DATE(created_at) = DATE('now') THEN 1 END) as today_orders,
        COUNT(CASE WHEN DATE(created_at) BETWEEN ? AND ? THEN 1 END) as period_orders,
        COUNT(CASE WHEN DATE(created_at) BETWEEN ? AND ? AND order_status = 'completed' THEN 1 END) as completed_orders,
        COUNT(CASE WHEN DATE(created_at) BETWEEN ? AND ? AND order_status = 'pending' THEN 1 END) as pending_orders,
        COUNT(CASE WHEN DATE(created_at) BETWEEN ? AND ? AND order_status = 'cancelled' THEN 1 END) as cancelled_orders
      FROM orders
    `;

    const params = [startDate, endDate, startDate, endDate, startDate, endDate, startDate, endDate, startDate, endDate];
    const result = await this.executeQuery(query, params);
    
    return result[0] || {
      today_orders: 0,
      period_orders: 0,
      completed_orders: 0,
      pending_orders: 0,
      cancelled_orders: 0
    };
  }

  /**
   * Get profit and cost metrics for dashboard
   */
  async getProfitMetrics(startDate, endDate) {
    const query = `
      SELECT 
        SUM(CASE WHEN o.order_status = 'completed' AND DATE(o.created_at) BETWEEN ? AND ? 
            THEN (oi.quantity * (p.price - COALESCE(p.cost, 0))) ELSE 0 END) as estimated_profit,
        SUM(CASE WHEN o.order_status = 'completed' AND DATE(o.created_at) BETWEEN ? AND ? 
            THEN (oi.quantity * COALESCE(p.cost, 0)) ELSE 0 END) as total_cost,
        SUM(CASE WHEN o.order_status = 'completed' AND DATE(o.created_at) BETWEEN ? AND ? 
            THEN o.total ELSE 0 END) as total_revenue
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
    `;

    const params = [startDate, endDate, startDate, endDate, startDate, endDate];
    const result = await this.executeQuery(query, params);
    
    const metrics = result[0] || {
      estimated_profit: 0,
      total_cost: 0,
      total_revenue: 0
    };

    // Calculate profit margin
    metrics.profit_margin = metrics.total_revenue > 0 
      ? ((metrics.estimated_profit / metrics.total_revenue) * 100).toFixed(2)
      : 0;

    return metrics;
  }

  /**
   * Get recent orders for dashboard
   */
  async getRecentOrders(req, res) {
    try {
      const { limit = 10 } = req.query;

      const query = `
        SELECT 
          o.id,
          o.order_number,
          o.total,
          o.order_status,
          o.created_at,
          o.table_id,
          t.table_number,
          COUNT(oi.id) as item_count
        FROM orders o
        LEFT JOIN tables t ON o.table_id = t.id
        LEFT JOIN order_items oi ON o.id = oi.order_id
        GROUP BY o.id
        ORDER BY o.created_at DESC
        LIMIT ?
      `;

      const orders = await this.executeQuery(query, [parseInt(limit)]);
      res.json(orders);
    } catch (error) {
      console.error('Recent orders error:', error);
      res.status(500).json({ error: 'Failed to fetch recent orders' });
    }
  }

  /**
   * Get top selling products for dashboard
   */
  async getTopProducts(req, res) {
    try {
      const { limit = 5, dateFrom, dateTo } = req.query;
      
      const today = new Date();
      const startDate = dateFrom || today.toISOString().split('T')[0];
      const endDate = dateTo || today.toISOString().split('T')[0];

      const query = `
        SELECT 
          p.id,
          p.name,
          p.price,
          SUM(oi.quantity) as total_sold,
          SUM(oi.total_price) as total_revenue,
          COUNT(DISTINCT o.id) as order_count
        FROM products p
        JOIN order_items oi ON p.id = oi.product_id
        JOIN orders o ON oi.order_id = o.id
        WHERE o.order_status = 'completed'
        AND DATE(o.created_at) BETWEEN ? AND ?
        GROUP BY p.id, p.name, p.price
        ORDER BY total_sold DESC
        LIMIT ?
      `;

      const products = await this.executeQuery(query, [startDate, endDate, parseInt(limit)]);
      res.json(products);
    } catch (error) {
      console.error('Top products error:', error);
      res.status(500).json({ error: 'Failed to fetch top products' });
    }
  }

  /**
   * Get real-time sales summary
   */
  async getSalesSummary(req, res) {
    try {
      const query = `
        SELECT 
          DATE(created_at) as sale_date,
          COUNT(*) as total_orders,
          SUM(CASE WHEN order_status = 'completed' THEN total ELSE 0 END) as total_sales,
          SUM(CASE WHEN order_status = 'completed' THEN discount_amount ELSE 0 END) as total_discounts,
          AVG(CASE WHEN order_status = 'completed' THEN total END) as avg_order_value
        FROM orders
        WHERE DATE(created_at) >= DATE('now', '-30 days')
        GROUP BY DATE(created_at)
        ORDER BY sale_date DESC
      `;

      const summary = await this.executeQuery(query);
      res.json(summary);
    } catch (error) {
      console.error('Sales summary error:', error);
      res.status(500).json({ error: 'Failed to fetch sales summary' });
    }
  }
}

module.exports = DashboardController;