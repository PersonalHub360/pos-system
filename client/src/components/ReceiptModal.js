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
      // Ensure the order exists on the server. If not, create it first.
      let serverOrderId = receiptData.serverOrderId;

      const mapItemsForServer = (items) =>
        items.map((item) => ({
          // Prefer explicit product_id if present, otherwise fall back to id
          product_id: item.product_id ?? item.id,
          quantity: Number(item.quantity) || 0,
          price: Number(item.price) || 0,
          name: item.name,
        }));

      // If we don't have a server order id, attempt to create the order
      if (!serverOrderId) {
        const createPayload = {
          items: mapItemsForServer(receiptData.items || []),
          subtotal: Number(receiptData.subtotal ?? 0),
          discount: Number(receiptData.discountAmount ?? receiptData.discount ?? 0),
          total: Number(receiptData.total ?? 0),
          table: receiptData.table || null,
          timestamp: new Date().toISOString(),
        };

        const createRes = await fetch('http://localhost:5000/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(createPayload),
        });

        if (!createRes.ok) {
          const errText = await createRes.text();
          throw new Error(`Failed to create order: ${createRes.status} - ${errText}`);
        }

        const created = await createRes.json();
        serverOrderId = created.id || created.order?.id;
      }

      // Update order status to completed via API
      const updateRes = await fetch(`http://localhost:5000/api/orders/${serverOrderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
          payment_method: selectedPaymentMethod,
          completed_at: new Date().toISOString(),
        }),
      });

      if (!updateRes.ok) {
        // If order not found (e.g., 404), try creating and updating again as fallback
        if (updateRes.status === 404) {
          const fallbackPayload = {
            items: mapItemsForServer(receiptData.items || []),
            subtotal: Number(receiptData.subtotal ?? 0),
            discount: Number(receiptData.discountAmount ?? receiptData.discount ?? 0),
            total: Number(receiptData.total ?? 0),
            table: receiptData.table || null,
            timestamp: new Date().toISOString(),
          };

          const fallbackCreate = await fetch('http://localhost:5000/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fallbackPayload),
          });

          if (!fallbackCreate.ok) {
            const errText = await fallbackCreate.text();
            throw new Error(`Fallback create failed: ${fallbackCreate.status} - ${errText}`);
          }

          const createdOrder = await fallbackCreate.json();
          const newOrderId = createdOrder.id || createdOrder.order?.id;

          const repeatUpdate = await fetch(`http://localhost:5000/api/orders/${newOrderId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: 'completed',
              payment_method: selectedPaymentMethod,
              completed_at: new Date().toISOString(),
            }),
          });

          if (!repeatUpdate.ok) {
            const errText = await repeatUpdate.text();
            throw new Error(`Failed to complete order: ${repeatUpdate.status} - ${errText}`);
          }

          // Keep serverOrderId consistent for downstream events/UI
          serverOrderId = newOrderId;
        } else {
          const errText = await updateRes.text();
          throw new Error(`Failed to update order status: ${updateRes.status} - ${errText}`);
        }
      }

      // Emit real-time events
      const orderCompletionData = {
        id: serverOrderId || receiptData.id,
        total: receiptData.total,
        payment_method: selectedPaymentMethod,
        items: receiptData.items,
        discount: receiptData.discountAmount ?? receiptData.discount ?? 0,
        subtotal: receiptData.subtotal,
        timestamp: new Date().toISOString(),
      };

      window.dispatchEvent(
        new CustomEvent('orderCompleted', { detail: orderCompletionData })
      );

      window.dispatchEvent(
        new CustomEvent('inventoryUpdate', {
          detail: {
            type: 'items_sold',
            items: (receiptData.items || []).map((item) => ({
              product_id: item.id,
              quantity: item.quantity,
            })),
            timestamp: new Date().toISOString(),
          },
        })
      );

      onCompleteOrder();
      setProcessing(false);
      onClose();
      alert(
        `Order completed successfully!\nPayment Method: ${selectedPaymentMethod.toUpperCase()}\nTotal: $${Number(receiptData.total || 0).toFixed(2)}`
      );
    } catch (error) {
      console.error('Error completing order:', error);
      setProcessing(false);
      // Surface server-provided error details to aid diagnosis
      const message = typeof error?.message === 'string' ? error.message : 'Unknown error';
      alert(`Error completing order. ${message}`);
    }
  };

  const handlePrintAndComplete = async () => {
    // Print first, then complete the order
    window.print();
    await handleCompleteOrder();
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
            className="print-complete-btn"
            onClick={handlePrintAndComplete}
            disabled={processing}
          >
            {processing ? 'Processing...' : '🖨️✅ Print & Complete'}
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