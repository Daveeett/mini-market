import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import { config } from "./config/environment";
import { router } from "./routes";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware";
import { swaggerSpec } from "./docs/swagger";

export const createApp = () => {
  const app = express();

  app.use(helmet());
  
  const allowedOrigins = config.server.frontendBaseUrl
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin: (origin, callback) => {
        // Permitir solicitudes sin origen (curl, postman, etc)
        if (!origin) {
          return callback(null, true);
        }
        // Permitir si esta en la lista configurada o si se usa comodin *
        if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes("*")) {
          return callback(null, true);
        }
        // Permitir localhost e IPs locales (192.168.x.x, 10.x.x.x, 172.16-31.x.x) en desarrollo
        if (
          config.isDevelopment &&
          (origin.startsWith("http://localhost:") ||
            origin.startsWith("http://127.0.0.1:") ||
            /^http:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(origin))
        ) {
          return callback(null, true);
        }
        callback(null, false);
      },
      credentials: true,
    }),
  );
  app.use(compression());
  app.use(express.json({ limit: "1mb" }));

  app.use(
    "/api",
    rateLimit({
      windowMs: 10 * 60 * 1000,
      max: 600,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  app.get("/api/health", (_req, res) => {
    res.status(200).json({
      success: true,
      message: "Backend operativo",
      data: {
        service: "tesis-backend",
      },
    });
  });

  app.get("/api/docs.json", (_req, res) => {
    res.status(200).json(swaggerSpec);
  });

  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.use("/api", router);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
