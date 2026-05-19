import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ExerciseItem } from './workouts';
import exercisesData from '../data/exercises.json';

export type LocalUserProfile = {
  goal: string;
  equipment: string[];
  protectedZones: string[];
  movementLimitations: string[];
};

type RawExercise = {
  id: string;
  name: string;
  category: string;
  goal_tags: string[];
  equipment: string;
  muscle_groups: string;
  sets: number;
  reps: string;
  avoids_zones: string[];
  avoids_limitations: string[];
  notes: string;
};

const STORAGE_KEY = 'user_profile_local';
const FOCUS_CYCLE = ['strength', 'cardio', 'mobility', 'core'];

export async function getUserProfile(): Promise<LocalUserProfile | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LocalUserProfile) : null;
  } catch {
    return null;
  }
}

export async function saveUserProfile(profile: LocalUserProfile): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Silently ignore — local fallback is best-effort
  }
}

export async function generateLocalExercises(sessionIndex: number): Promise<ExerciseItem[]> {
  const profile = await getUserProfile();
  const goal = profile?.goal ?? 'fitness';
  const equipment = profile?.equipment?.length ? profile.equipment : ['none'];
  const protectedZones = profile?.protectedZones ?? [];
  const movementLimitations = profile?.movementLimitations ?? [];

  const focus = FOCUS_CYCLE[sessionIndex % FOCUS_CYCLE.length];

  const pool = (exercisesData as RawExercise[]).filter((ex) => {
    if (!ex.goal_tags.includes(goal)) return false;
    if (ex.equipment !== 'none' && !equipment.includes(ex.equipment)) return false;
    if (ex.avoids_zones.some((z) => protectedZones.includes(z))) return false;
    if (ex.avoids_limitations.some((l) => movementLimitations.includes(l))) return false;
    return true;
  });

  const focused = pool.filter((ex) => ex.category === focus);
  const others = pool.filter((ex) => ex.category !== focus);
  const sorted = [...focused, ...others];

  // Always pick at least 4 exercises; fall back to full pool if filtered set is too small
  const source = sorted.length >= 4 ? sorted : (exercisesData as RawExercise[]).slice(0, 8);
  const selected = source.slice(0, 6);

  return selected.map((ex, idx) => ({
    id: ex.id,
    order_index: idx,
    name: ex.name,
    sets: ex.sets,
    reps: ex.reps,
    equipment: ex.equipment !== 'none' ? ex.equipment : null,
    muscle_groups: ex.muscle_groups || null,
    notes: ex.notes || null,
  }));
}
