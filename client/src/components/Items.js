import React, { useState, useEffect, useRef } from 'react';
import './Items.css';

const Items = ({ 
  products = [], 
  setProducts, 
  categories = [], 
  setCategories,
  onRefreshData 
}) => {
  // Use props instead of local state for items and categories
  const items = products;
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('name'); // 'name', 'price', 'stock', 'category'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'

  const [newItem, setNewItem] = useState({
    name: '',
    category: '',
    price: '',
    stock: '',
    description: '',
    image: '',
    status: 'active'
  });

  // Photo upload states
  const [photoPreview, setPhotoPreview] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Use data from props instead of fetching locally
  useEffect(() => {
    // Data is already available from props, no need to fetch
    if (onRefreshData && items.length === 0) {
      onRefreshData();
    }
  }, [onRefreshData, items.length]);

  // Remove unused fetchItems function since we use props
  // const fetchItems = async () => {
  //   setLoading(true);
  //   try {
  //     const response = await fetch('http://localhost:5000/api/products');
  //     const data = await response.json();
  //     setProducts(data);
  //   } catch (error) {
  //     console.error('Error fetching items:', error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // Remove unused fetchCategories function since we use props
  // const fetchCategories = async () => {
  //   try {
  //     const response = await fetch('http://localhost:5000/api/categories');
  //     const data = await response.json();
  //     // Extract category names from objects if they have a 'name' property
  //     const categoryNames = data.map(cat => typeof cat === 'object' ? cat.name : cat);
  //     setCategories(['All', ...categoryNames]);
  //   } catch (error) {
  //     console.error('Error fetching categories:', error);
  //     setCategories(['All', 'Food', 'Beverages', 'Desserts', 'Snacks']);
  //   }
  // };

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newItem,
          price: parseFloat(newItem.price),
          stock: parseInt(newItem.stock)
        }),
      });

      if (response.ok) {
        const addedItem = await response.json();
        // Update parent component's products state
        setProducts([...products, addedItem]);
        setNewItem({
          name: '',
          category: '',
          price: '',
          stock: '',
          description: '',
          image: '',
          status: 'active'
        });
        setPhotoPreview(null);
        setShowAddModal(false);
      }
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const handleEditItem = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:5000/api/products/${editingItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...editingItem,
          price: parseFloat(editingItem.price),
          stock: parseInt(editingItem.stock)
        }),
      });

      if (response.ok) {
        const updatedItem = await response.json();
        // Update parent component's products state
        setProducts(products.map(item => item.id === updatedItem.id ? updatedItem : item));
        setShowEditModal(false);
        setEditingItem(null);
      }
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        const response = await fetch(`http://localhost:5000/api/products/${itemId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          // Update parent component's products state
          setProducts(products.filter(item => item.id !== itemId));
        }
      } catch (error) {
        console.error('Error deleting item:', error);
      }
    }
  };

  const openEditModal = (item) => {
    setEditingItem({ ...item });
    setShowEditModal(true);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Photo upload handlers
  const handlePhotoUpload = (file) => {
    if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target.result);
        setNewItem(prev => ({
          ...prev,
          image: e.target.result
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

  // Import functionality
  const [importFile, setImportFile] = useState(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState(null);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'text/csv') {
      setImportFile(file);
    } else {
      alert('Please select a valid CSV file');
    }
  };

  const downloadSampleFile = () => {
    const sampleData = [
      ['name', 'category', 'price', 'stock', 'description', 'sku', 'status'],
      ['Sample Item 1', 'Food', '12.99', '50', 'A delicious sample item', 'SKU001', 'active'],
      ['Sample Item 2', 'Beverages', '5.99', '25', 'A refreshing sample drink', 'SKU002', 'active'],
      ['Sample Item 3', 'Desserts', '8.50', '15', 'A sweet sample dessert', 'SKU003', 'active']
    ];

    const csvContent = sampleData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sample-items.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const parseCSV = (csvText) => {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const items = [];

    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(',').map(v => v.trim());
        const item = {};
        
        headers.forEach((header, index) => {
          item[header] = values[index] || '';
        });

        // Validate required fields
        if (item.name && item.category && item.price) {
          items.push({
            name: item.name,
            category: item.category,
            price: parseFloat(item.price) || 0,
            stock: parseInt(item.stock) || 0,
            description: item.description || '',
            sku: item.sku || '',
            status: item.status || 'active',
            image: item.image || ''
          });
        }
      }
    }

    return items;
  };

  const handleImport = async () => {
    if (!importFile) {
      alert('Please select a file to import');
      return;
    }

    setImportProgress(0);
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const csvText = e.target.result;
        const parsedItems = parseCSV(csvText);
        
        if (parsedItems.length === 0) {
          setImportResults({
            total: 0,
            success: 0,
            errors: 1,
            errorMessage: 'No valid items found in the CSV file. Please check the format and required fields (name, category, price).'
          });
          return;
        }

        setImportProgress(50);
        
        // Import items to server
        let successCount = 0;
        let errorCount = 0;
        const errorDetails = [];
        
        for (let i = 0; i < parsedItems.length; i++) {
          const item = parsedItems[i];
          try {
            const response = await fetch('http://localhost:5000/api/products', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(item),
            });

            if (response.ok) {
              successCount++;
            } else {
              const errorData = await response.json();
              errorCount++;
              errorDetails.push(`Row ${i + 2}: ${errorData.error || 'Unknown error'}`);
            }
          } catch (error) {
            errorCount++;
            errorDetails.push(`Row ${i + 2}: Network error - ${error.message}`);
          }
        }

        setImportProgress(100);
        setImportResults({
          total: parsedItems.length,
          success: successCount,
          errors: errorCount,
          errorDetails: errorDetails.slice(0, 5), // Show first 5 errors
          hasMoreErrors: errorDetails.length > 5
        });

        // Refresh items list if any items were successfully imported
        if (successCount > 0) {
          onRefreshData();
        }
        
      } catch (error) {
        setImportResults({
          total: 0,
          success: 0,
          errors: 1,
          errorMessage: `Error parsing CSV file: ${error.message}. Please ensure the file is properly formatted.`
        });
      }
    };

    reader.readAsText(importFile);
  };

  const renderImportModal = () => (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>📥 Import Items</h2>
          <button className="close-btn" onClick={() => {
            setShowImportModal(false);
            setImportFile(null);
            setImportProgress(0);
            setImportResults(null);
          }}>
            ✕
          </button>
        </div>
        <div className="modal-form">
          {!importResults ? (
            <>
              <div className="form-group">
                <label>Upload CSV File</label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                />
                <small>Select a CSV file containing your items data</small>
              </div>
              
              <div className="form-group">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={downloadSampleFile}
                >
                  📄 Download Sample File
                </button>
                <small>Download a sample CSV file to see the required format</small>
              </div>

              {importFile && (
                <div className="form-group">
                  <p><strong>Selected file:</strong> {importFile.name}</p>
                </div>
              )}

              {importProgress > 0 && importProgress < 100 && (
                <div className="form-group">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${importProgress}%` }}
                    ></div>
                  </div>
                  <p>Importing... {importProgress}%</p>
                </div>
              )}

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => {
                    setShowImportModal(false);
                    setImportFile(null);
                    setImportProgress(0);
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn-primary"
                  onClick={handleImport}
                  disabled={!importFile || (importProgress > 0 && importProgress < 100)}
                >
                  Import Items
                </button>
              </div>
            </>
          ) : (
            <div className="import-results">
              <h3>Import Results</h3>
              <div className="results-summary">
                <div className="result-item">
                  <span className="result-label">Total Items:</span>
                  <span className="result-value">{importResults.total}</span>
                </div>
                <div className="result-item success">
                  <span className="result-label">Successfully Imported:</span>
                  <span className="result-value">{importResults.success}</span>
                </div>
                {importResults.errors > 0 && (
                  <div className="result-item error">
                    <span className="result-label">Errors:</span>
                    <span className="result-value">{importResults.errors}</span>
                  </div>
                )}
              </div>
              
              {/* Display error message for general errors */}
              {importResults.errorMessage && (
                <div className="error-details">
                  <h4>Error Details:</h4>
                  <div className="error-message">{importResults.errorMessage}</div>
                </div>
              )}
              
              {/* Display specific error details */}
              {importResults.errorDetails && importResults.errorDetails.length > 0 && (
                <div className="error-details">
                  <h4>Error Details:</h4>
                  <div className="error-list">
                    {importResults.errorDetails.map((error, index) => (
                      <div key={index} className="error-item">{error}</div>
                    ))}
                    {importResults.hasMoreErrors && (
                      <div className="error-item more-errors">
                        ... and {importResults.errors - importResults.errorDetails.length} more errors
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-primary"
                  onClick={() => {
                    setShowImportModal(false);
                    setImportFile(null);
                    setImportProgress(0);
                    setImportResults(null);
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Category management functionality
  const [categoryList, setCategoryList] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);

  // Stock management functionality
  const [selectedItemForStock, setSelectedItemForStock] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [stockOperation, setStockOperation] = useState('add'); // 'add' or 'set'
  const fetchCategoriesForModal = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategoryList(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      alert('Please enter a category name');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newCategory.trim() }),
      });

      if (response.ok) {
        setNewCategory('');
        fetchCategoriesForModal();
        onRefreshData(); // Refresh the main categories list
      } else {
        alert('Error adding category');
      }
    } catch (error) {
      alert('Error adding category: ' + error.message);
    }
  };

  const handleEditCategory = async (id, newName) => {
    if (!newName.trim()) {
      alert('Please enter a category name');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/categories/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newName.trim() }),
      });

      if (response.ok) {
        setEditingCategory(null);
        fetchCategoriesForModal();
        onRefreshData(); // Refresh the main categories list
      } else {
        alert('Error updating category');
      }
    } catch (error) {
      alert('Error updating category: ' + error.message);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category? Items using this category will need to be updated.')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/categories/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchCategoriesForModal();
        onRefreshData(); // Refresh the main categories list
      } else {
        alert('Error deleting category');
      }
    } catch (error) {
      alert('Error deleting category: ' + error.message);
    }
  };



  // Open category modal and fetch categories
  useEffect(() => {
    if (showCategoryModal) {
      fetchCategoriesForModal();
    }
  }, [showCategoryModal]);

  // Stock management functionality
  const handleAddStock = async () => {
    if (!selectedItemForStock || !stockQuantity) {
      alert('Please select an item and enter a stock quantity');
      return;
    }

    try {
      const selectedItem = items.find(item => item.id === parseInt(selectedItemForStock));
      if (!selectedItem) {
        alert('Selected item not found');
        return;
      }

      let newStockValue;
      if (stockOperation === 'add') {
        newStockValue = selectedItem.stock + parseInt(stockQuantity);
      } else {
        newStockValue = parseInt(stockQuantity);
      }

      const response = await fetch(`http://localhost:5000/api/products/${selectedItemForStock}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...selectedItem,
          stock: newStockValue
        }),
      });

      if (response.ok) {
        const updatedItem = await response.json();
        // Update parent component's products state
        setProducts(products.map(item => item.id === updatedItem.id ? updatedItem : item));
        setSelectedItemForStock('');
        setStockQuantity('');
        setShowStockModal(false);
        alert(`Stock updated successfully! New stock: ${newStockValue}`);
      } else {
        alert('Error updating stock');
      }
    } catch (error) {
      alert('Error updating stock: ' + error.message);
    }
  };

  const renderStockModal = () => (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>📦 Add Stock</h2>
          <button className="close-btn" onClick={() => {
            setShowStockModal(false);
            setSelectedItemForStock('');
            setStockQuantity('');
            setStockOperation('add');
          }}>
            ✕
          </button>
        </div>
        <div className="modal-form">
          <div className="form-group">
            <label>Select Item *</label>
            <select
              value={selectedItemForStock}
              onChange={(e) => setSelectedItemForStock(e.target.value)}
              required
            >
              <option value="">Choose an item...</option>
              {items.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name} - Current Stock: {item.stock}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Stock Operation</label>
            <div className="radio-group">
              <label className="radio-option">
                <input
                  type="radio"
                  value="add"
                  checked={stockOperation === 'add'}
                  onChange={(e) => setStockOperation(e.target.value)}
                />
                Add to existing stock
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  value="set"
                  checked={stockOperation === 'set'}
                  onChange={(e) => setStockOperation(e.target.value)}
                />
                Set new stock quantity
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>
              {stockOperation === 'add' ? 'Quantity to Add *' : 'New Stock Quantity *'}
            </label>
            <input
              type="number"
              min="0"
              value={stockQuantity}
              onChange={(e) => setStockQuantity(e.target.value)}
              placeholder={stockOperation === 'add' ? 'Enter quantity to add...' : 'Enter new stock quantity...'}
              required
            />
          </div>

          {selectedItemForStock && stockQuantity && (
            <div className="stock-preview">
              <h4>Preview:</h4>
              <div className="preview-info">
                <p><strong>Item:</strong> {items.find(item => item.id === parseInt(selectedItemForStock))?.name}</p>
                <p><strong>Current Stock:</strong> {items.find(item => item.id === parseInt(selectedItemForStock))?.stock}</p>
                <p><strong>New Stock:</strong> {
                  stockOperation === 'add' 
                    ? (items.find(item => item.id === parseInt(selectedItemForStock))?.stock || 0) + parseInt(stockQuantity)
                    : parseInt(stockQuantity)
                }</p>
              </div>
            </div>
          )}

          <div className="modal-actions">
            <button 
              type="button" 
              className="btn-secondary"
              onClick={() => {
                setShowStockModal(false);
                setSelectedItemForStock('');
                setStockQuantity('');
                setStockOperation('add');
              }}
            >
              Cancel
            </button>
            <button 
              type="button" 
              className="btn-primary"
              onClick={handleAddStock}
              disabled={!selectedItemForStock || !stockQuantity}
            >
              Update Stock
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCategoryModal = () => (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>🏷️ Manage Categories</h2>
          <button className="close-btn" onClick={() => {
            setShowCategoryModal(false);
            setNewCategory('');
            setEditingCategory(null);
          }}>
            ✕
          </button>
        </div>
        <div className="modal-form">
          <div className="form-group">
            <label>Add New Category</label>
            <div className="category-input-group">
              <input
                type="text"
                placeholder="Enter category name..."
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
              />
              <button 
                type="button" 
                className="btn-primary"
                onClick={handleAddCategory}
                disabled={!newCategory.trim()}
              >
                Add
              </button>
            </div>
          </div>

          <div className="category-list">
            <h3>Existing Categories</h3>
            {categoryList.length === 0 ? (
              <p className="no-categories">No categories found. Add your first category above.</p>
            ) : (
              <div className="category-items">
                {categoryList.map((category) => (
                  <div key={category.id} className="category-item">
                    {editingCategory === category.id ? (
                      <div className="category-edit-group">
                        <input
                          type="text"
                          defaultValue={category.name}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleEditCategory(category.id, e.target.value);
                            }
                          }}
                          onBlur={(e) => handleEditCategory(category.id, e.target.value)}
                          autoFocus
                        />
                        <button 
                          className="btn-cancel"
                          onClick={() => setEditingCategory(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="category-display">
                        <span className="category-name">{category.name}</span>
                        <div className="category-actions">
                          <button 
                            className="btn-edit"
                            onClick={() => setEditingCategory(category.id)}
                          >
                            ✏️
                          </button>
                          <button 
                            className="btn-delete"
                            onClick={() => handleDeleteCategory(category.id)}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button 
              type="button" 
              className="btn-secondary"
              onClick={() => {
                setShowCategoryModal(false);
                setNewCategory('');
                setEditingCategory(null);
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const filteredAndSortedItems = items
    .filter(item => {
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesSearch = searchTerm === '' || 
                           item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Debug logging
      if (searchTerm) {
        console.log('Search term:', searchTerm);
        console.log('Item name:', item.name);
        console.log('Matches search:', matchesSearch);
      }
      
      return matchesCategory && matchesSearch;
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStockStatus = (stock) => {
    if (stock === 0) return { status: 'out-of-stock', text: 'Out of Stock' };
    if (stock <= 10) return { status: 'low-stock', text: 'Low Stock' };
    return { status: 'in-stock', text: 'In Stock' };
  };

  const renderItemCard = (item) => (
    <div key={item.id} className="item-card">
      <div className="item-image">
        {item.image ? (
          <img src={item.image} alt={item.name} />
        ) : (
          <div className="placeholder-image">📦</div>
        )}
        <div className="item-actions">
          <button className="action-btn edit" onClick={() => openEditModal(item)}>
            ✏️
          </button>
          <button className="action-btn delete" onClick={() => handleDeleteItem(item.id)}>
            🗑️
          </button>
        </div>
      </div>
      <div className="item-info">
        <h3 className="item-name">{item.name}</h3>
        <p className="item-category">{item.category}</p>
        {item.sku && <p className="item-sku">SKU: {item.sku}</p>}
        <div className="item-price">{formatCurrency(item.price)}</div>
        <div className={`stock-status ${getStockStatus(item.stock).status}`}>
          <span className="stock-indicator"></span>
          {getStockStatus(item.stock).text} ({item.stock})
        </div>
      </div>
    </div>
  );

  const renderItemRow = (item) => (
    <tr key={item.id} className="item-row">
      <td>
        <div className="item-cell">
          {item.image ? (
            <img src={item.image} alt={item.name} className="item-thumbnail" />
          ) : (
            <div className="placeholder-thumbnail">📦</div>
          )}
          <div>
            <div className="item-name">{item.name}</div>
            {item.sku && <div className="item-sku">SKU: {item.sku}</div>}
          </div>
        </div>
      </td>
      <td>{item.category}</td>
      <td>{formatCurrency(item.price)}</td>
      <td>
        <div className={`stock-status ${getStockStatus(item.stock).status}`}>
          <span className="stock-indicator"></span>
          {item.stock}
        </div>
      </td>
      <td>
        <span className={`status-badge ${item.status}`}>
          {item.status}
        </span>
      </td>
      <td>
        <div className="table-actions">
          <button className="action-btn edit" onClick={() => openEditModal(item)}>
            ✏️
          </button>
          <button className="action-btn delete" onClick={() => handleDeleteItem(item.id)}>
            🗑️
          </button>
        </div>
      </td>
    </tr>
  );

  const renderModal = (isEdit = false) => {
    const currentItem = isEdit ? editingItem : newItem;
    const setCurrentItem = isEdit ? setEditingItem : setNewItem;
    const handleSubmit = isEdit ? handleEditItem : handleAddItem;
    const title = isEdit ? 'Edit Item' : 'Add New Item';

    return (
      <div className="modal-overlay">
        <div className="modal">
          <div className="modal-header">
            <h2>{title}</h2>
            <button 
              className="close-btn" 
              onClick={() => isEdit ? setShowEditModal(false) : setShowAddModal(false)}
            >
              ✕
            </button>
          </div>
          <form onSubmit={handleSubmit} className="modal-form">
            <div className="form-row">
              <div className="form-group">
                <label>Item Name *</label>
                <input
                  type="text"
                  value={currentItem.name}
                  onChange={(e) => setCurrentItem({...currentItem, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Category *</label>
                <select
                  value={currentItem.category}
                  onChange={(e) => setCurrentItem({...currentItem, category: e.target.value})}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.filter(cat => cat !== 'All').map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Price *</label>
                <input
                  type="number"
                  step="0.01"
                  value={currentItem.price}
                  onChange={(e) => setCurrentItem({...currentItem, price: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Stock Quantity *</label>
                <input
                  type="number"
                  value={currentItem.stock}
                  onChange={(e) => setCurrentItem({...currentItem, stock: e.target.value})}
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Status</label>
                <select
                  value={currentItem.status}
                  onChange={(e) => setCurrentItem({...currentItem, status: e.target.value})}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={currentItem.description}
                onChange={(e) => setCurrentItem({...currentItem, description: e.target.value})}
                rows="3"
              />
            </div>
            <div className="form-group">
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
                        setNewItem(prev => ({ ...prev, image: '' }));
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
            <div className="modal-actions">
              <button 
                type="button" 
                className="btn-secondary"
                onClick={() => isEdit ? setShowEditModal(false) : setShowAddModal(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                {isEdit ? 'Update Item' : 'Add Item'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="items-container">
      <div className="items-header">
        <div className="header-content">
          <h1>📦 Items Management</h1>
          <p>Manage your inventory items and product catalog</p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={() => setShowCategoryModal(true)}>
            🏷️ Categories
          </button>
          <button className="btn-secondary" onClick={() => setShowImportModal(true)}>
            📥 Import Items
          </button>
          <button className="btn-primary" onClick={() => setShowAddModal(true)}>
            ➕ Add New Item
          </button>
        </div>
      </div>

      <div className="items-controls">
        <div className="search-filter-section">
          <div className="filter-controls">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="category-filter"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
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
              <option value="price-asc">Price (Low-High)</option>
              <option value="price-desc">Price (High-Low)</option>
              <option value="stock-asc">Stock (Low-High)</option>
              <option value="stock-desc">Stock (High-Low)</option>
            </select>
          </div>
        </div>

        <div className="view-controls">
          <button
            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
          >
            ⊞ Grid
          </button>
          <button
            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            ☰ List
          </button>
          <button
            className={`view-btn ${viewMode === 'search' ? 'active' : ''}`}
            onClick={() => setViewMode('search')}
          >
            🔍 Search
          </button>
        </div>
      </div>

      <div className="items-stats">
        <div className="stat-card">
          <div className="stat-value">{items.length}</div>
          <div className="stat-label">Total Items</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{items.filter(item => item.stock > 0).length}</div>
          <div className="stat-label">In Stock</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{items.filter(item => item.stock === 0).length}</div>
          <div className="stat-label">Out of Stock</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{items.filter(item => item.stock <= 10 && item.stock > 0).length}</div>
          <div className="stat-label">Low Stock</div>
        </div>
      </div>

      <div className="items-content">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading items...</p>
          </div>
        ) : (
          <>
            {viewMode === 'search' ? (
              <div className="search-view">
                <div className="search-container">
                  <div className="search-box">
                    <input
                      type="text"
                      placeholder="Search items by name, category, or SKU..."
                      value={searchTerm}
                      onChange={(e) => {
                        console.log('Search input changed:', e.target.value);
                        setSearchTerm(e.target.value);
                      }}
                    />
                    <span className="search-icon">🔍</span>
                  </div>
                </div>
                <div className="search-results">
                  {filteredAndSortedItems.length > 0 ? (
                    <div className="items-grid">
                      {filteredAndSortedItems.map(renderItemCard)}
                    </div>
                  ) : (
                    <div className="no-results">
                      <div className="no-results-icon">🔍</div>
                      <h3>No items found</h3>
                      <p>Try adjusting your search terms</p>
                    </div>
                  )}
                </div>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="items-grid">
                {filteredAndSortedItems.map(renderItemCard)}
              </div>
            ) : (
              <div className="items-table-container">
                <table className="items-table">
                  <thead>
                    <tr>
                      <th onClick={() => handleSort('name')}>
                        Item {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th onClick={() => handleSort('category')}>
                        Category {sortBy === 'category' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th onClick={() => handleSort('price')}>
                        Price {sortBy === 'price' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th onClick={() => handleSort('stock')}>
                        Stock {sortBy === 'stock' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndSortedItems.map(renderItemRow)}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {filteredAndSortedItems.length === 0 && !loading && (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <h3>No items found</h3>
            <p>Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>

      {showAddModal && renderModal(false)}
      {showEditModal && renderModal(true)}
      {showImportModal && renderImportModal()}
      {showCategoryModal && renderCategoryModal()}
    </div>
  );
};

export default Items;