"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { formatDateRange } from "@/lib/format";
import { CATEGORIES, CATEGORY_META, labelFor, type Category } from "@/lib/options";
import { useFetch } from "@/lib/useFetch";
import { CategoryBadge } from "./CategoryBadge";
import { ErrorState, LoadingState } from "./States";

const PAGE_SIZE = 10;

export function RequirementsBrowser() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const rawCategory = params.get("category");
  const category = CATEGORIES.includes(rawCategory as Category) ? (rawCategory as Category) : undefined;
  const page = Math.max(1, Number(params.get("page")) || 1);

  const { data, error, loading, slow, retry } = useFetch(`${category ?? "all"}:${page}`, () =>
    api.listRequirements({ category, page, limit: PAGE_SIZE }),
  );

  const setQuery = (next: { category?: Category; page?: number }) => {
    const qs = new URLSearchParams();
    if (next.category) qs.set("category", next.category);
    if (next.page && next.page > 1) qs.set("page", String(next.page));
    router.replace(qs.size ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const counts = data?.countsByCategory ?? {};
  const total = Object.values(counts).reduce((a, b) => a + (b ?? 0), 0);
  const tabs: { key?: Category; label: string; count?: number }[] = [
    { label: "All", count: data ? total : undefined },
    ...CATEGORIES.map((c) => ({ key: c, label: CATEGORY_META[c].label, count: data ? (counts[c] ?? 0) : undefined })),
  ];

  return (
    <div className="space-y-5">
      <div role="tablist" aria-label="Filter by category" className="flex flex-wrap gap-2">
        {tabs.map((t) => {
          const active = t.key === category;
          return (
            <button
              key={t.label}
              role="tab"
              aria-selected={active}
              onClick={() => setQuery({ category: t.key })}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                active ? "bg-zinc-900 text-white" : "bg-white text-zinc-600 ring-1 ring-zinc-200 hover:bg-zinc-50"
              }`}
            >
              {t.label}
              {t.count !== undefined && <span className={`ml-1.5 ${active ? "text-zinc-300" : "text-zinc-400"}`}>{t.count}</span>}
            </button>
          );
        })}
      </div>

      {loading && <LoadingState slow={slow} />}
      {error && <ErrorState message={error} onRetry={retry} />}

      {data && data.data.length === 0 && (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center">
          <p className="text-zinc-600">
            No {category ? CATEGORY_META[category].label.toLowerCase() + " " : ""}requirements yet.
          </p>
          <Link href="/post" className="mt-3 inline-block text-sm font-semibold text-violet-700 hover:underline">
            Post the first one →
          </Link>
        </div>
      )}

      {data && data.data.length > 0 && (
        <>
          <ul className="space-y-3">
            {data.data.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/requirements/${r.id}`}
                  className="block rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-violet-300 hover:shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h2 className="font-semibold text-zinc-900">{r.eventName}</h2>
                      <p className="mt-0.5 text-sm text-zinc-500">
                        {labelFor(r.eventType)} · {r.location}
                        {r.venue ? `, ${r.venue}` : ""}
                      </p>
                    </div>
                    <CategoryBadge category={r.category} />
                  </div>
                  <p className="mt-2 text-sm text-zinc-700">{formatDateRange(r.dateType, r.startDate, r.endDate)}</p>
                </Link>
              </li>
            ))}
          </ul>

          {data.pagination.totalPages > 1 && (
            <nav className="flex items-center justify-between text-sm" aria-label="Pagination">
              <button
                onClick={() => setQuery({ category, page: page - 1 })}
                disabled={page <= 1}
                className="rounded-lg px-3 py-1.5 font-medium text-zinc-700 hover:bg-zinc-100 disabled:invisible"
              >
                ← Newer
              </button>
              <span className="text-zinc-500">
                Page {data.pagination.page} of {data.pagination.totalPages}
              </span>
              <button
                onClick={() => setQuery({ category, page: page + 1 })}
                disabled={page >= data.pagination.totalPages}
                className="rounded-lg px-3 py-1.5 font-medium text-zinc-700 hover:bg-zinc-100 disabled:invisible"
              >
                Older →
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
