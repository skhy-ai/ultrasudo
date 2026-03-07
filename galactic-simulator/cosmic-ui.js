/**
 * Cosmic Explorer — UI Controller (non-module)
 * Handles the sidebar, search, and object info panel.
 * Works alongside main.js (Three.js module).
 * Exposes window.CosmicUI for main.js to call showObjectInfo().
 */

// Celestial object data for search + info panel
const CELESTIAL_DATA = {
    // Solar System Planets
    'Mercury':  { emoji: '☿', type: 'Planet', distFromSun: '0.39 AU', diameter: '4,879 km', moons: '0', dayLength: '59 Earth days', yearLength: '88 Earth days', temp: '-173°C to 427°C', desc: 'Smallest planet, closest to the Sun. No atmosphere and extreme temperature swings.' },
    'Venus':    { emoji: '♀', type: 'Planet', distFromSun: '0.72 AU', diameter: '12,104 km', moons: '0', dayLength: '243 Earth days', yearLength: '225 Earth days', temp: '465°C avg', desc: 'Hottest planet despite not being closest to Sun. Dense CO₂ atmosphere causes greenhouse effect.' },
    'Earth':    { emoji: '🌍', type: 'Planet', distFromSun: '1 AU', diameter: '12,742 km', moons: '1', dayLength: '24 hours', yearLength: '365.25 days', temp: '-88°C to 58°C', desc: 'Our home. Only known planet with life. 71% surface covered in water.' },
    'Mars':     { emoji: '♂', type: 'Planet', distFromSun: '1.52 AU', diameter: '6,779 km', moons: '2', dayLength: '24.6 hours', yearLength: '687 Earth days', temp: '-143°C to 35°C', desc: 'The Red Planet. Has the largest volcano (Olympus Mons) and deepest canyon (Valles Marineris) in the solar system.' },
    'Jupiter':  { emoji: '♃', type: 'Gas Giant', distFromSun: '5.2 AU', diameter: '139,820 km', moons: '95', dayLength: '9.9 hours', yearLength: '12 Earth years', temp: '-110°C cloud tops', desc: 'Largest planet. The Great Red Spot is a storm larger than Earth, ongoing for 400+ years.' },
    'Saturn':   { emoji: '♄', type: 'Gas Giant', distFromSun: '9.58 AU', diameter: '116,460 km', moons: '146', dayLength: '10.7 hours', yearLength: '29.5 Earth years', temp: '-178°C', desc: 'Famous for its stunning ring system made of ice and rock. Less dense than water.' },
    'Uranus':   { emoji: '⛢', type: 'Ice Giant', distFromSun: '19.2 AU', diameter: '50,724 km', moons: '28', dayLength: '17.2 hours', yearLength: '84 Earth years', temp: '-224°C', desc: 'Rotates on its side (98° axial tilt). Has faint rings and is an ice giant.' },
    'Neptune':  { emoji: '♆', type: 'Ice Giant', distFromSun: '30.05 AU', diameter: '49,244 km', moons: '16', dayLength: '16.1 hours', yearLength: '165 Earth years', temp: '-218°C', desc: 'Farthest planet. Has the strongest winds in the solar system at 2,100 km/h.' },
    'Sun':      { emoji: '☀', type: 'Star (G-type)', distFromSun: '0 AU', diameter: '1,392,700 km', moons: 'N/A', dayLength: '25-35 days', yearLength: 'N/A', temp: '5,500°C surface / 15M°C core', desc: 'Our star. Contains 99.86% of the solar system\'s mass. Fusion of hydrogen into helium powers it.' },
    // Moons
    'Moon':     { emoji: '🌕', type: 'Natural Satellite', distFromSun: '1 AU', diameter: '3,474 km', moons: '0', dayLength: '27.3 days', yearLength: '27.3 days', temp: '-233°C to 123°C', desc: 'Earth\'s only natural satellite. Stabilises Earth\'s axial tilt and causes tides.' },
    // Named Stars
    'Proxima Centauri': { emoji: '⭐', type: 'Red Dwarf Star', distFromSun: '4.24 ly', diameter: '0.15× Sun', moons: 'Unknown', dayLength: 'N/A', yearLength: 'N/A', temp: '3,042°C', desc: 'Closest known star to the Sun. Has at least one confirmed exoplanet (Proxima b) in habitable zone.' },
    'Sirius':   { emoji: '✨', type: 'Binary Star', distFromSun: '8.58 ly', diameter: '1.71× Sun', moons: 'Unknown', dayLength: 'N/A', yearLength: 'N/A', temp: '9,940°C', desc: 'Brightest star in the night sky. Part of Canis Major and a binary system (Sirius A+B).' },
    'Betelgeuse': { emoji: '🔴', type: 'Red Supergiant', distFromSun: '700 ly', diameter: '700× Sun', moons: 'N/A', dayLength: 'N/A', yearLength: 'N/A', temp: '3,300°C', desc: 'One of the largest stars visible to the naked eye. Expected to go supernova within 100,000 years.' }
};

