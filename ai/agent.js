/**
 * UltraSudo — AI Agent Engine
 * Multi-Provider AI Agent with Function Calling, Anthropic/OpenAI/Gemini Adapters, and Priority Failover
 */

const ULTRASUDO_SYSTEM_PROMPT = `You are UltraSudo AI, an intelligent assistant built into the UltraSudo workspace.

Your capabilities:
- Open and control built-in apps (Calculator, Calendar, News, Secure Vault, Life Board, Investment Board, Healthy Kitchen, Currency Converter, Kanban Board)
- Answer questions about the workspace, security, and productivity
- Help users manage their digital life through conversation
- Provide security advice and status reports

Personality:
- Concise, helpful, and professional
- Proactive in suggesting relevant tools
- Security-conscious and privacy-aware
- Use emoji sparingly for clarity

When a user asks to open an app, use the open_app function. When they ask about security, use check_security. When they want to convert currency, use convert_currency. For calculations, use calculate.

Always respond naturally and briefly. Don't over-explain.`;

// Function declarations for function calling
const FUNCTION_DECLARATIONS = [
    {
        name: 'open_app',
        description: 'Open a built-in UltraSudo application in the workspace',
        parameters: {
            type: 'OBJECT',
            properties: {
                app_name: {
                    type: 'STRING',
                    description: 'Name of the app to open. One of: notebook, markdown-editor, invoice-generator, quote-generator, spreadsheet-app, kanban, todo-list, calendar, timer, pomodoro-timer, python-ide, code-generator, mermaid-editor, patent-researcher, openfang, investment-board, stock-screener, stock-ticker, portfolio-manager, send-money, currency-converter, financial-service, home-diagnostics, yoga, healthy-kitchen, grocery, life-board, weather, birthday-card, photo-editor, calculator, music, galactic-simulator, social-feed, p2p-calling, news, vault, pqc-education, api-key-manager, vpn, community'
                }
            },
            required: ['app_name']
        }
    },
    {
        name: 'check_security',
        description: 'Check the current security status of the workspace, including privacy score, blocked trackers, and breach alerts',
        parameters: {
            type: 'OBJECT',
            properties: {},
            required: []
        }
    },
    {
        name: 'convert_currency',
        description: 'Convert an amount from one currency to another',
        parameters: {
            type: 'OBJECT',
            properties: {
                amount: { type: 'NUMBER', description: 'Amount to convert' },
                from_currency: { type: 'STRING', description: 'Source currency code (e.g., USD)' },
                to_currency: { type: 'STRING', description: 'Target currency code (e.g., EUR)' }
            },
            required: ['amount', 'from_currency', 'to_currency']
        }
    },
    {
        name: 'calculate',
        description: 'Perform a mathematical calculation',
        parameters: {
            type: 'OBJECT',
            properties: {
                expression: { type: 'STRING', description: 'Mathematical expression to evaluate (e.g., "2 + 2", "sqrt(144)", "15% of 200")' }
            },
            required: ['expression']
        }
    },
    {
        name: 'create_note',
        description: 'Create a new note or reminder for the user',
        parameters: {
            type: 'OBJECT',
            properties: {
                title: { type: 'STRING', description: 'Title of the note' },
                content: { type: 'STRING', description: 'Content of the note' }
            },
            required: ['title']
        }
    },
    {
        name: 'edit_notebook',
        description: 'Generate or improve content in the Notebook app using AI.',
        parameters: {
            type: 'OBJECT',
            properties: {
                action: {
                    type: 'STRING',
                    description: 'The AI action to perform: write, improve, summarize, grammar'
                },
                prompt: {
                    type: 'STRING',
                    description: 'The user request or text'
                }
            },
            required: ['action', 'prompt']
        }
    }
];

class UltraSudoAgent {
    constructor() {
        this.conversationHistory = [];
        this.onFunctionCall = null;
    }

