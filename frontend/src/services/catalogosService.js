import apiClient from './apiClient';

export const getSectores = async () => {
  const { data } = await apiClient.get('/sectores');
  return data.data;
};

export const getEstados = async () => {
  const { data } = await apiClient.get('/estados');
  return data.data;
};
