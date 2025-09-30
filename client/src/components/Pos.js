import React, { useState, useEffect } from 'react';
import './Pos.css';
import ReceiptModal from './ReceiptModal';

const Pos = ({ 
  products = [], 
  categories = [], 
  onAddToCart, 
  cart = [], 
  onUpdateItem, 
  onRemoveItem, 
  onClearCart,
  invoiceSettings,
  draftOrders,
  setDraftOrders,
  showReceipt,
  setShowReceipt,
  currentReceipt,
  setCurrentReceipt
}) => {
  // Add state for current date and time
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [activeSection, setActiveSection] = useState('pos');

  // Update date and time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);
  const [selectedCategory, setSelectedCategory] = useState('Show All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTable, setSelectedTable] = useState('');
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    email: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState(0);
  const [loading, setLoading] = useState(false);

  // Sample tables data
  const tables = [
    'Table 1', 'Table 2', 'Table 3', 'Table 4', 'Table 5',
    'Table 6', 'Table 7', 'Table 8', 'Table 9', 'Table 10'
  ];

  // Filter products based on category and search
  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'Show All' || product.category_name === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmount = discountType === 'percentage' 
    ? (subtotal * discountValue / 100) 
    : discountValue;
  const total = subtotal - discountAmount;

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
  };

  const handleAddToCart = (product) => {
    if (onAddToCart) {
      onAddToCart(product);
    }
  };

  const handleQuantityChange = (itemId, newQuantity) => {
    if (onUpdateItem) {
      onUpdateItem(itemId, newQuantity);
    }
  };

  const handleRemoveItem = (itemId) => {
    if (onRemoveItem) {
      onRemoveItem(itemId);
    }
  };

  const handleClearCart = () => {
    if (onClearCart) {
      onClearCart();
    }
  };

  const handleDraft = () => {
    if (cart.length === 0) {
      alert('Please add items to cart before saving as draft');
      return;
    }

    const draftOrder = {
      id: Date.now(),
      items: [...cart],
      table: selectedTable,
      customer: customerInfo,
      paymentMethod,
      discountType,
      discountValue,
      subtotal,
      discountAmount,
      total,
      timestamp: new Date().toLocaleString()
    };

    setDraftOrders([...draftOrders, draftOrder]);
    alert('Order saved to draft list successfully!');
    handleClearCart();
    setSelectedTable('');
    setCustomerInfo({ name: '', phone: '', email: '' });
    setDiscountValue(0);
  };

  const handlePrintReceipt = () => {
    if (cart.length === 0) {
      alert('Please add items to cart before printing receipt');
      return;
    }

    const receiptData = {
      id: Date.now(),
      items: [...cart],
      table: selectedTable,
      customer: customerInfo,
      paymentMethod,
      discountType,
      discountValue,
      subtotal,
      discountAmount,
      total,
      timestamp: new Date().toLocaleString()
    };

    setCurrentReceipt(receiptData);
    setShowReceipt(true);
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('Please add items to cart before checkout');
      return;
    }
    
    if (!selectedTable) {
      alert('Please select a table');
      return;
    }

    const receiptData = {
      id: Date.now(),
      items: [...cart],
      table: selectedTable,
      customer: customerInfo,
      paymentMethod,
      discountType,
      discountValue,
      subtotal,
      discountAmount,
      total,
      timestamp: new Date().toLocaleString()
    };

    setCurrentReceipt(receiptData);
    setShowReceipt(true);
  };

  const renderPosInterface = () => (
    <div className="pos-interface">
      <div className="pos-left-panel">
        {/* Categories */}
        <div className="categories-section">
          <h3>Categories</h3>
          <div className="categories-grid">
            {categories.map((category, index) => (
              <button
                key={index}
                className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => handleCategoryChange(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="search-section">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        {/* Products Grid */}
        <div className="products-section">
          <div className="products-grid">
            {filteredProducts.map((product) => (
              <div key={product.id} className="product-card" onClick={() => handleAddToCart(product)}>
                <div className="product-image">
                  <img src={product.image_url || '/api/placeholder/80/80'} alt={product.name} />
                </div>
                <div className="product-info">
                  <h4>{product.name}</h4>
                  <p className="product-price">${product.price.toFixed(2)}</p>
                  <span className="product-category">{product.category_name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pos-right-panel">
        {/* Order Summary */}
        <div className="order-section">
          <div className="order-header">
            <h3>Current Order</h3>
            <button className="clear-btn" onClick={handleClearCart}>Clear All</button>
          </div>

          {/* Table Selection */}
          <div className="table-selection">
            <label>Select Table:</label>
            <select 
              value={selectedTable} 
              onChange={(e) => setSelectedTable(e.target.value)}
              className="table-select"
            >
              <option value="">Choose Table</option>
              {tables.map((table, index) => (
                <option key={index} value={table}>{table}</option>
              ))}
            </select>
          </div>

          {/* Cart Items */}
          <div className="cart-items">
            {cart.length === 0 ? (
              <div className="empty-cart">
                <p>No items in cart</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="cart-item">
                  <div className="item-info">
                    <h4>{item.name}</h4>
                    <p>${item.price.toFixed(2)}</p>
                  </div>
                  <div className="item-controls">
                    <button 
                      className="qty-btn"
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                    >
                      -
                    </button>
                    <span className="quantity">{item.quantity}</span>
                    <button 
                      className="qty-btn"
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                    >
                      +
                    </button>
                    <button 
                      className="remove-btn"
                      onClick={() => handleRemoveItem(item.id)}
                    >
                      ×
                    </button>
                  </div>
                  <div className="item-total">
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Customer Info */}
          <div className="customer-section">
            <h4>Customer Information (Optional)</h4>
            <input
              type="text"
              placeholder="Customer Name"
              value={customerInfo.name}
              onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
              className="customer-input"
            />
            <input
              type="text"
              placeholder="Phone Number"
              value={customerInfo.phone}
              onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
              className="customer-input"
            />
          </div>

          {/* Discount Section */}
          <div className="discount-section">
            <h4>Discount</h4>
            <div className="discount-controls">
              <select 
                value={discountType} 
                onChange={(e) => setDiscountType(e.target.value)}
                className="discount-type"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount ($)</option>
              </select>
              <input
                type="number"
                placeholder="0"
                value={discountValue}
                onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                className="discount-input"
              />
            </div>
          </div>



          {/* Order Summary */}
          <div className="order-summary">
            <div className="summary-row">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Discount:</span>
              <span>-${discountAmount.toFixed(2)}</span>
            </div>
            <div className="summary-row total">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Order Summary Actions */}
          <div className="order-summary-actions">
            <button 
              className="print-receipt-btn"
              onClick={handlePrintReceipt}
              disabled={cart.length === 0}
            >
              Print Receipt
            </button>
            <button 
              className="draft-btn"
              onClick={handleDraft}
              disabled={cart.length === 0}
            >
              Draft
            </button>
          </div>

          {/* Checkout Button */}
          <button 
            className="checkout-btn"
            onClick={handleCheckout}
            disabled={loading || cart.length === 0}
          >
            {loading ? 'Processing...' : 'Complete Order'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="pos-container">
      <div className="pos-header">
        <div className="pos-header-left">
          <h1>Point of Sale</h1>
          <div className="datetime-display">
            <div className="date-box">
              <span className="date-label">Date</span>
              <span className="date-value">{currentDateTime.toLocaleDateString()}</span>
              <span className="time-label">Time</span>
              <span className="time-value">{currentDateTime.toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
        <div className="pos-stats">
          <div className="stat-item">
            <span className="stat-label">Items in Cart:</span>
            <span className="stat-value">{cart.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Current Total:</span>
            <span className="stat-value">${total.toFixed(2)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Selected Table:</span>
            <span className="stat-value">{selectedTable || 'None'}</span>
          </div>
        </div>
      </div>

      <div className="pos-navigation">
        <button 
          className={`nav-btn ${activeSection === 'pos' ? 'active' : ''}`}
          onClick={() => setActiveSection('pos')}
        >
          POS Interface
        </button>
      </div>

      <div className="pos-content">
        {activeSection === 'pos' && renderPosInterface()}
      </div>

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={showReceipt}
        onClose={() => setShowReceipt(false)}
        receiptData={currentReceipt}
        onCompleteOrder={() => {
          // Clear cart after successful order completion
          handleClearCart();
          setCustomerInfo({ name: '', phone: '', email: '' });
          setDiscountValue(0);
          setSelectedTable('');
          setCurrentReceipt(null);
        }}
      />
    </div>
  );
};

export default Pos;