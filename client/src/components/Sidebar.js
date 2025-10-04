import React, { useState } from 'react';
import './Sidebar.css';

const Sidebar = ({ onNavigate, currentView = 'pos', isVisible = true, onToggle }) => {
  const [expandedMenu, setExpandedMenu] = useState(null);
  
  const menuItems = [
      { icon: '📊', label: 'Dashboard', active: currentView === 'dashboard', color: '#3B82F6', gradient: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' },
      { icon: '🏪', label: 'Pos', active: currentView === 'pos', color: '#10B981', gradient: 'linear-gradient(135deg, #10B981, #047857)' },
      { 
        icon: '💰', 
        label: 'Sales Manage', 
        active: currentView === 'sales manage', 
        color: '#06B6D4', 
        gradient: 'linear-gradient(135deg, #06B6D4, #0891B2)'
      },
      { icon: '📦', label: 'Items', active: currentView === 'items', color: '#F59E0B', gradient: 'linear-gradient(135deg, #F59E0B, #D97706)' },
      { icon: '🛒', label: 'Purchase', active: currentView === 'purchase', color: '#8B5CF6', gradient: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' },
      { icon: '📋', label: 'Stock Information', active: currentView === 'stock information', color: '#7C3AED', gradient: 'linear-gradient(135deg, #7C3AED, #6D28D9)' },
      { icon: '💸', label: 'Expense Information', active: currentView === 'expense information', color: '#EC4899', gradient: 'linear-gradient(135deg, #EC4899, #DB2777)' },
      { icon: '👥', label: 'HRM System', active: currentView === 'hrm system', color: '#EF4444', gradient: 'linear-gradient(135deg, #EF4444, #DC2626)' },
      { icon: '💰', label: 'Payroll System', active: currentView === 'payroll system', color: '#059669', gradient: 'linear-gradient(135deg, #059669, #047857)' },
      { icon: '🍽️', label: 'Table Management', active: currentView === 'table management', color: '#DC2626', gradient: 'linear-gradient(135deg, #DC2626, #B91C1C)' },
      { icon: '📈', label: 'Reports', active: currentView === 'reports', color: '#556B2F', gradient: 'linear-gradient(135deg, #556B2F, #6B8E23)' }
    ];

    const bottomMenuItems = [
      { icon: '⚙️', label: 'Settings', active: currentView === 'settings', color: '#6B7280', gradient: 'linear-gradient(135deg, #6B7280, #4B5563)' }
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
    <div className={`sidebar ${!isVisible ? 'sidebar-hidden' : ''}`}>
      <div className="sidebar-header">
        <div className="logo">
          <div className="logo-icon-container">
            <span className="logo-icon">🍊</span>
          </div>
          <div className="logo-text-container">
            <span className="logo-text">Bond_Pos</span>
          </div>
        </div>
      </div>
      
      <div className="user-info">
        <div className="user-details">
          <div className="user-name">James Bond</div>
          <div className="user-role">Owner</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item, index) => (
          <div key={index}>
            <div 
              className={`nav-item ${item.active ? 'active' : ''} ${item.hasSubmenu ? 'has-submenu' : ''}`}
              onClick={() => handleMenuClick(item, index)}
            >
              <div 
                className="nav-color-box" 
                style={{ 
                  background: item.gradient || item.color,
                  boxShadow: item.active ? `0 0 20px ${item.color}40` : 'none'
                }}
              ></div>
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
               <div 
                 className="nav-color-box" 
                 style={{ 
                   background: item.gradient || item.color,
                   boxShadow: item.active ? `0 0 20px ${item.color}40` : 'none'
                 }}
               ></div>
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