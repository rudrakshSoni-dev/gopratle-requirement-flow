import { describe, expect, it } from "vitest";
import { emptyForm, stepForPath, toPayload, validateStep, type FormValues } from "@/lib/schema";

const TODAY = "2030-06-15";

const basics: FormValues = {
  ...emptyForm,
  eventName: "Sangeet Night",
  eventType: "wedding",
  dateType: "single",
  startDate: "2030-07-01",
  location: "Jaipur",
  category: "crew",
  details: {
    roles: [{ role: "photographer", count: 2 }],
    callTime: "17:00",
    hoursPerDay: 6,
    budgetPerPerson: 7000,
    equipmentProvided: false,
    notes: "",
  },
  contact: { name: "Meera", email: "meera@example.com", phone: "9876543210" },
};

const paths = (issues: { path: string }[]) => issues.map((i) => i.path);

describe("step 1 — event basics", () => {
  it("passes with valid basics", () => {
    expect(validateStep(0, basics, TODAY)).toEqual([]);
  });

  it("flags every missing required field", () => {
    expect(paths(validateStep(0, emptyForm, TODAY))).toEqual(
      expect.arrayContaining(["eventName", "eventType", "startDate", "location", "category"]),
    );
  });

  it("rejects past dates", () => {
    expect(paths(validateStep(0, { ...basics, startDate: "2030-06-14" }, TODAY))).toEqual(["startDate"]);
  });

  it("requires a valid end date for ranges, even when other fields are invalid", () => {
    const missingEnd = validateStep(0, { ...basics, eventName: "", dateType: "range" }, TODAY);
    expect(paths(missingEnd)).toEqual(expect.arrayContaining(["eventName", "endDate"]));

    const backwards = validateStep(0, { ...basics, dateType: "range", endDate: "2030-06-20" }, TODAY);
    expect(backwards).toEqual([{ path: "endDate", message: "End date must be on or after start date" }]);
  });
});

describe("steps 2 & 3 — category details", () => {
  it("validates only the fields that belong to the current step", () => {
    const noShift = { ...basics, details: { roles: [{ role: "security", count: 1 }] } };
    expect(validateStep(1, noShift, TODAY)).toEqual([]);
    expect(paths(validateStep(2, noShift, TODAY))).toEqual(
      expect.arrayContaining(["details.callTime", "details.hoursPerDay", "details.equipmentProvided"]),
    );
  });

  it("rejects duplicate crew roles", () => {
    const dup = {
      ...basics,
      details: { ...basics.details, roles: [{ role: "security", count: 1 }, { role: "security", count: 2 }] },
    };
    expect(paths(validateStep(1, dup, TODAY))).toEqual(["details.roles.1.role"]);
  });

  it("treats empty number inputs (NaN) as required", () => {
    const planner: FormValues = {
      ...basics,
      category: "planner",
      details: { services: ["decor"], guestCount: NaN, budgetMin: 1000, budgetMax: 5000 },
    };
    expect(validateStep(1, planner, TODAY)).toEqual([{ path: "details.guestCount", message: "Required" }]);
  });

  it("reports min > max budget on the step that owns the budget", () => {
    const performer: FormValues = {
      ...basics,
      category: "performer",
      details: {
        performerType: "dj",
        genres: ["EDM"],
        performerCount: 1,
        durationMinutes: 120,
        languages: [],
        equipmentProvided: true,
        budgetMin: 90000,
        budgetMax: 10000,
      },
    };
    expect(validateStep(1, performer, TODAY)).toEqual([]);
    expect(paths(validateStep(2, performer, TODAY))).toEqual(["details.budgetMax"]);
  });
});

describe("step 4 — contact", () => {
  it("validates email and phone", () => {
    const bad = { ...basics, contact: { name: "M", email: "nope", phone: "12" } };
    expect(paths(validateStep(3, bad, TODAY))).toEqual(["contact.email", "contact.phone"]);
  });
});

describe("helpers", () => {
  it("maps server error paths back to wizard steps", () => {
    expect(stepForPath("startDate", "crew")).toBe(0);
    expect(stepForPath("details.roles.0.role", "crew")).toBe(1);
    expect(stepForPath("details.callTime", "crew")).toBe(2);
    expect(stepForPath("details.budgetMax", "planner")).toBe(1);
    expect(stepForPath("details.budgetMax", "performer")).toBe(2);
    expect(stepForPath("contact.email", "crew")).toBe(3);
  });

  it("builds a clean payload without other categories' fields or empty optionals", () => {
    const payload = toPayload({
      ...basics,
      venue: "  ",
      endDate: "2030-07-05", // ignored for single-day events
      details: { ...basics.details, performerType: "dj", guestCount: 30 },
    });
    expect(payload.venue).toBeUndefined();
    expect(payload.endDate).toBeUndefined();
    expect(payload.details).toEqual({
      roles: [{ role: "photographer", count: 2 }],
      callTime: "17:00",
      hoursPerDay: 6,
      budgetPerPerson: 7000,
      equipmentProvided: false,
      notes: undefined,
    });
  });
});
