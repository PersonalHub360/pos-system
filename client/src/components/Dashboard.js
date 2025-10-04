import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Area, AreaChart
} from 'recharts';
import { 
  FaShoppingCart, FaDollarSign, FaUsers, FaBox, 
  FaArrowUp, FaArrowDown, FaCalendarAlt, FaFilter,
  FaClock, FaPercentage, FaChartLine
} from 'react-icons/fa';
import { useData } from '../contexts/DataContext';
import './Dashboard.css';
import './DashboardModern.css';
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
      

      
      <div className="date-filter-container">
        <DateFilterButtons />
      </div>
    </div>
  );

  // Sales Performance Section with enhanced visual design
  const SalesPerformanceSection = () => (
    <div className="dashboard-section sales-modern-section animate-section" style={{ animationDelay: '100ms' }}>
      <div className="section-header modern-header">
        <div className="header-content">
          <div className="header-icon-wrapper">
            <FaChartLine className="header-icon" />
          </div>
          <div className="header-text">
            <h2 className="modern-section-title">Sales Performance</h2>
            <p className="modern-section-subtitle">Track revenue streams and payment methods in real-time</p>
          </div>
        </div>
      </div>
      
      <div className="sales-modern-grid">
        <div className="sales-modern-card aba-sales-card animate-sales-modern" style={{ animationDelay: '100ms' }}>
          <div className="sales-card-background">
            <div className="background-pattern aba-pattern"></div>
          </div>
          <div className="sales-card-content">
            <div className="sales-header">
              <div className="sales-icon-container blue-gradient">
                <FaDollarSign className="sales-icon" />
              </div>
              <div className="sales-trend-badge positive-trend">
                <FaArrowUp className="trend-icon" />
                <span className="trend-value">+6.8%</span>
              </div>
            </div>
            <div className="sales-main-content">
              <h3 className="sales-title">ABA Sales</h3>
              <div className="sales-value-container">
                <span className="sales-value">{formatCurrency(metrics.abaSales || 0)}</span>
                <span className="sales-unit">USD</span>
              </div>
              <div className="sales-description">
                <span className="description-label">Bank transfer payments</span>
                <div className="progress-indicator">
                  <div className="progress-bar blue-bar">
                    <div className="progress-fill" style={{ width: '68%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="sales-visual-accent blue-accent"></div>
        </div>
        
        <div className="sales-modern-card acleda-sales-card animate-sales-modern" style={{ animationDelay: '200ms' }}>
          <div className="sales-card-background">
            <div className="background-pattern acleda-pattern"></div>
          </div>
          <div className="sales-card-content">
            <div className="sales-header">
              <div className="sales-icon-container emerald-gradient">
                <FaChartLine className="sales-icon" />
              </div>
              <div className="sales-trend-badge positive-trend">
                <FaArrowUp className="trend-icon" />
                <span className="trend-value">+4.2%</span>
              </div>
            </div>
            <div className="sales-main-content">
              <h3 className="sales-title">Acleda Sales</h3>
              <div className="sales-value-container">
                <span className="sales-value">{formatCurrency(metrics.acledaSales || 0)}</span>
                <span className="sales-unit">USD</span>
              </div>
              <div className="sales-description">
                <span className="description-label">Acleda bank payments</span>
                <div className="progress-indicator">
                  <div className="progress-bar emerald-bar">
                    <div className="progress-fill" style={{ width: '42%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="sales-visual-accent emerald-accent"></div>
        </div>
        
        <div className="sales-modern-card due-sales-card animate-sales-modern" style={{ animationDelay: '300ms' }}>
          <div className="sales-card-background">
            <div className="background-pattern due-pattern"></div>
          </div>
          <div className="sales-card-content">
            <div className="sales-header">
              <div className="sales-icon-container amber-gradient">
                <FaClock className="sales-icon" />
              </div>
              <div className="sales-trend-badge negative-trend">
                <FaArrowDown className="trend-icon" />
                <span className="trend-value">-2.1%</span>
              </div>
            </div>
            <div className="sales-main-content">
              <h3 className="sales-title">Due Sales</h3>
              <div className="sales-value-container">
                <span className="sales-value">{formatCurrency(metrics.dueSales || 0)}</span>
                <span className="sales-unit">USD</span>
              </div>
              <div className="sales-description">
                <span className="description-label">Pending payments</span>
                <div className="progress-indicator">
                  <div className="progress-bar amber-bar">
                    <div className="progress-fill" style={{ width: '21%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="sales-visual-accent amber-accent"></div>
        </div>
        
        <div className="sales-modern-card cash-sales-card animate-sales-modern" style={{ animationDelay: '400ms' }}>
          <div className="sales-card-background">
            <div className="background-pattern cash-pattern"></div>
          </div>
          <div className="sales-card-content">
            <div className="sales-header">
              <div className="sales-icon-container purple-gradient">
                <FaDollarSign className="sales-icon" />
              </div>
              <div className="sales-trend-badge neutral-trend">
                <FaArrowUp className="trend-icon" />
                <span className="trend-value">+1.5%</span>
              </div>
            </div>
            <div className="sales-main-content">
              <h3 className="sales-title">Cash Sales</h3>
              <div className="sales-value-container">
                <span className="sales-value">{formatCurrency(metrics.cashSales || 0)}</span>
                <span className="sales-unit">USD</span>
              </div>
              <div className="sales-description">
                <span className="description-label">Cash transactions</span>
                <div className="progress-indicator">
                  <div className="progress-bar purple-bar">
                    <div className="progress-fill" style={{ width: '15%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="sales-visual-accent purple-accent"></div>
        </div>
        
        <div className="sales-modern-card revenue-card animate-sales-modern" style={{ animationDelay: '500ms' }}>
          <div className="sales-card-background">
            <div className="background-pattern revenue-pattern"></div>
          </div>
          <div className="sales-card-content">
            <div className="sales-header">
              <div className="sales-icon-container rose-gradient">
                <FaChartLine className="sales-icon" />
              </div>
              <div className="sales-trend-badge positive-trend">
                <FaArrowUp className="trend-icon" />
                <span className="trend-value">+12.5%</span>
              </div>
            </div>
            <div className="sales-main-content">
              <h3 className="sales-title">Sales Revenue</h3>
              <div className="sales-value-container">
                <span className="sales-value">{formatCurrency(metrics.dailySales || 0)}</span>
                <span className="sales-unit">USD</span>
              </div>
              <div className="sales-description">
                <span className="description-label">Total daily revenue</span>
                <div className="progress-indicator">
                  <div className="progress-bar rose-bar">
                    <div className="progress-fill" style={{ width: '85%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="sales-visual-accent rose-accent"></div>
        </div>
        
        <div className="sales-modern-card return-card animate-sales-modern" style={{ animationDelay: '600ms' }}>
          <div className="sales-card-background">
            <div className="background-pattern return-pattern"></div>
          </div>
          <div className="sales-card-content">
            <div className="sales-header">
              <div className="sales-icon-container red-gradient">
                <FaArrowDown className="sales-icon" />
              </div>
              <div className="sales-trend-badge negative-trend">
                <FaArrowDown className="trend-icon" />
                <span className="trend-value">-1.2%</span>
              </div>
            </div>
            <div className="sales-main-content">
              <h3 className="sales-title">Sales Return</h3>
              <div className="sales-value-container">
                <span className="sales-value">{formatCurrency(metrics.salesReturn || 0)}</span>
                <span className="sales-unit">USD</span>
              </div>
              <div className="sales-description">
                <span className="description-label">Returned items</span>
                <div className="progress-indicator">
                  <div className="progress-bar red-bar">
                    <div className="progress-fill" style={{ width: '12%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="sales-visual-accent red-accent"></div>
        </div>
        
        <div className="sales-modern-card profit-card animate-sales-modern" style={{ animationDelay: '700ms' }}>
          <div className="sales-card-background">
            <div className="background-pattern profit-pattern"></div>
          </div>
          <div className="sales-card-content">
            <div className="sales-header">
              <div className="sales-icon-container teal-gradient">
                <FaPercentage className="sales-icon" />
              </div>
              <div className="sales-trend-badge positive-trend">
                <FaArrowUp className="trend-icon" />
                <span className="trend-value">+2.1%</span>
              </div>
            </div>
            <div className="sales-main-content">
              <h3 className="sales-title">Profit Margin</h3>
              <div className="sales-value-container">
                <span className="sales-value">{metrics.profitMargin || 0}%</span>
                <span className="sales-unit">Rate</span>
              </div>
              <div className="sales-description">
                <span className="description-label">Overall profitability</span>
                <div className="progress-indicator">
                  <div className="progress-circle teal-circle">
                    <span className="circle-value">{metrics.profitMargin || 0}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="sales-visual-accent teal-accent"></div>
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
  // Enhanced Recent Activity Section with card-based design
  const RecentActivitySection = () => {
    return (
      <div className="dashboard-section activity-modern-section animate-section" style={{ animationDelay: '400ms' }}>
        <div className="section-header modern-header">
          <div className="header-content">
            <div className="header-icon-wrapper activity-header-icon">
              <FaClock className="header-icon" />
            </div>
            <div className="header-text">
              <h2 className="modern-section-title">Recent Activity</h2>
              <p className="modern-section-subtitle">Latest orders and transactions in real-time</p>
            </div>
          </div>
        </div>
        
        <div className="activity-modern-grid">
          {orders && orders.length > 0 ? (
            orders.slice(0, 6).map((order, index) => (
              <div 
                key={order._id} 
                className="activity-modern-card animate-activity-modern hover-lift-modern"
                style={{ animationDelay: `${100 + index * 50}ms` }}
              >
                <div className="activity-card-background">
                  <div className="background-pattern activity-pattern"></div>
                  <div className="activity-floating-shapes">
                    <div className="shape shape-1"></div>
                    <div className="shape shape-2"></div>
                  </div>
                </div>
                
                <div className="activity-card-content">
                  <div className="activity-header">
                    <div className="activity-icon-container gradient-purple">
                      <FaShoppingCart className="activity-icon" />
                    </div>
                    <div className={`activity-status-badge ${
                      order.status === 'completed' ? 'status-success' : 
                      order.status === 'pending' ? 'status-warning' : 
                      order.status === 'cancelled' ? 'status-error' : 'status-info'
                    }`}>
                      <span className="status-dot"></span>
                      <span className="status-text">{order.status}</span>
                    </div>
                  </div>
                  
                  <div className="activity-main-content">
                    <h3 className="activity-title">Order #{(order._id || '').slice(-6)}</h3>
                    <div className="activity-value-container">
                      <span className="activity-value">{formatCurrency(order.total)}</span>
                      <span className="activity-currency">USD</span>
                    </div>
                    
                    <div className="activity-details-grid">
                      <div className="activity-detail-item">
                        <div className="detail-icon-wrapper customer-icon">
                          <FaUsers className="detail-icon" />
                        </div>
                        <div className="detail-content">
                          <span className="detail-label">Customer</span>
                          <span className="detail-value">{order.customerName || 'Walk-in'}</span>
                        </div>
                      </div>
                      
                      <div className="activity-detail-item">
                        <div className="detail-icon-wrapper time-icon">
                          <FaClock className="detail-icon" />
                        </div>
                        <div className="detail-content">
                          <span className="detail-label">Time</span>
                          <span className="detail-value">
                            {order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Just now'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="activity-detail-item">
                        <div className="detail-icon-wrapper items-icon">
                          <FaBox className="detail-icon" />
                        </div>
                        <div className="detail-content">
                          <span className="detail-label">Items</span>
                          <span className="detail-value">{order.items?.length || 0}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="activity-progress-indicator">
                      <div className="progress-bar purple-progress" style={{ width: '85%' }}></div>
                    </div>
                  </div>
                </div>
                
                <div className="activity-visual-accent purple-accent"></div>
              </div>
            ))
          ) : (
            <div className="activity-modern-card empty-state-card animate-activity-modern" style={{ animationDelay: '100ms' }}>
              <div className="activity-card-background">
                <div className="background-pattern empty-pattern"></div>
              </div>
              
              <div className="activity-card-content">
                <div className="empty-state-content">
                  <div className="empty-state-icon-wrapper gradient-gray">
                    <FaShoppingCart className="empty-state-icon" />
                  </div>
                  <div className="empty-state-main">
                    <h3 className="empty-state-title">No Recent Activity</h3>
                    <p className="empty-state-description">Orders will appear here once you start making sales</p>
                    <div className="empty-state-action">
                      <button className="empty-action-btn">
                        <FaShoppingCart className="btn-icon" />
                        <span>Create Order</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="activity-visual-accent gray-accent"></div>
            </div>
          )}
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
      {/* Animated Background Elements */}
      <div className="floating-elements">
        <div className="floating-orb orb-1"></div>
        <div className="floating-orb orb-2"></div>
        <div className="floating-orb orb-3"></div>
      </div>

      <div className="background-animation">
        <div className="wave wave-1"></div>
        <div className="wave wave-2"></div>
        <div className="wave wave-3"></div>
      </div>

      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
            Loading dashboard data...
          </p>
        </div>
      )}

      <EnhancedHeaderWithStatsPreview />
      
      {/* Enhanced Primary Metrics Section */}
      <div className="dashboard-section kpi-modern-section animate-section" style={{ animationDelay: '0ms' }}>
        <div className="section-header modern-header">
          <div className="header-content">
            <div className="header-icon-wrapper">
              <FaChartLine className="header-icon" />
            </div>
            <div className="header-text">
              <h2 className="modern-section-title">Key Performance Indicators</h2>
              <p className="modern-section-subtitle">Real-time business metrics and performance tracking</p>
            </div>
          </div>
        </div>
        
        <div className="kpi-modern-grid">
          <div className="kpi-modern-card gradient-blue animate-kpi-card" style={{ animationDelay: '100ms' }}>
            <div className="kpi-card-background">
              <div className="kpi-floating-shapes">
                <div className="shape shape-1"></div>
                <div className="shape shape-2"></div>
                <div className="shape shape-3"></div>
              </div>
            </div>
            <div className="kpi-card-content">
              <div className="kpi-header">
                <div className="kpi-icon-container blue-gradient">
                  <FaDollarSign className="kpi-icon" />
                </div>
                <div className="kpi-trend-indicator positive-trend">
                  <FaArrowUp className="trend-icon" />
                  <span className="trend-value">+12.5%</span>
                </div>
              </div>
              <div className="kpi-main-content">
                <h3 className="kpi-title">Today's Sales</h3>
                <div className="kpi-value-container">
                  <span className="kpi-value">{formatCurrency(metrics.dailySales || 0)}</span>
                  <span className="kpi-currency">USD</span>
                </div>
                <div className="kpi-description">
                  <span className="description-label">vs yesterday</span>
                  <div className="progress-indicator">
                    <div className="progress-bar blue-progress" style={{ width: '75%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="kpi-modern-card gradient-purple animate-kpi-card" style={{ animationDelay: '200ms' }}>
            <div className="kpi-card-background">
              <div className="kpi-floating-shapes">
                <div className="shape shape-1"></div>
                <div className="shape shape-2"></div>
                <div className="shape shape-3"></div>
              </div>
            </div>
            <div className="kpi-card-content">
              <div className="kpi-header">
                <div className="kpi-icon-container purple-gradient">
                  <FaShoppingCart className="kpi-icon" />
                </div>
                <div className="kpi-trend-indicator positive-trend">
                  <FaArrowUp className="trend-icon" />
                  <span className="trend-value">+8.3%</span>
                </div>
              </div>
              <div className="kpi-main-content">
                <h3 className="kpi-title">Total Orders</h3>
                <div className="kpi-value-container">
                  <span className="kpi-value">{metrics.totalOrders || 0}</span>
                  <span className="kpi-currency">Orders</span>
                </div>
                <div className="kpi-description">
                  <span className="description-label">this month</span>
                  <div className="progress-indicator">
                    <div className="progress-bar purple-progress" style={{ width: '68%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="kpi-modern-card gradient-green animate-kpi-card" style={{ animationDelay: '300ms' }}>
            <div className="kpi-card-background">
              <div className="kpi-floating-shapes">
                <div className="shape shape-1"></div>
                <div className="shape shape-2"></div>
                <div className="shape shape-3"></div>
              </div>
            </div>
            <div className="kpi-card-content">
              <div className="kpi-header">
                <div className="kpi-icon-container green-gradient">
                  <FaChartLine className="kpi-icon" />
                </div>
                <div className="kpi-trend-indicator positive-trend">
                  <FaArrowUp className="trend-icon" />
                  <span className="trend-value">+15.7%</span>
                </div>
              </div>
              <div className="kpi-main-content">
                <h3 className="kpi-title">Estimated Profit</h3>
                <div className="kpi-value-container">
                  <span className="kpi-value">{formatCurrency(metrics.estimatedProfit || 0)}</span>
                  <span className="kpi-currency">USD</span>
                </div>
                <div className="kpi-description">
                  <span className="description-label">profit margin</span>
                  <div className="progress-indicator">
                    <div className="progress-bar green-progress" style={{ width: '82%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="kpi-modern-card gradient-orange animate-kpi-card" style={{ animationDelay: '400ms' }}>
            <div className="kpi-card-background">
              <div className="kpi-floating-shapes">
                <div className="shape shape-1"></div>
                <div className="shape shape-2"></div>
                <div className="shape shape-3"></div>
              </div>
            </div>
            <div className="kpi-card-content">
              <div className="kpi-header">
                <div className="kpi-icon-container orange-gradient">
                  <FaBox className="kpi-icon" />
                </div>
                <div className="kpi-trend-indicator neutral-trend">
                  <FaArrowUp className="trend-icon" />
                  <span className="trend-value">+2.1%</span>
                </div>
              </div>
              <div className="kpi-main-content">
                <h3 className="kpi-title">Inventory Status</h3>
                <div className="kpi-value-container">
                  <span className="kpi-value">{metrics.totalProducts || 0}</span>
                  <span className="kpi-currency">Items</span>
                </div>
                <div className="kpi-description">
                  <span className="description-label">in stock</span>
                  <div className="progress-indicator">
                    <div className="progress-bar orange-progress" style={{ width: '91%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Overview Section - Modern Redesign */}
      <div className="dashboard-section financial-modern-section animate-section" style={{ animationDelay: '200ms' }}>
        <div className="section-header modern-header">
          <div className="header-content">
            <div className="header-icon-wrapper financial-header-icon">
              <FaDollarSign className="header-icon" />
            </div>
            <div className="header-text">
              <h2 className="modern-section-title">Financial Overview</h2>
              <p className="modern-section-subtitle">Comprehensive financial analytics and revenue insights</p>
            </div>
          </div>
        </div>

        <div className="financial-modern-grid">
          <div className="financial-modern-card gross-sales-card animate-financial-modern" style={{ animationDelay: '100ms' }}>
            <div className="financial-card-background">
              <div className="background-pattern gross-pattern"></div>
            </div>
            <div className="financial-card-content">
              <div className="financial-header">
                <div className="financial-icon-container emerald-gradient">
                  <FaDollarSign className="financial-icon" />
                </div>
                <div className="financial-trend-indicator positive-trend">
                  <FaArrowUp className="trend-icon" />
                  <span className="trend-value">+8.5%</span>
                </div>
              </div>
              <div className="financial-main-content">
                <h3 className="financial-title">Gross Sales</h3>
                <div className="financial-value-container">
                  <span className="financial-value">${(metrics.grossSales || 0).toFixed(0)}</span>
                  <span className="financial-currency">.{((metrics.grossSales || 0) % 1).toFixed(2).slice(2)}</span>
                </div>
                <div className="financial-description">
                  <span className="description-label">total revenue</span>
                  <div className="progress-indicator">
                    <div className="progress-bar emerald-progress" style={{ width: '85%' }}></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="financial-visual-accent emerald-accent"></div>
          </div>

          <div className="financial-modern-card net-sales-card animate-financial-modern" style={{ animationDelay: '200ms' }}>
            <div className="financial-card-background">
              <div className="background-pattern net-pattern"></div>
            </div>
            <div className="financial-card-content">
              <div className="financial-header">
                <div className="financial-icon-container blue-gradient">
                  <FaChartLine className="financial-icon" />
                </div>
                <div className="financial-trend-indicator positive-trend">
                  <FaArrowUp className="trend-icon" />
                  <span className="trend-value">+6.2%</span>
                </div>
              </div>
              <div className="financial-main-content">
                <h3 className="financial-title">Net Sales</h3>
                <div className="financial-value-container">
                  <span className="financial-value">${(metrics.netSales || 0).toFixed(0)}</span>
                  <span className="financial-currency">.{((metrics.netSales || 0) % 1).toFixed(2).slice(2)}</span>
                </div>
                <div className="financial-description">
                  <span className="description-label">after deductions</span>
                  <div className="progress-indicator">
                    <div className="progress-bar blue-progress" style={{ width: '78%' }}></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="financial-visual-accent blue-accent"></div>
          </div>

          <div className="financial-modern-card discounts-card animate-financial-modern" style={{ animationDelay: '300ms' }}>
            <div className="financial-card-background">
              <div className="background-pattern discount-pattern"></div>
            </div>
            <div className="financial-card-content">
              <div className="financial-header">
                <div className="financial-icon-container purple-gradient">
                  <FaPercentage className="financial-icon" />
                </div>
                <div className="financial-trend-indicator neutral-trend">
                  <span className="trend-value">-2.1%</span>
                </div>
              </div>
              <div className="financial-main-content">
                <h3 className="financial-title">Total Discounts</h3>
                <div className="financial-value-container">
                  <span className="financial-value">${(metrics.totalDiscounts || 0).toFixed(0)}</span>
                  <span className="financial-currency">.{((metrics.totalDiscounts || 0) % 1).toFixed(2).slice(2)}</span>
                </div>
                <div className="financial-description">
                  <span className="description-label">customer savings</span>
                  <div className="progress-indicator">
                    <div className="progress-bar purple-progress" style={{ width: '15%' }}></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="financial-visual-accent purple-accent"></div>
          </div>

          <div className="financial-modern-card avg-order-card animate-financial-modern" style={{ animationDelay: '400ms' }}>
            <div className="financial-card-background">
              <div className="background-pattern order-pattern"></div>
            </div>
            <div className="financial-card-content">
              <div className="financial-header">
                <div className="financial-icon-container orange-gradient">
                  <FaShoppingCart className="financial-icon" />
                </div>
                <div className="financial-trend-indicator positive-trend">
                  <FaArrowUp className="trend-icon" />
                  <span className="trend-value">+4.7%</span>
                </div>
              </div>
              <div className="financial-main-content">
                <h3 className="financial-title">Avg Order Value</h3>
                <div className="financial-value-container">
                  <span className="financial-value">${(metrics.averageOrderValue || 0).toFixed(0)}</span>
                  <span className="financial-currency">.{((metrics.averageOrderValue || 0) % 1).toFixed(2).slice(2)}</span>
                </div>
                <div className="financial-description">
                  <span className="description-label">per transaction</span>
                  <div className="progress-indicator">
                    <div className="progress-bar orange-progress" style={{ width: '65%' }}></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="financial-visual-accent orange-accent"></div>
          </div>

          <div className="financial-modern-card total-cost-card animate-financial-modern" style={{ animationDelay: '500ms' }}>
            <div className="financial-card-background">
              <div className="background-pattern cost-pattern"></div>
            </div>
            <div className="financial-card-content">
              <div className="financial-header">
                <div className="financial-icon-container red-gradient">
                  <FaArrowDown className="financial-icon" />
                </div>
                <div className="financial-trend-indicator negative-trend">
                  <FaArrowDown className="trend-icon" />
                  <span className="trend-value">-1.3%</span>
                </div>
              </div>
              <div className="financial-main-content">
                <h3 className="financial-title">Total Cost</h3>
                <div className="financial-value-container">
                  <span className="financial-value">${(metrics.totalCost || 0).toFixed(0)}</span>
                  <span className="financial-currency">.{((metrics.totalCost || 0) % 1).toFixed(2).slice(2)}</span>
                </div>
                <div className="financial-description">
                  <span className="description-label">operational expenses</span>
                  <div className="progress-indicator">
                    <div className="progress-bar red-progress" style={{ width: '45%' }}></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="financial-visual-accent red-accent"></div>
          </div>

          <div className="financial-modern-card inventory-value-card animate-financial-modern" style={{ animationDelay: '600ms' }}>
            <div className="financial-card-background">
              <div className="background-pattern inventory-pattern"></div>
            </div>
            <div className="financial-card-content">
              <div className="financial-header">
                <div className="financial-icon-container teal-gradient">
                  <FaBox className="financial-icon" />
                </div>
                <div className="financial-trend-indicator positive-trend">
                  <FaArrowUp className="trend-icon" />
                  <span className="trend-value">+12.8%</span>
                </div>
              </div>
              <div className="financial-main-content">
                <h3 className="financial-title">Inventory Value</h3>
                <div className="financial-value-container">
                  <span className="financial-value">${(metrics.totalInventoryValue || 0).toFixed(0)}</span>
                  <span className="financial-currency">.{((metrics.totalInventoryValue || 0) % 1).toFixed(2).slice(2)}</span>
                </div>
                <div className="financial-description">
                  <span className="description-label">stock worth</span>
                  <div className="progress-indicator">
                    <div className="progress-bar teal-progress" style={{ width: '92%' }}></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="financial-visual-accent teal-accent"></div>
          </div>
        </div>
      </div>

      {/* Inventory Alert Section */}
      {/* Inventory Alerts Section - Modern Redesign */}
      <div className="dashboard-section inventory-modern-section animate-section" style={{ animationDelay: '300ms' }}>
        <div className="section-header modern-header">
          <div className="header-content">
            <div className="header-icon-wrapper inventory-header-icon">
              <FaBox className="header-icon" />
            </div>
            <div className="header-text">
              <h2 className="modern-section-title">Inventory Alerts</h2>
              <p className="modern-section-subtitle">Real-time stock monitoring and alert management</p>
            </div>
          </div>
        </div>

        <div className="inventory-modern-grid">
          <div className="inventory-modern-card low-stock-card animate-inventory-modern" style={{ animationDelay: '100ms' }}>
            <div className="inventory-card-background">
              <div className="background-pattern low-stock-pattern"></div>
            </div>
            <div className="inventory-card-content">
              <div className="inventory-header">
                <div className="inventory-icon-container amber-gradient">
                  <FaBox className="inventory-icon" />
                </div>
                <div className={`inventory-status-badge ${(metrics.lowStockItems || 0) > 0 ? 'status-warning' : 'status-good'}`}>
                  <span className="status-dot"></span>
                  <span className="status-text">{(metrics.lowStockItems || 0) > 0 ? 'Warning' : 'Good'}</span>
                </div>
              </div>
              <div className="inventory-main-content">
                <h3 className="inventory-title">Low Stock Items</h3>
                <div className="inventory-value-container">
                  <span className="inventory-value">{metrics.lowStockItems || 0}</span>
                  <span className="inventory-unit">Items</span>
                </div>
                <div className="inventory-description">
                  <span className="description-label">need restocking</span>
                  <div className="progress-indicator">
                    <div className="progress-circle amber-circle">
                      <span className="circle-value">{metrics.lowStockItems || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="inventory-visual-accent amber-accent"></div>
          </div>

          <div className="inventory-modern-card out-stock-card animate-inventory-modern" style={{ animationDelay: '200ms' }}>
            <div className="inventory-card-background">
              <div className="background-pattern out-stock-pattern"></div>
            </div>
            <div className="inventory-card-content">
              <div className="inventory-header">
                <div className="inventory-icon-container red-gradient">
                  <FaArrowDown className="inventory-icon" />
                </div>
                <div className={`inventory-status-badge ${(metrics.outOfStockItems || 0) > 0 ? 'status-critical' : 'status-good'}`}>
                  <span className="status-dot"></span>
                  <span className="status-text">{(metrics.outOfStockItems || 0) > 0 ? 'Critical' : 'Good'}</span>
                </div>
              </div>
              <div className="inventory-main-content">
                <h3 className="inventory-title">Out of Stock</h3>
                <div className="inventory-value-container">
                  <span className="inventory-value">{metrics.outOfStockItems || 0}</span>
                  <span className="inventory-unit">Items</span>
                </div>
                <div className="inventory-description">
                  <span className="description-label">urgent restocking</span>
                  <div className="progress-indicator">
                    <div className="progress-circle red-circle">
                      <span className="circle-value">{metrics.outOfStockItems || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="inventory-visual-accent red-accent"></div>
          </div>

          <div className="inventory-modern-card total-products-card animate-inventory-modern" style={{ animationDelay: '300ms' }}>
            <div className="inventory-card-background">
              <div className="background-pattern products-pattern"></div>
            </div>
            <div className="inventory-card-content">
              <div className="inventory-header">
                <div className="inventory-icon-container blue-gradient">
                  <FaUsers className="inventory-icon" />
                </div>
                <div className="inventory-status-badge status-info">
                  <span className="status-dot"></span>
                  <span className="status-text">Active</span>
                </div>
              </div>
              <div className="inventory-main-content">
                <h3 className="inventory-title">Total Products</h3>
                <div className="inventory-value-container">
                  <span className="inventory-value">{metrics.totalProducts || 0}</span>
                  <span className="inventory-unit">Items</span>
                </div>
                <div className="inventory-description">
                  <span className="description-label">in inventory</span>
                  <div className="progress-indicator">
                    <div className="progress-circle blue-circle">
                      <span className="circle-value">{metrics.totalProducts || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="inventory-visual-accent blue-accent"></div>
          </div>

          <div className="inventory-modern-card inventory-value-card animate-inventory-modern" style={{ animationDelay: '400ms' }}>
            <div className="inventory-card-background">
              <div className="background-pattern value-pattern"></div>
            </div>
            <div className="inventory-card-content">
              <div className="inventory-header">
                <div className="inventory-icon-container emerald-gradient">
                  <FaDollarSign className="inventory-icon" />
                </div>
                <div className="inventory-status-badge status-positive">
                  <FaArrowUp className="trend-arrow" />
                  <span className="status-text">+12.8%</span>
                </div>
              </div>
              <div className="inventory-main-content">
                <h3 className="inventory-title">Inventory Value</h3>
                <div className="inventory-value-container">
                  <span className="inventory-value">${(metrics.totalInventoryValue || 0).toFixed(0)}</span>
                  <span className="inventory-unit">K</span>
                </div>
                <div className="inventory-description">
                  <span className="description-label">total worth</span>
                  <div className="progress-indicator">
                    <div className="progress-circle emerald-circle">
                      <span className="circle-value">92%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="inventory-visual-accent emerald-accent"></div>
          </div>
        </div>
      </div>
      
      {/* Enhanced Dashboard Sections */}
      <div className="dashboard-main-grid">
        {/* Top Row - Sales Performance Section Only */}
        <div className="dashboard-top-row">
          <SalesPerformanceSection />
        </div>
        
        {/* Bottom Row - Additional Sections */}
        <div className="dashboard-bottom-row">
          <RecentActivitySection />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;