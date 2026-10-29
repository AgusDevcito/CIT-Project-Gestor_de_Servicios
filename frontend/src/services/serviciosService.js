import apiClient from './apiClient';

export const getServicios = async () => {
  const { data } = await apiClient.get('/servicios');
  return data.data;
};

// Solo personal CIT.
export const createServicio = async (payload) => {
  const { data } = await apiClient.post('/servicios', payload);
  return data;
};
