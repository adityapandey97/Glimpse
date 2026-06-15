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
          padding: '32px',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border-color)'
        }}
      >
        {/* Close Button */}
        <button onClick={onClose} className="btn-icon" style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          color: 'var(--text-secondary)'
        }} disabled={loading}>
          <X size={20} />
        </button>

        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
          <Film size={22} style={{ color: 'var(--primary)' }} />
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
            Upload Video
          </h2>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: 'var(--danger)',
            padding: '12px',
            borderRadius: 'var(--radius-md)',
            fontSize: '13px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="input-label">Video File (Required)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <label className="btn btn-secondary" style={{ flexGrow: 1, fontSize: '13px', cursor: 'pointer' }} disabled={loading}>
                <Upload size={16} />
                <span>Choose Video File</span>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setVideoFile(e.target.files[0])}
                  style={{ display: 'none' }}
                  required
                />
              </label>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {videoFile ? videoFile.name : 'No file chosen'}
              </span>
            </div>
          </div>

          <div className="form-group">
            <label className="input-label">Thumbnail Image (Required)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <label className="btn btn-secondary" style={{ flexGrow: 1, fontSize: '13px', cursor: 'pointer' }} disabled={loading}>
                <Image size={16} />
                <span>Choose Thumbnail</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setThumbnail(e.target.files[0])}
                  style={{ display: 'none' }}
                  required
                />
              </label>