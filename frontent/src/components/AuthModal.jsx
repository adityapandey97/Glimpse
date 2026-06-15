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
        </button>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <span className="gradient-text" style={{ fontStyle: 'italic', fontWeight: '800', fontSize: '24px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            ChaiPlay <Sparkles size={16} style={{ color: 'var(--accent)' }} />
          </span>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {isLogin ? 'Welcome back! Log in to continue.' : 'Create an account to start sharing.'}
          </p>
        </div>

        {/* Tab Selection */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-secondary)',
          padding: '4px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '20px',
          border: '1px solid var(--border-color)'
        }}>
          <button
            onClick={() => { setIsLogin(true); setErrorMsg(''); }}
            style={{
              flexGrow: 1,
              padding: '10px',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              background: isLogin ? 'var(--bg-primary)' : 'transparent',
              color: isLogin ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '14px',
              fontFamily: 'var(--font-sans)',
              transition: 'all var(--transition-fast)'
            }}
          >
            Login
          </button>
          <button
            onClick={() => { setIsLogin(false); setErrorMsg(''); }}
            style={{
              flexGrow: 1,
              padding: '10px',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              background: !isLogin ? 'var(--bg-primary)' : 'transparent',
              color: !isLogin ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '14px',
              fontFamily: 'var(--font-sans)',
              transition: 'all var(--transition-fast)'
            }}
          >
            Register
          </button>
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: 'var(--danger)',
            padding: '12px',
            borderRadius: 'var(--radius-md)',
            fontSize: '13px',
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            {errorMsg}
          </div>
        )}

        {/* Forms */}
        {isLogin ? (
          <form onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label className="input-label">Username or Email</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Enter email or username"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '40px' }}
                  required
                />
                <User size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="input-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '40px' }}
                  required
                />
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }} disabled={loading}>
              {loading ? 'Logging in...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '4px' }}>
            <div className="form-group">
              <label className="input-label">Username</label>
              <input
                type="text"