import React, { useState, useEffect, useRef } from 'react';
import { useSystemStore } from '../../store/useSystemStore';
import './ThemeSelector.css';

export default function ThemeSelector() {
  const { theme, setTheme } = useSystemStore();
  const [isOpen, setIsOpen] = useState(false);
  const [customBg, setCustomBg] = useState(() => localStorage.getItem('desktop_custom_bg') || '');
  const containerRef = useRef(null);

  useEffect(() => {
    // Apply theme data attribute to document root
    const targetTheme = theme || 'default';
    document.documentElement.setAttribute('data-theme', targetTheme);

    // Apply custom background if saved
    const savedBg = localStorage.getItem('desktop_custom_bg');
    if (savedBg) {
      document.body.style.backgroundImage = `url("${savedBg}")`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
    } else {
      document.body.style.backgroundImage = '';
    }
  }, [theme]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectTheme = (themeId) => {
    setTheme(themeId);
    if (themeId !== 'custom') {
      localStorage.removeItem('desktop_custom_bg');
      document.body.style.backgroundImage = '';
    }
    setIsOpen(false);
  };

  const handleApplyCustomBg = () => {
    if (customBg.trim()) {
      localStorage.setItem('desktop_custom_bg', customBg.trim());
      document.body.style.backgroundImage = `url("${customBg.trim()}")`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
      setIsOpen(false);
    } else {
      localStorage.removeItem('desktop_custom_bg');
      document.body.style.backgroundImage = '';
    }
  };

  const themeOptions = [
    { id: 'default',   name: '🌌 Deep Blue (Default)', icon: 'fas fa-moon' },
    { id: 'light',     name: '☀️ Light Desktop',      icon: 'fas fa-sun' },
    { id: 'dark-grey', name: '🌑 Dark Grey',          icon: 'fas fa-circle-half-stroke' },
    { id: 'nature',    name: '🌿 Nature Green',       icon: 'fas fa-leaf' }
  ];

  return (
    <div className="theme-selector-container" ref={containerRef}>
      <button
        className="theme-trigger-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Change Theme & Background"
      >
        <i className="fas fa-palette"></i>
        <span>Theme</span>
      </button>

      {isOpen && (
        <div className="theme-dropdown-menu">
          {themeOptions.map((opt) => (
            <div
              key={opt.id}
              className={`theme-option-item ${theme === opt.id ? 'active' : ''}`}
              onClick={() => handleSelectTheme(opt.id)}
            >
              <span>{opt.name}</span>
              {theme === opt.id && <i className="fas fa-check" style={{ color: 'var(--accent)' }}></i>}
            </div>
          ))}

          <hr className="theme-divider" />

          <div className="custom-wallpaper-section">
            <span className="custom-wallpaper-label">Custom Background (URL)</span>
            <div className="custom-wallpaper-input-row">
              <input
                type="text"
                className="custom-wallpaper-input"
                placeholder="https://images.unsplash.com/..."
                value={customBg}
                onChange={(e) => setCustomBg(e.target.value)}
              />
              <button className="custom-wallpaper-apply-btn" onClick={handleApplyCustomBg}>
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
