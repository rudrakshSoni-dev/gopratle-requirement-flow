"use client";

import { useId, useState, type KeyboardEvent, type ReactNode } from "react";
import { labelFor } from "@/lib/options";

export const inputClass =
  "block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-xs " +
  "placeholder:text-zinc-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 " +
  "aria-[invalid=true]:border-red-400 aria-[invalid=true]:focus:ring-red-500/20 disabled:bg-zinc-100";

type FieldProps = {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  className?: string;
  children: ReactNode;
};

/** Label + control + hint/error. Pass the control's id as `htmlFor`. */
export function Field({ label, htmlFor, error, hint, optional, className, children }: FieldProps) {
  const Label = htmlFor ? "label" : "span";
  return (
    <div className={className}>
      <Label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-zinc-800">
        {label}
        {optional && <span className="ml-1 font-normal text-zinc-400">(optional)</span>}
      </Label>
      {children}
      {error ? (
        <p role="alert" className="mt-1.5 text-xs text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-zinc-500">{hint}</p>
      ) : null}
    </div>
  );
}

/** Toggleable chips for picking several values from a fixed list. */
export function ChipMultiSelect({
  options,
  value,
  onChange,
  invalid,
  label,
}: {
  options: readonly string[];
  value: string[];
  onChange: (next: string[]) => void;
  invalid?: boolean;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} data-invalid={invalid} className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const selected = value.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(selected ? value.filter((v) => v !== opt) : [...value, opt])}
            className={`rounded-full border px-3 py-1.5 text-sm transition ${
              selected
                ? "border-violet-600 bg-violet-600 text-white"
                : `bg-white text-zinc-700 hover:border-violet-400 ${invalid ? "border-red-300" : "border-zinc-300"}`
            }`}
          >
            {labelFor(opt)}
          </button>
        );
      })}
    </div>
  );
}

/** Free-text tags: type and press Enter or comma to add. */
export function TagInput({
  id,
  value,
  onChange,
  placeholder,
  invalid,
  suggestions = [],
}: {
  id: string;
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  invalid?: boolean;
  suggestions?: string[];
}) {
  const [draft, setDraft] = useState("");

  const add = (raw: string) => {
    const tag = raw.trim().replace(/,$/, "").trim();
    if (tag && !value.some((v) => v.toLowerCase() === tag.toLowerCase())) onChange([...value, tag]);
    setDraft("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(draft);
    } else if (e.key === "Backspace" && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  const unused = suggestions.filter((s) => !value.some((v) => v.toLowerCase() === s.toLowerCase()));

  return (
    <div>
      <div
        className={`flex flex-wrap items-center gap-1.5 rounded-lg border bg-white px-2 py-1.5 focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/20 ${
          invalid ? "border-red-400" : "border-zinc-300"
        }`}
      >
        {value.map((tag) => (
          <span key={tag} className="flex items-center gap-1 rounded-md bg-violet-50 px-2 py-0.5 text-sm text-violet-800">
            {tag}
            <button
              type="button"
              onClick={() => onChange(value.filter((v) => v !== tag))}
              className="text-violet-500 hover:text-violet-800"
              aria-label={`Remove ${tag}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => draft && add(draft)}
          placeholder={value.length ? "" : placeholder}
          aria-invalid={invalid}
          className="min-w-32 flex-1 border-0 bg-transparent px-1 py-0.5 text-sm outline-none placeholder:text-zinc-400"
        />
      </div>
      {unused.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {unused.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="rounded-full border border-dashed border-zinc-300 px-2.5 py-0.5 text-xs text-zinc-600 hover:border-violet-400 hover:text-violet-700"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Yes / No segmented toggle backed by a boolean (undefined = not answered). */
export function YesNo({
  value,
  onChange,
  invalid,
  label,
}: {
  value: boolean | undefined;
  onChange: (v: boolean) => void;
  invalid?: boolean;
  label: string;
}) {
  const name = useId();
  return (
    <div role="radiogroup" aria-label={label} aria-invalid={invalid} className="inline-flex gap-2">
      {[true, false].map((opt) => (
        <label
          key={String(opt)}
          className={`cursor-pointer rounded-lg border px-4 py-2 text-sm transition has-focus-visible:ring-2 has-focus-visible:ring-violet-500/30 ${
            value === opt
              ? "border-violet-600 bg-violet-50 font-medium text-violet-800"
              : `bg-white text-zinc-700 hover:border-violet-400 ${invalid ? "border-red-300" : "border-zinc-300"}`
          }`}
        >
          <input
            type="radio"
            name={name}
            className="sr-only"
            checked={value === opt}
            onChange={() => onChange(opt)}
          />
          {opt ? "Yes" : "No"}
        </label>
      ))}
    </div>
  );
}
