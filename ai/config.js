/**
 * UltraSudo — AI Provider Configuration Registry & Priority Engine
 * Supports: Anthropic, Gemini, OpenAI, OpenRouter, NVIDIA, Kimi (Moonshot), DeepSeek, Groq, Mistral, LM Studio, Skhy Vidur
 */

const AI_PROVIDERS = {
    anthropic: {
        id: 'anthropic',
        name: 'Anthropic Claude',
        model: 'claude-3-5-sonnet-20241022',
        endpoint: 'https://api.anthropic.com/v1/messages',
        modelsEndpoint: 'https://api.anthropic.com/v1/models',
        type: 'anthropic',
        keyPrefix: 'sk-ant-',
        description: 'Anthropic Claude 3.5 Sonnet & Haiku models for advanced reasoning',
        icon: 'fas fa-brain'
    },
    gemini: {
        id: 'gemini',
        name: 'Google Gemini',
        model: 'gemini-2.0-flash',
        endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/',
        modelsEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
        type: 'gemini',
        keyPrefix: 'AIza',
        description: 'Google Gemini — ultra-fast, multimodal intelligence with free tier',
        icon: 'fas fa-sparkles'
    },
    openai: {
        id: 'openai',
        name: 'OpenAI',
        model: 'gpt-4o-mini',
        endpoint: 'https://api.openai.com/v1/chat/completions',
        modelsEndpoint: 'https://api.openai.com/v1/models',
        type: 'openai',
        keyPrefix: 'sk-',
        description: 'OpenAI GPT-4o, GPT-4o-mini & o3-mini models',
        icon: 'fas fa-bolt'
    },
    openrouter: {
        id: 'openrouter',
        name: 'OpenRouter',
        model: 'google/gemini-2.0-flash-exp:free',
        endpoint: 'https://openrouter.ai/api/v1/chat/completions',
        modelsEndpoint: 'https://openrouter.ai/api/v1/models',
        type: 'openai',
        keyPrefix: 'sk-or-',
        description: 'OpenRouter — access hundreds of open & commercial models in one API',
        icon: 'fas fa-network-wired'
    },
    nvidia: {
        id: 'nvidia',
        name: 'NVIDIA NIM',
        model: 'meta/llama-3.1-70b-instruct',
        endpoint: 'https://integrate.api.nvidia.com/v1/chat/completions',
        modelsEndpoint: 'https://integrate.api.nvidia.com/v1/models',
        type: 'openai',
        keyPrefix: 'nvapi-',
        description: 'NVIDIA Cloud Functions & optimized AI microservices',
        icon: 'fas fa-microchip'
    },
    kimi: {
        id: 'kimi',
        name: 'Kimi (Moonshot AI)',
        model: 'moonshot-v1-8k',
        endpoint: 'https://api.moonshot.cn/v1/chat/completions',
        modelsEndpoint: 'https://api.moonshot.cn/v1/models',
        type: 'openai',
        keyPrefix: 'sk-',
        description: 'Moonshot Kimi — high performance long-context model',
        icon: 'fas fa-moon'
    },
    deepseek: {
        id: 'deepseek',
        name: 'DeepSeek AI',
        model: 'deepseek-chat',
        endpoint: 'https://api.deepseek.com/v1/chat/completions',
        modelsEndpoint: 'https://api.deepseek.com/v1/models',
        type: 'openai',
        keyPrefix: 'sk-',
        description: 'DeepSeek V3 & R1 reasoning models with low cost',
        icon: 'fas fa-compass'
    },
    groq: {
        id: 'groq',
        name: 'Groq Cloud',
        model: 'llama-3.3-70b-versatile',
        endpoint: 'https://api.groq.com/openai/v1/chat/completions',
        modelsEndpoint: 'https://api.groq.com/openai/v1/models',
        type: 'openai',
        keyPrefix: 'gsk_',
        description: 'Groq LPU Inference Engine — ultra-fast latency',
        icon: 'fas fa-tachometer-alt'
    },
    mistral: {
        id: 'mistral',
        name: 'Mistral AI',
        model: 'mistral-small-latest',
        endpoint: 'https://api.mistral.ai/v1/chat/completions',
        modelsEndpoint: 'https://api.mistral.ai/v1/models',
        type: 'openai',
        keyPrefix: '',
        description: 'Mistral Large, Codestral & European open models',
        icon: 'fas fa-wind'
    },
    lmstudio: {
        id: 'lmstudio',
        name: 'LM Studio (Local)',
        model: '',
        endpoint: 'http://localhost:1234/v1/chat/completions',
        modelsEndpoint: 'http://localhost:1234/v1/models',
        type: 'openai',
        keyPrefix: '',
        description: 'Local offline LLM server running on local hardware',
        icon: 'fas fa-server'
    },
    vidur: {
        id: 'vidur',
        name: 'Skhy Vidur',
        model: 'vidur-1',
        endpoint: 'http://localhost:8080/v1/chat/completions',
        modelsEndpoint: 'http://localhost:8080/v1/models',
        type: 'openai',
        keyPrefix: '',
        description: 'Skhy Vidur — self-hosted private workspace backend',
        icon: 'fas fa-shield-halved'
    }
};

