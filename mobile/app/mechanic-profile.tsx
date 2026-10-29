import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '../components/AppHeader';
import { Button } from '../components/Button';
import { InputField } from '../components/InputField';
import { useAuth } from '../hooks/useAuth';
import {
  apiCreateMechanicProfile,
  apiGetMechanicProfile,
  apiUpdateMechanicProfile,
} from '../services/api';
import { Mechanic } from '../services/types';

const KAMPALA_AREAS = [
  { name: 'Central Kampala', lat: 0.3136, lon: 32.5811 },
  { name: 'Kololo', lat: 0.3298, lon: 32.5975 },
  { name: 'Nakasero', lat: 0.3242, lon: 32.5786 },
  { name: 'Ntinda', lat: 0.3541, lon: 32.6102 },
  { name: 'Bugolobi', lat: 0.3155, lon: 32.6253 },
  { name: 'Industrial Area', lat: 0.3178, lon: 32.6041 },
  { name: 'Wandegeya', lat: 0.3344, lon: 32.5701 },
  { name: 'Nakawa', lat: 0.3312, lon: 32.6289 },
  { name: 'Kibuye / Entebbe Rd', lat: 0.2980, lon: 32.5710 },
];

const AVAILABLE_SERVICES = [
  { id: 'Tyre change', label: 'Tyre change', emoji: '🛞' },
  { id: 'Battery', label: 'Battery / Jumpstart', emoji: '🔋' },
  { id: 'Towing', label: 'Towing / Breakdown', emoji: '🛻' },
  { id: 'Engine', label: 'Engine Repairs', emoji: '⚙️' },
  { id: 'Electrical', label: 'Electrical & Alternator', emoji: '⚡' },
  { id: 'Overheating', label: 'Radiator & Overheating', emoji: '🌡️' },
];