    /**
     * Send a chat message with priority failover support across enabled providers
     */
    async chat(userMessage, preferredProviderId = null) {
        let providersToTry = [];

        if (preferredProviderId && window.getProviderConfig) {
            const prefConfig = window.getProviderConfig(preferredProviderId);
            if (prefConfig && prefConfig.apiKey) {
                providersToTry.push(prefConfig);
            }
        }

        // Get prioritized list of active providers
        const activeOrdered = window.getEnabledProvidersOrderedByPriority ? window.getEnabledProvidersOrderedByPriority() : [];
        for (const item of activeOrdered) {
            const pConfig = window.getProviderConfig(item.id);
            if (!providersToTry.some(p => p.id === pConfig.id)) {
                providersToTry.push(pConfig);
            }
        }

        // Fallback to active provider if list is empty
        if (providersToTry.length === 0 && window.getProviderConfig) {
            providersToTry.push(window.getProviderConfig());
        }

        if (providersToTry.length === 0 || (!providersToTry[0].apiKey && providersToTry[0].id !== 'lmstudio' && providersToTry[0].id !== 'vidur')) {
            return {
                text: "🔑 No valid AI provider API key found! Please open **API Key Manager** from the launcher or header to configure Anthropic, Gemini, OpenAI, NVIDIA, Kimi, or OpenRouter keys.",
                functionCalls: []
            };
        }

        // Add user message to history
        this.conversationHistory.push({
            role: 'user',
            parts: [{ text: userMessage }]
        });

        let lastError = null;

        // Try providers in priority order
        for (const config of providersToTry) {
            try {
                let response;
                if (config.type === 'anthropic') {
                    response = await this._callAnthropic(config);
                } else if (config.type === 'gemini') {
                    response = await this._callGemini(config);
                } else {
                    response = await this._callOpenAI(config);
                }

                // Attach provider metadata to response
                response.providerUsed = config.name;
                response.modelUsed = config.model;
                return response;

            } catch (error) {
                console.warn(`[UltraSudo Agent] Provider '${config.name}' failed (${error.message}). Attempting failover...`);
                lastError = error;
                // Mark quota status if rate-limited
                if (error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('exceeded')) {
                    if (window.aiProviderEngine && window.aiProviderEngine.reportQuotaExhausted) {
                        window.aiProviderEngine.reportQuotaExhausted(config.id);
                    }
                }
            }
        }

        // Remove failed message from history if all failed
        this.conversationHistory.pop();

        return {
            text: `⚠️ All AI providers failed. Last error (${providersToTry[0]?.name || 'API'}): ${lastError?.message || 'Connection failed'}. Please check your API keys in the API Key Manager.`,
            functionCalls: []
        };
    }

