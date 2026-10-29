import React from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../hooks/useAuth';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#F8FAFC' },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="mechanics" />
          <Stack.Screen name="mechanic-details" />
          <Stack.Screen name="request-assistance" />
          <Stack.Screen name="requests" />
          <Stack.Screen name="request-details" />
          <Stack.Screen name="mechanic-profile" />
          <Stack.Screen name="profile" />
          <Stack.Screen name="settings" />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
