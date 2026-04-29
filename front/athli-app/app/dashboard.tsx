import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import colors from '../constants/colors';
import spacing from '../constants/spacing';
import { useAuth } from '../context/AuthContext';
import BottomNav from '../components/ui/BottomNav';
import { getDashboardSummary, type DashboardData } from '../lib/dashboard';

function getReadinessStatus(score: number): string {
  if (score >= 75) return "Prêt pour l'entraînement";
  if (score >= 50) return 'Forme correcte';
  if (score >= 30) return 'Fatigue perceptible';
  return 'Récupération conseillée';
}

function getReadinessColor(score: number): string {
  if (score >= 75) return '#10B981';
  if (score >= 50) return '#F59E0B';
  return '#EF4444';
}

function formatSleepHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatDate(): string {
  return new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export default function DashboardScreen() {
  const { token, username, loading: authLoading } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const summary = await getDashboardSummary(token);
      setData(summary);
    } catch {
      // Keep previous data on error
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      router.replace('/');
      return;
    }
    load();
  }, [token, authLoading, load]);

  const displayName = data?.user.username ?? username ?? '…';
  const readiness = data?.readiness;
  const todaySession = data?.today_session;
  const progress = data?.progress;
  const analytics = data?.analytics;

  const readinessScore = readiness?.readiness_score ?? 0;
  const readinessColor = getReadinessColor(readinessScore);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.avatarContainer, { borderColor: `${readinessColor}33` }]}>
              <View style={[styles.avatarFallback, { backgroundColor: `${readinessColor}20` }]}>
                <Text style={[styles.avatarLetter, { color: readinessColor }]}>
                  {displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
            </View>
            <View>
              <Text style={styles.greeting}>Bonjour, {displayName}</Text>
              <Text style={styles.date}>{formatDate()}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <MaterialIcons name="notifications-none" size={24} color={colors.contentDark} />
          </TouchableOpacity>
        </View>

        {/* Forme du jour Card */}
        <View style={styles.formCard}>
          <View style={styles.formHeader}>
            <View>
              <Text style={styles.formTitle}>Forme du jour</Text>
              {readiness ? (
                <View style={[styles.statusBadge, { backgroundColor: `${readinessColor}18` }]}>
                  <View style={[styles.statusDot, { backgroundColor: readinessColor }]} />
                  <Text style={[styles.statusText, { color: readinessColor }]}>
                    {getReadinessStatus(readinessScore).toUpperCase()}
                  </Text>
                </View>
              ) : (
                <View style={styles.statusBadge}>
                  <Text style={styles.statusTextGray}>AUCUNE DONNÉE</Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={() => router.push('/stats')}>
              <Text style={styles.detailsLink}>Détails</Text>
            </TouchableOpacity>
          </View>

          {/* Circular Score */}
          <View style={styles.scoreContainer}>
            <View style={[styles.circularScoreRing, { borderColor: readinessColor }]}>
              <View style={styles.scoreInner}>
                <Text style={styles.scoreNumber}>{readinessScore}</Text>
                <Text style={styles.scoreLabel}>Readiness</Text>
              </View>
            </View>
          </View>

          {/* Sub Metrics */}
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Sommeil</Text>
              <Text style={styles.metricValueBlack}>
                {readiness ? formatSleepHours(readiness.sleep_hours) : '—'}
              </Text>
            </View>
            <View style={[styles.metricItem, styles.metricItemBorder]}>
              <Text style={styles.metricLabel}>Récup</Text>
              <Text style={[styles.metricValueBlack, { color: readinessColor }]}>
                {readiness ? `${Math.max(0, 100 - readiness.soreness * 10)}%` : '—'}
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Stress</Text>
              <Text style={styles.metricValueBlack}>
                {readiness
                  ? readiness.stress <= 3
                    ? 'Bas'
                    : readiness.stress <= 6
                    ? 'Moyen'
                    : 'Élevé'
                  : '—'}
              </Text>
            </View>
          </View>

          {/* AI Advice */}
          {readiness?.ai_advice ? (
            <View style={styles.adviceBox}>
              <MaterialIcons name="psychology" size={16} color={colors.primaryBlue} />
              <Text style={styles.adviceText}>{readiness.ai_advice}</Text>
            </View>
          ) : null}
        </View>

        {/* Primary Action Button */}
        <TouchableOpacity
          style={[styles.primaryActionButton, !todaySession && styles.primaryActionButtonDisabled]}
          activeOpacity={0.8}
          onPress={() => router.push('/today')}
        >
          <MaterialIcons
            name={todaySession ? 'play-circle-outline' : 'check-circle-outline'}
            size={32}
            color="#FFF"
          />
          <Text style={styles.primaryActionText}>
            {todaySession?.status === 'done'
              ? 'Séance terminée'
              : todaySession
              ? `Commencer : ${todaySession.name}`
              : 'Pas de séance aujourd\'hui'}
          </Text>
        </TouchableOpacity>

        {/* Progression */}
        <View style={styles.progressionSection}>
          <View style={styles.progressionHeader}>
            <Text style={styles.progressionTitle}>Ma progression</Text>
            <TouchableOpacity style={styles.trendButton} onPress={() => router.push('/progress')}>
              <MaterialIcons name="trending-up" size={20} color={colors.mutedDark} />
            </TouchableOpacity>
          </View>

          <View style={styles.progressionGrid}>
            {/* Séances Card */}
            <View style={styles.progressionCard}>
              <Text style={styles.progressionCardLabel}>Séances / semaine</Text>
              <View style={styles.progressionCardValueRow}>
                <Text style={styles.progressionCardValue}>
                  {analytics?.weekly_sessions_done ?? 0}
                </Text>
                <Text style={styles.progressionCardTrendPos}>
                  /{analytics?.weekly_sessions_planned ?? 0}
                </Text>
              </View>
              <View style={styles.barChart}>
                {Array.from({ length: 5 }).map((_, i) => {
                  const done = analytics?.weekly_sessions_done ?? 0;
                  const planned = analytics?.weekly_sessions_planned ?? 1;
                  const pct = Math.min((i + 1) / Math.max(planned, 5), 1);
                  const filled = (i + 1) <= done;
                  return (
                    <View
                      key={i}
                      style={[
                        styles.bar,
                        {
                          height: `${40 + pct * 60}%` as any,
                          backgroundColor: filled ? colors.primaryBlue : 'rgba(59,130,246,0.12)',
                        },
                      ]}
                    />
                  );
                })}
              </View>
            </View>

            {/* Taux completion Card */}
            <View style={styles.progressionCard}>
              <Text style={styles.progressionCardLabel}>Complétion</Text>
              <View style={styles.progressionCardValueRow}>
                <Text style={styles.progressionCardValue}>
                  {Math.round(progress?.completion_rate ?? 0)}%
                </Text>
                <Text style={styles.progressionCardTrendPos}>
                  {(progress?.average_rpe ?? 0) > 0
                    ? `RPE ${progress!.average_rpe.toFixed(1)}`
                    : ''}
                </Text>
              </View>
              <View style={styles.barChart}>
                {[0.4, 0.6, 0.5, 0.8, (progress?.completion_rate ?? 0) / 100].map((h, i) => (
                  <View
                    key={i}
                    style={[
                      styles.bar,
                      {
                        height: `${Math.max(20, h * 100)}%` as any,
                        backgroundColor:
                          i === 4 ? colors.primaryBlue : 'rgba(59,130,246,0.12)',
                      },
                    ]}
                  />
                ))}
              </View>
            </View>
          </View>

          {/* Injury risk warning */}
          {analytics?.injury_risk_flag ? (
            <View style={styles.riskBanner}>
              <MaterialIcons name="warning" size={18} color="#F59E0B" />
              <Text style={styles.riskText}>
                Risque de blessure détecté — Privilégiez la récupération.
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <BottomNav activeTab="home" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F9FAFB' },
  scrollContent: { paddingBottom: 120, paddingHorizontal: spacing.xl },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: spacing.lg,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    overflow: 'hidden',
    padding: 2,
  },
  avatarFallback: {
    flex: 1,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { fontSize: 20, fontWeight: '800' },
  greeting: { fontSize: 20, fontWeight: '800', color: '#1E293B', letterSpacing: -0.5 },
  date: { fontSize: 13, fontWeight: '500', color: '#64748B', marginTop: 2 },
  notificationButton: {
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
  formCard: {
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
    marginBottom: spacing.xl,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xl,
  },
  formTitle: { fontSize: 19, fontWeight: '800', color: '#1E293B' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginTop: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  statusTextGray: { fontSize: 11, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase' },
  detailsLink: { fontSize: 13, fontWeight: '700', color: colors.primaryBlue },
  scoreContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.sm },
  circularScoreRing: {
    width: 176,
    height: 176,
    borderRadius: 88,
    borderWidth: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreInner: { alignItems: 'center' },
  scoreNumber: { fontSize: 48, fontWeight: '900', color: '#1E293B', lineHeight: 52 },
  scoreLabel: { fontSize: 14, fontWeight: '700', color: '#94A3B8' },
  metricsGrid: {
    flexDirection: 'row',
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  metricItem: { flex: 1, alignItems: 'center' },
  metricItemBorder: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#F8FAFC' },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  metricValueBlack: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
  adviceBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  adviceText: { flex: 1, fontSize: 13, fontWeight: '500', color: '#475569', lineHeight: 20 },
  primaryActionButton: {
    width: '100%',
    height: 72,
    backgroundColor: colors.primaryBlue,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    shadowColor: colors.primaryBlue,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 40,
  },
  primaryActionButtonDisabled: { backgroundColor: '#94A3B8', shadowOpacity: 0.1 },
  primaryActionText: { color: '#FFF', fontSize: 17, fontWeight: '800' },
  progressionSection: { gap: 20 },
  progressionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressionTitle: { fontSize: 19, fontWeight: '800', color: '#1E293B' },
  trendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressionGrid: { flexDirection: 'row', gap: spacing.md },
  progressionCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  progressionCardLabel: { fontSize: 12, fontWeight: '700', color: '#94A3B8', marginBottom: 8 },
  progressionCardValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 16,
  },
  progressionCardValue: { fontSize: 22, fontWeight: '900', color: '#1E293B' },
  progressionCardTrendPos: { fontSize: 11, fontWeight: '700', color: '#10B981' },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 64 },
  bar: { flex: 1, borderRadius: 4 },
  riskBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(245,158,11,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.25)',
    borderRadius: 16,
    padding: 14,
  },
  riskText: { flex: 1, fontSize: 13, fontWeight: '600', color: '#92400E' },
});
