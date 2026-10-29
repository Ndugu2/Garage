import React, { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
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
import { apiGetRequests } from '../services/api';
import { AssistanceRequest } from '../services/types';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const isMechanic = user?.profile?.role === 'mechanic';

  const [requests, setRequests] = useState<AssistanceRequest[]>([]);
  const [loadingStats, setLoadingStats] = useState<boolean>(false);

  useEffect(() => {
    if (isAuthenticated) {
      setLoadingStats(true);
      apiGetRequests()
        .then((res) => setRequests(res))
        .catch(() => {})
        .finally(() => setLoadingStats(false));
    }
  }, [isAuthenticated]);

  const activeCount = requests.filter(
    (r: AssistanceRequest) => r.status === 'pending' || r.status === 'accepted'
  ).length;
  const completedCount = requests.filter((r: AssistanceRequest) => r.status === 'completed').length;

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of Makanika Connect?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  };

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((p: string) => p[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'MC';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <AppHeader title="My Account" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {isAuthenticated && user ? (
          <>
            {/* User Profile Card */}
            <View style={styles.profileCard}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>

              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>

              <View
                style={[
                  styles.rolePill,
                  isMechanic ? styles.mechanicRolePill : styles.driverRolePill,
                ]}
              >
                <Text style={styles.rolePillText}>
                  {isMechanic ? '⚙️ Mechanic Provider' : '🚗 Driver Account'}
                </Text>
              </View>

              {/* Stats Row */}
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{activeCount}</Text>
                  <Text style={styles.statLabel}>Active</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{completedCount}</Text>
                  <Text style={styles.statLabel}>Completed</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{requests.length}</Text>
                  <Text style={styles.statLabel}>Total Requests</Text>
                </View>
              </View>
            </View>

            {/* Navigation Menu Links */}
            <View style={styles.menuCard}>
              <Text style={styles.menuHeader}>Quick Actions</Text>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => router.push('/requests')}
              >
                <Text style={styles.menuIcon}>📋</Text>
                <View style={styles.menuTextCol}>
                  <Text style={styles.menuTitle}>My Assistance Requests</Text>
                  <Text style={styles.menuSub}>Track live dispatches and view past jobs</Text>
                </View>
                {activeCount > 0 && (
                  <View style={styles.badgeCount}>
                    <Text style={styles.badgeCountText}>{activeCount}</Text>
                  </View>
                )}
                <Text style={styles.menuArrow}>→</Text>
              </TouchableOpacity>

              {isMechanic && (
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => router.push('/mechanic-profile')}
                >
                  <Text style={styles.menuIcon}>⚙️</Text>
                  <View style={styles.menuTextCol}>
                    <Text style={styles.menuTitle}>Workshop & Provider Settings</Text>
                    <Text style={styles.menuSub}>Availability, services offered, phone & area</Text>
                  </View>
                  <Text style={styles.menuArrow}>→</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => router.push('/mechanics')}
              >
                <Text style={styles.menuIcon}>🔍</Text>
                <View style={styles.menuTextCol}>
                  <Text style={styles.menuTitle}>Browse Mechanics Directory</Text>
                  <Text style={styles.menuSub}>Find mobile mechanics and garages across Kampala</Text>
                </View>
                <Text style={styles.menuArrow}>→</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => router.push('/settings')}
              >
                <Text style={styles.menuIcon}>🛠️</Text>
                <View style={styles.menuTextCol}>
                  <Text style={styles.menuTitle}>App & Server Connection Settings</Text>
                  <Text style={styles.menuSub}>Configure API server URL and run health diagnostics</Text>
                </View>
                <Text style={styles.menuArrow}>→</Text>
              </TouchableOpacity>
            </View>

            {/* Emergency Hotline Card */}
            <View style={styles.emergencyCard}>
              <Text style={styles.emergencyTitle}>🚨 Kampala Emergency Roadside</Text>
              <Text style={styles.emergencySub}>
                In need of urgent police, traffic breakdown or ambulance services in Uganda?
              </Text>
              <View style={styles.emergencyBtnRow}>
                <TouchableOpacity
                  style={styles.emergencyBtn}
                  onPress={() => Linking.openURL('tel:999')}
                >
                  <Text style={styles.emergencyBtnText}>📞 Police (999)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.emergencyBtn}
                  onPress={() => Linking.openURL('tel:112')}
                >
                  <Text style={styles.emergencyBtnText}>📞 Toll-Free (112)</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Logout Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Text style={styles.logoutButtonText}>Sign Out</Text>
            </TouchableOpacity>
          </>
        ) : (
          /* Guest View */
          <View style={styles.guestContainer}>
            <View style={styles.guestAvatar}>
              <Text style={styles.guestAvatarEmoji}>👤</Text>
            </View>
            <Text style={styles.guestTitle}>Welcome to Makanika Connect</Text>
            <Text style={styles.guestSubtitle}>
              Sign in or create an account to request roadside assistance, track mechanic dispatches, and save your preferred garages in Kampala.
            </Text>

            <View style={styles.guestBtnGroup}>
              <Button
                title="Sign In"
                onPress={() => router.push('/login')}
                variant="primary"
                size="large"
                style={{ width: '100%', marginBottom: 12 }}
              />
              <Button
                title="Create an Account"
                onPress={() => router.push('/register')}
                variant="outline"
                size="large"
                style={{ width: '100%' }}
              />
            </View>

            <TouchableOpacity
              style={[styles.menuItem, { marginTop: 24, width: '100%' }]}
              onPress={() => router.push('/settings')}
            >
              <Text style={styles.menuIcon}>🛠️</Text>
              <View style={styles.menuTextCol}>
                <Text style={styles.menuTitle}>Connection & Server Settings</Text>
                <Text style={styles.menuSub}>Configure API backend URL</Text>
              </View>
              <Text style={styles.menuArrow}>→</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      <BottomNav activeTab="profile" />
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
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EA580C',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  userEmail: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  rolePill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    marginTop: 10,
  },
  driverRolePill: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  mechanicRolePill: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  rolePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 12,
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  menuHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuIcon: {
    fontSize: 22,
    marginRight: 12,
  },
  menuTextCol: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  menuSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  badgeCount: {
    backgroundColor: '#EA580C',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginRight: 6,
  },
  badgeCountText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  menuArrow: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '700',
  },
  emergencyCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  emergencyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#991B1B',
  },
  emergencySub: {
    fontSize: 12,
    color: '#B91C1C',
    marginTop: 4,
    lineHeight: 16,
  },
  emergencyBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  emergencyBtn: {
    flex: 1,
    backgroundColor: '#EF4444',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  emergencyBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  logoutButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 14,
  },
  guestContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  guestAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  guestAvatarEmoji: {
    fontSize: 28,
  },
  guestTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  guestSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
    marginBottom: 20,
  },
  guestBtnGroup: {
    width: '100%',
  },
});
