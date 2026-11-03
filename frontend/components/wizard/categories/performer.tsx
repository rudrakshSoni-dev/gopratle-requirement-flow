"use client";

import { Controller } from "react-hook-form";
import { Field, TagInput, YesNo, inputClass } from "@/components/ui/fields";
import { PERFORMER_TYPES, labelFor } from "@/lib/options";
import { BudgetRange, NotesField, PillRadio } from "../shared";
import { useWizardField } from "../useWizardField";

const GENRE_SUGGESTIONS = ["Bollywood", "Sufi", "Classical", "Rock", "EDM", "Hip-hop", "Jazz", "Folk"];
const LANGUAGE_SUGGESTIONS = ["Hindi", "English", "Punjabi", "Marathi", "Tamil", "Bengali"];

export function PerformerAct() {
  const { control, register, err } = useWizardField();
  return (
    <div className="space-y-5">
      <Field label="Type of performer" error={err("details.performerType")}>
        <PillRadio name="details.performerType" options={PERFORMER_TYPES} labelFor={labelFor} />
      </Field>

      <Field
        label="Genres / style"
        htmlFor="genres"
        error={err("details.genres")}
        hint="Type and press Enter, or pick a suggestion"
      >
        <Controller
          control={control}
          name="details.genres"
          render={({ field }) => (
            <TagInput
              id="genres"
              value={field.value ?? []}
              onChange={field.onChange}
              placeholder="e.g. Bollywood"
              suggestions={GENRE_SUGGESTIONS}
              invalid={!!err("details.genres")}
            />
          )}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Number of performers" htmlFor="performerCount" error={err("details.performerCount")}>
          <input
            id="performerCount"
            type="number"
            inputMode="numeric"
            min={1}
            placeholder="1"
            className={inputClass}
            aria-invalid={!!err("details.performerCount")}
            {...register("details.performerCount", { valueAsNumber: true })}
          />
        </Field>
        <Field
          label="Performance length (minutes)"
          htmlFor="durationMinutes"
          error={err("details.durationMinutes")}
        >
          <input
            id="durationMinutes"
            type="number"
            inputMode="numeric"
            min={10}
            step={5}
            placeholder="60"
            className={inputClass}
            aria-invalid={!!err("details.durationMinutes")}
            {...register("details.durationMinutes", { valueAsNumber: true })}
          />
        </Field>
      </div>
    </div>
  );
}

export function PerformerLogistics() {
  const { control, err } = useWizardField();
  return (
    <div className="space-y-5">
      <Field label="Performance language(s)" htmlFor="languages" optional error={err("details.languages")}>
        <Controller
          control={control}
          name="details.languages"
          render={({ field }) => (
            <TagInput
              id="languages"
              value={field.value ?? []}
              onChange={field.onChange}
              placeholder="e.g. Hindi"
              suggestions={LANGUAGE_SUGGESTIONS}
              invalid={!!err("details.languages")}
            />
          )}
        />
      </Field>

      <Field label="Will you provide the sound system and stage?" error={err("details.equipmentProvided")}>
        <Controller
          control={control}
          name="details.equipmentProvided"
          render={({ field }) => (
            <YesNo
              label="Sound and stage provided by host"
              value={field.value}
              onChange={field.onChange}
              invalid={!!err("details.equipmentProvided")}
            />
          )}
        />
      </Field>

      <BudgetRange label="Performance fee" />

      <NotesField placeholder="Song requests, dress code, sound check timing…" />
    </div>
  );
}
