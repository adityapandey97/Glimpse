import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { Home, LayoutDashboard, Heart, MessageSquare, ListVideo, Tv, Settings, LogOut, X, User } from 'lucide-react';

/* Modified by Antigravity: Premium Upper/Lower Sidebar with guest view capabilities & auth redirects */
const Sidebar = ({ isCollapsed, isDrawer, onCloseDrawer, onOpenAuth }) => {
  const { user, activeTab, setActiveTab, logout } = useContext(AppContext);

  const upperItems = [
    { id: 'home', label: 'Home Feed', icon: Home, requiresAuth: false },
    { id: 'tweets', label: 'Tweets & Thoughts', icon: MessageSquare, requiresAuth: false },
    { id: 'playlist', label: 'Your Playlists', icon: ListVideo, requiresAuth: true },
    { id: 'channel', label: 'Your Channel', icon: Tv, requiresAuth: true },
    { id: 'dashboard', label: 'Your Dashboard', icon: LayoutDashboard, requiresAuth: true },
  ];

  const lowerItems = [
    { id: 'settings', label: 'Settings', icon: Settings, requiresAuth: true },
  ];

  const handleNavClick = (item) => {
    // Intercept clicks on authenticated routes for guests
    if (item.requiresAuth && !user) {
      if (onOpenAuth) {
        onOpenAuth();
      }
      if (isDrawer && onCloseDrawer) {
        onCloseDrawer();
      }
      return;
    }
    setActiveTab(item.id);
    if (isDrawer && onCloseDrawer) {
      onCloseDrawer();
    }
  };

  const sidebarContent = (
    <>
      {/* Drawer Close Button Header */}
      {isDrawer && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <button onClick={onCloseDrawer} className="btn-icon" style={{ padding: '6px' }}>
            <X size={20} />
          </button>
        </div>
      )}

      {/* Upper Menu Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {upperItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          // Renders all items for guest users as well
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: isCollapsed ? '0' : '12px',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: isActive ? 'var(--primary-glow)' : 'transparent',
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                fontWeight: isActive ? '600' : '500',
                fontSize: '14px',
                transition: 'all var(--transition-fast)',
              }}
              title={item.label}
            >