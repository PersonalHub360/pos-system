import React, { useState } from 'react';
import './Sidebar.css';

const Sidebar = ({ onNavigate, currentView = 'pos' }) => {
  const [expandedMenu, setExpandedMenu] = useState(null);
  
  const menuItems = [
    { icon: '📊', label: 'Dashboard', active: currentView === 'dashboard', color: '#3B82F6' },
    { icon: '🏪', label: 'Pos', active: currentView === 'pos', color: '#10B981' },
    { icon: '🏬', label: 'Store Management', active: currentView === 'store management', color: '#F59E0B' },
    { icon: '💰', label: 'Sales Management', active: currentView === 'sales management', color: '#EF4444' },
    { icon: '🍽️', label: 'Table Management', active: currentView === 'table management', color: '#8B5CF6' },
    { icon: '📈', label: 'Reports', active: currentView === 'reports', color: '#06B6D4' }
  ];

  const bottomMenuItems = [
    { icon: '⚙️', label: 'Settings', active: currentView === 'settings', color: '#6B7280' }
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
              <div className="nav-color-box" style={{ backgroundColor: item.color }}></div>
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

      <div className="sidebar-bottom">
        {bottomMenuItems.map((item, index) => (
          <div key={`bottom-${index}`}>
            <div 
               className={`nav-item ${item.active ? 'active' : ''} ${item.hasSubmenu ? 'has-submenu' : ''}`}
               onClick={() => handleMenuClick(item, menuItems.length + index)}
             >
               <div className="nav-color-box" style={{ backgroundColor: item.color }}></div>
               <span className="nav-icon">{item.icon}</span>
               <span className="nav-label">{item.label}</span>
               {item.badge && <span className="nav-badge">{item.badge}</span>}
               {item.hasSubmenu && (
                 <span className={`submenu-arrow ${expandedMenu === (menuItems.length + index) ? 'expanded' : ''}`}>
                   ▼
                 </span>
               )}
             </div>
            
            {item.hasSubmenu && expandedMenu === (menuItems.length + index) && (
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
      </div>

      <div className="sidebar-footer">
        {/* Logout removed as requested */}
      </div>
    </div>
  );
};

export default Sidebar;