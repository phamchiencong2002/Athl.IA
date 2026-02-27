import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import ScreenContainer from '../components/ui/ScreenContainer';
import colors from '../constants/colors';
import spacing from '../constants/spacing';
import { useAuth } from '../context/AuthContext';
import { listSessions, Session } from '../lib/workouts';

export default function HistoryScreen() {
  const { accountId } = useAuth();
  const [sessions, setSessions] = useState<Array<Session & { rpe_reported?: number | null }>>([]);

  useEffect(() => {
    if (!accountId) return;
    listSessions(accountId).then(setSessions).catch(() => setSessions([]));
  }, [accountId]);

  return (
    <ScreenContainer>
      <Text style={styles.title}>Historique</Text>
      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.meta}>{item.session_date} | {item.status} | RPE: {item.rpe_reported ?? '-'}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Aucune seance pour le moment.</Text>}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 24, fontWeight: '700', marginBottom: spacing.md },
  row: { backgroundColor: colors.cardBg, borderRadius: 14, padding: spacing.md, marginBottom: spacing.sm },
  name: { color: colors.text, fontWeight: '700' },
  meta: { color: colors.textMuted },
  empty: { color: colors.textMuted },
});
