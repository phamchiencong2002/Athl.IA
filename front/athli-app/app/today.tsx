import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import PrimaryButton from '../components/ui/PrimaryButton';
import ScreenContainer from '../components/ui/ScreenContainer';
import colors from '../constants/colors';
import spacing from '../constants/spacing';
import { useAuth } from '../context/AuthContext';
import { completeSession, getTodaySession } from '../lib/workouts';

export default function TodayScreen() {
  const { accountId, token } = useAuth();
  const [session, setSession] = useState<{ id: string; name: string; planned_duration_min: number; planned_intensity: number; adjusted_intensity: number } | null>(null);
  const [rpe, setRpe] = useState('7');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!accountId) return;
    getTodaySession(accountId).then(setSession).catch(() => setSession(null));
  }, [accountId]);

  const submit = async () => {
    if (!token || !session) return;
    await completeSession(token, session.id, { rpe_reported: Number(rpe) || 7, notes });
    Alert.alert('Bravo', 'Seance marquee comme terminee.', [{ text: 'OK', onPress: () => router.back() }]);
  };

  if (!session) {
    return (
      <ScreenContainer>
        <View style={styles.card}><Text style={styles.title}>Pas de seance aujourd'hui.</Text></View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.card}>
        <Text style={styles.title}>{session.name}</Text>
        <Text style={styles.row}>Duree: {session.planned_duration_min} min</Text>
        <Text style={styles.row}>Intensite planifiee: {session.planned_intensity}/10</Text>
        <Text style={styles.row}>Intensite ajustee: {session.adjusted_intensity}/10</Text>

        <TextInput style={styles.input} value={rpe} onChangeText={setRpe} keyboardType="numeric" placeholder="RPE ressenti (1-10)" />
        <TextInput style={styles.input} value={notes} onChangeText={setNotes} placeholder="Notes" multiline />

        <PrimaryButton title="Terminer la seance" onPress={submit} style={styles.button} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.cardBg, borderRadius: 20, padding: spacing.lg, gap: spacing.sm, flex: 1 },
  title: { color: colors.text, fontSize: 22, fontWeight: '700' },
  row: { color: colors.textMuted },
  input: { backgroundColor: '#fff', borderColor: '#E5E7EB', borderWidth: 1, borderRadius: 12, padding: 12 },
  button: { marginTop: spacing.md },
});
