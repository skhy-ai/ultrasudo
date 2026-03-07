/**
 * Skand Browser — Floating Widget Bar
 * An independent, draggable, floating bar that lives on top of any page.
 * Enabled by the user via Settings. Persists position and state in localStorage.
 *
 * Usage: include this script and widget-bar.css from any app or browser page.
 * The bar auto-initialises when the DOM is ready.
 *
 * Widgets built-in:
 *  - Clock (digital, live)
 *  - Battery Indicator (if supported)
 *  - Network Status
 *  - Quick Timer
 *  - Mini Calculator
 *  - Weather snippet (uses stored preferences)
 *  - Today's Date
 */

/* ─── Public API ──────────────────────────────────────────────────────────── */
window.WidgetBar = {
    init,
    show,
    hide,
    toggle,
    isVisible: () => _state.visible,
    addWidget,
    removeWidget
};

/* ─── State ───────────────────────────────────────────────────────────────── */
const _state = {
    visible: false,
    position: { x: null, y: null }, // null = centered top
    orientation: 'horizontal',      // 'horizontal' | 'vertical'
    enabledWidgets: [],
    dragging: false,
    dragOffset: { x: 0, y: 0 }
};

const DEFAULT_WIDGETS = ['clock', 'date', 'network', 'battery', 'timer'];
const STORAGE_KEY = 'widget_bar_state';

let _bar = null; // The DOM element

/* ─── Init ────────────────────────────────────────────────────────────────── */
function init() {
    _loadState();

    // Create bar if doesn't exist
    if (!document.getElementById('skand-widget-bar')) {
        _buildBar();
    } else {
        _bar = document.getElementById('skand-widget-bar');
    }

    if (_state.visible) show();
    else _bar.style.display = 'none';

    // Keyboard shortcut: Alt+W toggles bar
    document.addEventListener('keydown', (e) => {
        if (e.altKey && e.key === 'w') toggle();
    });
}

/* ─── DOM Build ───────────────────────────────────────────────────────────── */
function _buildBar() {
    _bar = document.createElement('div');
    _bar.id = 'skand-widget-bar';
    _bar.className = 'widget-bar ' + _state.orientation;
    _bar.setAttribute('role', 'toolbar');
    _bar.setAttribute('aria-label', 'Skand Widget Bar');

    // Drag handle
    const handle = document.createElement('div');
    handle.className = 'widget-bar-handle';
    handle.title = 'Drag to move • Double-click to toggle orientation';
    handle.innerHTML = '<i class="fas fa-grip-lines-vertical"></i>';
    _bar.appendChild(handle);

    // Widget area
    const widgetsArea = document.createElement('div');
    widgetsArea.className = 'widget-bar-widgets';
    widgetsArea.id = 'widget-bar-widgets';
    _bar.appendChild(widgetsArea);

    // Toolbar: add widget + close
    const toolbar = document.createElement('div');
    toolbar.className = 'widget-bar-toolbar';
    toolbar.innerHTML = `
        <button class="wb-btn" id="wb-add-btn" title="Add widget"><i class="fas fa-plus"></i></button>
        <button class="wb-btn" id="wb-orient-btn" title="Toggle orientation"><i class="fas fa-arrows-left-right"></i></button>
        <button class="wb-btn wb-btn-close" id="wb-close-btn" title="Hide bar (Alt+W to reopen)"><i class="fas fa-times"></i></button>
    `;
    _bar.appendChild(toolbar);

    document.body.appendChild(_bar);

    // Render widgets
    _renderWidgets();

    // Wire events
    _setupDrag(handle);
    document.getElementById('wb-close-btn').addEventListener('click', hide);
    document.getElementById('wb-orient-btn').addEventListener('click', _toggleOrientation);
    document.getElementById('wb-add-btn').addEventListener('click', _openAddWidgetMenu);

    // Double-click handle to rotate
    handle.addEventListener('dblclick', _toggleOrientation);

    // Position
    _applyPosition();
}

/* ─── Widget Registry ─────────────────────────────────────────────────────── */
const _widgetDefs = {};

function addWidget(id, def) {
    // def: { label, icon, render: () => HTMLElement, update?: (el) => void, interval?: ms }
    _widgetDefs[id] = def;
}

