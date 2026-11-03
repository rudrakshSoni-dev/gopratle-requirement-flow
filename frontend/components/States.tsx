export function LoadingState({ slow }: { slow?: boolean }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-live="polite">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-20 animate-pulse rounded-xl bg-zinc-100" />
      ))}
      {slow && (
        <p className="text-center text-sm text-zinc-500">
          Waking up the server — the free hosting tier sleeps when idle. This can take up to a minute.
        </p>
      )}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
      <p>{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-3 font-semibold underline-offset-2 hover:underline">
          Try again
        </button>
      )}
    </div>
  );
}
