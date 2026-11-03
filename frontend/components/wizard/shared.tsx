"use client";

import { Field, inputClass } from "@/components/ui/fields";
import { useWizardField } from "./useWizardField";

/** Min / max budget pair in rupees, stored as details.budgetMin / details.budgetMax. */
export function BudgetRange({ label = "Budget" }: { label?: string }) {
  const { register, err } = useWizardField();
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-medium text-zinc-800">{label} (₹)</legend>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Minimum" htmlFor="budgetMin" error={err("details.budgetMin")}>
          <input
            id="budgetMin"
            type="number"
            inputMode="numeric"
            min={0}
            step={1000}
            placeholder="50000"
            className={inputClass}
            aria-invalid={!!err("details.budgetMin")}
            {...register("details.budgetMin", { valueAsNumber: true })}
          />
        </Field>
        <Field label="Maximum" htmlFor="budgetMax" error={err("details.budgetMax")}>
          <input
            id="budgetMax"
            type="number"
            inputMode="numeric"
            min={0}
            step={1000}
            placeholder="100000"
            className={inputClass}
            aria-invalid={!!err("details.budgetMax")}
            {...register("details.budgetMax", { valueAsNumber: true })}
          />
        </Field>
      </div>
    </fieldset>
  );
}

export function NotesField({ placeholder }: { placeholder: string }) {
  const { register, err } = useWizardField();
  return (
    <Field label="Anything else?" htmlFor="notes" optional error={err("details.notes")}>
      <textarea
        id="notes"
        rows={4}
        className={inputClass}
        placeholder={placeholder}
        aria-invalid={!!err("details.notes")}
        {...register("details.notes")}
      />
    </Field>
  );
}

/** Radio pills for picking one value; registered directly on the field. */
export function PillRadio({
  name,
  options,
  labelFor,
}: {
  name: "details.experienceLevel" | "details.performerType";
  options: readonly string[];
  labelFor: (v: string) => string;
}) {
  const { register, err, watch } = useWizardField();
  const value = watch(name);
  return (
    <div role="radiogroup" aria-invalid={!!err(name)} className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <label
          key={opt}
          className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm transition has-focus-visible:ring-2 has-focus-visible:ring-violet-500/30 ${
            value === opt
              ? "border-violet-600 bg-violet-600 text-white"
              : `bg-white text-zinc-700 hover:border-violet-400 ${err(name) ? "border-red-300" : "border-zinc-300"}`
          }`}
        >
          <input type="radio" value={opt} className="sr-only" {...register(name)} />
          {labelFor(opt)}
        </label>
      ))}
    </div>
  );
}
