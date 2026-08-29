/**
 * UltraSudo — AI Provider Configuration
 * Supports: Gemini (default), OpenRouter, Skhy Vidur
 */

const AI_PROVIDERS = {
    gemini: {
        name: 'Gemini',
        model: 'gemini-2.0-flash',
        endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/',
        keyPrefix: 'AIza',
        description: 'Google Gemini — fast, capable, free tier available'
    },
    openrouter: {
        name: 'OpenRouter',
        model: 'google/gemini-2.0-flash-001',
        endpoint: 'https://openrouter.ai/api/v1/chat/completions',
        keyPrefix: 'sk-or-',
        description: 'OpenRouter — access multiple models through one API'
    },
    vidur: {
        name: 'Skhy Vidur',
        model: 'vidur-1',
        endpoint: 'http://localhost:8080/v1/chat/completions',
        keyPrefix: '',
        description: 'Skhy Vidur — self-hosted, fully private'
    }
};

const DEFAULT_PROVIDER = 'gemini';

/**
 * Get or set the active AI provider
 */
function getActiveProvider() {
    return localStorage.getItem('ultrasudo_ai_provider') || DEFAULT_PROVIDER;
}

function setActiveProvider(providerId) {
    localStorage.setItem('ultrasudo_ai_provider', providerId);
}

/**
 * Get or set the API key for a provider
 */
function getApiKey(providerId) {
    return localStorage.getItem(`ultrasudo_apikey_${providerId || getActiveProvider()}`) || '';
}

function setApiKey(key, providerId) {
    localStorage.setItem(`ultrasudo_apikey_${providerId || getActiveProvider()}`, key);
}

/**
 * Get provider config
 */
function getProviderConfig(providerId) {
    return AI_PROVIDERS[providerId || getActiveProvider()];
}
