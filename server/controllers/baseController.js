/**
 * Base Controller
 * Provides common database operations and utilities for all controllers
 */

class BaseController {
  constructor(db) {
    this.db = db;
  }

  /**
   * Execute a database query and return all results
   */
  async executeQuery(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(query, params, (err, rows) => {
        if (err) {
          console.error('Database query error:', err);
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  /**
   * Execute a database query and return the first result
   */
  async executeQuerySingle(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(query, params, (err, row) => {
        if (err) {
          console.error('Database query error:', err);
          reject(err);
        } else {
          resolve(row || null);
        }
      });
    });
  }

  /**
   * Execute a database insert/update/delete query
   */
  async executeUpdate(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(query, params, function(err) {
        if (err) {
          console.error('Database update error:', err);
          reject(err);
        } else {
          resolve({
            lastID: this.lastID,
            changes: this.changes
          });
        }
      });
    });
  }

  /**
   * Begin a database transaction
   */
  async beginTransaction() {
    return new Promise((resolve, reject) => {
      this.db.run('BEGIN TRANSACTION', (err) => {
        if (err) {
          console.error('Begin transaction error:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Commit a database transaction
   */
  async commitTransaction() {
    return new Promise((resolve, reject) => {
      this.db.run('COMMIT', (err) => {
        if (err) {
          console.error('Commit transaction error:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Rollback a database transaction
   */
  async rollbackTransaction() {
    return new Promise((resolve, reject) => {
      this.db.run('ROLLBACK', (err) => {
        if (err) {
          console.error('Rollback transaction error:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Format date for database queries
   */
  formatDate(date) {
    if (!date) return null;
    return new Date(date).toISOString().split('T')[0];
  }

  /**
   * Validate required fields
   */
  validateRequiredFields(data, requiredFields) {
    const missingFields = [];
    
    for (const field of requiredFields) {
      if (!data[field] && data[field] !== 0) {
        missingFields.push(field);
      }
    }
    
    return missingFields;
  }

  /**
   * Build pagination query
   */
  buildPaginationQuery(baseQuery, page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    return `${baseQuery} LIMIT ${limit} OFFSET ${offset}`;
  }

  /**
   * Handle database errors consistently
   */
  handleDatabaseError(error, res, operation = 'database operation') {
    console.error(`Error during ${operation}:`, error);
    
    if (error.code === 'SQLITE_CONSTRAINT') {
      return res.status(400).json({
        success: false,
        message: 'Data constraint violation',
        error: error.message
      });
    }
    
    return res.status(500).json({
      success: false,
      message: `Failed to perform ${operation}`,
      error: error.message
    });
  }
}

module.exports = BaseController;