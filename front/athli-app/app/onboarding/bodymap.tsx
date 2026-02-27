import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import PrimaryButton from '../../components/ui/PrimaryButton';
import ScreenContainer from '../../components/ui/ScreenContainer';
import colors from '../../constants/colors';
import spacing from '../../constants/spacing';
import { useOnboarding } from '../../context/OnboardingContext';

const ZONES = ['neck', 'shoulders', 'back', 'hips', 'knees', 'ankles'];

export default function BodyMapScreen() {
  const { data, update } = useOnboarding();

  const toggle = (zone: string) => {
    if (data.injuries.includes(zone)) {
      update({ injuries: data.injuries.filter((x) => x !== zone) });
      return;
    }
    update({ injuries: [...data.injuries, zone] });
  };

  return (
    <ScreenContainer>
      <View style={styles.card}>
        <Text style={styles.step}>Etape 3 sur 4</Text>
        <View style={styles.progressTrack}><View style={[styles.progressFill, { width: '75%' }]} /></View>

        <Text style={styles.title}>Douleurs et blessures</Text>
        <Text style={styles.subtitle}>Selectionne les zones sensibles.</Text>

        <View style={styles.rowWrap}>
          {ZONES.map((zone) => (
            <TouchableOpacity key={zone} onPress={() => toggle(zone)} style={[styles.zoneChip, data.injuries.includes(zone) && styles.zoneChipActive]}>
              <Text style={styles.zoneText}>{zone}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <PrimaryButton title="Continuer" onPress={() => router.push('/onboarding/equipment')} style={styles.button} />
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
  subtitle: { color: colors.textMuted },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  zoneChip: { paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#E5E7EB', borderRadius: 20 },
  zoneChipActive: { backgroundColor: '#FECACA' },
  zoneText: { color: colors.text },
  button: { marginTop: spacing.md },
});
