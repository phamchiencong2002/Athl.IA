import { router } from 'expo-router';
import React from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import PrimaryButton from '../../components/ui/PrimaryButton';
import colors from '../../constants/colors';
import spacing from '../../constants/spacing';
import { useOnboarding } from '../../context/OnboardingContext';

const OPTIONS = [
  {
    value: 'today' as const,
    label: "Aujourd'hui",
    description: 'Je commence dès maintenant',
    icon: 'flash-on' as const,
  },
  {
    value: 'tomorrow' as const,
    label: 'Demain',
    description: 'Je prépare et je démarre demain',
    icon: 'wb-sunny' as const,
  },
  {
    value: 'next_week' as const,
    label: 'La semaine prochaine',
    description: 'Je me laisse le temps de me préparer',
    icon: 'date-range' as const,
  },
];

export default function StartDateScreen() {
  const { data, update } = useOnboarding();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: '90%' }]} />
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.eyebrow}>Finalisation</Text>
        <Text style={styles.title}>Quand veux-tu commencer ?</Text>
        <Text style={styles.subtitle}>On planifiera ton programme à partir de cette date.</Text>

        <View style={styles.options}>
          {OPTIONS.map((opt) => {
            const isActive = data.startDate === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[styles.optionCard, isActive && styles.optionCardActive]}
                onPress={() => update({ startDate: opt.value })}
                activeOpacity={0.8}
              >
                <View style={[styles.iconBox, isActive && styles.iconBoxActive]}>
                  <MaterialIcons
                    name={opt.icon}
                    size={24}
                    color={isActive ? '#FFF' : colors.primaryBlue}
                  />
                </View>
                <View style={styles.optionText}>
                  <Text style={[styles.optionLabel, isActive && styles.optionLabelActive]}>
                    {opt.label}
                  </Text>
                  <Text style={[styles.optionDesc, isActive && styles.optionDescActive]}>
                    {opt.description}
                  </Text>
                </View>
                {isActive && (
                  <MaterialIcons name="check-circle" size={20} color={colors.primaryBlue} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.footer}>
        <PrimaryButton
          title="Terminer"
          onPress={() => router.push('/onboarding/summary')}
          style={styles.continueButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.backgroundLight },
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
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryBlue,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.contentLight,
    marginBottom: 8,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 15,
    color: colors.mutedLight,
    marginBottom: 32,
  },
  options: { gap: 12 },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  optionCardActive: {
    borderColor: colors.primaryBlue,
    backgroundColor: 'rgba(59,130,246,0.04)',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(59,130,246,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxActive: {
    backgroundColor: colors.primaryBlue,
  },
  optionText: { flex: 1 },
  optionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.contentLight,
  },
  optionLabelActive: { color: colors.primaryBlue },
  optionDesc: {
    fontSize: 13,
    color: colors.mutedLight,
    marginTop: 2,
  },
  optionDescActive: { color: colors.primaryBlue },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  continueButton: { backgroundColor: colors.primaryBlue },
});
