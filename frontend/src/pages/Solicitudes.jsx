import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getApiError } from '../services/apiClient';
import { getEstados } from '../services/catalogosService';
import { getSolicitudes, updateSolicitudEstado } from '../services/solicitudesService';

const fechaFormato = (fecha) =>
  new Date(fecha).toLocaleDateString('es-AR', { dateStyle: 'long' });

export default function Solicitudes() {
  const { user } = useAuth();
  const isCIT = user?.role === 'cit' || user?.role === 'admin';

  const [solicitudes, setSolicitudes] = useState([]);
  const [estados, setEstados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [data, estadosData] = await Promise.all([getSolicitudes(), isCIT ? getEstados() : []]);
      setSolicitudes(data);
      setEstados(estadosData);
    } catch (err) {
      setError(getApiError(err, 'No se pudieron cargar las solicitudes.'));
    } finally {
      setLoading(false);
    }
  }, [isCIT]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleEstadoChange = async (id, estadoCodigo) => {
    setError('');
    try {
      await updateSolicitudEstado(id, estadoCodigo);
      setSolicitudes((prev) =>
        prev.map((solicitud) =>
          solicitud.id === id
            ? {
                ...solicitud,
                Estado: estados.find((estado) => estado.codigo === estadoCodigo) ?? solicitud.Estado,
              }
            : solicitud,
        ),
      );
    } catch (err) {
      setError(getApiError(err, 'No se pudo actualizar el estado.'));
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-white">Solicitudes</h1>
      <p className="mt-1 text-slate-300">
        {isCIT
          ? 'Todas las solicitudes de servicio recibidas.'
          : 'Tus solicitudes de servicio y su estado actual.'}
      </p>

      {error && (
        <div className="mt-4 rounded-xl border border-red-500/40 bg-red-900/20 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <p className="mt-8 animate-pulse text-cit-neon">Cargando solicitudes…</p>
      ) : solicitudes.length === 0 ? (
        <p className="mt-8 text-slate-400">No hay solicitudes por el momento.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-cit-600/40">
          <table className="w-full min-w-[560px] bg-cit-800 text-sm">
            <thead>
              <tr className="border-b border-cit-600/40 text-left text-slate-300">
                <th className="px-4 py-3">Servicio</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Estado</th>
                {isCIT && <th className="px-4 py-3">Acción</th>}
              </tr>
            </thead>
            <tbody>
              {solicitudes.map((solicitud) => (
                <tr key={solicitud.id} className="border-b border-cit-700/60 last:border-0">
                  <td className="px-4 py-3 text-white">{solicitud.Servicio?.servicio_nombre || '—'}</td>
                  <td className="px-4 py-3 text-slate-300">
                    {fechaFormato(solicitud.fecha_solicitud || solicitud.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-cit-700 px-2.5 py-0.5 text-xs text-cit-neon">
                      {solicitud.Estado?.nombre || 'Sin estado'}
                    </span>
                  </td>
                  {isCIT && (
                    <td className="px-4 py-3">
                      <select
                        value={solicitud.Estado?.codigo ?? ''}
                        onChange={(e) => handleEstadoChange(solicitud.id, e.target.value)}
                        className="rounded-lg border border-cit-600/40 bg-cit-900 px-2 py-1.5 text-xs text-white"
                      >
                        {estados.map((estado) => (
                          <option key={estado.id} value={estado.codigo}>
                            {estado.nombre}
                          </option>
                        ))}
                      </select>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
