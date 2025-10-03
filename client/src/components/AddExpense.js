import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import './AddExpense.css';

const AddExpense = ({ onClose, onExpenseAdded }) => {
  const { expenseData, updateExpenseData } = useData();
  const [activeMode, setActiveMode] = useState('create'); // 'create' or 'upload'
  const [formData, setFormData] = useState({
    description: '',
    category: '',
    vendor: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    status: 'Pending'
  });

  const categories = [
    'Rent & Utilities',
    'Staff Salaries',
    'Inventory Purchase',
    'Marketing',
    'Office Expenses',
    'Technology',
    'Insurance',
    'Transportation',
    'Professional Services',
    'Maintenance & Repairs'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.description || !formData.category || !formData.amount) {
      alert('Please fill in all required fields.');
      return;
    }

    const newExpense = {
      id: Date.now(),
      description: formData.description,
      category: formData.category,
      vendor: formData.vendor || 'N/A',
      amount: parseFloat(formData.amount),
      date: formData.date,
      status: formData.status
    };

    // Update expense data
    const updatedExpenseData = {
      ...expenseData,
      recentExpenses: [newExpense, ...expenseData.recentExpenses],
      totalExpenses: expenseData.totalExpenses + newExpense.amount,
      monthlyExpenses: expenseData.monthlyExpenses + newExpense.amount
    };

    updateExpenseData(updatedExpenseData);
    
    if (onExpenseAdded) {
      onExpenseAdded(newExpense);
    }
    
    alert('Expense added successfully!');
    
    // Reset form
    setFormData({
      description: '',
      category: '',
      vendor: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      status: 'Pending'
    });
  };

  const handleFileImport = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'text/csv') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const csv = e.target.result;
        const lines = csv.split('\n');
        
        const importedExpenses = [];
        for (let i = 1; i < lines.length; i++) {
          if (lines[i].trim()) {
            const values = lines[i].split(',');
            const expense = {
              id: Date.now() + i,
              description: values[0]?.trim() || '',
              category: values[1]?.trim() || '',
              vendor: values[2]?.trim() || '',
              amount: parseFloat(values[3]) || 0,
              date: values[4]?.trim() || new Date().toISOString().split('T')[0],
              status: values[5]?.trim() || 'Pending'
            };
            importedExpenses.push(expense);
          }
        }
        
        if (importedExpenses.length > 0) {
          const updatedExpenseData = {
            ...expenseData,
            recentExpenses: [...importedExpenses, ...expenseData.recentExpenses],
            totalExpenses: expenseData.totalExpenses + importedExpenses.reduce((sum, exp) => sum + exp.amount, 0),
            monthlyExpenses: expenseData.monthlyExpenses + importedExpenses.reduce((sum, exp) => sum + exp.amount, 0)
          };
          updateExpenseData(updatedExpenseData);
          
          if (onExpenseAdded) {
            importedExpenses.forEach(expense => onExpenseAdded(expense));
          }
          
          alert(`Successfully imported ${importedExpenses.length} expenses!`);
        }
      };
      reader.readAsText(file);
    } else {
      alert('Please select a valid CSV file.');
    }
    event.target.value = '';
  };

  const downloadSample = () => {
    const sampleData = [
      ['Description', 'Category', 'Vendor', 'Amount', 'Date', 'Status'],
      ['Office Rent Payment', 'Rent & Utilities', 'Property Management Co', '2500.00', '2024-01-15', 'Paid'],
      ['Marketing Campaign', 'Marketing', 'Digital Agency', '1200.00', '2024-01-16', 'Pending'],
      ['Office Supplies', 'Office Expenses', 'Office Depot', '350.75', '2024-01-17', 'Paid'],
      ['Software License', 'Technology', 'Microsoft', '299.99', '2024-01-18', 'Pending']
    ];
    
    const csvContent = sampleData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'expense_sample.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="add-expense-modal">
      <div className="add-expense-container">
        <div className="add-expense-header">
          <h2>💰 Add New Expense</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Mode Toggle */}
        <div className="mode-toggle">
          <button 
            className={`mode-btn ${activeMode === 'create' ? 'active' : ''}`}
            onClick={() => setActiveMode('create')}
          >
            ✏️ Create Expense
          </button>
          <button 
            className={`mode-btn ${activeMode === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveMode('upload')}
          >
            📁 Upload CSV
          </button>
        </div>

        {activeMode === 'create' ? (
          <form onSubmit={handleSubmit} className="expense-form">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="description">Description *</label>
                <input
                  type="text"
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter expense description"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="category">Category *</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="vendor">Vendor</label>
                <input
                  type="text"
                  id="vendor"
                  name="vendor"
                  value={formData.vendor}
                  onChange={handleInputChange}
                  placeholder="Enter vendor name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="amount">Amount *</label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="date">Date *</label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                >
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="submit-btn">
                Add Expense
              </button>
            </div>
          </form>
        ) : (
          <div className="upload-section">
            <div className="upload-area">
              <div className="upload-icon">📁</div>
              <h3>Upload Expense CSV File</h3>
              <p>Select a CSV file containing expense data to import multiple expenses at once.</p>
              
              <div className="upload-controls">
                <input
                  type="file"
                  id="csv-upload"
                  accept=".csv"
                  onChange={handleFileImport}
                  style={{ display: 'none' }}
                />
                <label htmlFor="csv-upload" className="upload-btn">
                  Choose CSV File
                </label>
                <button onClick={downloadSample} className="sample-btn">
                  Download Sample
                </button>
              </div>

              <div className="upload-info">
                <h4>CSV Format Requirements:</h4>
                <ul>
                  <li>Columns: Description, Category, Vendor, Amount, Date, Status</li>
                  <li>Date format: YYYY-MM-DD</li>
                  <li>Amount should be numeric (e.g., 123.45)</li>
                  <li>Status: Pending, Paid, or Overdue</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddExpense;