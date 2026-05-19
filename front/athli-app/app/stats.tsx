import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import colors from '../constants/colors';
import spacing from '../constants/spacing';
import { useAuth } from '../context/AuthContext';
import BottomNav from '../components/ui/BottomNav';
import { apiFetch } from '../lib/api';
import { getProgress, getAnalytics } from '../lib/analytics';

// ─── Types ───────────────────────────────────────────────────────────────────

type ReadinessDetail = {
  readiness_score: number;
  ai_advice: string;
  sleep_hours: number;
  fatigue: number;
  stress: number;
  soreness: number;
  pain_level: number;
  log_date: string;
};

type ProgressData = {
  completed_sessions: number;
  completion_rate: number;
  average_rpe: number;
  readiness_average: number;
};

type AnalyticsData = {
  weekly_sessions_done: number;
  weekly_sessions_planned: number;
  injury_risk_flag: boolean;
  next_session_intensity: number | null;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getStatusLabel(score: number): string {
  if (score >= 75) return 'Excellente forme';
  if (score >= 50) return 'Forme correcte';
  if (score >= 30) return 'Fatigue perceptible';
  return 'Récupération nécessaire';
}

function getStatusColor(score: number): string {
  if (score >= 75) return '#10B981';
  if (score >= 50) return '#F59E0B';
  return '#EF4444';
}

// ─── Mini history bar chart ───────────────────────────────────────────────────

function HistoryBar({ score, date }: { score: number; date: string }) {
  const height = Math.max(8, (score / 100) * 56);
  const color = getStatusColor(score);
  const label = new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });

  return (
    <View style={barStyles.col}>
      <Text style={barStyles.score}>{score}</Text>
      <View style={barStyles.track}>
        <View style={[barStyles.fill, { height, backgroundColor: color }]} />
      </View>
      <Text style={barStyles.date}>{label}</Text>
    </View>
  );
}

