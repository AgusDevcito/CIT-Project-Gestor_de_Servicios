export const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ msg: "No tienes permisos para realizar esta acción." });
  }

  return next();
};

export const requireCIT = requireRole("cit");
export const requireUser = requireRole("user");
