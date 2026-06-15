import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { Play, Eye, Clock } from 'lucide-react';

/* Modified by Antigravity: Beautiful Glassmorphic Video Feed Card */
const VideoCard = ({ video }) => {
  const { setActiveVideoId } = useContext(AppContext);

  // Fallback views/duration handling
  const views = typeof video.views === 'number' ? video.views : (video.views?.length || 0);
  const duration = video.duration || 0;

  // Format seconds into MM:SS
  const formatDuration = (secs) => {
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Simple relative time helper
  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return 'some time ago';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHrs = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHrs / 24);

    if (diffSecs < 60) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return `${diffDays}d ago`;
  };

  const owner = video.owner || {};

  return (
    <div 
      onClick={() => setActiveVideoId(video._id)}
      className="glass-panel animate-fade"
      style={{
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        transition: 'transform var(--transition-fast), border-color var(--transition-fast)',
        border: '1px solid var(--border-color)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.borderColor = 'var(--primary)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'var(--border-color)';
      }}
    >
      {/* Thumbnail Container */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#000' }}>
        <img
          src={video.thumbnail}
          alt={video.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        {/* Play Icon Hover Overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0,
          transition: 'opacity var(--transition-fast)',
        }}
        className="play-overlay"
        onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
        onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
        >
          <div style={{
            background: 'var(--primary-glow)',
            padding: '12px',
            borderRadius: 'var(--radius-full)',
            color: '#fff',
            boxShadow: 'var(--shadow-glow)'
          }}>
            <Play size={24} fill="#fff" />
          </div>
        </div>

        {/* Video Duration Badge */}
        <div style={{
          position: 'absolute',
          bottom: '8px',
          right: '8px',
          background: 'rgba(0, 0, 0, 0.75)',
          color: '#fff',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '11px',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <Clock size={10} />
          {formatDuration(duration)}
        </div>
      </div>

      {/* Info Container */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flexGrow: 1, gap: '12px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          {/* Channel Avatar */}
          <img
            src={owner.avatar || 'https://via.placeholder.com/32'}
            alt={owner.username || 'user'}