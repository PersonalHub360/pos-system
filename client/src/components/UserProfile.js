import React, { useState, useEffect } from 'react';
import authService from '../utils/auth';
import './UserProfile.css';

const UserProfile = ({ isOpen, onClose }) => {
  const [profileData, setProfileData] = useState({
    name: 'James Bond',
    role: 'Owner',
    avatar: null
  });

  // Load saved profile data from localStorage on component mount
  useEffect(() => {
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      const parsedProfile = JSON.parse(savedProfile);
      setProfileData(parsedProfile);
    }
  }, []);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newProfileData = {
          ...profileData,
          avatar: e.target.result
        };
        setProfileData(newProfileData);
        // Save to localStorage
        localStorage.setItem('userProfile', JSON.stringify(newProfileData));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      authService.logout();
      window.location.reload();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="user-profile-overlay" onClick={onClose}>
      <div className="user-profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="user-profile-header">
          <h2>User Profile</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="user-profile-content">
          <div className="profile-avatar-section">
            <div className="avatar-container">
              {profileData.avatar ? (
                <img src={profileData.avatar} alt="Profile" className="profile-avatar" />
              ) : (
                <div className="default-avatar">
                  <span>👤</span>
                </div>
              )}
              <label className="avatar-upload-btn">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: 'none' }}
                />
                📷
              </label>
            </div>
          </div>

          <div className="profile-info">
            <div className="user-name">{profileData.name}</div>
            <div className="user-role">{profileData.role}</div>
          </div>

          <div className="profile-actions">
            <button className="btn-logout" onClick={handleLogout}>
              🚪 Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;