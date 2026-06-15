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