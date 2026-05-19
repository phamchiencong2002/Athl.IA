import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View, ScrollView, Image, SafeAreaView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import spacing from '../../constants/spacing';
import BottomNav from '../../components/ui/BottomNav';
import { useAuth } from '../../context/AuthContext';
import { getUserProfile } from '../../lib/users';

const GOAL_LABELS: Record<string, string> = {
  muscle: 'Prise de muscle',
  weight_loss: 'Perte de poids',
  fitness: 'Remise en forme',
  performance: 'Performance',
  mobility: 'Mobilité / Souplesse',
  rehab: 'Rééducation légère',
};

const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Débutant',
  intermediate: 'Intermédiaire',
  advanced: 'Avancé',
};

export default function ProfileScreen() {
  const { token, username } = useAuth();
  const [mail, setMail] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [mainGoal, setMainGoal] = useState('');
  const [trainingExperience, setTrainingExperience] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    getUserProfile(token)
      .then((data) => {
        setMail(data.mail ?? '');
        setAvatar(data.avatar ?? null);
        if (data.profile) {
          setMainGoal(data.profile.main_goal ?? '');
          setTrainingExperience(data.profile.training_experience ?? '');
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const goalLabel = GOAL_LABELS[mainGoal] ?? mainGoal;
  const levelLabel = LEVEL_LABELS[trainingExperience] ?? trainingExperience;

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primaryBlue} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil</Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => router.push('/profile/settings')}
          activeOpacity={0.8}
        >
          <MaterialIcons name="settings" size={24} color={colors.contentLight} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User Info */}
        <TouchableOpacity
          style={styles.userInfoSection}
          onPress={() => router.push('/profile/edit')}
          activeOpacity={0.9}
        >
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarGradient}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text style={styles.avatarInitial}>
                    {(username ?? '?')[0].toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.verifiedBadge}>
              <MaterialIcons name="verified" size={14} color="#FFF" />
            </View>
          </View>
          <View style={styles.userTextCont}>
            <Text style={styles.userName}>{username ?? ''}</Text>
            <Text style={styles.userEmail}>{mail}</Text>
          </View>
        </TouchableOpacity>

        {/* Stats Quick Row */}
        <View style={styles.statsRow}>
          <View style={styles.statMiniCard}>
            <Text style={styles.statLabel}>Niveau</Text>
            <Text style={[styles.statValue, { color: '#7C3AED' }]}>{levelLabel || '—'}</Text>
          </View>
          <View style={styles.statMiniCard}>
            <Text style={styles.statLabel}>Objectif</Text>
            <Text style={[styles.statValue, { color: colors.primaryBlue }]}>{goalLabel || '—'}</Text>
          </View>
        </View>

        {/* Current Goal */}
        {mainGoal ? (
          <View style={styles.goalSection}>
            <Text style={styles.sectionTitle}>Objectif actuel</Text>
            <View style={styles.goalCard}>
              <View style={styles.goalDecoCircle} />
              <View style={styles.goalRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.goalTitle}>{goalLabel}</Text>
                  {trainingExperience ? (
                    <Text style={styles.goalSubtitle}>Niveau : {levelLabel}</Text>
                  ) : null}
                </View>
              </View>
            </View>
          </View>
        ) : null}

        {/* Menu List */}
        <View style={styles.menuList}>
          <TouchableOpacity
            style={[styles.menuItem, { opacity: 0.5 }]}
            activeOpacity={0.8}
            disabled
          >
            <View style={[styles.menuIconBox, { backgroundColor: '#FFF7ED' }]}>
              <MaterialIcons name="military-tech" size={24} color="#F97316" />
            </View>
            <Text style={styles.menuItemText}>Abonnement Premium</Text>
            <MaterialIcons name="chevron-right" size={24} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} activeOpacity={0.8} onPress={() => router.push('/stats')}>
            <View style={[styles.menuIconBox, { backgroundColor: '#EFF6FF' }]}>
              <MaterialIcons name="insights" size={24} color="#3B82F6" />
            </View>
            <Text style={styles.menuItemText}>Statistiques détaillées</Text>
            <MaterialIcons name="chevron-right" size={24} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} activeOpacity={0.8} onPress={() => router.push('/weight')}>
            <View style={[styles.menuIconBox, { backgroundColor: '#F0FDF4' }]}>
              <MaterialIcons name="monitor-weight" size={24} color="#22C55E" />
            </View>
            <Text style={styles.menuItemText}>Suivi du poids</Text>
            <MaterialIcons name="chevron-right" size={24} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.8}
            onPress={() => router.push('/profile/settings')}
          >
            <View style={[styles.menuIconBox, { backgroundColor: '#F8FAFC' }]}>
              <MaterialIcons name="tune" size={24} color="#64748B" />
            </View>
            <Text style={styles.menuItemText}>Paramètres</Text>
            <MaterialIcons name="chevron-right" size={24} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <BottomNav activeTab="profile" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
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
  scrollContent: {
    paddingBottom: 120, // Tab Bar space
  },
  userInfoSection: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  avatarGradient: {
    width: 112,
    height: 112,
    borderRadius: 32,
    backgroundColor: colors.primaryBlue, // Mock gradient with solid for now
    padding: 4,
    shadowColor: colors.primaryBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
  },
  avatarFallback: {
    backgroundColor: colors.primaryBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFF',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: colors.primaryBlue,
    width: 28,
    height: 28,
    borderRadius: 12,
    borderWidth: 4,
    borderColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userTextCont: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  userEmail: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  statMiniCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  goalSection: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  goalCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  goalDecoCircle: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
  },
  goalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    zIndex: 2,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  goalSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
    fontStyle: 'italic',
  },
  menuList: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    gap: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F8FAFC',
    gap: 16,
  },
  menuIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
  },
});
