import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthContext, type AuthContextValue } from "../../context/auth-context";
import type { Solicitud, UsuarioAutenticado } from "../../domain/entidades";
import MisServicios from "../../pages/MisServicios";
import Solicitudes from "../../pages/Solicitudes";
import * as catalogosService from "../../services/catalogosService";
import * as profileService from "../../services/profileService";
import * as propuestasService from "../../services/propuestasService";
import * as solicitudesService from "../../services/solicitudesService";

vi.mock("../../services/catalogosService");
vi.mock("../../services/profileService");
vi.mock("../../services/propuestasService");
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

const personalCIT: UsuarioAutenticado = {
  id: 2,
  username: "evaluador_cit",
  email: "cit@conicet.gov.ar",
  rol: "cit",
  nombre: "Laura",
  apellido: "Benítez",
  avatarUrl: null,
};

const solicitudConResultadoMock: Solicitud = {
  id: 405,
  user_id: 12,
  servicio_id: 40,
  estado_id: 7,
  fecha_solicitud: "2026-11-18T10:00:00.000Z",
  observaciones_cit:
    "Análisis completado. Valores de proteína bruta: 14,8% MS.",
  resultado_archivo_url: "/api/uploads/1795400000-informe-nirs-405.pdf",
  resultado_nombre: "Informe-NIRS-Lote-Juarez.pdf",
  resultado_observaciones:
    "Análisis completado. Valores de proteína bruta: 14,8% MS.",
  fecha_entrega_resultado: "2026-11-22T16:30:00.000Z",
  createdAt: "2026-11-18T10:00:00.000Z",
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
  Estado: { id: 7, codigo: "FINALIZADA", nombre: "Finalizada", activo: true },
};

const solicitudActivaCITMock: Solicitud = {
  id: 406,
  user_id: 12,
  servicio_id: 41,
  estado_id: 6,
  fecha_solicitud: "2026-11-19T09:00:00.000Z",
  createdAt: "2026-11-19T09:00:00.000Z",
  Servicio: {
    id: 41,
    servicio_nombre: "Diagnóstico Serológico de Brucelosis Bovina",
    servicio_description: "Prueba BPA y confirmación FPA/ELISA.",
    servicio_img: null,
    sector_id: 2,
    servicio_precio: 18500,
    proveedor_id: 1,
    createdAt: "2026-11-01T10:00:00.000Z",
    Sector: { id: 2, codigo: "GANADERO", nombre: "Ganadero", activo: true },
  },
  Estado: { id: 6, codigo: "ACEPTADA", nombre: "Aceptada", activo: true },
  Solicitante: {
    id: 12,
    username: "productor_formosa",
    email: "productor@campo.com.ar",
    role: "user",
    Profile: {
      first_name: "Gonzalo",
      last_name: "Benítez",
      avatar_url: null,
    },
  },
};

describe("Spec-003 Nivel 2 — Entrega Digital de Resultados (Informes PDF en Solicitudes)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(catalogosService.getSectores).mockResolvedValue([
      { id: 2, codigo: "GANADERO", nombre: "Ganadero", activo: true },
    ]);
    vi.mocked(propuestasService.getPropuestas).mockResolvedValue([]);
    vi.mocked(profileService.getMisCapacitaciones).mockResolvedValue([]);
  });

  it("muestra al productor en Mis Servicios el hito '3. Resultado Oficial Entregado' en el Timeline y el botón 'Descargar Resultado Oficial (PDF)'", async () => {
    vi.mocked(solicitudesService.getSolicitudes).mockResolvedValue([
      solicitudConResultadoMock,
    ]);

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
      screen.getByText("3. Resultado Oficial Entregado"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Informe-NIRS-Lote-Juarez\.pdf/i),
    ).toBeInTheDocument();

    const linkDescarga = screen.getByRole("link", {
      name: /Descargar Resultado Oficial \(PDF\)/i,
    });
    expect(linkDescarga).toHaveAttribute(
      "href",
      "/api/uploads/1795400000-informe-nirs-405.pdf",
    );
  });

  it("permite al personal CIT en Solicitudes cambiar a la pestaña de Servicios y entregar un Resultado Oficial en PDF", async () => {
    vi.mocked(solicitudesService.getSolicitudes).mockResolvedValue([
      solicitudActivaCITMock,
    ]);
    vi.mocked(solicitudesService.subirResultadoSolicitud).mockResolvedValue({
      msg: "Resultado técnico adjuntado y entregado digitalmente al solicitante.",
      data: {
        ...solicitudActivaCITMock,
        resultado_archivo_url: "/api/uploads/1795500000-resultado-brucelosis.pdf",
        resultado_nombre: "Certificado-Brucelosis-406.pdf",
        resultado_observaciones:
          "100% de las muestras resultaron negativas a Brucella abortus.",
        fecha_entrega_resultado: "2026-11-23T18:00:00.000Z",
        Estado: {
          id: 7,
          codigo: "FINALIZADA",
          nombre: "Finalizada",
          activo: true,
        },
      },
    });

    render(
      <AuthContext.Provider value={crearContexto(personalCIT)}>
        <MemoryRouter initialEntries={["/solicitudes"]}>
          <Routes>
            <Route path="/solicitudes" element={<Solicitudes />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    const tabServicios = await screen.findByRole("tab", {
      name: /Solicitudes de Servicios y Resultados/i,
    });
    fireEvent.click(tabServicios);

    expect(
      await screen.findByText("Diagnóstico Serológico de Brucelosis Bovina"),
    ).toBeInTheDocument();

    const btnEntregar = screen.getByRole("button", {
      name: /Entregar Resultado \(PDF\)/i,
    });
    fireEvent.click(btnEntregar);

    const inputArchivo = screen.getByLabelText(
      /Informe o certificado oficial \(PDF, PNG o JPG/i,
    );
    const pdfFile = new File(
      ["%PDF-1.4 informe serológico"],
      "Certificado-Brucelosis-406.pdf",
      { type: "application/pdf" },
    );
    fireEvent.change(inputArchivo, { target: { files: [pdfFile] } });

    const inputObservaciones = screen.getByLabelText(
      /Conclusiones u observaciones técnicas para el productor/i,
    );
    fireEvent.change(inputObservaciones, {
      target: {
        value: "100% de las muestras resultaron negativas a Brucella abortus.",
      },
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: /Confirmar y entregar resultado/i,
      }),
    );

    await waitFor(() => {
      expect(solicitudesService.subirResultadoSolicitud).toHaveBeenCalledWith(
        406,
        {
          archivo: pdfFile,
          observaciones:
            "100% de las muestras resultaron negativas a Brucella abortus.",
          finalizar: true,
        },
      );
    });

    expect(
      await screen.findByText(
        /Resultado técnico adjuntado y entregado digitalmente/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Certificado-Brucelosis-406\.pdf/i),
    ).toBeInTheDocument();
  });
});
