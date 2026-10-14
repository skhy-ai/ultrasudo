import React, { useState, useEffect, useRef, useCallback } from 'react';
import AppShell from '../../../components/shared/AppShell/AppShell';
import { useAppAgent } from '../../../hooks/useAppAgent';
import './Notebook.css';

const DEFAULT_DOC_TITLE = 'Untitled Document';

const TEMPLATES = {
    blank: {
        title: 'Blank Document',
        content: '<p>Start typing your document here...</p>'
    },
    meeting: {
        title: 'Meeting Notes',
        content: `<h1>Meeting Notes</h1>
<p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
<p><strong>Attendees:</strong> Participant 1, Participant 2</p>
<hr>
<h2>Agenda</h2>
<ul>
    <li>Item 1: Project status update</li>
    <li>Item 2: Architecture overview</li>
    <li>Item 3: Next steps & deliverables</li>
</ul>
<h2>Action Items</h2>
<ul>
    <li>[ ] Complete feature implementation</li>
    <li>[ ] Review pull requests</li>
</ul>`
    },
    proposal: {
        title: 'Project Proposal',
        content: `<h1>Project Proposal: NextGen App</h1>
<p><em>Prepared by Team Ultrasudo</em></p>
<h2>1. Executive Summary</h2>
<p>This document outlines the scope, objectives, and timeline for the NextGen application project.</p>
<h2>2. Objectives & Deliverables</h2>
<blockquote class="md-quote">Deliver a modern, fast, offline-first web application suite.</blockquote>
<h2>3. Key Features</h2>
<ul>
    <li>High performance UI architecture</li>
    <li>Comprehensive document export suite</li>
    <li>Seamless desktop and web integration</li>
</ul>`
    }
};

