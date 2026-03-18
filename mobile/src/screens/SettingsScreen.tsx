/**
 * Settings Screen
 *
 * Backend-backed settings for theme and AI configuration.
 */

import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  Pressable,
  StyleSheet,
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
import { BlurView } from 'expo-blur';

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
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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
    setShowLogoutConfirm(true);
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
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      <ScrollView contentContainerClassName="pb-10">
        <View className="items-center px-6 py-8 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <View className="h-20 w-20 rounded-full bg-indigo-600 items-center justify-center mb-4">
            <Text className="text-white text-2xl font-bold">
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
          <Text className="text-slate-900 dark:text-white text-xl font-bold">{user?.name || 'User'}</Text>
          <Text className="text-slate-500 dark:text-slate-400 text-sm">{user?.email || 'user@example.com'}</Text>
        </View>

        <View className="mt-6">
          <Text className="px-5 text-xs font-semibold uppercase text-slate-400">Account</Text>
          <View className="mt-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl mx-4">
            <View className="flex-row items-center gap-3 px-4 py-4 border-b border-slate-200 dark:border-slate-800">
              <User size={18} color={colors.primary} />
              <View className="flex-1">
                <Text className="text-slate-900 dark:text-white text-sm font-semibold">Name</Text>
                <Text className="text-slate-500 dark:text-slate-400 text-sm mt-1">{user?.name || 'N/A'}</Text>
              </View>
            </View>
            <View className="flex-row items-center gap-3 px-4 py-4">
              <User size={18} color={colors.primary} />
              <View className="flex-1">
                <Text className="text-slate-900 dark:text-white text-sm font-semibold">Email</Text>
                <Text className="text-slate-500 dark:text-slate-400 text-sm mt-1">{user?.email || 'N/A'}</Text>
              </View>
            </View>
          </View>
        </View>

        <View className="mt-6">
          <Text className="px-5 text-xs font-semibold uppercase text-slate-400">Appearance</Text>
          <View className="mt-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl mx-4 px-4 py-4">
            <View className="flex-row items-center gap-3">
              {theme === 'dark' ? <Moon size={20} color={colors.primary} /> : <Sun size={20} color={colors.primary} />}
              <Text className="flex-1 text-slate-900 dark:text-white text-sm font-semibold">Dark Mode</Text>
              <Switch
                value={theme === 'dark'}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.border, true: colors.primarySoft }}
                thumbColor={theme === 'dark' ? colors.primary : colors.surface}
              />
            </View>
            <Text className="text-slate-500 dark:text-slate-400 text-xs mt-2">{themeLabel}</Text>
          </View>
        </View>

        <View className="mt-6">
          <Text className="px-5 text-xs font-semibold uppercase text-slate-400">AI Configuration</Text>

          <View className="mt-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl mx-4 px-4 py-4">
            {isLoading ? (
              <View className="flex-row items-center gap-2">
                <ActivityIndicator size="small" color={colors.primary} />
                <Text className="text-slate-500 dark:text-slate-400">Loading settings...</Text>
              </View>
            ) : (
              <>
                <View className="flex-row items-center gap-3">
                  <Cpu size={20} color={colors.primary} />
                  <View className="flex-1">
                    <Text className="text-slate-900 dark:text-white text-sm font-semibold">Use Custom AI Provider</Text>
                    <Text className="text-slate-500 dark:text-slate-400 text-xs mt-1">
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
                    <View className="mt-4">
                      <Text className="text-slate-900 dark:text-white text-xs font-semibold mb-2">API Key</Text>
                      <View className="flex-row items-center gap-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3">
                        <KeyRound size={18} color={colors.textMuted} />
                        <TextInput
                          className="flex-1 py-3 text-slate-900 dark:text-white"
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
                        <Text className="text-slate-500 dark:text-slate-400 text-xs mt-2">
                          An API key is already saved. Leave blank to keep it.
                        </Text>
                      ) : null}
                    </View>

                    <View className="mt-4">
                      <Text className="text-slate-900 dark:text-white text-xs font-semibold mb-2">Model</Text>
                      <View className="flex-row items-center gap-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3">
                        <Cpu size={18} color={colors.textMuted} />
                        <TextInput
                          className="flex-1 py-3 text-slate-900 dark:text-white"
                          placeholder="gemini-2.5-flash"
                          placeholderTextColor={colors.textMuted}
                          value={model}
                          onChangeText={setModel}
                          autoCapitalize="none"
                          autoCorrect={false}
                        />
                      </View>
                    </View>

                    <View className="mt-4">
                      <Text className="text-slate-900 dark:text-white text-xs font-semibold mb-2">Base URL</Text>
                      <View className="flex-row items-center gap-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3">
                        <Globe size={18} color={colors.textMuted} />
                        <TextInput
                          className="flex-1 py-3 text-slate-900 dark:text-white"
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
                      <View className={`mt-4 flex-row items-center gap-2 px-3 py-2 rounded-xl border ${message.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-400/40' : 'bg-rose-50 dark:bg-rose-500/10 border-rose-400/40'}`}>
                        {message.type === 'success' ? (
                          <CheckCircle2 size={16} color={colors.success} />
                        ) : (
                          <AlertCircle size={16} color={colors.danger} />
                        )}
                        <Text className={`${message.type === 'success' ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300'} text-xs flex-1`}>
                          {message.text}
                        </Text>
                      </View>
                    ) : null}

                    <View className="mt-4 flex-row gap-3">
                      <TouchableOpacity
                        className={`flex-1 border rounded-xl py-3 flex-row items-center justify-center gap-2 ${!apiKey.trim() || isTesting ? 'opacity-60' : ''}`}
                        style={{ borderColor: colors.border, backgroundColor: colors.primarySoft }}
                        onPress={handleTestConnection}
                        disabled={!apiKey.trim() || isTesting}
                      >
                        {isTesting ? <Loader2 size={18} color={colors.primary} /> : null}
                        <Text className="text-sm font-semibold" style={{ color: colors.primary }}>
                          {isTesting ? 'Testing...' : 'Test Connection'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        className={`flex-1 rounded-xl py-3 flex-row items-center justify-center gap-2 ${isSaving ? 'opacity-60' : ''}`}
                        style={{ backgroundColor: colors.primary }}
                        onPress={handleSaveSettings}
                        disabled={isSaving}
                      >
                        {isSaving ? <Loader2 size={18} color={colors.textInverse} /> : null}
                        <Text className="text-sm font-semibold" style={{ color: colors.textInverse }}>
                          {isSaving ? 'Saving...' : 'Save Settings'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : message ? (
                  <View className={`mt-4 flex-row items-center gap-2 px-3 py-2 rounded-xl border ${message.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-400/40' : 'bg-rose-50 dark:bg-rose-500/10 border-rose-400/40'}`}>
                    {message.type === 'success' ? (
                      <CheckCircle2 size={16} color={colors.success} />
                    ) : (
                      <AlertCircle size={16} color={colors.danger} />
                    )}
                    <Text className={`${message.type === 'success' ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300'} text-xs flex-1`}>
                      {message.text}
                    </Text>
                  </View>
                ) : null}
              </>
            )}
          </View>
        </View>

        <View className="mt-6">
          <TouchableOpacity className="mx-4 flex-row items-center justify-center gap-2 bg-rose-50 dark:bg-rose-500/10 border border-rose-300 dark:border-rose-500/40 rounded-xl py-3" onPress={handleLogout}>
            <LogOut size={18} color={colors.danger} />
            <Text className="text-rose-600 dark:text-rose-300 font-semibold">Logout</Text>
          </TouchableOpacity>
        </View>

        <View className="items-center mt-8 px-6">
          <Text className="text-slate-500 dark:text-slate-400 text-xs">AI Course Architect</Text>
          <Text className="text-slate-400 dark:text-slate-500 text-xs mt-1">Settings are backed by your real account configuration</Text>
        </View>
      </ScrollView>

      <Modal transparent visible={showLogoutConfirm} animationType="fade" onRequestClose={() => setShowLogoutConfirm(false)}>
        <View className="flex-1">
          <BlurView intensity={60} tint={theme === 'dark' ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
          <View className="absolute inset-0 bg-black/40" />
          <Pressable className="flex-1 items-center justify-center px-6" onPress={() => setShowLogoutConfirm(false)}>
            <Pressable className="w-full bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800">
            <Text className="text-slate-900 dark:text-white text-lg font-semibold mb-2">Log out?</Text>
            <Text className="text-slate-500 dark:text-slate-400 text-sm mb-5">
              You will need to sign in again to access your courses.
            </Text>
            <View className="flex-row gap-3">
              <TouchableOpacity className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 items-center" onPress={() => setShowLogoutConfirm(false)}>
                <Text className="text-slate-700 dark:text-slate-200 font-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 py-3 rounded-xl bg-rose-600 items-center"
                onPress={async () => {
                  setShowLogoutConfirm(false);
                  await logout();
                }}
              >
                <Text className="text-white font-semibold">Logout</Text>
              </TouchableOpacity>
            </View>
            </Pressable>
          </Pressable>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default SettingsScreen;