function removeWidget(id) {
    _state.enabledWidgets = _state.enabledWidgets.filter(w => w !== id);
    _saveState();
    _renderWidgets();
}

function _renderWidgets() {
    const area = document.getElementById('widget-bar-widgets');
    if (!area) return;
    area.innerHTML = '';

    (_state.enabledWidgets.length > 0 ? _state.enabledWidgets : DEFAULT_WIDGETS).forEach(id => {
        const def = _widgetDefs[id];
        if (!def) return;

        const wrapper = document.createElement('div');
        wrapper.className = 'widget-item';
        wrapper.dataset.widgetId = id;
        wrapper.title = def.label;

        try {
            const el = def.render();
            wrapper.appendChild(el);
        } catch (e) {
            wrapper.innerHTML = `<span class="widget-err">${def.icon || '?'}</span>`;
        }

        area.appendChild(wrapper);

        // Start update interval
        if (def.update && def.interval) {
            const intervalId = setInterval(() => {
                const target = area.querySelector(`[data-widget-id="${id}"]`);
                if (target) def.update(target.firstChild);
            }, def.interval);
            wrapper._intervalId = intervalId;
        }
    });
}

/* ─── Built-in Widgets ────────────────────────────────────────────────────── */
function _registerBuiltins() {
    // Clock
    addWidget('clock', {
        label: 'Clock',
        icon: '🕐',
        render() {
            const el = document.createElement('div');
            el.className = 'wb-clock';
            el.textContent = _fmtTime();
            return el;
        },
        update(el) { el.textContent = _fmtTime(); },
        interval: 1000
    });

    // Date
    addWidget('date', {
        label: 'Date',
        icon: '📅',
        render() {
            const el = document.createElement('div');
            el.className = 'wb-date';
            el.textContent = _fmtDate();
            return el;
        },
        update(el) { el.textContent = _fmtDate(); },
        interval: 60000
    });

    // Network
    addWidget('network', {
        label: 'Network',
        icon: '📶',
        render() {
            const el = document.createElement('div');
            el.className = 'wb-network';
            _updateNetworkEl(el);
            window.addEventListener('online', () => _updateNetworkEl(el));
            window.addEventListener('offline', () => _updateNetworkEl(el));
            return el;
        }
    });

    // Battery
    addWidget('battery', {
        label: 'Battery',
        icon: '🔋',
        render() {
            const el = document.createElement('div');
            el.className = 'wb-battery';
            el.innerHTML = '<i class="fas fa-battery-half"></i><span>—</span>';
            if ('getBattery' in navigator) {
                navigator.getBattery().then(bat => {
                    const update = () => {
                        const pct = Math.round(bat.level * 100);
                        const icons = pct > 80 ? 'fa-battery-full' : pct > 60 ? 'fa-battery-three-quarters' : pct > 40 ? 'fa-battery-half' : pct > 20 ? 'fa-battery-quarter' : 'fa-battery-empty';
                        const color = pct > 20 ? '#10b981' : '#ef4444';
                        el.innerHTML = `<i class="fas ${icons}" style="color:${color}"></i><span>${pct}%${bat.charging ? ' ⚡' : ''}</span>`;
                    };
                    update();
                    bat.addEventListener('levelchange', update);
                    bat.addEventListener('chargingchange', update);
                });
            }
            return el;
        }
    });

    // Quick Timer
    addWidget('timer', {
        label: 'Timer',
        icon: '⏱',
        render() {
            const el = document.createElement('div');
            el.className = 'wb-timer';
            let seconds = 0;
            let running = false;
            let intervalId = null;

            const display = document.createElement('span');
            display.textContent = '00:00';
            const startBtn = document.createElement('button');
            startBtn.className = 'wb-timer-btn';
            startBtn.innerHTML = '<i class="fas fa-play"></i>';
            const resetBtn = document.createElement('button');
            resetBtn.className = 'wb-timer-btn';
            resetBtn.innerHTML = '<i class="fas fa-rotate-left"></i>';

            startBtn.addEventListener('click', () => {
                if (running) {
                    clearInterval(intervalId);
                    startBtn.innerHTML = '<i class="fas fa-play"></i>';
                } else {
                    intervalId = setInterval(() => {
                        seconds++;
                        const m = String(Math.floor(seconds / 60)).padStart(2, '0');
                        const s = String(seconds % 60).padStart(2, '0');
                        display.textContent = `${m}:${s}`;
                    }, 1000);
                    startBtn.innerHTML = '<i class="fas fa-pause"></i>';
                }
                running = !running;
            });

            resetBtn.addEventListener('click', () => {
                clearInterval(intervalId);
                running = false;
                seconds = 0;
                display.textContent = '00:00';
                startBtn.innerHTML = '<i class="fas fa-play"></i>';
            });

            el.appendChild(display);
            el.appendChild(startBtn);
            el.appendChild(resetBtn);
            return el;
        }
    });

    // Mini Calculator
    addWidget('calculator', {
        label: 'Calculator',
        icon: '🧮',
        render() {
            const el = document.createElement('div');
            el.className = 'wb-calc';
            const display = document.createElement('input');
            display.type = 'text';
            display.className = 'wb-calc-display';
            display.placeholder = '0';
            display.readOnly = true;

            let expr = '';

            const keys = ['7','8','9','÷','4','5','6','×','1','2','3','−','0','.','⌫','=','C','(',')','+'];
            const keyMap = { '÷': '/', '×': '*', '−': '-' };

            const keypad = document.createElement('div');
            keypad.className = 'wb-calc-keys';

            keys.forEach(k => {
                const btn = document.createElement('button');
                btn.className = 'wb-calc-key' + (k === '=' ? ' wb-calc-eq' : '') + (k === 'C' ? ' wb-calc-c' : '');
                btn.textContent = k;
                btn.addEventListener('click', () => {
                    if (k === 'C') { expr = ''; display.value = ''; return; }
                    if (k === '⌫') { expr = expr.slice(0, -1); display.value = expr; return; }
                    if (k === '=') {
                        try {
                            const safeExpr = expr.replace(/[^0-9+\-*/.()%]/g, '');
                            const result = Function('"use strict"; return (' + safeExpr + ')')();
                            display.value = Math.round(result * 1e10) / 1e10;
                            expr = String(display.value);
                        } catch { display.value = 'Error'; expr = ''; }
                        return;
                    }
                    expr += (keyMap[k] || k);
                    display.value = expr;
                });
                keypad.appendChild(btn);
            });

            el.appendChild(display);
            el.appendChild(keypad);
            return el;
        }
    });

    // Quick Note
    addWidget('note', {
        label: 'Quick Note',
        icon: '📝',
        render() {
            const el = document.createElement('div');
            el.className = 'wb-note';
            const ta = document.createElement('textarea');
            ta.placeholder = 'Quick note...';
            ta.value = localStorage.getItem('widget_quick_note') || '';
            ta.addEventListener('input', () => localStorage.setItem('widget_quick_note', ta.value));
            el.appendChild(ta);
            return el;
        }
    });
}

