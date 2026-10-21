import type { ApiErrorBody, Category, Claim, SessionUser } from "../types";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
    public details?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(path, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    let body: ApiErrorBody | undefined;
    try {
      body = await res.json();
    } catch {
      /* ignore */
    }
    throw new ApiError(
      res.status,
      body?.error?.message ?? res.statusText,
      body?.error?.code,
      body?.error?.details,
    );
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

export const api = {
  login(username: string, password: string) {
    return request<{ user: SessionUser }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  },
  logout() {
    return request<{ ok: boolean }>("/api/auth/logout", { method: "POST" });
  },
  me() {
    return request<{ user: SessionUser }>("/api/auth/me");
  },
  dashboard() {
    return request<Record<string, unknown>>("/api/dashboard");
  },
  categories() {
    return request<{ categories: Category[] }>("/api/meta/categories");
  },
  config() {
    return request<{ singleClaimLimitInr: number; defaultCurrency: string }>(
      "/api/meta/config",
    );
  },
  listClaims(params: URLSearchParams) {
    return request<{
      items: Claim[];
      total: number;
      page: number;
      pageSize: number;
    }>(`/api/claims?${params.toString()}`);
  },
  getClaim(id: string) {
    return request<{ claim: Claim }>(`/api/claims/${id}`);
  },
  createClaim(body: Record<string, unknown>, submit: boolean) {
    return request<{ claim: Claim }>("/api/claims", {
      method: "POST",
      body: JSON.stringify({ ...body, submit }),
    });
  },
  updateClaim(id: string, body: Record<string, unknown>) {
    return request<{ claim: Claim }>(`/api/claims/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },
  submitClaim(id: string) {
    return request<{ claim: Claim }>(`/api/claims/${id}/submit`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  },
  approveClaim(id: string, comment?: string) {
    return request<{ claim: Claim }>(`/api/claims/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ comment }),
    });
  },
  rejectClaim(id: string, reason: string) {
    return request<{ claim: Claim }>(`/api/claims/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  },
  reimburseClaim(id: string) {
    return request<{ claim: Claim }>(`/api/claims/${id}/reimburse`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  },
};
