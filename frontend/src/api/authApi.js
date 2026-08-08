import { axiosClient } from './axiosClient';

export const authApi = {
  signUp: async (formData) => {
    const response = await axiosClient.post('/api/auth/signup', formData);
    return response.data;
  },

  signIn: async (credentials) => {
    const response = await axiosClient.post('/api/auth/signin', credentials);
    return response.data;
  },

  uploadAvatar: async (imageData) => {
    const response = await axiosClient.post('/api/auth/upload-avatar', imageData);
    return response.data;
  },
};
