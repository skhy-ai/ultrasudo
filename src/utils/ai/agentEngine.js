/**
 * UltraSudo — OpenRouter AI Agent Engine
 * Defaults to 'openrouter/auto' with real-time SSE streaming, hybrid tool calling
 * (native OpenAI tools + JSON-fallback parser), and seamless key management.
 */

const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'openrouter/auto';

class OpenRouterAgentEngine {
  constructor() {
    this.model = DEFAULT_MODEL;
  }

  /**
   * Retrieves the stored OpenRouter API key from DataManager or localStorage
   */
  getApiKey() {
    if (typeof window === 'undefined') return '';
    if (window.dataManager && window.dataManager.getApiKey) {
      const stored = window.dataManager.getApiKey('openrouter');
      if (stored && stored.apiKey) return stored.apiKey;
    }
    return (
      localStorage.getItem('ultrasudo_apikey_openrouter') ||
      localStorage.getItem('openrouter_api_key') ||
      ''
    );
  }

  /**
   * Saves the OpenRouter API key across DataManager and localStorage
   */
  setApiKey(key) {
    const cleanKey = (key || '').trim();
    if (typeof window === 'undefined') return;

    localStorage.setItem('ultrasudo_apikey_openrouter', cleanKey);
    localStorage.setItem('openrouter_api_key', cleanKey);

    if (window.dataManager && window.dataManager.setApiKey) {
      window.dataManager.setApiKey(
        'openrouter',
        { apiKey: cleanKey, model: this.model, enabled: true },
        'copilot'
      );
    }
    if (window.setApiKey) {
      window.setApiKey(cleanKey, 'openrouter');
    }
  }

  /**
   * Tests the validity of an OpenRouter API key
   */
  async validateKey(testKey) {
    const key = (testKey || this.getApiKey()).trim();
    if (!key) return { valid: false, error: 'No API key provided.' };

    try {
      const response = await fetch(OPENROUTER_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
          'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://ultrasudo.io',
          'X-Title': 'UltraSudo AI Copilot',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: 'user', content: 'Ping' }],
          max_tokens: 5,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const msg = errorData.error?.message || `HTTP ${response.status}: Failed to authenticate`;
        return { valid: false, error: msg };
      }

