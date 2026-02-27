import { apiFetch } from './api';

export function submitReadiness(token: string, payload: {
  account_id: string;
  sleep_hours: number;
  fatigue: number;
  stress: number;
  soreness: number;
  pain_level: number;
}) {
  return apiFetch<{ readiness_score: number; ai_advice: string }>('/readiness', {
    method: 'POST',
    token,
    body: payload,
  });
}

export function getLatestReadiness(accountId: string) {
  return apiFetch<{ readiness_score: number; ai_advice: string }>(`/readiness/latest?account_id=${encodeURIComponent(accountId)}`);
}
