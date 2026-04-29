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

export default function StatsScreen() {
  const { accountId } = useAuth();
  const [readiness, setReadiness] = useState<ReadinessDetail | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!accountId) return;
    setLoading(true);
    try {
      const data = await apiFetch<ReadinessDetail>(
        `/readiness/latest?account_id=${encodeURIComponent(accountId)}`,
      );
      setReadiness(data);
    } catch {
      setReadiness(null);
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    load();
  }, [load]);

  const score = readiness?.readiness_score ?? 0;
  const statusColor = getStatusColor(score);

  const sleepScore = readiness ? Math.min(100, Math.round((readiness.sleep_hours / 8) * 100)) : 0;
  const stressScore = readiness ? Math.max(0, 100 - readiness.stress * 10) : 0;
  const fatigueScore = readiness ? Math.max(0, 100 - readiness.fatigue * 10) : 0;
  const sorenessScore = readiness ? Math.max(0, 100 - readiness.soreness * 10) : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color={colors.contentDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analyse de ta forme</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      >
        {/* Hero Score Card */}
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
            <View style={[styles.heroStatusDot, { backgroundColor: statusColor }]} />
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

        {/* AI Advice Card */}
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

        {/* Score Breakdown */}
        <View style={styles.breakdownSection}>
          <Text style={styles.breakdownTitle}>Répartition du score</Text>

          {[
            { label: 'Sommeil', icon: 'bedtime', color: '#10B981', score: sleepScore, desc: `${readiness?.sleep_hours ?? 0}h — ${sleepScore >= 80 ? 'Récupération optimale' : sleepScore >= 60 ? 'Sommeil suffisant' : 'Manque de sommeil'}` },
            { label: 'Stress', icon: 'favorite', color: '#7C3AED', score: stressScore, desc: `Niveau ${readiness?.stress ?? 0}/10 — ${stressScore >= 70 ? 'Stress bien géré' : 'Stress élevé détecté'}` },
            { label: 'Fatigue', icon: 'battery-charging-full', color: colors.primaryBlue, score: fatigueScore, desc: `Niveau ${readiness?.fatigue ?? 0}/10 — ${fatigueScore >= 70 ? 'Énergie correcte' : 'Fatigue perceptible'}` },
            { label: 'Courbatures', icon: 'fitness-center', color: '#F59E0B', score: sorenessScore, desc: `Niveau ${readiness?.soreness ?? 0}/10 — ${sorenessScore >= 70 ? 'Muscles récupérés' : 'Récupération musculaire en cours'}` },
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

        {/* Feedback button */}
        <TouchableOpacity
          style={styles.historyBtn}
          activeOpacity={0.8}
          onPress={() => router.push('/feedback')}
        >
          <MaterialIcons name="add-circle-outline" size={20} color={colors.contentDark} />
          <Text style={styles.historyBtnText}>Soumettre feedback du jour</Text>
        </TouchableOpacity>
      </ScrollView>

      <BottomNav activeTab="stats" />
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
  breakdownSection: { gap: 16, paddingTop: 8 },
  breakdownTitle: { fontSize: 19, fontWeight: '800', color: '#1E293B', marginBottom: 4 },
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
