import React, { createContext, useContext, useState, useEffect } from 'react';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  const [stockData, setStockData] = useState({
    totalProducts: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    totalStockValue: 0,
    topSellingItems: [],
    recentStockUpdates: [],
    stockMovements: [],
    categoryBreakdown: []
  });

  const [expenseData, setExpenseData] = useState({
    totalExpenses: 0,
    monthlyExpenses: 0,
    pendingPayments: 0,
    averageMonthlyExpense: 0,
    monthlyTrends: [],
    topExpenseCategories: [],
    expenseCategories: [],
    recentExpenses: [],
    upcomingPayments: []
  });

  const [dashboardMetrics, setDashboardMetrics] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    completedOrders: 0,
    stockData: [],
    expenseData: []
  });

  // Initialize data on mount
  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    try {
      // Simulate API calls to fetch data
      await Promise.all([
        fetchStockData(),
        fetchExpenseData(),
        fetchDashboardMetrics()
      ]);
    } catch (error) {
      console.error('Error initializing data:', error);
    }
  };

  const fetchStockData = async () => {
    // Simulate API call
    const mockStockData = {
      totalProducts: 1247,
      lowStockItems: 23,
      outOfStockItems: 8,
      totalStockValue: 125430,
      topSellingItems: [
        { id: 1, name: 'Premium Coffee Beans', sold: 245, revenue: 4900, trend: 'up' },
        { id: 2, name: 'Organic Tea Blend', sold: 189, revenue: 3780, trend: 'up' },
        { id: 3, name: 'Artisan Pastries', sold: 156, revenue: 2340, trend: 'down' },
        { id: 4, name: 'Fresh Sandwiches', sold: 134, revenue: 2010, trend: 'up' },
        { id: 5, name: 'Smoothie Mix', sold: 98, revenue: 1470, trend: 'stable' }
      ],
      recentStockUpdates: [
        { id: 1, product: 'Premium Coffee Beans', action: 'Restocked', quantity: 50, timestamp: '2024-01-15 10:30 AM', user: 'John Doe' },
        { id: 2, product: 'Organic Tea Blend', action: 'Sold', quantity: -15, timestamp: '2024-01-15 09:45 AM', user: 'System' },
        { id: 3, product: 'Artisan Pastries', action: 'Restocked', quantity: 25, timestamp: '2024-01-15 08:20 AM', user: 'Jane Smith' },
        { id: 4, product: 'Fresh Sandwiches', action: 'Sold', quantity: -8, timestamp: '2024-01-15 07:15 AM', user: 'System' }
      ],
      stockMovements: [
        { id: 1, date: '2024-01-15', product: 'Premium Coffee Beans', type: 'IN', quantity: 100, reason: 'Purchase Order #1234', reference: 'PO-1234' },
        { id: 2, date: '2024-01-15', product: 'Organic Tea Blend', type: 'OUT', quantity: 25, reason: 'Sales', reference: 'SALE-5678' },
        { id: 3, date: '2024-01-14', product: 'Artisan Pastries', type: 'IN', quantity: 50, reason: 'Production', reference: 'PROD-9012' },
        { id: 4, date: '2024-01-14', product: 'Fresh Sandwiches', type: 'OUT', quantity: 30, reason: 'Sales', reference: 'SALE-3456' }
      ],
      categoryBreakdown: [
        { name: 'Beverages', value: 45230, percentage: 36, color: '#3B82F6', items: 156 },
        { name: 'Food Items', value: 38920, percentage: 31, color: '#10B981', items: 134 },
        { name: 'Pastries', value: 25680, percentage: 20, color: '#F59E0B', items: 89 },
        { name: 'Snacks', value: 15600, percentage: 13, color: '#EF4444', items: 67 }
      ]
    };

    setStockData(mockStockData);
    
    // Update dashboard stock data
    setDashboardMetrics(prev => ({
      ...prev,
      stockData: [
        { name: 'Total Products', value: mockStockData.totalProducts, icon: '📦', trend: 'up', trendValue: '+5.2%' },
        { name: 'Low Stock Items', value: mockStockData.lowStockItems, icon: '⚠️', trend: 'down', trendValue: '-12.3%' },
        { name: 'Out of Stock', value: mockStockData.outOfStockItems, icon: '❌', trend: 'down', trendValue: '-8.1%' },
        { name: 'Stock Value', value: `$${mockStockData.totalStockValue.toLocaleString()}`, icon: '💰', trend: 'up', trendValue: '+15.7%' }
      ]
    }));
  };

  const fetchExpenseData = async () => {
    // Simulate API call
    const mockExpenseData = {
      totalExpenses: 45230,
      monthlyExpenses: 12450,
      pendingPayments: 8750,
      averageMonthlyExpense: 7538,
      monthlyTrends: [
        { month: 'Jul', amount: 8500 },
        { month: 'Aug', amount: 9200 },
        { month: 'Sep', amount: 7800 },
        { month: 'Oct', amount: 10500 },
        { month: 'Nov', amount: 9800 },
        { month: 'Dec', amount: 12450 }
      ],
      topExpenseCategories: [
        { name: 'Rent & Utilities', amount: 15600, percentage: 34.5 },
        { name: 'Inventory Purchase', amount: 12300, percentage: 27.2 },
        { name: 'Staff Salaries', amount: 8900, percentage: 19.7 },
        { name: 'Marketing', amount: 4200, percentage: 9.3 },
        { name: 'Equipment', amount: 4230, percentage: 9.3 }
      ],
      expenseCategories: [
        { name: 'Rent & Utilities', amount: 15600, percentage: 34.5, color: '#3B82F6' },
        { name: 'Inventory Purchase', amount: 12300, percentage: 27.2, color: '#10B981' },
        { name: 'Staff Salaries', amount: 8900, percentage: 19.7, color: '#F59E0B' },
        { name: 'Marketing', amount: 4200, percentage: 9.3, color: '#EF4444' },
        { name: 'Equipment', amount: 4230, percentage: 9.3, color: '#8B5CF6' }
      ],
      recentExpenses: [
        { id: 1, date: '2024-01-15', description: 'Office Rent - January', category: 'Rent & Utilities', amount: 2500, status: 'Paid' },
        { id: 2, date: '2024-01-14', description: 'Coffee Bean Purchase', category: 'Inventory Purchase', amount: 1200, status: 'Paid' },
        { id: 3, date: '2024-01-13', description: 'Staff Salary - John Doe', category: 'Staff Salaries', amount: 3500, status: 'Paid' },
        { id: 4, date: '2024-01-12', description: 'Facebook Ads Campaign', category: 'Marketing', amount: 450, status: 'Pending' }
      ],
      upcomingPayments: [
        { id: 1, vendor: 'Coffee Suppliers Inc.', category: 'Inventory Purchase', amount: 2500, dueDate: '2024-01-20', daysUntil: 5, priority: 'high' },
        { id: 2, vendor: 'Electricity Company', category: 'Utilities', amount: 850, dueDate: '2024-01-22', daysUntil: 7, priority: 'medium' },
        { id: 3, vendor: 'Marketing Agency', category: 'Marketing', amount: 1200, dueDate: '2024-01-25', daysUntil: 10, priority: 'low' },
        { id: 4, vendor: 'Equipment Lease', category: 'Equipment', amount: 750, dueDate: '2024-01-28', daysUntil: 13, priority: 'medium' }
      ]
    };

    setExpenseData(mockExpenseData);
    
    // Update dashboard expense data
    setDashboardMetrics(prev => ({
      ...prev,
      expenseData: [
        { name: 'Total Expenses', value: `$${mockExpenseData.totalExpenses.toLocaleString()}`, icon: '💸', trend: 'up', trendValue: '+8.5%' },
        { name: 'Monthly Expenses', value: `$${mockExpenseData.monthlyExpenses.toLocaleString()}`, icon: '📊', trend: 'up', trendValue: '+12.3%' },
        { name: 'Pending Payments', value: `$${mockExpenseData.pendingPayments.toLocaleString()}`, icon: '⏰', trend: 'down', trendValue: '-5.2%' },
        { name: 'Avg Monthly', value: `$${mockExpenseData.averageMonthlyExpense.toLocaleString()}`, icon: '📈', trend: 'stable', trendValue: '+2.1%' }
      ]
    }));
  };

  const fetchDashboardMetrics = async () => {
    // Simulate API call for general dashboard metrics
    const mockMetrics = {
      totalRevenue: 125430,
      totalOrders: 1247,
      averageOrderValue: 100.58,
      completedOrders: 1189
    };

    setDashboardMetrics(prev => ({
      ...prev,
      ...mockMetrics
    }));
  };

  // Update functions that can be called from components
  const updateStockData = (newData) => {
    setStockData(prev => ({ ...prev, ...newData }));
    
    // Update corresponding dashboard data
    if (newData.totalProducts || newData.lowStockItems || newData.outOfStockItems || newData.totalStockValue) {
      setDashboardMetrics(prev => ({
        ...prev,
        stockData: prev.stockData.map(item => {
          if (item.name === 'Total Products' && newData.totalProducts) {
            return { ...item, value: newData.totalProducts };
          }
          if (item.name === 'Low Stock Items' && newData.lowStockItems) {
            return { ...item, value: newData.lowStockItems };
          }
          if (item.name === 'Out of Stock' && newData.outOfStockItems) {
            return { ...item, value: newData.outOfStockItems };
          }
          if (item.name === 'Stock Value' && newData.totalStockValue) {
            return { ...item, value: `$${newData.totalStockValue.toLocaleString()}` };
          }
          return item;
        })
      }));
    }
  };

  const updateExpenseData = (newData) => {
    setExpenseData(prev => ({ ...prev, ...newData }));
    
    // Update corresponding dashboard data
    if (newData.totalExpenses || newData.monthlyExpenses || newData.pendingPayments || newData.averageMonthlyExpense) {
      setDashboardMetrics(prev => ({
        ...prev,
        expenseData: prev.expenseData.map(item => {
          if (item.name === 'Total Expenses' && newData.totalExpenses) {
            return { ...item, value: `$${newData.totalExpenses.toLocaleString()}` };
          }
          if (item.name === 'Monthly Expenses' && newData.monthlyExpenses) {
            return { ...item, value: `$${newData.monthlyExpenses.toLocaleString()}` };
          }
          if (item.name === 'Pending Payments' && newData.pendingPayments) {
            return { ...item, value: `$${newData.pendingPayments.toLocaleString()}` };
          }
          if (item.name === 'Avg Monthly' && newData.averageMonthlyExpense) {
            return { ...item, value: `$${newData.averageMonthlyExpense.toLocaleString()}` };
          }
          return item;
        })
      }));
    }
  };

  const refreshData = async () => {
    await initializeData();
  };

  const value = {
    stockData,
    expenseData,
    dashboardMetrics,
    updateStockData,
    updateExpenseData,
    refreshData,
    setDashboardMetrics
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export default DataContext;