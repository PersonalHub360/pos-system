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

  const [attendanceData, setAttendanceData] = useState([
    {
      id: 1,
      employeeName: 'John Smith',
      checkIn: '09:00 AM',
      checkOut: '06:00 PM',
      hoursWorked: '8h 30m',
      status: 'Present',
      date: '2024-02-15'
    },
    {
      id: 2,
      employeeName: 'Sarah Johnson',
      checkIn: '09:15 AM',
      checkOut: '06:15 PM',
      hoursWorked: '8h 30m',
      status: 'Present',
      date: '2024-02-15'
    },
    {
      id: 3,
      employeeName: 'Mike Davis',
      checkIn: '--',
      checkOut: '--',
      hoursWorked: '--',
      status: 'Absent',
      date: '2024-02-15'
    }
  ]);

  const [scheduleData, setScheduleData] = useState([
    {
      id: 1,
      employeeName: 'John Smith',
      shift: 'Morning',
      startTime: '09:00 AM',
      endTime: '06:00 PM',
      department: 'Sales',
      date: '2024-02-15'
    },
    {
      id: 2,
      employeeName: 'Sarah Johnson',
      shift: 'Morning',
      startTime: '09:00 AM',
      endTime: '06:00 PM',
      department: 'IT',
      date: '2024-02-15'
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

  // Import file handlers
  const handleEmployeeFileImport = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'text/csv') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const csv = e.target.result;
        const lines = csv.split('\n');
        const headers = lines[0].split(',');
        
        const newEmployees = lines.slice(1).filter(line => line.trim()).map((line, index) => {
          const values = line.split(',');
          return {
            id: `EMP${String(employees.length + index + 1).padStart(3, '0')}`,
            name: values[0]?.trim() || '',
            position: values[1]?.trim() || '',
            department: values[2]?.trim() || '',
            email: values[3]?.trim() || '',
            phone: values[4]?.trim() || '',
            salary: values[5]?.trim() || '',
            status: 'Active',
            joinDate: values[6]?.trim() || new Date().toISOString().split('T')[0]
          };
        });
        
        setEmployees(prev => [...prev, ...newEmployees]);
        alert(`Successfully imported ${newEmployees.length} employees!`);
      };
      reader.readAsText(file);
    } else {
      alert('Please select a valid CSV file');
    }
    event.target.value = '';
  };

  const handleAttendanceFileImport = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'text/csv') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const csv = e.target.result;
        const lines = csv.split('\n');
        
        const newAttendance = lines.slice(1).filter(line => line.trim()).map((line, index) => {
          const values = line.split(',');
          return {
            id: attendanceData.length + index + 1,
            employeeName: values[0]?.trim() || '',
            checkIn: values[1]?.trim() || '--',
            checkOut: values[2]?.trim() || '--',
            hoursWorked: values[3]?.trim() || '--',
            status: values[4]?.trim() || 'Present',
            date: values[5]?.trim() || new Date().toISOString().split('T')[0]
          };
        });
        
        setAttendanceData(prev => [...prev, ...newAttendance]);
        alert(`Successfully imported ${newAttendance.length} attendance records!`);
      };
      reader.readAsText(file);
    } else {
      alert('Please select a valid CSV file');
    }
    event.target.value = '';
  };

  const handleLeaveFileImport = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'text/csv') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const csv = e.target.result;
        const lines = csv.split('\n');
        
        const newLeaveRequests = lines.slice(1).filter(line => line.trim()).map((line, index) => {
          const values = line.split(',');
          return {
            id: leaveRequests.length + index + 1,
            employeeName: values[0]?.trim() || '',
            type: values[1]?.trim() || 'Annual Leave',
            startDate: values[2]?.trim() || '',
            endDate: values[3]?.trim() || '',
            days: parseInt(values[4]?.trim()) || 1,
            status: values[5]?.trim() || 'Pending',
            reason: values[6]?.trim() || ''
          };
        });
        
        setLeaveRequests(prev => [...prev, ...newLeaveRequests]);
        alert(`Successfully imported ${newLeaveRequests.length} leave requests!`);
      };
      reader.readAsText(file);
    } else {
      alert('Please select a valid CSV file');
    }
    event.target.value = '';
  };

  const handleScheduleFileImport = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'text/csv') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const csv = e.target.result;
        const lines = csv.split('\n');
        
        const newSchedules = lines.slice(1).filter(line => line.trim()).map((line, index) => {
          const values = line.split(',');
          return {
            id: scheduleData.length + index + 1,
            employeeName: values[0]?.trim() || '',
            shift: values[1]?.trim() || 'Morning',
            startTime: values[2]?.trim() || '09:00 AM',
            endTime: values[3]?.trim() || '06:00 PM',
            department: values[4]?.trim() || '',
            date: values[5]?.trim() || new Date().toISOString().split('T')[0]
          };
        });
        
        setScheduleData(prev => [...prev, ...newSchedules]);
        alert(`Successfully imported ${newSchedules.length} schedule records!`);
      };
      reader.readAsText(file);
    } else {
      alert('Please select a valid CSV file');
    }
    event.target.value = '';
  };

  // Sample file download handlers
  const downloadEmployeeSample = () => {
    const sampleData = [
      ['Name', 'Position', 'Department', 'Email', 'Phone', 'Salary', 'Join Date'],
      ['John Doe', 'Software Engineer', 'IT', 'john.doe@company.com', '+1-555-0100', '$80000', '2024-01-15'],
      ['Jane Smith', 'Marketing Manager', 'Marketing', 'jane.smith@company.com', '+1-555-0101', '$75000', '2024-01-20']
    ];
    
    const csvContent = sampleData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employee_sample.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadAttendanceSample = () => {
    const sampleData = [
      ['Employee Name', 'Check In', 'Check Out', 'Hours Worked', 'Status', 'Date'],
      ['John Doe', '09:00 AM', '06:00 PM', '8h 30m', 'Present', '2024-02-15'],
      ['Jane Smith', '09:15 AM', '06:15 PM', '8h 30m', 'Present', '2024-02-15']
    ];
    
    const csvContent = sampleData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'attendance_sample.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadLeaveSample = () => {
    const sampleData = [
      ['Employee Name', 'Leave Type', 'Start Date', 'End Date', 'Days', 'Status', 'Reason'],
      ['John Doe', 'Annual Leave', '2024-03-01', '2024-03-05', '5', 'Pending', 'Family vacation'],
      ['Jane Smith', 'Sick Leave', '2024-02-20', '2024-02-22', '3', 'Approved', 'Medical appointment']
    ];
    
    const csvContent = sampleData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leave_sample.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadScheduleSample = () => {
    const sampleData = [
      ['Employee Name', 'Shift', 'Start Time', 'End Time', 'Department', 'Date'],
      ['John Doe', 'Morning', '09:00 AM', '06:00 PM', 'IT', '2024-02-15'],
      ['Jane Smith', 'Evening', '02:00 PM', '11:00 PM', 'Marketing', '2024-02-15']
    ];
    
    const csvContent = sampleData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'schedule_sample.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const renderEmployees = () => (
    <div className="hrm-employees">
      <div className="section-header">
        <h3>Employee Management</h3>
        <div className="header-actions">
          <button className="btn-primary" onClick={handleAddEmployee}>
            Add New Employee
          </button>
        </div>
      </div>
      
      <div className="import-section">
        <div className="import-controls">
          <div className="file-input-wrapper">
            <input
              type="file"
              id="employee-file-input"
              accept=".csv"
              onChange={handleEmployeeFileImport}
              style={{ display: 'none' }}
            />
            <label htmlFor="employee-file-input" className="file-input-label">
              📁 Import CSV
            </label>
          </div>
          <button className="download-sample-btn" onClick={downloadEmployeeSample}>
            📥 Download Sample
          </button>
        </div>
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
        <div className="header-actions">
          <button className="btn-primary">
            Mark Attendance
          </button>
        </div>
      </div>
      
      <div className="import-section">
        <div className="import-controls">
          <div className="file-input-wrapper">
            <input
              type="file"
              id="attendance-file-input"
              accept=".csv"
              onChange={handleAttendanceFileImport}
              style={{ display: 'none' }}
            />
            <label htmlFor="attendance-file-input" className="file-input-label">
              📁 Import CSV
            </label>
          </div>
          <button className="download-sample-btn" onClick={downloadAttendanceSample}>
            📥 Download Sample
          </button>
        </div>
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
            {attendanceData.map(record => (
              <tr key={record.id}>
                <td>{record.employeeName}</td>
                <td>{record.checkIn}</td>
                <td>{record.checkOut}</td>
                <td>{record.hoursWorked}</td>
                <td>
                  <span className={`status ${record.status.toLowerCase()}`}>
                    {record.status}
                  </span>
                </td>
                <td>
                  <button className="btn-edit">
                    {record.status === 'Absent' ? 'Mark Present' : 'View Details'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderLeave = () => (
    <div className="hrm-leave">
      <div className="section-header">
        <h3>Leave Management</h3>
        <div className="header-actions">
          <button className="btn-primary">
            Apply for Leave
          </button>
        </div>
      </div>
      
      <div className="import-section">
        <div className="import-controls">
          <div className="file-input-wrapper">
            <input
              type="file"
              id="leave-file-input"
              accept=".csv"
              onChange={handleLeaveFileImport}
              style={{ display: 'none' }}
            />
            <label htmlFor="leave-file-input" className="file-input-label">
              📁 Import CSV
            </label>
          </div>
          <button className="download-sample-btn" onClick={downloadLeaveSample}>
            📥 Download Sample
          </button>
        </div>
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

  const renderSchedule = () => (
    <div className="hrm-schedule">
      <div className="section-header">
        <h3>Schedule Management</h3>
        <div className="header-actions">
          <button className="btn-primary">
            Add New Schedule
          </button>
        </div>
      </div>
      
      <div className="import-section">
        <div className="import-controls">
          <div className="file-input-wrapper">
            <input
              type="file"
              id="schedule-file-input"
              accept=".csv"
              onChange={handleScheduleFileImport}
              style={{ display: 'none' }}
            />
            <label htmlFor="schedule-file-input" className="file-input-label">
              📁 Upload Schedule CSV
            </label>
          </div>
          <button className="download-sample-btn" onClick={downloadScheduleSample}>
            📥 Download Sample
          </button>
        </div>
      </div>
      
      <div className="schedule-summary">
        <div className="summary-card">
          <h4>Today's Schedule Overview</h4>
          <div className="schedule-stats">
            <div className="stat">
              <span className="stat-number">{scheduleData.filter(s => s.shift === 'Morning').length}</span>
              <span className="stat-label">Morning Shift</span>
            </div>
            <div className="stat">
              <span className="stat-number">{scheduleData.filter(s => s.shift === 'Evening').length}</span>
              <span className="stat-label">Evening Shift</span>
            </div>
            <div className="stat">
              <span className="stat-number">{scheduleData.filter(s => s.shift === 'Night').length}</span>
              <span className="stat-label">Night Shift</span>
            </div>
            <div className="stat">
              <span className="stat-number">{scheduleData.length}</span>
              <span className="stat-label">Total Scheduled</span>
            </div>
          </div>
        </div>
      </div>

      <div className="employees-table" style={{ marginTop: '24px' }}>
        <table>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Shift</th>
              <th>Start Time</th>
              <th>End Time</th>
              <th>Department</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {scheduleData.map(schedule => (
              <tr key={schedule.id}>
                <td>{schedule.employeeName}</td>
                <td>
                  <span className={`status ${schedule.shift.toLowerCase()}`}>
                    {schedule.shift}
                  </span>
                </td>
                <td>{schedule.startTime}</td>
                <td>{schedule.endTime}</td>
                <td>{schedule.department}</td>
                <td>{schedule.date}</td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-edit">Edit</button>
                    <button className="btn-delete">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
          <button 
            className={`nav-tab ${activeTab === 'schedule' ? 'active' : ''}`}
            onClick={() => setActiveTab('schedule')}
          >
            Schedule
          </button>
        </div>
      </div>

      <div className="hrm-content">
          {activeTab === 'employees' && renderEmployees()}
          {activeTab === 'attendance' && renderAttendance()}
          {activeTab === 'leave' && renderLeave()}
          {activeTab === 'schedule' && renderSchedule()}
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