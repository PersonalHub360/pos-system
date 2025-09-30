import React, { useState } from 'react';
import './StoreManagement.css';

const StoreManagement = () => {
  const [activeSection, setActiveSection] = useState('inventory');
  
  // Add Product Modal State
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: '',
    sku: '',
    price: '',
    stock: '',
    incoming: '',
    status: 'In Stock',
    image: null,
    imagePreview: null
  });
  
  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('12 Sep - 28 Oct 2024');
  const [amountStatusFilter, setAmountStatusFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [filteredInventoryData, setFilteredInventoryData] = useState([]);
  
  // Selected products state for bulk actions
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // Store settings state
  const [storeSettings, setStoreSettings] = useState({
    storeName: "Bond POS Store",
    storeId: "ST001",
    location: "Downtown Plaza",
    manager: "John Smith",
    phone: "+1 (555) 123-4567",
    email: "store@bondpos.com",
    address: "123 Main Street, Downtown Plaza",
    city: "New York",
    state: "NY",
    zipCode: "10001",
    operatingHours: {
      monday: { open: "09:00", close: "22:00", closed: false },
      tuesday: { open: "09:00", close: "22:00", closed: false },
      wednesday: { open: "09:00", close: "22:00", closed: false },
      thursday: { open: "09:00", close: "22:00", closed: false },
      friday: { open: "09:00", close: "23:00", closed: false },
      saturday: { open: "10:00", close: "23:00", closed: false },
      sunday: { open: "11:00", close: "21:00", closed: false }
    },
    notifications: {
      emailAlerts: true,
      smsAlerts: false,
      lowStockAlerts: true,
      dailyReports: true,
      weeklyReports: true
    },
    paymentMethods: {
      cash: true,
      creditCard: true,
      debitCard: true,
      digitalWallet: true,
      giftCards: false,
      layaway: false
    }
  });

  // Inventory data state
  const [inventoryData, setInventoryData] = useState([
    {
      id: 1,
      name: "FreshMate",
      category: "Electronics",
      sku: "AF234647",
      incoming: 478,
      stock: 595,
      status: "In Stock",
      price: 43.47,
      image: "📱"
    },
    {
      id: 2,
      name: "FusionLink",
      category: "Electronics", 
      sku: "AF234622",
      incoming: 416,
      stock: 761,
      status: "In Stock",
      price: 55.47,
      image: "🔗"
    },
    {
      id: 3,
      name: "VersaAura",
      category: "Apparel",
      sku: "AF234655",
      incoming: 471,
      stock: 765,
      status: "Out of Stock",
      price: 39.47,
      image: "👕"
    },
    {
      id: 4,
      name: "UrbanFlow Sneakers",
      category: "Apparel",
      sku: "AF234653",
      incoming: 178,
      stock: 965,
      status: "Low Stock",
      price: 89.47,
      image: "👟"
    },
    {
      id: 5,
      name: "SixSage Wrap",
      category: "Wellness",
      sku: "AF234669",
      incoming: 473,
      stock: 165,
      status: "In Stock",
      price: 41.47,
      image: "🧘"
    },
    {
      id: 6,
      name: "CasaLuxe",
      category: "Home & Living",
      sku: "AF234633",
      incoming: 168,
      stock: 575,
      status: "Low Stock",
      price: 53.47,
      image: "🏠"
    }
  ]);

  // Initialize filtered data
  React.useEffect(() => {
    setFilteredInventoryData(inventoryData);
  }, [inventoryData]);

  // Handler functions
  // Checkbox handling functions
  const handleSelectAll = (checked) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedProducts(filteredInventoryData.map(item => item.id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleSelectProduct = (productId, checked) => {
    if (checked) {
      setSelectedProducts([...selectedProducts, productId]);
    } else {
      setSelectedProducts(selectedProducts.filter(id => id !== productId));
      setSelectAll(false);
    }
  };

  // Update selectAll state when individual items are selected
  React.useEffect(() => {
    if (filteredInventoryData.length > 0) {
      setSelectAll(selectedProducts.length === filteredInventoryData.length);
    }
  }, [selectedProducts, filteredInventoryData]);

  // Bulk action handlers
  const handleBulkDelete = () => {
    if (selectedProducts.length === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedProducts.length} selected products?`)) {
      setInventoryData(inventoryData.filter(item => !selectedProducts.includes(item.id)));
      setSelectedProducts([]);
      setSelectAll(false);
    }
  };

  const handleBulkExport = () => {
    if (selectedProducts.length === 0) return;
    
    const selectedItems = inventoryData.filter(item => selectedProducts.includes(item.id));
    console.log('Exporting selected products:', selectedItems);
    // TODO: Implement actual export functionality
    alert(`Exporting ${selectedProducts.length} selected products...`);
  };

  const handleAddProduct = (e) => {
    e.preventDefault();
    
    // Generate new ID
    const newId = Math.max(...inventoryData.map(item => item.id)) + 1;
    
    // Create new product object
    const productToAdd = {
      id: newId,
      name: newProduct.name,
      category: newProduct.category,
      sku: newProduct.sku || `AF${Math.random().toString().substr(2, 6)}`,
      incoming: parseInt(newProduct.incoming) || 0,
      stock: parseInt(newProduct.stock) || 0,
      status: newProduct.status,
      price: parseFloat(newProduct.price) || 0,
      image: newProduct.imagePreview || "📦"
    };
    
    // Add to inventory
    setInventoryData([...inventoryData, productToAdd]);
    
    // Reset form and close modal
    setNewProduct({
      name: '',
      category: '',
      sku: '',
      price: '',
      stock: '',
      incoming: '',
      status: 'In Stock',
      image: null,
      imagePreview: null
    });
    setShowAddProductModal(false);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setNewProduct({
          ...newProduct,
          image: file,
          imagePreview: e.target.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    filterInventoryData(term, statusFilter, amountStatusFilter);
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    filterInventoryData(searchTerm, status, amountStatusFilter);
  };

  const handleAmountStatusFilter = (amountStatus) => {
    setAmountStatusFilter(amountStatus);
    filterInventoryData(searchTerm, statusFilter, amountStatus);
  };

  const filterInventoryData = (search, status, amountStatus) => {
    let filtered = inventoryData;

    // Search filter
    if (search) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.category.toLowerCase().includes(search.toLowerCase()) ||
        item.sku.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Status filter
    if (status && status !== '') {
      filtered = filtered.filter(item => item.status === status);
    }

    // Amount status filter (based on stock levels)
    if (amountStatus && amountStatus !== '') {
      if (amountStatus === 'High Stock') {
        filtered = filtered.filter(item => item.stock > 500);
      } else if (amountStatus === 'Medium Stock') {
        filtered = filtered.filter(item => item.stock >= 100 && item.stock <= 500);
      } else if (amountStatus === 'Low Stock') {
        filtered = filtered.filter(item => item.stock < 100);
      }
    }

    setFilteredInventoryData(filtered);
  };

  const handleProductAction = (productId, action) => {
    if (action === 'edit') {
      const productToEdit = inventoryData.find(item => item.id === productId);
      if (productToEdit) {
        setEditingProduct(productToEdit);
        setNewProduct({
          name: productToEdit.name,
          category: productToEdit.category,
          sku: productToEdit.sku,
          price: productToEdit.price.toString(),
          stock: productToEdit.stock.toString(),
          incoming: productToEdit.incoming.toString(),
          status: productToEdit.status,
          image: null,
          imagePreview: typeof productToEdit.image === 'string' && productToEdit.image.startsWith('data:') 
            ? productToEdit.image 
            : null
        });
        setShowEditProductModal(true);
      }
    } else if (action === 'delete') {
      if (window.confirm('Are you sure you want to delete this product?')) {
        setInventoryData(inventoryData.filter(item => item.id !== productId));
      }
    }
  };

  const handleEditProduct = (e) => {
    e.preventDefault();
    
    if (!editingProduct) return;
    
    // Update the product in inventory
    const updatedProduct = {
      ...editingProduct,
      name: newProduct.name,
      category: newProduct.category,
      sku: newProduct.sku,
      price: parseFloat(newProduct.price) || 0,
      stock: parseInt(newProduct.stock) || 0,
      incoming: parseInt(newProduct.incoming) || 0,
      status: newProduct.status,
      image: newProduct.imagePreview || editingProduct.image
    };
    
    setInventoryData(inventoryData.map(item => 
      item.id === editingProduct.id ? updatedProduct : item
    ));
    
    // Reset form and close modal
    setNewProduct({
      name: '',
      category: '',
      sku: '',
      price: '',
      stock: '',
      incoming: '',
      status: 'In Stock',
      image: null,
      imagePreview: null
    });
    setEditingProduct(null);
    setShowEditProductModal(false);
  };

  const handleImportExport = (action) => {
    if (action === 'import') {
      // Create a file input element
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.csv,.xlsx,.xls';
      fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          handleImportFile(file);
        }
      };
      fileInput.click();
    } else if (action === 'export') {
      handleExportProducts();
    }
  };

  const handleImportFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      try {
        // Parse CSV data
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        // Expected headers: name, category, sku, price, stock, status
        const requiredHeaders = ['name', 'category', 'price', 'stock'];
        const hasRequiredHeaders = requiredHeaders.every(header => 
          headers.some(h => h.includes(header))
        );
        
        if (!hasRequiredHeaders) {
          alert('Invalid CSV format. Required columns: Name, Category, Price, Stock');
          return;
        }
        
        const importedProducts = [];
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line) {
            const values = line.split(',').map(v => v.trim());
            const product = {};
            
            headers.forEach((header, index) => {
              if (header.includes('name')) product.name = values[index] || '';
              else if (header.includes('category')) product.category = values[index] || 'General';
              else if (header.includes('sku')) product.sku = values[index] || `AF${Math.random().toString().substr(2, 6)}`;
              else if (header.includes('price')) product.price = parseFloat(values[index]) || 0;
              else if (header.includes('stock')) product.stock = parseInt(values[index]) || 0;
              else if (header.includes('status')) product.status = values[index] || 'In Stock';
            });
            
            if (product.name && product.category) {
              product.id = Math.max(...inventoryData.map(item => item.id), 0) + importedProducts.length + 1;
              product.incoming = 0;
              product.image = "📦";
              product.sku = product.sku || `AF${Math.random().toString().substr(2, 6)}`;
              product.status = product.status || (product.stock > 0 ? 'In Stock' : 'Out of Stock');
              importedProducts.push(product);
            }
          }
        }
        
        if (importedProducts.length > 0) {
          setInventoryData([...inventoryData, ...importedProducts]);
          alert(`Successfully imported ${importedProducts.length} products!`);
        } else {
          alert('No valid products found in the file.');
        }
      } catch (error) {
        console.error('Import error:', error);
        alert('Error importing file. Please check the format and try again.');
      }
    };
    reader.readAsText(file);
  };

  const handleExportProducts = () => {
    const dataToExport = selectedProducts.length > 0 
      ? inventoryData.filter(item => selectedProducts.includes(item.id))
      : inventoryData;
    
    if (dataToExport.length === 0) {
      alert('No products to export.');
      return;
    }
    
    // Create CSV content
    const headers = ['Name', 'Category', 'SKU', 'Price', 'Stock', 'Incoming', 'Status'];
    const csvContent = [
      headers.join(','),
      ...dataToExport.map(item => [
        `"${item.name}"`,
        `"${item.category}"`,
        item.sku,
        item.price,
        item.stock,
        item.incoming,
        `"${item.status}"`
      ].join(','))
    ].join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `inventory_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert(`Successfully exported ${dataToExport.length} products!`);
  };

  // Sample store data
  const storeData = {
    storeName: storeSettings.storeName,
    storeId: storeSettings.storeId,
    location: storeSettings.location,
    manager: storeSettings.manager,
    employees: 12,
    operatingHours: "9:00 AM - 10:00 PM",
    status: "Active"
  };

  // Sample metrics for dashboard
  const dashboardMetrics = {
    totalSales: 45230.50,
    todaySales: 2340.75,
    totalOrders: 1250,
    todayOrders: 45,
    totalProducts: inventoryData.length,
    lowStockItems: inventoryData.filter(item => item.status === "Low Stock").length,
    avgOrderValue: 36.18,
    customerSatisfaction: 4.7,
    totalAssetValue: inventoryData.reduce((sum, item) => sum + (item.price * item.stock), 0)
  };

  const renderDashboard = () => (
    <div className="store-dashboard">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h3>🏬 Store Dashboard</h3>
          <p>Monitor your store performance and key metrics</p>
        </div>
        <div className="store-info-card">
          <div className="store-details">
            <h4>{storeData.storeName}</h4>
            <p>ID: {storeData.storeId} | {storeData.location}</p>
            <span className={`status-badge ${storeData.status.toLowerCase()}`}>
              {storeData.status}
            </span>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="metrics-grid">
        <div className="metric-card primary">
          <div className="metric-icon">💰</div>
          <div className="metric-content">
            <div className="metric-value">${dashboardMetrics.totalSales.toLocaleString()}</div>
            <div className="metric-label">Total Sales</div>
            <div className="metric-trend positive">+12% this month</div>
          </div>
        </div>

        <div className="metric-card success">
          <div className="metric-icon">📊</div>
          <div className="metric-content">
            <div className="metric-value">${dashboardMetrics.todaySales.toLocaleString()}</div>
            <div className="metric-label">Today's Sales</div>
            <div className="metric-trend positive">+8% vs yesterday</div>
          </div>
        </div>

        <div className="metric-card info">
          <div className="metric-icon">🛒</div>
          <div className="metric-content">
            <div className="metric-value">{dashboardMetrics.totalOrders}</div>
            <div className="metric-label">Total Orders</div>
            <div className="metric-trend positive">+15% this week</div>
          </div>
        </div>

        <div className="metric-card warning">
          <div className="metric-icon">📦</div>
          <div className="metric-content">
            <div className="metric-value">{dashboardMetrics.todayOrders}</div>
            <div className="metric-label">Today's Orders</div>
            <div className="metric-trend neutral">Normal activity</div>
          </div>
        </div>

        <div className="metric-card secondary">
          <div className="metric-icon">📦</div>
          <div className="metric-content">
            <div className="metric-value">{dashboardMetrics.totalProducts}</div>
            <div className="metric-label">Total Products</div>
            <div className="metric-trend positive">Inventory managed</div>
          </div>
        </div>

        <div className="metric-card danger">
          <div className="metric-icon">⚠️</div>
          <div className="metric-content">
            <div className="metric-value">{dashboardMetrics.lowStockItems}</div>
            <div className="metric-label">Low Stock Items</div>
            <div className="metric-trend warning">Needs attention</div>
          </div>
        </div>
      </div>

      {/* Quick Insights */}
      <div className="insights-section">
        <h4>📈 Store Insights</h4>
        <div className="insights-grid">
          <div className="insight-card">
            <div className="insight-icon">💰</div>
            <div className="insight-content">
              <h5>Total Asset Value</h5>
              <p>${dashboardMetrics.totalAssetValue.toLocaleString()}</p>
            </div>
          </div>
          <div className="insight-card">
            <div className="insight-icon">⏰</div>
            <div className="insight-content">
              <h5>Operating Hours</h5>
              <p>{storeData.operatingHours}</p>
            </div>
          </div>
          <div className="insight-card">
            <div className="insight-icon">👨‍💼</div>
            <div className="insight-content">
              <h5>Store Manager</h5>
              <p>{storeData.manager}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Store Operations */}
      <div className="operations-section">
        <h4>🔧 Quick Operations</h4>
        <div className="operations-grid">
          <button className="operation-btn primary" onClick={() => setActiveSection('staff')}>
            <span className="op-icon">📦</span>
            <div className="op-content">
              <h5>Inventory Management</h5>
              <p>Manage products and stock</p>
            </div>
          </button>
          <button className="operation-btn secondary">
            <span className="op-icon">📊</span>
            <div className="op-content">
              <h5>Sales Reports</h5>
              <p>View sales analytics</p>
            </div>
          </button>
          <button className="operation-btn success">
            <span className="op-icon">🛒</span>
            <div className="op-content">
              <h5>Order Management</h5>
              <p>Process and track orders</p>
            </div>
          </button>
          <button className="operation-btn warning">
            <span className="op-icon">🔔</span>
            <div className="op-content">
              <h5>Notifications</h5>
              <p>Manage alerts and updates</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );

  const handleSettingsChange = (section, field, value) => {
    setStoreSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleBasicInfoChange = (field, value) => {
    setStoreSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const renderStoreSettings = () => (
    <div className="store-settings">
      <div className="settings-header">
        <h3>⚙️ Store Settings</h3>
        <p>Configure your store information and preferences</p>
      </div>

      {/* Store Information */}
      <div className="settings-section">
        <h4>🏬 Store Information</h4>
        <div className="settings-grid">
          <div className="form-group">
            <label>Store Name</label>
            <input
              type="text"
              value={storeSettings.storeName}
              onChange={(e) => handleBasicInfoChange('storeName', e.target.value)}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label>Store ID</label>
            <input
              type="text"
              value={storeSettings.storeId}
              onChange={(e) => handleBasicInfoChange('storeId', e.target.value)}
              className="form-input"
              disabled
            />
          </div>
          <div className="form-group">
            <label>Location</label>
            <input
              type="text"
              value={storeSettings.location}
              onChange={(e) => handleBasicInfoChange('location', e.target.value)}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label>Manager</label>
            <input
              type="text"
              value={storeSettings.manager}
              onChange={(e) => handleBasicInfoChange('manager', e.target.value)}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input
              type="tel"
              value={storeSettings.phone}
              onChange={(e) => handleBasicInfoChange('phone', e.target.value)}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={storeSettings.email}
              onChange={(e) => handleBasicInfoChange('email', e.target.value)}
              className="form-input"
            />
          </div>
          <div className="form-group full-width">
            <label>Address</label>
            <input
              type="text"
              value={storeSettings.address}
              onChange={(e) => handleBasicInfoChange('address', e.target.value)}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label>City</label>
            <input
              type="text"
              value={storeSettings.city}
              onChange={(e) => handleBasicInfoChange('city', e.target.value)}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label>State</label>
            <input
              type="text"
              value={storeSettings.state}
              onChange={(e) => handleBasicInfoChange('state', e.target.value)}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label>ZIP Code</label>
            <input
              type="text"
              value={storeSettings.zipCode}
              onChange={(e) => handleBasicInfoChange('zipCode', e.target.value)}
              className="form-input"
            />
          </div>
        </div>
      </div>

      {/* Operating Hours */}
      <div className="settings-section">
        <h4>⏰ Operating Hours</h4>
        <div className="hours-grid">
          {Object.entries(storeSettings.operatingHours).map(([day, hours]) => (
            <div key={day} className="day-hours">
              <div className="day-name">
                {day.charAt(0).toUpperCase() + day.slice(1)}
              </div>
              <div className="hours-controls">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={!hours.closed}
                    onChange={(e) => handleSettingsChange('operatingHours', day, {
                      ...hours,
                      closed: !e.target.checked
                    })}
                  />
                  Open
                </label>
                {!hours.closed && (
                  <>
                    <input
                      type="time"
                      value={hours.open}
                      onChange={(e) => handleSettingsChange('operatingHours', day, {
                        ...hours,
                        open: e.target.value
                      })}
                      className="time-input"
                    />
                    <span>to</span>
                    <input
                      type="time"
                      value={hours.close}
                      onChange={(e) => handleSettingsChange('operatingHours', day, {
                        ...hours,
                        close: e.target.value
                      })}
                      className="time-input"
                    />
                  </>
                )}
                {hours.closed && <span className="closed-text">Closed</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="settings-section">
        <h4>🔔 Notification Preferences</h4>
        <div className="preferences-grid">
          {Object.entries(storeSettings.notifications).map(([key, value]) => (
            <div key={key} className="preference-item">
              <label className="switch-label">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => handleSettingsChange('notifications', key, e.target.checked)}
                  className="switch-input"
                />
                <span className="switch-slider"></span>
                <span className="switch-text">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </span>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Methods */}
      <div className="settings-section">
        <h4>💳 Payment Methods</h4>
        <div className="preferences-grid">
          {Object.entries(storeSettings.paymentMethods).map(([key, value]) => (
            <div key={key} className="preference-item">
              <label className="switch-label">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => handleSettingsChange('paymentMethods', key, e.target.checked)}
                  className="switch-input"
                />
                <span className="switch-slider"></span>
                <span className="switch-text">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </span>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="settings-actions">
        <button className="save-btn primary">
          💾 Save Settings
        </button>
        <button className="reset-btn secondary">
          🔄 Reset to Default
        </button>
      </div>
    </div>
  );

  const renderInventoryManagement = () => {
    const totalAssetValue = inventoryData.reduce((sum, item) => sum + (item.price * item.stock), 0);
    const totalProducts = inventoryData.length;
    const lowStockItems = inventoryData.filter(item => item.status === "Low Stock").length;
    const outOfStockItems = inventoryData.filter(item => item.status === "Out of Stock").length;

    return (
      <div className="inventory-management">
        {/* Inventory Header */}
        <div className="inventory-header">
          <div className="inventory-title">
            <h3>📦 Inventory</h3>
            <div className="inventory-stats">
              <div className="stat-item">
                <span className="stat-label">Total Asset Value</span>
                <span className="stat-value">${totalAssetValue.toLocaleString()}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">{totalProducts} Product</span>
              </div>
            </div>
          </div>
          <div className="inventory-actions">
            {selectedProducts.length > 0 && (
              <div className="bulk-actions">
                <span className="selected-count">{selectedProducts.length} selected</span>
                <button 
                  className="action-btn danger"
                  onClick={handleBulkDelete}
                  title="Delete selected products"
                >
                  🗑️ Delete Selected
                </button>
                <button 
                  className="action-btn secondary"
                  onClick={handleBulkExport}
                  title="Export selected products"
                >
                  📥 Export Selected
                </button>
              </div>
            )}
            <button 
              className="action-btn secondary"
              onClick={() => handleImportExport('import')}
            >
              📤 Import
            </button>
            <button 
              className="action-btn secondary"
              onClick={() => handleImportExport('export')}
            >
              📥 Export
            </button>
            <button 
              className="action-btn primary"
              onClick={() => setShowAddProductModal(true)}
            >
              ➕ Add Product
            </button>
          </div>
        </div>

        {/* Inventory Stats Bar */}
        <div className="inventory-stats-bar">
          <div className="stats-item">
            <span className="stats-count">{inventoryData.filter(item => item.status === "In Stock").length}</span>
            <span className="stats-label">In stock</span>
          </div>
          <div className="stats-item">
            <span className="stats-count">{lowStockItems}</span>
            <span className="stats-label">Low stock</span>
          </div>
          <div className="stats-item">
            <span className="stats-count">{outOfStockItems}</span>
            <span className="stats-label">Out of stock</span>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="inventory-controls">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search"
              className="search-input"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
            <span className="search-icon">🔍</span>
          </div>
          <div className="filter-controls">
            <select 
              className="filter-select"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <option value="12 Sep - 28 Oct 2024">12 Sep - 28 Oct 2024</option>
              <option value="Last 30 days">Last 30 days</option>
              <option value="Last 90 days">Last 90 days</option>
              <option value="This year">This year</option>
            </select>
            <select 
              className="filter-select"
              value={amountStatusFilter}
              onChange={(e) => handleAmountStatusFilter(e.target.value)}
            >
              <option value="">Amount Status</option>
              <option value="High Stock">High Stock (>500)</option>
              <option value="Medium Stock">Medium Stock (100-500)</option>
              <option value="Low Stock">Low Stock (&lt;100)</option>
            </select>
            <select 
              className="filter-select"
              value={statusFilter}
              onChange={(e) => handleStatusFilter(e.target.value)}
            >
              <option value="">Status</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
            <button 
              className="filter-btn"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
                setAmountStatusFilter('');
                setFilteredInventoryData(inventoryData);
              }}
            >
              🔄 Clear Filters
            </button>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="inventory-table-container">
          <table className="inventory-table">
            <thead>
              <tr>
                <th>
                  <input 
                    type="checkbox" 
                    checked={selectAll}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </th>
                <th>Product Name</th>
                <th>Category</th>
                <th>SKU</th>
                <th>Incoming</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Price</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventoryData.map((item) => (
                <tr key={item.id} className={selectedProducts.includes(item.id) ? 'selected-row' : ''}>
                  <td>
                    <input 
                      type="checkbox" 
                      checked={selectedProducts.includes(item.id)}
                      onChange={(e) => handleSelectProduct(item.id, e.target.checked)}
                    />
                  </td>
                  <td>
                    <div className="product-info">
                      <span className="product-icon">
                        {typeof item.image === 'string' && item.image.startsWith('data:') ? (
                          <img src={item.image} alt={item.name} style={{width: '24px', height: '24px', borderRadius: '4px'}} />
                        ) : (
                          item.image
                        )}
                      </span>
                      <span className="product-name">{item.name}</span>
                    </div>
                  </td>
                  <td>{item.category}</td>
                  <td>{item.sku}</td>
                  <td>{item.incoming}</td>
                  <td>{item.stock}</td>
                  <td>
                    <span className={`status-badge ${item.status.toLowerCase().replace(/\s+/g, '-')}`}>
                      ● {item.status}
                    </span>
                  </td>
                  <td>${item.price}</td>
                  <td>
                    <div className="action-dropdown">
                      <button className="action-menu-btn">⋯</button>
                      <div className="action-menu">
                        <button onClick={() => handleProductAction(item.id, 'edit')}>✏️ Edit</button>
                        <button onClick={() => handleProductAction(item.id, 'delete')}>🗑️ Delete</button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="inventory-pagination">
          <div className="pagination-info">
            Result 1-{Math.min(10, filteredInventoryData.length)} of {filteredInventoryData.length}
          </div>
          <div className="pagination-controls">
            <button className="pagination-btn">← Previous</button>
            <div className="page-numbers">
              <button className="page-btn active">1</button>
              <button className="page-btn">2</button>
              <button className="page-btn">3</button>
              <span>...</span>
              <button className="page-btn">12</button>
            </div>
            <button className="pagination-btn">Next →</button>
          </div>
        </div>

        {/* Add Product Modal */}
        {showAddProductModal && (
          <div className="modal-overlay" onClick={() => setShowAddProductModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>➕ Add New Product</h3>
                <button 
                  className="modal-close-btn"
                  onClick={() => setShowAddProductModal(false)}
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleAddProduct} className="add-product-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Product Name *</label>
                    <input
                      type="text"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                      placeholder="Enter product name"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Category *</label>
                    <select
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                      required
                    >
                      <option value="">Select category</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Apparel">Apparel</option>
                      <option value="Wellness">Wellness</option>
                      <option value="Home & Living">Home & Living</option>
                      <option value="Sports">Sports</option>
                      <option value="Books">Books</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>SKU</label>
                    <input
                      type="text"
                      value={newProduct.sku}
                      onChange={(e) => setNewProduct({...newProduct, sku: e.target.value})}
                      placeholder="Auto-generated if empty"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Price *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Stock Quantity *</label>
                    <input
                      type="number"
                      min="0"
                      value={newProduct.stock}
                      onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
                      placeholder="0"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Incoming Quantity</label>
                    <input
                      type="number"
                      min="0"
                      value={newProduct.incoming}
                      onChange={(e) => setNewProduct({...newProduct, incoming: e.target.value})}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Status</label>
                    <select
                      value={newProduct.status}
                      onChange={(e) => setNewProduct({...newProduct, status: e.target.value})}
                    >
                      <option value="In Stock">In Stock</option>
                      <option value="Low Stock">Low Stock</option>
                      <option value="Out of Stock">Out of Stock</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Product Image</label>
                    <div className="image-upload-container">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="image-upload-input"
                        id="product-image"
                      />
                      <label htmlFor="product-image" className="image-upload-label">
                        {newProduct.imagePreview ? (
                          <img src={newProduct.imagePreview} alt="Preview" className="image-preview" />
                        ) : (
                          <div className="image-placeholder">
                            📷 Upload Image
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                </div>

                <div className="modal-actions">
                  <button 
                    type="button" 
                    className="btn-secondary"
                    onClick={() => setShowAddProductModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Add Product
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

         {/* Edit Product Modal */}
         {showEditProductModal && (
           <div className="modal-overlay" onClick={() => setShowEditProductModal(false)}>
             <div className="modal-content" onClick={(e) => e.stopPropagation()}>
               <div className="modal-header">
                 <h3>✏️ Edit Product</h3>
                 <button 
                   className="modal-close-btn"
                   onClick={() => setShowEditProductModal(false)}
                 >
                   ✕
                 </button>
               </div>
               
               <form onSubmit={handleEditProduct} className="add-product-form">
                 <div className="form-row">
                   <div className="form-group">
                     <label>Product Name *</label>
                     <input
                       type="text"
                       value={newProduct.name}
                       onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                       placeholder="Enter product name"
                       required
                     />
                   </div>
                   
                   <div className="form-group">
                     <label>Category *</label>
                     <select
                       value={newProduct.category}
                       onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                       required
                     >
                       <option value="">Select category</option>
                       <option value="Electronics">Electronics</option>
                       <option value="Apparel">Apparel</option>
                       <option value="Wellness">Wellness</option>
                       <option value="Home & Living">Home & Living</option>
                       <option value="Sports">Sports</option>
                       <option value="Books">Books</option>
                     </select>
                   </div>
                 </div>

                 <div className="form-row">
                   <div className="form-group">
                     <label>SKU</label>
                     <input
                       type="text"
                       value={newProduct.sku}
                       onChange={(e) => setNewProduct({...newProduct, sku: e.target.value})}
                       placeholder="Auto-generated if empty"
                     />
                   </div>
                   
                   <div className="form-group">
                     <label>Price *</label>
                     <input
                       type="number"
                       step="0.01"
                       min="0"
                       value={newProduct.price}
                       onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                       placeholder="0.00"
                       required
                     />
                   </div>
                 </div>

                 <div className="form-row">
                   <div className="form-group">
                     <label>Stock Quantity *</label>
                     <input
                       type="number"
                       min="0"
                       value={newProduct.stock}
                       onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
                       placeholder="0"
                       required
                     />
                   </div>
                   
                   <div className="form-group">
                     <label>Incoming Quantity</label>
                     <input
                       type="number"
                       min="0"
                       value={newProduct.incoming}
                       onChange={(e) => setNewProduct({...newProduct, incoming: e.target.value})}
                       placeholder="0"
                     />
                   </div>
                 </div>

                 <div className="form-row">
                   <div className="form-group">
                     <label>Status</label>
                     <select
                       value={newProduct.status}
                       onChange={(e) => setNewProduct({...newProduct, status: e.target.value})}
                     >
                       <option value="In Stock">In Stock</option>
                       <option value="Low Stock">Low Stock</option>
                       <option value="Out of Stock">Out of Stock</option>
                     </select>
                   </div>
                   
                   <div className="form-group">
                     <label>Product Image</label>
                     <div className="image-upload-container">
                       <input
                         type="file"
                         accept="image/*"
                         onChange={handleImageUpload}
                         className="image-upload-input"
                         id="edit-product-image"
                       />
                       <label htmlFor="edit-product-image" className="image-upload-label">
                         {newProduct.imagePreview ? (
                           <img src={newProduct.imagePreview} alt="Preview" className="image-preview" />
                         ) : (
                           <div className="image-placeholder">
                             📷 Upload Image
                           </div>
                         )}
                       </label>
                     </div>
                   </div>
                 </div>

                 <div className="modal-actions">
                   <button 
                     type="button" 
                     className="btn-secondary"
                     onClick={() => setShowEditProductModal(false)}
                   >
                     Cancel
                   </button>
                   <button type="submit" className="btn-primary">
                     Update Product
                   </button>
                 </div>
               </form>
             </div>
           </div>
         )}
      </div>
    );
  };

  return (
    <div className="store-management">
      <div className="store-management-header">
        <h2>Store Management</h2>
        <div className="section-nav">
          <button 
            className={`nav-btn ${activeSection === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveSection('inventory')}
          >
            📦 Inventory Management
          </button>
        </div>
      </div>
      
      <div className="store-management-content">
        {activeSection === 'inventory' && renderInventoryManagement()}
      </div>
    </div>
  );
};

export default StoreManagement;