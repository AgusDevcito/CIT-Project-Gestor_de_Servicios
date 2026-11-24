import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthContext, type AuthContextValue } from "../../context/auth-context";
import type { ResumenMetricas, UsuarioAutenticado } from "../../domain/entidades";
import Home from "../../pages/Home";
import * as metricasService from "../../services/metricasService";

vi.mock("../../services/metricasService");

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

const metricasRealesMock: ResumenMetricas = {
  servicios_activos: 14,
  solicitudes_totales: 28,
  solicitudes_finalizadas: 19,
  resultados_entregados: 17,
  propuestas_recibidas: 9,
  propuestas_convertidas: 4,
  capacitaciones_activas: 5,
  inscripciones_capacitaciones: 42,
  calificacion_promedio: 4.8,
  total_resenas: 15,
  distribucion_solicitudes: {
    pendientes: 3,
    en_curso: 6,
    finalizadas: 19,
    canceladas: 0,
  },
};

describe("pages/Home (Spec-003 Nivel 3 — Limpieza de Inicio + Panel Visual de Métricas)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(metricasService.getResumenMetricas).mockResolvedValue(
      metricasRealesMock,
    );
  });

  it("muestra bienvenida general y accesos de autenticación cuando no hay sesión iniciada", async () => {
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
    expect(await screen.findByText(/Sobre el CIT Formosa/i)).toBeInTheDocument();
    expect(screen.getByText(/Sobre la Plataforma CITio/i)).toBeInTheDocument();
  });

  it("muestra bienvenida personalizada y verifica que las secciones eliminadas de servicios destacados y capacitaciones/actividades ya no estén en Inicio", async () => {
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
      await screen.findByRole("heading", { name: /Hola, Martín Rodríguez/i }),
    ).toBeInTheDocument();

    // Secciones eliminadas por pedido expreso del Nivel 3
    expect(
      screen.queryByText(/Servicios Tecnológicos y Diagnósticos del CIT/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Capacitaciones, Formación y Actividades/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Formación de Recursos Humanos Científicos/i),
    ).not.toBeInTheDocument();
  });

  it("renderiza el Panel Visual de Métricas con indicadores reales del CIT y los accesos rápidos actualizados", async () => {
    render(
      <AuthContext.Provider value={crearContexto(null)}>
        <MemoryRouter>
          <Home />
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    expect(
      await screen.findByRole("heading", {
        name: /Panel Visual de Métricas e Impacto/i,
      }),
    ).toBeInTheDocument();

    expect(screen.getByTestId("kpi-servicios-activos")).toHaveTextContent("14");
    expect(screen.getByTestId("kpi-propuestas-convertidas")).toHaveTextContent(
      "4",
    );
    expect(screen.getByTestId("kpi-resultados-entregados")).toHaveTextContent(
      "17",
    );
    expect(
      screen.getByTestId("kpi-inscripciones-capacitaciones"),
    ).toHaveTextContent("42");
    expect(screen.getByText("4.8 ★")).toBeInTheDocument();

    // Accesos rápidos actualizados a Capacitaciones y Proponer
    expect(
      screen.getByRole("link", { name: /Catálogo de análisis clínicos/i }),
    ).toHaveAttribute("href", "/servicios");
    expect(
      screen.getByRole("link", { name: /Talleres técnicos, jornadas de campo/i }),
    ).toHaveAttribute("href", "/capacitaciones");
    expect(
      screen.getByRole("link", { name: /Artículos técnicos sobre patologías/i }),
    ).toHaveAttribute("href", "/publicaciones");
    expect(
      screen.getByRole("link", { name: /Proponer/i }),
    ).toHaveAttribute("href", "/proponer");
  });
});
