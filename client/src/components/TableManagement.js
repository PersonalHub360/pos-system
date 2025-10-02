import React, { useState, useEffect } from 'react';
import './TableManagement.css';

const TableManagement = () => {
  const [activeTab, setActiveTab] = useState('tables');
  const [showModal, setShowModal] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  
  // Sample data
  const [tables, setTables] = useState([
    { id: 1, number: 'T001', capacity: 4, status: 'available', location: 'Main Hall', type: 'Regular' },
    { id: 2, number: 'T002', capacity: 2, status: 'occupied', location: 'Main Hall', type: 'Regular' },
    { id: 3, number: 'T003', capacity: 6, status: 'reserved', location: 'Private Room', type: 'VIP' },
    { id: 4, number: 'T004', capacity: 8, status: 'maintenance', location: 'Garden', type: 'Outdoor' },
    { id: 5, number: 'T005', capacity: 4, status: 'available', location: 'Main Hall', type: 'Regular' }
  ]);

  const [reservations, setReservations] = useState([
    { id: 1, tableId: 3, customerName: 'John Doe', phone: '123-456-7890', date: '2024-01-15', time: '19:00', guests: 4, status: 'confirmed' },
    { id: 2, tableId: 2, customerName: 'Jane Smith', phone: '098-765-4321', date: '2024-01-15', time: '20:30', guests: 2, status: 'pending' }
  ]);

  const [tableFormData, setTableFormData] = useState({
    number: '',
    capacity: '',
    location: '',
    type: 'Regular'
  });

  const [reservationFormData, setReservationFormData] = useState({
    customerName: '',
    phone: '',
    date: '',
    time: '',
    guests: '',
    notes: ''
  });

  // Handle input changes
  const handleTableInputChange = (e) => {
    const { name, value } = e.target;
    setTableFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleReservationInputChange = (e) => {
    const { name, value } = e.target;
    setReservationFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Table management functions
  const handleAddTable = () => {
    setEditingTable(null);
    setTableFormData({ number: '', capacity: '', location: '', type: 'Regular' });
    setShowModal(true);
  };

  const handleEditTable = (table) => {
    setEditingTable(table);
    setTableFormData({
      number: table.number,
      capacity: table.capacity,
      location: table.location,
      type: table.type
    });
    setShowModal(true);
  };

  const handleSaveTable = () => {
    if (editingTable) {
      setTables(prev => prev.map(table => 
        table.id === editingTable.id 
          ? { ...table, ...tableFormData }
          : table
      ));
    } else {
      const newTable = {
        id: Date.now(),
        ...tableFormData,
        status: 'available'
      };
      setTables(prev => [...prev, newTable]);
    }
    setShowModal(false);
    setEditingTable(null);
  };

  const handleDeleteTable = (tableId) => {
    if (window.confirm('Are you sure you want to delete this table?')) {
      setTables(prev => prev.filter(table => table.id !== tableId));
    }
  };

  const handleTableStatusChange = (tableId, newStatus) => {
    setTables(prev => prev.map(table => 
      table.id === tableId 
        ? { ...table, status: newStatus }
        : table
    ));
  };

  // Reservation management functions
  const handleMakeReservation = (table) => {
    setSelectedTable(table);
    setReservationFormData({
      customerName: '',
      phone: '',
      date: '',
      time: '',
      guests: '',
      notes: ''
    });
    setShowReservationModal(true);
  };

  const handleSaveReservation = () => {
    const newReservation = {
      id: Date.now(),
      tableId: selectedTable.id,
      ...reservationFormData,
      status: 'pending'
    };
    setReservations(prev => [...prev, newReservation]);
    
    // Update table status to reserved
    handleTableStatusChange(selectedTable.id, 'reserved');
    
    setShowReservationModal(false);
    setSelectedTable(null);
  };

  const handleCancelReservation = (reservationId) => {
    if (window.confirm('Are you sure you want to cancel this reservation?')) {
      const reservation = reservations.find(r => r.id === reservationId);
      if (reservation) {
        // Update table status back to available
        handleTableStatusChange(reservation.tableId, 'available');
        setReservations(prev => prev.filter(r => r.id !== reservationId));
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return '#4CAF50';
      case 'occupied': return '#FF5722';
      case 'reserved': return '#FF9800';
      case 'maintenance': return '#9E9E9E';
      default: return '#2196F3';
    }
  };

  const renderTables = () => (
    <div className="tables-section">
      <div className="section-header">
        <h2>Table Management</h2>
        <button className="btn btn-primary" onClick={handleAddTable}>
          Add New Table
        </button>
      </div>
      
      <div className="table-grid">
        {tables.map(table => (
          <div key={table.id} className="table-card">
            <div className="table-header">
              <h3>{table.number}</h3>
              <span 
                className="status-badge" 
                style={{ backgroundColor: getStatusColor(table.status) }}
              >
                {table.status}
              </span>
            </div>
            <div className="table-info">
              <p><strong>Capacity:</strong> {table.capacity} guests</p>
              <p><strong>Location:</strong> {table.location}</p>
              <p><strong>Type:</strong> {table.type}</p>
            </div>
            <div className="table-actions">
              <button 
                className="btn btn-sm btn-secondary" 
                onClick={() => handleEditTable(table)}
              >
                Edit
              </button>
              {table.status === 'available' && (
                <button 
                  className="btn btn-sm btn-primary" 
                  onClick={() => handleMakeReservation(table)}
                >
                  Reserve
                </button>
              )}
              <select 
                value={table.status} 
                onChange={(e) => handleTableStatusChange(table.id, e.target.value)}
                className="status-select"
              >
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="reserved">Reserved</option>
                <option value="maintenance">Maintenance</option>
              </select>
              <button 
                className="btn btn-sm btn-danger" 
                onClick={() => handleDeleteTable(table.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderReservations = () => (
    <div className="reservations-section">
      <div className="section-header">
        <h2>Reservations</h2>
      </div>
      
      <div className="reservations-table">
        <table>
          <thead>
            <tr>
              <th>Table</th>
              <th>Customer</th>
              <th>Phone</th>
              <th>Date</th>
              <th>Time</th>
              <th>Guests</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reservations.map(reservation => {
              const table = tables.find(t => t.id === reservation.tableId);
              return (
                <tr key={reservation.id}>
                  <td>{table?.number}</td>
                  <td>{reservation.customerName}</td>
                  <td>{reservation.phone}</td>
                  <td>{reservation.date}</td>
                  <td>{reservation.time}</td>
                  <td>{reservation.guests}</td>
                  <td>
                    <span 
                      className="status-badge" 
                      style={{ backgroundColor: reservation.status === 'confirmed' ? '#4CAF50' : '#FF9800' }}
                    >
                      {reservation.status}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="btn btn-sm btn-danger" 
                      onClick={() => handleCancelReservation(reservation.id)}
                    >
                      Cancel
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderFloorPlan = () => (
    <div className="floor-plan-section">
      <div className="section-header">
        <h2>Floor Plan</h2>
      </div>
      
      <div className="floor-plan">
        <div className="legend">
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#4CAF50' }}></span>
            Available
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#FF5722' }}></span>
            Occupied
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#FF9800' }}></span>
            Reserved
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#9E9E9E' }}></span>
            Maintenance
          </div>
        </div>
        
        <div className="floor-grid">
          {tables.map(table => (
            <div 
              key={table.id} 
              className="floor-table"
              style={{ backgroundColor: getStatusColor(table.status) }}
              onClick={() => table.status === 'available' && handleMakeReservation(table)}
            >
              <span className="table-number">{table.number}</span>
              <span className="table-capacity">{table.capacity}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="table-management">
      <div className="table-management-header">
        <h1>Table Management System</h1>
      </div>
      
      <div className="table-management-nav">
        <button 
          className={`nav-tab ${activeTab === 'tables' ? 'active' : ''}`}
          onClick={() => setActiveTab('tables')}
        >
          Tables
        </button>
        <button 
          className={`nav-tab ${activeTab === 'reservations' ? 'active' : ''}`}
          onClick={() => setActiveTab('reservations')}
        >
          Reservations
        </button>
        <button 
          className={`nav-tab ${activeTab === 'floorplan' ? 'active' : ''}`}
          onClick={() => setActiveTab('floorplan')}
        >
          Floor Plan
        </button>
      </div>
      
      <div className="table-management-content">
        {activeTab === 'tables' && renderTables()}
        {activeTab === 'reservations' && renderReservations()}
        {activeTab === 'floorplan' && renderFloorPlan()}
      </div>

      {/* Table Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{editingTable ? 'Edit Table' : 'Add New Table'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Table Number:</label>
                <input
                  type="text"
                  name="number"
                  value={tableFormData.number}
                  onChange={handleTableInputChange}
                  placeholder="e.g., T001"
                />
              </div>
              <div className="form-group">
                <label>Capacity:</label>
                <input
                  type="number"
                  name="capacity"
                  value={tableFormData.capacity}
                  onChange={handleTableInputChange}
                  placeholder="Number of guests"
                />
              </div>
              <div className="form-group">
                <label>Location:</label>
                <input
                  type="text"
                  name="location"
                  value={tableFormData.location}
                  onChange={handleTableInputChange}
                  placeholder="e.g., Main Hall"
                />
              </div>
              <div className="form-group">
                <label>Type:</label>
                <select
                  name="type"
                  value={tableFormData.type}
                  onChange={handleTableInputChange}
                >
                  <option value="Regular">Regular</option>
                  <option value="VIP">VIP</option>
                  <option value="Outdoor">Outdoor</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSaveTable}>
                {editingTable ? 'Update' : 'Add'} Table
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reservation Modal */}
      {showReservationModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Make Reservation - {selectedTable?.number}</h3>
              <button className="close-btn" onClick={() => setShowReservationModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Customer Name:</label>
                <input
                  type="text"
                  name="customerName"
                  value={reservationFormData.customerName}
                  onChange={handleReservationInputChange}
                  placeholder="Enter customer name"
                />
              </div>
              <div className="form-group">
                <label>Phone:</label>
                <input
                  type="tel"
                  name="phone"
                  value={reservationFormData.phone}
                  onChange={handleReservationInputChange}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="form-group">
                <label>Date:</label>
                <input
                  type="date"
                  name="date"
                  value={reservationFormData.date}
                  onChange={handleReservationInputChange}
                />
              </div>
              <div className="form-group">
                <label>Time:</label>
                <input
                  type="time"
                  name="time"
                  value={reservationFormData.time}
                  onChange={handleReservationInputChange}
                />
              </div>
              <div className="form-group">
                <label>Number of Guests:</label>
                <input
                  type="number"
                  name="guests"
                  value={reservationFormData.guests}
                  onChange={handleReservationInputChange}
                  placeholder="Number of guests"
                />
              </div>
              <div className="form-group">
                <label>Notes:</label>
                <textarea
                  name="notes"
                  value={reservationFormData.notes}
                  onChange={handleReservationInputChange}
                  placeholder="Special requests or notes"
                  rows="3"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowReservationModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSaveReservation}>
                Make Reservation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableManagement;