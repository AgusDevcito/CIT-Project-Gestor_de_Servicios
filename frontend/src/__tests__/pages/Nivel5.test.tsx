import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { NotificationBell } from "../../components/NotificationBell";
import { AuthContext, type AuthContextValue } from "../../context/auth-context";
import type {
  NotificacionItem,
  PreferenciasNotificacion,
  UsuarioAutenticado,
} from "../../domain/entidades";
import Ajustes from "../../pages/Ajustes";
import Notificaciones from "../../pages/Notificaciones";
import * as notificacionesService from "../../services/notificacionesService";
import * as profileService from "../../services/profileService";
import * as propuestasService from "../../services/propuestasService";

vi.mock("../../services/notificacionesService");
vi.mock("../../services/profileService");
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

const usuarioProductor: UsuarioAutenticado = {
  id: 12,
  username: "productor_formosa",
  email: "productor@campo.com.ar",
  rol: "user",
  nombre: "Gonzalo",
  apellido: "Benítez",
  avatarUrl: null,
};

const notificacionesMock: NotificacionItem[] = [
  {
    id: 901,
    user_id: 12,
    tipo: "CAMBIO_ESTADO_PROPUESTA",
    titulo: '¡Tu propuesta "Bioensayo de Garrapaticidas" fue aprobada!',
    mensaje:
      "Dictamen CIT: Viabilidad aprobada. Ya fue incorporada al catálogo oficial de Servicios.",
    enlace: "/ajustes/propuestas",
    referencia_tipo: "propuesta",
    referencia_id: 701,
    leida: false,
    fecha_lectura: null,
    createdAt: "2026-11-23T14:00:00.000Z",
  },
  {
    id: 902,
    user_id: 12,
    tipo: "NUEVA_PUBLICACION",
    titulo: "Nueva publicación: Alerta Sanitaria sobre Tristeza Bovina en NEA",
    mensaje:
      "Recomendaciones de prevención y envío de muestras refrigeradas al laboratorio del CIT Formosa.",
    enlace: "/publicaciones/101",
    referencia_tipo: "publicacion",
    referencia_id: 101,
    leida: false,
    fecha_lectura: null,
    createdAt: "2026-11-23T15:00:00.000Z",
  },
];

const preferenciasInicialesMock: PreferenciasNotificacion = {
  noticias_publicaciones: true,
  cambios_propuestas: true,
  nuevos_servicios: true,
  actualizaciones_plataforma: true,
  actividad_usuario: true,
  canal_whatsapp: true,
};

describe("Spec-003 Nivel 5 — Campanilla, Centro de Notificaciones y Ajustes/Notificaciones con WhatsApp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(propuestasService.getPropuestas).mockResolvedValue([]);
    vi.mocked(profileService.getProfileByUserId).mockResolvedValue({
      id: 12,
      user_id: 12,
      first_name: "Gonzalo",
      last_name: "Benítez",
      avatar_url: null,
      bio: null,
      tipo_perfil: "PRODUCTOR",
      telefono_whatsapp: "+54 9 370 4556677",
      User: {
        id: 12,
        username: "productor_formosa",
        email: "productor@campo.com.ar",
        role: "user",
      },
    });
    vi.mocked(notificacionesService.getNotificaciones).mockResolvedValue({
      unreadCount: 2,
      data: notificacionesMock,
    });
    vi.mocked(
      notificacionesService.getPreferenciasNotificacion,
    ).mockResolvedValue(preferenciasInicialesMock);
  });

  it("muestra en la campanilla (NotificationBell) el contador de notificaciones no leídas y enlaza a /notificaciones", async () => {
    render(
      <MemoryRouter>
        <NotificationBell />
      </MemoryRouter>,
    );

    const linkCampana = screen.getByRole("link", {
      name: /Ir a Notificaciones/i,
    });
    expect(linkCampana).toHaveAttribute("href", "/notificaciones");

    const badge = await screen.findByTestId("notification-bell-badge");
    expect(badge).toHaveTextContent("2");
  });

  it("lista en /notificaciones los avisos de propuestas y publicaciones y permite marcarlos como leídos", async () => {
    vi.mocked(
      notificacionesService.marcarNotificacionLeida,
    ).mockResolvedValue({
      ...notificacionesMock[0]!,
      leida: true,
      fecha_lectura: "2026-11-23T19:00:00.000Z",
    });

    render(
      <AuthContext.Provider value={crearContexto(usuarioProductor)}>
        <MemoryRouter initialEntries={["/notificaciones"]}>
          <Routes>
            <Route path="/notificaciones" element={<Notificaciones />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    expect(
      await screen.findByText(
        '¡Tu propuesta "Bioensayo de Garrapaticidas" fue aprobada!',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Nueva publicación: Alerta Sanitaria sobre Tristeza Bovina en NEA",
      ),
    ).toBeInTheDocument();

    const botonesLeer = screen.getAllByRole("button", {
      name: /Marcar como leída/i,
    });
    fireEvent.click(botonesLeer[0]!);

    await waitFor(() => {
      expect(
        notificacionesService.marcarNotificacionLeida,
      ).toHaveBeenCalledWith(901);
    });
  });

  it("permite en /ajustes/notificaciones gestionar qué avisos recibir y activar/desactivar el canal WhatsApp", async () => {
    vi.mocked(
      notificacionesService.updatePreferenciasNotificacion,
    ).mockResolvedValue({
      msg: "Preferencias de notificaciones actualizadas correctamente.",
      data: {
        ...preferenciasInicialesMock,
        actualizaciones_plataforma: false,
        canal_whatsapp: true,
      },
    });

    render(
      <AuthContext.Provider value={crearContexto(usuarioProductor)}>
        <MemoryRouter initialEntries={["/ajustes/notificaciones"]}>
          <Routes>
            <Route path="/ajustes/:seccion" element={<Ajustes />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    expect(
      await screen.findByRole("heading", {
        name: /Preferencias de Notificaciones/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Número vinculado: \+54 9 370 4556677/i),
    ).toBeInTheDocument();

    const checkUpdates = screen.getByLabelText(
      /Actualizaciones y comunicados de la plataforma/i,
    );
    fireEvent.click(checkUpdates);

    fireEvent.click(
      screen.getByRole("button", {
        name: /Guardar preferencias de notificaciones/i,
      }),
    );

    await waitFor(() => {
      expect(
        notificacionesService.updatePreferenciasNotificacion,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          noticias_publicaciones: true,
          cambios_propuestas: true,
          nuevos_servicios: true,
          actividad_usuario: true,
          actualizaciones_plataforma: false,
          canal_whatsapp: true,
        }),
      );
    });

    expect(
      await screen.findByText(
        /Preferencias de notificaciones actualizadas correctamente/i,
      ),
    ).toBeInTheDocument();
  });
});
