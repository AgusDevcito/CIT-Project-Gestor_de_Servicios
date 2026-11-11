import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthContext, type AuthContextValue } from "../../context/auth-context";
import type {
  ActividadPerfil,
  PerfilDTO,
  UsuarioAutenticado,
} from "../../domain/entidades";
import Perfil from "../../pages/Perfil";
import * as profileService from "../../services/profileService";

vi.mock("../../services/profileService");

const refreshMock = vi.fn().mockResolvedValue(undefined);

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
  refresh: refreshMock,
});

const usuarioAutenticado: UsuarioAutenticado = {
  id: 14,
  username: "productora_norte",
  email: "elena.rios@productores.org.ar",
  rol: "user",
  nombre: "Elena",
  apellido: "Ríos",
  avatarUrl: null,
};

const perfilRemotoMock: PerfilDTO = {
  id: 7,
  user_id: 14,
  first_name: "Elena",
  last_name: "Ríos",
  avatar_url: null,
  bio: "Ingeniera Agrónoma y coordinadora técnica en cooperativa hortícola.",
  User: {
    id: 14,
    username: "productora_norte",
    email: "elena.rios@productores.org.ar",
    role: "user",
  },
};

const actividadMock: ActividadPerfil = {
  propuestas: [
    {
      id: 30,
      titulo: "Ensayo de Bioinsumos en Cultivos de Banana",
      sector_id: 3,
      problematica:
        "Evaluación a campo de microorganismos benéficos en plantaciones locales.",
      estado_id: 5,
      solicitante: 14,
      nombre_organismo: "Cooperativa Frutihortícola Subtropical",
      email_contacto: "elena.rios@productores.org.ar",
      telefono_contacto: "+54 370 4332211",
      bienes_recursos: "Parcelas experimentales de 5 hectáreas y riego por goteo.",
      documento_url: "/api/uploads/protocolo-banana.pdf",
      documento_nombre: "protocolo-banana.pdf",
      servicio_generado_id: 45,
      cirRevisorId: 2,
      citJustificacion:
        "Propuesta aprobada e incorporada al catálogo de ensayos frutihortícolas.",
      citFechaRevision: "2026-10-19T14:00:00.000Z",
      createdAt: "2026-10-14T09:00:00.000Z",
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
    },
  ],
  servicios: [
    {
      id: 80,
      user_id: 14,
      servicio_id: 11,
      estado_id: 2,
      fecha_solicitud: "2026-10-16T11:30:00.000Z",
      createdAt: "2026-10-16T11:30:00.000Z",
      Servicio: {
        id: 11,
        servicio_nombre: "Análisis Fisicoquímico de Agua para Riego",
        servicio_description:
          "Determinación de conductividad, pH, RAS y cationes principales.",
        servicio_img: null,
        sector_id: 1,
        servicio_precio: 28000,
        proveedor_id: 2,
        createdAt: "2026-09-01T10:00:00.000Z",
      },
      Estado: {
        id: 2,
        codigo: "APROBADO",
        nombre: "Aprobado",
        activo: true,
      },
    },
  ],
  capacitaciones: [
    {
      id: 50,
      user_id: 14,
      publicacion_id: 5,
      estado: "INSCRIPTO",
      observaciones: null,
      createdAt: "2026-10-18T16:00:00.000Z",
      Publicacion: {
        id: 5,
        titulo: "Taller de Manejo Integrado de Plagas en Algodón y Maíz",
        contenido:
          "Capacitación teórico-práctica dictada por investigadores del CIT Formosa.",
        tipo_contenido: "capacitacion",
        sector_id: 1,
        author_id: 2,
        publicado: true,
        createdAt: "2026-10-10T10:00:00.000Z",
        Sector: {
          id: 1,
          codigo: "AGRICOLA",
          nombre: "Agrícola",
          activo: true,
        },
      },
    },
  ],
};

