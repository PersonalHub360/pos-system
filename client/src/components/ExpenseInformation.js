import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import './ExpenseInformation.css';

const ExpenseInformation = () => {
  const { expenseData, updateExpenseData } = useData();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPeriod, setSelectedPeriod] = useState('thisMonth');

  useEffect(() => {
    // Data is already loaded from context, just set loading to false
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [expenseData]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysUntilDue = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="expense-information-loading">
        <div className="loading-spinner"></div>
        <p>Loading expense information...</p>
      </div>
    );
  }

  return (
    <div className="expense-information">
      <div className="expense-header">
        <div className="expense-title-section">
          <h1 className="expense-title">💰 Expense Information</h1>
          <p className="expense-subtitle">Comprehensive expense tracking and financial management</p>
        </div>
        <div className="expense-actions">
          <select 
            className="period-selector"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
          >
            <option value="thisMonth">This Month</option>
            <option value="lastMonth">Last Month</option>
            <option value="thisQuarter">This Quarter</option>
            <option value="thisYear">This Year</option>
          </select>
          <button className="expense-btn primary">
            <span>📊</span>
            Generate Report
          </button>
          <button className="expense-btn secondary">
            <span>➕</span>
            Add Expense
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="expense-overview-grid">
        <div className="expense-overview-card">
          <div className="expense-card-icon">💰</div>
          <div className="expense-card-content">
            <h3>Total Expenses</h3>
            <p className="expense-card-value">{formatCurrency(expenseData.totalExpenses)}</p>
            <span className="expense-card-trend positive">+8.5% from last month</span>
          </div>
        </div>
        <div className="expense-overview-card">
          <div className="expense-card-icon">📅</div>
          <div className="expense-card-content">
            <h3>Monthly Expenses</h3>
            <p className="expense-card-value">{formatCurrency(expenseData.monthlyExpenses)}</p>
            <span className="expense-card-trend negative">-2.3% from last month</span>
          </div>
        </div>
        <div className="expense-overview-card warning">
          <div className="expense-card-icon">⏰</div>
          <div className="expense-card-content">
            <h3>Pending Payments</h3>
            <p className="expense-card-value">{formatCurrency(expenseData.pendingPayments)}</p>
            <span className="expense-card-trend negative">5 payments due</span>
          </div>
        </div>
        <div className="expense-overview-card success">
          <div className="expense-card-icon">📈</div>
          <div className="expense-card-content">
            <h3>Average Monthly</h3>
            <p className="expense-card-value">{formatCurrency(expenseData.totalExpenses / 6)}</p>
            <span className="expense-card-trend positive">6-month average</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="expense-tabs">
        <button 
          className={`expense-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={`expense-tab ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          🏷️ Categories
        </button>
        <button 
          className={`expense-tab ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          📋 Transactions
        </button>
        <button 
          className={`expense-tab ${activeTab === 'upcoming' ? 'active' : ''}`}
          onClick={() => setActiveTab('upcoming')}
        >
          ⏰ Upcoming Payments
        </button>
      </div>

      {/* Tab Content */}
      <div className="expense-tab-content">
        {activeTab === 'overview' && (
          <div className="expense-overview-content">
            <div className="expense-content-grid">
              <div className="expense-content-card">
                <h3>📈 Monthly Expense Trends</h3>
                <div className="trends-chart">
                  <div className="chart-container">
                    {expenseData.monthlyTrends.map((trend, index) => (
                      <div key={index} className="trend-bar-container">
                        <div 
                          className="trend-bar"
                          style={{
                            height: `${(trend.amount / Math.max(...expenseData.monthlyTrends.map(t => t.amount))) * 100}%`
                          }}
                        ></div>
                        <span className="trend-month">{trend.month}</span>
                        <span className="trend-amount">{formatCurrency(trend.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="expense-content-card">
                <h3>🔥 Top Expense Categories</h3>
                <div className="top-categories-list">
                  {expenseData.topExpenseCategories.map((category, index) => (
                    <div key={index} className="top-category-item">
                      <div className="category-rank">#{index + 1}</div>
                      <div className="category-details">
                        <h4>{category.category}</h4>
                        <p>{category.transactions} transactions | Avg: {formatCurrency(category.avgPerTransaction)}</p>
                      </div>
                      <div className="category-amount">
                        <span className="amount-value">{formatCurrency(category.amount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="expense-categories-content">
            <h3>🏷️ Expense Breakdown by Category</h3>
            <div className="categories-grid">
              {expenseData.expenseCategories.map((category, index) => (
                <div key={index} className="expense-category-card">
                  <div className="category-header">
                    <div className="category-color" style={{backgroundColor: category.color}}></div>
                    <h4>{category.name}</h4>
                    <span className="category-percentage">{category.percentage}%</span>
                  </div>
                  <div className="category-amount-large">
                    {formatCurrency(category.amount)}
                  </div>
                  <div className="category-progress">
                    <div 
                      className="progress-bar" 
                      style={{
                        width: `${category.percentage}%`,
                        backgroundColor: category.color
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="expense-transactions-content">
            <div className="transactions-header">
              <h3>📋 Recent Expense Transactions</h3>
              <div className="transactions-filters">
                <select className="filter-select">
                  <option>All Categories</option>
                  <option>Rent & Utilities</option>
                  <option>Staff Salaries</option>
                  <option>Inventory Purchase</option>
                  <option>Marketing</option>
                </select>
                <select className="filter-select">
                  <option>All Status</option>
                  <option>Paid</option>
                  <option>Pending</option>
                  <option>Overdue</option>
                </select>
              </div>
            </div>
            <div className="transactions-table">
              <table>
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Category</th>
                    <th>Vendor</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {expenseData.recentExpenses.map((expense) => (
                    <tr key={expense.id}>
                      <td>{expense.description}</td>
                      <td>
                        <span className="category-tag">{expense.category}</span>
                      </td>
                      <td>{expense.vendor}</td>
                      <td className="amount-cell">{formatCurrency(expense.amount)}</td>
                      <td>{formatDate(expense.date)}</td>
                      <td>
                        <span className={`status-badge ${expense.status.toLowerCase()}`}>
                          {expense.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'upcoming' && (
          <div className="expense-upcoming-content">
            <h3>⏰ Upcoming Payment Schedule</h3>
            <div className="upcoming-payments-list">
              {expenseData.upcomingPayments.map((payment, index) => (
                <div key={index} className={`upcoming-payment-item priority-${payment.priority.toLowerCase()}`}>
                  <div className="payment-info">
                    <h4>{payment.description}</h4>
                    <p className="payment-category">{payment.category}</p>
                  </div>
                  <div className="payment-details">
                    <div className="payment-amount">{formatCurrency(payment.amount)}</div>
                    <div className="payment-due">
                      Due: {formatDate(payment.dueDate)}
                      <span className="days-until">
                        ({getDaysUntilDue(payment.dueDate)} days)
                      </span>
                    </div>
                  </div>
                  <div className="payment-priority">
                    <span className={`priority-badge ${payment.priority.toLowerCase()}`}>
                      {payment.priority} Priority
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpenseInformation;