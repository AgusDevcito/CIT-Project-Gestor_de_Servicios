import apiClient from './apiClient';

// Solo CIT: devuelve las propuestas con estado PENDIENTE.
export const getPropuestasPendientes = async () => {
  const { data } = await apiClient.get('/propuestas');
  return data.data;
};

// Solo usuario normal: crea una nueva problematica a resolver.
export const crearPropuesta = async (payload) => {
  const { data } = await apiClient.post('/propuesta/crear', payload);
  return data;
};

// Solo CIT: decision "APROBADO" | "RECHAZADO" con justificacion (min. 15 caracteres).
export const dictaminarPropuesta = async (id, decision, justificacion) => {
  const { data } = await apiClient.post(`/propuestas/dictaminar/${id}`, {
    decision,
    justificacion,
  });
  return data;
};
