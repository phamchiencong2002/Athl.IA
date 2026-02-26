// app/index.tsx
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import PrimaryButton from '../components/ui/PrimaryButton';
import ScreenContainer from '../components/ui/ScreenContainer';
import colors from '../constants/colors';
import spacing from '../constants/spacing';

export default function WelcomeScreen() {
  return (
    <ScreenContainer>
      <View style={styles.wrapper}>
        <View style={styles.card}>
          {/* Logo + tên app */}
          <View style={styles.logoRow}>
            <View style={styles.checkCircle}>
              <Text style={styles.checkText}>✓</Text>
            </View>
            <Text style={styles.appName}>
              Athli.<Text style={styles.appNameAccent}>AI</Text>
            </Text>
          </View>

          <View style={styles.heroPlaceholder} />

          <Text style={styles.title}>
            Ton coach intelligent,{'\n'}adapté à ta forme du jour.
          </Text>

          <View style={styles.dotsRow}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>

          <PrimaryButton
            title="Commencer l'aventure"
            onPress={() => router.push('/onboarding/profile')}
            style={styles.startButton}
          />

          {/* Login */}
          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Déjà un compte ? </Text>
            <TouchableOpacity onPress={() => router.push('/login')}>
              <Text style={styles.loginLink}>Se connecter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',        
  },
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.lg,
    width: '100%',               
    maxWidth: 420,               
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  checkText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  appName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  appNameAccent: {
    color: colors.primary,
  },
  heroPlaceholder: {
    height: 220,
    borderRadius: 24,
    backgroundColor: '#020617',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.dotInactive,
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: colors.dotActive,
    width: 16,
  },
  startButton: {
    marginBottom: spacing.sm,
  },
  loginRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  loginText: {
    color: colors.textMuted,
  },
  loginLink: {
    fontWeight: '600',
    color: colors.text,
  },
});
