import React, { useState, useEffect } from 'react';
import './SalesManagement.css';

const SalesManagement = () => {
  const [activeSection, setActiveSection] = useState('list');
  const [sales, setSales] = useState([]);
  const [selectedSale, setSelectedSale] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'add', 'edit', 'view', 'delete'
  const [dropdownOpen, setDropdownOpen] = useState(null); // Track which dropdown is open
  
  // Form state for add/edit sale
  const [formData, setFormData] = useState({
    customer: '',
    paymentMethod: 'Cash',
    items: [{ name: '', quantity: 1, price: 0 }],
    discount: 0,
    taxRate: 10 // 10% tax rate
  });

  // Sample sales data
  const sampleSales = [
    {
      id: 1,
      date: '2024-01-15',
      time: '14:30',
      customer: 'John Doe',
      biller: 'Admin User',
      items: [
        { name: 'Coffee', quantity: 2, price: 5.00 },
        { name: 'Sandwich', quantity: 1, price: 8.50 }
      ],
      subtotal: 18.50,
      tax: 1.85,
      total: 20.35,
      grandTotal: 20.35,
      returnedAmount: 0.00,
      paidAmount: 20.35,
      dueAmount: 0.00,
      paymentMethod: 'Card',
      status: 'Completed',
      saleStatus: 'Final',
      paymentStatus: 'Paid'
    },
    {
      id: 2,
      date: '2024-01-15',
      time: '15:45',
      customer: 'Jane Smith',
      biller: 'Staff User',
      items: [
        { name: 'Tea', quantity: 1, price: 3.00 },
        { name: 'Cake', quantity: 1, price: 6.00 }
      ],
      subtotal: 9.00,
      tax: 0.90,
      total: 9.90,
      grandTotal: 9.90,
      returnedAmount: 0.00,
      paidAmount: 5.00,
      dueAmount: 4.90,
      paymentMethod: 'Cash',
      status: 'Completed',
      saleStatus: 'Final',
      paymentStatus: 'Partial'
    },
    {
      id: 3,
      date: '2024-01-16',
      time: '10:15',
      customer: 'Mike Johnson',
      biller: 'Admin User',
      items: [
        { name: 'Burger', quantity: 1, price: 12.00 },
        { name: 'Fries', quantity: 1, price: 4.50 }
      ],
      subtotal: 16.50,
      tax: 1.65,
      total: 18.15,
      grandTotal: 18.15,
      returnedAmount: 2.00,
      paidAmount: 0.00,
      dueAmount: 18.15,
      paymentMethod: 'Card',
      status: 'Pending',
      saleStatus: 'Draft',
      paymentStatus: 'Unpaid'
    }
  ];

  useEffect(() => {
    // Fetch real sales data from API
    fetchSalesData();
  }, []);

  const fetchSalesData = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/orders');
      if (response.ok) {
        const orders = await response.json();
        // Transform orders to match the sales format
        const transformedSales = orders.map(order => ({
          id: order.id,
          date: new Date(order.created_at).toLocaleDateString(),
          time: new Date(order.created_at).toLocaleTimeString(),
          customer: order.customer_name || 'Walk-in Customer',
          biller: 'POS User',
          items: order.items || [],
          subtotal: parseFloat(order.subtotal) || 0,
          tax: parseFloat(order.tax) || 0,
          total: parseFloat(order.total) || 0,
          grandTotal: parseFloat(order.total) || 0,
          returnedAmount: 0.00,
          paidAmount: parseFloat(order.total) || 0,
          dueAmount: 0.00,
          paymentMethod: order.payment_method || 'Cash',
          status: order.status || 'Completed',
          saleStatus: 'Final',
          paymentStatus: 'Paid'
        }));
        setSales(transformedSales);
      } else {
        console.error('Failed to fetch sales data');
        // Fallback to sample data if API fails
        setSales(sampleSales);
      }
    } catch (error) {
      console.error('Error fetching sales data:', error);
      // Fallback to sample data if API fails
      setSales(sampleSales);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownOpen && !event.target.closest('.action-dropdown')) {
        setDropdownOpen(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleAddSale = () => {
    setModalType('add');
    setSelectedSale(null);
    setFormData({
      customer: '',
      paymentMethod: 'Cash',
      items: [{ name: '', quantity: 1, price: 0 }],
      discount: 0,
      taxRate: 10
    });
    setShowModal(true);
  };

  const handleEditSale = (sale) => {
    setModalType('edit');
    setSelectedSale(sale);
    // Pre-populate form data with selected sale information
    setFormData({
      customer: sale.customer,
      paymentMethod: sale.paymentMethod,
      items: sale.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price
      })),
      discount: 0,
      taxRate: 10
    });
    setShowModal(true);
  };

  const handleViewSale = (sale) => {
    setModalType('view');
    setSelectedSale(sale);
    setShowModal(true);
  };

  const handleDeleteSale = (sale) => {
    setModalType('delete');
    setSelectedSale(sale);
    setShowModal(true);
  };

  const handlePrintReceipt = (sale) => {
    // Create a printable receipt window
    const printWindow = window.open('', '_blank');
    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - Sale #${sale.id}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .receipt-header { text-align: center; margin-bottom: 20px; }
          .receipt-header h1 { margin: 0; }
          .receipt-info { margin-bottom: 20px; }
          .receipt-items { margin-bottom: 20px; }
          .receipt-items table { width: 100%; border-collapse: collapse; }
          .receipt-items th, .receipt-items td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
          .receipt-totals { margin-top: 20px; text-align: right; }
          .receipt-totals .total-row { margin: 5px 0; }
          .receipt-totals .final-total { font-weight: bold; font-size: 1.2em; }
          @media print {
            body { margin: 0; }
          }
        </style>
      </head>
      <body>
        <div class="receipt-header">
          <h1>POS Restaurant</h1>
          <p>123 Main Street, City, State 12345</p>
          <p>Phone: (555) 123-4567</p>
        </div>
        
        <div class="receipt-info">
          <p><strong>Sale ID:</strong> #${sale.id}</p>
          <p><strong>Date:</strong> ${sale.date}</p>
          <p><strong>Time:</strong> ${sale.time}</p>
          <p><strong>Customer:</strong> ${sale.customer}</p>
          <p><strong>Biller:</strong> ${sale.biller}</p>
          <p><strong>Payment Method:</strong> ${sale.paymentMethod}</p>
        </div>
        
        <div class="receipt-items">
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${sale.items.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.quantity}</td>
                  <td>$${item.price.toFixed(2)}</td>
                  <td>$${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="receipt-totals">
          <div class="total-row">Subtotal: $${sale.subtotal.toFixed(2)}</div>
          <div class="total-row">Tax: $${sale.tax.toFixed(2)}</div>
          <div class="total-row final-total">Total: $${sale.total.toFixed(2)}</div>
          <div class="total-row">Paid: $${sale.paidAmount.toFixed(2)}</div>
          ${sale.dueAmount > 0 ? `<div class="total-row">Due: $${sale.dueAmount.toFixed(2)}</div>` : ''}
        </div>
        
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          };
        </script>
      </body>
      </html>
    `;
    
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
  };

  const handleGenerateInvoice = (sale) => {
    // Generate invoice functionality
    console.log('Generating invoice for sale:', sale.id);
    alert(`Generating invoice for Sale #${sale.id}`);
  };

  const handleViewPayment = (sale) => {
    // View payment functionality
    console.log('Viewing payment for sale:', sale.id);
    alert(`Payment Details for Sale #${sale.id}\nAmount: $${sale.total.toFixed(2)}\nMethod: ${sale.paymentMethod}\nStatus: ${sale.paymentStatus}`);
  };

  const toggleDropdown = (saleId) => {
    setDropdownOpen(dropdownOpen === saleId ? null : saleId);
  };

  const closeDropdown = () => {
    setDropdownOpen(null);
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/orders/${selectedSale.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Sale deleted successfully!');
        fetchSalesData(); // Refresh the sales list
      } else {
        throw new Error('Failed to delete sale');
      }
    } catch (error) {
      console.error('Error deleting sale:', error);
      alert('Error deleting sale. Please try again.');
    }
    
    setShowModal(false);
    setSelectedSale(null);
  };

  // Form handling functions
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: field === 'quantity' || field === 'price' ? parseFloat(value) || 0 : value
    };
    setFormData(prev => ({
      ...prev,
      items: updatedItems
    }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { name: '', quantity: 1, price: 0 }]
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    }
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const discountAmount = (subtotal * formData.discount) / 100;
    const taxableAmount = subtotal - discountAmount;
    const tax = (taxableAmount * formData.taxRate) / 100;
    const total = taxableAmount + tax;
    
    return {
      subtotal: subtotal.toFixed(2),
      discountAmount: discountAmount.toFixed(2),
      tax: tax.toFixed(2),
      total: total.toFixed(2)
    };
  };

  const handleSubmitSale = async () => {
    // Form validation
    const validItems = formData.items.filter(item => item.name.trim() && item.quantity > 0 && item.price > 0);
    
    if (validItems.length === 0) {
      alert('Please add at least one valid item with name, quantity, and price.');
      return;
    }

    if (formData.taxRate < 0 || formData.taxRate > 100) {
      alert('Tax rate must be between 0 and 100%.');
      return;
    }

    if (formData.discount < 0 || formData.discount > 100) {
      alert('Discount must be between 0 and 100%.');
      return;
    }

    const totals = calculateTotals();
    const saleData = {
      customer_name: formData.customer.trim() || 'Walk-in Customer',
      items: validItems,
      subtotal: parseFloat(totals.subtotal),
      discount: formData.discount,
      tax: parseFloat(totals.tax),
      total: parseFloat(totals.total),
      payment_method: formData.paymentMethod,
      status: 'completed'
    };

    try {
      if (modalType === 'add') {
        // Create new sale via API
        const response = await fetch('http://localhost:5000/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(saleData),
        });

        if (response.ok) {
          alert('Sale added successfully!');
          fetchSalesData(); // Refresh the sales list
        } else {
          throw new Error('Failed to create sale');
        }
      } else if (modalType === 'edit') {
        // Update existing sale via API
        const response = await fetch(`http://localhost:5000/api/orders/${selectedSale.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(saleData),
        });

        if (response.ok) {
          alert('Sale updated successfully!');
          fetchSalesData(); // Refresh the sales list
        } else {
          throw new Error('Failed to update sale');
        }
      }
    } catch (error) {
      console.error('Error saving sale:', error);
      alert('Error saving sale. Please try again.');
      return;
    }

    setShowModal(false);
    setSelectedSale(null);
  };

  const renderSalesList = () => (
    <div className="sales-list-section">
      <div className="section-header">
        <h3>All Sales</h3>
        <button className="btn-primary" onClick={handleAddSale}>
          + Add New Sale
        </button>
      </div>
      
      <div className="sales-table">
        <div className="table-header">
          <div>Sale ID</div>
          <div>Date & Time</div>
          <div>Customer</div>
          <div>Items</div>
          <div>Total</div>
          <div>Payment</div>
          <div>Status</div>
          <div>Actions</div>
        </div>
        {sales.map(sale => (
          <div key={sale.id} className="table-row">
            <div>#{sale.id}</div>
            <div>{sale.date} {sale.time}</div>
            <div>{sale.customer}</div>
            <div>{sale.items.length} items</div>
            <div>${sale.total.toFixed(2)}</div>
            <div>{sale.paymentMethod}</div>
            <div>
              <span className={`status-badge ${sale.status.toLowerCase()}`}>
                {sale.status}
              </span>
            </div>
            <div className="action-buttons">
              <div className="action-dropdown">
                <button 
                  className="dropdown-toggle" 
                  onClick={() => toggleDropdown(sale.id)}
                >
                  Actions ▼
                </button>
                {dropdownOpen === sale.id && (
                  <div className="dropdown-menu">
                    <button className="dropdown-item" onClick={() => { handleViewSale(sale); closeDropdown(); }}>
                      <span className="dropdown-icon">👁️</span> View
                    </button>
                    <button className="dropdown-item" onClick={() => { handleEditSale(sale); closeDropdown(); }}>
                      <span className="dropdown-icon">✏️</span> Edit
                    </button>
                    <button className="dropdown-item" onClick={() => { handlePrintReceipt(sale); closeDropdown(); }}>
                      <span className="dropdown-icon">🖨️</span> Print
                    </button>
                    <button className="dropdown-item" onClick={() => { handleGenerateInvoice(sale); closeDropdown(); }}>
                      <span className="dropdown-icon">📄</span> Generate Invoice
                    </button>
                    <button className="dropdown-item" onClick={() => { handleViewPayment(sale); closeDropdown(); }}>
                      <span className="dropdown-icon">💳</span> View Payment
                    </button>
                    <button className="dropdown-item delete" onClick={() => { handleDeleteSale(sale); closeDropdown(); }}>
                      <span className="dropdown-icon">🗑️</span> Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderModal = () => {
    if (!showModal) return null;

    return (
      <div className="modal-overlay" onClick={() => setShowModal(false)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>
              {modalType === 'add' && 'Add New Sale'}
              {modalType === 'edit' && 'Edit Sale'}
              {modalType === 'view' && 'Sale Details'}
              {modalType === 'delete' && 'Delete Sale'}
            </h3>
            <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
          </div>
          
          <div className="modal-body">
            {modalType === 'delete' ? (
              <div className="delete-confirmation">
                <p>Are you sure you want to delete Sale #{selectedSale?.id}?</p>
                <p>This action cannot be undone.</p>
                <div className="modal-actions">
                  <button className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                  <button className="btn-delete" onClick={confirmDelete}>Delete</button>
                </div>
              </div>
            ) : modalType === 'view' ? (
              <div className="sale-details">
                <div className="detail-row">
                  <span>Sale ID:</span>
                  <span>#{selectedSale?.id}</span>
                </div>
                <div className="detail-row">
                  <span>Date & Time:</span>
                  <span>{selectedSale?.date} {selectedSale?.time}</span>
                </div>
                <div className="detail-row">
                  <span>Customer:</span>
                  <span>{selectedSale?.customer}</span>
                </div>
                <div className="detail-row">
                  <span>Payment Method:</span>
                  <span>{selectedSale?.paymentMethod}</span>
                </div>
                <div className="items-section">
                  <h4>Items:</h4>
                  {selectedSale?.items.map((item, index) => (
                    <div key={index} className="item-row">
                      <span>{item.name}</span>
                      <span>Qty: {item.quantity}</span>
                      <span>${item.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="total-section">
                  <div className="detail-row">
                    <span>Subtotal:</span>
                    <span>${selectedSale?.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="detail-row">
                    <span>Tax:</span>
                    <span>${selectedSale?.tax.toFixed(2)}</span>
                  </div>
                  <div className="detail-row total">
                    <span>Total:</span>
                    <span>${selectedSale?.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="sale-form">
                <div className="form-group">
                  <label>Customer Name:</label>
                  <input
                    type="text"
                    value={formData.customer}
                    onChange={(e) => handleInputChange('customer', e.target.value)}
                    placeholder="Enter customer name (optional)"
                  />
                </div>

                <div className="form-group">
                  <label>Payment Method:</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                  >
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="Digital Wallet">Digital Wallet</option>
                  </select>
                </div>

                <div className="items-section">
                  <div className="items-header">
                    <h4>Items</h4>
                    <button type="button" className="btn-add-item" onClick={addItem}>
                      + Add Item
                    </button>
                  </div>
                  
                  {formData.items.map((item, index) => (
                    <div key={index} className="item-form-row">
                      <div className="item-input">
                        <label>Item Name:</label>
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                          placeholder="Enter item name"
                        />
                      </div>
                      <div className="item-input">
                        <label>Quantity:</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        />
                      </div>
                      <div className="item-input">
                        <label>Price ($):</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.price}
                          onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                        />
                      </div>
                      <div className="item-total">
                        <label>Total:</label>
                        <span>${(item.quantity * item.price).toFixed(2)}</span>
                      </div>
                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          className="btn-remove-item"
                          onClick={() => removeItem(index)}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Discount (%):</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.discount}
                      onChange={(e) => handleInputChange('discount', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Tax Rate (%):</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.taxRate}
                      onChange={(e) => handleInputChange('taxRate', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="totals-section">
                  <div className="total-row">
                    <span>Subtotal:</span>
                    <span>${calculateTotals().subtotal}</span>
                  </div>
                  <div className="total-row">
                    <span>Discount:</span>
                    <span>-${calculateTotals().discountAmount}</span>
                  </div>
                  <div className="total-row">
                    <span>Tax:</span>
                    <span>${calculateTotals().tax}</span>
                  </div>
                  <div className="total-row total-final">
                    <span>Total:</span>
                    <span>${calculateTotals().total}</span>
                  </div>
                </div>

                <div className="modal-actions">
                  <button className="btn-cancel" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button className="btn-primary" onClick={handleSubmitSale}>
                    {modalType === 'add' ? 'Add Sale' : 'Update Sale'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="sales-management">
      <div className="sales-management-header">
        <h2>Sales Management</h2>
      </div>

      <div className="sales-management-content">
        {renderSalesList()}
      </div>

      {renderModal()}
    </div>
  );
};

export default SalesManagement;