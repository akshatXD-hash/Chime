import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://chime-gjoi.onrender.com';

export const axiosClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 20000, // 20s timeout to accommodate cold starts gracefully
});

axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('chime_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Let the browser set Content-Type (with boundary) for FormData;
    // default to JSON for everything else.
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    } else if (!config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json';
    }

    return config;
  },
  (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message || 'An error occurred';

    // Handle token expiry / 401 Unauthorized
    if (status === 401) {
      // Dispatch custom event so AuthContext can cleanly handle logout and show notification
      window.dispatchEvent(
        new CustomEvent('chime:auth-expired', {
          detail: { message: message || 'Your session has expired. Please sign in again.' },
        })
      );
    }

    return Promise.reject(new Error(message));
  }
);

