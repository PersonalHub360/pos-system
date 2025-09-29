import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import PrinterSettings from './PrinterSettings';
import DraftList from './DraftList';
import UserProfile from './UserProfile';
import './Header.css';

const Header = ({ searchTerm, setSearchTerm, onRestoreDraft }) => {
  const { theme, toggleTheme, isDarkMode } = useTheme();
  const [showPrinterSettings, setShowPrinterSettings] = useState(false);
  const [showDraftList, setShowDraftList] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);

  const handleNewOrder = () => {
    // Clear current order and start fresh
    if (window.confirm('Start a new order? This will clear the current cart.')) {
      window.location.reload(); // Simple way to reset everything
    }
  };

  const handleQRMenuOrders = () => {
    alert('QR Menu Orders feature coming soon!\n\nThis will show orders placed via QR code menu scanning.');
  };

  const handleDraftList = () => {
    setShowDraftList(true);
  };

  const handleTableOrder = () => {
    // Table Order Management functionality removed
  };

  const handleDarkModeToggle = () => {
    toggleTheme();
    // Show confirmation message with current theme
    const newTheme = isDarkMode ? 'light' : 'dark';
    alert(`${newTheme === 'dark' ? 'Dark' : 'Light'} mode enabled!\n\nTheme switched successfully.`);
  };

  const handleUserProfile = () => {
    setShowUserProfile(true);
  };
  return (
    <div className="header">
      <div className="header-left">
        <h1 className="page-title">Point of Sale (POS)</h1>
        <div className="breadcrumb">
          <span>Dashboard</span>
          <span className="separator">•</span>
          <span>Pos</span>
        </div>
      </div>
      
      <div className="header-center">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search in products"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>
      </div>
      
      <div className="header-right">
        <button className="header-btn primary" onClick={handleNewOrder}>
          <span>+</span>
          New
        </button>
        <button className="header-btn secondary" onClick={handleQRMenuOrders}>
          <span>📋</span>
          QR Menu Orders
        </button>
        <button className="header-btn secondary" onClick={handleDraftList}>
          <span>📄</span>
          Draft List
        </button>
        <button className="header-btn secondary" onClick={handleTableOrder}>
          <span>🍽️</span>
          Table Order
        </button>
        <button className="header-btn secondary" onClick={() => setShowPrinterSettings(true)}>
          <span>🖨️</span>
          Printer Settings
        </button>
        
        <div className="header-icons">
          <button className="icon-btn" onClick={handleDarkModeToggle} title={`Switch to ${isDarkMode ? 'Light' : 'Dark'} Mode`}>
            {isDarkMode ? '☀️' : '🌙'}
          </button>
          <button className="icon-btn" onClick={handleUserProfile} title="User Profile">
            👤
          </button>
        </div>
      </div>
      
      <PrinterSettings 
        isOpen={showPrinterSettings} 
        onClose={() => setShowPrinterSettings(false)} 
      />
      
      <DraftList 
        isOpen={showDraftList} 
        onClose={() => setShowDraftList(false)}
        onRestoreDraft={onRestoreDraft}
      />
      
      <UserProfile 
        isOpen={showUserProfile} 
        onClose={() => setShowUserProfile(false)}
      />
    </div>
  );
};

export default Header;