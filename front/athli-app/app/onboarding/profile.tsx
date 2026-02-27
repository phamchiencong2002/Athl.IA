import Slider from '@react-native-community/slider';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import PrimaryButton from '../../components/ui/PrimaryButton';
import ScreenContainer from '../../components/ui/ScreenContainer';
import colors from '../../constants/colors';
import spacing from '../../constants/spacing';
import { useOnboarding } from '../../context/OnboardingContext';

export default function ProfileScreen() {
  const { data, update } = useOnboarding();

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.backArrow}>{'<'}</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Creez votre profil</Text>
            <View style={{ width: 24 }} />
          </View>

          <Text style={styles.step}>Etape 1 sur 4</Text>
          <View style={styles.progressTrack}><View style={[styles.progressFill, { width: '25%' }]} /></View>

          <TextInput placeholder="Pseudo" value={data.username} onChangeText={(username) => update({ username })} style={styles.input} />
          <TextInput placeholder="Email" value={data.email} onChangeText={(email) => update({ email })} style={styles.input} autoCapitalize="none" keyboardType="email-address" />
          <TextInput placeholder="Mot de passe" value={data.password} onChangeText={(password) => update({ password })} style={styles.input} secureTextEntry />

          <Text style={styles.label}>Age ({data.age} ans)</Text>
          <TextInput value={data.age} onChangeText={(age) => update({ age })} keyboardType="numeric" style={styles.input} />

          <Text style={styles.label}>Taille ({data.height} cm)</Text>
          <Slider minimumValue={140} maximumValue={210} step={1} value={data.height} onValueChange={(height) => update({ height })} minimumTrackTintColor={colors.success} />

          <Text style={styles.label}>Poids ({data.weight} kg)</Text>
          <Slider minimumValue={40} maximumValue={130} step={1} value={data.weight} onValueChange={(weight) => update({ weight })} minimumTrackTintColor={colors.success} />

          <Text style={styles.label}>Niveau</Text>
          <View style={styles.row}>
            {['beginner', 'intermediate', 'advanced'].map((value) => (
              <TouchableOpacity key={value} style={[styles.chip, data.level === value && styles.chipActive]} onPress={() => update({ level: value as 'beginner' | 'intermediate' | 'advanced' })}>
                <Text style={styles.chipText}>{value}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <PrimaryButton title="Continuer" onPress={() => router.push('/onboarding/goals')} style={styles.button} />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center' },
  card: { backgroundColor: colors.cardBg, borderRadius: 24, padding: spacing.lg, gap: spacing.sm },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  backArrow: { fontSize: 22, color: colors.text },
  title: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: colors.text },
  step: { color: colors.textMuted },
  progressTrack: { height: 4, backgroundColor: '#E5E7EB', borderRadius: 2 },
  progressFill: { height: 4, backgroundColor: colors.success, borderRadius: 2 },
  input: { backgroundColor: '#fff', borderColor: '#E5E7EB', borderWidth: 1, borderRadius: 12, padding: 12 },
  label: { color: colors.text, fontWeight: '600', marginTop: spacing.xs },
  row: { flexDirection: 'row', gap: 8 },
  chip: { flex: 1, borderRadius: 12, padding: 10, backgroundColor: '#F3F4F6', alignItems: 'center' },
  chipActive: { backgroundColor: '#DCFCE7' },
  chipText: { color: colors.text },
  button: { marginTop: spacing.md },
});
