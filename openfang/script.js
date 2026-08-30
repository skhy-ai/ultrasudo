/**
 * OpenFang AI Engine — Intelligent Multi-Provider Router, Token Quota Tracker & Auto-Failover
 * Serves as the central AI execution bridge for all Ultrasudo applications.
 */

(function (global) {
    'use strict';

    const DEFAULT_FALLBACK_ORDER = ['openrouter', 'gemini', 'lmstudio', 'openai'];

    class AIProviderEngine {
        constructor() {
            this.cooldownMs = 3600000; // 1 hour cooldown for 429 quota exhaustion
            this.quotaStatus = this.loadQuotaStatus();
        }

        loadQuotaStatus() {
            try {
                let saved = null;
                if (window.dataManager && typeof window.dataManager.getData === 'function') {
                    saved = window.dataManager.getData('ai_quota_status');
                } else {
                    const raw = localStorage.getItem('desktop_app_ai_quota_status');
                    if (raw) saved = JSON.parse(raw).value;
                }
                return saved || {};
            } catch (e) {
                return {};
            }
        }

        saveQuotaStatus() {
            if (window.dataManager && typeof window.dataManager.setData === 'function') {
                window.dataManager.setData('ai_quota_status', this.quotaStatus, 'openfang');
            } else {
                localStorage.setItem('desktop_app_ai_quota_status', JSON.stringify({ value: this.quotaStatus, timestamp: Date.now() }));
            }
        }

        markQuotaExhausted(providerKey, errorMessage = 'Quota / Credit limit exceeded (429)') {
            this.quotaStatus[providerKey] = {
                status: 'quota_exhausted',
                exhaustedAt: Date.now(),
                errorMessage,
                cooldownUntil: Date.now() + this.cooldownMs
            };
            this.saveQuotaStatus();

            // Dispatch global event for UI updates (e.g. API Key Manager badges)
            window.dispatchEvent(new CustomEvent('aiQuotaExhausted', {
                detail: { providerKey, errorMessage, cooldownUntil: this.quotaStatus[providerKey].cooldownUntil }
            }));
        }

        isProviderAvailable(providerKey) {
            const statusObj = this.quotaStatus[providerKey];
            if (!statusObj) return true;
            if (statusObj.status === 'quota_exhausted') {
                if (Date.now() > statusObj.cooldownUntil) {
                    // Reset status after cooldown
                    delete this.quotaStatus[providerKey];
                    this.saveQuotaStatus();
                    return true;
                }
                return false;
            }
            return true;
        }

        resetQuotaStatus(providerKey) {
            delete this.quotaStatus[providerKey];
            this.saveQuotaStatus();
        }

        getAvailableProviders() {
            const allKeys = (window.getAllApiKeys && window.getAllApiKeys()) || {};
            const available = [];

            DEFAULT_FALLBACK_ORDER.forEach(provider => {
                const config = allKeys[provider] || {};
                const hasKey = provider === 'lmstudio' ? true : !!config.apiKey;
                if (hasKey && this.isProviderAvailable(provider)) {
                    available.push({ provider, config });
                }
            });

            return available;
        }

        /**
         * Core execution with automatic provider failover upon 429 / quota limits.
         */
        async invoke(prompt, options = {}) {
            const requestedProvider = options.provider;
            let providersToTry = [];

            const allKeys = (window.getAllApiKeys && window.getAllApiKeys()) || {};

            if (requestedProvider && allKeys[requestedProvider]) {
                providersToTry.push({ provider: requestedProvider, config: allKeys[requestedProvider] });
            }

            // Append standard fallback list
            DEFAULT_FALLBACK_ORDER.forEach(p => {
                if (allKeys[p] && !providersToTry.some(item => item.provider === p)) {
                    if (this.isProviderAvailable(p)) {
                        providersToTry.push({ provider: p, config: allKeys[p] });
                    }
                }
            });

            if (providersToTry.length === 0) {
                throw new Error("No active AI providers available. Please add API keys in the API Key Manager.");
            }

            let lastError = null;

            for (const { provider, config } of providersToTry) {
                try {
                    const result = await this.executeProviderCall(provider, config, prompt, options);
                    return result;
                } catch (err) {
                    lastError = err;
                    const errStr = (err.message || '').toLowerCase();
                    const isQuotaErr = errStr.includes('429') || errStr.includes('quota') || errStr.includes('credit') || errStr.includes('rate limit') || errStr.includes('insufficient_quota');

                    if (isQuotaErr) {
                        console.warn(`[OpenFang AI Engine] Quota limit hit for ${provider}. Initiating failover...`, err);
                        this.markQuotaExhausted(provider, err.message);
                        // Continue loop to retry next provider
                    } else {
                        // For generic non-quota errors (e.g. invalid request format), rethrow
                        throw err;
                    }
                }
            }

            throw new Error(`All configured AI providers failed. Last error: ${lastError ? lastError.message : 'Unknown'}`);
        }

        async executeProviderCall(provider, config, prompt, options) {
            const maxTokens = options.maxTokens || 1024;
            const temperature = options.temperature || 0.7;

            if (provider === 'openrouter') {
                const endpoint = (config.baseUrl || 'https://openrouter.ai/api/v1') + '/chat/completions';
                const model = options.model || config.model || 'google/gemini-2.0-flash-exp:free';

                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${config.apiKey}`,
                        'HTTP-Referer': window.location.origin,
                        'X-Title': 'Ultrasudo'
                    },
                    body: JSON.stringify({
                        model,
                        messages: [{ role: 'user', content: prompt }],
                        max_tokens: maxTokens,
                        temperature
                    })
                });

                if (res.status === 429 || res.status === 402) {
                    throw new Error(`OpenRouter Quota Exhausted (${res.status})`);
                }
                if (!res.ok) throw new Error(`OpenRouter error: ${res.status}`);

                const data = await res.json();
                return data.choices?.[0]?.message?.content || '';
            }

            if (provider === 'gemini') {
                const model = options.model || config.model || 'gemini-2.0-flash';
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(config.apiKey)}`;

                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: { maxOutputTokens: maxTokens, temperature }
                    })
                });

                if (res.status === 429) throw new Error(`Gemini Quota Exceeded (429)`);
                if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);

                const data = await res.json();
                return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            }

            if (provider === 'openai') {
                const endpoint = (config.baseUrl || 'https://api.openai.com/v1') + '/chat/completions';
                const model = options.model || config.model || 'gpt-4o-mini';

                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${config.apiKey}`
                    },
                    body: JSON.stringify({
                        model,
                        messages: [{ role: 'user', content: prompt }],
                        max_tokens: maxTokens,
                        temperature
                    })
                });

                if (res.status === 429 || res.status === 402) throw new Error(`OpenAI Quota Exhausted (${res.status})`);
                if (!res.ok) throw new Error(`OpenAI API error: ${res.status}`);

                const data = await res.json();
                return data.choices?.[0]?.message?.content || '';
            }

            if (provider === 'lmstudio') {
                const endpoint = (config.baseUrl || 'http://localhost:1234') + '/v1/chat/completions';
                const model = options.model || config.model || 'local-model';

                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model,
                        messages: [{ role: 'user', content: prompt }],
                        max_tokens: maxTokens,
                        temperature
                    })
                });

                if (!res.ok) throw new Error(`LM Studio local server error: ${res.status}`);

                const data = await res.json();
                return data.choices?.[0]?.message?.content || '';
            }

            throw new Error(`Unsupported AI Provider: ${provider}`);
        }
    }

    // Export global singleton instance
    global.aiProviderEngine = new AIProviderEngine();
    global.OpenFang = {
        invoke: (prompt, opts) => global.aiProviderEngine.invoke(prompt, opts),
        isConfigured: () => global.aiProviderEngine.getAvailableProviders().length > 0,
        getActiveModel: () => global.aiProviderEngine.getAvailableProviders()[0] || null
    };

})(typeof window !== 'undefined' ? window : this);
