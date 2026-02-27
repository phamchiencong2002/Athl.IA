import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import PrimaryButton from '../../components/ui/PrimaryButton';
import ScreenContainer from '../../components/ui/ScreenContainer';
import colors from '../../constants/colors';
import spacing from '../../constants/spacing';
import { useOnboarding } from '../../context/OnboardingContext';

const EQUIPMENT = ['dumbbells', 'barbell', 'kettlebell', 'bands', 'mat'];
const LOCATIONS = ['home', 'gym', 'outdoor'];

export default function EquipmentScreen() {
  const { data, update } = useOnboarding();

  const toggle = (key: 'equipment' | 'locations', value: string) => {
    const current = data[key];
    if (current.includes(value)) {
      update({ [key]: current.filter((x) => x !== value) } as Partial<typeof data>);
    } else {
      update({ [key]: [...current, value] } as Partial<typeof data>);
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.card}>
        <Text style={styles.step}>Etape 4 sur 4</Text>
        <View style={styles.progressTrack}><View style={[styles.progressFill, { width: '100%' }]} /></View>

        <Text style={styles.title}>Materiel et lieu</Text>
        <Text style={styles.subtitle}>Nous adaptons ton plan selon ton environnement.</Text>

        <Text style={styles.label}>Lieux</Text>
        <View style={styles.rowWrap}>
          {LOCATIONS.map((value) => (
            <TouchableOpacity key={value} onPress={() => toggle('locations', value)} style={[styles.chip, data.locations.includes(value) && styles.chipActive]}>
              <Text>{value}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Equipements</Text>
        <View style={styles.rowWrap}>
          {EQUIPMENT.map((value) => (
            <TouchableOpacity key={value} onPress={() => toggle('equipment', value)} style={[styles.chip, data.equipment.includes(value) && styles.chipActive]}>
              <Text>{value}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <PrimaryButton title="Voir le recap" onPress={() => router.push('/onboarding/summary')} style={styles.button} />
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
  label: { marginTop: spacing.sm, color: colors.text, fontWeight: '700' },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#E5E7EB', borderRadius: 20 },
  chipActive: { backgroundColor: '#BBF7D0' },
  button: { marginTop: spacing.md },
});
