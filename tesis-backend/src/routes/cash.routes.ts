import { Router } from "express";
import { asyncHandler } from "../utils/async-handler.util";
import { UserRole } from "../entities/enums/user-role.enum";
import { allowRoles } from "../middlewares/auth.middleware";
import { cashController } from "../controllers/cash.controller";

export const cashRoutes = Router();

cashRoutes.get(
  "/status",
  asyncHandler(cashController.status),
);

cashRoutes.get(
  "/steroids-summary",
  asyncHandler(cashController.steroidsSummary),
);

cashRoutes.get(
  "/history",
  allowRoles(UserRole.ADMIN),
  asyncHandler(cashController.history),
);

cashRoutes.post(
  "/open",
  asyncHandler(cashController.open),
);

cashRoutes.post(
  "/movements",
  asyncHandler(cashController.addMovement),
);

cashRoutes.post(
  "/close",
  allowRoles(UserRole.ADMIN),
  asyncHandler(cashController.close),
);
