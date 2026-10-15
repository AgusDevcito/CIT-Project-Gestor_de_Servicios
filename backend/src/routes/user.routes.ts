import { Router } from "express";
import {
    createUser,
    deleteUser,
    getallUsers,
    getUserbyID,
    updateUser,
} from "../controllers/user.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { ROL } from "../constants/roles.js";

export const userRouter = Router();

userRouter.use(requireAuth, requireRole(ROL.ADMIN));

userRouter.get("/user/:id", getUserbyID);
userRouter.get("/users", getallUsers);
userRouter.put("/user/:id", updateUser);
userRouter.delete("/user/:id", deleteUser);
userRouter.post("/user/create", createUser);
