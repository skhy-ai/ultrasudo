import React, { useState, useEffect, useRef } from 'react';
import { agentEngine } from '../../../utils/ai/agentEngine';
import { agentEventBus } from '../../../utils/ai/agentEventBus';
import './CopilotDrawer.css';

/**
 * Lightweight safe markdown formatter for assistant responses
 */
function renderMarkdown(text) {
  if (!text) return '';

  let html = text
    // Escape standard HTML tags for safety
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Fenced code blocks (```code```)
  html = html.replace(/```([\s\S]*?)```/g, (match, p1) => {
    return `<pre class="copilot-code-block"><code>${p1.trim()}</code></pre>`;
  });

  // Inline code (`code`)
  html = html.replace(/`([^`]+)`/g, '<code class="copilot-inline-code">$1</code>');

  // Bold (**bold**)
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Italic (*italic*)
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Unordered list items (- or * at start of line)
  html = html.replace(/^\s*[-*]\s+(.*)$/gm, '<li class="copilot-list-item">$1</li>');
  html = html.replace(/(<li class="copilot-list-item">.*<\/li>)/s, '<ul class="copilot-list">$1</ul>');

  // Line breaks
  html = html.replace(/\n\n/g, '<p></p>').replace(/\n/g, '<br/>');

  return html;
}

export default function CopilotDrawer({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: "👋 Hi! I'm your UltraSudo Copilot running on **openrouter/auto**. I can see your active application context and help you organize, calculate, draft, or take actions in real-time.",
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeContext, setActiveContext] = useState(null);
  const [apiKey, setApiKey] = useState(() => agentEngine.getApiKey());
  const [showKeySetup, setShowKeySetup] = useState(() => !agentEngine.getApiKey());
  const [keyInput, setKeyInput] = useState('');
  const [keyTesting, setKeyTesting] = useState(false);
  const [keyStatus, setKeyStatus] = useState(null);
  const [showKeyPassword, setShowKeyPassword] = useState(false);
  const [proposedActions, setProposedActions] = useState({});

  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Sync active app context from event bus
  useEffect(() => {
    const unsubscribe = agentEventBus.subscribe((ctx) => {
      setActiveContext(ctx);
    });
    return unsubscribe;
  }, []);

  // Keyboard shortcut: Ctrl+K / Cmd+K to toggle, Esc to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Parent triggers open
          window.dispatchEvent(new CustomEvent('ultrasudo:open-copilot'));
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isStreaming, proposedActions]);

  // Focus input when drawer opens
  useEffect(() => {
    if (isOpen && !showKeySetup && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, showKeySetup]);

  // Test and save OpenRouter key
  const handleSaveKey = async () => {
    const candidate = keyInput.trim();
    if (!candidate) {
      setKeyStatus({ success: false, message: 'Please enter a valid OpenRouter API key.' });
      return;
    }

    setKeyTesting(true);
    setKeyStatus(null);

    const check = await agentEngine.validateKey(candidate);
    setKeyTesting(false);

    if (check.valid) {
      agentEngine.setApiKey(candidate);
      setApiKey(candidate);
      setKeyStatus({ success: true, message: '✅ Key validated and active with openrouter/auto!' });
      setTimeout(() => {
        setShowKeySetup(false);
        setKeyStatus(null);
      }, 1000);
    } else {
      setKeyStatus({ success: false, message: `❌ Verification failed: ${check.error}` });
    }
  };

  // Submit chat message
  const handleSendMessage = async (textToSend = null) => {
    const promptText = (textToSend || inputValue).trim();
    if (!promptText || isStreaming) return;

    if (!apiKey) {
      setShowKeySetup(true);
      return;
    }

    const userMsgId = `user-${Date.now()}`;
    const assistantMsgId = `asst-${Date.now()}`;

    const newHistory = [
      ...messages,
      { id: userMsgId, role: 'user', text: promptText },
    ];

    setMessages(newHistory);
    setInputValue('');
    setIsStreaming(true);

    // Placeholder assistant message
    setMessages((prev) => [
      ...prev,
      { id: assistantMsgId, role: 'assistant', text: '', streaming: true },
    ]);

    abortControllerRef.current = new AbortController();

    try {
      await agentEngine.streamChat({
        messages: newHistory,
        appContext: activeContext,
        signal: abortControllerRef.current.signal,
        onChunk: (accumulated) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? { ...m, text: accumulated, streaming: true }
                : m
            )
          );
        },
        onActionProposal: (actionProposal) => {
          setProposedActions((prev) => ({
            ...prev,
            [assistantMsgId]: {
              ...actionProposal,
              status: 'pending', // pending | executed | dismissed
            },
          }));
        },
      });

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId ? { ...m, streaming: false } : m
        )
      );
    } catch (err) {
      if (err.name === 'AbortError') {
        // User stopped generation
      } else if (err.message === 'MISSING_API_KEY') {
        setShowKeySetup(true);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: 'assistant',
            text: `⚠️ **Request failed**: ${err.message}. Please check your OpenRouter API key.`,
          },
        ]);
      }
    } finally {
      setIsStreaming(false);
    }
  };

  // Execute proposed action
  const handleApplyAction = async (msgId) => {
    const proposal = proposedActions[msgId];
    if (!proposal) return;

    setProposedActions((prev) => ({
      ...prev,
      [msgId]: { ...proposal, status: 'executing' },
    }));

    const result = await agentEventBus.executeAction(proposal.name, proposal.params);

    if (result.success !== false) {
      setProposedActions((prev) => ({
        ...prev,
        [msgId]: { ...proposal, status: 'executed', result: result.result },
      }));
    } else {
      setProposedActions((prev) => ({
        ...prev,
        [msgId]: { ...proposal, status: 'failed', error: result.error },
      }));
    }
  };

  const handleDismissAction = (msgId) => {
    setProposedActions((prev) => ({
      ...prev,
      [msgId]: { ...prev[msgId], status: 'dismissed' },
    }));
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsStreaming(false);
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        text: `Conversation cleared. Ready to assist with **${activeContext?.appName || 'UltraSudo'}**.`,
      },
    ]);
    setProposedActions({});
  };

  if (!isOpen) return null;

  return (
    <div className="copilot-drawer-overlay" onClick={onClose}>
      <div className="copilot-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <header className="copilot-header">
          <div className="copilot-title-group">
            <div className="copilot-brand-icon">
              <i className="fas fa-sparkles"></i>
            </div>
            <div>
              <div className="copilot-main-title">UltraSudo Copilot</div>
              <div className="copilot-model-badge" title="Routed via OpenRouter">
                <span className="copilot-dot-pulse"></span>
                openrouter/auto
              </div>
            </div>
          </div>

          <div className="copilot-header-actions">
            <button
              className="copilot-icon-btn"
              onClick={() => setShowKeySetup((v) => !v)}
              title="API Key Settings"
            >
              <i className="fas fa-key"></i>
            </button>
            <button
              className="copilot-icon-btn"
              onClick={clearChat}
              title="Clear Conversation"
            >
              <i className="fas fa-trash-can"></i>
            </button>
            <button className="copilot-icon-btn close-btn" onClick={onClose} title="Close (Esc)">
              <i className="fas fa-xmark"></i>
            </button>
          </div>
        </header>

        {/* Active Context Banner */}
        <div className="copilot-context-banner">
          <div className="copilot-context-pill">
            <i className="fas fa-layer-group"></i>
            <span>Active: <strong>{activeContext?.appName || 'Workspace'}</strong></span>
          </div>
          <span className="copilot-hotkey-badge">Ctrl+K</span>
        </div>

        {/* Inline OpenRouter Key Onboarding Card */}
        {showKeySetup && (
          <div className="copilot-key-card">
            <div className="key-card-header">
              <div className="key-card-title">
                <i className="fas fa-shield-halved"></i> OpenRouter Configuration
              </div>
              <button
                className="key-card-close"
                onClick={() => setShowKeySetup(false)}
                title="Hide settings"
              >
                <i className="fas fa-xmark"></i>
              </button>
            </div>
            <p className="key-card-desc">
              Power all apps using <code>openrouter/auto</code>. Keys are kept private on your local device.
            </p>
            <div className="key-input-wrapper">
              <input
                type={showKeyPassword ? 'text' : 'password'}
                placeholder="sk-or-v1-..."
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                className="copilot-key-input"
              />
              <button
                type="button"
                className="key-eye-btn"
                onClick={() => setShowKeyPassword((v) => !v)}
              >
                <i className={showKeyPassword ? 'fas fa-eye-slash' : 'fas fa-eye'}></i>
              </button>
            </div>
            {keyStatus && (
              <div
                className={`key-status-msg ${keyStatus.success ? 'success' : 'error'}`}
              >
                {keyStatus.message}
              </div>
            )}
            <div className="key-card-actions">
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noreferrer"
                className="get-key-link"
              >
                Get OpenRouter Key <i className="fas fa-arrow-up-right-from-square"></i>
              </a>
              <button
                className="btn-save-key"
                onClick={handleSaveKey}
                disabled={keyTesting}
              >
                {keyTesting ? (
                  <>
                    <i className="fas fa-circle-notch fa-spin"></i> Testing...
                  </>
                ) : (
                  'Test & Activate'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Contextual Suggested Prompt Chips */}
        {activeContext?.suggestedPrompts && activeContext.suggestedPrompts.length > 0 && (
          <div className="copilot-chips-container">
            <div className="chips-label">Quick Prompts:</div>
            <div className="chips-scroll">
              {activeContext.suggestedPrompts.map((prompt, i) => (
                <button
                  key={i}
                  className="copilot-prompt-chip"
                  onClick={() => handleSendMessage(prompt)}
                  disabled={isStreaming}
                >
                  <i className="fas fa-bolt"></i> {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat Message Scroll Area */}
        <div className="copilot-messages-container">
          {messages.map((m) => (
            <div key={m.id} className={`copilot-message-row ${m.role}`}>
              <div className="copilot-message-bubble">
                <div
                  className="copilot-message-text"
                  dangerouslySetInnerHTML={{
                    __html: renderMarkdown(m.text),
                  }}
                />
                {m.streaming && <span className="copilot-streaming-cursor"></span>}

                {/* Interactive Action Card if proposed for this message */}
                {proposedActions[m.id] && (
                  <div
                    className={`copilot-action-card ${proposedActions[m.id].status}`}
                  >
                    <div className="action-card-header">
                      <div className="action-title">
                        <i className="fas fa-bolt-lightning"></i>
                        Proposed Action: <strong>{proposedActions[m.id].name}</strong>
                      </div>
                      <span className="action-status-tag">
                        {proposedActions[m.id].status}
                      </span>
                    </div>

                    <div className="action-params-preview">
                      <pre>
                        {JSON.stringify(proposedActions[m.id].params, null, 2)}
                      </pre>
                    </div>

                    {proposedActions[m.id].status === 'pending' && (
                      <div className="action-card-buttons">
                        <button
                          className="btn-apply-action"
                          onClick={() => handleApplyAction(m.id)}
                        >
                          <i className="fas fa-check"></i> Apply Action
                        </button>
                        <button
                          className="btn-dismiss-action"
                          onClick={() => handleDismissAction(m.id)}
                        >
                          <i className="fas fa-xmark"></i> Dismiss
                        </button>
                      </div>
                    )}

                    {proposedActions[m.id].status === 'executed' && (
                      <div className="action-result-success">
                        <i className="fas fa-circle-check"></i> Successfully applied to {activeContext?.appName}!
                      </div>
                    )}

                    {proposedActions[m.id].status === 'failed' && (
                      <div className="action-result-error">
                        <i className="fas fa-circle-exclamation"></i> Action failed: {proposedActions[m.id].error}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <div className="copilot-input-area">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="copilot-input-form"
          >
            <textarea
              ref={inputRef}
              rows={1}
              className="copilot-textarea"
              placeholder={`Ask anything about ${activeContext?.appName || 'your workspace'}...`}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />

            {isStreaming ? (
              <button
                type="button"
                className="copilot-stop-btn"
                onClick={handleStopStreaming}
                title="Stop Generating"
              >
                <i className="fas fa-stop"></i>
              </button>
            ) : (
              <button
                type="submit"
                className="copilot-send-btn"
                disabled={!inputValue.trim()}
                title="Send Message"
              >
                <i className="fas fa-paper-plane"></i>
              </button>
            )}
          </form>
          <div className="copilot-footer-hint">
            <span>Press <strong>Enter</strong> to send, <strong>Shift+Enter</strong> for newline</span>
          </div>
        </div>
      </div>
    </div>
  );
}
