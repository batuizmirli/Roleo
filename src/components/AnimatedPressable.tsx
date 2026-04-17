import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleProp, ViewStyle } from 'react-native';

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  disabled?: boolean;
  delay?: number;
  pressScale?: number;
};

export default function AnimatedPressable({
  children,
  style,
  onPress,
  disabled,
  delay = 0,
  pressScale = 0.97,
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    const timeout = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 260,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);

    return () => clearTimeout(timeout);
  }, [delay, opacity, translateY]);

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: pressScale,
      speed: 30,
      bounciness: 0,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      speed: 24,
      bounciness: 0,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={{
        opacity,
        transform: [{ translateY }, { scale }],
      }}
    >
      <Pressable
        style={style}
        onPress={onPress}
        disabled={disabled}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
