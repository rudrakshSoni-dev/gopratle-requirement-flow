import type { RequestHandler } from "express";
import type { ZodType } from "zod";

/** Validates `req.body` against a Zod schema and replaces it with the parsed (trimmed, stripped) value. */
export const validateBody =
  (schema: ZodType): RequestHandler =>
  (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: "Validation failed",
        details: result.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
      return;
    }
    req.body = result.data;
    next();
  };
