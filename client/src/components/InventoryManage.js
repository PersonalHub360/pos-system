import React, { useState, useEffect } from 'react';
import './InventoryManage.css';

const InventoryManage = () => {
  const [activeSection, setActiveSection] = useState('overview');
  const [inventoryData, setInventoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  // Mock inventory data
  useEffect(() => {
    const mockData = [
      {
        id: 1,
        name: 'Beef Burger',
        category: 'Main Course',
        sku: 'BB001',
        currentStock: 25,
        minStock: 10,
        maxStock: 100,
        unit: 'pieces',
        costPrice: 8.50,
        sellingPrice: 15.00,
        supplier: 'Fresh Foods Ltd',
        lastRestocked: '2024-01-15',
        status: 'In Stock'
      },
      {
        id: 2,
        name: 'Chicken Wings',
        category: 'Appetizer',
        sku: 'CW002',
        currentStock: 5,
        minStock: 15,
        maxStock: 80,
        unit: 'pieces',
        costPrice: 6.00,
        sellingPrice: 12.00,
        supplier: 'Poultry Express',
        lastRestocked: '2024-01-10',
        status: 'Low Stock'
      },
      {
        id: 3,
        name: 'Caesar Salad',
        category: 'Salad',
        sku: 'CS003',
        currentStock: 0,
        minStock: 8,
        maxStock: 50,
        unit: 'portions',
        costPrice: 4.50,
        sellingPrice: 9.00,
        supplier: 'Green Gardens',
        lastRestocked: '2024-01-05',
        status: 'Out of Stock'
      },
      {
        id: 4,
        name: 'French Fries',
        category: 'Side Dish',
        sku: 'FF004',
        currentStock: 45,
        minStock: 20,
        maxStock: 120,
        unit: 'portions',
        costPrice: 2.00,
        sellingPrice: 5.00,
        supplier: 'Potato Palace',
        lastRestocked: '2024-01-18',
        status: 'In Stock'
      }
    ];
    
    setTimeout(() => {
      setInventoryData(mockData);
      setLoading(false);
    }, 1000);
  }, []);

  const categories = ['all', ...new Set(inventoryData.map(item => item.category))];

  const filteredAndSortedData = inventoryData
    .filter(item => {
      const matchesSearch = searchTerm === '' || 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.supplier.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const getStockStatus = (item) => {
    if (item.currentStock === 0) return 'out-of-stock';
    if (item.currentStock <= item.minStock) return 'low-stock';
    return 'in-stock';
  };

  const getStockStatusText = (item) => {
    if (item.currentStock === 0) return 'Out of Stock';
    if (item.currentStock <= item.minStock) return 'Low Stock';
    return 'In Stock';
  };

  const renderOverview = () => {
    const totalItems = inventoryData.length;
    const inStock = inventoryData.filter(item => item.currentStock > item.minStock).length;
    const lowStock = inventoryData.filter(item => item.currentStock <= item.minStock && item.currentStock > 0).length;
    const outOfStock = inventoryData.filter(item => item.currentStock === 0).length;
    const totalValue = inventoryData.reduce((sum, item) => sum + (item.currentStock * item.costPrice), 0);

    return (
      <div className="overview-section">
        <div className="overview-header">
          <h3>Inventory Overview</h3>
          <div className="overview-actions">
            <button className="btn btn-primary">
              📊 Generate Report
            </button>
            <button className="btn btn-secondary">
              📤 Export Data
            </button>
          </div>
        </div>

        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-icon">📦</div>
            <div className="metric-content">
              <div className="metric-value">{totalItems}</div>
              <div className="metric-label">Total Items</div>
            </div>
          </div>
          
          <div className="metric-card in-stock">
            <div className="metric-icon">✅</div>
            <div className="metric-content">
              <div className="metric-value">{inStock}</div>
              <div className="metric-label">In Stock</div>
            </div>
          </div>
          
          <div className="metric-card low-stock">
            <div className="metric-icon">⚠️</div>
            <div className="metric-content">
              <div className="metric-value">{lowStock}</div>
              <div className="metric-label">Low Stock</div>
            </div>
          </div>
          
          <div className="metric-card out-of-stock">
            <div className="metric-icon">❌</div>
            <div className="metric-content">
              <div className="metric-value">{outOfStock}</div>
              <div className="metric-label">Out of Stock</div>
            </div>
          </div>
          
          <div className="metric-card total-value">
            <div className="metric-icon">💰</div>
            <div className="metric-content">
              <div className="metric-value">${totalValue.toFixed(2)}</div>
              <div className="metric-label">Total Value</div>
            </div>
          </div>
        </div>

        <div className="recent-activities">
          <h4>Recent Activities</h4>
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-icon">📦</div>
              <div className="activity-content">
                <div className="activity-text">French Fries restocked - 45 units added</div>
                <div className="activity-time">2 hours ago</div>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">⚠️</div>
              <div className="activity-content">
                <div className="activity-text">Chicken Wings below minimum stock level</div>
                <div className="activity-time">4 hours ago</div>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">❌</div>
              <div className="activity-content">
                <div className="activity-text">Caesar Salad out of stock</div>
                <div className="activity-time">1 day ago</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderInventoryList = () => {
    return (
      <div className="inventory-list-section">
        <div className="section-header">
          <h3>Inventory Items</h3>
          <div className="header-actions">
            <button className="btn btn-primary">
              ➕ Add New Item
            </button>
            <button className="btn btn-secondary">
              📥 Import Items
            </button>
          </div>
        </div>

        <div className="filters-section">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search by name, SKU, or supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>

          <div className="filter-controls">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="category-filter"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>

            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order);
              }}
              className="sort-filter"
            >
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="currentStock-asc">Stock (Low to High)</option>
              <option value="currentStock-desc">Stock (High to Low)</option>
              <option value="lastRestocked-desc">Recently Restocked</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading inventory data...</p>
          </div>
        ) : (
          <div className="inventory-table-container">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>Item Details</th>
                  <th>Category</th>
                  <th>Stock Level</th>
                  <th>Pricing</th>
                  <th>Supplier</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedData.map(item => (
                  <tr key={item.id}>
                    <td>
                      <div className="item-details">
                        <div className="item-name">{item.name}</div>
                        <div className="item-sku">SKU: {item.sku}</div>
                      </div>
                    </td>
                    <td>
                      <span className="category-badge">{item.category}</span>
                    </td>
                    <td>
                      <div className="stock-info">
                        <div className="current-stock">{item.currentStock} {item.unit}</div>
                        <div className="stock-range">Min: {item.minStock} | Max: {item.maxStock}</div>
                      </div>
                    </td>
                    <td>
                      <div className="pricing-info">
                        <div className="cost-price">Cost: ${item.costPrice}</div>
                        <div className="selling-price">Sell: ${item.sellingPrice}</div>
                      </div>
                    </td>
                    <td>
                      <div className="supplier-info">
                        <div className="supplier-name">{item.supplier}</div>
                        <div className="last-restocked">Last: {item.lastRestocked}</div>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${getStockStatus(item)}`}>
                        {getStockStatusText(item)}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-icon" title="Edit">✏️</button>
                        <button className="btn-icon" title="Restock">📦</button>
                        <button className="btn-icon" title="Delete">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredAndSortedData.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">📦</div>
                <h3>No items found</h3>
                <p>Try adjusting your search or filter criteria</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderAlerts = () => {
    const lowStockItems = inventoryData.filter(item => item.currentStock <= item.minStock && item.currentStock > 0);
    const outOfStockItems = inventoryData.filter(item => item.currentStock === 0);

    return (
      <div className="alerts-section">
        <div className="section-header">
          <h3>Stock Alerts</h3>
          <div className="alert-summary">
            <span className="alert-count low-stock">{lowStockItems.length} Low Stock</span>
            <span className="alert-count out-of-stock">{outOfStockItems.length} Out of Stock</span>
          </div>
        </div>

        <div className="alerts-container">
          {outOfStockItems.length > 0 && (
            <div className="alert-group">
              <h4 className="alert-group-title out-of-stock">❌ Out of Stock Items</h4>
              {outOfStockItems.map(item => (
                <div key={item.id} className="alert-item out-of-stock">
                  <div className="alert-content">
                    <div className="alert-item-name">{item.name}</div>
                    <div className="alert-item-details">SKU: {item.sku} | Last restocked: {item.lastRestocked}</div>
                  </div>
                  <div className="alert-actions">
                    <button className="btn btn-primary btn-sm">Restock Now</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {lowStockItems.length > 0 && (
            <div className="alert-group">
              <h4 className="alert-group-title low-stock">⚠️ Low Stock Items</h4>
              {lowStockItems.map(item => (
                <div key={item.id} className="alert-item low-stock">
                  <div className="alert-content">
                    <div className="alert-item-name">{item.name}</div>
                    <div className="alert-item-details">
                      Current: {item.currentStock} {item.unit} | Minimum: {item.minStock} {item.unit}
                    </div>
                  </div>
                  <div className="alert-actions">
                    <button className="btn btn-secondary btn-sm">Restock</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {lowStockItems.length === 0 && outOfStockItems.length === 0 && (
            <div className="no-alerts">
              <div className="no-alerts-icon">✅</div>
              <h3>All Good!</h3>
              <p>No stock alerts at the moment. All items are adequately stocked.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="inventory-manage">
      <div className="inventory-manage-header">
        <h2>Inventory Management</h2>
        <div className="section-nav">
          <button
            className={`nav-btn ${activeSection === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveSection('overview')}
          >
            📊 Overview
          </button>
          <button
            className={`nav-btn ${activeSection === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveSection('inventory')}
          >
            📦 Inventory
          </button>
          <button
            className={`nav-btn ${activeSection === 'alerts' ? 'active' : ''}`}
            onClick={() => setActiveSection('alerts')}
          >
            🚨 Alerts
          </button>
        </div>
      </div>

      <div className="inventory-manage-content">
        {activeSection === 'overview' && renderOverview()}
        {activeSection === 'inventory' && renderInventoryList()}
        {activeSection === 'alerts' && renderAlerts()}
      </div>
    </div>
  );
};

export default InventoryManage;