export default function Notebook() {
    const editorRef = useRef(null);
    const paperRef = useRef(null);
    const docxImportRef = useRef(null);
    const odsImportRef = useRef(null);
    const mdImportRef = useRef(null);
    const jsonImportRef = useRef(null);

    // Core States
    const [docTitle, setDocTitle] = useState(DEFAULT_DOC_TITLE);
    const [stats, setStats] = useState({ words: 0, chars: 0, paragraphs: 0, readingTime: 0 });
    const [saveStatus, setSaveStatus] = useState('saved');
    
    // Formatting & Selection Active States
    const [activeFormats, setActiveFormats] = useState({
        bold: false,
        italic: false,
        underline: false,
        strikethrough: false,
        justifyLeft: false,
        justifyCenter: false,
        justifyRight: false,
        justifyFull: false,
        unorderedList: false,
        orderedList: false,
        block: 'P',
        font: 'Arial',
        fontSize: '12',
        fontColor: '#000000',
        hiliteColor: '#ffff00'
    });

    // Margins State
    const [marginState, setMarginState] = useState({
        unit: 'cm',
        top: 2,
        right: 2,
        bottom: 2,
        left: 2
    });
    const [marginMenuOpen, setMarginMenuOpen] = useState(false);
    const marginMenuRef = useRef(null);

    // AI Chat Assistant State
    const [aiPanelOpen, setAiPanelOpen] = useState(false);
    const [selectedModel, setSelectedModel] = useState('gemini');
    const [aiProvidersList, setAiProvidersList] = useState([]);
    const [aiMessages, setAiMessages] = useState([
        { role: 'assistant', text: 'Hello! I am your AI writing assistant. Select text in your document or type below to summarize, refine, or expand your document!' }
    ]);
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiLoading, setAiLoading] = useState(false);

    // Navigation & Versioning Drawers
    const [tocOpen, setTocOpen] = useState(false);
    const [tocItems, setTocItems] = useState([]);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [versionHistory, setVersionHistory] = useState([]);
    const [isDictating, setIsDictating] = useState(false);
    const recognitionRef = useRef(null);

    // Element selection states (Image / Table)
    const [selectedImage, setSelectedImage] = useState(null);
    const [selectedTable, setSelectedTable] = useState(null);
    const [imageProps, setImageProps] = useState({ layout: 'inline', width: 100, brightness: 100, saturation: 100, hue: 0 });
    const [tableProps, setTableProps] = useState({ borderStyle: 'solid', borderWidth: 1, borderColor: '#cbd5e1' });

    // Custom Modals State
    const [activeModal, setActiveModal] = useState(null); // null | 'link' | 'image' | 'table' | 'templates'
    const [modalData, setModalData] = useState({});

    // Inject CDNs dynamically (.docx mammoth, .ods xlsx, turndown markdown, html2pdf, html-docx)
    useEffect(() => {
        if (!window.htmlDocx) {
            const s1 = document.createElement('script');
            s1.src = 'https://unpkg.com/html-docx-js/dist/html-docx.js';
            document.head.appendChild(s1);
        }
        if (typeof window.html2pdf !== 'function') {
            const s2 = document.createElement('script');
            s2.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.9.2/html2pdf.bundle.min.js';
            document.head.appendChild(s2);
        }
        if (!window.mammoth) {
            const s3 = document.createElement('script');
            s3.src = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js';
            document.head.appendChild(s3);
        }
        if (!window.XLSX) {
            const s4 = document.createElement('script');
            s4.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
            document.head.appendChild(s4);
        }
        if (!window.TurndownService) {
            const s5 = document.createElement('script');
            s5.src = 'https://cdnjs.cloudflare.com/ajax/libs/turndown/7.1.2/turndown.min.js';
            document.head.appendChild(s5);
        }
    }, []);

    // Load active AI Providers
    useEffect(() => {
        if (window.getEnabledProvidersOrderedByPriority) {
            const providers = window.getEnabledProvidersOrderedByPriority();
            setAiProvidersList(providers);
            if (providers.length > 0) {
                setSelectedModel(providers[0].id);
            }
        }
    }, [aiPanelOpen]);

    // Outside click handler for Margin Dropdown
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (marginMenuRef.current && !marginMenuRef.current.contains(e.target)) {
                setMarginMenuOpen(false);
            }
        };
        if (marginMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [marginMenuOpen]);

    // Update Table of Contents (TOC)
    const updateToc = useCallback(() => {
        if (!editorRef.current) return;
        const headings = editorRef.current.querySelectorAll('h1, h2, h3');
        const items = [];
        headings.forEach((h, idx) => {
            if (!h.id) h.id = `heading-toc-${idx}-${Date.now()}`;
            items.push({
                id: h.id,
                text: h.innerText || `Heading ${idx + 1}`,
                level: h.tagName.toLowerCase()
            });
        });
        setTocItems(items);
    }, []);

    // AI Assistant Handlers using UltraSudo Agent Priority Engine
    const handleAiSend = async (promptText = aiPrompt) => {
        const q = promptText.trim();
        if (!q) return;
        const userMsg = { role: 'user', text: q };
        setAiMessages(prev => [...prev, userMsg]);
        setAiPrompt('');
        setAiLoading(true);

        const currentText = editorRef.current ? editorRef.current.innerText : '';
        const selectionObj = window.getSelection();
        const selectedText = selectionObj ? selectionObj.toString().trim() : '';

        const fullPrompt = selectedText 
            ? `Context selected from document: "${selectedText}"\n\nInstruction: ${q}`
            : `Document Content Context:\n${currentText.slice(0, 1500)}\n\nInstruction: ${q}`;

        try {
            let responseText = '';
            if (window.ultrasudoAgent) {
                const aiRes = await window.ultrasudoAgent.chat(fullPrompt, selectedModel);
                responseText = aiRes.text;
                if (aiRes.providerUsed) {
                    responseText += `\n\n*(Generated via ${aiRes.providerUsed} - ${aiRes.modelUsed})*`;
                }
            } else {
                responseText = `Mock AI Response (${selectedModel}): Complete feature overview for document writing.`;
            }

            setAiMessages(prev => [...prev, { role: 'assistant', text: responseText }]);
        } catch (err) {
            setAiMessages(prev => [...prev, { role: 'assistant', text: `⚠️ AI Request failed: ${err.message}` }]);
        } finally {
            setAiLoading(false);
        }
    };

    const insertAiTextToEditor = (text) => {
        if (!editorRef.current) return;
        editorRef.current.focus();
        const cleanText = text.replace(/\n\n\*(Generated via.*?)\*/, '');
        const formattedText = cleanText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>');
        document.execCommand('insertHTML', false, formattedText);
        triggerAutoSave();
    };

    useAppAgent({
        appId: 'notebook',
        appName: 'Notebook Document Editor',
        getContext: () => ({
            documentTitle: docTitle,
            wordCount: stats.words,
            characterCount: stats.chars,
            contentPreview: editorRef.current ? editorRef.current.innerText.slice(0, 1000) : ''
        }),
        suggestedPrompts: [
            'Draft an executive summary of this note',
            'Improve writing clarity and grammar',
            'Generate a structured outline for next steps'
        ],
        actions: [
            {
                name: 'insert_text',
                description: 'Insert generated formatted text or draft into the active document',
                parameters: {
                    content: { type: 'string', description: 'HTML or text content to insert' }
                },
                handler: ({ content }) => {
                    if (!content) throw new Error('Content is required');
                    insertAiTextToEditor(content);
                    return { success: true };
                }
            },
            {
                name: 'set_document_title',
                description: 'Update the title of the active document',
                parameters: {
                    title: { type: 'string', description: 'New document title' }
                },
                handler: ({ title }) => {
                    if (!title) throw new Error('Title is required');
                    setDocTitle(title);
                    return { success: true, title };
                }
            }
        ]
    });

    // Calculate editor stats
    const updateStats = useCallback(() => {
        if (!editorRef.current) return;
        const text = editorRef.current.innerText || '';
        const trimmed = text.trim();
        const words = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
        const chars = text.length;
        const paragraphs = text.split(/\n\s*\n/).filter(Boolean).length || (words ? 1 : 0);
        const readingTime = Math.ceil(words / 200);

        setStats({ words, chars, paragraphs, readingTime });
    }, []);

    // Load initial document data & version history
    useEffect(() => {
        const savedData = localStorage.getItem('desktop_app_notebook_doc');
        if (savedData && editorRef.current) {
            try {
                const parsed = JSON.parse(savedData);
                if (parsed.content) editorRef.current.innerHTML = parsed.content;
                if (parsed.title) setDocTitle(parsed.title);
                if (parsed.margins) setMarginState(parsed.margins);
            } catch (e) {
                console.error('Error loading saved document', e);
            }
        }

        const savedHistory = localStorage.getItem('desktop_app_notebook_history');
        if (savedHistory) {
            try {
                setVersionHistory(JSON.parse(savedHistory));
            } catch (ignore) {}
        }

        updateStats();
        updateToc();
    }, [updateStats, updateToc]);

    // Auto-save debouncer & Snapshot History
    const autoSaveTimeoutRef = useRef(null);
    const triggerAutoSave = useCallback(() => {
        setSaveStatus('saving');
        if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);

        autoSaveTimeoutRef.current = setTimeout(() => {
            if (editorRef.current) {
                const content = editorRef.current.innerHTML;
                const docObj = {
                    title: docTitle,
                    content,
                    margins: marginState,
                    updatedAt: new Date().toISOString()
                };
                localStorage.setItem('desktop_app_notebook_doc', JSON.stringify(docObj));
                setSaveStatus('saved');
                updateToc();

                // Save snapshot into version history list (cap at 20)
                setVersionHistory(prev => {
                    const snippet = editorRef.current.innerText.slice(0, 100);
                    const newRecord = {
                        id: 'ver_' + Date.now(),
                        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                        date: new Date().toLocaleDateString(),
                        title: docTitle,
                        snippet,
                        content
                    };
                    const updated = [newRecord, ...prev.slice(0, 19)];
                    localStorage.setItem('desktop_app_notebook_history', JSON.stringify(updated));
                    return updated;
                });
            }
        }, 1200);
    }, [docTitle, marginState, updateToc]);

    const handleEditorInput = () => {
        updateStats();
        triggerAutoSave();
    };

    // Active formatting checker on selection change
    const checkActiveFormats = useCallback(() => {
        if (!editorRef.current) return;
        try {
            const bold = document.queryCommandState('bold');
            const italic = document.queryCommandState('italic');
            const underline = document.queryCommandState('underline');
            const strikethrough = document.queryCommandState('strikeThrough');
            const justifyLeft = document.queryCommandState('justifyLeft');
            const justifyCenter = document.queryCommandState('justifyCenter');
            const justifyRight = document.queryCommandState('justifyRight');
            const justifyFull = document.queryCommandState('justifyFull');
            const unorderedList = document.queryCommandState('insertUnorderedList');
            const orderedList = document.queryCommandState('insertOrderedList');
            const blockVal = document.queryCommandValue('formatBlock') || 'P';
            const fontVal = document.queryCommandValue('fontName') || 'Arial';

            setActiveFormats({
                bold, italic, underline, strikethrough, justifyLeft, justifyCenter, justifyRight, justifyFull, unorderedList, orderedList,
                block: blockVal.toUpperCase(),
                font: fontVal.replace(/['"]/g, ''),
                fontSize: '12', fontColor: '#000000', hiliteColor: '#ffff00'
            });
        } catch (e) {}
    }, []);

    useEffect(() => {
        const handleSelectionChange = () => {
            const selection = window.getSelection();
            if (!selection || !editorRef.current) return;
            if (editorRef.current.contains(selection.anchorNode)) {
                checkActiveFormats();
            }
        };
        document.addEventListener('selectionchange', handleSelectionChange);
        return () => document.removeEventListener('selectionchange', handleSelectionChange);
    }, [checkActiveFormats]);

    const execCommand = (command, value = null) => {
        if (editorRef.current) editorRef.current.focus();
        document.execCommand(command, false, value);
        checkActiveFormats();
        triggerAutoSave();
    };

    // Selection handling for Image and Table properties
    const handleEditorClick = (e) => {
        const target = e.target;
        if (target && target.tagName === 'IMG') {
            if (selectedImage && selectedImage !== target) selectedImage.classList.remove('selected-image');
            target.classList.add('selected-image');
            setSelectedImage(target);
            let layout = 'inline';
            if (target.classList.contains('img-block')) layout = 'block';
            else if (target.classList.contains('img-center')) layout = 'center';
            else if (target.classList.contains('img-float-left')) layout = 'float-left';
            else if (target.classList.contains('img-float-right')) layout = 'float-right';

            setImageProps({
                layout,
                width: parseInt(target.style.width, 10) || 100,
                brightness: 100, saturation: 100, hue: 0
            });
        } else {
            if (selectedImage) selectedImage.classList.remove('selected-image');
            setSelectedImage(null);
        }

        let tableEl = target ? target.closest('table') : null;
        if (tableEl) {
            if (selectedTable && selectedTable !== tableEl) selectedTable.style.outline = '';
            tableEl.style.outline = '2px solid #6366f1';
            setSelectedTable(tableEl);
        } else {
            if (selectedTable) selectedTable.style.outline = '';
            setSelectedTable(null);
        }
    };

    // Voice Dictation via Web Speech API
    const toggleVoiceDictation = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('Speech recognition is not supported in this browser environment.');
            return;
        }

        if (isDictating && recognitionRef.current) {
            recognitionRef.current.stop();
            setIsDictating(false);
            return;
        }

        try {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = false;
            recognition.lang = 'en-US';

            recognition.onstart = () => setIsDictating(true);
            recognition.onend = () => setIsDictating(false);
            recognition.onerror = () => setIsDictating(false);

            recognition.onresult = (event) => {
                let transcript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    if (event.results[i].isFinal) {
                        transcript += event.results[i][0].transcript + ' ';
                    }
                }
                if (transcript && editorRef.current) {
                    editorRef.current.focus();
                    document.execCommand('insertText', false, transcript);
                    triggerAutoSave();
                }
            };

            recognitionRef.current = recognition;
            recognition.start();
        } catch (e) {
            alert('Could not start voice dictation: ' + e.message);
            setIsDictating(false);
        }
    };

    // Document Import Handlers (.docx, .ods, .md, .json)
    const handleImportDocx = (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        if (!window.mammoth) {
            alert('Mammoth.js converter is loading, please try again in a moment.');
            return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
            const arrayBuffer = event.target.result;
            window.mammoth.convertToHtml({ arrayBuffer: arrayBuffer })
                .then((result) => {
                    if (editorRef.current) {
                        editorRef.current.innerHTML = result.value || '<p>Empty Word Document</p>';
                        setDocTitle(file.name.replace(/\.[^/.]+$/, ""));
                        updateStats();
                        triggerAutoSave();
                    }
                })
                .catch((err) => alert('Failed to convert DOCX file: ' + err.message));
        };
        reader.readAsArrayBuffer(file);
        e.target.value = '';
    };

    const handleImportOds = (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        if (!window.XLSX) {
            alert('SheetJS converter is loading, please try again in a moment.');
            return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target.result);
                const workbook = window.XLSX.read(data, { type: 'array' });
                let html = `<h1>${file.name.replace(/\.[^/.]+$/, "")}</h1>`;
                
                workbook.SheetNames.forEach(sheetName => {
                    const worksheet = workbook.Sheets[sheetName];
                    const tableHtml = window.XLSX.utils.sheet_to_html(worksheet);
                    html += `<h2 style="margin-top:20px;">Sheet: ${sheetName}</h2>` + tableHtml;
                });

                if (editorRef.current) {
                    editorRef.current.innerHTML = html;
                    setDocTitle(file.name.replace(/\.[^/.]+$/, ""));
                    updateStats();
                    triggerAutoSave();
                }
            } catch (err) {
                alert('Failed to parse ODS spreadsheet file: ' + err.message);
            }
        };
        reader.readAsArrayBuffer(file);
        e.target.value = '';
    };

    const handleImportMd = (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target.result || '';
            let html = text
                .replace(/^# (.*$)/gim, '<h1>$1</h1>')
                .replace(/^## (.*$)/gim, '<h2>$1</h2>')
                .replace(/^### (.*$)/gim, '<h3>$1</h3>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/\n\n/g, '</p><p>')
                .replace(/\n/g, '<br/>');

            html = `<p>${html}</p>`;
            if (editorRef.current) {
                editorRef.current.innerHTML = html;
                setDocTitle(file.name.replace(/\.[^/.]+$/, ""));
                updateStats();
                triggerAutoSave();
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    // Export Options
    const exportDocx = () => {
        if (!window.htmlDocx || !window.htmlDocx.asBlob) {
            alert('DOCX exporter is initializing, please try again in a moment.');
            return;
        }
        const html = `<!DOCTYPE html><html><head><title>${docTitle}</title></head><body>${editorRef.current.innerHTML}</body></html>`;
        const blob = window.htmlDocx.asBlob(html);
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${docTitle.replace(/\s+/g, '_')}.docx`;
        a.click();
    };

    const exportPdf = () => {
        if (typeof window.html2pdf !== 'function') {
            alert('PDF exporter is initializing, please try again in a moment.');
            return;
        }
        const opt = {
            margin: [marginState.top, marginState.left, marginState.bottom, marginState.right],
            filename: `${docTitle.replace(/\s+/g, '_')}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: marginState.unit, format: 'a4', orientation: 'portrait' }
        };
        window.html2pdf().set(opt).from(editorRef.current).save();
    };

    const exportMd = () => {
        if (!editorRef.current) return;
        let mdText = '';
        if (window.TurndownService) {
            const turndownService = new window.TurndownService();
            mdText = turndownService.turndown(editorRef.current.innerHTML);
        } else {
            mdText = editorRef.current.innerText;
        }
        const blob = new Blob([mdText], { type: 'text/markdown;charset=utf-8;' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${docTitle.replace(/\s+/g, '_')}.md`;
        a.click();
    };

    const exportJson = () => {
        const docObj = {
            title: docTitle,
            content: editorRef.current ? editorRef.current.innerHTML : '',
            margins: marginState,
            exportedAt: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(docObj, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${docTitle.replace(/\s+/g, '_')}_backup.json`;
        a.click();
    };

    const handleImportJson = (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const parsed = JSON.parse(event.target.result);
                if (parsed.content && editorRef.current) {
                    editorRef.current.innerHTML = parsed.content;
                    if (parsed.title) setDocTitle(parsed.title);
                    if (parsed.margins) setMarginState(parsed.margins);
                    updateStats();
                    triggerAutoSave();
                }
            } catch (err) {
                alert('Invalid JSON document file format.');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const restoreVersion = (version) => {
        if (editorRef.current && version.content) {
            editorRef.current.innerHTML = version.content;
            setDocTitle(version.title || DEFAULT_DOC_TITLE);
            updateStats();
            triggerAutoSave();
        }
    };

    // Calculate margins in CSS units for paper view
    const paperPadding = `${marginState.top}${marginState.unit} ${marginState.right}${marginState.unit} ${marginState.bottom}${marginState.unit} ${marginState.left}${marginState.unit}`;

    return (
        <AppShell title="Notebook" icon="fas fa-book" noPadding={true}>
            <div className="notebook-app-wrapper">
                {/* Header Action Bar */}
                <div className="notebook-header-bar">
                    <div className="notebook-title-input-wrapper">
                        <i className="fas fa-file-pen notebook-title-icon"></i>
                        <input
                            type="text"
                            className="notebook-title-input"
                            value={docTitle}
                            onChange={(e) => {
                                setDocTitle(e.target.value);
                                triggerAutoSave();
                            }}
                            placeholder="Document Title"
                        />
                    </div>
                    <div className="notebook-header-actions">
                        <button 
                            className={`notebook-btn ${isDictating ? 'notebook-btn-danger pulse' : ''}`}
                            onClick={toggleVoiceDictation}
                            title="Speech-to-Text Voice Dictation"
                        >
                            <i className="fas fa-microphone"></i> {isDictating ? 'Dictating...' : 'Dictate'}
                        </button>

                        <button 
                            className={`notebook-btn ${tocOpen ? 'active' : ''}`}
                            onClick={() => setTocOpen(!tocOpen)}
                            title="Table of Contents Sidebar"
                        >
                            <i className="fas fa-list-ol"></i> TOC
                        </button>

                        <button 
                            className={`notebook-btn ${historyOpen ? 'active' : ''}`}
                            onClick={() => setHistoryOpen(!historyOpen)}
                            title="Document Revision History"
                        >
                            <i className="fas fa-clock-rotate-left"></i> History
                        </button>

                        <button 
                            className={`notebook-btn ${aiPanelOpen ? 'notebook-btn-primary' : ''}`} 
                            onClick={() => setAiPanelOpen(!aiPanelOpen)}
                            title="Toggle AI Chat Assistant"
                        >
                            <i className="fas fa-robot"></i> AI Assistant
                        </button>

                        {/* File Import Dropdown */}
                        <div className="dropdown-container">
                            <button className="notebook-btn" title="Import Files (.docx, .ods, .md, .json)">
                                <i className="fas fa-file-import"></i> Open File
                            </button>
                            <div className="nb-dropdown-menu">
                                <button onClick={() => docxImportRef.current.click()}><i className="fas fa-file-word"></i> Open .DOCX (Word)</button>
                                <button onClick={() => odsImportRef.current.click()}><i className="fas fa-table"></i> Open .ODS (Spreadsheet)</button>
                                <button onClick={() => mdImportRef.current.click()}><i className="fas fa-file-code"></i> Open .MD (Markdown)</button>
                                <button onClick={() => jsonImportRef.current.click()}><i className="fas fa-code"></i> Open .JSON Backup</button>
                            </div>
                        </div>

                        <input type="file" ref={docxImportRef} accept=".docx" onChange={handleImportDocx} hidden />
                        <input type="file" ref={odsImportRef} accept=".ods" onChange={handleImportOds} hidden />
                        <input type="file" ref={mdImportRef} accept=".md,.markdown" onChange={handleImportMd} hidden />
                        <input type="file" ref={jsonImportRef} accept=".json" onChange={handleImportJson} hidden />

                        {/* Export Menu */}
                        <button className="notebook-btn notebook-btn-primary" onClick={exportPdf}>
                            <i className="fas fa-file-pdf"></i> PDF
                        </button>
                        <button className="notebook-btn" onClick={exportDocx} title="Export Word DOCX">
                            <i className="fas fa-file-word"></i> DOCX
                        </button>
                        <button className="notebook-btn" onClick={exportMd} title="Export Markdown">
                            <i className="fas fa-file-code"></i> MD
                        </button>
                    </div>
                </div>

                {/* Main Formatting Toolbar */}
                <div className="notebook-toolbar-container">
                    <div className="notebook-toolbar">
                        {/* Undo / Redo */}
                        <div className="toolbar-group">
                            <button className="toolbar-btn" onClick={() => execCommand('undo')} title="Undo (Ctrl+Z)">
                                <i className="fas fa-rotate-left"></i>
                            </button>
                            <button className="toolbar-btn" onClick={() => execCommand('redo')} title="Redo (Ctrl+Y)">
                                <i className="fas fa-rotate-right"></i>
                            </button>
                        </div>

                        {/* Styles & Typography */}
                        <div className="toolbar-group">
                            <select
                                className="toolbar-select"
                                value={activeFormats.block}
                                onChange={(e) => execCommand('formatBlock', e.target.value)}
                                title="Paragraph Format"
                            >
                                <option value="P">Paragraph</option>
                                <option value="H1">Heading 1</option>
                                <option value="H2">Heading 2</option>
                                <option value="H3">Heading 3</option>
                                <option value="BLOCKQUOTE">Quote</option>
                                <option value="PRE">Code Block</option>
                            </select>

                            <select
                                className="toolbar-select"
                                value={activeFormats.font}
                                onChange={(e) => execCommand('fontName', e.target.value)}
                                title="Font Family"
                            >
                                <option value="Arial">Arial</option>
                                <option value="Times New Roman">Times New Roman</option>
                                <option value="Georgia">Georgia</option>
                                <option value="Verdana">Verdana</option>
                                <option value="Courier New">Courier New</option>
                                <option value="Inter">Inter</option>
                            </select>

                            <select
                                className="toolbar-select"
                                onChange={(e) => execCommand('fontSize', e.target.value)}
                                title="Font Size"
                                defaultValue="3"
                            >
                                <option value="2">10pt</option>
                                <option value="3">12pt</option>
                                <option value="4">14pt</option>
                                <option value="5">18pt</option>
                                <option value="6">24pt</option>
                                <option value="7">32pt</option>
                            </select>
                        </div>

                        {/* Text Styling & Colors */}
                        <div className="toolbar-group">
                            <button
                                className={`toolbar-btn ${activeFormats.bold ? 'active' : ''}`}
                                onClick={() => execCommand('bold')}
                                title="Bold (Ctrl+B)"
                            >
                                <i className="fas fa-bold"></i>
                            </button>
                            <button
                                className={`toolbar-btn ${activeFormats.italic ? 'active' : ''}`}
                                onClick={() => execCommand('italic')}
                                title="Italic (Ctrl+I)"
                            >
                                <i className="fas fa-italic"></i>
                            </button>
                            <button
                                className={`toolbar-btn ${activeFormats.underline ? 'active' : ''}`}
                                onClick={() => execCommand('underline')}
                                title="Underline (Ctrl+U)"
                            >
                                <i className="fas fa-underline"></i>
                            </button>
                            <button
                                className={`toolbar-btn ${activeFormats.strikethrough ? 'active' : ''}`}
                                onClick={() => execCommand('strikeThrough')}
                                title="Strikethrough"
                            >
                                <i className="fas fa-strikethrough"></i>
                            </button>
                        </div>

                        {/* Alignment & Lists */}
                        <div className="toolbar-group">
                            <button
                                className={`toolbar-btn ${activeFormats.justifyLeft ? 'active' : ''}`}
                                onClick={() => execCommand('justifyLeft')}
                                title="Align Left"
                            >
                                <i className="fas fa-align-left"></i>
                            </button>
                            <button
                                className={`toolbar-btn ${activeFormats.justifyCenter ? 'active' : ''}`}
                                onClick={() => execCommand('justifyCenter')}
                                title="Align Center"
                            >
                                <i className="fas fa-align-center"></i>
                            </button>
                            <button
                                className={`toolbar-btn ${activeFormats.justifyRight ? 'active' : ''}`}
                                onClick={() => execCommand('justifyRight')}
                                title="Align Right"
                            >
                                <i className="fas fa-align-right"></i>
                            </button>
                            <button
                                className={`toolbar-btn ${activeFormats.unorderedList ? 'active' : ''}`}
                                onClick={() => execCommand('insertUnorderedList')}
                                title="Bulleted List"
                            >
                                <i className="fas fa-list-ul"></i>
                            </button>
                            <button
                                className={`toolbar-btn ${activeFormats.orderedList ? 'active' : ''}`}
                                onClick={() => execCommand('insertOrderedList')}
                                title="Numbered List"
                            >
                                <i className="fas fa-list-ol"></i>
                            </button>
                        </div>

                        {/* Page Margins Dropdown */}
                        <div className="toolbar-group" ref={marginMenuRef}>
                            <button
                                className={`toolbar-btn ${marginMenuOpen ? 'active' : ''}`}
                                onClick={() => setMarginMenuOpen(!marginMenuOpen)}
                                title="Page Margins"
                            >
                                <i className="fas fa-ruler-combined"></i>
                            </button>

                            {marginMenuOpen && (
                                <div className="margin-dropdown-panel" onClick={(e) => e.stopPropagation()}>
                                    <div className="dropdown-row">
                                        <span>Margin Units</span>
                                        <select
                                            className="toolbar-select"
                                            value={marginState.unit}
                                            onChange={(e) => setMarginState({ ...marginState, unit: e.target.value })}
                                            style={{ height: '28px', fontSize: '12px' }}
                                        >
                                            <option value="cm">cm</option>
                                            <option value="in">inches</option>
                                        </select>
                                    </div>
                                    <div className="dropdown-grid">
                                        <div className="margin-input-field">
                                            <label>Top</label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                min="0"
                                                value={marginState.top}
                                                onChange={(e) => setMarginState({ ...marginState, top: parseFloat(e.target.value) || 0 })}
                                            />
                                        </div>
                                        <div className="margin-input-field">
                                            <label>Right</label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                min="0"
                                                value={marginState.right}
                                                onChange={(e) => setMarginState({ ...marginState, right: parseFloat(e.target.value) || 0 })}
                                            />
                                        </div>
                                        <div className="margin-input-field">
                                            <label>Bottom</label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                min="0"
                                                value={marginState.bottom}
                                                onChange={(e) => setMarginState({ ...marginState, bottom: parseFloat(e.target.value) || 0 })}
                                            />
                                        </div>
                                        <div className="margin-input-field">
                                            <label>Left</label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                min="0"
                                                value={marginState.left}
                                                onChange={(e) => setMarginState({ ...marginState, left: parseFloat(e.target.value) || 0 })}
                                            />
                                        </div>
                                    </div>
                                    <button
                                        className="notebook-btn"
                                        style={{ width: '100%', justifyContent: 'center' }}
                                        onClick={() => setMarginState({ unit: 'cm', top: 2, right: 2, bottom: 2, left: 2 })}
                                    >
                                        Reset Margins
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Workspace Canvas with Drawers */}
                <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
                    
                    {/* Collapsible Table of Contents (TOC) Sidebar */}
                    {tocOpen && (
                        <aside className="notebook-toc-sidebar">
                            <div className="toc-header">
                                <h4><i className="fas fa-list-ol"></i> Table of Contents</h4>
                                <button onClick={() => setTocOpen(false)}>×</button>
                            </div>
                            <div className="toc-list">
                                {tocItems.length === 0 ? (
                                    <div className="toc-empty">No headings found in document. Use H1, H2, or H3 to generate sections.</div>
                                ) : (
                                    tocItems.map(item => (
                                        <div 
                                            key={item.id} 
                                            className={`toc-item toc-${item.level}`}
                                            onClick={() => {
                                                const el = document.getElementById(item.id);
                                                if (el) el.scrollIntoView({ behavior: 'smooth' });
                                            }}
                                        >
                                            {item.text}
                                        </div>
                                    ))
                                )}
                            </div>
                        </aside>
                    )}

                    {/* Paper Editor Scroll Container */}
                    <div className="notebook-canvas-scroll">
                        <div className="notebook-paper-outer" ref={paperRef}>
                            {/* Horizontal Ruler */}
                            <div className="ruler-guide-horizontal">
                                {Array.from({ length: 20 }).map((_, idx) => (
                                    <React.Fragment key={idx}>
                                        <div className="ruler-tick-mark major" style={{ left: `${idx * 40}px` }}>
                                            <span className="ruler-tick-number">{idx}</span>
                                        </div>
                                        <div className="ruler-tick-mark" style={{ left: `${idx * 40 + 20}px` }}></div>
                                    </React.Fragment>
                                ))}
                            </div>

                            {/* Margin Overlays */}
                            <div className="paper-margin-overlay">
                                <div className="margin-line-v" style={{ left: `${marginState.left}${marginState.unit}` }}></div>
                                <div className="margin-line-v" style={{ right: `${marginState.right}${marginState.unit}` }}></div>
                                <div className="margin-line-h" style={{ top: `${marginState.top}${marginState.unit}` }}></div>
                                <div className="margin-line-h" style={{ bottom: `${marginState.bottom}${marginState.unit}` }}></div>
                            </div>

                            {/* Rich Text Editor */}
                            <div
                                ref={editorRef}
                                className="notebook-editor-content"
                                contentEditable="true"
                                suppressContentEditableWarning={true}
                                onInput={handleEditorInput}
                                onClick={handleEditorClick}
                                style={{ padding: paperPadding }}
                            >
                                <h1>Welcome to Notebook</h1>
                                <p>Open or drag existing <strong>.docx</strong>, <strong>.ods</strong>, or <strong>.md</strong> files into Notebook to edit seamlessly.</p>
                            </div>
                        </div>
                    </div>

                    {/* Revision History Sidebar Drawer */}
                    {historyOpen && (
                        <aside className="notebook-history-sidebar">
                            <div className="history-header">
                                <h4><i className="fas fa-clock-rotate-left"></i> Revision History</h4>
                                <button onClick={() => setHistoryOpen(false)}>×</button>
                            </div>
                            <div className="history-list">
                                {versionHistory.length === 0 ? (
                                    <div className="toc-empty">No revisions captured yet. Auto-saves will create snapshot restore points.</div>
                                ) : (
                                    versionHistory.map(ver => (
                                        <div key={ver.id} className="history-card">
                                            <div className="history-time">{ver.date} at {ver.timestamp}</div>
                                            <div className="history-snippet">{ver.snippet || 'Untitled revision'}...</div>
                                            <button className="history-restore-btn" onClick={() => restoreVersion(ver)}>
                                                <i className="fas fa-rotate-left"></i> Restore Version
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </aside>
                    )}

                    {/* AI Chat Assistant Side Panel */}
                    {aiPanelOpen && (
                        <div className="notebook-ai-drawer">
                            <div className="ai-drawer-header">
                                <h3><i className="fas fa-sparkles"></i> AI Writing Assistant</h3>
                                <button className="floating-props-close" onClick={() => setAiPanelOpen(false)}>×</button>
                            </div>

                            <div className="ai-model-selector">
                                <label><i className="fas fa-brain"></i> Active Provider &amp; Model</label>
                                <select 
                                    className="ai-model-select"
                                    value={selectedModel}
                                    onChange={(e) => setSelectedModel(e.target.value)}
                                >
                                    {aiProvidersList.length === 0 ? (
                                        <>
                                            <option value="anthropic">Anthropic Claude 3.5 Sonnet</option>
                                            <option value="gemini">Google Gemini 2.0 Flash</option>
                                            <option value="openai">OpenAI GPT-4o-mini</option>
                                        </>
                                    ) : (
                                        aiProvidersList.map(item => (
                                            <option key={item.id} value={item.id}>
                                                #{item.priority} {item.config.name} ({item.stored.model || item.config.model})
                                            </option>
                                        ))
                                    )}
                                </select>
                            </div>

                            <div className="ai-presets-container">
                                <button className="ai-preset-chip" onClick={() => handleAiSend('Summarize current document')}>
                                    ✨ Summarize
                                </button>
                                <button className="ai-preset-chip" onClick={() => handleAiSend('Fix grammar and polish tone')}>
                                    ✍️ Polish Grammar
                                </button>
                                <button className="ai-preset-chip" onClick={() => handleAiSend('Convert selection to bullet points')}>
                                    📝 Bullet Points
                                </button>
                                <button className="ai-preset-chip" onClick={() => handleAiSend('Expand on selected topic with detail')}>
                                    🚀 Expand Idea
                                </button>
                            </div>

                            <div className="ai-chat-history">
                                {aiMessages.map((msg, index) => (
                                    <div key={index} className={`ai-message ${msg.role}`}>
                                        <div className="ai-message-content" style={{ whiteSpace: 'pre-line' }}>{msg.text}</div>
                                        {msg.role === 'assistant' && (
                                            <div className="ai-message-actions">
                                                <button className="ai-action-btn" onClick={() => insertAiTextToEditor(msg.text)}>
                                                    <i className="fas fa-plus"></i> Insert into Note
                                                </button>
                                                <button className="ai-action-btn" onClick={() => navigator.clipboard.writeText(msg.text)}>
                                                    <i className="fas fa-copy"></i> Copy
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {aiLoading && (
                                    <div className="ai-message assistant">
                                        <div className="ai-message-content">
                                            <i className="fas fa-spinner fa-spin" style={{ marginRight: '6px' }}></i> AI is generating response...
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="ai-chat-input-bar">
                                <input
                                    type="text"
                                    placeholder={`Ask AI Assistant...`}
                                    value={aiPrompt}
                                    onChange={(e) => setAiPrompt(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAiSend()}
                                />
                                <button className="notebook-btn notebook-btn-primary" onClick={() => handleAiSend()}>
                                    <i className="fas fa-paper-plane"></i>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Status Bar */}
                <footer className="notebook-status-bar">
                    <div className="status-item"><i className="fas fa-file-text"></i> Words: {stats.words}</div>
                    <div className="status-item"><i className="fas fa-font"></i> Chars: {stats.chars}</div>
                    <div className="status-item"><i className="fas fa-paragraph"></i> Paragraphs: {stats.paragraphs}</div>
                    <div className="status-item"><i className="fas fa-clock"></i> {stats.readingTime} min read</div>
                    <div className="status-item margin-left-auto">
                        <span className={`save-badge ${saveStatus}`}>{saveStatus === 'saving' ? 'Saving...' : 'All Changes Saved'}</span>
                    </div>
                </footer>
            </div>
        </AppShell>
    );
}
