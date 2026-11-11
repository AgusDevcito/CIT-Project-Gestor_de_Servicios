import { useState } from "react";
import { useNavigate } from "react-router-dom";

import "./Login.css";
import "./Register.css";
import logoCitio from "../../assets/logo-CITio.png";
import { useAuth } from "../../context/useAuth";
import { getApiError } from "../../domain/errors";

interface FormularioRegistro {
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  password: string;
}

const INITIAL_FORM: FormularioRegistro = {
  first_name: "",
  last_name: "",
  username: "",
  email: "",
  password: "",
};

export const Register = () => {
  const [form, setForm] = useState<FormularioRegistro>(INITIAL_FORM);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => formData.append(key, value));

      await register(formData);
      setSuccess(true);
    } catch (err) {
      setError(getApiError(err, "No se pudo completar el registro."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-container">
      <div id="stars" />
      <div id="stars2" />
      <div id="stars3" />

      <div className="login-wrapper register-wrapper">
        <div className="logo-container">
          <img src={logoCitio} alt="Logo CITio" className="login-logo" />
        </div>

        {success ? (
          <div className="form-card form-card-wide">
            <p className="heading">Registro exitoso</p>
            <p className="text-center text-sm text-slate-300">
              Tu cuenta fue creada correctamente. Ya podés iniciar sesión con tus nuevas
              credenciales.
            </p>
            <div className="btn-group">
              <button type="button" className="button1" onClick={() => navigate("/login")}>
                Ir a Iniciar Sesión
              </button>
            </div>
          </div>
        ) : (
          <form className="form-card form-card-wide" onSubmit={handleSubmit}>
            <p className="heading">Crear Cuenta</p>

            {error && <div className="error-badge">{error}</div>}

            <div className="form-row">
              <div className="field">
                <input
                  type="text"
                  name="first_name"
                  required
                  placeholder="Nombre"
                  className="input-field"
                  value={form.first_name}
                  onChange={handleChange}
                />
              </div>
              <div className="field">
                <input
                  type="text"
                  name="last_name"
                  required
                  placeholder="Apellido"
                  className="input-field"
                  value={form.last_name}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="field">
              <input
                type="text"
                name="username"
                required
                autoComplete="username"
                placeholder="Nombre de usuario"
                className="input-field"
                value={form.username}
                onChange={handleChange}
              />
            </div>

            <div className="field">
              <input
                type="email"
                name="email"
                required
                placeholder="Correo electrónico"
                className="input-field"
                value={form.email}
                onChange={handleChange}
              />
            </div>

            <div className="field">
              <input
                type="password"
                name="password"
                required
                minLength={6}
                autoComplete="new-password"
                placeholder="Contraseña"
                className="input-field"
                value={form.password}
                onChange={handleChange}
              />
            </div>

            <div className="btn-group">
              <button type="submit" className="button1" disabled={loading}>
                {loading ? "Registrando…" : "Registrarse"}
              </button>
              <button type="button" className="button2" onClick={() => navigate("/login")}>
                Volver al Login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
