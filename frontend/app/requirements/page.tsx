import type { Metadata } from "next";
import { Suspense } from "react";
import { RequirementsBrowser } from "@/components/RequirementsBrowser";

export const metadata: Metadata = { title: "Requirements — GoPratle" };

export default function RequirementsPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-zinc-900">Posted requirements</h1>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-zinc-100" />}>
        <RequirementsBrowser />
      </Suspense>
    </div>
  );
}
