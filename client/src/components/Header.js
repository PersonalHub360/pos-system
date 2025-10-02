import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import PrinterSettings from './PrinterSettings';
import DraftList from './DraftList';
import UserProfile from './UserProfile';
import TableManagement from './TableManagement';
import './Header.css';

const Header = ({ onNewOrder, onRestoreDraft, onEditDraft, onReturnToCart, draftOrders, setDraftOrders, onSidebarToggle, sidebarVisible }) => {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [showPrinterSettings, setShowPrinterSettings] = useState(false);
  const [showDraftList, setShowDraftList] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showTableManagement, setShowTableManagement] = useState(false);

  const handleNewOrder = () => {
    if (onNewOrder) {
      onNewOrder();
    }
  };

  const handleQRMenuOrders = () => {
    // QR Menu Orders functionality
    console.log('QR Menu Orders clicked');
  };

  const handleDraftList = () => {
    setShowDraftList(true);
  };

  const handleTableOrder = () => {
    setShowTableManagement(true);
  };

  const handleDarkModeToggle = () => {
    toggleDarkMode();
  };

  const handleUserProfile = () => {
    setShowUserProfile(true);
  };
  return (
    <div className="header">
      <div className="header-left">
        <button className="icon-btn sidebar-toggle" onClick={onSidebarToggle} title={sidebarVisible ? 'Hide Sidebar' : 'Show Sidebar'}>
          {sidebarVisible ? '✕' : '☰'}
        </button>
        <h1 className="page-title">Point of Sale (POS)</h1>
        <div className="breadcrumb">
          <span>Dashboard</span>
          <span className="separator">•</span>
          <span>Pos</span>
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
          Draft List ({draftOrders.length})
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
        onEditDraft={onEditDraft}
        onReturnToCart={onReturnToCart}
        draftOrders={draftOrders}
        setDraftOrders={setDraftOrders}
      />
      
      <UserProfile 
        isOpen={showUserProfile} 
        onClose={() => setShowUserProfile(false)}
      />
      
      {/* Table Management Modal */}
      {showTableManagement && (
        <div className="modal-overlay" onClick={() => setShowTableManagement(false)}>
          <div className="modal-content table-management-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Table Management</h2>
              <button className="close-btn" onClick={() => setShowTableManagement(false)}>×</button>
            </div>
            <div className="modal-body">
              <TableManagement />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Header;