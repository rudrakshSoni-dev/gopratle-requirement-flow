"use client";

import { useEffect } from "react";
import { api } from "@/lib/api";

/**
 * Pings the API as soon as any page loads, so a sleeping free-tier server is already
 * starting up while the user reads the page or fills in step 1.
 */
export function ServerWarmup() {
  useEffect(() => api.wakeUp(), []);
  return null;
}
