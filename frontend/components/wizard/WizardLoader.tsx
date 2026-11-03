"use client";

import dynamic from "next/dynamic";

// The wizard restores a saved draft from localStorage on its first render, so
// it is rendered on the client only.
export const WizardLoader = dynamic(() => import("./RequirementWizard").then((m) => m.RequirementWizard), {
  ssr: false,
  loading: () => <div className="h-96 animate-pulse rounded-2xl bg-zinc-100" />,
});
