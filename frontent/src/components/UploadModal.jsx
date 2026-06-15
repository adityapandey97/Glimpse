import React, { useState } from 'react';
import axios from 'axios';
import { X, Film, Image, Type, FileText, Upload, AlertCircle } from 'lucide-react';

/* Modified by Antigravity: Interactive Video Upload Modal */
const UploadModal = ({ onClose, onUploadSuccess }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);
  
  // Status states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [progress, setProgress] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description || !videoFile || !thumbnail) {
      setErrorMsg('All fields are required');
      return;
    }
    
    setErrorMsg('');
    setLoading(true);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('videoFile', videoFile);
    formData.append('thumbnail', thumbnail);

    try {
      const res = await axios.post('/api/v1/videos/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percentCompleted);
        }
      });

      if (res.data?.success) {
        alert('Video uploaded successfully!');
        if (onUploadSuccess) onUploadSuccess();
        onClose();
      } else {
        setErrorMsg(res.data?.message || 'Failed to upload video');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error occurred while uploading video');
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 200,
      padding: '16px',
      backdropFilter: 'blur(4px)'
    }}>
      <div 
        className="glass-panel animate-scale" 
        style={{
          width: '100%',
          maxWidth: '500px',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          position: 'relative',