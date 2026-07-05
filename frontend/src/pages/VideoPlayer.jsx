import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import CommentSection from '../components/CommentSection';
import axios from 'axios';
import { ThumbsUp, UserPlus, UserMinus, Eye, Calendar, Sparkles, ArrowLeft } from 'lucide-react';

/* Modified by Antigravity: Premium YouTube/Instagram Video Player Page */
const VideoPlayer = () => {
  const { user, activeVideoId, setActiveVideoId, showToast } = useContext(AppContext);
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);
  
  // Interaction states
  const [isLiked, setIsLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [userReaction, setUserReaction] = useState(null);
  const [reactionsBreakdown, setReactionsBreakdown] = useState({ "👍": 0, "❤️": 0, "😂": 0, "😮": 0, "😢": 0, "😡": 0 });
  const [totalLikesCount, setTotalLikesCount] = useState(0);
  const [showEmojiBar, setShowEmojiBar] = useState(false);

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

        // Fetch channel followers count
        const channelId = res.data.data.owner?._id;
        if (channelId) {
          const subCountRes = await axios.get(`/api/v1/follows/c/${channelId}`);
          if (subCountRes.data?.success) {
            setFollowersCount(subCountRes.data.data.length || 0);
            
            // Check if current user is following
            if (user) {
              const mySub = subCountRes.data.data.some(sub => sub.username === user.username);
              setIsFollowing(mySub);
            }
          }
        }

        // Check user reactions and emoji breakdown
        try {
          const reactionsRes = await axios.get(`/api/v1/likes/video/${activeVideoId}/reactions`);
          if (reactionsRes.data?.success) {
            const { totalLikes, reactions, userReaction: uReact } = reactionsRes.data.data;
            setTotalLikesCount(totalLikes);
            setReactionsBreakdown(reactions || { "👍": 0, "❤️": 0, "😂": 0, "😮": 0, "😢": 0, "😡": 0 });
            setUserReaction(uReact);
            setIsLiked(!!uReact);
          }
        } catch (err) {
          console.error("Error fetching reactions", err);
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

  const handleReactionClick = async (emoji) => {
    if (!user) {
      showToast('Please sign in to react to videos', 'warning');
      return;
    }
    try {
      const res = await axios.post(`/api/v1/likes/toggle/v/${activeVideoId}`, { emoji });
      if (res.data?.success) {
        const oldReaction = userReaction;
        if (oldReaction === emoji) {
          setUserReaction(null);
          setIsLiked(false);
          setTotalLikesCount(prev => Math.max(0, prev - 1));
          setReactionsBreakdown(prev => ({
            ...prev,
            [emoji]: Math.max(0, (prev[emoji] || 0) - 1)
          }));
          showToast('Reaction removed', 'info');
        } else {
          setUserReaction(emoji);
          setIsLiked(true);
          setReactionsBreakdown(prev => {
            const nextReactions = { ...prev };
            if (oldReaction) {
              nextReactions[oldReaction] = Math.max(0, (nextReactions[oldReaction] || 0) - 1);
            } else {
              setTotalLikesCount(t => t + 1);
            }
            nextReactions[emoji] = (nextReactions[emoji] || 0) + 1;
            return nextReactions;
          });
          showToast(`Reacted with ${emoji}!`, 'success');
        }
        setShowEmojiBar(false);
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Error updating reaction', 'error');
    }
  };

  const handleToggleLike = async () => {
    if (!user) {
      showToast('Please sign in to like videos', 'warning');
      return;
    }
    const emojiToToggle = userReaction || "👍";
    await handleReactionClick(emojiToToggle);
  };

  const handleToggleFollow = async () => {
    if (!user) {
      showToast('Please sign in to follow creators', 'warning');
      return;
    }
    const channelId = video?.owner?._id;
    if (channelId === user._id) {
      showToast("You cannot follow yourself!", 'warning');
      return;
    }
    try {
      const res = await axios.post(`/api/v1/follows/c/${channelId}`);
      if (res.data?.success) {
        const nextFollowing = !isFollowing;
        setIsFollowing(nextFollowing);
        setFollowersCount(prev => isFollowing ? prev - 1 : prev + 1);
        showToast(nextFollowing ? 'Creator followed successfully!' : 'Creator unfollowed successfully!', 'success');
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Error updating follow status', 'error');
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
          Back to Home
        </button>
      </div>
    );
  }

  const views = typeof video.views === 'number' ? video.views : (video.views?.length || 0);
  const owner = video.owner || {};

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      padding: '24px',
      flexGrow: 1,
      overflowY: 'auto',
      maxWidth: '1400px',
      margin: '0 auto',
      width: '100%'
    }} className="animate-fade">
      {/* Back Button */}
      <div>
        <button onClick={() => setActiveVideoId(null)} className="btn btn-secondary" style={{ borderRadius: 'var(--radius-full)', padding: '6px 16px' }}>
          <ArrowLeft size={16} />
          <span>Back to Feed</span>
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '24px',
        width: '100%',
        alignItems: 'flex-start',
        // Desktop breakpoint style
        '@media (min-width: 992px)': {
          gridTemplateColumns: '2fr 1fr'
        }
      }}
      className="video-detail-grid"
      >
        {/* Main Video & Content Area */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Video Player */}
          <div style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '16/9',
            background: '#000',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-md)'
          }}>
            <video
              src={video.videoFile}
              controls
              autoPlay
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>

          {/* Title */}
          <h1 style={{ fontSize: '22px', fontWeight: '700', marginTop: '16px', color: 'var(--text-primary)' }}>
            {video.title}
          </h1>

          {/* Metadata & Actions Panel */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
            marginTop: '12px',
            paddingBottom: '16px',
            borderBottom: '1px solid var(--border-color)'
          }}>
            {/* Uploader Channel Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img
                src={owner.avatar || 'https://via.placeholder.com/40'}
                alt={owner.username}
                style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-full)', objectFit: 'cover', border: '1px solid var(--border-color)' }}
              />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {owner.fullName || 'Channel'}
                  <Sparkles size={12} style={{ color: 'var(--accent)' }} />
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {followersCount} followers
                </span>
              </div>

              {/* Follow button */}
              {user && owner._id !== user._id && (
                <button
                  onClick={handleToggleFollow}
                  className={isFollowing ? 'btn btn-secondary' : 'btn btn-primary'}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '12px',
                    marginLeft: '12px'
                  }}
                >
                  {isFollowing ? <UserMinus size={14} /> : <UserPlus size={14} />}
                  <span>{isFollowing ? 'Following' : 'Follow'}</span>
                </button>
              )}
            </div>

            {/* Like, Share, and Metrics */}
            <div style={{ display: 'flex', gap: '8px', position: 'relative' }}
                 onMouseEnter={() => setShowEmojiBar(true)}
                 onMouseLeave={() => setShowEmojiBar(false)}>
              
              {/* Floating Emoji Bar */}
              {showEmojiBar && user && (
                <div style={{
                  position: 'absolute',
                  bottom: '45px',
                  left: '0',
                  background: 'rgba(30, 30, 40, 0.95)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-full)',
                  padding: '6px 12px',
                  display: 'flex',
                  gap: '10px',
                  boxShadow: 'var(--shadow-lg)',
                  zIndex: 10,
                  animation: 'slideUp 0.2s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards'
                }}>
                  {["👍", "❤️", "😂", "😮", "😢", "😡"].map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => handleReactionClick(emoji)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        fontSize: '20px',
                        cursor: 'pointer',
                        transition: 'transform 0.15s ease',
                        padding: '2px'
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.35)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={handleToggleLike}
                className={isLiked ? 'btn btn-primary' : 'btn btn-secondary'}
                style={{ 
                  borderRadius: 'var(--radius-full)', 
                  padding: '8px 18px', 
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {isLiked ? (
                  <span style={{ fontSize: '15px' }}>{userReaction}</span>
                ) : (
                  <ThumbsUp size={16} />
                )}
                <span>{isLiked ? 'Reacted' : 'Like'}</span>
                
                {/* Total Likes Badge */}
                {totalLikesCount > 0 && (
                  <span style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    marginLeft: '4px'
                  }}>
                    {totalLikesCount}
                  </span>
                )}
              </button>

              {/* Emoji breakdown mini display */}
              {totalLikesCount > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '8px' }}>
                  {Object.entries(reactionsBreakdown)
                    .filter(([_, count]) => count > 0)
                    .map(([emoji, count]) => (
                      <span key={emoji} style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '2px', background: 'rgba(255, 255, 255, 0.05)', padding: '2px 8px', borderRadius: 'var(--radius-full)', border: '1px solid rgba(255, 255, 255, 0.03)' }} title={`${count} reactions`}>
                        {emoji} <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>{count}</span>
                      </span>
                    ))
                  }
                </div>
              )}
            </div>
          </div>

          {/* Description Box */}
          <div className="glass-panel" style={{
            marginTop: '16px',
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            fontSize: '14px',
            lineHeight: '1.5',
            color: 'var(--text-secondary)'
          }}>
            <div style={{ display: 'flex', gap: '16px', color: 'var(--text-primary)', fontWeight: '600', marginBottom: '8px', fontSize: '13px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Eye size={14} /> {views} views
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={14} /> Published {new Date(video.createdAt).toLocaleDateString()}
              </span>
            </div>
            <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{video.description}</p>
          </div>

          {/* Comments */}
          <CommentSection videoId={video._id} />
        </div>

        {/* Sidebar Recommended Column */}
        <div className="recommendations-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
            Recommended Videos
          </h3>

          {recommendations.length === 0 ? (
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No recommended videos found.</div>
          ) : (
            recommendations.map((rec) => {
              const recOwner = rec.owner || {};
              return (
                <div
                  key={rec._id}
                  onClick={() => setActiveVideoId(rec._id)}
                  style={{
                    display: 'flex',
                    gap: '12px',
                    cursor: 'pointer',
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden',
                    transition: 'opacity var(--transition-fast)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = 0.8}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = 1}
                >
                  {/* Small Thumbnail */}
                  <div style={{ width: '120px', aspectRatio: '16/9', background: '#000', borderRadius: '6px', overflow: 'hidden', flexShrink: 0 }}>
                    <img
                      src={rec.thumbnail}
                      alt={rec.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  {/* Rec Info */}
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <span style={{
                      fontSize: '13px',
                      fontWeight: '600',
                      color: 'var(--text-primary)',
                      lineHeight: '1.2',
                      marginBottom: '4px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {rec.title}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '2px' }}>
                      {recOwner.fullName || 'Creator'}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      {(typeof rec.views === 'number' ? rec.views : (rec.views?.length || 0))} views
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      
      {/* Styles for dynamic responsiveness */}
      <style>{`
        .video-detail-grid {
          display: grid;
          grid-template-columns: 1fr;
        }
        @media (min-width: 992px) {
          .video-detail-grid {
            grid-template-columns: 2fr 1fr;
          }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default VideoPlayer;