const DEFAULT_PROVIDER = 'gemini';

/**
 * Get configured active AI provider
 */
function getActiveProvider() {
    return localStorage.getItem('ultrasudo_ai_provider') || DEFAULT_PROVIDER;
}

function setActiveProvider(providerId) {
    if (AI_PROVIDERS[providerId]) {
        localStorage.setItem('ultrasudo_ai_provider', providerId);
    }
}

/**
 * Get API Key configuration for provider
 */
function getApiKey(providerId) {
    const p = providerId || getActiveProvider();
    if (window.dataManager && window.dataManager.getApiKey) {
        const cfg = window.dataManager.getApiKey(p);
        if (cfg && cfg.apiKey) return cfg.apiKey;
    }
    return localStorage.getItem(`ultrasudo_apikey_${p}`) || localStorage.getItem(`ultrasudo_${p}_key`) || '';
}

function setApiKey(key, providerId) {
    const p = providerId || getActiveProvider();
    localStorage.setItem(`ultrasudo_apikey_${p}`, key);
    if (window.dataManager && window.dataManager.setApiKey) {
        window.dataManager.setApiKey(p, { apiKey: key }, 'ai-config');
    }
}

function getProviderConfig(providerId) {
    const p = providerId || getActiveProvider();
    const baseConfig = AI_PROVIDERS[p] || AI_PROVIDERS[DEFAULT_PROVIDER];
    
    // Merge with user overrides from DataManager
    let userCfg = {};
    if (window.dataManager && window.dataManager.getApiKey) {
        userCfg = window.dataManager.getApiKey(p) || {};
    }
    
    return {
        ...baseConfig,
        model: userCfg.model || baseConfig.model,
        endpoint: userCfg.baseUrl ? (baseConfig.type === 'gemini' ? userCfg.baseUrl : `${userCfg.baseUrl.replace(/\/+$/, '')}/chat/completions`) : baseConfig.endpoint,
        apiKey: userCfg.apiKey || getApiKey(p),
        enabled: userCfg.enabled !== false,
        priority: userCfg.priority || 99
    };
}

/**
 * Returns list of all enabled providers sorted by priority rank (1, 2, 3...)
 */
function getEnabledProvidersOrderedByPriority() {
    const allKeys = (window.dataManager && window.dataManager.getAllApiKeys && window.dataManager.getAllApiKeys()) || {};
    
    const providersList = Object.keys(AI_PROVIDERS).map(id => {
        const stored = allKeys[id] || {};
        const isEnabled = stored.enabled !== false;
        const priority = typeof stored.priority === 'number' ? stored.priority : (stored.priority ? parseInt(stored.priority, 10) : 50);
        const hasKey = id === 'lmstudio' || id === 'vidur' ? true : !!(stored.apiKey || getApiKey(id));
        return {
            id,
            config: AI_PROVIDERS[id],
            stored,
            priority,
            isEnabled,
            hasKey
        };
    });

    // Filter enabled & configured, sort by priority asc
    return providersList
        .filter(p => p.isEnabled && p.hasKey)
        .sort((a, b) => a.priority - b.priority);
}

// Expose globally for both browser scripts and React components
if (typeof window !== 'undefined') {
    window.AI_PROVIDERS = AI_PROVIDERS;
    window.getActiveProvider = getActiveProvider;
    window.setActiveProvider = setActiveProvider;
    window.getApiKey = getApiKey;
    window.setApiKey = setApiKey;
    window.getProviderConfig = getProviderConfig;
    window.getEnabledProvidersOrderedByPriority = getEnabledProvidersOrderedByPriority;
}
