import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '../components/AppHeader';
import { Button } from '../components/Button';
import {
  apiHealthCheck,
  fetchCsrfToken,
  getApiBaseUrl,
  setApiBaseUrl,
} from '../services/api';

export default function SettingsScreen() {
  const router = useRouter();

  const [currentUrl, setCurrentUrl] = useState<string>(getApiBaseUrl());
  const [testing, setTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    latencyMs?: number;
    service?: string;
  } | null>(null);

  const handleApplyUrl = () => {
    if (!currentUrl.trim()) {
      Alert.alert('Error', 'API URL cannot be empty.');
      return;
    }
    setApiBaseUrl(currentUrl.trim());
    Alert.alert('Updated', `API Base URL set to: ${currentUrl.trim()}`);
  };

  const handlePreset = (url: string) => {
    setCurrentUrl(url);
    setApiBaseUrl(url);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);

    const startTime = Date.now();
    try {
      setApiBaseUrl(currentUrl.trim());
      const health = await apiHealthCheck();
      const csrf = await fetchCsrfToken();
      const latency = Date.now() - startTime;

      setTestResult({
        success: true,
        message: `Connected successfully! CSRF token ${csrf ? 'acquired' : 'pending'}.`,
        latencyMs: latency,
        service: health.service || 'Makanika Connect API',
      });
    } catch (err: any) {
      const latency = Date.now() - startTime;
      setTestResult({
        success: false,
        message: `Failed to connect to ${currentUrl}: ${err.message || 'Network request failed'}. Ensure Django server is running on 0.0.0.0:8000.`,
        latencyMs: latency,
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <AppHeader title="App Settings" showBack />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Backend Connectivity Configuration */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Backend Server Configuration</Text>
          <Text style={styles.cardSub}>
            Configure the Django API server URL that this app connects to for mechanics, assistance requests, and auth.
          </Text>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={currentUrl}
              onChangeText={setCurrentUrl}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="http://10.0.2.2:8000/api"
            />
            <TouchableOpacity style={styles.applyBtn} onPress={handleApplyUrl}>
              <Text style={styles.applyBtnText}>Apply</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Presets */}
          <Text style={styles.presetLabel}>Quick Presets:</Text>
          <View style={styles.presetRow}>
            <TouchableOpacity
              style={styles.presetBtn}
              onPress={() => handlePreset('http://10.0.2.2:8000/api')}
            >
              <Text style={styles.presetBtnText}>📱 Android (10.0.2.2)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.presetBtn}
              onPress={() => handlePreset('http://localhost:8000/api')}
            >
              <Text style={styles.presetBtnText}>💻 Web / iOS (Localhost)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.presetBtn}
              onPress={() => handlePreset('http://127.0.0.1:8000/api')}
            >
              <Text style={styles.presetBtnText}>🌐 127.0.0.1:8000</Text>
            </TouchableOpacity>
          </View>

          {/* Diagnostic Test Button */}
          <Button
            title={testing ? 'Testing Connection...' : '🔌 Ping Server & Diagnostics'}
            onPress={handleTestConnection}
            loading={testing}
            variant="outline"
            style={{ marginTop: 14 }}
          />

          {/* Diagnostic Result */}
          {testResult && (
            <View
              style={[
                styles.resultBox,
                testResult.success ? styles.resultBoxSuccess : styles.resultBoxError,
              ]}
            >
              <Text style={styles.resultHeader}>
                {testResult.success ? '🟢 Server Online' : '🔴 Connection Failed'}
              </Text>
              <Text style={styles.resultMsg}>{testResult.message}</Text>
              {testResult.latencyMs !== undefined && (
                <Text style={styles.resultLatency}>
                  Response Latency: {testResult.latencyMs} ms
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Emergency Hotlines Uganda */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Kampala Roadside Hotlines</Text>
          <Text style={styles.cardSub}>
            Direct emergency response contacts in Uganda:
          </Text>

          <TouchableOpacity
            style={styles.hotlineItem}
            onPress={() => Linking.openURL('tel:999')}
          >
            <View style={styles.hotlineLeft}>
              <Text style={styles.hotlineName}>Uganda Police Emergency</Text>
              <Text style={styles.hotlineNum}>999</Text>
            </View>
            <Text style={styles.hotlineAction}>Call</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.hotlineItem}
            onPress={() => Linking.openURL('tel:112')}
          >
            <View style={styles.hotlineLeft}>
              <Text style={styles.hotlineName}>National Toll-Free Emergency</Text>
              <Text style={styles.hotlineNum}>112</Text>
            </View>
            <Text style={styles.hotlineAction}>Call</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.hotlineItem}
            onPress={() => Linking.openURL('tel:0800199099')}
          >
            <View style={styles.hotlineLeft}>
              <Text style={styles.hotlineName}>Traffic Safety & Breakdown</Text>
              <Text style={styles.hotlineNum}>0800 199 099</Text>
            </View>
            <Text style={styles.hotlineAction}>Call</Text>
          </TouchableOpacity>
        </View>

        {/* About App */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>About Makanika Connect</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>App Name:</Text>
            <Text style={styles.infoValue}>Makanika Connect Mobile</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Version:</Text>
            <Text style={styles.infoValue}>1.0.0 (Release Build)</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Platform:</Text>
            <Text style={styles.infoValue}>
              {Platform.OS.toUpperCase()} {Platform.Version}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Coverage:</Text>
            <Text style={styles.infoValue}>Kampala Metropolitan & Highways</Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
    lineHeight: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
  },
  applyBtn: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  presetLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
    marginTop: 4,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  presetBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  presetBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  resultBox: {
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  resultBoxSuccess: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  resultBoxError: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  resultHeader: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  resultMsg: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 16,
  },
  resultLatency: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
    marginTop: 4,
  },
  hotlineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  hotlineLeft: {
    flex: 1,
  },
  hotlineName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  hotlineNum: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
    marginTop: 2,
  },
  hotlineAction: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
});
