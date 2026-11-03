"use client";

import { Controller } from "react-hook-form";
import { ChipMultiSelect, Field, inputClass } from "@/components/ui/fields";
import { EXPERIENCE_LEVELS, PLANNER_SERVICES, labelFor } from "@/lib/options";
import { BudgetRange, NotesField, PillRadio } from "../shared";
import { useWizardField } from "../useWizardField";

export function PlannerScope() {
  const { control, register, err } = useWizardField();
  return (
    <div className="space-y-5">
      <Field label="Which services do you need?" error={err("details.services")}>
        <Controller
          control={control}
          name="details.services"
          render={({ field }) => (
            <ChipMultiSelect
              label="Services needed"
              options={PLANNER_SERVICES}
              value={field.value ?? []}
              onChange={field.onChange}
              invalid={!!err("details.services")}
            />
          )}
        />
      </Field>

      <Field label="Expected guest count" htmlFor="guestCount" error={err("details.guestCount")}>
        <input
          id="guestCount"
          type="number"
          inputMode="numeric"
          min={1}
          placeholder="200"
          className={`${inputClass} sm:max-w-48`}
          aria-invalid={!!err("details.guestCount")}
          {...register("details.guestCount", { valueAsNumber: true })}
        />
      </Field>

      <BudgetRange label="Planning budget" />
    </div>
  );
}

export function PlannerPreferences() {
  const { register, err } = useWizardField();
  return (
    <div className="space-y-5">
      <Field
        label="Theme or style"
        htmlFor="theme"
        optional
        error={err("details.theme")}
        hint="A few words on the look and feel you have in mind"
      >
        <input
          id="theme"
          className={inputClass}
          placeholder="e.g. Rustic outdoor, pastel florals"
          {...register("details.theme")}
        />
      </Field>

      <Field label="Preferred planner experience" error={err("details.experienceLevel")}>
        <PillRadio name="details.experienceLevel" options={EXPERIENCE_LEVELS} labelFor={labelFor} />
      </Field>

      <NotesField placeholder="Vendors you already have, must-haves, deadlines…" />
    </div>
  );
}
