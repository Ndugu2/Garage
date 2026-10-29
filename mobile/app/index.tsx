import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '../components/AppHeader';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/Button';
import { useAuth } from '../hooks/useAuth';

const POPULAR_SERVICES = [
  { id: 'tyre', name: 'Tyre change', emoji: '🛞', desc: 'Puncture repair & wheel change' },
  { id: 'battery', name: 'Battery', emoji: '🔋', desc: 'Jumpstart & battery replacement' },
  { id: 'towing', name: 'Towing', emoji: '🛻', desc: 'Flatbed breakdown transport' },
  { id: 'engine', name: 'Engine', emoji: '⚙️', desc: 'Diagnostics & mechanical fixes' },
  { id: 'electrical', name: 'Electrical', emoji: '⚡', desc: 'Starter, alternator & wiring' },
  { id: 'overheating', name: 'Overheating', emoji: '🌡️', desc: 'Coolant leaks & radiator repair' },
];

const KAMPALA_NEIGHBORHOODS = [
  { name: 'Kampala Central / Road', lat: 0.3136, lon: 32.5811 },
  { name: 'Kololo', lat: 0.3298, lon: 32.5975 },
  { name: 'Nakasero', lat: 0.3242, lon: 32.5786 },
  { name: 'Ntinda / Kisaasi', lat: 0.3541, lon: 32.6102 },
  { name: 'Bugolobi', lat: 0.3155, lon: 32.6253 },
  { name: 'Industrial Area', lat: 0.3178, lon: 32.6041 },
  { name: 'Wandegeya / Makerere', lat: 0.3344, lon: 32.5701 },
  { name: 'Nakawa / Jinja Rd', lat: 0.3312, lon: 32.6289 },
];

