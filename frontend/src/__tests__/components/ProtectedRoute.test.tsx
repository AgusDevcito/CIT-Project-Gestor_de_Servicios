import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { ProtectedRoute, PublicOnlyRoute } from "../../components/ProtectedRoute";
import { AuthContext, type AuthContextValue } from "../../context/auth-context";
import type { UsuarioAutenticado } from "../../domain/entidades";

const crearValorContexto = (
  parcial: Partial<AuthContextValue>,
): AuthContextValue => ({
  user: null,
  status: "anonimo",
  login: async () => {
    throw new Error("no implementado");
  },
  register: async () => ({ mensaje: "", documentUrl: null }),
  logout: async () => {},
  refresh: async () => {},
  ...parcial,
});

const usuarioNormal: UsuarioAutenticado = {
  id: 1,
  username: "usuario1",
  email: "u1@cit.com",
  rol: "user",
  nombre: "Lucia",
  apellido: "Diaz",
  avatarUrl: null,
};

describe("components/ProtectedRoute", () => {
  it("redirige a /login cuando no hay sesión activa", () => {
    render(
      <AuthContext.Provider value={crearValorContexto({ status: "anonimo", user: null })}>
        <MemoryRouter initialEntries={["/privado"]}>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/privado" element={<div>Contenido Privado</div>} />
            </Route>
            <Route path="/login" element={<div>Página de Login</div>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    expect(screen.getByText("Página de Login")).toBeInTheDocument();
    expect(screen.queryByText("Contenido Privado")).not.toBeInTheDocument();
  });

  it("renderiza la ruta hija cuando el usuario está autenticado", () => {
    render(
      <AuthContext.Provider value={crearValorContexto({ status: "autenticado", user: usuarioNormal })}>
        <MemoryRouter initialEntries={["/privado"]}>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/privado" element={<div>Contenido Privado</div>} />
            </Route>
            <Route path="/login" element={<div>Página de Login</div>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    expect(screen.getByText("Contenido Privado")).toBeInTheDocument();
  });

  it("muestra 403 cuando el rol del usuario no está entre los permitidos", () => {
    render(
      <AuthContext.Provider value={crearValorContexto({ status: "autenticado", user: usuarioNormal })}>
        <MemoryRouter initialEntries={["/solo-admin"]}>
          <Routes>
            <Route element={<ProtectedRoute roles={["admin"]} />}>
              <Route path="/solo-admin" element={<div>Panel Admin</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    expect(screen.getByText("403")).toBeInTheDocument();
    expect(screen.queryByText("Panel Admin")).not.toBeInTheDocument();
  });

  it("PublicOnlyRoute redirige a / si ya existe una sesión activa", () => {
    render(
      <AuthContext.Provider value={crearValorContexto({ status: "autenticado", user: usuarioNormal })}>
        <MemoryRouter initialEntries={["/login"]}>
          <Routes>
            <Route element={<PublicOnlyRoute />}>
              <Route path="/login" element={<div>Página de Login</div>} />
            </Route>
            <Route path="/" element={<div>Inicio Autenticado</div>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    expect(screen.getByText("Inicio Autenticado")).toBeInTheDocument();
    expect(screen.queryByText("Página de Login")).not.toBeInTheDocument();
  });
});
