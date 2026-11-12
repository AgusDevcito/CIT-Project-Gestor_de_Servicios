import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProtectedRoute } from "../../components/ProtectedRoute";
import { AuthContext, type AuthContextValue } from "../../context/auth-context";
import type { Propuesta, UsuarioAutenticado } from "../../domain/entidades";
import Propuestas from "../../pages/Propuestas";
import * as catalogosService from "../../services/catalogosService";
import * as propuestasService from "../../services/propuestasService";

vi.mock("../../services/catalogosService");
vi.mock("../../services/propuestasService");

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

const usuarioNormal: UsuarioAutenticado = {
  id: 12,
  username: "coop_agricola",
  email: "contacto@coopformosa.org.ar",
  rol: "user",
  nombre: "Roberto",
  apellido: "Acosta",
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

const propuestaExistenteMock: Propuesta = {
  id: 25,
  titulo: "Laboratorio Móvil de Semillas Hortícolas",
  sector_id: 3,
  problematica:
    "Control de poder germinativo y pureza física en semillas de pequeños productores.",
  estado_id: 5,
  solicitante: 12,
  nombre_organismo: "Asociación de Productores Frutihortícolas",
  email_contacto: "contacto@coopformosa.org.ar",
  telefono_contacto: "+54 370 4556677",
  bienes_recursos: "Germinadores estandarizados, lupas estereoscópicas y balanzas.",
  documento_url: "/api/uploads/memoria-semillas.pdf",
  documento_nombre: "memoria-semillas.pdf",
  servicio_generado_id: 90,
  cirRevisorId: 2,
  citJustificacion:
    "Propuesta aprobada por su impacto directo en la calidad de siembra regional.",
  citFechaRevision: "2026-10-22T15:00:00.000Z",
  createdAt: "2026-10-20T10:00:00.000Z",
  Sector: {
    id: 3,
    codigo: "FRUTIHORTICOLA",
    nombre: "Frutihortícola",
    activo: true,
  },
  Estado: {
    id: 5,
    codigo: "ACEPTADA",
    nombre: "Aceptada",
    activo: true,
  },
};

describe("pages/Propuestas (Spec-002 Fase F)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(catalogosService.getSectores).mockResolvedValue([
      { id: 1, codigo: "AGRICOLA", nombre: "Agrícola", activo: true },
      { id: 2, codigo: "GANADERO", nombre: "Ganadero", activo: true },
      {
        id: 3,
        codigo: "FRUTIHORTICOLA",
        nombre: "Frutihortícola",
        activo: true,
      },
    ]);
    vi.mocked(propuestasService.getPropuestas).mockResolvedValue([
      propuestaExistenteMock,
    ]);
  });

  it("impide el acceso a usuarios anónimos redirigiéndolos al inicio de sesión", () => {
    render(
      <AuthContext.Provider value={crearContexto(null)}>
        <MemoryRouter initialEntries={["/propuestas"]}>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/propuestas" element={<Propuestas />} />
            </Route>
            <Route path="/login" element={<div>Pantalla de Login</div>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    expect(screen.getByText("Pantalla de Login")).toBeInTheDocument();
  });

  it("no muestra el formulario externo a roles cit/admin y los dirige a la bandeja interna de Solicitudes", async () => {
    render(
      <AuthContext.Provider value={crearContexto(personalCIT)}>
        <MemoryRouter initialEntries={["/propuestas"]}>
          <Routes>
            <Route path="/propuestas" element={<Propuestas />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    expect(
      await screen.findByText(
        /Vista informativa para personal CIT y Administradores/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Realizar propuesta/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Ir a Solicitudes \(Evaluación CIT\)/i }),
    ).toHaveAttribute("href", "/solicitudes");
  });

  it("permite al usuario normal abrir el formulario con 'Realizar propuesta', validar archivos y enviar la propuesta completa con adjunto", async () => {
    const nuevaPropuestaCreada: Propuesta = {
      id: 26,
      titulo: "Monitoreo Agroecológico de Plagas en Algodón",
      sector_id: 1,
      problematica:
        "Implementación de trampas de feromonas y seguimiento semanal en lotes de productores agrícolas.",
      estado_id: 1,
      solicitante: 12,
      nombre_organismo: "Cooperativa Agrícola del Litoral Formoseño",
      email_contacto: "contacto@coopformosa.org.ar",
      telefono_contacto: "+54 370 4998877",
      bienes_recursos: "20 trampas de monitoreo, camionetas 4x4 y 3 ingenieros agrónomos.",
      documento_url: "/api/uploads/1794400000-plan-monitoreo.pdf",
      documento_nombre: "plan-monitoreo.pdf",
      servicio_generado_id: null,
      cirRevisorId: null,
      citJustificacion: null,
      citFechaRevision: null,
      createdAt: "2026-10-25T12:00:00.000Z",
      Sector: { id: 1, codigo: "AGRICOLA", nombre: "Agrícola", activo: true },
      Estado: { id: 1, codigo: "PENDIENTE", nombre: "Pendiente", activo: true },
    };

    vi.mocked(propuestasService.crearPropuesta).mockResolvedValue({
      msg: "Propuesta recibida exitosamente. El equipo del CIT evaluará la solicitud.",
      data: nuevaPropuestaCreada,
    });

    render(
      <AuthContext.Provider value={crearContexto(usuarioNormal)}>
        <MemoryRouter initialEntries={["/propuestas"]}>
          <Routes>
            <Route path="/propuestas" element={<Propuestas />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    // Texto institucional y seguimiento de propuesta previa aceptada con link al servicio
    expect(
      await screen.findByText(/especialmente las organizaciones agricultoras/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Laboratorio Móvil de Semillas Hortícolas"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Ver servicio publicado/i }),
    ).toHaveAttribute("href", "/servicios/90");

    // Abrir formulario con "Realizar propuesta"
    const botonesRealizar = screen.getAllByRole("button", {
      name: /Realizar propuesta/i,
    });
    fireEvent.click(botonesRealizar[0]!);

    expect(
      screen.getByRole("heading", {
        name: /Formulario de presentación de propuesta/i,
      }),
    ).toBeInTheDocument();

    // Validar rechazo de archivo inválido (.exe)
    const inputArchivo = screen.getByLabelText(
      /8\. Archivos adjuntos para documentación/i,
    );
    const archivoInvalido = new File([" MZ "], "script.exe", {
      type: "application/x-msdownload",
    });
    fireEvent.change(inputArchivo, { target: { files: [archivoInvalido] } });

    expect(
      screen.getByText(
        /Formato de archivo no válido\. Solo se permiten documentos PDF o imágenes PNG\/JPG/i,
      ),
    ).toBeInTheDocument();

    // Adjuntar un PDF válido y completar los 8 campos
    const archivoPdfValido = new File(
      ["%PDF-1.4 contenido técnico"],
      "plan-monitoreo.pdf",
      { type: "application/pdf" },
    );
    fireEvent.change(inputArchivo, { target: { files: [archivoPdfValido] } });

    fireEvent.change(
      screen.getByLabelText(/1\. Nombre del organismo u organización/i),
      {
        target: { value: "Cooperativa Agrícola del Litoral Formoseño" },
      },
    );
    fireEvent.change(
      screen.getByLabelText(/2\. Correo electrónico de contacto/i),
      {
        target: { value: "contacto@coopformosa.org.ar" },
      },
    );
    fireEvent.change(
      screen.getByLabelText(/3\. Número de teléfono o WhatsApp/i),
      {
        target: { value: "+54 370 4998877" },
      },
    );
    fireEvent.change(screen.getByLabelText(/4\. Nombre de la propuesta/i), {
      target: { value: "Monitoreo Agroecológico de Plagas en Algodón" },
    });
    fireEvent.change(
      screen.getByLabelText(/5\. Área a la que está orientada/i),
      {
        target: { value: "AGRICOLA" },
      },
    );
    fireEvent.change(
      screen.getByLabelText(
        /6\. Información detallada sobre su utilidad y funciones/i,
      ),
      {
        target: {
          value:
            "Implementación de trampas de feromonas y seguimiento semanal en lotes de productores agrícolas.",
        },
      },
    );
    fireEvent.change(
      screen.getByLabelText(/7\. Bienes, equipamiento o recursos que propone/i),
      {
        target: {
          value:
            "20 trampas de monitoreo, camionetas 4x4 y 3 ingenieros agrónomos.",
        },
      },
    );

    fireEvent.click(screen.getByRole("button", { name: /Enviar propuesta/i }));

    await waitFor(() => {
      expect(propuestasService.crearPropuesta).toHaveBeenCalledWith(
        expect.objectContaining({
          nombre_organismo: "Cooperativa Agrícola del Litoral Formoseño",
          email_contacto: "contacto@coopformosa.org.ar",
          telefono_contacto: "+54 370 4998877",
          titulo: "Monitoreo Agroecológico de Plagas en Algodón",
          sector: "AGRICOLA",
          bienes_recursos:
            "20 trampas de monitoreo, camionetas 4x4 y 3 ingenieros agrónomos.",
          documentoFile: archivoPdfValido,
        }),
      );
    });

    // Confirmación y aparición en el listado con estado Pendiente
    expect(
      await screen.findByText(/Propuesta recibida exitosamente/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Monitoreo Agroecológico de Plagas en Algodón"),
    ).toBeInTheDocument();
    expect(screen.getByText("Pendiente")).toBeInTheDocument();
  });

  it("permite eliminar una propuesta registrada con confirmación", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.mocked(propuestasService.getPropuestas).mockResolvedValue([
      propuestaExistenteMock,
    ]);
    vi.mocked(propuestasService.deletePropuesta).mockResolvedValue();

    render(
      <AuthContext.Provider value={crearContexto(usuarioNormal)}>
        <MemoryRouter initialEntries={["/propuestas"]}>
          <Propuestas />
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    const btnEliminar = await screen.findByRole("button", {
      name: `Eliminar propuesta ${propuestaExistenteMock.titulo}`,
    });
    expect(btnEliminar).toBeInTheDocument();

    fireEvent.click(btnEliminar);

    await waitFor(() => {
      expect(propuestasService.deletePropuesta).toHaveBeenCalledWith(25);
    });

    await waitFor(() => {
      expect(
        screen.getByText(/fue eliminada exitosamente/i),
      ).toBeInTheDocument();
    });
  });
});
