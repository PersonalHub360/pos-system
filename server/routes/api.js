const express = require('express');
const router = express.Router();

// Import controllers
const AuthController = require('../controllers/authController');
const UserController = require('../controllers/userController');
const ProductController = require('../controllers/productController');
const OrderController = require('../controllers/orderController');
const TableController = require('../controllers/tableController');
const InventoryController = require('../controllers/inventoryController');
const ReportController = require('../controllers/reportController');
const DashboardController = require('../controllers/dashboardController');
const AuditController = require('../controllers/auditController');
const BackupController = require('../controllers/backupController');
const SalesController = require('../controllers/salesController');

// Import middleware
const AuthMiddleware = require('../middleware/auth');

// Initialize API routes
function initializeRoutes(db) {
  // Initialize controllers
  const authController = new AuthController(db);
  const userController = new UserController(db);
  const productController = new ProductController(db);
  const orderController = new OrderController(db);
  const tableController = new TableController(db);
  const inventoryController = new InventoryController(db);
  const reportController = new ReportController(db);
  const dashboardController = new DashboardController(db);
  const auditController = new AuditController(db);
  const backupController = new BackupController(db);
  const salesController = new SalesController(db);

  // Initialize middleware
  const authMiddleware = new AuthMiddleware(db);

  // ============================================================================
  // AUTHENTICATION ROUTES
  // ============================================================================
  
  // Public authentication routes
  router.post('/auth/register', authController.register.bind(authController));
  router.post('/auth/login', authController.login.bind(authController));
  
  // Protected authentication routes
  router.get('/auth/profile', authMiddleware.verifyToken, authController.getProfile.bind(authController));
  router.put('/auth/profile', authMiddleware.verifyToken, authController.updateProfile.bind(authController));
  router.post('/auth/change-password', authMiddleware.verifyToken, authController.changePassword.bind(authController));
  router.post('/auth/logout', authMiddleware.verifyToken, authController.logout.bind(authController));

  // ============================================================================
  // USER MANAGEMENT ROUTES (Admin Only)
  // ============================================================================
  
  router.get('/users', authMiddleware.verifyToken, authMiddleware.requireAdmin, userController.getAllUsers.bind(userController));
  router.get('/users/:id', authMiddleware.verifyToken, authMiddleware.requireAdmin, userController.getUserById.bind(userController));
  router.post('/users', authMiddleware.verifyToken, authMiddleware.requireAdmin, userController.createUser.bind(userController));
  router.put('/users/:id', authMiddleware.verifyToken, authMiddleware.requireAdmin, userController.updateUser.bind(userController));
  router.delete('/users/:id', authMiddleware.verifyToken, authMiddleware.requireAdmin, userController.deleteUser.bind(userController));
  router.post('/users/:id/reset-password', authMiddleware.verifyToken, authMiddleware.requireAdmin, userController.resetPassword.bind(userController));
  router.get('/roles-permissions', authMiddleware.verifyToken, authMiddleware.requireManager, userController.getRolesAndPermissions.bind(userController));

  // ============================================================================
  // PRODUCT ROUTES
  // ============================================================================
  
  // Public product routes
  router.get('/products', (req, res) => productController.getAllProducts(req, res));
  router.get('/products/:id', (req, res) => productController.getProductById(req, res));
  router.get('/products/low-stock', authMiddleware.verifyToken, (req, res) => productController.getLowStockProducts(req, res));
  
  // Product management (requires authentication)
  router.post('/products', authMiddleware.verifyToken, authMiddleware.requireRole(['admin', 'manager']), (req, res) => productController.createProduct(req, res));
  router.put('/products/:id', authMiddleware.verifyToken, authMiddleware.requireRole(['admin', 'manager']), (req, res) => productController.updateProduct(req, res));
  router.delete('/products/:id', authMiddleware.verifyToken, authMiddleware.requireRole(['admin', 'manager']), (req, res) => productController.deleteProduct(req, res));

  // Categories
  router.get('/categories', (req, res) => productController.getAllCategories(req, res));
  router.post('/categories', authMiddleware.verifyToken, authMiddleware.requireRole(['admin', 'manager']), (req, res) => productController.createCategory(req, res));
  router.put('/categories/:id', authMiddleware.verifyToken, authMiddleware.requireRole(['admin', 'manager']), (req, res) => productController.updateCategory(req, res));
  router.delete('/categories/:id', authMiddleware.verifyToken, authMiddleware.requireRole(['admin', 'manager']), (req, res) => productController.deleteCategory(req, res));

  // ============================================================================
  // ORDER ROUTES
  // ============================================================================
  
  // Order management
  router.get('/orders', authMiddleware.verifyToken, (req, res) => orderController.getAllOrders(req, res));
  router.get('/orders/:id', authMiddleware.verifyToken, (req, res) => orderController.getOrderDetails(req, res));
  router.post('/orders', authMiddleware.verifyToken, (req, res) => orderController.createOrder(req, res));
  router.put('/orders/:id/status', authMiddleware.verifyToken, (req, res) => orderController.updateOrderStatus(req, res));
  router.post('/orders/:id/cancel', authMiddleware.verifyToken, (req, res) => orderController.cancelOrder(req, res));
  
  // Order analytics
  router.get('/orders/analytics/summary', authMiddleware.verifyToken, authMiddleware.requireRole(['admin', 'manager']), (req, res) => orderController.getOrderAnalytics(req, res));

  // ============================================================================
  // TABLE ROUTES
  // ============================================================================
  
  // Table management
  router.get('/tables', authMiddleware.verifyToken, (req, res) => tableController.getAllTables(req, res));
  router.get('/tables/:id', authMiddleware.verifyToken, (req, res) => tableController.getTableDetails(req, res));
  router.post('/tables', authMiddleware.verifyToken, authMiddleware.requireRole(['admin', 'manager']), (req, res) => tableController.createTable(req, res));
  router.put('/tables/:id', authMiddleware.verifyToken, authMiddleware.requireRole(['admin', 'manager']), (req, res) => tableController.updateTable(req, res));
  router.put('/tables/:id/status', authMiddleware.verifyToken, (req, res) => tableController.updateTableStatus(req, res));
  router.delete('/tables/:id', authMiddleware.verifyToken, authMiddleware.requireRole(['admin', 'manager']), (req, res) => tableController.deleteTable(req, res));
  
  // Table reservations
  router.get('/reservations', authMiddleware.verifyToken, (req, res) => tableController.getReservations(req, res));
  router.post('/reservations', authMiddleware.verifyToken, (req, res) => tableController.createReservation(req, res));
  router.put('/reservations/:id/status', authMiddleware.verifyToken, (req, res) => tableController.updateReservationStatus(req, res));
  
  // Table analytics
  router.get('/tables/analytics/performance', authMiddleware.verifyToken, authMiddleware.requireRole(['admin', 'manager']), (req, res) => tableController.getTableAnalytics(req, res));

  // ============================================================================
  // INVENTORY ROUTES
  // ============================================================================
  
  // Inventory management
  router.get('/inventory', authMiddleware.verifyToken, (req, res) => inventoryController.getAllInventory(req, res));
  router.get('/inventory/low-stock', authMiddleware.verifyToken, (req, res) => inventoryController.getLowStockItems(req, res));
  router.get('/inventory/:id', authMiddleware.verifyToken, (req, res) => inventoryController.getInventoryItem(req, res));
  router.put('/inventory/:id', authMiddleware.verifyToken, authMiddleware.requireRole(['admin', 'manager']), (req, res) => inventoryController.updateInventoryItem(req, res));
  
  // Stock management
  router.post('/inventory/:id/adjust', authMiddleware.verifyToken, authMiddleware.requireRole(['admin', 'manager', 'cashier']), (req, res) => inventoryController.adjustStock(req, res));
  router.post('/inventory/bulk-adjust', authMiddleware.verifyToken, authMiddleware.requireRole(['admin', 'manager']), (req, res) => inventoryController.bulkStockAdjustment(req, res));
  
  // Stock movements and analytics
  router.get('/inventory/movements', authMiddleware.verifyToken, (req, res) => inventoryController.getStockMovements(req, res));
  router.get('/inventory/analytics/summary', authMiddleware.verifyToken, authMiddleware.requireRole(['admin', 'manager']), (req, res) => inventoryController.getInventoryAnalytics(req, res));

  // ============================================================================
  // REPORT ROUTES
  // ============================================================================
  
  // Sales reports
  router.get('/reports/sales', authMiddleware.verifyToken, authMiddleware.requireRole(['admin', 'manager']), (req, res) => reportController.getSalesReport(req, res));
  router.get('/reports/products', authMiddleware.verifyToken, authMiddleware.requireRole(['admin', 'manager']), (req, res) => reportController.getProductReport(req, res));
  router.get('/reports/inventory', authMiddleware.verifyToken, authMiddleware.requireRole(['admin', 'manager']), (req, res) => reportController.getInventoryReport(req, res));
  router.get('/reports/tables', authMiddleware.verifyToken, authMiddleware.requireRole(['admin', 'manager']), (req, res) => reportController.getTableReport(req, res));
  router.get('/reports/financial', authMiddleware.verifyToken, authMiddleware.requireRole(['admin', 'manager']), (req, res) => reportController.getFinancialReport(req, res));
  router.get('/reports/customers', authMiddleware.verifyToken, authMiddleware.requireRole(['admin', 'manager']), (req, res) => reportController.getCustomerReport(req, res));
  
  // Dashboard routes
  router.get('/dashboard/metrics', authMiddleware.verifyToken, (req, res) => dashboardController.getDashboardMetrics(req, res));
  router.get('/dashboard/sales-summary', authMiddleware.verifyToken, (req, res) => dashboardController.getSalesSummary(req, res));
  router.get('/dashboard/recent-orders', authMiddleware.verifyToken, (req, res) => dashboardController.getRecentOrders(req, res));
  router.get('/dashboard/top-products', authMiddleware.verifyToken, (req, res) => dashboardController.getTopProducts(req, res));
  
  // Report export
  router.get('/reports/export', authMiddleware.verifyToken, authMiddleware.requireRole(['admin', 'manager']), (req, res) => reportController.exportReport(req, res));

  // ============================================================================
  // SALES MANAGEMENT ROUTES
  // ============================================================================
  
  // Sales management
  router.get('/sales', authMiddleware.verifyToken, (req, res) => salesController.getAllSales(req, res));
  router.get('/sales/:id', authMiddleware.verifyToken, (req, res) => salesController.getSaleById(req, res));
  router.post('/sales', authMiddleware.verifyToken, (req, res) => salesController.createSale(req, res));
  router.put('/sales/:id/status', authMiddleware.verifyToken, (req, res) => salesController.updateSaleStatus(req, res));
  
  // Discount plans management
  router.get('/sales/discount-plans', authMiddleware.verifyToken, (req, res) => salesController.getDiscountPlans(req, res));
  router.post('/sales/discount-plans', authMiddleware.verifyToken, authMiddleware.requireRole(['admin', 'manager']), (req, res) => salesController.createDiscountPlan(req, res));
  
  // Sales analytics
  router.get('/sales/analytics/summary', authMiddleware.verifyToken, authMiddleware.requireRole(['admin', 'manager']), (req, res) => salesController.getSalesAnalytics(req, res));

  // ============================================================================
  // SYSTEM ROUTES
  // ============================================================================
  
  // Health check
  router.get('/health', (req, res) => {
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  });

  // System information (admin only)
  router.get('/system/info', authMiddleware.verifyToken, authMiddleware.requireRole(['admin']), async (req, res) => {
    try {
      // Get database statistics
      const stats = await Promise.all([
        new Promise((resolve) => {
          db.get('SELECT COUNT(*) as count FROM products WHERE is_active = 1', (err, row) => {
            resolve({ products: row ? row.count : 0 });
          });
        }),
        new Promise((resolve) => {
          db.get('SELECT COUNT(*) as count FROM orders', (err, row) => {
            resolve({ orders: row ? row.count : 0 });
          });
        }),
        new Promise((resolve) => {
          db.get('SELECT COUNT(*) as count FROM tables WHERE is_active = 1', (err, row) => {
            resolve({ tables: row ? row.count : 0 });
          });
        }),
        new Promise((resolve) => {
          db.get('SELECT COUNT(*) as count FROM users WHERE is_active = 1', (err, row) => {
            resolve({ users: row ? row.count : 0 });
          });
        })
      ]);

      const systemInfo = {
        database: {
          products: stats[0].products,
          orders: stats[1].orders,
          tables: stats[2].tables,
          users: stats[3].users
        },
        server: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          version: process.version
        }
      };

      res.json(systemInfo);
    } catch (error) {
      console.error('System info error:', error);
      res.status(500).json({ error: 'Failed to fetch system information' });
    }
  });

  // ============================================================================
  // LEGACY COMPATIBILITY ROUTES (for existing frontend)
  // ============================================================================
  


  // Legacy products route
  router.get('/products', (req, res) => {
    const { category, search } = req.query;
    
    let query = `
      SELECT p.*, c.name as category_name, i.current_stock, i.is_trackable
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      LEFT JOIN inventory i ON p.id = i.product_id
      WHERE p.is_active = 1
    `;
    const params = [];

    if (category) {
      query += ' AND p.category_id = ?';
      params.push(category);
    }

    if (search) {
      query += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY p.name';

    db.all(query, params, (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to fetch products' });
      }
      res.json(rows);
    });
  });

  // ============================================================================
  // AUDIT ROUTES
  // ============================================================================
  
  // Get audit logs with filtering and pagination
  router.get('/audit/logs', authMiddleware.verifyToken, authMiddleware.requireRole(['admin', 'manager']), auditController.getAuditLogs.bind(auditController));
  
  // Get audit trail for specific record
  router.get('/audit/trail/:tableName/:recordId', authMiddleware.verifyToken, authMiddleware.requireRole(['admin', 'manager']), auditController.getAuditTrail.bind(auditController));
  
  // Get audit summary
  router.get('/audit/summary', authMiddleware.verifyToken, authMiddleware.requireRole(['admin']), auditController.getAuditSummary.bind(auditController));
  
  // Run integrity checks
  router.post('/audit/integrity-check', authMiddleware.verifyToken, authMiddleware.requireRole(['admin']), auditController.runIntegrityChecks.bind(auditController));
  
  // Get audit statistics
  router.get('/audit/statistics', authMiddleware.verifyToken, authMiddleware.requireRole(['admin']), auditController.getAuditStatistics.bind(auditController));
  
  // Get security events
  router.get('/audit/security-events', authMiddleware.verifyToken, authMiddleware.requireRole(['admin']), auditController.getSecurityEvents.bind(auditController));

  // ============================================================================
  // BACKUP ROUTES
  // ============================================================================
  
  // Create full backup
  router.post('/backup/full', authMiddleware.verifyToken, authMiddleware.requireRole(['admin']), backupController.createFullBackup.bind(backupController));
  
  // Create incremental backup
  router.post('/backup/incremental', authMiddleware.verifyToken, authMiddleware.requireRole(['admin']), backupController.createIncrementalBackup.bind(backupController));
  
  // List all backups
  router.get('/backup/list', authMiddleware.verifyToken, authMiddleware.requireRole(['admin']), backupController.listBackups.bind(backupController));
  
  // Get backup details
  router.get('/backup/:filename/details', authMiddleware.verifyToken, authMiddleware.requireRole(['admin']), backupController.getBackupDetails.bind(backupController));
  
  // Restore from backup
  router.post('/backup/:filename/restore', authMiddleware.verifyToken, authMiddleware.requireRole(['admin']), backupController.restoreBackup.bind(backupController));
  
  // Delete backup
  router.delete('/backup/:filename', authMiddleware.verifyToken, authMiddleware.requireRole(['admin']), backupController.deleteBackup.bind(backupController));
  
  // Verify backup integrity
  router.get('/backup/:filename/verify', authMiddleware.verifyToken, authMiddleware.requireRole(['admin']), backupController.verifyBackup.bind(backupController));
  
  // Get backup statistics
  router.get('/backup/statistics', authMiddleware.verifyToken, authMiddleware.requireRole(['admin']), backupController.getBackupStatistics.bind(backupController));
  
  // Download backup file
  router.get('/backup/:filename/download', authMiddleware.verifyToken, authMiddleware.requireRole(['admin']), backupController.downloadBackup.bind(backupController));
  
  // Upload backup file (requires multer middleware for file upload)
  router.post('/backup/upload', authMiddleware.verifyToken, authMiddleware.requireRole(['admin']), backupController.uploadBackup.bind(backupController));

  return router;
}

module.exports = initializeRoutes;