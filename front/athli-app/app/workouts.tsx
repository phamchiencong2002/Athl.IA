import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ScrollView, Image, SafeAreaView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import colors from '../constants/colors';
import spacing from '../constants/spacing';
import BottomNav from '../components/ui/BottomNav';

export default function WorkoutsScreen() {
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

      {/* Page Title & Date */}
      <View style={styles.titleSection}>
        <Text style={styles.pageTitle}>Planning Hebdomadaire</Text>
        <Text style={styles.pageSubtitle}>Semaine du 12 au 18 Juin</Text>
      </View>

      {/* Horizontal Calendar */}
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.calendarScroll}
        >
          {/* Active Day */}
          <View style={[styles.dayCard, styles.dayCardActive]}>
            <Text style={[styles.dayName, styles.dayNameActive]}>Lun</Text>
            <Text style={[styles.dayNumber, styles.dayNumberActive]}>12</Text>
          </View>
          {/* Inactive Days */}
          <View style={styles.dayCard}>
            <Text style={styles.dayName}>Mar</Text>
            <Text style={styles.dayNumber}>13</Text>
          </View>
          <View style={styles.dayCard}>
            <Text style={styles.dayName}>Mer</Text>
            <Text style={styles.dayNumber}>14</Text>
          </View>
          <View style={styles.dayCard}>
            <Text style={styles.dayName}>Jeu</Text>
            <Text style={styles.dayNumber}>15</Text>
          </View>
          <View style={styles.dayCard}>
            <Text style={styles.dayName}>Ven</Text>
            <Text style={styles.dayNumber}>16</Text>
          </View>
          <View style={styles.dayCard}>
            <Text style={styles.dayName}>Sam</Text>
            <Text style={styles.dayNumber}>17</Text>
          </View>
          <View style={styles.dayCard}>
            <Text style={styles.dayName}>Dim</Text>
            <Text style={styles.dayNumber}>18</Text>
          </View>
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Séances de la semaine</Text>
          <Text style={styles.listSubtitle}>3 séances</Text>
        </View>

        {/* Lundi Card (Completed) */}
        <View style={styles.sessionCard}>
          <View style={styles.sessionRow}>
            <View style={styles.sessionInfo}>
              <View style={styles.badgeRow}>
                <View style={styles.badgeCompleted}>
                  <Text style={styles.badgeCompletedText}>Complété</Text>
                </View>
                <MaterialIcons name="check-circle" size={16} color="#10B981" />
              </View>
              <Text style={styles.sessionTitle}>Lundi - Force</Text>
              <View style={styles.sessionMeta}>
                <Text style={styles.sessionMetaText}><MaterialIcons name="schedule" size={14} /> 45 min</Text>
                <Text style={styles.sessionMetaText}><MaterialIcons name="bolt" size={14} /> Haute</Text>
              </View>
            </View>
            <View style={styles.sessionImageContainer}>
              <Image
                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBd-ppCd9S3ZYSjDLo1ZM3sPMJ8iJlm-dAo5_6T2qx7AyveKursbV9Hv3_qKuwOJntp7-XW6zZBTTNZAXHOLhP7DtVwMyRQMXHPqsj4glfK_U-4RKZldgSYw3WnO1kujhaiE4_FzUo7DC34rJjKQwXKhuEGgjhhaDQaeQSmfQ3YkItyvvc3Lv7shqz_Ra0dN28OzLOdfEYhpYpe2qbggrv_H5wc3k3DR7X8HLkgqF7SHLrv2p-C77suNPONgzwslef_iPHWXJGpUc3U' }}
                style={styles.sessionImage}
              />
            </View>
          </View>
          <View style={styles.cardActions}>
            <TouchableOpacity style={styles.secondaryBtn}>
              <Text style={styles.secondaryBtnText}>Détails</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn}>
              <MaterialIcons name="share" size={20} color={colors.primaryBlue} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Mardi Card (Rest) */}
        <View style={styles.restCard}>
          <View style={styles.restInfo}>
            <View style={styles.restIconBox}>
              <MaterialIcons name="bedtime" size={24} color={colors.mutedLight} />
            </View>
            <View>
              <Text style={styles.restTitle}>Mardi - Repos</Text>
              <Text style={styles.restSubtitle}>Récupération active conseillée</Text>
            </View>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#CBD5E1" />
        </View>

        {/* Mercredi Card (Upcoming) */}
        <View style={[styles.sessionCard, styles.upcomingSessionCard]}>
          <View style={styles.upcomingIndicator} />
          <View style={styles.sessionRow}>
            <View style={styles.sessionInfo}>
              <View style={styles.badgeRow}>
                <View style={styles.badgeUpcoming}>
                  <Text style={styles.badgeUpcomingText}>À venir</Text>
                </View>
              </View>
              <Text style={styles.sessionTitle}>Mercredi - Cardio</Text>
              <View style={styles.sessionMeta}>
                <Text style={styles.sessionMetaText}><MaterialIcons name="schedule" size={14} /> 30 min</Text>
                <Text style={styles.sessionMetaText}><MaterialIcons name="bolt" size={14} /> Moyenne</Text>
              </View>
            </View>
            <View style={styles.sessionImageContainer}>
              <Image
                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCQwZoinVzGqvBiGRy0OAoYYcCtQPTvDMvVOQUNKQBr22VAGBfVqv4z0wDd49p1v4thZNJkW0yYA22fJPQT55q8ShEnl_9ZvrZUYwNYzDifu3uprV8xW7OMuMWaMY5Jg_PZlLu8P9DiJoFNf_uYlDJQV5AVUWqH8d37NR8DZnQ-eGCgsfy_0YD6QvQVw0I2uY79AnWjae0Chh4CdSZxSxd-p8IcnWlL1k1mqhdtFyiIZR-rAGiFk27nSarpQZUwE_Uj3NGuXJyprz_V' }}
                style={styles.sessionImage}
              />
            </View>
          </View>
          <TouchableOpacity style={styles.primaryActionButton} activeOpacity={0.8}>
            <MaterialIcons name="play-circle-outline" size={24} color="#FFF" />
            <Text style={styles.primaryActionText}>Démarrer la séance</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      <BottomNav activeTab="workouts" />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  calendarIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
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
  titleSection: {
    paddingHorizontal: spacing.xl,
    paddingTop: 8,
    paddingBottom: 8,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1E293B',
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 2,
  },
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
  },
  dayCardActive: {
    backgroundColor: colors.primaryBlue, // solid color as gradient replacement
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
    marginBottom: 4,
  },
  dayNameActive: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  dayNumber: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1E293B',
  },
  dayNumberActive: {
    color: '#FFF',
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: 120, // Leave space for nav
    gap: spacing.xl,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#1E293B',
  },
  listSubtitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
  },
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
  upcomingSessionCard: {
    position: 'relative',
    overflow: 'hidden',
  },
  upcomingIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 6,
    backgroundColor: colors.primaryBlue,
  },
  sessionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  sessionInfo: {
    flex: 1,
    gap: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgeCompleted: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeCompletedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
    textTransform: 'uppercase',
  },
  badgeUpcoming: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeUpcomingText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primaryBlue,
    textTransform: 'uppercase',
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  sessionMeta: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  sessionMetaText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  sessionImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: '#F8FAFC',
  },
  sessionImage: {
    width: '100%',
    height: '100%',
  },
  cardActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  secondaryBtn: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#475569',
  },
  iconBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  restCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    padding: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  restInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  restIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  restTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E293B',
  },
  restSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#94A3B8',
    marginTop: 2,
  },
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
  primaryActionText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
