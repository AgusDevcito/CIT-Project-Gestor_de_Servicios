import { beforeEach, describe, expect, it, vi } from "vitest";
import { http } from "../../lib/http";
import * as authRepository from "../../repositories/auth.repository";
import type { PerfilDTO } from "../../domain/entidades";

vi.mock("../../lib/http", () => ({
  http: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe("repositories/auth.repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mapearPerfil transforma el DTO con alias User al modelo de dominio", () => {
    const dto: PerfilDTO = {
      id: 7,
      user_id: 7,
      first_name: "Ana",
      last_name: "Gomez",
      avatar_url: null,
      User: {
        id: 7,
        username: "ana",
        email: "ana@cit.com",
        role: "cit",
      },
    };

    expect(authRepository.mapearPerfil(dto)).toEqual({
      id: 7,
      username: "ana",
      email: "ana@cit.com",
      rol: "cit",
      nombre: "Ana",
      apellido: "Gomez",
      avatarUrl: null,
    });
  });

  it("login envía POST /login con username y password y devuelve el token", async () => {
    vi.mocked(http.post).mockResolvedValueOnce({
      data: { msg: "Usuario Logueado", token: "jwt-123" },
    });

    const token = await authRepository.login({ username: "ana", password: "secret" });

    expect(http.post).toHaveBeenCalledWith("/login", { username: "ana", password: "secret" });
    expect(token).toBe("jwt-123");
  });

  it("register envía POST /register con FormData", async () => {
    vi.mocked(http.post).mockResolvedValueOnce({
      data: { msg: "Usuario Registrado", document_url: null },
    });

    const formData = new FormData();
    formData.append("username", "nuevo");

    const res = await authRepository.register(formData);

    expect(http.post).toHaveBeenCalledWith("/register", formData);
    expect(res).toEqual({ msg: "Usuario Registrado", document_url: null });
  });

  it("obtenerPerfil consulta GET /profile y mapea la respuesta", async () => {
    const dto: PerfilDTO = {
      id: 3,
      user_id: 3,
      first_name: "Juan",
      last_name: "Perez",
      avatar_url: "/avatar.png",
      User: { id: 3, username: "juan", email: "juan@mail.com", role: "user" },
    };
    vi.mocked(http.get).mockResolvedValueOnce({ data: dto });

    const perfil = await authRepository.obtenerPerfil();

    expect(http.get).toHaveBeenCalledWith("/profile");
    expect(perfil.nombre).toBe("Juan");
    expect(perfil.rol).toBe("user");
  });
});
