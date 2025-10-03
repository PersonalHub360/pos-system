const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Create database connection
const db = new sqlite3.Database('./pos_database.db');

// Read the schema file
const schemaPath = path.join(__dirname, '..', 'database-schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

// Split the schema into individual statements
const statements = schema.split(';').filter(stmt => stmt.trim().length > 0);

console.log('Initializing database with schema...');

// Execute each statement
let completed = 0;
statements.forEach((statement, index) => {
  db.run(statement.trim(), (err) => {
    if (err) {
      console.error(`Error executing statement ${index + 1}:`, err.message);
      console.error('Statement:', statement.trim().substring(0, 100) + '...');
    } else {
      completed++;
      if (completed === statements.length) {
        console.log(`Database initialized successfully! Executed ${completed} statements.`);
        
        // Create default admin user
        const bcrypt = require('bcryptjs');
        const saltRounds = 12;
        bcrypt.hash('admin123', saltRounds, (err, hash) => {
          if (err) {
            console.error('Error hashing password:', err);
            db.close();
            return;
          }
          
          db.run(`INSERT OR IGNORE INTO users (username, email, password_hash, first_name, last_name, role, status) 
                  VALUES (?, ?, ?, ?, ?, ?, ?)`, 
                 ['admin', 'admin@example.com', hash, 'Admin', 'User', 'admin', 'active'], 
                 (err) => {
            if (err) {
              console.error('Error creating admin user:', err);
            } else {
              console.log('Default admin user created (username: admin, password: admin123)');
            }
            db.close();
          });
        });
      }
    }
  });
});