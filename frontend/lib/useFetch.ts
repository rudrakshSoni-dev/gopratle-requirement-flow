"use client";

import { useEffect, useState } from "react";

type State<T> = { key: string; data?: T; error?: string };

/**
 * Minimal client-side fetching keyed by `key`: refetches whenever the key changes and
 * ignores responses for stale keys. `slow` flips on after 3s (Render cold starts).
 */
export function useFetch<T>(key: string, fetcher: () => Promise<T>) {
  const [state, setState] = useState<State<T> | null>(null);
  const [slowKey, setSlowKey] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => active && setSlowKey(key), 3000);
    fetcher()
      .then((data) => active && setState({ key, data }))
      .catch((e: unknown) =>
        active && setState({ key, error: e instanceof Error ? e.message : "Something went wrong" }),
      )
      .finally(() => clearTimeout(timer));
    return () => {
      active = false;
      clearTimeout(timer);
    };
    // The key identifies the request; `fetcher` is recreated on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt]);

  const current = state?.key === key ? state : null;
  return {
    data: current?.data,
    error: current?.error,
    loading: !current,
    slow: !current && slowKey === key,
    retry: () => {
      setState(null);
      setAttempt((a) => a + 1);
    },
  };
}
