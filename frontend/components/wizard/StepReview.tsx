"use client";

import { RequirementSummary } from "@/components/RequirementSummary";
import { Field, inputClass } from "@/components/ui/fields";
import { useWizardField } from "./useWizardField";

export function StepReview({ onEditStep }: { onEditStep: (step: number) => void }) {
  const { register, getValues, err } = useWizardField();
  // Earlier steps can only change by navigating back, so a snapshot is enough here.
  const values = getValues();

  return (
    <div className="space-y-6">
      <RequirementSummary
        source={values}
        onEditStep={onEditStep}
        showContact={false}
      />

      <fieldset className="rounded-xl border border-zinc-200 bg-white p-4">
        <legend className="px-1 text-sm font-semibold text-zinc-900">Your contact details</legend>
        <p className="mb-4 text-xs text-zinc-500">Shared only with professionals who respond to this requirement.</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Name" htmlFor="contactName" error={err("contact.name")}>
            <input
              id="contactName"
              autoComplete="name"
              className={inputClass}
              aria-invalid={!!err("contact.name")}
              {...register("contact.name")}
            />
          </Field>
          <Field label="Email" htmlFor="contactEmail" error={err("contact.email")}>
            <input
              id="contactEmail"
              type="email"
              autoComplete="email"
              className={inputClass}
              aria-invalid={!!err("contact.email")}
              {...register("contact.email")}
            />
          </Field>
          <Field label="Phone" htmlFor="contactPhone" error={err("contact.phone")}>
            <input
              id="contactPhone"
              type="tel"
              autoComplete="tel"
              placeholder="+91 98765 43210"
              className={inputClass}
              aria-invalid={!!err("contact.phone")}
              {...register("contact.phone")}
            />
          </Field>
        </div>
      </fieldset>
    </div>
  );
}
