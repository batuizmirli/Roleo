import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { GOAL_SECTIONS, type PracticeTarget } from '../data/practiceGoals';

const ACCENT = '#884C32';

type Variant = 'dark' | 'light';

type Props = {
  selected: PracticeTarget | null;
  onSelect: (t: PracticeTarget) => void;
  variant?: Variant;
  /** false: dışarıda ScrollView varken iç içe kaydırmayı önlemek için */
  scrollable?: boolean;
};

export default function PracticeFocusPicker({
  selected,
  onSelect,
  variant = 'dark',
  scrollable = true,
}: Props) {
  const isLight = variant === 'light';
  const Body = scrollable ? ScrollView : View;
  const bodyProps = scrollable
    ? {
        style: isLight ? styles.scrollLight : styles.scrollDark,
        nestedScrollEnabled: true,
        showsVerticalScrollIndicator: false,
        keyboardShouldPersistTaps: 'handled' as const,
      }
    : { style: styles.embedWrap };

  return (
    <Body {...bodyProps}>
      {GOAL_SECTIONS.map(section => (
        <View key={section.title} style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              isLight ? styles.sectionTitleLight : styles.sectionTitleDark,
            ]}
          >
            {section.title}
          </Text>
          {section.targets.map(t => {
            const active = selected?.id === t.id;
            return (
              <TouchableOpacity
                key={t.id}
                style={[
                  styles.row,
                  isLight ? styles.rowLight : styles.rowDark,
                  active && (isLight ? styles.rowLightActive : styles.rowDarkActive),
                ]}
                onPress={() => onSelect(t)}
                activeOpacity={0.75}
              >
                <View style={styles.rowText}>
                  <Text style={[styles.label, isLight ? styles.labelLight : styles.labelDark, active && { color: ACCENT }]}>
                    {t.label}
                  </Text>
                  <Text style={[styles.hint, isLight ? styles.hintLight : styles.hintDark]}>{t.hint}</Text>
                </View>
                <View
                  style={[
                    styles.circle,
                    isLight && styles.circleLight,
                    active && { backgroundColor: ACCENT, borderColor: ACCENT },
                  ]}
                >
                  {active ? <Text style={styles.check}>✓</Text> : null}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </Body>
  );
}

const styles = StyleSheet.create({
  scrollDark: { maxHeight: 400, marginBottom: 8 },
  scrollLight: { flexGrow: 0, marginBottom: 8 },
  embedWrap: { marginBottom: 8 },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 10,
    marginTop: 6,
    textDecorationLine: 'underline',
    letterSpacing: 0.2,
  },
  sectionTitleDark: {
    color: 'rgba(255,255,255,0.78)',
    textDecorationColor: 'rgba(255,255,255,0.35)',
  },
  sectionTitleLight: {
    color: '#53433E',
    textDecorationColor: 'rgba(136, 76, 50, 0.35)',
  },
  row: {
    borderRadius: 18,
    borderWidth: 1.5,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  rowDark: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderColor: 'rgba(255,255,255,0.10)',
  },
  rowDarkActive: {
    borderColor: ACCENT,
    backgroundColor: 'rgba(136, 76, 50, 0.12)',
  },
  rowLight: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(216,194,186,0.45)',
  },
  rowLightActive: {
    borderColor: ACCENT,
    backgroundColor: '#FFFBF8',
  },
  rowText: { flex: 1, paddingRight: 10 },
  label: { fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  labelDark: { color: 'rgba(255,255,255,0.92)' },
  labelLight: { color: '#1B1C1C' },
  hint: { fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 3 },
  hintDark: { color: 'rgba(255,255,255,0.65)' },
  hintLight: { color: '#53433E' },
  circle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleLight: { borderColor: 'rgba(136, 76, 50, 0.28)' },
  check: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
});
