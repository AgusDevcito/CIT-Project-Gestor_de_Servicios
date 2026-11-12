import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { AuthContext, type AuthContextValue } from "../../context/auth-context";
import type { UsuarioAutenticado } from "../../domain/entidades";
import Home from "../../pages/Home";

const crearContexto = (user: UsuarioAutenticado | null): AuthContextValue => ({
  user,
  status: user ? "autenticado" : "anonimo",
  login: async () => {
    throw new Error("no implementado");
  },
  register: async () => ({ mensaje: "", documentUrl: null }),
  logout: async () => {},
  refresh: async () => {},
});

describe("pages/Home (Spec-003 Fase A)", () => {
  it("muestra bienvenida general y accesos de autenticación cuando no hay sesión iniciada", () => {
    render(
      <AuthContext.Provider value={crearContexto(null)}>
        <MemoryRouter>
          <Home />
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    expect(
      screen.getByRole("heading", { name: /Bienvenido a CITio/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Iniciar sesión" })).toHaveAttribute(
      "href",
      "/login",
    );
    expect(screen.getByRole("link", { name: "Crear cuenta" })).toHaveAttribute(
      "href",
      "/register",
    );
    expect(screen.getByText(/Sobre el CIT Formosa/i)).toBeInTheDocument();
    expect(screen.getByText(/Sobre la Plataforma CITio/i)).toBeInTheDocument();
  });

  it("muestra bienvenida personalizada con el nombre del usuario autenticado sin contadores numéricos ni KPIs ficticios", () => {
    const { container } = render(
      <AuthContext.Provider
        value={crearContexto({
          id: 7,
          username: "mrodriguez",
          email: "mrodriguez@cit.com",
          rol: "user",
          nombre: "Martín",
          apellido: "Rodríguez",
          avatarUrl: null,
        })}
      >
        <MemoryRouter>
          <Home />
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    expect(
      screen.getByRole("heading", { name: /Hola, Martín Rodríguez/i }),
    ).toBeInTheDocument();

    // Verificación de T006/T007 y RF-A03: no deben existir contadores numéricos estáticos ni porcentaje
    expect(screen.queryByText(/\+35/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/100%/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/4 Áreas Estratégicas/i)).not.toBeInTheDocument();
    expect(container.querySelector(".statsStrip")).toBeNull();

    // No deben renderizarse bloques dinámicos no solicitados
    expect(
      screen.queryByText(/Servicios destacados disponibles/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Últimas publicaciones técnicas/i),
    ).not.toBeInTheDocument();
  });

  it("presenta las secciones institucionales de servicios, capacitaciones y accesos rápidos", () => {
    render(
      <AuthContext.Provider value={crearContexto(null)}>
        <MemoryRouter>
          <Home />
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    // Áreas representativas de Servicios.md
    expect(screen.getByText("Bioquímica Clínica")).toBeInTheDocument();
    expect(screen.getByText("Parasitología y Ectoparásitos")).toBeInTheDocument();
    expect(screen.getByText("Salud Equina")).toBeInTheDocument();
    expect(screen.getByText("Enfermedades Venéreas y Serología")).toBeInTheDocument();

    // Capacitaciones y actividades institucionales
    expect(
      screen.getByText("Formación de Recursos Humanos Científicos"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Jornadas de Vinculación y Transferencia Tecnológica"),
    ).toBeInTheDocument();

    // Accesos directos a las secciones públicas/generales (Solicitudes es exclusivo CIT/Admin)
    expect(
      screen.getByRole("link", { name: /Catálogo de análisis clínicos/i }),
    ).toHaveAttribute("href", "/servicios");
    expect(
      screen.queryByRole("link", { name: /Solicitudes/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Artículos técnicos sobre patologías/i }),
    ).toHaveAttribute("href", "/publicaciones");
    expect(screen.getByRole("link", { name: /Propuestas/i })).toHaveAttribute(
      "href",
      "/propuestas",
    );
    expect(screen.getByRole("link", { name: /Mi Perfil/i })).toHaveAttribute(
      "href",
      "/perfil",
    );
  });
});
