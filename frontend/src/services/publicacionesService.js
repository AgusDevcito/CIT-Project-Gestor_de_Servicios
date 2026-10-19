import apiClient from './apiClient';

export const getPublicaciones = async () => {
  const { data } = await apiClient.get('/publicaciones');
  return data.data;
};

export const getPublicacionById = async (id) => {
  const { data } = await apiClient.get(`/publicacion/${id}`);
  return data.data;
};

// Solo personal CIT.
export const createPublicacion = async (payload) => {
  const { data } = await apiClient.post('/publicacion/crear', payload);
  return data;
};

export const updatePublicacion = async (id, payload) => {
  const { data } = await apiClient.put(`/publicacion/${id}`, payload);
  return data;
};

export const deletePublicacion = async (id) => {
  const { data } = await apiClient.delete(`/publicacion/${id}`);
  return data;
};
