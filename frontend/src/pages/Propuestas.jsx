import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getApiError } from '../services/apiClient';
import { getSectores } from '../services/catalogosService';
import {
  crearPropuesta,
  dictaminarPropuesta,
  getPropuestasPendientes,
} from '../services/propuestasService';

const INITIAL_FORM = { titulo: '', sector: '', problematica: '' };

const fechaFormato = (fecha) =>
  new Date(fecha).toLocaleDateString('es-AR', { dateStyle: 'long' });

export default function Propuestas() {
  const { user } = useAuth();
  const isCIT = user?.role === 'cit' || user?.role === 'admin';

  const [sectores, setSectores] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  const [pendientes, setPendientes] = useState([]);
  const [loading, setLoading] = useState(isCIT);
  const [decisiones, setDecisiones] = useState({});

  useEffect(() => {
    getSectores().then(setSectores).catch(() => setSectores([]));
  }, []);

  const loadPendientes = useCallback(async () => {
    try {
      setPendientes(await getPropuestasPendientes());
    } catch (err) {
      setError(getApiError(err, 'No se pudieron cargar las propuestas.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isCIT) loadPendientes();
  }, [isCIT, loadPendientes]);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFeedback('');
    setSaving(true);
    try {
      const data = await crearPropuesta(form);
      setForm(INITIAL_FORM);
      setFeedback(data.msg || 'Propuesta enviada correctamente. Será revisada por el personal CIT.');
    } catch (err) {
      setError(getApiError(err, 'No se pudo enviar la propuesta.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDecision = (propuesta, decision) => {
    setDecisiones((prev) => ({
      ...prev,
      [propuesta.id]: { ...prev[propuesta.id], decision, justificacion: prev[propuesta.id]?.justificacion ?? '' },
    }));
  };

  const handleJustificacion = (propuestaId, justificacion) => {
    setDecisiones((prev) => ({
      ...prev,
      [propuestaId]: { ...prev[propuestaId], justificacion },
    }));
  };

  const handleDictaminar = async (propuesta) => {
    const { decision, justificacion } = decisiones[propuesta.id] ?? {};
    if (!decision) {
      setError('Elegí si aprobás o rechazás la propuesta.');
      return;
    }
    if (!justificacion || justificacion.trim().length < 15) {
      setError('La justificación técnica debe tener al menos 15 caracteres.');
      return;
    }

    setError('');
    try {
      await dictaminarPropuesta(propuesta.id, decision, justificacion.trim());
      setPendientes((prev) => prev.filter((item) => item.id !== propuesta.id));
    } catch (err) {
      setError(getApiError(err, 'No se pudo registrar el dictamen.'));
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-white">Propuestas</h1>
      <p className="mt-1 text-slate-300">
        {isCIT
          ? 'Propuestas agropecuarias pendientes de revisión.'
          : '¿Tenés una problemática del sector agropecuario? Proponé una solución con nosotros.'}
      </p>

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

      {/* Formulario de creación (usuario normal) */}
      {!isCIT && (
        <form onSubmit={handleSubmit} className="mt-6 max-w-2xl rounded-2xl border border-cit-600/40 bg-cit-800 p-6">
          <h2 className="mb-4 text-lg font-semibold text-cit-neon">Nueva propuesta</h2>
          <div className="grid gap-4">
            <input
              name="titulo"
              required
              placeholder="Título de la propuesta"
              value={form.titulo}
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
            <textarea
              name="problematica"
              required
              minLength={20}
              rows={5}
              placeholder="Describí la problemática que querés proponer (mínimo 20 caracteres)"
              value={form.problematica}
              onChange={handleChange}
              className="input-base"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="mt-4 rounded-lg bg-cit-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-cit-500 disabled:opacity-60"
          >
            {saving ? 'Enviando…' : 'Enviar propuesta'}
          </button>
        </form>
      )}

      {/* Bandeja de revisión (personal CIT) */}
      {isCIT && (
        <div className="mt-6">
          {loading ? (
            <p className="animate-pulse text-cit-neon">Cargando propuestas…</p>
          ) : pendientes.length === 0 ? (
            <p className="text-slate-400">No hay propuestas pendientes de revisión. 🎉</p>
          ) : (
            <div className="grid gap-4">
              {pendientes.map((propuesta) => (
                <article
                  key={propuesta.id}
                  className="rounded-2xl border border-cit-600/40 bg-cit-800 p-6"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-cit-700 px-2.5 py-0.5 text-xs text-cit-neon">
                      {propuesta.Sector?.nombre || 'Sin sector'}
                    </span>
                    <span className="text-xs text-slate-400">
                      {propuesta.Solicitante?.username
                        ? `Por ${propuesta.Solicitante.username}`
                        : ''}{' '}
                      · {fechaFormato(propuesta.createdAt)}
                    </span>
                  </div>
                  <h2 className="mt-2 text-xl font-semibold text-white">{propuesta.titulo}</h2>
                  <p className="mt-2 whitespace-pre-line text-sm text-slate-300">
                    {propuesta.problematica}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-cit-700/60 pt-4">
                    <label className="flex cursor-pointer items-center gap-1.5 text-sm text-slate-200">
                      <input
                        type="radio"
                        name={`decision-${propuesta.id}`}
                        checked={decisiones[propuesta.id]?.decision === 'APROBADO'}
                        onChange={() => handleDecision(propuesta, 'APROBADO')}
                      />
                      Aprobar
                    </label>
                    <label className="flex cursor-pointer items-center gap-1.5 text-sm text-slate-200">
                      <input
                        type="radio"
                        name={`decision-${propuesta.id}`}
                        checked={decisiones[propuesta.id]?.decision === 'RECHAZADO'}
                        onChange={() => handleDecision(propuesta, 'RECHAZADO')}
                      />
                      Rechazar
                    </label>
                    <button
                      onClick={() => handleDictaminar(propuesta)}
                      className="ml-auto rounded-lg bg-cit-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-cit-500"
                    >
                      Registrar dictamen
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Justificación técnica (mínimo 15 caracteres)"
                    value={decisiones[propuesta.id]?.justificacion ?? ''}
                    onChange={(e) => handleJustificacion(propuesta.id, e.target.value)}
                    className="input-base mt-3"
                  />
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
