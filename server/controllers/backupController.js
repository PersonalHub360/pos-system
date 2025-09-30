const BackupService = require('../services/backupService');
const AuditService = require('../services/auditService');

class BackupController {
  constructor(db) {
    this.backupService = new BackupService(db);
    this.auditService = new AuditService(db);
  }

  // Create full backup
  async createFullBackup(req, res) {
    try {
      const { description } = req.body;
      
      const backup = await this.backupService.createFullBackup(
        description || 'Manual full backup'
      );

      // Log the backup creation
      await this.auditService.logAuditEvent({
        table_name: 'system',
        record_id: null,
        action: 'BACKUP_MANUAL_FULL',
        old_values: null,
        new_values: backup,
        user_id: req.user.id,
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'Full backup created successfully',
        backup
      });

    } catch (error) {
      console.error('Create full backup error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to create backup',
        details: error.message 
      });
    }
  }

  // Create incremental backup
  async createIncrementalBackup(req, res) {
    try {
      const { since, description } = req.body;

      if (!since) {
        return res.status(400).json({ 
          success: false, 
          error: 'Since date is required for incremental backup' 
        });
      }

      const backup = await this.backupService.createIncrementalBackup(
        since,
        description || 'Manual incremental backup'
      );

      // Log the backup creation
      await this.auditService.logAuditEvent({
        table_name: 'system',
        record_id: null,
        action: 'BACKUP_MANUAL_INCREMENTAL',
        old_values: null,
        new_values: backup,
        user_id: req.user.id,
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'Incremental backup created successfully',
        backup
      });

    } catch (error) {
      console.error('Create incremental backup error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to create incremental backup',
        details: error.message 
      });
    }
  }

  // List all backups
  async listBackups(req, res) {
    try {
      const backups = await this.backupService.listBackups();

      res.json({
        success: true,
        backups,
        count: backups.length
      });

    } catch (error) {
      console.error('List backups error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to list backups',
        details: error.message 
      });
    }
  }

  // Get backup details
  async getBackupDetails(req, res) {
    try {
      const { filename } = req.params;
      
      const verification = await this.backupService.verifyBackup(filename);
      
      res.json({
        success: true,
        filename,
        verification
      });

    } catch (error) {
      console.error('Get backup details error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to get backup details',
        details: error.message 
      });
    }
  }

  // Restore from backup
  async restoreBackup(req, res) {
    try {
      const { filename } = req.params;
      const { skipCurrentBackup = false } = req.body;

      // Verify backup before restore
      const verification = await this.backupService.verifyBackup(filename);
      if (!verification.valid) {
        return res.status(400).json({
          success: false,
          error: 'Backup verification failed',
          details: verification.error
        });
      }

      const result = await this.backupService.restoreFromBackup(filename, {
        skipCurrentBackup
      });

      // Log the restore operation
      await this.auditService.logAuditEvent({
        table_name: 'system',
        record_id: null,
        action: 'BACKUP_RESTORED',
        old_values: null,
        new_values: { filename, skipCurrentBackup },
        user_id: req.user.id,
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'Backup restored successfully',
        result
      });

    } catch (error) {
      console.error('Restore backup error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to restore backup',
        details: error.message 
      });
    }
  }

  // Delete backup
  async deleteBackup(req, res) {
    try {
      const { filename } = req.params;

      const result = await this.backupService.deleteBackup(filename);

      // Log the deletion
      await this.auditService.logAuditEvent({
        table_name: 'system',
        record_id: null,
        action: 'BACKUP_DELETED',
        old_values: { filename },
        new_values: null,
        user_id: req.user.id,
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'Backup deleted successfully',
        result
      });

    } catch (error) {
      console.error('Delete backup error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to delete backup',
        details: error.message 
      });
    }
  }

  // Verify backup integrity
  async verifyBackup(req, res) {
    try {
      const { filename } = req.params;

      const verification = await this.backupService.verifyBackup(filename);

      res.json({
        success: true,
        filename,
        verification
      });

    } catch (error) {
      console.error('Verify backup error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to verify backup',
        details: error.message 
      });
    }
  }

  // Get backup statistics
  async getBackupStatistics(req, res) {
    try {
      const backups = await this.backupService.listBackups();
      
      const stats = {
        total_backups: backups.length,
        full_backups: backups.filter(b => b.type === 'full').length,
        incremental_backups: backups.filter(b => b.type === 'incremental').length,
        total_size: backups.reduce((sum, b) => sum + (b.size || 0), 0),
        oldest_backup: backups.length > 0 ? backups[backups.length - 1].created_at : null,
        newest_backup: backups.length > 0 ? backups[0].created_at : null,
        backup_frequency: this.calculateBackupFrequency(backups)
      };

      res.json({
        success: true,
        statistics: stats,
        recent_backups: backups.slice(0, 10) // Last 10 backups
      });

    } catch (error) {
      console.error('Get backup statistics error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to get backup statistics',
        details: error.message 
      });
    }
  }

  // Download backup file
  async downloadBackup(req, res) {
    try {
      const { filename } = req.params;
      const backupPath = require('path').join(this.backupService.backupDir, filename);

      if (!require('fs').existsSync(backupPath)) {
        return res.status(404).json({
          success: false,
          error: 'Backup file not found'
        });
      }

      // Log the download
      await this.auditService.logAuditEvent({
        table_name: 'system',
        record_id: null,
        action: 'BACKUP_DOWNLOADED',
        old_values: null,
        new_values: { filename },
        user_id: req.user.id,
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      res.download(backupPath, filename);

    } catch (error) {
      console.error('Download backup error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to download backup',
        details: error.message 
      });
    }
  }

  // Upload backup file
  async uploadBackup(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No backup file provided'
        });
      }

      const { description } = req.body;
      const uploadedFile = req.file;
      
      // Move uploaded file to backup directory
      const backupPath = require('path').join(
        this.backupService.backupDir, 
        uploadedFile.originalname
      );
      
      require('fs').renameSync(uploadedFile.path, backupPath);

      // Create metadata
      const metadata = {
        filename: uploadedFile.originalname,
        path: backupPath,
        description: description || 'Uploaded backup',
        created_at: new Date().toISOString(),
        size: uploadedFile.size,
        type: uploadedFile.originalname.endsWith('.db') ? 'full' : 'incremental',
        uploaded_by: req.user.id
      };

      const metadataPath = require('path').join(
        this.backupService.backupDir, 
        `${uploadedFile.originalname}.meta.json`
      );
      
      require('fs').writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

      // Log the upload
      await this.auditService.logAuditEvent({
        table_name: 'system',
        record_id: null,
        action: 'BACKUP_UPLOADED',
        old_values: null,
        new_values: metadata,
        user_id: req.user.id,
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'Backup uploaded successfully',
        metadata
      });

    } catch (error) {
      console.error('Upload backup error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to upload backup',
        details: error.message 
      });
    }
  }

  // Calculate backup frequency
  calculateBackupFrequency(backups) {
    if (backups.length < 2) return null;

    const dates = backups.map(b => new Date(b.created_at)).sort((a, b) => a - b);
    const intervals = [];

    for (let i = 1; i < dates.length; i++) {
      intervals.push(dates[i] - dates[i - 1]);
    }

    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const hours = avgInterval / (1000 * 60 * 60);

    if (hours < 2) return 'Very frequent (< 2 hours)';
    if (hours < 24) return `Every ${Math.round(hours)} hours`;
    if (hours < 168) return `Every ${Math.round(hours / 24)} days`;
    return `Every ${Math.round(hours / 168)} weeks`;
  }
}

module.exports = BackupController;