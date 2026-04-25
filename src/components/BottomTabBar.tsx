import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type MainTabId = 'discover' | 'learn' | 'practice' | 'profile';

type Props = {
  active: MainTabId;
  onSelect: (tab: MainTabId) => void;
};

const terracotta = '#B06D50';

export default function BottomTabBar({ active, onSelect }: Props) {
  const insets = useSafeAreaInsets();

  const Item = ({
    tab,
    icon,
    label,
  }: {
    tab: MainTabId;
    icon: React.ComponentProps<typeof MaterialIcons>['name'];
    label: string;
  }) => {
    const isActive = active === tab;
    return (
      <TouchableOpacity style={styles.navItem} onPress={() => onSelect(tab)} activeOpacity={0.88}>
        <MaterialIcons name={icon} size={24} color={isActive ? terracotta : '#333'} style={isActive ? undefined : { opacity: 0.45 }} />
        <Text style={isActive ? styles.navLabelActive : styles.navLabel}>{label}</Text>
        {isActive ? <View style={styles.navDot} /> : <View style={{ height: 4 }} />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.navInner}>
        <Item tab="discover" icon="explore" label="Keşfet" />
        <Item tab="learn" icon="school" label="Öğren" />
        <Item tab="practice" icon="record-voice-over" label="Pratik" />
        <Item tab="profile" icon="person-outline" label="Profil" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FCF9F7',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(51,51,51,0.06)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    shadowColor: '#333',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 12,
  },
  navInner: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    paddingHorizontal: 8,
  },
  navItem: { alignItems: 'center', minWidth: 72 },
  navLabel: {
    marginTop: 4,
    fontSize: 10,
    fontFamily: 'Poppins_500Medium',
    color: '#333',
    opacity: 0.5,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  navLabelActive: {
    marginTop: 4,
    fontSize: 10,
    fontFamily: 'Poppins_500Medium',
    color: terracotta,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  navDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: terracotta,
    marginTop: 4,
  },
});
