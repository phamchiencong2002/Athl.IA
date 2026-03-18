import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ScrollView, View, SafeAreaView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import PrimaryButton from '../../components/ui/PrimaryButton';
import colors from '../../constants/colors';
import spacing from '../../constants/spacing';
import { useOnboarding } from '../../context/OnboardingContext';

const LIMITATIONS = [
  { id: 'impact', label: 'Impact', icon: 'directions-run', iconColor: colors.primaryBlue, bgTint: 'rgba(59, 130, 246, 0.1)' },
  { id: 'rotation', label: 'Rotation', icon: 'rotate-right', iconColor: '#7C3AED', bgTint: 'rgba(124, 58, 237, 0.1)' },
  { id: 'flexion', label: 'Flexion profonde', icon: 'height', iconColor: '#10B981', bgTint: 'rgba(16, 185, 129, 0.1)' },
  { id: 'heavy', label: 'Charge lourde', icon: 'fitness-center', iconColor: '#6B7280', bgTint: 'rgba(107, 114, 128, 0.1)' },
] as const;

export default function LimitationsScreen() {
  const { data, update } = useOnboarding();

  const toggleLimitation = (id: string) => {
    let newLims = [...(data.movementLimitations || [])];
    if (newLims.includes(id)) {
      newLims = newLims.filter(l => l !== id);
    } else {
      newLims.push(id);
    }
    update({ movementLimitations: newLims });
  };

  const isSelected = (id: string) => (data.movementLimitations || []).includes(id);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.progressContainerWrapper}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconButtonAbs}>
            <MaterialIcons name="arrow-back-ios" size={24} color={colors.contentLight} />
          </TouchableOpacity>
          <View style={styles.dotsRow}>
            <View style={[styles.dot, styles.dotInactive]} />
            <View style={[styles.dot, styles.dotActive]} />
            <View style={[styles.dot, styles.dotInactive]} />
          </View>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: '50%' }]} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Quel type de mouvements veux-tu éviter ?</Text>
        </View>

        <View style={styles.list}>
          {LIMITATIONS.map((lim) => {
            const active = isSelected(lim.id);
            return (
              <TouchableOpacity
                key={lim.id}
                style={[styles.row, active && styles.rowActive]}
                onPress={() => toggleLimitation(lim.id)}
                activeOpacity={0.8}
              >
                <View style={styles.rowLeft}>
                  <View style={[styles.iconWrapper, { backgroundColor: lim.bgTint }]}>
                    <MaterialIcons name={lim.icon as any} size={28} color={lim.iconColor} />
                  </View>
                  <Text style={styles.rowLabel}>{lim.label}</Text>
                </View>
                <View style={styles.toggleTrack}>
                  <View style={[styles.toggleThumb, active ? styles.toggleThumbActive : styles.toggleThumbInactive]} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          title="Continuer"
          onPress={() => router.push('/onboarding/baseline')}
          style={styles.continueButton}
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
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  progressContainerWrapper: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconButtonAbs: {
    position: 'absolute',
    left: 0,
    padding: spacing.sm,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.primaryBlue,
  },
  dotInactive: {
    width: 8,
    backgroundColor: colors.border,
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
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.contentLight,
    textAlign: 'center',
    letterSpacing: -0.5,
    maxWidth: 300,
  },
  list: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceLight,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  rowActive: {
    borderColor: colors.primaryBlue,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.contentLight,
  },
  toggleTrack: {
    width: 56,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.border,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFF',
  },
  toggleThumbInactive: {
    alignSelf: 'flex-start',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primaryBlue,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  continueButton: {
    backgroundColor: colors.primaryBlue,
  },
});
