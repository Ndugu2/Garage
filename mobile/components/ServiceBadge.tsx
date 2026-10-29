import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ServiceBadgeProps {
  service: string;
  selected?: boolean;
  onPress?: () => void;
  size?: 'small' | 'medium';
}

const getServiceEmoji = (name: string): string => {
  const lower = name.toLowerCase();
  if (lower.includes('tyre')) return '🛞';
  if (lower.includes('battery')) return '🔋';
  if (lower.includes('tow')) return '🛻';
  if (lower.includes('engine')) return '⚙️';
  if (lower.includes('electr')) return '⚡';
  if (lower.includes('heat')) return '🌡️';
  return '🔧';
};

export const ServiceBadge: React.FC<ServiceBadgeProps> = ({
  service,
  selected = false,
  onPress,
  size = 'small',
}) => {
  const content = (
    <View
      style={[
        styles.badge,
        selected ? styles.badgeSelected : styles.badgeDefault,
        size === 'medium' && styles.badgeMedium,
      ]}
    >
      <Text style={styles.emoji}>{getServiceEmoji(service)}</Text>
      <Text
        style={[
          styles.text,
          selected ? styles.textSelected : styles.textDefault,
          size === 'medium' && styles.textMedium,
        ]}
      >
        {service}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginRight: 6,
    marginBottom: 6,
    gap: 4,
  },
  badgeMedium: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  badgeDefault: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  badgeSelected: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1.5,
    borderColor: '#EA580C',
  },
  emoji: {
    fontSize: 13,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
  textMedium: {
    fontSize: 14,
  },
  textDefault: {
    color: '#475569',
  },
  textSelected: {
    color: '#EA580C',
  },
});
