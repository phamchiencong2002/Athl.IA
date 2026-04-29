// app/index.tsx
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View, Image, Dimensions } from 'react-native';
import PrimaryButton from '../components/ui/PrimaryButton';
import ScreenContainer from '../components/ui/ScreenContainer';
import colors from '../constants/colors';
import spacing from '../constants/spacing';
import { useAuth } from '../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
  const { token, loading } = useAuth();

  useEffect(() => {
    if (!loading && token) {
      router.replace('/dashboard');
    }
  }, [token, loading]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.wrapper, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primaryBlue} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.wrapper}>
      <View style={styles.container}>
        {/* Logo Section */}
        <View style={styles.logoRow}>
          <Text style={styles.appName}>
            Athli<Text style={styles.appNameAccent}>.AI</Text>
          </Text>
        </View>

        {/* Main Content: Visual + Text */}
        <View style={styles.mainContent}>
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDAvnTN7dl7wBblKsoLi8llHdTHCh27sArNfwQnQn-mcZOhe5d5TuwoUTs-GCIaPuUYeOec0c7QABkVfINuCO2PRNyvUREDWR4MXWyD_36fQ5vA-sbCD84WpU46bo3HSJQoBrPCmwCjzyQKWFHWduni0cqZkfdBtZvp1ckml2UAfa19HCIxkQNSJwzeeJynADcf8JilcxxZ6iQqYp5dZ2ttfJhWbxri8cGo3DJNWqz8Rs_Aok0xjzoV0t3G9o2ZWaHHL9hjsdPyBqsX' }}
              style={styles.heroImage}
              resizeMode="cover"
            />
          </View>
          <Text style={styles.title}>
            Ton coach intelligent, adapté à ta forme du jour.
          </Text>
        </View>

        {/* Bottom Section: CTA + Login */}
        <View style={styles.bottomSection}>
          <View style={styles.dotsRow}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>

          <PrimaryButton
            title={token ? 'Aller au dashboard' : "Commencer l'aventure"}
            onPress={() => router.push(token ? '/dashboard' : '/onboarding/profile')}
            style={styles.startButton}
            textStyle={styles.startButtonText}
          />

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Déjà un compte ? </Text>
            <TouchableOpacity onPress={() => router.push('/login')}>
              <Text style={styles.loginLink}>Se connecter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  container: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoRow: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.contentLight,
    letterSpacing: -0.5,
  },
  appNameAccent: {
    color: colors.primaryBlue,
  },
  mainContent: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  imageContainer: {
    width: width * 0.75,
    maxWidth: 320,
    aspectRatio: 1,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.contentLight,
    textAlign: 'center',
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  bottomSection: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: spacing.lg,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 5,
  },
  dotActive: {
    backgroundColor: colors.primaryBlue,
    width: 24,
  },
  startButton: {
    width: '100%',
    maxWidth: 380,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primaryBlue,
    shadowColor: colors.primaryBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: spacing.lg,
  },
  startButtonText: {
    fontSize: 18,
    letterSpacing: 0.5,
  },
  loginRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.mutedLight,
  },
  loginLink: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primaryBlue,
  },
});