window.CosmicUI = {
    showObjectInfo(name) {
        const data = CELESTIAL_DATA[name];
        if (!data) return;

        const sidebar = document.getElementById('cosmic-sidebar');
        const title = document.getElementById('sidebar-title');
        const body = document.getElementById('sidebar-body');

        title.textContent = name;
        body.innerHTML = `
            <div class="object-info">
                <div class="object-emoji">${data.emoji}</div>
                <div class="object-name">${name}</div>
                <div class="object-type">${data.type}</div>
                <div class="info-row"><span class="info-label">Distance from Sun</span><span class="info-value">${data.distFromSun}</span></div>
                <div class="info-row"><span class="info-label">Diameter</span><span class="info-value">${data.diameter}</span></div>
                <div class="info-row"><span class="info-label">Moons</span><span class="info-value">${data.moons}</span></div>
                <div class="info-row"><span class="info-label">Day Length</span><span class="info-value">${data.dayLength}</span></div>
                <div class="info-row"><span class="info-label">Year Length</span><span class="info-value">${data.yearLength}</span></div>
                <div class="info-row"><span class="info-label">Temperature</span><span class="info-value">${data.temp}</span></div>
                <p style="font-size:0.8rem;color:#94a3b8;line-height:1.6;margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.06);">${data.desc}</p>
            </div>
        `;

        if (!sidebar.classList.contains('open')) sidebar.classList.add('open');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('cosmic-sidebar');
    const closeBtn = document.getElementById('sidebar-close');
    const toggleBtn = document.getElementById('btn-toggle-sidebar');
    const searchInput = document.getElementById('object-search');

    // Sidebar toggle
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => sidebar.classList.remove('open'));
    }

    // Search functionality
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const q = searchInput.value.toLowerCase().trim();

            // Remove existing dropdown
            const existing = document.querySelector('.search-dropdown');
            if (existing) existing.remove();

            if (!q) return;

            const matches = Object.keys(CELESTIAL_DATA).filter(name =>
                name.toLowerCase().includes(q)
            );

            if (matches.length === 0) return;

            const dropdown = document.createElement('div');
            dropdown.className = 'search-dropdown';

            matches.slice(0, 8).forEach(name => {
                const d = CELESTIAL_DATA[name];
                const opt = document.createElement('div');
                opt.className = 'search-option';
                opt.innerHTML = `<span>${d.emoji}</span><span>${name}</span><span style="color:#64748b;font-size:11px;margin-left:auto;">${d.type}</span>`;
                opt.addEventListener('click', () => {
                    window.CosmicUI.showObjectInfo(name);
                    dropdown.remove();
                    searchInput.value = '';
                });
                dropdown.appendChild(opt);
            });

            const container = searchInput.parentElement;
            container.style.position = 'relative';
            container.appendChild(dropdown);
        });

        // Close dropdown on outside click
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                const dd = document.querySelector('.search-dropdown');
                if (dd) dd.remove();
            }
        });
    }
});
