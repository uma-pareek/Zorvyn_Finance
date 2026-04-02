import { Router } from "express";

import { requireAuth } from "./middleware/auth.middleware";
import { authorize } from "./middleware/rbac.middleware";

import { userRouter } from "./modules/user/user.routes";
import { financeRouter } from "./modules/finance/finance.routes";
import { dashboardController } from "./modules/dashboard/dashboard.controller";

export function buildRoutes() {
  const router = Router();

  router.use(userRouter);
  router.use(financeRouter);

  router.get(
    "/dashboard/summary",
    requireAuth,
    authorize("dashboard:read"),
    dashboardController.getSummary
  );

  router.use((_req, res) => {
    res.status(404).json({ code: "not_found", message: "Not Found" });
  });

  return router;
}

