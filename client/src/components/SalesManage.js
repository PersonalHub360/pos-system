import React, { useState, useEffect } from 'react';
import './SalesManage.css';
import salesService from '../services/salesService';

const SalesManage = () => {
  const [currentView, setCurrentView] = useState('add-sales');
  const [loading, setLoading] = useState(false);
  const [salesData, setSalesData] = useState([]);
  const [discountPlans, setDiscountPlans] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [editingSaleId, setEditingSaleId] = useState(null); // Add editing state

  // Add Sales form state
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    items: [{ product: '', quantity: 1, unit: 'pieces', price: 0, supplier: '' }],
    discount: 0,
    tax: 0,
    notes: ''
  });

  // Discount Plan form state
  const [discountFormData, setDiscountFormData] = useState({
    name: '',
    type: 'percentage',
    value: 0,
    minAmount: 0,
    description: '',
    validFrom: '',
    validTo: ''
  });

  // Import Sale state
  const [importFile, setImportFile] = useState(null);
  const [importProgress, setImportProgress] = useState(0);

  // Discount Plan form visibility state
  const [showDiscountForm, setShowDiscountForm] = useState(false);

  // Import Sale drag and drop state
  const [dragActive, setDragActive] = useState(false);

  // Load initial data
  useEffect(() => {
    loadSalesData();
    loadDiscountPlans();
    loadProducts();
    loadCustomers();
  }, []);

  const loadSalesData = async () => {
    try {
      setLoading(true);
      // Align with server's public orders endpoint to ensure sales list populates
      const response = await fetch('http://localhost:5000/api/orders');
      if (response.ok) {
        const orders = await response.json();
        // Transform orders into the shape expected by the Sales List UI
        const transformed = Array.isArray(orders) ? orders.map(o => ({
          id: o.id,
          invoice_number: o.order_number,
          customer_name: o.customer_name || 'Walk-in Customer',
          created_at: o.created_at,
          total_amount: parseFloat(o.total) || 0,
          // Support both "status" and "order_status" usages in UI
          status: o.status || 'pending',
          order_status: o.status || 'pending'
        })) : [];
        setSalesData(transformed);
      } else {
        console.error('Failed to load orders for sales list:', response.status);
        setSalesData([]);
      }
    } catch (error) {
      console.error('Error loading sales data:', error);
      // Keep empty array as fallback
      setSalesData([]);
    } finally {
      setLoading(false);
    }
  };

  const loadDiscountPlans = async () => {
    try {
      const response = await salesService.getDiscountPlans();
      setDiscountPlans(response.plans || []);
    } catch (error) {
      console.error('Error loading discount plans:', error);
      // Keep empty array as fallback
      setDiscountPlans([]);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await salesService.getProducts();
      setProducts(response || []);
    } catch (error) {
      console.error('Error loading products:', error);
      setProducts([]);
    }
  };

  // Action handlers for sales list
  const handleViewSale = async (saleId) => {
    try {
      const sale = await salesService.getSaleById(saleId);
      // For now, just show an alert with sale details
      alert(`Sale Details:\nInvoice: ${sale.invoice_number}\nCustomer: ${sale.customer_name}\nTotal: $${sale.total_amount}`);
    } catch (error) {
      console.error('Error viewing sale:', error);
      alert('Error loading sale details: ' + error.message);
    }
  };

  const handleEditSale = async (saleId) => {
    try {
      const sale = await salesService.getSaleById(saleId);
      
      // Set form data with the sale information
      setFormData({
        customerName: sale.customer_name || '',
        customerPhone: sale.customer_phone || '',
        customerEmail: sale.customer_email || '',
        paymentMethod: sale.payment_method || 'Cash',
        items: sale.items && sale.items.length > 0 ? sale.items.map(item => ({
          product: item.product_name || item.name || '',
          quantity: item.quantity || 1,
          unit: item.unit || 'pieces',
          price: parseFloat(item.price) || 0,
          supplier: item.supplier || ''
        })) : [{ product: '', quantity: 1, unit: 'pieces', price: 0, supplier: '' }],
        discount: parseFloat(sale.discount) || 0,
        tax: parseFloat(sale.tax) || 0,
        notes: sale.notes || ''
      });
      
      setEditingSaleId(saleId);
      setCurrentView('add-sales');
    } catch (error) {
      console.error('Error loading sale for edit:', error);
      alert('Error loading sale data: ' + error.message);
    }
  };

  const handlePrintSale = async (saleId) => {
    try {
      const sale = await salesService.getSaleById(saleId);
      // Simple print functionality - open a new window with sale details
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head><title>Invoice ${sale.invoice_number}</title></head>
          <body>
            <h2>Invoice ${sale.invoice_number}</h2>
            <p>Customer: ${sale.customer_name}</p>
            <p>Date: ${sale.created_at}</p>
            <p>Total: $${sale.total_amount}</p>
            <script>window.print(); window.close();</script>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('Error printing sale:', error);
      alert('Error printing sale: ' + error.message);
    }
  };

  const handleDeleteSale = async (saleId) => {
    if (window.confirm('Are you sure you want to delete this sale?')) {
      try {
        await salesService.deleteSale(saleId);
        setSalesData(prev => prev.filter(sale => sale.id !== saleId));
        alert('Sale deleted successfully!');
      } catch (error) {
        console.error('Error deleting sale:', error);
        alert('Error deleting sale: ' + error.message);
      }
    }
  };

  const loadCustomers = async () => {
    try {
      const response = await salesService.getCustomers();
      setCustomers(response || []);
    } catch (error) {
      console.error('Error loading customers:', error);
      setCustomers([]);
    }
  };

  const renderAddSales = () => {
    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    };

    const addItem = () => {
      setFormData(prev => ({
        ...prev,
        items: [...prev.items, { product: '', quantity: 1, unit: 'pieces', price: 0, supplier: '' }]
      }));
    };

    const removeItem = (index) => {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    };

    const updateItem = (index, field, value) => {
      setFormData(prev => ({
        ...prev,
        items: prev.items.map((item, i) => 
          i === index ? { ...item, [field]: value } : item
        )
      }));
    };

    const calculateTotal = () => {
      const subtotal = formData.items.reduce((sum, item) => 
        sum + (item.quantity * item.price), 0
      );
      const discountAmount = (subtotal * formData.discount) / 100;
      const taxAmount = ((subtotal - discountAmount) * formData.tax) / 100;
      return subtotal - discountAmount + taxAmount;
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      
      try {
        // Validate required fields
        if (!formData.customerName.trim()) {
          alert('Customer name is required');
          setLoading(false);
          return;
        }

        // Validate items
        const validItems = formData.items.filter(item => item.product && item.quantity > 0);
        if (validItems.length === 0) {
          alert('At least one item with product and quantity is required');
          setLoading(false);
          return;
        }

        // Check if all items have required fields
        for (let item of validItems) {
          if (!item.product.trim()) {
            alert('Product name is required for all items');
            setLoading(false);
            return;
          }
          if (item.quantity <= 0) {
            alert('Quantity must be greater than 0 for all items');
            setLoading(false);
            return;
          }
          if (item.price <= 0) {
            alert('Unit price must be greater than 0 for all items');
            setLoading(false);
            return;
          }
        }
        
        // Prepare sale data for API
        const saleData = {
          customer_name: formData.customerName,
          customer_phone: formData.customerPhone,
          customer_email: formData.customerEmail,
          items: validItems.map(item => ({
            product_name: item.product,
            quantity: item.quantity,
            unit: item.unit,
            price: item.price,
            supplier: item.supplier
          })),
          discount_percentage: formData.discount,
          tax_percentage: formData.tax,
          notes: formData.notes,
          payment_method: formData.paymentMethod || 'cash',
          status: 'completed'
        };

        if (editingSaleId) {
          // Update existing sale
          const response = await salesService.updateSale(editingSaleId, saleData);
          
          // Update the sale in the local state
          setSalesData(prev => prev.map(sale => 
            sale.id === editingSaleId ? response.sale : sale
          ));
          
          alert('Sale updated successfully!');
          setEditingSaleId(null);
        } else {
          // Create new sale
          const response = await salesService.createSale(saleData);
          
          // Add the new sale to the local state
          setSalesData(prev => [response.sale, ...prev]);
          
          alert('Sale added successfully!');
        }
        
        // Reset form
        setFormData({
          customerName: '',
          customerPhone: '',
          customerEmail: '',
          items: [{ product: '', quantity: 1, unit: 'pieces', price: 0, supplier: '' }],
          discount: 0,
          tax: 0,
          notes: ''
        });
        
        // Navigate back to sales list
        setCurrentView('sales-list');
      } catch (error) {
        console.error('Error creating sale:', error);
        alert('Error creating sale: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="add-sales-form">
        <h3>{editingSaleId ? 'Edit Sale' : 'Add New Sale'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Customer Name *</label>
              <input
                type="text"
                name="customerName"
                value={formData.customerName}
                onChange={handleInputChange}
                list="customers-list"
                required
              />
              <datalist id="customers-list">
                {Array.isArray(customers) && customers.map(customer => (
                  <option key={customer.id} value={customer.name} />
                ))}
              </datalist>
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                name="customerPhone"
                value={formData.customerPhone}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="customerEmail"
                value={formData.customerEmail}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="items-section">
            <div className="section-header">
              <h4>Items</h4>
              <button type="button" onClick={addItem} className="add-item-btn">
                ➕ Add Item
              </button>
            </div>
            
            {formData.items.map((item, index) => (
              <div key={index} className="item-row">
                <div className="form-group">
                  <label>Product</label>
                  <select
                    value={item.product}
                    onChange={(e) => {
                      const selectedProduct = products.find(p => p.name === e.target.value);
                      updateItem(index, 'product', e.target.value);
                      if (selectedProduct) {
                        updateItem(index, 'price', selectedProduct.price);
                      }
                    }}
                  >
                    <option value="">Select Product</option>
                    {Array.isArray(products) && products.map(product => (
                      <option key={product.id} value={product.name}>
                        {product.name} - ${product.price}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Quantity</label>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                    min="1"
                  />
                </div>
                <div className="form-group">
                  <label>Unit</label>
                  <select
                    value={item.unit}
                    onChange={(e) => updateItem(index, 'unit', e.target.value)}
                  >
                    <option value="pieces">Pieces</option>
                    <option value="kg">Kg</option>
                    <option value="kl">KL</option>
                    <option value="box">Box</option>
                    <option value="liter">Liter</option>
                    <option value="gram">Gram</option>
                    <option value="dozen">Dozen</option>
                    <option value="pack">Pack</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Unit Price</label>
                  <input
                    type="number"
                    value={item.price}
                    onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)}
                    step="0.01"
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>Supplier</label>
                  <input
                    type="text"
                    value={item.supplier}
                    onChange={(e) => updateItem(index, 'supplier', e.target.value)}
                    placeholder="Supplier name"
                  />
                </div>
                <div className="form-group">
                  <label>Total Price</label>
                  <input
                    type="text"
                    value={`$${(item.quantity * item.price).toFixed(2)}`}
                    readOnly
                    className="readonly"
                  />
                </div>
                {formData.items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="remove-item-btn"
                  >
                    ❌
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Discount (%)</label>
              <input
                type="number"
                name="discount"
                value={formData.discount}
                onChange={handleInputChange}
                min="0"
                max="100"
                step="0.1"
              />
            </div>
            <div className="form-group">
              <label>Tax (%)</label>
              <input
                type="number"
                name="tax"
                value={formData.tax}
                onChange={handleInputChange}
                min="0"
                max="100"
                step="0.1"
              />
            </div>
            <div className="form-group">
              <label>Total Amount</label>
              <input
                type="text"
                value={`$${calculateTotal().toFixed(2)}`}
                readOnly
                className="readonly total-amount"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows="3"
              placeholder="Additional notes..."
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Processing...' : (editingSaleId ? '💾 Update Sale' : '💾 Save Sale')}
            </button>
            <button type="button" className="cancel-btn" onClick={() => {
              setFormData({
                customerName: '',
                customerPhone: '',
                customerEmail: '',
                items: [{ product: '', quantity: 1, unit: 'pieces', price: 0, supplier: '' }],
                discount: 0,
                tax: 0,
                notes: ''
              });
              setEditingSaleId(null);
              setCurrentView('sales-list');
            }}>
              {editingSaleId ? '❌ Cancel Edit' : '🔄 Reset'}
            </button>
          </div>
        </form>
      </div>
    );
  };

  const renderSalesList = () => {
    return (
      <div className="sales-list">
        <div className="list-header">
          <h3>Sales List</h3>
          <div className="list-actions">
            <input
              type="text"
              placeholder="Search sales..."
              className="search-input"
            />
            <select className="filter-select">
              <option value="">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="sales-table">
          <table>
            <thead>
              <tr>
                <th>Invoice No</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {salesData.map(sale => (
                <tr key={sale.id}>
                  <td>{sale.invoice_number || sale.invoiceNo}</td>
                  <td>{sale.customer_name || sale.customerName}</td>
                  <td>{new Date(sale.created_at || sale.date).toLocaleDateString()}</td>
                  <td>${(sale.total_amount || sale.total).toFixed(2)}</td>
                  <td>
                    <span className={`status ${(sale.status || 'completed').toLowerCase()}`}>
                      {sale.status || 'Completed'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="view-btn" onClick={() => handleViewSale(sale.id)}>👁️</button>
                      <button className="edit-btn" onClick={() => handleEditSale(sale.id)}>✏️</button>
                      <button className="print-btn" onClick={() => handlePrintSale(sale.id)}>🖨️</button>
                      <button className="delete-btn" onClick={() => handleDeleteSale(sale.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderDiscountPlan = () => {
    const handleDiscountFormChange = (e) => {
      const { name, value } = e.target;
      setDiscountFormData(prev => ({
        ...prev,
        [name]: value
      }));
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      
      try {
        const newPlan = {
          name: discountFormData.name,
          description: discountFormData.description,
          discount_type: discountFormData.type,
          discount_value: discountFormData.value,
          min_order_amount: discountFormData.minAmount,
          valid_from: discountFormData.validFrom,
          valid_to: discountFormData.validTo,
          status: 'active'
        };

        const response = await salesService.createDiscountPlan(newPlan);
        
        // Add to local state
        setDiscountPlans(prev => [response.plan, ...prev]);
        
        // Reset form
        setDiscountFormData({
          name: '',
          type: 'percentage',
          value: 0,
          minAmount: 0,
          description: '',
          validFrom: '',
          validTo: ''
        });
        
        setShowDiscountForm(false);
        alert('Discount plan created successfully!');
      } catch (error) {
        console.error('Error creating discount plan:', error);
        alert('Error creating discount plan: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="discount-plan">
        <div className="plan-header">
          <h3>Sales Discount Plans</h3>
          <button 
            className="add-plan-btn"
            onClick={() => setShowDiscountForm(!showDiscountForm)}
          >
            ➕ Add New Plan
          </button>
        </div>

        {showDiscountForm && (
          <div className="discount-form">
            <h4>Create Discount Plan</h4>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Plan Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={discountFormData.name}
                    onChange={handleDiscountFormChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Discount Type</label>
                  <select
                    name="type"
                    value={discountFormData.type}
                    onChange={handleDiscountFormChange}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount ($)</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Discount Value</label>
                  <input
                    type="number"
                    name="value"
                    value={discountFormData.value}
                    onChange={handleDiscountFormChange}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="form-group">
                  <label>Minimum Amount ($)</label>
                  <input
                    type="number"
                    name="minAmount"
                    value={discountFormData.minAmount}
                    onChange={handleDiscountFormChange}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="submit-btn">💾 Save Plan</button>
                <button type="button" className="cancel-btn" onClick={() => setShowDiscountForm(false)}>❌ Cancel</button>
              </div>
            </form>
          </div>
        )}

        <div className="plans-table">
          <table>
            <thead>
              <tr>
                <th>Plan Name</th>
                <th>Type</th>
                <th>Value</th>
                <th>Min Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {discountPlans.map(plan => (
                <tr key={plan.id}>
                  <td>{plan.name}</td>
                  <td>{plan.type === 'percentage' ? 'Percentage' : 'Fixed Amount'}</td>
                  <td>
                    {plan.type === 'percentage' ? `${plan.value}%` : `$${plan.value}`}
                  </td>
                  <td>${plan.minAmount}</td>
                  <td>
                    <span className={`status ${plan.status.toLowerCase()}`}>
                      {plan.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="edit-btn">✏️</button>
                      <button className="delete-btn">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderImportSale = () => {
    const handleDrag = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.type === "dragenter" || e.type === "dragover") {
        setDragActive(true);
      } else if (e.type === "dragleave") {
        setDragActive(false);
      }
    };

    const handleDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        setImportFile(e.dataTransfer.files[0]);
      }
    };

    const handleFileChange = (e) => {
      if (e.target.files && e.target.files[0]) {
        setImportFile(e.target.files[0]);
      }
    };

    const handleImport = async () => {
      if (!importFile) {
        alert('Please select a file to import');
        return;
      }

      setLoading(true);
      setImportProgress(0);

      try {
        const response = await salesService.importSalesData(importFile);
        
        // Simulate progress for better UX
        const interval = setInterval(() => {
          setImportProgress(prev => {
            if (prev >= 90) {
              clearInterval(interval);
              return 90;
            }
            return prev + 10;
          });
        }, 100);

        // Complete the progress and show success
        setTimeout(() => {
          setImportProgress(100);
          setLoading(false);
          setImportFile(null);
          
          // Reload sales data to show imported sales
          loadSalesData();
          
          alert(`Import completed successfully! Imported ${response.imported_count || 0} sales.`);
        }, 1000);

      } catch (error) {
        console.error('Error importing sales data:', error);
        setLoading(false);
        setImportProgress(0);
        alert('Error importing sales data: ' + error.message);
      }
    };

    return (
      <div className="import-sale">
        <h3>Import Sales Data</h3>
        
        <div className="import-instructions">
          <h4>📋 Instructions</h4>
          <ul>
            <li>Upload a CSV file with sales data</li>
            <li>Required columns: Customer Name, Date, Total, Items</li>
            <li>Optional columns: Phone, Email, Notes</li>
            <li>Maximum file size: 10MB</li>
          </ul>
        </div>

        <div 
          className={`file-upload-area ${dragActive ? 'drag-active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="upload-content">
            <div className="upload-icon">📁</div>
            <p>Drag and drop your CSV file here, or</p>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              id="file-input"
            />
            <label htmlFor="file-input" className="upload-btn">
              Choose File
            </label>
          </div>
        </div>

        {importFile && (
          <div className="file-info">
            <div className="file-details">
              <span className="file-name">📄 {importFile.name}</span>
              <span className="file-size">({(importFile.size / 1024).toFixed(2)} KB)</span>
            </div>
            <button 
              className="remove-file-btn"
              onClick={() => setImportFile(null)}
            >
              ❌
            </button>
          </div>
        )}

        <div className="import-actions">
          <button 
            className="import-btn"
            onClick={handleImport}
            disabled={!importFile || loading}
          >
            {loading ? 'Importing...' : '📥 Import Sales'}
          </button>
          <button className="template-btn" onClick={async () => {
            try {
              await salesService.downloadTemplate();
            } catch (error) {
              console.error('Error downloading template:', error);
              alert('Error downloading template: ' + error.message);
            }
          }}>
            📄 Download Template
          </button>
        </div>

        <div className="import-history">
          <h4>Recent Imports</h4>
          <div className="history-list">
            <div className="history-item">
              <span>sales_data_2024.csv</span>
              <span>Jan 15, 2024</span>
              <span className="success">✅ Success</span>
            </div>
            <div className="history-item">
              <span>monthly_sales.xlsx</span>
              <span>Jan 10, 2024</span>
              <span className="success">✅ Success</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (currentView) {
      case 'add-sales':
        return renderAddSales();
      case 'sales-list':
        return renderSalesList();
      case 'sales-discount-plan':
        return renderDiscountPlan();
      case 'import-sale':
        return renderImportSale();
      default:
        return renderAddSales();
    }
  };

  return (
    <div className="sales-manage">
      <div className="sales-manage-header">
        <h2>💰 Sales Management</h2>
        <p>Manage your sales, discounts, and import data</p>
      </div>

      <div className="sales-manage-nav">
        <button
          className={`nav-tab ${currentView === 'add-sales' ? 'active' : ''}`}
          onClick={() => setCurrentView('add-sales')}
        >
          ➕ Add Sales
        </button>
        <button
          className={`nav-tab ${currentView === 'sales-list' ? 'active' : ''}`}
          onClick={() => setCurrentView('sales-list')}
        >
          📋 Sales List
        </button>
        <button
          className={`nav-tab ${currentView === 'sales-discount-plan' ? 'active' : ''}`}
          onClick={() => setCurrentView('sales-discount-plan')}
        >
          🏷️ Discount Plans
        </button>
        <button
          className={`nav-tab ${currentView === 'import-sale' ? 'active' : ''}`}
          onClick={() => setCurrentView('import-sale')}
        >
          📥 Import Sales
        </button>
      </div>

      <div className="sales-manage-content">
        {renderContent()}
      </div>
    </div>
  );
};

export default SalesManage;