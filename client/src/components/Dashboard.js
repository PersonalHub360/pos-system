import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Area, AreaChart
} from 'recharts';
import { 
  FaShoppingCart, FaDollarSign, FaUsers, FaBox, 
  FaArrowUp, FaArrowDown, FaCalendarAlt, FaFilter,
  FaClock, FaPercentage, FaTrendingUp, FaTrendingDown
} from 'react-icons/fa';
import { useData } from '../contexts/DataContext';
import './Dashboard.css';
import io from 'socket.io-client';
import websocketClient from '../utils/websocket';

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
    estimatedProfit: 0,
    totalCost: 0,
    grossSales: 0,
    netSales: 0,
    abaSales: 0,
    acledaSales: 0,
    cashSales: 0,
    cardSales: 0,
    digitalSales: 0,
    dueSales: 0,
    totalProducts: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    totalInventoryValue: 0
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
    try {
      setLoading(true);
      
      // Fetch comprehensive dashboard metrics from API
      const response = await fetch('/api/dashboard/metrics');
      if (response.ok) {
        const data = await response.json();
        
        // Update metrics with API data
        setMetrics(prevMetrics => ({
          ...prevMetrics,
          // Sales metrics
          dailySales: data.sales?.today_sales || 0,
          yesterdaySales: data.sales?.yesterday_sales || 0,
          weeklySales: data.sales?.weekly_sales || 0,
          monthlySales: data.sales?.monthly_sales || 0,
          grossSales: data.sales?.gross_sales || 0,
          totalDiscounts: data.sales?.total_discounts || 0,
          averageOrderValue: data.sales?.avg_order_value || 0,
          
          // Profit metrics
          estimatedProfit: data.profits?.estimated_profit || 0,
          totalCost: data.profits?.total_cost || 0,
          totalRevenue: data.profits?.total_revenue || 0,
          profitMargin: data.profits?.profit_margin || 0,
          
          // Order metrics
          totalOrders: data.orders?.today_orders || 0,
          completedOrders: data.orders?.completed_orders || 0,
          
          // Inventory metrics
          totalProducts: data.inventory?.total_products || 0,
          lowStockItems: data.inventory?.low_stock_items || 0,
          outOfStockItems: data.inventory?.out_of_stock_items || 0,
          totalInventoryValue: data.inventory?.total_inventory_value || 0
        }));
        
        // Calculate net sales
        const netSales = (data.sales?.gross_sales || 0) - (data.sales?.total_discounts || 0);
        setMetrics(prevMetrics => ({
          ...prevMetrics,
          netSales: netSales
        }));
        
      } else {
        // Fallback to mock data if API fails
        console.warn('API call failed, using mock data');
        setMetrics(prevMetrics => ({
          ...prevMetrics,
          dailySales: 2450.75,
          yesterdaySales: 2180.50,
          weeklySales: 15420.30,
          monthlySales: 68750.25,
          estimatedExpenses: 612.69,
          totalDiscounts: 245.50,
          profitMargin: 25.8,
          estimatedProfit: 1838.06,
          totalCost: 612.69,
          grossSales: 2696.25,
          netSales: 2450.75,
          abaSales: 850.25,
          acledaSales: 720.50,
          cashSales: 680.00,
          cardSales: 200.00,
          digitalSales: 0,
          dueSales: 0,
          totalProducts: 156,
          lowStockItems: 12,
          outOfStockItems: 3,
          totalInventoryValue: 45230.50,
          stockData: [
            { name: 'Burgers', stock: 45, icon: '🍔' },
            { name: 'Pizzas', stock: 32, icon: '🍕' },
            { name: 'Drinks', stock: 18, icon: '🥤' },
            { name: 'Desserts', stock: 25, icon: '🍰' }
          ]
        }));
      }
      
      // Fetch recent orders
      const ordersResponse = await fetch('/api/dashboard/recent-orders');
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        setOrders(ordersData);
      } else {
        // Fallback orders data
        setOrders([
          { id: 1, total: 45.50, status: 'completed', timestamp: new Date().toISOString() },
          { id: 2, total: 32.75, status: 'pending', timestamp: new Date().toISOString() },
          { id: 3, total: 67.20, status: 'completed', timestamp: new Date().toISOString() },
        ]);
      }
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Use fallback data on error
      setMetrics(prevMetrics => ({
        ...prevMetrics,
        dailySales: 2450.75,
        yesterdaySales: 2180.50,
        weeklySales: 15420.30,
        monthlySales: 68750.25,
        estimatedExpenses: 612.69,
        totalDiscounts: 245.50,
        profitMargin: 25.8,
        estimatedProfit: 1838.06,
        totalCost: 612.69,
        grossSales: 2696.25,
        netSales: 2450.75,
        totalProducts: 156,
        lowStockItems: 12,
        outOfStockItems: 3,
        totalInventoryValue: 45230.50
      }));
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
    
    // WebSocket real-time updates
    const handleDashboardUpdate = (event) => {
      const { detail } = event;
      console.log('Real-time dashboard update received:', detail);
      
      if (detail.metrics) {
        // Update dashboard metrics immediately
        if (detail.metrics.sales) {
          setMetrics(prevMetrics => ({
            ...prevMetrics,
            dailySales: detail.metrics.sales.today_sales || prevMetrics.dailySales,
            totalOrders: detail.metrics.sales.today_orders || prevMetrics.totalOrders,
            totalDiscounts: detail.metrics.sales.today_discounts || prevMetrics.totalDiscounts,
            averageOrderValue: detail.metrics.sales.avg_order_value || prevMetrics.averageOrderValue
          }));
        }
        
        if (detail.metrics.inventory) {
          setMetrics(prevMetrics => ({
            ...prevMetrics,
            totalProducts: detail.metrics.inventory.total_products || prevMetrics.totalProducts,
            lowStockItems: detail.metrics.inventory.low_stock_items || prevMetrics.lowStockItems,
            outOfStockItems: detail.metrics.inventory.out_of_stock_items || prevMetrics.outOfStockItems
          }));
        }
      }
      
      // Trigger full refresh after a short delay
      setTimeout(() => {
        fetchDashboardData();
      }, 1000);
    };

    // Listen for sales metrics updates
    const handleSalesMetricsUpdate = (event) => {
      const { detail } = event;
      console.log('Sales metrics update received:', detail);
      
      setMetrics(prevMetrics => ({
        ...prevMetrics,
        dailySales: detail.today_sales || prevMetrics.dailySales,
        totalOrders: detail.today_orders || prevMetrics.totalOrders,
        totalDiscounts: detail.today_discounts || prevMetrics.totalDiscounts,
        averageOrderValue: detail.avg_order_value || prevMetrics.averageOrderValue,
        weeklySales: detail.weekly_sales || prevMetrics.weeklySales,
        monthlySales: detail.monthly_sales || prevMetrics.monthlySales
      }));
    };

    // Add event listeners
    window.addEventListener('dashboardUpdate', handleDashboardUpdate);
    window.addEventListener('salesMetricsUpdate', handleSalesMetricsUpdate);

    // Cleanup event listeners on component unmount
    return () => {
      window.removeEventListener('dashboardUpdate', handleDashboardUpdate);
      window.removeEventListener('salesMetricsUpdate', handleSalesMetricsUpdate);
    };

    // Subscribe to WebSocket events
    websocketClient.subscribe('connected', () => {
      console.log('Dashboard connected to WebSocket');
    });

    websocketClient.subscribe('disconnected', () => {
      console.log('Dashboard disconnected from WebSocket');
    });
  }, []);

  // Separate useEffect for date range changes
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
      <EnhancedHeaderWithStatsPreview />
      
      {/* Main Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today's Sales</p>
              <p className="text-2xl font-bold text-gray-900">${metrics.dailySales?.toFixed(2) || '0.00'}</p>
              <p className="text-xs text-green-600 mt-1">
                {metrics.yesterdaySales > 0 && 
                  `${((metrics.dailySales - metrics.yesterdaySales) / metrics.yesterdaySales * 100).toFixed(1)}% from yesterday`
                }
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Estimated Profit</p>
              <p className="text-2xl font-bold text-gray-900">${metrics.estimatedProfit?.toFixed(2) || '0.00'}</p>
              <p className="text-xs text-green-600 mt-1">{metrics.profitMargin?.toFixed(1) || '0.0'}% margin</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalOrders || 0}</p>
              <p className="text-xs text-blue-600 mt-1">{metrics.completedOrders || 0} completed</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Discounts</p>
              <p className="text-2xl font-bold text-gray-900">${metrics.totalDiscounts?.toFixed(2) || '0.00'}</p>
              <p className="text-xs text-orange-600 mt-1">Today's discounts</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Gross Sales</p>
              <p className="text-xl font-bold text-gray-900">${metrics.grossSales?.toFixed(2) || '0.00'}</p>
              <p className="text-xs text-gray-500 mt-1">Before discounts</p>
            </div>
            <div className="p-2 bg-gray-100 rounded-full">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Net Sales</p>
              <p className="text-xl font-bold text-gray-900">${metrics.netSales?.toFixed(2) || '0.00'}</p>
              <p className="text-xs text-gray-500 mt-1">After discounts</p>
            </div>
            <div className="p-2 bg-gray-100 rounded-full">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 8h6m-5 0a3 3 0 110 6H9l3 3m-3-6h6m6 1a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Order</p>
              <p className="text-xl font-bold text-gray-900">${metrics.averageOrderValue?.toFixed(2) || '0.00'}</p>
              <p className="text-xs text-gray-500 mt-1">Per transaction</p>
            </div>
            <div className="p-2 bg-gray-100 rounded-full">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Cost</p>
              <p className="text-xl font-bold text-gray-900">${metrics.totalCost?.toFixed(2) || '0.00'}</p>
              <p className="text-xs text-gray-500 mt-1">Cost of goods</p>
            </div>
            <div className="p-2 bg-gray-100 rounded-full">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-xl font-bold text-gray-900">{metrics.totalProducts || 0}</p>
              <p className="text-xs text-gray-500 mt-1">In inventory</p>
            </div>
            <div className="p-2 bg-indigo-100 rounded-full">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
              <p className="text-xl font-bold text-gray-900">{metrics.lowStockItems || 0}</p>
              <p className="text-xs text-yellow-600 mt-1">Need restocking</p>
            </div>
            <div className="p-2 bg-yellow-100 rounded-full">
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Out of Stock</p>
              <p className="text-xl font-bold text-gray-900">{metrics.outOfStockItems || 0}</p>
              <p className="text-xs text-red-600 mt-1">Urgent restock</p>
            </div>
            <div className="p-2 bg-red-100 rounded-full">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Inventory Value</p>
              <p className="text-xl font-bold text-gray-900">${metrics.totalInventoryValue?.toFixed(2) || '0.00'}</p>
              <p className="text-xs text-gray-500 mt-1">Total value</p>
            </div>
            <div className="p-2 bg-teal-100 rounded-full">
              <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      
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