// Sales Service - API calls for Sales Management
import authService from '../utils/auth.js';

class SalesService {
  constructor() {
    this.baseURL = 'http://localhost:5000/api';
  }
  // Get all sales with pagination and filtering
  async getAllSales(page = 1, limit = 10, filters = {}) {
    try {
      const queryParams = new URLSearchParams({
        page,
        limit,
        ...filters
      });
      
      const response = await authService.apiRequest(`${this.baseURL}/sales?${queryParams}`);
      return response;
    } catch (error) {
      console.error('Error fetching sales:', error);
      throw error;
    }
  }

  // Get sale by ID
  async getSaleById(id) {
    try {
      const response = await authService.apiRequest(`${this.baseURL}/sales/${id}`);
      return response;
    } catch (error) {
      console.error('Error fetching sale:', error);
      throw error;
    }
  }

  // Create new sale
  async createSale(saleData) {
    try {
      const response = await authService.apiRequest(`${this.baseURL}/sales`, {
        method: 'POST',
        body: JSON.stringify(saleData)
      });
      return response;
    } catch (error) {
      console.error('Error creating sale:', error);
      throw error;
    }
  }

  // Update sale status
  async updateSaleStatus(id, status) {
    try {
      const response = await authService.apiRequest(`${this.baseURL}/sales/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      return response;
    } catch (error) {
      console.error('Error updating sale status:', error);
      throw error;
    }
  }

  // Get all discount plans
  async getDiscountPlans() {
    try {
      const response = await authService.apiRequest(`${this.baseURL}/sales/discount-plans`);
      return response;
    } catch (error) {
      console.error('Error fetching discount plans:', error);
      throw error;
    }
  }

  // Create discount plan
  async createDiscountPlan(planData) {
    try {
      const response = await authService.apiRequest(`${this.baseURL}/sales/discount-plans`, {
        method: 'POST',
        body: JSON.stringify(planData)
      });
      return response;
    } catch (error) {
      console.error('Error creating discount plan:', error);
      throw error;
    }
  }

  // Get sales analytics
  async getSalesAnalytics(period = 'month') {
    try {
      const response = await authService.apiRequest(`${this.baseURL}/sales/analytics?period=${period}`);
      return response;
    } catch (error) {
      console.error('Error fetching sales analytics:', error);
      throw error;
    }
  }

  // Get all products for sale creation
  async getProducts() {
    try {
      const response = await authService.apiRequest(`${this.baseURL}/products`);
      return response;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  // Get all customers
  async getCustomers() {
    try {
      const response = await authService.apiRequest(`${this.baseURL}/customers`);
      return response;
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }
  }

  // Import sales data from file
  async importSalesData(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await authService.apiRequest(`${this.baseURL}/sales/import`, {
        method: 'POST',
        body: formData,
        headers: {} // Let browser set content-type for FormData
      });
      return response;
    } catch (error) {
      console.error('Error importing sales data:', error);
      throw error;
    }
  }

  // Download sales template
  async downloadTemplate() {
    try {
      const response = await authService.apiRequest(`${this.baseURL}/sales/template`);
      
      // Create blob and download
      const blob = new Blob([response], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sales_template.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      return true;
    } catch (error) {
      console.error('Error downloading template:', error);
      throw error;
    }
  }

  // Delete sale
  async deleteSale(id) {
    try {
      const response = await authService.apiRequest(`${this.baseURL}/sales/${id}`, {
        method: 'DELETE'
      });
      return response;
    } catch (error) {
      console.error('Error deleting sale:', error);
      throw error;
    }
  }
}

export default new SalesService();