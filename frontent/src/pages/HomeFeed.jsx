import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import VideoCard from '../components/VideoCard';
import axios from 'axios';
import { Play, Flame, Film } from 'lucide-react';

/* Modified by Antigravity: Video Grid Feed with Search & Filters */
const HomeFeed = () => {
  const { searchQuery } = useContext(AppContext);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const fetchVideos = async () => {
    try {
      setLoading(true);
      // Fetch public videos, pass search query if available
      const params = {};
      if (searchQuery) {
        params.query = searchQuery;
      }
      
      const res = await axios.get('/api/v1/videos/', { params });
      if (res.data?.success) {
        setVideos(res.data.data.videos || []);
      }
    } catch (error) {
      console.error('Error fetching feed videos', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [searchQuery]);

  // Categories helper for social media feel
  const categories = ['all', 'development', 'gaming', 'music', 'design', 'vlogs'];

  const filteredVideos = videos.filter((video) => {
    if (selectedCategory === 'all') return true;
    return video.description?.toLowerCase().includes(selectedCategory) ||
           video.title?.toLowerCase().includes(selectedCategory);
  });

  return (
    <div style={{ flexGrow: 1, padding: '24px', overflowY: 'auto' }}>
      {/* Welcome Banner */}
      {!searchQuery && (
        <div 
          className="glass-panel" 
          style={{
            borderRadius: 'var(--radius-lg)',
            padding: '40px',
            marginBottom: '32px',
            // Modified by Antigravity: updated gradient values to match new light orange theme variables
            background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(245, 158, 11, 0.1) 100%)',
            border: '1px solid var(--border-color-glow)',
            textAlign: 'left',
            position: 'relative',
            overflow: 'hidden'