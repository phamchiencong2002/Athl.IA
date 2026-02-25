import { apiFetch } from "./api";

export interface AccountPayload {
  id: string;
  username: string;
  mail: string;
  avatar: string | null;
  statut_account: string | null;
  last_connection: string | null;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  account: AccountPayload;
}

export function register(payload: {
  username: string;
  mail: string;
  password: string;
}) {
  return apiFetch<AuthResponse>("/auth/register", {
    method: "POST",
    body: payload,
  });
}

export function login(payload: { mail: string; password: string }) {
  return apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: payload,
  });
}

export function refreshToken(payload: { refreshToken: string }) {
  return apiFetch<{ token: string; refreshToken: string }>("/auth/refresh", {
    method: "POST",
    body: payload,
  });
}
