import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ScrollView, Image, SafeAreaView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import spacing from '../../constants/spacing';
import BottomNav from '../../components/ui/BottomNav';
import { useAuth } from '../../context/AuthContext';
import { getUserProfile } from '../../lib/users';

export default function ProfileScreen() {
  const { token, username } = useAuth();
  const [mail, setMail] = useState('');
  const [mainGoal, setMainGoal] = useState('');
  const [trainingExperience, setTrainingExperience] = useState('');

  useEffect(() => {
    if (!token) return;
    getUserProfile(token)
      .then((data) => {
        setMail(data.mail ?? '');
        if (data.profile) {
          setMainGoal(data.profile.main_goal ?? '');
          setTrainingExperience(data.profile.training_experience ?? '');
        }
      })
      .catch(() => {});
  }, [token]);

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
          <MaterialIcons name="settings" size={24} color={colors.contentDark} />
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
              <Image
                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCm0YQH8QoQaaSAl6Nn5u3KORL1bKeipQEgo7zpwkttm37fJWkH1wYjcPkwJwqmFNsuCh3Mms148_iUhyAk7AXixP_Zxy6_eGfXI_pVJHQtYgm2Q6L557Kq70iwUc7tC9x1rNza_mHq3J2geymJ7PlzRYBbIKBY-TwPqnbvrS9eu1TR33PYK3dnVG4mSim9A2M9BtwBjl2d_jTj1LWMoV40q6LLCdOdRaf5Ztrq4ujAOCwjArvbdg7Hm4Oq8L3ngUYO76yxQdnuo1vo' }}
                style={styles.avatar}
              />
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
            <Text style={[styles.statValue, { color: '#7C3AED' }]}>{trainingExperience || '—'}</Text>
          </View>
          <View style={styles.statMiniCard}>
            <Text style={styles.statLabel}>Objectif</Text>
            <Text style={[styles.statValue, { color: colors.primaryBlue }]}>{mainGoal || '—'}</Text>
          </View>
        </View>

        {/* Current Goal */}
        <View style={styles.goalSection}>
          <Text style={styles.sectionTitle}>Objectif actuel</Text>
          <View style={styles.goalCard}>
            <View style={styles.goalDecoCircle} />
            <View style={styles.goalRow}>
              <View>
                <Text style={styles.goalTitle}>Marathon de Paris</Text>
                <Text style={styles.goalSubtitle}>Échéance : 12 Mars</Text>
              </View>
              <View style={styles.goalPercentageBadge}>
                <Text style={styles.goalPercentageText}>80%</Text>
              </View>
            </View>
            <View style={styles.goalProgressBarBg}>
              <View style={[styles.goalProgressBarFill, { width: '80%' }]} />
            </View>
            <Text style={styles.goalProgressText}>60km sur 75km cette semaine</Text>
          </View>
        </View>

        {/* Menu List */}
        <View style={styles.menuList}>
          <TouchableOpacity style={styles.menuItem} activeOpacity={0.8}>
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
  goalPercentageBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  goalPercentageText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primaryBlue,
  },
  goalProgressBarBg: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    width: '100%',
    overflow: 'hidden',
    zIndex: 2,
  },
  goalProgressBarFill: {
    height: '100%',
    backgroundColor: colors.primaryBlue,
    borderRadius: 4,
  },
  goalProgressText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 12,
    zIndex: 2,
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
