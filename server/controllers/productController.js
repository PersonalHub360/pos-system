class ProductController {
  constructor(db) {
    this.db = db;
  }

  // Get all products with inventory information
  async getAllProducts(req, res) {
    try {
      const { category, search, status = 'active', page = 1, limit = 50 } = req.query;
      
      let query = `
        SELECT 
          p.*,
          c.name as category_name,
          i.current_stock,
          i.min_stock,
          i.max_stock,
          i.unit,
          i.last_restocked,
          CASE 
            WHEN i.current_stock <= i.min_stock THEN 'low_stock'
            WHEN i.current_stock = 0 THEN 'out_of_stock'
            ELSE 'in_stock'
          END as stock_status
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN inventory i ON p.id = i.product_id
        WHERE p.status = ?
      `;
      
      const params = [status];
      
      if (category && category !== 'all') {
        query += ' AND c.name = ?';
        params.push(category);
      }
      
      if (search && search.trim()) {
        query += ' AND (p.name LIKE ? OR p.description LIKE ? OR p.sku LIKE ?)';
        const searchTerm = `%${search.trim()}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }
      
      query += ' ORDER BY p.name';
      
      // Add pagination
      const offset = (page - 1) * limit;
      query += ' LIMIT ? OFFSET ?';
      params.push(parseInt(limit), offset);

      const products = await this.executeQuery(query, params);
      
      // Get total count for pagination
      let countQuery = `
        SELECT COUNT(*) as total
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.status = ?
      `;
      const countParams = [status];
      
      if (category && category !== 'all') {
        countQuery += ' AND c.name = ?';
        countParams.push(category);
      }
      
      if (search && search.trim()) {
        countQuery += ' AND (p.name LIKE ? OR p.description LIKE ? OR p.sku LIKE ?)';
        const searchTerm = `%${search.trim()}%`;
        countParams.push(searchTerm, searchTerm, searchTerm);
      }
      
      const countResult = await this.executeQuery(countQuery, countParams);
      const total = countResult[0].total;
      
      res.json({
        products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Get products error:', error);
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  }

  // Get single product by ID
  async getProductById(req, res) {
    try {
      const { id } = req.params;
      
      const query = `
        SELECT 
          p.*,
          c.name as category_name,
          i.current_stock,
          i.min_stock,
          i.max_stock,
          i.unit,
          i.last_restocked,
          CASE 
            WHEN i.current_stock <= i.min_stock THEN 'low_stock'
            WHEN i.current_stock = 0 THEN 'out_of_stock'
            ELSE 'in_stock'
          END as stock_status
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN inventory i ON p.id = i.product_id
        WHERE p.id = ?
      `;
      
      const products = await this.executeQuery(query, [id]);
      
      if (products.length === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }
      
      res.json(products[0]);
    } catch (error) {
      console.error('Get product error:', error);
      res.status(500).json({ error: 'Failed to fetch product' });
    }
  }

  // Create new product
  async createProduct(req, res) {
    try {
      const {
        name,
        description,
        sku,
        barcode,
        categoryId,
        price,
        costPrice,
        taxRate = 0,
        imageUrl,
        isTrackable = true,
        // Inventory data
        initialStock = 0,
        minStock = 0,
        maxStock = 0,
        unit = 'pieces'
      } = req.body;

      // Validate required fields
      if (!name || !price || !categoryId) {
        return res.status(400).json({ error: 'Name, price, and category are required' });
      }

      // Check if SKU already exists
      if (sku) {
        const existingProduct = await this.executeQuery('SELECT id FROM products WHERE sku = ?', [sku]);
        if (existingProduct.length > 0) {
          return res.status(409).json({ error: 'SKU already exists' });
        }
      }

      // Start transaction
      await this.beginTransaction();

      try {
        // Create product
        const productId = await this.insertProduct({
          name,
          description,
          sku,
          barcode,
          categoryId,
          price,
          costPrice,
          taxRate,
          imageUrl,
          isTrackable,
          createdBy: req.user?.id
        });

        // Create inventory record if product is trackable
        if (isTrackable) {
          await this.createInventoryRecord({
            productId,
            currentStock: initialStock,
            minStock,
            maxStock,
            unit
          });

          // Log initial stock movement if there's initial stock
          if (initialStock > 0) {
            await this.logStockMovement({
              productId,
              movementType: 'in',
              quantity: initialStock,
              referenceType: 'initial',
              notes: 'Initial stock',
              createdBy: req.user?.id
            });
          }
        }

        await this.commitTransaction();

        // Fetch the created product with inventory info
        const createdProduct = await this.executeQuery(`
          SELECT 
            p.*,
            c.name as category_name,
            i.current_stock,
            i.min_stock,
            i.max_stock,
            i.unit
          FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
          LEFT JOIN inventory i ON p.id = i.product_id
          WHERE p.id = ?
        `, [productId]);

        res.status(201).json({
          message: 'Product created successfully',
          product: createdProduct[0]
        });
      } catch (error) {
        await this.rollbackTransaction();
        throw error;
      }
    } catch (error) {
      console.error('Create product error:', error);
      res.status(500).json({ error: 'Failed to create product' });
    }
  }

  // Update product
  async updateProduct(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Check if product exists
      const existingProduct = await this.executeQuery('SELECT * FROM products WHERE id = ?', [id]);
      if (existingProduct.length === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Check SKU uniqueness if updating SKU
      if (updateData.sku && updateData.sku !== existingProduct[0].sku) {
        const skuExists = await this.executeQuery('SELECT id FROM products WHERE sku = ? AND id != ?', [updateData.sku, id]);
        if (skuExists.length > 0) {
          return res.status(409).json({ error: 'SKU already exists' });
        }
      }

      // Update product
      await this.updateProductRecord(id, updateData);

      // Update inventory if provided
      if (updateData.inventory) {
        await this.updateInventoryRecord(id, updateData.inventory);
      }

      res.json({ message: 'Product updated successfully' });
    } catch (error) {
      console.error('Update product error:', error);
      res.status(500).json({ error: 'Failed to update product' });
    }
  }

  // Delete product (soft delete)
  async deleteProduct(req, res) {
    try {
      const { id } = req.params;

      // Check if product exists
      const existingProduct = await this.executeQuery('SELECT * FROM products WHERE id = ?', [id]);
      if (existingProduct.length === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Soft delete by updating status
      await this.executeQuery('UPDATE products SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', ['inactive', id]);

      res.json({ message: 'Product deleted successfully' });
    } catch (error) {
      console.error('Delete product error:', error);
      res.status(500).json({ error: 'Failed to delete product' });
    }
  }

  // Get low stock products
  async getLowStockProducts(req, res) {
    try {
      const query = `
        SELECT 
          p.*,
          c.name as category_name,
          i.current_stock,
          i.min_stock,
          i.max_stock,
          i.unit
        FROM products p
        JOIN inventory i ON p.id = i.product_id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.status = 'active' 
        AND p.is_trackable = 1 
        AND i.current_stock <= i.min_stock
        ORDER BY i.current_stock ASC
      `;

      const products = await this.executeQuery(query);
      res.json(products);
    } catch (error) {
      console.error('Get low stock products error:', error);
      res.status(500).json({ error: 'Failed to fetch low stock products' });
    }
  }

  // Helper methods
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

  async insertProduct(productData) {
    return new Promise((resolve, reject) => {
      const {
        name, description, sku, barcode, categoryId, price, costPrice,
        taxRate, imageUrl, isTrackable, createdBy
      } = productData;

      this.db.run(`
        INSERT INTO products (
          name, description, sku, barcode, category_id, price, cost_price,
          tax_rate, image_url, is_trackable, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        name, description, sku, barcode, categoryId, price, costPrice,
        taxRate, imageUrl, isTrackable, createdBy
      ], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }

  async createInventoryRecord(inventoryData) {
    return new Promise((resolve, reject) => {
      const { productId, currentStock, minStock, maxStock, unit } = inventoryData;
      
      this.db.run(`
        INSERT INTO inventory (product_id, current_stock, min_stock, max_stock, unit)
        VALUES (?, ?, ?, ?, ?)
      `, [productId, currentStock, minStock, maxStock, unit], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
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

  async updateProductRecord(id, updateData) {
    const fields = [];
    const values = [];

    Object.keys(updateData).forEach(key => {
      if (key !== 'inventory' && updateData[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(updateData[key]);
      }
    });

    if (fields.length === 0) return;

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    return new Promise((resolve, reject) => {
      this.db.run(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, values, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async updateInventoryRecord(productId, inventoryData) {
    const fields = [];
    const values = [];

    Object.keys(inventoryData).forEach(key => {
      if (inventoryData[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(inventoryData[key]);
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

  // ============================================================================
  // CATEGORY METHODS
  // ============================================================================

  async getAllCategories(req, res) {
    try {
      const categories = await this.executeQuery('SELECT * FROM categories ORDER BY name');
      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch categories'
      });
    }
  }

  async createCategory(req, res) {
    try {
      const { name } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Category name is required'
        });
      }

      // Check if category already exists
      const existingCategory = await this.executeQuery(
        'SELECT id FROM categories WHERE name = ?',
        [name.trim()]
      );

      if (existingCategory.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Category already exists'
        });
      }

      // Use db.run for INSERT operations
      const result = await new Promise((resolve, reject) => {
        this.db.run(
          'INSERT INTO categories (name) VALUES (?)',
          [name.trim()],
          function(err) {
            if (err) reject(err);
            else resolve({ lastID: this.lastID });
          }
        );
      });

      const newCategory = await this.executeQuery(
        'SELECT * FROM categories WHERE id = ?',
        [result.lastID]
      );

      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: newCategory[0]
      });
    } catch (error) {
      console.error('Error creating category:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create category'
      });
    }
  }

  async updateCategory(req, res) {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Category name is required'
        });
      }

      // Check if category exists
      const existingCategory = await this.executeQuery(
        'SELECT * FROM categories WHERE id = ?',
        [id]
      );

      if (existingCategory.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Category not found'
        });
      }

      // Check if another category with the same name exists
      const duplicateCategory = await this.executeQuery(
        'SELECT id FROM categories WHERE name = ? AND id != ?',
        [name.trim(), id]
      );

      if (duplicateCategory.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Category name already exists'
        });
      }

      await this.executeQuery(
        'UPDATE categories SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [name.trim(), description || '', id]
      );

      const updatedCategory = await this.executeQuery(
        'SELECT * FROM categories WHERE id = ?',
        [id]
      );

      res.json({
        success: true,
        message: 'Category updated successfully',
        data: updatedCategory[0]
      });
    } catch (error) {
      console.error('Error updating category:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update category'
      });
    }
  }

  async deleteCategory(req, res) {
    try {
      const { id } = req.params;

      // Check if category exists
      const existingCategory = await this.executeQuery(
        'SELECT * FROM categories WHERE id = ?',
        [id]
      );

      if (existingCategory.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Category not found'
        });
      }

      // Check if category is being used by any products
      const productsUsingCategory = await this.executeQuery(
        'SELECT COUNT(*) as count FROM products WHERE category_id = ?',
        [id]
      );

      if (productsUsingCategory[0].count > 0) {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete category that is being used by products'
        });
      }

      await this.executeQuery('DELETE FROM categories WHERE id = ?', [id]);

      res.json({
        success: true,
        message: 'Category deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting category:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete category'
      });
    }
  }
}

module.exports = ProductController;