import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import colors from '../constants/colors';
import spacing from '../constants/spacing';
import { useAuth } from '../context/AuthContext';
import ExerciseDetailModal from '../components/ui/ExerciseDetailModal';
import {
  completeSession,
  getNextSession,
  getSessionById,
  getTodaySession,
  type ExerciseItem,
  type Session,
} from '../lib/workouts';
import { generateLocalExercises } from '../lib/localSessionService';

function useElapsedTimer(running: boolean) {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function IntensityDot({ value, max = 10 }: { value: number; max?: number }) {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: max }).map((_, i) => (
        <View key={i} style={[styles.dot, i < value && styles.dotFilled]} />
      ))}
    </View>
  );
}

function ExerciseCard({
  exercise,
  index,
  isDone,
  onToggle,
}: {
  exercise: ExerciseItem;
  index: number;
  isDone: boolean;
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.exerciseCard, isDone && styles.exerciseCardDone]}
      onPress={onToggle}
      activeOpacity={0.75}
    >
      <View style={styles.exerciseCardLeft}>
        <View style={[styles.exerciseIndex, isDone && styles.exerciseIndexDone]}>
          {isDone
            ? <MaterialIcons name="check" size={13} color="#FFF" />
            : <Text style={styles.exerciseIndexText}>{index + 1}</Text>
          }
        </View>
        <View style={styles.exerciseContent}>
          <Text style={[styles.exerciseName, isDone && styles.exerciseNameDone]}>
            {exercise.name}
          </Text>
          <View style={styles.exerciseMeta}>
            {exercise.sets != null && exercise.reps && (
              <View style={styles.setsBadge}>
                <Text style={styles.setsText}>{exercise.sets} × {exercise.reps}</Text>
              </View>
            )}
            {exercise.equipment && exercise.equipment !== 'none' && (
              <View style={styles.equipBadge}>
                <Text style={styles.equipText}>{exercise.equipment}</Text>
              </View>
            )}
          </View>
          {exercise.muscle_groups && (
            <Text style={styles.exerciseMuscles}>{exercise.muscle_groups}</Text>
          )}
        </View>
      </View>
      <MaterialIcons
        name={isDone ? 'check-circle' : 'radio-button-unchecked'}
        size={22}
        color={isDone ? '#10B981' : '#CBD5E1'}
      />
    </TouchableOpacity>
  );
}

