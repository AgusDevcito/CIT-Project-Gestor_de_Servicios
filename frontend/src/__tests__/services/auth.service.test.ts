import { beforeEach, describe, expect, it, vi } from "vitest";
import { tokenStore } from "../../lib/token-store";
import * as authRepository from "../../repositories/auth.repository";
import * as authService from "../../services/auth.service";
import type { UsuarioAutenticado } from "../../domain/entidades";

vi.mock("../../repositories/auth.repository", () => ({
  login: vi.fn(),
  register: vi.fn(),
  obtenerPerfil: vi.fn(),
  logout: vi.fn(),
}));

const usuarioEjemplo: UsuarioAutenticado = {
  id: 1,
  username: "ana",
  email: "ana@cit.com",
  rol: "user",
  nombre: "Ana",
  apellido: "Gomez",
  avatarUrl: null,
};

describe("services/auth.service", () => {
  beforeEach(() => {
    tokenStore.limpiar();
    vi.clearAllMocks();
  });

  it("login guarda el token y devuelve el perfil del usuario", async () => {
    vi.mocked(authRepository.login).mockResolvedValueOnce("token-valido");
    vi.mocked(authRepository.obtenerPerfil).mockResolvedValueOnce(usuarioEjemplo);

    const usuario = await authService.login("ana", "123456");

    expect(tokenStore.leer()).toBe("token-valido");
    expect(usuario).toEqual(usuarioEjemplo);
  });

  it("si login falla, no guarda ningún token", async () => {
    vi.mocked(authRepository.login).mockRejectedValueOnce(new Error("Credenciales inválidas"));

    await expect(authService.login("ana", "mal")).rejects.toThrow("Credenciales inválidas");
    expect(tokenStore.leer()).toBeNull();
    expect(authRepository.obtenerPerfil).not.toHaveBeenCalled();
  });

  it("si obtenerPerfil falla tras el login, limpia el token guardado", async () => {
    vi.mocked(authRepository.login).mockResolvedValueOnce("token-temporal");
    vi.mocked(authRepository.obtenerPerfil).mockRejectedValueOnce(new Error("Fallo de perfil"));

    await expect(authService.login("ana", "123456")).rejects.toThrow("Fallo de perfil");
    expect(tokenStore.leer()).toBeNull();
  });

  it("getSession sin token devuelve null sin llamar al repositorio", async () => {
    const sesion = await authService.getSession();

    expect(sesion).toBeNull();
    expect(authRepository.obtenerPerfil).not.toHaveBeenCalled();
  });

  it("getSession con token válido devuelve el usuario", async () => {
    tokenStore.guardar("token-activo");
    vi.mocked(authRepository.obtenerPerfil).mockResolvedValueOnce(usuarioEjemplo);

    const sesion = await authService.getSession();

    expect(sesion).toEqual(usuarioEjemplo);
    expect(authRepository.obtenerPerfil).toHaveBeenCalledOnce();
  });

  it("logout limpia el token incluso si la petición al backend falla", async () => {
    tokenStore.guardar("token-activo");
    vi.mocked(authRepository.logout).mockRejectedValueOnce(new Error("Red caída"));

    await authService.logout();

    expect(tokenStore.leer()).toBeNull();
  });
});
