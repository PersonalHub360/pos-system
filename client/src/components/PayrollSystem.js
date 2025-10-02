import React, { useState } from 'react';
import './PayrollSystem.css';

const PayrollSystem = () => {
  const [activeTab, setActiveTab] = useState('payroll');
  const [showModal, setShowModal] = useState(false);
  const [editingPayroll, setEditingPayroll] = useState(null);
  
  const [payrollData, setPayrollData] = useState([
    {
      id: 'PAY001',
      employeeId: 'EMP001',
      employeeName: 'John Smith',
      position: 'Manager',
      baseSalary: 75000,
      overtime: 5000,
      bonus: 2000,
      deductions: 8000,
      netSalary: 74000,
      payPeriod: '2024-02-01 to 2024-02-29',
      status: 'Processed'
    },
    {
      id: 'PAY002',
      employeeId: 'EMP002',
      employeeName: 'Sarah Johnson',
      position: 'Developer',
      baseSalary: 85000,
      overtime: 3000,
      bonus: 1500,
      deductions: 9500,
      netSalary: 80000,
      payPeriod: '2024-02-01 to 2024-02-29',
      status: 'Processed'
    },
    {
      id: 'PAY003',
      employeeId: 'EMP003',
      employeeName: 'Mike Davis',
      position: 'Accountant',
      baseSalary: 65000,
      overtime: 2000,
      bonus: 1000,
      deductions: 7200,
      netSalary: 60800,
      payPeriod: '2024-02-01 to 2024-02-29',
      status: 'Pending'
    }
  ]);

  const [salaryStructures, setSalaryStructures] = useState([
    {
      id: 'SAL001',
      position: 'Manager',
      baseSalary: 75000,
      allowances: {
        housing: 15000,
        transport: 5000,
        medical: 3000
      },
      deductions: {
        tax: 8000,
        insurance: 2000,
        providentFund: 3000
      }
    },
    {
      id: 'SAL002',
      position: 'Developer',
      baseSalary: 85000,
      allowances: {
        housing: 17000,
        transport: 5000,
        medical: 3000
      },
      deductions: {
        tax: 9500,
        insurance: 2500,
        providentFund: 3500
      }
    }
  ]);

  const [formData, setFormData] = useState({
    employeeId: '',
    employeeName: '',
    position: '',
    baseSalary: '',
    overtime: '',
    bonus: '',
    deductions: '',
    payPeriod: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddPayroll = () => {
    setEditingPayroll(null);
    setFormData({
      employeeId: '',
      employeeName: '',
      position: '',
      baseSalary: '',
      overtime: '',
      bonus: '',
      deductions: '',
      payPeriod: ''
    });
    setShowModal(true);
  };

  const handleEditPayroll = (payroll) => {
    setEditingPayroll(payroll);
    setFormData({
      employeeId: payroll.employeeId,
      employeeName: payroll.employeeName,
      position: payroll.position,
      baseSalary: payroll.baseSalary.toString(),
      overtime: payroll.overtime.toString(),
      bonus: payroll.bonus.toString(),
      deductions: payroll.deductions.toString(),
      payPeriod: payroll.payPeriod
    });
    setShowModal(true);
  };

  const handleSavePayroll = () => {
    const netSalary = parseInt(formData.baseSalary) + parseInt(formData.overtime) + parseInt(formData.bonus) - parseInt(formData.deductions);
    
    if (editingPayroll) {
      // Update existing payroll
      setPayrollData(prev => prev.map(payroll => 
        payroll.id === editingPayroll.id 
          ? {
              ...payroll,
              employeeId: formData.employeeId,
              employeeName: formData.employeeName,
              position: formData.position,
              baseSalary: parseInt(formData.baseSalary),
              overtime: parseInt(formData.overtime),
              bonus: parseInt(formData.bonus),
              deductions: parseInt(formData.deductions),
              netSalary: netSalary,
              payPeriod: formData.payPeriod
            }
          : payroll
      ));
      alert('Payroll updated successfully!');
    } else {
      // Add new payroll
      const newPayroll = {
        id: `PAY${String(payrollData.length + 1).padStart(3, '0')}`,
        employeeId: formData.employeeId,
        employeeName: formData.employeeName,
        position: formData.position,
        baseSalary: parseInt(formData.baseSalary),
        overtime: parseInt(formData.overtime),
        bonus: parseInt(formData.bonus),
        deductions: parseInt(formData.deductions),
        netSalary: netSalary,
        payPeriod: formData.payPeriod,
        status: 'Pending'
      };
      setPayrollData(prev => [...prev, newPayroll]);
      alert('Payroll added successfully!');
    }
    setShowModal(false);
  };

  const handleProcessPayroll = (payrollId) => {
    setPayrollData(prev => prev.map(payroll =>
      payroll.id === payrollId
        ? { ...payroll, status: 'Processed' }
        : payroll
    ));
    alert('Payroll processed successfully!');
  };

  const handleDeletePayroll = (payrollId) => {
    if (window.confirm('Are you sure you want to delete this payroll record?')) {
      setPayrollData(prev => prev.filter(payroll => payroll.id !== payrollId));
      alert('Payroll deleted successfully!');
    }
  };

  const renderPayroll = () => (
    <div className="payroll-management">
      <div className="section-header">
        <h3>Payroll Management</h3>
        <button className="btn-primary" onClick={handleAddPayroll}>
          Add New Payroll
        </button>
      </div>
      
      <div className="payroll-table">
        <table>
          <thead>
            <tr>
              <th>Payroll ID</th>
              <th>Employee</th>
              <th>Position</th>
              <th>Base Salary</th>
              <th>Overtime</th>
              <th>Bonus</th>
              <th>Deductions</th>
              <th>Net Salary</th>
              <th>Pay Period</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {payrollData.map(payroll => (
              <tr key={payroll.id}>
                <td>{payroll.id}</td>
                <td>{payroll.employeeName}</td>
                <td>{payroll.position}</td>
                <td>${payroll.baseSalary.toLocaleString()}</td>
                <td>${payroll.overtime.toLocaleString()}</td>
                <td>${payroll.bonus.toLocaleString()}</td>
                <td>${payroll.deductions.toLocaleString()}</td>
                <td>${payroll.netSalary.toLocaleString()}</td>
                <td>{payroll.payPeriod}</td>
                <td>
                  <span className={`status ${payroll.status.toLowerCase()}`}>
                    {payroll.status}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="btn-edit"
                      onClick={() => handleEditPayroll(payroll)}
                    >
                      Edit
                    </button>
                    {payroll.status === 'Pending' && (
                      <button 
                        className="btn-process"
                        onClick={() => handleProcessPayroll(payroll.id)}
                      >
                        Process
                      </button>
                    )}
                    <button 
                      className="btn-delete"
                      onClick={() => handleDeletePayroll(payroll.id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSalaryStructure = () => (
    <div className="salary-structure">
      <div className="section-header">
        <h3>Salary Structure</h3>
        <button className="btn-primary">
          Add New Structure
        </button>
      </div>
      
      <div className="structure-cards">
        {salaryStructures.map(structure => (
          <div key={structure.id} className="structure-card">
            <div className="card-header">
              <h4>{structure.position}</h4>
              <span className="base-salary">${structure.baseSalary.toLocaleString()}</span>
            </div>
            <div className="card-body">
              <div className="allowances">
                <h5>Allowances</h5>
                <div className="allowance-item">
                  <span>Housing:</span>
                  <span>${structure.allowances.housing.toLocaleString()}</span>
                </div>
                <div className="allowance-item">
                  <span>Transport:</span>
                  <span>${structure.allowances.transport.toLocaleString()}</span>
                </div>
                <div className="allowance-item">
                  <span>Medical:</span>
                  <span>${structure.allowances.medical.toLocaleString()}</span>
                </div>
              </div>
              <div className="deductions">
                <h5>Deductions</h5>
                <div className="deduction-item">
                  <span>Tax:</span>
                  <span>${structure.deductions.tax.toLocaleString()}</span>
                </div>
                <div className="deduction-item">
                  <span>Insurance:</span>
                  <span>${structure.deductions.insurance.toLocaleString()}</span>
                </div>
                <div className="deduction-item">
                  <span>Provident Fund:</span>
                  <span>${structure.deductions.providentFund.toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div className="card-actions">
              <button className="btn-edit">Edit</button>
              <button className="btn-delete">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="payroll-reports">
      <div className="section-header">
        <h3>Payroll Reports</h3>
        <button className="btn-primary">
          Generate Report
        </button>
      </div>
      
      <div className="report-summary">
        <div className="summary-cards">
          <div className="summary-card">
            <h4>Total Payroll</h4>
            <span className="amount">${payrollData.reduce((sum, p) => sum + p.netSalary, 0).toLocaleString()}</span>
          </div>
          <div className="summary-card">
            <h4>Processed</h4>
            <span className="amount">{payrollData.filter(p => p.status === 'Processed').length}</span>
          </div>
          <div className="summary-card">
            <h4>Pending</h4>
            <span className="amount">{payrollData.filter(p => p.status === 'Pending').length}</span>
          </div>
          <div className="summary-card">
            <h4>Average Salary</h4>
            <span className="amount">${Math.round(payrollData.reduce((sum, p) => sum + p.netSalary, 0) / payrollData.length).toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="report-charts">
        <div className="chart-placeholder">
          <h4>Salary Distribution by Department</h4>
          <p>Chart visualization would be displayed here</p>
        </div>
        <div className="chart-placeholder">
          <h4>Monthly Payroll Trends</h4>
          <p>Chart visualization would be displayed here</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="payroll-system">
      <div className="payroll-header">
        <h2>Payroll Management System</h2>
        <div className="nav-tabs">
          <button 
            className={`nav-tab ${activeTab === 'payroll' ? 'active' : ''}`}
            onClick={() => setActiveTab('payroll')}
          >
            Payroll
          </button>
          <button 
            className={`nav-tab ${activeTab === 'salary' ? 'active' : ''}`}
            onClick={() => setActiveTab('salary')}
          >
            Salary Structure
          </button>
          <button 
            className={`nav-tab ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            Reports
          </button>
        </div>
      </div>

      <div className="payroll-content">
        {activeTab === 'payroll' && renderPayroll()}
        {activeTab === 'salary' && renderSalaryStructure()}
        {activeTab === 'reports' && renderReports()}
      </div>

      {/* Payroll Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{editingPayroll ? 'Edit Payroll' : 'Add New Payroll'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Employee ID</label>
                <input
                  type="text"
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleInputChange}
                  placeholder="Enter employee ID"
                />
              </div>
              <div className="form-group">
                <label>Employee Name</label>
                <input
                  type="text"
                  name="employeeName"
                  value={formData.employeeName}
                  onChange={handleInputChange}
                  placeholder="Enter employee name"
                />
              </div>
              <div className="form-group">
                <label>Position</label>
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  placeholder="Enter position"
                />
              </div>
              <div className="form-group">
                <label>Base Salary</label>
                <input
                  type="number"
                  name="baseSalary"
                  value={formData.baseSalary}
                  onChange={handleInputChange}
                  placeholder="Enter base salary"
                />
              </div>
              <div className="form-group">
                <label>Overtime</label>
                <input
                  type="number"
                  name="overtime"
                  value={formData.overtime}
                  onChange={handleInputChange}
                  placeholder="Enter overtime amount"
                />
              </div>
              <div className="form-group">
                <label>Bonus</label>
                <input
                  type="number"
                  name="bonus"
                  value={formData.bonus}
                  onChange={handleInputChange}
                  placeholder="Enter bonus amount"
                />
              </div>
              <div className="form-group">
                <label>Deductions</label>
                <input
                  type="number"
                  name="deductions"
                  value={formData.deductions}
                  onChange={handleInputChange}
                  placeholder="Enter total deductions"
                />
              </div>
              <div className="form-group">
                <label>Pay Period</label>
                <input
                  type="text"
                  name="payPeriod"
                  value={formData.payPeriod}
                  onChange={handleInputChange}
                  placeholder="e.g., 2024-02-01 to 2024-02-29"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleSavePayroll}>
                {editingPayroll ? 'Update Payroll' : 'Add Payroll'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollSystem;