import type { ComponentType } from "react";
import type { Category } from "@/lib/options";
import { CrewRoles, CrewShift } from "./categories/crew";
import { PerformerAct, PerformerLogistics } from "./categories/performer";
import { PlannerPreferences, PlannerScope } from "./categories/planner";

/** Steps 2 and 3 for each category. Must line up with `detailSteps` in lib/schema.ts. */
export const stepsByCategory: Record<Category, [ComponentType, ComponentType]> = {
  planner: [PlannerScope, PlannerPreferences],
  performer: [PerformerAct, PerformerLogistics],
  crew: [CrewRoles, CrewShift],
};
