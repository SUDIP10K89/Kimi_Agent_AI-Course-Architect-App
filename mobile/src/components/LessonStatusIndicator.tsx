import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { LessonGenerationStatus as LessonStatus } from '@/types';

interface LessonStatusIndicatorProps {
  status: LessonStatus['status'];
  showLabel?: boolean;
}

export const LessonStatusIndicator: React.FC<LessonStatusIndicatorProps> = ({ 
  status,
  showLabel = true 
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'completed':
        return {
          color: '#10b981',
          backgroundColor: '#10b98120',
          icon: '✓',
          label: 'Completed',
        };
      case 'generating':
        return {
          color: '#6366f1',
          backgroundColor: '#6366f120',
          icon: '⟳',
          label: 'Generating',
        };
      case 'failed':
        return {
          color: '#FF3B30',
          backgroundColor: '#FF3B3020',
          icon: '✕',
          label: 'Failed',
        };
      case 'pending':
      default:
        return {
          color: '#9ca3af',
          backgroundColor: '#9ca3af20',
          icon: '○',
          label: 'Pending',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <View style={[styles.container, { backgroundColor: config.backgroundColor }]}>
      <Text style={[styles.icon, { color: config.color }]}>{config.icon}</Text>
      {showLabel && (
        <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  icon: {
    fontSize: 12,
    fontWeight: '600',
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default LessonStatusIndicator;
