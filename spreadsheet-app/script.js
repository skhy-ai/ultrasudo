// script.js - Main entry point for the spreadsheet app

// Import all modules
import { createGrid, initResizableGrid, updateRowNumbers, updateColumnIndices, cellName, getCellEl } from './grid-view.js';
import { data, updateData, renderAll, ROWS, COLS } from './data-model.js';
import { handleKeyDown, selectCell, selectRow, selectColumn, updateRowColumnHighlight, currentSelection, selectedCell, selectedRow, selectedCol } from './selection-controller.js';
import { initContextMenu, initToolbar, initFormulaDropdown, initModals, initExports, initSpreadsheetAPI } from './ui-controller.js';

// Global variables for grid manipulation (keep for now)
let contextMenu = null;

// Define updateCell function for grid creation (this will be moved to a module later)
function updateCell(cell, row, col) {
    const value = cell.textContent;
    updateData(row, col, value);
}

// Main initialization
document.addEventListener('DOMContentLoaded', () => {
    try {
        const container = document.getElementById('spreadsheet-container');
        if (!container) {
            console.error('Spreadsheet container not found');
            return;
        }

        // Initialize all UI components
        initContextMenu();
        initResizableGrid();
        initToolbar();
        initFormulaDropdown();
        initModals();
        initExports();
        initSpreadsheetAPI();

        // Create the grid
        createGrid(data, updateCell, updateData, handleKeyDown);

        console.log('Spreadsheet initialized successfully');

    } catch (e) {
        console.error('Error initializing spreadsheet:', e);
    }
});

// Global context menu variable (used in ui-controller.js)
contextMenu = document.getElementById('contextMenu');

// Export for other modules if needed
export { contextMenu };
