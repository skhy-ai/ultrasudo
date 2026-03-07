import { create } from 'zustand';

const nativeStorage = {
  get: async (key) => {
    if (window.__TAURI__) {
      try {
        const data = await window.__TAURI__.core.invoke('read_data');
        if (data && data[key]) {
          try { return JSON.parse(data[key]); } catch(e) { return data[key]; }
        }
        return null;
      } catch (e) {
        console.warn('Tauri invoke failed', e);
        return null;
      }
    } else if (window.electronAPI?.isElectron) {
      const resp = await window.electronAPI.readData(key);
      return resp.ok ? resp.data : null;
    } else {
      const val = localStorage.getItem(key);
      try { return JSON.parse(val); } catch(e) { return val; }
    }
  },
  set: async (key, value) => {
    const strVal = typeof value === 'string' ? value : JSON.stringify(value);
    if (window.__TAURI__) {
      try {
        await window.__TAURI__.core.invoke('write_data', { key, value: strVal });
      } catch (e) {
        console.warn('Tauri invoke failed', e);
      }
    } else if (window.electronAPI?.isElectron) {
      await window.electronAPI.writeData(key, value);
    } else {
      localStorage.setItem(key, strVal);
    }
  }
};

export const useBrowserStore = create((set, get) => ({
  bookmarks: [],
  history: [],
  passwords: [],
  tabs: [],
  currentTabId: null,

  loadInitialData: async () => {
    const bk = (await nativeStorage.get('browser_bookmarks')) || [];
    const hs = (await nativeStorage.get('browser_history')) || [];
    const pw = (await nativeStorage.get('browser_passwords')) || [];
    set({ bookmarks: Array.isArray(bk) ? bk : [], 
          history: Array.isArray(hs) ? hs : [], 
          passwords: Array.isArray(pw) ? pw : [] });
  },

  addBookmark: async (bookmark) => {
    const { bookmarks } = get();
    const newBk = [bookmark, ...bookmarks.filter(b => b.url !== bookmark.url)];
    set({ bookmarks: newBk });
    await nativeStorage.set('browser_bookmarks', newBk);
  },
  
  removeBookmark: async (url) => {
    const { bookmarks } = get();
    const newBk = bookmarks.filter(b => b.url !== url);
    set({ bookmarks: newBk });
    await nativeStorage.set('browser_bookmarks', newBk);
  },

  addHistory: async (historyItem) => {
    const { history } = get();
    if (history.length > 0 && history[0].url === historyItem.url) return;
    const newHs = [historyItem, ...history].slice(0, 500);
    set({ history: newHs });
    await nativeStorage.set('browser_history', newHs);
  },

  addPassword: async (passwordItem) => {
    const { passwords } = get();
    const newPw = [...passwords, passwordItem];
    set({ passwords: newPw });
    await nativeStorage.set('browser_passwords', newPw);
  },
  
  clearBrowsingData: async () => {
    set({ bookmarks: [], history: [], passwords: [] });
    await nativeStorage.set('browser_bookmarks', []);
    await nativeStorage.set('browser_history', []);
    await nativeStorage.set('browser_passwords', []);
  }
}));
