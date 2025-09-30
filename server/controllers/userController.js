const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

class UserController {
  constructor(db) {
    this.db = db;
  }

  // Get all users (admin only)
  async getAllUsers(req, res) {
    try {
      const { page = 1, limit = 10, search = '', role = '', status = '' } = req.query;
      const offset = (page - 1) * limit;

      let whereClause = 'WHERE 1=1';
      const params = [];

      if (search) {
        whereClause += ' AND (username LIKE ? OR email LIKE ? OR first_name LIKE ? OR last_name LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }

      if (role) {
        whereClause += ' AND role = ?';
        params.push(role);
      }

      if (status) {
        whereClause += ' AND status = ?';
        params.push(status);
      }

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM users ${whereClause}`;
      const totalResult = await this.executeQuery(countQuery, params);
      const total = totalResult.total;

      // Get users with pagination
      const usersQuery = `
        SELECT id, username, email, first_name, last_name, role, status, 
               permissions, last_login, created_at, updated_at
        FROM users 
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `;
      
      const users = await this.executeQueryAll(usersQuery, [...params, limit, offset]);

      // Parse permissions for each user
      const formattedUsers = users.map(user => ({
        ...user,
        permissions: user.permissions ? JSON.parse(user.permissions) : []
      }));

      res.json({
        users: formattedUsers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get user by ID
  async getUserById(req, res) {
    try {
      const { id } = req.params;
      const user = await this.findUserById(id);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        status: user.status,
        permissions: user.permissions ? JSON.parse(user.permissions) : [],
        lastLogin: user.last_login,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      });
    } catch (error) {
      console.error('Get user by ID error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Create new user (admin only)
  async createUser(req, res) {
    try {
      const { 
        username, 
        email, 
        password, 
        firstName, 
        lastName, 
        role = 'cashier', 
        status = 'active',
        permissions = []
      } = req.body;

      // Validate required fields
      if (!username || !email || !password || !firstName || !lastName) {
        return res.status(400).json({ error: 'All required fields must be provided' });
      }

      // Validate role
      const validRoles = ['admin', 'manager', 'cashier'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: 'Invalid role specified' });
      }

      // Check if user already exists
      const existingUser = await this.findUserByEmailOrUsername(email, username);
      if (existingUser) {
        return res.status(409).json({ error: 'User already exists with this email or username' });
      }

      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Create user
      const userId = await this.insertUser({
        username,
        email,
        passwordHash,
        firstName,
        lastName,
        role,
        status,
        permissions: JSON.stringify(permissions)
      });

      res.status(201).json({
        message: 'User created successfully',
        user: {
          id: userId,
          username,
          email,
          firstName,
          lastName,
          role,
          status,
          permissions
        }
      });
    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Update user (admin only)
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { 
        username, 
        email, 
        firstName, 
        lastName, 
        role, 
        status,
        permissions
      } = req.body;

      // Check if user exists
      const existingUser = await this.findUserById(id);
      if (!existingUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Validate role if provided
      if (role) {
        const validRoles = ['admin', 'manager', 'cashier'];
        if (!validRoles.includes(role)) {
          return res.status(400).json({ error: 'Invalid role specified' });
        }
      }

      // Check if email/username is already taken by another user
      if (email || username) {
        const duplicateUser = await this.findUserByEmailOrUsername(
          email || existingUser.email, 
          username || existingUser.username
        );
        if (duplicateUser && duplicateUser.id !== parseInt(id)) {
          return res.status(409).json({ error: 'Email or username already taken by another user' });
        }
      }

      // Update user
      await this.updateUserById(id, {
        username: username || existingUser.username,
        email: email || existingUser.email,
        firstName: firstName || existingUser.first_name,
        lastName: lastName || existingUser.last_name,
        role: role || existingUser.role,
        status: status || existingUser.status,
        permissions: permissions ? JSON.stringify(permissions) : existingUser.permissions
      });

      res.json({ message: 'User updated successfully' });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Delete user (admin only)
  async deleteUser(req, res) {
    try {
      const { id } = req.params;

      // Check if user exists
      const existingUser = await this.findUserById(id);
      if (!existingUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Prevent deleting the last admin
      if (existingUser.role === 'admin') {
        const adminCount = await this.countUsersByRole('admin');
        if (adminCount <= 1) {
          return res.status(400).json({ error: 'Cannot delete the last admin user' });
        }
      }

      // Soft delete by setting status to 'deleted'
      await this.updateUserById(id, { status: 'deleted' });

      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Reset user password (admin only)
  async resetPassword(req, res) {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;

      if (!newPassword) {
        return res.status(400).json({ error: 'New password is required' });
      }

      // Check if user exists
      const existingUser = await this.findUserById(id);
      if (!existingUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Hash new password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await this.updateUserPassword(id, passwordHash);

      res.json({ message: 'Password reset successfully' });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get user roles and permissions
  async getRolesAndPermissions(req, res) {
    try {
      const roles = [
        {
          name: 'admin',
          displayName: 'Administrator',
          description: 'Full system access',
          permissions: [
            'user_management',
            'product_management',
            'order_management',
            'inventory_management',
            'table_management',
            'reports_access',
            'system_settings'
          ]
        },
        {
          name: 'manager',
          displayName: 'Manager',
          description: 'Management level access',
          permissions: [
            'product_management',
            'order_management',
            'inventory_management',
            'table_management',
            'reports_access'
          ]
        },
        {
          name: 'cashier',
          displayName: 'Cashier',
          description: 'Basic operational access',
          permissions: [
            'order_management',
            'table_management'
          ]
        }
      ];

      const allPermissions = [
        { name: 'user_management', description: 'Manage users and roles' },
        { name: 'product_management', description: 'Manage products and categories' },
        { name: 'order_management', description: 'Process orders and payments' },
        { name: 'inventory_management', description: 'Manage inventory and stock' },
        { name: 'table_management', description: 'Manage tables and reservations' },
        { name: 'reports_access', description: 'Access reports and analytics' },
        { name: 'system_settings', description: 'Configure system settings' }
      ];

      res.json({ roles, permissions: allPermissions });
    } catch (error) {
      console.error('Get roles and permissions error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Helper methods
  async executeQuery(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(query, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  async executeQueryAll(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async findUserById(id) {
    return this.executeQuery('SELECT * FROM users WHERE id = ?', [id]);
  }

  async findUserByEmailOrUsername(email, username) {
    return this.executeQuery(
      'SELECT * FROM users WHERE email = ? OR username = ?',
      [email, username]
    );
  }

  async insertUser(userData) {
    return new Promise((resolve, reject) => {
      const { username, email, passwordHash, firstName, lastName, role, status, permissions } = userData;
      this.db.run(
        `INSERT INTO users (username, email, password_hash, first_name, last_name, role, status, permissions) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [username, email, passwordHash, firstName, lastName, role, status, permissions],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  async updateUserById(id, userData) {
    return new Promise((resolve, reject) => {
      const { username, email, firstName, lastName, role, status, permissions } = userData;
      this.db.run(
        `UPDATE users SET username = ?, email = ?, first_name = ?, last_name = ?, 
         role = ?, status = ?, permissions = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [username, email, firstName, lastName, role, status, permissions, id],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  async updateUserPassword(id, passwordHash) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [passwordHash, id],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  async countUsersByRole(role) {
    const result = await this.executeQuery(
      'SELECT COUNT(*) as count FROM users WHERE role = ? AND status != "deleted"',
      [role]
    );
    return result.count;
  }
}

module.exports = UserController;