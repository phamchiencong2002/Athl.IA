import { apiFetch } from './api';

export type DashboardReadiness = {
  readiness_score: number;
  ai_advice: string;
  sleep_hours: number;
  fatigue: number;
  stress: number;
  soreness: number;
  pain_level: number;
  log_date: string;
};

export type DashboardSession = {
  id: string;
  name: string;
  session_date: string;
  planned_duration_min: number;
  planned_intensity: number;
  adjusted_intensity: number;
  status: string;
};

export type DashboardData = {
  user: { id: string; username: string; avatar: string | null };
  readiness: DashboardReadiness | null;
  today_session: DashboardSession | null;
  analytics: {
    weekly_sessions_done: number;
    weekly_sessions_planned: number;
    injury_risk_flag: boolean;
    next_session_intensity: number | null;
  };
  progress: {
    completed_sessions: number;
    completion_rate: number;
    average_rpe: number;
    readiness_average: number;
  };
};

export function getDashboardSummary(token: string) {
  return apiFetch<DashboardData>('/dashboard/summary', { token });
}
