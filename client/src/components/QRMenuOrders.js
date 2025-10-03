import React, { useState, useEffect } from 'react';
import './QRMenuOrders.css';

const QRMenuOrders = ({ onClose }) => {
  const [qrOrders, setQrOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Sample QR orders data
  useEffect(() => {
    const sampleOrders = [
      {
        id: 'QR001',
        tableNumber: 'T-05',
        customerName: 'John Doe',
        phone: '+1234567890',
        items: [
          { name: 'Margherita Pizza', quantity: 2, price: 12.99 },
          { name: 'Coca Cola', quantity: 2, price: 2.50 }
        ],
        total: 30.98,
        status: 'pending',
        orderTime: '2024-01-15 14:30:00',
        qrCode: 'QR_T05_001',
        paymentMethod: 'QR Payment'
      },
      {
        id: 'QR002',
        tableNumber: 'T-12',
        customerName: 'Jane Smith',
        phone: '+1987654321',
        items: [
          { name: 'Chicken Burger', quantity: 1, price: 8.50 },
          { name: 'Caesar Salad', quantity: 1, price: 7.25 }
        ],
        total: 15.75,
        status: 'preparing',
        orderTime: '2024-01-15 14:45:00',
        qrCode: 'QR_T12_002',
        paymentMethod: 'Mobile Banking QR'
      },
      {
        id: 'QR003',
        tableNumber: 'T-08',
        customerName: 'Mike Johnson',
        phone: '+1122334455',
        items: [
          { name: 'Fish & Chips', quantity: 1, price: 11.75 },
          { name: 'Green Tea', quantity: 1, price: 2.00 }
        ],
        total: 13.75,
        status: 'ready',
        orderTime: '2024-01-15 15:00:00',
        qrCode: 'QR_T08_003',
        paymentMethod: 'Digital Wallet QR'
      }
    ];
    setQrOrders(sampleOrders);
  }, []);

  const handleStatusChange = (orderId, newStatus) => {
    setQrOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    ));
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
  };

  const filteredOrders = qrOrders.filter(order => {
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.tableNumber.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'preparing': return '#3b82f6';
      case 'ready': return '#10b981';
      case 'completed': return '#6b7280';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'preparing': return '👨‍🍳';
      case 'ready': return '✅';
      case 'completed': return '📦';
      case 'cancelled': return '❌';
      default: return '📋';
    }
  };

  return (
    <div className="qr-orders-modal">
      <div className="qr-orders-container">
        <div className="qr-orders-header">
          <div className="header-left">
            <h2>📱 QR Menu Orders</h2>
            <p>Manage orders placed through QR menu system</p>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="qr-orders-filters">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by Order ID, Customer, or Table..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="status-filters">
            {['all', 'pending', 'preparing', 'ready', 'completed'].map(status => (
              <button
                key={status}
                className={`filter-btn ${filterStatus === status ? 'active' : ''}`}
                onClick={() => setFilterStatus(status)}
              >
                {status === 'all' ? 'All Orders' : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="qr-orders-content">
          <div className="orders-list">
            {filteredOrders.length === 0 ? (
              <div className="no-orders">
                <p>No QR orders found</p>
                <small>Orders placed through QR menu will appear here</small>
              </div>
            ) : (
              filteredOrders.map(order => (
                <div key={order.id} className="order-card">
                  <div className="order-header">
                    <div className="order-info">
                      <h3>Order #{order.id}</h3>
                      <p>Table: {order.tableNumber} • {order.customerName}</p>
                      <small>{order.orderTime}</small>
                    </div>
                    <div className="order-status">
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(order.status) }}
                      >
                        {getStatusIcon(order.status)} {order.status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="order-details">
                    <div className="items-summary">
                      <p>{order.items.length} items • Total: ${order.total.toFixed(2)}</p>
                      <p>Payment: {order.paymentMethod}</p>
                    </div>
                    <div className="order-actions">
                      <button 
                        className="btn-view"
                        onClick={() => handleViewOrder(order)}
                      >
                        View Details
                      </button>
                      {order.status === 'pending' && (
                        <button 
                          className="btn-accept"
                          onClick={() => handleStatusChange(order.id, 'preparing')}
                        >
                          Accept Order
                        </button>
                      )}
                      {order.status === 'preparing' && (
                        <button 
                          className="btn-ready"
                          onClick={() => handleStatusChange(order.id, 'ready')}
                        >
                          Mark Ready
                        </button>
                      )}
                      {order.status === 'ready' && (
                        <button 
                          className="btn-complete"
                          onClick={() => handleStatusChange(order.id, 'completed')}
                        >
                          Complete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {selectedOrder && (
            <div className="order-detail-modal">
              <div className="order-detail-content">
                <div className="detail-header">
                  <h3>Order Details - #{selectedOrder.id}</h3>
                  <button onClick={() => setSelectedOrder(null)}>×</button>
                </div>
                
                <div className="detail-body">
                  <div className="customer-info">
                    <h4>Customer Information</h4>
                    <p><strong>Name:</strong> {selectedOrder.customerName}</p>
                    <p><strong>Phone:</strong> {selectedOrder.phone}</p>
                    <p><strong>Table:</strong> {selectedOrder.tableNumber}</p>
                    <p><strong>QR Code:</strong> {selectedOrder.qrCode}</p>
                  </div>

                  <div className="order-items">
                    <h4>Order Items</h4>
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="item-row">
                        <span>{item.name}</span>
                        <span>×{item.quantity}</span>
                        <span>${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="total-row">
                      <strong>Total: ${selectedOrder.total.toFixed(2)}</strong>
                    </div>
                  </div>

                  <div className="order-timeline">
                    <h4>Order Status</h4>
                    <p>Current Status: <span style={{ color: getStatusColor(selectedOrder.status) }}>
                      {getStatusIcon(selectedOrder.status)} {selectedOrder.status.toUpperCase()}
                    </span></p>
                    <p>Order Time: {selectedOrder.orderTime}</p>
                    <p>Payment Method: {selectedOrder.paymentMethod}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRMenuOrders;