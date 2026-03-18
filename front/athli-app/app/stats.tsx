import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ScrollView, SafeAreaView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import colors from '../constants/colors';
import spacing from '../constants/spacing';
import BottomNav from '../components/ui/BottomNav';

export default function StatsScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color={colors.contentDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analyse de ta forme</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Main Score Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View>
              <Text style={styles.heroSubtitle}>Score Readiness</Text>
              <Text style={styles.heroScore}>84</Text>
            </View>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>Athli.AI</Text>
            </View>
          </View>
          <View style={styles.heroStatusRow}>
            <View style={styles.heroStatusDot} />
            <Text style={styles.heroStatusText}>Excellente forme</Text>
          </View>
          <View style={styles.heroCardGlow} />
        </View>

        {/* IA Advice Card */}
        <View style={styles.adviceCard}>
          <View style={styles.adviceIconBox}>
            <MaterialIcons name="psychology" size={20} color="#FFF" />
          </View>
          <View style={styles.adviceTextCont}>
            <Text style={styles.adviceTitle}>Conseil de l'IA</Text>
            <Text style={styles.adviceText}>
              Aujourd'hui, mise sur une séance d'intensité modérée. Ton corps est prêt pour l'effort mais une récupération active optimisera tes performances de demain.
            </Text>
          </View>
        </View>

        {/* Score Breakdown */}
        <View style={styles.breakdownSection}>
          <Text style={styles.breakdownTitle}>Répartition du score</Text>

          {/* Sommeil */}
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <View style={styles.statIdent}>
                <MaterialIcons name="bedtime" size={20} color="#10B981" />
                <Text style={styles.statName}>Sommeil</Text>
              </View>
              <Text style={[styles.statValue, { color: '#10B981' }]}>85/100</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { backgroundColor: '#10B981', width: '85%' }]} />
            </View>
            <Text style={styles.statDesc}>Sommeil profond suffisant, récupération optimale.</Text>
          </View>

          {/* Stress */}
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <View style={styles.statIdent}>
                <MaterialIcons name="favorite" size={20} color="#7C3AED" />
                <Text style={styles.statName}>Stress</Text>
              </View>
              <Text style={[styles.statValue, { color: '#7C3AED' }]}>62/100</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { backgroundColor: '#7C3AED', width: '62%' }]} />
            </View>
            <Text style={styles.statDesc}>Vitesse de variation cardiaque stable.</Text>
          </View>

          {/* Fatigue */}
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <View style={styles.statIdent}>
                <MaterialIcons name="battery-charging-full" size={20} color={colors.primaryBlue} />
                <Text style={styles.statName}>Fatigue</Text>
              </View>
              <Text style={[styles.statValue, { color: colors.primaryBlue }]}>78/100</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { backgroundColor: colors.primaryBlue, width: '78%' }]} />
            </View>
            <Text style={styles.statDesc}>Légère fatigue musculaire détectée.</Text>
          </View>
        </View>

        {/* History Button */}
        <TouchableOpacity style={styles.historyBtn} activeOpacity={0.8}>
          <MaterialIcons name="history" size={20} color={colors.contentDark} />
          <Text style={styles.historyBtnText}>Voir les détails historiques</Text>
        </TouchableOpacity>
      </ScrollView>

      <BottomNav activeTab="stats" />
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
  iconButton: {
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: -0.5,
  },
  spacer: {
    width: 44,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 120, // Leave space for nav
    gap: spacing.xl,
  },
  heroCard: {
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
    position: 'relative',
    overflow: 'hidden',
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xl,
    zIndex: 2,
  },
  heroSubtitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  heroScore: {
    fontSize: 60,
    fontWeight: '900',
    color: '#1E293B',
    lineHeight: 64,
    letterSpacing: -2,
  },
  heroBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryBlue,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 2,
  },
  heroStatusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
  },
  heroStatusText: {
    fontSize: 19,
    fontWeight: '800',
    color: '#1E293B',
  },
  heroCardGlow: {
    position: 'absolute',
    bottom: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(59, 130, 246, 0.1)', // Simplification of gradient blur glow
    zIndex: 1,
  },
  adviceCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 28,
    padding: spacing.xl,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  adviceIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primaryBlue,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primaryBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  adviceTextCont: {
    flex: 1,
  },
  adviceTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primaryBlue,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  adviceText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
    marginTop: 6,
    lineHeight: 22,
  },
  breakdownSection: {
    gap: 16,
    paddingTop: 8,
  },
  breakdownTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 4,
  },
  statCard: {
    backgroundColor: '#FFF',
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIdent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  statValue: {
    fontSize: 15,
    fontWeight: '900',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  statDesc: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
    lineHeight: 18,
  },
  historyBtn: {
    width: '100%',
    height: 64,
    backgroundColor: '#F1F5F9',
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 8,
  },
  historyBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
  },
});
