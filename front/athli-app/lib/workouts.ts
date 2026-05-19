import { apiFetch } from './api';

export type ExerciseItem = {
  id: string;
  order_index: number;
  name: string;
  sets: number | null;
  reps: string | null;
  equipment: string | null;
  muscle_groups: string | null;
  notes: string | null;
};

export type Session = {
  id: string;
  name: string;
  session_date: string;
  planned_duration_min: number;
  planned_intensity: number;
  adjusted_intensity: number;
  status: string;
  notes?: string | null;
  exercises?: ExerciseItem[];
};

export function generateProgram(token: string, payload: { account_id: string; goal: string; week_availability: number }) {
  return apiFetch<{ id: string; title: string; goal: string; sessions: Session[] }>('/workouts/programs/generate', {
    method: 'POST',
    token,
    body: payload,
  });
}

export function getTodaySession(accountId: string) {
  return apiFetch<Session>(
    `/workouts/sessions/today?account_id=${encodeURIComponent(accountId)}`,
  );
}

export function getNextSession(accountId: string) {
  return apiFetch<Session>(
    `/workouts/sessions/next?account_id=${encodeURIComponent(accountId)}`,
  );
}

export function getSessionById(sessionId: string) {
  return apiFetch<Session>(`/workouts/sessions/${encodeURIComponent(sessionId)}`);
}

export function completeSession(token: string, sessionId: string, payload: { rpe_reported: number; notes?: string }) {
  return apiFetch(`/workouts/sessions/${sessionId}/complete`, {
    method: 'POST',
    token,
    body: payload,
  });
}

export type ExerciseUpdatePayload = {
  name: string;
  sets?: number | null;
  reps?: string | null;
  equipment?: string | null;
  muscle_groups?: string | null;
  notes?: string | null;
};

export function updateSessionExercises(sessionId: string, exercises: ExerciseUpdatePayload[]) {
  return apiFetch<{ exercises: ExerciseUpdatePayload[] }>(
    `/workouts/sessions/${encodeURIComponent(sessionId)}/exercises`,
    { method: 'PUT', body: exercises as unknown as Record<string, unknown> },
  );
}

export function listSessions(accountId: string) {
  return apiFetch<Array<Session & { rpe_reported?: number | null }>>(
    `/workouts/sessions?account_id=${encodeURIComponent(accountId)}`,
  );
}
