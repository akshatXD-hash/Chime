import axios from 'axios';
import { getErrorMessage, SESSION_EXPIRED } from '../utils/errorMessages';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://chime-gjoi.onrender.com';

export const axiosClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 20000, // 20s timeout to accommodate cold starts gracefully
});

axiosClient.interceptors.request.use(
  (config) => {
    let token;
    try { token = localStorage.getItem('chime_token'); } catch { /* Cookie authentication can still work. */ }
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
    const message = getErrorMessage(error);

    // Handle token expiry / 401 Unauthorized
    if (status === 401 && !/\/api\/auth\/(signin|signup)/.test(error.config?.url || '')) {
      // Dispatch custom event so AuthContext can cleanly handle logout and show notification
      window.dispatchEvent(
        new CustomEvent('chime:auth-expired', {
          detail: { message: SESSION_EXPIRED },
        })
      );
    }

    error.message = message;
    return Promise.reject(error);
  }
);

