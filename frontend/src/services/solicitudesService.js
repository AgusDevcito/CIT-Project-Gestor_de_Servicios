import apiClient from './apiClient';

// Un usuario normal ve solo las suyas; CIT/admin ven todas.
export const getSolicitudes = async () => {
  const { data } = await apiClient.get('/solicitudes');
  return data.data;
};

export const createSolicitud = async (servicioId) => {
  const { data } = await apiClient.post('/solicitudes', { servicio_id: servicioId });
  return data;
};

// Solo admin/CIT: recibe el código del estado (ej. "PENDIENTE", "APROBADO").
export const updateSolicitudEstado = async (id, estadoCodigo) => {
  const { data } = await apiClient.patch(`/solicitudes/${id}/estado`, { estado: estadoCodigo });
  return data;
};
