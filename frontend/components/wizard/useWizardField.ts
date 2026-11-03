"use client";

import { get, useFormContext, useFormState } from "react-hook-form";
import type { FormValues } from "@/lib/schema";

/** Form context plus an `err(path)` helper that returns the error message for a field. */
export function useWizardField() {
  const form = useFormContext<FormValues>();
  const { errors } = useFormState({ control: form.control });
  const err = (path: string): string | undefined => (get(errors, path) as { message?: string } | undefined)?.message;
  return { ...form, err };
}
