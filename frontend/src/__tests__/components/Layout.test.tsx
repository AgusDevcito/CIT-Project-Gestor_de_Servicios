import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import Layout from "../../components/Layout";
import { AuthContext, type AuthContextValue } from "../../context/auth-context";
import type { UsuarioAutenticado } from "../../domain/entidades";

const crearContexto = (parcial: Partial<AuthContextValue>): AuthContextValue => ({
  user: null,
  status: "anonimo",
  login: async () => {
    throw new Error("no implementado");
  },
  register: async () => ({ mensaje: "", documentUrl: null }),
  logout: vi.fn(async () => {}),
  refresh: async () => {},
  ...parcial,
});

const renderLayout = (user: UsuarioAutenticado | null, initialPath = "/") => {
  const logoutMock = vi.fn(async () => {});
  render(
    <AuthContext.Provider
      value={crearContexto({
        user,
        status: user ? "autenticado" : "anonimo",
        logout: logoutMock,
      })}
    >
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<div>Vista Inicio</div>} />
            <Route path="servicios" element={<div>Vista Servicios</div>} />
            <Route path="solicitudes" element={<div>Vista Solicitudes</div>} />
            <Route path="publicaciones" element={<div>Vista Publicaciones</div>} />
            <Route path="propuestas" element={<div>Vista Propuestas</div>} />
            <Route path="perfil" element={<div>Vista Perfil</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
  return { logoutMock };
};

describe("components/Layout (Spec-002 Fase A)", () => {
  it("muestra opciones de Iniciar sesión y Registrarse cuando el usuario es anónimo", () => {
    renderLayout(null);

    const loginLinks = screen.getAllByRole("link", { name: "Iniciar sesión" });
    const registerLinks = screen.getAllByRole("link", { name: "Registrarse" });

    expect(loginLinks.length).toBeGreaterThanOrEqual(1);
    expect(registerLinks.length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByRole("button", { name: "Cerrar sesión" })).not.toBeInTheDocument();
  });

  it("muestra la información básica y etiquetas del rol user, ocultando Solicitudes", () => {
    renderLayout({
      id: 10,
      username: "productor_agro",
      email: "agro@cit.com",
      rol: "user",
      nombre: "Carlos",
      apellido: "Gomez",
      avatarUrl: null,
    });

    expect(screen.getAllByText("Carlos Gomez").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("@productor_agro")).toBeInTheDocument();
    expect(screen.getAllByText("Usuario").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("link", { name: "Ir a Mi Perfil" })).toHaveAttribute(
      "href",
      "/perfil",
    );
    expect(screen.getByText("Solicitar")).toBeInTheDocument();
    expect(screen.getByText("Proponer")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Solicitudes/i })).not.toBeInTheDocument();
  });

  it("muestra las opciones e indicadores de gestión cuando el rol es cit, incluyendo Solicitudes", () => {
    renderLayout({
      id: 20,
      username: "tecnico_cit",
      email: "tecnico@cit.com",
      rol: "cit",
      nombre: "Laura",
      apellido: "Paz",
      avatarUrl: null,
    });

    expect(screen.getAllByText("Personal CIT").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Gestión Técnica CIT")).toBeInTheDocument();
    expect(screen.getByText("Catálogo / Alta")).toBeInTheDocument();
    expect(screen.getByText("Revisión CIT")).toBeInTheDocument();
    expect(screen.getByText("ABM")).toBeInTheDocument();
    expect(screen.getByText("Dictamen")).toBeInTheDocument();
  });

  it("muestra las opciones e indicadores de administración cuando el rol es admin", () => {
    renderLayout({
      id: 30,
      username: "admin_cit",
      email: "admin@cit.com",
      rol: "admin",
      nombre: "Agustín",
      apellido: "Rolón",
      avatarUrl: null,
    });

    expect(screen.getAllByText("Administrador").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Administración General CIT")).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Solicitudes/i })).toBeInTheDocument();
  });

  it("permite ocultar y volver a mostrar la barra lateral", () => {
    renderLayout({
      id: 1,
      username: "user1",
      email: "user1@cit.com",
      rol: "user",
      nombre: "Ana",
      apellido: "Silva",
      avatarUrl: null,
    });

    expect(
      screen.getByRole("complementary", { name: "Navegación principal" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Ocultar barra lateral" }));

    expect(
      screen.queryByRole("complementary", { name: "Navegación principal" }),
    ).not.toBeInTheDocument();

    const btnMostrar = screen.getByRole("button", { name: "Mostrar barra lateral" });
    expect(btnMostrar).toBeInTheDocument();

    fireEvent.click(btnMostrar);

    expect(
      screen.getByRole("complementary", { name: "Navegación principal" }),
    ).toBeInTheDocument();
  });

  it("permite navegar entre las secciones principales como personal CIT", () => {
    renderLayout({
      id: 2,
      username: "cit1",
      email: "cit1@cit.com",
      rol: "cit",
      nombre: "Ana",
      apellido: "Silva",
      avatarUrl: null,
    });

    expect(screen.getByText("Vista Inicio")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("link", { name: /Servicios/i }));
    expect(screen.getByText("Vista Servicios")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("link", { name: /Solicitudes/i }));
    expect(screen.getByText("Vista Solicitudes")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("link", { name: /Publicaciones/i }));
    expect(screen.getByText("Vista Publicaciones")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("link", { name: /Propuestas/i }));
    expect(screen.getByText("Vista Propuestas")).toBeInTheDocument();
  });
});
