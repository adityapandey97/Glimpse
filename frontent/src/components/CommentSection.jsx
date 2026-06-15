import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import { Send, Trash2, Edit2, Check, X, MessageSquare } from 'lucide-react';
import { ApiError } from '../../../src/utils/ApiError';

/* Modified by Antigravity: Interactive Comments Section */
const CommentSection = ({ videoId }) => {
  const { user } = useContext(AppContext);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingText, setEditingText] = useState('');

  const fetchComments = async () => {
    if (!videoId) return;
    try {
      setLoading(true);
      const res = await axios.get(`/api/v1/comments/${videoId}`);
      if (res.data?.success) {
        setComments(res.data.data.comments || []);
      }
    } catch (error) {
      console.error('Failed to fetch comments', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [videoId]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const res = await axios.post(`/api/v1/comments/${videoId}`, {
        content: newComment,
      });
      if (res.data?.success) {
        setNewComment('');
        fetchComments(); // Reload comments
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Error posting comment');
    }
  };

  const handleEditComment = async (commentId) => {
    if (!editingText.trim()) return;

    try {
      const res = await axios.patch(`/api/v1/comments/c/${commentId}`, {
        content: editingText,
      });
      if (res.data?.success) {
        setEditingCommentId(null);
        setEditingText('');
        fetchComments();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      const res = await axios.delete(`/api/v1/comments/c/${commentId}`);
      if (res.data?.success) {
        fetchComments();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Error deleting comment');
    }
  };

  return (
    <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
      <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <MessageSquare size={18} />
        <span>Comments ({comments.length})</span>
      </h3>

      {/* Write Comment */}
      {user ? (
        <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <img
            src={user.avatar}
            alt="me"
            style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-full)', objectFit: 'cover' }}
          />
          <div style={{ flexGrow: 1, position: 'relative' }}>
            <input
              type="text"
              placeholder="Add a public comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="input-field"
              style={{ borderRadius: 'var(--radius-full)', paddingRight: '46px' }}
            />
            <button type="submit" className="btn-icon" style={{
              position: 'absolute',
              right: '6px',
              top: '6px',
              color: 'var(--primary)'
            }}>
              <Send size={16} />
            </button>
          </div>
        </form>
      ) : (
        <div style={{
          padding: '16px',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-md)',
          textAlign: 'center',
          color: 'var(--text-secondary)',
          fontSize: '14px',
          marginBottom: '24px'
        }}>
          Please sign in to join the conversation.
        </div>
      )}

      {/* Comments List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-secondary)' }}>Loading comments...</div>
      ) : comments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '14px' }}>
          No comments yet. Be the first to comment!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {comments.map((comment) => {
            const commentOwner = comment.commentby || {};
            const isMyComment = user && commentOwner._id === user._id;

            return (
              <div key={comment._id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }} className="animate-fade">
                <img
                  src={commentOwner.avatar || 'https://via.placeholder.com/32'}
                  alt={commentOwner.username}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--radius-full)',
                    objectFit: 'cover',
                    border: '1px solid var(--border-color)'
                  }}
                />
                