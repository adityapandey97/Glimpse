import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { X, User, Mail, Lock, Camera, Sparkles, Smartphone, Key, Eye, EyeOff, AlertCircle } from 'lucide-react';
import axios from 'axios';

// Multicolored Google SVG Icon
const GoogleIcon = () => (
  <svg style={{ width: '18px', height: '18px', flexShrink: 0 }} viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.27-.63-.41-1.3-.41-2.09 0-.79.14-1.46.41-2.09z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
  </svg>
);

const AuthModal = ({ onClose }) => {
  const { login, register, checkAuth, showToast } = useContext(AppContext);
  const [isLogin, setIsLogin] = useState(true);

  // Auth mode: 'email' | 'mobile'
  const [authMode, setAuthMode] = useState('email');

  // Email Login fields
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Email Registration fields
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [coverImage, setCoverImage] = useState(null);

  // Mobile Auth fields
  const [mobileNumber, setMobileNumber] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  // Status
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // ─── Helper ─────────────────────────────────────────────────────────────────

  /** Extract the most descriptive error message from an axios error */
  const extractErrorMessage = (err, fallback = 'Something went wrong. Please try again.') => {
    return (
      err?.response?.data?.message ||
      err?.message ||
      fallback
    );
  };

  // ─── Login ──────────────────────────────────────────────────────────────────

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!loginId.trim()) {
      setErrorMsg('Please enter your username or email address.');
      return;
    }
    if (!loginPassword) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const res = await login(loginId.trim(), loginPassword);
      if (res.success) {
        showToast('Welcome back! Successfully logged in. 👋', 'success');
        onClose();
      } else {
        const msg = res.message || 'Login failed. Please check your credentials.';
        setErrorMsg(msg);
        showToast(msg, 'error');
      }
    } catch (err) {
      const msg = extractErrorMessage(err, 'Login failed. Please try again.');
      setErrorMsg(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // ─── Registration ────────────────────────────────────────────────────────────

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    // Client-side validation
    if (!username.trim()) { setErrorMsg('Username is required.'); return; }
    if (username.trim().length < 3) { setErrorMsg('Username must be at least 3 characters.'); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) { setErrorMsg('Username can only contain letters, numbers, and underscores.'); return; }
    if (!fullName.trim()) { setErrorMsg('Full name is required.'); return; }
    if (!email.trim()) { setErrorMsg('Email address is required.'); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) { setErrorMsg('Please enter a valid email address.'); return; }
    if (!password) { setErrorMsg('Password is required.'); return; }
    if (password.length < 6) { setErrorMsg('Password must be at least 6 characters long.'); return; }
    if (!avatar) { setErrorMsg('Profile avatar is required to create your account.'); return; }

    setLoading(true);

    const formData = new FormData();
    formData.append('username', username.trim().toLowerCase());
    formData.append('fullName', fullName.trim());
    formData.append('email', email.trim().toLowerCase());
    formData.append('password', password);
    formData.append('avatar', avatar);
    if (coverImage) {
      formData.append('coverImage', coverImage);
    }

    try {
      const res = await register(formData);
      if (res?.success) {
        // Auto-login after successful registration
        const loginRes = await login(email.trim(), password);
        if (loginRes.success) {
          showToast('🎉 Account created and logged in successfully!', 'success');
          onClose();
        } else {
          // Registration succeeded but auto-login failed — switch to login tab
          setIsLogin(true);
          setLoginId(email.trim());
          setLoginPassword('');
          setErrorMsg('Account created! Please log in with your new credentials.');
          showToast('Account created successfully! Please log in.', 'success');
        }
      } else {
        const msg = res?.message || 'Registration failed. Please try again.';
        setErrorMsg(msg);
        showToast(msg, 'error');
      }
    } catch (err) {
      const msg = extractErrorMessage(err, 'Error occurred during registration. Please try again.');
      setErrorMsg(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // ─── Mobile OTP ──────────────────────────────────────────────────────────────

  const handleMobileSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!mobileNumber.trim()) {
      setErrorMsg('Mobile number is required.');
      return;
    }

    // Validate 10-digit Indian mobile number
    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(mobileNumber.trim())) {
      setErrorMsg('Please enter a valid 10-digit mobile number (starting with 6-9).');
      return;
    }

    if (!otpSent) {
      // Phase 1: Send OTP (simulated)
      setLoading(true);
      try {
        // Simulate OTP send delay
        await new Promise((resolve) => setTimeout(resolve, 800));
        setOtpSent(true);
        showToast(`[SIMULATION] SMS sent to +91 ${mobileNumber}. Use code: 1234`, 'info');
      } catch (err) {
        setErrorMsg('Failed to send OTP. Please try again.');
        showToast('Failed to send OTP. Please try again.', 'error');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Phase 2: Verify OTP
    if (!otpCode.trim()) {
      setErrorMsg('Please enter the verification code.');
      return;
    }
    if (otpCode.trim() !== '1234') {
      setErrorMsg('Invalid verification code. (Hint: Use 1234 for simulation)');
      showToast('Invalid verification code.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('/api/v1/users/mobile-auth', {
        mobileNumber: mobileNumber.trim(),
        action: 'otp_login',
        fullName: 'Mobile User',
        username: `user_${mobileNumber.trim().slice(-4)}`
      });

      if (res.data?.success) {
        await checkAuth();
        showToast('Successfully logged in via mobile! 📱', 'success');
        onClose();
      } else {
        const msg = res.data?.message || 'Mobile OTP authentication failed. Please try again.';
        setErrorMsg(msg);
        showToast(msg, 'error');
      }
    } catch (err) {
      const msg = extractErrorMessage(err, 'Mobile authentication failed. Please try again.');
      setErrorMsg(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // ─── Google OAuth ─────────────────────────────────────────────────────────────

  const handleGoogleCredentialResponse = async (response) => {
    if (!response?.credential) {
      setErrorMsg('Google login failed: no credential received. Please try again.');
      showToast('Google login failed. Please try again.', 'error');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await axios.post('/api/v1/users/google-login', {
        credential: response.credential
      });
      if (res.data?.success) {
        await checkAuth();
        showToast('Successfully logged in with Google! 🎉', 'success');
        onClose();
      } else {
        const msg = res.data?.message || 'Google authentication failed. Please try again.';
        setErrorMsg(msg);
        showToast(msg, 'error');
      }
    } catch (err) {
      const msg = extractErrorMessage(err, 'Google token verification failed. Please try again.');
      setErrorMsg(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Initialize Google Identity Services
  useEffect(() => {
    let active = true;
    const initGoogle = () => {
      if (!active) return;
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '832742918451-abdefgh12345678.apps.googleusercontent.com',
          callback: handleGoogleCredentialResponse
        });
        const btnElem = document.getElementById('google-signin-btn');
        if (btnElem) {
          window.google.accounts.id.renderButton(btnElem, {
            theme: 'outline',
            size: 'large',
            width: 396,
            text: 'continue_with'
          });
        }
      } else {
        setTimeout(initGoogle, 100);
      }
    };
    initGoogle();
    return () => { active = false; };
  }, [isLogin, authMode]);

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (JPG, PNG, WebP, GIF).');
      e.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Avatar image must be smaller than 5MB.');
      e.target.value = '';
      return;
    }
    setAvatar(file);
    setAvatarPreview(URL.createObjectURL(file));
    setErrorMsg('');
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Cover image must be a valid image file (JPG, PNG, WebP, GIF).');
      e.target.value = '';
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Cover image must be smaller than 10MB.');
      e.target.value = '';
      return;
    }
    setCoverImage(file);
    setErrorMsg('');
  };

  const switchToLogin = () => {
    setIsLogin(true);
    setErrorMsg('');
    setOtpSent(false);
    setOtpCode('');
  };

  const switchToRegister = () => {
    setIsLogin(false);
    setErrorMsg('');
    setOtpSent(false);
    setAuthMode('email');
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

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
          maxWidth: '460px',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          position: 'relative',
          padding: '32px',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border-color)',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="btn-icon"
          style={{ position: 'absolute', top: '16px', right: '16px', color: 'var(--text-secondary)' }}
          disabled={loading}
        >
          <X size={20} />
        </button>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <span className="gradient-text" style={{ fontStyle: 'italic', fontWeight: '800', fontSize: '24px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            Glimpse <Sparkles size={16} style={{ color: 'var(--accent)' }} />
          </span>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {isLogin ? 'Sign in to access your media feed' : 'Join Glimpse and share your creations'}
          </p>
        </div>

        {/* Tab Selection */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-secondary)',
          padding: '4px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '16px',
          border: '1px solid var(--border-color)'
        }}>
          <button
            onClick={switchToLogin}
            style={{
              flexGrow: 1, padding: '10px', border: 'none',
              borderRadius: 'var(--radius-sm)',
              background: isLogin ? 'var(--bg-primary)' : 'transparent',
              color: isLogin ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: '600', cursor: 'pointer', fontSize: '14px',
              transition: 'all var(--transition-fast)'
            }}
          >
            Login
          </button>
          <button
            onClick={switchToRegister}
            style={{
              flexGrow: 1, padding: '10px', border: 'none',
              borderRadius: 'var(--radius-sm)',
              background: !isLogin ? 'var(--bg-primary)' : 'transparent',
              color: !isLogin ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: '600', cursor: 'pointer', fontSize: '14px',
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
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px'
          }}>
            <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '1px' }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Auth Mode Toggle (Login only) */}
        {isLogin && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <button
              onClick={() => {
                setAuthMode(authMode === 'email' ? 'mobile' : 'email');
                setErrorMsg('');
                setOtpSent(false);
                setOtpCode('');
              }}
              style={{
                background: 'transparent', border: 'none',
                color: 'var(--primary)', cursor: 'pointer',
                fontSize: '13px', fontWeight: '600',
                display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              {authMode === 'email' ? <Smartphone size={16} /> : <Mail size={16} />}
              <span>Use {authMode === 'email' ? 'Mobile Number & OTP' : 'Email & Username'}</span>
            </button>
          </div>
        )}

        {/* ─── Forms ─────────────────────────────────────────────────────────── */}

        {!isLogin ? (
          /* ── Registration Form ── */
          <form onSubmit={handleRegisterSubmit} style={{ maxHeight: '45vh', overflowY: 'auto', paddingRight: '4px' }}>
            <div className="form-group">
              <label className="input-label">Username <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input
                type="text"
                placeholder="e.g. honey_pandey (letters, numbers, _)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field"
                maxLength={30}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="input-label">Full Name <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input
                type="text"
                placeholder="e.g. Aditya Pandey"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input-field"
                maxLength={60}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="input-label">Email <span style={{ color: 'var(--danger)' }}>*</span></label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '40px' }}
                  required
                  disabled={loading}
                />
                <Mail size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <div className="form-group">
              <label className="input-label">Password <span style={{ color: 'var(--danger)' }}>*</span></label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '40px', paddingRight: '44px' }}
                  required
                  disabled={loading}
                />
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  style={{ position: 'absolute', right: '12px', top: '12px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
                >
                  {showRegPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {password && (
                <div style={{ marginTop: '4px', display: 'flex', gap: '4px' }}>
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      style={{
                        height: '3px', flexGrow: 1, borderRadius: '2px',
                        background: password.length >= i * 3 
                          ? (password.length < 6 ? 'var(--danger)' : password.length < 10 ? 'var(--warning)' : 'var(--success)')
                          : 'var(--border-color)'
                      }}
                    />
                  ))}
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: '4px' }}>
                    {password.length < 6 ? 'Weak' : password.length < 10 ? 'Medium' : 'Strong'}
                  </span>
                </div>
              )}
            </div>

            {/* Avatar */}
            <div className="form-group">
              <label className="input-label">Profile Avatar <span style={{ color: 'var(--danger)' }}>*</span></label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar preview"
                    style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)', flexShrink: 0 }}
                  />
                ) : (
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--bg-secondary)', border: '2px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Camera size={18} style={{ color: 'var(--text-muted)' }} />
                  </div>
                )}
                <label className="btn btn-secondary" style={{ flexGrow: 1, fontSize: '13px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
                  <Camera size={16} />
                  <span>{avatar ? 'Change Avatar' : 'Choose Avatar'}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleAvatarChange}
                    style={{ display: 'none' }}
                    disabled={loading}
                  />
                </label>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Max 5MB · JPEG, PNG, WebP, GIF
              </span>
            </div>

            {/* Cover Image */}
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="input-label">Cover Image <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>(Optional)</span></label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <label className="btn btn-secondary" style={{ flexGrow: 1, fontSize: '13px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
                  <Camera size={16} />
                  <span>{coverImage ? coverImage.name : 'Choose Cover'}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleCoverChange}
                    style={{ display: 'none' }}
                    disabled={loading}
                  />
                </label>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Max 10MB · JPEG, PNG, WebP, GIF
              </span>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }} disabled={loading}>
              {loading ? 'Creating Account...' : '🚀 Create Account'}
            </button>
          </form>

        ) : authMode === 'email' ? (
          /* ── Email Login Form ── */
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
                  disabled={loading}
                  autoComplete="username"
                />
                <User size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="input-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '40px', paddingRight: '44px' }}
                  required
                  disabled={loading}
                  autoComplete="current-password"
                />
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  style={{ position: 'absolute', right: '12px', top: '12px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
                >
                  {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

        ) : (
          /* ── Mobile OTP Login Form ── */
          <form onSubmit={handleMobileSubmit}>
            <div className="form-group">
              <label className="input-label">Mobile Number</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="tel"
                  placeholder="10-digit mobile number"
                  value={mobileNumber}
                  onChange={(e) => {
                    // Only allow digits, max 10
                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setMobileNumber(val);
                  }}
                  className="input-field"
                  style={{ paddingLeft: '40px' }}
                  maxLength={10}
                  required
                  disabled={loading || otpSent}
                />
                <Smartphone size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
              </div>
            </div>

            {otpSent && (
              <div className="form-group animate-fade" style={{ marginTop: '16px' }}>
                <label className="input-label">SMS Verification Code</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Enter 4-digit code (use 1234)"
                    value={otpCode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setOtpCode(val);
                    }}
                    className="input-field"
                    style={{ paddingLeft: '40px', letterSpacing: '4px', fontSize: '18px' }}
                    maxLength={4}
                    required
                    disabled={loading}
                    autoFocus
                  />
                  <Key size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
                </div>
                <button
                  type="button"
                  style={{ marginTop: '8px', background: 'transparent', border: 'none', color: 'var(--primary)', fontSize: '12px', cursor: 'pointer', padding: 0 }}
                  onClick={() => { setOtpSent(false); setOtpCode(''); setErrorMsg(''); }}
                >
                  ← Change mobile number
                </button>
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', marginTop: '20px' }} disabled={loading}>
              {loading
                ? 'Authenticating...'
                : otpSent
                  ? 'Verify & Continue →'
                  : 'Send Verification SMS'
              }
            </button>
          </form>
        )}

        {/* Social Auth Divider */}
        <div style={{ margin: '24px 0 12px 0', textAlign: 'center', position: 'relative' }}>
          <div style={{ borderTop: '1px solid var(--border-color)', position: 'absolute', left: 0, right: 0, top: '10px', zIndex: 1 }}></div>
          <span style={{ background: 'var(--bg-primary)', padding: '0 12px', fontSize: '11px', color: 'var(--text-muted)', position: 'relative', zIndex: 2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Or continue with
          </span>
        </div>

        {/* Google Sign-in */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
          <div id="google-signin-btn" style={{ width: '100%', minHeight: '44px', display: 'flex', justifyContent: 'center' }}></div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
