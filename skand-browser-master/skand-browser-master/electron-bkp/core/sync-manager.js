/**
 * Sync Manager
 * Synchronizes local DataManager state with Supabase to provide
 * cross-device data persistence and real-time updates.
 */
class SyncManager {
    constructor() {
        this.supabase = window.supabaseClient;
        this.dataManager = window.dataManager;
        this.user = null;
        this.channel = null;
        this.syncDebounceMap = new Map();

        if (this.supabase && this.dataManager) {
            this.init();
        } else {
            console.warn("SyncManager: Supabase or DataManager not available");
        }
    }

    async init() {
        const { data: { session } } = await this.supabase.auth.getSession();
        if (session && session.user) {
            this.user = session.user;
            await this.hydrateFromCloud();
            this.setupListeners();
            this.registerDevice();
        }

        document.addEventListener('auth-ready', async (e) => {
            if (!this.user) {
                this.user = e.detail.user;
                await this.hydrateFromCloud();
                this.setupListeners();
                this.registerDevice();
            }
        });
    }

    async derivePQCKey() {
        const hex = localStorage.getItem('pqc_device_key');
        if (!hex) throw new Error("Missing PQC device key");
        const raw = new Uint8Array(hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
        return await crypto.subtle.importKey(
            "raw", raw, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]
        );
    }

