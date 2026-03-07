import React, { useEffect, useRef } from 'react';
import './Notebook.css';

export default function Notebook() {
    const containerRef = useRef(null);

    useEffect(() => {
        // Inject CDNs for exporting
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

        const doc = containerRef.current;
        if (!doc) return;

        const editor = doc.querySelector('#editor');
        if (!editor) return;

        const commandButtons = Array.from(doc.querySelectorAll('.toolbar button[data-command]'));
        const actionButtons = Array.from(doc.querySelectorAll('.toolbar button[data-action]'));
        const blockSelect = doc.querySelector('#format-block');
        const fontFamilySelect = doc.querySelector('#font-family');
        const fontSizeSelect = doc.querySelector('#font-size');
        const fontColorInput = doc.querySelector('#font-color');
        const highlightColorInput = doc.querySelector('#highlight-color');
        const imageUploadInput = doc.querySelector('#image-upload');
        const marginUnitSelect = doc.querySelector('#margin-unit');
        const marginInputs = Array.from(doc.querySelectorAll('.margin-controls input[data-margin]'));
        const marginMenuButton = doc.querySelector('#margin-menu-button');
        const marginMenu = doc.querySelector('#margin-menu');
        const resetMarginsBtn = doc.querySelector('#reset-margins');
        const pageSizeSelect = doc.querySelector('#page-size');
        const pageOrientationSelect = doc.querySelector('#page-orientation');
        
        const imagePanel = doc.querySelector('#image-properties-panel');
        const closeImagePanelBtn = doc.querySelector('#close-image-panel');
        const imageLayoutSelect = doc.querySelector('#image-layout');
        const imageWidthRange = doc.querySelector('#image-width');
        const imageBrightnessRange = doc.querySelector('#image-brightness');
        const imageSaturationRange = doc.querySelector('#image-saturation');
        const imageHueRange = doc.querySelector('#image-hue');

        const tablePanel = doc.querySelector('#table-properties-panel');
        const closeTablePanelBtn = doc.querySelector('#close-table-panel');
        const tableBorderStyleSelect = doc.querySelector('#table-border-style');
        const tableBorderWidthRange = doc.querySelector('#table-border-width');
        const tableBorderColorInput = doc.querySelector('#table-border-color');

        const DEFAULT_MARGIN = 2;
        const sides = ['top', 'right', 'bottom', 'left'];
        let selectedImage = null;
        let selectedTable = null;

        const marginState = {
            unit: marginUnitSelect ? marginUnitSelect.value : 'cm',
            values: sides.reduce((acc, side) => {
                const input = marginInputs.find((el) => el.dataset.margin === side);
                const parsed = input ? parseFloat(input.value) : NaN;
                acc[side] = Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_MARGIN;
                if (input) input.value = acc[side];
                return acc;
            }, {})
        };

        function focusEditor() { editor.focus({ preventScroll: false }); }
        function exec(command, value = null) {
            focusEditor();
            document.execCommand(command, false, value);
        }

        function applyMargins() {
            const unit = marginState.unit;
            sides.forEach((side) => {
                const cssValue = `${marginState.values[side]}${unit}`;
                editor.style.setProperty(`--margin-${side}`, cssValue);
            });
            editor.style.padding = `${marginState.values.top}${unit} ${marginState.values.right}${unit} ${marginState.values.bottom}${unit} ${marginState.values.left}${unit}`;
        }

        function convertMarginValue(value, fromUnit, toUnit) {
            if (fromUnit === toUnit) return value;
            if (fromUnit === 'cm' && toUnit === 'in') return value / 2.54;
            if (fromUnit === 'in' && toUnit === 'cm') return value * 2.54;
            return value;
        }

        function roundMargin(value) { return Math.round(value * 100) / 100; }

        function handleMarginInput(event) {
            const side = event.target.dataset.margin;
            const nextValue = parseFloat(event.target.value);
            if (!sides.includes(side)) return;
            if (!Number.isFinite(nextValue) || nextValue < 0) {
                event.target.value = marginState.values[side];
                return;
            }
            marginState.values[side] = nextValue;
            applyMargins();
        }

        marginInputs.forEach((input) => {
            input.addEventListener('change', handleMarginInput);
            input.addEventListener('blur', handleMarginInput);
        });

        if (marginUnitSelect) {
            marginUnitSelect.addEventListener('change', (event) => {
                const newUnit = event.target.value;
                sides.forEach((side) => {
                    const converted = convertMarginValue(marginState.values[side], marginState.unit, newUnit);
                    marginState.values[side] = roundMargin(converted);
                    const input = marginInputs.find((el) => el.dataset.margin === side);
                    if (input) input.value = marginState.values[side];
                });
                marginState.unit = newUnit;
                applyMargins();
            });
        }

        function handleCommand(command) { exec(command); }
        commandButtons.forEach((button) => {
            button.addEventListener('click', () => handleCommand(button.dataset.command));
        });

        function promptForLink() {
            const selection = document.getSelection();
            if (!selection || selection.isCollapsed) { alert('Please select the text you want to link.'); return; }
            const url = prompt('Enter the hyperlink URL:', 'https://');
            if (!url) return;
            exec('createLink', url);
        }

        function promptForImageUrl() {
            const url = prompt('Enter the image URL:');
            if (!url) return;
            exec('insertImage', url);
        }

        function handleImageUpload(event) {
            const file = event.target.files && event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => { exec('insertImage', reader.result); };
            reader.readAsDataURL(file);
            event.target.value = '';
        }

        function insertTable() {
            const rows = parseInt(prompt('Number of rows?', '2'), 10);
            const cols = parseInt(prompt('Number of columns?', '2'), 10);
            if (!Number.isFinite(rows) || !Number.isFinite(cols) || rows <= 0 || cols <= 0) return;
            let tableHtml = '<table class="nb-table">';
            for (let r = 0; r < rows; r++) {
                tableHtml += '<tr>';
                for (let c = 0; c < cols; c++) { tableHtml += '<td><br></td>'; }
                tableHtml += '</tr>';
            }
            tableHtml += '</table><p><br></p>';
            focusEditor();
            document.execCommand('insertHTML', false, tableHtml);
        }

        function clearFormatting() {
            exec('removeFormat');
            exec('unlink');
        }

        actionButtons.forEach((button) => {
            button.addEventListener('click', () => {
                const action = button.dataset.action;
                switch (action) {
                    case 'createLink': promptForLink(); break;
                    case 'insertImageUrl': promptForImageUrl(); break;
                    case 'insertImageUpload': if (imageUploadInput) imageUploadInput.click(); break;
                    case 'insertTable': insertTable(); break;
                    case 'clearFormatting': clearFormatting(); break;
                    case 'insertPageBreak': exec('insertHTML', '<hr class="page-break">'); break;
                    default: break;
                }
            });
        });

        if (imageUploadInput) imageUploadInput.addEventListener('change', handleImageUpload);

        function openImagePanel(img) {
            if (!imagePanel) return;
            imagePanel.classList.remove('hidden');
            imagePanel.setAttribute('aria-hidden', 'false');
            const widthPct = Math.round((img.naturalWidth && img.width) ? (img.width / img.parentElement.clientWidth) * 100 : 100);
            if (imageWidthRange) imageWidthRange.value = Math.max(10, Math.min(100, widthPct || 100));
            
            const style = getComputedStyle(img);
            const filter = style.filter || '';
            const bMatch = /brightness\(([^)]+)\)/.exec(filter);
            const sMatch = /saturate\(([^)]+)\)/.exec(filter);
            const hMatch = /hue-rotate\(([^)]+)\)/.exec(filter);
            if (imageBrightnessRange) imageBrightnessRange.value = bMatch ? Math.round(parseFloat(bMatch[1]) * 100) : 100;
            if (imageSaturationRange) imageSaturationRange.value = sMatch ? Math.round(parseFloat(sMatch[1]) * 100) : 100;
            if (imageHueRange) imageHueRange.value = hMatch ? parseInt(hMatch[1], 10) : 0;
            
            if (imageLayoutSelect) {
                if (img.classList.contains('img-float-left')) imageLayoutSelect.value = 'float-left';
                else if (img.classList.contains('img-float-right')) imageLayoutSelect.value = 'float-right';
                else if (img.classList.contains('img-center')) imageLayoutSelect.value = 'center';
                else if (img.classList.contains('img-block')) imageLayoutSelect.value = 'block';
                else imageLayoutSelect.value = 'inline';
            }
        }

        function closeImagePanel() {
            if (!imagePanel) return;
            imagePanel.classList.add('hidden');
            imagePanel.setAttribute('aria-hidden', 'true');
        }

        function selectImage(img) {
            if (selectedImage && selectedImage !== img) selectedImage.classList.remove('selected-image');
            selectedImage = img;
            selectedImage.classList.add('selected-image');
            openImagePanel(selectedImage);
        }

        function getParentTable(el) {
            while (el && el !== editor) {
                if (el.tagName === 'TABLE') return el;
                el = el.parentElement;
            }
            return null;
        }

        function openTablePanel(table) {
            if (!tablePanel) return;
            tablePanel.classList.remove('hidden');
            tablePanel.setAttribute('aria-hidden', 'false');
            const style = getComputedStyle(table);
            const borderStyle = style.borderStyle || 'solid';
            const borderWidth = parseInt(style.borderWidth || '1', 10);
            function rgbToHex(rgb) {
                const m = rgb.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
                if (m) return "#" + ("0" + parseInt(m[1], 10).toString(16)).slice(-2) + ("0" + parseInt(m[2], 10).toString(16)).slice(-2) + ("0" + parseInt(m[3], 10).toString(16)).slice(-2);
                return rgb;
            }
            const borderColor = rgbToHex(style.borderColor || '#666666');
            if (tableBorderStyleSelect) tableBorderStyleSelect.value = borderStyle === 'none' ? 'none' : borderStyle;
            if (tableBorderWidthRange) tableBorderWidthRange.value = Math.max(1, Math.min(10, borderWidth || 1));
            if (tableBorderColorInput) tableBorderColorInput.value = borderColor;
        }

        function closeTablePanel() {
            if (!tablePanel) return;
            tablePanel.classList.add('hidden');
            tablePanel.setAttribute('aria-hidden', 'true');
        }

        function selectTable(table) {
            if (selectedTable && selectedTable !== table) selectedTable.style.boxShadow = '';
            selectedTable = table;
            selectedTable.style.boxShadow = '0 0 0 3px rgba(111, 221, 144, 0.4)';
            openTablePanel(selectedTable);
        }

        function applyTableStyles() {
            if (!selectedTable) return;
            const style = tableBorderStyleSelect ? tableBorderStyleSelect.value : 'solid';
            const width = tableBorderWidthRange ? parseInt(tableBorderWidthRange.value || '1', 10) : 1;
            const color = tableBorderColorInput ? tableBorderColorInput.value : '#666666';
            selectedTable.style.border = style === 'none' ? 'none' : `${width}px ${style} ${color}`;
            const cells = selectedTable.querySelectorAll('th, td');
            cells.forEach(cell => { cell.style.border = selectedTable.style.border; });
        }

        if (tableBorderStyleSelect) tableBorderStyleSelect.addEventListener('change', applyTableStyles);
        if (tableBorderWidthRange) tableBorderWidthRange.addEventListener('input', applyTableStyles);
        if (tableBorderColorInput) tableBorderColorInput.addEventListener('input', applyTableStyles);

        if (closeTablePanelBtn) {
            closeTablePanelBtn.addEventListener('click', () => {
                if (selectedTable) selectedTable.style.boxShadow = '';
                selectedTable = null;
                closeTablePanel();
            });
        }

        editor.addEventListener('click', (e) => {
            const t = e.target;
            if (t && t.tagName === 'IMG') {
                selectImage(t);
                if (selectedTable) { selectedTable.style.boxShadow = ''; selectedTable = null; closeTablePanel(); }
            } else if (!imagePanel || !imagePanel.contains(t)) {
                if (selectedImage) selectedImage.classList.remove('selected-image');
                selectedImage = null;
                closeImagePanel();
            }

            const tableEl = getParentTable(t);
            if (tableEl) {
                selectTable(tableEl);
                if (selectedImage) { selectedImage.classList.remove('selected-image'); selectedImage = null; closeImagePanel(); }
            } else if (!tablePanel || !tablePanel.contains(t)) {
                if (selectedTable) selectedTable.style.boxShadow = '';
                selectedTable = null;
                closeTablePanel();
            }
        });

        if (closeImagePanelBtn) {
            closeImagePanelBtn.addEventListener('click', () => {
                if (selectedImage) selectedImage.classList.remove('selected-image');
                selectedImage = null;
                closeImagePanel();
            });
        }

        function applyImageFilters() {
            if (!selectedImage) return;
            const b = imageBrightnessRange ? parseInt(imageBrightnessRange.value || '100', 10) : 100;
            const s = imageSaturationRange ? parseInt(imageSaturationRange.value || '100', 10) : 100;
            const h = imageHueRange ? parseInt(imageHueRange.value || '0', 10) : 0;
            selectedImage.style.filter = `brightness(${b / 100}) saturate(${s / 100}) hue-rotate(${h}deg)`;
        }

        if (imageLayoutSelect) {
            imageLayoutSelect.addEventListener('change', (e) => {
                if (!selectedImage) return;
                selectedImage.classList.remove('img-block', 'img-center', 'img-float-left', 'img-float-right');
                const val = e.target.value;
                if(val === 'block') selectedImage.classList.add('img-block');
                else if(val === 'center') selectedImage.classList.add('img-center');
                else if(val === 'float-left') selectedImage.classList.add('img-float-left');
                else if(val === 'float-right') selectedImage.classList.add('img-float-right');
            });
        }
        if (imageWidthRange) {
            imageWidthRange.addEventListener('input', (e) => {
                if (!selectedImage) return;
                const pct = Math.max(10, Math.min(100, parseInt(e.target.value, 10) || 100));
                selectedImage.style.width = pct + '%';
                selectedImage.style.height = 'auto';
            });
        }
        if (imageBrightnessRange) imageBrightnessRange.addEventListener('input', applyImageFilters);
        if (imageSaturationRange) imageSaturationRange.addEventListener('input', applyImageFilters);
        if (imageHueRange) imageHueRange.addEventListener('input', applyImageFilters);

        function setMarginMenuOpen(isOpen) {
            if (!marginMenu || !marginMenuButton) return;
            marginMenu.classList.toggle('active', isOpen);
            marginMenu.setAttribute('aria-hidden', String(!isOpen));
            marginMenuButton.setAttribute('aria-expanded', String(isOpen));
        }

        if (marginMenuButton && marginMenu) {
            setMarginMenuOpen(false);
            marginMenuButton.addEventListener('click', (e) => {
                e.stopPropagation();
                setMarginMenuOpen(!(marginMenu.classList.contains('active')));
            });
            document.addEventListener('click', (e) => {
                if (!marginMenu.classList.contains('active')) return;
                if (!marginMenu.contains(e.target) && !marginMenuButton.contains(e.target)) setMarginMenuOpen(false);
            });
        }

        if (resetMarginsBtn) {
            resetMarginsBtn.addEventListener('click', () => {
                marginState.unit = marginUnitSelect ? marginUnitSelect.value : 'cm';
                sides.forEach((side) => {
                    marginState.values[side] = DEFAULT_MARGIN;
                    const input = marginInputs.find((el) => el.dataset.margin === side);
                    if (input) input.value = DEFAULT_MARGIN;
                });
                applyMargins();
            });
        }

        if (blockSelect) {
            blockSelect.addEventListener('change', (event) => {
                const value = event.target.value;
                focusEditor();
                if (value === 'BLOCKQUOTE') document.execCommand('formatBlock', false, 'blockquote');
                else if (value === 'PRE') document.execCommand('formatBlock', false, 'pre');
                else document.execCommand('formatBlock', false, value);
            });
        }

        if (fontFamilySelect) fontFamilySelect.addEventListener('change', (event) => exec('fontName', event.target.value));
        const fontSizeMap = { '10': 2, '12': 3, '14': 4, '16': 5, '18': 5, '24': 6, '32': 7 };
        if (fontSizeSelect) fontSizeSelect.addEventListener('change', (event) => exec('fontSize', fontSizeMap[event.target.value] || 3));
        if (fontColorInput) fontColorInput.addEventListener('input', (event) => exec('foreColor', event.target.value));
        if (highlightColorInput) highlightColorInput.addEventListener('input', (event) => {
            const color = event.target.value || '#ffff00';
            if (!document.execCommand('hiliteColor', false, color)) exec('backColor', color);
        });

        // Serialization & Save/Load
        const loadInitialData = () => {
            const dataStr = localStorage.getItem("desktop_app_notebook_doc");
            if (dataStr) {
                try {
                    const data = JSON.parse(dataStr);
                    editor.innerHTML = data.content || '';
                    if (doc.querySelector('#document-title')) {
                        doc.querySelector('#document-title').value = data.title || '';
                    }
                } catch(e) {}
            }
        };
        
        loadInitialData();

        const saveInterval = setInterval(() => {
            const title = doc.querySelector('#document-title')?.value || 'Untitled document';
            const html = editor.innerHTML;
            localStorage.setItem("desktop_app_notebook_doc", JSON.stringify({ title, content: html }));
        }, 3000);

        // Export handles
        const docxButton = doc.querySelector('#download-docx');
        if (docxButton) {
            docxButton.addEventListener('click', () => {
                if (!window.htmlDocx || !window.htmlDocx.asBlob) { alert('DOCX plugin loading...'); return; }
                const html = `<!DOCTYPE html><html><body>${editor.innerHTML}</body></html>`;
                const blob = window.htmlDocx.asBlob(html);
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `notebook.docx`;
                link.click();
            });
        }

        const pdfButton = doc.querySelector('#download-pdf');
        if (pdfButton) {
            pdfButton.addEventListener('click', () => {
                if (typeof window.html2pdf !== 'function') { alert('PDF plugin loading...'); return; }
                const tempContainer = document.createElement('div');
                tempContainer.innerHTML = editor.innerHTML;
                window.html2pdf().from(tempContainer).save('notebook.pdf');
            });
        }

        applyMargins();

        return () => { clearInterval(saveInterval); };
    }, []);

    return (
        <div className="notebook-app-wrapper" ref={containerRef}>
            <div className="container">
                <h1>Notebook</h1>
                <div className="document-header">
                    <label htmlFor="document-title">Document Title</label>
                    <input id="document-title" type="text" placeholder="Untitled document" autoComplete="off" />
                </div>
                
                <div className="toolbar" role="toolbar" aria-label="Notebook formatting options">
                    <div className="toolbar-group">
                        <button type="button" data-command="undo" title="Undo"><span className="icon-text">↺</span></button>
                        <button type="button" data-command="redo" title="Redo"><span className="icon-text">↻</span></button>
                    </div>
                    <div className="toolbar-group">
                        <select id="format-block" title="Text Style">
                            <option value="P">Paragraph</option>
                            <option value="H1">Heading 1</option>
                            <option value="H2">Heading 2</option>
                            <option value="H3">Heading 3</option>
                            <option value="BLOCKQUOTE">Quote</option>
                            <option value="PRE">Code Block</option>
                        </select>
                        <select id="font-family" title="Font Family">
                            <option value="Arial">Arial</option>
                            <option value="Times New Roman">Times New Roman</option>
                            <option value="Georgia">Georgia</option>
                            <option value="Verdana">Verdana</option>
                            <option value="Courier New">Courier New</option>
                        </select>
                        <select id="font-size" title="Font Size" defaultValue="12">
                            <option value="10">10</option>
                            <option value="12">12</option>
                            <option value="14">14</option>
                            <option value="16">16</option>
                            <option value="18">18</option>
                            <option value="24">24</option>
                            <option value="32">32</option>
                        </select>
                    </div>
                    <div className="toolbar-group">
                        <button type="button" data-command="bold" title="Bold"><span className="icon-text">B</span></button>
                        <button type="button" data-command="italic" title="Italic"><span className="icon-text">I</span></button>
                        <button type="button" data-command="underline" title="Underline"><span className="icon-text">U</span></button>
                        <button type="button" data-command="strikeThrough" title="Strikethrough"><span className="icon-text">S̶</span></button>
                        <label className="color-control" title="Text Color">
                            <span className="icon-text">A</span>
                            <input id="font-color" type="color" defaultValue="#000000" />
                        </label>
                        <label className="color-control" title="Highlight">
                            <span className="icon-text">HL</span>
                            <input id="highlight-color" type="color" defaultValue="#ffff00" />
                        </label>
                    </div>
                    <div className="toolbar-group">
                        <button type="button" data-command="justifyLeft" title="Align Left"><span className="icon-text">L</span></button>
                        <button type="button" data-command="justifyCenter" title="Align Center"><span className="icon-text">C</span></button>
                        <button type="button" data-command="justifyRight" title="Align Right"><span className="icon-text">R</span></button>
                        <button type="button" data-command="justifyFull" title="Justify"><span className="icon-text">J</span></button>
                        <button type="button" data-command="insertUnorderedList" title="Bulleted List"><span className="icon-text">•</span></button>
                        <button type="button" data-command="insertOrderedList" title="Numbered List"><span className="icon-text">1.</span></button>
                    </div>
                    <div className="toolbar-group">
                        <button type="button" data-action="createLink" title="Insert Link"><span className="icon-text">🔗</span></button>
                        <button type="button" data-command="unlink" title="Remove Link"><span className="icon-text">✕</span></button>
                        <button type="button" data-action="insertImageUrl" title="Insert Image from URL"><span className="icon-text">🖼</span></button>
                        <button type="button" data-action="insertImageUpload" title="Insert Image from Device"><span className="icon-text">📁</span></button>
                        <button type="button" data-action="insertTable" title="Insert Table"><span className="icon-text">╬</span></button>
                        <button type="button" data-action="clearFormatting" title="Clear Formatting"><span className="icon-text">⌫</span></button>
                    </div>
                    <div className="toolbar-group margin-group">
                        <button type="button" id="margin-menu-button" className="icon-button" title="Page Margins">
                            <svg className="icon-svg" viewBox="0 0 24 24">
                                <rect x="3" y="3" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" />
                                <line x1="7" y1="3" x2="7" y2="21" stroke="currentColor" strokeWidth="1" />
                                <line x1="17" y1="3" x2="17" y2="21" stroke="currentColor" strokeWidth="1" />
                            </svg>
                        </button>
                        <div id="margin-menu" className="dropdown-panel">
                            <div className="dropdown-row">
                                <label>Unit</label>
                                <select id="margin-unit">
                                    <option value="cm">cm</option>
                                    <option value="in">inches</option>
                                </select>
                            </div>
                            <div className="dropdown-grid margin-controls">
                                <label>Top</label><input id="margin-top" data-margin="top" type="number" step="0.1" defaultValue="2" />
                                <label>Right</label><input id="margin-right" data-margin="right" type="number" step="0.1" defaultValue="2" />
                                <label>Bottom</label><input id="margin-bottom" data-margin="bottom" type="number" step="0.1" defaultValue="2" />
                                <label>Left</label><input id="margin-left" data-margin="left" type="number" step="0.1" defaultValue="2" />
                            </div>
                            <button type="button" id="reset-margins" className="secondary-button">Reset Margins</button>
                        </div>
                    </div>
                    <div className="toolbar-group toolbar-group-right">
                        <button type="button" id="download-docx" title="Download as DOCX"><span className="icon-text">DOCX</span></button>
                        <button type="button" id="download-pdf" title="Download as PDF"><span className="icon-text">PDF</span></button>
                    </div>
                </div>

                <div className="editor-shell">
                    <div className="ruler horizontal" aria-hidden="true"></div>
                    <div className="ruler vertical" aria-hidden="true"></div>
                    <div className="margin-guide margin-guide-top" aria-hidden="true"></div>
                    <div className="margin-guide margin-guide-right" aria-hidden="true"></div>
                    <div className="margin-guide margin-guide-bottom" aria-hidden="true"></div>
                    <div className="margin-guide margin-guide-left" aria-hidden="true"></div>
                    <div id="editor" contentEditable="true" aria-label="Document editor"></div>
                </div>
                <input type="file" id="image-upload" accept="image/*" hidden />

                <div id="image-properties-panel" className="image-properties-panel hidden">
                    <div className="panel-header">
                        <span>Image Properties</span>
                        <button type="button" id="close-image-panel" title="Close">×</button>
                    </div>
                    <div className="panel-body">
                        <label>Layout</label>
                        <select id="image-layout">
                            <option value="inline">Inline</option>
                            <option value="block">Break text</option>
                            <option value="center">Center</option>
                            <option value="float-left">Float left</option>
                            <option value="float-right">Float right</option>
                        </select>
                        <label>Width</label><input id="image-width" type="range" min="10" max="100" defaultValue="100" />
                        <label>Brightness</label><input id="image-brightness" type="range" min="0" max="200" defaultValue="100" />
                        <label>Saturation</label><input id="image-saturation" type="range" min="0" max="200" defaultValue="100" />
                        <label>Color Tone</label><input id="image-hue" type="range" min="0" max="360" defaultValue="0" />
                    </div>
                </div>

                <div id="table-properties-panel" className="image-properties-panel hidden">
                    <div className="panel-header">
                        <span>Table Properties</span>
                        <button type="button" id="close-table-panel" title="Close">×</button>
                    </div>
                    <div className="panel-body">
                        <label>Border Style</label>
                        <select id="table-border-style">
                            <option value="solid">Solid</option>
                            <option value="dotted">Dotted</option>
                            <option value="dashed">Dashed</option>
                            <option value="double">Double</option>
                            <option value="none">None</option>
                        </select>
                        <label>Thickness</label><input id="table-border-width" type="range" min="1" max="10" defaultValue="1" />
                        <label>Color</label><input id="table-border-color" type="color" defaultValue="#666666" style={{ width: '100%', borderRadius: '6px', height: '32px' }} />
                    </div>
                </div>
            </div>
        </div>
    );
}
