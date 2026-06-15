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