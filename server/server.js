const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Import middleware
const AuditMiddleware = require('./middleware/auditMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Database setup
const db = new sqlite3.Database('./pos_database.db');

// Initialize audit middleware
const auditMiddleware = new AuditMiddleware(db);

// Initialize backup service and start scheduler
const BackupService = require('./services/backupService');
const backupService = new BackupService(db);
backupService.scheduleBackups();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Add audit logging middleware
app.use(auditMiddleware.logApiRequest());

// Start scheduled integrity checks
auditMiddleware.scheduleIntegrityChecks();

// Initialize database tables
db.serialize(() => {
  // Categories table
  db.run(`CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Drop and recreate products table to ensure correct schema
  db.run(`DROP TABLE IF EXISTS products`);
  db.run(`CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    category_id INTEGER,
    image_url TEXT,
    stock INTEGER DEFAULT 0,
    description TEXT,
    sku TEXT,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories (id)
  )`);

  // Orders table
  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number TEXT UNIQUE NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    discount DECIMAL(10,2) DEFAULT 0,
    extra_discount DECIMAL(10,2) DEFAULT 0,
    coupon_discount DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Order items table
  db.run(`CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    product_id INTEGER,
    quantity INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders (id),
    FOREIGN KEY (product_id) REFERENCES products (id)
  )`);

  // Insert sample categories
  db.run(`INSERT OR IGNORE INTO categories (id, name) VALUES 
    (1, 'Rice'),
    (2, 'Beverages'),
    (3, 'Salads'),
    (4, 'Soup'),
    (5, 'Pizza')`);

  // Insert sample products with stock column
  db.run(`INSERT OR IGNORE INTO products (id, name, price, category_id, image_url, stock) VALUES 
    (1, 'Shrimp Basil Salad', 10.00, 3, '/images/shrimp-basil-salad.svg', 50),
    (2, 'Onion Rings', 10.00, 2, '/images/onion-rings.svg', 30),
    (3, 'Smoked Bacon', 10.00, 4, '/images/smoked-bacon.svg', 25),
    (4, 'Fresh Tomatoes', 10.00, 3, '/images/fresh-tomatoes.svg', 40),
    (5, 'Chicken Burger', 10.00, 4, '/images/chicken-burger.svg', 35),
    (6, 'Red Onion Rings', 10.00, 2, '/images/red-onion-rings.svg', 20),
    (7, 'Beef Burger', 10.00, 4, '/images/beef-burger.svg', 30),
    (8, 'Grilled Burger', 10.00, 4, '/images/grilled-burger.svg', 25),
    (9, 'Chicken Burger Deluxe', 10.00, 4, '/images/chicken-burger-deluxe.svg', 20),
    (10, 'Fresh Basil Salad', 10.00, 3, '/images/fresh-basil-salad.svg', 45),
    (11, 'Vegetable Pizza', 10.00, 5, '/images/vegetable-pizza.svg', 15),
    (12, 'Fish & Chips', 10.00, 4, '/images/fish-chips.svg', 30)`);
});

// API Routes

// Get all categories
app.get('/api/categories', (req, res) => {
  db.all('SELECT * FROM categories ORDER BY name', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Create new category
app.post('/api/categories', (req, res) => {
  console.log('Received category creation request:', JSON.stringify(req.body, null, 2));
  
  const { name } = req.body;
  
  // Validate required fields
  if (!name || !name.trim()) {
    console.error('Validation error: Category name is required');
    return res.status(400).json({ error: 'Category name is required' });
  }

  const categoryName = name.trim();

  // Check if category already exists
  db.get('SELECT id FROM categories WHERE name = ?', [categoryName], (err, existingCategory) => {
    if (err) {
      console.error('Error checking existing category:', err);
      return res.status(500).json({ error: 'Failed to check existing category: ' + err.message });
    }

    if (existingCategory) {
      return res.status(409).json({ error: 'Category already exists' });
    }

    // Create new category
    db.run('INSERT INTO categories (name) VALUES (?)', [categoryName], function(err) {
      if (err) {
        console.error('Error creating category:', err);
        return res.status(500).json({ error: 'Failed to create category: ' + err.message });
      }
      
      console.log('Category created with ID:', this.lastID);
      
      // Return the created category
      const newCategory = {
        id: this.lastID,
        name: categoryName
      };
      
      res.status(201).json(newCategory);
    });
  });
});

// Get all products
app.get('/api/products', (req, res) => {
  const { category, search } = req.query;
  let query = `
    SELECT p.*, c.name as category_name 
    FROM products p 
    LEFT JOIN categories c ON p.category_id = c.id
  `;
  let params = [];
  let conditions = [];

  if (category && category !== 'all') {
    conditions.push('c.name = ?');
    params.push(category);
  }

  if (search && search.trim()) {
    conditions.push('(p.name LIKE ? OR p.description LIKE ? OR c.name LIKE ?)');
    const searchTerm = `%${search.trim()}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY p.name';

  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get product by ID
app.get('/api/products/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM products WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json(row);
  });
});

