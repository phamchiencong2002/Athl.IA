import Slider from '@react-native-community/slider';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import PrimaryButton from '../components/ui/PrimaryButton';
import ScreenContainer from '../components/ui/ScreenContainer';
import colors from '../constants/colors';
import spacing from '../constants/spacing';
import { useAuth } from '../context/AuthContext';
import { submitReadiness } from '../lib/readiness';

export default function FeedbackScreen() {
  const { accountId, token } = useAuth();
  const { fromSession } = useLocalSearchParams<{ fromSession?: string }>();
  const [sleepHours, setSleepHours] = useState(7);
  const [fatigue, setFatigue] = useState(4);
  const [stress, setStress] = useState(3);
  const [soreness, setSoreness] = useState(3);
  const [pain, setPain] = useState(2);

  const send = async () => {
    if (!accountId || !token) return;
    await submitReadiness(token, {
      account_id: accountId,
      sleep_hours: sleepHours,
      fatigue,
      stress,
      soreness,
      pain_level: pain,
    });
    router.replace('/dashboard');
  };

  return (
    <ScreenContainer>
      <View style={styles.card}>
        <Text style={styles.title}>{fromSession ? 'Comment tu te sens ?' : 'Feedback quotidien'}</Text>
        {fromSession ? (
          <Text style={styles.subtitle}>Super séance ! Dis-nous comment tu te sens pour adapter ton prochain entraînement.</Text>
        ) : null}
        {(
          [
            { label: 'Sommeil (h)', value: sleepHours, setter: setSleepHours, min: 0, max: 12 },
            { label: 'Fatigue', value: fatigue, setter: setFatigue, min: 0, max: 10 },
            { label: 'Stress', value: stress, setter: setStress, min: 0, max: 10 },
            { label: 'Courbatures', value: soreness, setter: setSoreness, min: 0, max: 10 },
            { label: 'Douleur', value: pain, setter: setPain, min: 0, max: 10 },
          ] as { label: string; value: number; setter: (v: number) => void; min: number; max: number }[]
        ).map(({ label, value, setter, min, max }) => (
          <View key={label}>
            <Text style={styles.label}>{label}: {value}</Text>
            <Slider
              minimumValue={min}
              maximumValue={max}
              step={1}
              value={value}
              onValueChange={setter}
              minimumTrackTintColor={colors.success}
            />
          </View>
        ))}

        <PrimaryButton title="Envoyer" onPress={send} style={styles.button} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.cardBg, borderRadius: 20, padding: spacing.lg, gap: spacing.sm, flex: 1 },
  title: { color: colors.text, fontSize: 24, fontWeight: '700', marginBottom: spacing.sm },
  subtitle: { color: colors.textMuted, fontSize: 14, marginBottom: spacing.sm },
  label: { color: colors.text, fontWeight: '600' },
  button: { marginTop: spacing.md },
});
