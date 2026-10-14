import { useState, useEffect } from 'react';

const STORAGE_KEY = 'ultrasudo_favorite_apps';
const DEFAULT_FAVORITES = [
  'esg-hub',
  'bops-hub',
  'legal-compliance-hub',
  'code-studio',
  'productivity-hub',
  'finance-hub'
];

export function useFavorites() {
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_FAVORITES;
    } catch {
      return DEFAULT_FAVORITES;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch (e) {
      console.warn('Failed to save favorites to localStorage:', e);
    }
  }, [favorites]);

  const toggleFavorite = (appId) => {
    setFavorites(prev => {
      if (prev.includes(appId)) {
        return prev.filter(id => id !== appId);
      } else {
        return [...prev, appId];
      }
    });
  };

  const isFavorite = (appId) => favorites.includes(appId);

  return { favorites, toggleFavorite, isFavorite };
}
