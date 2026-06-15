import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { X, User, Mail, Lock, Camera, Sparkles } from 'lucide-react';

/* Modified by Antigravity: Premium Glassmorphic Auth Modal (Login/Register) */
const AuthModal = ({ onClose }) => {
  const { login, register, checkAuth } = useContext(AppContext);
  const [isLogin, setIsLogin] = useState(true);
  
  // Login fields
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register fields
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  
  // Status states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginId || !loginPassword) {
      setErrorMsg('All fields are required');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await login(loginId, loginPassword);
      if (res.success) {
        onClose();
      } else {
        setErrorMsg(res.message);
      }
    } catch (err) {
      setErrorMsg('Invalid login credentials or server error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!username || !fullName || !email || !password || !avatar) {
      setErrorMsg('All fields are required (avatar is mandatory)');
      return;
    }
    setErrorMsg('');
    setLoading(true);

    const formData = new FormData();
    formData.append('username', username);
    formData.append('fullName', fullName);
    formData.append('email', email);
    formData.append('password', password);
    formData.append('avatar', avatar);
    if (coverImage) {
      formData.append('coverImage', coverImage);
    }

    try {
      const res = await register(formData);
      if (res?.success) {
        // Automatically log them in or switch to login
        const loginRes = await login(email, password);
        if (loginRes.success) {
          onClose();
        } else {
          setIsLogin(true);
          setErrorMsg('Registration successful! Please log in.');
        }
      } else {
        setErrorMsg(res?.message || 'Registration failed');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 200,
      padding: '16px',
      backdropFilter: 'blur(4px)'
    }}>
      <div 
        className="glass-panel animate-scale" 
        style={{
          width: '100%',
          maxWidth: '440px',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          position: 'relative',
          padding: '32px',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border-color)'
        }}
      >
        {/* Close Button */}
        <button onClick={onClose} className="btn-icon" style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          color: 'var(--text-secondary)'
        }}>
          <X size={20} />