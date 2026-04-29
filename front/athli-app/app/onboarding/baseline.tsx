import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ScrollView, View, SafeAreaView, TextInput } from 'react-native';
import Slider from '@react-native-community/slider';
import PrimaryButton from '../../components/ui/PrimaryButton';
import colors from '../../constants/colors';
import spacing from '../../constants/spacing';
import { useOnboarding } from '../../context/OnboardingContext';

export default function BaselineScreen() {
  const { data, update } = useOnboarding();
  const baseline = data.baseline || { pushups: 25, squats: 50, plank: 60 };

  const updateBaseline = (key: keyof typeof baseline, value: number) => {
    update({ baseline: { ...baseline, [key]: value } });
  };

  const goNext = () => router.push('/onboarding/frequency');

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: '66%' }]} />
        </View>
        <Text style={styles.stepText}>2/3</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Tes capacités de base</Text>
          <Text style={styles.subtitle}>
            Indique tes performances maximales sur ces exercices simples.
          </Text>
        </View>

        <View style={styles.sliderGroup}>
          <Text style={styles.label}>Pompes max</Text>
          <View style={styles.row}>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={100}
              step={1}
              value={baseline.pushups}
              onValueChange={(val) => updateBaseline('pushups', val)}
              minimumTrackTintColor={colors.primaryBlue}
              maximumTrackTintColor="#D1D5DB"
              thumbTintColor={colors.primaryBlue}
            />
            <TextInput
              style={styles.numberInput}
              keyboardType="numeric"
              value={String(baseline.pushups)}
              onChangeText={(text) => {
                const val = parseInt(text.replace(/[^0-9]/g, ''), 10);
                updateBaseline('pushups', isNaN(val) ? 0 : val);
              }}
            />
          </View>
        </View>

        <View style={styles.sliderGroup}>
          <Text style={styles.label}>Squats max</Text>
          <View style={styles.row}>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={200}
              step={1}
              value={baseline.squats}
              onValueChange={(val) => updateBaseline('squats', val)}
              minimumTrackTintColor={colors.primaryBlue}
              maximumTrackTintColor="#D1D5DB"
              thumbTintColor={colors.primaryBlue}
            />
            <TextInput
              style={styles.numberInput}
              keyboardType="numeric"
              value={String(baseline.squats)}
              onChangeText={(text) => {
                const val = parseInt(text.replace(/[^0-9]/g, ''), 10);
                updateBaseline('squats', isNaN(val) ? 0 : val);
              }}
            />
          </View>
        </View>

        <View style={styles.sliderGroup}>
          <Text style={styles.label}>Gainage (secondes)</Text>
          <View style={styles.row}>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={300}
              step={5}
              value={baseline.plank}
              onValueChange={(val) => updateBaseline('plank', val)}
              minimumTrackTintColor={colors.primaryBlue}
              maximumTrackTintColor="#D1D5DB"
              thumbTintColor={colors.primaryBlue}
            />
            <TextInput
              style={styles.numberInput}
              keyboardType="numeric"
              value={String(baseline.plank)}
              onChangeText={(text) => {
                const val = parseInt(text.replace(/[^0-9]/g, ''), 10);
                updateBaseline('plank', isNaN(val) ? 0 : val);
              }}
            />
          </View>
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          title="Suivant"
          onPress={goNext}
          style={styles.continueButton}
        />
        <TouchableOpacity style={styles.skipButton} onPress={goNext}>
          <Text style={styles.skipText}>Passer cette étape</Text>
        </TouchableOpacity>
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
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  progressTrack: {
    flex: 1,
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
  stepText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.contentLight,
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
  },
  subtitle: {
    fontSize: 16,
    color: colors.mutedLight,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  sliderGroup: {
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.contentLight,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  numberInput: {
    width: 80,
    height: 48,
    backgroundColor: colors.surfaceLight,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: colors.contentLight,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  continueButton: {
    width: '100%',
    backgroundColor: colors.primaryBlue,
  },
  skipButton: {
    paddingVertical: spacing.sm,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.mutedLight,
  },
});
