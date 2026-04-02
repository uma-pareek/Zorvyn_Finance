import { Router } from "express";

import { requireAuth } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/rbac.middleware";
import { financeController } from "./finance.controller";

export const financeRouter = Router();

financeRouter.get("/records", requireAuth, authorize("records:read"), financeController.list);
financeRouter.get("/records/:id", requireAuth, authorize("records:read"), financeController.getById);
financeRouter.post("/records", requireAuth, authorize("records:write"), financeController.create);
financeRouter.patch("/records/:id", requireAuth, authorize("records:write"), financeController.update);
financeRouter.delete("/records/:id", requireAuth, authorize("records:delete"), financeController.remove);

