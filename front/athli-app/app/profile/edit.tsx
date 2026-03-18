import { router } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ScrollView, Image, SafeAreaView, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import spacing from '../../constants/spacing';
import PrimaryButton from '../../components/ui/PrimaryButton';

export default function EditProfileScreen() {
  const [firstName, setFirstName] = useState('Alex');
  const [email, setEmail] = useState('alex.fit@example.com');
  const [objective, setObjective] = useState('Hypertrophie');
  const [level, setLevel] = useState('Avancé');

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color={colors.contentDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Modifier le Profil</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Picture Section */}
        <View style={styles.pictureSection}>
          <TouchableOpacity style={styles.avatarContainer} activeOpacity={0.8}>
            <Image
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDAUE6-d_h6UP3FcdoHAIduQlwCQzNwhpcEdBbqAvH7eY7Whzf6b-RVNEEu7uIKtTr3v6FGtDBujQ_oehAPMEQHk3VIRG7zg0_o4OXwoC_Q5vHgF-zjilHQW1WBUqRU9IRvv2XoH5K4lVPlCTzk5gIRdsemkm2axkvwDdhRaXvP0gmV-MlxELN4d5F5TOZRFURGFxRnTF-wlqOGkf3rjhBwKNGttliCI7IJ3k85FXIyJ73ylZxGQtAlHUPVLFooJIUcqldQj1aN-Y2g' }}
              style={styles.avatarImg}
            />
            <View style={styles.cameraBadge}>
              <MaterialIcons name="photo-camera" size={16} color="#FFF" />
            </View>
          </TouchableOpacity>
          <View style={styles.nameHeader}>
            <Text style={styles.nameHeaderTitle}>Alex</Text>
            <TouchableOpacity>
              <Text style={styles.editPhotoText}>Modifier la photo</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Form Fields */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Prénom</Text>
          <TextInput
            style={styles.input}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Prénom"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Goal Selection */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Objectif</Text>
          <View style={styles.gridCards}>
            <TouchableOpacity
              style={[styles.objectiveCard, objective === 'Hypertrophie' && styles.objectiveCardActive]}
              onPress={() => setObjective('Hypertrophie')}
              activeOpacity={0.8}
            >
              <MaterialIcons
                name="fitness-center"
                size={32}
                color={objective === 'Hypertrophie' ? colors.primaryBlue : '#94A3B8'}
              />
              <Text style={[styles.objectiveCardText, objective === 'Hypertrophie' && styles.objectiveCardTextActive]}>
                Hypertrophie
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.objectiveCard, objective === 'Perte de poids' && styles.objectiveCardActive]}
              onPress={() => setObjective('Perte de poids')}
              activeOpacity={0.8}
            >
              <MaterialIcons
                name="bolt"
                size={32}
                color={objective === 'Perte de poids' ? colors.primaryBlue : '#94A3B8'}
              />
              <Text style={[styles.objectiveCardText, objective === 'Perte de poids' && styles.objectiveCardTextActive]}>
                Perte de poids
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Level Selection */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Niveau</Text>

          <TouchableOpacity
            style={[styles.levelCard, level === 'Intermédiaire' && styles.levelCardActive]}
            onPress={() => setLevel('Intermédiaire')}
            activeOpacity={0.8}
          >
            <View style={styles.levelCardLeft}>
              <MaterialIcons
                name="directions-run"
                size={24}
                color={level === 'Intermédiaire' ? colors.primaryBlue : '#94A3B8'}
              />
              <Text style={[styles.levelCardText, level === 'Intermédiaire' && styles.levelCardTextActive]}>
                Intermédiaire
              </Text>
            </View>
            <View style={[styles.radioCircle, level === 'Intermédiaire' && styles.radioCircleActive]}>
              {level === 'Intermédiaire' && <MaterialIcons name="check" size={14} color="#FFF" />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.levelCard, level === 'Avancé' && styles.levelCardActive]}
            onPress={() => setLevel('Avancé')}
            activeOpacity={0.8}
          >
            <View style={styles.levelCardLeft}>
              <MaterialIcons
                name="military-tech"
                size={24}
                color={level === 'Avancé' ? colors.primaryBlue : '#94A3B8'}
              />
              <Text style={[styles.levelCardText, level === 'Avancé' && styles.levelCardTextActive]}>
                Avancé
              </Text>
            </View>
            <View style={[styles.radioCircle, level === 'Avancé' && styles.radioCircleActive]}>
              {level === 'Avancé' && <MaterialIcons name="check" size={14} color="#FFF" />}
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <View style={styles.floatingContainer}>
        <PrimaryButton
          title="Sauvegarder les modifications"
          onPress={() => router.back()}
        />
      </View>
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
    paddingBottom: 140, // Space for floating button
  },
  pictureSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  avatarContainer: {
    position: 'relative',
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 4,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primaryBlue,
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  nameHeader: {
    alignItems: 'center',
  },
  nameHeaderTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  editPhotoText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primaryBlue,
  },
  formGroup: {
    marginBottom: spacing.xl,
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
    marginLeft: 4,
  },
  input: {
    height: 56,
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#0F172A',
  },
  gridCards: {
    flexDirection: 'row',
    gap: 12,
  },
  objectiveCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#F1F5F9',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  objectiveCardActive: {
    borderColor: colors.primaryBlue,
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
  },
  objectiveCardText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  objectiveCardTextActive: {
    color: colors.primaryBlue,
    fontWeight: '800',
  },
  levelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#F1F5F9',
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
  },
  levelCardActive: {
    borderColor: colors.primaryBlue,
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
  },
  levelCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  levelCardText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  levelCardTextActive: {
    color: '#0F172A',
    fontWeight: '800',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: colors.primaryBlue,
    backgroundColor: colors.primaryBlue,
  },
  floatingContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.xl,
    paddingTop: 32,
    backgroundColor: 'rgba(249, 250, 251, 0.95)',
  },
});
