import { apiFetch } from './api';

export function getProgress(accountId: string) {
  return apiFetch<{ completed_sessions: number; completion_rate: number; average_rpe: number; readiness_average: number }>(
    `/progress/${accountId}`,
  );
}

export function getAnalytics(accountId: string) {
  return apiFetch<{ weekly_sessions_done: number; weekly_sessions_planned: number; injury_risk_flag: boolean; next_session_intensity: number | null }>(
    `/analytics/${accountId}`,
  );
}
