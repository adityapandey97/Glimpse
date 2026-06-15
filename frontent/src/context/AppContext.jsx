import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

// Configure axios defaults to send credentials/cookies automatically
axios.defaults.withCredentials = true;

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [theme, setTheme] = useState('dark');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('home'); // 'home', 'dashboard', 'liked-videos', 'playlists', 'tweets'
  const [activeVideoId, setActiveVideoId] = useState(null); // Shows video player overlay when set

  // Sync theme with body attribute for Vanilla CSS variables mapping
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Check user authentication status on load
  const checkAuth = async () => {
    try {
      setLoadingUser(true);
      const res = await axios.get('/api/v1/users/me');
      if (res.data?.success) {
        setUser(res.data.data);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoadingUser(false);
    }
  };
