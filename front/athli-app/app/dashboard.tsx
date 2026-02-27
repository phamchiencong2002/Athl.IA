import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ScreenContainer from '../components/ui/ScreenContainer';
import colors from '../constants/colors';
import spacing from '../constants/spacing';
import { useAuth } from '../context/AuthContext';
import { getAnalytics } from '../lib/analytics';
import { getLatestReadiness } from '../lib/readiness';

export default function DashboardScreen() {
  const { accountId, signOut, token } = useAuth();
  const [analytics, setAnalytics] = useState<{ weekly_sessions_done: number; weekly_sessions_planned: number; injury_risk_flag: boolean; next_session_intensity: number | null } | null>(null);
  const [advice, setAdvice] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!accountId) return;
    setLoading(true);
    try {
      const [a, readiness] = await Promise.all([
        getAnalytics(accountId),
        getLatestReadiness(accountId).catch(() => ({ ai_advice: 'Aucun feedback readiness pour le moment.' })),
      ]);
      setAnalytics(a);
      setAdvice(readiness.ai_advice || '');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      router.replace('/login');
      return;
    }
    load();
  }, [accountId, token]);

  return (
    <ScreenContainer>
      <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Dashboard</Text>
          <TouchableOpacity onPress={async () => { await signOut(); router.replace('/'); }}>
            <Text style={styles.logout}>Deconnexion</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Semaine en cours</Text>
          <Text style={styles.metric}>{analytics?.weekly_sessions_done ?? 0} / {analytics?.weekly_sessions_planned ?? 0} seances</Text>
          <Text style={styles.muted}>Risque blessure: {analytics?.injury_risk_flag ? 'Eleve' : 'Controle'}</Text>
          <Text style={styles.muted}>Intensite prochaine seance: {analytics?.next_session_intensity ?? '-'} / 10</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Conseil du jour</Text>
          <Text style={styles.muted}>{advice || 'Renseigne ton etat du jour pour recevoir un conseil.'}</Text>
        </View>

        <View style={styles.menu}>
          {[
            ['Seance du jour', '/today'],
            ['Feedback quotidien', '/feedback'],
            ['Historique', '/history'],
            ['Progression', '/progress'],
          ].map(([label, path]) => (
            <TouchableOpacity key={label} style={styles.menuButton} onPress={() => router.push(path as '/today')}>
              <Text style={styles.menuText}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  title: { fontSize: 28, fontWeight: '700', color: colors.text },
  logout: { color: '#DC2626', fontWeight: '600' },
  card: { backgroundColor: colors.cardBg, borderRadius: 18, padding: spacing.md, marginBottom: spacing.md },
  cardTitle: { color: colors.text, fontSize: 17, fontWeight: '700', marginBottom: spacing.xs },
  metric: { color: colors.primaryDark, fontSize: 24, fontWeight: '700', marginBottom: spacing.xs },
  muted: { color: colors.textMuted, fontSize: 15 },
  menu: { gap: spacing.sm, marginTop: spacing.sm },
  menuButton: { backgroundColor: '#DBEAFE', borderRadius: 14, padding: spacing.md },
  menuText: { color: colors.primaryDark, fontWeight: '700' },
});
