import { Schema, model } from "mongoose";
import {
  CREW_ROLES,
  DATE_TYPES,
  EVENT_TYPES,
  EXPERIENCE_LEVELS,
  PERFORMER_TYPES,
  PLANNER_SERVICES,
} from "../validation/options.js";

// All requirements live in one `requirements` collection. `category` is the
// discriminator key, so every document is tagged with its type and Mongoose
// applies the matching category schema to `details`.

const requirementSchema = new Schema(
  {
    eventName: { type: String, required: true, trim: true },
    eventType: { type: String, required: true, enum: EVENT_TYPES },
    dateType: { type: String, required: true, enum: DATE_TYPES },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    location: { type: String, required: true, trim: true },
    venue: { type: String, trim: true },
    contact: {
      name: { type: String, required: true },
      email: { type: String, required: true, lowercase: true },
      phone: { type: String, required: true },
    },
    status: { type: String, enum: ["open", "closed"], default: "open" },
  },
  {
    discriminatorKey: "category",
    collection: "requirements",
    timestamps: true,
    toJSON: {
      versionKey: false,
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = String(ret._id);
        delete ret._id;
        return ret;
      },
    },
  },
);

requirementSchema.index({ category: 1, createdAt: -1 });

export const Requirement = model("Requirement", requirementSchema);

const noId = { _id: false };

export const PlannerRequirement = Requirement.discriminator(
  "planner",
  new Schema({
    details: new Schema(
      {
        services: { type: [String], enum: PLANNER_SERVICES, required: true },
        guestCount: { type: Number, required: true, min: 1 },
        budgetMin: { type: Number, required: true, min: 0 },
        budgetMax: { type: Number, required: true, min: 0 },
        theme: String,
        experienceLevel: { type: String, enum: EXPERIENCE_LEVELS, required: true },
        notes: String,
      },
      noId,
    ),
  }),
);

export const PerformerRequirement = Requirement.discriminator(
  "performer",
  new Schema({
    details: new Schema(
      {
        performerType: { type: String, enum: PERFORMER_TYPES, required: true },
        genres: { type: [String], required: true },
        performerCount: { type: Number, required: true, min: 1 },
        durationMinutes: { type: Number, required: true, min: 1 },
        languages: { type: [String], default: [] },
        equipmentProvided: { type: Boolean, required: true },
        budgetMin: { type: Number, required: true, min: 0 },
        budgetMax: { type: Number, required: true, min: 0 },
        notes: String,
      },
      noId,
    ),
  }),
);

export const CrewRequirement = Requirement.discriminator(
  "crew",
  new Schema({
    details: new Schema(
      {
        roles: {
          type: [
            new Schema(
              {
                role: { type: String, enum: CREW_ROLES, required: true },
                count: { type: Number, required: true, min: 1 },
              },
              noId,
            ),
          ],
          required: true,
        },
        callTime: { type: String, required: true },
        hoursPerDay: { type: Number, required: true, min: 1, max: 24 },
        budgetPerPerson: { type: Number, required: true, min: 0 },
        equipmentProvided: { type: Boolean, required: true },
        notes: String,
      },
      noId,
    ),
  }),
);

export const modelsByCategory = {
  planner: PlannerRequirement,
  performer: PerformerRequirement,
  crew: CrewRequirement,
} as const;
