import React, { useState } from 'react';
import './OrderPanel.css';
import axios from 'axios';

const OrderPanel = ({ cart, onUpdateItem, onRemoveItem, onClearCart }) => {
  const [selectedDining, setSelectedDining] = useState('');
  const [selectedTable, setSelectedTable] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const productDiscount = 24; // Fixed discount as shown in design
  const extraDiscount = 0;
  const couponDiscount = 0;
  const total = subtotal - productDiscount - extraDiscount - couponDiscount;

  const handleQuantityChange = (productId, change) => {
    const item = cart.find(item => item.id === productId);
    if (item) {
      const newQuantity = item.quantity + change;
      onUpdateItem(productId, newQuantity);
    }
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      alert('Please add items to cart before placing order');
      return;
    }

    setIsProcessing(true);
    try {
      const orderData = {
        items: cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          price: item.price
        })),
        subtotal: subtotal,
        discount: productDiscount,
        extra_discount: extraDiscount,
        coupon_discount: couponDiscount,
        total: total
      };

      const response = await axios.post('/api/orders', orderData);
      
      if (response.data) {
        alert(`Order ${response.data.order_number} placed successfully!`);
        onClearCart();
      }
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="order-panel">
      <div className="order-header">
        <div className="order-selects">
          <select 
            value={selectedDining} 
            onChange={(e) => setSelectedDining(e.target.value)}
            className="dining-select"
          >
            <option value="">Select Dining</option>
            <option value="dine-in">Dine In</option>
            <option value="takeaway">Takeaway</option>
            <option value="delivery">Delivery</option>
          </select>
          
          <select 
            value={selectedTable} 
            onChange={(e) => setSelectedTable(e.target.value)}
            className="table-select"
          >
            <option value="">Select Table</option>
            <option value="table-1">Table 1</option>
            <option value="table-2">Table 2</option>
            <option value="table-3">Table 3</option>
            <option value="table-4">Table 4</option>
          </select>
        </div>
        
        <div className="order-number">
          <span className="order-icon">👤</span>
          <span>Order #20</span>
        </div>
      </div>

      <div className="order-items">
        {cart.length === 0 ? (
          <div className="empty-cart">
            <p>No items in cart</p>
            <small>Add items from the menu to get started</small>
          </div>
        ) : (
          cart.map((item) => (
            <div key={item.id} className="order-item">
              <div className="item-info">
                <h4 className="item-name">{item.name}</h4>
                <p className="item-price">
                  ${item.price.toFixed(2)} × {item.quantity} = ${(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
              
              <div className="item-controls">
                <div className="quantity-controls">
                  <button 
                    className="qty-btn"
                    onClick={() => handleQuantityChange(item.id, -1)}
                  >
                    -
                  </button>
                  <span className="quantity">{item.quantity}</span>
                  <button 
                    className="qty-btn"
                    onClick={() => handleQuantityChange(item.id, 1)}
                  >
                    +
                  </button>
                </div>
                
                <button 
                  className="add-notes-btn"
                  onClick={() => alert('Add notes functionality')}
                >
                  📝 Add Notes
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="order-summary">
        <div className="summary-row">
          <span>Sub total :</span>
          <span>{subtotal.toFixed(0)}$</span>
        </div>
        <div className="summary-row">
          <span>Product Discount :</span>
          <span>{productDiscount}$</span>
        </div>
        <div className="summary-row">
          <span>Extra Discount :</span>
          <span>✏️ {extraDiscount.toFixed(1)}$</span>
        </div>
        <div className="summary-row">
          <span>Coupon discount :</span>
          <span>✏️ {couponDiscount.toFixed(1)}$</span>
        </div>
        <div className="summary-row total">
          <span>Total :</span>
          <span>{total.toFixed(0)}$</span>
        </div>
      </div>

      <div className="order-actions">
        <div className="action-buttons-top">
          <button className="action-btn secondary">
            KOT & Print
          </button>
          <button className="action-btn secondary">
            📄 Draft
          </button>
        </div>
        
        <div className="action-buttons-bottom">
          <button 
            className="action-btn payment"
            onClick={handlePlaceOrder}
            disabled={isProcessing || cart.length === 0}
          >
            {isProcessing ? 'Processing...' : 'Bill & Payment'}
          </button>
          <button 
            className="action-btn print"
            onClick={handlePlaceOrder}
            disabled={isProcessing || cart.length === 0}
          >
            {isProcessing ? 'Processing...' : 'Bill & Print'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderPanel;