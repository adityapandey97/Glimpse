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