import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { DailyXpEntry } from '../services/progress';

const DEFAULT_CHART_H = 108;
const MIN_BAR = 6;

type Props = {
  series: DailyXpEntry[];
  /** Dolu çubuk rengi (ör. bugün veya en yüksek gün) */
  accent: string;
  /** Diğer günler */
  barMuted: string;
  /** Boş gün zemin */
  barEmpty: string;
  /** Çubuk alanı yüksekliği (dar ekran / ana sayfa için düşürülebilir, varsayılan 108) */
  barTrackHeight?: number;
  chartPaddingTop?: number;
  dayLabelMarginTop?: number;
};

export default function WeeklyActivityChart({
  series,
  accent,
  barMuted,
  barEmpty,
  barTrackHeight = DEFAULT_CHART_H,
  chartPaddingTop = 8,
  dayLabelMarginTop = 8,
}: Props) {
  const todayIso = new Date().toISOString().slice(0, 10);
  const maxXp = Math.max(...series.map(s => s.xp), 1);
  const todayEntry = series.find(s => s.date === todayIso);
  const peak = Math.max(...series.map(s => s.xp), 0);
  let highlightDate: string | null = null;
  if (todayEntry && todayEntry.xp > 0) highlightDate = todayIso;
  else if (peak > 0) highlightDate = series.find(s => s.xp === peak)?.date ?? null;

  return (
    <View style={styles.wrap}>
      <View style={[styles.chartRow, { paddingTop: chartPaddingTop }]}>
        {series.map(day => {
          const ratio = day.xp <= 0 ? 0 : Math.max(day.xp / maxXp, 0.12);
          const h = day.xp <= 0 ? MIN_BAR : MIN_BAR + ratio * (barTrackHeight - MIN_BAR);
          const isToday = day.date === todayIso;
          const fill =
            day.xp <= 0 ? barEmpty : day.date === highlightDate && day.xp > 0 ? accent : barMuted;
          return (
            <View key={day.date} style={styles.col}>
              <View style={[styles.barTrack, { height: barTrackHeight }]}>
                <View style={[styles.bar, { height: h, backgroundColor: fill }]} />
              </View>
              <Text
                style={[styles.dayLbl, isToday && styles.dayLblToday, { marginTop: dayLabelMarginTop }]}
                numberOfLines={1}
              >
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
