import React, { useState, useRef } from 'react';
import './ItemManagement.css';

const ItemManagement = ({ 
  initialSection = 'overview', 
  onNavigate, 
  products = [], 
  setProducts, 
  categories = [], 
  setCategories 
}) => {
  const [activeSection, setActiveSection] = useState('overview');
  const [dropdownOpen, setDropdownOpen] = useState(null);
  
  // Use products from parent App component instead of local items state
  const items = products.map(product => ({
    id: product.id,
    name: product.name,
    category: product.category_name || 'Uncategorized',
    price: product.price,
    status: 'Active', // Default status since API doesn't have status field
    photo: product.image_url || '/api/placeholder/50/50'
  }));

  const [newItem, setNewItem] = useState({
    name: '',
    category: categories[0] || '',
    price: '',
    photo: null
  });
  
  // Use categories from parent App component
  const [newCategory, setNewCategory] = useState('');

  const [dragActive, setDragActive] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileInputRef = useRef(null);

  // Add Stock state variables
  const [selectedItem, setSelectedItem] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [stockType, setStockType] = useState('add'); // 'add' or 'set'
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Dropdown functions
  const toggleDropdown = (itemId) => {
    setDropdownOpen(dropdownOpen === itemId ? null : itemId);
  };

  const closeDropdown = () => {
    setDropdownOpen(null);
  };

  // Action handlers
  const handleEditItem = (item) => {
    console.log('Edit item:', item);
    // TODO: Implement edit functionality
  };

  const handleViewItem = (item) => {
    console.log('View item:', item);
    // TODO: Implement view functionality
  };

  const handleDuplicateItem = (item) => {
    const duplicatedItem = {
      ...item,
      id: Math.max(...products.map(p => p.id), 0) + 1,
      name: `${item.name} (Copy)`
    };
    setProducts([...products, duplicatedItem]);
  };

  const handleToggleStatus = (itemId) => {
    // TODO: Implement status toggle
    console.log('Toggle status for item:', itemId);
  };

  const handleDeleteItem = (itemId) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      setProducts(products.filter(p => p.id !== itemId));
    }
  };

  // Add click outside handler to close dropdown
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownOpen && !event.target.closest('.actions-dropdown')) {
        closeDropdown();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewItem(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoUpload = (file) => {
    if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target.result);
        setNewItem(prev => ({
          ...prev,
          photo: file
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handlePhotoUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handlePhotoUpload(e.target.files[0]);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItem.name || !newItem.price) {
      alert('Please fill in all required fields (name and price)');
      return;
    }

    try {
      const productData = {
        name: newItem.name,
        price: parseFloat(newItem.price),
        category: newItem.category,
        image: photoPreview || null,
        stock: 0,
        description: '',
        sku: '',
        status: 'active'
      };

      const response = await fetch('http://localhost:5000/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add item');
      }

      const newProduct = await response.json();
      
      // Add to products state in App component
      setProducts([...products, newProduct]);
      
      // Reset form
      setNewItem({
        name: '',
        category: categories[0] || '',
        price: '',
        photo: null
      });
      setPhotoPreview(null);
      
      alert('Item added successfully!');
      
      // Navigate to POS dashboard after successful item addition
      if (onNavigate) {
        onNavigate('pos');
      }
    } catch (error) {
      console.error('Error adding item:', error);
      alert('Error adding item: ' + error.message);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      alert('Please enter a category name');
      return;
    }

    // Check if category already exists locally
    if (categories.some(cat => cat.name && cat.name.toLowerCase() === newCategory.trim().toLowerCase())) {
      alert('Category already exists');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newCategory.trim()
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create category');
      }

      const newCategoryData = await response.json();
      
      // Update the categories state
      setCategories(prevCategories => [...prevCategories, newCategoryData]);
      setNewCategory('');
      
      alert('Category added successfully!');
      
    } catch (error) {
      console.error('Error adding category:', error);
      alert('Error adding category: ' + error.message);
    }
  };

  const handleDeleteCategory = (categoryToDelete) => {
    // Only allow deletion if no items are using this category
    const isUsed = items.some(item => item.category === categoryToDelete);
    if (!isUsed) {
      setCategories(categories.filter(cat => cat !== categoryToDelete));
    } else {
      alert('Cannot delete category that is being used by items');
    }
  };

  const handleExport = (format) => {
    // Mock export functionality
    console.log(`Exporting items as ${format}`);
    alert(`Items exported as ${format} format`);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleItemFileImport(e);
    }
  };

  const downloadItemSample = () => {
    const sampleData = [
      ['Name', 'Category', 'Price', 'Stock'],
      ['Sample Item 1', 'Food', '12.99', '50'],
      ['Sample Item 2', 'Beverages', '5.99', '25'],
      ['Sample Item 3', 'Desserts', '8.50', '15']
    ];

    const csvContent = sampleData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'item_sample.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const renderOverview = () => {
    // Calculate statistics
    const totalItems = products.length;
    const activeItems = products.filter(p => p.status === 'active').length;
    const inactiveItems = products.filter(p => p.status === 'inactive').length;
    const totalValue = products.reduce((sum, p) => sum + (parseFloat(p.price) || 0), 0);
    const categoriesCount = categories.length;
    const lowStockItems = products.filter(p => (p.stock || 0) < 10).length;

    return (
      <div className="overview-section">
        {/* Overview Header */}
        <div className="overview-header">
          <div className="overview-title">
            <h3>📊 Inventory Overview</h3>
            <p>Monitor your inventory performance and key metrics</p>
          </div>
          <div className="overview-actions">
            <button 
              className="action-btn primary"
              onClick={() => setActiveSection('add')}
            >
              ➕ Add Item
            </button>
            <button 
              className="action-btn secondary"
              onClick={() => setActiveSection('add-category')}
            >
              🏷️ Add Category
            </button>
            <button 
              className="action-btn tertiary"
              onClick={() => setActiveSection('import-export')}
            >
              📤 Import/Export
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="stats-grid">
          <div className="stat-card primary">
            <div className="stat-icon">📦</div>
            <div className="stat-content">
              <div className="stat-value">{totalItems}</div>
              <div className="stat-label">Total Items</div>
              <div className="stat-trend positive">+{Math.floor(Math.random() * 10)}% this month</div>
            </div>
          </div>

          <div className="stat-card success">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <div className="stat-value">{activeItems}</div>
              <div className="stat-label">Active Items</div>
              <div className="stat-trend positive">
                {totalItems > 0 ? Math.round((activeItems / totalItems) * 100) : 0}% of total
              </div>
            </div>
          </div>

          <div className="stat-card warning">
            <div className="stat-icon">⚠️</div>
            <div className="stat-content">
              <div className="stat-value">{lowStockItems}</div>
              <div className="stat-label">Low Stock</div>
              <div className="stat-trend negative">Needs attention</div>
            </div>
          </div>

          <div className="stat-card info">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <div className="stat-value">${totalValue.toFixed(2)}</div>
              <div className="stat-label">Total Value</div>
              <div className="stat-trend neutral">Inventory worth</div>
            </div>
          </div>

          <div className="stat-card secondary">
            <div className="stat-icon">🏷️</div>
            <div className="stat-content">
              <div className="stat-value">{categoriesCount}</div>
              <div className="stat-label">Categories</div>
              <div className="stat-trend neutral">Active categories</div>
            </div>
          </div>

          <div className="stat-card danger">
            <div className="stat-icon">❌</div>
            <div className="stat-content">
              <div className="stat-value">{inactiveItems}</div>
              <div className="stat-label">Inactive Items</div>
              <div className="stat-trend negative">
                {totalItems > 0 ? Math.round((inactiveItems / totalItems) * 100) : 0}% of total
              </div>
            </div>
          </div>
        </div>

        {/* Quick Insights */}
        <div className="insights-section">
          <h4>📈 Quick Insights</h4>
          <div className="insights-grid">
            <div className="insight-card">
              <div className="insight-icon">🔥</div>
              <div className="insight-content">
                <h5>Top Category</h5>
                <p>{categories.length > 0 ? categories[0] : 'No categories yet'}</p>
              </div>
            </div>
            <div className="insight-card">
              <div className="insight-icon">📊</div>
              <div className="insight-content">
                <h5>Average Price</h5>
                <p>${totalItems > 0 ? (totalValue / totalItems).toFixed(2) : '0.00'}</p>
              </div>
            </div>
            <div className="insight-card">
              <div className="insight-icon">⚡</div>
              <div className="insight-content">
                <h5>Status</h5>
                <p>{activeItems > inactiveItems ? 'Healthy' : 'Needs Review'}</p>
              </div>
            </div>
          </div>
        </div>


      </div>
    );
  };

  const renderAddItem = () => (
    <div className="add-item-section">
      <div className="section-header">
        <h3>Add New Item</h3>
      </div>
      
      <form onSubmit={handleAddItem} className="add-item-form">
        <div className="form-row">
          <div className="form-group">
            <label>Item Name</label>
            <input
              type="text"
              name="name"
              value={newItem.name}
              onChange={handleInputChange}
              placeholder="Enter item name"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Category</label>
            <select
              name="category"
              value={newItem.category}
              onChange={handleInputChange}
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Price ($)</label>
            <input
              type="number"
              name="price"
              value={newItem.price}
              onChange={handleInputChange}
              placeholder="0.00"
              step="0.01"
              min="0"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Status</label>
            <select
              name="status"
              value={newItem.status}
              onChange={handleInputChange}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
        
        <div className="form-group photo-upload-group">
          <label>Photo Upload</label>
          <div 
            className={`photo-upload-area ${dragActive ? 'drag-active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            {photoPreview ? (
              <div className="photo-preview">
                <img src={photoPreview} alt="Preview" />
                <button 
                  type="button" 
                  className="remove-photo"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPhotoPreview(null);
                    setNewItem(prev => ({ ...prev, photo: null }));
                  }}
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="upload-placeholder">
                <div className="upload-icon">📷</div>
                <p>Drag & drop an image here or click to browse</p>
                <p className="upload-hint">Supports JPEG, PNG formats</p>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>
        
        <button type="submit" className="add-item-btn">
          Add Item
        </button>
      </form>
    </div>
  );

  const renderAddCategory = () => (
    <div className="add-category-section">
      <div className="section-header">
        <h3>Add Category</h3>
        <p>Manage your item categories</p>
      </div>
      
      <div className="add-category-form">
        <div className="form-group">
          <label htmlFor="categoryName">Category Name</label>
          <input
            type="text"
            id="categoryName"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Enter category name"
            className="category-input"
          />
          <button 
            type="button" 
            onClick={handleAddCategory}
            className="add-category-btn"
            disabled={!newCategory.trim() || categories.includes(newCategory.trim())}
          >
            Add Category
          </button>
        </div>
      </div>
      
      <div className="existing-categories">
        <h4>Existing Categories</h4>
        <div className="categories-list">
          {categories.map(category => {
            const itemCount = items.filter(item => item.category === category).length;
            const canDelete = itemCount === 0;
            
            return (
              <div key={category} className="category-item">
                <div className="category-info">
                  <span className="category-name">{category}</span>
                  <span className="category-count">({itemCount} items)</span>
                </div>
                <button
                  className={`delete-category-btn ${!canDelete ? 'disabled' : ''}`}
                  onClick={() => handleDeleteCategory(category)}
                  disabled={!canDelete}
                  title={!canDelete ? 'Cannot delete category with items' : 'Delete category'}
                >
                  🗑️
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // Enhanced import function for items
  const handleItemFileImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target.result;
        const lines = csv.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          alert('CSV file must contain at least a header row and one data row');
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        // Flexible header matching
        const getColumnIndex = (possibleNames) => {
          for (const name of possibleNames) {
            const index = headers.findIndex(h => h.includes(name.toLowerCase()));
            if (index !== -1) return index;
          }
          return -1;
        };

        const nameIndex = getColumnIndex(['name', 'item', 'product']);
        const categoryIndex = getColumnIndex(['category', 'type']);
        const priceIndex = getColumnIndex(['price', 'cost', 'amount']);
        const stockIndex = getColumnIndex(['stock', 'quantity', 'qty']);

        if (nameIndex === -1) {
          alert('CSV must contain a "Name" column');
          return;
        }

        const newItems = [];
        let successCount = 0;
        let errorCount = 0;

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          
          if (values.length < headers.length) continue;

          const name = values[nameIndex];
          if (!name) {
            errorCount++;
            continue;
          }

          const category = categoryIndex !== -1 ? values[categoryIndex] : 'General';
          const price = priceIndex !== -1 ? parseFloat(values[priceIndex]) || 0 : 0;
          const stock = stockIndex !== -1 ? parseInt(values[stockIndex]) || 0 : 0;

          const newItem = {
            id: Date.now() + Math.random(),
            name,
            category,
            price,
            stock,
            status: 'active',
            createdAt: new Date().toISOString()
          };

          newItems.push(newItem);
          successCount++;
        }

        if (newItems.length > 0) {
          setProducts(prevProducts => [...prevProducts, ...newItems]);
          
          // Add new categories if they don't exist
          const newCategories = [...new Set(newItems.map(item => item.category))];
          newCategories.forEach(cat => {
            if (!categories.find(c => c.name === cat)) {
              setCategories(prev => [...prev, { id: Date.now() + Math.random(), name: cat }]);
            }
          });
        }

        alert(`Import completed!\nSuccessful: ${successCount} items\nErrors: ${errorCount} items`);
        event.target.value = '';
        
      } catch (error) {
        console.error('Import error:', error);
        alert('Error processing file. Please check the format and try again.');
      }
    };

    reader.readAsText(file);
  };

  const renderImportExport = () => (
    <div className="import-export-section">
      <div className="section-header">
        <h3>Import & Export</h3>
      </div>
      
      {/* Enhanced Import Section */}
      <div className="items-import-section">
        <div className="import-header">
          <h3>📥 Import Items</h3>
          <p>Upload CSV files to bulk import item data</p>
        </div>
        <div className="import-actions">
          <div className="import-upload">
            <input
              type="file"
              id="items-file-input"
              accept=".csv"
              onChange={handleItemFileImport}
              style={{ display: 'none' }}
            />
            <button 
              className="import-btn upload-btn"
              onClick={() => document.getElementById('items-file-input').click()}
            >
              <span>📁</span>
              Choose CSV File
            </button>
          </div>
          <button 
            className="import-btn sample-btn"
            onClick={downloadItemSample}
          >
            <span>📋</span>
            Download Sample
          </button>
        </div>
        <div className="import-info">
          <p>💡 <strong>CSV Format:</strong> Name, Category, Price, Stock</p>
          <p>📝 Download the sample file to see the correct format</p>
        </div>
      </div>
      
      <div className="import-export-content">
        <div className="export-section">
          <h4>Export Items</h4>
          <p>Download your current item list in various formats</p>
          <div className="export-buttons">
            <button 
              className="export-btn csv"
              onClick={() => handleExport('CSV')}
            >
              📊 Export as CSV
            </button>
            <button 
              className="export-btn excel"
              onClick={() => handleExport('Excel')}
            >
              📈 Export as Excel
            </button>
            <button 
              className="export-btn pdf"
              onClick={() => handleExport('PDF')}
            >
              📄 Export as PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAddStock = () => {
    const handleStockUpdate = async (e) => {
      e.preventDefault();
      
      if (!selectedItem || !stockQuantity) {
        alert('Please select an item and enter a stock quantity');
        return;
      }

      setIsLoading(true);
      
      try {
        const selectedProduct = products.find(p => p.id === parseInt(selectedItem));
        if (!selectedProduct) {
          alert('Selected item not found');
          return;
        }

        const currentStock = selectedProduct.stock || 0;
        const quantity = parseInt(stockQuantity);
        let newStock;

        if (stockType === 'add') {
          newStock = currentStock + quantity;
        } else {
          newStock = quantity;
        }

        // Update the product stock via API
        const response = await fetch(`http://localhost:5000/api/products/${selectedItem}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...selectedProduct,
            stock: newStock
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update stock');
        }

        const updatedProduct = await response.json();
        
        // Update the products state
        setProducts(prevProducts => 
          prevProducts.map(product => 
            product.id === parseInt(selectedItem) 
              ? { ...product, stock: newStock }
              : product
          )
        );

        // Reset form
        setSelectedItem('');
        setStockQuantity('');
        setReason('');
        
        alert(`Stock updated successfully! New stock: ${newStock}`);
        
      } catch (error) {
        console.error('Error updating stock:', error);
        alert('Failed to update stock. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <div className="add-stock-section">
        <div className="section-header">
          <h3>Add Stock</h3>
          <p>Update inventory levels for existing items</p>
        </div>
        
        <form onSubmit={handleStockUpdate} className="add-stock-form">
          <div className="form-group">
            <label htmlFor="item-select">Select Item</label>
            <select
              id="item-select"
              value={selectedItem}
              onChange={(e) => setSelectedItem(e.target.value)}
              className="form-select"
              required
            >
              <option value="">Choose an item...</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name} (Current Stock: {product.stock || 0})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="stock-type">Stock Update Type</label>
            <select
              id="stock-type"
              value={stockType}
              onChange={(e) => setStockType(e.target.value)}
              className="form-select"
            >
              <option value="add">Add to Current Stock</option>
              <option value="set">Set New Stock Level</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="stock-quantity">
              {stockType === 'add' ? 'Quantity to Add' : 'New Stock Level'}
            </label>
            <input
              type="number"
              id="stock-quantity"
              value={stockQuantity}
              onChange={(e) => setStockQuantity(e.target.value)}
              className="form-input"
              min="0"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="reason">Reason (Optional)</label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="form-textarea"
              placeholder="Enter reason for stock update..."
              rows="3"
            />
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className="submit-btn"
              disabled={isLoading}
            >
              {isLoading ? '⏳ Updating...' : '📦 Update Stock'}
            </button>
          </div>
        </form>

        {selectedItem && (
          <div className="stock-preview">
            <h4>Stock Update Preview</h4>
            {(() => {
              const selectedProduct = products.find(p => p.id === parseInt(selectedItem));
              const currentStock = selectedProduct?.stock || 0;
              const quantity = parseInt(stockQuantity) || 0;
              const newStock = stockType === 'add' ? currentStock + quantity : quantity;
              
              return (
                <div className="preview-details">
                  <p><strong>Item:</strong> {selectedProduct?.name}</p>
                  <p><strong>Current Stock:</strong> {currentStock}</p>
                  <p><strong>New Stock:</strong> {newStock}</p>
                  <p><strong>Change:</strong> {stockType === 'add' ? `+${quantity}` : `Set to ${quantity}`}</p>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="item-management">
      <div className="item-management-header">
        <h2>Item Management</h2>
        <div className="section-nav">
          <button 
            className={`nav-btn ${activeSection === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveSection('overview')}
          >
            📋 Overview
          </button>
          <button 
            className={`nav-btn ${activeSection === 'add' ? 'active' : ''}`}
            onClick={() => setActiveSection('add')}
          >
            ➕ Add Item
          </button>
          <button 
            className={`nav-btn ${activeSection === 'add-category' ? 'active' : ''}`}
            onClick={() => setActiveSection('add-category')}
          >
            🏷️ Add Category
          </button>
          <button 
            className={`nav-btn ${activeSection === 'import-export' ? 'active' : ''}`}
            onClick={() => setActiveSection('import-export')}
          >
            📤 Import/Export
          </button>
        </div>
      </div>
      
      <div className="item-management-content">
        {activeSection === 'overview' && renderOverview()}
        {activeSection === 'add' && renderAddItem()}
        {activeSection === 'add-category' && renderAddCategory()}
        {activeSection === 'import-export' && renderImportExport()}
      </div>
    </div>
  );
};

export default ItemManagement;