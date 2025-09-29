import React from 'react';
import './Header.css';

const Header = ({ searchTerm, setSearchTerm }) => {
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
        <button className="header-btn primary">
          <span>+</span>
          New
        </button>
        <button className="header-btn secondary">
          <span>📋</span>
          QR Menu Orders
        </button>
        <button className="header-btn secondary">
          <span>📄</span>
          Draft List
        </button>
        <button className="header-btn secondary">
          <span>🍽️</span>
          Table Order
        </button>
        
        <div className="header-icons">
          <button className="icon-btn">🌙</button>
          <button className="icon-btn">👤</button>
        </div>
      </div>
    </div>
  );
};

export default Header;