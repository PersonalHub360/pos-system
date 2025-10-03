import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import PrinterSettings from './PrinterSettings';
import DraftList from './DraftList';
import UserProfile from './UserProfile';
import TableManagement from './TableManagement';
import QRMenuOrders from './QRMenuOrders';
import './Header.css';

const Header = ({ onNewOrder, onRestoreDraft, onEditDraft, onReturnToCart, draftOrders, setDraftOrders, onSidebarToggle, sidebarVisible }) => {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [showPrinterSettings, setShowPrinterSettings] = useState(false);
  const [showDraftList, setShowDraftList] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showTableManagement, setShowTableManagement] = useState(false);
  const [showQRMenuOrders, setShowQRMenuOrders] = useState(false);
  const [userAvatar, setUserAvatar] = useState(null);

  // Load user avatar from localStorage
  useEffect(() => {
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      const parsedProfile = JSON.parse(savedProfile);
      setUserAvatar(parsedProfile.avatar);
    }
  }, []);

  // Listen for profile updates
  useEffect(() => {
    const handleStorageChange = () => {
      const savedProfile = localStorage.getItem('userProfile');
      if (savedProfile) {
        const parsedProfile = JSON.parse(savedProfile);
        setUserAvatar(parsedProfile.avatar);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleNewOrder = () => {
    if (onNewOrder) {
      onNewOrder();
    }
  };

  const handleQRMenuOrders = () => {
    setShowQRMenuOrders(true);
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

  const handleProfileUpdate = () => {
    // Refresh avatar when profile modal closes
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      const parsedProfile = JSON.parse(savedProfile);
      setUserAvatar(parsedProfile.avatar);
    }
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
            {userAvatar ? (
              <img src={userAvatar} alt="Profile" className="profile-avatar-icon" />
            ) : (
              '👤'
            )}
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
        onClose={() => {
          setShowUserProfile(false);
          handleProfileUpdate();
        }}
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

      {/* QR Menu Orders Modal */}
      {showQRMenuOrders && (
        <QRMenuOrders onClose={() => setShowQRMenuOrders(false)} />
      )}
    </div>
  );
};

export default Header;