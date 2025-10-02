import React, { useState } from 'react';
import './HRMSystem.css';

const HRMSystem = () => {
  const [activeTab, setActiveTab] = useState('employees');
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [employees, setEmployees] = useState([
    {
      id: 'EMP001',
      name: 'John Smith',
      position: 'Manager',
      department: 'Sales',
      email: 'john.smith@company.com',
      phone: '+1-555-0123',
      salary: '$75,000',
      status: 'Active',
      joinDate: '2023-01-15'
    },
    {
      id: 'EMP002',
      name: 'Sarah Johnson',
      position: 'Developer',
      department: 'IT',
      email: 'sarah.johnson@company.com',
      phone: '+1-555-0124',
      salary: '$85,000',
      status: 'Active',
      joinDate: '2023-03-20'
    },
    {
      id: 'EMP003',
      name: 'Mike Davis',
      position: 'Accountant',
      department: 'Finance',
      email: 'mike.davis@company.com',
      phone: '+1-555-0125',
      salary: '$65,000',
      status: 'Active',
      joinDate: '2023-02-10'
    }
  ]);

  const [leaveRequests, setLeaveRequests] = useState([
    {
      id: 1,
      employeeName: 'John Smith',
      type: 'Annual Leave',
      startDate: '2024-02-15',
      endDate: '2024-02-20',
      days: 5,
      status: 'Pending',
      reason: 'Family vacation'
    },
    {
      id: 2,
      employeeName: 'Sarah Johnson',
      type: 'Sick Leave',
      startDate: '2024-02-12',
      endDate: '2024-02-14',
      days: 3,
      status: 'Pending',
      reason: 'Medical appointment'
    }
  ]);

  const [formData, setFormData] = useState({
    name: '',
    position: '',
    department: '',
    email: '',
    phone: '',
    salary: '',
    joinDate: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddEmployee = () => {
    setEditingEmployee(null);
    setFormData({
      name: '',
      position: '',
      department: '',
      email: '',
      phone: '',
      salary: '',
      joinDate: ''
    });
    setShowModal(true);
  };

  const handleEditEmployee = (employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name,
      position: employee.position,
      department: employee.department,
      email: employee.email,
      phone: employee.phone,
      salary: employee.salary.replace('$', '').replace(',', ''),
      joinDate: employee.joinDate
    });
    setShowModal(true);
  };

  const handleSaveEmployee = () => {
    if (editingEmployee) {
      // Update existing employee
      setEmployees(prev => prev.map(emp => 
        emp.id === editingEmployee.id 
          ? {
              ...emp,
              name: formData.name,
              position: formData.position,
              department: formData.department,
              email: formData.email,
              phone: formData.phone,
              salary: `$${parseInt(formData.salary).toLocaleString()}`,
              joinDate: formData.joinDate
            }
          : emp
      ));
      alert('Employee updated successfully!');
    } else {
      // Add new employee
      const newEmployee = {
        id: `EMP${String(employees.length + 1).padStart(3, '0')}`,
        name: formData.name,
        position: formData.position,
        department: formData.department,
        email: formData.email,
        phone: formData.phone,
        salary: `$${parseInt(formData.salary).toLocaleString()}`,
        status: 'Active',
        joinDate: formData.joinDate
      };
      setEmployees(prev => [...prev, newEmployee]);
      alert('Employee added successfully!');
    }
    setShowModal(false);
  };

  const handleDeleteEmployee = (employeeId) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      setEmployees(prev => prev.filter(emp => emp.id !== employeeId));
      alert('Employee deleted successfully!');
    }
  };

  const handleLeaveAction = (requestId, action) => {
    setLeaveRequests(prev => prev.map(request =>
      request.id === requestId
        ? { ...request, status: action === 'approve' ? 'Approved' : 'Rejected' }
        : request
    ));
    alert(`Leave request ${action === 'approve' ? 'approved' : 'rejected'} successfully!`);
  };

  const renderEmployees = () => (
    <div className="hrm-employees">
      <div className="section-header">
        <h3>Employee Management</h3>
        <button className="btn-primary" onClick={handleAddEmployee}>
          Add New Employee
        </button>
      </div>
      
      <div className="employees-table">
        <table>
          <thead>
            <tr>
              <th>Employee ID</th>
              <th>Name</th>
              <th>Position</th>
              <th>Department</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Salary</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map(employee => (
              <tr key={employee.id}>
                <td>{employee.id}</td>
                <td>{employee.name}</td>
                <td>{employee.position}</td>
                <td>{employee.department}</td>
                <td>{employee.email}</td>
                <td>{employee.phone}</td>
                <td>{employee.salary}</td>
                <td>
                  <span className={`status ${employee.status.toLowerCase()}`}>
                    {employee.status}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="btn-edit"
                      onClick={() => handleEditEmployee(employee)}
                    >
                      Edit
                    </button>
                    <button 
                      className="btn-delete"
                      onClick={() => handleDeleteEmployee(employee.id)}
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

  const renderAttendance = () => (
    <div className="hrm-attendance">
      <div className="section-header">
        <h3>Attendance Management</h3>
        <button className="btn-primary">
          Mark Attendance
        </button>
      </div>
      
      <div className="attendance-summary">
        <div className="summary-card">
          <h4>Today's Attendance Summary</h4>
          <div className="attendance-stats">
            <div className="stat">
              <span className="stat-number">28</span>
              <span className="stat-label">Present</span>
            </div>
            <div className="stat">
              <span className="stat-number">2</span>
              <span className="stat-label">Absent</span>
            </div>
            <div className="stat">
              <span className="stat-number">1</span>
              <span className="stat-label">Late</span>
            </div>
            <div className="stat">
              <span className="stat-number">30</span>
              <span className="stat-label">Total</span>
            </div>
          </div>
        </div>
      </div>

      <div className="employees-table" style={{ marginTop: '24px' }}>
        <table>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Check In</th>
              <th>Check Out</th>
              <th>Hours Worked</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>John Smith</td>
              <td>09:00 AM</td>
              <td>06:00 PM</td>
              <td>8h 30m</td>
              <td><span className="status active">Present</span></td>
              <td>
                <button className="btn-edit">View Details</button>
              </td>
            </tr>
            <tr>
              <td>Sarah Johnson</td>
              <td>09:15 AM</td>
              <td>06:15 PM</td>
              <td>8h 30m</td>
              <td><span className="status active">Present</span></td>
              <td>
                <button className="btn-edit">View Details</button>
              </td>
            </tr>
            <tr>
              <td>Mike Davis</td>
              <td>--</td>
              <td>--</td>
              <td>--</td>
              <td><span className="status" style={{background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444'}}>Absent</span></td>
              <td>
                <button className="btn-edit">Mark Present</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderLeave = () => (
    <div className="hrm-leave">
      <div className="section-header">
        <h3>Leave Management</h3>
        <button className="btn-primary">
          Apply for Leave
        </button>
      </div>
      
      <div className="leave-requests">
        <div className="leave-card">
          <h4>Pending Leave Requests</h4>
          {leaveRequests.filter(request => request.status === 'Pending').map(request => (
            <div key={request.id} className="leave-item">
              <div>
                <strong>{request.employeeName}</strong> - {request.type}
                <br />
                <small>{request.startDate} to {request.endDate} ({request.days} days)</small>
                <br />
                <small>Reason: {request.reason}</small>
              </div>
              <div className="leave-actions">
                <button 
                  className="btn-approve"
                  onClick={() => handleLeaveAction(request.id, 'approve')}
                >
                  Approve
                </button>
                <button 
                  className="btn-reject"
                  onClick={() => handleLeaveAction(request.id, 'reject')}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="leave-card" style={{ marginTop: '20px' }}>
          <h4>Recent Leave History</h4>
          {leaveRequests.filter(request => request.status !== 'Pending').map(request => (
            <div key={request.id} className="leave-item">
              <div>
                <strong>{request.employeeName}</strong> - {request.type}
                <br />
                <small>{request.startDate} to {request.endDate} ({request.days} days)</small>
                <br />
                <span className={`status ${request.status.toLowerCase()}`}>
                  {request.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="hrm-system">
      <div className="hrm-header">
        <h2>Human Resource Management System</h2>
        <div className="nav-tabs">
          <button 
            className={`nav-tab ${activeTab === 'employees' ? 'active' : ''}`}
            onClick={() => setActiveTab('employees')}
          >
            Employees
          </button>
          <button 
            className={`nav-tab ${activeTab === 'attendance' ? 'active' : ''}`}
            onClick={() => setActiveTab('attendance')}
          >
            Attendance
          </button>
          <button 
            className={`nav-tab ${activeTab === 'leave' ? 'active' : ''}`}
            onClick={() => setActiveTab('leave')}
          >
            Leave Management
          </button>
        </div>
      </div>

      <div className="hrm-content">
        {activeTab === 'employees' && renderEmployees()}
        {activeTab === 'attendance' && renderAttendance()}
        {activeTab === 'leave' && renderLeave()}
      </div>

      {/* Employee Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter full name"
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
                <label>Department</label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                >
                  <option value="">Select Department</option>
                  <option value="Sales">Sales</option>
                  <option value="IT">IT</option>
                  <option value="Finance">Finance</option>
                  <option value="HR">HR</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Operations">Operations</option>
                </select>
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter email address"
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="form-group">
                <label>Salary</label>
                <input
                  type="number"
                  name="salary"
                  value={formData.salary}
                  onChange={handleInputChange}
                  placeholder="Enter annual salary"
                />
              </div>
              <div className="form-group">
                <label>Join Date</label>
                <input
                  type="date"
                  name="joinDate"
                  value={formData.joinDate}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleSaveEmployee}>
                {editingEmployee ? 'Update Employee' : 'Add Employee'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRMSystem;