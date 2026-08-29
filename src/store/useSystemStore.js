import { create } from 'zustand';

export const useSystemStore = create((set) => ({
  theme: localStorage.getItem('desktop_theme') || 'default',
  searchEngine: localStorage.getItem('setting_search_engine') || 'google',
  trackingProtection: localStorage.getItem('setting_tracking') !== 'false',
  wotScriptBlocker: localStorage.getItem('setting_wot') !== 'false',
  enabledApps: JSON.parse(localStorage.getItem('enabled_apps') || '[]'),
  userType: localStorage.getItem('user_type') || 'general',
  setupComplete: localStorage.getItem('ultrasudo_setup_complete') !== 'false',

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
        enabledApps: JSON.parse(localStorage.getItem('enabled_apps') || '[]'),
        userType: localStorage.getItem('user_type') || 'general',
        setupComplete: localStorage.getItem('ultrasudo_setup_complete') !== 'false'
    });
  }
}));
