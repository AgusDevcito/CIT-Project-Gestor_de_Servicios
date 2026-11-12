import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthContext, type AuthContextValue } from "../../context/auth-context";
import type { Servicio, Solicitud, UsuarioAutenticado } from "../../domain/entidades";
import ServicioDetalle from "../../pages/ServicioDetalle";
import Servicios from "../../pages/Servicios";
import * as catalogosService from "../../services/catalogosService";
import * as serviciosService from "../../services/serviciosService";
import * as solicitudesService from "../../services/solicitudesService";

vi.mock("../../services/catalogosService", () => ({
  getSectores: vi.fn(),
  getEstados: vi.fn(),
}));

vi.mock("../../services/serviciosService", () => ({
  getServicios: vi.fn(),
  getServicioById: vi.fn(),
  createServicio: vi.fn(),
  deleteServicio: vi.fn(),
  createResenaServicio: vi.fn(),
}));

vi.mock("../../services/solicitudesService", () => ({
  getSolicitudes: vi.fn(),
  createSolicitud: vi.fn(),
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
  username: "productor1",
  email: "p1@agro.com",
  rol: "user",
  nombre: "Juan",
  apellido: "Pérez",
  avatarUrl: null,
};

const usuarioCIT: UsuarioAutenticado = {
  id: 2,
  username: "dra_lozina",
  email: "cit@conicet.gov.ar",
  rol: "cit",
  nombre: "Laura",
  apellido: "Lozina",
  avatarUrl: null,
};

const servicioMock: Servicio = {
  id: 1,
  servicio_nombre: "Serología para Brucelosis (BPA y FPA)",
  servicio_description: "Prueba tamiz y confirmatoria en suero bovino.",
  servicio_img: null,
  sector_id: 2,
  servicio_precio: 3500,
  proveedor_id: 2,
  createdAt: "2026-11-10T12:00:00Z",
  Sector: { id: 2, codigo: "GANADERO", nombre: "Ganadero", activo: true },
  Proveedor: { id: 2, username: "dra_lozina", email: "cit@conicet.gov.ar", role: "cit" },
  Resenas: [
    {
      id: 100,
      servicio_id: 1,
      user_id: 99,
      calificacion: 5,
      comentario: "Excelente velocidad de diagnóstico y atención técnica.",
      createdAt: "2026-11-11T10:00:00Z",
      Autor: { id: 99, username: "estancia_norte", email: "en@agro.com", role: "user" },
    },
  ],
  promedioCalificacion: 5.0,
  totalResenas: 1,
};

const servicioAgricolaMock: Servicio = {
  id: 2,
  servicio_nombre: "Análisis Fitopatológico de Cultivos",
  servicio_description: "Detección de hongos y bacterias en hojas y raíces.",
  servicio_img: null,
  sector_id: 1,
  servicio_precio: 0,
  proveedor_id: 2,
  createdAt: "2026-11-09T12:00:00Z",
  Sector: { id: 1, codigo: "AGRICOLA", nombre: "Agrícola", activo: true },
  Resenas: [],
  promedioCalificacion: null,
  totalResenas: 0,
};

describe("pages/Servicios y pages/ServicioDetalle (Spec-002 Fase C)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(catalogosService.getSectores).mockResolvedValue([
      { id: 1, codigo: "AGRICOLA", nombre: "Agrícola", activo: true },
      { id: 2, codigo: "GANADERO", nombre: "Ganadero", activo: true },
    ]);
  });

  it("lista el catálogo de servicios, muestra calificaciones y permite filtrar por búsqueda y sector", async () => {
    vi.mocked(serviciosService.getServicios).mockResolvedValue([
      servicioMock,
      servicioAgricolaMock,
    ]);
    vi.mocked(solicitudesService.getSolicitudes).mockResolvedValue([]);

    render(
      <AuthContext.Provider value={crearContexto(usuarioNormal)}>
        <MemoryRouter initialEntries={["/servicios"]}>
          <Servicios />
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    await waitFor(() => {
      expect(
        screen.getByText("Serología para Brucelosis (BPA y FPA)"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Análisis Fitopatológico de Cultivos"),
      ).toBeInTheDocument();
    });

    // Muestra promedio de calificación en el primer servicio y "Consultar" en el de precio 0
    expect(screen.getByLabelText("Calificación promedio 5 de 5")).toBeInTheDocument();
    expect(screen.getByText("Consultar")).toBeInTheDocument();

    // Filtrar por sector AGRICOLA
    fireEvent.change(screen.getByLabelText("Filtrar por sector"), {
      target: { value: "AGRICOLA" },
    });

    expect(
      screen.queryByText("Serología para Brucelosis (BPA y FPA)"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("Análisis Fitopatológico de Cultivos"),
    ).toBeInTheDocument();
  });

  it("permite contratar un servicio y evita solicitudes duplicadas marcándolo como Ya solicitado", async () => {
    vi.mocked(serviciosService.getServicios).mockResolvedValue([servicioMock]);
    vi.mocked(solicitudesService.getSolicitudes).mockResolvedValue([]);
    const nuevaSolicitud: Solicitud = {
      id: 50,
      user_id: 10,
      servicio_id: 1,
      estado_id: 1,
      fecha_solicitud: "2026-11-11T12:00:00Z",
      createdAt: "2026-11-11T12:00:00Z",
      Estado: { id: 1, codigo: "PENDIENTE", nombre: "Pendiente", activo: true },
    };
    vi.mocked(solicitudesService.createSolicitud).mockResolvedValue(nuevaSolicitud);

    render(
      <AuthContext.Provider value={crearContexto(usuarioNormal)}>
        <MemoryRouter initialEntries={["/servicios"]}>
          <Servicios />
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    const btnSolicitar = await screen.findByRole("button", { name: "Solicitar" });
    fireEvent.click(btnSolicitar);

    await waitFor(() => {
      expect(solicitudesService.createSolicitud).toHaveBeenCalledWith(1);
      expect(screen.getByText(/Solicitud registrada para/i)).toBeInTheDocument();
      expect(screen.getByText(/Ya solicitado \(Pendiente\)/i)).toBeInTheDocument();
    });

    expect(screen.queryByRole("button", { name: "Solicitar" })).not.toBeInTheDocument();
  });

  it("permite al personal CIT abrir el formulario y crear un nuevo servicio", async () => {
    vi.mocked(serviciosService.getServicios).mockResolvedValue([servicioMock]);
    vi.mocked(serviciosService.createServicio).mockResolvedValue(servicioAgricolaMock);

    render(
      <AuthContext.Provider value={crearContexto(usuarioCIT)}>
        <MemoryRouter initialEntries={["/servicios"]}>
          <Servicios />
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    const btnNuevo = await screen.findByRole("button", { name: "+ Nuevo servicio" });
    fireEvent.click(btnNuevo);

    fireEvent.change(screen.getByLabelText(/Nombre del servicio/i), {
      target: { value: "Análisis Fitopatológico de Cultivos" },
    });
    fireEvent.change(screen.getByLabelText(/Arancel en ARS/i), {
      target: { value: "0" },
    });
    fireEvent.change(screen.getByLabelText(/Área \/ Sector/i), {
      target: { value: "AGRICOLA" },
    });
    fireEvent.change(screen.getByLabelText(/Descripción, características/i), {
      target: { value: "Detección de hongos y bacterias en hojas y raíces." },
    });

    fireEvent.click(screen.getByRole("button", { name: "Crear servicio" }));

    await waitFor(() => {
      expect(serviciosService.createServicio).toHaveBeenCalledWith({
        servicio_nombre: "Análisis Fitopatológico de Cultivos",
        servicio_description: "Detección de hongos y bacterias en hojas y raíces.",
        servicio_precio: 0,
        sector: "AGRICOLA",
        servicio_img: undefined,
      });
    });
  });

  it("muestra el detalle del servicio, reseñas de otros usuarios y permite calificar cuando el usuario tiene una solicitud", async () => {
    vi.mocked(serviciosService.getServicioById).mockResolvedValue(servicioMock);
    vi.mocked(solicitudesService.getSolicitudes).mockResolvedValue([
      {
        id: 77,
        user_id: 10,
        servicio_id: 1,
        estado_id: 5,
        fecha_solicitud: "2026-11-10T10:00:00Z",
        createdAt: "2026-11-10T10:00:00Z",
        Estado: { id: 5, codigo: "FINALIZADA", nombre: "Finalizada", activo: true },
      },
    ]);
    vi.mocked(serviciosService.createResenaServicio).mockResolvedValue({
      msg: "Calificación y reseña registradas correctamente.",
      data: {
        id: 101,
        servicio_id: 1,
        user_id: 10,
        calificacion: 4,
        comentario: "Muy buen servicio, resultados claros y rápidos.",
        createdAt: "2026-11-11T14:00:00Z",
      },
    });

    render(
      <AuthContext.Provider value={crearContexto(usuarioNormal)}>
        <MemoryRouter initialEntries={["/servicios/1"]}>
          <Routes>
            <Route path="/servicios/:id" element={<ServicioDetalle />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    await waitFor(() => {
      expect(
        screen.getByRole("heading", {
          name: "Serología para Brucelosis (BPA y FPA)",
        }),
      ).toBeInTheDocument();
    });

    // Muestra reseña existente de otro usuario
    expect(
      screen.getByText("Excelente velocidad de diagnóstico y atención técnica."),
    ).toBeInTheDocument();

    // Permite enviar nueva calificación y reseña porque el usuario solicitó el servicio
    fireEvent.change(screen.getByLabelText("Seleccionar calificación"), {
      target: { value: "4" },
    });
    fireEvent.change(screen.getByLabelText(/Tu reseña/i), {
      target: { value: "Muy buen servicio, resultados claros y rápidos." },
    });

    fireEvent.click(screen.getByRole("button", { name: "Publicar reseña" }));

    await waitFor(() => {
      expect(serviciosService.createResenaServicio).toHaveBeenCalledWith(1, {
        calificacion: 4,
        comentario: "Muy buen servicio, resultados claros y rápidos.",
      });
    });
  });

  it("impide calificar en la vista de detalle si el usuario nunca solicitó el servicio", async () => {
    vi.mocked(serviciosService.getServicioById).mockResolvedValue(servicioMock);
    vi.mocked(solicitudesService.getSolicitudes).mockResolvedValue([]);

    render(
      <AuthContext.Provider value={crearContexto(usuarioNormal)}>
        <MemoryRouter initialEntries={["/servicios/1"]}>
          <Routes>
            <Route path="/servicios/:id" element={<ServicioDetalle />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    await waitFor(() => {
      expect(
        screen.getByText(/solo los usuarios que hayan solicitado este servicio/i),
      ).toBeInTheDocument();
    });

    expect(
      screen.queryByRole("button", { name: "Publicar reseña" }),
    ).not.toBeInTheDocument();
  });

  it("permite a personal CIT eliminar un servicio desde el catálogo con confirmación", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.mocked(serviciosService.getServicios).mockResolvedValue([servicioMock]);
    vi.mocked(serviciosService.deleteServicio).mockResolvedValue();

    render(
      <AuthContext.Provider value={crearContexto(usuarioCIT)}>
        <MemoryRouter>
          <Servicios />
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    await waitFor(() => {
      expect(
        screen.getByText("Serología para Brucelosis (BPA y FPA)"),
      ).toBeInTheDocument();
    });

    const botonEliminar = screen.getByRole("button", {
      name: "Eliminar Serología para Brucelosis (BPA y FPA)",
    });
    expect(botonEliminar).toBeInTheDocument();

    fireEvent.click(botonEliminar);

    await waitFor(() => {
      expect(serviciosService.deleteServicio).toHaveBeenCalledWith(1);
    });

    await waitFor(() => {
      expect(
        screen.getByText(/fue eliminado exitosamente/i),
      ).toBeInTheDocument();
    });
  });
});
