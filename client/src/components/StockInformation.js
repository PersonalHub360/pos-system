import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import './StockInformation.css';

const StockInformation = () => {
  const { stockData, updateStockData } = useData();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // Data is already loaded from context, just set loading to false
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [stockData]);

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

  const handleGenerateReport = () => {
    // Generate stock report functionality
    const reportData = {
      totalProducts: stockData.totalProducts,
      lowStockItems: stockData.lowStockItems,
      outOfStockItems: stockData.outOfStockItems,
      totalStockValue: stockData.totalStockValue,
      topSellingItems: stockData.topSellingItems,
      recentStockUpdates: stockData.recentStockUpdates,
      stockMovements: stockData.stockMovements,
      categoryBreakdown: stockData.categoryBreakdown,
      generatedAt: new Date().toISOString()
    };

    // Convert to CSV format
    const csvContent = generateStockReportCSV(reportData);
    downloadCSV(csvContent, `stock_report_${new Date().toISOString().split('T')[0]}.csv`);
    
    alert('Stock report generated and downloaded successfully!');
  };

  const generateStockReportCSV = (data) => {
    let csv = 'Stock Report\n';
    csv += `Generated At: ${new Date(data.generatedAt).toLocaleString()}\n\n`;
    
    // Overview section
    csv += 'OVERVIEW\n';
    csv += `Total Products,${data.totalProducts}\n`;
    csv += `Low Stock Items,${data.lowStockItems}\n`;
    csv += `Out of Stock Items,${data.outOfStockItems}\n`;
    csv += `Total Stock Value,$${data.totalStockValue}\n\n`;
    
    // Top selling items
    csv += 'TOP SELLING ITEMS\n';
    csv += 'Rank,Product Name,Units Sold,Revenue,Stock Level\n';
    data.topSellingItems.forEach((item, index) => {
      csv += `${index + 1},${item.name},${item.sold},$${item.revenue},${item.stock}\n`;
    });
    
    csv += '\nCATEGORY BREAKDOWN\n';
    csv += 'Category,Items,Value,Percentage\n';
    data.categoryBreakdown.forEach(category => {
      csv += `${category.category},${category.items},$${category.value},${category.percentage}%\n`;
    });
    
    return csv;
  };

  const downloadCSV = (csvContent, filename) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleImportStock = () => {
    // Create file input for CSV import
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (event) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const csv = e.target.result;
            const lines = csv.split('\n');
            const headers = lines[0].split(',');
            
            // Basic validation
            if (headers.includes('product_name') || headers.includes('Product Name') || headers.includes('name')) {
              alert(`Stock import initiated for file: ${file.name}\n\nFile contains ${lines.length - 1} rows.\n\nNote: This is a demo - actual import would process the data and update inventory.`);
            } else {
              alert('Invalid CSV format. Please ensure the file contains product information with proper headers.');
            }
          } catch (error) {
            alert('Error reading file. Please ensure it\'s a valid CSV file.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleAddProduct = () => {
    // Navigate to the AddProduct page
    navigate('/add-product');
  };

  if (loading) {
    return (
      <div className="stock-information-loading">
        <div className="loading-spinner"></div>
        <p>Loading stock information...</p>
      </div>
    );
  }

  return (
    <div className="stock-information">
      <div className="stock-header">
        <div className="stock-title-section">
          <h1 className="stock-title">📦 Stock Information</h1>
          <p className="stock-subtitle">Comprehensive inventory management and analytics</p>
        </div>
        <div className="stock-actions">
          <button className="stock-btn primary" onClick={handleGenerateReport}>
            <span>📊</span>
            Generate Report
          </button>
          <button className="stock-btn secondary" onClick={handleImportStock}>
            <span>📥</span>
            Import Stock
          </button>
          <button className="stock-btn secondary" onClick={handleAddProduct}>
            <span>➕</span>
            Add Product
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="stock-overview-grid">
        <div className="stock-overview-card">
          <div className="stock-card-icon">📦</div>
          <div className="stock-card-content">
            <h3>Total Products</h3>
            <p className="stock-card-value">{stockData.totalProducts.toLocaleString()}</p>
            <span className="stock-card-trend positive">+5.2% from last month</span>
          </div>
        </div>
        <div className="stock-overview-card warning">
          <div className="stock-card-icon">⚠️</div>
          <div className="stock-card-content">
            <h3>Low Stock Items</h3>
            <p className="stock-card-value">{stockData.lowStockItems}</p>
            <span className="stock-card-trend negative">Requires attention</span>
          </div>
        </div>
        <div className="stock-overview-card danger">
          <div className="stock-card-icon">❌</div>
          <div className="stock-card-content">
            <h3>Out of Stock</h3>
            <p className="stock-card-value">{stockData.outOfStockItems}</p>
            <span className="stock-card-trend negative">Immediate action needed</span>
          </div>
        </div>
        <div className="stock-overview-card success">
          <div className="stock-card-icon">💰</div>
          <div className="stock-card-content">
            <h3>Total Stock Value</h3>
            <p className="stock-card-value">{formatCurrency(stockData.totalStockValue)}</p>
            <span className="stock-card-trend positive">+12.8% from last month</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="stock-tabs">
        <button 
          className={`stock-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={`stock-tab ${activeTab === 'movements' ? 'active' : ''}`}
          onClick={() => setActiveTab('movements')}
        >
          🔄 Stock Movements
        </button>
        <button 
          className={`stock-tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          📈 Analytics
        </button>
        <button 
          className={`stock-tab ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          🏷️ Categories
        </button>
      </div>

      {/* Tab Content */}
      <div className="stock-tab-content">
        {activeTab === 'overview' && (
          <div className="stock-overview-content">
            <div className="stock-content-grid">
              <div className="stock-content-card">
                <h3>🔥 Top Selling Items</h3>
                <div className="top-selling-list">
                  {stockData.topSellingItems.map((item, index) => (
                    <div key={index} className="top-selling-item">
                      <div className="item-rank">#{index + 1}</div>
                      <div className="item-details">
                        <h4>{item.name}</h4>
                        <p>Sold: {item.sold} units | Revenue: {formatCurrency(item.revenue)}</p>
                      </div>
                      <div className="item-stock">
                        <span className={`stock-level ${item.stock < 50 ? 'low' : 'good'}`}>
                          {item.stock} in stock
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="stock-content-card">
                <h3>🕒 Recent Stock Updates</h3>
                <div className="recent-updates-list">
                  {stockData.recentStockUpdates.map((update, index) => (
                    <div key={index} className="recent-update-item">
                      <div className="update-product">{update.product}</div>
                      <div className="update-change">
                        <span className="old-stock">{update.oldStock}</span>
                        <span className="arrow">→</span>
                        <span className="new-stock">{update.newStock}</span>
                      </div>
                      <div className="update-meta">
                        <span className="updated-by">{update.updatedBy}</span>
                        <span className="update-date">{update.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'movements' && (
          <div className="stock-movements-content">
            <div className="movements-header">
              <h3>📋 Stock Movement History</h3>
              <div className="movements-filters">
                <select className="filter-select">
                  <option>All Types</option>
                  <option>Stock In</option>
                  <option>Stock Out</option>
                </select>
                <input type="date" className="filter-date" />
              </div>
            </div>
            <div className="movements-table">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Type</th>
                    <th>Quantity</th>
                    <th>Date</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {stockData.stockMovements.map((movement) => (
                    <tr key={movement.id}>
                      <td>{movement.product}</td>
                      <td>
                        <span className={`movement-type ${movement.type.toLowerCase()}`}>
                          {movement.type === 'IN' ? '📥 IN' : '📤 OUT'}
                        </span>
                      </td>
                      <td>{movement.quantity}</td>
                      <td>{formatDate(movement.date)}</td>
                      <td>{movement.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="stock-analytics-content">
            <div className="analytics-grid">
              <div className="analytics-card">
                <h3>📊 Stock Performance</h3>
                <div className="performance-metrics">
                  <div className="metric">
                    <span className="metric-label">Stock Turnover Rate</span>
                    <span className="metric-value">4.2x</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Average Days in Stock</span>
                    <span className="metric-value">87 days</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Stock Accuracy</span>
                    <span className="metric-value">98.5%</span>
                  </div>
                </div>
              </div>
              <div className="analytics-card">
                <h3>📈 Trends</h3>
                <div className="trend-chart-placeholder">
                  <p>Stock Level Trends Chart</p>
                  <div className="chart-mock">
                    <div className="chart-bar" style={{height: '60%'}}></div>
                    <div className="chart-bar" style={{height: '80%'}}></div>
                    <div className="chart-bar" style={{height: '45%'}}></div>
                    <div className="chart-bar" style={{height: '90%'}}></div>
                    <div className="chart-bar" style={{height: '70%'}}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="stock-categories-content">
            <h3>🏷️ Stock by Category</h3>
            <div className="categories-grid">
              {stockData.categoryBreakdown.map((category, index) => (
                <div key={index} className="category-card">
                  <div className="category-header">
                    <h4>{category.category}</h4>
                    <span className="category-percentage">{category.percentage}%</span>
                  </div>
                  <div className="category-stats">
                    <div className="category-stat">
                      <span className="stat-label">Items</span>
                      <span className="stat-value">{category.items}</span>
                    </div>
                    <div className="category-stat">
                      <span className="stat-label">Value</span>
                      <span className="stat-value">{formatCurrency(category.value)}</span>
                    </div>
                  </div>
                  <div className="category-progress">
                    <div 
                      className="progress-bar" 
                      style={{width: `${category.percentage}%`}}
                    ></div>
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

export default StockInformation;