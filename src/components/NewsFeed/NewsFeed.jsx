import React, { useState, useEffect, useCallback } from 'react';
import './NewsFeed.css';

// Fallback curated news items if offline or CORS blocked
const FALLBACK_HEADLINES = [
  {
    title: "Post-Quantum Cryptography Standards Formally Adopted for Cloud Workspaces",
    snippet: "Security researchers celebrate global deployment of Kyber-based hybrid encryption protocols across decentralized web OS environments.",
    link: "https://news.ycombinator.com",
    source: "Tech Security Weekly",
    pubDate: "Just now",
    category: "tech"
  },
  {
    title: "Open-Source Web Workspaces Elevate Browser Productivity",
    snippet: "Modern web OS platforms combine native local computation with seamless cloud sync to deliver lightning-fast desktop experiences.",
    link: "https://news.google.com",
    source: "Developer Hub",
    pubDate: "10m ago",
    category: "general"
  },
  {
    title: "Global Markets Rally as Tech Innovation Surges",
    snippet: "Financial indices show solid performance across tech sectors following groundbreaking AI and computing hardware releases.",
    link: "https://finance.yahoo.com",
    source: "Global Finance",
    pubDate: "25m ago",
    category: "business"
  },
  {
    title: "Next-Gen Web Frameworks Redefine Frontend Speed & Modular Design",
    snippet: "Engineers embrace lightweight client-side storage architecture with zero-latency data manager buses.",
    link: "https://github.com",
    source: "Web Dev Digest",
    pubDate: "1h ago",
    category: "science"
  },
  {
    title: "Breakthroughs in Personal Health & Wellness Tracking",
    snippet: "Smart algorithms provide users with real-time biometric and nutritional insights directly inside personal dashboards.",
    link: "https://bbc.com/news",
    source: "Health & Life Today",
    pubDate: "2h ago",
    category: "health"
  },
  {
    title: "Space Exploration Mission Successfully Enters Lunar Orbit",
    snippet: "Autonomous navigation systems execute precise thruster burns as lunar mapping operations commence.",
    link: "https://nasa.gov",
    source: "AeroSpace Daily",
    pubDate: "3h ago",
    category: "science"
  }
];

export default function NewsFeed() {
  const [country, setCountry] = useState('US');
  const [category, setCategory] = useState('general');
  const [searchQuery, setSearchQuery] = useState('');
  const [newsItems, setNewsItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchNews = useCallback(async () => {
    setLoading(true);

    try {
      // Check for RSS_SOURCES on window
      const rssSources = window.RSS_SOURCES;
      let targetUrl = null;

      if (rssSources && rssSources[country] && rssSources[country][category]) {
        const urls = rssSources[country][category];
        if (urls && urls.length > 0) {
          targetUrl = urls[Math.floor(Math.random() * urls.length)];
        }
      }

      if (targetUrl) {
        // Fetch via rss2json API
        const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(targetUrl)}`;
        const res = await fetch(apiUrl);
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'ok' && Array.isArray(data.items) && data.items.length > 0) {
            const formatted = data.items.map(item => ({
              title: item.title,
              snippet: item.description ? item.description.replace(/<[^>]*>?/gm, '').substring(0, 140) + '...' : '',
              link: item.link,
              source: data.feed?.title || 'RSS Feed',
              pubDate: item.pubDate ? new Date(item.pubDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today',
              category: category
            }));
            setNewsItems(formatted);
            setLoading(false);
            return;
          }
        }
      }
    } catch (e) {
      console.warn("Live RSS fetch failed, loading curated news feed:", e);
    }

    // Fallback if network or RSS source unavailable
    setNewsItems(FALLBACK_HEADLINES);
    setLoading(false);
  }, [country, category]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  // Filter news items by search query
  const filteredItems = newsItems.filter(item => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return item.title.toLowerCase().includes(q) || (item.snippet && item.snippet.toLowerCase().includes(q));
  });

  const pageSize = 6;
  const totalPages = Math.ceil(filteredItems.length / pageSize) || 1;
  const displayedItems = filteredItems.slice((page - 1) * pageSize, page * pageSize);

  return (
    <section className="news-feed-section">
      <div className="news-section-header">
        <div className="news-section-title">
          <i className="fas fa-newspaper"></i>
          <span>Top News & Updates</span>
        </div>

        <div className="news-controls-row">
          <select
            className="news-select-input"
            value={country}
            onChange={(e) => { setCountry(e.target.value); setPage(1); }}
          >
            <option value="US">🇺🇸 United States</option>
            <option value="IN">🇮🇳 India</option>
            <option value="GB">🇬🇧 United Kingdom</option>
            <option value="AU">🇦🇺 Australia</option>
            <option value="CA">🇨🇦 Canada</option>
          </select>

          <select
            className="news-select-input"
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          >
            <option value="general">General</option>
            <option value="business">Business</option>
            <option value="tech">Technology</option>
            <option value="science">Science</option>
            <option value="sports">Sports</option>
            <option value="entertainment">Entertainment</option>
            <option value="health">Health</option>
          </select>

          <input
            type="text"
            className="news-search-input"
            placeholder="Search news..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
          />

          <button className="news-refresh-btn" onClick={fetchNews} title="Refresh News Feed">
            <i className="fas fa-rotate"></i>
          </button>

          <div className="news-pagination-controls">
            <button
              className="news-refresh-btn"
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(p - 1, 1))}
            >
              <i className="fas fa-chevron-left"></i>
            </button>
            <span className="news-page-indicator">{page} / {totalPages}</span>
            <button
              className="news-refresh-btn"
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(p + 1, totalPages))}
            >
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="news-loading-state">
          <i className="fas fa-circle-notch fa-spin"></i> Loading latest RSS headlines...
        </div>
      ) : displayedItems.length === 0 ? (
        <div className="news-empty-state">
          No headlines found matching your search query.
        </div>
      ) : (
        <div className="news-grid">
          {displayedItems.map((item, idx) => (
            <a
              key={idx}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="news-card"
            >
              <div className="news-card-header">
                <span className="news-card-badge">{item.category}</span>
                <h3 className="news-card-title">{item.title}</h3>
                {item.snippet && <p className="news-card-snippet">{item.snippet}</p>}
              </div>
              <div className="news-card-footer">
                <span className="news-card-source">{item.source}</span>
                <span>{item.pubDate}</span>
              </div>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
