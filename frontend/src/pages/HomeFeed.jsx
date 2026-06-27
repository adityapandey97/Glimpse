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
      {/* Category Pills */}
      <div style={{
        display: 'flex',
        gap: '10px',
        overflowX: 'auto',
        paddingBottom: '16px',
        marginBottom: '24px',
        scrollbarWidth: 'none'
      }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              padding: '8px 18px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-color)',
              background: selectedCategory === cat ? 'var(--primary-glow)' : 'var(--bg-secondary)',
              color: selectedCategory === cat ? 'var(--primary-text)' : 'var(--text-secondary)',
              fontSize: '13px',
              fontWeight: '600',
              textTransform: 'capitalize',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontFamily: 'var(--font-sans)',
              transition: 'all var(--transition-fast)'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Film size={20} style={{ color: 'var(--accent)' }} />
          <span>{searchQuery ? `Search results for "${searchQuery}"` : 'Recommended Videos'}</span>
        </h2>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          {filteredVideos.length} videos found
        </span>
      </div>

      {/* Videos List */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid var(--border-color)',
            borderTopColor: 'var(--primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      ) : filteredVideos.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '80px 24px',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-secondary)'
        }}>
          <Play size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px', display: 'inline-block' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>No videos found</h3>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '360px', margin: '0 auto' }}>
            Try searching for something else or upload your first video to start the platform catalog.
          </p>
        </div>
      ) : (
        <div className="grid-feed">
          {filteredVideos.map((video) => (
            <VideoCard key={video._id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
};

export default HomeFeed;
