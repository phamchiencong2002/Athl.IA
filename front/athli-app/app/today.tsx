import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
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

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseRepsMax(repsStr: string | null): number {
  if (!repsStr) return 10;
  const range = repsStr.match(/(\d+)-(\d+)/);
  if (range) return parseInt(range[2], 10);
  const single = repsStr.match(/(\d+)/);
  return single ? parseInt(single[1], 10) : 10;
}

function inferCategory(ex: ExerciseItem): 'strength' | 'cardio' | 'mobility' | 'core' {
  const mg = (ex.muscle_groups ?? '').toLowerCase();
  const name = ex.name.toLowerCase();
  if (mg.includes('core') || mg.includes('abs') || name.includes('gainage') || name.includes('planche') || name.includes('abdos')) return 'core';
  if (name.includes('yoga') || name.includes('étire') || name.includes('mobilité') || name.includes('souplesse')) return 'mobility';
  if (mg.includes('full_body') || name.includes('burpee') || name.includes('jumping') || name.includes('saut') || name.includes('corde') || name.includes('mountain')) return 'cardio';
  return 'strength';
}

const CAT_COLOR: Record<string, string> = {
  strength: '#3B82F6',
  cardio: '#F97316',
  mobility: '#10B981',
  core: '#8B5CF6',
};
const CAT_LABEL: Record<string, string> = {
  strength: 'Force',
  cardio: 'Cardio',
  mobility: 'Mobilité',
  core: 'Core',
};

const EMPTY_SET: Set<number> = new Set();

// ── Timer hook ────────────────────────────────────────────────────────────────

function useElapsedTimer(running: boolean) {
  const [elapsed, setElapsed] = useState(0);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (running) {
      ref.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    } else if (ref.current) {
      clearInterval(ref.current);
    }
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [running]);
  const m = Math.floor(elapsed / 60);
  const s = elapsed % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function IntensityDot({ value, max = 10 }: { value: number; max?: number }) {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: max }).map((_, i) => (
        <View key={i} style={[styles.dot, i < value && styles.dotFilled]} />
      ))}
    </View>
  );
}

// ── Pre-start exercise card ───────────────────────────────────────────────────

function PreStartExerciseCard({ exercise, index }: { exercise: ExerciseItem; index: number }) {
  const cat = inferCategory(exercise);
  const color = CAT_COLOR[cat];
  return (
    <View style={styles.preCard}>
      <View style={[styles.preCardBullet, { backgroundColor: color + '20' }]}>
        <Text style={[styles.preCardBulletText, { color }]}>{index + 1}</Text>
      </View>
      <View style={styles.preCardBody}>
        <Text style={styles.preCardName}>{exercise.name}</Text>
        <View style={styles.preCardMeta}>
          <View style={[styles.catBadge, { backgroundColor: color + '18' }]}>
            <Text style={[styles.catBadgeText, { color }]}>{CAT_LABEL[cat]}</Text>
          </View>
          {exercise.sets != null && exercise.reps ? (
            <View style={styles.preCardSetsBadge}>
              <Text style={styles.preCardSetsText}>{exercise.sets} × {exercise.reps}</Text>
            </View>
          ) : null}
        </View>
        {exercise.muscle_groups ? (
          <Text style={styles.preCardMuscles}>{exercise.muscle_groups}</Text>
        ) : null}
      </View>
      <MaterialIcons name="fitness-center" size={16} color={color} style={{ opacity: 0.5 }} />
    </View>
  );
}

// ── Active exercise card (accordion) ─────────────────────────────────────────

type AcCardProps = {
  exercise: ExerciseItem;
  index: number;
  isExpanded: boolean;
  completedSets: Set<number>;
  weight: number;
  repsValue: number;
  onToggle: () => void;
  onSetToggle: (i: number) => void;
  onWeightChange: (delta: number) => void;
  onRepsChange: (delta: number) => void;
};

