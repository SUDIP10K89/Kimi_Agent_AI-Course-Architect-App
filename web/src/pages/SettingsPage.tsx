/**
 * Settings Page
 * 
 * User settings with account info, theme toggle, AI configuration, and logout.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Moon, Sun, User, LogOut, Settings, Key, Globe, Cpu, Eye, EyeOff, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import Header from '@/components/Layout/Header';
import * as settingsApi from '@/api/settingsApi';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // API Settings state
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

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const response = await settingsApi.getSettings();
      if (response.success && response.data) {
        const { apiSettings } = response.data;
        setModel(apiSettings.model);
        setBaseUrl(apiSettings.baseUrl);
        setUseCustomProvider(apiSettings.useCustomProvider);
        setHasApiKey(apiSettings.hasApiKey);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleToggleCustomProvider = async (checked: boolean) => {
    try {
      setUseCustomProvider(checked);

      const settingsPayload = {
        apiKey: '',
        model,
        baseUrl,
        useCustomProvider: checked,
      };

      const response = await settingsApi.updateSettings(settingsPayload);

      if (response.success) {
        setMessage({ type: 'success', text: `Custom AI provider ${checked ? 'enabled' : 'disabled'} successfully!` });
      } else {
        setMessage({ type: 'error', text: response.error || 'Failed to update setting' });
        setUseCustomProvider(!checked);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update setting' });
      setUseCustomProvider(!checked);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      setMessage(null);

      const settingsPayload = {
        apiKey: apiKey,
        model,
        baseUrl,
        useCustomProvider,
      };

      const response = await settingsApi.updateSettings(settingsPayload);

      if (response.success) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
        setApiKey('');
        setHasApiKey(true);
      } else {
        setMessage({ type: 'error', text: response.error || 'Failed to save settings' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!apiKey) {
      setMessage({ type: 'error', text: 'Please enter an API key to test' });
      return;
    }

    try {
      setIsTesting(true);
      setMessage(null);

      const response = await settingsApi.testSettings(apiKey, model, baseUrl);

      if (response.success) {
        setMessage({ type: 'success', text: 'API connection successful!' });
      } else {
        setMessage({ type: 'error', text: response.error || 'API connection failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'API connection failed' });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shadow-sm">
                <Settings className="h-5 w-5 text-white" />
              </div>
              Settings
            </h1>
            <p className="text-muted-foreground mt-2 ml-[52px]">
              Manage your account settings and preferences
            </p>
          </div>

          <div className="space-y-6">
            {/* Account Information */}
            <Card className="border-border/50 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-purple-500" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Account Information
                </CardTitle>
                <CardDescription>
                  Your personal account details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-muted-foreground">Name</span>
                  <span className="text-lg">{user?.name || 'N/A'}</span>
                </div>
                <Separator />
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-muted-foreground">Email</span>
                  <span className="text-lg">{user?.email || 'N/A'}</span>
                </div>
              </CardContent>
            </Card>

            {/* Appearance */}
            <Card className="border-border/50 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {theme === 'light' ? <Moon className="h-5 w-5 text-purple-500" /> : <Sun className="h-5 w-5 text-amber-500" />}
                  Appearance
                </CardTitle>
                <CardDescription>
                  Customize how the app looks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Theme</p>
                    <p className="text-sm text-muted-foreground">
                      {theme === 'light' ? 'Light mode' : 'Dark mode'}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleTheme}
                    className="gap-2 border-border/50"
                  >
                    {theme === 'light' ? (
                      <>
                        <Moon className="h-4 w-4" />
                        Switch to Dark
                      </>
                    ) : (
                      <>
                        <Sun className="h-4 w-4" />
                        Switch to Light
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* AI Configuration */}
            <Card className="border-border/50 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-pink-500 to-rose-500" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-5 w-5 text-pink-500" />
                  AI Configuration
                </CardTitle>
                <CardDescription>
                  Configure your own AI provider for course generation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    {/* Enable Custom Provider Toggle */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="use-custom-provider" className="text-base">
                          Use Custom AI Provider
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Enable to use your own API key for course generation
                        </p>
                      </div>
                      <Switch
                        id="use-custom-provider"
                        checked={useCustomProvider}
                        onCheckedChange={handleToggleCustomProvider}
                      />
                    </div>

                    {useCustomProvider && (
                      <>
                        <Separator />

                        {/* API Key */}
                        <div className="space-y-2">
                          <Label htmlFor="api-key" className="flex items-center gap-2">
                            <Key className="h-4 w-4 text-primary" />
                            API Key
                          </Label>
                          <div className="relative">
                            <Input
                              id="api-key"
                              type={showApiKey ? 'text' : 'password'}
                              placeholder={hasApiKey ? '••••••••••••••••' : 'Enter your API key'}
                              value={apiKey}
                              onChange={(e) => setApiKey(e.target.value)}
                              className="pr-10 border-border/50 focus:border-primary/50"
                            />
                            <button
                              type="button"
                              onClick={() => setShowApiKey(!showApiKey)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                          {hasApiKey && !apiKey && (
                            <p className="text-xs text-muted-foreground">
                              You have an API key saved. Leave empty to keep it.
                            </p>
                          )}
                        </div>

                        {/* Model */}
                        <div className="space-y-2">
                          <Label htmlFor="model" className="flex items-center gap-2">
                            <Cpu className="h-4 w-4 text-primary" />
                            Model
                          </Label>
                          <Input
                            id="model"
                            type="text"
                            placeholder="gemini-2.5-flash"
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            className="border-border/50 focus:border-primary/50"
                          />
                          <p className="text-xs text-muted-foreground">
                            Default: gemini-2.5-flash
                          </p>
                        </div>

                        {/* Base URL */}
                        <div className="space-y-2">
                          <Label htmlFor="base-url" className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-primary" />
                            Base URL
                          </Label>
                          <Input
                            id="base-url"
                            type="text"
                            placeholder="https://generativelanguage.googleapis.com/v1beta/openai/"
                            value={baseUrl}
                            onChange={(e) => setBaseUrl(e.target.value)}
                            className="border-border/50 focus:border-primary/50"
                          />
                          <p className="text-xs text-muted-foreground">
                            Default: https://generativelanguage.googleapis.com/v1beta/openai/
                          </p>
                        </div>

                        {/* Message Display */}
                        {message && (
                          <div className={`flex items-center gap-2 p-3 rounded-lg ${message.type === 'success'
                              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800'
                            }`}>
                            {message.type === 'success' ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <AlertCircle className="h-4 w-4" />
                            )}
                            <span className="text-sm">{message.text}</span>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                          <Button
                            onClick={handleTestConnection}
                            disabled={isTesting || !apiKey}
                            variant="outline"
                            className="flex-1 border-border/50"
                          >
                            {isTesting ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Testing...
                              </>
                            ) : (
                              'Test Connection'
                            )}
                          </Button>
                          <Button
                            onClick={handleSaveSettings}
                            disabled={isSaving}
                            className="flex-1 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90"
                          >
                            {isSaving ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              'Save Settings'
                            )}
                          </Button>
                        </div>
                      </>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Logout */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LogOut className="h-5 w-5 text-muted-foreground" />
                  Sign Out
                </CardTitle>
                <CardDescription>
                  Sign out of your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="destructive"
                  onClick={handleLogout}
                  className="w-full sm:w-auto"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} AI Course Architect. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default SettingsPage;
