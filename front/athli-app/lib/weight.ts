import { apiFetch } from './api';

export type WeightLog = {
  id: string;
  log_date: string;
  weight_kg: number;
};

export function listWeightLogs(token: string) {
  return apiFetch<WeightLog[]>('/weight-logs', { token });
}

export function addWeightLog(token: string, weight_kg: number) {
  return apiFetch<WeightLog>('/weight-logs', { method: 'POST', token, body: { weight_kg } });
}
