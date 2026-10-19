/**
 * Repositorio de autenticación: acceso a datos y mapeo DTO → dominio.
 *
 * Es el **único** archivo que conoce la forma de la respuesta del backend
 * (incluido el alias `User` de Sequelize). Si el backend cambia esa forma,
 * el ajuste queda acotado a este módulo.
 */

import { http } from "../lib/http";
import type {
  LoginInput,
  LoginResponseDTO,
  PerfilDTO,
  RegisterResponseDTO,
  UsuarioAutenticado,
} from "../domain/entidades";
import { esRol } from "../domain/roles";

/** Mapea el perfil que devuelve `GET /api/profile` al modelo de dominio. */
export const mapearPerfil = (dto: PerfilDTO): UsuarioAutenticado => {
  const rol = esRol(dto.User.role) ? dto.User.role : "user";

  return {
    id: dto.User.id,
    username: dto.User.username,
    email: dto.User.email,
    rol,
    nombre: dto.first_name,
    apellido: dto.last_name,
    avatarUrl: dto.avatar_url,
  };
};

/**
 * Inicia sesión y devuelve el JWT.
 * El token se persiste en la capa de servicio, no en el repositorio.
 */
export const login = async (input: LoginInput): Promise<string> => {
  const { data } = await http.post<LoginResponseDTO>("/login", input);
  return data.token;
};

/**
 * Registra un usuario.
 * El body va como `FormData` porque el registro de personal CIT adjunta un
 * documento (multipart/form-data). No se fija `Content-Type` a mano: el
 * navegador debe agregar el `boundary`.
 */
export const register = async (formData: FormData): Promise<RegisterResponseDTO> => {
  const { data } = await http.post<RegisterResponseDTO>("/register", formData);
  return data;
};

/** Devuelve el perfil del usuario autenticado, ya mapeado al dominio. */
export const obtenerPerfil = async (): Promise<UsuarioAutenticado> => {
  const { data } = await http.get<PerfilDTO>("/profile");
  return mapearPerfil(data);
};

/**
 * Cierra la sesión en el backend.
 * Nota: el backend solo limpia una cookie que ya no usa, así que esto es
 * best-effort. El borrado real del token ocurre en el servicio.
 */
export const logout = async (): Promise<void> => {
  await http.post("/logout");
};
