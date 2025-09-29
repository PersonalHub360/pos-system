import React from 'react';
import './Sidebar.css';

const Sidebar = () => {
  const menuItems = [
    { icon: '📊', label: 'Dashboard', active: false },
    { icon: '🏪', label: 'Pos', active: true },
    { icon: '🍽️', label: 'Table', active: false },
    { icon: '📋', label: 'Reservations', active: false },
    { icon: '🚚', label: 'Delivery Executive', active: false },
    { icon: '💳', label: 'Payments', active: false, badge: 'New' },
    { icon: '👤', label: 'Customer', active: false },
    { icon: '📄', label: 'Invoice', active: false },
    { icon: '🏢', label: 'Back Office', active: false },
    { icon: '⭐', label: 'Testimonial', active: false },
    { icon: '👥', label: 'User', active: false },
    { icon: '📈', label: 'Reports', active: false },
    { icon: '⚙️', label: 'Setting', active: false }
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <span className="logo-icon">🍊</span>
          <span className="logo-text">RestroBit</span>
        </div>
      </div>
      
      <div className="user-info">
        <div className="user-avatar">
          <img src="/api/placeholder/40/40" alt="User" />
        </div>
        <div className="user-details">
          <div className="user-name">Nahid Zaman</div>
          <div className="user-role">Product Designer</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item, index) => (
          <div 
            key={index} 
            className={`nav-item ${item.active ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
            {item.badge && <span className="nav-badge">{item.badge}</span>}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="nav-item">
          <span className="nav-icon">🚪</span>
          <span className="nav-label">Login</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;