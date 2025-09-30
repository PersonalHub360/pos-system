const AuditService = require('../services/auditService');

class AuditController {
  constructor(db) {
    this.auditService = new AuditService(db);
  }

  // Get audit logs with filtering and pagination
  async getAuditLogs(req, res) {
    try {
      const {
        page = 1,
        limit = 50,
        tableName,
        action,
        userId,
        dateFrom,
        dateTo,
        recordId
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);

      let query = `
        SELECT 
          al.*,
          u.username,
          u.full_name
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        WHERE 1=1
      `;

      const params = [];

      if (tableName) {
        query += ' AND al.table_name = ?';
        params.push(tableName);
      }

      if (action) {
        query += ' AND al.action = ?';
        params.push(action);
      }

      if (userId) {
        query += ' AND al.user_id = ?';
        params.push(userId);
      }

      if (recordId) {
        query += ' AND al.record_id = ?';
        params.push(recordId);
      }

      if (dateFrom) {
        query += ' AND DATE(al.created_at) >= ?';
        params.push(dateFrom);
      }

      if (dateTo) {
        query += ' AND DATE(al.created_at) <= ?';
        params.push(dateTo);
      }

      // Get total count
      const countQuery = query.replace(
        'SELECT al.*, u.username, u.full_name FROM audit_logs al LEFT JOIN users u ON al.user_id = u.id',
        'SELECT COUNT(*) as total FROM audit_logs al LEFT JOIN users u ON al.user_id = u.id'
      );

      const countResult = await this.executeQuery(countQuery, params);
      const total = countResult[0].total;

      // Add pagination
      query += ' ORDER BY al.created_at DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), offset);

      const auditLogs = await this.executeQuery(query, params);

      res.json({
        data: auditLogs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });

    } catch (error) {
      console.error('Get audit logs error:', error);
      res.status(500).json({ error: 'Failed to retrieve audit logs' });
    }
  }

  // Get audit trail for a specific record
  async getAuditTrail(req, res) {
    try {
      const { tableName, recordId } = req.params;
      const { limit = 50 } = req.query;

      const auditTrail = await this.auditService.getAuditTrail(tableName, recordId, parseInt(limit));

      res.json({
        tableName,
        recordId,
        auditTrail
      });

    } catch (error) {
      console.error('Get audit trail error:', error);
      res.status(500).json({ error: 'Failed to retrieve audit trail' });
    }
  }

  // Get audit summary
  async getAuditSummary(req, res) {
    try {
      const { dateFrom, dateTo, userId } = req.query;

      if (!dateFrom || !dateTo) {
        return res.status(400).json({ error: 'Date range is required' });
      }

      const summary = await this.auditService.getAuditSummary(dateFrom, dateTo, userId);

      res.json({
        period: { dateFrom, dateTo },
        userId: userId || null,
        summary
      });

    } catch (error) {
      console.error('Get audit summary error:', error);
      res.status(500).json({ error: 'Failed to generate audit summary' });
    }
  }

  // Run data integrity checks
  async runIntegrityChecks(req, res) {
    try {
      const results = await this.auditService.performIntegrityChecks();

      // Log the integrity check
      await this.auditService.logAuditEvent({
        table_name: 'system',
        record_id: null,
        action: 'INTEGRITY_CHECK_MANUAL',
        old_values: null,
        new_values: results,
        user_id: req.user.id,
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        additional_info: { manual: true }
      });

      res.json(results);

    } catch (error) {
      console.error('Run integrity checks error:', error);
      res.status(500).json({ error: 'Failed to run integrity checks' });
    }
  }

