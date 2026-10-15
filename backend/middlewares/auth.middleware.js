import { verifyToken } from "../helper/jwt.js";

const getTokenFromRequest = (req) => {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice(7);
};

export const requireAuth = (req, res, next) => {
  const token = getTokenFromRequest(req);

  if (!token) {
    return res.status(401).json({ msg: "Se requiere un token de autenticación." });
  }

  try {
    req.user = verifyToken(token);
    req.userLogged = req.user;
    return next();
  } catch (error) {
    return res.status(401).json({ msg: "El token es inválido o ha expirado." });
  }
};

export const requireSelfOrRole = (role) => (req, res, next) => {
  const requestedUserId = Number(req.params.userId || req.params.id);

  if (req.user?.role === role || req.user?.id === requestedUserId) {
    return next();
  }

  return res.status(403).json({ msg: "No tienes permisos para realizar esta acción." });
};
