import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import colors from '../constants/colors';
import spacing from '../constants/spacing';
import { useAuth } from '../context/AuthContext';
import BottomNav from '../components/ui/BottomNav';
import { listSessions, type Session } from '../lib/workouts';

const DAY_NAMES_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MONTH_NAMES_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

function getWeekDays(): Date[] {
  const today = new Date();
  const monday = new Date(today);
  const dayOfWeek = today.getDay(); // 0 = Sun
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  monday.setDate(today.getDate() + diff);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getIntensityLabel(intensity: number): string {
  if (intensity >= 8) return 'Haute';
  if (intensity >= 5) return 'Moyenne';
  return 'Basse';
}

export default function WorkoutsScreen() {
  const { accountId } = useAuth();
  const [sessions, setSessions] = useState<(Session & { rpe_reported?: number | null })[]>([]);
  const [selectedDate, setSelectedDate] = useState(toISODate(new Date()));
  const [loading, setLoading] = useState(false);

  const weekDays = getWeekDays();

  const load = useCallback(async () => {
    if (!accountId) return;
    setLoading(true);
    try {
      const data = await listSessions(accountId);
      setSessions(data);
    } catch {
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    load();
  }, [load]);

  const sessionsForSelectedDate = sessions.filter((s) => s.session_date === selectedDate);

  const sessionsByDate: Record<string, Session[]> = {};
  for (const s of sessions) {
    if (!sessionsByDate[s.session_date]) sessionsByDate[s.session_date] = [];
    sessionsByDate[s.session_date].push(s);
  }

  const weekLabel = (() => {
    const start = weekDays[0];
    const end = weekDays[6];
    return `Semaine du ${start.getDate()} au ${end.getDate()} ${MONTH_NAMES_FR[end.getMonth()]}`;
  })();

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.calendarIconBox}>
            <MaterialIcons name="calendar-today" size={24} color={colors.primaryBlue} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Athli.AI</Text>
            <Text style={styles.headerSubtitle}>Planning</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <MaterialIcons name="notifications-none" size={24} color={colors.contentDark} />
        </TouchableOpacity>
      </View>

      {/* Page Title */}
      <View style={styles.titleSection}>
        <Text style={styles.pageTitle}>Planning Hebdomadaire</Text>
        <Text style={styles.pageSubtitle}>{weekLabel}</Text>
      </View>

      {/* Horizontal Calendar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.calendarScroll}
      >
        {weekDays.map((day) => {
          const iso = toISODate(day);
          const isSelected = iso === selectedDate;
          const hasSession = !!sessionsByDate[iso];
          return (
            <TouchableOpacity
              key={iso}
              style={[styles.dayCard, isSelected && styles.dayCardActive]}
              onPress={() => setSelectedDate(iso)}
              activeOpacity={0.8}
            >
              <Text style={[styles.dayName, isSelected && styles.dayNameActive]}>
                {DAY_NAMES_FR[day.getDay()]}
              </Text>
              <Text style={[styles.dayNumber, isSelected && styles.dayNumberActive]}>
                {day.getDate()}
              </Text>
              {hasSession && (
                <View style={[styles.sessionDot, isSelected && styles.sessionDotActive]} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      >
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>
            {sessionsForSelectedDate.length > 0
              ? `${sessionsForSelectedDate.length} séance${sessionsForSelectedDate.length > 1 ? 's' : ''}`
              : 'Séances de la semaine'}
          </Text>
          <Text style={styles.listSubtitle}>
            {sessions.filter((s) => s.status === 'done').length} complétées
          </Text>
        </View>

        {sessionsForSelectedDate.length === 0 ? (
          <View style={styles.restCard}>
            <View style={styles.restInfo}>
              <View style={styles.restIconBox}>
                <MaterialIcons name="bedtime" size={24} color={colors.mutedLight ?? '#94A3B8'} />
              </View>
              <View>
                <Text style={styles.restTitle}>Jour de repos</Text>
                <Text style={styles.restSubtitle}>Récupération active conseillée</Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#CBD5E1" />
          </View>
        ) : (
          sessionsForSelectedDate.map((session) => {
            const isDone = session.status === 'done';
            return (
              <View
                key={session.id}
                style={[styles.sessionCard, !isDone && styles.upcomingSessionCard]}
              >
                {!isDone && <View style={styles.upcomingIndicator} />}
                <View style={styles.sessionRow}>
                  <View style={styles.sessionInfo}>
                    <View style={styles.badgeRow}>
                      {isDone ? (
                        <>
                          <View style={styles.badgeCompleted}>
                            <Text style={styles.badgeCompletedText}>Complété</Text>
                          </View>
                          <MaterialIcons name="check-circle" size={16} color="#10B981" />
                        </>
                      ) : (
                        <View style={styles.badgeUpcoming}>
                          <Text style={styles.badgeUpcomingText}>À venir</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.sessionTitle}>{session.name}</Text>
                    <View style={styles.sessionMeta}>
                      <Text style={styles.sessionMetaText}>
                        ⏱ {session.planned_duration_min} min
                      </Text>
                      <Text style={styles.sessionMetaText}>
                        ⚡ {getIntensityLabel(session.adjusted_intensity)}
                      </Text>
                      {session.rpe_reported != null && (
                        <Text style={styles.sessionMetaText}>RPE {session.rpe_reported}/10</Text>
                      )}
                    </View>
                  </View>
                </View>

                {isDone ? (
                  <View style={styles.cardActions}>
                    <View style={[styles.secondaryBtn, { backgroundColor: 'rgba(16,185,129,0.08)' }]}>
                      <Text style={[styles.secondaryBtnText, { color: '#10B981' }]}>Terminée</Text>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.primaryActionButton}
                    activeOpacity={0.8}
                    onPress={() => router.push('/today')}
                  >
                    <MaterialIcons name="play-circle-outline" size={24} color="#FFF" />
                    <Text style={styles.primaryActionText}>Démarrer la séance</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}

        {/* Show all other sessions briefly if none selected for the day */}
        {sessionsForSelectedDate.length === 0 && sessions.length > 0 && (
          <View style={styles.allSessionsSection}>
            <Text style={styles.allSessionsTitle}>Toutes les séances du programme</Text>
            {sessions.slice(0, 10).map((session) => (
              <View key={session.id} style={styles.miniSessionRow}>
                <View
                  style={[
                    styles.miniDot,
                    { backgroundColor: session.status === 'done' ? '#10B981' : '#94A3B8' },
                  ]}
                />
                <Text style={styles.miniSessionDate}>{session.session_date}</Text>
                <Text style={styles.miniSessionName} numberOfLines={1}>
                  {session.name}
                </Text>
                <Text
                  style={[
                    styles.miniSessionStatus,
                    { color: session.status === 'done' ? '#10B981' : '#94A3B8' },
                  ]}
                >
                  {session.status === 'done' ? '✓' : '○'}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <BottomNav activeTab="workouts" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  calendarIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 13, fontWeight: '500', color: '#64748B' },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  titleSection: { paddingHorizontal: spacing.xl, paddingTop: 8, paddingBottom: 8 },
  pageTitle: { fontSize: 22, fontWeight: '900', color: '#1E293B', letterSpacing: -0.5 },
  pageSubtitle: { fontSize: 14, fontWeight: '600', color: '#94A3B8', marginTop: 2 },
  calendarScroll: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  dayCard: {
    width: 64,
    height: 96,
    borderRadius: 24,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
    gap: 2,
  },
  dayCardActive: {
    backgroundColor: colors.primaryBlue,
    borderColor: 'transparent',
    shadowColor: colors.primaryBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  dayName: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: '#94A3B8',
    marginBottom: 2,
  },
  dayNameActive: { color: 'rgba(255,255,255,0.8)' },
  dayNumber: { fontSize: 20, fontWeight: '900', color: '#1E293B' },
  dayNumberActive: { color: '#FFF' },
  sessionDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primaryBlue, marginTop: 4 },
  sessionDotActive: { backgroundColor: '#FFF' },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: 120,
    gap: spacing.xl,
  },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  listTitle: { fontSize: 19, fontWeight: '800', color: '#1E293B' },
  listSubtitle: { fontSize: 13, fontWeight: '700', color: '#94A3B8' },
  sessionCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    gap: spacing.lg,
  },
  upcomingSessionCard: { position: 'relative', overflow: 'hidden' },
  upcomingIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 6,
    backgroundColor: colors.primaryBlue,
  },
  sessionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  sessionInfo: { flex: 1, gap: 8 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badgeCompleted: {
    backgroundColor: 'rgba(16,185,129,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeCompletedText: { fontSize: 10, fontWeight: '700', color: '#10B981', textTransform: 'uppercase' },
  badgeUpcoming: {
    backgroundColor: 'rgba(59,130,246,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeUpcomingText: { fontSize: 10, fontWeight: '700', color: colors.primaryBlue, textTransform: 'uppercase' },
  sessionTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  sessionMeta: { flexDirection: 'row', gap: spacing.md },
  sessionMetaText: { fontSize: 12, fontWeight: '700', color: '#94A3B8' },
  cardActions: { flexDirection: 'row', gap: spacing.sm },
  secondaryBtn: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  secondaryBtnText: { fontSize: 14, fontWeight: '800', color: '#475569' },
  restCard: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    padding: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  restInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  restIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  restTitle: { fontSize: 17, fontWeight: '800', color: '#1E293B' },
  restSubtitle: { fontSize: 13, fontWeight: '500', color: '#94A3B8', marginTop: 2 },
  primaryActionButton: {
    width: '100%',
    height: 56,
    backgroundColor: colors.primaryBlue,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: colors.primaryBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryActionText: { color: '#FFF', fontSize: 14, fontWeight: '800' },
  allSessionsSection: { gap: 8, marginTop: 8 },
  allSessionsTitle: { fontSize: 15, fontWeight: '700', color: '#64748B', marginBottom: 4 },
  miniSessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  miniDot: { width: 8, height: 8, borderRadius: 4 },
  miniSessionDate: { fontSize: 11, fontWeight: '600', color: '#94A3B8', width: 80 },
  miniSessionName: { flex: 1, fontSize: 13, fontWeight: '600', color: '#1E293B' },
  miniSessionStatus: { fontSize: 14, fontWeight: '800' },
});
