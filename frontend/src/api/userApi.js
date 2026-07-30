import { axiosClient } from './axiosClient';

export const userApi = {
  searchUsers: async (searchQuery = '') => {
    const response = await axiosClient.get(`/api/user?search=${encodeURIComponent(searchQuery)}`);
    return response.data;
  },
};
