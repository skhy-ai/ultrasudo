/**
 * Ultrasudo — Setup Wizard (4-Step Onboarding)
 * Step 1: Welcome
 * Step 2: User Type Selection → drives smart defaults
 * Step 3: App Selection (category-grouped, pre-selected by user type)
 * Step 4: Theme + Cloud Sync + Finish
 */

let currentStep = 1;
const totalSteps = 4;

// User type → default app IDs mapping
const USER_TYPE_DEFAULTS = {
    developer: [
        'web-browser', 'desktop', 'notebook', 'code-generator', 'python-ide',
        'mermaid-editor', 'markdown-editor', 'kanban-board', 'calculator', 'timer',
        'spreadsheet-app'
    ],
    finance: [
        'web-browser', 'desktop', 'stock-ticker', 'stock-screener', 'currency-converter',
        'investment-board', 'portfolio-manager', 'calculator', 'spreadsheet-app',
        'notebook', 'todo-list'
    ],
    student: [
        'web-browser', 'desktop', 'notebook', 'calculator', 'timer',
        'todo-list', 'calendar', 'spreadsheet-app', 'pomodoro-timer',
        'markdown-editor', 'kanban-board'
    ],
    creative: [
        'web-browser', 'desktop', 'galactic-simulator', 'music', 'markdown-editor',
        'kanban-board', 'notebook', 'mermaid-editor', 'calculator', 'timer'
    ],
    general: [
        'web-browser', 'desktop', 'calculator', 'todo-list', 'notebook',
        'timer', 'weather', 'pomodoro-timer', 'calendar', 'markdown-editor'
    ]
};

// Category display labels
const CATEGORY_LABELS = {
    productivity: '📋 Productivity',
    finance: '💰 Finance',
    development: '🛠 Development',
    lifestyle: '🌿 Lifestyle',
    health: '❤ Health',
    entertainment: '🎮 Entertainment',
    system: '⚙ System'
};

// Category display order
const CATEGORY_ORDER = ['productivity', 'finance', 'development', 'lifestyle', 'health', 'entertainment', 'system'];

document.addEventListener('DOMContentLoaded', () => {
    // Bail if AppClassifier isn't ready
    if (!window.appClassifier) {
        console.error('AppClassifier missing — cannot render wizard.');
        return;
    }

    initStep2Listeners();
    initStep3Apps();
    initStep4Listeners();
    initFinishButton();
    updateProgress();
});

// --- Navigation ---
function nextStep() {
    if (currentStep >= totalSteps) return;
    currentStep++;
    showStep(currentStep);
    updateProgress();

    // When entering step 3, apply user type defaults
    if (currentStep === 3) {
        applyUserTypeDefaults();
    }
}

function prevStep() {
    if (currentStep <= 1) return;
    currentStep--;
    showStep(currentStep);
    updateProgress();
}

function showStep(step) {
    document.querySelectorAll('.wizard-step').forEach(el => el.classList.remove('active'));
    const target = document.getElementById(`step-${step}`);
    if (target) target.classList.add('active');
}

function updateProgress() {
    // Fill bar
    const fill = document.getElementById('progress-fill');
    if (fill) {
        fill.style.width = `${(currentStep / totalSteps) * 100}%`;
    }

    // Step dots
    document.querySelectorAll('.step-dot').forEach(dot => {
        const s = parseInt(dot.dataset.step);
        dot.classList.remove('active', 'done');
        if (s === currentStep) dot.classList.add('active');
        else if (s < currentStep) dot.classList.add('done');
    });
}

// --- Step 2: User Type ---
function initStep2Listeners() {
    const grid = document.getElementById('user-type-grid');
    if (!grid) return;

    // Set 'general' as default
    const defaultRadio = grid.querySelector('input[value="general"]');
    if (defaultRadio) defaultRadio.checked = true;

    grid.querySelectorAll('.user-type-card').forEach(card => {
        card.addEventListener('click', () => {
            grid.querySelectorAll('.user-type-card').forEach(c => c.classList.remove('selected'));
            // Card label handles radio. Visually style for wrapper.
        });
    });

    // Listen for radio changes to add visual class
    grid.querySelectorAll('input[name="user-type"]').forEach(radio => {
        radio.addEventListener('change', () => {
            grid.querySelectorAll('.user-type-card').forEach(c => c.classList.remove('selected'));
            if (radio.checked) {
                radio.closest('.user-type-card').classList.add('selected');
            }
        });
    });
}

function getSelectedUserType() {
    const radio = document.querySelector('input[name="user-type"]:checked');
    return radio ? radio.value : 'general';
}

