import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getApiError } from '../services/apiClient';
import { getSectores } from '../services/catalogosService';
import {
  createPublicacion,
  deletePublicacion,
  getPublicaciones,
  updatePublicacion,
} from '../services/publicacionesService';

const TIPOS_CONTENIDO = ['patologia', 'enfermedad', 'parasito', 'plaga', 'otro'];

const INITIAL_FORM = {
  titulo: '',
  contenido: '',
  tipo_contenido: 'enfermedad',
  sector: '',
};

const fechaFormato = (fecha) =>
  new Date(fecha).toLocaleDateString('es-AR', { dateStyle: 'medium' });

export default function Publicaciones() {
  const { user } = useAuth();
  const isCIT = user?.role === 'cit' || user?.role === 'admin';

  const [publicaciones, setPublicaciones] = useState([]);
  const [sectores, setSectores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [data, sectoresData] = await Promise.all([getPublicaciones(), getSectores()]);
      setPublicaciones(data);
      setSectores(sectoresData);
    } catch (err) {
      setError(getApiError(err, 'No se pudieron cargar las publicaciones.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreate = () => {
    setEditing(null);
    setForm(INITIAL_FORM);
    setShowForm(true);
  };

  const openEdit = (publicacion) => {
    setEditing(publicacion);
    setForm({
      titulo: publicacion.titulo,
      contenido: publicacion.contenido,
      tipo_contenido: publicacion.tipo_contenido,
      sector: publicacion.Sector?.codigo ?? '',
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (editing) {
        await updatePublicacion(editing.id, form);
      } else {
        await createPublicacion(form);
      }
      setShowForm(false);
      setEditing(null);
      loadData();
    } catch (err) {
      setError(getApiError(err, 'No se pudo guardar la publicación.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (publicacion) => {
    if (!window.confirm(`¿Eliminar "${publicacion.titulo}"?`)) return;
    setError('');
    try {
      await deletePublicacion(publicacion.id);
      setPublicaciones((prev) => prev.filter((item) => item.id !== publicacion.id));
    } catch (err) {
      setError(getApiError(err, 'No se pudo eliminar la publicación.'));
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white">Publicaciones</h1>
          <p className="mt-1 text-slate-300">
            Contenido técnico sobre patologías, enfermedades, parásitos y plagas.
          </p>
        </div>
        {isCIT && (
          <button
            onClick={showForm ? () => setShowForm(false) : openCreate}
            className="rounded-lg bg-cit-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-cit-500"
          >
            {showForm ? 'Cancelar' : '+ Nueva publicación'}
          </button>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-500/40 bg-red-900/20 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {isCIT && showForm && (
        <form onSubmit={handleSubmit} className="mt-6 rounded-2xl border border-cit-600/40 bg-cit-800 p-6">
          <h2 className="mb-4 text-lg font-semibold text-cit-neon">
            {editing ? 'Editar publicación' : 'Nueva publicación'}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              name="titulo"
              required
              maxLength={100}
              placeholder="Título"
              value={form.titulo}
              onChange={handleChange}
              className="input-base"
            />
            <select
              name="tipo_contenido"
              value={form.tipo_contenido}
              onChange={handleChange}
              className="input-base"
            >
              {TIPOS_CONTENIDO.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                </option>
              ))}
            </select>
            <select
              name="sector"
              required
              value={form.sector}
              onChange={handleChange}
              className="input-base sm:col-span-2"
            >
              <option value="">Seleccionar sector…</option>
              {sectores.map((sector) => (
                <option key={sector.id} value={sector.codigo}>
                  {sector.nombre}
                </option>
              ))}
            </select>
            <textarea
              name="contenido"
              required
              rows={5}
              placeholder="Contenido técnico de la publicación"
              value={form.contenido}
              onChange={handleChange}
              className="input-base sm:col-span-2"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="mt-4 rounded-lg bg-cit-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-cit-500 disabled:opacity-60"
          >
            {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear publicación'}
          </button>
        </form>
      )}

      {loading ? (
        <p className="mt-8 animate-pulse text-cit-neon">Cargando publicaciones…</p>
      ) : publicaciones.length === 0 ? (
        <p className="mt-8 text-slate-400">Todavía no hay publicaciones.</p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {publicaciones.map((publicacion) => (
            <article
              key={publicacion.id}
              className="flex flex-col rounded-2xl border border-cit-600/40 bg-cit-800 p-5"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold text-white">{publicacion.titulo}</h2>
                <span className="rounded-full bg-cit-700 px-2.5 py-0.5 text-xs whitespace-nowrap text-cit-neon">
                  {publicacion.tipo_contenido}
                </span>
              </div>
              <p className="mt-2 flex-1 text-sm text-slate-300 line-clamp-3">
                {publicacion.contenido}
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                <span>
                  {publicacion.Sector?.nombre || 'Sin sector'} ·{' '}
                  {fechaFormato(publicacion.createdAt)}
                </span>
                <div className="flex gap-2">
                  <Link
                    to={`/publicaciones/${publicacion.id}`}
                    className="rounded-lg bg-cit-700 px-3 py-1.5 text-cit-neon transition-colors hover:bg-cit-600"
                  >
                    Ver más
                  </Link>
                  {isCIT && (
                    <>
                      <button
                        onClick={() => openEdit(publicacion)}
                        className="rounded-lg bg-cit-700 px-3 py-1.5 text-slate-200 transition-colors hover:bg-cit-600"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(publicacion)}
                        className="rounded-lg bg-red-900/50 px-3 py-1.5 text-red-200 transition-colors hover:bg-red-800"
                      >
                        Eliminar
                      </button>
                    </>
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
