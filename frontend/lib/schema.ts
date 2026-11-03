import { z } from "zod";
import {
  CREW_ROLES,
  EVENT_TYPES,
  EXPERIENCE_LEVELS,
  PERFORMER_TYPES,
  PLANNER_SERVICES,
  type Category,
} from "./options";

// Client-side validation, one schema per wizard step. The backend re-validates
// everything with the same rules (backend/src/validation/requirement.ts) and is
// the source of truth; this exists so users get feedback before submitting.

// ---------- Form shape ----------

export type DetailsForm = Partial<{
  // planner
  services: string[];
  guestCount: number;
  theme: string;
  experienceLevel: string;
  // performer
  performerType: string;
  genres: string[];
  performerCount: number;
  durationMinutes: number;
  languages: string[];
  // crew
  roles: { role: string; count: number }[];
  callTime: string;
  hoursPerDay: number;
  budgetPerPerson: number;
  // shared
  budgetMin: number;
  budgetMax: number;
  equipmentProvided: boolean;
  notes: string;
}>;

export type FormValues = {
  eventName: string;
  eventType: string;
  dateType: "single" | "range";
  startDate: string;
  endDate: string;
  location: string;
  venue: string;
  category: Category | "";
  details: DetailsForm;
  contact: { name: string; email: string; phone: string };
};

export const emptyForm: FormValues = {
  eventName: "",
  eventType: "",
  dateType: "single",
  startDate: "",
  endDate: "",
  location: "",
  venue: "",
  category: "",
  details: {},
  contact: { name: "", email: "", phone: "" },
};

export const detailDefaults: Record<Category, DetailsForm> = {
  planner: { services: [], experienceLevel: "any", theme: "", notes: "" },
  performer: { performerType: "", genres: [], languages: [], notes: "" },
  crew: { roles: [{ role: "", count: 1 }], callTime: "", notes: "" },
};

// ---------- Field helpers ----------

