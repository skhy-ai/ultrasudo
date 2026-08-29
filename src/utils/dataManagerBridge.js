import { useState, useEffect } from 'react';

/**
 * Ensures data-manager.js script is loaded and window.dataManager is available.
 */
export function ensureDataManagerLoaded() {
  if (window.dataManager) return Promise.resolve(window.dataManager);

  return new Promise((resolve) => {
    // Check if script element already exists
    if (document.getElementById('data-manager-script')) {
      const checkInterval = setInterval(() => {
        if (window.dataManager) {
          clearInterval(checkInterval);
          resolve(window.dataManager);
        }
      }, 50);
      return;
    }

    const script = document.createElement('script');
    script.id = 'data-manager-script';
    script.src = '/desktop/data-manager.js';
    script.onload = () => {
      resolve(window.dataManager);
    };
    script.onerror = () => {
      console.warn('Could not load /desktop/data-manager.js script');
      resolve(null);
    };
    document.body.appendChild(script);
  });
}

/**
 * React Hook for binding component state to DataManager with PQC local persistence.
 * @param {string} key - Storage key (without prefix)
 * @param {any} initialValue - Default fallback value
 * @param {string} appSource - Identifier of caller app
 */
export function useDataManager(key, initialValue = null, appSource = 'react_app') {
  const [data, setDataState] = useState(() => {
    if (window.dataManager) {
      const stored = window.dataManager.getData(key, null);
      if (stored !== null) return stored;
    }
    try {
      const local = localStorage.getItem(`desktop_app_${key}`);
      if (local) {
        const parsed = JSON.parse(local);
        return parsed.value !== undefined ? parsed.value : parsed;
      }
    } catch (e) { }
    return initialValue;
  });

  useEffect(() => {
    ensureDataManagerLoaded().then((dm) => {
      if (dm) {
        const current = dm.getData(key, null);
        if (current !== null) {
          setDataState(current);
        }
      }
    });
  }, [key]);

  const updateData = (newValue) => {
    const valueToStore = typeof newValue === 'function' ? newValue(data) : newValue;
    setDataState(valueToStore);

    if (window.dataManager) {
      window.dataManager.setData(key, valueToStore, appSource);
    } else {
      localStorage.setItem(`desktop_app_${key}`, JSON.stringify({
        value: valueToStore,
        timestamp: Date.now(),
        app_source: appSource
      }));
    }
  };

  return [data, updateData];
}

/**
 * Saves app history entry into DataManager.
 */
export function recordAppHistory(appName, entry) {
  ensureDataManagerLoaded().then((dm) => {
    if (dm && dm.saveHistory) {
      dm.saveHistory(appName, entry);
    } else if (window.saveAppHistory) {
      window.saveAppHistory(appName, entry);
    }
  });
}
