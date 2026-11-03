import { CATEGORY_META } from "@/lib/options";
import { basicsRows, detailRows, type Row, type SummarySource } from "@/lib/summary";

function Section({ title, rows, onEdit }: { title: string; rows: Row[]; onEdit?: () => void }) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white">
      <header className="flex items-center justify-between border-b border-zinc-100 px-4 py-2.5">
        <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
        {onEdit && (
          <button type="button" onClick={onEdit} className="text-sm font-medium text-violet-700 hover:underline">
            Edit
          </button>
        )}
      </header>
      <dl className="divide-y divide-zinc-100">
        {rows.map((row) => (
          <div key={row.label} className="grid gap-1 px-4 py-2.5 text-sm sm:grid-cols-3 sm:gap-4">
            <dt className="text-zinc-500">{row.label}</dt>
            <dd className="break-words whitespace-pre-line text-zinc-900 sm:col-span-2">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** Read-only view of a requirement, shared by the review step and the detail page. */
export function RequirementSummary({
  source,
  onEditStep,
  showContact = true,
}: {
  source: SummarySource;
  onEditStep?: (step: number) => void;
  showContact?: boolean;
}) {
  const category = source.category || null;
  const [first, second] = category ? detailRows(category, source.details) : [[], []];
  const meta = category ? CATEGORY_META[category] : null;
  const edit = (step: number) => (onEditStep ? () => onEditStep(step) : undefined);

  return (
    <div className="space-y-4">
      <Section
        title="Event basics"
        rows={[...basicsRows(source), { label: "Looking for", value: meta?.label ?? "—" }]}
        onEdit={edit(0)}
      />
      {meta && (
        <>
          <Section title={meta.steps[0]} rows={first} onEdit={edit(1)} />
          <Section title={meta.steps[1]} rows={second} onEdit={edit(2)} />
        </>
      )}
      {showContact && source.contact && (
        <Section
          title="Contact"
          rows={[
            { label: "Name", value: source.contact.name || "—" },
            { label: "Email", value: source.contact.email || "—" },
            { label: "Phone", value: source.contact.phone || "—" },
          ]}
        />
      )}
    </div>
  );
}
