import { useEffect, useState } from "react";

import { useAuth } from "../context/useAuth";
import { getApiError } from "../domain/errors";
import { updateProfile } from "../services/profileService";

interface FormularioPerfil {
  first_name: string;
  last_name: string;
  avatar_url: string;
}

const INITIAL_FORM: FormularioPerfil = {
  first_name: "",
  last_name: "",
  avatar_url: "",
};

export default function Perfil() {
  const { user, refresh } = useAuth();
  const [form, setForm] = useState<FormularioPerfil>(INITIAL_FORM);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (user) {
      setForm({
        first_name: user.nombre ?? "",
        last_name: user.apellido ?? "",
        avatar_url: user.avatarUrl ?? "",
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setFeedback("");
    setSaving(true);
    try {
      await updateProfile(user!.id, form);
      await refresh();
      setEditing(false);
      setFeedback("Perfil actualizado correctamente.");
    } catch (err) {
      setError(getApiError(err, "No se pudo actualizar el perfil."));
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold text-white">Mi Perfil</h1>

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

      <div className="mt-6 rounded-2xl border border-cit-600/40 bg-cit-800 p-6">
        <div className="flex items-center gap-4">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt="Avatar"
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cit-700 text-2xl text-cit-neon">
              {(user.nombre || user.username || "?").charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-xl font-semibold text-white">
              {user.nombre} {user.apellido}
            </p>
            <p className="text-sm text-slate-300">@{user.username}</p>
            <span className="mt-1 inline-block rounded-full border border-cit-neon/40 px-2.5 py-0.5 text-xs text-cit-neon">
              {user.rol}
            </span>
          </div>
        </div>

        <dl className="mt-6 grid gap-3 text-sm">
          <div className="flex justify-between border-b border-cit-700/60 pb-2">
            <dt className="text-slate-400">Email</dt>
            <dd className="text-slate-200">{user.email}</dd>
          </div>
          <div className="flex justify-between border-b border-cit-700/60 pb-2">
            <dt className="text-slate-400">Nombre de usuario</dt>
            <dd className="text-slate-200">{user.username}</dd>
          </div>
        </dl>
      </div>

      {editing ? (
        <form onSubmit={handleSubmit} className="mt-6 rounded-2xl border border-cit-600/40 bg-cit-800 p-6">
          <h2 className="mb-4 text-lg font-semibold text-cit-neon">Editar datos personales</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              name="first_name"
              required
              placeholder="Nombre"
              value={form.first_name}
              onChange={handleChange}
              className="input-base"
            />
            <input
              name="last_name"
              required
              placeholder="Apellido"
              value={form.last_name}
              onChange={handleChange}
              className="input-base"
            />
            <input
              name="avatar_url"
              type="url"
              placeholder="URL del avatar (opcional)"
              value={form.avatar_url}
              onChange={handleChange}
              className="input-base sm:col-span-2"
            />
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-cit-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-cit-500 disabled:opacity-60"
            >
              {saving ? "Guardando…" : "Guardar cambios"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-lg bg-cit-700 px-4 py-2 text-sm text-slate-200 transition-colors hover:bg-cit-600"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="mt-6 rounded-lg bg-cit-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-cit-500"
        >
          Editar datos personales
        </button>
      )}
    </div>
  );
}
