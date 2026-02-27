import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import PrimaryButton from '../../components/ui/PrimaryButton';
import ScreenContainer from '../../components/ui/ScreenContainer';
import colors from '../../constants/colors';
import spacing from '../../constants/spacing';
import { useAuth } from '../../context/AuthContext';
import { useOnboarding } from '../../context/OnboardingContext';
import { ApiError } from '../../lib/api';
import { register } from '../../lib/auth';
import { generateProgram } from '../../lib/workouts';
import { createUserProfile } from '../../lib/users';

export default function SummaryScreen() {
  const { data, reset } = useOnboarding();
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);

  const birthdate = useMemo(() => {
    const age = Number(data.age);
    if (!Number.isFinite(age) || age <= 0) return undefined;
    const date = new Date();
    date.setFullYear(date.getFullYear() - age);
    return date.toISOString();
  }, [data.age]);

  const submit = async () => {
    setLoading(true);
    try {
      const auth = await register({ username: data.username, mail: data.email, password: data.password });
      await signIn(auth.token, auth.refreshToken, auth.account.id);

      await createUserProfile(auth.token, {
        id_account: auth.account.id,
        gender: data.sex,
        birthdate,
        height_cm: data.height,
        weight_kg: data.weight,
        training_experience: data.level,
        sport: data.sport,
        main_goal: data.goal,
        week_availability: data.weekAvailability,
        equipment: data.equipment.join(','),
      });

      await generateProgram(auth.token, {
        account_id: auth.account.id,
        goal: data.goal || 'health',
        week_availability: Math.max(1, Math.min(7, data.weekAvailability || 3)),
      });

      reset();
      Alert.alert('Onboarding termine', 'Ton plan a ete genere.', [{ text: 'OK', onPress: () => router.replace('/dashboard') }]);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Impossible de finaliser onboarding';
      Alert.alert('Erreur', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.title}>Recapitulatif</Text>
          <Text style={styles.row}>Profil: {data.username} ({data.email})</Text>
          <Text style={styles.row}>Objectif: {data.goal || 'non defini'}</Text>
          <Text style={styles.row}>Sport: {data.sport || 'non defini'}</Text>
          <Text style={styles.row}>Disponibilite: {data.weekAvailability || 0} j/semaine</Text>
          <Text style={styles.row}>Douleurs: {data.injuries.join(', ') || 'aucune'}</Text>
          <Text style={styles.row}>Materiel: {data.equipment.join(', ') || 'aucun'}</Text>

          <PrimaryButton title="Generer mon programme" onPress={submit} loading={loading} disabled={loading} style={styles.button} />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center' },
  card: { backgroundColor: colors.cardBg, borderRadius: 24, padding: spacing.lg, gap: spacing.sm },
  title: { color: colors.text, fontSize: 24, fontWeight: '700', marginBottom: spacing.sm },
  row: { color: colors.textMuted, fontSize: 15 },
  button: { marginTop: spacing.md },
});
