import React, { useState } from 'react';
import './Sidebar.css';

const Sidebar = ({ onNavigate }) => {
  const [expandedMenu, setExpandedMenu] = useState(null);
  
  const menuItems = [
    { icon: '📊', label: 'Dashboard', active: false },
    { icon: '🏪', label: 'Pos', active: true },
    { icon: '📦', label: 'Item Management', active: false },
    { icon: '🍽️', label: 'Table', active: false },
    { icon: '📈', label: 'Reports', active: false },
    { icon: '⚙️', label: 'Setting', active: false }
  ];

  const handleMenuClick = (item, index) => {
    if (item.hasSubmenu) {
      setExpandedMenu(expandedMenu === index ? null : index);
    } else {
      // Handle regular menu navigation
      if (onNavigate) {
        onNavigate(item.label.toLowerCase());
      }
    }
  };

  const handleSubmenuClick = (submenuItem) => {
    if (onNavigate) {
      onNavigate(submenuItem.key);
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <span className="logo-icon">🍊</span>
          <span className="logo-text">Bond_Pos</span>
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
          <div key={index}>
            <div 
              className={`nav-item ${item.active ? 'active' : ''} ${item.hasSubmenu ? 'has-submenu' : ''}`}
              onClick={() => handleMenuClick(item, index)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              {item.badge && <span className="nav-badge">{item.badge}</span>}
              {item.hasSubmenu && (
                <span className={`submenu-arrow ${expandedMenu === index ? 'expanded' : ''}`}>
                  ▼
                </span>
              )}
            </div>
            
            {item.hasSubmenu && expandedMenu === index && (
              <div className="submenu">
                {item.submenu.map((subItem, subIndex) => (
                  <div 
                    key={subIndex}
                    className="submenu-item"
                    onClick={() => handleSubmenuClick(subItem)}
                  >
                    <span className="submenu-icon">{subItem.icon}</span>
                    <span className="submenu-label">{subItem.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="nav-item">
          <span className="nav-icon">🚪</span>
          <span className="nav-label">Logout</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;