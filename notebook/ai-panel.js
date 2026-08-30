/**
 * Notebook AI Panel
 * Integrates UltraSudo AI agent with the Notebook editor.
 * 
 * Features:
 *   - Open/close side drawer
 *   - Quick actions: write paragraph, improve selection, summarize, grammar check
 *   - Suggestions shown in a card with Accept (insert) / Reject
 *   - Diff view (del/ins) for selection improvements
 *   - Uses stored API key from localStorage (same key as ai/agent.js)
 */

(function () {
    'use strict';

    // ── Config ───────────────────────────────────────────────────────────────

    const API_KEY_STORAGE_KEYS = [
        'ultrasudo_gemini_key',
        'ultrasudo_api_key',
        'gemini_api_key',
        'ai_api_key'
    ];

    const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

    // ── State ─────────────────────────────────────────────────────────────────

    let panelOpen = false;
    let pendingAction = null;     // current action type: 'write' | 'improve' | 'summarize' | 'grammar'
    let savedSelection = null;    // saved editor selection for improve/grammar
    let isLoading = false;

    // ── DOM refs (resolved after DOMContentLoaded) ────────────────────────────

    let panel, overlay, toggleBtn, closeBtn, messagesEl,
        suggestionCard, suggestionText, acceptBtn, rejectBtn,
        inputEl, sendBtn;

    // ── Init ──────────────────────────────────────────────────────────────────

    function init() {
        panel         = document.getElementById('ai-panel');
        overlay       = document.getElementById('ai-panel-overlay');
        toggleBtn     = document.getElementById('ai-panel-toggle');
        closeBtn      = document.getElementById('ai-panel-close');
        messagesEl    = document.getElementById('ai-messages');
        suggestionCard= document.getElementById('ai-suggestion-card');
        suggestionText= document.getElementById('ai-suggestion-text');
        acceptBtn     = document.getElementById('ai-accept-btn');
        rejectBtn     = document.getElementById('ai-reject-btn');
        inputEl       = document.getElementById('ai-input');
        sendBtn       = document.getElementById('ai-send');

        if (!panel) return;

        // Remove 'hidden' (display:none) from panel — CSS handles slide-in via .open
        panel.classList.remove('hidden');

        // Wire events
        if (toggleBtn) toggleBtn.addEventListener('click', togglePanel);
        if (closeBtn)  closeBtn.addEventListener('click', closePanel);
        if (overlay)   overlay.addEventListener('click', closePanel);

        // Quick action buttons
        document.querySelectorAll('.ai-quick-btn').forEach(btn => {
            btn.addEventListener('click', () => handleQuickAction(btn.dataset.aiAction));
        });

        if (sendBtn)  sendBtn.addEventListener('click', handleSend);
        if (inputEl) {
            inputEl.addEventListener('keydown', e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                }
            });
        }

        if (acceptBtn) acceptBtn.addEventListener('click', handleAccept);
        if (rejectBtn) rejectBtn.addEventListener('click', handleReject);

        addSystemMessage('👋 I\'m your AI writing assistant. Select text and choose an action, or just ask me anything!');
    }

    // ── Panel toggle ──────────────────────────────────────────────────────────

    function openPanel() {
        panelOpen = true;
        panel.classList.add('open');
        if (overlay) overlay.classList.add('visible');
        if (toggleBtn) toggleBtn.classList.add('active');
        if (inputEl) setTimeout(() => inputEl.focus(), 300);
    }

    function closePanel() {
        panelOpen = false;
        panel.classList.remove('open');
        if (overlay) overlay.classList.remove('visible');
        if (toggleBtn) toggleBtn.classList.remove('active');
    }

    function togglePanel() {
        if (panelOpen) closePanel(); else openPanel();
    }

    // ── Quick actions ─────────────────────────────────────────────────────────

    function handleQuickAction(action) {
        if (!panelOpen) openPanel();
        pendingAction = action;
        hideSuggestion();

        const editor = document.getElementById('editor');
        const sel = window.getSelection();
        const selectedText = sel && !sel.isCollapsed ? sel.toString() : '';

        switch (action) {
            case 'write':
                setInputPlaceholder('What do you want me to write about?');
                addSystemMessage('📝 Ready to write! Describe the paragraph you want.');
                if (inputEl) inputEl.focus();
                break;

            case 'improve':
                if (!selectedText) {
                    addSystemMessage('✏️ Please select some text in the document first, then click "Improve selection".');
                    pendingAction = null;
                    return;
                }
                savedSelection = saveSelection();
                addSystemMessage(`✏️ Improving: "${selectedText.slice(0, 60)}${selectedText.length > 60 ? '...' : ''}"`);
                callAI(buildImprovePrompt(selectedText));
                break;

            case 'summarize':
                if (!editor || !editor.innerText.trim()) {
                    addSystemMessage('📋 The document is empty. Write something first!');
                    pendingAction = null;
                    return;
                }
                addSystemMessage('📋 Summarizing your document...');
                callAI(buildSummarizePrompt(editor.innerText));
                break;

            case 'grammar':
                if (!selectedText && editor) {
                    // No selection — grammar check whole doc
                    const docText = editor.innerText.trim();
                    if (!docText) {
                        addSystemMessage('🔍 The document is empty. Write something first!');
                        pendingAction = null;
                        return;
                    }
                    savedSelection = null;
                    addSystemMessage('🔍 Checking grammar of the entire document...');
                    callAI(buildGrammarPrompt(docText));
                } else {
                    savedSelection = saveSelection();
                    addSystemMessage(`🔍 Checking grammar of selection: "${selectedText.slice(0, 60)}${selectedText.length > 60 ? '...' : ''}"`);
                    callAI(buildGrammarPrompt(selectedText));
                }
                break;
        }
    }

    function handleSend() {
        if (!inputEl || isLoading) return;
        const text = inputEl.value.trim();
        if (!text) return;

        addUserMessage(text);
        inputEl.value = '';

        if (pendingAction === 'write') {
            callAI(buildWritePrompt(text));
        } else {
            // Generic free-form question
            callAI(buildFreeFormPrompt(text));
        }
    }

    // ── Prompt builders ───────────────────────────────────────────────────────

    function buildWritePrompt(topic) {
        const docContext = getDocumentContext();
        return `You are an expert writing assistant embedded in a notebook editor.

Task: Write a clear, well-structured paragraph about the following topic.

Topic: ${topic}

${docContext ? `Document context (for style/tone reference):\n${docContext}\n` : ''}

Instructions:
- Write exactly ONE complete paragraph (4–8 sentences)  
- Match the tone and style of the document context if provided
- Output ONLY the paragraph text, no preamble, no commentary
- Use HTML formatting (bold, italic, lists) where it improves clarity`;
    }

    function buildImprovePrompt(selectedText) {
        return `You are an expert editor. Improve the following text for clarity, flow, and impact.

Original text:
"""
${selectedText}
"""

Instructions:
- Return ONLY the improved version, no preamble
- Preserve the original meaning and intent
- Fix grammar, flow, word choice
- Keep roughly the same length`;
    }

    function buildSummarizePrompt(docText) {
        return `You are an expert writing assistant. Summarize the following document.

Document:
"""
${docText.slice(0, 4000)}
"""

Instructions:
- Write a concise summary (3–5 sentences)
- Capture the key points and main ideas
- Output ONLY the summary, no preamble`;
    }

    function buildGrammarPrompt(text) {
        return `You are a grammar and style expert. Check and correct the following text.

Text:
"""
${text}
"""

Instructions:
- Return ONLY the corrected text, no explanation
- Fix all grammar, spelling, punctuation errors
- Preserve the author's voice and meaning
- If the text is already correct, return it unchanged`;
    }

    function buildFreeFormPrompt(userMsg) {
        const docContext = getDocumentContext();
        return `You are UltraSudo AI, an intelligent writing assistant built into a notebook editor.

${docContext ? `Current document content:\n"""${docContext.slice(0, 2000)}"""\n` : ''}

User request: ${userMsg}

Respond helpfully and concisely. If you generate content for insertion, make it ready to copy.`;
    }

    function getDocumentContext() {
        const editor = document.getElementById('editor');
        return editor ? editor.innerText.trim().slice(0, 1500) : '';
    }

    // ── API call ──────────────────────────────────────────────────────────────

    async function callAI(prompt) {
        if (isLoading) return;

        const apiKey = getApiKey();
        if (!apiKey) {
            addAssistantMessage('🔑 No API key found. Please add your Gemini API key in the API Key Manager app, or set it as `ultrasudo_gemini_key` in localStorage.');
            return;
        }

        isLoading = true;
        if (sendBtn) sendBtn.disabled = true;
        hideSuggestion();
        showLoading();

        try {
            const url = `${GEMINI_ENDPOINT}?key=${apiKey}`;
            const body = {
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.7, maxOutputTokens: 1024 }
            };

            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error?.message || `API error ${res.status}`);
            }

            const data = await res.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

            hideLoading();
            handleAIResponse(text.trim());

        } catch (err) {
            hideLoading();
            addAssistantMessage(`⚠️ Error: ${err.message}`);
            pendingAction = null;
        } finally {
            isLoading = false;
            if (sendBtn) sendBtn.disabled = false;
        }
    }

    function getApiKey() {
        // Check multiple possible storage keys (same as ai/agent.js approach)
        for (const key of API_KEY_STORAGE_KEYS) {
            const val = localStorage.getItem(key);
            if (val && val.trim()) return val.trim();
        }
        // Also check window.aiConfig if agent.js exposed it
        if (window.getAiApiKey) return window.getAiApiKey();
        return null;
    }

    // ── Response handling ─────────────────────────────────────────────────────

    function handleAIResponse(text) {
        const action = pendingAction;
        pendingAction = null;

        if (action === 'write') {
            showSuggestion(text, false, 'Insert at cursor');
            addAssistantMessage('Here\'s a paragraph for you. Click **Accept** to insert it, or **Reject** to discard.');

        } else if (action === 'improve') {
            const original = savedSelection ? getTextFromSavedSelection() : '';
            const diffHtml = original
                ? buildDiffHtml(original, text)
                : escapeHtml(text);
            showSuggestion(diffHtml, true, 'Replace selection');
            addAssistantMessage('Here\'s the improved version. The red strikethrough shows what changed, green shows the replacement.');

        } else if (action === 'grammar') {
            const original = savedSelection ? getTextFromSavedSelection() : '';
            if (original) {
                const diffHtml = buildDiffHtml(original, text);
                showSuggestion(diffHtml, true, 'Replace selection');
                addAssistantMessage('Grammar check complete. Red = removed, green = corrected text.');
            } else {
                // Whole document check — show as message
                addAssistantMessage(`📋 Corrected text:\n\n${text}`);
            }

        } else if (action === 'summarize') {
            addAssistantMessage(`📋 **Summary:**\n\n${text}`);

        } else {
            // Free-form response
            addAssistantMessage(text);
        }
    }

    // ── Diff view ─────────────────────────────────────────────────────────────

    function buildDiffHtml(original, improved) {
        // Simple word-level diff
        const origWords = original.split(/(\s+)/);
        const newWords  = improved.split(/(\s+)/);

        // LCS-based diff using a simple DP approach
        const diff = computeWordDiff(origWords, newWords);
        let html = '';
        for (const part of diff) {
            if (part.type === 'equal') {
                html += escapeHtml(part.value);
            } else if (part.type === 'removed') {
                html += `<del>${escapeHtml(part.value)}</del>`;
            } else if (part.type === 'added') {
                html += `<ins>${escapeHtml(part.value)}</ins>`;
            }
        }
        return html;
    }

    function computeWordDiff(a, b) {
        // Build LCS length table
        const m = a.length, n = b.length;
        const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                dp[i][j] = a[i-1] === b[j-1]
                    ? dp[i-1][j-1] + 1
                    : Math.max(dp[i-1][j], dp[i][j-1]);
            }
        }

        // Backtrack
        const result = [];
        let i = m, j = n;
        while (i > 0 || j > 0) {
            if (i > 0 && j > 0 && a[i-1] === b[j-1]) {
                result.unshift({ type: 'equal', value: a[i-1] });
                i--; j--;
            } else if (j > 0 && (i === 0 || dp[i][j-1] >= dp[i-1][j])) {
                result.unshift({ type: 'added', value: b[j-1] });
                j--;
            } else {
                result.unshift({ type: 'removed', value: a[i-1] });
                i--;
            }
        }
        return result;
    }

    function escapeHtml(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    // ── Selection management ──────────────────────────────────────────────────

    function saveSelection() {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return null;
        const range = sel.getRangeAt(0);
        return {
            range: range.cloneRange(),
            text: sel.toString()
        };
    }

    function getTextFromSavedSelection() {
        return savedSelection ? savedSelection.text : '';
    }

    function restoreSelection() {
        if (!savedSelection) return;
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(savedSelection.range);
    }

    // ── Accept / Reject ───────────────────────────────────────────────────────

    function handleAccept() {
        const rawText = suggestionCard.dataset.rawText || '';
        if (!rawText) { hideSuggestion(); return; }

        const editor = document.getElementById('editor');
        if (!editor) { hideSuggestion(); return; }
        editor.focus();

        if (savedSelection) {
            // Replace selection
            restoreSelection();
            const sel = window.getSelection();
            if (sel && sel.rangeCount > 0) {
                sel.getRangeAt(0).deleteContents();
                const p = document.createElement('span');
                p.innerHTML = rawText;
                sel.getRangeAt(0).insertNode(p);
                // Move cursor to end
                sel.collapse(p, p.childNodes.length);
            }
            savedSelection = null;
        } else {
            // Insert at cursor
            const sel = window.getSelection();
            if (sel && sel.rangeCount > 0) {
                const range = sel.getRangeAt(0);
                range.collapse(false);
                const p = document.createElement('p');
                p.innerHTML = rawText;
                range.insertNode(p);
                sel.collapse(p, p.childNodes.length);
            } else {
                // Fallback: append
                const p = document.createElement('p');
                p.innerHTML = rawText;
                editor.appendChild(p);
            }
        }

        hideSuggestion();
        addSystemMessage('✅ Content inserted into document.');
    }

    function handleReject() {
        savedSelection = null;
        hideSuggestion();
        addSystemMessage('✕ Suggestion discarded.');
    }

    // ── Suggestion card helpers ───────────────────────────────────────────────

    function showSuggestion(htmlContent, isDiff, acceptLabel) {
        if (!suggestionCard || !suggestionText) return;
        suggestionCard.dataset.rawText = isDiff
            ? extractCleanText(htmlContent)  // store plain text for insertion
            : htmlContent;
        suggestionText.innerHTML = htmlContent;
        if (acceptBtn) acceptBtn.textContent = `✅ ${acceptLabel || 'Accept'}`;
        suggestionCard.classList.remove('hidden');
        suggestionCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function hideSuggestion() {
        if (suggestionCard) suggestionCard.classList.add('hidden');
        if (suggestionText) suggestionText.innerHTML = '';
        if (suggestionCard) delete suggestionCard.dataset.rawText;
    }

    function extractCleanText(diffHtml) {
        // For diff view, extract only the 'ins' (new) parts as the clean replacement
        const tmp = document.createElement('div');
        tmp.innerHTML = diffHtml;
        // Remove <del> elements
        tmp.querySelectorAll('del').forEach(el => el.remove());
        // Unwrap <ins> elements
        tmp.querySelectorAll('ins').forEach(el => {
            el.replaceWith(document.createTextNode(el.textContent));
        });
        return tmp.innerHTML;
    }

    // ── Message helpers ───────────────────────────────────────────────────────

    function addUserMessage(text) {
        appendMessage(escapeHtml(text), 'user');
    }

    function addAssistantMessage(text) {
        // Convert **bold** markdown
        const html = escapeHtml(text)
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br>');
        appendMessage(html, 'assistant');
    }

    function addSystemMessage(text) {
        const html = escapeHtml(text)
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        appendMessage(html, 'system');
    }

    function appendMessage(html, role) {
        if (!messagesEl) return;
        // Remove loading indicator if present
        hideLoading();
        const div = document.createElement('div');
        div.className = `ai-msg ${role}`;
        div.innerHTML = html;
        messagesEl.appendChild(div);
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    let loadingEl = null;

    function showLoading() {
        if (!messagesEl || loadingEl) return;
        loadingEl = document.createElement('div');
        loadingEl.className = 'ai-loading';
        loadingEl.innerHTML = '<span></span><span></span><span></span>';
        messagesEl.appendChild(loadingEl);
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function hideLoading() {
        if (loadingEl) {
            loadingEl.remove();
            loadingEl = null;
        }
    }

    function setInputPlaceholder(text) {
        if (inputEl) inputEl.placeholder = text;
    }

    // ── Bootstrap ─────────────────────────────────────────────────────────────

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose for external use (e.g., desktop AI agent directing user here)
    window.NotebookAI = { openPanel, closePanel, togglePanel };

})();
