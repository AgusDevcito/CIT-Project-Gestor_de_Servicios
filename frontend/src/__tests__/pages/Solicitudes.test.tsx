import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProtectedRoute } from "../../components/ProtectedRoute";
import { AuthContext, type AuthContextValue } from "../../context/auth-context";
import type { Propuesta, UsuarioAutenticado } from "../../domain/entidades";
import Solicitudes from "../../pages/Solicitudes";
import * as catalogosService from "../../services/catalogosService";
import * as propuestasService from "../../services/propuestasService";

vi.mock("../../services/catalogosService", () => ({
  getSectores: vi.fn(),
  getEstados: vi.fn(),
}));

vi.mock("../../services/propuestasService", () => ({
  getPropuestas: vi.fn(),
  tomarPropuestaEnRevision: vi.fn(),
  dictaminarPropuesta: vi.fn(),
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

const usuarioNormal: UsuarioAutenticado = {
  id: 10,
  username: "productor",
  email: "p@agro.com",
  rol: "user",
  nombre: "Pedro",
  apellido: "Sánchez",
  avatarUrl: null,
};

const usuarioCIT: UsuarioAutenticado = {
  id: 2,
  username: "investigador_cit",
  email: "cit@conicet.gov.ar",
  rol: "cit",
  nombre: "Laura",
  apellido: "Lozina",
  avatarUrl: null,
};

const usuarioAdmin: UsuarioAutenticado = {
  id: 1,
  username: "admin_cit",
  email: "admin@conicet.gov.ar",
  rol: "admin",
  nombre: "Agustín",
  apellido: "Rolón",
  avatarUrl: null,
};

const propuestaPendienteMock: Propuesta = {
  id: 101,
  titulo: "Diagnóstico Regional de Garrapata Bovina",
  sector_id: 2,
  problematica:
    "Programa conjunto para monitoreo de cepas resistentes a acaricidas en establecimientos ganaderos.",
  estado_id: 1,
  solicitante: 10,
  nombre_organismo: "Sociedad Rural de Formosa",
  email_contacto: "contacto@ruralformosa.org.ar",
  telefono_contacto: "+54 370 455-1234",
  bienes_recursos: "Muestras de campo, logística de transporte y personal técnico de apoyo.",
  documento_url: "https://ejemplo.org/convenio-propuesta.pdf",
  documento_nombre: "convenio-propuesta.pdf",
  servicio_generado_id: null,
  cirRevisorId: null,
  citJustificacion: null,
  citFechaRevision: null,
  createdAt: "2026-11-10T10:00:00Z",
  Sector: { id: 2, codigo: "GANADERO", nombre: "Ganadero", activo: true },
  Estado: { id: 1, codigo: "PENDIENTE", nombre: "Pendiente", activo: true },
};

describe("pages/Solicitudes (Spec-002 Fase D)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(catalogosService.getSectores).mockResolvedValue([
      { id: 1, codigo: "AGRICOLA", nombre: "Agrícola", activo: true },
      { id: 2, codigo: "GANADERO", nombre: "Ganadero", activo: true },
    ]);
  });

  it("rechaza el acceso (403) cuando intenta ingresar un usuario con rol user", () => {
    render(
      <AuthContext.Provider value={crearContexto(usuarioNormal)}>
        <MemoryRouter initialEntries={["/solicitudes"]}>
          <Routes>
            <Route element={<ProtectedRoute roles={["cit", "admin"]} />}>
              <Route path="/solicitudes" element={<Solicitudes />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    expect(screen.getByText("403")).toBeInTheDocument();
    expect(
      screen.getByText("No tienes permisos para acceder a esta sección."),
    ).toBeInTheDocument();
  });

  it("permite el acceso a admin y cit, listando propuestas y abriendo el detalle completo del organismo", async () => {
    vi.mocked(propuestasService.getPropuestas).mockResolvedValue([
      propuestaPendienteMock,
    ]);

    render(
      <AuthContext.Provider value={crearContexto(usuarioAdmin)}>
        <MemoryRouter initialEntries={["/solicitudes"]}>
          <Solicitudes />
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Sociedad Rural de Formosa")).toBeInTheDocument();
      expect(
        screen.getByText("Diagnóstico Regional de Garrapata Bovina"),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Revisar detalle" }));

    expect(screen.getByText("contacto@ruralformosa.org.ar")).toBeInTheDocument();
    expect(screen.getByText("+54 370 455-1234")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Muestras de campo, logística de transporte y personal técnico de apoyo.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Visualizar" })).toHaveAttribute(
      "href",
      "https://ejemplo.org/convenio-propuesta.pdf",
    );
    expect(screen.getByRole("link", { name: "Descargar" })).toHaveAttribute(
      "href",
      "https://ejemplo.org/convenio-propuesta.pdf",
    );
  });

  it("permite al personal CIT tomar una propuesta para revisión (estado En revisión)", async () => {
    vi.mocked(propuestasService.getPropuestas).mockResolvedValue([
      propuestaPendienteMock,
    ]);
    vi.mocked(propuestasService.tomarPropuestaEnRevision).mockResolvedValue({
      msg: "La propuesta fue tomada para revisión.",
      data: {
        ...propuestaPendienteMock,
        Estado: { id: 6, codigo: "EN_REVISION", nombre: "En revisión", activo: true },
        cirRevisorId: 2,
        Revisor: {
          id: 2,
          username: "investigador_cit",
          email: "cit@conicet.gov.ar",
          role: "cit",
        },
      },
    });

    render(
      <AuthContext.Provider value={crearContexto(usuarioCIT)}>
        <MemoryRouter initialEntries={["/solicitudes"]}>
          <Solicitudes />
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    const btnRevisar = await screen.findByRole("button", { name: "Revisar detalle" });
    fireEvent.click(btnRevisar);

    fireEvent.click(screen.getByRole("button", { name: "Tomar para revisión" }));

    await waitFor(() => {
      expect(propuestasService.tomarPropuestaEnRevision).toHaveBeenCalledWith(101);
      expect(screen.getAllByText("En revisión").length).toBeGreaterThanOrEqual(1);
    });
  });

  it("permite aceptar una propuesta incorporándola al catálogo de servicios con trazabilidad", async () => {
    vi.mocked(propuestasService.getPropuestas).mockResolvedValue([
      propuestaPendienteMock,
    ]);
    vi.mocked(propuestasService.dictaminarPropuesta).mockResolvedValue({
      msg: "Propuesta evaluada exitosamente como ACEPTADA.",
      data: {
        ...propuestaPendienteMock,
        Estado: { id: 4, codigo: "ACEPTADA", nombre: "Aceptada", activo: true },
        servicio_generado_id: 25,
        citJustificacion:
          "La propuesta cumple los requisitos técnicos y de equipamiento para incorporarse al catálogo.",
      },
    });

    render(
      <AuthContext.Provider value={crearContexto(usuarioCIT)}>
        <MemoryRouter initialEntries={["/solicitudes"]}>
          <Solicitudes />
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    const btnRevisar = await screen.findByRole("button", { name: "Revisar detalle" });
    fireEvent.click(btnRevisar);

    fireEvent.click(
      screen.getByRole("radio", { name: /Aceptar e incorporar a Servicios/i }),
    );

    fireEvent.change(screen.getByLabelText(/Arancel en ARS/i), {
      target: { value: "5000" },
    });

    fireEvent.change(screen.getByLabelText(/Justificación técnica/i), {
      target: {
        value:
          "La propuesta cumple los requisitos técnicos y de equipamiento para incorporarse al catálogo.",
      },
    });

    fireEvent.click(screen.getByRole("button", { name: "Confirmar decisión" }));

    await waitFor(() => {
      expect(propuestasService.dictaminarPropuesta).toHaveBeenCalledWith(
        101,
        "ACEPTADA",
        "La propuesta cumple los requisitos técnicos y de equipamiento para incorporarse al catálogo.",
        {
          servicio_nombre: "Diagnóstico Regional de Garrapata Bovina",
          servicio_description:
            "Programa conjunto para monitoreo de cepas resistentes a acaricidas en establecimientos ganaderos.",
          servicio_precio: 5000,
        },
      );
      expect(
        screen.getByRole("link", {
          name: /Ver servicio incorporado en el catálogo \(ID #25\)/i,
        }),
      ).toHaveAttribute("href", "/servicios/25");
    });
  });

  it("permite rechazar una propuesta con justificación obligatoria", async () => {
    vi.mocked(propuestasService.getPropuestas).mockResolvedValue([
      propuestaPendienteMock,
    ]);
    vi.mocked(propuestasService.dictaminarPropuesta).mockResolvedValue({
      msg: "Propuesta evaluada exitosamente como RECHAZADO.",
      data: {
        ...propuestaPendienteMock,
        Estado: { id: 3, codigo: "RECHAZADO", nombre: "Rechazada", activo: true },
        citJustificacion:
          "Actualmente el laboratorio no dispone de los reactivos específicos solicitados.",
      },
    });

    render(
      <AuthContext.Provider value={crearContexto(usuarioCIT)}>
        <MemoryRouter initialEntries={["/solicitudes"]}>
          <Solicitudes />
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    const btnRevisar = await screen.findByRole("button", { name: "Revisar detalle" });
    fireEvent.click(btnRevisar);

    fireEvent.click(screen.getByRole("radio", { name: /Rechazar propuesta/i }));

    fireEvent.change(screen.getByLabelText(/Justificación técnica/i), {
      target: {
        value:
          "Actualmente el laboratorio no dispone de los reactivos específicos solicitados.",
      },
    });

    fireEvent.click(screen.getByRole("button", { name: "Confirmar decisión" }));

    await waitFor(() => {
      expect(propuestasService.dictaminarPropuesta).toHaveBeenCalledWith(
        101,
        "RECHAZADO",
        "Actualmente el laboratorio no dispone de los reactivos específicos solicitados.",
        undefined,
      );
    });
  });
});
