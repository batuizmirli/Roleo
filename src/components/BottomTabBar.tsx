import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useAppTranslation } from '../i18n';

export type MainTabId = 'discover' | 'learn' | 'practice' | 'profile';

type Props = {
  active: MainTabId;
  onSelect: (tab: MainTabId) => void;
};

const TABS: { id: MainTabId; icon: string; labelKey: string }[] = [
  { id: 'discover', icon: 'compass',      labelKey: 'tabs.discover' },
  { id: 'learn',    icon: 'book-open',    labelKey: 'tabs.learn' },
  { id: 'practice', icon: 'mic',          labelKey: 'tabs.practice' },
  { id: 'profile',  icon: 'user',         labelKey: 'tabs.profile' },
];

export default function BottomTabBar({ active, onSelect }: Props) {
  const insets = useSafeAreaInsets();
  const t = useAppTranslation();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.inner}>
        {TABS.map(tab => {
          const isActive = active === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.item}
              onPress={() => onSelect(tab.id)}
              activeOpacity={0.7}
            >
              <Feather
                name={tab.icon as any}
                size={22}
                color={isActive ? colors.accentWarm : colors.inkTertiary}
              />
              <Text style={[styles.label, isActive && styles.labelActive]}>
                {t(tab.labelKey)}
              </Text>
              {isActive && <View style={styles.dot} />}
              {!isActive && <View style={{ height: 4 }} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.bgMid,
    borderTopWidth: 1,
    borderTopColor: colors.hairlineStrong,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 16,
  },
  inner: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    paddingHorizontal: 8,
  },
  item: { alignItems: 'center', minWidth: 72 },
  label: {
    marginTop: 5,
    ...typography.eyebrow,
    fontSize: 9,
    color: colors.inkTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  labelActive: {
    color: colors.accentWarm,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.accentWarm,
    marginTop: 4,
  },
});