// --- Step 3: App Selection by Category ---
function initStep3Apps() {
    const container = document.getElementById('apps-by-category');
    if (!container || !window.appClassifier) return;

    const apps = Array.from(window.appClassifier.appRegistry.values())
        .filter(app => !app.comingSoon && app.id !== 'desktop');

    // Group by category
    const grouped = {};
    apps.forEach(app => {
        const cat = app.category || 'system';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(app);
    });

    container.innerHTML = '';

    CATEGORY_ORDER.forEach(cat => {
        if (!grouped[cat] || grouped[cat].length === 0) return;

        const group = document.createElement('div');
        group.className = 'category-group';
        group.dataset.category = cat;

        const header = document.createElement('div');
        header.className = 'category-header';
        header.innerHTML = `
            <h4>${CATEGORY_LABELS[cat] || cat}</h4>
            <button class="category-toggle-all" data-category="${cat}">Select All</button>
        `;

        const grid = document.createElement('div');
        grid.className = 'category-apps';

        grouped[cat].forEach(app => {
            const card = document.createElement('label');
            card.className = 'app-toggle-card';
            card.dataset.appId = app.id;

            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.value = app.id;

            const check = document.createElement('div');
            check.className = 'app-check';
            check.innerHTML = '<i class="fas fa-check"></i>';

            const icon = document.createElement('i');
            icon.className = `${app.icon} icon`;

            const info = document.createElement('div');
            info.className = 'app-info';
            info.innerHTML = `
                <span class="app-name">${app.name}</span>
                <span class="app-desc">${app.description || 'Application'}</span>
            `;

            card.appendChild(cb);
            card.appendChild(check);
            card.appendChild(icon);
            card.appendChild(info);

            // Toggle visual state
            cb.addEventListener('change', () => {
                card.classList.toggle('selected', cb.checked);
            });

            grid.appendChild(card);
        });

        group.appendChild(header);
        group.appendChild(grid);
        container.appendChild(group);
    });

    // Also handle uncategorized
    const uncategorized = Object.keys(grouped).filter(k => !CATEGORY_ORDER.includes(k));
    uncategorized.forEach(cat => {
        if (!grouped[cat] || grouped[cat].length === 0) return;
        const group = document.createElement('div');
        group.className = 'category-group';
        group.dataset.category = cat;

        const header = document.createElement('div');
        header.className = 'category-header';
        header.innerHTML = `
            <h4>${CATEGORY_LABELS[cat] || ('📦 ' + cat.charAt(0).toUpperCase() + cat.slice(1))}</h4>
            <button class="category-toggle-all" data-category="${cat}">Select All</button>
        `;
        const grid = document.createElement('div');
        grid.className = 'category-apps';

        grouped[cat].forEach(app => {
            const card = document.createElement('label');
            card.className = 'app-toggle-card';
            card.dataset.appId = app.id;
            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.value = app.id;
            const check = document.createElement('div');
            check.className = 'app-check';
            check.innerHTML = '<i class="fas fa-check"></i>';
            const icon = document.createElement('i');
            icon.className = `${app.icon} icon`;
            const info = document.createElement('div');
            info.className = 'app-info';
            info.innerHTML = `<span class="app-name">${app.name}</span><span class="app-desc">${app.description || 'Application'}</span>`;
            card.appendChild(cb);
            card.appendChild(check);
            card.appendChild(icon);
            card.appendChild(info);
            cb.addEventListener('change', () => card.classList.toggle('selected', cb.checked));
            grid.appendChild(card);
        });
        group.appendChild(header);
        group.appendChild(grid);
        container.appendChild(group);
    });

    // Wire "Select All" buttons
    document.querySelectorAll('.category-toggle-all').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const cat = btn.dataset.category;
            const group = document.querySelector(`.category-group[data-category="${cat}"]`);
            if (!group) return;

            const checkboxes = group.querySelectorAll('input[type="checkbox"]');
            const allChecked = Array.from(checkboxes).every(cb => cb.checked);

            checkboxes.forEach(cb => {
                cb.checked = !allChecked;
                cb.dispatchEvent(new Event('change'));
            });

            btn.textContent = allChecked ? 'Select All' : 'Deselect All';
        });
    });
}

function applyUserTypeDefaults() {
    const userType = getSelectedUserType();
    const defaults = USER_TYPE_DEFAULTS[userType] || USER_TYPE_DEFAULTS.general;

    // Uncheck everything first
    document.querySelectorAll('#apps-by-category input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
        cb.dispatchEvent(new Event('change'));
    });

    // Check defaults
    defaults.forEach(appId => {
        const card = document.querySelector(`.app-toggle-card[data-app-id="${appId}"]`);
        if (card) {
            const cb = card.querySelector('input[type="checkbox"]');
            if (cb) {
                cb.checked = true;
                cb.dispatchEvent(new Event('change'));
            }
        }
    });
}

// --- Step 4: Theme + Cloud Sync ---
function initStep4Listeners() {
    const themeGrid = document.getElementById('theme-grid');
    if (!themeGrid) return;

    themeGrid.querySelectorAll('.theme-card').forEach(card => {
        card.addEventListener('click', () => {
            themeGrid.querySelectorAll('.theme-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
        });
    });
}

// --- Finish ---
function initFinishButton() {
    const btn = document.getElementById('btn-finish-setup');
    if (!btn) return;

    btn.addEventListener('click', () => {
        // 1. Collect enabled apps
        const enabledApps = ['desktop', 'web-browser']; // Always enabled
        document.querySelectorAll('#apps-by-category input[type="checkbox"]').forEach(cb => {
            if (cb.checked && !enabledApps.includes(cb.value)) {
                enabledApps.push(cb.value);
            }
        });

        // 2. Save user type
        const userType = getSelectedUserType();
        localStorage.setItem('user_type', userType);

        // 3. Save enabled apps
        localStorage.setItem('enabled_apps', JSON.stringify(enabledApps));

        // 4. Save theme
        const themeRadio = document.querySelector('input[name="theme"]:checked');
        const theme = themeRadio ? themeRadio.value : 'default';
        localStorage.setItem('desktop_theme', theme);

        // 5. Save cloud sync preference
        const cloudSync = document.getElementById('enable-cloud-sync');
        localStorage.setItem('enable_cloud_sync', cloudSync && cloudSync.checked ? 'true' : 'false');

        // 6. Mark setup complete
        localStorage.setItem('ultrasudo_setup_complete', 'true');

        // 7. Redirect to desktop
        window.location.href = 'desktop.html';
    });
}
