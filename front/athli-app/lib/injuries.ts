import { apiFetch } from './api';

export type Injury = {
  id: string;
  muscle_group: string;
  pain_level: number;
  is_active: boolean;
};

export function listInjuries(accountId: string) {
  return apiFetch<Injury[]>(`/injuries?account_id=${encodeURIComponent(accountId)}`);
}

export function reportInjury(
  token: string,
  payload: { account_id: string; muscle_group: string; pain_level: number },
) {
  return apiFetch<Injury>('/injuries', { method: 'POST', token, body: payload });
}

export function resolveInjury(token: string, injuryId: string) {
  return apiFetch<{ id: string; is_active: boolean }>(`/injuries/${injuryId}/resolve`, {
    method: 'PATCH',
    token,
  });
}
