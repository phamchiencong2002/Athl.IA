import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, SafeAreaView } from 'react-native';
import PrimaryButton from '../../components/ui/PrimaryButton';
import colors from '../../constants/colors';
import spacing from '../../constants/spacing';
import { useOnboarding } from '../../context/OnboardingContext';

const FREQUENCIES = [
  { value: 2, label: '2x' },
  { value: 3, label: '3x' },
  { value: 4, label: '4x' },
  { value: 5, label: '5x' },
] as const;

export default function FrequencyScreen() {
  const { data, update } = useOnboarding();
  const canContinue = data.weekAvailability > 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: '50%' }]} />
        </View>
        <View style={styles.headerSub}>
          <Text style={styles.subText}>Objectif</Text>
          <Text style={styles.subText}>Habitudes</Text>
          <Text style={styles.subText}>Finalisation</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{"Combien de fois veux-tu t'entraîner par semaine ?"}</Text>

        <View style={styles.grid}>
          {FREQUENCIES.map((freq) => {
            const isActive = data.weekAvailability === freq.value;
            return (
              <TouchableOpacity
                key={freq.value}
                style={[styles.card, isActive && styles.cardActive]}
                onPress={() => update({ weekAvailability: freq.value })}
                activeOpacity={0.8}
              >
                <Text style={[styles.cardValue, isActive && styles.cardValueActive]}>{freq.label}</Text>
                <Text style={[styles.cardLabel, isActive && styles.cardLabelActive]}>/ semaine</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.footer}>
        <PrimaryButton
          title="Continuer"
          onPress={() => router.push('/onboarding/startdate')}
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
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  progressTrack: {
    width: '100%',
    height: 8,
    backgroundColor: colors.surfaceLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primaryBlue,
    borderRadius: 4,
  },
  headerSub: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  subText: {
    fontSize: 12,
    color: colors.mutedLight,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: 48,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.contentLight,
    textAlign: 'center',
    marginBottom: 48,
    maxWidth: 320,
    lineHeight: 38,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'center',
    width: '100%',
    maxWidth: 320,
  },
  card: {
    width: '46%',
    aspectRatio: 1,
    backgroundColor: colors.surfaceLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardActive: {
    backgroundColor: colors.primaryBlue,
    borderColor: colors.primaryBlue,
    shadowColor: colors.primaryBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  cardValue: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.contentLight,
  },
  cardValueActive: {
    color: '#FFF',
  },
  cardLabel: {
    fontSize: 14,
    color: colors.mutedLight,
    marginTop: 4,
  },
  cardLabelActive: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  continueButton: {
    backgroundColor: colors.primaryBlue,
  },
});
