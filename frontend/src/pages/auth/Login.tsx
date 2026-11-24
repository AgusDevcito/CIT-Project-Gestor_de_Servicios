import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import "./Login.css";
import logoCitio from "../../assets/logo-CITio.png";
import { useAuth } from "../../context/useAuth";
import { getApiError } from "../../domain/errors";
import { PasswordField } from "./PasswordField";

interface LoginLocationState {
  sessionExpired?: boolean;
}

export const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const sessionExpired = Boolean((location.state as LoginLocationState | null)?.sessionExpired);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(username, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(getApiError(err, "No se pudo iniciar sesión."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-container">
      {/* Capas del fondo espacial */}
      <div id="stars" />
      <div id="stars2" />
      <div id="stars3" />

      {/* Contenedor central */}
      <div className="login-wrapper">
        {/* Contenedor del Logo */}
        <div className="logo-container">
          <img src={logoCitio} alt="Logo CITio" className="login-logo" />
        </div>

        <form className="form-card" onSubmit={handleSubmit}>
          <p className="heading">Iniciar Sesión</p>

          {sessionExpired && !error && (
            <div role="status" className="warning-badge">
              Tu sesión expiró. Por favor, iniciá sesión nuevamente.
            </div>
          )}

          {error && (
            <div role="alert" className="error-badge">
              {error}
            </div>
          )}

          <div className="field">
            <label htmlFor="login-username" className="field-label">
              Nombre de usuario
            </label>
            <div className="input-wrap">
              <svg
                className="input-icon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                aria-hidden="true"
              >
                <path d="M10.561 8.073a6.005 6.005 0 0 1 3.432 5.142.75.75 0 1 1-1.498.07 4.5 4.5 0 0 0-8.99 0 .75.75 0 0 1-1.498-.07 6.004 6.004 0 0 1 3.431-5.142 3.999 3.999 0 1 1 5.123 0ZM10.5 5a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z" />
              </svg>
              <input
                id="login-username"
                type="text"
                name="username"
                required
                autoComplete="username"
                placeholder="Ej.: juan.perez"
                className="input-field"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <PasswordField
            id="login-password"
            name="password"
            label="Contraseña"
            autoComplete="current-password"
            placeholder="Tu contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div className="btn-group">
            <button type="submit" className="button1" disabled={loading}>
              {loading ? "Ingresando…" : "Iniciar Sesión"}
            </button>
            <button type="button" className="button2" onClick={() => navigate("/register")}>
              Crear una cuenta
            </button>
          </div>
        </form>

        <Link to="/" className="back-home">
          ← Volver al inicio
        </Link>
      </div>
    </div>
  );
};
