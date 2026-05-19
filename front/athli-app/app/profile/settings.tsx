import { router } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ScrollView, SafeAreaView, Switch, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import spacing from '../../constants/spacing';
import BottomNav from '../../components/ui/BottomNav';
import { useAuth } from '../../context/AuthContext';
import ComingSoonFeature, { ComingSoonItem } from '../../components/ui/ComingSoonFeature';

const COMING_SOON_ITEMS: ComingSoonItem[] = [
  {
    id: 'coach-ia',
    icon: 'smart-toy',
    title: 'Coach IA personnalisé',
    subtitle: 'Recommandations adaptées en temps réel',
  },
  {
    id: 'social',
    icon: 'group',
    title: 'Défis entre amis',
    subtitle: 'Compare tes progrès avec ta communauté',
  },
  {
    id: 'wearable',
    icon: 'watch',
    title: 'Sync montre connectée',
    subtitle: 'Apple Watch & Garmin',
  },
];

export default function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const { signOut } = useAuth();

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color={colors.contentLight} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Paramètres</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Compte & Sécurité */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compte & Sécurité</Text>

          <View style={styles.rowItemContainer}>
            <View style={styles.rowItemLeft}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                <MaterialIcons name="notifications" size={20} color={colors.primaryBlue} />
              </View>
              <View>
                <Text style={styles.rowItemTitle}>Notifications</Text>
                <Text style={styles.rowItemSubtitle}>Alertes de performance & rappels</Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#CBD5E1', true: colors.primaryBlue }}
              thumbColor="#FFF"
            />
          </View>

          <TouchableOpacity style={styles.rowItemContainer} activeOpacity={0.7}>
            <View style={styles.rowItemLeft}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                <MaterialIcons name="lock" size={20} color={colors.primaryBlue} />
              </View>
              <Text style={styles.rowItemTitle}>Confidentialité des données</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.rowItemContainer} activeOpacity={0.7}>
            <View style={styles.rowItemLeft}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                <MaterialIcons name="shield" size={20} color={colors.primaryBlue} />
              </View>
              <Text style={styles.rowItemTitle}>Sécurité du compte</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Données de Santé */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Données de santé</Text>
          <View style={styles.healthCard}>
            <View style={styles.healthCardLeft}>
              <View style={styles.healthIconBox}>
                <Image
                  source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBvabMyhHKUl8nODhYTlesZVNvHftXZSZfrEhT2Vdctb7FBmMUnH3VAU5W41juuGYa2C3b-jo9SkGY3heSNV64dvJAEnDlv185GH_V-rQq2QJgMK9muut4WYsufWfoAV3dA8aeTmGkvz9F_gYz_rC425laEYwfzkLrCfIi-6TyZm2k7l9-Ag7I3UhhhMtNrkTW14Xdc0axrM-2REKk_4kB1150ys2OBdt8YTbcKwfaZXLEXbggiGGYvYTexpthpTDp1lFFBcG0z2F-w' }}
                  style={{ width: 24, height: 24, opacity: 0.8 }}
                />
              </View>
              <View>
                <Text style={styles.healthCardTitle}>Apple Health</Text>
                <Text style={styles.healthCardConnected}>Connecté</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.healthManageBtn}>
              <Text style={styles.healthManageBtnText}>Gérer</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Plus */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Plus</Text>
          <TouchableOpacity style={styles.rowItemContainer} activeOpacity={0.7}>
            <View style={styles.rowItemLeft}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                <MaterialIcons name="info" size={20} color={colors.primaryBlue} />
              </View>
              <Text style={styles.rowItemTitle}>À propos</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.rowItemContainer} activeOpacity={0.7}>
            <View style={styles.rowItemLeft}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                <MaterialIcons name="file-download" size={20} color={colors.primaryBlue} />
              </View>
              <Text style={styles.rowItemTitle}>Exporter mes données</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Ce qui arrive bientôt */}
        <ComingSoonFeature items={COMING_SOON_ITEMS} />

        {/* Danger Zone */}
        <View style={styles.dangerZone}>
          <TouchableOpacity
            style={styles.deleteButton}
            activeOpacity={0.7}
            onPress={async () => {
              await signOut();
              router.replace('/login');
            }}
          >
            <MaterialIcons name="logout" size={20} color="#475569" />
            <Text style={[styles.deleteButtonText, { color: '#475569' }]}>Se déconnecter</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteButton} activeOpacity={0.7}>
            <MaterialIcons name="delete" size={20} color="#EF4444" />
            <Text style={styles.deleteButtonText}>Supprimer mon compte</Text>
          </TouchableOpacity>

          <Text style={styles.appVersion}>Athli.AI v2.4.0 (Build 892)</Text>
        </View>
      </ScrollView>

      {/* Optionally including bottom bar to match HTML, though typically settings is a sub-page */}
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
    backgroundColor: 'rgba(249, 250, 251, 0.9)',
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: 120, // Tab bar margin
  },
  section: {
    marginBottom: 48,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primaryBlue,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  rowItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  rowItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  rowItemSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 2,
  },
  healthCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 16,
  },
  healthCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  healthIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  healthCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  healthCardConnected: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
    marginTop: 2,
  },
  healthManageBtn: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  healthManageBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryBlue,
  },
  dangerZone: {
    marginTop: spacing.xl,
    paddingTop: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginBottom: spacing.xl,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 16,
    paddingVertical: 12,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  appVersion: {
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 32,
  },
});
