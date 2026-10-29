import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { RequestStatus } from '../services/types';

interface StatusBadgeProps {
  status: RequestStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getBadgeConfig = () => {
    switch (status) {
      case 'accepted':
        return {
          label: 'In Progress',
          bg: '#EFF6FF',
          border: '#BFDBFE',
          color: '#1D4ED8',
          dot: '#3B82F6',
        };
      case 'completed':
        return {
          label: 'Completed',
          bg: '#ECFDF5',
          border: '#A7F3D0',
          color: '#047857',
          dot: '#10B981',
        };
      case 'rejected':
        return {
          label: 'Rejected',
          bg: '#FEF2F2',
          border: '#FECACA',
          color: '#B91C1C',
          dot: '#EF4444',
        };
      case 'pending':
      default:
        return {
          label: 'Pending',
          bg: '#FFFBEB',
          border: '#FDE68A',
          color: '#B45309',
          dot: '#F59E0B',
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: config.bg, borderColor: config.border },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: config.dot }]} />
      <Text style={[styles.text, { color: config.color }]}>{config.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
});
