import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import {
  getRecentEvents,
  getFirstSessionFunnel,
  detectDropPoints,
  getDailyEventCount,
  clearTelemetry,
  TelemetryEvent,
  FunnelStep,
  DropPoint,
} from '../services/telemetry';

type Props = {
  onBack: () => void;
};

export default function DebugPanelScreen({ onBack }: Props) {
  const [events, setEvents] = useState<TelemetryEvent[]>([]);
  const [funnel, setFunnel] = useState<FunnelStep[]>([]);
  const [drops, setDrops] = useState<DropPoint[]>([]);
  const [dailyCount, setDailyCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const [ev, fn, dr, dc] = await Promise.all([
      getRecentEvents(20),
      getFirstSessionFunnel(),
      detectDropPoints(),
      getDailyEventCount(),
    ]);
    setEvents(ev.reverse());
    setFunnel(fn);
    setDrops(dr);
    setDailyCount(dc);
  };

  useEffect(() => { load(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleClear = async () => {
    await clearTelemetry();
    await load();
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF4D6D" />}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🛠 Debug Panel</Text>
        <TouchableOpacity onPress={handleClear}>
          <Text style={styles.clearBtn}>Clear</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.stat}>📊 Today: {dailyCount} events</Text>

      {/* FUNNEL */}
      <Text style={styles.sectionTitle}>📈 First Session Funnel</Text>
      {funnel.map((step, i) => (
        <View key={i} style={styles.funnelRow}>
          <Text style={styles.funnelName}>{step.name}</Text>
          <Text style={styles.funnelCount}>{step.count}</Text>
          {step.conversionFromPrev !== null && (
            <Text style={[
              styles.funnelConv,
              { color: step.conversionFromPrev >= 60 ? '#4ADE80' : step.conversionFromPrev >= 30 ? '#FBBF24' : '#F87171' },
            ]}>
              {step.conversionFromPrev}%
            </Text>
          )}
        </View>
      ))}

      {/* DROP POINTS */}
      <Text style={styles.sectionTitle}>🚨 Drop Detection</Text>
      {drops.map((d, i) => (
        <View key={i} style={[styles.dropRow, d.detected && styles.dropDetected]}>
          <Text style={styles.dropLabel}>{d.detected ? '⚠️' : '✅'} {d.label}</Text>
          <Text style={styles.dropDesc}>{d.description}</Text>
        </View>
      ))}

      {/* RECENT EVENTS */}
      <Text style={styles.sectionTitle}>🕐 Last 20 Events</Text>
      {events.map((ev, i) => (
        <View key={i} style={styles.eventRow}>
          <View style={styles.eventHeader}>
            <Text style={styles.eventName}>{ev.name}</Text>
            <Text style={styles.eventTime}>
              {new Date(ev.ts).toLocaleTimeString()}
            </Text>
          </View>
          {ev.payload && Object.keys(ev.payload).length > 0 && (
            <Text style={styles.eventPayload}>
              {Object.entries(ev.payload)
                .map(([k, v]) => `${k}: ${v}`)
                .join(' · ')}
            </Text>
          )}
        </View>
      ))}

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D1A', paddingHorizontal: 16, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  back: { color: '#FF4D6D', fontSize: 16, fontWeight: '700' },
  title: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  clearBtn: { color: '#F87171', fontSize: 14, fontWeight: '700' },
  stat: { color: '#AAA', fontSize: 14, marginBottom: 16 },

  sectionTitle: { color: '#FFF', fontSize: 16, fontWeight: '800', marginTop: 20, marginBottom: 10 },

  funnelRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A2E', borderRadius: 10, padding: 12, marginBottom: 6 },
  funnelName: { color: '#CCC', flex: 1, fontSize: 13 },
  funnelCount: { color: '#FFF', fontWeight: '800', fontSize: 15, marginRight: 12 },
  funnelConv: { fontWeight: '800', fontSize: 13, width: 42, textAlign: 'right' },

  dropRow: { backgroundColor: '#1A1A2E', borderRadius: 10, padding: 12, marginBottom: 6 },
  dropDetected: { borderWidth: 1, borderColor: '#F87171' },
  dropLabel: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  dropDesc: { color: '#888', fontSize: 12, marginTop: 4 },

  eventRow: { backgroundColor: '#1A1A2E', borderRadius: 10, padding: 10, marginBottom: 4 },
  eventHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  eventName: { color: '#FF4D6D', fontWeight: '700', fontSize: 13 },
  eventTime: { color: '#666', fontSize: 11 },
  eventPayload: { color: '#888', fontSize: 11, marginTop: 4 },
});
