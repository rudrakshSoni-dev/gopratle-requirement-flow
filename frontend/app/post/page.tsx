import type { Metadata } from "next";
import { WizardLoader } from "@/components/wizard/WizardLoader";

export const metadata: Metadata = { title: "Post a requirement — GoPratle" };

export default function PostPage() {
  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold tracking-tight text-zinc-900">Post a requirement</h1>
      <WizardLoader />
    </div>
  );
}
