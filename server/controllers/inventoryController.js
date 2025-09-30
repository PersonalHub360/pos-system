class InventoryController {
  constructor(db) {
    this.db = db;
  }

  // Get all inventory items with stock levels
  async getAllInventory(req, res) {
    try {
      const { 
        category, 
        lowStock = false, 
        trackable = null,
        search,
        sortBy = 'name',
        sortOrder = 'ASC',
        page = 1,
        limit = 50
      } = req.query;

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
        WHERE p.is_active = 1
      `;

      const params = [];

      if (category) {
        query += ' AND p.category_id = ?';
        params.push(category);
      }

      if (trackable !== null) {
        query += ' AND i.is_trackable = ?';
        params.push(trackable === 'true' ? 1 : 0);
      }

      if (lowStock === 'true') {
        query += ' AND i.current_stock <= i.reorder_level';
      }

      if (search) {
        query += ' AND (p.name LIKE ? OR p.description LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }

      // Sorting
      const validSortFields = ['name', 'current_stock', 'reorder_level', 'cost_price', 'category_name'];
      const sortField = validSortFields.includes(sortBy) ? sortBy : 'name';
      const order = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
      
      if (sortField === 'name') {
        query += ` ORDER BY p.name ${order}`;
      } else if (sortField === 'category_name') {
        query += ` ORDER BY c.name ${order}`;
      } else {
        query += ` ORDER BY i.${sortField} ${order}`;
      }

      // Pagination
      const offset = (page - 1) * limit;
      query += ' LIMIT ? OFFSET ?';
      params.push(parseInt(limit), offset);

      const inventory = await this.executeQuery(query, params);

      // Get total count for pagination
      let countQuery = `
        SELECT COUNT(*) as total
        FROM inventory i
        JOIN products p ON i.product_id = p.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.is_active = 1
      `;
      const countParams = [];

      if (category) {
        countQuery += ' AND p.category_id = ?';
        countParams.push(category);
      }

      if (trackable !== null) {
        countQuery += ' AND i.is_trackable = ?';
        countParams.push(trackable === 'true' ? 1 : 0);
      }

      if (lowStock === 'true') {
        countQuery += ' AND i.current_stock <= i.reorder_level';
      }

      if (search) {
        countQuery += ' AND (p.name LIKE ? OR p.description LIKE ?)';
        countParams.push(`%${search}%`, `%${search}%`);
      }

      const countResult = await this.executeQuery(countQuery, countParams);
      const total = countResult[0].total;

      res.json({
        inventory,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Get inventory error:', error);
      res.status(500).json({ error: 'Failed to fetch inventory' });
    }
  }

  // Get single inventory item
  async getInventoryItem(req, res) {
    try {
      const { id } = req.params;

      const query = `
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
          s.phone as supplier_phone,
          s.email as supplier_email
        FROM inventory i
        JOIN products p ON i.product_id = p.id
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN suppliers s ON i.supplier_id = s.id
        WHERE i.product_id = ?
      `;

      const inventory = await this.executeQuery(query, [id]);

      if (inventory.length === 0) {
        return res.status(404).json({ error: 'Inventory item not found' });
      }

      // Get recent stock movements
      const movementsQuery = `
        SELECT 
          sm.*,
          u.username as created_by_username
        FROM stock_movements sm
        LEFT JOIN users u ON sm.created_by = u.id
        WHERE sm.product_id = ?
        ORDER BY sm.created_at DESC
        LIMIT 20
      `;

      const movements = await this.executeQuery(movementsQuery, [id]);

      const item = inventory[0];
      item.recent_movements = movements;

      res.json(item);
    } catch (error) {
      console.error('Get inventory item error:', error);
      res.status(500).json({ error: 'Failed to fetch inventory item' });
    }
  }

  // Update inventory item
  async updateInventoryItem(req, res) {
    try {
      const { id } = req.params;
      const {
        reorderLevel,
        maxStock,
        costPrice,
        supplierId,
        isTrackable,
        unit,
        notes
      } = req.body;

      // Check if inventory item exists
      const existingItem = await this.executeQuery(
        'SELECT * FROM inventory WHERE product_id = ?',
        [id]
      );

      if (existingItem.length === 0) {
        return res.status(404).json({ error: 'Inventory item not found' });
      }

      const updateData = {};
      if (reorderLevel !== undefined) updateData.reorder_level = reorderLevel;
      if (maxStock !== undefined) updateData.max_stock = maxStock;
      if (costPrice !== undefined) updateData.cost_price = costPrice;
      if (supplierId !== undefined) updateData.supplier_id = supplierId;
      if (isTrackable !== undefined) updateData.is_trackable = isTrackable;
      if (unit !== undefined) updateData.unit = unit;
      if (notes !== undefined) updateData.notes = notes;

      await this.updateInventory(id, updateData);

      res.json({ message: 'Inventory item updated successfully' });
    } catch (error) {
      console.error('Update inventory item error:', error);
      res.status(500).json({ error: 'Failed to update inventory item' });
    }
  }

  // Adjust stock levels
  async adjustStock(req, res) {
    try {
      const { id } = req.params;
      const { 
        adjustmentType, // 'in' or 'out'
        quantity,
        reason,
        notes,
        costPrice
      } = req.body;

      // Validate input
      if (!adjustmentType || !quantity || quantity <= 0) {
        return res.status(400).json({ error: 'Invalid adjustment data' });
      }

      if (!['in', 'out'].includes(adjustmentType)) {
        return res.status(400).json({ error: 'Adjustment type must be "in" or "out"' });
      }

      // Check if inventory item exists
      const inventory = await this.executeQuery(
        'SELECT * FROM inventory WHERE product_id = ?',
        [id]
      );

      if (inventory.length === 0) {
        return res.status(404).json({ error: 'Inventory item not found' });
      }

      const currentItem = inventory[0];

      // Check if item is trackable
      if (!currentItem.is_trackable) {
        return res.status(400).json({ error: 'Cannot adjust stock for non-trackable items' });
      }

      // For stock out, check if sufficient stock is available
      if (adjustmentType === 'out' && currentItem.current_stock < quantity) {
        return res.status(400).json({ 
          error: `Insufficient stock. Available: ${currentItem.current_stock}, Requested: ${quantity}` 
        });
      }

      await this.beginTransaction();

      try {
        // Calculate new stock level
        const stockChange = adjustmentType === 'in' ? quantity : -quantity;
        const newStock = currentItem.current_stock + stockChange;

        // Update inventory
        const updateData = { current_stock: newStock };
        if (costPrice && adjustmentType === 'in') {
          updateData.cost_price = costPrice;
        }

        await this.updateInventory(id, updateData);

        // Log stock movement
        await this.logStockMovement({
          productId: id,
          movementType: adjustmentType,
          quantity: quantity,
          referenceType: 'manual_adjustment',
          referenceId: null,
          reason: reason,
          notes: notes,
          createdBy: req.user?.id
        });

        await this.commitTransaction();

        res.json({ 
          message: 'Stock adjusted successfully',
          newStock: newStock
        });
      } catch (error) {
        await this.rollbackTransaction();
        throw error;
      }
    } catch (error) {
      console.error('Adjust stock error:', error);
      res.status(500).json({ error: 'Failed to adjust stock' });
    }
  }

  // Bulk stock adjustment
  async bulkStockAdjustment(req, res) {
    try {
      const { adjustments } = req.body;

      if (!Array.isArray(adjustments) || adjustments.length === 0) {
        return res.status(400).json({ error: 'Adjustments array is required' });
      }

      await this.beginTransaction();

      try {
        const results = [];

        for (const adjustment of adjustments) {
          const { productId, adjustmentType, quantity, reason, notes } = adjustment;

          // Validate each adjustment
          if (!productId || !adjustmentType || !quantity || quantity <= 0) {
            throw new Error(`Invalid adjustment data for product ${productId}`);
          }

          // Get current inventory
          const inventory = await this.executeQuery(
            'SELECT * FROM inventory WHERE product_id = ?',
            [productId]
          );

          if (inventory.length === 0) {
            throw new Error(`Inventory item not found for product ${productId}`);
          }

          const currentItem = inventory[0];

          if (!currentItem.is_trackable) {
            throw new Error(`Cannot adjust stock for non-trackable product ${productId}`);
          }

          // Check stock availability for out adjustments
          if (adjustmentType === 'out' && currentItem.current_stock < quantity) {
            throw new Error(`Insufficient stock for product ${productId}. Available: ${currentItem.current_stock}, Requested: ${quantity}`);
          }

          // Calculate new stock
          const stockChange = adjustmentType === 'in' ? quantity : -quantity;
          const newStock = currentItem.current_stock + stockChange;

          // Update inventory
          await this.updateInventory(productId, { current_stock: newStock });

          // Log stock movement
          await this.logStockMovement({
            productId: productId,
            movementType: adjustmentType,
            quantity: quantity,
            referenceType: 'bulk_adjustment',
            referenceId: null,
            reason: reason,
            notes: notes,
            createdBy: req.user?.id
          });

          results.push({
            productId: productId,
            previousStock: currentItem.current_stock,
            newStock: newStock,
            adjustment: stockChange
          });
        }

        await this.commitTransaction();

        res.json({
          message: 'Bulk stock adjustment completed successfully',
          results: results
        });
      } catch (error) {
        await this.rollbackTransaction();
        throw error;
      }
    } catch (error) {
      console.error('Bulk stock adjustment error:', error);
      res.status(500).json({ error: error.message || 'Failed to perform bulk stock adjustment' });
    }
  }

  // Get stock movements
  async getStockMovements(req, res) {
    try {
      const {
        productId,
        movementType,
        referenceType,
        dateFrom,
        dateTo,
        page = 1,
        limit = 50
      } = req.query;

      let query = `
        SELECT 
          sm.*,
          p.name as product_name,
          u.username as created_by_username
        FROM stock_movements sm
        JOIN products p ON sm.product_id = p.id
        LEFT JOIN users u ON sm.created_by = u.id
        WHERE 1=1
      `;

      const params = [];

      if (productId) {
        query += ' AND sm.product_id = ?';
        params.push(productId);
      }

      if (movementType) {
        query += ' AND sm.movement_type = ?';
        params.push(movementType);
      }

      if (referenceType) {
        query += ' AND sm.reference_type = ?';
        params.push(referenceType);
      }

      if (dateFrom) {
        query += ' AND DATE(sm.created_at) >= ?';
        params.push(dateFrom);
      }

      if (dateTo) {
        query += ' AND DATE(sm.created_at) <= ?';
        params.push(dateTo);
      }

      query += ' ORDER BY sm.created_at DESC';

      // Pagination
      const offset = (page - 1) * limit;
      query += ' LIMIT ? OFFSET ?';
      params.push(parseInt(limit), offset);

      const movements = await this.executeQuery(query, params);

      // Get total count
      let countQuery = `
        SELECT COUNT(*) as total
        FROM stock_movements sm
        WHERE 1=1
      `;
      const countParams = [];

      if (productId) {
        countQuery += ' AND sm.product_id = ?';
        countParams.push(productId);
      }

      if (movementType) {
        countQuery += ' AND sm.movement_type = ?';
        countParams.push(movementType);
      }

      if (referenceType) {
        countQuery += ' AND sm.reference_type = ?';
        countParams.push(referenceType);
      }

      if (dateFrom) {
        countQuery += ' AND DATE(sm.created_at) >= ?';
        countParams.push(dateFrom);
      }

      if (dateTo) {
        countQuery += ' AND DATE(sm.created_at) <= ?';
        countParams.push(dateTo);
      }

      const countResult = await this.executeQuery(countQuery, countParams);
      const total = countResult[0].total;

      res.json({
        movements,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Get stock movements error:', error);
      res.status(500).json({ error: 'Failed to fetch stock movements' });
    }
  }

  // Get low stock items
  async getLowStockItems(req, res) {
    try {
      const query = `
        SELECT 
          i.*,
          p.name,
          p.description,
          c.name as category_name,
          s.name as supplier_name,
          (i.reorder_level - i.current_stock) as shortage_quantity
        FROM inventory i
        JOIN products p ON i.product_id = p.id
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN suppliers s ON i.supplier_id = s.id
        WHERE i.is_trackable = 1 
        AND i.current_stock <= i.reorder_level
        AND p.is_active = 1
        ORDER BY (i.current_stock / NULLIF(i.reorder_level, 0)) ASC
      `;

      const lowStockItems = await this.executeQuery(query);

      res.json(lowStockItems);
    } catch (error) {
      console.error('Get low stock items error:', error);
      res.status(500).json({ error: 'Failed to fetch low stock items' });
    }
  }

  // Get inventory analytics
  async getInventoryAnalytics(req, res) {
    try {
      const { dateFrom, dateTo } = req.query;

      // Inventory summary
      const summaryQuery = `
        SELECT 
          COUNT(*) as total_products,
          COUNT(CASE WHEN i.is_trackable = 1 THEN 1 END) as trackable_products,
          COUNT(CASE WHEN i.current_stock <= i.reorder_level AND i.is_trackable = 1 THEN 1 END) as low_stock_items,
          SUM(CASE WHEN i.is_trackable = 1 THEN i.current_stock * i.cost_price ELSE 0 END) as total_inventory_value
        FROM inventory i
        JOIN products p ON i.product_id = p.id
        WHERE p.is_active = 1
      `;

      // Stock movements summary
      let movementQuery = `
        SELECT 
          movement_type,
          reference_type,
          COUNT(*) as movement_count,
          SUM(quantity) as total_quantity
        FROM stock_movements
        WHERE 1=1
      `;

      const params = [];
      if (dateFrom && dateTo) {
        movementQuery += ' AND DATE(created_at) BETWEEN ? AND ?';
        params.push(dateFrom, dateTo);
      }

      movementQuery += ' GROUP BY movement_type, reference_type';

      // Category-wise inventory value
      const categoryQuery = `
        SELECT 
          c.name as category_name,
          COUNT(i.product_id) as product_count,
          SUM(CASE WHEN i.is_trackable = 1 THEN i.current_stock * i.cost_price ELSE 0 END) as inventory_value,
          COUNT(CASE WHEN i.current_stock <= i.reorder_level AND i.is_trackable = 1 THEN 1 END) as low_stock_count
        FROM inventory i
        JOIN products p ON i.product_id = p.id
        JOIN categories c ON p.category_id = c.id
        WHERE p.is_active = 1
        GROUP BY c.id, c.name
        ORDER BY inventory_value DESC
      `;

      const [summary, movements, categoryBreakdown] = await Promise.all([
        this.executeQuery(summaryQuery),
        this.executeQuery(movementQuery, params),
        this.executeQuery(categoryQuery)
      ]);

      res.json({
        summary: summary[0],
        movements,
        categoryBreakdown
      });
    } catch (error) {
      console.error('Get inventory analytics error:', error);
      res.status(500).json({ error: 'Failed to fetch inventory analytics' });
    }
  }

  // Helper methods
  async updateInventory(productId, updateData) {
    const fields = [];
    const values = [];

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(updateData[key]);
      }
    });

    if (fields.length === 0) return;

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(productId);

    return new Promise((resolve, reject) => {
      this.db.run(`UPDATE inventory SET ${fields.join(', ')} WHERE product_id = ?`, values, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async logStockMovement(movementData) {
    return new Promise((resolve, reject) => {
      const { productId, movementType, quantity, referenceType, referenceId, reason, notes, createdBy } = movementData;
      
      this.db.run(`
        INSERT INTO stock_movements (
          product_id, movement_type, quantity, reference_type, reference_id, reason, notes, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [productId, movementType, quantity, referenceType, referenceId, reason, notes, createdBy], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }

  // Database helper methods
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
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

module.exports = InventoryController;