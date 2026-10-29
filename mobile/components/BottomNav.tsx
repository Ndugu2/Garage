import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

export type NavTab = 'home' | 'mechanics' | 'request' | 'requests' | 'profile';

interface BottomNavProps {
  activeTab: NavTab;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab }) => {
  const router = useRouter();

  const navItems = [
    {
      id: 'home' as NavTab,
      label: 'Home',
      icon: '🏠',
      path: '/',
    },
    {
      id: 'mechanics' as NavTab,
      label: 'Search',
      icon: '🔍',
      path: '/mechanics',
    },
    {
      id: 'requests' as NavTab,
      label: 'Requests',
      icon: '📋',
      path: '/requests',
    },
    {
      id: 'profile' as NavTab,
      label: 'Profile',
      icon: '👤',
      path: '/profile',
    },
  ];

  return (
    <View style={styles.navBar}>
      {navItems.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.7}
            style={styles.tabButton}
            onPress={() => {
              if (item.path === '/') {
                router.replace('/');
              } else {
                router.push(item.path as any);
              }
            }}
          >
            <View style={[styles.iconContainer, isActive && styles.activeIconBg]}>
              <Text style={[styles.iconText, isActive && styles.activeIconText]}>
                {item.icon}
              </Text>
            </View>
            <Text
              style={[
                styles.tabLabel,
                isActive ? styles.activeLabel : styles.inactiveLabel,
              ]}
              numberOfLines={1}
            >
              {item.label}
            </Text>
            {isActive && <View style={styles.activeDot} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  navBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingBottom: 16,
    paddingTop: 8,
    paddingHorizontal: 8,
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconBg: {
    backgroundColor: '#ECFDF5',
  },
  iconText: {
    fontSize: 20,
    opacity: 0.7,
  },
  activeIconText: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  activeLabel: {
    color: '#059669', // Brand green from mockup
    fontWeight: '800',
  },
  inactiveLabel: {
    color: '#64748B',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#059669',
    marginTop: 2,
  },
});
