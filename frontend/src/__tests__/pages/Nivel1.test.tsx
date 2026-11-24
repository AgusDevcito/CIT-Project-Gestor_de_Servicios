import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthContext, type AuthContextValue } from "../../context/auth-context";
import type {
  InscripcionCapacitacion,
  Propuesta,
  Publicacion,
  Solicitud,
  UsuarioAutenticado,
} from "../../domain/entidades";
import Ajustes from "../../pages/Ajustes";
import Capacitaciones from "../../pages/Capacitaciones";
import MisServicios from "../../pages/MisServicios";
import * as catalogosService from "../../services/catalogosService";
import * as profileService from "../../services/profileService";
import * as propuestasService from "../../services/propuestasService";
import * as publicacionesService from "../../services/publicacionesService";
import * as solicitudesService from "../../services/solicitudesService";

vi.mock("../../services/catalogosService");
vi.mock("../../services/profileService");
vi.mock("../../services/propuestasService");
vi.mock("../../services/publicacionesService");
vi.mock("../../services/solicitudesService");

const crearContexto = (
  user: UsuarioAutenticado | null,
): AuthContextValue => ({
  user,
  status: user ? "autenticado" : "anonimo",
  login: async () => {
    throw new Error("no implementado");
  },
  register: async () => ({ mensaje: "", documentUrl: null }),
  logout: async () => {},
  refresh: async () => {},
});

const usuarioProductor: UsuarioAutenticado = {
  id: 12,
  username: "productor_formosa",
  email: "productor@campo.com.ar",
  rol: "user",
  nombre: "Gonzalo",
  apellido: "Benítez",
  avatarUrl: null,
};

const capacitacionMock: Publicacion = {
  id: 101,
  titulo: "Taller de Diagnóstico y Prevención de Tristeza Bovina",
  contenido:
    "Jornada práctica en laboratorio y campo sobre control de garrapatas y hemoparásitos.",
  tipo_contenido: "capacitacion",
  sector_id: 2,
  author_id: 1,
  publicado: true,
  createdAt: "2026-11-10T10:00:00.000Z",
  Sector: { id: 2, codigo: "GANADERO", nombre: "Ganadero", activo: true },
};

const inscripcionMock: InscripcionCapacitacion = {
  id: 501,
  user_id: 12,
  publicacion_id: 101,
  estado: "INSCRIPTO",
  observaciones: null,
  createdAt: "2026-11-12T10:00:00.000Z",
  Publicacion: capacitacionMock,
};

const solicitudPendienteMock: Solicitud = {
  id: 301,
  user_id: 12,
  servicio_id: 40,
  estado_id: 1,
  fecha_solicitud: "2026-11-15T14:00:00.000Z",
  createdAt: "2026-11-15T14:00:00.000Z",
  Servicio: {
    id: 40,
    servicio_nombre: "Análisis Bromatológico NIRS de Forrajes",
    servicio_description: "Determinación de proteína y fibra en pasturas.",
    servicio_img: null,
    sector_id: 2,
    servicio_precio: 25000,
    proveedor_id: 1,
    createdAt: "2026-11-01T10:00:00.000Z",
    Sector: { id: 2, codigo: "GANADERO", nombre: "Ganadero", activo: true },
  },
  Estado: { id: 1, codigo: "PENDIENTE", nombre: "Pendiente", activo: true },
};

const propuestaPendienteMock: Propuesta = {
  id: 701,
  titulo: "Bioensayo de Resistencia a Garrapaticidas en Patiño",
  sector_id: 2,
  problematica:
    "Falla de eficacia en baños garrapaticidas en establecimientos ganaderos del centro oeste.",
  estado_id: 1,
  solicitante: 12,
  nombre_organismo: "Sociedad Rural de Comandante Fontana",
  email_contacto: "productor@campo.com.ar",
  telefono_contacto: "+54 370 4112233",
  bienes_recursos: "Muestras de teleoginas recolectadas y transporte refrigerado.",
  documento_url: null,
  documento_nombre: null,
  servicio_generado_id: null,
  cirRevisorId: null,
  citJustificacion: null,
  citFechaRevision: null,
  createdAt: "2026-11-16T09:00:00.000Z",
  Sector: { id: 2, codigo: "GANADERO", nombre: "Ganadero", activo: true },
  Estado: { id: 1, codigo: "PENDIENTE", nombre: "Pendiente", activo: true },
};

