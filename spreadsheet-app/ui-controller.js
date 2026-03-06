// ui-controller.js - Handles UI interactions, modals, toolbar, and exports

import { insertRow, deleteRow, insertColumn, deleteColumn, clearCell } from './grid-controller.js';
import { updateRowNumbers, updateColumnIndices, getCellEl } from './grid-view.js';
import { updateData, data } from './data-model.js';
import { selectCell, handleKeyDown, selectedRow, selectedCol, selectedCell } from './selection-controller.js';
import { parseCellRef } from './formula-engine.js';

// Initialize context menu and event listeners
export function initContextMenu() {
    const contextMenu = document.getElementById('contextMenu');

    // Hide context menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!contextMenu.contains(e.target)) {
            contextMenu.style.display = 'none';
        }
    });

    // Handle context menu actions
    document.querySelectorAll('.context-menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const action = e.currentTarget.getAttribute('data-action');
            handleContextMenuAction(action);
            contextMenu.style.display = 'none';
        });
    });
}

// Handle context menu actions
export function handleContextMenuAction(action) {
    const { row, col } = currentSelection;

    switch (action) {
        case 'cut':
            // Implement cut functionality
            const cellValue = data[currentSelection.row]?.[currentSelection.col]?.value || '';
            navigator.clipboard.writeText(cellValue).then(() => {
                clearCell(currentSelection.row, currentSelection.col);
            });
            break;
        case 'copy':
            // Implement copy functionality
            const copyValue = data[currentSelection.row]?.[currentSelection.col]?.value || '';
            navigator.clipboard.writeText(copyValue);
            break;
        case 'paste':
            // Implement paste functionality
            navigator.clipboard.readText().then((text) => {
                updateData(currentSelection.row, currentSelection.col, text);
            });
            break;
        case 'insertRowAbove':
            insertRow(currentSelection.row);
            break;
        case 'insertRowBelow':
            insertRow(currentSelection.row + 1);
            break;
        case 'deleteRow':
            deleteRow(currentSelection.row);
            break;
        case 'insertColumnLeft':
            insertColumn(currentSelection.col);
            break;
        case 'insertColumnRight':
            insertColumn(currentSelection.col + 1);
            break;
        case 'deleteColumn':
            deleteColumn(currentSelection.col);
            break;
        case 'clearContents':
            clearCell(currentSelection.row, currentSelection.col);
            break;
    }
}

// Initialize toolbar buttons
export function initToolbar() {
    document.getElementById('addRow').addEventListener('click', () => {
        insertRow(selectedRow + 1);
    });

    document.getElementById('addColumn').addEventListener('click', () => {
        insertColumn(selectedCol + 1);
    });

    document.getElementById('deleteRow').addEventListener('click', () => {
        deleteRow(selectedRow);
    });

    document.getElementById('deleteColumn').addEventListener('click', () => {
        deleteColumn(selectedCol + 1); // +1 to account for row header
    });

    document.getElementById('clearContents').addEventListener('click', () => {
        clearCell(selectedRow, selectedCol);
    });

    // Formatting
    const applyStyle = (prop, val) => {
        if (selectedCell) selectedCell.style[prop] = val;
    };
    document.getElementById('font-family')?.addEventListener('change', e => applyStyle('fontFamily', e.target.value));
    document.getElementById('font-size')?.addEventListener('change', e => applyStyle('fontSize', e.target.value + 'px'));
    document.getElementById('text-color')?.addEventListener('input', e => applyStyle('color', e.target.value));
    document.getElementById('bg-color')?.addEventListener('input', e => applyStyle('backgroundColor', e.target.value));

    document.querySelectorAll('.format-btn[data-command]').forEach(btn => {
        btn.addEventListener('click', () => {
            if (!selectedCell) return;
            const cmd = btn.getAttribute('data-command');
            if (cmd === 'bold') selectedCell.style.fontWeight = selectedCell.style.fontWeight === 'bold' ? 'normal' : 'bold';
            if (cmd === 'italic') selectedCell.style.fontStyle = selectedCell.style.fontStyle === 'italic' ? 'normal' : 'italic';
            if (cmd === 'underline') selectedCell.style.textDecoration = selectedCell.style.textDecoration === 'underline' ? 'none' : 'underline';
        });
    });
}

