import { useState } from "react";
import { useNavigate } from "react-router-dom";

import "./Login.css";
import logoCitio from "../../assets/logo-CITio.png";
import { useAuth } from "../../context/useAuth";
import { getApiError } from "../../domain/errors";

export const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

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

        {/* Formulario con estilo Dark Inset */}
        <form className="form-card" onSubmit={handleSubmit}>
          <p className="heading">Iniciar Sesión</p>

          {error && <div className="error-badge">{error}</div>}

          {/* Campo de Usuario */}
          <div className="field">
            <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
              <path d="M13.106 7.222c0-2.967-2.249-5.032-5.482-5.032-3.35 0-5.646 2.318-5.646 5.702 0 3.493 2.235 5.708 5.762 5.708.862 0 1.689-.123 2.304-.335v-.862c-.43.199-1.354.328-2.29.328-2.926 0-4.813-1.88-4.813-4.798 0-2.844 1.921-4.881 4.594-4.881 2.735 0 4.608 1.688 4.608 4.156 0 1.682-.554 2.769-1.416 2.769-.492 0-.772-.28-.772-.76V5.206H8.923v.834h-.11c-.266-.595-.881-.964-1.6-.964-1.4 0-2.378 1.162-2.378 2.823 0 1.737.957 2.906 2.379 2.906.8 0 1.415-.39 1.709-1.087h.11c.081.67.703 1.148 1.503 1.148 1.572 0 2.57-1.415 2.57-3.643zm-7.177.704c0-1.197.54-1.907 1.456-1.907.93 0 1.524.738 1.524 1.907S8.308 9.84 7.371 9.84c-.895 0-1.442-.725-1.442-1.914z" />
            </svg>
            <input
              type="text"
              name="username"
              required
              autoComplete="username"
              placeholder="Nombre de usuario"
              className="input-field"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          {/* Campo de Contraseña */}
          <div className="field">
            <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
              <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
            </svg>
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              placeholder="Contraseña"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Botones de Acción */}
          <div className="btn-group">
            <button type="submit" className="button1" disabled={loading}>
              {loading ? "Ingresando…" : "Iniciar Sesión"}
            </button>
            <button type="button" className="button2" onClick={() => navigate("/register")}>
              Registrarse
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
