import React, { useState } from 'react';
import './ReceiptModal.css';

const ReceiptModal = ({ 
  isOpen, 
  onClose, 
  receiptData, 
  onCompleteOrder 
}) => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cash');
  const [processing, setProcessing] = useState(false);

  if (!isOpen || !receiptData) return null;

  const handleCompleteOrder = () => {
    setProcessing(true);
    
    // Simulate order processing
    setTimeout(() => {
      onCompleteOrder();
      setProcessing(false);
      onClose();
      alert(`Order completed successfully!\nPayment Method: ${selectedPaymentMethod.toUpperCase()}\nTotal: $${receiptData.total.toFixed(2)}`);
    }, 1500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="receipt-modal-overlay">
      <div className="receipt-modal">
        <div className="receipt-header">
          <h2>Order Receipt</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="receipt-content">
          {/* Store Info */}
          <div className="store-info">
            <h3>POS Restaurant</h3>
            <p>123 Main Street, City, State 12345</p>
            <p>Phone: (555) 123-4567</p>
            <p>Date: {receiptData.timestamp}</p>
            <p>Order ID: #{receiptData.id}</p>
          </div>

          {/* Customer & Table Info - Only show if there's content */}
          {(receiptData.table || receiptData.customer.name || receiptData.customer.phone) && (
            <div className="order-info">
              {receiptData.table && (
                <p><strong>Table:</strong> {receiptData.table}</p>
              )}
              {receiptData.customer.name && (
                <p><strong>Customer:</strong> {receiptData.customer.name}</p>
              )}
              {receiptData.customer.phone && (
                <p><strong>Phone:</strong> {receiptData.customer.phone}</p>
              )}
            </div>
          )}

          {/* Items */}
          <div className="receipt-items">
            <h4>Order Items</h4>
            <div className="items-header">
              <span>Item</span>
              <span>Qty</span>
              <span>Price</span>
              <span>Total</span>
            </div>
            {receiptData.items.map((item, index) => (
              <div key={index} className="receipt-item">
                <span className="item-name">{item.name}</span>
                <span className="item-qty">{item.quantity}</span>
                <span className="item-price">${item.price.toFixed(2)}</span>
                <span className="item-total">${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="receipt-totals">
            <div className="total-row">
              <span>Subtotal:</span>
              <span>${receiptData.subtotal.toFixed(2)}</span>
            </div>
            {receiptData.discountAmount > 0 && (
              <div className="total-row">
                <span>Discount ({receiptData.discountType === 'percentage' ? `${receiptData.discountValue}%` : `$${receiptData.discountValue}`}):</span>
                <span>-${receiptData.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="total-row final-total">
              <span><strong>Total:</strong></span>
              <span><strong>${receiptData.total.toFixed(2)}</strong></span>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="payment-selection">
            <h4>Select Payment Method</h4>
            <div className="payment-methods">
              <button 
                className={`payment-method-btn ${selectedPaymentMethod === 'cash' ? 'active' : ''}`}
                onClick={() => setSelectedPaymentMethod('cash')}
              >
                💵 Cash
              </button>
              <button 
                className={`payment-method-btn ${selectedPaymentMethod === 'card' ? 'active' : ''}`}
                onClick={() => setSelectedPaymentMethod('card')}
              >
                💳 Card
              </button>
              <button 
                className={`payment-method-btn ${selectedPaymentMethod === 'digital' ? 'active' : ''}`}
                onClick={() => setSelectedPaymentMethod('digital')}
              >
                📱 Digital
              </button>
            </div>
          </div>
        </div>

        <div className="receipt-actions">
          <button 
            className="print-btn"
            onClick={handlePrint}
          >
            🖨️ Print Receipt
          </button>
          <button 
            className="complete-order-btn"
            onClick={handleCompleteOrder}
            disabled={processing}
          >
            {processing ? 'Processing...' : '✅ Complete Order'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;