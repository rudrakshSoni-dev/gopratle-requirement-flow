"use client";

import { Controller, useFieldArray, useWatch } from "react-hook-form";
import { Field, YesNo, inputClass } from "@/components/ui/fields";
import { CREW_ROLES, labelFor } from "@/lib/options";
import { NotesField } from "../shared";
import { useWizardField } from "../useWizardField";

export function CrewRoles() {
  const { control, register, err } = useWizardField();
  const { fields, append, remove } = useFieldArray({ control, name: "details.roles" });
  const roles = useWatch({ control, name: "details.roles" }) ?? [];
  const usedRoles = new Set(roles.map((r) => r.role));
  const canAdd = fields.length < CREW_ROLES.length;

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-600">Add each role you need and how many people for it.</p>

      <ul className="space-y-3">
        {fields.map((f, i) => (
          <li key={f.id} className="flex items-start gap-3">
            <Field label="Role" htmlFor={`role-${i}`} error={err(`details.roles.${i}.role`)} className="flex-1">
              <select
                id={`role-${i}`}
                className={inputClass}
                aria-invalid={!!err(`details.roles.${i}.role`)}
                {...register(`details.roles.${i}.role`)}
              >
                <option value="">Select a role</option>
                {CREW_ROLES.map((r) => (
                  <option key={r} value={r} disabled={usedRoles.has(r) && roles[i]?.role !== r}>
                    {labelFor(r)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="How many" htmlFor={`count-${i}`} error={err(`details.roles.${i}.count`)} className="w-28">
              <input
                id={`count-${i}`}
                type="number"
                inputMode="numeric"
                min={1}
                className={inputClass}
                aria-invalid={!!err(`details.roles.${i}.count`)}
                {...register(`details.roles.${i}.count`, { valueAsNumber: true })}
              />
            </Field>
            <button
              type="button"
              onClick={() => remove(i)}
              disabled={fields.length === 1}
              aria-label={`Remove role ${i + 1}`}
              className="mt-7 rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-red-600 disabled:invisible"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      {err("details.roles") && (
        <p role="alert" className="text-xs text-red-600">
          {err("details.roles")}
        </p>
      )}

      {canAdd && (
        <button
          type="button"
          onClick={() => append({ role: "", count: 1 })}
          className="rounded-lg border border-dashed border-zinc-300 px-3 py-2 text-sm font-medium text-violet-700 hover:border-violet-400 hover:bg-violet-50"
        >
          + Add another role
        </button>
      )}
    </div>
  );
}

export function CrewShift() {
  const { control, register, err } = useWizardField();
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Call time" htmlFor="callTime" error={err("details.callTime")} hint="When the crew should report">
          <input
            id="callTime"
            type="time"
            className={inputClass}
            aria-invalid={!!err("details.callTime")}
            {...register("details.callTime")}
          />
        </Field>
        <Field label="Hours per day" htmlFor="hoursPerDay" error={err("details.hoursPerDay")}>
          <input
            id="hoursPerDay"
            type="number"
            inputMode="numeric"
            min={1}
            max={24}
            placeholder="8"
            className={inputClass}
            aria-invalid={!!err("details.hoursPerDay")}
            {...register("details.hoursPerDay", { valueAsNumber: true })}
          />
        </Field>
      </div>

      <Field
        label="Budget per person, per day (₹)"
        htmlFor="budgetPerPerson"
        error={err("details.budgetPerPerson")}
      >
        <input
          id="budgetPerPerson"
          type="number"
          inputMode="numeric"
          min={0}
          step={500}
          placeholder="5000"
          className={`${inputClass} sm:max-w-60`}
          aria-invalid={!!err("details.budgetPerPerson")}
          {...register("details.budgetPerPerson", { valueAsNumber: true })}
        />
      </Field>

      <Field label="Will you provide the equipment (cameras, lights, etc.)?" error={err("details.equipmentProvided")}>
        <Controller
          control={control}
          name="details.equipmentProvided"
          render={({ field }) => (
            <YesNo
              label="Equipment provided by host"
              value={field.value}
              onChange={field.onChange}
              invalid={!!err("details.equipmentProvided")}
            />
          )}
        />
      </Field>

      <NotesField placeholder="Dress code, meals, travel, shot list…" />
    </div>
  );
}
