import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HUB_REGISTRY, buildAppPath } from '../../utils/appRegistry';
import { useFavorites } from '../../hooks/useFavorites';
import './QuickLaunch.css';

export default function QuickLaunch({ title = "Quick Launch Favourites", subtitle = "Your pinned go-to applications for 1-click launch" }) {
  const navigate = useNavigate();
  const { favorites, toggleFavorite } = useFavorites();

  // Find all favorite items from HUB_REGISTRY and subApps
  const favoriteItems = [];
  HUB_REGISTRY.forEach(hub => {
    if (favorites.includes(hub.id)) {
      favoriteItems.push({
        id: hub.id,
        name: hub.name,
        icon: hub.icon,
        path: hub.path,
        src: hub.src,
        category: hub.category,
        colorGradient: hub.colorGradient,
        isHub: true
      });
    }
    hub.subApps?.forEach(sub => {
      if (favorites.includes(sub.id)) {
        favoriteItems.push({
          id: sub.id,
          name: sub.name,
          icon: sub.icon,
          path: sub.path,
          src: sub.src,
          category: hub.name,
          colorGradient: hub.colorGradient,
          isHub: false
        });
      }
    });
  });

  const handleLaunch = (item) => {
    const path = buildAppPath(item);
    navigate(path);
  };

  return (
    <section className="quick-launch-container">
      <div className="quick-launch-header">
        <div className="quick-launch-title-block">
          <div className="ql-icon-title">
            <i className="fas fa-bolt-lightning ql-bolt-icon"></i>
            <h3>{title}</h3>
            <span className="ql-count-badge">{favoriteItems.length} Pinned</span>
          </div>
          <p className="quick-launch-subtitle">{subtitle}</p>
        </div>
      </div>

      {favoriteItems.length === 0 ? (
        <div className="quick-launch-empty">
          <i className="fas fa-star ql-empty-icon"></i>
          <p>No favorites pinned yet. Click the <strong>★ star</strong> on any hub or tool to pin it here for instant access.</p>
        </div>
      ) : (
        <div className="quick-launch-grid">
          {favoriteItems.map(item => (
            <div key={item.id} className="quick-launch-card">
              <button
                className="ql-unstar-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(item.id);
                }}
                title="Remove from Favourites"
              >
                <i className="fas fa-star"></i>
              </button>

              <div
                className="ql-card-content"
                onClick={() => handleLaunch(item)}
                title={`Launch ${item.name}`}
              >
                <div
                  className="ql-icon-box"
                  style={{ background: item.colorGradient || 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}
                >
                  <i className={item.icon}></i>
                </div>
                <div className="ql-meta">
                  <span className="ql-item-name">{item.name}</span>
                  <span className="ql-item-category">{item.category}</span>
                </div>
                <div className="ql-launch-arrow">
                  <i className="fas fa-arrow-right"></i>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