describe("Spec-003 Nivel 1 — Capacitaciones, Mis Servicios, Ajustes/Propuestas y Timeline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.mocked(catalogosService.getSectores).mockResolvedValue([
      { id: 2, codigo: "GANADERO", nombre: "Ganadero", activo: true },
    ]);
  });

  it("lista las capacitaciones del CIT y permite inscribirse en 1 clic mostrando la línea de seguimiento", async () => {
    vi.mocked(publicacionesService.getPublicaciones).mockResolvedValue([
      capacitacionMock,
    ]);
    vi.mocked(profileService.getMisCapacitaciones).mockResolvedValue([]);
    vi.mocked(profileService.enrollInCapacitacion).mockResolvedValue({
      msg: "Inscripción registrada exitosamente.",
      data: inscripcionMock,
    });

    render(
      <AuthContext.Provider value={crearContexto(usuarioProductor)}>
        <MemoryRouter initialEntries={["/capacitaciones"]}>
          <Routes>
            <Route path="/capacitaciones" element={<Capacitaciones />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    expect(
      await screen.findByText(
        "Taller de Diagnóstico y Prevención de Tristeza Bovina",
      ),
    ).toBeInTheDocument();

    const btnInscribir = screen.getByRole("button", { name: "Inscribirme" });
    fireEvent.click(btnInscribir);

    await waitFor(() => {
      expect(profileService.enrollInCapacitacion).toHaveBeenCalledWith(101);
    });

    expect(
      await screen.findByText(/Inscripción registrada exitosamente/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/1\. Inscripto/i)).toBeInTheDocument();
  });

  it("muestra en Mis Servicios los servicios contratados y capacitaciones inscriptas con su línea de tiempo y permite cancelar una solicitud pendiente", async () => {
    vi.mocked(solicitudesService.getSolicitudes).mockResolvedValue([
      solicitudPendienteMock,
    ]);
    vi.mocked(profileService.getMisCapacitaciones).mockResolvedValue([
      inscripcionMock,
    ]);
    vi.mocked(solicitudesService.cancelarSolicitud).mockResolvedValue({
      msg: "La solicitud fue cancelada correctamente.",
      data: {
        ...solicitudPendienteMock,
        Estado: {
          id: 8,
          codigo: "CANCELADA",
          nombre: "Cancelada",
          activo: true,
        },
      },
    });

    render(
      <AuthContext.Provider value={crearContexto(usuarioProductor)}>
        <MemoryRouter initialEntries={["/mis-servicios"]}>
          <Routes>
            <Route path="/mis-servicios" element={<MisServicios />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    expect(
      await screen.findByText("Análisis Bromatológico NIRS de Forrajes"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Taller de Diagnóstico y Prevención de Tristeza Bovina",
      ),
    ).toBeInTheDocument();

    // Verifica timeline de la solicitud
    expect(screen.getByText("1. Solicitud enviada")).toBeInTheDocument();

    // Cancelar solicitud pendiente
    fireEvent.click(
      screen.getByRole("button", { name: "Cancelar solicitud" }),
    );

    await waitFor(() => {
      expect(solicitudesService.cancelarSolicitud).toHaveBeenCalledWith(301);
    });

    expect(
      await screen.findByText(/La solicitud fue cancelada correctamente/i),
    ).toBeInTheDocument();
    expect(screen.getByText("3. Solicitud cancelada")).toBeInTheDocument();
  });

  it("muestra en Ajustes/Propuestas el listado de propuestas, su línea de seguimiento y permite cancelar una propuesta pendiente", async () => {
    vi.mocked(propuestasService.getPropuestas).mockResolvedValue([
      propuestaPendienteMock,
    ]);
    vi.mocked(propuestasService.cancelarPropuesta).mockResolvedValue({
      msg: "La propuesta fue cancelada correctamente.",
      data: {
        ...propuestaPendienteMock,
        Estado: {
          id: 8,
          codigo: "CANCELADA",
          nombre: "Cancelada",
          activo: true,
        },
      },
    });

    render(
      <AuthContext.Provider value={crearContexto(usuarioProductor)}>
        <MemoryRouter initialEntries={["/ajustes/propuestas"]}>
          <Routes>
            <Route path="/ajustes/:seccion" element={<Ajustes />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    expect(
      await screen.findByText(
        "Bioensayo de Resistencia a Garrapaticidas en Patiño",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("1. Presentada")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Cancelar propuesta" }),
    );

    await waitFor(() => {
      expect(propuestasService.cancelarPropuesta).toHaveBeenCalledWith(701);
    });

    expect(
      await screen.findByText(/La propuesta fue cancelada correctamente/i),
    ).toBeInTheDocument();
    expect(screen.getByText("3. Propuesta cancelada")).toBeInTheDocument();
  });
});
