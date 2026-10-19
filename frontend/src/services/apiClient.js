import axios from 'axios';

// Cliente HTTP centralizado: usa la cookie HttpOnly que setea el backend
// (withCredentials) y centraliza el manejo de errores.
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  withCredentials: true,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    const isAuthAttempt = url.includes('/login') || url.includes('/register');

    // Sesión expirada o inválida: avisamos al AuthContext para que limpie el estado.
    if (status === 401 && !isAuthAttempt) {
      window.dispatchEvent(new CustomEvent('cit:unauthorized'));
    }

    return Promise.reject(error);
  },
);

// Extrae el mensaje de error que devuelve el backend ('msg') si existe.
export const getApiError = (error, fallback = 'Ocurrió un error inesperado.') =>
  error.response?.data?.msg || error.message || fallback;

export default apiClient;
