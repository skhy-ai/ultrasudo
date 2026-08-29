import React, { useState, useEffect, useRef, useCallback } from 'react';
import AppShell from '../../../components/shared/AppShell/AppShell';
import './Notebook.css';

const DEFAULT_DOC_TITLE = 'Untitled Document';
const SIDES = ['top', 'right', 'bottom', 'left'];

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
    const fileInputRef = useRef(null);
    const jsonImportRef = useRef(null);

    // States
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

    // Element selection states (Image / Table)
    const [selectedImage, setSelectedImage] = useState(null);
    const [selectedTable, setSelectedTable] = useState(null);
    const [imageProps, setImageProps] = useState({ layout: 'inline', width: 100, brightness: 100, saturation: 100, hue: 0 });
    const [tableProps, setTableProps] = useState({ borderStyle: 'solid', borderWidth: 1, borderColor: '#cbd5e1' });

    // Custom Modals State
    const [activeModal, setActiveModal] = useState(null); // null | 'link' | 'image' | 'table' | 'templates'
    const [modalData, setModalData] = useState({});

    // Inject export CDNs dynamically
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
    }, []);

    // Function to calculate editor stats
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

    // Load initial document data
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
        updateStats();
    }, [updateStats]);

    // Auto-save debouncer
    const autoSaveTimeoutRef = useRef(null);
    const triggerAutoSave = useCallback(() => {
        setSaveStatus('saving');
        if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);

        autoSaveTimeoutRef.current = setTimeout(() => {
            if (editorRef.current) {
                const docObj = {
                    title: docTitle,
                    content: editorRef.current.innerHTML,
                    margins: marginState,
                    updatedAt: new Date().toISOString()
                };
                localStorage.setItem('desktop_app_notebook_doc', JSON.stringify(docObj));
                setSaveStatus('saved');
            }
        }, 1000);
    }, [docTitle, marginState]);

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
                bold,
                italic,
                underline,
                strikethrough,
                justifyLeft,
                justifyCenter,
                justifyRight,
                justifyFull,
                unorderedList,
                orderedList,
                block: blockVal.toUpperCase(),
                font: fontVal.replace(/['"]/g, ''),
                fontSize: '12',
                fontColor: '#000000',
                hiliteColor: '#ffff00'
            });
        } catch (e) {
            // queryCommandState may fail gracefully in edge cases
        }
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

    // Exec command helper
    const execCommand = (command, value = null) => {
        if (editorRef.current) editorRef.current.focus();
        document.execCommand(command, false, value);
        checkActiveFormats();
        triggerAutoSave();
    };

    // Selection handling for Image and Table properties panels
    const handleEditorClick = (e) => {
        const target = e.target;

        // Image Selection
        if (target && target.tagName === 'IMG') {
            if (selectedImage && selectedImage !== target) selectedImage.classList.remove('selected-image');
            target.classList.add('selected-image');
            setSelectedImage(target);
            
            // Read image styles
            const style = getComputedStyle(target);
            let layout = 'inline';
            if (target.classList.contains('img-block')) layout = 'block';
            else if (target.classList.contains('img-center')) layout = 'center';
            else if (target.classList.contains('img-float-left')) layout = 'float-left';
            else if (target.classList.contains('img-float-right')) layout = 'float-right';

            setImageProps({
                layout,
                width: parseInt(target.style.width, 10) || 100,
                brightness: 100,
                saturation: 100,
                hue: 0
            });
        } else {
            if (selectedImage) selectedImage.classList.remove('selected-image');
            setSelectedImage(null);
        }

        // Table Selection
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

    // Update Image properties
    const applyImageStyles = (newProps) => {
        if (!selectedImage) return;
        const updated = { ...imageProps, ...newProps };
        setImageProps(updated);

        selectedImage.classList.remove('img-block', 'img-center', 'img-float-left', 'img-float-right');
        if (updated.layout === 'block') selectedImage.classList.add('img-block');
        else if (updated.layout === 'center') selectedImage.classList.add('img-center');
        else if (updated.layout === 'float-left') selectedImage.classList.add('img-float-left');
        else if (updated.layout === 'float-right') selectedImage.classList.add('img-float-right');

        selectedImage.style.width = `${updated.width}%`;
        selectedImage.style.height = 'auto';
        selectedImage.style.filter = `brightness(${updated.brightness / 100}) saturate(${updated.saturation / 100}) hue-rotate(${updated.hue}deg)`;

        triggerAutoSave();
    };

    // Delete selected image
    const deleteSelectedImage = () => {
        if (selectedImage) {
            selectedImage.remove();
            setSelectedImage(null);
            triggerAutoSave();
        }
    };

    // Update Table properties & actions
    const applyTableStyles = (newProps) => {
        if (!selectedTable) return;
        const updated = { ...tableProps, ...newProps };
        setTableProps(updated);

        const borderCss = updated.borderStyle === 'none' ? 'none' : `${updated.borderWidth}px ${updated.borderStyle} ${updated.borderColor}`;
        selectedTable.style.border = borderCss;
        const cells = selectedTable.querySelectorAll('td, th');
        cells.forEach(c => c.style.border = borderCss);

        triggerAutoSave();
    };

    const addTableRow = (where = 'after') => {
        if (!selectedTable) return;
        const selection = window.getSelection();
        let targetRow = selection ? selection.anchorNode?.parentElement?.closest('tr') : null;
        if (!targetRow) targetRow = selectedTable.rows[selectedTable.rows.length - 1];

        const colCount = targetRow.cells.length;
        const newRow = document.createElement('tr');
        for (let i = 0; i < colCount; i++) {
            const td = document.createElement('td');
            td.innerHTML = '<br>';
            td.style.border = selectedTable.style.border || '1px solid #cbd5e1';
            td.style.padding = '10px 14px';
            newRow.appendChild(td);
        }

        if (where === 'before') targetRow.parentNode.insertBefore(newRow, targetRow);
        else targetRow.parentNode.insertBefore(newRow, targetRow.nextSibling);

        triggerAutoSave();
    };

    const addTableColumn = () => {
        if (!selectedTable) return;
        Array.from(selectedTable.rows).forEach(row => {
            const td = document.createElement('td');
            td.innerHTML = '<br>';
            td.style.border = selectedTable.style.border || '1px solid #cbd5e1';
            td.style.padding = '10px 14px';
            row.appendChild(td);
        });
        triggerAutoSave();
    };

    const deleteTable = () => {
        if (selectedTable) {
            selectedTable.remove();
            setSelectedTable(null);
            triggerAutoSave();
        }
    };

    // Modal Action Handlers
    const handleInsertLink = () => {
        if (!modalData.url) return;
        execCommand('createLink', modalData.url);
        setActiveModal(null);
        setModalData({});
    };

    const handleInsertImage = () => {
        if (modalData.file) {
            const reader = new FileReader();
            reader.onload = () => {
                execCommand('insertImage', reader.result);
                setActiveModal(null);
                setModalData({});
            };
            reader.readAsDataURL(modalData.file);
        } else if (modalData.url) {
            execCommand('insertImage', modalData.url);
            setActiveModal(null);
            setModalData({});
        }
    };

    const handleInsertTable = () => {
        const rows = parseInt(modalData.rows || 3, 10);
        const cols = parseInt(modalData.cols || 3, 10);
        if (rows > 0 && cols > 0) {
            let html = '<table class="nb-table" style="width:100%; border-collapse:collapse; margin:16px 0;">';
            for (let r = 0; r < rows; r++) {
                html += '<tr>';
                for (let c = 0; c < cols; c++) {
                    html += `<td style="border:1px solid #cbd5e1; padding:10px 14px;"><br></td>`;
                }
                html += '</tr>';
            }
            html += '</table><p><br></p>';
            execCommand('insertHTML', html);
        }
        setActiveModal(null);
        setModalData({});
    };

    const loadTemplate = (key) => {
        if (!TEMPLATES[key] || !editorRef.current) return;
        if (editorRef.current.innerText.trim() && !window.confirm('Replace current content with template?')) return;
        setDocTitle(TEMPLATES[key].title);
        editorRef.current.innerHTML = TEMPLATES[key].content;
        updateStats();
        triggerAutoSave();
        setActiveModal(null);
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

    const exportHtml = () => {
        const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${docTitle}</title><style>body{font-family:sans-serif;padding:40px;line-height:1.6;}table{border-collapse:collapse;width:100%;}td,th{border:1px solid #ccc;padding:8px;}</style></head><body>${editorRef.current.innerHTML}</body></html>`;
        const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${docTitle.replace(/\s+/g, '_')}.html`;
        a.click();
    };

    const exportTxt = () => {
        const text = editorRef.current ? editorRef.current.innerText : '';
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8;' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${docTitle.replace(/\s+/g, '_')}.txt`;
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

    // Calculate margins in CSS units for paper view
    const paperPadding = `${marginState.top}${marginState.unit} ${marginState.right}${marginState.unit} ${marginState.bottom}${marginState.unit} ${marginState.left}${marginState.unit}`;

    return (
        <AppShell title="Notebook" icon="fas fa-book">
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
                        <button className="notebook-btn" onClick={() => setActiveModal('templates')}>
                            <i className="fas fa-layer-group"></i> Templates
                        </button>
                        <button className="notebook-btn" onClick={() => jsonImportRef.current.click()}>
                            <i className="fas fa-file-import"></i> Import
                        </button>
                        <input type="file" ref={jsonImportRef} accept=".json" onChange={handleImportJson} hidden />

                        <div className="dropdown-container">
                            <button className="notebook-btn notebook-btn-primary" onClick={exportPdf}>
                                <i className="fas fa-file-pdf"></i> Export PDF
                            </button>
                        </div>
                        <button className="notebook-btn" onClick={exportDocx} title="Export Word DOCX">
                            <i className="fas fa-file-word"></i> DOCX
                        </button>
                        <button className="notebook-btn" onClick={exportJson} title="Backup JSON">
                            <i className="fas fa-download"></i> Backup
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

                            <label className="color-picker-label" title="Text Color">
                                <i className="fas fa-font"></i>
                                <span className="color-indicator-bar" style={{ background: activeFormats.fontColor }}></span>
                                <input
                                    type="color"
                                    onChange={(e) => execCommand('foreColor', e.target.value)}
                                />
                            </label>

                            <label className="color-picker-label" title="Highlight Color">
                                <i className="fas fa-highlighter"></i>
                                <span className="color-indicator-bar" style={{ background: '#ffff00' }}></span>
                                <input
                                    type="color"
                                    defaultValue="#ffff00"
                                    onChange={(e) => execCommand('hiliteColor', e.target.value)}
                                />
                            </label>
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
                                className={`toolbar-btn ${activeFormats.justifyFull ? 'active' : ''}`}
                                onClick={() => execCommand('justifyFull')}
                                title="Justify"
                            >
                                <i className="fas fa-align-justify"></i>
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

                        {/* Inserts (Link, Image, Table, Page Break) */}
                        <div className="toolbar-group">
                            <button className="toolbar-btn" onClick={() => setActiveModal('link')} title="Insert Hyperlink">
                                <i className="fas fa-link"></i>
                            </button>
                            <button className="toolbar-btn" onClick={() => execCommand('unlink')} title="Remove Hyperlink">
                                <i className="fas fa-link-slash"></i>
                            </button>
                            <button className="toolbar-btn" onClick={() => setActiveModal('image')} title="Insert Image">
                                <i className="fas fa-image"></i>
                            </button>
                            <button className="toolbar-btn" onClick={() => setActiveModal('table')} title="Insert Table">
                                <i className="fas fa-table"></i>
                            </button>
                            <button className="toolbar-btn" onClick={() => execCommand('insertHTML', '<hr class="page-break">')} title="Insert Page Break">
                                <i className="fas fa-scissors"></i>
                            </button>
                            <button className="toolbar-btn" onClick={() => execCommand('removeFormat')} title="Clear Formatting">
                                <i className="fas fa-eraser"></i>
                            </button>
                        </div>

                        {/* Page Margins Dropdown (Scoped Relative) */}
                        <div className="toolbar-group">
                            <button
                                className={`toolbar-btn ${marginMenuOpen ? 'active' : ''}`}
                                onClick={() => setMarginMenuOpen(!marginMenuOpen)}
                                title="Page Margins"
                            >
                                <i className="fas fa-ruler-combined"></i>
                            </button>

                            {marginMenuOpen && (
                                <div className="margin-dropdown-panel">
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

                {/* Workspace Paper View */}
                <div className="notebook-canvas-scroll" onClick={() => setMarginMenuOpen(false)}>
                    <div className="notebook-paper-outer" ref={paperRef}>
                        {/* Interactive Ruler Header */}
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

                        {/* Margin Line Guides */}
                        <div className="paper-margin-overlay">
                            <div className="margin-line-v" style={{ left: `${marginState.left}${marginState.unit}` }}></div>
                            <div className="margin-line-v" style={{ right: `${marginState.right}${marginState.unit}` }}></div>
                            <div className="margin-line-h" style={{ top: `${marginState.top}${marginState.unit}` }}></div>
                            <div className="margin-line-h" style={{ bottom: `${marginState.bottom}${marginState.unit}` }}></div>
                        </div>

                        {/* Rich Text Editable Area */}
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
                            <p>Start writing your notes, documents, or reports with rich text formatting, interactive tables, images, and high-fidelity PDF/DOCX exports.</p>
                        </div>
                    </div>
                </div>

                {/* Selected Image Floating Properties Panel */}
                {selectedImage && (
                    <div className="floating-props-panel">
                        <div className="floating-props-header">
                            <span><i className="fas fa-image"></i> Image Properties</span>
                            <button className="floating-props-close" onClick={() => setSelectedImage(null)}>×</button>
                        </div>
                        <div className="floating-props-body">
                            <div className="props-row">
                                <label>Layout</label>
                                <select
                                    className="toolbar-select"
                                    style={{ width: '100%' }}
                                    value={imageProps.layout}
                                    onChange={(e) => applyImageStyles({ layout: e.target.value })}
                                >
                                    <option value="inline">Inline</option>
                                    <option value="block">Break Text</option>
                                    <option value="center">Center</option>
                                    <option value="float-left">Float Left</option>
                                    <option value="float-right">Float Right</option>
                                </select>
                            </div>
                            <div className="props-row">
                                <label>Width ({imageProps.width}%)</label>
                                <input
                                    type="range"
                                    min="10"
                                    max="100"
                                    value={imageProps.width}
                                    onChange={(e) => applyImageStyles({ width: parseInt(e.target.value, 10) })}
                                />
                            </div>
                            <div className="props-row">
                                <label>Brightness ({imageProps.brightness}%)</label>
                                <input
                                    type="range"
                                    min="0"
                                    max="200"
                                    value={imageProps.brightness}
                                    onChange={(e) => applyImageStyles({ brightness: parseInt(e.target.value, 10) })}
                                />
                            </div>
                            <button className="notebook-btn notebook-btn-danger" onClick={deleteSelectedImage} style={{ marginTop: '8px' }}>
                                <i className="fas fa-trash"></i> Remove Image
                            </button>
                        </div>
                    </div>
                )}

                {/* Selected Table Floating Tools Panel */}
                {selectedTable && (
                    <div className="floating-props-panel">
                        <div className="floating-props-header">
                            <span><i className="fas fa-table"></i> Table Tools</span>
                            <button className="floating-props-close" onClick={() => setSelectedTable(null)}>×</button>
                        </div>
                        <div className="floating-props-body">
                            <div className="table-quick-actions">
                                <button className="table-action-btn" onClick={() => addTableRow('after')}>+ Row Below</button>
                                <button className="table-action-btn" onClick={() => addTableRow('before')}>+ Row Above</button>
                                <button className="table-action-btn" onClick={addTableColumn}>+ Column</button>
                                <button className="table-action-btn" onClick={deleteTable} style={{ color: '#ef4444' }}>Delete Table</button>
                            </div>
                            <div className="props-row" style={{ marginTop: '6px' }}>
                                <label>Border Style</label>
                                <select
                                    className="toolbar-select"
                                    style={{ width: '100%' }}
                                    value={tableProps.borderStyle}
                                    onChange={(e) => applyTableStyles({ borderStyle: e.target.value })}
                                >
                                    <option value="solid">Solid</option>
                                    <option value="dashed">Dashed</option>
                                    <option value="dotted">Dotted</option>
                                    <option value="none">None</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* Custom Modals */}
                {activeModal === 'link' && (
                    <div className="notebook-modal-overlay" onClick={() => setActiveModal(null)}>
                        <div className="notebook-modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="notebook-modal-header">
                                <h3>Insert Hyperlink</h3>
                                <button className="floating-props-close" onClick={() => setActiveModal(null)}>×</button>
                            </div>
                            <div className="notebook-modal-body">
                                <div className="notebook-field">
                                    <label>URL Address</label>
                                    <input
                                        type="url"
                                        placeholder="https://example.com"
                                        value={modalData.url || ''}
                                        onChange={(e) => setModalData({ ...modalData, url: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="notebook-modal-footer">
                                <button className="notebook-btn" onClick={() => setActiveModal(null)}>Cancel</button>
                                <button className="notebook-btn notebook-btn-primary" onClick={handleInsertLink}>Insert Link</button>
                            </div>
                        </div>
                    </div>
                )}

                {activeModal === 'image' && (
                    <div className="notebook-modal-overlay" onClick={() => setActiveModal(null)}>
                        <div className="notebook-modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="notebook-modal-header">
                                <h3>Insert Image</h3>
                                <button className="floating-props-close" onClick={() => setActiveModal(null)}>×</button>
                            </div>
                            <div className="notebook-modal-body">
                                <div className="notebook-field">
                                    <label>Image Web URL</label>
                                    <input
                                        type="url"
                                        placeholder="https://images.unsplash.com/..."
                                        value={modalData.url || ''}
                                        onChange={(e) => setModalData({ ...modalData, url: e.target.value })}
                                    />
                                </div>
                                <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>— OR —</div>
                                <div className="notebook-field">
                                    <label>Upload Image File</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setModalData({ ...modalData, file: e.target.files[0] })}
                                    />
                                </div>
                            </div>
                            <div className="notebook-modal-footer">
                                <button className="notebook-btn" onClick={() => setActiveModal(null)}>Cancel</button>
                                <button className="notebook-btn notebook-btn-primary" onClick={handleInsertImage}>Insert Image</button>
                            </div>
                        </div>
                    </div>
                )}

                {activeModal === 'table' && (
                    <div className="notebook-modal-overlay" onClick={() => setActiveModal(null)}>
                        <div className="notebook-modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="notebook-modal-header">
                                <h3>Insert Table</h3>
                                <button className="floating-props-close" onClick={() => setActiveModal(null)}>×</button>
                            </div>
                            <div className="notebook-modal-body">
                                <div className="notebook-field">
                                    <label>Number of Rows</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="20"
                                        defaultValue="3"
                                        onChange={(e) => setModalData({ ...modalData, rows: e.target.value })}
                                    />
                                </div>
                                <div className="notebook-field">
                                    <label>Number of Columns</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="10"
                                        defaultValue="3"
                                        onChange={(e) => setModalData({ ...modalData, cols: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="notebook-modal-footer">
                                <button className="notebook-btn" onClick={() => setActiveModal(null)}>Cancel</button>
                                <button className="notebook-btn notebook-btn-primary" onClick={handleInsertTable}>Insert Table</button>
                            </div>
                        </div>
                    </div>
                )}

                {activeModal === 'templates' && (
                    <div className="notebook-modal-overlay" onClick={() => setActiveModal(null)}>
                        <div className="notebook-modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="notebook-modal-header">
                                <h3>Document Templates</h3>
                                <button className="floating-props-close" onClick={() => setActiveModal(null)}>×</button>
                            </div>
                            <div className="notebook-modal-body">
                                <div className="table-quick-actions" style={{ gridTemplateColumns: '1fr', gap: '10px' }}>
                                    <button className="notebook-btn" onClick={() => loadTemplate('blank')}>
                                        <i className="fas fa-file"></i> Blank Document
                                    </button>
                                    <button className="notebook-btn" onClick={() => loadTemplate('meeting')}>
                                        <i className="fas fa-users"></i> Meeting Notes Template
                                    </button>
                                    <button className="notebook-btn" onClick={() => loadTemplate('proposal')}>
                                        <i className="fas fa-briefcase"></i> Project Proposal Template
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer Live Metrics Status Bar */}
                <div className="notebook-status-bar">
                    <div className="status-stats-group">
                        <span className="status-stat-item">
                            Words: <span className="status-stat-value">{stats.words}</span>
                        </span>
                        <span className="status-stat-item">
                            Characters: <span className="status-stat-value">{stats.chars}</span>
                        </span>
                        <span className="status-stat-item">
                            Reading time: <span className="status-stat-value">~{stats.readingTime} min</span>
                        </span>
                    </div>

                    <div className="status-stats-group">
                        {saveStatus === 'saved' ? (
                            <span className="status-badge">
                                <i className="fas fa-circle-check"></i> Saved automatically
                            </span>
                        ) : (
                            <span className="status-badge saving">
                                <i className="fas fa-sync fa-spin"></i> Saving...
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </AppShell>
    );
}
