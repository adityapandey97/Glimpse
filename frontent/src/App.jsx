import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from './context/AppContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import HomeFeed from './pages/HomeFeed';
import VideoPlayer from './pages/VideoPlayer';
import Dashboard from './pages/Dashboard';
import TweetsView from './pages/TweetsView';
import PlaylistsView from './pages/PlaylistsView';
import ChannelView from './pages/ChannelView';
import SettingsView from './pages/SettingsView';
import AuthModal from './components/AuthModal';
import UploadModal from './components/UploadModal';
import VideoCard from './components/VideoCard';
import axios from 'axios';
import { Heart, Play, Home, MessageSquare, ListVideo, Tv, Settings, User } from 'lucide-react';

/* Modified by Antigravity: Fully Responsive App Layout with Mobile Bottom Navigation & Slide Drawer */
function App() {
  const { user, loadingUser, activeTab, setActiveTab, activeVideoId, setActiveVideoId } = useContext(AppContext);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  
  // Responsive mobile states
  const [isMobile, setIsMobile] = useState(window.innerWidth < 992);
  const [showDrawer, setShowDrawer] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobileView = window.innerWidth < 992;
      setIsMobile(mobileView);
      if (!mobileView) {
        setShowDrawer(false); // Close drawer if resizing to desktop
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close modals when user changes / logs in
  useEffect(() => {
    if (user) {
      setShowAuthModal(false);
    }
  }, [user]);

  if (loadingUser) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid var(--border-color)',
          borderTopColor: 'var(--primary)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <span style={{ fontSize: '14px', fontWeight: '500', letterSpacing: '0.5px' }} className="gradient-text">
          ChaiPlay loading...
        </span>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Render content screens
  const renderContent = () => {
    if (activeVideoId) {
      return <VideoPlayer />;
    }

    switch (activeTab) {
      case 'home':
        return <HomeFeed />;
      case 'tweets':
        return <TweetsView />;
      case 'playlist':
        return <PlaylistsView />;
      case 'channel':
        return <ChannelView />;
      case 'dashboard':
        return <Dashboard />;
      case 'liked-videos':
        return <LikedVideosPage />;
      case 'settings':
        return <SettingsView />;
      default:
        return <HomeFeed />;
    }
  };

  // Mobile navigation items are now identical for all users
  const mobileNavItems = [
    { id: 'home', label: 'Home', icon: Home, requiresAuth: false },
    { id: 'tweets', label: 'Tweets', icon: MessageSquare, requiresAuth: false },
    { id: 'playlist', label: 'Playlists', icon: ListVideo, requiresAuth: true },
    { id: 'channel', label: 'Profile', icon: Tv, requiresAuth: true },
    { id: 'settings', label: 'Settings', icon: Settings, requiresAuth: true },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Top Navbar */}
      <Navbar 
        onOpenAuth={() => setShowAuthModal(true)} 