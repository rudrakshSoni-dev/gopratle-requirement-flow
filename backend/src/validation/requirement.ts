import { z } from "zod";
import {
  CATEGORIES,
  CREW_ROLES,
  DATE_TYPES,
  EVENT_TYPES,
  EXPERIENCE_LEVELS,
  PERFORMER_TYPES,
  PLANNER_SERVICES,
} from "./options.js";

const MAX_BUDGET = 100_000_000; // ₹10 crore — anything above is almost certainly a typo

const trimmed = (max: number) => z.string().trim().min(1, "Required").max(max);
const optionalText = (max: number) => z.string().trim().max(max).optional();
const budget = z.number().int().min(0).max(MAX_BUDGET);

// Dates travel as "YYYY-MM-DD" so the user's calendar day is never shifted by
// time zones on the way to the server.
const isoDay = z.iso.date("Use YYYY-MM-DD");

const basics = {
  eventName: trimmed(120),
  eventType: z.enum(EVENT_TYPES),
  dateType: z.enum(DATE_TYPES),
  startDate: isoDay,
  endDate: isoDay.optional(),
  location: trimmed(120),
  venue: optionalText(160),
  contact: z.object({
    name: trimmed(80),
    email: z.email("Enter a valid email").trim().max(160),
    phone: z
      .string()
      .trim()
      .regex(/^\+?[0-9\s-]{7,20}$/, "Enter a valid phone number"),
  }),
};

export const plannerDetails = z.object({
  services: z.array(z.enum(PLANNER_SERVICES)).min(1, "Pick at least one service"),
  guestCount: z.number().int().min(1).max(100_000),
  budgetMin: budget,
  budgetMax: budget,
  theme: optionalText(200),
  experienceLevel: z.enum(EXPERIENCE_LEVELS),
  notes: optionalText(1000),
});

export const performerDetails = z.object({
  performerType: z.enum(PERFORMER_TYPES),
  genres: z.array(trimmed(40)).min(1, "Add at least one genre").max(10),
  performerCount: z.number().int().min(1).max(500),
  durationMinutes: z.number().int().min(10).max(24 * 60),
  languages: z.array(trimmed(40)).max(10).default([]),
  equipmentProvided: z.boolean(),
  budgetMin: budget,
  budgetMax: budget,
  notes: optionalText(1000),
});

export const crewDetails = z.object({
  roles: z
    .array(z.object({ role: z.enum(CREW_ROLES), count: z.number().int().min(1).max(200) }))
    .min(1, "Add at least one crew role"),
  callTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM (24h)"),
  hoursPerDay: z.number().int().min(1).max(24),
  budgetPerPerson: budget,
  equipmentProvided: z.boolean(),
  notes: optionalText(1000),
});

/** Yesterday in UTC — tolerates clients up to a day ahead of the server (e.g. IST vs UTC). */
const earliestAllowedDay = () => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
};

export const requirementSchema = z
  .discriminatedUnion("category", [
    z.object({ ...basics, category: z.literal("planner"), details: plannerDetails }),
    z.object({ ...basics, category: z.literal("performer"), details: performerDetails }),
    z.object({ ...basics, category: z.literal("crew"), details: crewDetails }),
  ])
  .superRefine((req, ctx) => {
    // ISO day strings compare correctly as plain strings.
    if (req.startDate < earliestAllowedDay()) {
      ctx.addIssue({ code: "custom", path: ["startDate"], message: "Date cannot be in the past" });
    }

    if (req.dateType === "range") {
      if (!req.endDate) {
        ctx.addIssue({ code: "custom", path: ["endDate"], message: "End date is required for a range" });
      } else if (req.endDate < req.startDate) {
        ctx.addIssue({ code: "custom", path: ["endDate"], message: "End date must be on or after start date" });
      }
    }

    if ("budgetMin" in req.details && req.details.budgetMin > req.details.budgetMax) {
      ctx.addIssue({
        code: "custom",
        path: ["details", "budgetMax"],
        message: "Max budget must be at least the min budget",
      });
    }

    if (req.category === "crew") {
      const seen = new Set<string>();
      req.details.roles.forEach((r, i) => {
        if (seen.has(r.role)) {
          ctx.addIssue({ code: "custom", path: ["details", "roles", i, "role"], message: "Role listed twice" });
        }
        seen.add(r.role);
      });
    }
  })
  .transform((req) => ({
    ...req,
    // A single-day event has no separate end date.
    endDate: req.dateType === "range" ? req.endDate : undefined,
  }));

export type RequirementInput = z.output<typeof requirementSchema>;

export const listQuerySchema = z.object({
  category: z.enum(CATEGORIES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});
