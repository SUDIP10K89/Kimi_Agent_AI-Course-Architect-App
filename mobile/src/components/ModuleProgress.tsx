import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { LessonGenerationStatus } from '@/types';

interface ModuleProgressProps {
  moduleName: string;
  lessons: LessonGenerationStatus[];
}

export const ModuleProgress: React.FC<ModuleProgressProps> = ({ 
  moduleName,
  lessons 
}) => {
  const completedCount = lessons.filter(l => l.status === 'completed').length;
  const generatingCount = lessons.filter(l => l.status === 'generating').length;
  const failedCount = lessons.filter(l => l.status === 'failed').length;
  const totalCount = lessons.length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const getOverallStatus = () => {
    if (failedCount > 0) return 'failed';
    if (generatingCount > 0) return 'generating';
    if (completedCount === totalCount && totalCount > 0) return 'completed';
    return 'pending';
  };

  const statusColors: Record<string, string> = {
    completed: '#10b981',
    generating: '#6366f1',
    failed: '#FF3B30',
    pending: '#9ca3af',
  };

  const status = getOverallStatus();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.moduleName} numberOfLines={1}>{moduleName}</Text>
        <Text style={[styles.statusText, { color: statusColors[status] }]}>
          {completedCount}/{totalCount}
        </Text>
      </View>
      
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${percentage}%` }]} />
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: statusColors.completed }]} />
          <Text style={styles.legendText}>{completedCount} done</Text>
        </View>
        {generatingCount > 0 && (
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: statusColors.generating }]} />
            <Text style={styles.legendText}>{generatingCount} generating</Text>
          </View>
        )}
        {failedCount > 0 && (
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: statusColors.failed }]} />
            <Text style={styles.legendText}>{failedCount} failed</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: '#F5F5F7',
    borderRadius: 8,
    marginVertical: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  moduleName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#E5E5EA',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 3,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: '#6b7280',
  },
});

export default ModuleProgress;