export default function MechanicProfileScreen() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [profileExists, setProfileExists] = useState<boolean>(false);

  // Form states
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [selectedArea, setSelectedArea] = useState(KAMPALA_AREAS[0]);
  const [serviceMode, setServiceMode] = useState<'mobile' | 'garage'>('mobile');
  const [isAvailable, setIsAvailable] = useState<boolean>(true);
  const [selectedServices, setSelectedServices] = useState<string[]>(['Tyre change', 'Battery']);

  // Stats
  const [rating, setRating] = useState<number>(5.0);
  const [reviewCount, setReviewCount] = useState<number>(0);
  const [isVerified, setIsVerified] = useState<boolean>(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLoading(false);
      return;
    }

    const loadProfile = async () => {
      try {
        setLoading(true);
        const data = await apiGetMechanicProfile();
        if (data) {
          setProfileExists(true);
          setName(data.name || '');
          setPhone(data.phone || '');
          setServiceMode(data.service_mode || 'mobile');
          setIsAvailable(data.is_available ?? true);
          setSelectedServices(data.services || ['Tyre change', 'Battery']);
          setRating(data.rating ?? 5.0);
          setReviewCount(data.review_count ?? 0);
          setIsVerified(!!data.is_verified);

          const matchedArea = KAMPALA_AREAS.find((a) => a.name === data.area);
          if (matchedArea) setSelectedArea(matchedArea);
        } else {
          setProfileExists(false);
          setName(user?.name ? `${user.name} Auto Care` : 'Kampala Rapid Mechanic');
        }
      } catch (err) {
        console.warn('Error loading provider profile', err);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      loadProfile();
    }
  }, [isAuthenticated, authLoading]);

  const toggleService = (serviceId: string) => {
    if (selectedServices.includes(serviceId)) {
      if (selectedServices.length === 1) {
        Alert.alert('Required', 'Please select at least one service offered.');
        return;
      }
      setSelectedServices(selectedServices.filter((s: string) => s !== serviceId));
    } else {
      setSelectedServices([...selectedServices, serviceId]);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a workshop or mechanic name.');
      return;
    }

    try {
      setSaving(true);
      const payload: any = {
        name: name.trim(),
        phone: phone.trim(),
        area: selectedArea.name,
        latitude: selectedArea.lat,
        longitude: selectedArea.lon,
        service_mode: serviceMode,
        is_available: isAvailable,
        services: selectedServices,
      };

      if (profileExists) {
        await apiUpdateMechanicProfile(payload);
      } else {
        await apiCreateMechanicProfile(payload);
        setProfileExists(true);
      }

      Alert.alert('Success', 'Mechanic workshop profile updated successfully!');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || authLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <AppHeader title="Mechanic Workspace" showBack />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#F97316" />
          <Text style={styles.loadingText}>Loading workshop profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <AppHeader title="Mechanic Workspace" showBack />
        <View style={styles.centerContainer}>
          <Text style={styles.errorIcon}>🔒</Text>
          <Text style={styles.errorTitle}>Sign In Required</Text>
          <Text style={styles.errorSubtitle}>
            Please sign in with a Mechanic account to manage your workshop.
          </Text>
          <Button
            title="Sign In as Mechanic"
            onPress={() => router.push('/login')}
            variant="primary"
            style={{ marginTop: 16 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (user?.profile?.role !== 'mechanic') {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <AppHeader title="Mechanic Workspace" showBack />
        <View style={styles.centerContainer}>
          <Text style={styles.errorIcon}>🚗</Text>
          <Text style={styles.errorTitle}>Driver Account Detected</Text>
          <Text style={styles.errorSubtitle}>
            This screen is reserved for registered Mechanics and Garages. You are currently logged in as a Driver.
          </Text>
          <Button
            title="Find Roadside Mechanics"
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
      <AppHeader title="Workshop Settings" showBack />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Quick Stats Banner */}
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statScore}>★ {rating.toFixed(1)}</Text>
              <Text style={styles.statLabel}>Average Rating</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statScore}>{reviewCount}</Text>
              <Text style={styles.statLabel}>Reviews</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statScore}>{isVerified ? '✓ Verified' : 'Standard'}</Text>
              <Text style={styles.statLabel}>Badge Status</Text>
            </View>
          </View>

          {/* Availability Toggle Box */}
          <View style={styles.toggleCard}>
            <View style={styles.toggleLeft}>
              <View style={styles.toggleTitleRow}>
                <View
                  style={[
                    styles.toggleDot,
                    { backgroundColor: isAvailable ? '#10B981' : '#94A3B8' },
                  ]}
                />
                <Text style={styles.toggleTitle}>
                  {isAvailable ? 'Online & Accepting Jobs' : 'Offline / Unavailable'}
                </Text>
              </View>
              <Text style={styles.toggleSub}>
                {isAvailable
                  ? 'Drivers in Kampala can see your listing and request immediate dispatch.'
                  : 'Your profile is hidden from active search results.'}
              </Text>
            </View>
            <Switch
              value={isAvailable}
              onValueChange={setIsAvailable}
              trackColor={{ false: '#CBD5E1', true: '#FED7AA' }}
              thumbColor={isAvailable ? '#EA580C' : '#94A3B8'}
            />
          </View>

          {/* Profile Details Form */}
          <View style={styles.formCard}>
            <Text style={styles.cardHeader}>Workshop / Provider Information</Text>

            <InputField
              label="Workshop / Business Name"
              placeholder="e.g. QuickFix Kampala Motors"
              value={name}
              onChangeText={setName}
            />

            <InputField
              label="Contact Phone Number"
              placeholder="+256 700 000 000"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />

            {/* Service Mode Selector */}
            <Text style={styles.fieldLabel}>Operating Service Mode</Text>
            <View style={styles.modeRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.modeButton,
                  serviceMode === 'mobile' && styles.modeButtonActive,
                ]}
                onPress={() => setServiceMode('mobile')}
              >
                <Text style={styles.modeEmoji}>🚙</Text>
                <Text
                  style={[
                    styles.modeButtonText,
                    serviceMode === 'mobile' && styles.modeButtonTextActive,
                  ]}
                >
                  Mobile Unit
                </Text>
                <Text style={styles.modeSubText}>Goes to driver</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.modeButton,
                  serviceMode === 'garage' && styles.modeButtonActive,
                ]}
                onPress={() => setServiceMode('garage')}
              >
                <Text style={styles.modeEmoji}>🏬</Text>
                <Text
                  style={[
                    styles.modeButtonText,
                    serviceMode === 'garage' && styles.modeButtonTextActive,
                  ]}
                >
                  Garage Workshop
                </Text>
                <Text style={styles.modeSubText}>Driver visits garage</Text>
              </TouchableOpacity>
            </View>

            {/* Operating Area Selection */}
            <Text style={styles.fieldLabel}>Base Area in Kampala</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.areaScroll}
            >
              {KAMPALA_AREAS.map((area) => {
                const active = selectedArea.name === area.name;
                return (
                  <TouchableOpacity
                    key={area.name}
                    style={[styles.areaChip, active && styles.areaChipActive]}
                    onPress={() => setSelectedArea(area)}
                  >
                    <Text
                      style={[
                        styles.areaChipText,
                        active && styles.areaChipTextActive,
                      ]}
                    >
                      📍 {area.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Services Checklist */}
            <Text style={styles.fieldLabel}>Services You Provide</Text>
            <View style={styles.servicesGrid}>
              {AVAILABLE_SERVICES.map((s) => {
                const selected = selectedServices.includes(s.id);
                return (
                  <TouchableOpacity
                    key={s.id}
                    style={[
                      styles.serviceCheckbox,
                      selected && styles.serviceCheckboxActive,
                    ]}
                    onPress={() => toggleService(s.id)}
                  >
                    <Text style={styles.serviceEmoji}>{s.emoji}</Text>
                    <Text
                      style={[
                        styles.serviceLabel,
                        selected && styles.serviceLabelActive,
                      ]}
                    >
                      {s.label}
                    </Text>
                    <Text style={styles.checkboxCheck}>{selected ? '✓' : '+'}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Button
              title="Save Workshop Profile"
              onPress={handleSave}
              loading={saving}
              variant="primary"
              size="large"
              style={{ marginTop: 20 }}
            />
          </View>

          {/* Quick Links */}
          <TouchableOpacity
            style={styles.incomingRequestsBanner}
            onPress={() => router.push('/requests')}
          >
            <Text style={styles.bannerEmoji}>📋</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTitle}>View Incoming Assistance Requests</Text>
              <Text style={styles.bannerSub}>Accept or manage active driver dispatches</Text>
            </View>
            <Text style={styles.bannerArrow}>→</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
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
  },
  errorIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  errorSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#0F172A',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    marginBottom: 14,
  },
  statItem: {
    alignItems: 'center',
  },
  statScore: {
    fontSize: 16,
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
  toggleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  toggleLeft: {
    flex: 1,
    marginRight: 10,
  },
  toggleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  toggleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  toggleSub: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginTop: 10,
    marginBottom: 6,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  modeButton: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    alignItems: 'center',
  },
  modeButtonActive: {
    borderColor: '#F97316',
    backgroundColor: '#FFF7ED',
  },
  modeEmoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  modeButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  modeButtonTextActive: {
    color: '#EA580C',
  },
  modeSubText: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  areaScroll: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  areaChip: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  areaChipActive: {
    backgroundColor: '#FFF7ED',
    borderColor: '#F97316',
  },
  areaChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  areaChipTextActive: {
    color: '#EA580C',
    fontWeight: '700',
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 6,
  },
  serviceCheckboxActive: {
    backgroundColor: '#FFF7ED',
    borderColor: '#F97316',
  },
  serviceEmoji: {
    fontSize: 14,
  },
  serviceLabel: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },
  serviceLabelActive: {
    color: '#EA580C',
    fontWeight: '700',
  },
  checkboxCheck: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
    marginLeft: 2,
  },
  incomingRequestsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 12,
  },
  bannerEmoji: {
    fontSize: 24,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E40AF',
  },
  bannerSub: {
    fontSize: 11,
    color: '#3B82F6',
  },
  bannerArrow: {
    fontSize: 18,
    color: '#1E40AF',
    fontWeight: '800',
  },
});
