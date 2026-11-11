import { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";

export const validateProfileUpdate = [
  body("first_name")
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage("first_name required"),
  body("last_name")
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage("last_name required"),
  body("avatar_url")
    .optional({ values: "falsy" })
    .isString()
    .trim()
    .isURL()
    .withMessage("avatar_url must be a valid URL"),
  body("bio")
    .optional({ values: "null" })
    .isString()
    .isLength({ max: 1000 })
    .withMessage("bio must not exceed 1000 characters"),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];
