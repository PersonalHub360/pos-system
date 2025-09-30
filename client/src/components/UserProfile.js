import React, { useState, useEffect } from 'react';
import PasswordChange from './PasswordChange';
import './UserProfile.css';

const UserProfile = ({ isOpen, onClose }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [profileData, setProfileData] = useState({
    name: 'James Bond',
    role: 'Owner',
    email: 'james.bond@restrobit.com',
    phone: '+1 (555) 123-4567',
    department: 'Management',
    joinDate: '2023-01-15',
    avatar: null
  });

  const [editData, setEditData] = useState({ ...profileData });

  // Load saved profile data from localStorage on component mount
  useEffect(() => {
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      const parsedProfile = JSON.parse(savedProfile);
      setProfileData(parsedProfile);
      setEditData(parsedProfile);
    }
  }, []);

  // Check for unsaved changes
  useEffect(() => {
    const hasChanges = JSON.stringify(editData) !== JSON.stringify(profileData);
    setHasUnsavedChanges(hasChanges);
  }, [editData, profileData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setEditData(prev => ({
          ...prev,
          avatar: e.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    // Save to localStorage for persistence
    localStorage.setItem('userProfile', JSON.stringify(editData));
    setProfileData({ ...editData });
    setIsEditing(false);
    setHasUnsavedChanges(false);
    
    // Show success message
    alert('Profile updated successfully!');
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      const confirmCancel = window.confirm('You have unsaved changes. Are you sure you want to cancel?');
      if (!confirmCancel) return;
    }
    setEditData({ ...profileData });
    setIsEditing(false);
    setHasUnsavedChanges(false);
  };

  const handlePasswordChange = () => {
    setShowPasswordChange(true);
  };

  const handlePasswordChangeClose = () => {
    setShowPasswordChange(false);
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      // Handle logout logic here
      console.log('User logged out');
      onClose();
    }
  };

  const handleChangePassword = () => {
    alert('Password change functionality would be implemented here.\n\nThis would typically open a secure password change form.');
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
              {editData.avatar ? (
                <img src={editData.avatar} alt="Profile" className="profile-avatar" />
              ) : (
                <div className="default-avatar">
                  <span>👤</span>
                </div>
              )}
              {isEditing && (
                <label className="avatar-upload-btn">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    style={{ display: 'none' }}
                  />
                  📷
                </label>
              )}
            </div>
          </div>

          <div className="profile-form">
            <div className="form-group">
              <label>Full Name</label>
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={editData.name}
                  onChange={handleInputChange}
                  className="form-input"
                />
              ) : (
                <div className="form-value">{profileData.name}</div>
              )}
            </div>

            <div className="form-group">
              <label>Role</label>
              {isEditing ? (
                <input
                  type="text"
                  name="role"
                  value={editData.role}
                  onChange={handleInputChange}
                  className="form-input"
                />
              ) : (
                <div className="form-value">{profileData.role}</div>
              )}
            </div>

            <div className="form-group">
              <label>Email</label>
              {isEditing ? (
                <input
                  type="email"
                  name="email"
                  value={editData.email}
                  onChange={handleInputChange}
                  className="form-input"
                />
              ) : (
                <div className="form-value">{profileData.email}</div>
              )}
            </div>

            <div className="form-group">
              <label>Phone</label>
              {isEditing ? (
                <input
                  type="tel"
                  name="phone"
                  value={editData.phone}
                  onChange={handleInputChange}
                  className="form-input"
                />
              ) : (
                <div className="form-value">{profileData.phone}</div>
              )}
            </div>

            <div className="form-group">
              <label>Department</label>
              {isEditing ? (
                <select
                  name="department"
                  value={editData.department}
                  onChange={handleInputChange}
                  className="form-input"
                >
                  <option value="Design Team">Design Team</option>
                  <option value="Development Team">Development Team</option>
                  <option value="Management">Management</option>
                  <option value="Sales Team">Sales Team</option>
                  <option value="Support Team">Support Team</option>
                </select>
              ) : (
                <div className="form-value">{profileData.department}</div>
              )}
            </div>

            <div className="form-group">
              <label>Join Date</label>
              <div className="form-value">{new Date(profileData.joinDate).toLocaleDateString()}</div>
            </div>
          </div>

          <div className="profile-actions">
            {isEditing ? (
              <>
                <button 
                  className="btn-save" 
                  onClick={handleSave}
                  disabled={!hasUnsavedChanges}
                >
                  💾 Save Changes
                </button>
                <button className="btn-cancel" onClick={handleCancel}>
                  ❌ Cancel
                </button>
              </>
            ) : (
              <>
                <button className="btn-edit" onClick={() => setIsEditing(true)}>
                  ✏️ Edit Profile
                </button>
                <button className="btn-password" onClick={handlePasswordChange}>
                  🔒 Change Password
                </button>
                <button className="btn-logout" onClick={handleLogout}>
                  🚪 Logout
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordChange && (
        <PasswordChange 
          isOpen={showPasswordChange} 
          onClose={handlePasswordChangeClose} 
        />
      )}
    </div>
  );
};

export default UserProfile;