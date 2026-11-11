import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthContext, type AuthContextValue } from "../../context/auth-context";
import type { UsuarioAutenticado } from "../../domain/entidades";
import Home from "../../pages/Home";
import * as publicacionesService from "../../services/publicacionesService";
import * as serviciosService from "../../services/serviciosService";

vi.mock("../../services/serviciosService", () => ({
  getServicios: vi.fn(),
}));

vi.mock("../../services/publicacionesService", () => ({
  getPublicaciones: vi.fn(),
}));

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

describe("pages/Home (Spec-002 Fase B)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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

  it("muestra bienvenida personalizada con el nombre del usuario autenticado y sincroniza datos del backend", async () => {
    vi.mocked(serviciosService.getServicios).mockResolvedValue([
      {
        id: 1,
        servicio_nombre: "Análisis Coprológico Cuantitativo",
        servicio_description: "Determinación HPG en rumiantes",
        servicio_img: null,
        sector_id: 2,
        servicio_precio: 4500,
        proveedor_id: 1,
        createdAt: "2026-11-10T10:00:00Z",
        Sector: { id: 2, codigo: "GANADERO", nombre: "Ganadero", activo: true },
      },
    ]);

    vi.mocked(publicacionesService.getPublicaciones).mockResolvedValue([
      {
        id: 5,
        titulo: "Control de garrapatas en bovinos",
        contenido: "Guía técnica para productores.",
        tipo_contenido: "parasito",
        sector_id: 2,
        author_id: 1,
        createdAt: "2026-11-10T10:00:00Z",
      },
    ]);

    render(
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

    await waitFor(() => {
      expect(
        screen.getByText("Análisis Coprológico Cuantitativo"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Control de garrapatas en bovinos"),
      ).toBeInTheDocument();
    });
  });

  it("presenta las secciones institucionales de servicios, capacitaciones y accesos rápidos", async () => {
    vi.mocked(serviciosService.getServicios).mockResolvedValue([]);
    vi.mocked(publicacionesService.getPublicaciones).mockResolvedValue([]);

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

    // Capacitaciones y actividades reales del CIT
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

  it("muestra aviso de error con opción de reintentar cuando fallan las consultas dinámicas al backend", async () => {
    vi.mocked(serviciosService.getServicios).mockRejectedValue(
      new Error("Network error"),
    );
    vi.mocked(publicacionesService.getPublicaciones).mockRejectedValue(
      new Error("Network error"),
    );

    render(
      <AuthContext.Provider
        value={crearContexto({
          id: 2,
          username: "cit_user",
          email: "cit@cit.com",
          rol: "cit",
          nombre: "Elena",
          apellido: "Gómez",
          avatarUrl: null,
        })}
      >
        <MemoryRouter>
          <Home />
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Reintentar" })).toBeInTheDocument();
    });
  });
});
