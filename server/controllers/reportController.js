const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const moment = require('moment');

class ReportController {
  constructor(db) {
    this.db = db;
  }

  // ============================================================================
  // ENHANCED SALES REPORTS
  // ============================================================================

  async getSalesReport(req, res) {
    try {
      const {
        dateFrom,
        dateTo,
        groupBy = 'day', // day, week, month, year
        orderType,
        tableId,
        categoryId,
        includeDetails = false
      } = req.query;

      // Validate date range
      if (!dateFrom || !dateTo) {
        return res.status(400).json({ 
          success: false,
          error: 'Date range is required' 
        });
      }

      let dateGrouping;
      switch (groupBy) {
        case 'week':
          dateGrouping = "strftime('%Y-W%W', o.created_at)";
          break;
        case 'month':
          dateGrouping = "strftime('%Y-%m', o.created_at)";
          break;
        case 'year':
          dateGrouping = "strftime('%Y', o.created_at)";
          break;
        default:
          dateGrouping = "DATE(o.created_at)";
      }

      let query = `
        SELECT 
          ${dateGrouping} as period,
          COUNT(DISTINCT o.id) as total_orders,
          COUNT(DISTINCT CASE WHEN o.order_status = 'completed' THEN o.id END) as completed_orders,
          COUNT(DISTINCT CASE WHEN o.order_status = 'cancelled' THEN o.id END) as cancelled_orders,
          SUM(CASE WHEN o.order_status = 'completed' THEN o.subtotal ELSE 0 END) as gross_sales,
          SUM(CASE WHEN o.order_status = 'completed' THEN o.discount_amount ELSE 0 END) as total_discounts,
          SUM(CASE WHEN o.order_status = 'completed' THEN o.tax_amount ELSE 0 END) as total_tax,
          SUM(CASE WHEN o.order_status = 'completed' THEN o.service_charge ELSE 0 END) as total_service_charge,
          SUM(CASE WHEN o.order_status = 'completed' THEN o.total ELSE 0 END) as net_sales,
          AVG(CASE WHEN o.order_status = 'completed' THEN o.total END) as average_order_value,
          SUM(CASE WHEN o.order_status = 'completed' THEN oi.quantity ELSE 0 END) as total_items_sold,
          COUNT(DISTINCT CASE WHEN o.order_status = 'completed' THEN o.customer_id END) as unique_customers
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE DATE(o.created_at) BETWEEN ? AND ?
      `;

      const params = [dateFrom, dateTo];

      if (orderType) {
        query += ' AND o.order_type = ?';
        params.push(orderType);
      }

      if (tableId) {
        query += ' AND o.table_id = ?';
        params.push(tableId);
      }

      if (categoryId) {
        query += ' AND EXISTS (SELECT 1 FROM order_items oi2 JOIN products p ON oi2.product_id = p.id WHERE oi2.order_id = o.id AND p.category_id = ?)';
        params.push(categoryId);
      }

      query += ` GROUP BY ${dateGrouping} ORDER BY period`;

      const salesData = await this.executeQuery(query, params);

      // Get summary totals
      const summaryQuery = `
        SELECT 
          COUNT(DISTINCT o.id) as total_orders,
          COUNT(DISTINCT CASE WHEN o.order_status = 'completed' THEN o.id END) as completed_orders,
          SUM(CASE WHEN o.order_status = 'completed' THEN o.total ELSE 0 END) as total_revenue,
          AVG(CASE WHEN o.order_status = 'completed' THEN o.total END) as average_order_value,
          COUNT(DISTINCT o.table_id) as tables_served,
          COUNT(DISTINCT DATE(o.created_at)) as active_days
        FROM orders o
        WHERE DATE(o.created_at) BETWEEN ? AND ?
        ${orderType ? 'AND o.order_type = ?' : ''}
        ${tableId ? 'AND o.table_id = ?' : ''}
      `;

      const summaryParams = [dateFrom, dateTo];
      if (orderType) summaryParams.push(orderType);
      if (tableId) summaryParams.push(tableId);

      const summary = await this.executeQuery(summaryQuery, summaryParams);

      res.json({
        success: true,
        data: {
          summary: summary[0],
          salesData,
          period: { dateFrom, dateTo, dateGrouping }
        }
      });
    } catch (error) {
      console.error('Error generating product report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate product report',
        error: error.message
      });
    }
  }

  /**
   * Get inventory report
   */
  async getInventoryReport(req, res) {
    try {
      const { categoryId, lowStockOnly } = req.query;

      // Build inventory query
      let query = `
        SELECT 
          i.*,
          p.name,
          p.description,
          p.price,
          p.category_id,
          p.image_url,
          c.name as category_name,
          s.name as supplier_name,
          s.contact_person as supplier_contact,
          CASE 
            WHEN i.current_stock <= i.reorder_level THEN 1 
            ELSE 0 
          END as is_low_stock
        FROM inventory i
        JOIN products p ON i.product_id = p.id
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN suppliers s ON i.supplier_id = s.id
        WHERE p.is_active = 1 AND i.is_trackable = 1
      `;

      const params = [];

      if (categoryId) {
        query += ' AND p.category_id = ?';
        params.push(categoryId);
      }

      if (lowStockOnly === 'true') {
        query += ' AND i.current_stock <= i.reorder_level';
      }

      query += ' ORDER BY c.name, p.name';

      const inventoryData = await this.executeQuery(query, params);

      // Get inventory summary
      const summaryQuery = `
        SELECT 
          COUNT(*) as total_products,
          SUM(i.current_stock * i.cost_price) as total_inventory_value,
          COUNT(CASE WHEN i.current_stock <= i.reorder_level THEN 1 END) as low_stock_items,
          COUNT(CASE WHEN i.current_stock >= i.max_stock THEN 1 END) as overstock_items,
          AVG(i.current_stock * i.cost_price) as average_product_value
        FROM inventory i
        JOIN products p ON i.product_id = p.id
        WHERE p.is_active = 1 AND i.is_trackable = 1
        ${categoryId ? 'AND p.category_id = ?' : ''}
      `;

      const summaryParams = categoryId ? [categoryId] : [];
      const summary = await this.executeQuery(summaryQuery, summaryParams);

      res.json({
        success: true,
        data: {
          summary: summary[0],
          inventoryData,
          filters: { categoryId, lowStockOnly }
        }
      });
    } catch (error) {
      console.error('Error generating inventory report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate inventory report',
        error: error.message
      });
    }
  }

  /**
   * Get product performance report
   */
  async getProductReport(req, res) {
    try {
      const { dateFrom, dateTo, categoryId, orderType, tableId } = req.query;

      // Validate date parameters
      if (!dateFrom || !dateTo) {
        return res.status(400).json({
          success: false,
          message: 'Date range is required (dateFrom and dateTo)'
        });
      }

      // Determine date grouping based on date range
      const startDate = new Date(dateFrom);
      const endDate = new Date(dateTo);
      const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      
      let dateGrouping;
      if (daysDiff <= 7) {
        dateGrouping = "DATE(o.created_at)";
      } else if (daysDiff <= 31) {
        dateGrouping = "DATE(o.created_at)";
      } else {
        dateGrouping = "strftime('%Y-%m', o.created_at)";
      }

      // Build the main query
      let query = `
        SELECT 
          ${dateGrouping} as period,
          COUNT(DISTINCT o.id) as total_orders,
          COUNT(DISTINCT CASE WHEN o.order_status = 'completed' THEN o.id END) as completed_orders,
          SUM(CASE WHEN o.order_status = 'completed' THEN o.total ELSE 0 END) as total_revenue,
          AVG(CASE WHEN o.order_status = 'completed' THEN o.total END) as average_order_value
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE DATE(o.created_at) BETWEEN ? AND ?
      `;

      const params = [dateFrom, dateTo];

      // Get summary totals
      const summaryQuery = `
        SELECT 
          COUNT(DISTINCT o.id) as total_orders,
          COUNT(DISTINCT CASE WHEN o.order_status = 'completed' THEN o.id END) as completed_orders,
          SUM(CASE WHEN o.order_status = 'completed' THEN o.total ELSE 0 END) as total_revenue,
          AVG(CASE WHEN o.order_status = 'completed' THEN o.total END) as average_order_value,
          COUNT(DISTINCT o.table_id) as tables_served,
          COUNT(DISTINCT DATE(o.created_at)) as active_days
        FROM orders o
        WHERE DATE(o.created_at) BETWEEN ? AND ?
        ${orderType ? 'AND o.order_type = ?' : ''}
        ${tableId ? 'AND o.table_id = ?' : ''}
      `;

      const summaryParams = [dateFrom, dateTo];
      if (orderType) summaryParams.push(orderType);
      if (tableId) summaryParams.push(tableId);

      const summary = await this.executeQuery(summaryQuery, summaryParams);

      res.json({
        summary: summary[0],
        salesData,
        period: { dateFrom, dateTo, groupBy }
      });
    } catch (error) {
      console.error('Get sales report error:', error);
      res.status(500).json({ error: 'Failed to generate sales report' });
    }
  }

  // Product performance report
  async getProductReport(req, res) {
    try {
      const {
        dateFrom,
        dateTo,
        categoryId,
        limit = 50,
        sortBy = 'quantity', // quantity, revenue, orders
        sortOrder = 'DESC'
      } = req.query;

      if (!dateFrom || !dateTo) {
        return res.status(400).json({ error: 'Date range is required' });
      }

      let orderByClause;
      switch (sortBy) {
        case 'revenue':
          orderByClause = 'total_revenue';
          break;
        case 'orders':
          orderByClause = 'order_count';
          break;
        default:
          orderByClause = 'total_quantity';
      }

      let query = `
        SELECT 
          p.id,
          p.name,
          p.price,
          c.name as category_name,
          SUM(oi.quantity) as total_quantity,
          COUNT(DISTINCT oi.order_id) as order_count,
          SUM(oi.total_price) as total_revenue,
          AVG(oi.total_price / oi.quantity) as average_unit_price,
          (SUM(oi.total_price) / (SELECT SUM(total) FROM orders WHERE order_status = 'completed' AND DATE(created_at) BETWEEN ? AND ?)) * 100 as revenue_percentage
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN categories c ON p.category_id = c.id
        JOIN orders o ON oi.order_id = o.id
        WHERE o.order_status = 'completed'
        AND DATE(o.created_at) BETWEEN ? AND ?
      `;

      const params = [dateFrom, dateTo, dateFrom, dateTo];

      if (categoryId) {
        query += ' AND p.category_id = ?';
        params.push(categoryId);
      }

      query += ` GROUP BY p.id, p.name, p.price, c.name
                 ORDER BY ${orderByClause} ${sortOrder.toUpperCase()}
                 LIMIT ?`;
      
      params.push(parseInt(limit));

      const productData = await this.executeQuery(query, params);

      // Get category performance
      const categoryQuery = `
        SELECT 
          c.name as category_name,
          COUNT(DISTINCT p.id) as product_count,
          SUM(oi.quantity) as total_quantity,
          SUM(oi.total_price) as total_revenue,
          AVG(oi.total_price / oi.quantity) as average_price
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN categories c ON p.category_id = c.id
        JOIN orders o ON oi.order_id = o.id
        WHERE o.order_status = 'completed'
        AND DATE(o.created_at) BETWEEN ? AND ?
        GROUP BY c.id, c.name
        ORDER BY total_revenue DESC
      `;

      const categoryData = await this.executeQuery(categoryQuery, [dateFrom, dateTo]);

      res.json({
        productPerformance: productData,
        categoryPerformance: categoryData,
        period: { dateFrom, dateTo }
      });
    } catch (error) {
      console.error('Get product report error:', error);
      res.status(500).json({ error: 'Failed to generate product report' });
    }
  }

  // Inventory report
  async getInventoryReport(req, res) {
    try {
      const { categoryId, lowStockOnly = false } = req.query;

      let query = `
        SELECT 
          p.id,
          p.name,
          c.name as category_name,
          i.current_stock,
          i.reorder_level,
          i.max_stock,
          i.cost_price,
          i.current_stock * i.cost_price as inventory_value,
          CASE 
            WHEN i.current_stock <= i.reorder_level THEN 'Low Stock'
            WHEN i.current_stock >= i.max_stock THEN 'Overstock'
            ELSE 'Normal'
          END as stock_status,
          s.name as supplier_name
        FROM inventory i
        JOIN products p ON i.product_id = p.id
        JOIN categories c ON p.category_id = c.id
        LEFT JOIN suppliers s ON i.supplier_id = s.id
        WHERE p.is_active = 1 AND i.is_trackable = 1
      `;

      const params = [];

      if (categoryId) {
        query += ' AND p.category_id = ?';
        params.push(categoryId);
      }

      if (lowStockOnly === 'true') {
        query += ' AND i.current_stock <= i.reorder_level';
      }

      query += ' ORDER BY c.name, p.name';

      const inventoryData = await this.executeQuery(query, params);

      // Get inventory summary
      const summaryQuery = `
        SELECT 
          COUNT(*) as total_products,
          SUM(i.current_stock * i.cost_price) as total_inventory_value,
          COUNT(CASE WHEN i.current_stock <= i.reorder_level THEN 1 END) as low_stock_items,
          COUNT(CASE WHEN i.current_stock >= i.max_stock THEN 1 END) as overstock_items,
          AVG(i.current_stock * i.cost_price) as average_product_value
        FROM inventory i
        JOIN products p ON i.product_id = p.id
        WHERE p.is_active = 1 AND i.is_trackable = 1
        ${categoryId ? 'AND p.category_id = ?' : ''}
      `;

      const summaryParams = categoryId ? [categoryId] : [];
      const summary = await this.executeQuery(summaryQuery, summaryParams);

      // Get stock movements for the last 30 days
      const movementsQuery = `
        SELECT 
          DATE(sm.created_at) as movement_date,
          sm.movement_type,
          COUNT(*) as movement_count,
          SUM(sm.quantity) as total_quantity
        FROM stock_movements sm
        JOIN products p ON sm.product_id = p.id
        WHERE DATE(sm.created_at) >= DATE('now', '-30 days')
        ${categoryId ? 'AND p.category_id = ?' : ''}
        GROUP BY DATE(sm.created_at), sm.movement_type
        ORDER BY movement_date DESC
      `;

      const movementsParams = categoryId ? [categoryId] : [];
      const recentMovements = await this.executeQuery(movementsQuery, movementsParams);

      res.json({
        summary: summary[0],
        inventoryData,
        recentMovements
      });
    } catch (error) {
      console.error('Get inventory report error:', error);
      res.status(500).json({ error: 'Failed to generate inventory report' });
    }
  }

  // Table performance report
  async getTableReport(req, res) {
    try {
      const { dateFrom, dateTo, section } = req.query;

      if (!dateFrom || !dateTo) {
        return res.status(400).json({ error: 'Date range is required' });
      }

      let query = `
        SELECT 
          t.id,
          t.table_number,
          t.table_name,
          t.capacity,
          t.section,
          COUNT(o.id) as total_orders,
          COUNT(CASE WHEN o.order_status = 'completed' THEN 1 END) as completed_orders,
          SUM(CASE WHEN o.order_status = 'completed' THEN o.total ELSE 0 END) as total_revenue,
          AVG(CASE WHEN o.order_status = 'completed' THEN o.total END) as average_order_value,
          SUM(CASE WHEN o.order_status = 'completed' THEN o.total ELSE 0 END) / t.capacity as revenue_per_seat,
          COUNT(DISTINCT DATE(o.created_at)) as active_days
        FROM tables t
        LEFT JOIN orders o ON t.id = o.table_id AND DATE(o.created_at) BETWEEN ? AND ?
        WHERE t.is_active = 1
      `;

      const params = [dateFrom, dateTo];

      if (section) {
        query += ' AND t.section = ?';
        params.push(section);
      }

      query += ' GROUP BY t.id ORDER BY total_revenue DESC';

      const tableData = await this.executeQuery(query, params);

      // Get section performance
      const sectionQuery = `
        SELECT 
          t.section,
          COUNT(DISTINCT t.id) as table_count,
          SUM(t.capacity) as total_capacity,
          COUNT(o.id) as total_orders,
          SUM(CASE WHEN o.order_status = 'completed' THEN o.total ELSE 0 END) as total_revenue,
          AVG(CASE WHEN o.order_status = 'completed' THEN o.total END) as average_order_value
        FROM tables t
        LEFT JOIN orders o ON t.id = o.table_id AND DATE(o.created_at) BETWEEN ? AND ?
        WHERE t.is_active = 1
        GROUP BY t.section
        ORDER BY total_revenue DESC
      `;

      const sectionData = await this.executeQuery(sectionQuery, [dateFrom, dateTo]);

      // Get peak hours analysis
      const peakHoursQuery = `
        SELECT 
          strftime('%H', o.created_at) as hour,
          COUNT(*) as order_count,
          COUNT(DISTINCT o.table_id) as tables_used,
          SUM(CASE WHEN o.order_status = 'completed' THEN o.total ELSE 0 END) as revenue
        FROM orders o
        JOIN tables t ON o.table_id = t.id
        WHERE DATE(o.created_at) BETWEEN ? AND ?
        GROUP BY hour
        ORDER BY hour
      `;

      const peakHours = await this.executeQuery(peakHoursQuery, [dateFrom, dateTo]);

      res.json({
        tablePerformance: tableData,
        sectionPerformance: sectionData,
        peakHours,
        period: { dateFrom, dateTo }
      });
    } catch (error) {
      console.error('Get table report error:', error);
      res.status(500).json({ error: 'Failed to generate table report' });
    }
  }

  // Financial report
  async getFinancialReport(req, res) {
    try {
      const { dateFrom, dateTo, groupBy = 'day' } = req.query;

      if (!dateFrom || !dateTo) {
        return res.status(400).json({ error: 'Date range is required' });
      }

      let dateGrouping;
      switch (groupBy) {
        case 'week':
          dateGrouping = "strftime('%Y-W%W', created_at)";
          break;
        case 'month':
          dateGrouping = "strftime('%Y-%m', created_at)";
          break;
        case 'year':
          dateGrouping = "strftime('%Y', created_at)";
          break;
        default:
          dateGrouping = "DATE(created_at)";
      }

      // Revenue breakdown
      const revenueQuery = `
        SELECT 
          ${dateGrouping} as period,
          SUM(CASE WHEN order_status = 'completed' THEN subtotal ELSE 0 END) as gross_sales,
          SUM(CASE WHEN order_status = 'completed' THEN discount_amount ELSE 0 END) as total_discounts,
          SUM(CASE WHEN order_status = 'completed' THEN tax_amount ELSE 0 END) as total_tax,
          SUM(CASE WHEN order_status = 'completed' THEN service_charge ELSE 0 END) as service_charges,
          SUM(CASE WHEN order_status = 'completed' THEN total ELSE 0 END) as net_sales,
          COUNT(CASE WHEN order_status = 'completed' THEN 1 END) as completed_orders,
          COUNT(CASE WHEN order_status = 'cancelled' THEN 1 END) as cancelled_orders
        FROM orders
        WHERE DATE(created_at) BETWEEN ? AND ?
        GROUP BY ${dateGrouping}
        ORDER BY period
      `;

      const revenueData = await this.executeQuery(revenueQuery, [dateFrom, dateTo]);

      // Payment method breakdown
      const paymentQuery = `
        SELECT 
          payment_method,
          COUNT(*) as transaction_count,
          SUM(total) as total_amount,
          AVG(total) as average_amount
        FROM orders
        WHERE order_status = 'completed'
        AND DATE(created_at) BETWEEN ? AND ?
        GROUP BY payment_method
        ORDER BY total_amount DESC
      `;

      const paymentData = await this.executeQuery(paymentQuery, [dateFrom, dateTo]);

      // Order type breakdown
      const orderTypeQuery = `
        SELECT 
          order_type,
          COUNT(*) as order_count,
          SUM(total) as total_revenue,
          AVG(total) as average_order_value
        FROM orders
        WHERE order_status = 'completed'
        AND DATE(created_at) BETWEEN ? AND ?
        GROUP BY order_type
        ORDER BY total_revenue DESC
      `;

      const orderTypeData = await this.executeQuery(orderTypeQuery, [dateFrom, dateTo]);

      // Summary totals
      const summaryQuery = `
        SELECT 
          SUM(CASE WHEN order_status = 'completed' THEN total ELSE 0 END) as total_revenue,
          SUM(CASE WHEN order_status = 'completed' THEN tax_amount ELSE 0 END) as total_tax_collected,
          SUM(CASE WHEN order_status = 'completed' THEN discount_amount ELSE 0 END) as total_discounts_given,
          SUM(CASE WHEN order_status = 'completed' THEN service_charge ELSE 0 END) as total_service_charges,
          COUNT(CASE WHEN order_status = 'completed' THEN 1 END) as total_transactions,
          AVG(CASE WHEN order_status = 'completed' THEN total END) as average_transaction_value
        FROM orders
        WHERE DATE(created_at) BETWEEN ? AND ?
      `;

      const summary = await this.executeQuery(summaryQuery, [dateFrom, dateTo]);

      res.json({
        summary: summary[0],
        revenueBreakdown: revenueData,
        paymentMethods: paymentData,
        orderTypes: orderTypeData,
        period: { dateFrom, dateTo, groupBy }
      });
    } catch (error) {
      console.error('Get financial report error:', error);
      res.status(500).json({ error: 'Failed to generate financial report' });
    }
  }

  // Customer analytics report
  async getCustomerReport(req, res) {
    try {
      const { dateFrom, dateTo, limit = 50 } = req.query;

      if (!dateFrom || !dateTo) {
        return res.status(400).json({ error: 'Date range is required' });
      }

      // Top customers by revenue
      const topCustomersQuery = `
        SELECT 
          customer_name,
          customer_phone,
          customer_email,
          COUNT(*) as total_orders,
          SUM(CASE WHEN order_status = 'completed' THEN total ELSE 0 END) as total_spent,
          AVG(CASE WHEN order_status = 'completed' THEN total END) as average_order_value,
          MAX(created_at) as last_visit
        FROM orders
        WHERE customer_name IS NOT NULL
        AND DATE(created_at) BETWEEN ? AND ?
        GROUP BY customer_name, customer_phone
        HAVING total_spent > 0
        ORDER BY total_spent DESC
        LIMIT ?
      `;

      const topCustomers = await this.executeQuery(topCustomersQuery, [dateFrom, dateTo, parseInt(limit)]);

      // Customer frequency analysis
      const frequencyQuery = `
        SELECT 
          CASE 
            WHEN order_count = 1 THEN '1 order'
            WHEN order_count BETWEEN 2 AND 5 THEN '2-5 orders'
            WHEN order_count BETWEEN 6 AND 10 THEN '6-10 orders'
            ELSE '10+ orders'
          END as frequency_group,
          COUNT(*) as customer_count,
          SUM(total_spent) as group_revenue
        FROM (
          SELECT 
            customer_name,
            customer_phone,
            COUNT(*) as order_count,
            SUM(CASE WHEN order_status = 'completed' THEN total ELSE 0 END) as total_spent
          FROM orders
          WHERE customer_name IS NOT NULL
          AND DATE(created_at) BETWEEN ? AND ?
          GROUP BY customer_name, customer_phone
        ) customer_stats
        GROUP BY frequency_group
        ORDER BY 
          CASE frequency_group
            WHEN '1 order' THEN 1
            WHEN '2-5 orders' THEN 2
            WHEN '6-10 orders' THEN 3
            ELSE 4
          END
      `;

      const frequencyData = await this.executeQuery(frequencyQuery, [dateFrom, dateTo]);

      // New vs returning customers
      const customerTypeQuery = `
        SELECT 
          DATE(o.created_at) as order_date,
          COUNT(CASE WHEN first_order.first_order_date = DATE(o.created_at) THEN 1 END) as new_customers,
          COUNT(CASE WHEN first_order.first_order_date < DATE(o.created_at) THEN 1 END) as returning_customers
        FROM orders o
        JOIN (
          SELECT 
            customer_name,
            customer_phone,
            MIN(DATE(created_at)) as first_order_date
          FROM orders
          WHERE customer_name IS NOT NULL
          GROUP BY customer_name, customer_phone
        ) first_order ON o.customer_name = first_order.customer_name 
                      AND o.customer_phone = first_order.customer_phone
        WHERE DATE(o.created_at) BETWEEN ? AND ?
        AND o.customer_name IS NOT NULL
        GROUP BY DATE(o.created_at)
        ORDER BY order_date
      `;

      const customerTypeData = await this.executeQuery(customerTypeQuery, [dateFrom, dateTo]);

      res.json({
        topCustomers,
        frequencyAnalysis: frequencyData,
        newVsReturning: customerTypeData,
        period: { dateFrom, dateTo }
      });
    } catch (error) {
      console.error('Get customer report error:', error);
      res.status(500).json({ error: 'Failed to generate customer report' });
    }
  }

  // Export report data
  async exportReport(req, res) {
    try {
      const { reportType, format = 'json', ...filters } = req.query;

      let reportData;

      switch (reportType) {
        case 'sales':
          reportData = await this.getSalesReportData(filters);
          break;
        case 'products':
          reportData = await this.getProductReportData(filters);
          break;
        case 'inventory':
          reportData = await this.getInventoryReportData(filters);
          break;
        case 'tables':
          reportData = await this.getTableReportData(filters);
          break;
        case 'financial':
          reportData = await this.getFinancialReportData(filters);
          break;
        case 'customers':
          reportData = await this.getCustomerReportData(filters);
          break;
        default:
          return res.status(400).json({ error: 'Invalid report type' });
      }

      switch (format) {
        case 'csv':
          const csv = this.convertToCSV(reportData);
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', `attachment; filename="${reportType}-report.csv"`);
          res.send(csv);
          break;

        case 'excel':
          const excelBuffer = await this.generateExcelReport(reportData, reportType, filters);
          res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
          res.setHeader('Content-Disposition', `attachment; filename="${reportType}-report.xlsx"`);
          res.send(excelBuffer);
          break;

        case 'pdf':
          const pdfBuffer = await this.generatePDFReport(reportData, reportType, filters);
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename="${reportType}-report.pdf"`);
          res.send(pdfBuffer);
          break;

        default:
          res.json(reportData);
      }
    } catch (error) {
      console.error('Export report error:', error);
      res.status(500).json({ error: 'Failed to export report' });
    }
  }

  // Helper methods for data extraction (simplified versions of main report methods)
  async getSalesReportData(filters) {
    // Simplified version of getSalesReport for export
    const { dateFrom, dateTo } = filters;
    const query = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as orders,
        SUM(CASE WHEN order_status = 'completed' THEN total ELSE 0 END) as revenue
      FROM orders
      WHERE DATE(created_at) BETWEEN ? AND ?
      GROUP BY DATE(created_at)
      ORDER BY date
    `;
    return this.executeQuery(query, [dateFrom, dateTo]);
  }

  async getProductReportData(filters) {
    const { dateFrom, dateTo } = filters;
    const query = `
      SELECT 
        p.name,
        SUM(oi.quantity) as quantity_sold,
        SUM(oi.total_price) as revenue
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.order_status = 'completed'
      AND DATE(o.created_at) BETWEEN ? AND ?
      GROUP BY p.id, p.name
      ORDER BY revenue DESC
    `;
    return this.executeQuery(query, [dateFrom, dateTo]);
  }

  async getInventoryReportData(filters) {
    const query = `
      SELECT 
        p.name,
        i.current_stock,
        i.reorder_level,
        i.cost_price,
        i.current_stock * i.cost_price as inventory_value
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      WHERE p.is_active = 1 AND i.is_trackable = 1
      ORDER BY p.name
    `;
    return this.executeQuery(query);
  }

  async getTableReportData(filters) {
    const { dateFrom, dateTo } = filters;
    const query = `
      SELECT 
        t.table_number,
        t.section,
        COUNT(o.id) as total_orders,
        SUM(CASE WHEN o.order_status = 'completed' THEN o.total ELSE 0 END) as revenue
      FROM tables t
      LEFT JOIN orders o ON t.id = o.table_id AND DATE(o.created_at) BETWEEN ? AND ?
      WHERE t.is_active = 1
      GROUP BY t.id
      ORDER BY revenue DESC
    `;
    return this.executeQuery(query, [dateFrom, dateTo]);
  }

  async getFinancialReportData(filters) {
    const { dateFrom, dateTo } = filters;
    const query = `
      SELECT 
        DATE(created_at) as date,
        SUM(CASE WHEN order_status = 'completed' THEN total ELSE 0 END) as revenue,
        SUM(CASE WHEN order_status = 'completed' THEN tax_amount ELSE 0 END) as tax,
        SUM(CASE WHEN order_status = 'completed' THEN discount_amount ELSE 0 END) as discounts
      FROM orders
      WHERE DATE(created_at) BETWEEN ? AND ?
      GROUP BY DATE(created_at)
      ORDER BY date
    `;
    return this.executeQuery(query, [dateFrom, dateTo]);
  }

  async getCustomerReportData(filters) {
    const { dateFrom, dateTo } = filters;
    const query = `
      SELECT 
        customer_name,
        customer_phone,
        COUNT(*) as total_orders,
        SUM(CASE WHEN order_status = 'completed' THEN total ELSE 0 END) as total_spent
      FROM orders
      WHERE customer_name IS NOT NULL
      AND DATE(created_at) BETWEEN ? AND ?
      GROUP BY customer_name, customer_phone
      ORDER BY total_spent DESC
    `;
    return this.executeQuery(query, [dateFrom, dateTo]);
  }

  convertToCSV(data) {
    if (!data || data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    
    const csvRows = data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    );

    return [csvHeaders, ...csvRows].join('\n');
  }

  // Generate Excel report
  async generateExcelReport(data, reportType, filters) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`);

    // Add metadata
    worksheet.addRow(['Report Type:', reportType.toUpperCase()]);
    worksheet.addRow(['Generated:', moment().format('YYYY-MM-DD HH:mm:ss')]);
    if (filters.dateFrom && filters.dateTo) {
      worksheet.addRow(['Period:', `${filters.dateFrom} to ${filters.dateTo}`]);
    }
    worksheet.addRow([]); // Empty row

    if (data && data.length > 0) {
      // Add headers
      const headers = Object.keys(data[0]);
      const headerRow = worksheet.addRow(headers);
      
      // Style headers
      headerRow.eachCell((cell) => {
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      // Add data rows
      data.forEach(row => {
        const dataRow = worksheet.addRow(Object.values(row));
        dataRow.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      });

      // Auto-fit columns
      worksheet.columns.forEach(column => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, (cell) => {
          const columnLength = cell.value ? cell.value.toString().length : 10;
          if (columnLength > maxLength) {
            maxLength = columnLength;
          }
        });
        column.width = maxLength < 10 ? 10 : maxLength + 2;
      });
    }

    return await workbook.xlsx.writeBuffer();
  }

  // Generate PDF report
  async generatePDFReport(data, reportType, filters) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const buffers = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });

        // Header
        doc.fontSize(20).text(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`, 50, 50);
        doc.fontSize(12).text(`Generated: ${moment().format('YYYY-MM-DD HH:mm:ss')}`, 50, 80);
        
        if (filters.dateFrom && filters.dateTo) {
          doc.text(`Period: ${filters.dateFrom} to ${filters.dateTo}`, 50, 100);
        }

        let yPosition = 140;

        if (data && data.length > 0) {
          const headers = Object.keys(data[0]);
          const columnWidth = (doc.page.width - 100) / headers.length;

          // Draw headers
          doc.fontSize(10).font('Helvetica-Bold');
          headers.forEach((header, index) => {
            doc.text(header, 50 + (index * columnWidth), yPosition, {
              width: columnWidth,
              align: 'left'
            });
          });

          yPosition += 20;
          doc.moveTo(50, yPosition).lineTo(doc.page.width - 50, yPosition).stroke();
          yPosition += 10;

          // Draw data rows
          doc.font('Helvetica');
          data.forEach((row, rowIndex) => {
            if (yPosition > doc.page.height - 100) {
              doc.addPage();
              yPosition = 50;
            }

            headers.forEach((header, colIndex) => {
              const value = row[header] || '';
              doc.text(value.toString(), 50 + (colIndex * columnWidth), yPosition, {
                width: columnWidth,
                align: 'left'
              });
            });

            yPosition += 15;
          });
        } else {
          doc.text('No data available for the selected criteria.', 50, yPosition);
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  // Database helper method
  async executeQuery(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }
}

module.exports = ReportController;