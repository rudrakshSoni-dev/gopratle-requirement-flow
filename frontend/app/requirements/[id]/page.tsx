import type { Metadata } from "next";
import { Suspense } from "react";
import { RequirementDetail } from "@/components/RequirementDetail";

export const metadata: Metadata = { title: "Requirement — GoPratle" };

export default function RequirementPage({ params }: PageProps<"/requirements/[id]">) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-zinc-100" />}>
      <RequirementDetail params={params} />
    </Suspense>
  );
}
