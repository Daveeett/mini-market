import { Request, Response } from "express";
import { AppDataSource } from "../src/config/data-source";
import { createApp } from "../src/app";
import { seedAdmin } from "../src/services/seed.service";

// Evita que la base de datos se intente inicializar multiples veces por los "cold starts" de Vercel
let initialized = false;

const initializeDb = async () => {
  if (!initialized) {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      // Forzar la creacion de tablas en Supabase
      await AppDataSource.synchronize();
      // Crear el usuario admin por defecto
      await seedAdmin();
    }
    initialized = true;
  }
};

const app = createApp();

export default async function handler(req: Request, res: Response) {
  try {
    await initializeDb();
    // Le pasamos la peticion de Vercel directamente a la aplicacion de Express
    return app(req, res);
  } catch (error: any) {
    console.error("Database connection error in Vercel:", error);
    res.status(500).json({ 
      error: "Internal Server Error", 
      details: "Database initialization failed",
      message: error.message || String(error)
    });
  }
}
