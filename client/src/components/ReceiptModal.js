import React, { useState } from 'react';
import './ReceiptModal.css';

const ReceiptModal = ({ 
  isOpen, 
  onClose, 
  receiptData, 
  onCompleteOrder 
}) => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('aba');
  const [processing, setProcessing] = useState(false);

  if (!isOpen || !receiptData) return null;

  const handleCompleteOrder = async () => {
    setProcessing(true);
    
    try {
      // Trigger print before completing the order
      window.print();
      
      // Update order status to completed via API
      const response = await fetch(`http://localhost:5000/api/orders/${receiptData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: 'completed',
          payment_method: selectedPaymentMethod,
          completed_at: new Date().toISOString()
        }),
      });

      if (response.ok) {
        // Emit real-time dashboard update event
        const orderCompletionData = {
          id: receiptData.id,
          total: receiptData.total,
          payment_method: selectedPaymentMethod,
          items: receiptData.items,
          discount: receiptData.discount || 0,
          subtotal: receiptData.subtotal,
          timestamp: new Date().toISOString()
        };

        // Trigger dashboard refresh via custom event
        window.dispatchEvent(new CustomEvent('orderCompleted', { 
          detail: orderCompletionData 
        }));

        // Trigger inventory update event
        window.dispatchEvent(new CustomEvent('inventoryUpdate', {
          detail: {
            type: 'items_sold',
            items: receiptData.items.map(item => ({
              product_id: item.id,
              quantity: item.quantity
            })),
            timestamp: new Date().toISOString()
          }
        }));

        onCompleteOrder();
        setProcessing(false);
        onClose();
        alert(`Order completed successfully!\nPayment Method: ${selectedPaymentMethod.toUpperCase()}\nTotal: $${receiptData.total.toFixed(2)}`);
      } else {
        throw new Error('Failed to update order status');
      }
    } catch (error) {
      console.error('Error completing order:', error);
      setProcessing(false);
      alert('Error completing order. Please try again.');
    }
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

          {/* Customer Info - Only show if there's content */}
          {receiptData.customer.name && (
            <div className="order-info">
              <p><strong>Customer:</strong> {receiptData.customer.name}</p>
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
                className={`payment-method-btn ${selectedPaymentMethod === 'aba' ? 'active' : ''}`}
                onClick={() => setSelectedPaymentMethod('aba')}
              >
                🏦 ABA
              </button>
              <button 
                className={`payment-method-btn ${selectedPaymentMethod === 'acleda' ? 'active' : ''}`}
                onClick={() => setSelectedPaymentMethod('acleda')}
              >
                🏛️ Acleda
              </button>
              <button 
                className={`payment-method-btn ${selectedPaymentMethod === 'due' ? 'active' : ''}`}
                onClick={() => setSelectedPaymentMethod('due')}
              >
                📋 Due
              </button>
              <button 
                className={`payment-method-btn ${selectedPaymentMethod === 'cash' ? 'active' : ''}`}
                onClick={() => setSelectedPaymentMethod('cash')}
              >
                💵 Cash
              </button>
              <button 
                className={`payment-method-btn ${selectedPaymentMethod === 'cardpay' ? 'active' : ''}`}
                onClick={() => setSelectedPaymentMethod('cardpay')}
              >
                💳 Card Pay
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