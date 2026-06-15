import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import { ListVideo, Plus, FolderHeart, Play, Clock } from 'lucide-react';

/* Modified by Antigravity: Playlist Management Page */
const PlaylistsView = () => {
  const { user, setActiveVideoId } = useContext(AppContext);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);

  const fetchPlaylists = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await axios.get(`/api/v1/playlist/user/${user._id}`);
      if (res.data?.success) {
        setPlaylists(res.data.data || []);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setPlaylists([]);
      } else {
        console.error('Error fetching playlists', error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaylists();
  }, [user]);

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      const res = await axios.post('/api/v1/playlist/', {
        name,
        description
      });
      if (res.data?.success) {
        setName('');
        setDescription('');
        setShowCreate(false);
        fetchPlaylists();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Error creating playlist');
    }
  };

  const loadPlaylistDetails = async (playlistId) => {
    try {
      const res = await axios.get(`/api/v1/playlist/${playlistId}`);
      if (res.data?.success) {
        setSelectedPlaylist(res.data.data);
      }
    } catch (error) {
      alert('Failed to load playlist details');
    }
  };

  if (!user) {
    return (
      <div style={{ padding: '40px 24px', textAlign: 'center', flexGrow: 1 }}>
        <h3>Please sign in to view your playlists.</h3>
      </div>
    );
  }

  return (
    <div style={{ flexGrow: 1, padding: '24px', overflowY: 'auto' }} className="animate-fade">
      {selectedPlaylist ? (
        // Playlist detail view
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <button onClick={() => setSelectedPlaylist(null)} className="btn btn-secondary" style={{ borderRadius: 'var(--radius-full)', padding: '6px 16px' }}>
              &larr; Back to Playlists
            </button>
          </div>

          <div className="glass-panel" style={{
            padding: '24px',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.05) 0%, rgba(245, 158, 11, 0.05) 100%)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)' }}>{selectedPlaylist.name}</h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{selectedPlaylist.description || 'No description provided.'}</p>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{selectedPlaylist.videos?.length || 0} videos</span>
          </div>

          <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>Videos</h3>
          {selectedPlaylist.videos?.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              No videos in this playlist yet. Add videos from their play screens!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {selectedPlaylist.videos?.map((vidId, idx) => (
                <div
                  key={vidId}
                  onClick={() => setActiveVideoId(vidId)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '12px',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    transition: 'border-color var(--transition-fast)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                >
                  <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-muted)', width: '24px', textAlign: 'center' }}>
                    {idx + 1}
                  </span>
                  {/* Modified by Antigravity: changed background from purple to orange */}
                  <div style={{ padding: '6px', background: 'rgba(249, 115, 22, 0.1)', color: 'var(--primary)', borderRadius: '4px' }}>
                    <Play size={16} fill="var(--primary)" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>Play Video</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ID: {vidId}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        // Playlists grid list view
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ListVideo size={24} style={{ color: 'var(--primary)' }} />
              <span>Your Playlists</span>
            </h2>
            <button onClick={() => setShowCreate(!showCreate)} className="btn btn-primary" style={{ padding: '8px 16px', borderRadius: 'var(--radius-full)' }}>
              {showCreate ? <X size={14} /> : <Plus size={14} />}
              <span>{showCreate ? 'Cancel' : 'Create Playlist'}</span>
            </button>
          </div>

          {/* Create Form Toggle */}
          {showCreate && (
            <form onSubmit={handleCreatePlaylist} className="glass-panel" style={{
              padding: '20px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              marginBottom: '24px',
              maxWidth: '450px'
            }}>
              <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '14px', color: 'var(--text-primary)' }}>New Playlist Details</h3>
              <div className="form-group">
                <label className="input-label">Playlist Name</label>
                <input
                  type="text"
                  placeholder="e.g. My Coding Tutorials"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field"
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="input-label">Description (Optional)</label>
                <textarea
                  placeholder="What is this playlist about?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-field"
                  style={{ minHeight: '60px', resize: 'vertical' }}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Create Playlist</button>
            </form>
          )}

          {/* Playlists grid */}
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>