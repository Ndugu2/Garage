import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '../components/AppHeader';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/Button';
import { InputField } from '../components/InputField';
import { useAuth } from '../hooks/useAuth';
import { apiCreateRequest, apiGetMechanics } from '../services/api';
import { Mechanic } from '../services/types';

const COMMON_ISSUES = [
  { id: 'Tyre change', title: 'Flat Tyre', emoji: '🛞' },
  { id: 'Battery', title: 'Dead Battery', emoji: '🔋' },
  { id: 'Towing', title: 'Need Towing', emoji: '🛻' },
  { id: 'Engine', title: 'Engine Fault', emoji: '⚙️' },
  { id: 'Electrical', title: 'Electrical / Lights', emoji: '⚡' },
  { id: 'Overheating', title: 'Engine Overheating', emoji: '🌡️' },
];

const KAMPALA_PRESETS = [
  { name: 'Kampala City Centre / Road', lat: 0.3136, lon: 32.5811 },
  { name: 'Kololo', lat: 0.3298, lon: 32.5975 },
  { name: 'Nakasero', lat: 0.3242, lon: 32.5786 },
  { name: 'Ntinda / Kisaasi', lat: 0.3541, lon: 32.6102 },
  { name: 'Bugolobi / Port Bell', lat: 0.3155, lon: 32.6253 },
  { name: 'Wandegeya / Makerere', lat: 0.3344, lon: 32.5701 },
  { name: 'Nakawa / Jinja Road', lat: 0.3312, lon: 32.6289 },
  { name: 'Entebbe Road / Kibuye', lat: 0.2980, lon: 32.5710 },
];