/* ─── Add Widget Menu ─────────────────────────────────────────────────────── */
function _openAddWidgetMenu() {
    const existing = document.getElementById('wb-widget-menu');
    if (existing) { existing.remove(); return; }

    const menu = document.createElement('div');
    menu.id = 'wb-widget-menu';
    menu.className = 'wb-menu';

    const enabledSet = new Set(_state.enabledWidgets.length > 0 ? _state.enabledWidgets : DEFAULT_WIDGETS);

    Object.keys(_widgetDefs).forEach(id => {
        const def = _widgetDefs[id];
        const row = document.createElement('label');
        row.className = 'wb-menu-row';

        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = enabledSet.has(id);
        cb.addEventListener('change', () => {
            if (cb.checked) enabledSet.add(id);
            else enabledSet.delete(id);
            _state.enabledWidgets = [...enabledSet];
            _saveState();
            _renderWidgets();
        });

        row.appendChild(cb);
        row.appendChild(document.createTextNode(` ${def.icon || ''} ${def.label}`));
        menu.appendChild(row);
    });

    _bar.appendChild(menu);
    setTimeout(() => document.addEventListener('click', function close(e) {
        if (!menu.contains(e.target) && e.target.id !== 'wb-add-btn') {
            menu.remove();
            document.removeEventListener('click', close);
        }
    }), 100);
}