export default function HomeScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [selectedArea, setSelectedArea] = useState(KAMPALA_NEIGHBORHOODS[0]);

  const navigateToMechanics = (serviceName?: string) => {
    router.push({
      pathname: '/mechanics',
      params: {
        service: serviceName || '',
        area: selectedArea.name,
        latitude: selectedArea.lat.toString(),
        longitude: selectedArea.lon.toString(),
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <AppHeader />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroBanner}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>🇺🇬 Kampala Roadside Assistance</Text>
          </View>
          <Text style={styles.heroTitle}>
            Find a Nearby Mechanic When You Need One
          </Text>
          <Text style={styles.heroSubtitle}>
            Makanika Connect helps you locate trusted mechanics near your location, get quick assistance, and keep your vehicle on the road.
          </Text>

          {/* Location Search Bar matching mockup */}
          <View style={styles.locationInputBox}>
            <Text style={styles.locationPinIcon}>📍</Text>
            <Text style={styles.locationInputText}>
              {selectedArea.name}, Kampala
            </Text>
            <TouchableOpacity
              style={styles.gpsButton}
              onPress={() => setSelectedArea(KAMPALA_NEIGHBORHOODS[0])}
            >
              <Text style={styles.gpsText}>GPS</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Location Picker Chips */}
          <View style={styles.locationContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.areaScroll}>
              {KAMPALA_NEIGHBORHOODS.map((item) => {
                const active = selectedArea.name === item.name;
                return (
                  <TouchableOpacity
                    key={item.name}
                    activeOpacity={0.7}
                    style={[styles.areaChip, active && styles.areaChipActive]}
                    onPress={() => setSelectedArea(item)}
                  >
                    <Text style={[styles.areaChipText, active && styles.areaChipTextActive]}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <Button
            title="Find Mechanics"
            onPress={() => navigateToMechanics()}
            variant="primary"
            size="large"
            style={styles.heroButton}
          />
        </View>

        {/* 4 Feature Cards directly from Mockups 1 & 10 */}
        <View style={styles.featuresRowGrid}>
          <View style={styles.featureBox}>
            <Text style={styles.featureIcon}>📍</Text>
            <Text style={styles.featureTitle}>Nearby Mechanics</Text>
            <Text style={styles.featureDesc}>Find mechanics near your location</Text>
          </View>
          <View style={styles.featureBox}>
            <Text style={styles.featureIcon}>🛡️</Text>
            <Text style={styles.featureTitle}>Trusted & Verified</Text>
            <Text style={styles.featureDesc}>Verified mechanics & genuine reviews</Text>
          </View>
          <View style={styles.featureBox}>
            <Text style={styles.featureIcon}>⏱️</Text>
            <Text style={styles.featureTitle}>Fast Assistance</Text>
            <Text style={styles.featureDesc}>Get help when you need it most</Text>
          </View>
          <View style={styles.featureBox}>
            <Text style={styles.featureIcon}>💬</Text>
            <Text style={styles.featureTitle}>Easy Communication</Text>
            <Text style={styles.featureDesc}>Call or message directly in the app</Text>
          </View>
        </View>

        {/* Quick Breakdown Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What seems to be the problem?</Text>
          <Text style={styles.sectionSubtitle}>
            Select your issue to find specialists equipped for mobile dispatch
          </Text>

          <View style={styles.grid}>
            {POPULAR_SERVICES.map((svc) => (
              <TouchableOpacity
                key={svc.id}
                activeOpacity={0.75}
                style={styles.categoryCard}
                onPress={() => navigateToMechanics(svc.name)}
              >
                <View style={styles.categoryIconBg}>
                  <Text style={styles.categoryEmoji}>{svc.emoji}</Text>
                </View>
                <Text style={styles.categoryName}>{svc.name}</Text>
                <Text style={styles.categoryDesc} numberOfLines={2}>
                  {svc.desc}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Action Shortcuts */}
        <View style={styles.shortcutsCard}>
          <Text style={styles.shortcutsTitle}>Quick Navigation</Text>
          <View style={styles.shortcutButtonsRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.shortcutBtn}
              onPress={() => router.push('/mechanics')}
            >
              <Text style={styles.shortcutIcon}>🔍</Text>
              <Text style={styles.shortcutBtnTitle}>Mechanics</Text>
              <Text style={styles.shortcutBtnSub}>Browse directory</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.shortcutBtn}
              onPress={() => {
                if (isAuthenticated) {
                  router.push('/requests');
                } else {
                  router.push('/login');
                }
              }}
            >
              <Text style={styles.shortcutIcon}>📋</Text>
              <Text style={styles.shortcutBtnTitle}>My Requests</Text>
              <Text style={styles.shortcutBtnSub}>Track live help</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.shortcutBtn}
              onPress={() => router.push('/request-assistance')}
            >
              <Text style={styles.shortcutIcon}>🚨</Text>
              <Text style={styles.shortcutBtnTitle}>Emergency</Text>
              <Text style={styles.shortcutBtnSub}>Request now</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Trust & Stats Banner */}
        <View style={styles.statsBanner}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>15-25m</Text>
            <Text style={styles.statLabel}>Average ETA</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>100%</Text>
            <Text style={styles.statLabel}>Verified Pros</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>24/7</Text>
            <Text style={styles.statLabel}>Roadside Help</Text>
          </View>
        </View>
      </ScrollView>
      <BottomNav activeTab="home" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scrollContent: {
    backgroundColor: '#F8FAFC',
    paddingBottom: 40,
  },
  heroBanner: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    marginBottom: 12,
  },
  heroBadgeText: {
    color: '#F97316',
    fontWeight: '700',
    fontSize: 12,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 32,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 20,
    marginBottom: 16,
  },
  locationInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  locationPinIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  locationInputText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  gpsButton: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  gpsText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  locationContainer: {
    marginBottom: 16,
  },
  featuresRowGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginTop: -16,
    gap: 10,
    marginBottom: 12,
  },
  featureBox: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  featureIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 10,
    color: '#64748B',
    lineHeight: 14,
  },
  locationLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#CBD5E1',
    marginBottom: 8,
  },
  areaScroll: {
    flexDirection: 'row',
  },
  areaChip: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  areaChipActive: {
    backgroundColor: '#EA580C',
    borderColor: '#F97316',
  },
  areaChipText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  areaChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  heroButton: {
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  categoryEmoji: {
    fontSize: 22,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  categoryDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
  },
  shortcutsCard: {
    marginHorizontal: 16,
    marginTop: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  shortcutsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  shortcutButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  shortcutBtn: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  shortcutIcon: {
    fontSize: 22,
    marginBottom: 6,
  },
  shortcutBtnTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  shortcutBtnSub: {
    fontSize: 10,
    color: '#64748B',
  },
  statsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: '#0F172A',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: '#F97316',
  },
  statLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#334155',
  },
});
