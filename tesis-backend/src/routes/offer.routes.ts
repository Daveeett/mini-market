import { Router } from "express";
import { asyncHandler } from "../utils/async-handler.util";
import { offerController } from "../controllers/offer.controller";
import { requireAuth, allowRoles } from "../middlewares/auth.middleware";
import { UserRole } from "../entities/enums/user-role.enum";

export const offerRoutes = Router();

// Public route for active offers
offerRoutes.get("/active", asyncHandler(offerController.getActiveOffers));

// Admin protected routes
offerRoutes.use(requireAuth);
offerRoutes.use(allowRoles(UserRole.ADMIN));

offerRoutes.get("/", asyncHandler(offerController.getAllOffers));
offerRoutes.post("/", asyncHandler(offerController.createOffer));
offerRoutes.put("/:id", asyncHandler(offerController.updateOffer));
offerRoutes.patch("/:id/toggle", asyncHandler(offerController.toggleOffer));
offerRoutes.delete("/:id", asyncHandler(offerController.deleteOffer));
