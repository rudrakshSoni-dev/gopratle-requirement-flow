"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { FormProvider, useForm, useWatch, type Path } from "react-hook-form";
import { ApiError, api, type Requirement } from "@/lib/api";
import { CATEGORY_META } from "@/lib/options";
import { STEP_COUNT, emptyForm, stepForPath, toPayload, validateStep, type FormValues, type Issue } from "@/lib/schema";
import { StepBasics } from "./StepBasics";
import { StepReview } from "./StepReview";
import { Stepper } from "./Stepper";
import { stepsByCategory } from "./categorySteps";

const DRAFT_KEY = "gopratle:requirement-draft:v1";

type Draft = { values: FormValues; step: number; maxReached: number };

// This component is only rendered client-side (see WizardLoader), so reading
// localStorage during the first render is safe.
function loadDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as Draft;
    return { ...draft, values: { ...emptyForm, ...draft.values } };
  } catch {
    return null;
  }
}

const saveDraft = (draft: Draft) => {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Storage full or disabled — the draft just won't survive a refresh.
  }
};

const clearDraft = () => {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {}
};

const STEP_INTRO = [
  "Tell us about the event. We'll tailor the next steps to what you're looking for.",
  "",
  "",
  "Check everything looks right, add your contact details and post.",
];

export function RequirementWizard() {
  const [initialDraft] = useState(loadDraft);
  const form = useForm<FormValues>({ defaultValues: initialDraft?.values ?? emptyForm });
  const { control, getValues, setError, clearErrors, reset, subscribe } = form;
  const category = useWatch({ control, name: "category" });

  const [step, setStep] = useState(initialDraft?.values.category ? initialDraft.step : 0);
  const [maxReached, setMaxReached] = useState(initialDraft?.values.category ? initialDraft.maxReached : 0);
  const [submitting, setSubmitting] = useState(false);
  const [slow, setSlow] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saved, setSaved] = useState<Requirement | null>(null);

  // Steps the user has tried to leave; those re-validate live as they type.
  const attempted = useRef(new Set<number>());
  const headingRef = useRef<HTMLHeadingElement>(null);
  const isFirstRender = useRef(true);

  const applyIssues = (issues: Issue[]) => {
    clearErrors();
    issues.forEach((i) => setError(i.path as Path<FormValues>, { type: "manual", message: i.message }));
  };

  const focusFirstError = () =>
    requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>('[aria-invalid="true"], [data-invalid="true"]');
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      if (el && "focus" in el && el.tabIndex >= 0) el.focus({ preventScroll: true });
    });

  // Persist the draft and keep errors in sync with what's typed.
  useEffect(() => {
    saveDraft({ values: getValues(), step, maxReached });
    return subscribe({
      formState: { values: true },
      callback: () => {
        const values = getValues();
        saveDraft({ values, step, maxReached });
        if (attempted.current.has(step)) applyIssues(validateStep(step, values));
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- applyIssues only uses stable RHF methods
  }, [subscribe, getValues, step, maxReached]);

  // Move focus to the new step's heading for keyboard and screen-reader users.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    headingRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const goTo = (target: number) => {
    setStep(target);
    setMaxReached((m) => Math.max(m, target));
  };

  /** Validates steps [from, to) and stops at the first one with problems. */
  const advance = (from: number, to: number) => {
    const values = getValues();
    for (let s = from; s < to; s++) {
      const issues = validateStep(s, values);
      if (issues.length) {
        attempted.current.add(s);
        if (s !== step) setStep(s);
        applyIssues(issues);
        focusFirstError();
        return false;
      }
    }
    clearErrors();
    goTo(to);
    return true;
  };

  const jumpTo = (target: number) => {
    if (target < step) {
      clearErrors();
      setStep(target);
    } else {
      advance(step, target);
    }
  };

  const submit = async () => {
    // Re-check every step: the user may have edited earlier steps from the review page.
    const values = getValues();
    for (let s = 0; s < STEP_COUNT; s++) {
      const issues = validateStep(s, values);
      if (issues.length) {
        attempted.current.add(s);
        setStep(s);
        applyIssues(issues);
        focusFirstError();
        return;
      }
    }

    setSubmitting(true);
    setSubmitError(null);
    const slowTimer = setTimeout(() => setSlow(true), 3000);
    try {
      const { data } = await api.createRequirement(toPayload(values));
      clearDraft();
      setSaved(data);
    } catch (e) {
      if (e instanceof ApiError && e.details.length) {
        // Server-side validation failed: show the errors on their fields.
        const target = Math.min(...e.details.map((d) => stepForPath(d.path, values.category)));
        attempted.current.add(target);
        setStep(target);
        applyIssues(e.details.filter((d) => stepForPath(d.path, values.category) === target));
        focusFirstError();
      }
      setSubmitError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      clearTimeout(slowTimer);
      setSlow(false);
      setSubmitting(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (step < STEP_COUNT - 1) advance(step, step + 1);
    else void submit();
  };

  const startOver = () => {
    clearDraft();
    reset(emptyForm);
    attempted.current.clear();
    setSaved(null);
    setStep(0);
    setMaxReached(0);
  };

  if (saved) return <SuccessCard requirement={saved} onPostAnother={startOver} />;

  const meta = category ? CATEGORY_META[category] : null;
  const labels = ["Event basics", meta?.steps[0] ?? "Details", meta?.steps[1] ?? "More details", "Review & post"];
  const CategoryStep = category && (step === 1 || step === 2) ? stepsByCategory[category][step - 1] : null;
  const intro =
    STEP_INTRO[step] ||
    (meta ? `Step ${step} of the ${meta.label.toLowerCase()} details. Be as specific as you can.` : "");

  return (
    <FormProvider {...form}>
      <div className="space-y-8">
        <Stepper labels={labels} current={step} maxReached={maxReached} onSelect={jumpTo} />

        <form onSubmit={onSubmit} noValidate className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-8">
          <header className="mb-6">
            <h2 ref={headingRef} tabIndex={-1} className="text-xl font-semibold text-zinc-900 outline-none">
              {labels[step]}
            </h2>
            <p className="mt-1 text-sm text-zinc-500">{intro}</p>
          </header>

          {step === 0 && <StepBasics />}
          {CategoryStep && <CategoryStep key={`${category}-${step}`} />}
          {step === 3 && <StepReview onEditStep={jumpTo} />}

          {submitError && (
            <div role="alert" className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {submitError}
            </div>
          )}

          <footer className="mt-8 flex items-center justify-between gap-3 border-t border-zinc-100 pt-5">
            {step > 0 ? (
              <button
                type="button"
                onClick={() => jumpTo(step - 1)}
                disabled={submitting}
                className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50"
              >
                ← Back
              </button>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-3">
              {slow && <span className="text-xs text-zinc-500">Waking up the server, hang tight…</span>}
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 disabled:cursor-wait disabled:opacity-70"
              >
                {step < STEP_COUNT - 1 ? "Continue →" : submitting ? "Posting…" : "Post requirement"}
              </button>
            </div>
          </footer>
        </form>
      </div>
    </FormProvider>
  );
}

function SuccessCard({ requirement, onPostAnother }: { requirement: Requirement; onPostAnother: () => void }) {
  const label = CATEGORY_META[requirement.category].label;
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-700">
        ✓
      </div>
      <h2 className="mt-4 text-xl font-semibold text-zinc-900">Requirement posted</h2>
      <p className="mt-2 text-sm text-zinc-600">
        <strong>{requirement.eventName}</strong> is live under <strong>{label}</strong>.
      </p>
      <p className="mt-1 font-mono text-xs text-zinc-400">ID: {requirement.id}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href={`/requirements/${requirement.id}`}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
        >
          View requirement
        </Link>
        <Link
          href={`/requirements?category=${requirement.category}`}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          All {label.toLowerCase()} requirements
        </Link>
        <button
          type="button"
          onClick={onPostAnother}
          className="rounded-lg px-4 py-2 text-sm font-medium text-violet-700 hover:bg-violet-50"
        >
          Post another
        </button>
      </div>
    </div>
  );
}
