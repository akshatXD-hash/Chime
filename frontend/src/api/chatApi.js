import { axiosClient } from './axiosClient';

export const chatApi = {
  accessChat: async (userId) => {
    const response = await axiosClient.post('/api/chat', { userId });
    return response.data;
  },

  fetchChats: async () => {
    const response = await axiosClient.get('/api/chat');
    return response.data;
  },

  createGroupChat: async (name, userIds) => {
    const response = await axiosClient.post('/api/chat/group', { name, users: userIds });
    return response.data;
  },

  renameGroup: async (chatId, chatName) => {
    const response = await axiosClient.put('/api/chat/rename', { chatId, chatName });
    return response.data;
  },

  removeFromGroup: async (chatId, userId) => {
    const response = await axiosClient.put('/api/chat/groupremove', { chatId, userId });
    return response.data;
  },

  addToGroup: async (chatId, userId) => {
    const response = await axiosClient.put('/api/chat/groupadd', { chatId, userId });
    return response.data;
  },
};
