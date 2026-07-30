import { axiosClient } from './axiosClient';

export const authApi = {
  signUp: async (formData) => {
    // If formData is an instance of FormData, send multipart/form-data
    const isFormData = formData instanceof FormData;
    const response = await axiosClient.post('/api/auth/signup', formData, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return response.data;
  },

  signIn: async (credentials) => {
    const response = await axiosClient.post('/api/auth/signin', credentials);
    return response.data;
  },

  uploadAvatar: async (imageData) => {
    const isFormData = imageData instanceof FormData;
    const response = await axiosClient.post('/api/auth/upload-avatar', imageData, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return response.data;
  },
};