/* ─── Drag & Drop ─────────────────────────────────────────────────────────── */
function _setupDrag(handle) {
    handle.addEventListener('mousedown', (e) => {
        _state.dragging = true;
        const rect = _bar.getBoundingClientRect();
        _state.dragOffset.x = e.clientX - rect.left;
        _state.dragOffset.y = e.clientY - rect.top;
        _bar.style.transition = 'none';
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!_state.dragging) return;
        const x = e.clientX - _state.dragOffset.x;
        const y = e.clientY - _state.dragOffset.y;
        // Clamp within viewport
        const maxX = window.innerWidth - _bar.offsetWidth;
        const maxY = window.innerHeight - _bar.offsetHeight;
        _state.position.x = Math.max(0, Math.min(x, maxX));
        _state.position.y = Math.max(0, Math.min(y, maxY));
        _applyPosition();
    });

    document.addEventListener('mouseup', () => {
        if (_state.dragging) {
            _state.dragging = false;
            _bar.style.transition = '';
            _saveState();
        }
    });

    // Touch support
    handle.addEventListener('touchstart', (e) => {
        const t = e.touches[0];
        _state.dragging = true;
        const rect = _bar.getBoundingClientRect();
        _state.dragOffset.x = t.clientX - rect.left;
        _state.dragOffset.y = t.clientY - rect.top;
        e.preventDefault();
    }, { passive: false });

    document.addEventListener('touchmove', (e) => {
        if (!_state.dragging) return;
        const t = e.touches[0];
        _state.position.x = t.clientX - _state.dragOffset.x;
        _state.position.y = t.clientY - _state.dragOffset.y;
        _applyPosition();
    }, { passive: true });

    document.addEventListener('touchend', () => {
        _state.dragging = false;
        _saveState();
    });
}

function _applyPosition() {
    if (!_bar) return;
    if (_state.position.x !== null) {
        _bar.style.left = _state.position.x + 'px';
        _bar.style.top = _state.position.y + 'px';
        _bar.style.right = 'auto';
        _bar.style.transform = 'none';
    } else {
        // Default: top-center
        _bar.style.left = '50%';
        _bar.style.top = '10px';
        _bar.style.right = 'auto';
        _bar.style.transform = 'translateX(-50%)';
    }
}

/* ─── Orientation ─────────────────────────────────────────────────────────── */
function _toggleOrientation() {
    _state.orientation = _state.orientation === 'horizontal' ? 'vertical' : 'horizontal';
    _bar.className = 'widget-bar ' + _state.orientation;
    _saveState();
}

/* ─── Show / Hide ─────────────────────────────────────────────────────────── */
function show() {
    _state.visible = true;
    if (_bar) {
        _bar.style.display = 'flex';
        _bar.classList.add('wb-entering');
        setTimeout(() => _bar.classList.remove('wb-entering'), 400);
    }
    _saveState();
}

function hide() {
    _state.visible = false;
    if (_bar) {
        _bar.classList.add('wb-leaving');
        setTimeout(() => {
            _bar.style.display = 'none';
            _bar.classList.remove('wb-leaving');
        }, 300);
    }
    _saveState();
}

function toggle() {
    _state.visible ? hide() : show();
}

/* ─── Persistence ─────────────────────────────────────────────────────────── */
function _saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
        visible: _state.visible,
        position: _state.position,
        orientation: _state.orientation,
        enabledWidgets: _state.enabledWidgets
    }));
}

function _loadState() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (saved) Object.assign(_state, saved);
    } catch (e) { /* fresh start */ }
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function _fmtTime() {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function _fmtDate() {
    return new Date().toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

function _updateNetworkEl(el) {
    const online = navigator.onLine;
    el.innerHTML = `<i class="fas fa-wifi" style="color:${online ? '#10b981' : '#ef4444'}"></i><span>${online ? 'Online' : 'Offline'}</span>`;
}

/* ─── Kick off ────────────────────────────────────────────────────────────── */
_registerBuiltins();
document.addEventListener('DOMContentLoaded', init);
