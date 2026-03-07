import React, { useState, useEffect, useMemo } from 'react';
import AppShell from '../../../components/shared/AppShell/AppShell';
import SplitPane from '../../../components/shared/SplitPane/SplitPane';
import useLocalStore from '../../../hooks/useLocalStore';
import './MarkdownEditor.css';

/**
 * Basic Regex-based Markdown to HTML converter.
 * Ported from legacy script.js.
 */
function markdownToHtml(md) {
    if (!md) return '';
    let html = md;
    
    // Security: Escape HTML entities
    html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    // Fenced code blocks
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
        return `<pre><code class="lang-${lang || 'plaintext'}">${code.trim()}</code></pre>`;
    });
    
    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Images
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%; border-radius:8px; margin:8px 0;">');
    
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    
    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/__(.+?)__/g, '<strong>$1</strong>');
    
    // Italic
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>').replace(/_(.+?)_/g, '<em>$1</em>');
    
    // Strikethrough
    html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');
    
    // HR
    html = html.replace(/^\s*(---|\*\*\*|___)\s*$/gm, '<hr>');
    
    // Blockquotes
    html = html.replace(/^&gt;\s?(.*)$/gm, '<blockquote class="md-quote">$1</blockquote>');
    
    // Headings
    html = html.replace(/^#{6}\s+(.*)$/gm, '<h6>$1</h6>');
    html = html.replace(/^#{5}\s+(.*)$/gm, '<h5>$1</h5>');
    html = html.replace(/^#{4}\s+(.*)$/gm, '<h4>$1</h4>');
    html = html.replace(/^#{3}\s+(.*)$/gm, '<h3>$1</h3>');
    html = html.replace(/^#{2}\s+(.*)$/gm, '<h2>$1</h2>');
    html = html.replace(/^#{1}\s+(.*)$/gm, '<h1>$1</h1>');
    
    // Lists
    html = html.replace(/^\s*[-*]\s+(.*)$/gm, '<li>$1</li>');
    html = html.replace(/^\s*\d+\.\s+(.*)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`);
    
    // Paragraphs
    html = html.replace(/^(?!<[a-z]|$)(.+)$/gm, '<p>$1</p>');
    html = html.replace(/<p>\s*<\/p>/g, '');
    
    return html;
}

const DEFAULT_CONTENT = `# Welcome to Markdown Editor

Write **Markdown** here and see the _preview_ on the right!

## Features
- **Bold** and *italic* text
- [Links](https://example.com) and images
- Code blocks and \`inline code\`
- Lists, blockquotes, and more

> This is a blockquote

\`\`\`javascript
function hello() {
    console.log("Hello, Skand!");
}
\`\`\`

---

Enjoy writing! ✨`;

export default function MarkdownEditor() {
    const [markdown, setMarkdown] = useLocalStore('markdown_current_doc', DEFAULT_CONTENT);
    
    const htmlPreview = useMemo(() => markdownToHtml(markdown), [markdown]);

    const handleSave = async () => {
        if (window.electronAPI) {
            await window.electronAPI.saveFile({ filename: 'notes.md', content: markdown });
        } else if (window.__TAURI__) {
             // In Tauri we might need a dialog plugin or just use the bridge
             await window.__TAURI__.core.invoke('save_file', { filename: 'notes.md', content: markdown });
        }
    };

    const handleOpen = async () => {
        let res;
        if (window.electronAPI) {
            res = await window.electronAPI.openFile({ filters: [{ name: 'Markdown', extensions: ['md', 'txt'] }] });
        } else if (window.__TAURI__) {
            res = await window.__TAURI__.core.invoke('open_file');
        }
        
        if (res?.ok && res.content) {
            setMarkdown(res.content);
        }
    };

    return (
        <AppShell title="Markdown Editor" icon="fas fa-file-lines">
            <div className="markdown-editor-app">
                <div className="editor-toolbar">
                    <button onClick={handleOpen}><i className="fas fa-file-import"></i> Open</button>
                    <button onClick={handleSave}><i className="fas fa-file-export"></i> Save</button>
                    <button onClick={() => setMarkdown('')}><i className="fas fa-trash-can"></i> Clear</button>
                </div>
                
                <div className="editor-container">
                    <SplitPane 
                        leftTitle="Editor"
                        rightTitle="Preview"
                        left={
                            <textarea 
                                className="md-textarea"
                                value={markdown}
                                onChange={(e) => setMarkdown(e.target.value)}
                                placeholder="# Heading..."
                            />
                        }
                        right={
                            <div 
                                className="md-preview-content"
                                dangerouslySetInnerHTML={{ __html: htmlPreview }}
                            />
                        }
                    />
                </div>
            </div>
        </AppShell>
    );
}
