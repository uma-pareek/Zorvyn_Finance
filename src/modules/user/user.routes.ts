import { Router } from "express";

import { requireAuth } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/rbac.middleware";
import { userController } from "./user.controller";

export const userRouter = Router();

// Auth
userRouter.post("/auth/login", userController.login);

// Admin user management
userRouter.post("/admin/users", requireAuth, authorize("users:manage"), userController.createUser);
userRouter.patch("/admin/users/:id/role", requireAuth, authorize("users:manage"), userController.changeRole);
userRouter.patch("/admin/users/:id/status", requireAuth, authorize("users:manage"), userController.changeStatus);
userRouter.post("/admin/users/:id/activate", requireAuth, authorize("users:manage"), userController.activate);
userRouter.post("/admin/users/:id/deactivate", requireAuth, authorize("users:manage"), userController.deactivate);

