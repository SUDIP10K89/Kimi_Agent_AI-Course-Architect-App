/**
 * Hook for shake animation on invalid inputs.
 */

import { useCallback, useRef } from 'react';
import { Animated } from 'react-native';

export const useShake = () => {
  const translateX = useRef(new Animated.Value(0)).current;

  const triggerShake = useCallback(() => {
    translateX.setValue(0);
    Animated.sequence([
      Animated.timing(translateX, { toValue: -8, duration: 40, useNativeDriver: true }),
      Animated.timing(translateX, { toValue: 8, duration: 40, useNativeDriver: true }),
      Animated.timing(translateX, { toValue: -6, duration: 40, useNativeDriver: true }),
      Animated.timing(translateX, { toValue: 6, duration: 40, useNativeDriver: true }),
      Animated.timing(translateX, { toValue: 0, duration: 40, useNativeDriver: true }),
    ]).start();
  }, [translateX]);

  return {
    animatedStyle: { transform: [{ translateX }] },
    triggerShake,
  };
};

