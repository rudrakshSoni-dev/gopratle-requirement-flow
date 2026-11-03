// Allowed values for enum-like fields. The frontend keeps a mirror of this
// file in frontend/lib/options.ts — keep the two in sync.

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

export const DATE_TYPES = ["single", "range"] as const;

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
