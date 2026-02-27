import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import ScreenContainer from '../components/ui/ScreenContainer';
import colors from '../constants/colors';
import spacing from '../constants/spacing';
import { useAuth } from '../context/AuthContext';
import { getProgress } from '../lib/analytics';

export default function ProgressScreen() {
  const { accountId } = useAuth();
  const [progress, setProgress] = useState<{ completed_sessions: number; completion_rate: number; average_rpe: number; readiness_average: number } | null>(null);

  useEffect(() => {
    if (!accountId) return;
    getProgress(accountId).then(setProgress).catch(() => setProgress(null));
  }, [accountId]);

  return (
    <ScreenContainer>
      <Text style={styles.title}>Progression</Text>
      <View style={styles.card}>
        <Text style={styles.metric}>Seances terminees: {progress?.completed_sessions ?? 0}</Text>
        <Text style={styles.metric}>Taux completion: {progress?.completion_rate ?? 0}%</Text>
        <Text style={styles.metric}>RPE moyen: {progress?.average_rpe ?? 0}</Text>
        <Text style={styles.metric}>Readiness moyen: {progress?.readiness_average ?? 0}</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 24, fontWeight: '700', marginBottom: spacing.md },
  card: { backgroundColor: colors.cardBg, borderRadius: 16, padding: spacing.lg, gap: spacing.sm },
  metric: { color: colors.text, fontSize: 16, fontWeight: '600' },
});
