import React, { useState, useEffect, useRef, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import { MessageSquare, Send, Image, Video, X, User, Paperclip, AlertCircle, Smile, ArrowLeft } from 'lucide-react';

const ChatView = () => {
  const { user } = useContext(AppContext);
  const [connections, setConnections] = useState([]);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingConnections, setLoadingConnections] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  
  // Message input states
  const [textInput, setTextInput] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [sending, setSending] = useState(false);

  // Search connection
  const [searchQuery, setSearchQuery] = useState('');

  // Responsive mobile state
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const messagesEndRef = useRef(null);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);

  // Fetch connections
  const fetchConnections = async () => {
    try {
      setLoadingConnections(true);
      const res = await axios.get('/api/v1/chat/connections');
      if (res.data?.success) {
        setConnections(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching chat connections', err);
    } finally {
      setLoadingConnections(false);
    }
  };

  // Fetch message history for selected connection
  const fetchMessages = async (connectionId) => {
    try {
      setLoadingMessages(true);
      const res = await axios.get(`/api/v1/chat/history/${connectionId}`);
      if (res.data?.success) {
        setMessages(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching message history', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchConnections();
    }
  }, [user]);

  useEffect(() => {
    if (selectedConnection) {
      fetchMessages(selectedConnection._id);
    }
  }, [selectedConnection]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle image select
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      // Clear video
      setSelectedVideo(null);
      setVideoPreview(null);
    }
  };

  // Handle video select
  const handleVideoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedVideo(file);
      setVideoPreview(URL.createObjectURL(file));
      // Clear image
      setSelectedImage(null);
      setImagePreview(null);
    }
  };

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!selectedConnection) return;
    if (!textInput.trim() && !selectedImage && !selectedVideo) return;

    setSending(true);
    const formData = new FormData();
    formData.append('receiverId', selectedConnection._id);
    formData.append('text', textInput);
    if (selectedImage) formData.append('image', selectedImage);
    if (selectedVideo) formData.append('video', selectedVideo);

    try {
      const res = await axios.post('/api/v1/chat/send', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.success) {
        setMessages(prev => [...prev, res.data.data]);
        
        // Reset input fields
        setTextInput('');
        setSelectedImage(null);
        setSelectedVideo(null);
        setImagePreview(null);
        setVideoPreview(null);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const filteredConnections = connections.filter(conn =>
    conn.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conn.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) {
    return (
      <div style={{ padding: '40px 24px', textAlign: 'center', flexGrow: 1 }}>
        <h3>Please sign in to access Glimpse Chat.</h3>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexGrow: 1,
      height: '100%',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      fontFamily: 'var(--font-sans)',
      overflow: 'hidden'
    }} className="animate-fade">
      
      {/* Sidebar - Contacts List */}
      {(!isMobile || !selectedConnection) && (
        <div style={{
          width: isMobile ? '100%' : '320px',
          borderRight: isMobile ? 'none' : '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(255, 255, 255, 0.01)',
          flexShrink: 0
        }} className="chat-sidebar-pane">
          {/* Sidebar Header */}
          <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={20} style={{ color: 'var(--primary)' }} />
              Glimpse Chat
            </h2>
            <input
              type="text"
              placeholder="Search connections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field"
              style={{ padding: '8px 12px', fontSize: '13px', borderRadius: 'var(--radius-md)' }}
            />
          </div>

          {/* Contacts Scroll Container */}
          <div style={{ flexGrow: 1, overflowY: 'auto', padding: '10px' }}>
            {loadingConnections ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                <div className="spinner" style={{ width: '24px', height: '24px', border: '3px solid var(--border-color)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              </div>
            ) : filteredConnections.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-muted)', fontSize: '13px' }}>
                <AlertCircle size={30} style={{ marginBottom: '8px', opacity: 0.5 }} />
                <p>No followers or followed users found to chat with.</p>
                <p style={{ fontSize: '11px', marginTop: '4px' }}>Follow creators to start chatting!</p>
              </div>
            ) : (
              filteredConnections.map(conn => {
                const isActive = selectedConnection?._id === conn._id;
                return (
                  <div
                    key={conn._id}
                    onClick={() => setSelectedConnection(conn)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      background: isActive ? 'var(--primary-glow)' : 'transparent',
                      transition: 'all var(--transition-fast)',
                      marginBottom: '6px'
                    }}
                    onMouseEnter={e => {
                      if (!isActive) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                    }}
                    onMouseLeave={e => {
                      if (!isActive) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <img
                      src={conn.avatar}
                      alt=""
                      style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-color)' }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <span style={{ fontWeight: '600', fontSize: '14px', color: isActive ? '#fff' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {conn.fullName}
                      </span>
                      <span style={{ fontSize: '12px', color: isActive ? 'rgba(255,255,255,0.7)' : 'var(--text-secondary)' }}>
                        @{conn.username}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Right Pane - Chat Window */}
      {(!isMobile || selectedConnection) && (
        <div style={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.1)',
          position: 'relative'
        }}>
          {selectedConnection ? (
            <>
              {/* Chat Pane Header */}
              <div style={{
                height: '70px',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 24px',
                background: 'rgba(255,255,255,0.01)',
                backdropFilter: 'blur(4px)',
                zIndex: 5
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {isMobile && (
                    <button
                      onClick={() => setSelectedConnection(null)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        padding: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: '6px'
                      }}
                      title="Back to Chats"
                    >
                      <ArrowLeft size={20} />
                    </button>
                  )}
                  <img
                    src={selectedConnection.avatar}
                    alt=""
                    style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-color)' }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: '700', fontSize: '15px' }}>{selectedConnection.fullName}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>@{selectedConnection.username}</span>
                  </div>
                </div>
              </div>

            {/* Scrollable Messages Area */}
            <div style={{
              flexGrow: 1,
              overflowY: 'auto',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              {loadingMessages ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <div className="spinner" style={{ width: '30px', height: '30px', border: '3px solid var(--border-color)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                </div>
              ) : messages.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                  <Smile size={32} style={{ marginBottom: '10px', opacity: 0.4 }} />
                  <p>Send a message to start the conversation!</p>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isMe = msg.sender?._id === user._id;
                  return (
                    <div
                      key={msg._id || index}
                      style={{
                        display: 'flex',
                        justifyContent: isMe ? 'flex-end' : 'flex-start',
                        width: '100%'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isMe ? 'flex-end' : 'flex-start',
                        maxWidth: '70%'
                      }}>
                        {/* Bubble */}
                        <div style={{
                          background: isMe ? 'var(--primary-glow)' : 'var(--bg-secondary)',
                          color: '#fff',
                          padding: '12px 16px',
                          borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                          border: isMe ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid var(--border-color)',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                          wordBreak: 'break-word'
                        }}>
                          {/* Image Attachments */}
                          {msg.image && (
                            <div style={{ marginBottom: '8px', borderRadius: '8px', overflow: 'hidden', maxWidth: '300px' }}>
                              <img
                                src={msg.image}
                                alt="Shared Attachment"
                                style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', cursor: 'zoom-in' }}
                                onClick={() => window.open(msg.image, '_blank')}
                              />
                            </div>
                          )}
                          
                          {/* Video Attachments */}
                          {msg.video && (
                            <div style={{ marginBottom: '8px', borderRadius: '8px', overflow: 'hidden', maxWidth: '300px', background: '#000' }}>
                              <video
                                src={msg.video}
                                controls
                                style={{ width: '100%', maxHeight: '200px' }}
                              />
                            </div>
                          )}

                          {msg.text && <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.4' }}>{msg.text}</p>}
                        </div>
                        
                        {/* Timestamp */}
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', padding: '0 4px' }}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Previews Panel */}
            {(imagePreview || videoPreview) && (
              <div style={{
                padding: '12px 24px',
                background: 'var(--bg-secondary)',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                gap: '16px',
                alignItems: 'center',
                position: 'relative'
              }}>
                {imagePreview && (
                  <div style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                    <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      onClick={() => { setSelectedImage(null); setImagePreview(null); }}
                      style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', padding: '2px', cursor: 'pointer' }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}

                {videoPreview && (
                  <div style={{ position: 'relative', width: '120px', height: '80px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-color)', background: '#000' }}>
                    <video src={videoPreview} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    <button
                      onClick={() => { setSelectedVideo(null); setVideoPreview(null); }}
                      style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', padding: '2px', cursor: 'pointer' }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
                
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Ready to upload attachment</span>
              </div>
            )}

            {/* Input Send Area */}
            <form onSubmit={handleSendMessage} style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: 'rgba(255,255,255,0.01)'
            }}>
              {/* Image Input Ref trigger */}
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="btn-icon"
                title="Attach Image"
                style={{ color: 'var(--text-secondary)' }}
              >
                <Image size={20} />
              </button>
              <input
                type="file"
                accept="image/*"
                ref={imageInputRef}
                onChange={handleImageSelect}
                style={{ display: 'none' }}
              />

              {/* Video Input Ref trigger */}
              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                className="btn-icon"
                title="Attach Video"
                style={{ color: 'var(--text-secondary)' }}
              >
                <Video size={20} />
              </button>
              <input
                type="file"
                accept="video/*"
                ref={videoInputRef}
                onChange={handleVideoSelect}
                style={{ display: 'none' }}
              />

              <input
                type="text"
                placeholder="Type your message here..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                disabled={sending}
                className="input-field"
                style={{ borderRadius: 'var(--radius-full)', flexGrow: 1, padding: '12px 18px' }}
              />

              <button
                type="submit"
                className="btn btn-primary"
                disabled={sending || (!textInput.trim() && !selectedImage && !selectedVideo)}
                style={{ borderRadius: 'var(--radius-full)', width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
              >
                {sending ? (
                  <div className="spinner" style={{ width: '16px', height: '16px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                ) : (
                  <Send size={16} />
                )}
              </button>
            </form>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, padding: '40px', color: 'var(--text-secondary)' }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'var(--primary-glow)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              marginBottom: '20px',
              boxShadow: 'var(--shadow-glow)'
            }}>
              <MessageSquare size={36} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>Your Messages</h3>
            <p style={{ fontSize: '14px', maxWidth: '300px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Select a connection from the left sidebar to start chatting with your followers or creators.
            </p>
          </div>
        )}
      </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          .chat-sidebar-pane {
            width: 100% !important;
          }
        }
      ` }} />
    </div>
  );
};

export default ChatView;