    /**
     * Call Anthropic Messages API (/v1/messages)
     */
    async _callAnthropic(config) {
        const messages = this.conversationHistory.map(msg => ({
            role: msg.role === 'model' || msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.parts ? msg.parts.map(p => p.text || '').join('') : (typeof msg.content === 'string' ? msg.content : '')
        }));

        const response = await fetch(config.endpoint || 'https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': config.apiKey,
                'anthropic-version': '2023-06-01',
                'dangerously-allow-browser': 'true'
            },
            body: JSON.stringify({
                model: config.model || 'claude-3-5-sonnet-20241022',
                max_tokens: 1024,
                system: ULTRASUDO_SYSTEM_PROMPT,
                messages: messages
            })
        });

        if (!response.ok) {
            const errBody = await response.json().catch(() => ({}));
            throw new Error(errBody.error?.message || `Anthropic HTTP ${response.status}`);
        }

        const data = await response.json();
        const text = data.content?.[0]?.text || '';

        this.conversationHistory.push({
            role: 'assistant',
            parts: [{ text }]
        });

        return { text, functionCalls: [] };
    }

    /**
     * Call Google Gemini API (/v1beta/models/...:generateContent)
     */
    async _callGemini(config) {
        const url = `${config.endpoint}${config.model}:generateContent?key=${config.apiKey}`;

        const requestBody = {
            contents: this.conversationHistory,
            systemInstruction: {
                parts: [{ text: ULTRASUDO_SYSTEM_PROMPT }]
            },
            tools: [{
                functionDeclarations: FUNCTION_DECLARATIONS
            }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1024,
                topP: 0.95
            }
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `Gemini HTTP ${response.status}`);
        }

        const data = await response.json();
        const candidate = data.candidates?.[0];

        if (!candidate?.content?.parts) {
            throw new Error('No response content from Gemini');
        }

        const parts = candidate.content.parts;
        let text = '';
        let functionCalls = [];

        for (const part of parts) {
            if (part.text) text += part.text;
            if (part.functionCall) {
                functionCalls.push({
                    name: part.functionCall.name,
                    args: part.functionCall.args || {}
                });
            }
        }

        this.conversationHistory.push({
            role: 'model',
            parts: parts
        });

        if (functionCalls.length > 0 && this.onFunctionCall) {
            for (const fc of functionCalls) {
                let secureClawStatus = null;
                if (window.SecureClaw) {
                    secureClawStatus = await window.SecureClaw.intercept(fc.name, fc.args);
                }
                const result = await this.onFunctionCall(fc.name, fc.args);
                this.conversationHistory.push({
                    role: 'function',
                    parts: [{
                        functionResponse: {
                            name: fc.name,
                            response: { result: result, secureClaw: secureClawStatus }
                        }
                    }]
                });
            }

            const followUp = await this._callGemini(config);
            return {
                text: followUp.text || text,
                functionCalls: functionCalls
            };
        }

        return { text, functionCalls };
    }

    /**
     * Call OpenAI-compatible API (OpenAI, OpenRouter, NVIDIA, Kimi, DeepSeek, Groq, Mistral, LM Studio)
     */
    async _callOpenAI(config) {
        const messages = [
            { role: 'system', content: ULTRASUDO_SYSTEM_PROMPT },
            ...this.conversationHistory.map(msg => ({
                role: msg.role === 'model' || msg.role === 'assistant' ? 'assistant' : 'user',
                content: msg.parts ? msg.parts.map(p => p.text || '').join('') : (typeof msg.content === 'string' ? msg.content : '')
            }))
        ];

        const tools = FUNCTION_DECLARATIONS.map(fd => ({
            type: 'function',
            function: {
                name: fd.name,
                description: fd.description,
                parameters: {
                    type: 'object',
                    properties: Object.fromEntries(
                        Object.entries(fd.parameters.properties).map(([k, v]) => [k, { type: v.type.toLowerCase(), description: v.description }])
                    ),
                    required: fd.parameters.required
                }
            }
        }));

        const headers = {
            'Content-Type': 'application/json'
        };

        if (config.apiKey) {
            headers['Authorization'] = `Bearer ${config.apiKey}`;
        }
        if (config.id === 'openrouter') {
            headers['HTTP-Referer'] = window.location.origin;
            headers['X-Title'] = 'UltraSudo';
        }

        const endpoint = config.endpoint.includes('/chat/completions') ? config.endpoint : `${config.endpoint.replace(/\/+$/, '')}/chat/completions`;

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                model: config.model,
                messages,
                tools: tools.length > 0 ? tools : undefined,
                temperature: 0.7,
                max_tokens: 1024
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `API HTTP ${response.status}`);
        }

        const data = await response.json();
        const choice = data.choices?.[0];
        const text = choice?.message?.content || '';
        const functionCalls = (choice?.message?.tool_calls || []).map(tc => ({
            name: tc.function.name,
            args: JSON.parse(tc.function.arguments || '{}')
        }));

        this.conversationHistory.push({
            role: 'model',
            parts: [{ text }]
        });

        if (functionCalls.length > 0 && this.onFunctionCall) {
            for (const fc of functionCalls) {
                await this.onFunctionCall(fc.name, fc.args);
            }
        }

        return { text, functionCalls };
    }

    clearHistory() {
        this.conversationHistory = [];
    }
}

const ultrasudoAgent = new UltraSudoAgent();

if (typeof window !== 'undefined') {
    window.ultrasudoAgent = ultrasudoAgent;
}
