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
        .optional()
        .isString()
        .trim()
        .isURL()
        .withMessage("avatar_url must be a valid URL"),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];