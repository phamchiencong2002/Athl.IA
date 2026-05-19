import { router } from 'expo-router';
import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import spacing from '../../constants/spacing';
import { useOnboarding } from '../../context/OnboardingContext';

const EQUIPMENT_OPTIONS = [
  {
    id: 'mat',
    label: 'Tapis de sol',
    icon: 'crop-square' as const,
    color: '#10B981',
    bg: 'rgba(16,185,129,0.1)',
    description: 'Yoga, pilates, étirements',
    hasSubOption: false,
  },
  {
    id: 'ab_wheel',
    label: 'Roue abdos',
    icon: 'radio-button-unchecked' as const,
    color: '#8B5CF6',
    bg: 'rgba(139,92,246,0.1)',
    description: 'Gainage avancé',
    hasSubOption: false,
  },
  {
    id: 'bands',
    label: 'Élastiques',
    icon: 'settings-input-composite' as const,
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.1)',
    description: 'Résistance progressive',
    hasSubOption: true,
  },
  {
    id: 'dumbbells',
    label: 'Haltères',
    icon: 'fitness-center' as const,
    color: '#3B82F6',
    bg: 'rgba(59,130,246,0.1)',
    description: 'Musculation libre',
    hasSubOption: false,
  },
  {
    id: 'full_gym',
    label: 'Salle de sport complète',
    icon: 'apartment' as const,
    color: '#EF4444',
    bg: 'rgba(239,68,68,0.1)',
    description: 'Machines, barres, câbles…',
    hasSubOption: false,
  },
];

const BANDS_RESISTANCE = [
  { id: 'light' as const, label: 'Légers', sublabel: '5 – 15 kg' },
  { id: 'medium' as const, label: 'Moyens', sublabel: '15 – 30 kg' },
  { id: 'heavy' as const, label: 'Lourds', sublabel: '30 – 50 kg' },
];

