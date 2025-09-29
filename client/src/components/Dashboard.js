import React, { useState, useEffect } from 'react';
import './Dashboard.css';

const Dashboard = ({ initialSection = 'overview' }) => {
  const [metrics, setMetrics] = useState({
    dailySales: 0,
    yesterdaySales: 0,
    dailyProfit: 0,
    discountAmount: 0,
    monthlySales: 0,
    monthlyProfit: 0,
    dailyExpenses: 0,
    monthlyExpenses: 0
  });

  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState(initialSection);

  // Simulate fetching dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      
      // Simulate API call with mock data
      setTimeout(() => {
        const mockData = {
          dailySales: 2450.75,
          yesterdaySales: 2180.50,
          dailyProfit: 1225.38,
          discountAmount: 245.00,
          monthlySales: 68750.25,
          monthlyProfit: 34375.13,
          dailyExpenses: 850.25,
          monthlyExpenses: 23800.75
        };
        
        setMetrics(mockData);
        setLoading(false);
      }, 1000);
    };

    fetchDashboardData();
  }, []);

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
            formatCurrency(value)
          )}
        </div>
      </div>
    </div>
  );

  const OverviewSection = () => (
    <div className="dashboard-section">
      <div className="section-header">
        <h2>📊 Dashboard Overview</h2>
        <p>Key performance indicators and business metrics</p>
      </div>
      
      <div className="metrics-grid">
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
          title="Daily Profit"
          value={metrics.dailyProfit}
          icon="📈"
          trend="up"
          trendValue="12.4"
          color="primary"
        />
        
        <MetricCard
          title="Discount Amount"
          value={metrics.discountAmount}
          icon="🏷️"
          trend="down"
          trendValue="5.2"
          color="warning"
        />
        
        <MetricCard
          title="Monthly Sales"
          value={metrics.monthlySales}
          icon="📊"
          trend="up"
          trendValue="18.7"
          color="success"
        />
        
        <MetricCard
          title="Monthly Profit"
          value={metrics.monthlyProfit}
          icon="💎"
          trend="up"
          trendValue="15.3"
          color="primary"
        />
      </div>
    </div>
  );

  const ExpensesSection = () => (
    <div className="dashboard-section">
      <div className="section-header">
        <h2>💸 Expenses Analysis</h2>
        <p>Track and analyze business expenses</p>
      </div>
      
      <div className="metrics-grid expenses-grid">
        <MetricCard
          title="Daily Expenses"
          value={metrics.dailyExpenses}
          icon="💸"
          trend="up"
          trendValue="8.2"
          color="danger"
        />
        
        <MetricCard
          title="Monthly Expenses"
          value={metrics.monthlyExpenses}
          icon="📋"
          trend="down"
          trendValue="3.1"
          color="warning"
        />
        
        <div className="expense-breakdown">
          <h3>Expense Categories</h3>
          <div className="expense-items">
            <div className="expense-item">
              <span className="expense-category">🍽️ Food & Ingredients</span>
              <span className="expense-amount">{formatCurrency(450.25)}</span>
            </div>
            <div className="expense-item">
              <span className="expense-category">👥 Staff Wages</span>
              <span className="expense-amount">{formatCurrency(280.00)}</span>
            </div>
            <div className="expense-item">
              <span className="expense-category">⚡ Utilities</span>
              <span className="expense-amount">{formatCurrency(85.50)}</span>
            </div>
            <div className="expense-item">
              <span className="expense-category">🧹 Maintenance</span>
              <span className="expense-amount">{formatCurrency(34.50)}</span>
            </div>
          </div>
        </div>
        
        <div className="expense-summary">
          <h3>Expense vs Revenue</h3>
          <div className="expense-ratio">
            <div className="ratio-item">
              <span>Revenue</span>
              <span className="ratio-bar revenue-bar"></span>
              <span>{formatCurrency(metrics.dailySales)}</span>
            </div>
            <div className="ratio-item">
              <span>Expenses</span>
              <span className="ratio-bar expense-bar"></span>
              <span>{formatCurrency(metrics.dailyExpenses)}</span>
            </div>
            <div className="ratio-item profit">
              <span>Net Profit</span>
              <span className="ratio-value">{formatCurrency(metrics.dailyProfit)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>📊 Dashboard</h1>
        <div className="dashboard-nav">
          <button 
            className={`nav-btn ${activeSection === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveSection('overview')}
          >
            📊 Overview
          </button>
          <button 
            className={`nav-btn ${activeSection === 'expenses' ? 'active' : ''}`}
            onClick={() => setActiveSection('expenses')}
          >
            💸 Expenses Analysis
          </button>
        </div>
      </div>
      
      <div className="dashboard-content">
        {activeSection === 'overview' ? <OverviewSection /> : <ExpensesSection />}
      </div>
    </div>
  );
};

export default Dashboard;