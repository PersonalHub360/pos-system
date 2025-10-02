// Authentication utility for handling tokens and API requests

class AuthService {
  constructor() {
    this.token = localStorage.getItem('authToken');
    this.user = JSON.parse(localStorage.getItem('user') || 'null');
  }

  // Store authentication data
  setAuth(token, user) {
    this.token = token;
    this.user = user;
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));
  }

  // Clear authentication data
  clearAuth() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.token;
  }

  // Get current user
  getCurrentUser() {
    return this.user;
  }

  // Get authentication headers
  getAuthHeaders() {
    if (this.token) {
      return {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      };
    }
    return {
      'Content-Type': 'application/json'
    };
  }

  // Make authenticated API request
  async apiRequest(url, options = {}) {
    const headers = {
      ...this.getAuthHeaders(),
      ...options.headers
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    // Handle authentication errors
    if (response.status === 401) {
      this.clearAuth();
      // Redirect to login or show login modal
      console.warn('Authentication required. Please log in.');
      return null;
    }

    return response;
  }

  // Login method
  async login(username, password) {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      if (response.ok) {
        const data = await response.json();
        this.setAuth(data.token, data.user);
        return { success: true, data };
      } else {
        const error = await response.json();
        return { success: false, error: error.error };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  // Logout method
  async logout() {
    try {
      // Call server logout endpoint if authenticated
      if (this.isAuthenticated()) {
        await this.apiRequest('/api/auth/logout', {
          method: 'POST'
        });
      }
      
      // Clear local authentication data
      this.clearAuth();
      
      return { success: true };
    } catch (error) {
      // Even if server call fails, clear local data
      this.clearAuth();
      return { success: true, warning: 'Server logout failed but local data cleared' };
    }
  }

  // Auto-login with demo credentials for development
  async autoLogin() {
    // Try to login with demo credentials if no token exists
    if (!this.isAuthenticated()) {
      const result = await this.login('admin', 'admin123');
      if (!result.success) {
        // Try alternative demo credentials
        const altResult = await this.login('demo', 'demo123');
        return altResult.success;
      }
      return result.success;
    }
    return true;
  }
}

// Create singleton instance
const authService = new AuthService();

export default authService;