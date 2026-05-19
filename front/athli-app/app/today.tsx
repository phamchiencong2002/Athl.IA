import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
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
import { completeSession, getSessionById, getTodaySession } from '../lib/workouts';

type SessionData = {
  id: string;
  name: string;
  session_date: string;
  planned_duration_min: number;
  planned_intensity: number;
  adjusted_intensity: number;
  status: string;
  notes?: string | null;
};

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
        <View
          key={i}
          style={[styles.dot, i < value && styles.dotFilled]}
        />
      ))}
    </View>
  );
}

export default function TodayScreen() {
  const { accountId, token } = useAuth();
  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();

  const [session, setSession] = useState<SessionData | null>(null);
  const [started, setStarted] = useState(false);
  const [rpe, setRpe] = useState('7');
  const [notes, setNotes] = useState('');
  const [showFinish, setShowFinish] = useState(false);

  const timer = useElapsedTimer(started);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!accountId) return;
    const load = sessionId ? getSessionById(sessionId) : getTodaySession(accountId);
    load.then(setSession).catch(() => setSession(null));
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

  if (!session) {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <MaterialIcons name="event-busy" size={64} color="#CBD5E1" />
        <Text style={styles.emptyTitle}>Pas de séance aujourd'hui</Text>
        <Text style={styles.emptySubtitle}>Profites-en pour récupérer !</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Retour</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!started) {
    return (
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
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
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.startButton} onPress={handleStart} activeOpacity={0.85}>
            <MaterialIcons name="play-arrow" size={28} color="#FFF" />
            <Text style={styles.startButtonText}>Démarrer la séance</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Active session view ──
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header with timer */}
      <View style={styles.activeHeader}>
        <View style={styles.timerPill}>
          <MaterialIcons name="timer" size={16} color={colors.primaryBlue} />
          <Text style={styles.timerText}>{timer}</Text>
        </View>
        <Text style={styles.activeSessionName} numberOfLines={1}>{session.name}</Text>
        <View style={{ width: 72 }} />
      </View>

      {/* Progress bar */}
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
        {/* Intensity ring */}
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

        {session.notes ? (
          <View style={styles.activeNotesBox}>
            <Text style={styles.activeNotesLabel}>Consignes</Text>
            <Text style={styles.activeNotesText}>{session.notes}</Text>
          </View>
        ) : null}

        {/* RPE input */}
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

  // Empty state
  emptyContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: spacing.xl,
  },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: '#1E293B' },
  emptySubtitle: { fontSize: 15, color: '#64748B' },
  backBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.primaryBlue,
    borderRadius: 16,
  },
  backBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },

  // Pre-start header
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
  preStartContent: { paddingHorizontal: spacing.xl, paddingBottom: 120 },
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

  // Active session header
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

  // Footer buttons
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
});
