import { Router, Request, Response } from "express";
import * as profileService from "../services/profile.service.js";
import { validateProfileUpdate } from "../middlewares/profile.middleware.js";
import { getAuthUser, requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { requireSelfOnly } from "../middlewares/profileAccess.middleware.js";
import { ROL } from "../constants/roles.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const profileRouter = Router();

// Admin list all profiles
profileRouter.get(
  "/profiles",
  requireAuth,
  requireRole(ROL.ADMIN),
  asyncHandler(async (_req: Request, res: Response) => {
    const data = await profileService.list();
    res.json({ count: data.length, data });
  }),
);

// Get own profile — authentication and self-only (or admin)
profileRouter.get(
  "/profile/:userId",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const user = getAuthUser(req);
    const requestedId = Number(req.params.userId);
    if (user.role === ROL.ADMIN) {
      const data = await profileService.getByUserId(requestedId);
      res.json({ data });
      return;
    }
    if (user.id !== requestedId) {
      res.status(403).json({ msg: "No tienes permisos para realizar esta acción." });
      return;
    }
    const data = await profileService.getByUserId(requestedId);
    res.json({ data });
  }),
);

// Update own profile — authentication, self-only and validation
// Exclusivamente modifica datos personales, de entidad/cooperativa y contacto (ignora rol, permisos, email y estado CIT)
profileRouter.put(
  "/profile/:userId",
  requireAuth,
  requireSelfOnly,
  validateProfileUpdate,
  asyncHandler(async (req: Request, res: Response) => {
    const allowed = {
      first_name: req.body?.first_name,
      last_name: req.body?.last_name,
      avatar_url: req.body?.avatar_url,
      bio: req.body?.bio,
      tipo_perfil: req.body?.tipo_perfil,
      razon_social: req.body?.razon_social,
      cuit: req.body?.cuit,
      localidad: req.body?.localidad,
      telefono_whatsapp: req.body?.telefono_whatsapp,
    };
    const data = await profileService.update(Number(req.params.userId), allowed);
    res.json({ msg: "Perfil actualizado", data });
  }),
);

// Eliminación / Baja controlada de la cuenta propia (Nivel 4 — Ajustes / Mi Cuenta)
profileRouter.post(
  "/profile/eliminar-cuenta",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const user = getAuthUser(req);
    await profileService.eliminarCuenta(user.id, {
      password: req.body?.password,
      confirmacion: req.body?.confirmacion,
    });
    res.clearCookie("token");
    res.json({
      msg: "Tu cuenta ha sido dada de baja y tus datos personales fueron anonimizados.",
    });
  }),
);

// Actividad privada del usuario autenticado (Mis Propuestas, Mis Servicios, Mis Capacitaciones)
// Protegida con requireSelfOnly para impedir consultar información privada de otra cuenta cambiando userId
profileRouter.get(
  "/profile/:userId/actividad",
  requireAuth,
  requireSelfOnly,
  asyncHandler(async (req: Request, res: Response) => {
    const data = await profileService.getActividadUsuario(Number(req.params.userId));
    res.json({ data });
  }),
);

// Mis capacitaciones e inscripción a capacitaciones del usuario autenticado
profileRouter.get(
  "/mis-capacitaciones",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const user = getAuthUser(req);
    const data = await profileService.listMisCapacitaciones(user.id);
    res.json({ count: data.length, data });
  }),
);

profileRouter.post(
  "/capacitaciones/:publicacionId/inscribirse",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const user = getAuthUser(req);
    const data = await profileService.inscribirCapacitacion(
      user.id,
      Number(req.params.publicacionId),
    );
    res.status(201).json({
      msg: "Inscripción registrada exitosamente en la capacitación.",
      data,
    });
  }),
);

// Gestión CIT/Admin de inscriptos en capacitaciones
profileRouter.get(
  "/capacitaciones/:publicacionId/inscriptos",
  requireAuth,
  requireRole(ROL.CIT, ROL.ADMIN),
  asyncHandler(async (req: Request, res: Response) => {
    const data = await profileService.listInscriptosCapacitacion(
      Number(req.params.publicacionId),
    );
    res.json({ count: data.length, data });
  }),
);

profileRouter.patch(
  "/capacitaciones/inscripciones/:id/estado",
  requireAuth,
  requireRole(ROL.CIT, ROL.ADMIN),
  asyncHandler(async (req: Request, res: Response) => {
    const data = await profileService.updateEstadoInscripcionCapacitacion(
      Number(req.params.id),
      req.body?.estado,
      req.body?.observaciones,
    );
    res.json({
      msg: "Estado de la inscripción actualizado correctamente.",
      data,
    });
  }),
);
