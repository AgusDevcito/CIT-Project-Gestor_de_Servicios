import { Router } from "express";
import {
    getUserbyID,
    deleteUser,
    getallUsers,
    updateUser,
    activateUser,
    deactivateUser,
    createUser,
} from "../controllers/user.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { ROL } from "../constants/roles.js";

export const userRouter = Router();

const adminOnly = [requireAuth, requireRole(ROL.ADMIN)] as const;

userRouter.get("/user/:id", ...adminOnly, getUserbyID);
userRouter.get("/users", ...adminOnly, getallUsers);
userRouter.put("/user/:id", ...adminOnly, updateUser);
userRouter.patch("/user/:id/activate", ...adminOnly, activateUser);
userRouter.patch("/user/:id/deactivate", ...adminOnly, deactivateUser);
userRouter.delete("/user/:id", ...adminOnly, deleteUser);
userRouter.post("/user/create", ...adminOnly, createUser);
