import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import colors from '../constants/colors';
import spacing from '../constants/spacing';
import { useAuth } from '../context/AuthContext';
import { listWeightLogs, addWeightLog, WeightLog } from '../lib/weight';

const CHART_HEIGHT = 90;
const CHART_ITEMS = 14;

function MiniChart({ logs }: { logs: WeightLog[] }) {
  const slice = logs.slice(-CHART_ITEMS);
  if (slice.length < 2) return null;

  const weights = slice.map((l) => l.weight_kg);
  const min = Math.min(...weights) - 0.5;
  const max = Math.max(...weights) + 0.5;
  const range = max - min || 1;

  return (
    <View style={chartStyles.container}>
      <View style={chartStyles.bars}>
        {slice.map((log, i) => {
          const barH = Math.max(8, ((log.weight_kg - min) / range) * CHART_HEIGHT);
          const isLatest = i === slice.length - 1;
          return (
            <View key={log.id} style={chartStyles.barWrapper}>
              <View
                style={[
                  chartStyles.bar,
                  { height: barH, backgroundColor: isLatest ? colors.primaryBlue : '#DBEAFE' },
                ]}
              />
            </View>
          );
        })}
      </View>
      <View style={chartStyles.axisRow}>
        <Text style={chartStyles.axisLabel}>{min.toFixed(1)} kg</Text>
        <Text style={chartStyles.axisLabel}>{max.toFixed(1)} kg</Text>
      </View>
    </View>
  );
}

const chartStyles = StyleSheet.create({
  container: { gap: 8 },
  bars: {
    height: CHART_HEIGHT,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  barWrapper: { flex: 1, justifyContent: 'flex-end' },
  bar: { borderRadius: 6, width: '100%' },
  axisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  axisLabel: { fontSize: 10, fontWeight: '600', color: '#94A3B8' },
});

export default function WeightScreen() {
  const { token } = useAuth();
  const [logs, setLogs] = useState<WeightLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [input, setInput] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const data = await listWeightLogs(token);
      setLogs(data);
    } catch {
      Alert.alert('Erreur', 'Impossible de charger les données.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const handleRefresh = () => { setRefreshing(true); load(); };

  const handleAdd = async () => {
    const value = parseFloat(input.replace(',', '.'));
    if (isNaN(value) || value <= 0 || value > 500) {
      Alert.alert('Valeur invalide', 'Entrez un poids entre 1 et 500 kg.');
      return;
    }
    if (!token) return;
    setSaving(true);
    try {
      const newLog = await addWeightLog(token, value);
      setLogs((prev) => [...prev, newLog]);
      setInput('');
    } catch {
      Alert.alert('Erreur', 'Impossible d\'enregistrer le poids.');
    } finally {
      setSaving(false);
    }
  };

  const latest = logs[logs.length - 1];
  const previous = logs[logs.length - 2];
  const delta = latest && previous ? latest.weight_kg - previous.weight_kg : null;

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primaryBlue} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Suivi du poids</Text>
          <View style={styles.spacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        >
          {/* Current weight hero */}
          <View style={styles.heroCard}>
            <Text style={styles.heroLabel}>Poids actuel</Text>
            <View style={styles.heroRow}>
              <Text style={styles.heroWeight}>
                {latest ? `${latest.weight_kg} kg` : '—'}
              </Text>
              {delta !== null && (
                <View style={[styles.deltaBadge, { backgroundColor: delta <= 0 ? '#D1FAE5' : '#FEE2E2' }]}>
                  <MaterialIcons
                    name={delta <= 0 ? 'trending-down' : 'trending-up'}
                    size={16}
                    color={delta <= 0 ? '#10B981' : '#EF4444'}
                  />
                  <Text style={[styles.deltaText, { color: delta <= 0 ? '#10B981' : '#EF4444' }]}>
                    {delta > 0 ? '+' : ''}{delta.toFixed(1)} kg
                  </Text>
                </View>
              )}
            </View>
            {latest && (
              <Text style={styles.heroDate}>
                Enregistré le {new Date(latest.log_date).toLocaleDateString('fr-FR')}
              </Text>
            )}
          </View>

          {/* Chart */}
          {logs.length >= 2 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Évolution ({Math.min(logs.length, CHART_ITEMS)} dernières entrées)</Text>
              <MiniChart logs={logs} />
            </View>
          )}

          {/* Add entry */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Ajouter une entrée</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={input}
                onChangeText={setInput}
                placeholder="Ex: 74.5"
                keyboardType="decimal-pad"
                returnKeyType="done"
                onSubmitEditing={handleAdd}
              />
              <Text style={styles.inputUnit}>kg</Text>
              <TouchableOpacity
                style={[styles.addBtn, saving && styles.addBtnDisabled]}
                onPress={handleAdd}
                disabled={saving}
                activeOpacity={0.8}
              >
                {saving
                  ? <ActivityIndicator size="small" color="#FFF" />
                  : <MaterialIcons name="add" size={24} color="#FFF" />}
              </TouchableOpacity>
            </View>
          </View>

          {/* History */}
          {logs.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Historique</Text>
              <View style={styles.historyList}>
                {[...logs].reverse().map((log, i, reversed) => {
                  const prev = reversed[i + 1];
                  const d = prev ? log.weight_kg - prev.weight_kg : null;
                  return (
                    <View key={log.id} style={styles.historyRow}>
                      <View style={styles.historyDot} />
                      <View style={styles.historyInfo}>
                        <Text style={styles.historyDate}>
                          {new Date(log.log_date).toLocaleDateString('fr-FR', {
                            weekday: 'short', day: 'numeric', month: 'short',
                          })}
                        </Text>
                      </View>
                      <View style={styles.historyRight}>
                        <Text style={styles.historyWeight}>{log.weight_kg} kg</Text>
                        {d !== null && (
                          <Text style={[styles.historyDelta, { color: d <= 0 ? '#10B981' : '#EF4444' }]}>
                            {d > 0 ? '+' : ''}{d.toFixed(1)}
                          </Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {logs.length === 0 && (
            <View style={styles.emptyState}>
              <MaterialIcons name="monitor-weight" size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>{"Aucune entrée pour l'instant."}</Text>
              <Text style={styles.emptySubtext}>Ajoutez votre premier poids ci-dessus.</Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5 },
  spacer: { width: 44 },
  scroll: { paddingHorizontal: spacing.xl, paddingBottom: 40, gap: spacing.lg },
  heroCard: {
    backgroundColor: colors.primaryBlue,
    borderRadius: 28,
    padding: spacing.xl,
  },
  heroLabel: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  heroWeight: { fontSize: 48, fontWeight: '900', color: '#FFF', letterSpacing: -2 },
  deltaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  deltaText: { fontSize: 13, fontWeight: '800' },
  heroDate: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.6)' },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    height: 52,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  inputUnit: { fontSize: 16, fontWeight: '700', color: '#64748B', minWidth: 24 },
  addBtn: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.primaryBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnDisabled: { opacity: 0.6 },
  historyList: { gap: 0 },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  historyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primaryBlue,
  },
  historyInfo: { flex: 1 },
  historyDate: { fontSize: 14, fontWeight: '600', color: '#334155' },
  historyRight: { alignItems: 'flex-end', gap: 2 },
  historyWeight: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  historyDelta: { fontSize: 12, fontWeight: '700' },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
    gap: spacing.md,
  },
  emptyText: { fontSize: 16, fontWeight: '700', color: '#64748B' },
  emptySubtext: { fontSize: 13, fontWeight: '500', color: '#94A3B8' },
});
