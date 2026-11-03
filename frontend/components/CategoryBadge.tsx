import { CATEGORY_META, type Category } from "@/lib/options";

const STYLES: Record<Category, string> = {
  planner: "bg-sky-50 text-sky-700 ring-sky-200",
  performer: "bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200",
  crew: "bg-amber-50 text-amber-800 ring-amber-200",
};

export function CategoryBadge({ category }: { category: Category }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STYLES[category]}`}>
      {CATEGORY_META[category].label}
    </span>
  );
}
