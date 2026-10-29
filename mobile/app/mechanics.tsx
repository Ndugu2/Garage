import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '../components/AppHeader';
import { BottomNav } from '../components/BottomNav';
import { MechanicCard } from '../components/MechanicCard';
import { apiGetMechanics } from '../services/api';
import { Mechanic } from '../services/types';

const SERVICES_FILTER = [
  'All',
  'Tyre change',
  'Battery',
  'Towing',
  'Engine',
  'Electrical',
  'Overheating',
];

export default function MechanicsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    service?: string;
    area?: string;
    latitude?: string;
    longitude?: string;
  }>();

  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedService, setSelectedService] = useState<string>(params.service || 'All');
  const [availableOnly, setAvailableOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadMechanics = async () => {
    try {
      setError(null);
      const queryParams: any = {};
      if (selectedService && selectedService !== 'All') {
        queryParams.service = selectedService;
      }
      if (availableOnly) {
        queryParams.available = true;
      }
      if (params.latitude && params.longitude) {
        queryParams.latitude = parseFloat(params.latitude);
        queryParams.longitude = parseFloat(params.longitude);
        queryParams.radius = 40;
      }

      const data = await apiGetMechanics(queryParams);
      setMechanics(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load mechanics.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMechanics();
  }, [selectedService, availableOnly]);

  const onRefresh = () => {
    setRefreshing(true);
    loadMechanics();
  };

  const filteredMechanics = mechanics.filter((m: Mechanic) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.area.toLowerCase().includes(q) ||
      m.services.some((s: string) => s.toLowerCase().includes(q))
    );
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <AppHeader title="Mechanics Directory" showBack />
      <View style={styles.container}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search mechanics by name, area, or service..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearSearch}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filters Row */}
        <View style={styles.filterSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.serviceChips}
          >
            {SERVICES_FILTER.map((service) => {
              const active = selectedService === service;
              return (
                <TouchableOpacity
                  key={service}
                  activeOpacity={0.7}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setSelectedService(service)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {service}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.toggleRow}>
            <View style={styles.toggleLeft}>
              <Text style={styles.toggleLabel}>Available only</Text>
            </View>
            <Switch
              value={availableOnly}
              onValueChange={setAvailableOnly}
              trackColor={{ false: '#CBD5E1', true: '#FDBA74' }}
              thumbColor={availableOnly ? '#EA580C' : '#F1F5F9'}
            />
          </View>
        </View>

        {/* Location indication if present */}
        {params.area && (
          <View style={styles.locationBanner}>
            <Text style={styles.locationBannerText}>
              📍 Showing mechanics nearest to <Text style={styles.bold}>{params.area}</Text>
            </Text>
          </View>
        )}

        {/* Content */}
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#EA580C" />
            <Text style={styles.loadingText}>Finding nearby Kampala mechanics...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorEmoji}>⚠️</Text>
            <Text style={styles.errorTitle}>Could not load mechanics</Text>
            <Text style={styles.errorDesc}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={loadMechanics}>
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredMechanics}
            keyExtractor={(item: Mechanic) => item.id.toString()}
            renderItem={({ item }: { item: Mechanic }) => <MechanicCard mechanic={item} />}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#EA580C']} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyEmoji}>🔧</Text>
                <Text style={styles.emptyTitle}>No mechanics found</Text>
                <Text style={styles.emptySubtitle}>
                  Try clearing your search query or selecting a different service category.
                </Text>
              </View>
            }
          />
        )}
      </View>
      <BottomNav activeTab="mechanics" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    gap: 8,
  },
  searchIcon: {
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  clearSearch: {
    fontSize: 14,
    color: '#94A3B8',
    padding: 4,
  },
  filterSection: {
    marginBottom: 6,
  },
  serviceChips: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 8,
  },
  chip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: '#EA580C',
    borderColor: '#EA580C',
  },
  chipText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 4,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  locationBanner: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#DBEAFE',
  },
  locationBannerText: {
    fontSize: 12,
    color: '#1E40AF',
  },
  bold: {
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorEmoji: {
    fontSize: 36,
    marginBottom: 10,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  errorDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: '#EA580C',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
});
