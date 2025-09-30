const AuditService = require('../services/auditService');

class AuditMiddleware {
  constructor(db) {
    this.auditService = new AuditService(db);
  }

  // Middleware to log API requests
  logApiRequest() {
    return async (req, res, next) => {
      // Store original end function
      const originalEnd = res.end;
      const startTime = Date.now();

      // Override res.end to capture response
      res.end = function(chunk, encoding) {
        const responseTime = Date.now() - startTime;
        
        // Log API request
        if (req.user) {
          const auditData = {
            table_name: 'api_requests',
            record_id: null,
            action: 'API_REQUEST',
            old_values: null,
            new_values: {
              method: req.method,
              url: req.originalUrl,
              status_code: res.statusCode,
              response_time: responseTime,
              body_size: chunk ? chunk.length : 0
            },
            user_id: req.user.id,
            ip_address: req.ip,
            user_agent: req.get('User-Agent'),
            additional_info: {
              query: req.query,
              params: req.params
            }
          };

          // Don't await to avoid blocking response
          this.auditService.logAuditEvent(auditData).catch(err => {
            console.error('API audit logging error:', err);
          });
        }

        // Call original end function
        originalEnd.call(this, chunk, encoding);
      }.bind(this);

      next();
    };
  }

  // Middleware to wrap database operations
  wrapDatabaseOperations(controller) {
    const auditService = this.auditService;

    return new Proxy(controller, {
      get(target, prop) {
        const originalMethod = target[prop];

        if (typeof originalMethod === 'function') {
          return function(...args) {
            // Check if this is a database operation method
            const dbOperationMethods = [
              'create', 'update', 'delete', 'insert', 'remove',
              'createProduct', 'updateProduct', 'deleteProduct',
              'createOrder', 'updateOrder', 'cancelOrder',
              'createUser', 'updateUser', 'deleteUser',
              'createCategory', 'updateCategory', 'deleteCategory',
              'adjustStock', 'restockItem'
            ];

            if (dbOperationMethods.some(method => prop.toLowerCase().includes(method.toLowerCase()))) {
              return auditService.wrapDatabaseMethod(originalMethod, prop, target, args);
            }

            return originalMethod.apply(target, args);
          };
        }

        return originalMethod;
      }
    });
  }

  // Audit decorator for database methods
  auditDatabaseOperation(tableName, action) {
    return (target, propertyName, descriptor) => {
      const originalMethod = descriptor.value;

      descriptor.value = async function(...args) {
        const req = args.find(arg => arg && arg.user) || {};
        const userId = req.user ? req.user.id : null;
        
        let oldData = null;
        let recordId = null;

        try {
          // For update/delete operations, get old data first
          if (action === 'UPDATE' || action === 'DELETE') {
            const idArg = args.find(arg => typeof arg === 'string' || typeof arg === 'number');
            if (idArg) {
              recordId = idArg;
              // Get old data (this would need to be implemented per controller)
              oldData = await this.getRecordById(tableName, recordId);
            }
          }

          // Execute original method
          const result = await originalMethod.apply(this, args);

          // Extract record ID and new data from result
          if (result && result.id) {
            recordId = result.id;
          }

          // Log the operation
          await this.auditService.logDatabaseOperation(
            tableName,
            recordId,
            action,
            oldData,
            action === 'DELETE' ? null : result,
            userId,
            req
          );

          return result;
        } catch (error) {
          // Log failed operation
          await this.auditService.logAuditEvent({
            table_name: tableName,
            record_id: recordId,
            action: `${action}_FAILED`,
            old_values: oldData,
            new_values: null,
            user_id: userId,
            ip_address: req.ip,
            user_agent: req.get ? req.get('User-Agent') : null,
            additional_info: { error: error.message }
          });

          throw error;
        }
      };

      return descriptor;
    };
  }

  // Middleware for authentication events
  logAuthEvent(action) {
    return async (req, res, next) => {
      const originalJson = res.json;

      res.json = function(data) {
        // Log authentication event
        const success = res.statusCode < 400;
        const userId = data.user ? data.user.id : null;
        const username = req.body.username || req.body.email || 'unknown';

        this.auditService.logAuthEvent(
          action,
          userId,
          username,
          success,
          req,
          { response_data: success ? 'success' : data.error }
        ).catch(err => {
          console.error('Auth audit logging error:', err);
        });

        originalJson.call(this, data);
      }.bind(this);

      next();
    };
  }

  // Middleware for security events
  logSecurityEvent(eventType) {
    return async (req, res, next) => {
      try {
        const userId = req.user ? req.user.id : null;
        
        await this.auditService.logSecurityEvent(
          eventType,
          userId,
          req,
          {
            endpoint: req.originalUrl,
            method: req.method,
            timestamp: new Date().toISOString()
          }
        );
      } catch (error) {
        console.error('Security audit logging error:', error);
      }

      next();
    };
  }

  // Middleware to check data integrity periodically
  scheduleIntegrityChecks() {
    // Run integrity checks every 6 hours
    setInterval(async () => {
      try {
        console.log('Running scheduled data integrity checks...');
        const results = await this.auditService.performIntegrityChecks();
        
        // Log integrity check results
        await this.auditService.logAuditEvent({
          table_name: 'system',
          record_id: null,
          action: 'INTEGRITY_CHECK',
          old_values: null,
          new_values: results,
          user_id: null,
          ip_address: 'system',
          user_agent: 'integrity_checker',
          additional_info: { scheduled: true }
        });

        // Log any failures
        const failures = results.checks.filter(check => check.status === 'FAIL');
        if (failures.length > 0) {
          console.warn(`Data integrity check found ${failures.length} issues:`, failures);
        }

      } catch (error) {
        console.error('Scheduled integrity check error:', error);
      }
    }, 6 * 60 * 60 * 1000); // 6 hours in milliseconds
  }

  // Get audit service instance
  getAuditService() {
    return this.auditService;
  }
}

module.exports = AuditMiddleware;