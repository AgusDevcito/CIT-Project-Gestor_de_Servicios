import { asyncHandler } from "../utils/asyncHandler.js";
import * as citService from "../services/citApplication.service.js";
import { uploadDocument } from "../helpers/upload.js";
import type { Request, Response } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { ROL } from "../constants/roles.js";

import { Router } from "express";

const router = Router();
router.post(
    "/",
    uploadDocument.fields([
        { name: "dni_front", maxCount: 1 },
        { name: "dni_back", maxCount: 1 },
    ]),
    asyncHandler(async (req: Request, res: Response) => {
        const { first_name, last_name, dni, email } = req.body;
        const app = await citService.createApplication(
            { first_name, last_name, dni, email },
            req.files as any,
        );
        res.status(201).json({ message: "Solicitud recibida", data: { id: app.id } });
    }),
);

// Admin routes – protected
router.use(requireAuth, requireRole(ROL.ADMIN));

router.get("/", asyncHandler(async (req: Request, res: Response) => {
    const apps = await citService.listApplications(req.user!);
    res.json(apps);
}));

router.get("/:id", asyncHandler(async (req: Request, res: Response) => {
    const app = await citService.getApplication(Number(req.params.id), req.user!);
    res.json(app);
}));

router.get("/:id/documents/:type", asyncHandler(async (req: Request, res: Response) => {
    const { id, type } = req.params;
    const app = await citService.getApplication(Number(id), req.user!);
    const path = type === "front" ? app.dni_front_path : app.dni_back_path;
    if (!path) {
        return res.status(404).send("Documento no encontrado");
    }
    res.sendFile(path);
}));

router.post("/:id/approve", asyncHandler(async (req: Request, res: Response) => {
    const result = await citService.approveApplication(Number(req.params.id), req.user!.id);
    res.json({ message: "Solicitud aprobada", data: result });
}));

router.post("/:id/reject", asyncHandler(async (req: Request, res: Response) => {
    const { reason } = req.body;
    if (!reason) {
        return res.status(400).json({ message: "Motivo de rechazo es obligatorio" });
    }
    await citService.rejectApplication(Number(req.params.id), req.user!.id, reason);
    res.json({ message: "Solicitud rechazada" });
}));

export const citApplicationRouter = router;
