import type { ErrorRequestHandler, RequestHandler } from "express";
import mongoose from "mongoose";

export const notFound: RequestHandler = (req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({ error: `Invalid ${err.path}` });
    return;
  }
  if (err instanceof mongoose.Error.ValidationError) {
    res.status(400).json({
      error: "Validation failed",
      details: Object.values(err.errors).map((e) => ({ path: e.path, message: e.message })),
    });
    return;
  }
  // Malformed JSON body from express.json()
  if (err?.type === "entity.parse.failed") {
    res.status(400).json({ error: "Malformed JSON body" });
    return;
  }
  if (err?.type === "entity.too.large") {
    res.status(413).json({ error: "Request body too large" });
    return;
  }

  console.error(err);
  res.status(500).json({
    error: "Internal server error",
    ...(process.env.NODE_ENV !== "production" && { message: err?.message }),
  });
};
