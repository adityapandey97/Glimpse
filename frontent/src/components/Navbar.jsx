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
