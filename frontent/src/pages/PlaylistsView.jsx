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