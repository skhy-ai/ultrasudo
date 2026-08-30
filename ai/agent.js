/**
 * UltraSudo — AI Agent Engine
 * Gemini-powered agent with function calling to control workspace apps
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

// Function declarations for Gemini function calling
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
        name: 'create_invoice',
        description: 'Create and open an invoice for a client with billing items',
        parameters: {
            type: 'OBJECT',
            properties: {
                client_name: { type: 'STRING', description: 'Client or customer company name' },
                amount: { type: 'NUMBER', description: 'Total invoice amount' }
            },
            required: ['client_name']
        }
    },
    {
        name: 'generate_quote',
        description: 'Generate and open a price quote for a client',
        parameters: {
            type: 'OBJECT',
            properties: {
                client_name: { type: 'STRING', description: 'Client or project name' }
            },
            required: ['client_name']
        }
    },
    {
        name: 'edit_photo',
        description: 'Open the Photo Studio to edit, crop, or apply filters to an image',
        parameters: {
            type: 'OBJECT',
            properties: {},
            required: []
        }
    },
    {
        name: 'edit_notebook',
        description: 'Generate or improve content in the Notebook app using AI. Opens the notebook AI panel to write a paragraph, improve selected text, summarize the document, or check grammar.',
        parameters: {
            type: 'OBJECT',
            properties: {
                action: {
                    type: 'STRING',
                    description: 'The AI action to perform. One of: write (generate a paragraph), improve (improve selected text), summarize (summarize the document), grammar (check and fix grammar)'
                },
                prompt: {
                    type: 'STRING',
                    description: 'The user\'s writing request, topic, or the text to improve/check'
                }
            },
            required: ['action', 'prompt']
        }
    }
];

/**
 * UltraSudo AI Agent Class
 */
class UltraSudoAgent {
    constructor() {
        this.conversationHistory = [];
        this.onFunctionCall = null; // callback: (name, args) => result
    }

    /**
     * Send a message and get a response from the AI
     */
    async chat(userMessage) {
        const apiKey = getApiKey();
        const provider = getActiveProvider();
        const config = getProviderConfig();

        if (!apiKey) {
            return {
                text: "🔑 I need an API key to work! Click the **Settings** icon (⚙️) in the top bar to add your Gemini API key. You can get one free at [aistudio.google.com](https://aistudio.google.com/apikey).",
                functionCalls: []
            };
        }

        // Add user message to history
        this.conversationHistory.push({
            role: 'user',
            parts: [{ text: userMessage }]
        });

        try {
            if (provider === 'gemini') {
                return await this._callGemini(apiKey, config);
            } else {
                return await this._callOpenAI(apiKey, config);
            }
        } catch (error) {
            console.error('[UltraSudo Agent] Error:', error);

            // Remove failed message from history
            this.conversationHistory.pop();

            if (error.message?.includes('API key')) {
                return { text: "🔑 Invalid API key. Please check your key in Settings.", functionCalls: [] };
            }
            return { text: `⚠️ Something went wrong: ${error.message || 'Unknown error'}. Please try again.`, functionCalls: [] };
        }
    }

    /**
     * Call Gemini API with function calling
     */
    async _callGemini(apiKey, config) {
        const url = `${config.endpoint}${config.model}:generateContent?key=${apiKey}`;

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
            throw new Error(errorData.error?.message || `API error: ${response.status}`);
        }

        const data = await response.json();
        const candidate = data.candidates?.[0];

        if (!candidate?.content?.parts) {
            throw new Error('No response from AI');
        }

        const parts = candidate.content.parts;
        let text = '';
        let functionCalls = [];

        for (const part of parts) {
            if (part.text) {
                text += part.text;
            }
            if (part.functionCall) {
                functionCalls.push({
                    name: part.functionCall.name,
                    args: part.functionCall.args || {}
                });
            }
        }

        // Add assistant response to history
        this.conversationHistory.push({
            role: 'model',
            parts: parts
        });

        // Execute function calls with SecureClaw interception and get results
        if (functionCalls.length > 0 && this.onFunctionCall) {
            for (const fc of functionCalls) {
                // SecureClaw Interception & PQC Security Verification
                let secureClawStatus = null;
                if (window.SecureClaw) {
                    secureClawStatus = await window.SecureClaw.intercept(fc.name, fc.args);
                }

                const result = await this.onFunctionCall(fc.name, fc.args);

                // Add function response and SecureClaw audit info to history
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

            // Get follow-up response after function execution
            const followUp = await this._callGemini(apiKey, config);
            return {
                text: followUp.text || text,
                functionCalls: functionCalls
            };
        }

        return { text, functionCalls };
    }

    /**
     * Call OpenAI-compatible API (OpenRouter, Skhy Vidur)
     */
    async _callOpenAI(apiKey, config) {
        const messages = [
            { role: 'system', content: ULTRASUDO_SYSTEM_PROMPT },
            ...this.conversationHistory.map(msg => ({
                role: msg.role === 'model' ? 'assistant' : msg.role,
                content: msg.parts.map(p => p.text || '').join('')
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

        const response = await fetch(config.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                ...(config.name === 'OpenRouter' ? { 'HTTP-Referer': window.location.origin, 'X-Title': 'UltraSudo' } : {})
            },
            body: JSON.stringify({
                model: config.model,
                messages,
                tools,
                temperature: 0.7,
                max_tokens: 1024
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `API error: ${response.status}`);
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

        // Execute function calls
        if (functionCalls.length > 0 && this.onFunctionCall) {
            for (const fc of functionCalls) {
                await this.onFunctionCall(fc.name, fc.args);
            }
        }

        return { text, functionCalls };
    }

    /**
     * Clear conversation history
     */
    clearHistory() {
        this.conversationHistory = [];
    }
}

// Global agent instance
const ultrasudoAgent = new UltraSudoAgent();
