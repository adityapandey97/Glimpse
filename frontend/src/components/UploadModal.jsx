import React, { useState, useContext } from 'react';
import axios from 'axios';
import { X, Film, Image, Type, FileText, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { AppContext } from '../context/AppContext';

// Allowed video MIME types
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/mpeg', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv', 'video/3gpp'];
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg'];
const MAX_VIDEO_SIZE_MB = 50;
const MAX_THUMB_SIZE_MB = 5;

const UploadModal = ({ onClose, onUploadSuccess }) => {
  const { showToast } = useContext(AppContext);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);

  // Status states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [progress, setProgress] = useState(0);
  const [uploadPhase, setUploadPhase] = useState(''); // 'uploading' | 'processing' | ''

  /**
   * Validate video file: type + size
   * Returns null on success, or error string on failure.
   */
  const validateVideoFile = (file) => {
    if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
      return `Unsupported video format "${file.type.split('/')[1]?.toUpperCase() || file.name.split('.').pop()}". Allowed formats: MP4, WebM, OGG, MOV, AVI.`;
    }
    const sizeMB = file.size / 1024 / 1024;
    if (sizeMB > MAX_VIDEO_SIZE_MB) {
      return `Video file is too large (${sizeMB.toFixed(1)}MB). Maximum allowed size is ${MAX_VIDEO_SIZE_MB}MB.`;
    }
    return null;
  };

  /**
   * Validate thumbnail image file: type + size
   * Returns null on success, or error string on failure.
   */
  const validateThumbnailFile = (file) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return `Unsupported image format. Allowed formats: JPEG, PNG, WebP, GIF.`;
    }
    const sizeMB = file.size / 1024 / 1024;
    if (sizeMB > MAX_THUMB_SIZE_MB) {
      return `Thumbnail is too large (${sizeMB.toFixed(1)}MB). Maximum allowed size is ${MAX_THUMB_SIZE_MB}MB.`;
    }
    return null;
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const err = validateVideoFile(file);
    if (err) {
      setErrorMsg(err);
      e.target.value = ''; // Reset input
      return;
    }
    setErrorMsg('');
    setVideoFile(file);
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const err = validateThumbnailFile(file);
    if (err) {
      setErrorMsg(err);
      e.target.value = '';
      return;
    }
    setErrorMsg('');
    setThumbnail(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // --- Client-side validation ---
    if (!title.trim()) {
      setErrorMsg('Video title is required.');
      return;
    }
    if (title.trim().length < 3) {
      setErrorMsg('Title must be at least 3 characters long.');
      return;
    }
    if (!description.trim()) {
      setErrorMsg('Video description is required.');
      return;
    }
    if (!videoFile) {
      setErrorMsg('Please select a video file to upload.');
      return;
    }
    if (!thumbnail) {
      setErrorMsg('Please select a thumbnail image.');
      return;
    }

    // Re-validate files in case the user manipulated them
    const videoErr = validateVideoFile(videoFile);
    if (videoErr) { setErrorMsg(videoErr); return; }
    const thumbErr = validateThumbnailFile(thumbnail);
    if (thumbErr) { setErrorMsg(thumbErr); return; }

    setErrorMsg('');
    setLoading(true);
    setUploadPhase('uploading');
    setProgress(0);

    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('description', description.trim());
    formData.append('videoFile', videoFile);
    formData.append('thumbnail', thumbnail);

    try {
      const res = await axios.post('/api/v1/videos/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 5 * 60 * 1000, // 5-minute timeout for large video uploads
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setProgress(percentCompleted);
            // When client upload finishes, switch phase to indicate server processing
            if (percentCompleted >= 100) {
              setUploadPhase('processing');
            }
          }
        }
      });

      if (res.data?.success) {
        showToast('🎬 Video uploaded and published successfully!', 'success');
        if (onUploadSuccess) onUploadSuccess();
        onClose();
      } else {
        const msg = res.data?.message || 'Failed to upload video. Please try again.';
        setErrorMsg(msg);
        showToast(msg, 'error');
      }
    } catch (err) {
      let errMsg = 'Error occurred while uploading video. Please try again.';

      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        errMsg = 'Upload timed out. Your video may be too large or your connection is slow. Try a smaller file.';
      } else if (err.response?.status === 413) {
        errMsg = `File too large for the server. Please use a video under ${MAX_VIDEO_SIZE_MB}MB.`;
      } else if (err.response?.status === 400) {
        errMsg = err.response.data?.message || 'Invalid upload request. Please check your files and try again.';
      } else if (err.response?.status === 401) {
        errMsg = 'Your session expired. Please log in again to upload videos.';
      } else if (err.response?.status === 500) {
        errMsg = 'Server error during upload. Please try again later.';
      } else if (err.response?.data?.message) {
        errMsg = err.response.data.message;
      } else if (!navigator.onLine) {
        errMsg = 'No internet connection. Please check your network and try again.';
      }

      setErrorMsg(errMsg);
      showToast(errMsg, 'error');
    } finally {
      setLoading(false);
      setUploadPhase('');
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
          maxWidth: '520px',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          position: 'relative',
          padding: '32px',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border-color)',
          maxHeight: '90vh',
          overflowY: 'auto'
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

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
          <Film size={22} style={{ color: 'var(--primary)' }} />
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
            Upload Video
          </h2>
        </div>

        {/* Size hints */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 14px',
          marginBottom: '18px',
          fontSize: '12px',
          color: 'var(--text-muted)',
          lineHeight: '1.6'
        }}>
          <strong style={{ color: 'var(--text-secondary)' }}>Upload limits:</strong> Video max 50MB (MP4, WebM, MOV, AVI) &bull; Thumbnail max 5MB (JPEG, PNG, WebP, GIF) &bull; Max duration 10 min
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
            alignItems: 'flex-start',
            gap: '8px'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Video File */}
          <div className="form-group">
            <label className="input-label">
              Video File <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <label
                className="btn btn-secondary"
                style={{ flexGrow: 1, fontSize: '13px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}
              >
                <Upload size={16} />
                <span>{videoFile ? 'Change Video' : 'Choose Video File'}</span>
                <input
                  type="file"
                  accept="video/mp4,video/mpeg,video/webm,video/ogg,video/quicktime,video/x-msvideo,video/x-ms-wmv,video/3gpp"
                  onChange={handleVideoChange}
                  style={{ display: 'none' }}
                  disabled={loading}
                />
              </label>
              <div style={{ fontSize: '12px', color: videoFile ? 'var(--text-secondary)' : 'var(--text-muted)', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {videoFile ? (
                  <span>
                    {videoFile.name}
                    <br />
                    <span style={{ color: 'var(--success)', fontSize: '11px' }}>
                      ✓ {(videoFile.size / 1024 / 1024).toFixed(1)}MB
                    </span>
                  </span>
                ) : 'No file chosen'}
              </div>
            </div>
          </div>

          {/* Thumbnail */}
          <div className="form-group">
            <label className="input-label">
              Thumbnail Image <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Live preview */}
              {thumbnailPreview ? (
                <img
                  src={thumbnailPreview}
                  alt="Thumbnail preview"
                  style={{ width: '56px', height: '40px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', flexShrink: 0 }}
                />
              ) : (
                <div style={{ width: '56px', height: '40px', background: 'var(--bg-secondary)', border: '2px dashed var(--border-color)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Image size={16} style={{ color: 'var(--text-muted)' }} />
                </div>
              )}
              <label
                className="btn btn-secondary"
                style={{ flexGrow: 1, fontSize: '13px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}
              >
                <Image size={16} />
                <span>{thumbnail ? 'Change Thumbnail' : 'Choose Thumbnail'}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleThumbnailChange}
                  style={{ display: 'none' }}
                  disabled={loading}
                />
              </label>
            </div>
          </div>

          {/* Title */}
          <div className="form-group">
            <label className="input-label">
              Title <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Catchy video title (min 3 chars)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field"
                style={{ paddingLeft: '40px' }}
                maxLength={200}
                required
                disabled={loading}
              />
              <Type size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
              {title.length}/200 characters
            </span>
          </div>

          {/* Description */}
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="input-label">
              Description <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <textarea
                placeholder="What is this video about? (min 10 chars)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input-field"
                style={{ paddingLeft: '40px', minHeight: '80px', resize: 'vertical' }}
                maxLength={2000}
                required
                disabled={loading}
              />
              <FileText size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
              {description.length}/2000 characters
            </span>
          </div>

          {/* Progress Bar */}
          {loading && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                <span>
                  {uploadPhase === 'processing'
                    ? '⚙️ Server processing video...'
                    : `📤 Uploading to server...`
                  }
                </span>
                <span style={{ fontWeight: '600' }}>{uploadPhase === 'processing' ? '100%' : `${progress}%`}</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                <div style={{
                  width: uploadPhase === 'processing' ? '100%' : `${progress}%`,
                  height: '100%',
                  background: uploadPhase === 'processing' ? 'var(--success)' : 'var(--primary-glow)',
                  transition: 'width 0.2s ease',
                  backgroundImage: uploadPhase === 'processing' ? 'linear-gradient(90deg, var(--success), var(--primary))' : 'none'
                }}></div>
              </div>
              {uploadPhase === 'processing' && (
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', textAlign: 'center' }}>
                  This may take a moment for large videos. Please don't close this window.
                </p>
              )}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px' }}
            disabled={loading}
          >
            {loading
              ? (uploadPhase === 'processing' ? 'Processing on server...' : `Uploading (${progress}%)...`)
              : '🚀 Publish Video'
            }
          </button>
        </form>
      </div>
    </div>
  );
};

export default UploadModal;
