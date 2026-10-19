/**
 * Servicio de autenticación: los casos de uso de la sesión.
 *
 * Orquesta el repositorio y el almacenamiento del token, y decide cuándo la
 * sesión es válida. No conoce axios ni React.
 */

import { tokenStore } from "../lib/token-store";
import * as authRepository from "../repositories/auth.repository";
import type { UsuarioAutenticado } from "../domain/entidades";

export interface ResultadoRegistro {
  mensaje: string;
  documentUrl: string | null;
}

/**
 * Inicia sesión.
 *
 * El backend devuelve el JWT en el body de la respuesta. Se persiste y a
 * continuación se consulta el perfil para conocer el rol y los datos del
 * usuario; si el perfil falla, la sesión queda cerrada.
 */
export const login = async (username: string, password: string): Promise<UsuarioAutenticado> => {
  const token = await authRepository.login({ username, password });
  tokenStore.guardar(token);

  try {
    return await authRepository.obtenerPerfil();
  } catch (error) {
    tokenStore.limpiar();
    throw error;
  }
};

/**
 * Registra un usuario.
 * El registro no autentica: el backend no devuelve token en este endpoint, por
 * lo que el usuario debe iniciar sesión después.
 */
export const register = async (formData: FormData): Promise<ResultadoRegistro> => {
  const data = await authRepository.register(formData);
  return { mensaje: data.msg, documentUrl: data.document_url };
};

/**
 * Restaura la sesión al cargar la aplicación.
 *
 * Si no hay token guardado, **no** se llama al backend: la ausencia de token
 * ya es una respuesta válida. Si hay token, se consulta el perfil; un 401
 * significa que expiró, y en ese caso la sesión se cierra.
 */
export const getSession = async (): Promise<UsuarioAutenticado | null> => {
  if (!tokenStore.leer()) return null;

  try {
    return await authRepository.obtenerPerfil();
  } catch {
    tokenStore.limpiar();
    return null;
  }
};

/**
 * Cierra la sesión en el cliente.
 *
 * El backend no invalida el JWT (no hay lista de revocación), así que además
 * de llamar a `POST /api/logout` se borra el token local, que es lo que
 * realmente impide reutilizarlo desde este navegador.
 */
export const logout = async (): Promise<void> => {
  try {
    await authRepository.logout();
  } catch {
    // Si el backend falla, el cierre de sesión local se completa igual.
  } finally {
    tokenStore.limpiar();
  }
};
