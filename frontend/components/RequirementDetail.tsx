"use client";

import Link from "next/link";
import { use } from "react";
import { api } from "@/lib/api";
import { formatDay } from "@/lib/format";
import { useFetch } from "@/lib/useFetch";
import { CategoryBadge } from "./CategoryBadge";
import { RequirementSummary } from "./RequirementSummary";
import { ErrorState, LoadingState } from "./States";

export function RequirementDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, error, loading, slow, retry } = useFetch(id, () => api.getRequirement(id));
  const r = data?.data;

  return (
    <div className="space-y-6">
      <Link href="/requirements" className="text-sm text-zinc-500 hover:text-zinc-800">
        ← All requirements
      </Link>

      {loading && <LoadingState slow={slow} />}
      {error && <ErrorState message={error} onRetry={retry} />}

      {r && (
        <>
          <header className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{r.eventName}</h1>
              <p className="mt-1 text-sm text-zinc-500">
                Posted {formatDay(r.createdAt)} · <span className="font-mono text-xs">{r.id}</span>
              </p>
            </div>
            <CategoryBadge category={r.category} />
          </header>
          <RequirementSummary source={r} />
        </>
      )}
    </div>
  );
}
