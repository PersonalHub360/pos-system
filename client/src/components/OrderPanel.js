import React, { useState, useEffect } from 'react';
import axios from 'axios';
import printService from '../services/PrintService';
import './OrderPanel.css';

const OrderPanel = ({ cart, onUpdateItem, onRemoveItem, onClearCart, draftState, onDraftStateUsed, invoiceSettings }) => {
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
        items: cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          price: item.price,
          name: item.name
        })),
        subtotal,
        discount: discountAmount,
        total,
        table: selectedTable,
        timestamp: new Date().toISOString()
      };

      await printService.printBill(orderData, invoiceSettings?.multiCurrency);
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

    // Get existing drafts
    const existingDrafts = JSON.parse(localStorage.getItem('orderDrafts') || '[]');
    
    // Check if we're editing an existing draft
    if (draftState && draftState.isEditing && typeof draftState.editingIndex === 'number') {
      // Update existing draft
      existingDrafts[draftState.editingIndex] = draftData;
      localStorage.setItem('orderDrafts', JSON.stringify(existingDrafts));
      alert('Draft order updated successfully!');
    } else {
      // Create new draft
      existingDrafts.push(draftData);
      localStorage.setItem('orderDrafts', JSON.stringify(existingDrafts));
      alert('Order saved as draft!');
    }
    
    // Clear current order
    onClearCart();
    setSelectedTable('');
    
    // Clear draft state if we were editing
    if (onDraftStateUsed) {
      onDraftStateUsed();
    }
  };

  const handlePlaceOrder = async (shouldPrint = false) => {
    if (!selectedTable) {
      alert('Please select table before placing order');
      return;
    }

    if (cart.length === 0) {
      alert('Please add items to cart before placing order');
      return;
    }

    setIsProcessing(true);
    try {
      // Convert cart to items format expected by server
      const items = cart.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        price: item.price,
        name: item.name
      }));

      const orderData = {
        tableId: selectedTable,
        customerName: `Table ${selectedTable}`,
        orderType: 'dine_in',
        items,
        discountAmount,
        discountType: 'percentage',
        serviceCharge: 0,
        notes: '',
        paymentMethod: 'cash'
      };

      // Send order to server
      console.log('Sending order data:', JSON.stringify(orderData, null, 2));
      
      const response = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Server error response:', errorData);
        throw new Error(`Failed to place order: ${response.status} - ${errorData}`);
      }

      const result = await response.json();
      console.log('Order placed successfully:', result);
      
      if (shouldPrint) {
        try {
          const printData = {
            items: cart.map(item => ({
              product_id: item.id,
              quantity: item.quantity,
              price: item.price,
              name: item.name
            })),
            subtotal,
            discount: discountAmount,
            total,
            table: selectedTable,
            timestamp: new Date().toISOString()
          };
          await printService.printBill(printData, invoiceSettings?.multiCurrency);
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
      setDiscountPercentage(0);
      
    } catch (error) {
      console.error('Error placing order:', error);
      alert(`Failed to place order: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="order-panel">
      {draftState && draftState.isEditing && (
        <div className="editing-indicator">
          <span className="editing-icon">✏️</span>
          <span className="editing-text">Editing Draft Order</span>
        </div>
      )}
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
        <div className="summary-header">
          <h3>📋 Order Summary</h3>
          <div className="summary-badge">
            {cart.length} {cart.length === 1 ? 'item' : 'items'}
          </div>
        </div>
        <div className="summary-content">
          <div className="summary-calculations">
            <div className="summary-row subtotal-row">
              <span className="summary-label">
                <span className="label-icon">💰</span>
                Subtotal
              </span>
              <span className="summary-value">${subtotal.toFixed(2)}</span>
            </div>
            <div className="summary-row discount-row">
              <span className="summary-label">
                <span className="label-icon">🏷️</span>
                Discount
              </span>
              <div className="discount-section">
                <span 
                  className="discount-edit-btn"
                  onClick={handleDiscountEdit}
                  title="Click to edit discount"
                >
                  {discountPercentage > 0 ? (
                    <>
                      <span className="discount-percentage">{discountPercentage}%</span>
                      <span className="discount-amount">-${discountAmount.toFixed(2)}</span>
                    </>
                  ) : (
                    <span className="no-discount">No discount</span>
                  )}
                  <span className="edit-icon">✏️</span>
                </span>
              </div>
            </div>
          </div>
          <div className="summary-total">
            <div className="summary-row total-row">
              <span className="summary-label">
                <span className="label-icon">🧾</span>
                Total Amount
              </span>
              <span className="summary-value total-amount">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="order-actions">
        <div className="actions-header">
          <h4>⚡ Quick Actions</h4>
          <div className="actions-status">
            {isProcessing && <span className="processing-indicator">Processing...</span>}
          </div>
        </div>
        <div className="actions-container">
          <div className="secondary-actions">
            <button 
              className="action-btn draft-btn"
              onClick={handleDraft}
              disabled={cart.length === 0}
              title="Save current order as draft"
            >
              <div className="btn-content">
                <span className="btn-icon">📄</span>
                <div className="btn-text-group">
                  <span className="btn-text">Save Draft</span>
                  <span className="btn-subtitle">Save for later</span>
                </div>
              </div>
            </button>
            <button 
              className="action-btn print-receipt-btn"
              onClick={handlePOSAndPrint}
              disabled={isProcessing || cart.length === 0}
              title="Print receipt without placing order"
            >
              <div className="btn-content">
                <span className="btn-icon">🖨️</span>
                <div className="btn-text-group">
                  <span className="btn-text">{isProcessing ? 'Printing...' : 'Print Receipt'}</span>
                  <span className="btn-subtitle">Receipt only</span>
                </div>
              </div>
            </button>
          </div>
          
          <div className="primary-actions">
            <button 
              className="action-btn place-order-btn"
              onClick={() => handlePlaceOrder(false)}
              disabled={isProcessing || cart.length === 0 || !selectedTable}
              title="Place order without printing"
            >
              <div className="btn-content">
                <span className="btn-icon">🛒</span>
                <div className="btn-text-group">
                  <span className="btn-text">{isProcessing ? 'Processing...' : 'Place Order'}</span>
                  <span className="btn-subtitle">Send to kitchen</span>
                </div>
              </div>
            </button>
            <button 
              className="action-btn bill-print-btn primary-btn"
              onClick={() => handlePlaceOrder(true)}
              disabled={isProcessing || cart.length === 0 || !selectedTable}
              title="Place order and print bill"
            >
              <div className="btn-content">
                <span className="btn-icon">🧾</span>
                <div className="btn-text-group">
                  <span className="btn-text">{isProcessing ? 'Processing...' : 'Order & Print'}</span>
                  <span className="btn-subtitle">Complete order</span>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderPanel;