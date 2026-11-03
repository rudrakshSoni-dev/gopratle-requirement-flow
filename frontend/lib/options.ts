// Mirror of backend/src/validation/options.ts, plus display labels.
// Keep the value lists in sync with the backend.

export const CATEGORIES = ["planner", "performer", "crew"] as const;
export type Category = (typeof CATEGORIES)[number];

export const EVENT_TYPES = [
  "wedding",
  "corporate",
  "birthday",
  "concert",
  "festival",
  "private_party",
  "other",
] as const;

export const PLANNER_SERVICES = [
  "full_planning",
  "decor",
  "catering_coordination",
  "vendor_management",
  "guest_management",
  "logistics",
  "day_of_coordination",
] as const;

export const EXPERIENCE_LEVELS = ["any", "1_3_years", "3_5_years", "5_plus_years"] as const;

export const PERFORMER_TYPES = [
  "singer",
  "band",
  "dj",
  "dancer",
  "comedian",
  "emcee",
  "instrumentalist",
  "magician",
] as const;

export const CREW_ROLES = [
  "photographer",
  "videographer",
  "lighting_technician",
  "sound_technician",
  "stagehand",
  "security",
  "makeup_artist",
  "decorator",
] as const;

export const CATEGORY_META: Record<Category, { label: string; blurb: string; steps: [string, string] }> = {
  planner: {
    label: "Event Planner",
    blurb: "Someone to plan and run the event end to end",
    steps: ["Planning scope", "Preferences"],
  },
  performer: {
    label: "Performer",
    blurb: "Singers, bands, DJs, dancers, emcees and more",
    steps: ["The act", "Performance logistics"],
  },
  crew: {
    label: "Crew",
    blurb: "Photographers, technicians, stagehands, security",
    steps: ["Crew roles", "Shift details"],
  },
};

const LABEL_OVERRIDES: Record<string, string> = {
  dj: "DJ",
  emcee: "Emcee / Anchor",
  "1_3_years": "1–3 years",
  "3_5_years": "3–5 years",
  "5_plus_years": "5+ years",
  any: "Any experience",
};

/** "catering_coordination" → "Catering coordination" */
export function labelFor(value: string): string {
  if (LABEL_OVERRIDES[value]) return LABEL_OVERRIDES[value];
  const words = value.replace(/_/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}
