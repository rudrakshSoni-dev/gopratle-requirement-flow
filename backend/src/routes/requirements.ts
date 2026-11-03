import { Router } from "express";
import { isValidObjectId } from "mongoose";
import { Requirement, modelsByCategory } from "../models/Requirement.js";
import { validateBody } from "../middleware/validate.js";
import { listQuerySchema, requirementSchema, type RequirementInput } from "../validation/requirement.js";

export const requirementsRouter = Router();

requirementsRouter.post("/", validateBody(requirementSchema), async (req, res) => {
  const input = req.body as RequirementInput;
  // Pick the discriminator model so the category-specific schema is enforced.
  const Model = modelsByCategory[input.category];
  const doc = await Model.create(input);
  res.status(201).json({ data: doc });
});

requirementsRouter.get("/", async (req, res) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query", details: parsed.error.issues });
    return;
  }
  const { category, page, limit } = parsed.data;
  const filter = category ? { category } : {};

  const [items, total, counts] = await Promise.all([
    Requirement.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Requirement.countDocuments(filter),
    Requirement.aggregate<{ _id: string; count: number }>([
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]),
  ]);

  res.json({
    data: items,
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    countsByCategory: Object.fromEntries(counts.map((c) => [c._id, c.count])),
  });
});

requirementsRouter.get("/:id", async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    res.status(400).json({ error: "Invalid requirement id" });
    return;
  }
  const doc = await Requirement.findById(req.params.id);
  if (!doc) {
    res.status(404).json({ error: "Requirement not found" });
    return;
  }
  res.json({ data: doc });
});
