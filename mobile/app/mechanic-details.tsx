import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '../components/AppHeader';
import { Button } from '../components/Button';
import { ServiceBadge } from '../components/ServiceBadge';
import { apiGetMechanic, apiGetMechanicReviews } from '../services/api';
import { Mechanic, Review } from '../services/types';

export default function MechanicDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string;
    name?: string;
  }>();

  const mechanicId = params.id ? parseInt(params.id, 10) : null;
  const [mechanic, setMechanic] = useState<Mechanic | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDetails = async () => {
      if (!mechanicId) {
        setError('No mechanic ID provided.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [mechData, revData] = await Promise.all([
          apiGetMechanic(mechanicId),
          apiGetMechanicReviews(mechanicId).catch(() => []),
        ]);

        setMechanic(mechData);
        setReviews(revData);
      } catch (err: any) {
        setError(err.message || 'Failed to load mechanic details.');
      } finally {
        setLoading(false);
      }
    };

    loadDetails();
  }, [mechanicId]);

  const handleCall = () => {
    if (mechanic?.phone) {
      Linking.openURL(`tel:${mechanic.phone}`);
    } else {
      Linking.openURL('tel:+256700000000');
    }
  };

  const handleRequestAssistance = () => {
    if (!mechanic) return;
    router.push({
      pathname: '/request-assistance',
      params: {
        mechanicId: mechanic.id.toString(),
        mechanicName: mechanic.name,
        serviceMode: mechanic.service_mode,
      },
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <AppHeader title="Mechanic Details" showBack />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#F97316" />
          <Text style={styles.loadingText}>Loading mechanic profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !mechanic) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <AppHeader title="Mechanic Details" showBack />
        <View style={styles.centerContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Mechanic Not Found</Text>
          <Text style={styles.errorSubtitle}>{error || 'Unable to retrieve details.'}</Text>
          <Button
            title="Browse All Mechanics"
            onPress={() => router.replace('/mechanics')}
            variant="primary"
            style={{ marginTop: 16 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <AppHeader title={mechanic.name} showBack />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.heroCard}>
          <View style={styles.avatarRow}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarEmoji}>
                {mechanic.service_mode === 'mobile' ? '🚙' : '🏬'}
              </Text>
            </View>
            <View style={styles.headerInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.mechanicName}>{mechanic.name}</Text>
                {mechanic.is_verified && (
                  <View style={styles.verifiedPill}>
                    <Text style={styles.verifiedText}>✓ Verified</Text>
                  </View>
                )}
              </View>
              <Text style={styles.areaText}>📍 {mechanic.area}, Kampala</Text>
              <View style={styles.statusPillRow}>
                <View
                  style={[
                    styles.availBadge,
                    mechanic.is_available ? styles.availBadgeGreen : styles.availBadgeGray,
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
                    {mechanic.is_available ? 'Available Now' : 'Currently Busy'}
                  </Text>
                </View>

                <View style={styles.modeBadge}>
                  <Text style={styles.modeText}>
                    {mechanic.service_mode === 'mobile' ? 'Mobile Roadside' : 'Garage Workshop'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Quick Metrics */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <View style={styles.starRow}>
                <Text style={styles.starIcon}>★</Text>
                <Text style={styles.statVal}>{mechanic.rating.toFixed(1)}</Text>
              </View>
              <Text style={styles.statSub}>{reviews.length} reviews</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statBox}>
              <Text style={styles.statVal}>⏱️ {mechanic.eta || '15-25 min'}</Text>
              <Text style={styles.statSub}>Avg. Response ETA</Text>
            </View>

            {mechanic.distance_km !== undefined && (
              <>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statVal}>🚗 {mechanic.distance_km} km</Text>
                  <Text style={styles.statSub}>Distance</Text>
                </View>
              </>
            )}
          </View>

          {/* Contact Bar */}
          <View style={styles.contactRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.callButton}
              onPress={handleCall}
            >
              <Text style={styles.callButtonText}>📞 Call {mechanic.phone || '+256 700 000 000'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Services Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Services Offered</Text>
          <Text style={styles.sectionSubtitle}>
            This mechanic can provide roadside or workshop repairs for:
          </Text>
          <View style={styles.servicesGrid}>
            {mechanic.services && mechanic.services.length > 0 ? (
              mechanic.services.map((svc: string) => (
                <ServiceBadge key={svc} service={svc} />
              ))
            ) : (
              <Text style={styles.emptyNote}>General roadside repairs & diagnostics</Text>
            )}
          </View>
        </View>

        {/* Location & Coverage */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Location & Coordinates</Text>
          <View style={styles.coordRow}>
            <Text style={styles.coordLabel}>Service Base Area:</Text>
            <Text style={styles.coordValue}>{mechanic.area}</Text>
          </View>
          <View style={styles.coordRow}>
            <Text style={styles.coordLabel}>GPS Coordinates:</Text>
            <Text style={styles.coordValue}>
              {mechanic.latitude.toFixed(4)}° N, {mechanic.longitude.toFixed(4)}° E
            </Text>
          </View>
          <View style={styles.coordRow}>
            <Text style={styles.coordLabel}>Operation Coverage:</Text>
            <Text style={styles.coordValue}>Greater Kampala Metropolitan Area</Text>
          </View>
        </View>

        {/* Customer Reviews Section */}
        <View style={styles.sectionCard}>
          <View style={styles.reviewHeaderRow}>
            <Text style={styles.sectionTitle}>Customer Reviews</Text>
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingStar}>★</Text>
              <Text style={styles.ratingScore}>{mechanic.rating.toFixed(1)}</Text>
              <Text style={styles.ratingCount}>({reviews.length})</Text>
            </View>
          </View>

          {reviews.length > 0 ? (
            reviews.map((rev: Review, idx: number) => (
              <View key={rev.id || idx} style={styles.reviewItem}>
                <View style={styles.reviewTop}>
                  <View style={styles.reviewDriverInfo}>
                    <Text style={styles.reviewerAvatar}>👤</Text>
                    <Text style={styles.reviewerName}>{rev.driver_name || 'Kampala Driver'}</Text>
                  </View>
                  <View style={styles.reviewStars}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Text
                        key={i}
                        style={[
                          styles.reviewStarChar,
                          { color: i < rev.rating ? '#F59E0B' : '#E2E8F0' },
                        ]}
                      >
                        ★
                      </Text>
                    ))}
                  </View>
                </View>
                {rev.comment ? (
                  <Text style={styles.reviewText}>"{rev.comment}"</Text>
                ) : (
                  <Text style={styles.reviewTextMuted}>Rating given without written comment.</Text>
                )}
                {rev.created_at && (
                  <Text style={styles.reviewDate}>
                    {new Date(rev.created_at).toLocaleDateString()}
                  </Text>
                )}
              </View>
            ))
          ) : (
            <View style={styles.emptyReviews}>
              <Text style={styles.emptyReviewsEmoji}>💬</Text>
              <Text style={styles.emptyReviewsText}>No customer reviews yet.</Text>
              <Text style={styles.emptyReviewsSub}>
                Be the first driver to request assistance and rate this mechanic!
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Floating Bottom Action */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBarLeft}>
          <Text style={styles.bottomPriceLabel}>Service Mode</Text>
          <Text style={styles.bottomPriceValue}>
            {mechanic.service_mode === 'mobile' ? 'Mobile Dispatch' : 'Workshop Visit'}
          </Text>
        </View>
        <Button
          title={mechanic.is_available ? 'Request Help Now' : 'Request (Busy)'}
          onPress={handleRequestAssistance}
          variant="primary"
          style={styles.requestButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
  },
  errorIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  errorSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 16,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  avatarEmoji: {
    fontSize: 28,
  },
  headerInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  mechanicName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  verifiedPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
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
    marginTop: 3,
  },
  statusPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  availBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  availBadgeGreen: {
    backgroundColor: '#D1FAE5',
  },
  availBadgeGray: {
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
  modeBadge: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  modeText: {
    fontSize: 11,
    color: '#7E22CE',
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  statBox: {
    alignItems: 'center',
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  starIcon: {
    color: '#F59E0B',
    fontSize: 16,
  },
  statVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  statSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  contactRow: {
    marginTop: 2,
  },
  callButton: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  callButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emptyNote: {
    fontSize: 13,
    color: '#64748B',
    fontStyle: 'italic',
  },
  coordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  coordLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  coordValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  reviewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
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
  ratingCount: {
    fontSize: 11,
    color: '#92400E',
  },
  reviewItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingVertical: 12,
  },
  reviewTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  reviewDriverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reviewerAvatar: {
    fontSize: 16,
  },
  reviewerName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  reviewStars: {
    flexDirection: 'row',
  },
  reviewStarChar: {
    fontSize: 13,
  },
  reviewText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  reviewTextMuted: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  reviewDate: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 4,
  },
  emptyReviews: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyReviewsEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyReviewsText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  emptyReviewsSub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 20,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
  },
  bottomBarLeft: {
    flex: 1,
  },
  bottomPriceLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  bottomPriceValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  requestButton: {
    flex: 1,
    maxWidth: 180,
  },
});
