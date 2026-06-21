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
import ChatView from './pages/ChatView';
import AuthModal from './components/AuthModal';
import UploadModal from './components/UploadModal';
import VideoCard from './components/VideoCard';
import axios from 'axios';
import { Heart, Play, Home, MessageSquare, MessageCircle, ListVideo, Tv, Settings, User } from 'lucide-react';

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
          Glimpse loading...
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
      case 'chat':
        return <ChatView />;
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
    { id: 'tweets', label: 'Tweets', icon: MessageCircle, requiresAuth: false },
    { id: 'chat', label: 'Chat', icon: MessageSquare, requiresAuth: true },
    { id: 'channel', label: 'Profile', icon: Tv, requiresAuth: true },
    { id: 'settings', label: 'Settings', icon: Settings, requiresAuth: true },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Top Navbar */}
      <Navbar 
        onOpenAuth={() => setShowAuthModal(true)} 
        onOpenUpload={() => setShowUploadModal(true)} 
        onToggleSidebar={() => {
          if (isMobile) {
            setShowDrawer(true);
          } else {
            setSidebarCollapsed(!sidebarCollapsed);
          }
        }}
      />

      {/* Main Layout Area */}
      <div style={{ display: 'flex', flexGrow: 1, position: 'relative' }}>
        {/* Sidebar (Desktop Mode) */}
        {!isMobile && (
          <Sidebar 
            isCollapsed={sidebarCollapsed} 
            onOpenAuth={() => setShowAuthModal(true)} 
          />
        )}

        {/* Slide-in Drawer (Mobile Mode) */}
        {isMobile && showDrawer && (
          <>
            {/* Backdrop */}
            <div 
              onClick={() => setShowDrawer(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(3px)',
                zIndex: 250,
                transition: 'opacity var(--transition-normal)'
              }}
            />
            {/* Drawer */}
            <Sidebar 
              isCollapsed={false} 
              isDrawer={true} 
              onCloseDrawer={() => setShowDrawer(false)} 
              onOpenAuth={() => setShowAuthModal(true)} 
            />
          </>
        )}

        {/* Content Container */}
        <main style={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 70px)',
          overflowY: 'auto',
          paddingBottom: isMobile ? '80px' : '24px' // Extra space for mobile lower bottom bar
        }}>
          {renderContent()}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Lower Bar) */}
      {isMobile && (
        <nav className="glass-panel animate-fade" style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '65px',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          zIndex: 150,
          borderWidth: '1px 0 0 0',
          padding: '4px 8px',
          boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.4)'
        }}>
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  // Intercept guest click on auth-restricted mobile bar items
                  if (item.requiresAuth && !user) {
                    setShowAuthModal(true);
                    return;
                  }
                  setActiveTab(item.id);
                  setActiveVideoId(null);
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  background: 'transparent',
                  border: 'none',
                  color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: '600',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  transition: 'all var(--transition-fast)',
                  fontFamily: 'var(--font-sans)'
                }}
              >
                <Icon size={20} style={{ color: isActive ? 'var(--primary)' : 'var(--text-secondary)' }} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      )}

      {/* Modals Overlays */}
      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
      {showUploadModal && (
        <UploadModal 
          onClose={() => setShowUploadModal(false)} 
          onUploadSuccess={() => {
            if (activeTab === 'dashboard') {
              window.location.reload();
            } else {
              setActiveTab('dashboard');
            }
          }} 
        />
      )}
      
      {/* Hide Sidebar Desktop class at mobile breakpoint */}
      <style>{`
        @media (max-width: 991px) {
          .sidebar-desktop {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

/* Subpage: Liked Videos Page (rendered inline for cleaner component management) */
const LikedVideosPage = () => {
  const { user, setActiveVideoId } = useContext(AppContext);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLikedVideos = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const res = await axios.get('/api/v1/likes/videos');
        if (res.data?.success) {
          setVideos(res.data.data || []);
        }
      } catch (error) {
        console.error('Error fetching liked videos', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLikedVideos();
  }, [user]);

  if (!user) {
    return (
      <div style={{ padding: '40px 24px', textAlign: 'center', flexGrow: 1 }}>
        <h3>Please sign in to view your liked videos.</h3>
      </div>
    );
  }

  return (
    <div style={{ flexGrow: 1, padding: '24px', overflowY: 'auto' }} className="animate-fade">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
        <Heart size={24} style={{ color: 'var(--accent)' }} />
        <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
          Liked Videos
        </h2>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
          <div style={{
            width: '30px',
            height: '30px',
            border: '3px solid var(--border-color)',
            borderTopColor: 'var(--primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
        </div>
      ) : videos.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 24px',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-secondary)'
        }}>
          <Heart size={40} style={{ color: 'var(--text-muted)', marginBottom: '12px', display: 'inline-block' }} />
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>No liked videos</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Videos you like will appear here for easy access later.
          </p>
        </div>
      ) : (
        <div className="grid-feed">
          {videos.map((video) => (
            <VideoCard key={video._id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
};

export default App;
