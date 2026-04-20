import React, { useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

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
    Animated.spring(scale, {
      toValue,
      useNativeDriver: true,
      speed: 30,
      bounciness: 4,
    }).start();
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
          <Text style={[styles.emoji, isPrimary ? styles.primaryEmoji : styles.secondaryEmoji]}>
            {emoji}
          </Text>

          {loading ? (
            <ActivityIndicator
              size="small"
              color={isPrimary ? colors.primaryAccent : colors.secondaryAccent}
            />
          ) : (
            <Text style={[styles.chevron, isPrimary ? styles.primaryEmoji : styles.secondaryEmoji]}>
              ›
            </Text>
          )}
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>

        {statusText ? <Text style={styles.statusText}>{statusText}</Text> : null}
      </Pressable>
    </Animated.View>
  );
}

const sharedShadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.24,
    shadowRadius: 18,
  },
  android: {
    elevation: 5,
  },
  default: {},
});

const styles = StyleSheet.create({
  cardShell: {
    borderRadius: 20,
    marginBottom: spacing.md,
    ...sharedShadow,
  },
  primaryShell: {
    shadowColor: colors.primaryAccent,
  },
  secondaryShell: {
    shadowColor: '#000',
  },
  inactiveShell: {
    opacity: 0.7,
  },
  card: {
    borderRadius: 20,
    padding: spacing.lg,
    borderWidth: 1,
  },
  primaryCard: {
    backgroundColor: colors.primaryCard,
    borderColor: colors.primaryBorder,
    paddingVertical: spacing.xl,
  },
  secondaryCard: {
    backgroundColor: colors.secondaryCard,
    borderColor: colors.secondaryBorder,
  },
  inactiveCard: {
    borderStyle: 'dashed',
  },
  pressed: {
    opacity: 0.96,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  emoji: {
    fontSize: 26,
  },
  primaryEmoji: {
    color: colors.primaryAccent,
  },
  secondaryEmoji: {
    color: colors.secondaryAccent,
  },
  chevron: {
    fontSize: 26,
    fontWeight: typography.weight.bold,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.size.xl,
    fontWeight: typography.weight.black,
    marginTop: spacing.sm,
  },
  description: {
    color: colors.textSecondary,
    fontSize: typography.size.sm,
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  statusText: {
    color: colors.textMuted,
    fontSize: typography.size.xs,
    marginTop: spacing.sm,
  },
});