// Initialize formula dropdown
export function initFormulaDropdown() {
    const formulaDropdownBtn = document.getElementById('formula-dropdown-btn');
    const formulaDropdownContent = document.getElementById('formula-dropdown-content');
    const formulaInput = document.getElementById('formula-input');

    // Toggle formula dropdown
    function toggleFormulaDropdown() {
        formulaDropdownContent.classList.toggle('show');
        const isExpanded = formulaDropdownBtn.getAttribute('aria-expanded') === 'true';
        formulaDropdownBtn.setAttribute('aria-expanded', !isExpanded);
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!formulaDropdownBtn.contains(e.target) && !formulaDropdownContent.contains(e.target)) {
            formulaDropdownContent.classList.remove('show');
            formulaDropdownBtn.setAttribute('aria-expanded', 'false');
        }
    });

    // Handle formula selection from dropdown
    formulaDropdownContent.querySelectorAll('a[data-formula]').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const formula = item.getAttribute('data-formula');
            if (formula) {
                formulaInput.value = formula;
                formulaInput.focus();
                // Position cursor before the closing parenthesis if it exists
                if (formula.endsWith(')')) {
                    formulaInput.setSelectionRange(formula.length - 1, formula.length - 1);
                } else if (formula.endsWith('(')) {
                    formulaInput.setSelectionRange(formula.length, formula.length);
                }
            }
            toggleFormulaDropdown();
        });
    });

    // Handle clicks on the formula dropdown button
    formulaDropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFormulaDropdown();
    });
}

// Initialize modals (chart, pivot, text-to-columns)
export function initModals() {
    // Modal elements (assuming they exist in HTML)
    const chartModal = document.getElementById('chartModal');
    const pivotModal = document.getElementById('pivotModal');
    const textToColumnsModal = document.getElementById('textToColumnsModal');

    // Close modals on close button click
    if (chartModal) {
        const closeBtn = chartModal.querySelector('.chart-close');
        if (closeBtn) closeBtn.addEventListener('click', () => chartModal.style.display = 'none');
    }
    if (pivotModal) {
        const closeBtn = pivotModal.querySelector('.chart-close');
        if (closeBtn) closeBtn.addEventListener('click', () => pivotModal.style.display = 'none');
    }
    if (textToColumnsModal) {
        const closeBtn = textToColumnsModal.querySelector('.chart-close');
        if (closeBtn) closeBtn.addEventListener('click', () => textToColumnsModal.style.display = 'none');
    }

    // Example: Show modals on button clicks (implement actual functionality as needed)
    const createChartBtn = document.getElementById('create-chart');
    if (createChartBtn && chartModal) {
        createChartBtn.addEventListener('click', () => {
            chartModal.style.display = 'block';
        });
    }

    let chartInstance = null;
    const generateChartBtn = document.getElementById('generate-chart');
    if (generateChartBtn) {
        generateChartBtn.addEventListener('click', () => {
            const rangeMatch = document.getElementById('data-range').value.trim().match(/^([A-Z]+\d+):([A-Z]+\d+)$/i);
            if (!rangeMatch) return alert('Invalid range, e.g., A1:B10');
            const start = parseCellRef(rangeMatch[1]);
            const end = parseCellRef(rangeMatch[2]);
            if (!start || !end) return;

            const labels = [];
            const chartData = [];
            const c1 = Math.min(start.c, end.c);
            const c2 = c1 + 1 > Math.max(start.c, end.c) ? c1 : c1 + 1;

            for (let r = Math.min(start.r, end.r); r <= Math.max(start.r, end.r); r++) {
                labels.push(data[r]?.[c1]?.value || '');
                if (c1 !== c2) chartData.push(parseFloat(data[r]?.[c2]?.value) || 0);
                else chartData.push(parseFloat(data[r]?.[c1]?.value) || 0);
            }

            const ctx = document.createElement('canvas');
            const area = document.getElementById('chart-area');
            area.innerHTML = '';
            area.appendChild(ctx);

            if (chartInstance) chartInstance.destroy();
            chartInstance = new Chart(ctx, {
                type: document.getElementById('chart-type').value || 'bar',
                data: {
                    labels,
                    datasets: [{
                        label: document.getElementById('chart-title').value || 'Chart',
                        data: chartData,
                        borderWidth: 1
                    }]
                }
            });
        });
    }

    const createPivotBtn = document.getElementById('create-pivot');
    if (createPivotBtn && pivotModal) {
        createPivotBtn.addEventListener('click', () => {
            pivotModal.style.display = 'block';
        });
    }

    const generatePivotBtn = document.getElementById('generate-pivot');
    if (generatePivotBtn) {
        generatePivotBtn.addEventListener('click', () => {
            const area = document.getElementById('pivot-area');
            area.innerHTML = '<p style="padding: 10px; background: #f0f0f0; border: 1px solid #ccc;">Basic Pivot Summary Generated successfully (V1 placeholder logic)</p>';
        });
    }

    const createTtcBtn = document.getElementById('text-to-columns');
    if (createTtcBtn && textToColumnsModal) {
        createTtcBtn.addEventListener('click', () => {
            const cellLabel = document.getElementById('selected-cell');
            if (cellLabel) document.getElementById('text-to-cols-range').value = cellLabel.textContent;
            textToColumnsModal.style.display = 'block';
        });
    }

    const applyTtcBtn = document.getElementById('apply-text-to-columns');
    if (applyTtcBtn) {
        applyTtcBtn.addEventListener('click', () => {
            const range = document.getElementById('text-to-cols-range').value.trim();
            const ref = parseCellRef(range);
            if (!ref) return alert('Invalid start cell selected');

            let sep = document.getElementById('delimiter').value || ',';
            if (document.getElementById('space-delimiter').checked) sep = ' ';
            if (document.getElementById('tab-delimiter').checked) sep = '\t';
            if (document.getElementById('semicolon-delimiter').checked) sep = ';';

            const cellVal = data[ref.r]?.[ref.c]?.value || '';
            const parts = String(cellVal).split(sep);

            const destStr = document.getElementById('destination-cell').value.trim();
            let destRef = ref;
            if (destStr) destRef = parseCellRef(destStr) || ref;

            parts.forEach((part, idx) => {
                updateData(destRef.r, destRef.c + idx, part.trim());
                const el = getCellEl(destRef.r, destRef.c + idx);
                if (el) el.textContent = part.trim();
            });
            textToColumnsModal.style.display = 'none';
        });
    }
}

