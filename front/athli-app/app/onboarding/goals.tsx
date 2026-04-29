import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, SafeAreaView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import PrimaryButton from '../../components/ui/PrimaryButton';
import colors from '../../constants/colors';
import spacing from '../../constants/spacing';
import { useOnboarding } from '../../context/OnboardingContext';

const GOALS = [
  { id: 'muscle', label: 'Prise de muscle', icon: 'fitness-center' },
  { id: 'weight_loss', label: 'Perte de poids', icon: 'monitor-weight' },
  { id: 'fitness', label: 'Remise en forme', icon: 'favorite' },
  { id: 'performance', label: 'Performance', icon: 'trending-up' },
  { id: 'mobility', label: 'Mobilité / Souplesse', icon: 'self-improvement' },
  { id: 'rehab', label: 'Rééducation légère', icon: 'healing' },
] as const;

export default function GoalsScreen() {
  const { data, update } = useOnboarding();
  const canContinue = Boolean(data.goal);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <MaterialIcons name="arrow-back-ios" size={24} color={colors.contentLight} />
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: '40%' }]} />
          </View>
        </View>
        <View style={styles.iconButton} />
      </View>

      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Quel est ton objectif principal ?</Text>
          <Text style={styles.subtitle}>
            {"Choisis l'option qui te correspond le mieux pour personnaliser ton expérience."}
          </Text>
        </View>

        <View style={styles.grid}>
          {GOALS.map((goal) => {
            const isActive = data.goal === goal.id;
            return (
              <TouchableOpacity
                key={goal.id}
                style={[styles.card, isActive && styles.cardActive]}
                onPress={() => update({ goal: goal.id })}
                activeOpacity={0.8}
              >
                <MaterialIcons
                  name={goal.icon as any}
                  size={36}
                  color={isActive ? colors.primary : colors.contentLight}
                />
                <Text style={[styles.cardText, isActive && styles.cardTextActive]}>
                  {goal.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.footer}>
        <PrimaryButton
          title="Continuer"
          onPress={() => router.push('/onboarding/bodymap')}
          style={styles.continueButton}
          disabled={!canContinue}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  iconButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    paddingLeft: spacing.sm,
  },
  progressContainer: {
    flex: 1,
    alignItems: 'center',
  },
  progressTrack: {
    width: 200,
    height: 10,
    backgroundColor: colors.surfaceLight,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primaryBlue,
    borderRadius: 5,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    maxWidth: 320,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.contentLight,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: colors.mutedLight,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'center',
    width: '100%',
  },
  card: {
    width: '46%',
    aspectRatio: 1,
    backgroundColor: colors.surfaceLight,
    borderRadius: 16,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    gap: spacing.md,
  },
  cardActive: {
    borderColor: colors.primaryBlue,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  cardText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.contentLight,
    textAlign: 'center',
  },
  cardTextActive: {
    color: colors.primaryBlue,
  },
  footer: {
    padding: spacing.xl,
    paddingBottom: spacing.lg,
  },
  continueButton: {
    backgroundColor: colors.primaryBlue,
  },
});
