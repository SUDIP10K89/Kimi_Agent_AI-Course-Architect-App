/**
 * Settings Screen
 *
 * Backend-backed settings for theme and AI configuration.
 */

import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  AlertCircle,
  CheckCircle2,
  Cpu,
  Eye,
  EyeOff,
  Globe,
  KeyRound,
  Loader2,
  LogOut,
  Moon,
  Sun,
  User,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import * as settingsApi from '@/api/settingsApi';

const SettingsScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, colors } = useTheme();

  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gemini-2.5-flash');
  const [baseUrl, setBaseUrl] = useState('https://generativelanguage.googleapis.com/v1beta/openai/');
  const [useCustomProvider, setUseCustomProvider] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const styles = createStyles(colors);

  const loadSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      setMessage(null);

      const response = await settingsApi.getSettings();
      if (response.success && response.data) {
        const { apiSettings } = response.data;
        setModel(apiSettings.model);
        setBaseUrl(apiSettings.baseUrl);
        setUseCustomProvider(apiSettings.useCustomProvider);
        setHasApiKey(apiSettings.hasApiKey);
      } else {
        setMessage({ type: 'error', text: response.error || 'Failed to load settings' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.error || error?.message || 'Failed to load settings' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [loadSettings])
  );

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  const handleToggleCustomProvider = async (value: boolean) => {
    setUseCustomProvider(value);
    setMessage(null);

    try {
      const response = await settingsApi.updateSettings({
        apiKey: '',
        model,
        baseUrl,
        useCustomProvider: value,
      });

      if (response.success && response.data) {
        setUseCustomProvider(response.data.apiSettings.useCustomProvider);
        setHasApiKey(response.data.apiSettings.hasApiKey);
        setMessage({
          type: 'success',
          text: `Custom AI provider ${value ? 'enabled' : 'disabled'} successfully`,
        });
      } else {
        throw new Error(response.error || 'Failed to update settings');
      }
    } catch (error: any) {
      setUseCustomProvider(!value);
      setMessage({ type: 'error', text: error?.error || error?.message || 'Failed to update settings' });
    }
  };

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      setMessage(null);

      const response = await settingsApi.updateSettings({
        apiKey,
        model,
        baseUrl,
        useCustomProvider,
      });

      if (response.success && response.data) {
        setModel(response.data.apiSettings.model);
        setBaseUrl(response.data.apiSettings.baseUrl);
        setUseCustomProvider(response.data.apiSettings.useCustomProvider);
        setHasApiKey(response.data.apiSettings.hasApiKey);
        setApiKey('');
        setShowApiKey(false);
        setMessage({ type: 'success', text: 'Settings saved successfully' });
      } else {
        throw new Error(response.error || 'Failed to save settings');
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.error || error?.message || 'Failed to save settings' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      setMessage({ type: 'error', text: 'Enter an API key to test the connection' });
      return;
    }

    try {
      setIsTesting(true);
      setMessage(null);

      const response = await settingsApi.testSettings(apiKey.trim(), model.trim(), baseUrl.trim());

      if (response.success) {
        setMessage({ type: 'success', text: 'API connection successful' });
      } else {
        throw new Error(response.error || 'API connection failed');
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.error || error?.message || 'API connection failed' });
    } finally {
      setIsTesting(false);
    }
  };

  const themeLabel = theme === 'light' ? 'Light mode' : 'Dark mode';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name
                ? user.name
                    .split(' ')
                    .map((part) => part[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)
                : 'U'}
            </Text>
          </View>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.infoRow}>
            <User size={18} color={colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.settingLabel}>Name</Text>
              <Text style={styles.settingValue}>{user?.name || 'N/A'}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <User size={18} color={colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.settingLabel}>Email</Text>
              <Text style={styles.settingValue}>{user?.email || 'N/A'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <View style={styles.settingItem}>
            {theme === 'dark' ? <Moon size={20} color={colors.primary} /> : <Sun size={20} color={colors.primary} />}
            <Text style={styles.settingLabel}>Dark Mode</Text>
            <Switch
              value={theme === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.primarySoft }}
              thumbColor={theme === 'dark' ? colors.primary : colors.surface}
            />
          </View>
          <Text style={styles.helperText}>{themeLabel}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Configuration</Text>

          {isLoading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadingText}>Loading settings...</Text>
            </View>
          ) : (
            <>
              <View style={styles.settingItem}>
                <Cpu size={20} color={colors.primary} />
                <View style={styles.settingContent}>
                  <Text style={styles.settingLabel}>Use Custom AI Provider</Text>
                  <Text style={styles.settingDescription}>
                    Enable your own provider settings for course generation
                  </Text>
                </View>
                <Switch
                  value={useCustomProvider}
                  onValueChange={handleToggleCustomProvider}
                  trackColor={{ false: colors.border, true: colors.primarySoft }}
                  thumbColor={useCustomProvider ? colors.primary : colors.surface}
                />
              </View>

              {useCustomProvider ? (
                <>
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>API Key</Text>
                    <View style={styles.inputWrapper}>
                      <KeyRound size={18} color={colors.textMuted} />
                      <TextInput
                        style={styles.input}
                        placeholder={hasApiKey ? 'Saved API key will be kept if left blank' : 'Enter your API key'}
                        placeholderTextColor={colors.textMuted}
                        value={apiKey}
                        onChangeText={setApiKey}
                        secureTextEntry={!showApiKey}
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                      <TouchableOpacity onPress={() => setShowApiKey((value) => !value)}>
                        {showApiKey ? (
                          <EyeOff size={18} color={colors.textMuted} />
                        ) : (
                          <Eye size={18} color={colors.textMuted} />
                        )}
                      </TouchableOpacity>
                    </View>
                    {hasApiKey && !apiKey ? (
                      <Text style={styles.helperText}>An API key is already saved. Leave blank to keep it.</Text>
                    ) : null}
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Model</Text>
                    <View style={styles.inputWrapper}>
                      <Cpu size={18} color={colors.textMuted} />
                      <TextInput
                        style={styles.input}
                        placeholder="gemini-2.5-flash"
                        placeholderTextColor={colors.textMuted}
                        value={model}
                        onChangeText={setModel}
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Base URL</Text>
                    <View style={styles.inputWrapper}>
                      <Globe size={18} color={colors.textMuted} />
                      <TextInput
                        style={styles.input}
                        placeholder="https://generativelanguage.googleapis.com/v1beta/openai/"
                        placeholderTextColor={colors.textMuted}
                        value={baseUrl}
                        onChangeText={setBaseUrl}
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>
                  </View>

                  {message ? (
                    <View
                      style={[
                        styles.messageBanner,
                        message.type === 'success' ? styles.successBanner : styles.errorBanner,
                      ]}
                    >
                      {message.type === 'success' ? (
                        <CheckCircle2 size={16} color={colors.success} />
                      ) : (
                        <AlertCircle size={16} color={colors.danger} />
                      )}
                      <Text
                        style={[
                          styles.messageText,
                          message.type === 'success' ? styles.successText : styles.errorText,
                        ]}
                      >
                        {message.text}
                      </Text>
                    </View>
                  ) : null}

                  <View style={styles.buttonRow}>
                    <TouchableOpacity
                      style={[styles.secondaryButton, (!apiKey.trim() || isTesting) && styles.buttonDisabled]}
                      onPress={handleTestConnection}
                      disabled={!apiKey.trim() || isTesting}
                    >
                      {isTesting ? <Loader2 size={18} color={colors.primary} /> : null}
                      <Text style={styles.secondaryButtonText}>
                        {isTesting ? 'Testing...' : 'Test Connection'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.primaryButton, isSaving && styles.buttonDisabled]}
                      onPress={handleSaveSettings}
                      disabled={isSaving}
                    >
                      {isSaving ? <Loader2 size={18} color={colors.textInverse} /> : null}
                      <Text style={styles.primaryButtonText}>{isSaving ? 'Saving...' : 'Save Settings'}</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : message ? (
                <View
                  style={[
                    styles.messageBanner,
                    message.type === 'success' ? styles.successBanner : styles.errorBanner,
                  ]}
                >
                  {message.type === 'success' ? (
                    <CheckCircle2 size={16} color={colors.success} />
                  ) : (
                    <AlertCircle size={16} color={colors.danger} />
                  )}
                  <Text
                    style={[
                      styles.messageText,
                      message.type === 'success' ? styles.successText : styles.errorText,
                    ]}
                  >
                    {message.text}
                  </Text>
                </View>
              ) : null}
            </>
          )}
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={20} color={colors.danger} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>AI Course Architect</Text>
          <Text style={styles.footerText}>Settings are backed by your real account configuration</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      paddingBottom: 40,
    },
    profileSection: {
      alignItems: 'center',
      padding: 32,
      marginBottom: 16,
      backgroundColor: colors.surface,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    avatarText: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.textInverse,
    },
    userName: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    userEmail: {
      fontSize: 16,
      color: colors.textMuted,
    },
    section: {
      backgroundColor: colors.surface,
      marginBottom: 16,
      paddingVertical: 8,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 16,
      paddingBottom: 14,
    },
    infoContent: {
      flex: 1,
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    settingContent: {
      flex: 1,
    },
    settingLabel: {
      flex: 1,
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
    },
    settingDescription: {
      marginTop: 2,
      fontSize: 13,
      lineHeight: 18,
      color: colors.textMuted,
    },
    settingValue: {
      marginTop: 2,
      fontSize: 15,
      color: colors.textMuted,
    },
    helperText: {
      paddingHorizontal: 16,
      paddingBottom: 12,
      fontSize: 13,
      color: colors.textMuted,
    },
    loadingState: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    loadingText: {
      fontSize: 14,
      color: colors.textMuted,
    },
    fieldGroup: {
      paddingHorizontal: 16,
      paddingBottom: 14,
    },
    fieldLabel: {
      marginBottom: 8,
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 14,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      backgroundColor: colors.surfaceMuted,
    },
    input: {
      flex: 1,
      paddingVertical: 14,
      fontSize: 15,
      color: colors.text,
    },
    messageBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginHorizontal: 16,
      marginBottom: 14,
      padding: 12,
      borderWidth: 1,
      borderRadius: 10,
    },
    successBanner: {
      backgroundColor: colors.successSoft,
      borderColor: colors.success,
    },
    errorBanner: {
      backgroundColor: colors.dangerSoft,
      borderColor: colors.danger,
    },
    messageText: {
      flex: 1,
      fontSize: 14,
    },
    successText: {
      color: colors.success,
    },
    errorText: {
      color: colors.danger,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 12,
      paddingHorizontal: 16,
      paddingBottom: 12,
    },
    primaryButton: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: colors.primary,
    },
    secondaryButton: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 14,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      backgroundColor: colors.primarySoft,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    primaryButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textInverse,
    },
    secondaryButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.primary,
    },
    logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginHorizontal: 16,
      paddingVertical: 14,
      borderWidth: 1,
      borderColor: colors.danger,
      borderRadius: 12,
      backgroundColor: colors.dangerSoft,
    },
    logoutText: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.danger,
    },
    footer: {
      alignItems: 'center',
      padding: 24,
    },
    footerText: {
      marginBottom: 4,
      fontSize: 14,
      color: colors.textMuted,
    },
  });

export default SettingsScreen;
