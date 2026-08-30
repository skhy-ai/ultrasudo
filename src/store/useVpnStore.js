import { create } from 'zustand';

export const useVpnStore = create((set, get) => ({
    isConnected: localStorage.getItem('vpn_connected') === 'true',
    activeServer: JSON.parse(localStorage.getItem('vpn_active_server') || 'null') || {
        id: 'us-ny',
        flag: '🇺🇸',
        country: 'United States',
        city: 'New York',
        ip: '104.28.14.88'
    },
    protocol: localStorage.getItem('vpn_protocol') || 'wireguard',
    killSwitch: localStorage.getItem('vpn_kill_switch') === 'true',
    dnsProtection: localStorage.getItem('vpn_dns_protection') !== 'false',

    setVpnState: (connected, server, options = {}) => {
        const activeSrv = server || get().activeServer;
        const newState = {
            isConnected: connected,
            activeServer: activeSrv,
            protocol: options.protocol || get().protocol,
            killSwitch: options.killSwitch !== undefined ? options.killSwitch : get().killSwitch,
            dnsProtection: options.dnsProtection !== undefined ? options.dnsProtection : get().dnsProtection
        };

        localStorage.setItem('vpn_connected', connected ? 'true' : 'false');
        if (activeSrv) {
            localStorage.setItem('vpn_active_server', JSON.stringify(activeSrv));
        }

        set(newState);

        // Sync with Tauri/Electron desktop process if available
        if (window.__TAURI__) {
            try {
                window.__TAURI__.core.invoke('set_proxy_config', {
                    enabled: connected,
                    serverIp: activeSrv ? activeSrv.ip : '',
                    protocol: newState.protocol
                }).catch(() => {});
            } catch (e) {}
        } else if (window.electronAPI?.setProxy) {
            window.electronAPI.setProxy({
                enabled: connected,
                ip: activeSrv ? activeSrv.ip : ''
            });
        }
    },

    disconnect: () => {
        get().setVpnState(false, null);
    }
}));
