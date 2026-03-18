import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View, TextInput, SafeAreaView } from 'react-native';
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
  const { data, update, reset } = useOnboarding();
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
    if (!data.username || !data.email || !data.password) {
      Alert.alert('Erreur', 'Veuillez remplir vos identifiants pour créer votre compte.');
      return;
    }

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
        sport: data.sport || '',
        main_goal: data.goal,
        week_availability: data.weekAvailability,
        equipment: (data.equipment || []).join(','),
      });

      await generateProgram(auth.token, {
        account_id: auth.account.id,
        goal: data.goal || 'health',
        week_availability: Math.max(1, Math.min(7, data.weekAvailability || 3)),
      });

      reset();
      router.replace('/dashboard');
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Impossible de finaliser onboarding';
      Alert.alert('Erreur', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Dernière étape ! 🚀</Text>
          <Text style={styles.subtitle}>Créez votre compte pour générer votre programme personnalisé instantanément.</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Identifiants</Text>
          <TextInput
            placeholder="Pseudo"
            value={data.username}
            onChangeText={(username) => update({ username })}
            style={styles.input}
            placeholderTextColor={colors.mutedLight}
          />
          <TextInput
            placeholder="Email"
            value={data.email}
            onChangeText={(email) => update({ email })}
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor={colors.mutedLight}
          />
          <TextInput
            placeholder="Mot de passe"
            value={data.password}
            onChangeText={(password) => update({ password })}
            style={styles.input}
            secureTextEntry
            placeholderTextColor={colors.mutedLight}
          />
        </View>

        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>Votre Profil</Text>
          <Text style={styles.summaryText}>Objectif : {data.goal || 'Général'}</Text>
          <Text style={styles.summaryText}>Fréquence : {data.weekAvailability || 0}x par semaine</Text>
          <Text style={styles.summaryText}>Niveau : {data.level}</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          title="Générer mon programme"
          onPress={submit}
          loading={loading}
          disabled={loading}
          style={styles.button}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  content: {
    flexGrow: 1,
    padding: spacing.xl,
    paddingTop: spacing.xxl,
  },
  titleContainer: {
    marginBottom: 48,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.contentLight,
    textAlign: 'center',
    marginBottom: spacing.sm,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: colors.mutedLight,
    textAlign: 'center',
    lineHeight: 22,
  },
  formGroup: {
    gap: spacing.md,
    marginBottom: 32,
  },
  label: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.contentLight,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    fontSize: 16,
    color: colors.contentLight,
  },
  summaryBox: {
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    borderRadius: 16,
    padding: spacing.md,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primaryBlue,
    marginBottom: spacing.xs,
  },
  summaryText: {
    fontSize: 14,
    color: colors.contentLight,
    marginBottom: 4,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  button: {
    backgroundColor: colors.primaryBlue,
    shadowColor: colors.primaryBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
});
