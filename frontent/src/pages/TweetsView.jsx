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