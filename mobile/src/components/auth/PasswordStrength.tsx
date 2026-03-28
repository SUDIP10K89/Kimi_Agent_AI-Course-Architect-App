/**
 * Password strength bar with 4 levels.
 */

import React, { useMemo } from 'react';
import { View, Text } from 'react-native';

type StrengthLevel = 0 | 1 | 2 | 3;

interface PasswordStrengthProps {
  password: string;
}

const getStrength = (password: string): StrengthLevel => {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  if (score >= 4) return 3;
  if (score >= 3) return 2;
  if (score >= 2) return 1;
  return 0;
};

const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password }) => {
  const strength = useMemo(() => getStrength(password), [password]);
  const label = ['Weak', 'Fair', 'Good', 'Strong'][strength];
  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e'];

  return (
    <View className="mt-3">
      <View className="flex-row gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <View
            key={`strength-${index}`}
            className="flex-1 h-2 rounded-full"
            style={{
              backgroundColor: index <= strength ? colors[strength] : '#e2e8f0',
            }}
          />
        ))}
      </View>
      <Text className="text-xs text-slate-500 dark:text-slate-400 mt-2">
        {label}
      </Text>
    </View>
  );
};

export default PasswordStrength;

