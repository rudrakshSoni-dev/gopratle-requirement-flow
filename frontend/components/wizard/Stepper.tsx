"use client";

export function Stepper({
  labels,
  current,
  maxReached,
  onSelect,
}: {
  labels: string[];
  current: number;
  maxReached: number;
  onSelect: (step: number) => void;
}) {
  return (
    <nav aria-label="Progress">
      <ol className="flex items-center gap-2">
        {labels.map((label, i) => {
          const done = i < current;
          const active = i === current;
          const reachable = i <= maxReached && !active;
          return (
            <li key={i} className="flex flex-1 items-center gap-2 last:flex-none">
              <button
                type="button"
                disabled={!reachable}
                onClick={() => onSelect(i)}
                aria-current={active ? "step" : undefined}
                className="group flex items-center gap-2 disabled:cursor-default"
              >
                <span
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition ${
                    active
                      ? "bg-violet-600 text-white ring-4 ring-violet-100"
                      : done || i <= maxReached
                        ? "bg-violet-100 text-violet-700 group-enabled:group-hover:bg-violet-200"
                        : "bg-zinc-100 text-zinc-400"
                  }`}
                >
                  {done ? "✓" : i + 1}
                </span>
                <span
                  className={`hidden text-sm md:block ${active ? "font-semibold text-zinc-900" : "text-zinc-500"}`}
                >
                  {label}
                </span>
              </button>
              {i < labels.length - 1 && (
                <span className={`h-px flex-1 ${i < current ? "bg-violet-300" : "bg-zinc-200"}`} aria-hidden />
              )}
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-sm text-zinc-500 md:hidden">
        Step {current + 1} of {labels.length}: <span className="font-medium text-zinc-800">{labels[current]}</span>
      </p>
    </nav>
  );
}
