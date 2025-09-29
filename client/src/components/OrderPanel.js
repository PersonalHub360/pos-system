import React, { useState, useEffect } from 'react';
import axios from 'axios';
import printService from '../services/PrintService';
import './OrderPanel.css';

const OrderPanel = ({ cart, onUpdateItem, onRemoveItem, onClearCart, draftState, onDraftStateUsed }) => {
  const [selectedTable, setSelectedTable] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [discountPercentage, setDiscountPercentage] = useState(0);

  // Effect to restore draft state when provided
  useEffect(() => {
    if (draftState) {
      setSelectedTable(draftState.table || '');
      setDiscountPercentage(draftState.discountPercentage || 0);
      
      // Clear the draft state after using it
      if (onDraftStateUsed) {
        onDraftStateUsed();
      }
    }
  }, [draftState, onDraftStateUsed]);

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmount = (subtotal * discountPercentage) / 100;
  const total = subtotal - discountAmount;

  const handleQuantityChange = (productId, change) => {
    if (change > 0) {
      onUpdateItem(productId, change);
    } else {
      onRemoveItem(productId, Math.abs(change));
    }
  };

  const handleDiscountEdit = () => {
    // Direct custom percentage input
    const customValue = prompt(`Enter discount percentage (0-100):`, discountPercentage.toString());
    
    if (customValue !== null && !isNaN(customValue)) {
      const percentageValue = Math.max(0, Math.min(100, parseFloat(customValue)));
      setDiscountPercentage(percentageValue);
    }
  };

  const handlePOSAndPrint = async () => {
    if (cart.length === 0) {
      alert('Please add items to cart before printing POS ticket');
      return;
    }
    
    if (!selectedTable) {
      alert('Please select table before printing POS ticket');
      return;
    }

    setIsProcessing(true);
    try {
      const orderData = {
        cart,
        table: selectedTable,
        subtotal,
        discountPercentage,
        discountAmount,
        total,
        timestamp: new Date().toISOString()
      };

      await printService.printBill(orderData);
      alert('Receipt printed successfully!');
    } catch (error) {
      console.error('Print error:', error);
      alert('Failed to print receipt. Please check your printer connection.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDraft = () => {
    if (cart.length === 0) {
      alert('Cannot save empty cart as draft');
      return;
    }

    const draftData = {
      table: selectedTable,
      cart: cart,
      subtotal: subtotal,
      discountPercentage: discountPercentage,
      discountAmount: discountAmount,
      total: total,
      timestamp: new Date().toISOString()
    };

    // Save to localStorage
    const existingDrafts = JSON.parse(localStorage.getItem('orderDrafts') || '[]');
    existingDrafts.push(draftData);
    localStorage.setItem('orderDrafts', JSON.stringify(existingDrafts));

    alert('Order saved as draft!');
    
    // Clear current order
    onClearCart();
    setSelectedTable('');
  };

  const handlePlaceOrder = async (shouldPrint = false) => {
    if (!selectedTable) {
      alert('Please select table before placing order');
      return;
    }

    setIsProcessing(true);
    try {
      const orderData = {
        cart,
        table: selectedTable,
        subtotal,
        discountPercentage,
        discountAmount,
        total,
        timestamp: new Date().toISOString()
      };

      // Send order to server
      const response = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error('Failed to place order');
      }

      const result = await response.json();
      
      if (shouldPrint) {
        try {
          await printService.printBill(orderData);
          alert('Order placed and bill printed successfully!');
        } catch (printError) {
          console.error('Print error:', printError);
          alert('Order placed successfully, but printing failed. Please check your printer.');
        }
      } else {
        alert('Order placed successfully!');
      }

      // Clear the cart and selections
      onClearCart();
      setSelectedTable('');
      
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
            value={selectedTable} 
            onChange={(e) => setSelectedTable(e.target.value)}
            className="table-select"
            style={{ 
              backgroundColor: selectedTable ? '#e8f5e8' : '#fff',
              borderColor: selectedTable ? '#4caf50' : '#ddd'
            }}
          >
            <option value="">Select Table</option>
            <option value="table-1">🪑 Table 1</option>
            <option value="table-2">🪑 Table 2</option>
            <option value="table-3">🪑 Table 3</option>
            <option value="table-4">🪑 Table 4</option>
            <option value="table-5">🪑 Table 5</option>
            <option value="table-6">🪑 Table 6</option>
            <option value="table-7">🪑 Table 7</option>
            <option value="table-8">🪑 Table 8</option>
            <option value="counter">🏪 Counter</option>
            <option value="vip-1">⭐ VIP Table 1</option>
            <option value="vip-2">⭐ VIP Table 2</option>
          </select>
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
          <span>Discount :</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span 
              style={{ cursor: 'pointer', color: '#852FEE' }}
              onClick={handleDiscountEdit}
            >
              ✏️ {discountPercentage}% ({discountAmount.toFixed(1)}$)
            </span>
          </div>
        </div>
        <div className="summary-row total">
          <span>Total :</span>
          <span>{total.toFixed(0)}$</span>
        </div>
      </div>

      <div className="order-actions">
        <div className="action-buttons-row">
          <button 
            className="action-btn draft-btn"
            onClick={handleDraft}
            disabled={cart.length === 0}
          >
            📄 DRAFT
          </button>
          <button 
            className="action-btn bill-print-btn"
            onClick={() => handlePlaceOrder(true)}
            disabled={isProcessing || cart.length === 0}
          >
            {isProcessing ? 'Processing...' : 'BILL & PRINT'}
          </button>
        </div>
        
        <div className="action-buttons-row">
          <button 
            className="action-btn place-order-btn full-width"
            onClick={() => handlePlaceOrder(false)}
            disabled={isProcessing || cart.length === 0}
          >
            {isProcessing ? 'Processing...' : 'PLACE ORDER'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderPanel;