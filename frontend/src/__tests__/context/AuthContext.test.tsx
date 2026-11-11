import { act, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthProvider } from "../../context/AuthContext";
import { useAuth } from "../../context/useAuth";
import * as authService from "../../services/auth.service";
import { registrarManejadorNoAutorizado } from "../../lib/http";
import type { UsuarioAutenticado } from "../../domain/entidades";

vi.mock("../../services/auth.service", () => ({
  getSession: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
}));

let manejadorCapturado: (() => void) | null = null;

vi.mock("../../lib/http", () => ({
  registrarManejadorNoAutorizado: vi.fn((fn: () => void) => {
    manejadorCapturado = fn;
  }),
  quitarManejadorNoAutorizado: vi.fn(() => {
    manejadorCapturado = null;
  }),
}));

const usuarioMock: UsuarioAutenticado = {
  id: 10,
  username: "carlos",
  email: "carlos@cit.com",
  rol: "user",
  nombre: "Carlos",
  apellido: "Ruiz",
  avatarUrl: null,
};

const VisorEstado = () => {
  const { status, user } = useAuth();
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="username">{user?.username ?? "ninguno"}</span>
    </div>
  );
};

describe("context/AuthContext", () => {
  beforeEach(() => {
    manejadorCapturado = null;
    vi.clearAllMocks();
  });

  it("queda en estado anonimo cuando getSession devuelve null", async () => {
    vi.mocked(authService.getSession).mockResolvedValueOnce(null);

    render(
      <MemoryRouter>
        <AuthProvider>
          <VisorEstado />
        </AuthProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("status")).toHaveTextContent("anonimo");
    });
    expect(screen.getByTestId("username")).toHaveTextContent("ninguno");
    expect(registrarManejadorNoAutorizado).toHaveBeenCalledOnce();
  });

  it("restaura la sesión cuando getSession devuelve un usuario", async () => {
    vi.mocked(authService.getSession).mockResolvedValueOnce(usuarioMock);

    render(
      <MemoryRouter>
        <AuthProvider>
          <VisorEstado />
        </AuthProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("status")).toHaveTextContent("autenticado");
    });
    expect(screen.getByTestId("username")).toHaveTextContent("carlos");
  });

  it("limpia el usuario y pasa a anonimo cuando se dispara el manejador de 401", async () => {
    vi.mocked(authService.getSession).mockResolvedValueOnce(usuarioMock);

    render(
      <MemoryRouter initialEntries={["/servicios"]}>
        <AuthProvider>
          <Routes>
            <Route path="/servicios" element={<VisorEstado />} />
            <Route path="/login" element={<div>Pantalla Login</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("status")).toHaveTextContent("autenticado");
    });

    act(() => {
      manejadorCapturado?.();
    });

    await waitFor(() => {
      expect(screen.getByText("Pantalla Login")).toBeInTheDocument();
    });
  });
});
