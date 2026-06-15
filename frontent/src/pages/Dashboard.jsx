import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import { LayoutDashboard, Users, Eye, Heart, Film, Globe, Lock, Trash2, Edit2, Check, X } from 'lucide-react';

/* Modified by Antigravity: Channel Dashboard & Analytics page */
const Dashboard = () => {
  const { user } = useContext(AppContext);
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
      }
    } catch (error) {
      alert('Failed to toggle publish status');
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
      }
    } catch (error) {
      alert('Failed to update video metadata');
    }
  };

  const handleDeleteVideo = async (videoId) => {
    if (!window.confirm('Are you sure you want to delete this video?')) return;
    try {
      const res = await axios.delete(`/api/v1/videos/${videoId}`);
      if (res.data?.success) {
        setVideos(prev => prev.filter(v => v._id !== videoId));
      }
    } catch (error) {
      alert('Failed to delete video');
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
        <LayoutDashboard size={24} style={{ color: 'var(--primary)' }} />
        <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
          Channel Dashboard
        </h2>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid var(--border-color)',
            borderTopColor: 'var(--primary)',
            borderRadius: '50%',