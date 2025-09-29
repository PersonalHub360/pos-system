import React, { useState, useEffect } from 'react';
import './TableManagement.css';

const TableManagement = () => {
  // State management
  const [activeSection, setActiveSection] = useState('overview');
  const [tables, setTables] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedTable, setSelectedTable] = useState(null);
  const [formData, setFormData] = useState({
    tableNumber: '',
    capacity: '',
    location: '',
    status: 'available',
    description: ''
  });

  // Sample data for demonstration
  useEffect(() => {
    const sampleTables = [
      {
        id: 1,
        tableNumber: 'T001',
        capacity: 4,
        location: 'Main Hall',
        status: 'available',
        description: 'Window side table',
        createdDate: '2024-01-15',
        lastUpdated: '2024-01-15'
      },
      {
        id: 2,
        tableNumber: 'T002',
        capacity: 6,
        location: 'Main Hall',
        status: 'occupied',
        description: 'Center table',
        createdDate: '2024-01-15',
        lastUpdated: '2024-01-20'
      },
      {
        id: 3,
        tableNumber: 'T003',
        capacity: 2,
        location: 'Terrace',
        status: 'reserved',
        description: 'Outdoor seating',
        createdDate: '2024-01-16',
        lastUpdated: '2024-01-18'
      },
      {
        id: 4,
        tableNumber: 'T004',
        capacity: 8,
        location: 'Private Room',
        status: 'maintenance',
        description: 'VIP dining area',
        createdDate: '2024-01-17',
        lastUpdated: '2024-01-19'
      }
    ];
    setTables(sampleTables);
  }, []);

  // Modal handlers
  const handleAddTable = () => {
    setModalType('add');
    setFormData({
      tableNumber: '',
      capacity: '',
      location: '',
      status: 'available',
      description: ''
    });
    setShowModal(true);
  };

  const handleEditTable = (table) => {
    setModalType('edit');
    setSelectedTable(table);
    setFormData({
      tableNumber: table.tableNumber,
      capacity: table.capacity.toString(),
      location: table.location,
      status: table.status,
      description: table.description
    });
    setShowModal(true);
  };

  const handleViewTable = (table) => {
    setModalType('view');
    setSelectedTable(table);
    setShowModal(true);
  };

  const handleDeleteTable = (table) => {
    setModalType('delete');
    setSelectedTable(table);
    setShowModal(true);
  };

  const handlePrintTable = (table) => {
    const printContent = `
      <div style="padding: 20px; font-family: Arial, sans-serif;">
        <h2>Table Information</h2>
        <hr>
        <p><strong>Table Number:</strong> ${table.tableNumber}</p>
        <p><strong>Capacity:</strong> ${table.capacity} persons</p>
        <p><strong>Location:</strong> ${table.location}</p>
        <p><strong>Status:</strong> ${table.status}</p>
        <p><strong>Description:</strong> ${table.description}</p>
        <p><strong>Created Date:</strong> ${table.createdDate}</p>
        <p><strong>Last Updated:</strong> ${table.lastUpdated}</p>
        <hr>
        <p style="text-align: center; margin-top: 20px;">Generated on ${new Date().toLocaleDateString()}</p>
      </div>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  // Form handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitTable = () => {
    // Validation
    if (!formData.tableNumber || !formData.capacity || !formData.location) {
      alert('Please fill in all required fields');
      return;
    }

    if (modalType === 'add') {
      const newTable = {
        id: Date.now(),
        tableNumber: formData.tableNumber,
        capacity: parseInt(formData.capacity),
        location: formData.location,
        status: formData.status,
        description: formData.description,
        createdDate: new Date().toISOString().split('T')[0],
        lastUpdated: new Date().toISOString().split('T')[0]
      };
      setTables(prev => [...prev, newTable]);
    } else if (modalType === 'edit') {
      setTables(prev => prev.map(table => 
        table.id === selectedTable.id 
          ? {
              ...table,
              tableNumber: formData.tableNumber,
              capacity: parseInt(formData.capacity),
              location: formData.location,
              status: formData.status,
              description: formData.description,
              lastUpdated: new Date().toISOString().split('T')[0]
            }
          : table
      ));
    }
    
    setShowModal(false);
    setSelectedTable(null);
  };

  const confirmDelete = () => {
    setTables(prev => prev.filter(table => table.id !== selectedTable.id));
    setShowModal(false);
    setSelectedTable(null);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedTable(null);
  };

  // Statistics calculations
  const totalTables = tables.length;
  const availableTables = tables.filter(table => table.status === 'available').length;
  const occupiedTables = tables.filter(table => table.status === 'occupied').length;
  const reservedTables = tables.filter(table => table.status === 'reserved').length;
  const maintenanceTables = tables.filter(table => table.status === 'maintenance').length;

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'available': return 'status-available';
      case 'occupied': return 'status-occupied';
      case 'reserved': return 'status-reserved';
      case 'maintenance': return 'status-maintenance';
      default: return 'status-available';
    }
  };

  return (
    <div className="table-management">
      <div className="table-management-header">
        <h1>Table Management</h1>
        <div className="header-actions">
          <button 
            className="btn btn-primary"
            onClick={handleAddTable}
          >
            + Add New Table
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="table-nav">
        <button 
          className={`nav-btn ${activeSection === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveSection('overview')}
        >
          Overview
        </button>
        <button 
          className={`nav-btn ${activeSection === 'list' ? 'active' : ''}`}
          onClick={() => setActiveSection('list')}
        >
          Table List
        </button>
      </div>

      {/* Overview Section */}
      {activeSection === 'overview' && (
        <div className="overview-section">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">🏪</div>
              <div className="stat-info">
                <h3>{totalTables}</h3>
                <p>Total Tables</p>
              </div>
            </div>
            <div className="stat-card available">
              <div className="stat-icon">✅</div>
              <div className="stat-info">
                <h3>{availableTables}</h3>
                <p>Available</p>
              </div>
            </div>
            <div className="stat-card occupied">
              <div className="stat-icon">👥</div>
              <div className="stat-info">
                <h3>{occupiedTables}</h3>
                <p>Occupied</p>
              </div>
            </div>
            <div className="stat-card reserved">
              <div className="stat-icon">📅</div>
              <div className="stat-info">
                <h3>{reservedTables}</h3>
                <p>Reserved</p>
              </div>
            </div>
            <div className="stat-card maintenance">
              <div className="stat-icon">🔧</div>
              <div className="stat-info">
                <h3>{maintenanceTables}</h3>
                <p>Maintenance</p>
              </div>
            </div>
          </div>

          <div className="recent-tables">
            <h3>Recent Tables</h3>
            <div className="table-grid">
              {tables.slice(0, 6).map(table => (
                <div key={table.id} className="table-card">
                  <div className="table-card-header">
                    <h4>{table.tableNumber}</h4>
                    <span className={`status-badge ${getStatusBadgeClass(table.status)}`}>
                      {table.status}
                    </span>
                  </div>
                  <div className="table-card-body">
                    <p><strong>Capacity:</strong> {table.capacity} persons</p>
                    <p><strong>Location:</strong> {table.location}</p>
                    <p><strong>Description:</strong> {table.description}</p>
                  </div>
                  <div className="table-card-actions">
                    <button 
                      className="btn-action view"
                      onClick={() => handleViewTable(table)}
                      title="View"
                    >
                      👁️
                    </button>
                    <button 
                      className="btn-action edit"
                      onClick={() => handleEditTable(table)}
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button 
                      className="btn-action print"
                      onClick={() => handlePrintTable(table)}
                      title="Print"
                    >
                      🖨️
                    </button>
                    <button 
                      className="btn-action delete"
                      onClick={() => handleDeleteTable(table)}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Table List Section */}
      {activeSection === 'list' && (
        <div className="list-section">
          <div className="list-header">
            <h3>All Tables ({totalTables})</h3>
          </div>
          <div className="table-list">
            <table>
              <thead>
                <tr>
                  <th>Table Number</th>
                  <th>Capacity</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Description</th>
                  <th>Last Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tables.map(table => (
                  <tr key={table.id}>
                    <td><strong>{table.tableNumber}</strong></td>
                    <td>{table.capacity} persons</td>
                    <td>{table.location}</td>
                    <td>
                      <span className={`status-badge ${getStatusBadgeClass(table.status)}`}>
                        {table.status}
                      </span>
                    </td>
                    <td>{table.description}</td>
                    <td>{table.lastUpdated}</td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn-action view"
                          onClick={() => handleViewTable(table)}
                          title="View"
                        >
                          👁️
                        </button>
                        <button 
                          className="btn-action edit"
                          onClick={() => handleEditTable(table)}
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button 
                          className="btn-action print"
                          onClick={() => handlePrintTable(table)}
                          title="Print"
                        >
                          🖨️
                        </button>
                        <button 
                          className="btn-action delete"
                          onClick={() => handleDeleteTable(table)}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>
                {modalType === 'add' && 'Add New Table'}
                {modalType === 'edit' && 'Edit Table'}
                {modalType === 'view' && 'Table Details'}
                {modalType === 'delete' && 'Delete Table'}
              </h3>
              <button className="close-btn" onClick={closeModal}>×</button>
            </div>
            
            <div className="modal-body">
              {modalType === 'delete' ? (
                <div className="delete-confirmation">
                  <p>Are you sure you want to delete table <strong>{selectedTable?.tableNumber}</strong>?</p>
                  <p>This action cannot be undone.</p>
                  <div className="modal-actions">
                    <button className="btn btn-secondary" onClick={closeModal}>
                      Cancel
                    </button>
                    <button className="btn btn-danger" onClick={confirmDelete}>
                      Delete Table
                    </button>
                  </div>
                </div>
              ) : modalType === 'view' ? (
                <div className="table-details">
                  <div className="detail-row">
                    <label>Table Number:</label>
                    <span>{selectedTable?.tableNumber}</span>
                  </div>
                  <div className="detail-row">
                    <label>Capacity:</label>
                    <span>{selectedTable?.capacity} persons</span>
                  </div>
                  <div className="detail-row">
                    <label>Location:</label>
                    <span>{selectedTable?.location}</span>
                  </div>
                  <div className="detail-row">
                    <label>Status:</label>
                    <span className={`status-badge ${getStatusBadgeClass(selectedTable?.status)}`}>
                      {selectedTable?.status}
                    </span>
                  </div>
                  <div className="detail-row">
                    <label>Description:</label>
                    <span>{selectedTable?.description}</span>
                  </div>
                  <div className="detail-row">
                    <label>Created Date:</label>
                    <span>{selectedTable?.createdDate}</span>
                  </div>
                  <div className="detail-row">
                    <label>Last Updated:</label>
                    <span>{selectedTable?.lastUpdated}</span>
                  </div>
                  <div className="modal-actions">
                    <button className="btn btn-secondary" onClick={closeModal}>
                      Close
                    </button>
                    <button 
                      className="btn btn-primary" 
                      onClick={() => handlePrintTable(selectedTable)}
                    >
                      Print Details
                    </button>
                  </div>
                </div>
              ) : (
                <div className="table-form">
                  <div className="form-group">
                    <label>Table Number *</label>
                    <input
                      type="text"
                      name="tableNumber"
                      value={formData.tableNumber}
                      onChange={handleInputChange}
                      placeholder="e.g., T001"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Capacity *</label>
                    <input
                      type="number"
                      name="capacity"
                      value={formData.capacity}
                      onChange={handleInputChange}
                      placeholder="Number of persons"
                      min="1"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Location *</label>
                    <select
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Location</option>
                      <option value="Main Hall">Main Hall</option>
                      <option value="Terrace">Terrace</option>
                      <option value="Private Room">Private Room</option>
                      <option value="Bar Area">Bar Area</option>
                      <option value="Garden">Garden</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                    >
                      <option value="available">Available</option>
                      <option value="occupied">Occupied</option>
                      <option value="reserved">Reserved</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Additional details about the table"
                      rows="3"
                    />
                  </div>
                  <div className="modal-actions">
                    <button className="btn btn-secondary" onClick={closeModal}>
                      Cancel
                    </button>
                    <button className="btn btn-primary" onClick={handleSubmitTable}>
                      {modalType === 'add' ? 'Add Table' : 'Update Table'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableManagement;