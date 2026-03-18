import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View, Image, SafeAreaView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import colors from '../constants/colors';
import spacing from '../constants/spacing';
import { useAuth } from '../context/AuthContext';
import BottomNav from '../components/ui/BottomNav';

// Dummy data to replicate the backend payload we asked for in context-dashboard-backend.md
const DUMMY_DATA = {
  user: {
    firstName: 'Alex',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB79lD15zKvJQEmQ0Pcpj5TAVdUb-MN9R5RmMirX4fHfa2Yp48fzYl7CxEeLsTDyP_3UsPMKMIKz3TkOkLz7VfQNan1iy9aIWmmw8nbAxshqF2yVdkGqHhyUyILJAZ7gLzzTmud8Ndj9Dasb5ijuRBVmRz-NPWdvA_FBUERrYlWb-f-x0Dqo8x2TgSLgP5BvlbYxm-nvTIQ4WHZ0TDGuiTsZ2R2FNWWBdVHbHLo43oKfUDDiy8ZNkKhcjINrTmY-LmkxE-F7WCzZqPt',
  },
  readiness: {
    score: 85,
    status: "Prêt pour l'entraînement",
    sleep: '7h 45m',
    recovery: '92%',
    stress: 'Bas',
  },
  calories: {
    current: '1,840',
    trend: '+12%',
  },
  weight: {
    current: '78.5',
    trend: '-0.8',
  }
};

export default function DashboardScreen() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);

  // Simulated pull-to-refresh
  const load = async () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  useEffect(() => {
    // In real app: if (!token) router.replace('/login');
    load();
  }, [token]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatarContainer}>
              <Image source={{ uri: DUMMY_DATA.user.avatar }} style={styles.avatar} />
            </View>
            <View>
              <Text style={styles.greeting}>Bonjour, {DUMMY_DATA.user.firstName} 👋</Text>
              <Text style={styles.date}>Lundi, 24 Mai</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <MaterialIcons name="notifications-none" size={24} color={colors.contentDark} />
          </TouchableOpacity>
        </View>

        {/* Forme du jour Card */}
        <View style={styles.formCard}>
          <View style={styles.formHeader}>
            <View>
              <Text style={styles.formTitle}>Forme du jour</Text>
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>{DUMMY_DATA.readiness.status}</Text>
              </View>
            </View>
            <TouchableOpacity>
              <Text style={styles.detailsLink}>Détails</Text>
            </TouchableOpacity>
          </View>

          {/* Circular Score Mock */}
          <View style={styles.scoreContainer}>
            <View style={styles.circularScoreRing}>
              <View style={styles.scoreInner}>
                <Text style={styles.scoreNumber}>{DUMMY_DATA.readiness.score}</Text>
                <Text style={styles.scoreLabel}>Readiness</Text>
              </View>
            </View>
          </View>

          {/* Sub Metrics */}
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Sommeil</Text>
              <Text style={styles.metricValueBlack}>{DUMMY_DATA.readiness.sleep}</Text>
            </View>
            <View style={[styles.metricItem, styles.metricItemBorder]}>
              <Text style={styles.metricLabel}>Récup</Text>
              <Text style={styles.metricValueGreen}>{DUMMY_DATA.readiness.recovery}</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Stress</Text>
              <Text style={styles.metricValueBlack}>{DUMMY_DATA.readiness.stress}</Text>
            </View>
          </View>
        </View>

        {/* Primary Action Button */}
        <TouchableOpacity style={styles.primaryActionButton} activeOpacity={0.8}>
          <MaterialIcons name="play-circle-outline" size={32} color="#FFF" />
          <Text style={styles.primaryActionText}>Commencer ma séance</Text>
        </TouchableOpacity>

        {/* Ma Progression */}
        <View style={styles.progressionSection}>
          <View style={styles.progressionHeader}>
            <Text style={styles.progressionTitle}>Ma progression</Text>
            <TouchableOpacity style={styles.trendButton}>
              <MaterialIcons name="trending-up" size={20} color={colors.mutedDark} />
            </TouchableOpacity>
          </View>

          <View style={styles.progressionGrid}>
            {/* Calories Card */}
            <View style={styles.progressionCard}>
              <Text style={styles.progressionCardLabel}>Calories</Text>
              <View style={styles.progressionCardValueRow}>
                <Text style={styles.progressionCardValue}>{DUMMY_DATA.calories.current}</Text>
                <Text style={styles.progressionCardTrendPos}>{DUMMY_DATA.calories.trend}</Text>
              </View>
              {/* Dummy Bar Chart */}
              <View style={styles.barChart}>
                <View style={[styles.bar, { height: '40%', backgroundColor: 'rgba(59, 130, 246, 0.1)' }]} />
                <View style={[styles.bar, { height: '60%', backgroundColor: 'rgba(59, 130, 246, 0.1)' }]} />
                <View style={[styles.bar, { height: '35%', backgroundColor: 'rgba(59, 130, 246, 0.1)' }]} />
                <View style={[styles.bar, { height: '80%', backgroundColor: 'rgba(59, 130, 246, 0.3)' }]} />
                <View style={[styles.bar, { height: '100%', backgroundColor: colors.primaryBlue }]} />
              </View>
            </View>

            {/* Poids Card */}
            <View style={styles.progressionCard}>
              <Text style={styles.progressionCardLabel}>Poids (kg)</Text>
              <View style={styles.progressionCardValueRow}>
                <Text style={styles.progressionCardValue}>{DUMMY_DATA.weight.current}</Text>
                <Text style={styles.progressionCardTrendNeg}>{DUMMY_DATA.weight.trend}</Text>
              </View>
              {/* Dummy Bar Chart */}
              <View style={styles.barChart}>
                <View style={[styles.bar, { height: '95%', backgroundColor: colors.surfaceLight }]} />
                <View style={[styles.bar, { height: '90%', backgroundColor: colors.surfaceLight }]} />
                <View style={[styles.bar, { height: '85%', backgroundColor: '#E5E7EB' }]} />
                <View style={[styles.bar, { height: '80%', backgroundColor: '#E5E7EB' }]} />
                <View style={[styles.bar, { height: '75%', backgroundColor: colors.primaryBlue }]} />
              </View>
            </View>
          </View>
        </View>

      </ScrollView>

      <BottomNav activeTab="home" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    paddingBottom: 120, // Leave space for nav
    paddingHorizontal: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.1)',
    overflow: 'hidden',
    padding: 2,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: -0.5,
  },
  date: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 2,
  },
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
  formCard: {
    backgroundColor: '#FFF',
    borderRadius: 28,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: spacing.xl,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xl,
  },
  formTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#1E293B',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginTop: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailsLink: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryBlue,
  },
  scoreContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  circularScoreRing: {
    width: 176,
    height: 176,
    borderRadius: 88,
    borderWidth: 14,
    borderColor: colors.primaryBlue,
    borderTopColor: '#7C3AED',
    borderRightColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreInner: {
    alignItems: 'center',
  },
  scoreNumber: {
    fontSize: 48,
    fontWeight: '900',
    color: '#1E293B',
    lineHeight: 52,
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94A3B8',
  },
  metricsGrid: {
    flexDirection: 'row',
    marginTop: 40,
    paddingTop: 32,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricItemBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#F8FAFC',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  metricValueBlack: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
  },
  metricValueGreen: {
    fontSize: 15,
    fontWeight: '800',
    color: '#10B981',
  },
  primaryActionButton: {
    width: '100%',
    height: 72,
    backgroundColor: colors.primaryBlue, // Mocking the gradient with solid primary for now
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    shadowColor: colors.primaryBlue,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 48,
  },
  primaryActionText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },
  progressionSection: {
    gap: 20,
  },
  progressionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#1E293B',
  },
  trendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressionGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  progressionCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  progressionCardLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 8,
  },
  progressionCardValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 16,
  },
  progressionCardValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1E293B',
  },
  progressionCardTrendPos: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  progressionCardTrendNeg: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryBlue,
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    height: 64,
  },
  bar: {
    flex: 1,
    borderRadius: 4,
  },
});