function ActiveExerciseCard({
  exercise, index, isExpanded, completedSets, weight, repsValue,
  onToggle, onSetToggle, onWeightChange, onRepsChange,
}: AcCardProps) {
  const [restLeft, setRestLeft] = useState<number | null>(null);
  const restRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRest = useCallback(() => {
    if (restRef.current) clearInterval(restRef.current);
    setRestLeft(60);
    restRef.current = setInterval(() => {
      setRestLeft(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(restRef.current!);
          restRef.current = null;
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const skipRest = useCallback(() => {
    if (restRef.current) { clearInterval(restRef.current); restRef.current = null; }
    setRestLeft(null);
  }, []);

  useEffect(() => () => { if (restRef.current) clearInterval(restRef.current); }, []);

  const totalSets = exercise.sets ?? 3;
  const isDone = completedSets.size >= totalSets;

  const handleSetToggle = (i: number) => {
    const adding = !completedSets.has(i);
    onSetToggle(i);
    if (adding) {
      const afterSize = completedSets.size + 1;
      if (afterSize < totalSets) startRest();
      else skipRest();
    }
  };

  return (
    <View style={[styles.acCard, isDone && styles.acCardDone, isExpanded && styles.acCardExpanded]}>
      {/* Header row (always visible) */}
      <TouchableOpacity style={styles.acHeader} onPress={onToggle} activeOpacity={0.75}>
        <View style={[styles.acNum, isDone && styles.acNumDone]}>
          {isDone
            ? <MaterialIcons name="check" size={13} color="#FFF" />
            : <Text style={styles.acNumText}>{index + 1}</Text>
          }
        </View>
        <View style={styles.acHeaderContent}>
          <Text style={[styles.acName, isDone && styles.acNameDone]} numberOfLines={isExpanded ? undefined : 1}>
            {exercise.name}
          </Text>
          {!isExpanded && (
            <View style={styles.acMetaRow}>
              {exercise.sets != null && exercise.reps ? (
                <View style={styles.acSetsBadge}>
                  <Text style={styles.acSetsText}>{exercise.sets} × {exercise.reps}</Text>
                </View>
              ) : null}
              {exercise.muscle_groups ? (
                <Text style={styles.acMuscles} numberOfLines={1}>{exercise.muscle_groups}</Text>
              ) : null}
            </View>
          )}
        </View>
        <MaterialIcons
          name={isExpanded ? 'expand-less' : 'expand-more'}
          size={22}
          color={isDone ? '#10B981' : '#94A3B8'}
        />
      </TouchableOpacity>

      {/* Expanded body */}
      {isExpanded && (
        <View style={styles.acBody}>
          {/* Set tracker */}
          <View style={styles.acSetsSection}>
            <Text style={styles.acSectionLabel}>Séries</Text>
            <View style={styles.acSetBtns}>
              {Array.from({ length: totalSets }).map((_, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.acSetBtn, completedSets.has(i) && styles.acSetBtnDone]}
                  onPress={() => handleSetToggle(i)}
                >
                  {completedSets.has(i)
                    ? <MaterialIcons name="check" size={14} color="#FFF" />
                    : <Text style={styles.acSetBtnText}>{i + 1}</Text>
                  }
                </TouchableOpacity>
              ))}
              <Text style={styles.acSetsCount}>{completedSets.size}/{totalSets}</Text>
            </View>
          </View>

          {/* Weight + Reps adjusters */}
          <View style={styles.acAdjustRow}>
            <View style={styles.acAdjustItem}>
              <Text style={styles.acAdjustLabel}>Poids</Text>
              <View style={styles.acAdjustControls}>
                <TouchableOpacity style={styles.acAdjustBtn} onPress={() => onWeightChange(-2.5)}>
                  <MaterialIcons name="remove" size={16} color={colors.primaryBlue} />
                </TouchableOpacity>
                <Text style={styles.acAdjustValue}>{weight % 1 === 0 ? weight : weight.toFixed(1)} kg</Text>
                <TouchableOpacity style={styles.acAdjustBtn} onPress={() => onWeightChange(2.5)}>
                  <MaterialIcons name="add" size={16} color={colors.primaryBlue} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.acAdjustDivider} />
            <View style={styles.acAdjustItem}>
              <Text style={styles.acAdjustLabel}>Reps</Text>
              <View style={styles.acAdjustControls}>
                <TouchableOpacity style={styles.acAdjustBtn} onPress={() => onRepsChange(-1)}>
                  <MaterialIcons name="remove" size={16} color={colors.primaryBlue} />
                </TouchableOpacity>
                <Text style={styles.acAdjustValue}>{repsValue}</Text>
                <TouchableOpacity style={styles.acAdjustBtn} onPress={() => onRepsChange(1)}>
                  <MaterialIcons name="add" size={16} color={colors.primaryBlue} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Notes */}
          {exercise.notes ? (
            <Text style={styles.acNotes}>{exercise.notes}</Text>
          ) : null}

          {/* Rest timer */}
          {restLeft !== null && (
            <View style={styles.restBox}>
              <View style={styles.restBarBg}>
                <View style={[styles.restBarFill, { width: `${Math.round((restLeft / 60) * 100)}%` }]} />
              </View>
              <View style={styles.restRow}>
                <MaterialIcons name="timer" size={14} color="#D97706" />
                <Text style={styles.restText}>Repos : {restLeft}s</Text>
                <TouchableOpacity onPress={skipRest} style={styles.restSkipBtn}>
                  <Text style={styles.restSkipText}>Passer</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

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

  // Interactive exercise state
  const [completedSets, setCompletedSets] = useState<Record<string, Set<number>>>({});
  const [weights, setWeights] = useState<Record<string, number>>({});
  const [adjustedReps, setAdjustedReps] = useState<Record<string, number>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const timer = useElapsedTimer(started);

  // Derived values
  const doneCount = exercises.filter(ex => (completedSets[ex.id]?.size ?? 0) >= (ex.sets ?? 3)).length;
  const totalSetsCompleted = Object.values(completedSets).reduce((acc, s) => acc + s.size, 0);
  const totalWeightVolume = exercises.reduce((acc, ex) => {
    const w = weights[ex.id] ?? 0;
    if (w === 0) return acc;
    const sets = completedSets[ex.id]?.size ?? 0;
    const reps = adjustedReps[ex.id] ?? parseRepsMax(ex.reps);
    return acc + w * reps * sets;
  }, 0);
  const estimatedMin = Math.max(1, Math.ceil(exercises.reduce((acc, ex) => acc + (ex.sets ?? 3) * 45 + 60, 0) / 60));
  const progressPct = exercises.length > 0 ? Math.round((doneCount / exercises.length) * 100) : 0;

  // Callbacks
  const toggleSet = useCallback((exId: string, setIdx: number) => {
    setCompletedSets(prev => {
      const cur = new Set(prev[exId] ?? []);
      if (cur.has(setIdx)) cur.delete(setIdx); else cur.add(setIdx);
      return { ...prev, [exId]: cur };
    });
  }, []);

  const adjustWeight = useCallback((exId: string, delta: number) => {
    setWeights(prev => ({
      ...prev,
      [exId]: Math.max(0, Math.round(((prev[exId] ?? 0) + delta) * 10) / 10),
    }));
  }, []);

  const adjustReps = useCallback((exId: string, delta: number, base: number) => {
    setAdjustedReps(prev => ({
      ...prev,
      [exId]: Math.max(1, (prev[exId] ?? base) + delta),
    }));
  }, []);

  const toggleExpand = useCallback((id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  }, []);

  // Data loading
  useEffect(() => {
    if (!accountId) return;
    setLoadState('loading');
    const load = sessionId ? getSessionById(sessionId) : getTodaySession(accountId);
    load
      .then(async (s) => {
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
          setLoadState('rest_day');
          getNextSession(accountId).then(setNextSession).catch(() => setNextSession(null));
        } else if (err?.status === 404) {
          setLoadState('no_session');
        } else {
          setLoadState('error');
        }
      });
  }, [accountId, sessionId]);

  const handleStart = () => setStarted(true);

  const handleFinish = async () => {
    if (!token || !session) return;
    await completeSession(token, session.id, { rpe_reported: Number(rpe) || 7, notes });
    router.replace('/feedback?fromSession=1');
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loadState === 'loading') {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <Text style={styles.emptySubtitle}>Chargement…</Text>
      </SafeAreaView>
    );
  }

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

  if (loadState === 'rest_day') {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <View style={styles.restDayIcon}>
          <MaterialIcons name="bedtime" size={48} color={colors.primaryBlue} />
        </View>
        <Text style={styles.emptyTitle}>Jour de repos</Text>
        <Text style={styles.emptySubtitle}>Profites-en pour récupérer, t'hydrater et dormir suffisamment.</Text>
        {nextSession && (
          <View style={styles.nextSessionBox}>
            <Text style={styles.nextSessionLabel}>Prochaine séance</Text>
            <Text style={styles.nextSessionName}>{nextSession.name}</Text>
            <Text style={styles.nextSessionDate}>{nextSession.session_date}</Text>
          </View>
        )}
        <TouchableOpacity style={styles.seeWeekBtn} onPress={() => router.push('/workouts')} activeOpacity={0.85}>
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
          {/* Session hero */}
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
                <Text style={styles.metaText}>{estimatedMin} min estimé</Text>
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

            {session.notes ? (
              <View style={styles.notesBox}>
                <MaterialIcons name="info-outline" size={16} color="#64748B" />
                <Text style={styles.notesText}>{session.notes}</Text>
              </View>
            ) : null}
          </View>

          {/* Enriched exercise list */}
          {exercises.length > 0 && (
            <View style={styles.exercisesSection}>
              <View style={styles.exercisesSectionHeader}>
                <Text style={styles.exercisesSectionTitle}>
                  {exercises.length} exercice{exercises.length > 1 ? 's' : ''} · {estimatedMin} min
                </Text>
                <TouchableOpacity style={styles.editExercisesBtn} onPress={() => setShowExerciseModal(true)}>
                  <MaterialIcons name="edit" size={14} color={colors.primaryBlue} />
                  <Text style={styles.editExercisesBtnText}>Modifier</Text>
                </TouchableOpacity>
              </View>
              {exercises.map((ex, idx) => (
                <PreStartExerciseCard key={ex.id} exercise={ex} index={idx} />
              ))}
            </View>
          )}

          {exercises.length === 0 && (
            <TouchableOpacity style={styles.addExercisesBtn} onPress={() => setShowExerciseModal(true)}>
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
      {/* Header */}
      <View style={styles.activeHeader}>
        <View style={styles.timerPill}>
          <MaterialIcons name="timer" size={16} color={colors.primaryBlue} />
          <Text style={styles.timerText}>{timer}</Text>
        </View>
        <Text style={styles.activeSessionName} numberOfLines={1}>{session.name}</Text>
        <View style={styles.progressPill}>
          <Text style={styles.progressPillText}>{doneCount}/{exercises.length}</Text>
        </View>
      </View>

      {/* Exercise-based progress bar */}
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${progressPct}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.activeContent} showsVerticalScrollIndicator={false}>
        {/* Progress summary ring */}
        <View style={styles.progressCard}>
          <View style={[styles.progressRing, doneCount === exercises.length && exercises.length > 0 && styles.progressRingDone]}>
            <Text style={styles.progressRingNum}>{doneCount}</Text>
            <Text style={styles.progressRingDenom}>/ {exercises.length}</Text>
          </View>
          <View style={styles.progressCardInfo}>
            <Text style={styles.progressCardTitle}>Exercices terminés</Text>
            <IntensityDot value={session.adjusted_intensity} />
            <Text style={styles.progressCardTimer}>{timer} écoulé</Text>
          </View>
        </View>

        {/* Interactive exercise accordion */}
        {exercises.map((ex, idx) => (
          <ActiveExerciseCard
            key={ex.id}
            exercise={ex}
            index={idx}
            isExpanded={expandedId === ex.id}
            completedSets={completedSets[ex.id] ?? EMPTY_SET}
            weight={weights[ex.id] ?? 0}
            repsValue={adjustedReps[ex.id] ?? parseRepsMax(ex.reps)}
            onToggle={() => toggleExpand(ex.id)}
            onSetToggle={(i) => toggleSet(ex.id, i)}
            onWeightChange={(d) => adjustWeight(ex.id, d)}
            onRepsChange={(d) => adjustReps(ex.id, d, parseRepsMax(ex.reps))}
          />
        ))}

        {session.notes ? (
          <View style={styles.activeNotesBox}>
            <Text style={styles.activeNotesLabel}>Consignes</Text>
            <Text style={styles.activeNotesText}>{session.notes}</Text>
          </View>
        ) : null}

        {showFinish && (
          <View style={styles.finishPanel}>
            <Text style={styles.finishTitle}>Bilan de séance</Text>

            {/* Summary stats */}
            <View style={styles.finishStats}>
              <View style={styles.finishStat}>
                <Text style={styles.finishStatValue}>{doneCount}/{exercises.length}</Text>
                <Text style={styles.finishStatLabel}>Exercices</Text>
              </View>
              <View style={styles.finishStatDivider} />
              <View style={styles.finishStat}>
                <Text style={styles.finishStatValue}>{totalSetsCompleted}</Text>
                <Text style={styles.finishStatLabel}>Séries</Text>
              </View>
              <View style={styles.finishStatDivider} />
              <View style={styles.finishStat}>
                <Text style={styles.finishStatValue}>
                  {totalWeightVolume > 0 ? `${totalWeightVolume.toFixed(0)} kg` : '—'}
                </Text>
                <Text style={styles.finishStatLabel}>Volume</Text>
              </View>
            </View>

            <Text style={styles.finishSubtitle}>RPE ressenti (1 = très facile · 10 = épuisant)</Text>
            <View style={styles.rpeRow}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => (
                <TouchableOpacity
                  key={v}
                  style={[styles.rpeChip, Number(rpe) === v && styles.rpeChipActive]}
                  onPress={() => setRpe(String(v))}
                >
                  <Text style={[styles.rpeChipText, Number(rpe) === v && styles.rpeChipTextActive]}>{v}</Text>
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
        )}
      </ScrollView>

      <View style={styles.footer}>
        {!showFinish ? (
          <TouchableOpacity style={styles.finishButton} onPress={() => setShowFinish(true)} activeOpacity={0.85}>
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

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },

  // Empty / special states
  emptyContainer: {
    flex: 1, backgroundColor: '#F8FAFC', alignItems: 'center',
    justifyContent: 'center', gap: 14, padding: spacing.xl,
  },
  restDayIcon: {
    width: 96, height: 96, borderRadius: 32,
    backgroundColor: 'rgba(59,130,246,0.08)', alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: '#1E293B' },
  emptySubtitle: { fontSize: 15, color: '#64748B', textAlign: 'center', lineHeight: 22 },
  nextSessionBox: {
    backgroundColor: '#FFF', borderRadius: 20, padding: spacing.lg,
    alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9',
    gap: 4, width: '100%', maxWidth: 320,
  },
  nextSessionLabel: { fontSize: 11, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 },
  nextSessionName: { fontSize: 16, fontWeight: '800', color: '#1E293B', textAlign: 'center' },
  nextSessionDate: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  seeWeekBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.primaryBlue, borderRadius: 16,
    paddingHorizontal: 24, paddingVertical: 14, width: '100%', maxWidth: 320,
  },
  seeWeekBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  backBtn: { paddingHorizontal: 24, paddingVertical: 12, backgroundColor: colors.primaryBlue, borderRadius: 16 },
  backBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.md,
  },
  backIcon: {
    width: 40, height: 40, borderRadius: 14, backgroundColor: '#FFF',
    borderWidth: 1, borderColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#1E293B' },

  // Pre-start layout
  preStartContent: { paddingHorizontal: spacing.xl, paddingBottom: 120, gap: 20 },
  sessionHero: {
    backgroundColor: '#FFF', borderRadius: 28, padding: 24,
    borderWidth: 1, borderColor: '#F1F5F9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2, gap: 20,
  },
  sessionHeroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  sessionName: { flex: 1, fontSize: 22, fontWeight: '800', color: '#1E293B', lineHeight: 28 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, backgroundColor: 'rgba(59,130,246,0.1)' },
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
  notesBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#F8FAFC', borderRadius: 14, padding: 12 },
  notesText: { flex: 1, fontSize: 14, color: '#475569', lineHeight: 20 },

  // Exercises section header
  exercisesSection: { gap: 10 },
  exercisesSectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  exercisesSectionTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  editExercisesBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(59,130,246,0.08)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10,
  },
  editExercisesBtnText: { fontSize: 12, fontWeight: '700', color: colors.primaryBlue },
  addExercisesBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: 'rgba(59,130,246,0.06)', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(59,130,246,0.15)', borderStyle: 'dashed',
  },
  addExercisesBtnText: { fontSize: 14, fontWeight: '700', color: colors.primaryBlue },

  // Pre-start enriched exercise card
  preCard: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: '#F1F5F9',
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  preCardBullet: { width: 28, height: 28, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  preCardBulletText: { fontSize: 12, fontWeight: '800' },
  preCardBody: { flex: 1, gap: 5 },
  preCardName: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  preCardMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  catBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  catBadgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  preCardSetsBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  preCardSetsText: { fontSize: 10, fontWeight: '600', color: '#64748B' },
  preCardMuscles: { fontSize: 11, color: '#94A3B8', fontStyle: 'italic' },

  // Active header
  activeHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.md,
  },
  timerPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(59,130,246,0.1)', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, minWidth: 72,
  },
  timerText: { fontSize: 15, fontWeight: '800', color: colors.primaryBlue, fontVariant: ['tabular-nums'] },
  activeSessionName: { flex: 1, textAlign: 'center', fontSize: 15, fontWeight: '700', color: '#1E293B', paddingHorizontal: 8 },
  progressPill: {
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: 'rgba(59,130,246,0.1)', borderRadius: 20, minWidth: 52, alignItems: 'center',
  },
  progressPillText: { fontSize: 13, fontWeight: '800', color: colors.primaryBlue },

  // Progress bar (exercise-based)
  progressBarBg: { height: 4, backgroundColor: '#E2E8F0', marginHorizontal: spacing.xl, borderRadius: 2 },
  progressBarFill: { height: '100%', backgroundColor: colors.primaryBlue, borderRadius: 2 },

  // Progress summary card
  activeContent: { paddingHorizontal: spacing.xl, paddingTop: 20, paddingBottom: 120, gap: 14 },
  progressCard: {
    backgroundColor: '#FFF', borderRadius: 24, padding: 20,
    borderWidth: 1, borderColor: '#F1F5F9', flexDirection: 'row', alignItems: 'center', gap: 20,
  },
  progressRing: {
    width: 72, height: 72, borderRadius: 36, borderWidth: 4,
    borderColor: colors.primaryBlue, alignItems: 'center', justifyContent: 'center',
  },
  progressRingDone: { borderColor: '#10B981' },
  progressRingNum: { fontSize: 22, fontWeight: '900', color: '#1E293B', lineHeight: 26 },
  progressRingDenom: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
  progressCardInfo: { flex: 1, gap: 8 },
  progressCardTitle: { fontSize: 12, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5 },
  progressCardTimer: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },

  // Accordion exercise card
  acCard: {
    backgroundColor: '#FFF', borderRadius: 18,
    borderWidth: 1, borderColor: '#F1F5F9', overflow: 'hidden',
  },
  acCardDone: { backgroundColor: 'rgba(16,185,129,0.03)', borderColor: 'rgba(16,185,129,0.25)' },
  acCardExpanded: { borderColor: 'rgba(59,130,246,0.35)' },
  acHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  acNum: {
    width: 26, height: 26, borderRadius: 9,
    backgroundColor: 'rgba(59,130,246,0.1)', alignItems: 'center', justifyContent: 'center',
  },
  acNumDone: { backgroundColor: '#10B981' },
  acNumText: { fontSize: 12, fontWeight: '800', color: colors.primaryBlue },
  acHeaderContent: { flex: 1, gap: 4 },
  acName: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  acNameDone: { color: '#94A3B8' },
  acMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  acSetsBadge: { backgroundColor: 'rgba(59,130,246,0.08)', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  acSetsText: { fontSize: 11, fontWeight: '700', color: colors.primaryBlue },
  acMuscles: { fontSize: 11, color: '#94A3B8', fontStyle: 'italic', flex: 1 },

  // Accordion body
  acBody: { paddingHorizontal: 14, paddingBottom: 14, gap: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  acSetsSection: { gap: 8 },
  acSectionLabel: { fontSize: 10, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 },
  acSetBtns: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  acSetBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#E2E8F0',
  },
  acSetBtnDone: { backgroundColor: '#10B981', borderColor: '#10B981' },
  acSetBtnText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
  acSetsCount: { fontSize: 12, color: '#94A3B8', fontWeight: '600', marginLeft: 4 },

  // Adjust row
  acAdjustRow: { flexDirection: 'row', backgroundColor: '#F8FAFC', borderRadius: 14, padding: 12 },
  acAdjustItem: { flex: 1, alignItems: 'center', gap: 8 },
  acAdjustLabel: { fontSize: 10, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 },
  acAdjustControls: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  acAdjustBtn: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: 'rgba(59,130,246,0.08)', alignItems: 'center', justifyContent: 'center',
  },
  acAdjustValue: { fontSize: 15, fontWeight: '800', color: '#1E293B', minWidth: 56, textAlign: 'center' },
  acAdjustDivider: { width: 1, backgroundColor: '#E2E8F0', marginVertical: 2, marginHorizontal: 4 },
  acNotes: { fontSize: 12, color: '#64748B', fontStyle: 'italic', lineHeight: 18 },

  // Rest timer
  restBox: { backgroundColor: '#FFFBEB', borderRadius: 12, padding: 10, gap: 8 },
  restBarBg: { height: 4, backgroundColor: '#FDE68A', borderRadius: 2 },
  restBarFill: { height: '100%', backgroundColor: '#F59E0B', borderRadius: 2 },
  restRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  restText: { flex: 1, fontSize: 13, fontWeight: '700', color: '#92400E' },
  restSkipBtn: { paddingHorizontal: 10, paddingVertical: 4, backgroundColor: '#FEF3C7', borderRadius: 8 },
  restSkipText: { fontSize: 12, fontWeight: '700', color: '#D97706' },

  // Active session notes
  activeNotesBox: { backgroundColor: '#FFF', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#F1F5F9', gap: 6 },
  activeNotesLabel: { fontSize: 11, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 },
  activeNotesText: { fontSize: 14, color: '#475569', lineHeight: 22 },

  // Finish panel
  finishPanel: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#F1F5F9', gap: 16 },
  finishTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  finishStats: { flexDirection: 'row', backgroundColor: '#F8FAFC', borderRadius: 14, padding: 14 },
  finishStat: { flex: 1, alignItems: 'center', gap: 4 },
  finishStatValue: { fontSize: 18, fontWeight: '900', color: '#1E293B' },
  finishStatLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  finishStatDivider: { width: 1, backgroundColor: '#E2E8F0', marginVertical: 4 },
  finishSubtitle: { fontSize: 13, color: '#64748B' },
  rpeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  rpeChip: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  rpeChipActive: { backgroundColor: colors.primaryBlue },
  rpeChipText: { fontSize: 15, fontWeight: '700', color: '#64748B' },
  rpeChipTextActive: { color: '#FFF' },
  notesInput: {
    backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0',
    borderRadius: 14, padding: 14, fontSize: 14, color: '#1E293B',
    minHeight: 80, textAlignVertical: 'top',
  },

  // Footer
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: spacing.xl, paddingBottom: 32, paddingTop: 16,
    backgroundColor: 'rgba(248,250,252,0.95)',
  },
  startButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
    backgroundColor: colors.primaryBlue, borderRadius: 20, height: 64,
    shadowColor: colors.primaryBlue, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  startButtonText: { color: '#FFF', fontSize: 17, fontWeight: '800' },
  finishButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
    backgroundColor: '#1E293B', borderRadius: 20, height: 64,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
  },
  finishButtonText: { color: '#FFF', fontSize: 17, fontWeight: '800' },
});
