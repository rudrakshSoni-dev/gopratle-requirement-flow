import Link from "next/link";
import { CATEGORIES, CATEGORY_META } from "@/lib/options";

export default function Home() {
  return (
    <div className="space-y-12">
      <section className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          Find the right people for your event
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-zinc-600">
          Post what you need in four short steps. Planners, performers and crew who fit your event can respond.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/post"
            className="rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-violet-700"
          >
            Post a requirement
          </Link>
          <Link
            href="/requirements"
            className="rounded-lg border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Browse requirements
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {CATEGORIES.map((c) => (
          <div key={c} className="rounded-xl border border-zinc-200 bg-white p-5">
            <h2 className="font-semibold text-zinc-900">{CATEGORY_META[c].label}</h2>
            <p className="mt-1 text-sm text-zinc-500">{CATEGORY_META[c].blurb}</p>
            <p className="mt-3 text-xs text-zinc-400">We&apos;ll ask about: {CATEGORY_META[c].steps.join(" · ").toLowerCase()}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
