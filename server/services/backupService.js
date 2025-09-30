const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class BackupService {
  constructor(db) {
    this.db = db;
    this.backupDir = path.join(__dirname, '../backups');
    this.maxBackups = 30; // Keep 30 days of backups
    
    // Ensure backup directory exists
    this.ensureBackupDirectory();
  }

  // Ensure backup directory exists
  ensureBackupDirectory() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  // Create a full database backup
  async createFullBackup(description = 'Scheduled backup') {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `pos_backup_${timestamp}.db`;
      const backupPath = path.join(this.backupDir, backupFileName);

      // Create backup using SQLite backup API
      await this.createSQLiteBackup(backupPath);

      // Create metadata file
      const metadata = {
        filename: backupFileName,
        path: backupPath,
        description,
        created_at: new Date().toISOString(),
        size: fs.statSync(backupPath).size,
        type: 'full',
        version: await this.getDatabaseVersion()
      };

      const metadataPath = path.join(this.backupDir, `${backupFileName}.meta.json`);
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

      // Log backup creation
      await this.logBackupEvent('BACKUP_CREATED', {
        filename: backupFileName,
        size: metadata.size,
        description
      });

      // Clean old backups
      await this.cleanOldBackups();

      return metadata;

    } catch (error) {
      console.error('Backup creation error:', error);
      await this.logBackupEvent('BACKUP_FAILED', { error: error.message });
      throw error;
    }
  }

  // Create SQLite backup using backup API
  async createSQLiteBackup(backupPath) {
    return new Promise((resolve, reject) => {
      const backup = this.db.backup(backupPath);
      
      backup.step(-1, (err) => {
        if (err) {
          reject(err);
        } else {
          backup.finish((err) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        }
      });
    });
  }

  // Create incremental backup (export changed data)
  async createIncrementalBackup(lastBackupDate, description = 'Incremental backup') {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `pos_incremental_${timestamp}.json`;
      const backupPath = path.join(this.backupDir, backupFileName);

      // Get changed data since last backup
      const changedData = await this.getChangedDataSince(lastBackupDate);

      // Save incremental data
      const backupData = {
        type: 'incremental',
        since: lastBackupDate,
        created_at: new Date().toISOString(),
        description,
        data: changedData
      };

      fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));

      // Create metadata
      const metadata = {
        filename: backupFileName,
        path: backupPath,
        description,
        created_at: new Date().toISOString(),
        size: fs.statSync(backupPath).size,
        type: 'incremental',
        since: lastBackupDate,
        records_count: Object.values(changedData).reduce((sum, table) => sum + table.length, 0)
      };

      const metadataPath = path.join(this.backupDir, `${backupFileName}.meta.json`);
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

      await this.logBackupEvent('INCREMENTAL_BACKUP_CREATED', {
        filename: backupFileName,
        records_count: metadata.records_count,
        since: lastBackupDate
      });

      return metadata;

    } catch (error) {
      console.error('Incremental backup error:', error);
      await this.logBackupEvent('INCREMENTAL_BACKUP_FAILED', { error: error.message });
      throw error;
    }
  }

  // Get changed data since a specific date
  async getChangedDataSince(sinceDate) {
    const tables = ['users', 'products', 'categories', 'orders', 'order_items', 'inventory', 'stock_movements'];
    const changedData = {};

    for (const table of tables) {
      try {
        let query;
        
        // Different tables have different timestamp columns
        if (table === 'users') {
          query = `SELECT * FROM ${table} WHERE created_at > ? OR updated_at > ?`;
        } else if (table === 'stock_movements') {
          query = `SELECT * FROM ${table} WHERE created_at > ?`;
        } else {
          query = `SELECT * FROM ${table} WHERE updated_at > ?`;
        }

        const params = table === 'users' ? [sinceDate, sinceDate] : [sinceDate];
        const rows = await this.executeQuery(query, params);
        
        if (rows.length > 0) {
          changedData[table] = rows;
        }
      } catch (error) {
        console.error(`Error getting changed data for ${table}:`, error);
        // Continue with other tables
      }
    }

    return changedData;
  }

  // Restore database from backup
  async restoreFromBackup(backupFileName, options = {}) {
    try {
      const backupPath = path.join(this.backupDir, backupFileName);
      const metadataPath = path.join(this.backupDir, `${backupFileName}.meta.json`);

      if (!fs.existsSync(backupPath)) {
        throw new Error('Backup file not found');
      }

      let metadata = {};
      if (fs.existsSync(metadataPath)) {
        metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      }

      // Create backup of current database before restore
      if (!options.skipCurrentBackup) {
        await this.createFullBackup('Pre-restore backup');
      }

      if (metadata.type === 'full' || backupFileName.endsWith('.db')) {
        await this.restoreFullBackup(backupPath);
      } else if (metadata.type === 'incremental') {
        await this.restoreIncrementalBackup(backupPath);
      } else {
        throw new Error('Unknown backup type');
      }

      await this.logBackupEvent('BACKUP_RESTORED', {
        filename: backupFileName,
        type: metadata.type || 'unknown'
      });

      return { success: true, metadata };

    } catch (error) {
      console.error('Restore error:', error);
      await this.logBackupEvent('RESTORE_FAILED', { 
        filename: backupFileName, 
        error: error.message 
      });
      throw error;
    }
  }

  // Restore full backup
  async restoreFullBackup(backupPath) {
    return new Promise((resolve, reject) => {
      // Close current database connection
      this.db.close((err) => {
        if (err) {
          reject(err);
          return;
        }

        // Copy backup file to main database
        const mainDbPath = './pos_database.db';
        fs.copyFileSync(backupPath, mainDbPath);

        // Reopen database connection
        const sqlite3 = require('sqlite3').verbose();
        this.db = new sqlite3.Database(mainDbPath, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    });
  }

  // Restore incremental backup
  async restoreIncrementalBackup(backupPath) {
    const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    
    for (const [tableName, records] of Object.entries(backupData.data)) {
      for (const record of records) {
        try {
          // Check if record exists
          const existingRecord = await this.executeQuery(
            `SELECT id FROM ${tableName} WHERE id = ?`,
            [record.id]
          );

          if (existingRecord.length > 0) {
            // Update existing record
            const updateFields = Object.keys(record).filter(key => key !== 'id');
            const updateQuery = `
              UPDATE ${tableName} 
              SET ${updateFields.map(field => `${field} = ?`).join(', ')}
              WHERE id = ?
            `;
            const updateParams = [...updateFields.map(field => record[field]), record.id];
            await this.executeQuery(updateQuery, updateParams);
          } else {
            // Insert new record
            const insertFields = Object.keys(record);
            const insertQuery = `
              INSERT INTO ${tableName} (${insertFields.join(', ')})
              VALUES (${insertFields.map(() => '?').join(', ')})
            `;
            const insertParams = insertFields.map(field => record[field]);
            await this.executeQuery(insertQuery, insertParams);
          }
        } catch (error) {
          console.error(`Error restoring record in ${tableName}:`, error);
          // Continue with next record
        }
      }
    }
  }

  // List available backups
  async listBackups() {
    try {
      const files = fs.readdirSync(this.backupDir);
      const backups = [];

      for (const file of files) {
        if (file.endsWith('.meta.json')) {
          const metadataPath = path.join(this.backupDir, file);
          const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
          
          // Check if backup file still exists
          if (fs.existsSync(metadata.path)) {
            backups.push(metadata);
          }
        }
      }

      // Sort by creation date (newest first)
      backups.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      return backups;

    } catch (error) {
      console.error('List backups error:', error);
      throw error;
    }
  }

  // Delete backup
  async deleteBackup(backupFileName) {
    try {
      const backupPath = path.join(this.backupDir, backupFileName);
      const metadataPath = path.join(this.backupDir, `${backupFileName}.meta.json`);

      if (fs.existsSync(backupPath)) {
        fs.unlinkSync(backupPath);
      }

      if (fs.existsSync(metadataPath)) {
        fs.unlinkSync(metadataPath);
      }

      await this.logBackupEvent('BACKUP_DELETED', { filename: backupFileName });

      return { success: true };

    } catch (error) {
      console.error('Delete backup error:', error);
      await this.logBackupEvent('BACKUP_DELETE_FAILED', { 
        filename: backupFileName, 
        error: error.message 
      });
      throw error;
    }
  }

  // Clean old backups
  async cleanOldBackups() {
    try {
      const backups = await this.listBackups();
      
      if (backups.length > this.maxBackups) {
        const backupsToDelete = backups.slice(this.maxBackups);
        
        for (const backup of backupsToDelete) {
          await this.deleteBackup(backup.filename);
        }

        await this.logBackupEvent('OLD_BACKUPS_CLEANED', { 
          deleted_count: backupsToDelete.length 
        });
      }

    } catch (error) {
      console.error('Clean old backups error:', error);
    }
  }

  // Verify backup integrity
  async verifyBackup(backupFileName) {
    try {
      const backupPath = path.join(this.backupDir, backupFileName);
      const metadataPath = path.join(this.backupDir, `${backupFileName}.meta.json`);

      if (!fs.existsSync(backupPath)) {
        return { valid: false, error: 'Backup file not found' };
      }

      const metadata = fs.existsSync(metadataPath) 
        ? JSON.parse(fs.readFileSync(metadataPath, 'utf8'))
        : {};

      // Check file size
      const currentSize = fs.statSync(backupPath).size;
      if (metadata.size && currentSize !== metadata.size) {
        return { valid: false, error: 'File size mismatch' };
      }

      // For SQLite backups, try to open and query
      if (backupFileName.endsWith('.db')) {
        const sqlite3 = require('sqlite3').verbose();
        const testDb = new sqlite3.Database(backupPath, sqlite3.OPEN_READONLY);
        
        await new Promise((resolve, reject) => {
          testDb.get('SELECT COUNT(*) as count FROM sqlite_master', (err, row) => {
            testDb.close();
            if (err) {
              reject(err);
            } else {
              resolve(row);
            }
          });
        });
      }

      // For JSON backups, try to parse
      if (backupFileName.endsWith('.json')) {
        JSON.parse(fs.readFileSync(backupPath, 'utf8'));
      }

      return { valid: true, metadata };

    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  // Schedule automatic backups
  scheduleBackups() {
    // Daily full backup at 2 AM
    const dailyBackup = () => {
      const now = new Date();
      if (now.getHours() === 2 && now.getMinutes() === 0) {
        this.createFullBackup('Scheduled daily backup');
      }
    };

    // Hourly incremental backup during business hours (9 AM - 6 PM)
    const hourlyBackup = () => {
      const now = new Date();
      const hour = now.getHours();
      if (hour >= 9 && hour <= 18 && now.getMinutes() === 0) {
        const lastHour = new Date(now.getTime() - 60 * 60 * 1000);
        this.createIncrementalBackup(lastHour.toISOString(), 'Scheduled hourly backup');
      }
    };

    // Check every minute
    setInterval(() => {
      dailyBackup();
      hourlyBackup();
    }, 60000);

    console.log('Backup scheduler started');
  }

  // Get database version/schema info
  async getDatabaseVersion() {
    try {
      const tables = await this.executeQuery(
        "SELECT name FROM sqlite_master WHERE type='table'"
      );
      return {
        table_count: tables.length,
        tables: tables.map(t => t.name),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  // Log backup events
  async logBackupEvent(action, details) {
    try {
      const query = `
        INSERT INTO audit_logs (
          table_name, record_id, action, old_values, new_values,
          user_id, ip_address, user_agent, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await this.executeQuery(query, [
        'system',
        null,
        action,
        null,
        JSON.stringify(details),
        null, // System user
        'system',
        'BackupService',
        new Date().toISOString()
      ]);
    } catch (error) {
      console.error('Failed to log backup event:', error);
    }
  }

  // Database helper method
  async executeQuery(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }
}

module.exports = BackupService;