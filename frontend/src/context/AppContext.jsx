import React, { createContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';

// Configure axios defaults to send credentials/cookies automatically
axios.defaults.withCredentials = true;
// Set base URL dynamically from environment variable for deployment flexibility
axios.defaults.baseURL = import.meta.env.VITE_API_URL || '';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [theme, setTheme] = useState('dark');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('home');
  const [activeVideoId, setActiveVideoId] = useState(null);
  const [toasts, setToasts] = useState([]);

  // Track whether a token refresh is already in-flight to avoid request stampedes
  const isRefreshing = useRef(false);
  // Queue of requests that failed with 401 while a refresh was ongoing
  const failedQueue = useRef([]);

  // Sync theme with body attribute for Vanilla CSS variables
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const showToast = (message, type = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  // Check user authentication status
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
      // 401 = not logged in, which is normal for guest users
      setUser(null);
    } finally {
      setLoadingUser(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  /**
   * Axios response interceptor:
   * - On 401 responses (access token expired), attempt to refresh the token.
   * - If refresh fails → silently log out.
   * - Queues concurrent requests while the refresh is in-flight.
   */
  useEffect(() => {
    const processQueue = (error, token = null) => {
      failedQueue.current.forEach(({ resolve, reject }) => {
        if (error) { reject(error); } else { resolve(token); }
      });
      failedQueue.current = [];
    };

    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Skip refresh for auth routes and already-retried requests
        const skipRoutes = ['/api/v1/users/login', '/api/v1/users/register', '/api/v1/users/refresh-token', '/api/v1/users/google-login', '/api/v1/users/mobile-auth'];
        const isSkipped = skipRoutes.some(r => originalRequest.url?.includes(r));

        if (error.response?.status === 401 && !originalRequest._retry && !isSkipped) {
          if (isRefreshing.current) {
            // Queue this request until refresh is done
            return new Promise((resolve, reject) => {
              failedQueue.current.push({ resolve, reject });
            }).then(() => axios(originalRequest)).catch((err) => Promise.reject(err));
          }

          originalRequest._retry = true;
          isRefreshing.current = true;

          try {
            await axios.post('/api/v1/users/refresh-token');
            processQueue(null);
            return axios(originalRequest);
          } catch (refreshError) {
            processQueue(refreshError, null);
            // Refresh failed — user is truly logged out
            setUser(null);
            setActiveTab('home');
            setActiveVideoId(null);
            return Promise.reject(refreshError);
          } finally {
            isRefreshing.current = false;
          }
        }

        return Promise.reject(error);
      }
    );

    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  /**
   * Login: tries email login or username login depending on input.
   * Returns { success, message } always — never throws.
   */
  const login = async (usernameOrEmail, password) => {
    try {
      if (!usernameOrEmail || !password) {
        return { success: false, message: 'Username/email and password are required.' };
      }

      const payload = {};
      // Detect email vs username: emails contain '@'
      if (usernameOrEmail.includes('@')) {
        payload.email = usernameOrEmail.trim().toLowerCase();
      } else {
        payload.username = usernameOrEmail.trim().toLowerCase();
      }
      payload.password = password;

      const res = await axios.post('/api/v1/users/login', payload);
      if (res.data?.success) {
        setUser(res.data.data.user);
        return { success: true };
      }
      return { success: false, message: res.data?.message || 'Login failed. Please try again.' };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Login failed. Please check your credentials and try again.';
      return { success: false, message };
    }
  };

  /**
   * Register: sends FormData (multipart) to backend.
   * Returns the raw response data, or an error object.
   */
  const register = async (formData) => {
    try {
      if (!(formData instanceof FormData)) {
        return { success: false, message: 'Invalid registration data format.' };
      }

      const res = await axios.post('/api/v1/users/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000, // 30-second timeout for avatar upload
      });
      return res.data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Registration failed. Please try again.';
      return { success: false, message };
    }
  };

  /**
   * Logout: clears server session cookies and resets client state.
   */
  const logout = async () => {
    try {
      await axios.post('/api/v1/users/logout');
    } catch (error) {
      // Even if the server request fails, clear the local state
      console.error('Logout error:', error.message);
    } finally {
      setUser(null);
      setActiveTab('home');
      setActiveVideoId(null);
    }
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        loadingUser,
        checkAuth,
        theme,
        toggleTheme,
        searchQuery,
        setSearchQuery,
        activeTab,
        setActiveTab,
        activeVideoId,
        setActiveVideoId,
        login,
        register,
        logout,
        toasts,
        setToasts,
        showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
