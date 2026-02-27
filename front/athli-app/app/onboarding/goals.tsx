import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import PrimaryButton from '../../components/ui/PrimaryButton';
import ScreenContainer from '../../components/ui/ScreenContainer';
import colors from '../../constants/colors';
import spacing from '../../constants/spacing';
import { useOnboarding } from '../../context/OnboardingContext';

const GOALS = ['weight_loss', 'muscle', 'performance', 'health'];

export default function GoalsScreen() {
  const { data, update } = useOnboarding();

  return (
    <ScreenContainer>
      <View style={styles.card}>
        <Text style={styles.step}>Etape 2 sur 4</Text>
        <View style={styles.progressTrack}><View style={[styles.progressFill, { width: '50%' }]} /></View>

        <Text style={styles.title}>Objectifs</Text>
        <View style={styles.rowWrap}>
          {GOALS.map((goal) => (
            <TouchableOpacity key={goal} onPress={() => update({ goal })} style={[styles.goalChip, data.goal === goal && styles.goalChipActive]}>
              <Text style={styles.goalText}>{goal}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput placeholder="Sport principal (ex: running)" value={data.sport} onChangeText={(sport) => update({ sport })} style={styles.input} />
        <TextInput placeholder="Disponibilite hebdo (1-7)" value={String(data.weekAvailability || '')} onChangeText={(value) => update({ weekAvailability: Number(value) || 0 })} keyboardType="numeric" style={styles.input} />

        <PrimaryButton title="Continuer" onPress={() => router.push('/onboarding/bodymap')} style={styles.button} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.cardBg, borderRadius: 24, padding: spacing.lg, gap: spacing.sm, flex: 1 },
  step: { color: colors.textMuted },
  progressTrack: { height: 4, backgroundColor: '#E5E7EB', borderRadius: 2 },
  progressFill: { height: 4, backgroundColor: colors.success, borderRadius: 2 },
  title: { color: colors.text, fontSize: 22, fontWeight: '700' },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  goalChip: { paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#E5E7EB', borderRadius: 20 },
  goalChipActive: { backgroundColor: '#BBF7D0' },
  goalText: { color: colors.text },
  input: { backgroundColor: '#fff', borderColor: '#E5E7EB', borderWidth: 1, borderRadius: 12, padding: 12 },
  button: { marginTop: spacing.md },
});
