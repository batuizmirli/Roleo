import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { DailyXpEntry } from '../services/progress';

const CHART_H = 108;
const MIN_BAR = 6;

type Props = {
  series: DailyXpEntry[];
  /** Dolu çubuk rengi (ör. bugün veya en yüksek gün) */
  accent: string;
  /** Diğer günler */
  barMuted: string;
  /** Boş gün zemin */
  barEmpty: string;
};

export default function WeeklyActivityChart({ series, accent, barMuted, barEmpty }: Props) {
  const todayIso = new Date().toISOString().slice(0, 10);
  const maxXp = Math.max(...series.map(s => s.xp), 1);
  const todayEntry = series.find(s => s.date === todayIso);
  const peak = Math.max(...series.map(s => s.xp), 0);
  let highlightDate: string | null = null;
  if (todayEntry && todayEntry.xp > 0) highlightDate = todayIso;
  else if (peak > 0) highlightDate = series.find(s => s.xp === peak)?.date ?? null;

  return (
    <View style={styles.wrap}>
      <View style={styles.chartRow}>
        {series.map(day => {
          const ratio = day.xp <= 0 ? 0 : Math.max(day.xp / maxXp, 0.12);
          const h = day.xp <= 0 ? MIN_BAR : MIN_BAR + ratio * (CHART_H - MIN_BAR);
          const isToday = day.date === todayIso;
          const fill =
            day.xp <= 0 ? barEmpty : day.date === highlightDate && day.xp > 0 ? accent : barMuted;
          return (
            <View key={day.date} style={styles.col}>
              <View style={[styles.barTrack, { height: CHART_H }]}>
                <View style={[styles.bar, { height: h, backgroundColor: fill }]} />
              </View>
              <Text style={[styles.dayLbl, isToday && styles.dayLblToday]} numberOfLines={1}>
                {day.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 4,
    paddingTop: 8,
  },
  col: { flex: 1, alignItems: 'center', minWidth: 0 },
  barTrack: {
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: '78%',
    maxWidth: 22,
    borderRadius: 8,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  dayLbl: {
    marginTop: 8,
    fontSize: 10,
    fontFamily: 'Poppins_500Medium',
    color: 'rgba(27, 28, 28, 0.45)',
    textAlign: 'center',
  },
  dayLblToday: {
    color: 'rgba(27, 28, 28, 0.85)',
    fontFamily: 'Poppins_600SemiBold',
  },
});
