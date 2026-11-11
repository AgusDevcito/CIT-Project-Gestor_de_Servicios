import { Router, Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { activateUserWithToken } from "../services/activation.service.js";

const router = Router();

// Endpoint to set password using activation token
router.post(
    "/activate",
    asyncHandler(async (req: Request, res: Response) => {
        const { token, password } = req.body;
        if (!token || !password) {
            return res.status(400).json({ msg: "Token y contraseña son obligatorios" });
        }
        await activateUserWithToken(token, password);
        res.json({ msg: "Contraseña establecida y cuenta activada" });
    }),
);

export const citActivationRouter = router;
