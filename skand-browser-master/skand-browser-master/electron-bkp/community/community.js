document.addEventListener('DOMContentLoaded', () => {
    const submitForm = document.getElementById('submit-app-form');
    const discoverGrid = document.getElementById('community-app-grid');
    const installedGrid = document.getElementById('installed-community-grid');

    // Simulate finding community apps from a server
    let communityApps = JSON.parse(localStorage.getItem('community_db')) || [
        {
            id: 'demo-paint',
            name: 'Web Paint',
            description: 'A community submitted simple drawing application.',
            path: 'https://jspaint.app',
            icon: 'fas fa-palette'
        },
        {
            id: 'demo-calc-advanced',
            name: 'Graph Calc',
            description: 'Advanced graphing calculator for students.',
            path: 'https://www.desmos.com/calculator',
            icon: 'fas fa-chart-area'
        }
    ];

    let installedCustomApps = JSON.parse(localStorage.getItem('custom_installed_apps')) || [];

    function renderApps() {
        discoverGrid.innerHTML = '';
        installedGrid.innerHTML = '';

        // Render Community Discover
        communityApps.forEach(app => {
            const isInstalled = installedCustomApps.find(a => a.id === app.id);
            const card = document.createElement('div');
            card.className = 'app-card';
            card.innerHTML = `
                <i class="${app.icon} app-icon"></i>
                <div class="app-name">${app.name}</div>
                <div class="app-desc">${app.description}</div>
                ${isInstalled
                    ? `<button class="btn btn-secondary" disabled>Already Installed</button>`
                    : `<button class="btn btn-primary" onclick="installApp('${app.id}')">Install to Desktop</button>`
                }
            `;
            discoverGrid.appendChild(card);
        });

        // Render Installed
        if (installedCustomApps.length === 0) {
            installedGrid.innerHTML = '<p style="color:#64748b; font-size:14px; grid-column: 1/-1;">No community apps installed yet.</p>';
        } else {
            installedCustomApps.forEach(app => {
                const card = document.createElement('div');
                card.className = 'app-card';
                card.innerHTML = `
                    <i class="${app.icon} app-icon"></i>
                    <div class="app-name">${app.name}</div>
                    <div class="app-desc">${app.description}</div>
                    <button class="btn btn-danger" onclick="removeApp('${app.id}')">Remove</button>
                    <a href="${app.path}" target="_blank" class="btn btn-secondary" style="margin-top:10px; display:inline-block; text-decoration:none;">Open</a>
                `;
                installedGrid.appendChild(card);
            });
        }
    }

    // Expose functions globally for inline onclick
    window.installApp = (id) => {
        const app = communityApps.find(a => a.id === id);
        if (app && !installedCustomApps.find(a => a.id === id)) {
            installedCustomApps.push(app);
            saveData();
            renderApps();
            alert(`${app.name} installed successfully! Refresh your desktop to see it.`);
        }
    };

    window.removeApp = (id) => {
        installedCustomApps = installedCustomApps.filter(a => a.id !== id);
        saveData();
        renderApps();
        alert(`App removed. Details will reflect on desktop upon refresh.`);
    };

    function saveData() {
        localStorage.setItem('community_db', JSON.stringify(communityApps));
        localStorage.setItem('custom_installed_apps', JSON.stringify(installedCustomApps));
    }

    // Handle Form Submission
    submitForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // Use user email if authed, else anonymous
        const user = window.supabase?.auth?.user?.() || { email: 'anonymous_user' };

        const newApp = {
            id: 'custom-' + Date.now(),
            name: document.getElementById('app-name').value,
            description: document.getElementById('app-desc').value,
            path: document.getElementById('app-path').value,
            icon: document.getElementById('app-icon').value || 'fas fa-rocket',
            author: user.email
        };

        communityApps.push(newApp);
        saveData();
        renderApps();
        submitForm.reset();
        alert('App submitted successfully to the community registry!');
    });

    // Initial render
    renderApps();
});
