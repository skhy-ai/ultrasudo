document.addEventListener('DOMContentLoaded', () => {
    // Wait for AppClassifier
    if (!window.appClassifier) {
        console.error("AppClassifier missing");
        return;
    }

    const container = document.getElementById('wizard-apps-list');
    const apps = Array.from(window.appClassifier.appRegistry.values());
    
    // Default checked standard apps
    const defaults = ['web-browser', 'desktop', 'notebook', 'calculator', 'timer'];

    apps.forEach(app => {
        const card = document.createElement('label');
        card.className = 'app-toggle-card';
        if (defaults.includes(app.id)) {
            card.classList.add('selected');
        }

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = app.id;
        checkbox.checked = defaults.includes(app.id);

        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) card.classList.add('selected');
            else card.classList.remove('selected');
        });

        const icon = document.createElement('i');
        icon.className = `${app.icon} icon`;

        const info = document.createElement('div');
        info.className = 'app-info';
        
        const name = document.createElement('span');
        name.className = 'app-name';
        name.textContent = app.name;

        const desc = document.createElement('span');
        desc.className = 'app-desc';
        desc.textContent = app.description || 'Application';

        info.appendChild(name);
        info.appendChild(desc);

        card.appendChild(checkbox);
        card.appendChild(icon);
        card.appendChild(info);

        container.appendChild(card);
    });

    document.getElementById('btn-finish-setup').addEventListener('click', () => {
        const checkboxes = document.querySelectorAll('input[type="checkbox"]');
        const enabledApps = [];
        checkboxes.forEach(cb => {
            if (cb.checked) enabledApps.push(cb.value);
        });

        if (!enabledApps.includes('desktop')) enabledApps.push('desktop');
        if (!enabledApps.includes('web-browser')) enabledApps.push('web-browser');

        localStorage.setItem('enabled_apps', JSON.stringify(enabledApps));
        localStorage.setItem('skand_setup_complete', 'true');
        
        window.location.href = 'desktop.html'; // Return to desktop
    });
});
