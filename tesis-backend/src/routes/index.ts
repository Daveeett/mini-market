import { Router } from "express";
import { UserRole } from "../entities/enums/user-role.enum";
import { requireAuth, allowRoles } from "../middlewares/auth.middleware";
import { authRoutes } from "./auth.routes";
import { publicRoutes } from "./public.routes";
import { customerRoutes } from "./customer.routes";
import { productRoutes } from "./product.routes";
import { cashRoutes } from "./cash.routes";
import { saleRoutes } from "./sale.routes";
import { creditRoutes } from "./credit.routes";
import { dashboardRoutes } from "./dashboard.routes";
import { notificationRoutes } from "./notification.routes";
import { statementRoutes } from "./statement.routes";
import { reportRoutes } from "./report.routes";
import { offerRoutes } from "./offer.routes";
import walletRoutes from "./wallet.routes";
import crossSellRoutes from "./cross-sell.routes";
import telegramRoutes from "./telegram.routes";

export const router = Router();

router.use("/auth", authRoutes);
router.use("/public", publicRoutes);
router.use("/offers", offerRoutes);

// All routes below require authentication
router.use(requireAuth);
router.use(allowRoles(UserRole.ADMIN, UserRole.CAJERO));

router.use("/customers", customerRoutes);
router.use("/products", productRoutes);
router.use("/cash", cashRoutes);
router.use("/sales", saleRoutes);
router.use("/credits", creditRoutes);
router.use("/wallet", walletRoutes);
router.use("/cross-sell", crossSellRoutes);
router.use("/telegram", telegramRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/notifications", notificationRoutes);
router.use("/statements", statementRoutes);
router.use("/reports", reportRoutes);
