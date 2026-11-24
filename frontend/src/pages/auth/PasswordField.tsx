import { useState, type ChangeEvent } from "react";

interface PasswordFieldProps {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  autoComplete: "current-password" | "new-password";
  placeholder?: string;
  minLength?: number;
  help?: string;
}

/**
 * Campo de contraseña con label visible y botón para mostrar/ocultar el texto.
 * Reutiliza las clases de Login.css.
 */
export function PasswordField({
  id,
  name,
  label,
  value,
  onChange,
  autoComplete,
  placeholder,
  minLength,
  help,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="field">
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <div className="input-wrap">
        <input
          id={id}
          type={visible ? "text" : "password"}
          name={name}
          required
          minLength={minLength}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className="input-field has-toggle"
          value={value}
          onChange={onChange}
        />
        <button
          type="button"
          className="toggle-password"
          onClick={() => setVisible((prev) => !prev)}
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          aria-pressed={visible}
        >
          {visible ? "Ocultar" : "Ver"}
        </button>
      </div>
      {help && <span className="field-help">{help}</span>}
    </div>
  );
}
