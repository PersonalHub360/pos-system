import React, { useState, useEffect, useCallback } from 'react';
import './TableManagement.css';

const TableManagement = () => {
  // State management
  const [activeSection, setActiveSection] = useState('overview');
  const [tables, setTables] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'add', 'edit', 'view', 'delete', 'reserve'
  const [selectedTable, setSelectedTable] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form data states
  const [formData, setFormData] = useState({
    tableNumber: '',
    capacity: '',
    location: '',
    status: 'available',
    description: ''
  });
  
  const [reservationForm, setReservationForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    partySize: '',
    reservationDate: '',
    reservationTime: '',
    duration: '120',
    specialRequests: ''
  });

  // Filter and search states
  const [filters, setFilters] = useState({
    status: 'all',
    section: 'all',
    search: ''
  });

  // API functions
  const fetchTables = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tables');
      if (!response.ok) throw new Error('Failed to fetch tables');
      const data = await response.json();
      setTables(data.tables || []);
    } catch (err) {
      setError('Failed to load tables: ' + err.message);
      console.error('Error fetching tables:', err);
      // Fallback to sample data
      const sampleTables = [
        {
          id: 1,
          tableNumber: 'T001',
          capacity: 4,
          location: 'Main Hall',
          status: 'available',
          description: 'Window side table',
          createdDate: '2024-01-15',
          lastUpdated: '2024-01-20'
        },
        {
          id: 2,
          tableNumber: 'T002',
          capacity: 2,
          location: 'Terrace',
          status: 'occupied',
          description: 'Outdoor seating',
          createdDate: '2024-01-16',
          lastUpdated: '2024-01-20'
        },
        {
          id: 3,
          tableNumber: 'T003',
          capacity: 6,
          location: 'Main Hall',
          status: 'reserved',
          description: 'Large family table',
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
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchReservations = useCallback(async () => {
    try {
      const response = await fetch('/api/reservations');
      if (!response.ok) throw new Error('Failed to fetch reservations');
      const data = await response.json();
      setReservations(data.reservations || []);
    } catch (err) {
      console.error('Error fetching reservations:', err);
    }
  }, []);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchTables(), fetchReservations()]);
    };
    loadData();
  }, [fetchTables, fetchReservations]);

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

  const handleReserveTable = (table) => {
    setModalType('reserve');
    setSelectedTable(table);
    setReservationForm({
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      partySize: '',
      reservationDate: '',
      reservationTime: '',
      duration: '120',
      specialRequests: ''
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

  const handleReservationInputChange = (e) => {
    const { name, value } = e.target;
    setReservationForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitTable = async () => {
    // Validation
    if (!formData.tableNumber || !formData.capacity || !formData.location) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      if (modalType === 'add') {
        const response = await fetch('/api/tables', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tableNumber: formData.tableNumber,
            capacity: parseInt(formData.capacity),
            location: formData.location,
            status: formData.status,
            description: formData.description
          })
        });
        
        if (!response.ok) throw new Error('Failed to add table');
        
        // Fallback for demo
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
        const response = await fetch(`/api/tables/${selectedTable.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tableNumber: formData.tableNumber,
            capacity: parseInt(formData.capacity),
            location: formData.location,
            status: formData.status,
            description: formData.description
          })
        });
        
        if (!response.ok) throw new Error('Failed to update table');
        
        // Fallback for demo
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
      
    } catch (err) {
      setError('Failed to save table: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReservation = async () => {
    // Validation
    if (!reservationForm.customerName || !reservationForm.customerPhone || 
        !reservationForm.partySize || !reservationForm.reservationDate || 
        !reservationForm.reservationTime) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tableId: selectedTable.id,
          customerName: reservationForm.customerName,
          customerPhone: reservationForm.customerPhone,
          customerEmail: reservationForm.customerEmail,
          partySize: parseInt(reservationForm.partySize),
          reservationDate: reservationForm.reservationDate,
          reservationTime: reservationForm.reservationTime,
          duration: parseInt(reservationForm.duration),
          specialRequests: reservationForm.specialRequests
        })
      });
      
      if (!response.ok) throw new Error('Failed to create reservation');
      
      // Update table status to reserved
      setTables(prev => prev.map(table => 
        table.id === selectedTable.id 
          ? { ...table, status: 'reserved', lastUpdated: new Date().toISOString().split('T')[0] }
          : table
      ));
      
      setShowModal(false);
      setSelectedTable(null);
      alert('Reservation created successfully!');
      
    } catch (err) {
      setError('Failed to create reservation: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/tables/${selectedTable.id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete table');
      
      // Fallback for demo
      setTables(prev => prev.filter(table => table.id !== selectedTable.id));
      setShowModal(false);
      setSelectedTable(null);
      
    } catch (err) {
      setError('Failed to delete table: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedTable(null);
  };

  // Filter tables based on current filters
  const filteredTables = tables.filter(table => {
    const matchesStatus = filters.status === 'all' || table.status === filters.status;
    const matchesSection = filters.section === 'all' || table.location === filters.section;
    const matchesSearch = filters.search === '' || 
      table.tableNumber.toLowerCase().includes(filters.search.toLowerCase()) ||
      table.location.toLowerCase().includes(filters.search.toLowerCase()) ||
      table.description.toLowerCase().includes(filters.search.toLowerCase());
    
    return matchesStatus && matchesSection && matchesSearch;
  });

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

      {/* Loading and Error States */}
      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading tables...</p>
        </div>
      )}

      {error && (
        <div className="error-state">
          <p className="error-message">{error}</p>
          <button className="btn btn-primary" onClick={() => { setError(''); fetchTables(); }}>
            Retry
          </button>
        </div>
      )}

      {/* Overview Section */}
      {activeSection === 'overview' && !loading && (
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
                    {table.status === 'available' && (
                      <button 
                        className="btn-action reserve"
                        onClick={() => handleReserveTable(table)}
                        title="Reserve"
                      >
                        📅
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Table List Section */}
      {activeSection === 'list' && !loading && (
        <div className="list-section">
          <div className="list-header">
            <h3>All Tables ({filteredTables.length})</h3>
            <div className="list-filters">
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="filter-select"
              >
                <option value="all">All Status</option>
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="reserved">Reserved</option>
                <option value="maintenance">Maintenance</option>
              </select>
              <select
                name="section"
                value={filters.section}
                onChange={handleFilterChange}
                className="filter-select"
              >
                <option value="all">All Sections</option>
                <option value="Main Hall">Main Hall</option>
                <option value="Terrace">Terrace</option>
                <option value="Private Room">Private Room</option>
                <option value="Bar Area">Bar Area</option>
                <option value="Garden">Garden</option>
              </select>
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Search tables..."
                className="search-input"
              />
            </div>
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
                {filteredTables.map(table => (
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
                        {table.status === 'available' && (
                          <button 
                            className="btn-action reserve"
                            onClick={() => handleReserveTable(table)}
                            title="Reserve"
                          >
                            📅
                          </button>
                        )}
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
                {modalType === 'reserve' && 'Reserve Table'}
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
                    <button className="btn btn-danger" onClick={confirmDelete} disabled={loading}>
                      {loading ? 'Deleting...' : 'Delete Table'}
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
              ) : modalType === 'reserve' ? (
                <div className="reservation-form">
                  <div className="form-group">
                    <label>Table: {selectedTable?.tableNumber}</label>
                    <p>Capacity: {selectedTable?.capacity} persons | Location: {selectedTable?.location}</p>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Customer Name *</label>
                      <input
                        type="text"
                        name="customerName"
                        value={reservationForm.customerName}
                        onChange={handleReservationInputChange}
                        placeholder="Enter customer name"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Phone Number *</label>
                      <input
                        type="tel"
                        name="customerPhone"
                        value={reservationForm.customerPhone}
                        onChange={handleReservationInputChange}
                        placeholder="Enter phone number"
                        required
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      name="customerEmail"
                      value={reservationForm.customerEmail}
                      onChange={handleReservationInputChange}
                      placeholder="Enter email address"
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Party Size *</label>
                      <input
                        type="number"
                        name="partySize"
                        value={reservationForm.partySize}
                        onChange={handleReservationInputChange}
                        placeholder="Number of guests"
                        min="1"
                        max={selectedTable?.capacity}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Duration (minutes)</label>
                      <select
                        name="duration"
                        value={reservationForm.duration}
                        onChange={handleReservationInputChange}
                      >
                        <option value="60">1 hour</option>
                        <option value="90">1.5 hours</option>
                        <option value="120">2 hours</option>
                        <option value="180">3 hours</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Reservation Date *</label>
                      <input
                        type="date"
                        name="reservationDate"
                        value={reservationForm.reservationDate}
                        onChange={handleReservationInputChange}
                        min={new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Reservation Time *</label>
                      <input
                        type="time"
                        name="reservationTime"
                        value={reservationForm.reservationTime}
                        onChange={handleReservationInputChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Special Requests</label>
                    <textarea
                      name="specialRequests"
                      value={reservationForm.specialRequests}
                      onChange={handleReservationInputChange}
                      placeholder="Any special requests or notes"
                      rows="3"
                    />
                  </div>
                  <div className="modal-actions">
                    <button className="btn btn-secondary" onClick={closeModal}>
                      Cancel
                    </button>
                    <button className="btn btn-primary" onClick={handleSubmitReservation} disabled={loading}>
                      {loading ? 'Creating...' : 'Create Reservation'}
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
                    <button className="btn btn-primary" onClick={handleSubmitTable} disabled={loading}>
                      {loading ? 'Saving...' : (modalType === 'add' ? 'Add Table' : 'Update Table')}
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