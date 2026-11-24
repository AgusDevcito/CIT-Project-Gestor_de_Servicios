import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthContext, type AuthContextValue } from "../../context/auth-context";
import type { PerfilDTO, UsuarioAutenticado } from "../../domain/entidades";
import Ajustes from "../../pages/Ajustes";
import Perfil from "../../pages/Perfil";
import * as profileService from "../../services/profileService";
import * as propuestasService from "../../services/propuestasService";

vi.mock("../../services/profileService");
vi.mock("../../services/propuestasService");

const refreshMock = vi.fn().mockResolvedValue(undefined);
const logoutMock = vi.fn().mockResolvedValue(undefined);

const crearContexto = (
  user: UsuarioAutenticado | null,
): AuthContextValue => ({
  user,
  status: user ? "autenticado" : "anonimo",
  login: async () => {
    throw new Error("no implementado");
  },
  register: async () => ({ mensaje: "", documentUrl: null }),
  logout: logoutMock,
  refresh: refreshMock,
});

const usuarioCooperativa: UsuarioAutenticado = {
  id: 18,
  username: "coop_bermejo",
  email: "contacto@coopbermejo.org.ar",
  rol: "user",
  nombre: "Agustín",
  apellido: "Rolón",
  avatarUrl: null,
};

const perfilInicialMock: PerfilDTO = {
  id: 18,
  user_id: 18,
  first_name: "Agustín",
  last_name: "Rolón",
  avatar_url: null,
  bio: "Coordinador técnico de productores asociados.",
  tipo_perfil: "PRODUCTOR",
  razon_social: null,
  cuit: null,
  localidad: "El Colorado",
  telefono_whatsapp: "+54 9 370 4223344",
  User: {
    id: 18,
    username: "coop_bermejo",
    email: "contacto@coopbermejo.org.ar",
    role: "user",
  },
};

describe("Spec-003 Nivel 4 — Ajustes/Perfil, Entidad/Cooperativa y Ajustes/Mi Cuenta", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(propuestasService.getPropuestas).mockResolvedValue([]);
    vi.mocked(profileService.getProfileByUserId).mockResolvedValue(
      perfilInicialMock,
    );
    vi.mocked(profileService.getActividadPerfil).mockResolvedValue({
      propuestas: [],
      servicios: [],
      capacitaciones: [],
    });
  });

  it("muestra en Mi Perfil el botón 'Editar perfil' que redirige hacia /ajustes/perfil", async () => {
    render(
      <AuthContext.Provider value={crearContexto(usuarioCooperativa)}>
        <MemoryRouter initialEntries={["/perfil"]}>
          <Routes>
            <Route path="/perfil" element={<Perfil />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    const linkEditar = await screen.findByRole("link", {
      name: /Editar perfil/i,
    });
    expect(linkEditar).toHaveAttribute("href", "/ajustes/perfil");
  });

  it("permite en /ajustes/perfil configurar el Perfil de Entidad / Cooperativa, datos personales, avatar y contraseña", async () => {
    vi.mocked(profileService.updateProfile).mockResolvedValue({
      ...perfilInicialMock,
      tipo_perfil: "ENTIDAD_COOPERATIVA",
      razon_social: "Cooperativa Agropecuaria Río Bermejo Ltda.",
      cuit: "30-71223344-9",
      localidad: "El Colorado",
      telefono_whatsapp: "+54 9 370 4223344",
    });

    render(
      <AuthContext.Provider value={crearContexto(usuarioCooperativa)}>
        <MemoryRouter initialEntries={["/ajustes/perfil"]}>
          <Routes>
            <Route path="/ajustes/:seccion" element={<Ajustes />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    expect(
      await screen.findByRole("heading", {
        name: /Editar Información Personal y Tipo de Perfil/i,
      }),
    ).toBeInTheDocument();

    const selectorTipo = screen.getByLabelText(
      /Modalidad de perfil en CITio/i,
    );
    fireEvent.change(selectorTipo, {
      target: { value: "ENTIDAD_COOPERATIVA" },
    });

    const inputRazonSocial = await screen.findByLabelText(
      /Razón social o nombre de la Cooperativa \/ Entidad \*/i,
    );
    fireEvent.change(inputRazonSocial, {
      target: { value: "Cooperativa Agropecuaria Río Bermejo Ltda." },
    });

    fireEvent.change(screen.getByLabelText(/CUIT institucional/i), {
      target: { value: "30-71223344-9" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: /Guardar cambios de perfil/i }),
    );

    await waitFor(() => {
      expect(profileService.updateProfile).toHaveBeenCalledWith(
        18,
        expect.objectContaining({
          tipo_perfil: "ENTIDAD_COOPERATIVA",
          razon_social: "Cooperativa Agropecuaria Río Bermejo Ltda.",
          cuit: "30-71223344-9",
        }),
      );
    });

    expect(
      await screen.findByText(
        /Información de perfil actualizada correctamente/i,
      ),
    ).toBeInTheDocument();
  });

  it("permite en /ajustes/mi-cuenta eliminar la cuenta validando contraseña y confirmación escrita 'ELIMINAR'", async () => {
    vi.mocked(profileService.deleteOwnAccount).mockResolvedValue({
      msg: "Tu cuenta ha sido dada de baja.",
    });

    render(
      <AuthContext.Provider value={crearContexto(usuarioCooperativa)}>
        <MemoryRouter initialEntries={["/ajustes/mi-cuenta"]}>
          <Routes>
            <Route path="/ajustes/:seccion" element={<Ajustes />} />
            <Route path="/" element={<div>Portada Inicio</div>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    const btnAbrirModal = await screen.findByRole("button", {
      name: /^Eliminar cuenta$/i,
    });
    fireEvent.click(btnAbrirModal);

    fireEvent.change(screen.getByLabelText(/Contraseña actual \*/i), {
      target: { value: "ClaveSegura123" },
    });
    fireEvent.change(
      screen.getByLabelText(/Escribí ELIMINAR para confirmar \*/i),
      {
        target: { value: "ELIMINAR" },
      },
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /Confirmar eliminación definitiva/i,
      }),
    );

    await waitFor(() => {
      expect(profileService.deleteOwnAccount).toHaveBeenCalledWith({
        password: "ClaveSegura123",
        confirmacion: "ELIMINAR",
      });
    });
    expect(logoutMock).toHaveBeenCalled();
  });
});
