import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import PrimaryButton from '../components/ui/PrimaryButton';
import ScreenContainer from '../components/ui/ScreenContainer';
import colors from '../constants/colors';
import spacing from '../constants/spacing';
import { ApiError } from '../lib/api';
import { login } from '../lib/auth';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [mail, setMail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!mail.trim() || !password.trim()) {
      setError('Renseigne email et mot de passe.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const auth = await login({ mail, password });
      await signIn(auth.token, auth.refreshToken, auth.account.id);
      Alert.alert(
        'Connexion réussie',
        `Bienvenue ${auth.account.username}.`,
        [{ text: 'OK', onPress: () => router.replace('/dashboard') }],
      );
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Une erreur est survenue.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.wrapper}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.backArrow}>{'‹'}</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Connexion</Text>
            <View style={styles.headerSpacer} />
          </View>

          <Text style={styles.description}>Connecte-toi pour reprendre ton suivi.</Text>

          <TextInput
            placeholder="Email"
            value={mail}
            onChangeText={setMail}
            style={styles.textInput}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            placeholder="Mot de passe"
            value={password}
            onChangeText={setPassword}
            style={[styles.textInput, styles.mtSmall]}
            secureTextEntry
          />

          <PrimaryButton
            title="Se connecter"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            style={styles.submitButton}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: 24,
    maxWidth: 420,
    padding: spacing.lg,
    width: '100%',
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  backArrow: {
    color: colors.text,
    fontSize: 22,
  },
  headerTitle: {
    color: colors.text,
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 24,
  },
  description: {
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
    borderRadius: 12,
    borderWidth: 1,
    color: colors.text,
    fontSize: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  mtSmall: {
    marginTop: spacing.xs,
  },
  submitButton: {
    marginTop: spacing.lg,
  },
  errorText: {
    color: '#DC2626',
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
