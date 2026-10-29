import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
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
import { UserRole } from '../services/types';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();

  const [role, setRole] = useState<UserRole>('driver');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    const emailToUse = email.trim() || `${phone.replace(/\D/g, '') || 'user'}@makanika.ug`;
    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      await register(name.trim(), email.trim(), password, role);
      if (role === 'mechanic') {
        router.replace('/requests');
      } else {
        router.replace('/mechanics');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <AppHeader title="Sign Up" showBack />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>
                Join Makanika Connect to request roadside repairs or list your garage in Kampala.
              </Text>
            </View>

            {/* Role Switcher */}
            <View style={styles.roleContainer}>
              <View style={styles.segmentedRow}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.segmentBtn, role === 'driver' && styles.segmentBtnActive]}
                  onPress={() => setRole('driver')}
                >
                  <Text style={[styles.segmentText, role === 'driver' && styles.segmentTextActive]}>
                    Driver
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.segmentBtn, role === 'mechanic' && styles.segmentBtnActive]}
                  onPress={() => setRole('mechanic')}
                >
                  <Text style={[styles.segmentText, role === 'mechanic' && styles.segmentTextActive]}>
                    Mechanic
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.segmentBtn, role === ('admin' as any) && styles.segmentBtnActive]}
                  onPress={() => setRole('driver')}
                >
                  <Text style={styles.segmentText}>
                    Administrator
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {errorMessage && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
              </View>
            )}

            <InputField
              label="Full Name"
              placeholder="Enter your full name"
              value={name}
              onChangeText={setName}
            />

            <InputField
              label="Phone Number"
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />

            <InputField
              label="Email Address (optional)"
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            <InputField
              label="Password"
              placeholder="Create a password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <Button
              title="Register"
              onPress={handleRegister}
              loading={loading}
              variant="primary"
              size="large"
              style={styles.registerBtn}
            />

            <View style={styles.loginRow}>
              <Text style={styles.loginPrompt}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/login')}>
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    padding: 20,
    justifyContent: 'center',
    flexGrow: 1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  roleContainer: {
    marginBottom: 16,
  },
  roleLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  roleOption: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  roleOptionActive: {
    backgroundColor: '#FFF7ED',
    borderColor: '#EA580C',
  },
  roleEmoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  roleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  roleTitleActive: {
    color: '#EA580C',
  },
  roleSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
  },
  registerBtn: {
    marginTop: 8,
    marginBottom: 18,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginPrompt: {
    fontSize: 14,
    color: '#64748B',
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EA580C',
  },
});
