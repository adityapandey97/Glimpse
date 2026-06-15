import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import { Settings, User, Key, Camera, Check, ShieldAlert } from 'lucide-react';

/* Modified by Antigravity: Settings & Profile Management Page */
const SettingsView = () => {
  const { user, checkAuth } = useContext(AppContext);

  // Profile fields
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  
  // Password fields
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Files
  const [avatarFile, setAvatarFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);

  // States
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [coverLoading, setCoverLoading] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) return;
    try {
      setProfileLoading(true);
      const res = await axios.patch('/api/v1/users/update-account-details', {
        fullName,
        email
      });
      if (res.data?.success) {
        alert('Account details updated successfully!');
        checkAuth();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update account details');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) return;
    if (newPassword !== confirmPassword) {
      alert("New passwords do not match!");
      return;
    }
    try {
      setPasswordLoading(true);
      const res = await axios.post('/api/v1/users/change-password', {
        oldPassword,
        newPassword
      });
      if (res.data?.success) {
        alert('Password updated successfully!');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleUpdateAvatar = async (e) => {
    e.preventDefault();
    if (!avatarFile) return;
    const formData = new FormData();
    formData.append('avatar', avatarFile);

    try {
      setAvatarLoading(true);
      const res = await axios.patch('/api/v1/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.success) {
        alert('Avatar updated successfully!');
        setAvatarFile(null);
        checkAuth();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to upload avatar');
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleUpdateCover = async (e) => {
    e.preventDefault();
    if (!coverFile) return;
    const formData = new FormData();
    formData.append('coverImage', coverFile);

    try {
      setCoverLoading(true);
      const res = await axios.patch('/api/v1/users/cover-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.success) {
        alert('Cover image updated successfully!');
        setCoverFile(null);
        checkAuth();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to upload cover image');
    } finally {
      setCoverLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    /* Modified by Antigravity: User account deletion double-verification */
    if (!window.confirm("Are you sure you want to delete your account permanently? This action cannot be undone and will delete all your uploads, comments, playlists, and tweets.")) {
      return;
    }
    
    // Double confirmation
    const confirmUsername = window.prompt(`Please type your username "${user.username}" to confirm deletion:`);
    if (!confirmUsername || confirmUsername.toLowerCase() !== user.username.toLowerCase()) {
      alert("Username confirmation failed. Account deletion cancelled.");
      return;
    }

    try {
      const res = await axios.delete('/api/v1/users/delete-account');
      if (res.data?.success) {
        alert("Your account and all associated data have been permanently deleted.");
        window.location.reload();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete account');
    }
  };

  if (!user) {
    return (
      <div style={{ padding: '40px 24px', textAlign: 'center', flexGrow: 1 }}>
        <h3>Please sign in to view settings.</h3>
      </div>
    );
  }

  return (
    <div style={{ flexGrow: 1, padding: '24px', overflowY: 'auto', maxWidth: '800px', margin: '0 auto', width: '100%' }} className="animate-fade">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
        <Settings size={24} style={{ color: 'var(--primary)' }} />
        <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
          Account Settings
        </h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Row 1: Profile Details & Password */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px'
        }}>
          {/* Profile Details Form */}
          <form onSubmit={handleUpdateProfile} className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={16} />
              <span>Personal Info</span>
            </h3>
            
            <div className="form-group">
              <label className="input-label">Username (Read-only)</label>
              <input type="text" value={user.username} className="input-field" disabled style={{ opacity: 0.6 }} />
            </div>
            
            <div className="form-group">
              <label className="input-label">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input-field"
                required
              />
            </div>
            
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="input-label">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={profileLoading}>
              {profileLoading ? 'Saving...' : 'Save Profile Details'}
            </button>
          </form>

          {/* Change Password Form */}
          <form onSubmit={handleUpdatePassword} className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Key size={16} />
              <span>Change Password</span>
            </h3>

            <div className="form-group">
              <label className="input-label">Current Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="input-field"
                required
              />
            </div>

            <div className="form-group">
              <label className="input-label">New Password</label>
              <input
                type="password"
                placeholder="Min 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input-field"
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="input-label">Confirm New Password</label>
              <input
                type="password"
                placeholder="Re-type new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-field"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={passwordLoading}>
              {passwordLoading ? 'Updating...' : 'Change Password'}
            </button>
          </form>
        </div>

        {/* Row 2: Media Assets Updates */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px'
        }}>
          {/* Avatar Form */}