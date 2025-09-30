const jwt = require('jsonwebtoken');

class AuthMiddleware {
  constructor(db) {
    this.db = db;
    this.JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
  }

  // Verify JWT token
  verifyToken = (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        return res.status(401).json({ error: 'Access token is required' });
      }

      const token = authHeader.split(' ')[1]; // Bearer TOKEN
      
      if (!token) {
        return res.status(401).json({ error: 'Access token is required' });
      }

      const decoded = jwt.verify(token, this.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token has expired' });
      } else if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid token' });
      }
      return res.status(500).json({ error: 'Token verification failed' });
    }
  };

  // Role-based access control
  requireRole = (allowedRoles) => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const userRole = req.user.role;
      
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          required: allowedRoles,
          current: userRole
        });
      }

      next();
    };
  };

  // Permission-based access control
  requirePermission = (requiredPermission) => {
    return async (req, res, next) => {
      try {
        if (!req.user) {
          return res.status(401).json({ error: 'Authentication required' });
        }

        const userId = req.user.id;
        const user = await this.getUserById(userId);

        if (!user) {
          return res.status(401).json({ error: 'User not found' });
        }

        // Check if user is active
        if (user.status !== 'active') {
          return res.status(401).json({ error: 'Account is not active' });
        }

        // Parse user permissions
        const userPermissions = user.permissions ? JSON.parse(user.permissions) : [];
        
        // Check if user has required permission
        if (!userPermissions.includes(requiredPermission)) {
          return res.status(403).json({ 
            error: 'Insufficient permissions',
            required: requiredPermission,
            current: userPermissions
          });
        }

        next();
      } catch (error) {
        console.error('Permission check error:', error);
        res.status(500).json({ error: 'Permission verification failed' });
      }
    };
  };

  // Admin only access
  requireAdmin = (req, res, next) => {
    return this.requireRole(['admin'])(req, res, next);
  };

  // Manager or Admin access
  requireManager = (req, res, next) => {
    return this.requireRole(['admin', 'manager'])(req, res, next);
  };

  // Staff access (cashier, manager, admin)
  requireStaff = (req, res, next) => {
    return this.requireRole(['admin', 'manager', 'cashier'])(req, res, next);
  };

  // Optional authentication (for public endpoints that can benefit from user context)
  optionalAuth = (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        req.user = null;
        return next();
      }

      const token = authHeader.split(' ')[1];
      
      if (!token) {
        req.user = null;
        return next();
      }

      const decoded = jwt.verify(token, this.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      // For optional auth, we don't fail on invalid tokens
      req.user = null;
      next();
    }
  };

  // Rate limiting middleware
  createRateLimit = (windowMs = 15 * 60 * 1000, maxRequests = 100) => {
    const requests = new Map();

    return (req, res, next) => {
      const clientId = req.ip || req.connection.remoteAddress;
      const now = Date.now();
      const windowStart = now - windowMs;

      // Clean old entries
      for (const [key, timestamps] of requests.entries()) {
        const validTimestamps = timestamps.filter(timestamp => timestamp > windowStart);
        if (validTimestamps.length === 0) {
          requests.delete(key);
        } else {
          requests.set(key, validTimestamps);
        }
      }

      // Check current client
      const clientRequests = requests.get(clientId) || [];
      const validRequests = clientRequests.filter(timestamp => timestamp > windowStart);

      if (validRequests.length >= maxRequests) {
        return res.status(429).json({
          error: 'Too many requests',
          retryAfter: Math.ceil((validRequests[0] + windowMs - now) / 1000)
        });
      }

      // Add current request
      validRequests.push(now);
      requests.set(clientId, validRequests);

      next();
    };
  };

  // Audit logging middleware
  auditLog = (action) => {
    return async (req, res, next) => {
      const originalSend = res.send;
      const startTime = Date.now();

      res.send = function(data) {
        const endTime = Date.now();
        const duration = endTime - startTime;

        // Log the action
        const logData = {
          userId: req.user ? req.user.id : null,
          username: req.user ? req.user.username : 'anonymous',
          action,
          method: req.method,
          url: req.originalUrl,
          ip: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
          statusCode: res.statusCode,
          duration,
          timestamp: new Date().toISOString(),
          requestBody: req.method !== 'GET' ? JSON.stringify(req.body) : null
        };

        // Store audit log in database (async, don't wait)
        this.storeAuditLog(logData).catch(console.error);

        originalSend.call(this, data);
      }.bind(this);

      next();
    };
  };

  // Helper methods
  async getUserById(id) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM users WHERE id = ?',
        [id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  async storeAuditLog(logData) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO audit_logs (user_id, username, action, method, url, ip_address, user_agent, 
         status_code, duration_ms, request_body, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          logData.userId,
          logData.username,
          logData.action,
          logData.method,
          logData.url,
          logData.ip,
          logData.userAgent,
          logData.statusCode,
          logData.duration,
          logData.requestBody,
          logData.timestamp
        ],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }
}

module.exports = AuthMiddleware;