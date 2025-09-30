import React, { useState, useEffect } from 'react';
import './Dashboard.css';

const Dashboard = ({ initialSection = 'overview' }) => {
  const [metrics, setMetrics] = useState({
    dailySales: 0,
    yesterdaySales: 0,
    dailyExpenses: 0,
    yesterdayExpenses: 0,
    discountAmount: 0,
    dailyProfit: 0,
    totalStock: 0,
    stockCost: 0
  });

  const [loading, setLoading] = useState(true);
  const [selectedDateRange, setSelectedDateRange] = useState('today');
  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);

  // Fetch real dashboard data from API
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      
      try {
        // Fetch orders data from API
        const ordersResponse = await fetch('http://localhost:5000/api/orders');
        const orders = await ordersResponse.json();
        
        // Calculate date ranges
        const today = new Date();
        const yesterday = new Date(Date.now() - 86400000);
        const weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        
        let filteredOrders = orders;
        
        // Filter orders based on selected date range
        switch (selectedDateRange) {
          case 'today':
            filteredOrders = orders.filter(order => 
              new Date(order.created_at).toDateString() === today.toDateString()
            );
            break;
          case 'yesterday':
            filteredOrders = orders.filter(order => 
              new Date(order.created_at).toDateString() === yesterday.toDateString()
            );
            break;
          case 'week':
            filteredOrders = orders.filter(order => 
              new Date(order.created_at) >= weekStart
            );
            break;
          case 'month':
            filteredOrders = orders.filter(order => 
              new Date(order.created_at) >= monthStart
            );
            break;
          case 'custom':
            if (customDateRange.startDate && customDateRange.endDate) {
              filteredOrders = orders.filter(order => {
                const orderDate = new Date(order.created_at);
                return orderDate >= new Date(customDateRange.startDate) && 
                       orderDate <= new Date(customDateRange.endDate);
              });
            }
            break;
          default:
            filteredOrders = orders;
        }
        
        // Calculate metrics for today and yesterday specifically
        const todayOrders = orders.filter(order => 
          new Date(order.created_at).toDateString() === today.toDateString()
        );
        
        const yesterdayOrders = orders.filter(order => 
          new Date(order.created_at).toDateString() === yesterday.toDateString()
        );
        
        const dailySales = todayOrders.reduce((sum, order) => sum + parseFloat(order.total), 0);
        const yesterdaySales = yesterdayOrders.reduce((sum, order) => sum + parseFloat(order.total), 0);
        const dailyDiscount = todayOrders.reduce((sum, order) => sum + parseFloat(order.discount || 0), 0);
        
        // Estimate expenses (25% of sales for demo)
        const dailyExpenses = dailySales * 0.25;
        const yesterdayExpenses = yesterdaySales * 0.25;
        const dailyProfit = dailySales - dailyExpenses;
        
        // Mock stock data (in real app, this would come from inventory API)
        const totalStock = 1250;
        const stockCost = 45750.50;
        
        const calculatedMetrics = {
          dailySales,
          yesterdaySales,
          dailyExpenses,
          yesterdayExpenses,
          discountAmount: dailyDiscount,
          dailyProfit,
          totalStock,
          stockCost
        };
        
        setMetrics(calculatedMetrics);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Fallback to mock data if API fails
        const mockData = {
          dailySales: 2450.75,
          yesterdaySales: 2180.50,
          dailyExpenses: 612.69,
          yesterdayExpenses: 545.13,
          discountAmount: 245.00,
          dailyProfit: 1838.06,
          totalStock: 1250,
          stockCost: 45750.50
        };
        setMetrics(mockData);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [selectedDateRange, customDateRange]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const calculateGrowth = (current, previous) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  const handleDateRangeChange = (range) => {
    setSelectedDateRange(range);
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

  const MetricCard = ({ title, value, icon, trend, trendValue, color = 'primary' }) => (
    <div className={`metric-card ${color}`}>
      <div className="metric-header">
        <div className="metric-icon">{icon}</div>
        <div className={`metric-trend ${trend}`}>
          {trend === 'up' ? '📈' : trend === 'down' ? '📉' : '➖'}
          {trendValue && <span>{trendValue}%</span>}
        </div>
      </div>
      <div className="metric-content">
        <h3 className="metric-title">{title}</h3>
        <div className="metric-value">
          {loading ? (
            <div className="loading-skeleton"></div>
          ) : (
            typeof value === 'number' ? formatCurrency(value) : value
          )}
        </div>
      </div>
    </div>
  );

  const DateFilterButtons = () => (
    <div className="date-filter-container">
      <div className="date-filter-buttons">
        <button 
          className={`filter-btn ${selectedDateRange === 'today' ? 'active' : ''}`}
          onClick={() => handleDateRangeChange('today')}
        >
          Today
        </button>
        <button 
          className={`filter-btn ${selectedDateRange === 'yesterday' ? 'active' : ''}`}
          onClick={() => handleDateRangeChange('yesterday')}
        >
          Yesterday
        </button>
        <button 
          className={`filter-btn ${selectedDateRange === 'week' ? 'active' : ''}`}
          onClick={() => handleDateRangeChange('week')}
        >
          This Week
        </button>
        <button 
          className={`filter-btn ${selectedDateRange === 'month' ? 'active' : ''}`}
          onClick={() => handleDateRangeChange('month')}
        >
          This Month
        </button>
        <button 
          className={`filter-btn ${selectedDateRange === 'custom' ? 'active' : ''}`}
          onClick={() => handleDateRangeChange('custom')}
        >
          Custom Date
        </button>
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

  const OverviewSection = () => (
    <div className="dashboard-section">
      <div className="section-header">
        <h2>📊 Dashboard Overview</h2>
        <p>Key performance indicators and business metrics</p>
      </div>
      
      {/* Main Metrics Grid */}
      <div className="metrics-grid main-metrics">
        <MetricCard
          title="Daily Sales"
          value={metrics.dailySales}
          icon="💰"
          trend="up"
          trendValue={calculateGrowth(metrics.dailySales, metrics.yesterdaySales)}
          color="success"
        />
        
        <MetricCard
          title="Yesterday's Sales"
          value={metrics.yesterdaySales}
          icon="📅"
          trend="neutral"
          color="info"
        />
        
        <MetricCard
          title="Daily Expense"
          value={metrics.dailyExpenses}
          icon="💸"
          trend="up"
          trendValue={calculateGrowth(metrics.dailyExpenses, metrics.yesterdayExpenses)}
          color="danger"
        />
        
        <MetricCard
          title="Yesterday's Expense"
          value={metrics.yesterdayExpenses}
          icon="📋"
          trend="neutral"
          color="warning"
        />
        
        <MetricCard
          title="Discount Amount"
          value={metrics.discountAmount}
          icon="🏷️"
          trend={metrics.discountAmount > 0 ? "up" : "neutral"}
          trendValue={metrics.discountAmount > 0 ? "Active" : "None"}
          color="warning"
        />
        
        <MetricCard
          title="Daily Profit"
          value={metrics.dailyProfit}
          icon="📈"
          trend="up"
          trendValue={calculateGrowth(metrics.dailyProfit, metrics.yesterdaySales - metrics.yesterdayExpenses)}
          color="primary"
        />
      </div>

      {/* Stock Information Section */}
      <div className="stock-section">
        <div className="section-header">
          <h2>📦 Stock Information</h2>
          <p>Current inventory status and valuation</p>
        </div>
        
        <div className="metrics-grid stock-metrics">
          <MetricCard
            title="Total Stock"
            value={`${metrics.totalStock} Items`}
            icon="📦"
            trend="neutral"
            color="info"
          />
          
          <MetricCard
            title="Stock Cost"
            value={metrics.stockCost}
            icon="💎"
            trend="up"
            trendValue="2.5"
            color="primary"
          />
        </div>
      </div>
      
      {/* Recent Orders Section */}
      <div className="recent-orders-section">
        <div className="section-header">
          <h2>📋 Recent Orders</h2>
          <p>Latest transactions and order activity</p>
        </div>
        <RecentOrdersTable />
      </div>
    </div>
  );

  const RecentOrdersTable = () => {
    const [recentOrders, setRecentOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(true);

    useEffect(() => {
      const fetchRecentOrders = async () => {
        try {
          const response = await fetch('http://localhost:5000/api/orders');
          const orders = await response.json();
          setRecentOrders(orders.slice(0, 5)); // Get last 5 orders
        } catch (error) {
          console.error('Error fetching recent orders:', error);
        } finally {
          setOrdersLoading(false);
        }
      };

      fetchRecentOrders();
    }, []);

    if (ordersLoading) {
      return (
        <div className="recent-orders-table">
          <div className="loading-skeleton" style={{ height: '200px' }}></div>
        </div>
      );
    }

    return (
      <div className="recent-orders-table">
        <table>
          <thead>
            <tr>
              <th>Order #</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.length > 0 ? (
              recentOrders.map(order => (
                <tr key={order.id}>
                  <td>{order.order_number}</td>
                  <td>{order.items || 'No items'}</td>
                  <td>{formatCurrency(order.total)}</td>
                  <td>
                    <span className={`status-badge ${order.status}`}>
                      {order.status}
                    </span>
                  </td>
                  <td>{new Date(order.created_at).toLocaleDateString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                  No orders found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>📊 Dashboard Overview</h1>
        <DateFilterButtons />
      </div>
      
      <div className="dashboard-content">
        <OverviewSection />
      </div>
    </div>
  );
};

export default Dashboard;