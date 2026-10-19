import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getApiError } from '../services/apiClient';
import { getSectores } from '../services/catalogosService';
import { createServicio, getServicios } from '../services/serviciosService';
import { createSolicitud } from '../services/solicitudesService';

const INITIAL_FORM = {
  servicio_nombre: '',
  servicio_description: '',
  servicio_precio: '',
  sector: '',
  servicio_img: '',
};

const precioFormato = (precio) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(Number(precio));

export default function Servicios() {
  const { user } = useAuth();
  const isCIT = user?.role === 'cit' || user?.role === 'admin';

  const [servicios, setServicios] = useState([]);
  const [sectores, setSectores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [data, sectoresData] = await Promise.all([getServicios(), getSectores()]);
      setServicios(data);
      setSectores(sectoresData);
    } catch (err) {
      setError(getApiError(err, 'No se pudieron cargar los servicios.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setFeedback('');
    setSaving(true);
    try {
      await createServicio({
        ...form,
        servicio_precio: Number(form.servicio_precio),
        servicio_img: form.servicio_img || undefined,
      });
      setForm(INITIAL_FORM);
      setShowForm(false);
      setFeedback('Servicio creado correctamente.');
      loadData();
    } catch (err) {
      setError(getApiError(err, 'No se pudo crear el servicio.'));
    } finally {
      setSaving(false);
    }
  };

  const handleSolicitar = async (servicio) => {
    setError('');
    setFeedback('');
    try {
      await createSolicitud(servicio.id);
      setFeedback(`Solicitud enviada para "${servicio.servicio_nombre}". Podés seguirla en Solicitudes.`);
    } catch (err) {
      setError(getApiError(err, 'No se pudo solicitar el servicio.'));
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white">Servicios</h1>
          <p className="mt-1 text-slate-300">Servicios disponibles que ofrece el CIT.</p>
        </div>
        {isCIT && (
          <button
            onClick={() => setShowForm((prev) => !prev)}
            className="rounded-lg bg-cit-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-cit-500"
          >
            {showForm ? 'Cancelar' : '+ Nuevo servicio'}
          </button>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-500/40 bg-red-900/20 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}
      {feedback && (
        <div className="mt-4 rounded-xl border border-cit-neon/40 bg-cit-800/60 px-4 py-3 text-sm text-cit-neon">
          {feedback}
        </div>
      )}

      {isCIT && showForm && (
        <form onSubmit={handleCreate} className="mt-6 rounded-2xl border border-cit-600/40 bg-cit-800 p-6">
          <h2 className="mb-4 text-lg font-semibold text-cit-neon">Nuevo servicio</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              name="servicio_nombre"
              required
              maxLength={30}
              placeholder="Nombre del servicio"
              value={form.servicio_nombre}
              onChange={handleChange}
              className="input-base"
            />
            <input
              name="servicio_precio"
              required
              type="number"
              min="0"
              step="0.01"
              placeholder="Precio"
              value={form.servicio_precio}
              onChange={handleChange}
              className="input-base"
            />
            <select
              name="sector"
              required
              value={form.sector}
              onChange={handleChange}
              className="input-base"
            >
              <option value="">Seleccionar sector…</option>
              {sectores.map((sector) => (
                <option key={sector.id} value={sector.codigo}>
                  {sector.nombre}
                </option>
              ))}
            </select>
            <input
              name="servicio_img"
              type="url"
              placeholder="URL de imagen (opcional)"
              value={form.servicio_img}
              onChange={handleChange}
              className="input-base"
            />
            <textarea
              name="servicio_description"
              required
              maxLength={350}
              rows={3}
              placeholder="Descripción del servicio"
              value={form.servicio_description}
              onChange={handleChange}
              className="input-base sm:col-span-2"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="mt-4 rounded-lg bg-cit-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-cit-500 disabled:opacity-60"
          >
            {saving ? 'Guardando…' : 'Crear servicio'}
          </button>
        </form>
      )}

      {loading ? (
        <p className="mt-8 animate-pulse text-cit-neon">Cargando servicios…</p>
      ) : servicios.length === 0 ? (
        <p className="mt-8 text-slate-400">Todavía no hay servicios publicados.</p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {servicios.map((servicio) => (
            <article
              key={servicio.id}
              className="flex flex-col rounded-2xl border border-cit-600/40 bg-cit-800 overflow-hidden"
            >
              {servicio.servicio_img && (
                <img
                  src={servicio.servicio_img}
                  alt={servicio.servicio_nombre}
                  className="h-36 w-full object-cover"
                />
              )}
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-semibold text-white">{servicio.servicio_nombre}</h2>
                  <span className="rounded-full bg-cit-700 px-2.5 py-0.5 text-xs text-cit-neon">
                    {servicio.Sector?.nombre || 'Sin sector'}
                  </span>
                </div>
                <p className="mt-2 flex-1 text-sm text-slate-300">{servicio.servicio_description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-cit-neon">{precioFormato(servicio.servicio_precio)}</p>
                    <p className="text-xs text-slate-400">
                      Proveedor: {servicio.Proveedor?.username || '—'}
                    </p>
                  </div>
                  {!isCIT && (
                    <button
                      onClick={() => handleSolicitar(servicio)}
                      className="rounded-lg bg-cit-600 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-cit-500"
                    >
                      Solicitar
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