export default function TodayScreen() {
  const { accountId, token } = useAuth();
  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();

  const [session, setSession] = useState<Session | null>(null);
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [nextSession, setNextSession] = useState<Session | null>(null);
  const [loadState, setLoadState] = useState<'loading' | 'no_session' | 'rest_day' | 'ready' | 'error'>('loading');
  const [started, setStarted] = useState(false);
  const [rpe, setRpe] = useState('7');
  const [notes, setNotes] = useState('');
  const [showFinish, setShowFinish] = useState(false);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());

  const toggleDone = useCallback((id: string) => {
    setDoneIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const timer = useElapsedTimer(started);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!accountId) return;
    setLoadState('loading');

    const load = sessionId
      ? getSessionById(sessionId)
      : getTodaySession(accountId);

    load
      .then(async (s) => {
        console.log('[TODAY] SESSION REÇUE:', JSON.stringify(s, null, 2));
        console.log('[TODAY] EXERCICES:', s.exercises);
        console.log('[TODAY] NB EXERCICES:', s.exercises?.length ?? 0);
        setSession(s);

        if (s.exercises && s.exercises.length > 0) {
          setExercises(s.exercises);
        } else {
          console.log('[TODAY] Exercices vides — génération locale');
          const dayIndex = new Date(s.session_date).getDay();
          const local = await generateLocalExercises(dayIndex);
          setExercises(local);
        }

        setLoadState('ready');
      })
      .catch((err) => {
        console.log('[TODAY] ERREUR fetch session:', err?.status, err?.message);

        if (err?.status === 404 && !sessionId) {
          // Today is a rest day — fetch next upcoming session for context
          setLoadState('rest_day');
          getNextSession(accountId)
            .then(setNextSession)
            .catch(() => setNextSession(null));
        } else if (err?.status === 404) {
          setLoadState('no_session');
        } else {
          setLoadState('error');
        }
      });
  }, [accountId, sessionId]);

  useEffect(() => {
    if (!started || !session) return;
    const totalSecs = session.planned_duration_min * 60;
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: totalSecs * 1000,
      useNativeDriver: false,
    }).start();
  }, [started, session]);

  const handleStart = () => setStarted(true);

  const handleFinish = async () => {
    if (!token || !session) return;
    await completeSession(token, session.id, { rpe_reported: Number(rpe) || 7, notes });
    router.replace('/feedback?fromSession=1');
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loadState === 'loading') {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <Text style={styles.emptySubtitle}>Chargement…</Text>
      </SafeAreaView>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (loadState === 'error') {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <MaterialIcons name="wifi-off" size={56} color="#CBD5E1" />
        <Text style={styles.emptyTitle}>Connexion impossible</Text>
        <Text style={styles.emptySubtitle}>Vérifie ta connexion et réessaie.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Retour</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ── No session found (by ID) ──────────────────────────────────────────────
  if (loadState === 'no_session') {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <MaterialIcons name="search-off" size={56} color="#CBD5E1" />
        <Text style={styles.emptyTitle}>Séance introuvable</Text>
        <Text style={styles.emptySubtitle}>Cette séance n'existe plus.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Retour</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ── Rest day ─────────────────────────────────────────────────────────────
  if (loadState === 'rest_day') {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <View style={styles.restDayIcon}>
          <MaterialIcons name="bedtime" size={48} color={colors.primaryBlue} />
        </View>
        <Text style={styles.emptyTitle}>Jour de repos</Text>
        <Text style={styles.emptySubtitle}>
          Profites-en pour récupérer, t'hydrater et dormir suffisamment.
        </Text>
        {nextSession && (
          <View style={styles.nextSessionBox}>
            <Text style={styles.nextSessionLabel}>Prochaine séance</Text>
            <Text style={styles.nextSessionName}>{nextSession.name}</Text>
            <Text style={styles.nextSessionDate}>{nextSession.session_date}</Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.seeWeekBtn}
          onPress={() => router.push('/workouts')}
          activeOpacity={0.85}
        >
          <MaterialIcons name="calendar-today" size={18} color="#FFF" />
          <Text style={styles.seeWeekBtnText}>Voir le planning</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: '#F1F5F9' }]} onPress={() => router.back()}>
          <Text style={[styles.backBtnText, { color: '#64748B' }]}>Retour</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!session) return null;

  // ── Pre-start view ────────────────────────────────────────────────────────
  if (!started) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
            <MaterialIcons name="arrow-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Séance</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.preStartContent} showsVerticalScrollIndicator={false}>
          {/* Session card */}
          <View style={styles.sessionHero}>
            <View style={styles.sessionHeroTopRow}>
              <Text style={styles.sessionName}>{session.name}</Text>
              <View style={[styles.statusPill, session.status === 'done' && styles.statusPillDone]}>
                <Text style={styles.statusPillText}>
                  {session.status === 'done' ? 'Terminée' : 'Planifiée'}
                </Text>
              </View>
            </View>

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <MaterialIcons name="schedule" size={18} color="#64748B" />
                <Text style={styles.metaText}>{session.planned_duration_min} min</Text>
              </View>
              <View style={styles.metaItem}>
                <MaterialIcons name="calendar-today" size={18} color="#64748B" />
                <Text style={styles.metaText}>{session.session_date}</Text>
              </View>
            </View>

            <View style={styles.intensitySection}>
              <Text style={styles.intensityLabel}>Intensité planifiée</Text>
              <IntensityDot value={session.planned_intensity} />
            </View>

            {session.adjusted_intensity !== session.planned_intensity && (
              <View style={styles.intensitySection}>
                <Text style={[styles.intensityLabel, { color: '#F59E0B' }]}>
                  Intensité ajustée (readiness)
                </Text>
                <IntensityDot value={session.adjusted_intensity} />
              </View>
            )}

            {session.notes ? (
              <View style={styles.notesBox}>
                <MaterialIcons name="info-outline" size={16} color="#64748B" />
                <Text style={styles.notesText}>{session.notes}</Text>
              </View>
            ) : null}
          </View>

          {/* Exercises section */}
          {exercises.length > 0 && (
            <View style={styles.exercisesSection}>
              <View style={styles.exercisesSectionHeader}>
                <Text style={styles.exercisesSectionTitle}>
                  {exercises.length} exercice{exercises.length > 1 ? 's' : ''}
                  {doneIds.size > 0 ? `  ·  ${doneIds.size} fait${doneIds.size > 1 ? 's' : ''}` : ''}
                </Text>
                <TouchableOpacity
                  style={styles.editExercisesBtn}
                  onPress={() => setShowExerciseModal(true)}
                >
                  <MaterialIcons name="edit" size={14} color={colors.primaryBlue} />
                  <Text style={styles.editExercisesBtnText}>Modifier</Text>
                </TouchableOpacity>
              </View>
              {exercises.map((ex, idx) => (
                <ExerciseCard
                  key={ex.id}
                  exercise={ex}
                  index={idx}
                  isDone={doneIds.has(ex.id)}
                  onToggle={() => toggleDone(ex.id)}
                />
              ))}
            </View>
          )}

          {exercises.length === 0 && (
            <TouchableOpacity
              style={styles.addExercisesBtn}
              onPress={() => setShowExerciseModal(true)}
            >
              <MaterialIcons name="add-circle-outline" size={20} color={colors.primaryBlue} />
              <Text style={styles.addExercisesBtnText}>Voir / modifier les exercices</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.startButton} onPress={handleStart} activeOpacity={0.85}>
            <MaterialIcons name="play-arrow" size={28} color="#FFF" />
            <Text style={styles.startButtonText}>Démarrer la séance</Text>
          </TouchableOpacity>
        </View>

        <ExerciseDetailModal
          visible={showExerciseModal}
          sessionId={session.id}
          sessionName={session.name}
          exercises={exercises}
          onClose={() => setShowExerciseModal(false)}
          onExercisesUpdated={setExercises}
        />
      </SafeAreaView>
    );
  }

  // ── Active session view ───────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.activeHeader}>
        <View style={styles.timerPill}>
          <MaterialIcons name="timer" size={16} color={colors.primaryBlue} />
          <Text style={styles.timerText}>{timer}</Text>
        </View>
        <Text style={styles.activeSessionName} numberOfLines={1}>{session.name}</Text>
        <View style={{ width: 72 }} />
      </View>

      <View style={styles.progressBarBg}>
        <Animated.View
          style={[
            styles.progressBarFill,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>

      <ScrollView contentContainerStyle={styles.activeContent} showsVerticalScrollIndicator={false}>
        <View style={styles.activeIntensityRow}>
          <View style={styles.intensityRing}>
            <Text style={styles.intensityRingNumber}>{session.adjusted_intensity}</Text>
            <Text style={styles.intensityRingLabel}>/ 10</Text>
          </View>
          <View>
            <Text style={styles.activeIntensityTitle}>Intensité de séance</Text>
            <IntensityDot value={session.adjusted_intensity} />
          </View>
        </View>

        {/* Exercise list during session */}
        {exercises.length > 0 && (
          <View style={styles.activeExercisesBox}>
            <View style={styles.activeExercisesHeader}>
              <Text style={styles.activeExercisesTitle}>Exercices</Text>
              <Text style={styles.activeExercisesProgress}>
                {doneIds.size}/{exercises.length}
              </Text>
            </View>
            {exercises.map((ex, idx) => {
              const done = doneIds.has(ex.id);
              return (
                <TouchableOpacity
                  key={ex.id}
                  style={[styles.activeExerciseRow, done && styles.activeExerciseRowDone]}
                  onPress={() => toggleDone(ex.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.activeExerciseNum, done && styles.activeExerciseNumDone]}>
                    {done
                      ? <MaterialIcons name="check" size={13} color="#FFF" />
                      : <Text style={styles.activeExerciseNumText}>{idx + 1}</Text>
                    }
                  </View>
                  <View style={styles.activeExerciseInfo}>
                    <Text style={[styles.activeExerciseName, done && styles.activeExerciseNameDone]}>
                      {ex.name}
                    </Text>
                    {ex.sets != null && ex.reps && (
                      <Text style={styles.activeExerciseMeta}>{ex.sets} × {ex.reps}</Text>
                    )}
                  </View>
                  <MaterialIcons
                    name={done ? 'check-circle' : 'radio-button-unchecked'}
                    size={20}
                    color={done ? '#10B981' : '#CBD5E1'}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {session.notes ? (
          <View style={styles.activeNotesBox}>
            <Text style={styles.activeNotesLabel}>Consignes</Text>
            <Text style={styles.activeNotesText}>{session.notes}</Text>
          </View>
        ) : null}

        {showFinish ? (
          <View style={styles.finishPanel}>
            <Text style={styles.finishTitle}>Bilan de séance</Text>
            <Text style={styles.finishSubtitle}>RPE ressenti (1 = très facile · 10 = épuisant)</Text>
            <View style={styles.rpeRow}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => (
                <TouchableOpacity
                  key={v}
                  style={[styles.rpeChip, Number(rpe) === v && styles.rpeChipActive]}
                  onPress={() => setRpe(String(v))}
                >
                  <Text style={[styles.rpeChipText, Number(rpe) === v && styles.rpeChipTextActive]}>
                    {v}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Notes libres (optionnel)"
              placeholderTextColor="#94A3B8"
              multiline
            />
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        {!showFinish ? (
          <TouchableOpacity
            style={styles.finishButton}
            onPress={() => setShowFinish(true)}
            activeOpacity={0.85}
          >
            <MaterialIcons name="flag" size={22} color="#FFF" />
            <Text style={styles.finishButtonText}>Terminer la séance</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.startButton} onPress={handleFinish} activeOpacity={0.85}>
            <MaterialIcons name="check" size={22} color="#FFF" />
            <Text style={styles.startButtonText}>Valider et continuer</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },

  // Empty / special states
  emptyContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    padding: spacing.xl,
  },
  restDayIcon: {
    width: 96,
    height: 96,
    borderRadius: 32,
    backgroundColor: 'rgba(59,130,246,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: '#1E293B' },
  emptySubtitle: { fontSize: 15, color: '#64748B', textAlign: 'center', lineHeight: 22 },
  nextSessionBox: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 4,
    width: '100%',
    maxWidth: 320,
  },
  nextSessionLabel: { fontSize: 11, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 },
  nextSessionName: { fontSize: 16, fontWeight: '800', color: '#1E293B', textAlign: 'center' },
  nextSessionDate: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  seeWeekBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primaryBlue,
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 14,
    width: '100%',
    maxWidth: 320,
  },
  seeWeekBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  backBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.primaryBlue,
    borderRadius: 16,
  },
  backBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  backIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#1E293B' },

  // Pre-start content
  preStartContent: { paddingHorizontal: spacing.xl, paddingBottom: 120, gap: 20 },
  sessionHero: {
    backgroundColor: '#FFF',
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    gap: 20,
  },
  sessionHeroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  sessionName: { flex: 1, fontSize: 22, fontWeight: '800', color: '#1E293B', lineHeight: 28 },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(59,130,246,0.1)',
  },
  statusPillDone: { backgroundColor: 'rgba(16,185,129,0.1)' },
  statusPillText: { fontSize: 12, fontWeight: '700', color: colors.primaryBlue },
  metaRow: { flexDirection: 'row', gap: 20 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  intensitySection: { gap: 8 },
  intensityLabel: { fontSize: 13, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5 },
  dotsRow: { flexDirection: 'row', gap: 6 },
  dot: { width: 20, height: 8, borderRadius: 4, backgroundColor: '#E2E8F0' },
  dotFilled: { backgroundColor: colors.primaryBlue },
  notesBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
  },
  notesText: { flex: 1, fontSize: 14, color: '#475569', lineHeight: 20 },

  // Exercises section (pre-start)
  exercisesSection: { gap: 10 },
  exercisesSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exercisesSectionTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  editExercisesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(59,130,246,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  editExercisesBtnText: { fontSize: 12, fontWeight: '700', color: colors.primaryBlue },
  exerciseCard: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  exerciseCardLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, flex: 1 },
  exerciseIndex: {
    width: 26,
    height: 26,
    borderRadius: 9,
    backgroundColor: 'rgba(59,130,246,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  exerciseIndexText: { fontSize: 12, fontWeight: '800', color: colors.primaryBlue },
  exerciseContent: { flex: 1, gap: 6 },
  exerciseName: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  exerciseMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  setsBadge: {
    backgroundColor: 'rgba(59,130,246,0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
  },
  setsText: { fontSize: 11, fontWeight: '700', color: colors.primaryBlue },
  equipBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
  },
  equipText: { fontSize: 11, fontWeight: '600', color: '#64748B' },
  exerciseMuscles: { fontSize: 11, color: '#94A3B8', fontStyle: 'italic' },
  addExercisesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(59,130,246,0.06)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.15)',
    borderStyle: 'dashed',
  },
  addExercisesBtnText: { fontSize: 14, fontWeight: '700', color: colors.primaryBlue },

  // Active header
  activeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(59,130,246,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    minWidth: 72,
  },
  timerText: { fontSize: 15, fontWeight: '800', color: colors.primaryBlue, fontVariant: ['tabular-nums'] },
  activeSessionName: { flex: 1, textAlign: 'center', fontSize: 15, fontWeight: '700', color: '#1E293B', paddingHorizontal: 8 },
  progressBarBg: { height: 4, backgroundColor: '#E2E8F0', marginHorizontal: spacing.xl, borderRadius: 2 },
  progressBarFill: { height: '100%', backgroundColor: colors.primaryBlue, borderRadius: 2 },
  activeContent: { paddingHorizontal: spacing.xl, paddingTop: 24, paddingBottom: 120, gap: 20 },
  activeIntensityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  intensityRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: colors.primaryBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  intensityRingNumber: { fontSize: 26, fontWeight: '900', color: '#1E293B' },
  intensityRingLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
  activeIntensityTitle: { fontSize: 13, fontWeight: '700', color: '#64748B', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },

  // Exercises during active session
  activeExercisesBox: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 12,
  },
  activeExercisesTitle: { fontSize: 13, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 },
  activeExerciseRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  activeExerciseNum: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: 'rgba(59,130,246,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeExerciseNumText: { fontSize: 11, fontWeight: '800', color: colors.primaryBlue },
  activeExerciseInfo: { flex: 1 },
  activeExerciseName: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  activeExerciseMeta: { fontSize: 12, color: '#94A3B8', fontWeight: '600', marginTop: 2 },

  activeNotesBox: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 6,
  },
  activeNotesLabel: { fontSize: 12, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 },
  activeNotesText: { fontSize: 14, color: '#475569', lineHeight: 22 },

  // Finish panel
  finishPanel: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 16,
  },
  finishTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  finishSubtitle: { fontSize: 13, color: '#64748B' },
  rpeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  rpeChip: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rpeChipActive: { backgroundColor: colors.primaryBlue },
  rpeChipText: { fontSize: 15, fontWeight: '700', color: '#64748B' },
  rpeChipTextActive: { color: '#FFF' },
  notesInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 14,
    fontSize: 14,
    color: '#1E293B',
    minHeight: 80,
    textAlignVertical: 'top',
  },

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
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: colors.primaryBlue,
    borderRadius: 20,
    height: 64,
    shadowColor: colors.primaryBlue,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  startButtonText: { color: '#FFF', fontSize: 17, fontWeight: '800' },
  finishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#1E293B',
    borderRadius: 20,
    height: 64,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  finishButtonText: { color: '#FFF', fontSize: 17, fontWeight: '800' },

  // ExerciseCard done state
  exerciseCardDone: {
    backgroundColor: 'rgba(16,185,129,0.04)',
    borderColor: 'rgba(16,185,129,0.2)',
  },
  exerciseIndexDone: { backgroundColor: '#10B981' },
  exerciseNameDone: { color: '#94A3B8', textDecorationLine: 'line-through' },

  // Active exercises header + progress
  activeExercisesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activeExercisesProgress: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primaryBlue,
  },

  // Active exercise done state
  activeExerciseRowDone: { opacity: 0.55 },
  activeExerciseNumDone: { backgroundColor: '#10B981' },
  activeExerciseNameDone: { color: '#94A3B8', textDecorationLine: 'line-through' },
});
