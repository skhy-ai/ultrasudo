/**
 * Markdown Editor — Live Preview Engine
 * Converts markdown input to HTML preview in real-time.
 * Supports: headings, bold, italic, strikethrough, links,
 *           images, code blocks, inline code, lists, blockquotes, hr
 */

const editor   = document.getElementById('editor');
const preview  = document.getElementById('preview');

// --- Markdown → HTML Converter ---
function markdownToHtml(md) {
    if (!md) return '';

    let html = md;

    // Escape HTML entities first (security)
    html = html.replace(/&/g, '&amp;');
    html = html.replace(/</g, '&lt;');
    html = html.replace(/>/g, '&gt;');

    // Fenced code blocks (```lang ... ```)
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
        return `<pre><code class="lang-${lang || 'plaintext'}">${code.trim()}</code></pre>`;
    });

    // Inline code (`code`)
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Images ![alt](src)
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%; border-radius:8px; margin:8px 0;">');

    // Links [text](url)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

    // Bold **text** or __text__
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');

    // Italic *text* or _text_
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/_(.+?)_/g, '<em>$1</em>');

    // Strikethrough ~~text~~
    html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');

    // Horizontal rule --- or ***
    html = html.replace(/^\s*(---|\*\*\*|___)\s*$/gm, '<hr>');

    // Blockquotes > text
    html = html.replace(/^&gt;\s?(.*)$/gm, '<blockquote style="border-left:3px solid #3b82f6; padding-left:12px; color:#94a3b8; margin:8px 0;">$1</blockquote>');

    // Headings # to ######
    html = html.replace(/^#{6}\s+(.*)$/gm, '<h6>$1</h6>');
    html = html.replace(/^#{5}\s+(.*)$/gm, '<h5>$1</h5>');
    html = html.replace(/^#{4}\s+(.*)$/gm, '<h4>$1</h4>');
    html = html.replace(/^#{3}\s+(.*)$/gm, '<h3>$1</h3>');
    html = html.replace(/^#{2}\s+(.*)$/gm, '<h2>$1</h2>');
    html = html.replace(/^#{1}\s+(.*)$/gm, '<h1>$1</h1>');

    // Unordered lists (- or *)
    html = html.replace(/^\s*[-*]\s+(.*)$/gm, '<li>$1</li>');

    // Ordered lists (1. 2. etc)
    html = html.replace(/^\s*\d+\.\s+(.*)$/gm, '<li>$1</li>');

    // Wrap consecutive <li> in <ul>
    html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`);

    // Paragraphs: wrap remaining plain lines
    html = html.replace(/^(?!<[a-z]|$)(.+)$/gm, '<p>$1</p>');

    // Clean up empty paragraphs
    html = html.replace(/<p>\s*<\/p>/g, '');

    return html;
}

// --- Live Preview ---
function updatePreview() {
    if (preview && editor) {
        preview.innerHTML = markdownToHtml(editor.value);
    }
}

// Make updatePreview globally available for AppShell's Open handler
window.updatePreview = updatePreview;

// Real-time editing
if (editor) {
    editor.addEventListener('input', updatePreview);

    // Initial placeholder content
    if (!editor.value) {
        editor.value = `# Welcome to Markdown Editor

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
    }

    // Render initial content
    updatePreview();
}
