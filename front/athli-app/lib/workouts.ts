import { apiFetch } from './api';

export type Session = {
  id: string;
  name: string;
  session_date: string;
  planned_duration_min: number;
  planned_intensity: number;
  adjusted_intensity: number;
  status: string;
};

export function generateProgram(token: string, payload: { account_id: string; goal: string; week_availability: number }) {
  return apiFetch<{ id: string; title: string; goal: string; sessions: Session[] }>('/workouts/programs/generate', {
    method: 'POST',
    token,
    body: payload,
  });
}

export function getTodaySession(accountId: string) {
  return apiFetch<{ id: string; name: string; planned_duration_min: number; planned_intensity: number; adjusted_intensity: number; status: string }>(
    `/workouts/sessions/today?account_id=${encodeURIComponent(accountId)}`,
  );
}

export function completeSession(token: string, sessionId: string, payload: { rpe_reported: number; notes?: string }) {
  return apiFetch(`/workouts/sessions/${sessionId}/complete`, {
    method: 'POST',
    token,
    body: payload,
  });
}

export function listSessions(accountId: string) {
  return apiFetch<Array<Session & { rpe_reported?: number | null }>>(
    `/workouts/sessions?account_id=${encodeURIComponent(accountId)}`,
  );
}