describe("pages/Perfil (Spec-002 Fase G)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(profileService.getProfileByUserId).mockResolvedValue(
      perfilRemotoMock,
    );
    vi.mocked(profileService.getActividadPerfil).mockResolvedValue(
      actividadMock,
    );
  });

  it("muestra la información personal, Mis Propuestas, Mis Servicios y Mis Capacitaciones, y permite consultar el detalle de revisión de una propuesta", async () => {
    render(
      <AuthContext.Provider value={crearContexto(usuarioAutenticado)}>
        <MemoryRouter initialEntries={["/perfil"]}>
          <Routes>
            <Route path="/perfil" element={<Perfil />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    // Datos personales y campos administrativos protegidos (solo lectura)
    expect(await screen.findByText("Elena Ríos")).toBeInTheDocument();
    expect(
      screen.getAllByText(
        "Ingeniera Agrónoma y coordinadora técnica en cooperativa hortícola.",
      ).length,
    ).toBeGreaterThan(0);

    const emailReadOnly = screen.getByLabelText(
      /Correo electrónico \(no modificable\)/i,
    );
    const rolReadOnly = screen.getByLabelText(
      /Rol y permisos en el sistema \(no modificable\)/i,
    );
    expect(emailReadOnly).toBeDisabled();
    expect(rolReadOnly).toBeDisabled();

    // Sección Mis Propuestas
    expect(
      screen.getByText("Ensayo de Bioinsumos en Cultivos de Banana"),
    ).toBeInTheDocument();

    // Sección Mis Servicios
    expect(
      screen.getByText("Análisis Fisicoquímico de Agua para Riego"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Contratación activa y aprobada/i),
    ).toBeInTheDocument();

    // Sección Mis Capacitaciones
    expect(
      screen.getByText(
        "Taller de Manejo Integrado de Plagas en Algodón y Maíz",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Inscripto")).toBeInTheDocument();

    // Abrir modal de detalle y resultado de revisión de la propuesta
    fireEvent.click(
      screen.getByRole("button", { name: /Ver detalles y revisión/i }),
    );
    expect(
      await screen.findByText(
        "Propuesta aprobada e incorporada al catálogo de ensayos frutihortícolas.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: /Ir al servicio publicado en el catálogo/i,
      }),
    ).toHaveAttribute("href", "/servicios/45");
  });

  it("permite editar y persistir los datos permitidos del perfil sincronizando con AuthContext", async () => {
    vi.mocked(profileService.updateProfile).mockResolvedValue({
      ...perfilRemotoMock,
      first_name: "Elena María",
      last_name: "Ríos Duarte",
      bio: "Especialista en producción frutihortícola sostenible.",
      avatar_url: "https://cit.gob.ar/avatar-elena.png",
    });

    render(
      <AuthContext.Provider value={crearContexto(usuarioAutenticado)}>
        <MemoryRouter initialEntries={["/perfil"]}>
          <Routes>
            <Route path="/perfil" element={<Perfil />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    await screen.findByText("Elena Ríos");

    fireEvent.change(screen.getByLabelText(/^Nombre \*/i), {
      target: { value: "Elena María" },
    });
    fireEvent.change(screen.getByLabelText(/^Apellido \*/i), {
      target: { value: "Ríos Duarte" },
    });
    fireEvent.change(
      screen.getByLabelText(/Información personal o descripción/i),
      {
        target: { value: "Especialista en producción frutihortícola sostenible." },
      },
    );
    fireEvent.change(screen.getByLabelText(/URL del avatar/i), {
      target: { value: "https://cit.gob.ar/avatar-elena.png" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Guardar cambios/i }));

    await waitFor(() => {
      expect(profileService.updateProfile).toHaveBeenCalledWith(14, {
        first_name: "Elena María",
        last_name: "Ríos Duarte",
        bio: "Especialista en producción frutihortícola sostenible.",
        avatar_url: "https://cit.gob.ar/avatar-elena.png",
      });
    });

    expect(refreshMock).toHaveBeenCalled();
    expect(
      await screen.findByText(/Información personal actualizada correctamente/i),
    ).toBeInTheDocument();
  });
});
