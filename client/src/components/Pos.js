import React, { useState } from 'react';
import './Pos.css';

const Pos = ({ 
  products = [], 
  categories = [], 
  onAddToCart, 
  cart = [], 
  onUpdateItem, 
  onRemoveItem, 
  onClearCart
}) => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTable, setSelectedTable] = useState('');
  const [discountType, setDiscountType] = useState('percentage'); // 'percentage' or 'fixed'
  const [discountValue, setDiscountValue] = useState(0);

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmount = discountType === 'percentage' 
    ? (subtotal * discountValue / 100) 
    : discountValue;
  const discountedSubtotal = subtotal - discountAmount;
  const tax = discountedSubtotal * 0.1;
  const total = discountedSubtotal + tax;

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="pos-container">
      {/* Header */}
      <div className="pos-header">
        <div className="pos-title">
          <h1>Point of Sale System</h1>
          <div className="pos-subtitle">Modern POS Interface</div>
        </div>
        <div className="pos-stats">
          <div className="stat-item">
            <span className="stat-value">{products.length}</span>
            <span className="stat-label">Products</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{cart.length}</span>
            <span className="stat-label">Cart Items</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">${total.toFixed(2)}</span>
            <span className="stat-label">Total</span>
          </div>
        </div>
      </div>

      <div className="pos-main">
        <div className="pos-left">
          <div className="search-section">
            <div className="search-bar">
              <div className="search-icon">🔍</div>
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button 
                  className="clear-search"
                  onClick={() => setSearchTerm('')}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="categories-section">
            <div className="categories-header">
              <h3>Categories</h3>
            </div>
            <div className="categories">
              <button 
                className={`category-btn ${selectedCategory === 'All' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('All')}
              >
                <span className="category-icon">🏷️</span>
                All
              </button>
              {categories.map((category, index) => (
                <button
                  key={index}
                  className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(category)}
                >
                  <span className="category-icon">📂</span>
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="products-section">
            <div className="products-header">
              <div className="products-title">
                <h2>Products Catalog</h2>
                <p>Browse and select items for your order</p>
              </div>
              <div className="products-count">
                {filteredProducts.length} items available
              </div>
            </div>
            
            <div className="products-grid-container">
              <div className="products-grid">
                {filteredProducts.length === 0 ? (
                  <div className="no-products">
                    <div className="no-products-icon">📦</div>
                    <h3>No products found</h3>
                    <p>Try adjusting your search or category filter</p>
                  </div>
                ) : (
                  filteredProducts.map((product, index) => (
                    <div 
                      key={index} 
                      className="product-card enhanced"
                      onClick={() => onAddToCart(product)}
                    >
                      <div className="product-image-container">
                        <div className="product-image">
                          {product.image ? (
                            <img src={product.image} alt={product.name} />
                          ) : (
                            <div className="no-image">
                              <span>📷</span>
                            </div>
                          )}
                        </div>
                        <div className="image-overlay">
                          <span className="add-icon">+</span>
                        </div>
                      </div>
                      <div className="product-info">
                        <div className="product-details-box">
                          <div className="product-name-box">
                            <h3 className="product-name">{product.name}</h3>
                            <div className="product-id">SKU: {product.sku || `PRD-${index + 1}`}</div>
                          </div>
                          <div className="product-price-box">
                            <div className="price-label">Price</div>
                            <div className="price-amount">${product.price}</div>
                          </div>
                        </div>
                        <div className="product-category-tag">
                          <span className="category-icon">🏷️</span>
                          <span className="category-text">{product.category || 'General'}</span>
                        </div>
                        <div className="product-stock-info">
                          <div className="stock-badge">
                            <span className="stock-indicator"></span>
                            <span className="stock-text">Stock: {product.stock || 0}</span>
                            <span className="stock-status">{(product.stock || 0) > 10 ? 'In Stock' : (product.stock || 0) > 0 ? 'Low Stock' : 'Out of Stock'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="pos-right">
          <div className="cart-container">
            <div className="cart-header">
              <h2>🛒 Order Summary</h2>
              <div className="cart-badge">
                {cart.length} {cart.length === 1 ? 'item' : 'items'}
              </div>
            </div>
            
            {/* Table Selection Section */}
            <div className="table-section">
              <div className="section-header">
                <span className="section-icon">🪑</span>
                <label>Table Selection</label>
              </div>
              <select 
                value={selectedTable} 
                onChange={(e) => setSelectedTable(e.target.value)}
                className="table-select"
              >
                <option value="">Select Table</option>
                <option value="Table 1">Table 1</option>
                <option value="Table 2">Table 2</option>
                <option value="Table 3">Table 3</option>
                <option value="Table 4">Table 4</option>
                <option value="Table 5">Table 5</option>
                <option value="Table 6">Table 6</option>
                <option value="Table 7">Table 7</option>
                <option value="Table 8">Table 8</option>
              </select>
            </div>
            
            {cart.length === 0 ? (
              <div className="empty-cart">
                <div className="empty-cart-icon">🛒</div>
                <h3>Cart is empty</h3>
                <p>Add some products to get started</p>
              </div>
            ) : (
              <div className="cart-items-container">
                <div className="cart-items">
                  {cart.map((item, index) => (
                    <div key={index} className="cart-item">
                      <div className="item-info">
                        <div className="item-name">{item.name}</div>
                        <div className="item-price">${item.price}</div>
                      </div>
                      <div className="quantity-controls">
                        <button 
                          className="qty-btn minus"
                          onClick={() => onUpdateItem(item.id, item.quantity - 1)}
                        >
                          −
                        </button>
                        <span className="quantity">{item.quantity}</span>
                        <button 
                          className="qty-btn plus"
                          onClick={() => onUpdateItem(item.id, item.quantity + 1)}
                        >
                          +
                        </button>
                        <button 
                          className="remove-btn"
                          onClick={() => onRemoveItem(item.id)}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Discount Section */}
            <div className="discount-section">
              <div className="section-header">
                <span className="section-icon">💰</span>
                <h3>Discount</h3>
              </div>
              <div className="discount-controls">
                <div className="discount-type">
                  <label className="radio-label">
                    <input 
                      type="radio" 
                      value="percentage" 
                      checked={discountType === 'percentage'}
                      onChange={(e) => setDiscountType(e.target.value)}
                    />
                    <span className="radio-custom"></span>
                    Percentage (%)
                  </label>
                  <label className="radio-label">
                    <input 
                      type="radio" 
                      value="fixed" 
                      checked={discountType === 'fixed'}
                      onChange={(e) => setDiscountType(e.target.value)}
                    />
                    <span className="radio-custom"></span>
                    Fixed Amount ($)
                  </label>
                </div>
                <div className="discount-input-container">
                  <input 
                    type="number" 
                    value={discountValue}
                    onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                    placeholder={discountType === 'percentage' ? 'Enter %' : 'Enter $'}
                    className="discount-input"
                    min="0"
                    max={discountType === 'percentage' ? '100' : undefined}
                  />
                  <span className="input-suffix">
                    {discountType === 'percentage' ? '%' : '$'}
                  </span>
                </div>
              </div>
            </div>

            <div className="cart-total">
              <div className="total-row">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="total-row discount-row">
                  <span>Discount:</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="total-row">
                <span>Tax (10%):</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="total-row final-total">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Action Summary */}
            <div className="action-summary">
              <div className="top-actions">
                <button 
                  className="action-btn receipt-print-btn" 
                  disabled={cart.length === 0}
                  onClick={() => {
                    if (cart.length > 0) {
                      console.log('Printing receipt for order:', { cart, total, selectedTable });
                      alert(`Receipt printed for ${selectedTable || 'No Table'}\nTotal: $${total.toFixed(2)}`);
                    }
                  }}
                >
                  <span className="btn-icon">🖨️</span>
                  Receipt Print
                </button>
                <button 
                  className="action-btn draft-option-btn" 
                  disabled={cart.length === 0}
                  onClick={() => {
                    if (cart.length > 0) {
                      console.log('Saving order as draft:', { cart, total, selectedTable });
                      alert(`Order saved as draft for ${selectedTable || 'No Table'}\nItems: ${cart.length}`);
                    }
                  }}
                >
                  <span className="btn-icon">💾</span>
                  Draft
                </button>
              </div>
              <div className="bottom-actions">
                <button 
                  className="action-btn complete-order-btn" 
                  disabled={cart.length === 0}
                  onClick={() => {
                    if (cart.length > 0) {
                      console.log('Completing order:', { cart, total, selectedTable });
                      alert(`Order completed for ${selectedTable || 'No Table'}\nTotal: $${total.toFixed(2)}\nItems: ${cart.length}`);
                      onClearCart();
                    }
                  }}
                >
                  <span className="btn-icon">✅</span>
                  Complete Order
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pos;