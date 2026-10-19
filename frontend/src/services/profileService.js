import apiClient from './apiClient';

export const getProfileByUserId = async (userId) => {
  const { data } = await apiClient.get(`/profile/${userId}`);
  return data.data;
};

export const updateProfile = async (userId, payload) => {
  const { data } = await apiClient.put(`/profile/${userId}`, payload);
  return data;
};
