import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Mechanic } from '../services/types';
import { ServiceBadge } from './ServiceBadge';

interface MechanicCardProps {
  mechanic: Mechanic;
  onSelect?: (mechanic: Mechanic) => void;
}

export const MechanicCard: React.FC<MechanicCardProps> = ({
  mechanic,
  onSelect,
}) => {
  const router = useRouter();

  const handleRequest = () => {
    if (onSelect) {
      onSelect(mechanic);
    } else {
      router.push({
        pathname: '/request-assistance',
        params: {
          mechanicId: mechanic.id.toString(),
          mechanicName: mechanic.name,
          serviceMode: mechanic.service_mode,
        },
      });
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{mechanic.name}</Text>
            {mechanic.is_verified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✓ Verified</Text>
              </View>
            )}
          </View>
          <Text style={styles.areaText}>📍 {mechanic.area}</Text>
        </View>

        <View style={styles.statusCol}>
          <View
            style={[
              styles.availPill,
              mechanic.is_available ? styles.availGreen : styles.availGray,
            ]}
          >
            <View
              style={[
                styles.availDot,
                { backgroundColor: mechanic.is_available ? '#10B981' : '#94A3B8' },
              ]}
            />
            <Text
              style={[
                styles.availText,
                { color: mechanic.is_available ? '#065F46' : '#475569' },
              ]}
            >
              {mechanic.is_available ? 'Available' : 'Busy'}
            </Text>
          </View>

          {mechanic.distance_km !== undefined && (
            <Text style={styles.distanceText}>
              🚗 {mechanic.distance_km} km away
            </Text>
          )}
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.ratingBadge}>
          <Text style={styles.ratingStar}>★</Text>
          <Text style={styles.ratingScore}>{mechanic.rating.toFixed(1)}</Text>
          <Text style={styles.reviewCount}>({mechanic.review_count})</Text>
        </View>

        {mechanic.eta ? (
          <View style={styles.etaBadge}>
            <Text style={styles.etaText}>⏱️ {mechanic.eta}</Text>
          </View>
        ) : null}

        <View style={styles.modeBadge}>
          <Text style={styles.modeText}>
            {mechanic.service_mode === 'mobile' ? '🚙 Mobile Unit' : '🏬 Workshop'}
          </Text>
        </View>
      </View>

      {/* Services List */}
      <View style={styles.servicesContainer}>
        {mechanic.services.map((svc: string) => (
          <ServiceBadge key={svc} service={svc} />
        ))}
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.detailsBtn}
          onPress={() =>
            router.push({
              pathname: '/mechanic-details',
              params: { id: mechanic.id.toString(), name: mechanic.name },
            })
          }
        >
          <Text style={styles.detailsBtnText}>View Details</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          style={[
            styles.actionBtn,
            !mechanic.is_available && styles.actionBtnDisabled,
          ]}
          onPress={handleRequest}
        >
          <Text style={styles.actionBtnText}>
            {mechanic.is_available ? 'Request Help' : 'Unavailable'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  titleInfo: {
    flex: 1,
    marginRight: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  name: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  verifiedBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563EB',
  },
  areaText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  statusCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  availPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  availGreen: {
    backgroundColor: '#D1FAE5',
  },
  availGray: {
    backgroundColor: '#F1F5F9',
  },
  availDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  availText: {
    fontSize: 11,
    fontWeight: '700',
  },
  distanceText: {
    fontSize: 11,
    color: '#0EA5E9',
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 3,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  ratingStar: {
    color: '#F59E0B',
    fontSize: 13,
  },
  ratingScore: {
    fontSize: 13,
    fontWeight: '800',
    color: '#B45309',
  },
  reviewCount: {
    fontSize: 11,
    color: '#92400E',
  },
  etaBadge: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  etaText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  modeBadge: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  modeText: {
    fontSize: 11,
    color: '#7E22CE',
    fontWeight: '700',
  },
  servicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  detailsBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  detailsBtnText: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 13,
  },
  actionBtn: {
    flex: 1.2,
    backgroundColor: '#EA580C',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