const required = (max: number) => z.string().trim().min(1, "Required").max(max, `Max ${max} characters`);
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Max ${max} characters`)
    .optional()
    .transform((v) => v || undefined);
const int = (min: number, max: number) =>
  z
    .number({ error: "Required" })
    .int("Whole numbers only")
    .min(min, `Must be at least ${min}`)
    .max(max, `Must be at most ${max.toLocaleString("en-IN")}`);
const budget = int(0, 100_000_000);
const pick = <T extends readonly [string, ...string[]]>(values: T, message = "Please choose one") =>
  z.enum(values, { error: message });
const yesNo = z.boolean({ error: "Please choose one" });

// ---------- Step schemas ----------

export const basicsSchema = z.object({
  eventName: required(120),
  eventType: pick(EVENT_TYPES, "Choose an event type"),
  dateType: z.enum(["single", "range"]),
  startDate: z.iso.date("Pick a date"),
  endDate: z.string().optional(),
  location: required(120),
  venue: optionalText(160),
  category: pick(["planner", "performer", "crew"], "Choose what you're looking for"),
});

const plannerScope = z.object({
  services: z.array(z.enum(PLANNER_SERVICES)).min(1, "Pick at least one service"),
  guestCount: int(1, 100_000),
  budgetMin: budget,
  budgetMax: budget,
});
const plannerPrefs = z.object({
  theme: optionalText(200),
  experienceLevel: pick(EXPERIENCE_LEVELS),
  notes: optionalText(1000),
});

const performerAct = z.object({
  performerType: pick(PERFORMER_TYPES, "Choose a performer type"),
  genres: z.array(required(40)).min(1, "Add at least one genre").max(10, "Up to 10 genres"),
  performerCount: int(1, 500),
  durationMinutes: int(10, 24 * 60),
});
const performerLogistics = z.object({
  languages: z.array(required(40)).max(10, "Up to 10 languages"),
  equipmentProvided: yesNo,
  budgetMin: budget,
  budgetMax: budget,
  notes: optionalText(1000),
});

const crewRoles = z.object({
  roles: z
    .array(z.object({ role: pick(CREW_ROLES, "Choose a role"), count: int(1, 200) }))
    .min(1, "Add at least one crew role"),
});
const crewShift = z.object({
  callTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Pick a call time"),
  hoursPerDay: int(1, 24),
  budgetPerPerson: budget,
  equipmentProvided: yesNo,
  notes: optionalText(1000),
});

export const contactSchema = z.object({
  contact: z.object({
    name: required(80),
    email: z.email("Enter a valid email").trim().max(160),
    phone: z
      .string()
      .trim()
      .regex(/^\+?[0-9\s-]{7,20}$/, "Enter a valid phone number"),
  }),
});

/** The two category-specific steps, in order. */
export const detailSteps: Record<Category, [z.ZodObject, z.ZodObject]> = {
  planner: [plannerScope, plannerPrefs],
  performer: [performerAct, performerLogistics],
  crew: [crewRoles, crewShift],
};

// ---------- Cross-field rules ----------

export type Issue = { path: string; message: string };

function localToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function dateIssues(v: FormValues, today = localToday()): Issue[] {
  const issues: Issue[] = [];
  if (v.startDate && v.startDate < today) {
    issues.push({ path: "startDate", message: "Date cannot be in the past" });
  }
  if (v.dateType === "range") {
    if (!v.endDate) issues.push({ path: "endDate", message: "Pick an end date" });
    else if (v.startDate && v.endDate < v.startDate)
      issues.push({ path: "endDate", message: "End date must be on or after start date" });
  }
  return issues;
}

function budgetIssues(d: DetailsForm): Issue[] {
  const { budgetMin, budgetMax } = d;
  if (typeof budgetMin === "number" && typeof budgetMax === "number" && budgetMin > budgetMax) {
    return [{ path: "details.budgetMax", message: "Max budget must be at least the min budget" }];
  }
  return [];
}

function duplicateRoleIssues(d: DetailsForm): Issue[] {
  const seen = new Set<string>();
  const issues: Issue[] = [];
  d.roles?.forEach((r, i) => {
    if (r.role && seen.has(r.role)) issues.push({ path: `details.roles.${i}.role`, message: "Role listed twice" });
    seen.add(r.role);
  });
  return issues;
}

// ---------- Step validation ----------

export const STEP_COUNT = 4;

const toIssues = (error: z.ZodError, prefix = ""): Issue[] =>
  error.issues.map((i) => ({ path: prefix + i.path.join("."), message: i.message }));

/** Validates one wizard step (0–3) and returns field-level issues keyed by form path. */
export function validateStep(step: number, v: FormValues, today?: string): Issue[] {
  if (step === 0) {
    const parsed = basicsSchema.safeParse(v);
    const issues = parsed.success ? [] : toIssues(parsed.error);
    // Run the date rules even when other fields fail, without duplicating a field's error.
    const taken = new Set(issues.map((i) => i.path));
    return [...issues, ...dateIssues(v, today).filter((i) => !taken.has(i.path))];
  }

  if (step === 3) {
    const parsed = contactSchema.safeParse(v);
    return parsed.success ? [] : toIssues(parsed.error);
  }

  if (!v.category) return [{ path: "category", message: "Choose what you're looking for" }];
  const schema = detailSteps[v.category][step - 1];
  const parsed = schema.safeParse(v.details);
  const issues = parsed.success ? [] : toIssues(parsed.error, "details.");
  const ownKeys = Object.keys(schema.shape);
  const extra = [...budgetIssues(v.details), ...duplicateRoleIssues(v.details)].filter((i) =>
    ownKeys.includes(i.path.split(".")[1]),
  );
  const taken = new Set(issues.map((i) => i.path));
  return [...issues, ...extra.filter((i) => !taken.has(i.path))];
}

/** Which step a (server-reported) field path belongs to, so we can jump back to it. */
export function stepForPath(path: string, category: Category | ""): number {
  if (path.startsWith("contact")) return 3;
  if (path.startsWith("details.") && category) {
    const key = path.split(".")[1];
    return Object.keys(detailSteps[category][0].shape).includes(key) ? 1 : 2;
  }
  return 0;
}

/** Builds the API payload: validated, trimmed, and stripped of other categories' fields. */
export function toPayload(v: FormValues) {
  if (!v.category) throw new Error("Category is required");
  const basics = basicsSchema.parse(v);
  const [a, b] = detailSteps[v.category];
  return {
    ...basics,
    endDate: basics.dateType === "range" ? basics.endDate : undefined,
    details: { ...a.parse(v.details), ...b.parse(v.details) },
    contact: contactSchema.parse(v).contact,
  };
}
