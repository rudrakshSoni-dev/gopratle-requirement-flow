import type { Category } from "./options";
import type { DetailsForm, Issue } from "./schema";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/$/, "");

export type Requirement = {
  id: string;
  eventName: string;
  eventType: string;
  dateType: "single" | "range";
  startDate: string;
  endDate?: string;
  location: string;
  venue?: string;
  category: Category;
  details: DetailsForm;
  contact: { name: string; email: string; phone: string };
  status: "open" | "closed";
  createdAt: string;
  updatedAt: string;
};

export type RequirementList = {
  data: Requirement[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  countsByCategory: Partial<Record<Category, number>>;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details: Issue[] = [],
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new ApiError("Can't reach the server. Check your connection and try again.", 0);
  }

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(body.error ?? `Request failed (${res.status})`, res.status, body.details ?? []);
  }
  return body as T;
}

export const api = {
  createRequirement: (payload: unknown) =>
    request<{ data: Requirement }>("/api/requirements", { method: "POST", body: JSON.stringify(payload) }),

  listRequirements: (params: { category?: Category; page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params.category) qs.set("category", params.category);
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    return request<RequirementList>(`/api/requirements?${qs}`);
  },

  getRequirement: (id: string) => request<{ data: Requirement }>(`/api/requirements/${encodeURIComponent(id)}`),
};
