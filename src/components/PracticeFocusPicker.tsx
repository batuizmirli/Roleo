import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Easing,
  Platform,
  UIManager,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { GOAL_SECTIONS, type PracticeTarget } from '../data/practiceGoals';
import { typography } from '../theme/typography';

const ACCENT = '#884C32';

/** Satır + boşluk yaklaşık yüksekliği (onLayout olmadan akıcı animasyon) */
const ROW_UNIT = 76;
const BODY_PAD = 20;

function sectionExpandedHeight(targetCount: number) {
  return targetCount * ROW_UNIT + BODY_PAD;
}

type Variant = 'dark' | 'light';

type Props = {
  selected: PracticeTarget | null;
  onSelect: (t: PracticeTarget) => void;
  variant?: Variant;
  scrollable?: boolean;
};

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function PracticeFocusPicker({
  selected,
  onSelect,
  variant = 'dark',
  scrollable = true,
}: Props) {
  const isLight = variant === 'light';
  const firstTitle = GOAL_SECTIONS[0]?.title ?? '';

  const animBySection = useRef(
    Object.fromEntries(GOAL_SECTIONS.map((s, i) => [s.title, new Animated.Value(i === 0 ? 1 : 0)])),
  ).current as Record<string, Animated.Value>;

  const [openKey, setOpenKey] = useState<string | null>(firstTitle || null);

  const toggle = (title: string) => {
    const anim = animBySection[title];

    if (openKey === title) {
      Animated.timing(anim, {
        toValue: 0,
        duration: 240,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished) setOpenKey(null);
      });
      return;
    }

    const openNext = () => {
      setOpenKey(title);
      anim.setValue(0);
      Animated.timing(anim, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    };

    if (openKey && openKey !== title) {
      const prevAnim = animBySection[openKey];
      Animated.timing(prevAnim, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished) openNext();
      });
    } else {
      openNext();
    }
  };

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
      {GOAL_SECTIONS.map((section, si) => {
        const expanded = sectionExpandedHeight(section.targets.length);
        const open = openKey === section.title;
        const heightAnim = animBySection[section.title].interpolate({
          inputRange: [0, 1],
          outputRange: [0, expanded],
        });
        const opacityAnim = animBySection[section.title].interpolate({
          inputRange: [0, 0.15, 1],
          outputRange: [0, 0.6, 1],
        });

        return (
          <View key={section.title} style={styles.section}>
            <TouchableOpacity
              style={[styles.accHead, isLight ? styles.accHeadLight : styles.accHeadDark]}
              onPress={() => toggle(section.title)}
              activeOpacity={0.75}
            >
              <Text
                style={[styles.accTitle, isLight ? styles.accTitleLight : styles.accTitleDark]}
                numberOfLines={2}
              >
                {section.title}
              </Text>
              <MaterialIcons
                name={open ? 'expand-less' : 'expand-more'}
                size={26}
                color={isLight ? ACCENT : 'rgba(255,255,255,0.85)'}
              />
            </TouchableOpacity>
            <Animated.View
              style={[
                styles.accAnimWrap,
                {
                  height: heightAnim,
                  opacity: opacityAnim,
                },
              ]}
            >
              <View style={[styles.accBody, si < GOAL_SECTIONS.length - 1 && styles.accBodyBorder]}>
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
                        <Text
                          style={[
                            styles.label,
                            isLight ? styles.labelLight : styles.labelDark,
                            active && { color: ACCENT },
                          ]}
                        >
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
            </Animated.View>
          </View>
        );
      })}
    </Body>
  );
}

const styles = StyleSheet.create({
  scrollDark: { maxHeight: 400, marginBottom: 8 },
  scrollLight: { flexGrow: 0, marginBottom: 8 },
  embedWrap: { marginBottom: 8 },
  section: { marginBottom: 4 },
  accHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
    gap: 8,
  },
  accHeadLight: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(136, 76, 50, 0.2)',
  },
  accHeadDark: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.12)',
  },
  accTitle: {
    flex: 1,
    ...typography.lingua.title2,
  },
  accTitleLight: { color: '#3D3835' },
  accTitleDark: { color: 'rgba(255,255,255,0.88)' },
  accAnimWrap: {
    overflow: 'hidden',
  },
  accBody: {
    paddingBottom: 8,
    paddingTop: 4,
  },
  accBodyBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(136, 76, 50, 0.12)',
    marginBottom: 6,
  },
  row: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
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
    backgroundColor: '#FAF7F5',
    borderColor: 'rgba(216,194,186,0.4)',
  },
  rowLightActive: {
    borderColor: ACCENT,
    backgroundColor: '#FFFBF8',
  },
  rowText: { flex: 1, paddingRight: 10 },
  label: { ...typography.lingua.title2, fontFamily: typography.font.semibold },
  labelDark: { color: 'rgba(255,255,255,0.92)' },
  labelLight: { color: '#1B1C1C' },
  hint: { ...typography.lingua.caption, marginTop: 4 },
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
