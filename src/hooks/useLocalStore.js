import { useState, useEffect } from 'react';

/**
 * useLocalStore hook — mirrors the pattern used in vanilla JS apps
 * for reading/writing to localStorage (or eventually Tauri/Electron backend).
 */
export default function useLocalStore(key, defaultValue) {
    const [value, setValue] = useState(() => {
        try {
            const saved = localStorage.getItem(key);
            if (saved !== null) return JSON.parse(saved);
        } catch (e) {
            console.error('Error parsing local store key:', key, e);
        }
        return defaultValue;
    });

    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error('Error saving local store key:', key, e);
        }
    }, [key, value]);

    return [value, setValue];
}
