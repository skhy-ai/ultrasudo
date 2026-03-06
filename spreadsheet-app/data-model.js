// data-model.js - Manages spreadsheet data, updates, and rendering

import { evaluateFormula } from './formula-engine.js';

// Constants for grid size
export const ROWS = 50;
export const COLS = 20;

// Global data array
export let data = Array(ROWS).fill(null).map(() => Array(COLS).fill(''));

// Update data for a cell
export function updateData(row, col, value) {
    if (!data[row]) data[row] = [];

    // Clear any existing formula class (assuming cellEl is passed or handled elsewhere)
    const cellEl = getCellEl(row, col);
    if (cellEl) {
        cellEl.classList.remove('formula-cell', 'error-cell');
    }

    // Handle formula
    if (value.startsWith('=')) {
        data[row][col] = { formula: value };
        try {
            const result = evaluateFormula(value.substring(1), data);
            data[row][col].value = result;

            if (cellEl) {
                cellEl.textContent = Number.isFinite(result) ?
                    result.toLocaleString() : String(result);
                cellEl.classList.add('formula-cell');
            }
        } catch (e) {
            console.error('Error in formula:', e);
            if (cellEl) {
                cellEl.textContent = '#ERROR';
                cellEl.classList.add('error-cell');
            }
            data[row][col].value = '#ERROR';
        }
    } else {
        // Plain value
        data[row][col] = { value };
        if (cellEl) {
            cellEl.textContent = value;

            // Right-align numbers
            if (!isNaN(parseFloat(value)) && isFinite(value)) {
                cellEl.style.textAlign = 'right';
            } else {
                cellEl.style.textAlign = 'left';
            }
        }
    }
}

// Render all cells with current data
export function renderAll() {
    for (let i = 0; i < ROWS; i++) {
        for (let j = 0; j < COLS; j++) {
            const v = data[i][j] || '';
            const el = getCellEl(i, j);
            if (!el) continue;
            if (typeof v === 'string' && v.startsWith('=')) {
                try {
                    const out = evaluateFormula(v.substring(1), data);
                    el.textContent = (Number.isFinite(out) ? out : String(out));
                } catch (e) {
                    el.textContent = '#ERROR';
                }
            } else {
                el.textContent = v;
            }
        }
    }
}

// Placeholder for getCellEl (will be imported from grid-view.js)
function getCellEl(row, col) {
    // This should be imported or handled differently
    return null;
}
