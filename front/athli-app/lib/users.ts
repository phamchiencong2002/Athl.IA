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

export function createUserProfile(token: string, payload: CreateUserPayload) {
  return apiFetch("/users", {
    method: "POST",
    token,
    body: payload,
  });
}
