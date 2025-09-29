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
    category: '',
    price: '',
    photo: null
  });
  
  // Use categories from parent App component
  const [newCategory, setNewCategory] = useState('');

  const [dragActive, setDragActive] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileInputRef = useRef(null);

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

  const handleAddItem = (e) => {
    e.preventDefault();
    if (newItem.name && newItem.price) {
      const newProduct = {
        id: Math.max(...products.map(p => p.id), 0) + 1,
        name: newItem.name,
        price: parseFloat(newItem.price),
        category_name: newItem.category,
        image_url: photoPreview || '/api/placeholder/60/60'
      };
      
      // Add to products state in App component
      setProducts([...products, newProduct]);
      
      setNewItem({
        name: '',
        category: categories[0] || '',
        price: '',
        photo: null
      });
      setPhotoPreview(null);
      
      // Navigate to POS dashboard after successful item addition
      if (onNavigate) {
        onNavigate('pos');
      }
    }
  };

  const handleDeleteItem = (id) => {
    setProducts(products.filter(product => product.id !== id));
  };

  const handleToggleStatus = (id) => {
    // Since the API doesn't support status, we'll just keep this as a placeholder
    // In a real implementation, this would update the product status in the database
    console.log('Toggle status for product:', id);
  };

  const handleAddCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories([...categories, newCategory.trim()]);
      setNewCategory('');
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
      // Mock import functionality
      console.log('Importing file:', file.name);
      alert(`File ${file.name} imported successfully`);
    }
  };

  const renderOverview = () => (
    <div className="overview-section">
      <div className="section-header">
        <h3>Items Overview</h3>
        <div className="overview-stats">
          <div className="stat-card">
            <span className="stat-number">{items.length}</span>
            <span className="stat-label">Total Items</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{items.filter(item => item.status === 'Active').length}</span>
            <span className="stat-label">Active Items</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{categories.length}</span>
            <span className="stat-label">Categories</span>
          </div>
        </div>
      </div>
      
      <div className="items-table">
        <div className="table-header">
          <div className="table-cell">Photo</div>
          <div className="table-cell">Item Name</div>
          <div className="table-cell">Category</div>
          <div className="table-cell">Price</div>
          <div className="table-cell">Status</div>
          <div className="table-cell">Actions</div>
        </div>
        
        {items.map(item => (
          <div key={item.id} className="table-row">
            <div className="table-cell">
              <img 
                src={item.photo} 
                alt={item.name} 
                className="item-photo"
                onError={(e) => {
                  e.target.src = '/api/placeholder/50/50';
                }}
              />
            </div>
            <div className="table-cell">{item.name}</div>
            <div className="table-cell">{item.category}</div>
            <div className="table-cell">${item.price.toFixed(2)}</div>
            <div className="table-cell">
              <span className={`status-badge ${item.status.toLowerCase()}`}>
                {item.status}
              </span>
            </div>
            <div className="table-cell">
              <div className="action-buttons">
                <button 
                  className="action-btn edit"
                  onClick={() => console.log('Edit item', item.id)}
                >
                  ✏️
                </button>
                <button 
                  className="action-btn toggle"
                  onClick={() => handleToggleStatus(item.id)}
                >
                  {item.status === 'Active' ? '⏸️' : '▶️'}
                </button>
                <button 
                  className="action-btn delete"
                  onClick={() => handleDeleteItem(item.id)}
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

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

  const handleDownloadSample = () => {
    const link = document.createElement('a');
    link.href = '/sample-items.csv';
    link.download = 'sample-items.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderImportExport = () => (
    <div className="import-export-section">
      <div className="section-header">
        <h3>Import & Export</h3>
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
        
        <div className="import-section">
          <h4>Import Items</h4>
          <p>Upload a file to bulk add or update items</p>
          
          <div className="sample-file-section">
            <h5>📋 Sample File</h5>
            <p>Download a sample file to understand the required format</p>
            <button 
              className="sample-btn"
              onClick={handleDownloadSample}
            >
              📥 Download Sample CSV
            </button>
          </div>
          
          <div className="import-area">
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleImport}
              className="import-input"
              id="import-file"
            />
            <label htmlFor="import-file" className="import-label">
              📤 Choose File to Import
            </label>
            <p className="import-hint">Supports CSV and Excel formats</p>
          </div>
        </div>
      </div>
    </div>
  );

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