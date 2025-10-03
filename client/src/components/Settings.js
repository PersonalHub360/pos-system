import React, { useState, useEffect } from 'react';
import './Settings.css';

const Settings = ({ invoiceSettings = {}, setInvoiceSettings = () => {} }) => {
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

  // QR Form State
  const [qrForm, setQrForm] = useState({
    name: '',
    qrData: '',
    qrImage: null
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

  // Load company info from localStorage
  useEffect(() => {
    const savedCompanyInfo = localStorage.getItem('companyInfo');
    if (savedCompanyInfo) {
      setCompanyInfo(JSON.parse(savedCompanyInfo));
    }
  }, []);

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

  // Load payment methods from localStorage
  useEffect(() => {
    const savedPaymentMethods = localStorage.getItem('paymentMethods');
    if (savedPaymentMethods) {
      setPaymentMethods(JSON.parse(savedPaymentMethods));
    }
  }, []);

  // Save payment methods to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('paymentMethods', JSON.stringify(paymentMethods));
  }, [paymentMethods]);

  // Language Settings State
  const [languageSettings, setLanguageSettings] = useState({
    currentLanguage: 'English',
    availableLanguages: ['Bengali', 'Hindi', 'English', 'Urdu', 'Khmer'],
    dateFormat: 'DD/MM/YYYY',
    currency: 'USD',
    currencySymbol: '$'
  });

  // Load language settings from localStorage
  useEffect(() => {
    const savedLanguageSettings = localStorage.getItem('languageSettings');
    if (savedLanguageSettings) {
      setLanguageSettings(JSON.parse(savedLanguageSettings));
    }
  }, []);

  // Invoice Settings State
  // Removed local state - now using props from App.js

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

  // Printing Settings State
  const [printingSettings, setPrintingSettings] = useState({
    printerName: 'Default Printer',
    paperSize: 'A4',
    orientation: 'portrait',
    margins: {
      top: 20,
      bottom: 20,
      left: 20,
      right: 20
    },
    fontSize: 12,
    fontFamily: 'Arial',
    printLogo: true,
    printCompanyInfo: true,
    printCustomerInfo: true,
    printItemDetails: true,
    printTotals: true,
    printFooter: true,
    footerText: 'Thank you for your business!',
    autoPrint: false,
    printCopies: 1,
    thermalPrinter: false,
    thermalWidth: 80, // mm
    qrCodeSize: 'medium',
    barcodeFormat: 'CODE128'
  });

  // Load order settings from localStorage
  useEffect(() => {
    const savedOrderSettings = localStorage.getItem('orderSettings');
    if (savedOrderSettings) {
      setOrderSettings(JSON.parse(savedOrderSettings));
    }
  }, []);

  // Load printing settings from localStorage
  useEffect(() => {
    const savedPrintingSettings = localStorage.getItem('printingSettings');
    if (savedPrintingSettings) {
      setPrintingSettings(JSON.parse(savedPrintingSettings));
    }
  }, []);

  // Load staff data from localStorage or use sample data
  useEffect(() => {
    const savedStaff = localStorage.getItem('staffData');
    if (savedStaff) {
      setStaff(JSON.parse(savedStaff));
    } else {
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
      localStorage.setItem('staffData', JSON.stringify(sampleStaff));
    }
  }, []);

  // Save staff data to localStorage whenever staff changes
  useEffect(() => {
    if (staff.length > 0) {
      localStorage.setItem('staffData', JSON.stringify(staff));
    }
  }, [staff]);

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
    console.log('Settings: handleInvoiceSettingsChange called', { name, value, type, checked });
    
    if (name.startsWith('multiCurrency.')) {
      const field = name.split('.')[1];
      let fieldValue;
      if (type === 'checkbox') {
        fieldValue = checked;
      } else if (field === 'showCurrencyCount') {
        fieldValue = parseInt(value); // Ensure showCurrencyCount is always a number
      } else if (type === 'number') {
        fieldValue = parseInt(value);
      } else {
        fieldValue = value;
      }
      
      const newSettings = {
        ...invoiceSettings,
        multiCurrency: {
          ...invoiceSettings.multiCurrency,
          [field]: fieldValue
        }
      };
      console.log('Settings: Updating multiCurrency settings', newSettings);
      setInvoiceSettings(newSettings);
    } else if (name.startsWith('exchangeRate.')) {
      const rateKey = name.split('.')[1];
      const newSettings = {
        ...invoiceSettings,
        multiCurrency: {
          ...invoiceSettings.multiCurrency,
          exchangeRates: {
            ...invoiceSettings.multiCurrency.exchangeRates,
            [rateKey]: parseFloat(value) || 0
          }
        }
      };
      console.log('Settings: Updating exchange rates', newSettings);
      setInvoiceSettings(newSettings);
    } else {
      const newSettings = {
        ...invoiceSettings,
        [name]: type === 'checkbox' ? checked : value
      };
      console.log('Settings: Updating general settings', newSettings);
      setInvoiceSettings(newSettings);
    }
  };

  // Payment method handlers
  const handlePaymentMethodToggle = (type, id = null) => {
    setPaymentMethods(prev => {
      if (type === 'cash' || type === 'card') {
        return {
          ...prev,
          [type]: { ...prev[type], enabled: !prev[type].enabled }
        };
      } else if (type === 'banks') {
        return {
          ...prev,
          banks: prev.banks.map(bank => 
            bank.id === id ? { ...bank, enabled: !bank.enabled } : bank
          )
        };
      } else if (type === 'qrCodes') {
        return {
          ...prev,
          qrCodes: prev.qrCodes.map(qr => 
            qr.id === id ? { ...qr, enabled: !qr.enabled } : qr
          )
        };
      }
      return prev;
    });
  };

  const handleCardProcessingFeeChange = (e) => {
    const fee = parseFloat(e.target.value) || 0;
    setPaymentMethods(prev => ({
      ...prev,
      card: { ...prev.card, processingFee: fee }
    }));
  };

  const addBankAccount = () => {
    const name = prompt('Enter bank name:');
    const accountNumber = prompt('Enter account number:');
    if (name && accountNumber) {
      const newBank = {
        id: Date.now(),
        name,
        accountNumber,
        enabled: true
      };
      setPaymentMethods(prev => ({
        ...prev,
        banks: [...prev.banks, newBank]
      }));
    }
  };

  const addQRPayment = () => {
    setModalType('add-qr');
    setSelectedItem(null);
    setQrForm({
      name: '',
      qrData: '',
      qrImage: null
    });
    setShowModal(true);
  };

  const handleEditQR = (qr) => {
    setModalType('edit-qr');
    setSelectedItem(qr);
    setQrForm({
      name: qr.name,
      qrData: qr.qrData || '',
      qrImage: qr.qrImage || null
    });
    setShowModal(true);
  };

  const handleDeleteQR = (qrId) => {
    if (window.confirm('Are you sure you want to delete this QR payment method?')) {
      setPaymentMethods(prev => ({
        ...prev,
        qrCodes: prev.qrCodes.filter(qr => qr.id !== qrId)
      }));
    }
  };

  const handleQrFormChange = (e) => {
    const { name, value } = e.target;
    setQrForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleQrImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setQrForm(prev => ({
          ...prev,
          qrImage: event.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitQR = () => {
    if (!qrForm.name) {
      alert('Please enter a QR payment name');
      return;
    }

    if (modalType === 'add-qr') {
      const newQR = {
        id: Date.now(),
        name: qrForm.name,
        qrData: qrForm.qrData,
        qrImage: qrForm.qrImage,
        enabled: true
      };
      setPaymentMethods(prev => ({
        ...prev,
        qrCodes: [...prev.qrCodes, newQR]
      }));
    } else if (modalType === 'edit-qr') {
      setPaymentMethods(prev => ({
        ...prev,
        qrCodes: prev.qrCodes.map(qr => 
          qr.id === selectedItem.id 
            ? { ...qr, name: qrForm.name, qrData: qrForm.qrData, qrImage: qrForm.qrImage }
            : qr
        )
      }));
    }
    
    setShowModal(false);
    setSelectedItem(null);
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
    localStorage.setItem('companyInfo', JSON.stringify(companyInfo));
    alert('Company information saved successfully!');
  };

  const saveLanguageSettings = () => {
    localStorage.setItem('languageSettings', JSON.stringify(languageSettings));
    alert('Language settings saved successfully!');
  };

  const saveInvoiceSettings = () => {
    // Save to localStorage (this is now handled automatically by App.js useEffect)
    // But we can add additional validation or processing here if needed
    localStorage.setItem('invoiceSettings', JSON.stringify(invoiceSettings));
    alert('Invoice settings saved successfully!');
  };

  const saveOrderSettings = () => {
    localStorage.setItem('orderSettings', JSON.stringify(orderSettings));
    alert('Order settings saved successfully!');
  };

  const savePrintingSettings = () => {
    localStorage.setItem('printingSettings', JSON.stringify(printingSettings));
    alert('Printing settings saved successfully!');
  };

  const handlePrintingSettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setPrintingSettings(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value)
        }
      }));
    } else {
      setPrintingSettings(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value)
      }));
    }
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
          className={`nav-btn ${activeSection === 'printing' ? 'active' : ''}`}
          onClick={() => setActiveSection('printing')}
        >
          🖨️ Printing Settings
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
                  <input 
                    type="checkbox" 
                    checked={paymentMethods.cash.enabled} 
                    onChange={() => handlePaymentMethodToggle('cash')}
                  />
                  <span className="slider"></span>
                </label>
                <span>Enable Cash Payments</span>
              </div>
            </div>

            <div className="payment-category">
              <h3>💳 Card Payment</h3>
              <div className="payment-item">
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={paymentMethods.card.enabled} 
                    onChange={() => handlePaymentMethodToggle('card')}
                  />
                  <span className="slider"></span>
                </label>
                <span>Enable Card Payments</span>
              </div>
              <div className="form-group">
                <label>Processing Fee (%)</label>
                <input 
                  type="number" 
                  value={paymentMethods.card.processingFee} 
                  onChange={handleCardProcessingFeeChange}
                  step="0.1"
                  min="0"
                />
              </div>
            </div>

            <div className="payment-category">
              <h3>🏦 Bank Accounts</h3>
              {paymentMethods.banks.map(bank => (
                <div key={bank.id} className="payment-item">
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={bank.enabled} 
                      onChange={() => handlePaymentMethodToggle('banks', bank.id)}
                    />
                    <span className="slider"></span>
                  </label>
                  <div className="bank-info">
                    <strong>{bank.name}</strong>
                    <span>Account: {bank.accountNumber}</span>
                  </div>
                </div>
              ))}
              <button className="btn btn-secondary" onClick={addBankAccount}>+ Add Bank Account</button>
            </div>

            <div className="payment-category">
              <h3>📱 QR Code Payments</h3>
              {paymentMethods.qrCodes.map(qr => (
                <div key={qr.id} className="payment-item qr-payment-item">
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={qr.enabled} 
                      onChange={() => handlePaymentMethodToggle('qrCodes', qr.id)}
                    />
                    <span className="slider"></span>
                  </label>
                  <div className="qr-info">
                    <div className="qr-details">
                      <strong>{qr.name}</strong>
                      <span>QR Code Available</span>
                    </div>
                    {qr.qrImage && (
                      <div className="qr-preview">
                        <img src={qr.qrImage} alt={`${qr.name} QR Code`} className="qr-image" />
                      </div>
                    )}
                  </div>
                  <div className="qr-actions">
                    <button 
                      className="btn btn-sm btn-secondary" 
                      onClick={() => handleEditQR(qr)}
                    >
                      Edit
                    </button>
                    <button 
                      className="btn btn-sm btn-danger" 
                      onClick={() => handleDeleteQR(qr.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              <button className="btn btn-secondary" onClick={addQRPayment}>+ Add QR Payment</button>
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
                  value={invoiceSettings?.invoicePrefix || 'INV'}
                  onChange={handleInvoiceSettingsChange}
                />
              </div>
              <div className="form-group">
                <label>Starting Number</label>
                <input
                  type="number"
                  name="invoiceNumberStart"
                  value={invoiceSettings?.invoiceNumberStart || 1000}
                  onChange={handleInvoiceSettingsChange}
                />
              </div>
              <div className="form-group">
                <label>Logo Position</label>
                <select
                  name="logoPosition"
                  value={invoiceSettings?.logoPosition || 'top-left'}
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
                  value={invoiceSettings?.footerText || 'Thank you for your business!'}
                  onChange={handleInvoiceSettingsChange}
                  rows="2"
                />
              </div>
              <div className="form-group full-width">
                <label>Terms and Conditions</label>
                <textarea
                  name="termsAndConditions"
                  value={invoiceSettings?.termsAndConditions || 'All sales are final. No returns without receipt.'}
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
                  checked={invoiceSettings?.showTax || false}
                  onChange={handleInvoiceSettingsChange}
                />
                Show Tax on Invoice
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="showDiscount"
                  checked={invoiceSettings?.showDiscount || false}
                  onChange={handleInvoiceSettingsChange}
                />
                Show Discount on Invoice
              </label>
            </div>

            {/* Multi-Currency Settings */}
            <div className="multi-currency-section">
              <h3>💱 Multi-Currency Receipt Settings</h3>
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="multiCurrency.enabled"
                    checked={invoiceSettings?.multiCurrency?.enabled || false}
                    onChange={handleInvoiceSettingsChange}
                  />
                  Enable Multi-Currency Display on Receipts
                </label>
              </div>

              {invoiceSettings?.multiCurrency?.enabled && (
                <div className="multi-currency-config">
                  <div className="form-group">
                    <label>Number of Currencies to Display</label>
                    <select
                      name="multiCurrency.showCurrencyCount"
                      value={invoiceSettings?.multiCurrency?.showCurrencyCount || 1}
                      onChange={handleInvoiceSettingsChange}
                    >
                      <option value={1}>1 Currency (Primary Only)</option>
                      <option value={2}>2 Currencies</option>
                      <option value={3}>3 Currencies</option>
                    </select>
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label>Primary Currency</label>
                      <select
                        name="multiCurrency.primaryCurrency"
                        value={invoiceSettings?.multiCurrency?.primaryCurrency || 'USD'}
                        onChange={handleInvoiceSettingsChange}
                      >
                        <option value="USD">USD - US Dollar</option>
                        <option value="KHR">KHR - Cambodian Riel</option>
                        <option value="EUR">EUR - Euro</option>
                        <option value="BDT">BDT - Bangladeshi Taka</option>
                        <option value="INR">INR - Indian Rupee</option>
                      </select>
                    </div>

                    {invoiceSettings?.multiCurrency?.showCurrencyCount >= 2 && (
                      <div className="form-group">
                        <label>Secondary Currency</label>
                        <select
                          name="multiCurrency.secondaryCurrency"
                          value={invoiceSettings?.multiCurrency?.secondaryCurrency || 'KHR'}
                          onChange={handleInvoiceSettingsChange}
                        >
                          <option value="KHR">KHR - Cambodian Riel</option>
                          <option value="USD">USD - US Dollar</option>
                          <option value="EUR">EUR - Euro</option>
                          <option value="BDT">BDT - Bangladeshi Taka</option>
                          <option value="INR">INR - Indian Rupee</option>
                        </select>
                      </div>
                    )}

                    {invoiceSettings?.multiCurrency?.showCurrencyCount >= 3 && (
                      <div className="form-group">
                        <label>Tertiary Currency</label>
                        <select
                          name="multiCurrency.tertiaryCurrency"
                          value={invoiceSettings?.multiCurrency?.tertiaryCurrency || ''}
                          onChange={handleInvoiceSettingsChange}
                        >
                          <option value="">Select Currency</option>
                          <option value="EUR">EUR - Euro</option>
                          <option value="BDT">BDT - Bangladeshi Taka</option>
                          <option value="INR">INR - Indian Rupee</option>
                          <option value="USD">USD - US Dollar</option>
                          <option value="KHR">KHR - Cambodian Riel</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Exchange Rate Settings */}
                  <div className="exchange-rates-section">
                    <h4>Exchange Rates (Base: {invoiceSettings?.multiCurrency?.primaryCurrency || 'USD'})</h4>
                    <div className="form-grid">
                      {(invoiceSettings?.multiCurrency?.showCurrencyCount || 1) >= 2 && 
                       (invoiceSettings?.multiCurrency?.secondaryCurrency || 'KHR') !== (invoiceSettings?.multiCurrency?.primaryCurrency || 'USD') && (
                        <div className="form-group">
                          <label>
                            1 {invoiceSettings?.multiCurrency?.primaryCurrency || 'USD'} = ? {invoiceSettings?.multiCurrency?.secondaryCurrency || 'KHR'}
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            name={`exchangeRate.${invoiceSettings?.multiCurrency?.primaryCurrency || 'USD'}_TO_${invoiceSettings?.multiCurrency?.secondaryCurrency || 'KHR'}`}
                            value={invoiceSettings?.multiCurrency?.exchangeRates?.[`${invoiceSettings?.multiCurrency?.primaryCurrency || 'USD'}_TO_${invoiceSettings?.multiCurrency?.secondaryCurrency || 'KHR'}`] || ''}
                            onChange={handleInvoiceSettingsChange}
                            placeholder="Enter exchange rate"
                          />
                        </div>
                      )}

                      {(invoiceSettings?.multiCurrency?.showCurrencyCount || 1) >= 3 && 
                       (invoiceSettings?.multiCurrency?.tertiaryCurrency || '') && 
                       (invoiceSettings?.multiCurrency?.tertiaryCurrency || '') !== (invoiceSettings?.multiCurrency?.primaryCurrency || 'USD') && (
                        <div className="form-group">
                          <label>
                            1 {invoiceSettings?.multiCurrency?.primaryCurrency || 'USD'} = ? {invoiceSettings?.multiCurrency?.tertiaryCurrency || ''}
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            name={`exchangeRate.${invoiceSettings?.multiCurrency?.primaryCurrency || 'USD'}_TO_${invoiceSettings?.multiCurrency?.tertiaryCurrency || ''}`}
                            value={invoiceSettings?.multiCurrency?.exchangeRates?.[`${invoiceSettings?.multiCurrency?.primaryCurrency || 'USD'}_TO_${invoiceSettings?.multiCurrency?.tertiaryCurrency || ''}`] || ''}
                            onChange={handleInvoiceSettingsChange}
                            placeholder="Enter exchange rate"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
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

      {/* Printing Settings Section */}
      {activeSection === 'printing' && (
        <div className="settings-section">
          <div className="section-header">
            <h2>Printing Settings</h2>
            <button className="btn btn-primary" onClick={savePrintingSettings}>
              Save Changes
            </button>
          </div>
          
          <div className="printing-form">
            <div className="form-grid">
              <div className="form-group">
                <label>Printer Name</label>
                <input
                  type="text"
                  name="printerName"
                  value={printingSettings.printerName}
                  onChange={handlePrintingSettingsChange}
                  placeholder="Enter printer name"
                />
              </div>
              <div className="form-group">
                <label>Paper Size</label>
                <select
                  name="paperSize"
                  value={printingSettings.paperSize}
                  onChange={handlePrintingSettingsChange}
                >
                  <option value="A4">A4</option>
                  <option value="A5">A5</option>
                  <option value="Letter">Letter</option>
                  <option value="Receipt">Receipt (80mm)</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>
              <div className="form-group">
                <label>Print Quality</label>
                <select
                  name="printQuality"
                  value={printingSettings.printQuality}
                  onChange={handlePrintingSettingsChange}
                >
                  <option value="draft">Draft</option>
                  <option value="normal">Normal</option>
                  <option value="high">High Quality</option>
                </select>
              </div>
            </div>

            <div className="form-section">
              <h3>Margins (mm)</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Top</label>
                  <input
                    type="number"
                    name="margins.top"
                    value={printingSettings.margins.top}
                    onChange={handlePrintingSettingsChange}
                    min="0"
                    step="0.1"
                  />
                </div>
                <div className="form-group">
                  <label>Bottom</label>
                  <input
                    type="number"
                    name="margins.bottom"
                    value={printingSettings.margins.bottom}
                    onChange={handlePrintingSettingsChange}
                    min="0"
                    step="0.1"
                  />
                </div>
                <div className="form-group">
                  <label>Left</label>
                  <input
                    type="number"
                    name="margins.left"
                    value={printingSettings.margins.left}
                    onChange={handlePrintingSettingsChange}
                    min="0"
                    step="0.1"
                  />
                </div>
                <div className="form-group">
                  <label>Right</label>
                  <input
                    type="number"
                    name="margins.right"
                    value={printingSettings.margins.right}
                    onChange={handlePrintingSettingsChange}
                    min="0"
                    step="0.1"
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Font Settings</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Font Family</label>
                  <select
                    name="font.family"
                    value={printingSettings.font.family}
                    onChange={handlePrintingSettingsChange}
                  >
                    <option value="Arial">Arial</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Helvetica">Helvetica</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Font Size (pt)</label>
                  <input
                    type="number"
                    name="font.size"
                    value={printingSettings.font.size}
                    onChange={handlePrintingSettingsChange}
                    min="8"
                    max="72"
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Print Options</h3>
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="autoPrint"
                    checked={printingSettings.autoPrint}
                    onChange={handlePrintingSettingsChange}
                  />
                  Auto Print Invoices
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="printLogo"
                    checked={printingSettings.printLogo}
                    onChange={handlePrintingSettingsChange}
                  />
                  Print Company Logo
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="printBarcode"
                    checked={printingSettings.printBarcode}
                    onChange={handlePrintingSettingsChange}
                  />
                  Print Barcode/QR Code
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="printCustomerInfo"
                    checked={printingSettings.printCustomerInfo}
                    onChange={handlePrintingSettingsChange}
                  />
                  Print Customer Information
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="printItemDetails"
                    checked={printingSettings.printItemDetails}
                    onChange={handlePrintingSettingsChange}
                  />
                  Print Detailed Item Information
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="printFooterMessage"
                    checked={printingSettings.printFooterMessage}
                    onChange={handlePrintingSettingsChange}
                  />
                  Print Footer Message
                </label>
              </div>
            </div>

            <div className="form-section">
              <h3>Copies</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Number of Copies</label>
                  <input
                    type="number"
                    name="copies"
                    value={printingSettings.copies}
                    onChange={handlePrintingSettingsChange}
                    min="1"
                    max="10"
                  />
                </div>
              </div>
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
                {modalType === 'add-qr' && 'Add QR Payment Method'}
                {modalType === 'edit-qr' && 'Edit QR Payment Method'}
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
              ) : modalType === 'add-qr' || modalType === 'edit-qr' ? (
                <div className="qr-form">
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Payment Method Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={qrForm.name}
                        onChange={handleQrFormChange}
                        placeholder="e.g., Mobile Banking, Digital Wallet"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>QR Code Data</label>
                      <textarea
                        name="qrData"
                        value={qrForm.qrData}
                        onChange={handleQrFormChange}
                        placeholder="Enter QR code data or payment information"
                        rows="3"
                      />
                    </div>
                  </div>
                  
                  <div className="form-section">
                    <h4>QR Code Image</h4>
                    <div className="qr-upload-section">
                      <input
                        type="file"
                        id="qr-image-upload"
                        accept="image/*"
                        onChange={handleQrImageUpload}
                        style={{ display: 'none' }}
                      />
                      <label htmlFor="qr-image-upload" className="btn btn-secondary upload-btn">
                        📁 Upload QR Code Image
                      </label>
                      
                      {qrForm.qrImage && (
                        <div className="qr-preview-container">
                          <img 
                            src={qrForm.qrImage} 
                            alt="QR Code Preview" 
                            className="qr-preview-image"
                          />
                          <button 
                            type="button" 
                            className="btn btn-sm btn-danger remove-image-btn"
                            onClick={() => setQrForm(prev => ({ ...prev, qrImage: null }))}
                          >
                            Remove Image
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="modal-actions">
                    <button className="btn btn-secondary" onClick={closeModal}>
                      Cancel
                    </button>
                    <button className="btn btn-primary" onClick={handleSubmitQR}>
                      {modalType === 'add-qr' ? 'Add QR Payment' : 'Update QR Payment'}
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