    async pqcEncrypt(plainText) {
        if (!plainText || localStorage.getItem('enable_pqc') !== 'true') return plainText;
        try {
            const key = await this.derivePQCKey();
            const iv = crypto.getRandomValues(new Uint8Array(12));
            const enc = new TextEncoder().encode(plainText);
            const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, key, enc);

            const cipherArr = new Uint8Array(cipher);
            const combined = new Uint8Array(iv.length + cipherArr.length);
            combined.set(iv);
            combined.set(cipherArr, iv.length);
            return 'PQC:v1:' + btoa(String.fromCharCode(...combined));
        } catch (e) {
            console.error("PQC Encryption failed", e);
            throw new Error("PQC Encryption aborted");
        }
    }

    async pqcDecrypt(cipherText) {
        if (!cipherText || localStorage.getItem('enable_pqc') !== 'true' || !cipherText.startsWith('PQC:v1:')) return cipherText;
        try {
            const key = await this.derivePQCKey();
            const combinedRaw = atob(cipherText.substring(7));
            const combined = new Uint8Array(combinedRaw.length);
            for (let i = 0; i < combinedRaw.length; i++) combined[i] = combinedRaw.charCodeAt(i);

            const iv = combined.slice(0, 12);
            const data = combined.slice(12);

            const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv }, key, data);
            return new TextDecoder().decode(plain);
        } catch (e) {
            console.error("PQC Decryption failed", e);
            return cipherText;
        }
    }

    async hydrateFromCloud() {
        if (!this.user) return;
        try {
            // In a real implementation with a user_data table setup:
            const { data, error } = await this.supabase
                .from('user_data')
                .select('key, value')
                .eq('user_id', this.user.id);

            if (data && !error) {
                // Mute local events so we don't echo back what we just downloaded
                this.isHydrating = true;
                for (const row of data) {
                    const decValueStr = await this.pqcDecrypt(row.value);
                    let decData, cloudTimestamp;

                    try {
                        const parsed = JSON.parse(decValueStr);
                        if (parsed && typeof parsed.timestamp === 'number') {
                            decData = parsed.data;
                            cloudTimestamp = parsed.timestamp;
                        } else {
                            decData = decValueStr;
                            cloudTimestamp = 0; // Legacy data
                        }
                    } catch (e) {
                        decData = decValueStr;
                        cloudTimestamp = 0; // Legacy or purely encrypted string
                    }

                    const localRaw = localStorage.getItem(this.dataManager.storagePrefix + row.key);
                    const localTimestamp = localRaw ? (JSON.parse(localRaw).timestamp || 0) : 0;

                    // Last-Write-Wins Conflict Resolution
                    if (cloudTimestamp >= localTimestamp) {
                        // Cloud has newer data, hydrate local
                        localStorage.setItem(this.dataManager.storagePrefix + row.key, JSON.stringify({
                            value: decData,
                            timestamp: cloudTimestamp || Date.now(),
                            app_source: 'cloud_sync',
                            version: 1
                        }));
                    } else {
                        // Local has newer data (e.g. from offline work). Push back to cloud to fix conflict.
                        const localWrapper = JSON.parse(localRaw);
                        this.pushToCloud(row.key, localWrapper.value, 'set', localWrapper.timestamp);
                    }
                }
                this.isHydrating = false;

                // Emulate a page load event so apps reload data
                window.dispatchEvent(new Event('storage'));
            }
        } catch (err) {
            console.error('Failed to hydrate from cloud:', err);
        }
    }

    setupListeners() {
        if (this.hasListeners) return;

        // Listen to DataManager changes
        this.dataManager.subscribe((e) => {
            if (this.isHydrating) return;
            const { key, value, operation } = e.detail;

            // Debounce the cloud upload so we don't spam Supabase
            if (this.syncDebounceMap.has(key)) {
                clearTimeout(this.syncDebounceMap.get(key));
            }

            const timeoutId = setTimeout(() => {
                this.pushToCloud(key, value, operation);
                this.syncDebounceMap.delete(key);
            }, 1000); // 1s debounce

            this.syncDebounceMap.set(key, timeoutId);
        });

        // Listen for Realtime changes from other devices
        this.channel = this.supabase.channel(`user_data_${this.user.id}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'user_data', filter: `user_id=eq.${this.user.id}` },
                async (payload) => {
                    await this.handleCloudChange(payload);
                }
            )
            .subscribe();

        // Listen for P2P Transfers (Transactions table)
        if (this.user.email) {
            this.supabase.channel(`transactions_${this.user.id}`)
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'transactions', filter: `recipient_email=eq.${this.user.email}` },
                    (payload) => {
                        this.showNativeNotification('Funds Received!', `You just received $${payload.new.amount} from a secure transfer.`);
                    }
                )
                .subscribe();
        }

        this.hasListeners = true;
    }

    showNativeNotification(title, body) {
        if (!("Notification" in window)) return;
        if (Notification.permission === "granted") {
            new Notification(title, { body });
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    new Notification(title, { body });
                }
            });
        }
    }

    async handleCloudChange(payload) {
        // If another device changed data, update local store silently
        this.isHydrating = true;
        const { eventType, new: newRec } = payload;

        if (eventType === 'INSERT' || eventType === 'UPDATE') {
            const decValueStr = await this.pqcDecrypt(newRec.value);
            let decData, cloudTimestamp;
            try {
                const parsed = JSON.parse(decValueStr);
                if (parsed && typeof parsed.timestamp === 'number') {
                    decData = parsed.data;
                    cloudTimestamp = parsed.timestamp;
                } else {
                    decData = decValueStr;
                    cloudTimestamp = 0;
                }
            } catch (e) {
                decData = decValueStr;
                cloudTimestamp = 0;
            }

            const localRaw = localStorage.getItem(this.dataManager.storagePrefix + newRec.key);
            const localTimestamp = localRaw ? (JSON.parse(localRaw).timestamp || 0) : 0;

            if (cloudTimestamp >= localTimestamp) {
                // Incorporate newer cloud update
                const wrapper = {
                    value: decData,
                    timestamp: cloudTimestamp,
                    app_source: 'cloud_realtime',
                    version: 1
                };
                localStorage.setItem(this.dataManager.storagePrefix + newRec.key, JSON.stringify(wrapper));

                // Broadcast so UI updates
                this.dataManager.broadcastDataChange(newRec.key, decData, 'set', 'cloud_realtime');
            } else {
                // Conflict detection: Cloud just pushed older data than what we have locally!
                // Push our local truth back to correct it.
                const localWrapper = JSON.parse(localRaw);
                this.pushToCloud(newRec.key, localWrapper.value, 'set', localWrapper.timestamp);
            }
        } else if (eventType === 'DELETE') {
            const { old: oldRec } = payload;
            localStorage.removeItem(this.dataManager.storagePrefix + oldRec.key);
            this.dataManager.broadcastDataChange(oldRec.key, null, 'delete', 'cloud_realtime');
        }

        this.isHydrating = false;
    }

    async pushToCloud(key, value, operation, overrideTimestamp = null) {
        if (!this.user) return;

        try {
            if (operation === 'set') {
                const timestamp = overrideTimestamp || Date.now();
                const payload = JSON.stringify({ data: value, timestamp });
                const encValue = await this.pqcEncrypt(payload);
                await this.supabase
                    .from('user_data')
                    .upsert({ user_id: this.user.id, key: key, value: encValue }, { onConflict: 'user_id, key' });
            } else if (operation === 'delete') {
                await this.supabase
                    .from('user_data')
                    .delete()
                    .match({ user_id: this.user.id, key: key });
            }
        } catch (err) {
            console.error(`SyncManager: Failed to ${operation} key ${key} to cloud`, err);
        }
    }

    async registerDevice() {
        if (!this.user) return;
        const deviceId = localStorage.getItem('device_id') || ('device_' + Math.random().toString(36).substr(2, 9));
        localStorage.setItem('device_id', deviceId);

        const userAgent = navigator.userAgent;
        try {
            await this.supabase.from('devices').upsert({
                id: deviceId,
                user_id: this.user.id,
                user_agent: userAgent,
                last_active: new Date().toISOString()
            });
        } catch (e) {
            console.warn("Device registration table might not exist yet.");
        }
    }
}

// Inject sync manager after main scripts load
document.addEventListener('DOMContentLoaded', () => {
    // Wait for DataManager and Supabase
    setTimeout(() => {
        window.syncManager = new SyncManager();
    }, 500);
});
