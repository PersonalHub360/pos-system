import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AddProduct.css';

const AddProduct = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    productName: '',
    selectedSupplier: '',
    newSupplierName: '',
    newSupplierPhone: '',
    price: '',
    category: '',
    unitCategory: '',
    description: '',
    initialStock: '',
    reorderLevel: '',
    barcode: ''
  });

  const [showNewSupplierForm, setShowNewSupplierForm] = useState(false);
  const [errors, setErrors] = useState({});

  // Predefined suppliers (in real app, this would come from database)
  const existingSuppliers = [
    { id: 1, name: 'ABC Wholesale Ltd', phone: '+1-555-0123' },
    { id: 2, name: 'Global Supply Co', phone: '+1-555-0456' },
    { id: 3, name: 'Metro Distributors', phone: '+1-555-0789' },
    { id: 4, name: 'Prime Suppliers Inc', phone: '+1-555-0321' }
  ];

  // Product categories
  const productCategories = [
    'Food & Beverages',
    'Electronics',
    'Clothing & Apparel',
    'Home & Garden',
    'Health & Beauty',
    'Sports & Outdoors',
    'Books & Media',
    'Toys & Games',
    'Automotive',
    'Office Supplies',
    'Pet Supplies',
    'Jewelry & Accessories'
  ];

  // Unit categories
  const unitCategories = [
    { value: 'pieces', label: 'Pieces (pcs)' },
    { value: 'kg', label: 'Kilogram (kg)' },
    { value: 'g', label: 'Gram (g)' },
    { value: 'litre', label: 'Litre (L)' },
    { value: 'ml', label: 'Millilitre (ml)' },
    { value: 'box', label: 'Box' },
    { value: 'pack', label: 'Pack' },
    { value: 'bottle', label: 'Bottle' },
    { value: 'can', label: 'Can' },
    { value: 'bag', label: 'Bag' },
    { value: 'dozen', label: 'Dozen' },
    { value: 'meter', label: 'Meter (m)' },
    { value: 'cm', label: 'Centimeter (cm)' },
    { value: 'inch', label: 'Inch' },
    { value: 'roll', label: 'Roll' },
    { value: 'sheet', label: 'Sheet' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSupplierChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      selectedSupplier: value
    }));
    
    if (value === 'new') {
      setShowNewSupplierForm(true);
    } else {
      setShowNewSupplierForm(false);
      setFormData(prev => ({
        ...prev,
        newSupplierName: '',
        newSupplierPhone: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.productName.trim()) {
      newErrors.productName = 'Product name is required';
    }

    if (!formData.selectedSupplier) {
      newErrors.selectedSupplier = 'Please select a supplier';
    }

    if (showNewSupplierForm) {
      if (!formData.newSupplierName.trim()) {
        newErrors.newSupplierName = 'Supplier name is required';
      }
      if (!formData.newSupplierPhone.trim()) {
        newErrors.newSupplierPhone = 'Supplier phone is required';
      }
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Valid price is required';
    }

    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }

    if (!formData.unitCategory) {
      newErrors.unitCategory = 'Please select a unit category';
    }

    if (!formData.initialStock || parseInt(formData.initialStock) < 0) {
      newErrors.initialStock = 'Valid initial stock is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // In real app, this would send data to backend
      const productData = {
        ...formData,
        supplier: showNewSupplierForm 
          ? { name: formData.newSupplierName, phone: formData.newSupplierPhone }
          : existingSuppliers.find(s => s.id === parseInt(formData.selectedSupplier)),
        createdAt: new Date().toISOString()
      };

      console.log('Product data to save:', productData);
      
      alert(`Product "${formData.productName}" has been successfully added!\n\nDetails:\n- Price: $${formData.price}\n- Category: ${formData.category}\n- Unit: ${unitCategories.find(u => u.value === formData.unitCategory)?.label}\n- Initial Stock: ${formData.initialStock}\n\nNote: This is a demo - actual implementation would save to database.`);
      
      // Navigate back to Stock Information
      navigate('/stock-information');
    }
  };

  const handleCancel = () => {
    navigate('/stock-information');
  };

  return (
    <div className="add-product-container">
      <div className="add-product-header">
        <div className="header-content">
          <button className="back-btn" onClick={handleCancel}>
            ← Back to Stock Information
          </button>
          <h1>➕ Add New Product</h1>
          <p>Create a new product entry with complete details</p>
        </div>
      </div>

      <div className="add-product-form-container">
        <form onSubmit={handleSubmit} className="add-product-form">
          {/* Product Information Section */}
          <div className="form-section">
            <h3>📦 Product Information</h3>
            
            <div className="form-group">
              <label htmlFor="productName">Product Name *</label>
              <input
                type="text"
                id="productName"
                name="productName"
                value={formData.productName}
                onChange={handleInputChange}
                placeholder="Enter product name"
                className={errors.productName ? 'error' : ''}
              />
              {errors.productName && <span className="error-message">{errors.productName}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category">Category *</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className={errors.category ? 'error' : ''}
                >
                  <option value="">Select Category</option>
                  {productCategories.map((cat, index) => (
                    <option key={index} value={cat}>{cat}</option>
                  ))}
                </select>
                {errors.category && <span className="error-message">{errors.category}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="unitCategory">Unit Category *</label>
                <select
                  id="unitCategory"
                  name="unitCategory"
                  value={formData.unitCategory}
                  onChange={handleInputChange}
                  className={errors.unitCategory ? 'error' : ''}
                >
                  <option value="">Select Unit</option>
                  {unitCategories.map((unit) => (
                    <option key={unit.value} value={unit.value}>{unit.label}</option>
                  ))}
                </select>
                {errors.unitCategory && <span className="error-message">{errors.unitCategory}</span>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter product description (optional)"
                rows="3"
              />
            </div>

            <div className="form-group">
              <label htmlFor="barcode">Barcode</label>
              <input
                type="text"
                id="barcode"
                name="barcode"
                value={formData.barcode}
                onChange={handleInputChange}
                placeholder="Enter barcode (optional)"
              />
            </div>
          </div>

          {/* Supplier Information Section */}
          <div className="form-section">
            <h3>🏢 Supplier Information</h3>
            
            <div className="form-group">
              <label htmlFor="selectedSupplier">Select Supplier *</label>
              <select
                id="selectedSupplier"
                name="selectedSupplier"
                value={formData.selectedSupplier}
                onChange={handleSupplierChange}
                className={errors.selectedSupplier ? 'error' : ''}
              >
                <option value="">Choose Supplier</option>
                {existingSuppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name} - {supplier.phone}
                  </option>
                ))}
                <option value="new">+ Add New Supplier</option>
              </select>
              {errors.selectedSupplier && <span className="error-message">{errors.selectedSupplier}</span>}
            </div>

            {showNewSupplierForm && (
              <div className="new-supplier-form">
                <h4>New Supplier Details</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="newSupplierName">Supplier Name *</label>
                    <input
                      type="text"
                      id="newSupplierName"
                      name="newSupplierName"
                      value={formData.newSupplierName}
                      onChange={handleInputChange}
                      placeholder="Enter supplier name"
                      className={errors.newSupplierName ? 'error' : ''}
                    />
                    {errors.newSupplierName && <span className="error-message">{errors.newSupplierName}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="newSupplierPhone">Phone Number *</label>
                    <input
                      type="tel"
                      id="newSupplierPhone"
                      name="newSupplierPhone"
                      value={formData.newSupplierPhone}
                      onChange={handleInputChange}
                      placeholder="Enter phone number"
                      className={errors.newSupplierPhone ? 'error' : ''}
                    />
                    {errors.newSupplierPhone && <span className="error-message">{errors.newSupplierPhone}</span>}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Pricing & Stock Section */}
          <div className="form-section">
            <h3>💰 Pricing & Stock</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="price">Price *</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className={errors.price ? 'error' : ''}
                />
                {errors.price && <span className="error-message">{errors.price}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="initialStock">Initial Stock *</label>
                <input
                  type="number"
                  id="initialStock"
                  name="initialStock"
                  value={formData.initialStock}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                  className={errors.initialStock ? 'error' : ''}
                />
                {errors.initialStock && <span className="error-message">{errors.initialStock}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="reorderLevel">Reorder Level</label>
                <input
                  type="number"
                  id="reorderLevel"
                  name="reorderLevel"
                  value={formData.reorderLevel}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={handleCancel}>
              Cancel
            </button>
            <button type="submit" className="btn-submit">
              Add Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;