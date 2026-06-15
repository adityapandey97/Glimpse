import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import VideoCard from '../components/VideoCard';
import axios from 'axios';
import { Tv, Info, Film, Sparkles } from 'lucide-react';

/* Modified by Antigravity: Channel Profile Page */
const ChannelView = () => {
  const { user } = useContext(AppContext);
  const [videos, setVideos] = useState([]);
  const [subscribersCount, setSubscribersCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('videos'); // 'videos', 'about'

  const fetchChannelData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      // Fetch user's videos (published and unpublished)
      const vidsRes = await axios.get('/api/v1/dashboard/videos');
      if (vidsRes.data?.success) {
        setVideos(vidsRes.data.data || []);
      }

      // Fetch subscribers count
      const subsRes = await axios.get(`/api/v1/subscriptions/c/${user._id}`);
      if (subsRes.data?.success) {
        setSubscribersCount(subsRes.data.data.length || 0);
      }
    } catch (error) {
      console.error('Error loading channel profile', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChannelData();
  }, [user]);

  if (!user) {
    return (
      <div style={{ padding: '40px 24px', textAlign: 'center', flexGrow: 1 }}>
        <h3>Please sign in to view your channel profile.</h3>
      </div>
    );
  }

  // Filter public videos for channel page profile view
  const publicVideos = videos.filter(v => v.isPublished);

  return (
    <div style={{ flexGrow: 1, overflowY: 'auto' }} className="animate-fade">
      {/* Cover Banner */}
      <div style={{
        width: '100%',
        height: '180px',
        position: 'relative',
        background: user.coverImage ? `url(${user.coverImage}) center/cover no-repeat` : 'var(--primary-glow)',
      }}>
        {/* Banner Overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.6) 100%)'
        }}></div>
      </div>

      {/* Header Info Area */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 24px 24px 24px',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {/* Avatar overlapping banner */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-end', marginTop: '-50px' }}>
          <img
            src={user.avatar}
            alt=""
            style={{
              width: '100px',
              height: '100px',
              borderRadius: 'var(--radius-full)',
              border: '4px solid var(--bg-primary)',
              objectFit: 'cover',
              background: 'var(--bg-secondary)',
              boxShadow: 'var(--shadow-md)',
              position: 'relative',
              zIndex: 5
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: '10px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
              {user.fullName}
              <Sparkles size={16} style={{ color: 'var(--accent)' }} />
            </h2>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>@{user.username}</span>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: '500' }}>
              {subscribersCount} subscribers • {publicVideos.length} public videos
            </span>
          </div>
        </div>

        {/* Tab Selection */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-color)',
          marginTop: '16px',
          gap: '24px'
        }}>
          <button
            onClick={() => setActiveSubTab('videos')}
            style={{
              padding: '12px 6px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeSubTab === 'videos' ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeSubTab === 'videos' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: '600',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'var(--font-sans)',
              transition: 'all var(--transition-fast)'
            }}
          >
            <Film size={16} />
            <span>Videos</span>
          </button>
          <button
            onClick={() => setActiveSubTab('about')}
            style={{
              padding: '12px 6px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeSubTab === 'about' ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeSubTab === 'about' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: '600',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'var(--font-sans)',
              transition: 'all var(--transition-fast)'
            }}
          >
            <Info size={16} />
            <span>About Channel</span>
          </button>