const barStyles = StyleSheet.create({
  col: { alignItems: 'center', gap: 4, flex: 1 },
  track: {
    width: 12,
    height: 56,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  fill: { width: '100%', borderRadius: 6 },
  score: { fontSize: 9, fontWeight: '700', color: '#94A3B8' },
  date: { fontSize: 8, fontWeight: '600', color: '#CBD5E1', textAlign: 'center' },
});

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function StatsScreen() {
  const { accountId } = useAuth();
  const [readiness, setReadiness] = useState<ReadinessDetail | null>(null);
  const [history, setHistory] = useState<ReadinessDetail[]>([]);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!accountId) return;
    setLoading(true);
    try {
      const [latestRaw, historyData, progressData, analyticsData] = await Promise.allSettled([
        apiFetch<ReadinessDetail | Record<string, never>>(
          `/readiness/latest?account_id=${encodeURIComponent(accountId)}`,
        ),
        apiFetch<ReadinessDetail[]>(
          `/readiness/history?account_id=${encodeURIComponent(accountId)}&limit=14`,
        ),
        getProgress(accountId),
        getAnalytics(accountId),
      ]);

      if (latestRaw.status === 'fulfilled') {
        const d = latestRaw.value;
        setReadiness('readiness_score' in d ? (d as ReadinessDetail) : null);
      } else {
        setReadiness(null);
      }

      if (historyData.status === 'fulfilled') {
        setHistory([...historyData.value].reverse());
      }

      if (progressData.status === 'fulfilled') setProgress(progressData.value);
      if (analyticsData.status === 'fulfilled') setAnalytics(analyticsData.value);
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => { load(); }, [load]);

  const score = readiness?.readiness_score ?? 0;
  const statusColor = getStatusColor(score);
  const sleepScore  = readiness ? Math.min(100, Math.round((readiness.sleep_hours / 8) * 100)) : 0;
  const stressScore = readiness ? Math.max(0, 100 - readiness.stress * 10) : 0;
  const fatigueScore = readiness ? Math.max(0, 100 - readiness.fatigue * 10) : 0;
  const sorenessScore = readiness ? Math.max(0, 100 - readiness.soreness * 10) : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color={colors.contentLight} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analyse de ta forme</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      >
        {/* ── Hero Score Card ─────────────────────────────────────────── */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View>
              <Text style={styles.heroSubtitle}>Score Readiness</Text>
              <Text style={[styles.heroScore, { color: readiness ? '#1E293B' : '#CBD5E1' }]}>
                {readiness ? score : '—'}
              </Text>
            </View>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>Athli.AI</Text>
            </View>
          </View>
          <View style={styles.heroStatusRow}>
            <View style={[styles.heroStatusDot, { backgroundColor: readiness ? statusColor : '#CBD5E1' }]} />
            <Text style={styles.heroStatusText}>
              {readiness ? getStatusLabel(score) : 'Aucune donnée'}
            </Text>
          </View>
          {readiness && (
            <Text style={styles.heroDate}>
              Enregistré le {new Date(readiness.log_date).toLocaleDateString('fr-FR')}
            </Text>
          )}
          <View style={styles.heroCardGlow} />
        </View>

        {/* ── AI Advice ───────────────────────────────────────────────── */}
        {readiness?.ai_advice ? (
          <View style={styles.adviceCard}>
            <View style={styles.adviceIconBox}>
              <MaterialIcons name="psychology" size={20} color="#FFF" />
            </View>
            <View style={styles.adviceTextCont}>
              <Text style={styles.adviceTitle}>{"Conseil de l'IA"}</Text>
              <Text style={styles.adviceText}>{readiness.ai_advice}</Text>
            </View>
          </View>
        ) : null}

        {/* ── Cette semaine (Analytics) ────────────────────────────────── */}
        {analytics && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cette semaine</Text>
            <View style={styles.weekRow}>
              <View style={styles.weekCard}>
                <Text style={styles.weekValue}>
                  {analytics.weekly_sessions_done}/{analytics.weekly_sessions_planned}
                </Text>
                <Text style={styles.weekLabel}>Séances</Text>
              </View>

              <View style={styles.weekCard}>
                <Text style={[
                  styles.weekValue,
                  { color: analytics.injury_risk_flag ? '#EF4444' : '#10B981' },
                ]}>
                  {analytics.injury_risk_flag ? 'Élevé' : 'Faible'}
                </Text>
                <Text style={styles.weekLabel}>Risque blessure</Text>
              </View>

              <View style={styles.weekCard}>
                <Text style={styles.weekValue}>
                  {analytics.next_session_intensity != null
                    ? `${analytics.next_session_intensity}%`
                    : '—'}
                </Text>
                <Text style={styles.weekLabel}>Intensité prochaine</Text>
              </View>
            </View>
          </View>
        )}

        {/* ── Progression globale ──────────────────────────────────────── */}
        {progress && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Progression globale</Text>
            <View style={styles.weekRow}>
              <View style={styles.weekCard}>
                <Text style={styles.weekValue}>{progress.completed_sessions}</Text>
                <Text style={styles.weekLabel}>Séances complétées</Text>
              </View>
              <View style={styles.weekCard}>
                <Text style={styles.weekValue}>
                  {Math.round(progress.completion_rate * 100)}%
                </Text>
                <Text style={styles.weekLabel}>Taux de complétion</Text>
              </View>
              <View style={styles.weekCard}>
                <Text style={styles.weekValue}>
                  {progress.average_rpe > 0 ? progress.average_rpe.toFixed(1) : '—'}
                </Text>
                <Text style={styles.weekLabel}>RPE moyen</Text>
              </View>
            </View>
          </View>
        )}

        {/* ── Historique readiness (14 derniers jours) ─────────────────── */}
        {history.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Historique — 14 jours</Text>
            <View style={styles.historyCard}>
              <View style={styles.historyBars}>
                {history.map((entry) => (
                  <HistoryBar
                    key={entry.log_date}
                    score={entry.readiness_score}
                    date={entry.log_date}
                  />
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ── Score Breakdown ──────────────────────────────────────────── */}
        <View style={styles.breakdownSection}>
          <Text style={styles.sectionTitle}>Répartition du score</Text>
          {[
            {
              label: 'Sommeil',
              icon: 'bedtime',
              color: '#10B981',
              score: sleepScore,
              desc: `${readiness?.sleep_hours ?? 0}h — ${sleepScore >= 80 ? 'Récupération optimale' : sleepScore >= 60 ? 'Sommeil suffisant' : 'Manque de sommeil'}`,
            },
            {
              label: 'Stress',
              icon: 'favorite',
              color: '#7C3AED',
              score: stressScore,
              desc: `Niveau ${readiness?.stress ?? 0}/10 — ${stressScore >= 70 ? 'Stress bien géré' : 'Stress élevé détecté'}`,
            },
            {
              label: 'Fatigue',
              icon: 'battery-charging-full',
              color: colors.primaryBlue,
              score: fatigueScore,
              desc: `Niveau ${readiness?.fatigue ?? 0}/10 — ${fatigueScore >= 70 ? 'Énergie correcte' : 'Fatigue perceptible'}`,
            },
            {
              label: 'Courbatures',
              icon: 'fitness-center',
              color: '#F59E0B',
              score: sorenessScore,
              desc: `Niveau ${readiness?.soreness ?? 0}/10 — ${sorenessScore >= 70 ? 'Muscles récupérés' : 'Récupération musculaire en cours'}`,
            },
          ].map(({ label, icon, color, score: s, desc }) => (
            <View key={label} style={styles.statCard}>
              <View style={styles.statHeader}>
                <View style={styles.statIdent}>
                  <MaterialIcons name={icon as any} size={20} color={color} />
                  <Text style={styles.statName}>{label}</Text>
                </View>
                <Text style={[styles.statValue, { color }]}>{s}/100</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { backgroundColor: color, width: `${s}%` as any }]} />
              </View>
              <Text style={styles.statDesc}>{desc}</Text>
            </View>
          ))}
        </View>

        {/* ── Feedback button ──────────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.historyBtn}
          activeOpacity={0.8}
          onPress={() => router.push('/feedback')}
        >
          <MaterialIcons name="add-circle-outline" size={20} color={colors.contentLight} />
          <Text style={styles.historyBtnText}>Soumettre feedback du jour</Text>
        </TouchableOpacity>
      </ScrollView>

      <BottomNav activeTab="stats" />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B', letterSpacing: -0.5 },
  spacer: { width: 44 },
  scrollContent: { paddingHorizontal: spacing.xl, paddingBottom: 120, gap: spacing.xl },

  // Hero
  heroCard: {
    backgroundColor: '#FFF',
    borderRadius: 28,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xl,
    zIndex: 2,
  },
  heroSubtitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  heroScore: { fontSize: 60, fontWeight: '900', lineHeight: 64, letterSpacing: -2 },
  heroBadge: {
    backgroundColor: 'rgba(59,130,246,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryBlue,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 12, zIndex: 2 },
  heroStatusDot: { width: 12, height: 12, borderRadius: 6 },
  heroStatusText: { fontSize: 19, fontWeight: '800', color: '#1E293B' },
  heroDate: { fontSize: 12, fontWeight: '500', color: '#94A3B8', marginTop: 6 },
  heroCardGlow: {
    position: 'absolute',
    bottom: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(59,130,246,0.08)',
    zIndex: 1,
  },

  // Advice
  adviceCard: {
    backgroundColor: 'rgba(59,130,246,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.1)',
    borderRadius: 28,
    padding: spacing.xl,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  adviceIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primaryBlue,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primaryBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  adviceTextCont: { flex: 1 },
  adviceTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primaryBlue,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  adviceText: { fontSize: 14, fontWeight: '500', color: '#475569', marginTop: 6, lineHeight: 22 },

  // Sections
  section: { gap: 12 },
  sectionTitle: { fontSize: 19, fontWeight: '800', color: '#1E293B' },

  // Week / Progress cards
  weekRow: { flexDirection: 'row', gap: 10 },
  weekCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 4,
  },
  weekValue: { fontSize: 20, fontWeight: '900', color: '#1E293B' },
  weekLabel: { fontSize: 10, fontWeight: '600', color: '#94A3B8', textAlign: 'center' },

  // History chart
  historyCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  historyBars: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },

  // Breakdown
  breakdownSection: { gap: 16 },
  statCard: {
    backgroundColor: '#FFF',
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  statHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  statIdent: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statName: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  statValue: { fontSize: 15, fontWeight: '900' },
  progressBarBg: { height: 8, backgroundColor: '#F8FAFC', borderRadius: 4, overflow: 'hidden', marginBottom: 12 },
  progressBarFill: { height: '100%', borderRadius: 4 },
  statDesc: { fontSize: 12, fontWeight: '500', color: '#94A3B8', lineHeight: 18 },

  // Feedback button
  historyBtn: {
    width: '100%',
    height: 64,
    backgroundColor: '#F1F5F9',
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 8,
  },
  historyBtnText: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
});
