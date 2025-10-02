import React, { useState, useEffect } from 'react';
import './Purchase.css';

const Purchase = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [currentView, setCurrentView] = useState('orders'); // orders, suppliers, create
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [orderItems, setOrderItems] = useState([]);
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null); // Track which order is being edited
  const [isEditMode, setIsEditMode] = useState(false); // Track if we're in edit mode
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    contact: '',
    email: '',
    address: ''
  });

  // Sample data
  useEffect(() => {
    setSuppliers([
      { id: 1, name: 'ABC Supplies', contact: '+1234567890', email: 'abc@supplies.com', address: '123 Main St' },
      { id: 2, name: 'XYZ Distributors', contact: '+0987654321', email: 'xyz@dist.com', address: '456 Oak Ave' }
    ]);

    setPurchaseOrders([
      { 
        id: 'PO001', 
        supplier: 'ABC Supplies', 
        date: '2024-01-15', 
        status: 'Pending', 
        total: 1250.00,
        items: [
          { name: 'Coffee Beans', quantity: 50, price: 15.00 },
          { name: 'Sugar', quantity: 20, price: 25.00 }
        ]
      },
      { 
        id: 'PO003', 
        supplier: 'ABC Supplies', 
        date: '2025-10-02', 
        status: 'Pending', 
        total: 100.00,
        items: [
          { name: 'Tea Bags', quantity: 10, price: 5.00, unit: 'box' },
          { name: 'Honey', quantity: 5, price: 10.00, unit: 'ml' }
        ]
      },
      { 
        id: 'PO002', 
        supplier: 'XYZ Distributors', 
        date: '2024-01-14', 
        status: 'Received', 
        total: 850.00,
        items: [
          { name: 'Milk', quantity: 30, price: 12.50 },
          { name: 'Bread', quantity: 40, price: 8.75 }
        ]
      }
    ]);
  }, []);

  const handleAddItem = () => {
    setOrderItems([...orderItems, { name: '', quantity: 1, price: 0, unit: 'pieces' }]);
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...orderItems];
    updatedItems[index][field] = value;
    setOrderItems(updatedItems);
  };

  const handleRemoveItem = (index) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const handleCreateOrder = () => {
    if (!selectedSupplier || orderItems.length === 0) {
      alert('Please select a supplier and add items');
      return;
    }

    const total = orderItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    
    if (isEditMode && editingOrder) {
      // Update existing order
      const updatedOrder = {
        ...editingOrder,
        supplier: suppliers.find(s => s.id === parseInt(selectedSupplier))?.name,
        total,
        items: orderItems
      };

      setPurchaseOrders(purchaseOrders.map(order => 
        order.id === editingOrder.id ? updatedOrder : order
      ));
      
      // Reset edit mode
      setIsEditMode(false);
      setEditingOrder(null);
      setOrderItems([]);
      setSelectedSupplier('');
      setCurrentView('orders');
      alert(`Purchase order ${editingOrder.id} updated successfully!`);
    } else {
      // Create new order
      const newOrder = {
        id: `PO${String(purchaseOrders.length + 1).padStart(3, '0')}`,
        supplier: suppliers.find(s => s.id === parseInt(selectedSupplier))?.name,
        date: new Date().toISOString().split('T')[0],
        status: 'Pending',
        total,
        items: orderItems
      };

      setPurchaseOrders([...purchaseOrders, newOrder]);
      setOrderItems([]);
      setSelectedSupplier('');
      setCurrentView('orders');
      alert('Purchase order created successfully!');
    }
  };

  const handleAddSupplier = () => {
    if (!newSupplier.name || !newSupplier.contact) {
      alert('Please fill in required fields');
      return;
    }

    const supplier = {
      id: suppliers.length + 1,
      ...newSupplier
    };

    setSuppliers([...suppliers, supplier]);
    setNewSupplier({ name: '', contact: '', email: '', address: '' });
    setShowAddSupplier(false);
    alert('Supplier added successfully!');
  };

  const handleViewOrder = (orderId) => {
    const order = purchaseOrders.find(o => o.id === orderId);
    if (order) {
      alert(`Viewing order ${orderId}\nSupplier: ${order.supplier}\nTotal: $${order.total.toFixed(2)}\nStatus: ${order.status}`);
    }
  };

  const handleEditOrder = (orderId) => {
    const order = purchaseOrders.find(o => o.id === orderId);
    if (order) {
      // Set editing mode
      setIsEditMode(true);
      setEditingOrder(order);
      
      // Populate form with existing order data
      setSelectedSupplier(order.supplier);
      setOrderItems(order.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        unit: item.unit || 'kg'
      })));
      
      // Switch to create view (which will now show as edit mode)
      setCurrentView('create');
    }
  };

  const handlePrintOrder = (orderId) => {
    const order = purchaseOrders.find(o => o.id === orderId);
    if (order) {
      const printContent = `
        PURCHASE ORDER: ${order.id}
        ================================
        Supplier: ${order.supplier}
        Date: ${order.date}
        Status: ${order.status}
        
        Items:
        ${order.items.map(item => `- ${item.name}: ${item.quantity} x $${item.price.toFixed(2)} = $${(item.quantity * item.price).toFixed(2)}`).join('\n        ')}
        
        Total: $${order.total.toFixed(2)}
      `;
      
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head><title>Purchase Order ${order.id}</title></head>
          <body style="font-family: monospace; white-space: pre-line; padding: 20px;">
            ${printContent}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleDeleteOrder = (orderId) => {
    if (window.confirm(`Are you sure you want to delete order ${orderId}?`)) {
      setPurchaseOrders(purchaseOrders.filter(order => order.id !== orderId));
      alert(`Order ${orderId} deleted successfully!`);
    }
  };

  const renderOrders = () => (
    <div className="purchase-orders">
      <div className="section-header">
        <h3>Purchase Orders</h3>
        <button className="btn-primary" onClick={() => {
          setCurrentView('create');
          // Reset edit mode when creating new order
          setIsEditMode(false);
          setEditingOrder(null);
          setSelectedSupplier('');
          setOrderItems([]);
        }}>
          + Create Order
        </button>
      </div>
      
      <div className="orders-table">
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Supplier</th>
              <th>Date</th>
              <th>Status</th>
              <th>Total</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {purchaseOrders.map(order => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>{order.supplier}</td>
                <td>{order.date}</td>
                <td>
                  <span className={`status ${order.status.toLowerCase()}`}>
                    {order.status}
                  </span>
                </td>
                <td>${order.total.toFixed(2)}</td>
                <td>
                  <button className="btn-secondary" onClick={() => handleViewOrder(order.id)}>View</button>
                  <button className="btn-secondary" onClick={() => handleEditOrder(order.id)}>Edit</button>
                  <button className="btn-primary" onClick={() => handlePrintOrder(order.id)}>Print</button>
                  <button className="btn-danger" onClick={() => handleDeleteOrder(order.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSuppliers = () => (
    <div className="suppliers-section">
      <div className="section-header">
        <h3>Suppliers</h3>
        <button className="btn-primary" onClick={() => setShowAddSupplier(true)}>
          + Add Supplier
        </button>
      </div>
      
      <div className="suppliers-grid">
        {suppliers.map(supplier => (
          <div key={supplier.id} className="supplier-card">
            <h4>{supplier.name}</h4>
            <p><strong>Contact:</strong> {supplier.contact}</p>
            <p><strong>Email:</strong> {supplier.email}</p>
            <p><strong>Address:</strong> {supplier.address}</p>
            <div className="card-actions">
              <button className="btn-secondary">Edit</button>
              <button className="btn-danger">Delete</button>
            </div>
          </div>
        ))}
      </div>

      {showAddSupplier && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Add New Supplier</h3>
              <button className="close-btn" onClick={() => setShowAddSupplier(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={newSupplier.name}
                  onChange={(e) => setNewSupplier({...newSupplier, name: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Contact *</label>
                <input
                  type="text"
                  value={newSupplier.contact}
                  onChange={(e) => setNewSupplier({...newSupplier, contact: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={newSupplier.email}
                  onChange={(e) => setNewSupplier({...newSupplier, email: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Address</label>
                <textarea
                  value={newSupplier.address}
                  onChange={(e) => setNewSupplier({...newSupplier, address: e.target.value})}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowAddSupplier(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleAddSupplier}>Add Supplier</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderCreateOrder = () => (
    <div className="create-order">
      <div className="section-header">
        <h3>{isEditMode ? `Edit Purchase Order - ${editingOrder?.id}` : 'Create Purchase Order'}</h3>
        <button className="btn-secondary" onClick={() => {
          setCurrentView('orders');
          // Reset edit mode when going back
          setIsEditMode(false);
          setEditingOrder(null);
          setSelectedSupplier('');
          setOrderItems([]);
        }}>
          ← Back to Orders
        </button>
      </div>

      <div className="order-form">
        <div className="form-group">
          <label>Select Supplier *</label>
          <select
            value={selectedSupplier}
            onChange={(e) => setSelectedSupplier(e.target.value)}
          >
            <option value="">Choose a supplier...</option>
            {suppliers.map(supplier => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>
        </div>

        <div className="items-section">
          <div className="items-header">
            <h4>Order Items</h4>
            <button className="btn-primary" onClick={handleAddItem}>+ Add Item</button>
          </div>

          {orderItems.map((item, index) => (
            <div key={index} className="item-row">
              <input
                type="text"
                placeholder="Item name"
                value={item.name}
                onChange={(e) => handleItemChange(index, 'name', e.target.value)}
              />
              <input
                type="number"
                placeholder="Quantity"
                value={item.quantity}
                onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
              />
              <select
                value={item.unit || 'pieces'}
                onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                className="unit-select"
              >
                <option value="pieces">Pieces</option>
                <option value="kilogram">Kilogram</option>
                <option value="box">Box</option>
                <option value="ml">ML</option>
              </select>
              <input
                type="number"
                step="0.01"
                placeholder="Unit Price"
                value={item.price}
                onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value) || 0)}
              />
              <span className="item-total">
                ${(item.quantity * item.price).toFixed(2)}
              </span>
              <button className="btn-danger" onClick={() => handleRemoveItem(index)}>
                Remove
              </button>
            </div>
          ))}

          {orderItems.length > 0 && (
            <div className="price-summary">
              <div className="price-categories">
                <h4>Price Categories</h4>
                <div className="price-breakdown">
                  {orderItems.map((item, index) => (
                    <div key={index} className="price-item">
                      <span className="item-name">{item.name || `Item ${index + 1}`}</span>
                      <div className="price-details">
                        <span className="unit-price">Unit: ${item.price.toFixed(2)}</span>
                        <span className="quantity">Qty: {item.quantity} {item.unit || 'pieces'}</span>
                        <span className="total-amount">Total: ${(item.quantity * item.price).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="order-total">
                <div className="total-breakdown">
                  <div className="subtotal-row">
                    <span>Subtotal:</span>
                    <span>${orderItems.reduce((sum, item) => sum + (item.quantity * item.price), 0).toFixed(2)}</span>
                  </div>
                  <div className="total-row">
                    <span><strong>Total Amount:</strong></span>
                    <span><strong>${orderItems.reduce((sum, item) => sum + (item.quantity * item.price), 0).toFixed(2)}</strong></span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="form-actions">
          <button className="btn-secondary" onClick={() => {
            setCurrentView('orders');
            // Reset edit mode when canceling
            setIsEditMode(false);
            setEditingOrder(null);
            setSelectedSupplier('');
            setOrderItems([]);
          }}>Cancel</button>
          <button className="btn-primary" onClick={handleCreateOrder}>
            {isEditMode ? 'Update Order' : 'Create Order'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="purchase-management">
      <div className="purchase-header">
        <h2>Purchase Management</h2>
        <div className="nav-tabs">
          <button 
            className={`nav-tab ${currentView === 'orders' ? 'active' : ''}`}
            onClick={() => setCurrentView('orders')}
          >
            Purchase Orders
          </button>
          <button 
            className={`nav-tab ${currentView === 'suppliers' ? 'active' : ''}`}
            onClick={() => setCurrentView('suppliers')}
          >
            Suppliers
          </button>
        </div>
      </div>

      <div className="purchase-content">
        {currentView === 'orders' && renderOrders()}
        {currentView === 'suppliers' && renderSuppliers()}
        {currentView === 'create' && renderCreateOrder()}
      </div>
    </div>
  );
};

export default Purchase;