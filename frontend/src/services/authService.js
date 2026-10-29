import apiClient from './apiClient';

// El backend setea la sesión como cookie HttpOnly; no hace falta guardar el token a mano.
export const login = async (username, password) => {
  const { data } = await apiClient.post('/login', { username, password });
  return data;
};

// El registro recibe un FormData porque puede incluir el documento que avala al personal CIT.
export const register = async (formData) => {
  const { data } = await apiClient.post('/register', formData);
  return data;
};

export const logout = async () => {
  const { data } = await apiClient.post('/logout');
  return data;
};

export const getProfile = async () => {
  const { data } = await apiClient.get('/profile');
  return data;
};