  // Get audit statistics
  async getAuditStatistics(req, res) {
    try {
      const { dateFrom, dateTo } = req.query;

      let dateFilter = '';
      const params = [];

      if (dateFrom && dateTo) {
        dateFilter = 'WHERE DATE(created_at) BETWEEN ? AND ?';
        params.push(dateFrom, dateTo);
      }

      // Get basic statistics
      const statsQuery = `
        SELECT 
          COUNT(*) as total_events,
          COUNT(DISTINCT user_id) as unique_users,
          COUNT(DISTINCT table_name) as affected_tables,
          COUNT(DISTINCT DATE(created_at)) as active_days
        FROM audit_logs
        ${dateFilter}
      `;

      const stats = await this.executeQuery(statsQuery, params);

      // Get action breakdown
      const actionQuery = `
        SELECT 
          action,
          COUNT(*) as count,
          COUNT(DISTINCT user_id) as unique_users
        FROM audit_logs
        ${dateFilter}
        GROUP BY action
        ORDER BY count DESC
      `;

      const actionBreakdown = await this.executeQuery(actionQuery, params);

      // Get table breakdown
      const tableQuery = `
        SELECT 
          table_name,
          COUNT(*) as count,
          COUNT(DISTINCT action) as unique_actions
        FROM audit_logs
        ${dateFilter}
        GROUP BY table_name
        ORDER BY count DESC
      `;

      const tableBreakdown = await this.executeQuery(tableQuery, params);

      // Get user activity
      const userQuery = `
        SELECT 
          u.username,
          u.full_name,
          COUNT(*) as activity_count,
          COUNT(DISTINCT al.action) as unique_actions,
          MAX(al.created_at) as last_activity
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        ${dateFilter}
        GROUP BY al.user_id, u.username, u.full_name
        ORDER BY activity_count DESC
        LIMIT 10
      `;

      const userActivity = await this.executeQuery(userQuery, params);

      res.json({
        period: dateFrom && dateTo ? { dateFrom, dateTo } : null,
        statistics: stats[0],
        actionBreakdown,
        tableBreakdown,
        topUsers: userActivity
      });

    } catch (error) {
      console.error('Get audit statistics error:', error);
      res.status(500).json({ error: 'Failed to generate audit statistics' });
    }
  }

  // Get security events
  async getSecurityEvents(req, res) {
    try {
      const {
        page = 1,
        limit = 50,
        eventType,
        dateFrom,
        dateTo,
        severity = 'all'
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);

      let query = `
        SELECT 
          al.*,
          u.username,
          u.full_name
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        WHERE al.action LIKE 'SECURITY_%' OR al.action LIKE 'AUTH_%'
      `;

      const params = [];

      if (eventType) {
        query += ' AND al.action LIKE ?';
        params.push(`%${eventType.toUpperCase()}%`);
      }

      if (dateFrom) {
        query += ' AND DATE(al.created_at) >= ?';
        params.push(dateFrom);
      }

      if (dateTo) {
        query += ' AND DATE(al.created_at) <= ?';
        params.push(dateTo);
      }

      // Filter by severity if specified
      if (severity !== 'all') {
        const severityActions = {
          high: ['SECURITY_BREACH', 'AUTH_FAILED_LOGIN', 'SECURITY_UNAUTHORIZED_ACCESS'],
          medium: ['AUTH_LOGIN', 'AUTH_LOGOUT', 'SECURITY_RATE_LIMIT'],
          low: ['AUTH_TOKEN_REFRESH', 'SECURITY_SESSION_EXPIRED']
        };

        if (severityActions[severity]) {
          query += ` AND al.action IN (${severityActions[severity].map(() => '?').join(',')})`;
          params.push(...severityActions[severity]);
        }
      }

      // Get total count
      const countQuery = query.replace(
        'SELECT al.*, u.username, u.full_name FROM audit_logs al LEFT JOIN users u ON al.user_id = u.id',
        'SELECT COUNT(*) as total FROM audit_logs al LEFT JOIN users u ON al.user_id = u.id'
      );

      const countResult = await this.executeQuery(countQuery, params);
      const total = countResult[0].total;

      // Add pagination
      query += ' ORDER BY al.created_at DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), offset);

      const securityEvents = await this.executeQuery(query, params);

      res.json({
        data: securityEvents,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });

    } catch (error) {
      console.error('Get security events error:', error);
      res.status(500).json({ error: 'Failed to retrieve security events' });
    }
  }

  // Database helper method
  async executeQuery(query, params = []) {
    return new Promise((resolve, reject) => {
      this.auditService.db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }
}

module.exports = AuditController;