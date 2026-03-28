/**
 * OTP input component with auto-advance and backspace behavior.
 */

import React, { useMemo, useRef } from 'react';
import { TextInput, View } from 'react-native';

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  hasError?: boolean;
}

const OTP_LENGTH = 6;

const OtpInput: React.FC<OtpInputProps> = ({ value, onChange, hasError = false }) => {
  const inputsRef = useRef<Array<TextInput | null>>([]);

  const digits = useMemo(() => {
    const padded = value.padEnd(OTP_LENGTH, ' ');
    return padded.split('').slice(0, OTP_LENGTH);
  }, [value]);

  const focusIndex = (index: number) => {
    inputsRef.current[index]?.focus();
  };

  const handleChange = (index: number, text: string) => {
    const clean = text.replace(/\D/g, '');
    const current = value.padEnd(OTP_LENGTH, ' ');
    if (!clean) {
      const nextValue = current.substring(0, index) + ' ' + current.substring(index + 1);
      onChange(nextValue.replace(/\s/g, ''));
      return;
    }

    const nextChar = clean[clean.length - 1];
    const nextValue =
      current.substring(0, index) + nextChar + current.substring(index + 1);
    onChange(nextValue.replace(/\s/g, ''));

    if (index < OTP_LENGTH - 1) {
      focusIndex(index + 1);
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace') {
      if (digits[index]?.trim()) {
        return;
      }
      if (index > 0) {
        const current = value.padEnd(OTP_LENGTH, ' ');
        const nextValue =
          current.substring(0, index - 1) + ' ' + current.substring(index);
        onChange(nextValue.replace(/\s/g, ''));
        focusIndex(index - 1);
      }
    }
  };

  return (
    <View className="flex-row items-center justify-between">
      {Array.from({ length: OTP_LENGTH }).map((_, index) => (
        <TextInput
          key={`otp-${index}`}
          ref={(ref) => {
            inputsRef.current[index] = ref;
          }}
          className={`h-12 w-12 rounded-xl border text-center text-base font-semibold ${
            hasError
              ? 'border-rose-500 text-rose-600 bg-rose-50'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white'
          }`}
          keyboardType="number-pad"
          maxLength={1}
          value={digits[index]?.trim() ? digits[index] : ''}
          onChangeText={(text) => handleChange(index, text)}
          onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
          returnKeyType="done"
          textContentType="oneTimeCode"
        />
      ))}
    </View>
  );
};

export default OtpInput;
