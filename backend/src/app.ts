import cors from "cors";
import express from "express";
import helmet from "helmet";
import mongoose from "mongoose";
import morgan from "morgan";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { requirementsRouter } from "./routes/requirements.js";

export function createApp() {
  const app = express();

  const allowedOrigins = (process.env.FRONTEND_URL ?? "http://localhost:3000")
    .split(",")
    .map((o) => o.trim().replace(/\/$/, ""))
    .filter(Boolean);

  app.use(helmet());
  app.use(cors({ origin: allowedOrigins }));
  app.use(express.json({ limit: "100kb" }));
  if (process.env.NODE_ENV !== "test") app.use(morgan("dev"));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", db: mongoose.connection.readyState === 1 ? "connected" : "disconnected" });
  });

  app.use("/api/requirements", requirementsRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
