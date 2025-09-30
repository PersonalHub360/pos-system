const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Database setup
const db = new sqlite3.Database('./pos_database.db');

// Initialize database tables
db.serialize(() => {
  // Categories table
  db.run(`CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Products table
  db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    category_id INTEGER,
    image_url TEXT,
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

  // Insert sample products
  db.run(`INSERT OR IGNORE INTO products (id, name, price, category_id, image_url) VALUES 
    (1, 'Shrimp Basil Salad', 10.00, 3, '/images/shrimp-basil-salad.jpg'),
    (2, 'Onion Rings', 10.00, 2, '/images/onion-rings.jpg'),
    (3, 'Smoked Bacon', 10.00, 4, '/images/smoked-bacon.jpg'),
    (4, 'Fresh Tomatoes', 10.00, 3, '/images/fresh-tomatoes.jpg'),
    (5, 'Chicken Burger', 10.00, 4, '/images/chicken-burger.jpg'),
    (6, 'Red Onion Rings', 10.00, 2, '/images/red-onion-rings.jpg'),
    (7, 'Beef Burger', 10.00, 4, '/images/beef-burger.jpg'),
    (8, 'Grilled Burger', 10.00, 4, '/images/grilled-burger.jpg'),
    (9, 'Chicken Burger Deluxe', 10.00, 4, '/images/chicken-burger-deluxe.jpg'),
    (10, 'Fresh Basil Salad', 10.00, 3, '/images/fresh-basil-salad.jpg'),
    (11, 'Vegetable Pizza', 10.00, 5, '/images/vegetable-pizza.jpg'),
    (12, 'Fish & Chips', 10.00, 4, '/images/fish-chips.jpg')`);
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

// Get all products
app.get('/api/products', (req, res) => {
  const { category } = req.query;
  let query = `
    SELECT p.*, c.name as category_name 
    FROM products p 
    LEFT JOIN categories c ON p.category_id = c.id
  `;
  let params = [];

  if (category && category !== 'all') {
    query += ' WHERE c.name = ?';
    params.push(category);
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