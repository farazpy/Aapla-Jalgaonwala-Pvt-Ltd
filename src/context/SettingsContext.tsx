import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SiteSettings } from '@/types';
import { initialSiteSettings } from '@/data/settings';

interface SettingsContextType {
  settings: SiteSettings;
  isLoading: boolean;
  updateSettings: (newSettings: Partial<SiteSettings>) => Promise<boolean>;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings>(initialSiteSettings);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      const json = await res.json();
      if (json.success && json.data) {
        // Merge with initialSiteSettings to ensure all keys are present
        setSettings(prev => ({
          ...initialSiteSettings,
          ...prev,
          ...json.data
        }));
      }
    } catch (err) {
      console.warn('[SettingsContext] Failed to fetch settings from API, using fallback defaults:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = async (newSettings: Partial<SiteSettings>): Promise<boolean> => {
    try {
      const merged = { ...settings, ...newSettings };
      setSettings(merged);

      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(merged)
      });
      const json = await res.json();
      if (json.success && json.data) {
        setSettings({ ...initialSiteSettings, ...json.data });
        return true;
      }
      return false;
    } catch (err) {
      console.error('[SettingsContext] Error updating settings:', err);
      return false;
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        isLoading,
        updateSettings,
        refreshSettings: fetchSettings
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
