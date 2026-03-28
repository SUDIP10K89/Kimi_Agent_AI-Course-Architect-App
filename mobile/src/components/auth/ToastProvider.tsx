/**
 * Lightweight toast provider for auth flows.
 */

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

type ToastVariant = 'default' | 'success' | 'error';

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [message, setMessage] = useState<string>('');
  const [variant, setVariant] = useState<ToastVariant>('default');
  const [visible, setVisible] = useState(false);
  const translateY = useRef(new Animated.Value(-40)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: -40, duration: 180, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start(() => setVisible(false));
  }, [opacity, translateY]);

  const showToast = useCallback(
    (nextMessage: string, nextVariant: ToastVariant = 'default') => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setMessage(nextMessage);
      setVariant(nextVariant);
      setVisible(true);

      Animated.parallel([
        Animated.timing(translateY, { toValue: 0, duration: 220, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();

      timeoutRef.current = setTimeout(() => {
        hide();
      }, 2200);
    },
    [hide, opacity, translateY]
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      <View style={styles.container}>
        {children}
        {visible && (
          <Animated.View
            style={[
              styles.toast,
              stylesByVariant[variant],
              { transform: [{ translateY }], opacity },
            ]}
          >
            <Text style={styles.toastText}>{message}</Text>
          </Animated.View>
        )}
      </View>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toast: {
    position: 'absolute',
    top: 14,
    left: 16,
    right: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 6,
  },
  toastText: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});

const stylesByVariant: Record<ToastVariant, { backgroundColor: string }> = {
  default: { backgroundColor: '#e2e8f0' },
  success: { backgroundColor: '#bbf7d0' },
  error: { backgroundColor: '#fecaca' },
};

