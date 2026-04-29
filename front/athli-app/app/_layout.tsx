import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { OnboardingProvider } from '../context/OnboardingContext';
import { setRefreshHandlers } from '../lib/api';
import { persistSession } from '../lib/session';

function TokenSyncProvider({ children }: { children: React.ReactNode }) {
  const { refreshToken, signIn, accountId, username } = useAuth();

  useEffect(() => {
    setRefreshHandlers(refreshToken, async (newToken, newRefreshToken) => {
      // Persist and update context when a silent refresh succeeds
      if (accountId && username) {
        await persistSession(newToken, newRefreshToken, accountId, username);
        await signIn(newToken, newRefreshToken, accountId, username);
      }
    });
  }, [refreshToken, accountId, username, signIn]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <OnboardingProvider>
          <TokenSyncProvider>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false }} />
          </TokenSyncProvider>
        </OnboardingProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
