import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import { MessageSquare, Send, Heart, Trash2, Edit2, Check, X, Sparkles } from 'lucide-react';

/* Modified by Antigravity: Premium Social Feed (Tweets/Thoughts) */
const TweetsView = () => {
  const { user, showToast } = useContext(AppContext);
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
        showToast('Tweet posted successfully!', 'success');
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to post tweet', 'error');
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
        showToast('Tweet updated successfully!', 'success');
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to update tweet', 'error');
    }
  };

  const handleDeleteTweet = async (tweetId) => {
    if (!window.confirm('Delete this tweet?')) return;
    try {
      const res = await axios.delete(`/api/v1/tweets/${tweetId}`);
      if (res.data?.success) {
        fetchTweets();
        showToast('Tweet deleted successfully!', 'success');
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to delete tweet', 'error');
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
              >
                <img
                  src={tweetOwner.avatar || 'https://via.placeholder.com/40'}
                  alt=""
                  style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-full)', objectFit: 'cover', border: '1px solid var(--border-color)', flexShrink: 0 }}
                />

                <div style={{ flexGrow: 1, minWidth: 0 }}>
                  {/* Top header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {tweetOwner.fullName || 'User'}
                        <Sparkles size={12} style={{ color: 'var(--accent)' }} />
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        @{tweetOwner.username || 'user'}
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {new Date(tweet.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Body Content / Edit Form */}
                  {editingTweetId === tweet._id ? (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                      <input
                        type="text"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="input-field"
                        style={{ padding: '6px 12px', fontSize: '14px' }}
                        autoFocus
                      />
                      <button onClick={() => handleEditTweet(tweet._id)} className="btn-icon" style={{ color: 'var(--success)' }}>
                        <Check size={16} />
                      </button>
                      <button onClick={() => setEditingTweetId(null)} className="btn-icon" style={{ color: 'var(--danger)' }}>
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <p style={{ fontSize: '15px', color: 'var(--text-primary)', wordBreak: 'break-word', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                      {tweet.content}
                    </p>
                  )}

                  {/* Bottom Panel */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.02)' }}>
                    <button className="btn-icon" style={{ padding: '4px', gap: '4px', fontSize: '12px' }}>
                      <Heart size={14} />
                      <span>{tweet._id.startsWith('mock') ? 12 : 0}</span>
                    </button>

                    {isMyTweet && editingTweetId !== tweet._id && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => { setEditingTweetId(tweet._id); setEditingText(tweet.content); }}
                          className="btn-icon"
                          title="Edit Post"
                          style={{ padding: '4px' }}
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteTweet(tweet._id)}
                          className="btn-icon"
                          style={{ padding: '4px', color: 'var(--danger)' }}
                          title="Delete Post"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TweetsView;
