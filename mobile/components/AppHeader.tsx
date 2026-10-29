import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuth';

interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  showBack = false,
}) => {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.leftRow}>
        {showBack && (
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('/')}
        >
          <View>
            <Text style={styles.logoText}>
              Makanika<Text style={styles.logoAccent}>Connect</Text>
            </Text>
            {title && <Text style={styles.pageSubtitle}>{title}</Text>}
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.rightRow}>
        {isAuthenticated && user ? (
          <View style={styles.userBadgeRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push('/profile')}
              style={[
                styles.roleBadge,
                user.profile.role === 'mechanic' ? styles.mechanicBadge : styles.driverBadge,
              ]}
            >
              <Text style={styles.roleText}>
                {user.profile.role === 'mechanic' ? '⚙️ Mechanic' : '🚗 Driver'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.iconNavBtn}
              onPress={() => router.push('/profile')}
            >
              <Text style={styles.iconNavText}>👤</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.iconNavBtn}
              onPress={() => router.push('/settings')}
            >
              <Text style={styles.iconNavText}>⚙️</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.guestActionRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.iconNavBtn}
              onPress={() => router.push('/settings')}
            >
              <Text style={styles.iconNavText}>⚙️</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.loginBtn}
              onPress={() => router.push('/login')}
            >
              <Text style={styles.loginBtnText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0F172A', // Sleek dark slate
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backButton: {
    padding: 6,
    backgroundColor: '#1E293B',
    borderRadius: 8,
  },
  backArrow: {
    fontSize: 18,
    color: '#F8FAFC',
    fontWeight: 'bold',
  },
  logoText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  logoAccent: {
    color: '#10B981', // Brand green from mockup
  },
  pageSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  driverBadge: {
    backgroundColor: '#1E3A8A',
  },
  mechanicBadge: {
    backgroundColor: '#065F46',
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  logoutBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  logoutText: {
    fontSize: 12,
    color: '#94A3B8',
    textDecorationLine: 'underline',
  },
  loginBtn: {
    backgroundColor: '#059669', // Brand green
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  guestActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconNavBtn: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconNavText: {
    fontSize: 14,
  },
});
