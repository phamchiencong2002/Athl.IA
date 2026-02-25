// app/onboarding/profile.tsx
import Slider from '@react-native-community/slider';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import PrimaryButton from '../../components/ui/PrimaryButton';
import ScreenContainer from '../../components/ui/ScreenContainer';
import colors from '../../constants/colors';
import spacing from '../../constants/spacing';
import { ApiError } from '../../lib/api';
import { login, register } from '../../lib/auth';
import { createUserProfile } from '../../lib/users';

export default function ProfileScreen() {
  const [username, setUsername] = useState('');
  const [mail, setMail] = useState('');
  const [password, setPassword] = useState('');
  const [sex, setSex] = useState<'H' | 'F'>('H');
  const [age, setAge] = useState('28');
  const [height, setHeight] = useState(175);
  const [weight, setWeight] = useState(72);
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>(
    'intermediate',
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getBirthdateFromAge = () => {
    const numericAge = Number(age);
    if (!Number.isFinite(numericAge) || numericAge <= 0) return undefined;
    const birthdate = new Date();
    birthdate.setFullYear(birthdate.getFullYear() - numericAge);
    birthdate.setHours(0, 0, 0, 0);
    return birthdate.toISOString();
  };

  const handleContinue = async () => {
    if (!username.trim() || !mail.trim() || !password.trim()) {
      setError('Renseigne email, mot de passe et pseudo.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const auth = await register({ username, mail, password }).catch(async (err) => {
        if (err instanceof ApiError && err.status === 409) {
          return login({ mail, password });
        }
        throw err;
      });

      await createUserProfile(auth.token, {
        id_account: auth.account.id,
        gender: sex,
        birthdate: getBirthdateFromAge(),
        height_cm: height,
        weight_kg: weight,
        training_experience: level,
      });

      Alert.alert(
        'Profil sauvegardé',
        'Votre compte et votre profil sont créés.',
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Une erreur est survenue.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.wrapper}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <View style={styles.headerRow}>
              <TouchableOpacity onPress={() => router.back()}>
                <Text style={styles.backArrow}>{'‹'}</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Créez votre profil</Text>
              <View style={{ width: 24 }} />
            </View>

            <Text style={styles.stepText}>Étape 1 sur 4</Text>
            <View style={styles.progressBarBg}>
              <View style={styles.progressBarFill} />
            </View>

            <Text style={styles.description}>
              Ces informations nous aident à personnaliser vos entraînements.
            </Text>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Compte</Text>
              <TextInput
                placeholder="Pseudo"
                value={username}
                onChangeText={setUsername}
                style={styles.textInput}
                autoCapitalize="none"
              />
              <TextInput
                placeholder="Email"
                value={mail}
                onChangeText={setMail}
                style={[styles.textInput, styles.mtSmall]}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <TextInput
                placeholder="Mot de passe"
                value={password}
                onChangeText={setPassword}
                style={[styles.textInput, styles.mtSmall]}
                secureTextEntry
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Sexe</Text>
              <View style={styles.toggleRow}>
                <ToggleChip
                  label="Homme"
                  active={sex === 'H'}
                  onPress={() => setSex('H')}
                />
                <ToggleChip
                  label="Femme"
                  active={sex === 'F'}
                  onPress={() => setSex('F')}
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Âge</Text>
              <View style={styles.inlineBox}>
                <TextInput
                  value={age}
                  onChangeText={setAge}
                  keyboardType="numeric"
                  style={styles.numberInput}
                />
                <Text style={styles.unitText}>ans</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Taille</Text>
              <View style={styles.sliderRow}>
                <Slider
                  minimumValue={140}
                  maximumValue={210}
                  step={1}
                  value={height}
                  onValueChange={setHeight}
                  minimumTrackTintColor={colors.success}
                  maximumTrackTintColor="#E5E7EB"
                  thumbTintColor={colors.success}
                />
                <View style={styles.sliderValueRow}>
                  <Text style={styles.sliderValueText}>{height}</Text>
                  <Text style={styles.unitText}>cm</Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Poids</Text>
              <View style={styles.sliderRow}>
                <Slider
                  minimumValue={40}
                  maximumValue={130}
                  step={1}
                  value={weight}
                  onValueChange={setWeight}
                  minimumTrackTintColor={colors.success}
                  maximumTrackTintColor="#E5E7EB"
                  thumbTintColor={colors.success}
                />
                <View style={styles.sliderValueRow}>
                  <Text style={styles.sliderValueText}>{weight}</Text>
                  <Text style={styles.unitText}>kg</Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Votre niveau actuel</Text>
              <View style={styles.levelRow}>
                <LevelCard
                  label="Débutant"
                  active={level === 'beginner'}
                  onPress={() => setLevel('beginner')}
                />
                <LevelCard
                  label="Intermédiaire"
                  active={level === 'intermediate'}
                  onPress={() => setLevel('intermediate')}
                />
                <LevelCard
                  label="Avancé"
                  active={level === 'advanced'}
                  onPress={() => setLevel('advanced')}
                />
              </View>
            </View>

            <PrimaryButton
              title="Continuer"
              onPress={handleContinue}
              loading={loading}
              disabled={loading}
              style={styles.continueButton}
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}

interface ToggleChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

function ToggleChip({ label, active, onPress }: ToggleChipProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.toggleChip, active && styles.toggleChipActive]}
    >
      <Text
        style={[
          styles.toggleChipText,
          active && styles.toggleChipTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

interface LevelCardProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

function LevelCard({ label, active, onPress }: LevelCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.levelCard, active && styles.levelCardActive]}
    >
      <Text
        style={[
          styles.levelLabel,
          active && styles.levelLabelActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: 24,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 480,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  backArrow: {
    fontSize: 22,
    color: colors.text,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  stepText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  progressBarBg: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  progressBarFill: {
    height: 4,
    width: '25%',
    borderRadius: 2,
    backgroundColor: colors.success,
  },
  description: {
    color: colors.textMuted,
    marginBottom: spacing.lg,
    fontSize: 14,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  toggleRow: {
    flexDirection: 'row',
    columnGap: 8,
  },
  toggleChip: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  toggleChipActive: {
    backgroundColor: '#DBEAFE',
    borderColor: colors.primary,
  },
  toggleChipText: {
    color: colors.textMuted,
    fontWeight: '500',
  },
  toggleChipTextActive: {
    color: colors.primaryDark,
  },
  inlineBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  numberInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  unitText: {
    color: colors.textMuted,
    marginLeft: spacing.xs,
  },
  sliderRow: {
    marginTop: spacing.sm,
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontSize: 16,
  },
  mtSmall: {
    marginTop: spacing.xs,
  },
  sliderValueRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.xs,
  },
  sliderValueText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginRight: 4,
  },
  levelRow: {
    flexDirection: 'row',
    columnGap: 8,
  },
  levelCard: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  levelCardActive: {
    backgroundColor: '#DCFCE7',
    borderColor: colors.success,
  },
  levelLabel: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '500',
  },
  levelLabelActive: {
    color: '#15803D',
    fontWeight: '600',
  },
  continueButton: {
    marginTop: spacing.lg,
  },
  errorText: {
    marginTop: spacing.sm,
    color: '#DC2626',
    textAlign: 'center',
  },
});
