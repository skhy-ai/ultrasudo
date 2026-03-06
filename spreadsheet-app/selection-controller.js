// selection-controller.js - Handles cell selection, navigation, and highlighting

import { cellName, getCellEl } from './grid-view.js';

// Global selection state
export let currentSelection = { row: 0, col: 0 };
export let selectedCell = null;
export let selectedRow = 0;
export let selectedCol = 0;

// Handle keyboard navigation
export function handleKeyDown(e) {
    const { key, shiftKey, ctrlKey } = e;
    const { row, col } = currentSelection;
    let newRow = row;
    let newCol = col;
    let preventDefault = true;
    const ROWS = 50; // Make sure this matches your grid size
    const COLS = 20;  // Make sure this matches your grid size

    switch (key) {
        case 'ArrowUp':
            if (row > 0) newRow--;
            break;
        case 'ArrowDown':
            if (row < ROWS - 1) newRow++;
            break;
        case 'ArrowLeft':
            if (col > 0) newCol--;
            break;
        case 'ArrowRight':
            if (col < COLS - 1) newCol++;
            break;
        case 'Enter':
            if (shiftKey) {
                // Shift+Enter: move up
                if (row > 0) newRow--;
            } else {
                // Enter: move down
                if (row < ROWS - 1) newRow++;
            }
            break;
        case 'Tab':
            if (shiftKey) {
                // Shift+Tab: move left
                if (col > 0) {
                    newCol--;
                } else if (row > 0) {
                    newRow--;
                    newCol = COLS - 1;
                }
            } else {
                // Tab: move right
                if (col < COLS - 1) {
                    newCol++;
                } else if (row < ROWS - 1) {
                    newRow++;
                    newCol = 0;
                }
            }
            break;
        case 'Home':
            newCol = 0;
            if (ctrlKey) newRow = 0;
            break;
        case 'End':
            newCol = COLS - 1;
            if (ctrlKey) newRow = ROWS - 1;
            break;
        case 'PageUp':
            newRow = Math.max(0, row - 20);
            break;
        case 'PageDown':
            newRow = Math.min(ROWS - 1, row + 20);
            break;
        default:
            preventDefault = false;
    }

    if ((newRow !== row || newCol !== col) && preventDefault) {
        e.preventDefault();
        const newCell = document.querySelector(`[data-row='${newRow}'][data-col='${newCol}']`);
        if (newCell) {
            // Update selection
            selectCell(newCell, newRow, newCol);
        }
    }
}

// Select a cell
export function selectCell(cell, row, col) {
    // Remove selection from previously selected cell
    if (selectedCell) {
        selectedCell.classList.remove('selected');
    }

    // Update selection
    selectedCell = cell;
    selectedRow = row;
    selectedCol = col;
    currentSelection = { row, col };

    // Add selection class
    cell.classList.add('selected');

    // Update formula bar
    const selectedCellLabel = document.getElementById('selected-cell');
    const formulaInput = document.getElementById('formula-input');
    if (selectedCellLabel) selectedCellLabel.textContent = cellName(row, col);

    // Show cell value or formula in formula bar (assuming data is accessible)
    const cellData = window.spreadsheetData && window.spreadsheetData[row] ?
                     window.spreadsheetData[row][col] || '' : '';
    if (formulaInput) {
        formulaInput.value = cellData;
    }

    // Highlight row and column
    updateRowColumnHighlight(row, col);

    // Focus the cell
    cell.focus();
}

// Select entire row
export function selectRow(row) {
    // Clear previous selection
    document.querySelectorAll('.selected-row, .selected-column').forEach(el => {
        el.classList.remove('selected-row', 'selected-column');
    });

    // Highlight the selected row
    const rowEl = document.querySelector(`tr[data-row="${row}"]`);
    if (rowEl) {
        rowEl.classList.add('selected-row');

        // Select first cell in the row
        const firstCell = rowEl.querySelector('td');
        if (firstCell) {
            const col = parseInt(firstCell.dataset.col);
            selectCell(firstCell, row, col);
        }
    }
}

// Select entire column
export function selectColumn(col) {
    // Clear previous selection
    document.querySelectorAll('.selected-row, .selected-column').forEach(el => {
        el.classList.remove('selected-row', 'selected-column');
    });

    // Highlight the selected column
    document.querySelectorAll(`td[data-col="${col}"]`).forEach(cell => {
        cell.classList.add('selected-column');
    });

    // Select first cell in the column
    const firstCell = document.querySelector(`td[data-col="${col}"][data-row="0"]`);
    if (firstCell) {
        selectCell(firstCell, 0, col);
    }
}

// Update row and column highlighting
export function updateRowColumnHighlight(row, col) {
    // Clear previous highlights
    document.querySelectorAll('.selected-row, .selected-column').forEach(el => {
        el.classList.remove('selected-row', 'selected-column');
    });

    // Highlight selected row
    if (row !== null) {
        const selectedRowEl = document.querySelector(`tr[data-row="${row}"]`);
        if (selectedRowEl) selectedRowEl.classList.add('selected-row');
    }

    // Highlight selected column
    if (col !== null) {
        document.querySelectorAll(`td[data-col="${col}"]`).forEach(cell => {
            cell.classList.add('selected-column');
        });
    }
}