export default function EquipmentScreen() {
  const { data, update } = useOnboarding();

  const isFullGym = data.equipment.includes('full_gym');

  const toggleEquipment = (id: string) => {
    if (id === 'full_gym') {
      if (isFullGym) {
        update({ equipment: [] });
      } else {
        update({ equipment: ['full_gym'], bandsResistance: null });
      }
    } else {
      if (isFullGym) return;
      const current = data.equipment;
      if (current.includes(id)) {
        update({
          equipment: current.filter((x) => x !== id),
          ...(id === 'bands' ? { bandsResistance: null } : {}),
        });
      } else {
        update({ equipment: [...current, id] });
      }
    }
  };

  const setBandsResistance = (res: 'light' | 'medium' | 'heavy') => {
    update({ bandsResistance: data.bandsResistance === res ? null : res });
  };

  const canContinue = data.equipment.length > 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>{"Quel matériel as-tu\nà disposition ?"}</Text>
          <Text style={styles.subtitle}>On adapte chaque séance à ton équipement.</Text>
        </View>

        <View style={styles.optionsList}>
          {EQUIPMENT_OPTIONS.map((opt) => {
            const isSelected = data.equipment.includes(opt.id);
            const isDisabled = isFullGym && opt.id !== 'full_gym';

            return (
              <View key={opt.id}>
                <TouchableOpacity
                  style={[
                    styles.optionCard,
                    isSelected && styles.optionCardSelected,
                    isDisabled && styles.optionCardDisabled,
                  ]}
                  onPress={() => toggleEquipment(opt.id)}
                  activeOpacity={isDisabled ? 1 : 0.75}
                >
                  <View style={[styles.optionIcon, { backgroundColor: isDisabled ? '#F1F5F9' : opt.bg }]}>
                    <MaterialIcons
                      name={opt.icon}
                      size={24}
                      color={isDisabled ? '#CBD5E1' : opt.color}
                    />
                  </View>
                  <View style={styles.optionText}>
                    <Text style={[styles.optionLabel, isDisabled && styles.optionLabelDisabled]}>
                      {opt.label}
                    </Text>
                    <Text style={[styles.optionDesc, isDisabled && styles.optionDescDisabled]}>
                      {opt.id === 'full_gym' && isSelected
                        ? 'Inclut haltères, barre, machines et câbles'
                        : opt.description}
                    </Text>
                  </View>
                  <View style={[
                    styles.optionCheck,
                    isSelected && styles.optionCheckSelected,
                    isDisabled && styles.optionCheckDisabled,
                  ]}>
                    {isSelected && <MaterialIcons name="check" size={14} color="#FFF" />}
                  </View>
                </TouchableOpacity>

                {/* Bands resistance sub-option */}
                {opt.hasSubOption && isSelected && !isFullGym && (
                  <View style={styles.subOptions}>
                    <Text style={styles.subLabel}>Résistance des élastiques</Text>
                    <View style={styles.subPills}>
                      {BANDS_RESISTANCE.map((res) => {
                        const active = data.bandsResistance === res.id;
                        return (
                          <TouchableOpacity
                            key={res.id}
                            style={[styles.resPill, active && styles.resPillActive]}
                            onPress={() => setBandsResistance(res.id)}
                          >
                            <Text style={[styles.resPillLabel, active && styles.resPillLabelActive]}>
                              {res.label}
                            </Text>
                            <Text style={[styles.resPillSub, active && styles.resPillSubActive]}>
                              {res.sublabel}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueBtn, !canContinue && styles.continueBtnDisabled]}
          onPress={() => { if (canContinue) router.push('/onboarding/summary'); }}
          activeOpacity={canContinue ? 0.85 : 1}
        >
          <Text style={styles.continueBtnText}>Continuer</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl * 1.5,
    paddingBottom: 120,
    gap: 28,
  },

  titleBlock: { gap: 8 },
  title: { fontSize: 28, fontWeight: '800', color: '#1E293B', lineHeight: 36 },
  subtitle: { fontSize: 15, color: '#64748B', lineHeight: 22 },

  optionsList: { gap: 12 },

  optionCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 2,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  optionCardSelected: {
    borderColor: colors.primaryBlue,
    backgroundColor: 'rgba(59,130,246,0.02)',
  },
  optionCardDisabled: {
    opacity: 0.38,
    borderColor: '#F1F5F9',
    backgroundColor: '#FAFAFA',
  },

  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  optionText: { flex: 1, gap: 3 },
  optionLabel: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  optionLabelDisabled: { color: '#94A3B8' },
  optionDesc: { fontSize: 12, color: '#64748B', lineHeight: 18 },
  optionDescDisabled: { color: '#CBD5E1' },

  optionCheck: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionCheckSelected: { backgroundColor: colors.primaryBlue, borderColor: colors.primaryBlue },
  optionCheckDisabled: { borderColor: '#F1F5F9' },

  // Bands sub-option
  subOptions: {
    backgroundColor: 'rgba(245,158,11,0.06)',
    borderRadius: 16,
    padding: 14,
    marginTop: 6,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.2)',
  },
  subLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subPills: { flexDirection: 'row', gap: 8 },
  resPill: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  resPillActive: { backgroundColor: colors.primaryBlue, borderColor: colors.primaryBlue },
  resPillLabel: { fontSize: 13, fontWeight: '700', color: '#475569' },
  resPillLabelActive: { color: '#FFF' },
  resPillSub: { fontSize: 10, color: '#94A3B8' },
  resPillSubActive: { color: 'rgba(255,255,255,0.75)' },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.xl,
    paddingBottom: 32,
    paddingTop: 16,
    backgroundColor: 'rgba(248,250,252,0.95)',
  },
  continueBtn: {
    backgroundColor: colors.primaryBlue,
    borderRadius: 20,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primaryBlue,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  continueBtnDisabled: {
    backgroundColor: '#CBD5E1',
    shadowOpacity: 0,
    elevation: 0,
  },
  continueBtnText: { color: '#FFF', fontSize: 17, fontWeight: '800' },
});