// Create new product
app.post('/api/products', (req, res) => {
  console.log('Received product creation request:', JSON.stringify(req.body, null, 2));
  
  const { name, price, category, description, sku, status, image, stock } = req.body;
  
  // Validate required fields
  if (!name || !price) {
    console.error('Validation error: Name and price are required');
    return res.status(400).json({ error: 'Name and price are required' });
  }

  // Find category ID by name
  db.get('SELECT id FROM categories WHERE name = ?', [category], (err, categoryRow) => {
    if (err) {
      console.error('Error finding category:', err);
      return res.status(500).json({ error: 'Failed to find category: ' + err.message });
    }

    let categoryId = categoryRow ? categoryRow.id : null;
    
    // If category doesn't exist, create it
    if (!categoryId && category) {
      db.run('INSERT INTO categories (name) VALUES (?)', [category], function(err) {
        if (err) {
          console.error('Error creating category:', err);
          return res.status(500).json({ error: 'Failed to create category: ' + err.message });
        }
        categoryId = this.lastID;
        insertProduct();
      });
    } else {
      insertProduct();
    }

    function insertProduct() {
      const productQuery = `INSERT INTO products (name, price, category_id, image_url, stock, description, sku, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
      
      db.run(productQuery, [
        name, 
        parseFloat(price), 
        categoryId, 
        image || null,
        parseInt(stock) || 0,
        description || null,
        sku || null,
        status || 'active'
      ], function(err) {
        if (err) {
          console.error('Error creating product:', err);
          return res.status(500).json({ error: 'Failed to create product: ' + err.message });
        }
        
        console.log('Product created with ID:', this.lastID);
        
        // Return the created product
        db.get('SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?', 
          [this.lastID], (err, row) => {
          if (err) {
            console.error('Error fetching created product:', err);
            return res.status(500).json({ error: 'Product created but failed to fetch: ' + err.message });
          }
          
          res.status(201).json(row);
        });
      });
    }
  });
});

// Update product
app.put('/api/products/:id', (req, res) => {
  console.log('Received product update request for ID:', req.params.id);
  console.log('Update data:', JSON.stringify(req.body, null, 2));
  
  const productId = req.params.id;
  const { name, price, category, description, sku, status, image_url, stock } = req.body;
  
  // Validate required fields
  if (!name || !price) {
    console.error('Validation error: Name and price are required');
    return res.status(400).json({ error: 'Name and price are required' });
  }

  // Find category ID by name if category is provided
  if (category) {
    db.get('SELECT id FROM categories WHERE name = ?', [category], (err, categoryRow) => {
      if (err) {
        console.error('Error finding category:', err);
        return res.status(500).json({ error: 'Failed to find category: ' + err.message });
      }

      let categoryId = categoryRow ? categoryRow.id : null;
      
      // If category doesn't exist, create it
      if (!categoryId && category) {
        db.run('INSERT INTO categories (name) VALUES (?)', [category], function(err) {
          if (err) {
            console.error('Error creating category:', err);
            return res.status(500).json({ error: 'Failed to create category: ' + err.message });
          }
          categoryId = this.lastID;
          updateProduct(categoryId);
        });
      } else {
        updateProduct(categoryId);
      }
    });
  } else {
    updateProduct(null);
  }

  function updateProduct(categoryId) {
    const updateQuery = `
      UPDATE products 
      SET name = ?, price = ?, category_id = ?, image_url = ?, stock = ?, description = ?, sku = ?, status = ?
      WHERE id = ?
    `;
    
    db.run(updateQuery, [
      name, 
      parseFloat(price), 
      categoryId, 
      image_url || null,
      parseInt(stock) || 0,
      description || null,
      sku || null,
      status || 'active',
      productId
    ], function(err) {
      if (err) {
        console.error('Error updating product:', err);
        return res.status(500).json({ error: 'Failed to update product: ' + err.message });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }
      
      console.log('Product updated, changes:', this.changes);
      
      // Return the updated product
      db.get('SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?', 
        [productId], (err, row) => {
        if (err) {
          console.error('Error fetching updated product:', err);
          return res.status(500).json({ error: 'Product updated but failed to fetch: ' + err.message });
        }
        
        res.json(row);
      });
    });
  }
});

// Delete product
app.delete('/api/products/:id', (req, res) => {
  const productId = req.params.id;
  
  console.log('Received delete request for product ID:', productId);
  
  db.run('DELETE FROM products WHERE id = ?', [productId], function(err) {
    if (err) {
      console.error('Error deleting product:', err);
      return res.status(500).json({ error: 'Failed to delete product: ' + err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    console.log('Product deleted successfully, changes:', this.changes);
    res.json({ message: 'Product deleted successfully' });
  });
});

// Create order
app.post('/api/orders', (req, res) => {
  console.log('Received order request:', JSON.stringify(req.body, null, 2));
  
  const { items, subtotal, discount, total, table, timestamp } = req.body;
  
  // Validate required fields
  if (!items || !Array.isArray(items) || items.length === 0) {
    console.error('Validation error: Items are required and must be a non-empty array');
    return res.status(400).json({ error: 'Items are required and must be a non-empty array' });
  }
  
  if (!subtotal || !total) {
    console.error('Validation error: Subtotal and total are required');
    return res.status(400).json({ error: 'Subtotal and total are required' });
  }

  const orderNumber = `ORD-${Date.now()}`;
  console.log('Creating order with number:', orderNumber);
  
  // Insert order
  const orderQuery = `INSERT INTO orders (order_number, subtotal, discount, total, status) VALUES (?, ?, ?, ?, 'pending')`;
  
  db.run(orderQuery, [orderNumber, subtotal, discount || 0, total], function(err) {
    if (err) {
      console.error('Error creating order:', err);
      return res.status(500).json({ error: 'Failed to create order: ' + err.message });
    }
    
    console.log('Order created with ID:', this.lastID);
    const orderId = this.lastID;
    
    // Insert order items
    const itemQuery = `INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)`;
    let itemsInserted = 0;
    let hasError = false;
    
    if (items.length === 0) {
      return res.json({
        id: orderId,
        order_number: orderNumber,
        subtotal,
        discount: discount || 0,
        total,
        status: 'pending',
        items: []
      });
    }
    
    items.forEach((item, index) => {
      if (hasError) return;
      
      console.log(`Inserting item ${index + 1}:`, item);
      
      db.run(itemQuery, [orderId, item.product_id, item.quantity, item.price], function(err) {
        if (err) {
          console.error('Error inserting order item:', err);
          if (!hasError) {
            hasError = true;
            return res.status(500).json({ error: 'Failed to create order items: ' + err.message });
          }
          return;
        }
        
        console.log(`Item ${index + 1} inserted successfully`);
        itemsInserted++;
        
        if (itemsInserted === items.length) {
          console.log('All items inserted, sending response');
          res.json({
            id: orderId,
            order_number: orderNumber,
            subtotal,
            discount: discount || 0,
            total,
            status: 'pending',
            items
          });
        }
      });
    });
  });
});

// Get all orders
app.get('/api/orders', (req, res) => {
  db.all(`
    SELECT o.*, 
           GROUP_CONCAT(p.name || ' x' || oi.quantity) as items
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN products p ON oi.product_id = p.id
    GROUP BY o.id
    ORDER BY o.created_at DESC
  `, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Update order status
app.put('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  db.run('UPDATE orders SET status = ? WHERE id = ?', [status, id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    res.json({ message: 'Order updated successfully' });
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'RestroBit POS Server is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 RestroBit POS Server running on port ${PORT}`);
  console.log(`📊 API available at http://localhost:${PORT}/api`);
});