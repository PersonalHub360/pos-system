import React, { useState, useEffect, useCallback } from 'react';
import './InventoryManage.css';

const InventoryManage = () => {
  // State management
  const [activeSection, setActiveSection] = useState('overview');
  const [inventoryData, setInventoryData] = useState([]);
  const [stockMovements, setStockMovements] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'add', 'edit', 'adjust', 'restock', 'view'
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stockFilter, setStockFilter] = useState('all'); // 'all', 'low', 'out', 'normal'
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  
  // Form states
  const [itemForm, setItemForm] = useState({
    name: '',
    category: '',
    sku: '',
    minStock: '',
    maxStock: '',
    unit: '',
    costPrice: '',
    sellingPrice: '',
    supplierId: '',
    description: ''
  });
  
  const [adjustmentForm, setAdjustmentForm] = useState({
    adjustmentType: 'add', // 'add', 'remove', 'set'
    quantity: '',
    reason: '',
    notes: ''
  });

  // Real-time updates
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  // API functions
  const fetchInventoryData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/inventory');
      if (!response.ok) throw new Error('Failed to fetch inventory');
      const data = await response.json();
      setInventoryData(data.items || []);
    } catch (err) {
      setError('Failed to load inventory: ' + err.message);
      console.error('Error fetching inventory:', err);
      // Fallback to sample data
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
          supplierId: 1,
          lastRestocked: '2024-01-15',
          status: 'In Stock',
          description: 'Premium beef burger patty'
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
          supplierId: 2,
          lastRestocked: '2024-01-10',
          status: 'Low Stock',
          description: 'Fresh chicken wings'
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
          supplierId: 3,
          lastRestocked: '2024-01-05',
          status: 'Out of Stock',
          description: 'Fresh caesar salad mix'
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
          supplierId: 4,
          lastRestocked: '2024-01-18',
          status: 'In Stock',
          description: 'Crispy french fries'
        }
      ];
      setInventoryData(mockData);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStockMovements = useCallback(async () => {
    try {
      const response = await fetch('/api/inventory/movements');
      if (!response.ok) throw new Error('Failed to fetch stock movements');
      const data = await response.json();
      setStockMovements(data.movements || []);
    } catch (err) {
      console.error('Error fetching stock movements:', err);
      // Fallback to sample data
      const mockMovements = [
        {
          id: 1,
          itemId: 4,
          itemName: 'French Fries',
          type: 'restock',
          quantity: 45,
          previousStock: 0,
          newStock: 45,
          reason: 'Weekly restock',
          timestamp: '2024-01-18T10:30:00Z',
          user: 'Admin'
        },
        {
          id: 2,
          itemId: 2,
          itemName: 'Chicken Wings',
          type: 'sale',
          quantity: -10,
          previousStock: 15,
          newStock: 5,
          reason: 'Order #1234',
          timestamp: '2024-01-17T14:20:00Z',
          user: 'POS System'
        }
      ];
      setStockMovements(mockMovements);
    }
  }, []);

  const fetchSuppliers = useCallback(async () => {
    try {
      const response = await fetch('/api/suppliers');
      if (!response.ok) throw new Error('Failed to fetch suppliers');
      const data = await response.json();
      setSuppliers(data.suppliers || []);
    } catch (err) {
      console.error('Error fetching suppliers:', err);
      // Fallback to sample data
      const mockSuppliers = [
        { id: 1, name: 'Fresh Foods Ltd', contact: '+1234567890' },
        { id: 2, name: 'Poultry Express', contact: '+1234567891' },
        { id: 3, name: 'Green Gardens', contact: '+1234567892' },
        { id: 4, name: 'Potato Palace', contact: '+1234567893' }
      ];
      setSuppliers(mockSuppliers);
    }
  }, []);

  // Initialize data on component mount
  useEffect(() => {
    fetchInventoryData();
    fetchStockMovements();
    fetchSuppliers();
  }, [fetchInventoryData, fetchStockMovements, fetchSuppliers]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchInventoryData();
      fetchStockMovements();
      setLastUpdate(new Date());
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, fetchInventoryData, fetchStockMovements]);

  // CRUD operations
  const handleAddItem = async (itemData) => {
    try {
      setLoading(true);
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData)
      });
      
      if (!response.ok) throw new Error('Failed to add item');
      
      await fetchInventoryData();
      setShowModal(false);
      resetForms();
    } catch (err) {
      setError('Failed to add item: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateItem = async (itemId, itemData) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/inventory/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData)
      });
      
      if (!response.ok) throw new Error('Failed to update item');
      
      await fetchInventoryData();
      setShowModal(false);
      resetForms();
    } catch (err) {
      setError('Failed to update item: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStockAdjustment = async (itemId, adjustmentData) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/inventory/${itemId}/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adjustmentData)
      });
      
      if (!response.ok) throw new Error('Failed to adjust stock');
      
      await fetchInventoryData();
      await fetchStockMovements();
      setShowModal(false);
      resetForms();
    } catch (err) {
      setError('Failed to adjust stock: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/inventory/${itemId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete item');
      
      await fetchInventoryData();
    } catch (err) {
      setError('Failed to delete item: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Form handlers
  const resetForms = () => {
    setItemForm({
      name: '',
      category: '',
      sku: '',
      minStock: '',
      maxStock: '',
      unit: '',
      costPrice: '',
      sellingPrice: '',
      supplierId: '',
      description: ''
    });
    setAdjustmentForm({
      adjustmentType: 'add',
      quantity: '',
      reason: '',
      notes: ''
    });
  };

  const handleItemFormChange = (field, value) => {
    setItemForm(prev => ({ ...prev, [field]: value }));
  };

  const handleAdjustmentFormChange = (field, value) => {
    setAdjustmentForm(prev => ({ ...prev, [field]: value }));
  };

  // Modal handlers
  const openModal = (type, item = null) => {
    setModalType(type);
    setSelectedItem(item);
    
    if (type === 'edit' && item) {
      setItemForm({
        name: item.name,
        category: item.category,
        sku: item.sku,
        minStock: item.minStock.toString(),
        maxStock: item.maxStock.toString(),
        unit: item.unit,
        costPrice: item.costPrice.toString(),
        sellingPrice: item.sellingPrice.toString(),
        supplierId: item.supplierId?.toString() || '',
        description: item.description || ''
      });
    }
    
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalType('');
    setSelectedItem(null);
    resetForms();
  };

  // Utility functions
  const categories = ['all', ...new Set(inventoryData.map(item => item.category))];

  const filteredAndSortedData = inventoryData
    .filter(item => {
      const matchesSearch = searchTerm === '' || 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.supplier.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      
      const matchesStockFilter = stockFilter === 'all' || 
        (stockFilter === 'low' && item.currentStock <= item.minStock && item.currentStock > 0) ||
        (stockFilter === 'out' && item.currentStock === 0) ||
        (stockFilter === 'normal' && item.currentStock > item.minStock);
      
      return matchesSearch && matchesCategory && matchesStockFilter;
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

  const getStockStatusColor = (item) => {
    if (item.currentStock === 0) return '#dc3545';
    if (item.currentStock <= item.minStock) return '#ffc107';
    return '#28a745';
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
            <div className="auto-refresh-toggle">
              <label>
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                />
                Auto-refresh
              </label>
              <span className="last-update">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </span>
            </div>
            <button className="btn btn-primary" onClick={() => openModal('add')}>
              ➕ Add Item
            </button>
            <button className="btn btn-secondary" onClick={fetchInventoryData}>
              🔄 Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="error-message">
            <span>⚠️ {error}</span>
            <button onClick={() => setError('')}>✕</button>
          </div>
        )}

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
          <h4>Recent Stock Movements</h4>
          <div className="activity-list">
            {stockMovements.slice(0, 5).map(movement => (
              <div key={movement.id} className="activity-item">
                <div className={`activity-icon ${movement.type}`}>
                  {movement.type === 'restock' ? '📦' : 
                   movement.type === 'sale' ? '🛒' : 
                   movement.type === 'adjustment' ? '⚙️' : '📋'}
                </div>
                <div className="activity-content">
                  <div className="activity-text">
                    {movement.itemName} - {movement.type} 
                    ({movement.quantity > 0 ? '+' : ''}{movement.quantity} units)
                  </div>
                  <div className="activity-time">
                    {new Date(movement.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
            {stockMovements.length === 0 && (
              <div className="no-activities">No recent activities</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderInventoryList = () => {
    return (
      <div className="inventory-list-section">
        <div className="section-header">
          <h3>Inventory Items ({filteredAndSortedData.length})</h3>
          <div className="header-actions">
            <button className="btn btn-primary" onClick={() => openModal('add')}>
              ➕ Add New Item
            </button>
            <button className="btn btn-secondary">
              📥 Import Items
            </button>
            <button className="btn btn-secondary">
              📤 Export Items
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
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="stock-filter"
            >
              <option value="all">All Stock Levels</option>
              <option value="normal">Normal Stock</option>
              <option value="low">Low Stock</option>
              <option value="out">Out of Stock</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="name">Sort by Name</option>
              <option value="category">Sort by Category</option>
              <option value="currentStock">Sort by Stock</option>
              <option value="costPrice">Sort by Cost</option>
              <option value="sellingPrice">Sort by Price</option>
              <option value="lastRestocked">Sort by Last Restocked</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="sort-order-btn"
              title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>

        {loading && (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <span>Loading inventory...</span>
          </div>
        )}

        <div className="inventory-table-container">
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Current Stock</th>
                <th>Min/Max</th>
                <th>Unit</th>
                <th>Cost Price</th>
                <th>Selling Price</th>
                <th>Margin</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedData.map(item => {
                const margin = ((item.sellingPrice - item.costPrice) / item.sellingPrice * 100).toFixed(1);
                const stockPercentage = (item.currentStock / item.maxStock * 100).toFixed(1);
                
                return (
                  <tr key={item.id} className={`inventory-row ${getStockStatus(item)}`}>
                    <td className="item-info">
                      <div className="item-name">{item.name}</div>
                      <div className="item-supplier">{item.supplier}</div>
                    </td>
                    <td className="sku">{item.sku}</td>
                    <td className="category">{item.category}</td>
                    <td className="stock-info">
                      <div className="stock-value">{item.currentStock}</div>
                      <div className="stock-bar">
                        <div 
                          className="stock-fill" 
                          style={{ 
                            width: `${Math.min(stockPercentage, 100)}%`,
                            backgroundColor: getStockStatusColor(item)
                          }}
                        ></div>
                      </div>
                    </td>
                    <td className="min-max">
                      <span className="min-stock">{item.minStock}</span>
                      <span className="separator">/</span>
                      <span className="max-stock">{item.maxStock}</span>
                    </td>
                    <td className="unit">{item.unit}</td>
                    <td className="cost-price">${item.costPrice.toFixed(2)}</td>
                    <td className="selling-price">${item.sellingPrice.toFixed(2)}</td>
                    <td className="margin">{margin}%</td>
                    <td className="status">
                      <span className={`status-badge ${getStockStatus(item)}`}>
                        {getStockStatusText(item)}
                      </span>
                    </td>
                    <td className="actions">
                      <div className="action-buttons">
                        <button
                          className="btn-icon view"
                          onClick={() => openModal('view', item)}
                          title="View Details"
                        >
                          👁️
                        </button>
                        <button
                          className="btn-icon edit"
                          onClick={() => openModal('edit', item)}
                          title="Edit Item"
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-icon adjust"
                          onClick={() => openModal('adjust', item)}
                          title="Adjust Stock"
                        >
                          ⚙️
                        </button>
                        <button
                          className="btn-icon restock"
                          onClick={() => openModal('restock', item)}
                          title="Restock Item"
                        >
                          📦
                        </button>
                        <button
                          className="btn-icon delete"
                          onClick={() => handleDeleteItem(item.id)}
                          title="Delete Item"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredAndSortedData.length === 0 && !loading && (
            <div className="no-items">
              <div className="no-items-icon">📦</div>
              <div className="no-items-text">No inventory items found</div>
              <div className="no-items-subtext">
                {searchTerm || selectedCategory !== 'all' || stockFilter !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'Add your first inventory item to get started'
                }
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Modal rendering functions
  const renderModal = () => {
    if (!showModal) return null;

    return (
      <div className="modal-overlay" onClick={closeModal}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>
              {modalType === 'add' && '➕ Add New Item'}
              {modalType === 'edit' && '✏️ Edit Item'}
              {modalType === 'view' && '👁️ Item Details'}
              {modalType === 'adjust' && '⚙️ Adjust Stock'}
              {modalType === 'restock' && '📦 Restock Item'}
            </h3>
            <button className="modal-close" onClick={closeModal}>✕</button>
          </div>

          <div className="modal-body">
            {(modalType === 'add' || modalType === 'edit') && renderItemForm()}
            {modalType === 'view' && renderItemDetails()}
            {(modalType === 'adjust' || modalType === 'restock') && renderStockAdjustmentForm()}
          </div>
        </div>
      </div>
    );
  };

  const renderItemForm = () => (
    <form onSubmit={(e) => {
      e.preventDefault();
      if (modalType === 'add') {
        handleAddItem(itemForm);
      } else {
        handleUpdateItem(selectedItem.id, itemForm);
      }
    }}>
      <div className="form-grid">
        <div className="form-group">
          <label>Item Name *</label>
          <input
            type="text"
            value={itemForm.name}
            onChange={(e) => handleItemFormChange('name', e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>SKU *</label>
          <input
            type="text"
            value={itemForm.sku}
            onChange={(e) => handleItemFormChange('sku', e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Category *</label>
          <select
            value={itemForm.category}
            onChange={(e) => handleItemFormChange('category', e.target.value)}
            required
          >
            <option value="">Select Category</option>
            <option value="Main Course">Main Course</option>
            <option value="Appetizer">Appetizer</option>
            <option value="Salad">Salad</option>
            <option value="Side Dish">Side Dish</option>
            <option value="Beverage">Beverage</option>
            <option value="Dessert">Dessert</option>
          </select>
        </div>

        <div className="form-group">
          <label>Unit *</label>
          <select
            value={itemForm.unit}
            onChange={(e) => handleItemFormChange('unit', e.target.value)}
            required
          >
            <option value="">Select Unit</option>
            <option value="pieces">Pieces</option>
            <option value="portions">Portions</option>
            <option value="kg">Kilograms</option>
            <option value="liters">Liters</option>
            <option value="boxes">Boxes</option>
          </select>
        </div>

        <div className="form-group">
          <label>Minimum Stock *</label>
          <input
            type="number"
            value={itemForm.minStock}
            onChange={(e) => handleItemFormChange('minStock', e.target.value)}
            min="0"
            required
          />
        </div>

        <div className="form-group">
          <label>Maximum Stock *</label>
          <input
            type="number"
            value={itemForm.maxStock}
            onChange={(e) => handleItemFormChange('maxStock', e.target.value)}
            min="0"
            required
          />
        </div>

        <div className="form-group">
          <label>Cost Price *</label>
          <input
            type="number"
            step="0.01"
            value={itemForm.costPrice}
            onChange={(e) => handleItemFormChange('costPrice', e.target.value)}
            min="0"
            required
          />
        </div>

        <div className="form-group">
          <label>Selling Price *</label>
          <input
            type="number"
            step="0.01"
            value={itemForm.sellingPrice}
            onChange={(e) => handleItemFormChange('sellingPrice', e.target.value)}
            min="0"
            required
          />
        </div>

        <div className="form-group">
          <label>Supplier</label>
          <select
            value={itemForm.supplierId}
            onChange={(e) => handleItemFormChange('supplierId', e.target.value)}
          >
            <option value="">Select Supplier</option>
            {suppliers.map(supplier => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group full-width">
          <label>Description</label>
          <textarea
            value={itemForm.description}
            onChange={(e) => handleItemFormChange('description', e.target.value)}
            rows="3"
          />
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={closeModal}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Saving...' : (modalType === 'add' ? 'Add Item' : 'Update Item')}
        </button>
      </div>
    </form>
  );

  const renderItemDetails = () => (
    <div className="item-details">
      <div className="details-grid">
        <div className="detail-group">
          <label>Item Name</label>
          <div className="detail-value">{selectedItem?.name}</div>
        </div>

        <div className="detail-group">
          <label>SKU</label>
          <div className="detail-value">{selectedItem?.sku}</div>
        </div>

        <div className="detail-group">
          <label>Category</label>
          <div className="detail-value">{selectedItem?.category}</div>
        </div>

        <div className="detail-group">
          <label>Current Stock</label>
          <div className="detail-value">
            {selectedItem?.currentStock} {selectedItem?.unit}
          </div>
        </div>

        <div className="detail-group">
          <label>Stock Range</label>
          <div className="detail-value">
            {selectedItem?.minStock} - {selectedItem?.maxStock} {selectedItem?.unit}
          </div>
        </div>

        <div className="detail-group">
          <label>Cost Price</label>
          <div className="detail-value">${selectedItem?.costPrice?.toFixed(2)}</div>
        </div>

        <div className="detail-group">
          <label>Selling Price</label>
          <div className="detail-value">${selectedItem?.sellingPrice?.toFixed(2)}</div>
        </div>

        <div className="detail-group">
          <label>Profit Margin</label>
          <div className="detail-value">
            {selectedItem && (((selectedItem.sellingPrice - selectedItem.costPrice) / selectedItem.sellingPrice * 100).toFixed(1))}%
          </div>
        </div>

        <div className="detail-group">
          <label>Supplier</label>
          <div className="detail-value">{selectedItem?.supplier}</div>
        </div>

        <div className="detail-group">
          <label>Status</label>
          <div className="detail-value">
            <span className={`status-badge ${getStockStatus(selectedItem)}`}>
              {getStockStatusText(selectedItem)}
            </span>
          </div>
        </div>

        <div className="detail-group">
          <label>Last Restocked</label>
          <div className="detail-value">
            {selectedItem?.lastRestocked ? new Date(selectedItem.lastRestocked).toLocaleDateString() : 'Never'}
          </div>
        </div>

        {selectedItem?.description && (
          <div className="detail-group full-width">
            <label>Description</label>
            <div className="detail-value">{selectedItem.description}</div>
          </div>
        )}
      </div>

      <div className="form-actions">
        <button className="btn btn-secondary" onClick={closeModal}>
          Close
        </button>
        <button className="btn btn-primary" onClick={() => {
          setModalType('edit');
          setItemForm({
            name: selectedItem.name,
            category: selectedItem.category,
            sku: selectedItem.sku,
            minStock: selectedItem.minStock.toString(),
            maxStock: selectedItem.maxStock.toString(),
            unit: selectedItem.unit,
            costPrice: selectedItem.costPrice.toString(),
            sellingPrice: selectedItem.sellingPrice.toString(),
            supplierId: selectedItem.supplierId?.toString() || '',
            description: selectedItem.description || ''
          });
        }}>
          Edit Item
        </button>
      </div>
    </div>
  );

  const renderStockAdjustmentForm = () => (
    <form onSubmit={(e) => {
      e.preventDefault();
      const adjustmentData = {
        ...adjustmentForm,
        quantity: parseInt(adjustmentForm.quantity)
      };
      handleStockAdjustment(selectedItem.id, adjustmentData);
    }}>
      <div className="adjustment-info">
        <h4>{selectedItem?.name}</h4>
        <p>Current Stock: <strong>{selectedItem?.currentStock} {selectedItem?.unit}</strong></p>
        <p>Stock Range: {selectedItem?.minStock} - {selectedItem?.maxStock} {selectedItem?.unit}</p>
      </div>

      <div className="form-group">
        <label>Adjustment Type *</label>
        <select
          value={adjustmentForm.adjustmentType}
          onChange={(e) => handleAdjustmentFormChange('adjustmentType', e.target.value)}
          required
        >
          <option value="add">Add Stock</option>
          <option value="remove">Remove Stock</option>
          <option value="set">Set Stock Level</option>
        </select>
      </div>

      <div className="form-group">
        <label>Quantity *</label>
        <input
          type="number"
          value={adjustmentForm.quantity}
          onChange={(e) => handleAdjustmentFormChange('quantity', e.target.value)}
          min="0"
          required
        />
      </div>

      <div className="form-group">
        <label>Reason *</label>
        <select
          value={adjustmentForm.reason}
          onChange={(e) => handleAdjustmentFormChange('reason', e.target.value)}
          required
        >
          <option value="">Select Reason</option>
          <option value="restock">Restock</option>
          <option value="damaged">Damaged Items</option>
          <option value="expired">Expired Items</option>
          <option value="theft">Theft/Loss</option>
          <option value="correction">Stock Correction</option>
          <option value="return">Return to Supplier</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="form-group">
        <label>Notes</label>
        <textarea
          value={adjustmentForm.notes}
          onChange={(e) => handleAdjustmentFormChange('notes', e.target.value)}
          rows="3"
          placeholder="Additional notes about this adjustment..."
        />
      </div>

      <div className="adjustment-preview">
        <h5>Preview:</h5>
        <p>
          Current: {selectedItem?.currentStock} {selectedItem?.unit} →{' '}
          New: {
            adjustmentForm.adjustmentType === 'add' 
              ? (selectedItem?.currentStock || 0) + parseInt(adjustmentForm.quantity || 0)
              : adjustmentForm.adjustmentType === 'remove'
              ? Math.max(0, (selectedItem?.currentStock || 0) - parseInt(adjustmentForm.quantity || 0))
              : parseInt(adjustmentForm.quantity || 0)
          } {selectedItem?.unit}
        </p>
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={closeModal}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Adjusting...' : 'Apply Adjustment'}
        </button>
      </div>
    </form>
  );

  const renderStockMovements = () => {
    return (
      <div className="stock-movements-section">
        <div className="section-header">
          <h3>Stock Movements</h3>
          <div className="header-actions">
            <button className="btn btn-secondary" onClick={fetchStockMovements}>
              🔄 Refresh
            </button>
          </div>
        </div>
  
        <div className="movements-table-container">
          <table className="movements-table">
            <thead>
              <tr>
                <th>Date/Time</th>
                <th>Item</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Previous Stock</th>
                <th>New Stock</th>
                <th>Reason</th>
                <th>User</th>
              </tr>
            </thead>
            <tbody>
              {stockMovements.map(movement => (
                <tr key={movement.id} className={`movement-row ${movement.type}`}>
                  <td className="timestamp">
                    {new Date(movement.timestamp).toLocaleString()}
                  </td>
                  <td className="item-name">{movement.itemName}</td>
                  <td className="movement-type">
                    <span className={`type-badge ${movement.type}`}>
                      {movement.type === 'restock' ? '📦 Restock' : 
                       movement.type === 'sale' ? '🛒 Sale' : 
                       movement.type === 'adjustment' ? '⚙️ Adjustment' : 
                       '📋 Other'}
                    </span>
                  </td>
                  <td className={`quantity ${movement.quantity > 0 ? 'positive' : 'negative'}`}>
                    {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                  </td>
                  <td className="previous-stock">{movement.previousStock}</td>
                  <td className="new-stock">{movement.newStock}</td>
                  <td className="reason">{movement.reason}</td>
                  <td className="user">{movement.user}</td>
                </tr>
              ))}
            </tbody>
          </table>
  
          {stockMovements.length === 0 && (
            <div className="no-movements">
              <div className="no-movements-icon">📋</div>
              <div className="no-movements-text">No stock movements found</div>
              <div className="no-movements-subtext">
                Stock movements will appear here when inventory changes occur
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="inventory-manage">
      <div className="page-header">
        <h2>📦 Inventory Management</h2>
        <div className="page-actions">
          <div className="section-tabs">
            <button
              className={`tab ${activeSection === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveSection('overview')}
            >
              📊 Overview
            </button>
            <button
              className={`tab ${activeSection === 'inventory' ? 'active' : ''}`}
              onClick={() => setActiveSection('inventory')}
            >
              📦 Inventory
            </button>
            <button
              className={`tab ${activeSection === 'movements' ? 'active' : ''}`}
              onClick={() => setActiveSection('movements')}
            >
              📋 Movements
            </button>
          </div>
        </div>
      </div>

      <div className="page-content">
        {activeSection === 'overview' && renderOverview()}
        {activeSection === 'inventory' && renderInventoryList()}
        {activeSection === 'movements' && renderStockMovements()}
      </div>

      {renderModal()}
    </div>
  );
};

export default InventoryManage;