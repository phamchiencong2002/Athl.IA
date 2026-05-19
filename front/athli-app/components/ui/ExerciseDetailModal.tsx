import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import spacing from '../../constants/spacing';
import type { ExerciseItem } from '../../lib/workouts';
import { updateSessionExercises } from '../../lib/workouts';

type Props = {
  visible: boolean;
  sessionId: string;
  exercises: ExerciseItem[];
  sessionName: string;
  onClose: () => void;
  onExercisesUpdated: (exercises: ExerciseItem[]) => void;
};

const EQUIPMENT_ICONS: Record<string, string> = {
  bodyweight: 'accessibility',
  mat: 'crop-square',
  dumbbells: 'fitness-center',
  barbell: 'fitness-center',
  kettlebell: 'fitness-center',
  bands: 'settings-input-composite',
  none: 'remove-circle-outline',
};

function EquipmentBadge({ equipment }: { equipment: string | null }) {
  if (!equipment || equipment === 'none') return null;
  return (
    <View style={styles.equipBadge}>
      <MaterialIcons
        name={(EQUIPMENT_ICONS[equipment] as any) ?? 'sports'}
        size={11}
        color="#64748B"
      />
      <Text style={styles.equipBadgeText}>{equipment}</Text>
    </View>
  );
}

export default function ExerciseDetailModal({
  visible,
  sessionId,
  exercises,
  sessionName,
  onClose,
  onExercisesUpdated,
}: Props) {
  const [localExercises, setLocalExercises] = useState<ExerciseItem[]>(exercises);
  const [saving, setSaving] = useState(false);
  const [modified, setModified] = useState(false);

  // Sync when parent passes new exercises (e.g. initial load)
  React.useEffect(() => {
    setLocalExercises(exercises);
    setModified(false);
  }, [exercises]);

  const removeExercise = (id: string) => {
    setLocalExercises((prev) => prev.filter((ex) => ex.id !== id));
    setModified(true);
  };

  const saveChanges = async () => {
    setSaving(true);
    try {
      await updateSessionExercises(
        sessionId,
        localExercises.map((ex) => ({
          name: ex.name,
          sets: ex.sets,
          reps: ex.reps,
          equipment: ex.equipment,
          muscle_groups: ex.muscle_groups,
          notes: ex.notes,
        })),
      );
      onExercisesUpdated(localExercises);
      setModified(false);
      onClose();
    } catch {
      // Keep modal open so user can retry
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (modified) {
      // Discard changes and reset
      setLocalExercises(exercises);
      setModified(false);
    }
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
            <MaterialIcons name="close" size={22} color="#1E293B" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Exercices</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>{sessionName}</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {localExercises.length === 0 ? (
            <View style={styles.emptyBox}>
              <MaterialIcons name="fitness-center" size={40} color="#CBD5E1" />
              <Text style={styles.emptyText}>Aucun exercice dans cette séance</Text>
            </View>
          ) : (
            localExercises.map((ex, idx) => (
              <View key={ex.id} style={styles.exerciseCard}>
                <View style={styles.cardLeft}>
                  <View style={styles.indexBadge}>
                    <Text style={styles.indexText}>{idx + 1}</Text>
                  </View>
                  <View style={styles.exerciseInfo}>
                    <Text style={styles.exerciseName}>{ex.name}</Text>
                    <View style={styles.metaRow}>
                      {ex.sets != null && ex.reps && (
                        <View style={styles.setsBadge}>
                          <Text style={styles.setsText}>{ex.sets} × {ex.reps}</Text>
                        </View>
                      )}
                      <EquipmentBadge equipment={ex.equipment} />
                    </View>
                    {ex.muscle_groups && (
                      <Text style={styles.muscles}>{ex.muscle_groups}</Text>
                    )}
                    {ex.notes ? (
                      <Text style={styles.exerciseNotes}>{ex.notes}</Text>
                    ) : null}
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => removeExercise(ex.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialIcons name="delete-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))
          )}

          {modified && (
            <View style={styles.modifiedBanner}>
              <MaterialIcons name="edit" size={14} color={colors.primaryBlue} />
              <Text style={styles.modifiedText}>
                {exercises.length - localExercises.length} exercice(s) supprimé(s)
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          {modified ? (
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={saveChanges}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <>
                  <MaterialIcons name="check" size={20} color="#FFF" />
                  <Text style={styles.saveBtnText}>Enregistrer les modifications</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.85}>
              <Text style={styles.doneBtnText}>Fermer</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFF',
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  headerSubtitle: { fontSize: 12, color: '#94A3B8', marginTop: 2, maxWidth: 200 },
  list: { padding: spacing.xl, gap: spacing.lg, paddingBottom: 120 },
  emptyBox: { alignItems: 'center', gap: 12, paddingTop: 48 },
  emptyText: { fontSize: 15, color: '#94A3B8', fontWeight: '600' },
  exerciseCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, flex: 1 },
  indexBadge: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: 'rgba(59,130,246,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  indexText: { fontSize: 13, fontWeight: '800', color: colors.primaryBlue },
  exerciseInfo: { flex: 1, gap: 6 },
  exerciseName: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  setsBadge: {
    backgroundColor: 'rgba(59,130,246,0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  setsText: { fontSize: 12, fontWeight: '700', color: colors.primaryBlue },
  equipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  equipBadgeText: { fontSize: 11, fontWeight: '600', color: '#64748B' },
  muscles: { fontSize: 11, color: '#94A3B8', fontStyle: 'italic' },
  exerciseNotes: { fontSize: 12, color: '#64748B', lineHeight: 18 },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(239,68,68,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  modifiedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(59,130,246,0.06)',
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
  },
  modifiedText: { fontSize: 13, color: colors.primaryBlue, fontWeight: '600' },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.xl,
    paddingBottom: 32,
    paddingTop: 12,
    backgroundColor: 'rgba(248,250,252,0.96)',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.primaryBlue,
    borderRadius: 18,
    height: 56,
    shadowColor: colors.primaryBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  saveBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  doneBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 18,
    height: 56,
  },
  doneBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
});