export default function RequestAssistanceScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const params = useLocalSearchParams<{
    mechanicId?: string;
    mechanicName?: string;
  }>();

  const [availableMechanics, setAvailableMechanics] = useState<Mechanic[]>([]);
  const [selectedMechanicId, setSelectedMechanicId] = useState<number | null>(
    params.mechanicId ? parseInt(params.mechanicId, 10) : null
  );
  const [selectedIssue, setSelectedIssue] = useState<string>('Tyre change');
  const [selectedLocation, setSelectedLocation] = useState(KAMPALA_PRESETS[0]);
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMechanics, setLoadingMechanics] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchMechanics = async () => {
      setLoadingMechanics(true);
      try {
        const list = await apiGetMechanics({ available: true });
        setAvailableMechanics(list);
        if (!selectedMechanicId && list.length > 0) {
          setSelectedMechanicId(list[0].id);
        }
      } catch (err) {
        console.warn('Could not load mechanics:', err);
      } finally {
        setLoadingMechanics(false);
      }
    };

    fetchMechanics();
  }, []);

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Sign in Required',
        'Please sign in or register a Driver account to dispatch assistance.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => router.push('/login') },
        ]
      );
      return;
    }

    if (user?.profile.role !== 'driver') {
      setErrorMessage('Assistance requests can only be placed by Driver accounts.');
      return;
    }

    if (!selectedMechanicId) {
      setErrorMessage('Please select a mechanic to assist you.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      await apiCreateRequest({
        mechanic: selectedMechanicId,
        issue: selectedIssue,
        notes: notes.trim(),
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lon,
      });

      Alert.alert(
        'Request Dispatched! 🚗',
        'Your assistance request has been sent to the mechanic. You can track progress and chat with the provider.',
        [{ text: 'View Requests', onPress: () => router.replace('/requests') }]
      );
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit assistance request.');
    } finally {
      setLoading(false);
    }
  };

  const chosenMechanic = availableMechanics.find((m: Mechanic) => m.id === selectedMechanicId);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <AppHeader title="Request Help" showBack />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.title}>Dispatch Roadside Help</Text>
              <Text style={styles.subtitle}>
                Specify your breakdown details and location so the nearest mechanic can reach you quickly.
              </Text>
            </View>

            {errorMessage && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
              </View>
            )}

            {/* Selected Mechanic Info */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionLabel}>Assigned Mechanic</Text>
              {loadingMechanics ? (
                <ActivityIndicator size="small" color="#EA580C" />
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mechScroll}>
                  {availableMechanics.map((m: Mechanic) => {
                    const isSelected = m.id === selectedMechanicId;
                    return (
                      <TouchableOpacity
                        key={m.id}
                        activeOpacity={0.7}
                        style={[styles.mechChip, isSelected && styles.mechChipSelected]}
                        onPress={() => setSelectedMechanicId(m.id)}
                      >
                        <Text style={[styles.mechName, isSelected && styles.mechNameSelected]}>
                          {m.name}
                        </Text>
                        <Text style={styles.mechArea}>📍 {m.area}</Text>
                        {m.eta ? <Text style={styles.mechEta}>⏱️ {m.eta}</Text> : null}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </View>

            {/* Issue Category */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionLabel}>What is the problem?</Text>
              <View style={styles.issueGrid}>
                {COMMON_ISSUES.map((issue) => {
                  const isSelected = selectedIssue === issue.id;
                  return (
                    <TouchableOpacity
                      key={issue.id}
                      activeOpacity={0.7}
                      style={[styles.issueChip, isSelected && styles.issueChipSelected]}
                      onPress={() => setSelectedIssue(issue.id)}
                    >
                      <Text style={styles.issueEmoji}>{issue.emoji}</Text>
                      <Text
                        style={[
                          styles.issueTitle,
                          isSelected && styles.issueTitleSelected,
                        ]}
                      >
                        {issue.title}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Breakdown Location */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionLabel}>Breakdown Location (Kampala)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.locationScroll}>
                {KAMPALA_PRESETS.map((loc) => {
                  const isSelected = selectedLocation.name === loc.name;
                  return (
                    <TouchableOpacity
                      key={loc.name}
                      activeOpacity={0.7}
                      style={[styles.locChip, isSelected && styles.locChipSelected]}
                      onPress={() => setSelectedLocation(loc)}
                    >
                      <Text style={[styles.locText, isSelected && styles.locTextSelected]}>
                        📍 {loc.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              <Text style={styles.coordsHint}>
                Coordinates: {selectedLocation.lat.toFixed(4)}, {selectedLocation.lon.toFixed(4)}
              </Text>
            </View>

            {/* Additional Notes */}
            <InputField
              label="Vehicle Details & Description"
              placeholder="e.g. White Toyota Harrier with flat rear right tyre near petrol station..."
              multiline
              numberOfLines={4}
              value={notes}
              onChangeText={setNotes}
            />

            {/* Submit Button */}
            <Button
              title={loading ? 'Dispatching...' : 'Confirm & Request Assistance'}
              onPress={handleSubmit}
              loading={loading}
              variant="primary"
              size="large"
              style={styles.submitBtn}
            />

            {!isAuthenticated && (
              <Text style={styles.authNotice}>
                * You will be prompted to sign in with your Driver account to place this request.
              </Text>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <BottomNav activeTab="request" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
  },
  sectionBlock: {
    marginBottom: 18,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  mechScroll: {
    flexDirection: 'row',
  },
  mechChip: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    marginRight: 10,
    minWidth: 140,
  },
  mechChipSelected: {
    backgroundColor: '#FFF7ED',
    borderColor: '#EA580C',
  },
  mechName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  mechNameSelected: {
    color: '#EA580C',
  },
  mechArea: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  mechEta: {
    fontSize: 11,
    color: '#0EA5E9',
    marginTop: 4,
    fontWeight: '600',
  },
  issueGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  issueChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  issueChipSelected: {
    backgroundColor: '#FFF7ED',
    borderColor: '#EA580C',
  },
  issueEmoji: {
    fontSize: 16,
  },
  issueTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  issueTitleSelected: {
    color: '#EA580C',
    fontWeight: '700',
  },
  locationScroll: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  locChip: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    marginRight: 8,
  },
  locChipSelected: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  locText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  locTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  coordsHint: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  submitBtn: {
    marginTop: 10,
  },
  authNotice: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
});
