import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import './Dashboard.css';
import io from 'socket.io-client';

const Dashboard = () => {
  const { stockData, expenseData, dashboardMetrics, updateDashboardMetrics } = useData();
  const [metrics, setMetrics] = useState({
    dailySales: 0,
    yesterdaySales: 0,
    weeklySales: 0,
    monthlySales: 0,
    estimatedExpenses: 0,
    stockData: [],
    totalOrders: 0,
    completedOrders: 0,
    averageOrderValue: 0,
    totalRevenue: 0,
    totalDiscounts: 0,
    profitMargin: 0,
    abaSales: 0,
    acledaSales: 0,
    cashSales: 0,
    dueSales: 0
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('today');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [animationTrigger, setAnimationTrigger] = useState(false);
  const [orders, setOrders] = useState([]);
  const [socket, setSocket] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);

  // Define fetchDashboardData function
  const fetchDashboardData = async () => {
    setLoading(true);
    
    try {
      // Fetch dashboard metrics from new API endpoint
      const metricsResponse = await fetch('http://localhost:5000/api/dashboard/metrics');
      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setMetrics(prev => ({
          ...prev,
          ...metricsData
        }));
      }

      // Fetch recent orders
      const recentOrdersResponse = await fetch('http://localhost:5000/api/dashboard/recent-orders');
      if (recentOrdersResponse.ok) {
        const recentOrdersData = await recentOrdersResponse.json();
        setOrders(recentOrdersData);
      }

      // Fallback to existing orders API if dashboard API is not available
      const ordersResponse = await fetch('http://localhost:5000/api/orders');
      const ordersData = await ordersResponse.json();
      
      // Calculate date ranges
      const today = new Date();
      const yesterday = new Date(Date.now() - 86400000);
      const weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      
      // Filter orders based on date ranges
      const todayOrders = ordersData.filter(order => 
        new Date(order.created_at).toDateString() === today.toDateString()
      );
      
      const yesterdayOrders = ordersData.filter(order => 
        new Date(order.created_at).toDateString() === yesterday.toDateString()
      );
      
      const weekOrders = ordersData.filter(order => 
        new Date(order.created_at) >= weekStart
      );
      
      const monthOrders = ordersData.filter(order => 
        new Date(order.created_at) >= monthStart
      );
      
      // Calculate metrics from orders data
      const dailySales = todayOrders.reduce((sum, order) => sum + parseFloat(order.total), 0);
      const yesterdaySales = yesterdayOrders.reduce((sum, order) => sum + parseFloat(order.total), 0);
      const weeklySales = weekOrders.reduce((sum, order) => sum + parseFloat(order.total), 0);
      const monthlySales = monthOrders.reduce((sum, order) => sum + parseFloat(order.total), 0);
      const estimatedExpenses = dailySales * 0.25; // 25% of sales as expenses
      
      // Calculate discounts and profit margins
      const totalDiscounts = todayOrders.reduce((sum, order) => sum + (parseFloat(order.discount) || 0), 0);
      const grossRevenue = dailySales + totalDiscounts;
      const profitMargin = grossRevenue > 0 ? ((dailySales - estimatedExpenses) / grossRevenue * 100) : 0;
      
      // Calculate payment method specific sales
      const abaSales = todayOrders
        .filter(order => order.paymentMethod === 'ABA' || order.paymentMethod === 'aba')
        .reduce((sum, order) => sum + parseFloat(order.total), 0);
      
      const acledaSales = todayOrders
        .filter(order => order.paymentMethod === 'ACLEDA' || order.paymentMethod === 'acleda')
        .reduce((sum, order) => sum + parseFloat(order.total), 0);
      
      const cashSales = todayOrders
        .filter(order => order.paymentMethod === 'Cash' || order.paymentMethod === 'cash')
        .reduce((sum, order) => sum + parseFloat(order.total), 0);
      
      const dueSales = todayOrders
        .filter(order => order.status === 'pending' || order.paymentStatus === 'due')
        .reduce((sum, order) => sum + parseFloat(order.total), 0);
      
      // Mock stock data - in real implementation, fetch from inventory API
      const stockData = [
        { name: 'Burgers', stock: 45, icon: '🍔' },
        { name: 'Pizzas', stock: 32, icon: '🍕' },
        { name: 'Drinks', stock: 18, icon: '🥤' },
        { name: 'Desserts', stock: 25, icon: '🍰' }
      ];
      
      setMetrics(prev => ({
        ...prev,
        dailySales,
        yesterdaySales,
        weeklySales,
        monthlySales,
        estimatedExpenses,
        stockData,
        totalDiscounts,
        profitMargin: profitMargin.toFixed(2),
        abaSales,
        acledaSales,
        cashSales,
        dueSales
      }));
      
      if (!orders.length) {
        setOrders((ordersData || []).slice(0, 8)); // Get recent orders only if not already set
      }
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Fallback to mock data
      setMetrics(prev => ({
        ...prev,
        dailySales: 2450.75,
        yesterdaySales: 2180.50,
        weeklySales: 15420.30,
        monthlySales: 68750.25,
        estimatedExpenses: 612.69,
        totalDiscounts: 245.50,
        profitMargin: 25.8,
        abaSales: 850.25,
        acledaSales: 720.50,
        cashSales: 680.00,
        dueSales: 200.00,
        stockData: [
          { name: 'Burgers', stock: 45, icon: '🍔' },
          { name: 'Pizzas', stock: 32, icon: '🍕' },
          { name: 'Drinks', stock: 18, icon: '🥤' },
          { name: 'Desserts', stock: 25, icon: '🍰' }
        ]
      }));
      
      if (!orders.length) {
        setOrders([
          { id: 1, total: 45.50, status: 'completed', timestamp: new Date().toISOString() },
          { id: 2, total: 32.75, status: 'pending', timestamp: new Date().toISOString() },
          { id: 3, total: 67.20, status: 'completed', timestamp: new Date().toISOString() },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Initialize Socket.IO connection and real-time updates
  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    // Listen for real-time dashboard updates
    newSocket.on('dashboard:update', (data) => {
      console.log('Dashboard update received:', data);
      setAnimationTrigger(true);
      setTimeout(() => setAnimationTrigger(false), 1000);
      
      // Add to recent activity
      setRecentActivity(prev => [{
        id: Date.now(),
        type: data.type,
        message: `Order #${data.data.id} completed - ${formatCurrency(data.data.total)}`,
        timestamp: new Date(data.timestamp)
      }, ...(prev || []).slice(0, 4)]);
      
      // Refresh dashboard data
      fetchDashboardData();
    });

    // Listen for sales metrics updates
    newSocket.on('dashboard:sales_update', (salesData) => {
      console.log('Sales metrics update received:', salesData);
      setMetrics(prev => ({
        ...prev,
        totalOrders: salesData.total_orders,
        totalRevenue: salesData.total_revenue,
        averageOrderValue: salesData.average_order_value,
        completedOrders: salesData.completed_orders
      }));
    });

    // Listen for inventory updates
    newSocket.on('inventory:update', (inventoryData) => {
      console.log('Inventory update received:', inventoryData);
      // Refresh dashboard data to get updated stock levels
      fetchDashboardData();
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Fetch dashboard data on component mount and date range change
  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

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
    setDateRange(range);
  };

  // Enhanced MetricCard component with animations and color variants
  const MetricCard = ({ title, value, icon, trend, trendValue, size, color = 'default', delay = 0 }) => {
    const getCardColor = (colorType) => {
      const colors = {
        primary: 'color-primary',
        success: 'color-success',
        warning: 'color-warning',
        danger: 'color-danger',
        info: 'color-info',
        default: ''
      };
      return colors[colorType] || '';
    };

    const formatValue = (val) => {
      if (typeof val === 'string' && val.includes('%')) {
        return val;
      }
      return formatCurrency(val);
    };

    return (
      <div 
        className={`metric-card ${size === 'large' ? 'large' : ''} ${getCardColor(color)} animate-metric-card hover-lift interactive-element`}
        style={{ animationDelay: `${delay}ms` }}
      >
        <div className="metric-header">
          <div className="metric-icon animate-bounce">{icon}</div>
          <div className={`metric-trend trend-${trend}`}>
            {trendValue}
          </div>
        </div>
        <div className="metric-content">
          <h3 className="metric-title">{title}</h3>
          <div className="metric-value">{formatValue(value)}</div>
        </div>
      </div>
    );
  };

  // Enhanced DateFilterButtons with animations
  const DateFilterButtons = () => (
    <div className="date-filter-buttons">
      {['today', 'yesterday', 'week', 'month'].map((filter, index) => (
        <button
          key={filter}
          className={`filter-btn ${dateRange === filter ? 'active' : ''} animate-button`}
          onClick={() => handleDateRangeChange(filter)}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <span className="button-text">
            {filter.charAt(0).toUpperCase() + filter.slice(1)}
          </span>
          <div className="button-ripple"></div>
        </button>
      ))}
    </div>
  );

  // Enhanced Header with Stats Preview
  const EnhancedHeaderWithStatsPreview = () => (
    <div className="dashboard-header animate-header">
      <div className="header-particles">
        <div className="particle particle-1"></div>
        <div className="particle particle-2"></div>
        <div className="particle particle-3"></div>
        <div className="particle particle-4"></div>
        <div className="particle particle-5"></div>
        <div className="particle particle-6"></div>
      </div>
      
      <div className="header-content">
        <h1 className="animate-title">
          Dashboard
        </h1>
        <p className="header-subtitle animate-subtitle">
          Real-time business analytics and insights
        </p>
      </div>
      
      <div className="header-stats-preview">
        <div className="mini-stat animate-mini-stat" style={{ animationDelay: '200ms' }}>
          <div className="mini-stat-value pulse-animation">
            {formatCurrency(metrics.dailySales)}
          </div>
          <div className="mini-stat-label">Today's Sales</div>
        </div>
        <div className="mini-stat animate-mini-stat" style={{ animationDelay: '400ms' }}>
          <div className="mini-stat-value pulse-animation">
            {orders.length}
          </div>
          <div className="mini-stat-label">Total Orders</div>
        </div>
        <div className="mini-stat animate-mini-stat" style={{ animationDelay: '600ms' }}>
          <div className="mini-stat-value pulse-animation">
            {calculateGrowth(metrics.dailySales, metrics.yesterdaySales)}%
          </div>
          <div className="mini-stat-label">Growth</div>
        </div>
      </div>
      
      <div className="date-filter-container">
        <DateFilterButtons />
      </div>
    </div>
  );

  // Sales Performance Section with enhanced visual design
  const SalesPerformanceSection = () => (
    <div className="dashboard-section sales-performance-section animate-section" style={{ animationDelay: '100ms' }}>
      <div className="section-header">
        <h2 className="animate-section-title">
          💰 Sales Performance
        </h2>
        <p className="animate-section-subtitle">
          Track your revenue and payment methods in real-time
        </p>
      </div>
      <div className="sales-metrics-grid">
        <div className="sales-metric-card aba-sales hover-lift interactive-element animate-metric-card" style={{ animationDelay: '200ms' }}>
          <div className="metric-icon">🏦</div>
          <div className="metric-content">
            <h3>ABA Sales</h3>
            <div className="metric-value">{formatCurrency(metrics.abaSales || 0)}</div>
            <div className="metric-trend trend-up">+6.8%</div>
          </div>
        </div>
        
        <div className="sales-metric-card acleda-sales hover-lift interactive-element animate-metric-card" style={{ animationDelay: '300ms' }}>
          <div className="metric-icon">🏛️</div>
          <div className="metric-content">
            <h3>Acleda Sales</h3>
            <div className="metric-value">{formatCurrency(metrics.acledaSales || 0)}</div>
            <div className="metric-trend trend-up">+4.2%</div>
          </div>
        </div>
        
        <div className="sales-metric-card due-sales hover-lift interactive-element animate-metric-card" style={{ animationDelay: '400ms' }}>
          <div className="metric-icon">⏰</div>
          <div className="metric-content">
            <h3>Due Sales</h3>
            <div className="metric-value">{formatCurrency(metrics.dueSales || 0)}</div>
            <div className="metric-trend trend-down">-2.1%</div>
          </div>
        </div>
        
        <div className="sales-metric-card cash-sales hover-lift interactive-element animate-metric-card" style={{ animationDelay: '500ms' }}>
          <div className="metric-icon">💵</div>
          <div className="metric-content">
            <h3>Cash Sales</h3>
            <div className="metric-value">{formatCurrency(metrics.cashSales || 0)}</div>
            <div className="metric-trend trend-neutral">+1.5%</div>
          </div>
        </div>
        
        <div className="sales-metric-card sales-revenue hover-lift interactive-element animate-metric-card" style={{ animationDelay: '600ms' }}>
          <div className="metric-icon">📈</div>
          <div className="metric-content">
            <h3>Sales Revenue</h3>
            <div className="metric-value">{formatCurrency(metrics.dailySales || 0)}</div>
            <div className="metric-trend trend-up">+12.5%</div>
          </div>
        </div>
        
        <div className="sales-metric-card sales-return hover-lift interactive-element animate-metric-card" style={{ animationDelay: '700ms' }}>
          <div className="metric-icon">🔄</div>
          <div className="metric-content">
            <h3>Sales Return</h3>
            <div className="metric-value">{formatCurrency(metrics.salesReturn || 0)}</div>
            <div className="metric-trend trend-down">-1.2%</div>
          </div>
        </div>
        
        <div className="sales-metric-card profit-margin hover-lift interactive-element animate-metric-card" style={{ animationDelay: '800ms' }}>
          <div className="metric-icon">💹</div>
          <div className="metric-content">
            <h3>Profit Margin</h3>
            <div className="metric-value">{metrics.profitMargin || 0}%</div>
            <div className="metric-trend trend-up">+2.1%</div>
          </div>
        </div>
      </div>
    </div>
  );

  // Enhanced Inventory Overview Section with animations
  const InventoryOverviewSection = () => (
    <div className="dashboard-section animate-section" style={{ animationDelay: '200ms' }}>
      <div className="section-header">
        <h2 className="animate-section-title">
          📦 Inventory Overview
        </h2>
        <p className="animate-section-subtitle">
          Monitor stock levels and inventory alerts
        </p>
      </div>
      <div className="inventory-grid">
        {metrics.stockData.map((item, index) => (
          <div 
            key={item.name} 
            className={`inventory-card ${item.stock < 20 ? 'low-stock' : ''} hover-lift interactive-element animate-inventory-card`}
            style={{ animationDelay: `${(index + 1) * 150}ms` }}
          >
            <div className="inventory-icon animate-inventory-icon">
              {item.icon}
            </div>
            <div className="inventory-details">
              <h3 className="animate-inventory-title">{item.name}</h3>
              <span className={`stock-value ${item.stock < 20 ? 'alert animate-alert' : 'animate-stock'}`}>
                {item.stock} units
              </span>
              <p className="animate-inventory-desc">
                {item.stock < 20 ? 'Low Stock Alert!' : 'In Stock'}
              </p>
            </div>
            {item.stock < 20 && (
              <div className="low-stock-alert animate-pulse">
                ⚠️ Low Stock Alert
              </div>
            )}
            <div className="inventory-pulse"></div>
          </div>
        ))}
      </div>
    </div>
  );

  // Enhanced Recent Activity Section with improved animations
  const RecentActivitySection = () => {
    return (
      <div className="dashboard-section animate-section" style={{ animationDelay: '400ms' }}>
        <div className="section-header">
          <h2 className="animate-section-title">
            🕒 Recent Activity
          </h2>
          <p className="animate-section-subtitle">
            Latest orders and transactions
          </p>
        </div>
        <div className="recent-orders">
          <div className="orders-container">
            {orders && orders.length > 0 ? (
              <div className="orders-table">
                <div className="table-header">
                  <span>Order ID</span>
                  <span>Customer</span>
                  <span>Total</span>
                  <span>Status</span>
                </div>
                {orders.slice(0, 5).map((order, index) => (
                  <div 
                    key={order._id} 
                    className="table-row animate-metric-card hover-lift interactive-element"
                    style={{ animationDelay: `${600 + index * 100}ms` }}
                  >
                    <span className="order-id">#{(order._id || '').slice(-6)}</span>
                    <span className="customer-name">{order.customerName || 'Walk-in Customer'}</span>
                    <span className="order-total">{formatCurrency(order.total)}</span>
                    <span className={`order-status status-${order.status}`}>
                      {order.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-orders animate-metric-card" style={{ animationDelay: '600ms' }}>
                <div className="no-orders-icon">📋</div>
                <p>No recent orders found</p>
                <small>Orders will appear here once you start making sales</small>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Stock Information Section
  const StockInformationSection = () => {
    return (
      <div className="dashboard-section stock-information-section animate-section" style={{ animationDelay: '200ms' }}>
        <div className="section-header">
          <h2 className="animate-section-title">
            📊 Stock Information
          </h2>
          <p className="animate-section-subtitle">
            Comprehensive inventory tracking and analytics
          </p>
        </div>
        <div className="stock-metrics-grid">
          {dashboardMetrics.stockData && dashboardMetrics.stockData.map((item, index) => (
            <div 
              key={index} 
              className={`stock-metric-card ${item.name.toLowerCase().replace(/\s+/g, '-')} animate-metric-card hover-lift`}
              style={{ animationDelay: `${300 + index * 100}ms` }}
            >
              <div className="metric-icon">{item.icon}</div>
              <div className="metric-content">
                <h3>{item.name}</h3>
                <div className="metric-value">{item.value}</div>
                <div className={`metric-trend trend-${item.trend}`}>
                  {item.trendValue}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Expense Information Section
  const ExpenseInformationSection = () => {
    return (
      <div className="dashboard-section expense-information-section animate-section" style={{ animationDelay: '600ms' }}>
        <div className="section-header">
          <h2 className="animate-section-title">
            💸 Expense Information
          </h2>
          <p className="animate-section-subtitle">
            Track and monitor business expenses
          </p>
        </div>
        <div className="expense-metrics-grid">
          {dashboardMetrics.expenseData && dashboardMetrics.expenseData.map((item, index) => (
            <div 
              key={index} 
              className={`expense-metric-card ${item.name.toLowerCase().replace(/\s+/g, '-')} animate-metric-card hover-lift`}
              style={{ animationDelay: `${700 + index * 100}ms` }}
            >
              <div className="metric-icon">{item.icon}</div>
              <div className="metric-content">
                <h3>{item.name}</h3>
                <div className="metric-value">{item.value}</div>
                <div className={`metric-trend trend-${item.trend}`}>
                  {item.trendValue}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Trigger animations on data updates
  useEffect(() => {
    setAnimationTrigger(prev => !prev);
  }, [metrics, dateRange]);

  return (
    <div className="dashboard-container">
      <div className="dashboard-main-grid">
        <SalesPerformanceSection />
        <StockInformationSection />
        <ExpenseInformationSection />
        <InventoryOverviewSection />
        <RecentActivitySection />
      </div>
      
      {/* Floating Action Elements */}
      <div className="floating-elements">
        <div className="floating-orb orb-1"></div>
        <div className="floating-orb orb-2"></div>
        <div className="floating-orb orb-3"></div>
      </div>
      
      {/* Background Animation Elements */}
      <div className="background-animation">
        <div className="wave wave-1"></div>
        <div className="wave wave-2"></div>
        <div className="wave wave-3"></div>
      </div>
    </div>
  );
};

export default Dashboard;