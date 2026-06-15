import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { Search, Sun, Moon, Upload, LogOut, Menu, User, Sparkles } from 'lucide-react';

/* Modified by Antigravity: Premium Glassmorphic Top Navbar */
const Navbar = ({ onOpenAuth, onOpenUpload, onToggleSidebar }) => {
  const { user, logout, theme, toggleTheme, searchQuery, setSearchQuery, setActiveTab } = useContext(AppContext);
  const [localSearch, setLocalSearch] = useState(searchQuery);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchQuery(localSearch);
    setActiveTab('home');
  };

  return (
    <header className="glass-panel" style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      height: '70px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      borderWidth: '0 0 1px 0',
    }}>
      {/* Left side: Logo & Toggle */}
      <div style={{ display: 'flex', alignContent: 'center', gap: '16px' }}>
        <button onClick={onToggleSidebar} className="btn-icon" style={{ display: 'flex' }}>
          <Menu size={20} />
        </button>
        <div 
          onClick={() => { setActiveTab('home'); setSearchQuery(''); setLocalSearch(''); }}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
        >
          <div style={{
            background: 'var(--primary-glow)',
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 'bold',
            boxShadow: 'var(--shadow-glow)'
          }}>
            C
          </div>
          <span className="gradient-text nav-logo-text" style={{ fontStyle: 'italic', fontWeight: '800', fontSize: '20px', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            ChaiPlay <Sparkles size={14} style={{ color: 'var(--accent)' }} />
          </span>
        </div>
      </div>

      {/* Middle: Search */}
      <form onSubmit={handleSearchSubmit} className="search-form" style={{
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        width: '100%',
        maxWidth: '450px',
        margin: '0 16px',
        transition: 'max-width var(--transition-normal)'
      }}>
        <input
          type="text"
          placeholder="Search videos, creators..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="input-field"
          style={{ paddingRight: '46px', borderRadius: 'var(--radius-full)' }}
        />
        <button type="submit" className="btn-icon" style={{
          position: 'absolute',
          right: '8px',
          padding: '6px',
          background: 'transparent',
          color: 'var(--text-secondary)'
        }}>
          <Search size={18} />
        </button>
      </form>

      {/* Right side: Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Theme Toggler */}
        <button onClick={toggleTheme} className="btn-icon" title="Toggle Theme">
          {theme === 'dark' ? <Sun size={20} style={{ color: 'var(--warning)' }} /> : <Moon size={20} />}
        </button>

        {user ? (
          <>
            {/* Upload Button */}
            <button 
              onClick={onOpenUpload} 
              className="btn btn-primary" 
              style={{ padding: '8px 16px', borderRadius: 'var(--radius-full)', fontSize: '13px' }}
            >
              <Upload size={16} />
              <span>Upload</span>
            </button>

            {/* Profile Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img
                src={user.avatar}
                alt={user.username}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-full)',
                  objectFit: 'cover',
                  border: '2px solid var(--primary)'
                }}
              />
              <span style={{ fontSize: '14px', fontWeight: '500', display: 'none', md: 'block' }}>
                @{user.username}
              </span>
            </div>

            {/* Logout Button */}
            <button onClick={logout} className="btn-icon" title="Logout" style={{ color: 'var(--danger)' }}>
              <LogOut size={18} />
            </button>
          </>
        ) : (
          <button onClick={onOpenAuth} className="btn btn-primary" style={{ padding: '8px 20px', borderRadius: 'var(--radius-full)' }}>
            <User size={16} />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};

// Modified by Antigravity: Injecting inline mobile media styles for header items
const NavbarStyle = () => (
  <style>{`
    @media (max-width: 576px) {
      .nav-logo-text {
        display: none !important;
      }
      .search-form {
        max-width: 140px !important;
        margin: 0 4px !important;
      }
    }
  `}</style>
);

export default (props) => (
  <>
    <NavbarStyle />
    <Navbar {...props} />
  </>
);
