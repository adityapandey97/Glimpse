import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import { MessageSquare, Send, Heart, Trash2, Edit2, Check, X, Sparkles } from 'lucide-react';

/* Modified by Antigravity: Premium Social Feed (Tweets/Thoughts) */
const TweetsView = () => {
  const { user } = useContext(AppContext);
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newTweet, setNewTweet] = useState('');
  
  // Edit state
  const [editingTweetId, setEditingTweetId] = useState(null);
  const [editingText, setEditingText] = useState('');

  const fetchTweets = async () => {
    if (!user) {
      // For guest users, load some mock community tweets
      setTweets([
        {
          _id: 'mock1',
          content: 'Building the new frontend with React + Vite! The Vanilla CSS design system is super clean. Glassmorphism rules! 🌟',
          createdAt: new Date().toISOString(),
          owner: {
            fullName: 'Chai Creator',
            username: 'chai_master',
            avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=80&q=80'
          }
        },
        {
          _id: 'mock2',
          content: 'Just deployed the backend API corrections. All mongoose model mismatches are solved. Ready for testing! 💻🚀',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          owner: {
            fullName: 'Antigravity AI',
            username: 'antigravity_dev',
            avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'
          }
        }
      ]);
      return;
    }
    
    try {
      setLoading(true);
      // Fetch tweets created by this user
      const res = await axios.get(`/api/v1/tweets/user/${user._id}`);
      if (res.data?.success) {
        setTweets(res.data.data || []);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        // No tweets found is normal, empty the list
        setTweets([]);
      } else {
        console.error('Error fetching tweets', error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTweets();
  }, [user]);

  const handleAddTweet = async (e) => {
    e.preventDefault();
    if (!newTweet.trim()) return;

    try {
      const res = await axios.post('/api/v1/tweets/', {
        content: newTweet
      });
      if (res.data?.success) {
        setNewTweet('');
        fetchTweets();
      }
    } catch (error) {
      alert('Failed to post tweet');
    }
  };

  const handleEditTweet = async (tweetId) => {
    if (!editingText.trim()) return;
    try {
      const res = await axios.patch(`/api/v1/tweets/${tweetId}`, {
        content: editingText
      });
      if (res.data?.success) {
        setEditingTweetId(null);
        setEditingText('');
        fetchTweets();
      }
    } catch (error) {
      alert('Failed to update tweet');
    }
  };

  const handleDeleteTweet = async (tweetId) => {
    if (!window.confirm('Delete this tweet?')) return;
    try {
      const res = await axios.delete(`/api/v1/tweets/${tweetId}`);
      if (res.data?.success) {
        fetchTweets();
      }
    } catch (error) {
      alert('Failed to delete tweet');
    }
  };

  return (
    <div style={{ flexGrow: 1, padding: '24px', overflowY: 'auto', maxWidth: '650px', margin: '0 auto', width: '100%' }} className="animate-fade">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
        <MessageSquare size={24} style={{ color: 'var(--primary)' }} />
        <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
          Social Timeline
        </h2>
      </div>

      {/* Write Post */}
      {user ? (
        <form onSubmit={handleAddTweet} className="glass-panel" style={{
          padding: '20px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          marginBottom: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <img
              src={user.avatar}
              alt=""
              style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-full)', objectFit: 'cover' }}
            />
            <textarea
              placeholder="Share your thoughts or announcements with the community..."
              value={newTweet}
              onChange={(e) => setNewTweet(e.target.value)}
              className="input-field"
              maxLength={280}
              style={{ border: 'none', background: 'transparent', minHeight: '80px', padding: '4px', resize: 'none', fontSize: '15px' }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {280 - newTweet.length} characters remaining
            </span>
            <button type="submit" className="btn btn-primary" style={{ padding: '6px 16px', borderRadius: 'var(--radius-full)', fontSize: '13px' }}>
              <Send size={14} />
              <span>Post</span>
            </button>
          </div>
        </form>
      ) : (
        <div style={{
          padding: '20px',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          textAlign: 'center',
          color: 'var(--text-secondary)',
          fontSize: '14px',
          marginBottom: '24px'
        }}>
          Please sign in to write announcements or posts. Showing community posts.
        </div>
      )}

      {/* Tweets List */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}>
          <div style={{
            width: '30px',
            height: '30px',
            border: '3px solid var(--border-color)',
            borderTopColor: 'var(--primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
        </div>
      ) : tweets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '14px' }}>
          No posts in the timeline yet. Be the first to share!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {tweets.map((tweet) => {
            const tweetOwner = tweet.owner || {};
            const isMyTweet = user && tweetOwner._id === user._id;

            return (
              <div 
                key={tweet._id} 
                className="glass-panel animate-fade" 
                style={{
                  padding: '20px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  gap: '14px'
                }}