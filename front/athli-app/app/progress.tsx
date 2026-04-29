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
import { getProgress, getAnalytics } from '../lib/analytics';

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

function StatCard({
  label,
  value,
  subtitle,
  color,
  icon,
}: {
  label: string;
  value: string;
  subtitle?: string;
  color: string;
  icon: string;
}) {
  return (
    <View style={[styles.statCard, { borderTopColor: color, borderTopWidth: 3 }]}>
      <View style={styles.statCardHeader}>
        <View style={[styles.statIconBox, { backgroundColor: `${color}18` }]}>
          <MaterialIcons name={icon as any} size={20} color={color} />
        </View>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      {subtitle ? <Text style={styles.statSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export default function ProgressScreen() {
  const { accountId } = useAuth();
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!accountId) return;
    setLoading(true);
    try {
      const [p, a] = await Promise.all([
        getProgress(accountId),
        getAnalytics(accountId),
      ]);
      setProgress(p);
      setAnalytics(a);
    } catch {
      // keep previous state
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    load();
  }, [load]);

  const completionPct = progress?.completion_rate ?? 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color={colors.contentDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ma Progression</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      >
        {/* Completion ring */}
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Taux de complétion global</Text>
          <View style={styles.ringContainer}>
            <View
              style={[
                styles.ring,
                {
                  borderColor:
                    completionPct >= 75
                      ? '#10B981'
                      : completionPct >= 50
                      ? '#F59E0B'
                      : colors.primaryBlue,
                },
              ]}
            >
              <Text style={styles.ringValue}>{Math.round(completionPct)}%</Text>
              <Text style={styles.ringSubtext}>Complétion</Text>
            </View>
          </View>
          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{progress?.completed_sessions ?? 0}</Text>
              <Text style={styles.heroStatLabel}>Séances faites</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>
                {progress?.average_rpe ? progress.average_rpe.toFixed(1) : '—'}
              </Text>
              <Text style={styles.heroStatLabel}>RPE moyen</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>
                {progress?.readiness_average ? Math.round(progress.readiness_average) : '—'}
              </Text>
              <Text style={styles.heroStatLabel}>Readiness moy.</Text>
            </View>
          </View>
        </View>

        {/* Weekly analytics */}
        <Text style={styles.sectionTitle}>Cette semaine</Text>
        <View style={styles.statsGrid}>
          <StatCard
            label="Séances"
            value={`${analytics?.weekly_sessions_done ?? 0}/${analytics?.weekly_sessions_planned ?? 0}`}
            subtitle="réalisées / planifiées"
            color={colors.primaryBlue}
            icon="fitness-center"
          />
          <StatCard
            label="Prochaine"
            value={
              analytics?.next_session_intensity != null
                ? `${analytics.next_session_intensity}/10`
                : '—'
            }
            subtitle="intensité ajustée"
            color="#7C3AED"
            icon="bolt"
          />
        </View>

        {/* Injury risk */}
        {analytics?.injury_risk_flag ? (
          <View style={styles.riskBanner}>
            <MaterialIcons name="warning" size={22} color="#D97706" />
            <View style={styles.riskTextBlock}>
              <Text style={styles.riskTitle}>Risque de blessure détecté</Text>
              <Text style={styles.riskDesc}>
                {"Ton niveau de douleur ou de fatigue est élevé. Privilégie la récupération active"}
                {" et réduis l'intensité de tes prochaines séances."}
              </Text>
            </View>
          </View>
        ) : analytics ? (
          <View style={styles.okBanner}>
            <MaterialIcons name="check-circle" size={22} color="#10B981" />
            <Text style={styles.okText}>Aucun risque de blessure détecté — continue comme ça !</Text>
          </View>
        ) : null}

        {/* CTA buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/stats')}>
            <MaterialIcons name="analytics" size={20} color={colors.primaryBlue} />
            <Text style={styles.actionBtnText}>{"Voir l'analyse de forme"}</Text>
            <MaterialIcons name="chevron-right" size={20} color="#94A3B8" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/history')}>
            <MaterialIcons name="history" size={20} color="#7C3AED" />
            <Text style={styles.actionBtnText}>Historique des séances</Text>
            <MaterialIcons name="chevron-right" size={20} color="#94A3B8" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/feedback')}>
            <MaterialIcons name="add-circle-outline" size={20} color="#10B981" />
            <Text style={styles.actionBtnText}>Soumettre feedback du jour</Text>
            <MaterialIcons name="chevron-right" size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </ScrollView>

    </SafeAreaView>
  );
}

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
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B', letterSpacing: -0.5 },
  spacer: { width: 44 },
  scrollContent: { paddingHorizontal: spacing.xl, paddingBottom: 120, gap: spacing.xl },
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
    alignItems: 'center',
  },
  heroLabel: { fontSize: 13, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 },
  ringContainer: { marginVertical: spacing.xl },
  ring: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringValue: { fontSize: 40, fontWeight: '900', color: '#1E293B' },
  ringSubtext: { fontSize: 13, fontWeight: '700', color: '#94A3B8' },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: spacing.lg,
    width: '100%',
    justifyContent: 'space-around',
  },
  heroStat: { alignItems: 'center' },
  heroStatValue: { fontSize: 24, fontWeight: '900', color: '#1E293B' },
  heroStatLabel: { fontSize: 11, fontWeight: '600', color: '#94A3B8', marginTop: 4 },
  heroStatDivider: { width: 1, height: 40, backgroundColor: '#F1F5F9' },
  sectionTitle: { fontSize: 19, fontWeight: '800', color: '#1E293B' },
  statsGrid: { flexDirection: 'row', gap: spacing.md },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
    gap: 8,
  },
  statCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statIconBox: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  statLabel: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  statValue: { fontSize: 26, fontWeight: '900' },
  statSubtitle: { fontSize: 11, fontWeight: '500', color: '#94A3B8' },
  riskBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: 'rgba(245,158,11,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
    borderRadius: 20,
    padding: spacing.lg,
  },
  riskTextBlock: { flex: 1 },
  riskTitle: { fontSize: 14, fontWeight: '800', color: '#92400E', marginBottom: 4 },
  riskDesc: { fontSize: 13, fontWeight: '500', color: '#B45309', lineHeight: 20 },
  okBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(16,185,129,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.25)',
    borderRadius: 20,
    padding: spacing.lg,
  },
  okText: { flex: 1, fontSize: 13, fontWeight: '600', color: '#065F46' },
  actions: { gap: spacing.sm },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  actionBtnText: { flex: 1, fontSize: 14, fontWeight: '700', color: '#1E293B' },
});