      return { valid: true };
    } catch (err) {
      return { valid: false, error: err.message || 'Network connection failed' };
    }
  }

  /**
   * Builds the System Prompt incorporating the workspace persona and active app context
   */
  buildSystemPrompt(appContext) {
    let prompt = `You are UltraSudo Copilot, a high-intelligence workspace AI running on openrouter/auto.
You help users seamlessly across their operating apps with clear, concise, actionable assistance.

Formatting & Readability:
- Be concise, friendly, and well-structured.
- Use markdown (bullet points, bold highlights, code blocks) to make information readable.
- If proposing an application modification, explain what you will do briefly.`;

    if (appContext) {
      const appId = appContext.appId || '';

      // Specialized Persona Extensions based on active Hub
      if (appId === 'esg-hub') {
        prompt += `\n\n[ESG & SUSTAINABILITY COPILOT MODE]
You are an expert ESG Carbon Accountant & Energy Transition Advisor.
- GHG Scope 1: Direct emissions from fuel combustion (fleet diesel/gasoline, natural gas boilers).
- GHG Scope 2: Indirect emissions from purchased electricity. Reference location-based vs market-based emission factors (EPA eGRID / DEFRA in kg CO2e/kWh).
- GHG Scope 3: Supply chain & upstream logistics emissions. Recommend vendor engagement and low-carbon freight.
- Green CapEx: Model solar PV generation, heat pump electrification, and payback years.
- When the user asks to add an entry or run a simulation, utilize the available actions (add_scope1_entry, add_scope2_entry, simulate_solar_roi).`;
      } else if (appId === 'business-ops-hub') {
        prompt += `\n\n[FRACTIONAL CFO & BUSINESS OPS COPILOT MODE]
You are an expert SME Fractional CFO and Operations Strategist.
- 13-Week Direct Cash Runway: Focus on cash preservation, timing of AR collections vs AP vendor payouts and payroll cycles.
- DSO & Smart Invoicing: Calculate Days Sales Outstanding (DSO = (AR / Annual Sales) * 365). Draft professional, firm, yet polite payment reminder emails for overdue clients.
- Breakeven & Unit Contribution Margin: Contribution Margin = Price - Variable Cost; Breakeven Units = Fixed Costs / CM.
- EOQ & Landed Logistics: Balance order placement costs against carrying holding costs using Wilson EOQ: sqrt((2 * D * S) / H). Factor in import tariffs and freight.
- You can execute actions like add_cashflow_entry and calculate_eoq directly.`;
      } else if (appId === 'legal-compliance-hub') {
        prompt += `\n\n[GENERAL COUNSEL & HR COMPLIANCE COPILOT MODE]
You are a senior Corporate Counsel and HR Compliance Director.
- Contract Redlining: Flag dangerous SME exposures: uncapped indemnification, unilateral background IP transfers, short termination notice (3-day vs 30-day), and overbroad global non-competes. Offer standard, protective counter-clauses.
- Fully Burdened Labor Rate: Compute true loaded cost = Base Salary + Payroll Taxes (FICA/Medicare) + Health Benefits + 401(k) Match + PTO Days + Seat Overhead. Recommend billable hourly rate based on target gross margin (e.g., 35%).
- HR Policies: Draft and review compliant standard operating procedures (Remote work, BYOD encryption, Generative AI IP protection, PTO SOPs).
- Cybersecurity & GDPR Audit: Audit technical controls (MFA, BitLocker disk encryption, DPAs, 72-hr breach plans).
- You can execute actions like redline_contract_clause, calculate_burdened_rate, and generate_hr_policy.`;
      } else if (appId === 'finance-hub') {
        prompt += `\n\n[FINANCIAL ANALYST & WEALTH COPILOT MODE]
You are an expert Financial Analyst. Assist with market indicators, asset allocations, FX conversions, and secure transfers.`;
      } else if (appId === 'productivity-hub') {
        prompt += `\n\n[PRODUCTIVITY & WORKFLOW COPILOT MODE]
You are an Executive Workflow Coach. Assist with Kanban backlog grooming, Pomodoro focus cycles, and spreadsheet modeling.`;
      }

      prompt += `\n\n[ACTIVE APPLICATION CONTEXT]
App Name: ${appContext.appName || appContext.appId || 'Workspace'}
App ID: ${appContext.appId || 'unknown'}`;

      if (appContext.contextData) {
        prompt += `\nCurrent State Snapshot:\n${JSON.stringify(appContext.contextData, null, 2)}`;
      }

      if (appContext.actions && appContext.actions.length > 0) {
        prompt += `\n\nAvailable Application Actions:
${JSON.stringify(
  appContext.actions.map((a) => ({
    name: a.name,
    description: a.description,
    parameters: a.parameters,
  })),
  null,
  2
)}

Action Triggering Instructions:
You can either trigger actions using OpenAI tool_calls OR if the routed model outputs text, format an action proposal using a JSON code block like this:
\`\`\`json
{
  "action": "<action_name>",
  "params": { ... }
}
\`\`\`
Always ensure params match the required action parameters.`;
      }
    }

    return prompt;
  }

  /**
   * Formats tools array for OpenAI / OpenRouter tool call specification
   */
  formatTools(actions) {
    if (!actions || actions.length === 0) return undefined;
    return actions.map((act) => ({
      type: 'function',
      function: {
        name: act.name,
        description: act.description,
        parameters: {
          type: 'object',
          properties: act.parameters || {},
        },
      },
    }));
  }

  /**
   * Streams chat completions from OpenRouter (openrouter/auto) with SSE
   */
  async streamChat({
    messages,
    appContext,
    onChunk,
    onActionProposal,
    signal,
  }) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('MISSING_API_KEY');
    }

    const systemPrompt = this.buildSystemPrompt(appContext);
    const tools = this.formatTools(appContext?.actions);

    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content || m.text || '',
      })),
    ];

    const bodyPayload = {
      model: this.model,
      messages: apiMessages,
      stream: true,
      temperature: 0.7,
      max_tokens: 2048,
    };

    if (tools && tools.length > 0) {
      bodyPayload.tools = tools;
    }

    const response = await fetch(OPENROUTER_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://ultrasudo.io',
        'X-Title': 'UltraSudo AI Copilot',
      },
      body: JSON.stringify(bodyPayload),
      signal,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `OpenRouter HTTP ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let accumulatedText = '';
    let toolCallBuffer = {};
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // keep partial line for next iteration

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;
        if (trimmed === 'data: [DONE]') continue;

        try {
          const jsonStr = trimmed.replace(/^data:\s*/, '');
          const parsed = JSON.parse(jsonStr);
          const delta = parsed.choices?.[0]?.delta;

          if (delta?.content) {
            accumulatedText += delta.content;
            if (onChunk) onChunk(accumulatedText);
          }

          // Buffer native tool calls if emitted
          if (delta?.tool_calls) {
            for (const tc of delta.tool_calls) {
              const idx = tc.index || 0;
              if (!toolCallBuffer[idx]) {
                toolCallBuffer[idx] = {
                  name: tc.function?.name || '',
                  arguments: tc.function?.arguments || '',
                };
              } else {
                if (tc.function?.name) toolCallBuffer[idx].name += tc.function.name;
                if (tc.function?.arguments) toolCallBuffer[idx].arguments += tc.function.arguments;
              }
            }
          }
        } catch (_) {
          // ignore stream parse errors on incomplete chunks
        }
      }
    }

    // Check for native tool calls
    const executedActions = [];
    const toolCallKeys = Object.keys(toolCallBuffer);
    if (toolCallKeys.length > 0) {
      for (const k of toolCallKeys) {
        const tc = toolCallBuffer[k];
        try {
          const parsedArgs = JSON.parse(tc.arguments || '{}');
          executedActions.push({ name: tc.name, params: parsedArgs });
          if (onActionProposal) {
            onActionProposal({ name: tc.name, params: parsedArgs });
          }
        } catch (e) {
          console.warn('Failed to parse tool call arguments:', tc);
        }
      }
    }

    // Fallback: Check for JSON code block action proposal in text
    if (executedActions.length === 0 && onActionProposal) {
      const jsonActionRegex = /```json\s*(\{[\s\S]*?"action"[\s\S]*?\})\s*```/i;
      const match = accumulatedText.match(jsonActionRegex);
      if (match && match[1]) {
        try {
          const actionObj = JSON.parse(match[1]);
          if (actionObj.action) {
            onActionProposal({
              name: actionObj.action,
              params: actionObj.params || {},
            });
          }
        } catch (_) {}
      }
    }

    return {
      text: accumulatedText,
      actions: executedActions,
    };
  }
}

export const agentEngine = new OpenRouterAgentEngine();
