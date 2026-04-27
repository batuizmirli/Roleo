import React, { useRef } from 'react';
import { ActivityIndicator, Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

type Props = {
  title: string;
  description: string;
  emoji: string;
  variant?: 'primary' | 'secondary';
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  statusText?: string;
  accessibilityLabel: string;
  accessibilityHint: string;
  testID?: string;
};

export default function ActionCard({
  title,
  description,
  emoji,
  variant = 'secondary',
  onPress,
  disabled = false,
  loading = false,
  statusText,
  accessibilityLabel,
  accessibilityHint,
  testID,
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const isPrimary = variant === 'primary';
  const isInactive = disabled || loading;

  const animateTo = (toValue: number) => {
    Animated.spring(scale, { toValue, useNativeDriver: true, speed: 30, bounciness: 4 }).start();
  };

  return (
    <Animated.View
      style={[
        styles.cardShell,
        isPrimary ? styles.primaryShell : styles.secondaryShell,
        isInactive && styles.inactiveShell,
        { transform: [{ scale }] },
      ]}
    >
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled: isInactive, busy: loading }}
        disabled={isInactive}
        onPress={onPress}
        onPressIn={() => animateTo(0.985)}
        onPressOut={() => animateTo(1)}
        style={({ pressed }) => [
          styles.card,
          isPrimary ? styles.primaryCard : styles.secondaryCard,
          pressed && !isInactive && styles.pressed,
          isInactive && styles.inactiveCard,
        ]}
      >
        <View style={styles.topRow}>
          <Text style={styles.emoji}>{emoji}</Text>
          {loading
            ? <ActivityIndicator size="small" color={colors.accentWarm} />
            : <Text style={styles.chevron}>›</Text>
          }
        </View>

        <Text style={[styles.title, isPrimary && styles.titlePrimary]}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        {statusText ? <Text style={styles.statusText}>{statusText}</Text> : null}
      </Pressable>
    </Animated.View>
  );
}

const sharedShadow = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 16 },
  android: { elevation: 4 },
  default: {},
});

const styles = StyleSheet.create({
  cardShell: {
    borderRadius: 20,
    marginBottom: 12,
    ...sharedShadow,
  },
  primaryShell: { shadowColor: colors.accentWarm },
  secondaryShell: { shadowColor: '#000' },
  inactiveShell: { opacity: 0.6 },

  card: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
  },
  primaryCard: {
    backgroundColor: colors.bgMid,
    borderColor: `${colors.accentWarm}40`,
    paddingVertical: 22,
  },
  secondaryCard: {
    backgroundColor: colors.bgMid,
    borderColor: colors.hairlineStrong,
  },
  inactiveCard: { borderStyle: 'dashed' },
  pressed: { opacity: 0.92 },

  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  emoji: { fontSize: 26 },
  chevron: { fontSize: 26, color: colors.inkTertiary, fontFamily: 'InterTight_400Regular' },

  title: {
    fontFamily: 'Fraunces_300Light',
    color: colors.inkPrimary,
    fontSize: 20,
    letterSpacing: -0.3,
    marginTop: 12,
  },
  titlePrimary: { color: colors.accentWarm },
  description: {
    fontFamily: 'InterTight_400Regular',
    color: colors.inkSecondary,
    fontSize: 13,
    marginTop: 6,
    lineHeight: 19,
  },
  statusText: {
    fontFamily: 'InterTight_400Regular',
    color: colors.inkTertiary,
    fontSize: 12,
    marginTop: 8,
  },
});
