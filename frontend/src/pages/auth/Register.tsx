import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import "./Login.css";
import "./Register.css";
import logoCitio from "../../assets/logo-CITio.png";
import { useAuth } from "../../context/useAuth";
import { getApiError } from "../../domain/errors";
import { PasswordField } from "./PasswordField";

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
  const [confirmPassword, setConfirmPassword] = useState("");
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (form.password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

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
            <p className="form-hint">
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

            {error && (
              <div role="alert" className="error-badge">
                {error}
              </div>
            )}

            <div className="form-row">
              <div className="field">
                <label htmlFor="reg-first-name" className="field-label">
                  Nombre
                </label>
                <input
                  id="reg-first-name"
                  type="text"
                  name="first_name"
                  required
                  autoComplete="given-name"
                  className="input-field"
                  value={form.first_name}
                  onChange={handleChange}
                />
              </div>
              <div className="field">
                <label htmlFor="reg-last-name" className="field-label">
                  Apellido
                </label>
                <input
                  id="reg-last-name"
                  type="text"
                  name="last_name"
                  required
                  autoComplete="family-name"
                  className="input-field"
                  value={form.last_name}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="reg-username" className="field-label">
                Nombre de usuario
              </label>
              <input
                id="reg-username"
                type="text"
                name="username"
                required
                autoComplete="username"
                className="input-field"
                value={form.username}
                onChange={handleChange}
              />
            </div>

            <div className="field">
              <label htmlFor="reg-email" className="field-label">
                Correo electrónico
              </label>
              <input
                id="reg-email"
                type="email"
                name="email"
                required
                autoComplete="email"
                placeholder="nombre@ejemplo.com"
                className="input-field"
                value={form.email}
                onChange={handleChange}
              />
            </div>

            <PasswordField
              id="reg-password"
              name="password"
              label="Contraseña"
              autoComplete="new-password"
              minLength={6}
              help="Mínimo 6 caracteres."
              value={form.password}
              onChange={handleChange}
            />

            <PasswordField
              id="reg-confirm-password"
              name="confirm_password"
              label="Repetir contraseña"
              autoComplete="new-password"
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <div className="btn-group">
              <button type="submit" className="button1" disabled={loading}>
                {loading ? "Registrando…" : "Registrarse"}
              </button>
              <button type="button" className="button2" onClick={() => navigate("/login")}>
                Ya tengo cuenta
              </button>
            </div>
          </form>
        )}

        <Link to="/" className="back-home">
          ← Volver al inicio
        </Link>
      </div>
    </div>
  );
};
