import { createUser, deleteUser, getallUsers, getUserbyID, updateUser } from "../controllers/user.controllers.js";
import {Router} from 'express';
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/propuestas.middleware.js";

export const userRouter = Router()

userRouter.use(requireAuth, requireRole("admin"));

userRouter.get("/user/:id",getUserbyID)
userRouter.get("/users",getallUsers)
userRouter.put("/user/:id",updateUser)
userRouter.delete("/user/:id",deleteUser)
userRouter.post("/user/create",createUser)