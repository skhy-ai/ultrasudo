import { create } from 'zustand';
import { APP_REGISTRY } from '../utils/appRegistry';

const getAllAppIds = () => APP_REGISTRY.map(a => a.id);

const getInitialEnabledApps = () => {
    const saved = localStorage.getItem('enabled_apps');
    if (!saved) {
        const allIds = getAllAppIds();
        localStorage.setItem('enabled_apps', JSON.stringify(allIds));
        return allIds;
    }
    try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {}
    const allIds = getAllAppIds();
    localStorage.setItem('enabled_apps', JSON.stringify(allIds));
    return allIds;
};

const getInitialSetupComplete = () => {
    const saved = localStorage.getItem('ultrasudo_setup_complete');
    if (saved === null) {
        localStorage.setItem('ultrasudo_setup_complete', 'true');
        return true;
    }
    return saved !== 'false';
};

export const useSystemStore = create((set) => ({
  theme: localStorage.getItem('desktop_theme') || 'default',
  searchEngine: localStorage.getItem('setting_search_engine') || 'google',
  trackingProtection: localStorage.getItem('setting_tracking') !== 'false',
  wotScriptBlocker: localStorage.getItem('setting_wot') !== 'false',
  enabledApps: getInitialEnabledApps(),
  userType: localStorage.getItem('user_type') || 'general',
  setupComplete: getInitialSetupComplete(),

  setTheme: (theme) => {
    localStorage.setItem('desktop_theme', theme);
    set({ theme });
  },
  setSearchEngine: (engine) => {
    localStorage.setItem('setting_search_engine', engine);
    set({ searchEngine: engine });
  },
  setEnabledApps: (apps) => {
    localStorage.setItem('enabled_apps', JSON.stringify(apps));
    set({ enabledApps: apps });
  },
  setUserType: (type) => {
    localStorage.setItem('user_type', type);
    set({ userType: type });
  },
  completeSetup: () => {
    localStorage.setItem('ultrasudo_setup_complete', 'true');
    set({ setupComplete: true });
  },

  loadFromStorage: async () => {
    set({
        theme: localStorage.getItem('desktop_theme') || 'default',
        searchEngine: localStorage.getItem('setting_search_engine') || 'google',
        trackingProtection: localStorage.getItem('setting_tracking') !== 'false',
        wotScriptBlocker: localStorage.getItem('setting_wot') !== 'false',
        enabledApps: getInitialEnabledApps(),
        userType: localStorage.getItem('user_type') || 'general',
        setupComplete: getInitialSetupComplete()
    });
  }
}));
