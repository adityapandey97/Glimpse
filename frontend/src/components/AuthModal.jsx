import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { X, User, Mail, Lock, Camera, Sparkles, Smartphone, ArrowLeft, Key } from 'lucide-react';
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
  const { login, register, checkAuth } = useContext(AppContext);
  const [isLogin, setIsLogin] = useState(true);
  
  // Custom auth mode selection for login ('email' | 'mobile')
  const [authMode, setAuthMode] = useState('email');

  // Email Login/Register fields
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [coverImage, setCoverImage] = useState(null);

  // Mobile Auth fields
  const [mobileNumber, setMobileNumber] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  // Status states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Handle email login
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

  // Handle email register
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

  // Handle mobile OTP login/signup
  const handleMobileSubmit = async (e) => {
    e.preventDefault();
    if (!mobileNumber) {
      setErrorMsg('Mobile number is required');
      return;
    }

    setErrorMsg('');
    setLoading(true);

    try {
      if (!otpSent) {
        // Send simulated OTP
        setTimeout(() => {
          setOtpSent(true);
          setLoading(false);
          alert(`[SIMULATION] Verification SMS sent to +91 ${mobileNumber}. Default OTP is 1234.`);
        }, 800);
      } else {
        // Verify simulated OTP
        if (otpCode !== '1234') {
          setErrorMsg('Invalid simulated verification code (Use 1234)');
          setLoading(false);
          return;
        }
        const res = await axios.post('/api/v1/users/mobile-auth', {
          mobileNumber,
          action: 'otp_login',
          fullName: 'Mobile User',
          username: `user_${mobileNumber.slice(-4)}`
        });
        if (res.data?.success) {
          await checkAuth();
          onClose();
        } else {
          setErrorMsg(res.data?.message || 'Mobile OTP authentication failed');
        }
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Mobile authentication failed');
    } finally {
      setLoading(false);
    }
  };

  // Handle Real Google Token Verification & Login Callback
  const handleGoogleCredentialResponse = async (response) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await axios.post('/api/v1/users/google-login', {
        credential: response.credential
      });
      if (res.data?.success) {
        await checkAuth();
        onClose();
      } else {
        setErrorMsg(res.data?.message || 'Google authentication failed');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Google token verification failed');
    } finally {
      setLoading(false);
    }
  };

  // Initialize Google Identity Services script and render the button dynamically
  useEffect(() => {
    let active = true;
    const initGoogle = () => {
      if (!active) return;
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || "832742918451-abdefgh12345678.apps.googleusercontent.com",
          callback: handleGoogleCredentialResponse
        });
        const btnElem = document.getElementById("google-signin-btn");
        if (btnElem) {
          window.google.accounts.id.renderButton(
            btnElem,
            { 
              theme: "outline", 
              size: "large", 
              width: 396,
              text: "continue_with"
            }
          );
        }
      } else {
        setTimeout(initGoogle, 100);
      }
    };
    initGoogle();
    return () => {
      active = false;
    };
  }, [isLogin, authMode]);

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
      
      {/* Outer Auth Modal Container */}
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
        <button onClick={onClose} className="btn-icon" style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          color: 'var(--text-secondary)'
        }}>
          <X size={20} />
        </button>

        {/* Logo Rebranded */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <span className="gradient-text" style={{ fontStyle: 'italic', fontWeight: '800', fontSize: '24px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            Glimpse <Sparkles size={16} style={{ color: 'var(--accent)' }} />
          </span>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {isLogin ? 'Sign in to access your media feed' : 'Join Glimpse and share your creations'}
          </p>
        </div>

        {/* Tab Selection (Login / Register) */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-secondary)',
          padding: '4px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '16px',
          border: '1px solid var(--border-color)'
        }}>
          <button
            onClick={() => { setIsLogin(true); setErrorMsg(''); setOtpSent(false); }}
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
              transition: 'all var(--transition-fast)'
            }}
          >
            Login
          </button>
          <button
            onClick={() => { setIsLogin(false); setErrorMsg(''); setOtpSent(false); setAuthMode('email'); }}
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

        {/* Auth Mode Toggle for Login (Email / Mobile) */}
        {isLogin && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <button
              onClick={() => { setAuthMode(authMode === 'email' ? 'mobile' : 'email'); setErrorMsg(''); setOtpSent(false); }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--primary)',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {authMode === 'email' ? <Smartphone size={16} /> : <Mail size={16} />}
              <span>Use {authMode === 'email' ? 'Mobile Number & OTP' : 'Email & Username'}</span>
            </button>
          </div>
        )}

        {/* Forms Selector */}
        {!isLogin ? (
          /* Standard Email Registration Form */
          <form onSubmit={handleRegisterSubmit} style={{ maxHeight: '40vh', overflowY: 'auto', paddingRight: '4px' }}>
            <div className="form-group">
              <label className="input-label">Username</label>
              <input
                type="text"
                placeholder="e.g. honey_pandey"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field"
                required
              />
            </div>

            <div className="form-group">
              <label className="input-label">Full Name</label>
              <input
                type="text"
                placeholder="e.g. Aditya Pandey"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input-field"
                required
              />
            </div>

            <div className="form-group">
              <label className="input-label">Email</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '40px' }}
                  required
                />
                <Mail size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <div className="form-group">
              <label className="input-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '40px' }}
                  required
                />
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <div className="form-group">
              <label className="input-label">Profile Avatar (Required)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <label className="btn btn-secondary" style={{ flexGrow: 1, fontSize: '13px', cursor: 'pointer' }}>
                  <Camera size={16} />
                  <span>Choose Avatar</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setAvatar(e.target.files[0])}
                    style={{ display: 'none' }}
                    required
                  />
                </label>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {avatar ? avatar.name : 'No file chosen'}
                </span>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="input-label">Cover Image (Optional)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <label className="btn btn-secondary" style={{ flexGrow: 1, fontSize: '13px', cursor: 'pointer' }}>
                  <Camera size={16} />
                  <span>Choose Cover</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setCoverImage(e.target.files[0])}
                    style={{ display: 'none' }}
                  />
                </label>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {coverImage ? coverImage.name : 'No file chosen'}
                </span>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }} disabled={loading}>
              {loading ? 'Creating Account...' : 'Register'}
            </button>
          </form>
        ) : authMode === 'email' ? (
          /* Email Login Form */
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

            <div className="form-group" style={{ marginBottom: '20px' }}>
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
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        ) : (
          /* Mobile Number Login Form */
          <form onSubmit={handleMobileSubmit}>
            <div className="form-group">
              <label className="input-label">Mobile Number</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="tel"
                  placeholder="Enter 10-digit mobile number"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '40px' }}
                  required
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
                    placeholder="Enter verification code (1234)"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="input-field"
                    style={{ paddingLeft: '40px' }}
                    required
                  />
                  <Key size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
                </div>
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', marginTop: '20px' }} disabled={loading}>
              {loading ? 'Authenticating...' : otpSent ? 'Verify & Continue' : 'Send Verification SMS'}
            </button>
          </form>
        )}

        {/* Social Authentication Row */}
        <div style={{ margin: '24px 0 12px 0', textAlign: 'center', position: 'relative' }}>
          <div style={{ borderTop: '1px solid var(--border-color)', position: 'absolute', left: 0, right: 0, top: '10px', zIndex: 1 }}></div>
          <span style={{ background: 'var(--bg-primary)', padding: '0 12px', fontSize: '11px', color: 'var(--text-muted)', position: 'relative', zIndex: 2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Or continue with
          </span>
        </div>

        {/* Social Buttons Grid */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
          <div id="google-signin-btn" style={{ width: '100%', minHeight: '44px', display: 'flex', justifyContent: 'center' }}></div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;

