import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ScrollView, View, SafeAreaView, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import PrimaryButton from '../../components/ui/PrimaryButton';
import colors from '../../constants/colors';
import spacing from '../../constants/spacing';
import { useOnboarding } from '../../context/OnboardingContext';

const ZONES = [
  { id: 'knee', label: 'Genou', uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBcxjoh32CNky58LSXo29OenhfJbHbMQY5T94glOcjepCEh-8xBsrA9ZHPE42BGLv9StQ64Ur-mxJuOzF51r6kPZ4dta6mM4tHx7njC6XmEf_N8JoCLG-Lcp72aoiNDrD1Cu10hKzvo0wSrvM5QeVputIdXZMbJ2DCEVlL0S_Rc8DDdGfjt0rbasG5NAhAmfVnHs6TlDGfrA26hWAjExaUFHx8L9W9a9BNmODELAJDA1QXEIJj9_brZJHtQVnksJj6dSyzOETcCrNZl' },
  { id: 'back', label: 'Dos', uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBNb6HjTm35KcQq5S3qz_xH5mp9Yy8zOcScfr_z5CSCk0QWdZsA6wEBQEk-443F2KUSRddw-Jr9H7Kfceko5LYVbPcgycpwvXd_jswRjlNCTRgGGIskTLcvFSfomHAvZZcfzTVEbX-Mb7Y1DzdGIEc_GvjUH5pkmpny8fPX8VJg5wMQadN1Yvu74dm-lLSsHYKpHozYGHfjrwAzXoFCqDPz7AqQL8fb33oRAIBeyy2sUHClbGCmWNIzsqh90iCxujgSXUbWEojzsORm' },
  { id: 'shoulder', label: 'Épaule', uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCKyREyHt4NnNZK7Vd47Vh09hMlDZsNIofn4MZ_lqAzeFtm8ClTEoQbwqEX4pmPBwVVhtJNNnTl3n16JFAGKUeeuMikJKNaDtpb34xqjJqHCqTLj8cCBvOS5unVebqdfkZzjNe1KD__Ik9iWwlA91qB32CafEunfJGZeQIKDaLjXuimBEm-8JnyF6gjD_L20ptTu5nbKlKgCqdd1Qhvv_eEDZd_nE6k5v3lZwSenw9rPTp4ppimxHCacLzwhQsePPG7CXBs6HXVgCvn' },
  { id: 'ankle', label: 'Cheville', uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBXiXxrKBJfqs6Deg93f4wDGt-oDeUUXIsMJujvPQerImetZl1xoIXt_SLdssBymvL5G97HSow8JqupZKWpt6c8Vb6dNSAKzD8BYjf0gu_KpLhx1kpAnGLnx9mhjoSGYXXRyXl-s6FQl_iUYzx7FI4Cka539InPi-nn9_ERwF9uhqfUKJI2N4fNm2RO9d0aSwNvWa2Lo5TkiFIZvfU5sSz5EzwMd-KwHoeIU3e3u_i-vcc7sB8nPVLS6yoJv0a8I67CwINfy7ojruok' },
];

export default function BodyMapScreen() {
  const { data, update } = useOnboarding();

  const toggleZone = (id: string) => {
    let newZones = [...(data.protectedZones || [])];
    if (id === 'none') {
      newZones = ['none'];
    } else {
      newZones = newZones.filter(z => z !== 'none');
      if (newZones.includes(id)) {
        newZones = newZones.filter(z => z !== id);
      } else {
        newZones.push(id);
      }
    }
    update({ protectedZones: newZones });
  };

  const isSelected = (id: string) => (data.protectedZones || []).includes(id);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <MaterialIcons name="arrow-back-ios" size={24} color={colors.contentLight} />
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: '50%' }]} />
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>As-tu une zone que tu veux protéger ?</Text>
          <Text style={styles.subtitle}>
            Cela nous aidera à adapter tes séances pour éviter les blessures.
          </Text>
        </View>

        <View style={styles.list}>
          {ZONES.map((zone) => {
            const isActive = isSelected(zone.id);
            return (
              <TouchableOpacity
                key={zone.id}
                style={[styles.row, isActive && styles.rowActive]}
                onPress={() => toggleZone(zone.id)}
                activeOpacity={0.8}
              >
                <View style={styles.rowLeft}>
                  <View style={[styles.imageWrapper, isActive ? styles.imageWrapperActive : {}]}>
                    <Image source={{ uri: zone.uri }} style={styles.rowImage} resizeMode="contain" />
                  </View>
                  <Text style={styles.rowLabel}>{zone.label}</Text>
                </View>
                <View style={[styles.checkbox, isActive && styles.checkboxActive]}>
                  {isActive && <MaterialIcons name="check" size={16} color="#FFF" />}
                </View>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            style={[styles.row, isSelected('none') && styles.rowActive]}
            onPress={() => toggleZone('none')}
            activeOpacity={0.8}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.imageWrapper, { backgroundColor: colors.surfaceLight }]}>
                <MaterialIcons name="sentiment-satisfied" size={28} color={colors.mutedLight} />
              </View>
              <Text style={styles.rowLabel}>Aucune, je suis en pleine forme !</Text>
            </View>
            <View style={[styles.checkbox, isSelected('none') && styles.checkboxActive]}>
              {isSelected('none') && <MaterialIcons name="check" size={16} color="#FFF" />}
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          title="Suivant"
          onPress={() => router.push('/onboarding/limitations')}
          style={styles.continueButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  iconButton: {
    padding: spacing.sm,
    justifyContent: 'center',
  },
  progressContainer: {
    flex: 1,
    paddingRight: 40,
  },
  progressTrack: {
    width: '100%',
    height: 8,
    backgroundColor: colors.surfaceLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primaryBlue,
    borderRadius: 4,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.contentLight,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: colors.mutedLight,
    textAlign: 'center',
    marginTop: spacing.sm,
    maxWidth: 280,
  },
  list: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceLight,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowActive: {
    borderColor: colors.primaryBlue,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  imageWrapper: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageWrapperActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  rowImage: {
    width: 40,
    height: 40,
  },
  rowLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.contentLight,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    borderColor: colors.primaryBlue,
    backgroundColor: colors.primaryBlue,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  continueButton: {
    backgroundColor: colors.primaryBlue,
  },
});
