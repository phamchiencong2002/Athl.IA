import { apiFetch } from "./api";

export interface CreateUserPayload {
  id_account: string;
  gender?: string | null;
  birthdate?: string;
  height_cm?: number | null;
  weight_kg?: number | null;
  training_experience?: string | null;
  sport?: string | null;
  main_goal?: string | null;
  week_availability?: number | null;
  equipment?: string | null;
  health?: string | null;
  sleep?: string | null;
  stress?: string | null;
  load?: string | null;
  recovery?: string | null;
}

export interface UserProfileOut {
  id: string;
  username: string;
  mail: string;
  avatar?: string | null;
  profile?: {
    gender?: string | null;
    birthdate?: string | null;
    height_cm?: number | null;
    weight_kg?: number | null;
    training_experience?: string | null;
    sport?: string | null;
    main_goal?: string | null;
    week_availability?: number | null;
    equipment?: string | null;
    health?: string | null;
    sleep?: string | null;
    stress?: string | null;
    load?: string | null;
    recovery?: string | null;
  } | null;
}

export function getUserProfile(token: string): Promise<UserProfileOut> {
  return apiFetch<UserProfileOut>("/users/me", { method: "GET", token });
}

export function createUserProfile(token: string, payload: CreateUserPayload) {
  return apiFetch("/users", {
    method: "POST",
    token,
    body: payload as unknown as Record<string, unknown>,
  });
}
