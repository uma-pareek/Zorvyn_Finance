import type { Request, Response } from "express";

import { asyncHandler } from "../../utils/asyncHandler";
import { roleHasPermission } from "../../middleware/rbac.middleware";
import { getDashboardSummary } from "./dashboard.service";

export const dashboardController = {
  getSummary: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const includeInsights = roleHasPermission(req.user!.role, "insights:read");

    const summary = await getDashboardSummary(userId, includeInsights);
    return res.status(200).json(summary);
  }),
};

