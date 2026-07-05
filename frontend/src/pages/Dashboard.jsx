import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import { LayoutDashboard, Users, Eye, Heart, Film, Globe, Lock, Trash2, Edit2, Check, X } from 'lucide-react';

/* Modified by Antigravity: Channel Dashboard & Analytics page */
const Dashboard = () => {
  const { user, setActiveTab, showToast } = useContext(AppContext);
  const [stats, setStats] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Edit state
  const [editingVideoId, setEditingVideoId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const fetchDashboardData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      
      // Fetch channel stats
      const statsRes = await axios.get('/api/v1/dashboard/stats');
      if (statsRes.data?.success) {
        // Since aggregate returns array of user details
        setStats(statsRes.data.data[0] || null);
      }

      // Fetch channel videos
      const videosRes = await axios.get('/api/v1/dashboard/videos');
      if (videosRes.data?.success) {
        setVideos(videosRes.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard statistics', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const handleTogglePublish = async (videoId) => {
    try {
      const res = await axios.patch(`/api/v1/videos/toggle/publish/${videoId}`);
      if (res.data?.success) {
        // Update local state
        setVideos(prev => prev.map(v => v._id === videoId ? { ...v, isPublished: !v.isPublished } : v));
        showToast('Video visibility updated successfully!', 'success');
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to toggle publish status', 'error');
    }
  };

  const handleEditSubmit = async (videoId) => {
    if (!editTitle.trim() || !editDescription.trim()) return;
    try {
      const res = await axios.patch(`/api/v1/videos/${videoId}`, {
        title: editTitle,
        description: editDescription
      });
      if (res.data?.success) {
        setVideos(prev => prev.map(v => v._id === videoId ? { ...v, title: editTitle, description: editDescription } : v));
        setEditingVideoId(null);
        showToast('Video details updated successfully!', 'success');
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to update video metadata', 'error');
    }
  };

  const handleDeleteVideo = async (videoId) => {
    if (!window.confirm('Are you sure you want to delete this video?')) return;
    try {
      const res = await axios.delete(`/api/v1/videos/${videoId}`);
      if (res.data?.success) {
        setVideos(prev => prev.filter(v => v._id !== videoId));
        showToast('Video deleted successfully!', 'success');
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to delete video', 'error');
    }
  };

  if (!user) {
    return (
      <div style={{ padding: '40px 24px', textAlign: 'center', flexGrow: 1 }}>
        <h3>Please sign in to view your dashboard.</h3>
      </div>
    );
  }

  return (
    <div style={{ flexGrow: 1, padding: '24px', overflowY: 'auto' }} className="animate-fade">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <LayoutDashboard size={24} style={{ color: 'var(--primary)' }} />
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
            Channel Dashboard
          </h2>
        </div>
        <button 
          onClick={() => setActiveTab('settings')}
          className="btn btn-secondary"
          style={{ padding: '8px 16px', fontSize: '13px', borderRadius: 'var(--radius-md)' }}
        >
          Edit Channel Profile
        </button>
      </div>

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
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '32px'
          }}>
            {/* Total Followers */}
            <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '16px' }}>
              {/* Modified by Antigravity: changed background from purple to orange */}
              <div style={{ padding: '10px', background: 'rgba(249, 115, 22, 0.1)', color: 'var(--primary)', borderRadius: 'var(--radius-sm)' }}>
                <Users size={24} />
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)' }}>Total Followers</span>
                <span style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>{stats?.totalSubscribers || 0}</span>
              </div>
            </div>

            {/* Total Views */}
            <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ padding: '10px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--info)', borderRadius: 'var(--radius-sm)' }}>
                <Eye size={24} />
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)' }}>Total Views</span>
                <span style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>{stats?.totalViews || 0}</span>
              </div>
            </div>

            {/* Total Likes */}
            <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '16px' }}>
              {/* Modified by Antigravity: changed background from magenta to amber */}
              <div style={{ padding: '10px', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--accent)', borderRadius: 'var(--radius-sm)' }}>
                <Heart size={24} />
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)' }}>Total Likes</span>
                <span style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>{stats?.totalLikes || 0}</span>
              </div>
            </div>

            {/* Videos Count */}
            <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ padding: '10px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', borderRadius: 'var(--radius-sm)' }}>
                <Film size={24} />
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)' }}>Total Videos</span>
                <span style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>{videos.length}</span>
              </div>
            </div>
          </div>

          {/* Videos Upload List */}
          <div className="glass-panel" style={{
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            overflow: 'hidden',
            padding: '24px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: 'var(--text-primary)' }}>
              Uploaded Content
            </h3>

            {videos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '14px' }}>
                You haven't uploaded any videos yet.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '13px' }}>
                      <th style={{ padding: '12px 8px' }}>Status</th>
                      <th style={{ padding: '12px 8px' }}>Video</th>
                      <th style={{ padding: '12px 8px' }}>Views</th>
                      <th style={{ padding: '12px 8px' }}>Created</th>
                      <th style={{ padding: '12px 8px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {videos.map((vid) => (
                      <tr key={vid._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)', fontSize: '14px' }}>
                        
                        {/* Status Column */}
                        <td style={{ padding: '16px 8px' }}>
                          <button
                            onClick={() => handleTogglePublish(vid._id)}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              color: vid.isPublished ? 'var(--success)' : 'var(--text-secondary)',
                              fontWeight: '600',
                              fontSize: '12px'
                            }}
                            title="Click to toggle publish status"
                          >
                            {vid.isPublished ? <Globe size={14} /> : <Lock size={14} />}
                            <span>{vid.isPublished ? 'Published' : 'Unpublished'}</span>
                          </button>
                        </td>

                        {/* Video Info Column */}
                        <td style={{ padding: '16px 8px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <img
                            src={vid.thumbnail}
                            alt=""
                            style={{ width: '70px', aspectRatio: '16/9', borderRadius: '4px', objectFit: 'cover', background: '#000', flexShrink: 0 }}
                          />
                          {editingVideoId === vid._id ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                              <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="input-field"
                                style={{ padding: '4px 8px', fontSize: '12px' }}
                              />
                              <textarea
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                className="input-field"
                                style={{ padding: '4px 8px', fontSize: '12px', minHeight: '40px' }}
                              />
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                              <span style={{ fontWeight: '600', color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '240px' }}>
                                {vid.title}
                              </span>
                              <span style={{ fontSize: '12px', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '240px' }}>
                                {vid.description}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Views Column */}
                        <td style={{ padding: '16px 8px', color: 'var(--text-secondary)' }}>
                          {(typeof vid.views === 'number' ? vid.views : (vid.views?.length || 0))}
                        </td>

                        {/* Date Column */}
                        <td style={{ padding: '16px 8px', color: 'var(--text-muted)', fontSize: '13px' }}>
                          {new Date(vid.createdAt).toLocaleDateString()}
                        </td>

                        {/* Actions Column */}
                        <td style={{ padding: '16px 8px', textAlign: 'right' }}>
                          {editingVideoId === vid._id ? (
                            <div style={{ display: 'inline-flex', gap: '8px' }}>
                              <button onClick={() => handleEditSubmit(vid._id)} className="btn-icon" style={{ color: 'var(--success)' }}>
                                <Check size={16} />
                              </button>
                              <button onClick={() => setEditingVideoId(null)} className="btn-icon" style={{ color: 'var(--danger)' }}>
                                <X size={16} />
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'inline-flex', gap: '8px' }}>
                              <button
                                onClick={() => {
                                  setEditingVideoId(vid._id);
                                  setEditTitle(vid.title);
                                  setEditDescription(vid.description);
                                }}
                                className="btn-icon"
                                title="Edit Video Details"
                              >
                                <Edit2 size={15} />
                              </button>
                              <button
                                onClick={() => handleDeleteVideo(vid._id)}
                                className="btn-icon"
                                style={{ color: 'var(--danger)' }}
                                title="Delete Video"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          )}
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
