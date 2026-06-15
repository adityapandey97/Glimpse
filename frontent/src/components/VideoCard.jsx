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