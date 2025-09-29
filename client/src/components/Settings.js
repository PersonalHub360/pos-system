import React, { useState, useEffect } from 'react';
import './Settings.css';

const Settings = () => {
  // State management for different sections
  const [activeSection, setActiveSection] = useState('staff');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);

  // Staff Management State
  const [staff, setStaff] = useState([]);
  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'cashier',
    status: 'active',
    password: '',
    permissions: []
  });

  // Company Information State
  const [companyInfo, setCompanyInfo] = useState({
    name: 'Bond POS System',
    address: '123 Business Street, City, Country',
    phone: '+1 234 567 8900',
    email: 'info@bondpos.com',
    website: 'www.bondpos.com',
    taxId: 'TAX123456789',
    logo: ''
  });

  // Payment Methods State
  const [paymentMethods, setPaymentMethods] = useState({
    cash: { enabled: true, name: 'Cash Payment' },
    card: { enabled: true, name: 'Card Payment', processingFee: 2.5 },
    banks: [
      { id: 1, name: 'ABC Bank', accountNumber: '1234567890', enabled: true },
      { id: 2, name: 'XYZ Bank', accountNumber: '0987654321', enabled: true }
    ],
    qrCodes: [
      { id: 1, name: 'Mobile Banking QR', qrData: 'qr_code_data_1', enabled: true },
      { id: 2, name: 'Digital Wallet QR', qrData: 'qr_code_data_2', enabled: true }
    ]
  });

  // Language Settings State
  const [languageSettings, setLanguageSettings] = useState({
    currentLanguage: 'English',
    availableLanguages: ['Bengali', 'Hindi', 'English', 'Urdu', 'Khmer'],
    dateFormat: 'DD/MM/YYYY',
    currency: 'USD',
    currencySymbol: '$'
  });

  // Invoice Settings State
  const [invoiceSettings, setInvoiceSettings] = useState({
    invoicePrefix: 'INV',
    invoiceNumberStart: 1000,
    showTax: true,
    showDiscount: true,
    footerText: 'Thank you for your business!',
    termsAndConditions: 'All sales are final. No returns without receipt.',
    logoPosition: 'top-left'
  });

  // Order Settings State
  const [orderSettings, setOrderSettings] = useState({
    orderPrefix: 'ORD',
    orderNumberStart: 1000,
    autoAcceptOrders: false,
    orderTimeout: 30,
    printOrderOnCreation: true,
    requireCustomerInfo: false,
    allowPartialPayments: true
  });

  // Sample staff data
  useEffect(() => {
    const sampleStaff = [
      {
        id: 1,
        name: 'John Doe',
        email: 'john@bondpos.com',
        phone: '+1 234 567 8901',
        role: 'manager',
        status: 'active',
        permissions: ['all'],
        createdDate: '2024-01-15'
      },
      {
        id: 2,
        name: 'Jane Smith',
        email: 'jane@bondpos.com',
        phone: '+1 234 567 8902',
        role: 'cashier',
        status: 'active',
        permissions: ['pos', 'reports'],
        createdDate: '2024-01-16'
      },
      {
        id: 3,
        name: 'Mike Johnson',
        email: 'mike@bondpos.com',
        phone: '+1 234 567 8903',
        role: 'waiter',
        status: 'inactive',
        permissions: ['pos'],
        createdDate: '2024-01-17'
      }
    ];
    setStaff(sampleStaff);
  }, []);

  // Modal handlers
  const handleAddStaff = () => {
    setModalType('add-staff');
    setStaffForm({
      name: '',
      email: '',
      phone: '',
      role: 'cashier',
      status: 'active',
      password: '',
      permissions: []
    });
    setShowModal(true);
  };

  const handleEditStaff = (staffMember) => {
    setModalType('edit-staff');
    setSelectedItem(staffMember);
    setStaffForm({
      name: staffMember.name,
      email: staffMember.email,
      phone: staffMember.phone,
      role: staffMember.role,
      status: staffMember.status,
      password: '',
      permissions: staffMember.permissions
    });
    setShowModal(true);
  };

  const handleDeleteStaff = (staffMember) => {
    setModalType('delete-staff');
    setSelectedItem(staffMember);
    setShowModal(true);
  };

  // Form handlers
  const handleStaffFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      if (name === 'permissions') {
        const updatedPermissions = checked
          ? [...staffForm.permissions, value]
          : staffForm.permissions.filter(p => p !== value);
        setStaffForm(prev => ({ ...prev, permissions: updatedPermissions }));
      }
    } else {
      setStaffForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCompanyInfoChange = (e) => {
    const { name, value } = e.target;
    setCompanyInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleLanguageChange = (e) => {
    const { name, value } = e.target;
    setLanguageSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleInvoiceSettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setInvoiceSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleOrderSettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setOrderSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name.includes('Number') || name === 'orderTimeout' ? parseInt(value) : value)
    }));
  };

  // Submit handlers
  const handleSubmitStaff = () => {
    if (!staffForm.name || !staffForm.email || !staffForm.phone) {
      alert('Please fill in all required fields');
      return;
    }

    if (modalType === 'add-staff') {
      const newStaff = {
        id: Date.now(),
        ...staffForm,
        createdDate: new Date().toISOString().split('T')[0]
      };
      setStaff(prev => [...prev, newStaff]);
    } else if (modalType === 'edit-staff') {
      setStaff(prev => prev.map(s => 
        s.id === selectedItem.id ? { ...s, ...staffForm } : s
      ));
    }
    
    setShowModal(false);
    setSelectedItem(null);
  };

  const confirmDeleteStaff = () => {
    setStaff(prev => prev.filter(s => s.id !== selectedItem.id));
    setShowModal(false);
    setSelectedItem(null);
  };

  const saveCompanyInfo = () => {
    alert('Company information saved successfully!');
  };

  const saveLanguageSettings = () => {
    alert('Language settings saved successfully!');
  };

  const saveInvoiceSettings = () => {
    alert('Invoice settings saved successfully!');
  };

  const saveOrderSettings = () => {
    alert('Order settings saved successfully!');
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedItem(null);
  };

  // Role permissions mapping
  const rolePermissions = {
    manager: ['all'],
    cashier: ['pos', 'reports', 'customers'],
    waiter: ['pos', 'orders'],
    admin: ['all']
  };

  const availablePermissions = [
    'pos', 'inventory', 'reports', 'customers', 'orders', 'settings', 'staff'
  ];

  const getStatusBadgeClass = (status) => {
    return status === 'active' ? 'status-active' : 'status-inactive';
  };

  return (
    <div className="settings">
      <div className="settings-header">
        <h1>Settings</h1>
      </div>

      {/* Navigation */}
      <div className="settings-nav">
        <button 
          className={`nav-btn ${activeSection === 'staff' ? 'active' : ''}`}
          onClick={() => setActiveSection('staff')}
        >
          👥 Staff Management
        </button>
        <button 
          className={`nav-btn ${activeSection === 'company' ? 'active' : ''}`}
          onClick={() => setActiveSection('company')}
        >
          🏢 Company Info
        </button>
        <button 
          className={`nav-btn ${activeSection === 'payment' ? 'active' : ''}`}
          onClick={() => setActiveSection('payment')}
        >
          💳 Payment Methods
        </button>
        <button 
          className={`nav-btn ${activeSection === 'language' ? 'active' : ''}`}
          onClick={() => setActiveSection('language')}
        >
          🌐 Language
        </button>
        <button 
          className={`nav-btn ${activeSection === 'invoice' ? 'active' : ''}`}
          onClick={() => setActiveSection('invoice')}
        >
          📄 Invoice Settings
        </button>
        <button 
          className={`nav-btn ${activeSection === 'order' ? 'active' : ''}`}
          onClick={() => setActiveSection('order')}
        >
          📋 Order Settings
        </button>
      </div>

      {/* Staff Management Section */}
      {activeSection === 'staff' && (
        <div className="settings-section">
          <div className="section-header">
            <h2>Staff Management</h2>
            <button className="btn btn-primary" onClick={handleAddStaff}>
              + Add New Staff
            </button>
          </div>
          
          <div className="staff-list">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Permissions</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {staff.map(staffMember => (
                  <tr key={staffMember.id}>
                    <td><strong>{staffMember.name}</strong></td>
                    <td>{staffMember.email}</td>
                    <td>{staffMember.phone}</td>
                    <td><span className="role-badge">{staffMember.role}</span></td>
                    <td>
                      <span className={`status-badge ${getStatusBadgeClass(staffMember.status)}`}>
                        {staffMember.status}
                      </span>
                    </td>
                    <td>{staffMember.permissions.join(', ')}</td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn-action edit"
                          onClick={() => handleEditStaff(staffMember)}
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button 
                          className="btn-action delete"
                          onClick={() => handleDeleteStaff(staffMember)}
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

      {/* Company Information Section */}
      {activeSection === 'company' && (
        <div className="settings-section">
          <div className="section-header">
            <h2>Company Information</h2>
            <button className="btn btn-primary" onClick={saveCompanyInfo}>
              Save Changes
            </button>
          </div>
          
          <div className="company-form">
            <div className="form-grid">
              <div className="form-group">
                <label>Company Name</label>
                <input
                  type="text"
                  name="name"
                  value={companyInfo.name}
                  onChange={handleCompanyInfoChange}
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={companyInfo.email}
                  onChange={handleCompanyInfoChange}
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={companyInfo.phone}
                  onChange={handleCompanyInfoChange}
                />
              </div>
              <div className="form-group">
                <label>Website</label>
                <input
                  type="url"
                  name="website"
                  value={companyInfo.website}
                  onChange={handleCompanyInfoChange}
                />
              </div>
              <div className="form-group full-width">
                <label>Address</label>
                <textarea
                  name="address"
                  value={companyInfo.address}
                  onChange={handleCompanyInfoChange}
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Tax ID</label>
                <input
                  type="text"
                  name="taxId"
                  value={companyInfo.taxId}
                  onChange={handleCompanyInfoChange}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Methods Section */}
      {activeSection === 'payment' && (
        <div className="settings-section">
          <div className="section-header">
            <h2>Payment Methods</h2>
          </div>
          
          <div className="payment-methods">
            <div className="payment-category">
              <h3>💰 Cash Payment</h3>
              <div className="payment-item">
                <label className="switch">
                  <input type="checkbox" checked={paymentMethods.cash.enabled} readOnly />
                  <span className="slider"></span>
                </label>
                <span>Enable Cash Payments</span>
              </div>
            </div>

            <div className="payment-category">
              <h3>💳 Card Payment</h3>
              <div className="payment-item">
                <label className="switch">
                  <input type="checkbox" checked={paymentMethods.card.enabled} readOnly />
                  <span className="slider"></span>
                </label>
                <span>Enable Card Payments</span>
              </div>
              <div className="form-group">
                <label>Processing Fee (%)</label>
                <input type="number" value={paymentMethods.card.processingFee} readOnly />
              </div>
            </div>

            <div className="payment-category">
              <h3>🏦 Bank Accounts</h3>
              {paymentMethods.banks.map(bank => (
                <div key={bank.id} className="payment-item">
                  <label className="switch">
                    <input type="checkbox" checked={bank.enabled} readOnly />
                    <span className="slider"></span>
                  </label>
                  <div className="bank-info">
                    <strong>{bank.name}</strong>
                    <span>Account: {bank.accountNumber}</span>
                  </div>
                </div>
              ))}
              <button className="btn btn-secondary">+ Add Bank Account</button>
            </div>

            <div className="payment-category">
              <h3>📱 QR Code Payments</h3>
              {paymentMethods.qrCodes.map(qr => (
                <div key={qr.id} className="payment-item">
                  <label className="switch">
                    <input type="checkbox" checked={qr.enabled} readOnly />
                    <span className="slider"></span>
                  </label>
                  <div className="qr-info">
                    <strong>{qr.name}</strong>
                    <span>QR Code Available</span>
                  </div>
                </div>
              ))}
              <button className="btn btn-secondary">+ Add QR Payment</button>
            </div>
          </div>
        </div>
      )}

      {/* Language Settings Section */}
      {activeSection === 'language' && (
        <div className="settings-section">
          <div className="section-header">
            <h2>Language & Localization</h2>
            <button className="btn btn-primary" onClick={saveLanguageSettings}>
              Save Changes
            </button>
          </div>
          
          <div className="language-form">
            <div className="form-grid">
              <div className="form-group">
                <label>Current Language</label>
                <select
                  name="currentLanguage"
                  value={languageSettings.currentLanguage}
                  onChange={handleLanguageChange}
                >
                  {languageSettings.availableLanguages.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Date Format</label>
                <select
                  name="dateFormat"
                  value={languageSettings.dateFormat}
                  onChange={handleLanguageChange}
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
              <div className="form-group">
                <label>Currency</label>
                <select
                  name="currency"
                  value={languageSettings.currency}
                  onChange={handleLanguageChange}
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="BDT">BDT - Bangladeshi Taka</option>
                  <option value="INR">INR - Indian Rupee</option>
                  <option value="KHR">KHR - Cambodian Riel</option>
                </select>
              </div>
              <div className="form-group">
                <label>Currency Symbol</label>
                <input
                  type="text"
                  name="currencySymbol"
                  value={languageSettings.currencySymbol}
                  onChange={handleLanguageChange}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Settings Section */}
      {activeSection === 'invoice' && (
        <div className="settings-section">
          <div className="section-header">
            <h2>Invoice Settings</h2>
            <button className="btn btn-primary" onClick={saveInvoiceSettings}>
              Save Changes
            </button>
          </div>
          
          <div className="invoice-form">
            <div className="form-grid">
              <div className="form-group">
                <label>Invoice Prefix</label>
                <input
                  type="text"
                  name="invoicePrefix"
                  value={invoiceSettings.invoicePrefix}
                  onChange={handleInvoiceSettingsChange}
                />
              </div>
              <div className="form-group">
                <label>Starting Number</label>
                <input
                  type="number"
                  name="invoiceNumberStart"
                  value={invoiceSettings.invoiceNumberStart}
                  onChange={handleInvoiceSettingsChange}
                />
              </div>
              <div className="form-group">
                <label>Logo Position</label>
                <select
                  name="logoPosition"
                  value={invoiceSettings.logoPosition}
                  onChange={handleInvoiceSettingsChange}
                >
                  <option value="top-left">Top Left</option>
                  <option value="top-center">Top Center</option>
                  <option value="top-right">Top Right</option>
                </select>
              </div>
              <div className="form-group full-width">
                <label>Footer Text</label>
                <textarea
                  name="footerText"
                  value={invoiceSettings.footerText}
                  onChange={handleInvoiceSettingsChange}
                  rows="2"
                />
              </div>
              <div className="form-group full-width">
                <label>Terms and Conditions</label>
                <textarea
                  name="termsAndConditions"
                  value={invoiceSettings.termsAndConditions}
                  onChange={handleInvoiceSettingsChange}
                  rows="3"
                />
              </div>
            </div>
            
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="showTax"
                  checked={invoiceSettings.showTax}
                  onChange={handleInvoiceSettingsChange}
                />
                Show Tax on Invoice
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="showDiscount"
                  checked={invoiceSettings.showDiscount}
                  onChange={handleInvoiceSettingsChange}
                />
                Show Discount on Invoice
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Order Settings Section */}
      {activeSection === 'order' && (
        <div className="settings-section">
          <div className="section-header">
            <h2>Order Settings</h2>
            <button className="btn btn-primary" onClick={saveOrderSettings}>
              Save Changes
            </button>
          </div>
          
          <div className="order-form">
            <div className="form-grid">
              <div className="form-group">
                <label>Order Prefix</label>
                <input
                  type="text"
                  name="orderPrefix"
                  value={orderSettings.orderPrefix}
                  onChange={handleOrderSettingsChange}
                />
              </div>
              <div className="form-group">
                <label>Starting Number</label>
                <input
                  type="number"
                  name="orderNumberStart"
                  value={orderSettings.orderNumberStart}
                  onChange={handleOrderSettingsChange}
                />
              </div>
              <div className="form-group">
                <label>Order Timeout (minutes)</label>
                <input
                  type="number"
                  name="orderTimeout"
                  value={orderSettings.orderTimeout}
                  onChange={handleOrderSettingsChange}
                />
              </div>
            </div>
            
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="autoAcceptOrders"
                  checked={orderSettings.autoAcceptOrders}
                  onChange={handleOrderSettingsChange}
                />
                Auto Accept Orders
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="printOrderOnCreation"
                  checked={orderSettings.printOrderOnCreation}
                  onChange={handleOrderSettingsChange}
                />
                Print Order on Creation
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="requireCustomerInfo"
                  checked={orderSettings.requireCustomerInfo}
                  onChange={handleOrderSettingsChange}
                />
                Require Customer Information
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="allowPartialPayments"
                  checked={orderSettings.allowPartialPayments}
                  onChange={handleOrderSettingsChange}
                />
                Allow Partial Payments
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>
                {modalType === 'add-staff' && 'Add New Staff Member'}
                {modalType === 'edit-staff' && 'Edit Staff Member'}
                {modalType === 'delete-staff' && 'Delete Staff Member'}
              </h3>
              <button className="close-btn" onClick={closeModal}>×</button>
            </div>
            
            <div className="modal-body">
              {modalType === 'delete-staff' ? (
                <div className="delete-confirmation">
                  <p>Are you sure you want to delete <strong>{selectedItem?.name}</strong>?</p>
                  <p>This action cannot be undone.</p>
                  <div className="modal-actions">
                    <button className="btn btn-secondary" onClick={closeModal}>
                      Cancel
                    </button>
                    <button className="btn btn-danger" onClick={confirmDeleteStaff}>
                      Delete Staff
                    </button>
                  </div>
                </div>
              ) : (
                <div className="staff-form">
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Full Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={staffForm.name}
                        onChange={handleStaffFormChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Email *</label>
                      <input
                        type="email"
                        name="email"
                        value={staffForm.email}
                        onChange={handleStaffFormChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Phone *</label>
                      <input
                        type="tel"
                        name="phone"
                        value={staffForm.phone}
                        onChange={handleStaffFormChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Role</label>
                      <select
                        name="role"
                        value={staffForm.role}
                        onChange={handleStaffFormChange}
                      >
                        <option value="cashier">Cashier</option>
                        <option value="waiter">Waiter</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Status</label>
                      <select
                        name="status"
                        value={staffForm.status}
                        onChange={handleStaffFormChange}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                    {modalType === 'add-staff' && (
                      <div className="form-group">
                        <label>Password *</label>
                        <input
                          type="password"
                          name="password"
                          value={staffForm.password}
                          onChange={handleStaffFormChange}
                          required
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="permissions-section">
                    <label>Permissions</label>
                    <div className="permissions-grid">
                      {availablePermissions.map(permission => (
                        <label key={permission} className="checkbox-label">
                          <input
                            type="checkbox"
                            name="permissions"
                            value={permission}
                            checked={staffForm.permissions.includes(permission)}
                            onChange={handleStaffFormChange}
                          />
                          {permission.charAt(0).toUpperCase() + permission.slice(1)}
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div className="modal-actions">
                    <button className="btn btn-secondary" onClick={closeModal}>
                      Cancel
                    </button>
                    <button className="btn btn-primary" onClick={handleSubmitStaff}>
                      {modalType === 'add-staff' ? 'Add Staff' : 'Update Staff'}
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

export default Settings;