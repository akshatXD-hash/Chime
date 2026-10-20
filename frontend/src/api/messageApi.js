import { axiosClient } from './axiosClient';

export const messageApi = {
  getMessages: async (chatId) => {
    const response = await axiosClient.get(`/api/message/${chatId}`);
    return response.data;
  },

  markRead: async (chatId, messageIds) => {
    const response = await axiosClient.patch(`/api/message/${chatId}/read`, { messageIds });
    return response.data;
  },

  sendMessage: async (content, chatId) => {
    const response = await axiosClient.post('/api/message', { content, chatId });
    return response.data;
  },
};
