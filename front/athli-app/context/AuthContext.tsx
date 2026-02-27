import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { clearSession, getSession, persistSession } from '../lib/session';

type AuthState = {
  token: string | null;
  refreshToken: string | null;
  accountId: string | null;
  loading: boolean;
  signIn: (token: string, refreshToken: string, accountId: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSession().then((session) => {
      setToken(session.token);
      setRefreshToken(session.refreshToken);
      setAccountId(session.accountId);
      setLoading(false);
    });
  }, []);

  const value = useMemo(
    () => ({
      token,
      refreshToken,
      accountId,
      loading,
      signIn: async (nextToken: string, nextRefreshToken: string, nextAccountId: string) => {
        await persistSession(nextToken, nextRefreshToken, nextAccountId);
        setToken(nextToken);
        setRefreshToken(nextRefreshToken);
        setAccountId(nextAccountId);
      },
      signOut: async () => {
        await clearSession();
        setToken(null);
        setRefreshToken(null);
        setAccountId(null);
      },
    }),
    [accountId, loading, refreshToken, token],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
