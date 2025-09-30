import React, { useState, useEffect } from 'react';
import './Reports.css';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('sales');
  const [dateRange, setDateRange] = useState('today');
  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [reportData, setReportData] = useState({
    sales: [],
    inventory: [],
    customers: [],
    financial: {}
  });
  const [loading, setLoading] = useState(false);

  // Fetch report data based on selected filters
  useEffect(() => {
    fetchReportData();
  }, [activeTab, dateRange, customDateRange]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      // Fetch data from API based on active tab and date range
      const response = await fetch(`http://localhost:5000/api/orders`);
      const orders = await response.json();
      
      // Filter orders based on date range
      const filteredOrders = filterOrdersByDateRange(orders);
      
      // Process data for different report types
      const processedData = {
        sales: processSalesData(filteredOrders),
        inventory: processInventoryData(filteredOrders),
        customers: processCustomerData(filteredOrders),
        financial: processFinancialData(filteredOrders)
      };
      
      setReportData(processedData);
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterOrdersByDateRange = (orders) => {
    const today = new Date();
    const yesterday = new Date(Date.now() - 86400000);
    const weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    switch (dateRange) {
      case 'today':
        return orders.filter(order => 
          new Date(order.created_at).toDateString() === today.toDateString()
        );
      case 'yesterday':
        return orders.filter(order => 
          new Date(order.created_at).toDateString() === yesterday.toDateString()
        );
      case 'week':
        return orders.filter(order => 
          new Date(order.created_at) >= weekStart
        );
      case 'month':
        return orders.filter(order => 
          new Date(order.created_at) >= monthStart
        );
      case 'custom':
        if (customDateRange.startDate && customDateRange.endDate) {
          return orders.filter(order => {
            const orderDate = new Date(order.created_at);
            return orderDate >= new Date(customDateRange.startDate) && 
                   orderDate <= new Date(customDateRange.endDate);
          });
        }
        return orders;
      default:
        return orders;
    }
  };

  const processSalesData = (orders) => {
    return orders.map(order => ({
      id: order.id,
      date: new Date(order.created_at).toLocaleDateString(),
      time: new Date(order.created_at).toLocaleTimeString(),
      total: parseFloat(order.total),
      items: order.items?.length || 0,
      discount: parseFloat(order.discount || 0),
      status: order.status,
      paymentMethod: order.payment_method || 'Cash'
    }));
  };

  const processInventoryData = (orders) => {
    // Mock inventory data for demonstration
    return [
      { item: 'Coffee', sold: 45, revenue: 225.00, profit: 135.00 },
      { item: 'Sandwich', sold: 32, revenue: 320.00, profit: 192.00 },
      { item: 'Pastry', sold: 28, revenue: 140.00, profit: 84.00 },
      { item: 'Tea', sold: 22, revenue: 88.00, profit: 52.80 },
      { item: 'Salad', sold: 18, revenue: 180.00, profit: 108.00 }
    ];
  };

  const processCustomerData = (orders) => {
    // Mock customer data for demonstration
    return [
      { name: 'John Doe', orders: 12, totalSpent: 450.00, lastVisit: '2024-01-15' },
      { name: 'Jane Smith', orders: 8, totalSpent: 320.00, lastVisit: '2024-01-14' },
      { name: 'Mike Johnson', orders: 15, totalSpent: 675.00, lastVisit: '2024-01-13' },
      { name: 'Sarah Wilson', orders: 6, totalSpent: 240.00, lastVisit: '2024-01-12' },
      { name: 'David Brown', orders: 10, totalSpent: 380.00, lastVisit: '2024-01-11' }
    ];
  };

  const processFinancialData = (orders) => {
    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total), 0);
    const totalDiscount = orders.reduce((sum, order) => sum + parseFloat(order.discount || 0), 0);
    const totalOrders = orders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    return {
      totalRevenue,
      totalDiscount,
      totalOrders,
      avgOrderValue,
      netRevenue: totalRevenue - totalDiscount,
      estimatedProfit: (totalRevenue - totalDiscount) * 0.6 // 60% profit margin estimate
    };
  };

  const handleDateRangeChange = (range) => {
    setDateRange(range);
    if (range !== 'custom') {
      setShowCustomDatePicker(false);
    } else {
      setShowCustomDatePicker(true);
    }
  };

  const handleCustomDateChange = (field, value) => {
    setCustomDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const exportReport = () => {
    const dataToExport = reportData[activeTab];
    const csvContent = generateCSV(dataToExport, activeTab);
    downloadCSV(csvContent, `${activeTab}_report_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const generateCSV = (data, type) => {
    if (type === 'sales') {
      const headers = ['Order ID', 'Date', 'Time', 'Total', 'Items', 'Discount', 'Status', 'Payment Method'];
      const rows = data.map(item => [
        item.id, item.date, item.time, item.total, item.items, item.discount, item.status, item.paymentMethod
      ]);
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    } else if (type === 'inventory') {
      const headers = ['Item', 'Sold', 'Revenue', 'Profit'];
      const rows = data.map(item => [item.item, item.sold, item.revenue, item.profit]);
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    } else if (type === 'customers') {
      const headers = ['Name', 'Orders', 'Total Spent', 'Last Visit'];
      const rows = data.map(item => [item.name, item.orders, item.totalSpent, item.lastVisit]);
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
    return '';
  };

  const downloadCSV = (csvContent, filename) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const renderDateFilters = () => (
    <div className="date-filters">
      <div className="filter-buttons">
        {['today', 'yesterday', 'week', 'month', 'custom'].map(range => (
          <button
            key={range}
            className={`filter-btn ${dateRange === range ? 'active' : ''}`}
            onClick={() => handleDateRangeChange(range)}
          >
            {range.charAt(0).toUpperCase() + range.slice(1)}
          </button>
        ))}
      </div>
      
      {showCustomDatePicker && (
        <div className="custom-date-picker">
          <input
            type="date"
            value={customDateRange.startDate}
            onChange={(e) => handleCustomDateChange('startDate', e.target.value)}
            placeholder="Start Date"
          />
          <span>to</span>
          <input
            type="date"
            value={customDateRange.endDate}
            onChange={(e) => handleCustomDateChange('endDate', e.target.value)}
            placeholder="End Date"
          />
        </div>
      )}
    </div>
  );

  const renderSalesReport = () => (
    <div className="report-content">
      <div className="report-summary">
        <div className="summary-card">
          <h4>Total Revenue</h4>
          <p className="summary-value">{formatCurrency(reportData.financial.totalRevenue || 0)}</p>
        </div>
        <div className="summary-card">
          <h4>Total Orders</h4>
          <p className="summary-value">{reportData.financial.totalOrders || 0}</p>
        </div>
        <div className="summary-card">
          <h4>Average Order</h4>
          <p className="summary-value">{formatCurrency(reportData.financial.avgOrderValue || 0)}</p>
        </div>
        <div className="summary-card">
          <h4>Total Discount</h4>
          <p className="summary-value">{formatCurrency(reportData.financial.totalDiscount || 0)}</p>
        </div>
      </div>
      
      <div className="report-table">
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Date</th>
              <th>Time</th>
              <th>Total</th>
              <th>Items</th>
              <th>Discount</th>
              <th>Status</th>
              <th>Payment</th>
            </tr>
          </thead>
          <tbody>
            {reportData.sales.map(order => (
              <tr key={order.id}>
                <td>#{order.id}</td>
                <td>{order.date}</td>
                <td>{order.time}</td>
                <td>{formatCurrency(order.total)}</td>
                <td>{order.items}</td>
                <td>{formatCurrency(order.discount)}</td>
                <td>
                  <span className={`status-badge ${order.status}`}>
                    {order.status}
                  </span>
                </td>
                <td>{order.paymentMethod}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderInventoryReport = () => (
    <div className="report-content">
      <div className="report-table">
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Units Sold</th>
              <th>Revenue</th>
              <th>Profit</th>
              <th>Profit Margin</th>
            </tr>
          </thead>
          <tbody>
            {reportData.inventory.map((item, index) => (
              <tr key={index}>
                <td>{item.item}</td>
                <td>{item.sold}</td>
                <td>{formatCurrency(item.revenue)}</td>
                <td>{formatCurrency(item.profit)}</td>
                <td>{((item.profit / item.revenue) * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderCustomerReport = () => (
    <div className="report-content">
      <div className="report-table">
        <table>
          <thead>
            <tr>
              <th>Customer Name</th>
              <th>Total Orders</th>
              <th>Total Spent</th>
              <th>Average Order</th>
              <th>Last Visit</th>
            </tr>
          </thead>
          <tbody>
            {reportData.customers.map((customer, index) => (
              <tr key={index}>
                <td>{customer.name}</td>
                <td>{customer.orders}</td>
                <td>{formatCurrency(customer.totalSpent)}</td>
                <td>{formatCurrency(customer.totalSpent / customer.orders)}</td>
                <td>{customer.lastVisit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderFinancialReport = () => (
    <div className="report-content">
      <div className="financial-overview">
        <div className="financial-card">
          <h4>📊 Revenue Overview</h4>
          <div className="financial-details">
            <div className="detail-row">
              <span>Gross Revenue:</span>
              <span>{formatCurrency(reportData.financial.totalRevenue || 0)}</span>
            </div>
            <div className="detail-row">
              <span>Total Discounts:</span>
              <span className="negative">-{formatCurrency(reportData.financial.totalDiscount || 0)}</span>
            </div>
            <div className="detail-row total">
              <span>Net Revenue:</span>
              <span>{formatCurrency(reportData.financial.netRevenue || 0)}</span>
            </div>
          </div>
        </div>
        
        <div className="financial-card">
          <h4>💰 Profit Analysis</h4>
          <div className="financial-details">
            <div className="detail-row">
              <span>Estimated Profit:</span>
              <span>{formatCurrency(reportData.financial.estimatedProfit || 0)}</span>
            </div>
            <div className="detail-row">
              <span>Profit Margin:</span>
              <span>{reportData.financial.netRevenue > 0 ? ((reportData.financial.estimatedProfit / reportData.financial.netRevenue) * 100).toFixed(1) : 0}%</span>
            </div>
            <div className="detail-row">
              <span>Average Order Value:</span>
              <span>{formatCurrency(reportData.financial.avgOrderValue || 0)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="reports-container">
      <div className="reports-header">
        <div className="header-content">
          <h1>📈 Reports & Analytics</h1>
          <p>Comprehensive business insights and performance metrics</p>
        </div>
        <div className="header-actions">
          <button className="export-btn" onClick={exportReport}>
            📥 Export Report
          </button>
        </div>
      </div>

      {renderDateFilters()}

      <div className="reports-tabs">
        <button
          className={`tab-btn ${activeTab === 'sales' ? 'active' : ''}`}
          onClick={() => setActiveTab('sales')}
        >
          💰 Sales Report
        </button>
        <button
          className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          📦 Inventory Report
        </button>
        <button
          className={`tab-btn ${activeTab === 'customers' ? 'active' : ''}`}
          onClick={() => setActiveTab('customers')}
        >
          👥 Customer Report
        </button>
        <button
          className={`tab-btn ${activeTab === 'financial' ? 'active' : ''}`}
          onClick={() => setActiveTab('financial')}
        >
          📊 Financial Report
        </button>
      </div>

      <div className="reports-content">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading report data...</p>
          </div>
        ) : (
          <>
            {activeTab === 'sales' && renderSalesReport()}
            {activeTab === 'inventory' && renderInventoryReport()}
            {activeTab === 'customers' && renderCustomerReport()}
            {activeTab === 'financial' && renderFinancialReport()}
          </>
        )}
      </div>
    </div>
  );
};

export default Reports;