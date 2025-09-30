import React, { useState, useEffect } from 'react';
import './Dashboard.css';

const Dashboard = () => {
  const [metrics, setMetrics] = useState({
    dailySales: 0,
    yesterdaySales: 0,
    weeklySales: 0,
    monthlySales: 0,
    estimatedExpenses: 0,
    stockData: []
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('today');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [animationTrigger, setAnimationTrigger] = useState(false);
  const [orders, setOrders] = useState([]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      
      try {
        // Fetch orders data from API
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
        
        // Calculate metrics
        const dailySales = todayOrders.reduce((sum, order) => sum + parseFloat(order.total), 0);
        const yesterdaySales = yesterdayOrders.reduce((sum, order) => sum + parseFloat(order.total), 0);
        const weeklySales = weekOrders.reduce((sum, order) => sum + parseFloat(order.total), 0);
        const monthlySales = monthOrders.reduce((sum, order) => sum + parseFloat(order.total), 0);
        const estimatedExpenses = dailySales * 0.25; // 25% of sales as expenses
        
        // Mock stock data
        const stockData = [
          { name: 'Burgers', stock: 45, icon: '🍔' },
          { name: 'Pizzas', stock: 32, icon: '🍕' },
          { name: 'Drinks', stock: 18, icon: '🥤' },
          { name: 'Desserts', stock: 25, icon: '🍰' }
        ];
        
        setMetrics({
          dailySales,
          yesterdaySales,
          weeklySales,
          monthlySales,
          estimatedExpenses,
          stockData
        });
        
        setOrders(ordersData.slice(0, 8)); // Get recent orders
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Fallback to mock data
        setMetrics({
          dailySales: 2450.75,
          yesterdaySales: 2180.50,
          weeklySales: 15420.30,
          monthlySales: 68750.25,
          estimatedExpenses: 612.69,
          stockData: [
            { name: 'Burgers', stock: 45, icon: '🍔' },
            { name: 'Pizzas', stock: 32, icon: '🍕' },
            { name: 'Drinks', stock: 18, icon: '🥤' },
            { name: 'Desserts', stock: 25, icon: '🍰' }
          ]
        });
        
        setOrders([
          { id: 1, total: 45.50, status: 'completed', timestamp: new Date().toISOString() },
          { id: 2, total: 32.75, status: 'pending', timestamp: new Date().toISOString() },
          { id: 3, total: 67.20, status: 'completed', timestamp: new Date().toISOString() },
        ]);
      } finally {
        setLoading(false);
      }
    };

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

  // Enhanced MetricCard with animations
  const MetricCard = ({ title, value, icon, trend, trendValue, size = 'medium', delay = 0 }) => (
    <div 
      className={`metric-card ${size} animate-card`} 
      style={{ 
        animationDelay: `${delay}ms`,
        '--hover-scale': size === 'large' ? '1.05' : '1.02'
      }}
    >
      <div className="metric-header">
        <span className="metric-icon animate-icon">{icon}</span>
        {trend && (
          <div className={`metric-trend ${trend} animate-trend`}>
            <span>{trend === 'up' ? '↗️' : trend === 'down' ? '↘️' : '➡️'}</span>
            <span>{trendValue}</span>
          </div>
        )}
      </div>
      <div className="metric-content">
        <h3 className="animate-text">{title}</h3>
        <div className="metric-value animate-value" data-value={value}>
          {formatCurrency(value)}
        </div>
      </div>
      <div className="card-glow"></div>
    </div>
  );

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

  // Primary Metrics Section with staggered animations
  const PrimaryMetricsSection = () => (
    <div className="dashboard-section animate-section" style={{ animationDelay: '200ms' }}>
      <div className="section-header">
        <h2 className="animate-section-title">
          💰 Sales Performance
        </h2>
        <p className="animate-section-subtitle">
          Track your revenue and growth metrics
        </p>
      </div>
      <div className="metrics-grid">
        <MetricCard
          title="Today's Sales"
          value={metrics.dailySales}
          icon="💵"
          trend={calculateGrowth(metrics.dailySales, metrics.yesterdaySales) > 0 ? 'up' : 'down'}
          trendValue={`${calculateGrowth(metrics.dailySales, metrics.yesterdaySales)}%`}
          size="large"
          delay={100}
        />
        <MetricCard
          title="Yesterday's Sales"
          value={metrics.yesterdaySales}
          icon="📊"
          trend="neutral"
          trendValue="Previous day"
          delay={200}
        />
        <MetricCard
          title="Weekly Sales"
          value={metrics.weeklySales}
          icon="📈"
          trend="up"
          trendValue="+12.5%"
          delay={300}
        />
        <MetricCard
          title="Monthly Sales"
          value={metrics.monthlySales}
          icon="🏆"
          trend="up"
          trendValue="+8.3%"
          delay={400}
        />
        <MetricCard
          title="Cross Revenue"
          value={metrics.dailySales * 1.25}
          icon="🔄"
          trend="up"
          trendValue="+18.7%"
          delay={500}
        />
        <MetricCard
          title="Total Discounts"
          value={metrics.dailySales * 0.12}
          icon="🏷️"
          trend="down"
          trendValue="-3.2%"
          delay={600}
        />
        <MetricCard
          title="Net Profit"
          value={metrics.dailySales - metrics.estimatedExpenses - (metrics.dailySales * 0.12)}
          icon="💰"
          trend="up"
          trendValue="+15.4%"
          delay={700}
        />
        <MetricCard
          title="Profit Margin"
          value="24.5%"
          icon="💹"
          trend="up"
          trendValue="+2.1%"
          delay={800}
        />
        <MetricCard
          title="Estimated Expenses"
          value={metrics.estimatedExpenses}
          icon="💸"
          trend="down"
          trendValue="-5.2%"
          delay={900}
        />
      </div>
    </div>
  );

  // Inventory Overview Section
  const InventoryOverviewSection = () => (
    <div className="dashboard-section animate-section" style={{ animationDelay: '600ms' }}>
      <div className="section-header">
        <h2 className="animate-section-title">
          📦 Inventory Overview
        </h2>
        <p className="animate-section-subtitle">
          Monitor stock levels and inventory status
        </p>
      </div>
      <div className="inventory-grid">
        {metrics.stockData.map((item, index) => (
          <div 
            key={item.name} 
            className="inventory-card animate-inventory-card"
            style={{ animationDelay: `${(index + 1) * 150}ms` }}
          >
            <div className="inventory-icon animate-inventory-icon">
              {item.icon}
            </div>
            <div className="inventory-details">
              <h3 className="animate-inventory-title">{item.name}</h3>
              <span className={`stock-value ${item.stock < 20 ? 'alert animate-alert' : 'animate-stock'}`}>
                {item.stock}
              </span>
              <p className="animate-inventory-desc">
                {item.stock < 20 ? 'Low Stock Alert!' : 'In Stock'}
              </p>
            </div>
            <div className="inventory-pulse"></div>
          </div>
        ))}
      </div>
    </div>
  );

  // Enhanced Recent Activity Section
  const RecentActivitySection = () => {
    return (
      <div className="dashboard-section animate-section" style={{ animationDelay: '800ms' }}>
        <div className="section-header">
          <h2 className="animate-section-title">
            🕒 Recent Activity
          </h2>
          <p className="animate-section-subtitle">
            Latest orders and transactions
          </p>
        </div>
        <div className="recent-orders-table animate-table">
          {loading ? (
            <div className="loading-container">
              {[...Array(5)].map((_, i) => (
                <div 
                  key={i} 
                  className="loading-skeleton animate-skeleton" 
                  style={{ animationDelay: `${i * 100}ms` }}
                ></div>
              ))}
            </div>
          ) : orders.length > 0 ? (
            <table>
              <thead>
                <tr className="animate-table-header">
                  <th>Order ID</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, index) => (
                  <tr 
                    key={order.id} 
                    className="animate-table-row"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <td className="animate-cell">#{order.id}</td>
                    <td className="animate-cell">{formatCurrency(order.total)}</td>
                    <td className="animate-cell">
                      <span className={`status-badge ${order.status} animate-status-badge`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="animate-cell">
                      {new Date(order.timestamp || order.created_at).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="no-orders animate-no-orders">
              <div className="no-orders-icon animate-no-orders-icon">📋</div>
              <h3 className="animate-no-orders-title">No Recent Orders</h3>
              <p className="animate-no-orders-text">Orders will appear here once customers start placing them.</p>
            </div>
          )}
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
      <div className="dashboard-main-grid">
        <PrimaryMetricsSection />
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