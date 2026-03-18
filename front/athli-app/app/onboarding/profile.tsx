import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ScrollView, View, SafeAreaView, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import PrimaryButton from '../../components/ui/PrimaryButton';
import colors from '../../constants/colors';
import spacing from '../../constants/spacing';
import { useOnboarding } from '../../context/OnboardingContext';

export default function ProfileScreen() {
  const { data, update } = useOnboarding();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
            <MaterialIcons name="arrow-back" size={24} color={colors.contentLight} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Tes informations</Text>
            <Text style={styles.headerSubtitle}>Étape 2/3</Text>
          </View>
          <View style={styles.iconButton} />
        </View>
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: '66%' }]} />
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        <View style={styles.grid2Col}>
          {/* Age */}
          <View style={styles.gridItem}>
            <Text style={styles.label}>Âge</Text>
            <View style={styles.ageBox}>
              <MaterialIcons name="cake" size={24} color="#7C3AED" />
              <View style={styles.ageInputWrapper}>
                <TextInput
                  value={data.age}
                  onChangeText={(text) => update({ age: text.replace(/[^0-9]/g, '') })}
                  keyboardType="numeric"
                  style={styles.ageInput}
                  maxLength={3}
                  placeholder="28"
                  placeholderTextColor={colors.mutedLight}
                />
                <Text style={styles.ageUnit}>ans</Text>
              </View>
            </View>
          </View>

          {/* Sexe */}
          <View style={styles.gridItem}>
            <Text style={styles.label}>Sexe</Text>
            <View style={styles.sexContainer}>
              <TouchableOpacity
                style={[styles.sexButton, data.sex === 'H' ? styles.sexButtonActive : styles.sexButtonInactive]}
                onPress={() => update({ sex: 'H' })}
                activeOpacity={0.8}
              >
                <MaterialIcons name="male" size={24} color={data.sex === 'H' ? '#FFF' : colors.mutedLight} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sexButton, data.sex === 'F' ? styles.sexButtonActive : styles.sexButtonInactive]}
                onPress={() => update({ sex: 'F' })}
                activeOpacity={0.8}
              >
                <MaterialIcons name="female" size={24} color={data.sex === 'F' ? '#FFF' : colors.mutedLight} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Taille */}
        <View style={styles.sliderSection}>
          <View style={styles.sliderHeader}>
            <Text style={styles.label}>Taille</Text>
            <Text style={styles.sliderValue}>
              {data.height} <Text style={styles.sliderUnit}>cm</Text>
            </Text>
          </View>
          <View style={styles.sliderBox}>
            <Slider
              style={styles.slider}
              minimumValue={140}
              maximumValue={220}
              step={1}
              value={data.height}
              onValueChange={(val) => update({ height: val })}
              minimumTrackTintColor={colors.primaryBlue}
              maximumTrackTintColor="#D1D5DB"
              thumbTintColor={colors.primaryBlue}
            />
          </View>
        </View>

        {/* Poids */}
        <View style={styles.sliderSection}>
          <View style={styles.sliderHeader}>
            <Text style={styles.label}>Poids</Text>
            <Text style={styles.sliderValue}>
              {data.weight} <Text style={styles.sliderUnit}>kg</Text>
            </Text>
          </View>
          <View style={styles.sliderBox}>
            <Slider
              style={styles.slider}
              minimumValue={40}
              maximumValue={150}
              step={1}
              value={data.weight}
              onValueChange={(val) => update({ weight: val })}
              minimumTrackTintColor={colors.primaryBlue}
              maximumTrackTintColor="#D1D5DB"
              thumbTintColor={colors.primaryBlue}
            />
          </View>
        </View>

        {/* Niveau sportif */}
        <View style={styles.levelSection}>
          <Text style={styles.label}>Niveau sportif</Text>
          <View style={styles.levelGrid}>
            <TouchableOpacity
              style={[styles.levelCard, data.level === 'beginner' && styles.levelCardActive]}
              onPress={() => update({ level: 'beginner' })}
              activeOpacity={0.8}
            >
              <Text style={styles.levelEmoji}>🐢</Text>
              <Text style={[styles.levelText, data.level === 'beginner' && styles.levelTextActive]}>Débutant</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.levelCard, data.level === 'intermediate' && styles.levelCardActive]}
              onPress={() => update({ level: 'intermediate' })}
              activeOpacity={0.8}
            >
              <Text style={styles.levelEmoji}>🏃</Text>
              <Text style={[styles.levelText, data.level === 'intermediate' && styles.levelTextActive]}>Intermédiaire</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.levelCard, data.level === 'advanced' && styles.levelCardActive]}
              onPress={() => update({ level: 'advanced' })}
              activeOpacity={0.8}
            >
              <Text style={styles.levelEmoji}>⚡️</Text>
              <Text style={[styles.levelText, data.level === 'advanced' && styles.levelTextActive]}>Avancé</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          title="Continuer"
          onPress={() => router.push('/onboarding/goals')}
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
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerTextContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.contentLight,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.mutedLight,
    marginTop: 2,
  },
  progressContainer: {
    width: '100%',
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
    gap: spacing.xl,
  },
  grid2Col: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  gridItem: {
    flex: 1,
    gap: spacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.contentLight,
  },
  ageBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    height: 60,
  },
  ageInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
  },
  ageInput: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.contentLight,
    textAlign: 'center',
    marginRight: 4,
    width: 36,
    height: 30,
    padding: 0,
  },
  ageUnit: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.contentLight,
  },
  sexContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    height: 60,
  },
  sexButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
  },
  sexButtonActive: {
    backgroundColor: colors.primaryBlue,
    borderColor: colors.primaryBlue,
  },
  sexButtonInactive: {
    backgroundColor: colors.surfaceLight,
    borderColor: colors.border,
  },
  sliderSection: {
    gap: spacing.sm,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  sliderValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primaryBlue,
  },
  sliderUnit: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.contentLight,
  },
  sliderBox: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  levelSection: {
    gap: spacing.sm,
  },
  levelGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  levelCard: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  levelCardActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: colors.primaryBlue,
    borderWidth: 2,
  },
  levelEmoji: {
    fontSize: 24,
  },
  levelText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.contentLight,
  },
  levelTextActive: {
    color: colors.primaryBlue,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  continueButton: {
    backgroundColor: colors.primaryBlue,
    shadowColor: colors.primaryBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
});
