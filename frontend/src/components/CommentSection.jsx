import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import { Send, Trash2, Edit2, Check, X, MessageSquare } from 'lucide-react';

/* Modified by Antigravity: Interactive Comments Section */
const CommentSection = ({ videoId }) => {
  const { user, showToast } = useContext(AppContext);
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

    // Optimistic UI: add comment immediately
    const optimisticComment = {
      _id: `optimistic-${Date.now()}`,
      content: newComment,
      createdAt: new Date().toISOString(),
      owner: { fullName: user.fullName, username: user.username, avatar: user.avatar, _id: user._id }
    };
    setComments(prev => [optimisticComment, ...prev]);
    setNewComment('');

    try {
      const res = await axios.post(`/api/v1/comments/${videoId}`, { content: optimisticComment.content });
      if (res.data?.success) {
        // Replace optimistic with real comment
        setComments(prev => [res.data.data, ...prev.filter(c => c._id !== optimisticComment._id)]);
        showToast('Comment posted!', 'success');
      }
    } catch (error) {
      // Rollback
      setComments(prev => prev.filter(c => c._id !== optimisticComment._id));
      showToast(error.response?.data?.message || 'Failed to post comment. Please try again.', 'error');
    }
  };

  const handleEditComment = async (commentId) => {
    if (!editingText.trim()) return;
    try {
      const res = await axios.patch(`/api/v1/comments/c/${commentId}`, { content: editingText });
      if (res.data?.success) {
        setComments(prev => prev.map(c => c._id === commentId ? { ...c, content: editingText } : c));
        setEditingCommentId(null);
        setEditingText('');
        showToast('Comment updated successfully!', 'success');
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to update comment. Please try again.', 'error');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    try {
      const res = await axios.delete(`/api/v1/comments/c/${commentId}`);
      if (res.data?.success) {
        setComments(prev => prev.filter(c => c._id !== commentId));
        showToast('Comment deleted!', 'success');
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to delete comment. Please try again.', 'error');
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
                
                <div style={{ flexGrow: 1, background: 'var(--bg-secondary)', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  {/* Top: Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                      {commentOwner.fullName || 'User'}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Comment Body / Edit Form */}
                  {editingCommentId === comment._id ? (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                      <input
                        type="text"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="input-field"
                        style={{ padding: '6px 12px', fontSize: '13px' }}
                        autoFocus
                      />
                      <button onClick={() => handleEditComment(comment._id)} className="btn-icon" style={{ color: 'var(--success)' }}>
                        <Check size={16} />
                      </button>
                      <button onClick={() => setEditingCommentId(null)} className="btn-icon" style={{ color: 'var(--danger)' }}>
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                      {comment.content}
                    </p>
                  )}

                  {/* Actions (Edit / Delete) */}
                  {isMyComment && editingCommentId !== comment._id && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px', justifyContent: 'flex-end' }}>
                      <button 
                        onClick={() => { setEditingCommentId(comment._id); setEditingText(comment.content); }} 
                        className="btn-icon" 
                        title="Edit Comment"
                        style={{ padding: '4px' }}
                      >
                        <Edit2 size={13} />
                      </button>
                      <button 
                        onClick={() => handleDeleteComment(comment._id)} 
                        className="btn-icon" 
                        title="Delete Comment"
                        style={{ padding: '4px', color: 'var(--danger)' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CommentSection;
