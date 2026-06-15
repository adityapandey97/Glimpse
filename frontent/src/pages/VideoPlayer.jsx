import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import CommentSection from '../components/CommentSection';
import axios from 'axios';
import { ThumbsUp, UserPlus, UserMinus, Eye, Calendar, Sparkles, ArrowLeft } from 'lucide-react';

/* Modified by Antigravity: Premium YouTube/Instagram Video Player Page */
const VideoPlayer = () => {
  const { user, activeVideoId, setActiveVideoId } = useContext(AppContext);
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);
  
  // Interaction states
  const [isLiked, setIsLiked] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribersCount, setSubscribersCount] = useState(0);

  const fetchVideoDetails = async () => {
    if (!activeVideoId) return;
    try {
      setLoading(true);
      const res = await axios.get(`/api/v1/videos/${activeVideoId}`);
      if (res.data?.success) {
        setVideo(res.data.data);
        
        // Fetch recommendations
        const recRes = await axios.get('/api/v1/videos/');
        if (recRes.data?.success) {
          const allVids = recRes.data.data.videos || [];
          setRecommendations(allVids.filter(v => v._id !== activeVideoId));
        }

        // Fetch channel subscribers count
        const channelId = res.data.data.owner?._id;
        if (channelId) {
          const subCountRes = await axios.get(`/api/v1/subscriptions/c/${channelId}`);
          if (subCountRes.data?.success) {
            setSubscribersCount(subCountRes.data.data.length || 0);
            
            // Check if current user is subscribed
            if (user) {
              const mySub = subCountRes.data.data.some(sub => sub.username === user.username);
              setIsSubscribed(mySub);
            }
          }
        }

        // Check if current user has liked this video
        if (user) {
          const likedRes = await axios.get('/api/v1/likes/videos');
          if (likedRes.data?.success) {
            const hasLiked = likedRes.data.data.some(v => v._id === activeVideoId);
            setIsLiked(hasLiked);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching video details', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideoDetails();
  }, [activeVideoId, user]);

  const handleToggleLike = async () => {
    if (!user) {
      alert('Please sign in to like videos');
      return;
    }
    try {
      const res = await axios.post(`/api/v1/likes/toggle/v/${activeVideoId}`);
      if (res.data?.success) {
        setIsLiked(!isLiked);
      }
    } catch (error) {
      console.error('Error toggling like', error);
    }
  };

  const handleToggleSubscription = async () => {
    if (!user) {
      alert('Please sign in to subscribe to channels');
      return;
    }
    const channelId = video?.owner?._id;
    if (channelId === user._id) {
      alert("You cannot subscribe to your own channel!");
      return;
    }
    try {
      const res = await axios.post(`/api/v1/subscriptions/c/${channelId}`);
      if (res.data?.success) {
        setIsSubscribed(!isSubscribed);
        setSubscribersCount(prev => isSubscribed ? prev - 1 : prev + 1);
      }
    } catch (error) {
      console.error('Error toggling subscription', error);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '500px', flexGrow: 1 }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid var(--border-color)',
          borderTopColor: 'var(--primary)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
      </div>
    );
  }

  if (!video) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', flexGrow: 1 }}>
        <h3 style={{ color: 'var(--danger)' }}>Video not found or deleted</h3>
        <button onClick={() => setActiveVideoId(null)} className="btn btn-secondary" style={{ marginTop: '16px' }}>