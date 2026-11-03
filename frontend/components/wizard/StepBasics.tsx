"use client";

import { useState } from "react";
import { useWatch } from "react-hook-form";
import { Field, inputClass } from "@/components/ui/fields";
import { CATEGORIES, CATEGORY_META, EVENT_TYPES, labelFor, type Category } from "@/lib/options";
import { detailDefaults } from "@/lib/schema";
import { useWizardField } from "./useWizardField";

const CATEGORY_ICONS: Record<Category, string> = { planner: "📋", performer: "🎤", crew: "🎬" };

function todayLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function StepBasics() {
  const { register, setValue, getValues, control, err, clearErrors } = useWizardField();
  const [dateType, startDate, category] = useWatch({ control, name: ["dateType", "startDate", "category"] });
  const [pendingCategory, setPendingCategory] = useState<Category | null>(null);

  const applyCategory = (next: Category) => {
    setValue("category", next, { shouldDirty: true });
    setValue("details", structuredClone(detailDefaults[next]), { shouldDirty: true });
    clearErrors(["category", "details"]);
    setPendingCategory(null);
  };

  const chooseCategory = (next: Category) => {
    if (next === category) return;
    // Switching category throws away the category-specific answers, so confirm if any were given.
    const touched =
      category && JSON.stringify(getValues("details")) !== JSON.stringify(detailDefaults[category]);
    if (touched) setPendingCategory(next);
    else applyCategory(next);
  };

  return (
    <div className="space-y-5">
      <Field label="Event name" htmlFor="eventName" error={err("eventName")}>
        <input
          id="eventName"
          className={inputClass}
          placeholder="e.g. Riya & Arjun's Sangeet"
          aria-invalid={!!err("eventName")}
          {...register("eventName")}
        />
      </Field>

      <Field label="Event type" htmlFor="eventType" error={err("eventType")}>
        <select id="eventType" className={inputClass} aria-invalid={!!err("eventType")} {...register("eventType")}>
          <option value="">Select event type</option>
          {EVENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {labelFor(t)}
            </option>
          ))}
        </select>
      </Field>

      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-zinc-800">When is it?</legend>
        <div className="mb-3 inline-flex rounded-lg bg-zinc-100 p-1">
          {(["single", "range"] as const).map((t) => (
            <label
              key={t}
              className={`cursor-pointer rounded-md px-3 py-1.5 text-sm has-focus-visible:ring-2 has-focus-visible:ring-violet-500/30 ${
                dateType === t ? "bg-white font-medium text-zinc-900 shadow-sm" : "text-zinc-600"
              }`}
            >
              <input type="radio" value={t} className="sr-only" {...register("dateType")} />
              {t === "single" ? "Single day" : "Multiple days"}
            </label>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={dateType === "range" ? "Start date" : "Date"} htmlFor="startDate" error={err("startDate")}>
            <input
              id="startDate"
              type="date"
              min={todayLocal()}
              className={inputClass}
              aria-invalid={!!err("startDate")}
              {...register("startDate")}
            />
          </Field>
          {dateType === "range" && (
            <Field label="End date" htmlFor="endDate" error={err("endDate")}>
              <input
                id="endDate"
                type="date"
                min={startDate || todayLocal()}
                className={inputClass}
                aria-invalid={!!err("endDate")}
                {...register("endDate")}
              />
            </Field>
          )}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Location" htmlFor="location" error={err("location")} hint="City or area">
          <input
            id="location"
            className={inputClass}
            placeholder="e.g. Pune"
            aria-invalid={!!err("location")}
            {...register("location")}
          />
        </Field>
        <Field label="Venue" htmlFor="venue" optional error={err("venue")}>
          <input id="venue" className={inputClass} placeholder="e.g. JW Marriott" {...register("venue")} />
        </Field>
      </div>

      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-zinc-800">What are you looking for?</legend>
        <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-invalid={!!err("category")}>
          {CATEGORIES.map((c) => (
            <label
              key={c}
              className={`flex cursor-pointer flex-col rounded-xl border p-4 transition has-focus-visible:ring-2 has-focus-visible:ring-violet-500/30 ${
                category === c
                  ? "border-violet-600 bg-violet-50 ring-1 ring-violet-600"
                  : `bg-white hover:border-violet-400 ${err("category") ? "border-red-300" : "border-zinc-200"}`
              }`}
            >
              <input
                type="radio"
                name="category-choice"
                className="sr-only"
                checked={category === c}
                onChange={() => chooseCategory(c)}
              />
              <span className="text-2xl" aria-hidden>
                {CATEGORY_ICONS[c]}
              </span>
              <span className="mt-2 text-sm font-semibold text-zinc-900">{CATEGORY_META[c].label}</span>
              <span className="mt-0.5 text-xs text-zinc-500">{CATEGORY_META[c].blurb}</span>
            </label>
          ))}
        </div>
        {err("category") && (
          <p role="alert" className="mt-1.5 text-xs text-red-600">
            {err("category")}
          </p>
        )}

        {pendingCategory && category && (
          <div role="alertdialog" className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            <p>
              Switching to <strong>{CATEGORY_META[pendingCategory].label}</strong> will clear the{" "}
              {CATEGORY_META[category].label.toLowerCase()} details you&apos;ve entered.
            </p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => applyCategory(pendingCategory)}
                className="rounded-md bg-amber-600 px-3 py-1.5 font-medium text-white hover:bg-amber-700"
              >
                Switch anyway
              </button>
              <button
                type="button"
                onClick={() => setPendingCategory(null)}
                className="rounded-md px-3 py-1.5 font-medium hover:bg-amber-100"
              >
                Keep {CATEGORY_META[category].label}
              </button>
            </div>
          </div>
        )}
      </fieldset>
    </div>
  );
}
