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

userRouter.use(requireAuth, requireRole(ROL.ADMIN));

userRouter.get("/user/:id", getUserbyID);
userRouter.get("/users", getallUsers);
userRouter.put("/user/:id", updateUser);
userRouter.patch("/user/:id/activate", activateUser);
userRouter.patch("/user/:id/deactivate", deactivateUser);
userRouter.delete("/user/:id", deleteUser);
userRouter.post("/user/create", createUser);