// Initialize export buttons
export function initExports() {
    const exportXlsxBtn = document.getElementById('export-xlsx');
    const exportCsvBtn = document.getElementById('export-csv');

    const exportToSheet = (format) => {
        const sheetData = data.map(row => row.slice());
        const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
        XLSX.writeFile(workbook, `spreadsheet.${format}`);
    };

    if (exportXlsxBtn) exportXlsxBtn.addEventListener('click', () => exportToSheet('xlsx'));
    if (exportCsvBtn) exportCsvBtn.addEventListener('click', () => exportToSheet('csv'));
}

// Initialize CSV import/export API for AppShell
export function initSpreadsheetAPI() {
    // Expose simple CSV import/export API for AppShell Save/Open
    function toCSV() {
        const lines = [];
        for (let i = 0; i < ROWS; i++) {
            const row = [];
            for (let j = 0; j < COLS; j++) {
                let cell = data[i][j] ?? '';
                const needsQuotes = /[",\n]/.test(String(cell));
                if (typeof cell === 'string') cell = cell.replace(/"/g, '""');
                row.push(needsQuotes ? `"${cell}"` : String(cell));
            }
            lines.push(row.join(','));
        }
        return lines.join('\n');
    }

    function fromCSV(csv) {
        const rows = csv.split(/\r?\n/);
        const parseRow = (line) => {
            const out = [];
            let cur = '', inQuotes = false;
            for (let k = 0; k < line.length; k++) {
                const ch = line[k];
                if (inQuotes) {
                    if (ch === '"' && line[k + 1] === '"') { cur += '"'; k++; }
                    else if (ch === '"') { inQuotes = false; }
                    else { cur += ch; }
                } else {
                    if (ch === ',') { out.push(cur); cur = ''; }
                    else if (ch === '"') { inQuotes = true; }
                    else { cur += ch; }
                }
            }
            out.push(cur);
            return out;
        };
        for (let i = 0; i < ROWS; i++) {
            const parsed = rows[i] ? parseRow(rows[i]) : [];
            for (let j = 0; j < COLS; j++) {
                data[i][j] = parsed[j] ?? '';
            }
        }
        renderAll();
        // Reset UI state
        if (selectedCellLabel) selectedCellLabel.textContent = cellName(selectedRow, selectedCol);
        if (formulaInput) formulaInput.value = data[selectedRow][selectedCol] || '';
    }

    // Initialize Spreadsheet API for external access
    window.SpreadsheetAPI = {
        toCSV: toCSV,
        fromCSV: fromCSV,
        getSelectedCell: () => ({ row: currentSelection.row, col: currentSelection.col }),
        getCellValue: (row, col) => {
            const cell = getCellEl(row, col);
            return cell ? cell.textContent : '';
        },
        setCellValue: (row, col, value) => {
            const cell = getCellEl(row, col);
            if (cell) {
                cell.textContent = value;
            }
        }
    };
}
