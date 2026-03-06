// Convert column number to letter (0 -> 'A', 1 -> 'B', etc.)
function colToLetter(col) {
    let temp, letter = '';
    while (col >= 0) {
        temp = col % 26;
        letter = String.fromCharCode(temp + 65) + letter;
        col = (col - temp - 1) / 26;
    }
    return letter;
}

// grid-view.js - Handles DOM creation, rendering, and grid-related UI

import { ROWS, COLS } from './data-model.js';

// Utility function to get cell name (e.g., A1)
export function cellName(row, col) {
    return `${colToLetter(col)}${row + 1}`;
}

// Get cell element by row and column
export function getCellEl(row, col) {
    const container = document.getElementById('spreadsheet-container');
    return container.querySelector(`[data-row='${row}'][data-col='${col}']`);
}

// Create the entire grid (table with headers and cells)
export function createGrid(data, updateCell, updateData, handleKeyDown) {
    console.log('Starting grid creation...');
    const container = document.getElementById('spreadsheet-container');
    if (!container) {
        console.error('Spreadsheet container not found');
        return;
    }

    console.log('Container found, creating table...');
    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');
    const headerRow = document.createElement('tr');

    // Empty corner cell
    const cornerTh = document.createElement('th');
    cornerTh.addEventListener('click', () => {
        // Select all cells
        document.querySelectorAll('td[contenteditable="true"]').forEach(cell => {
            cell.classList.add('selected');
        });
    });
    headerRow.appendChild(cornerTh);

    // Column headers (A, B, C...)
    for (let j = 0; j < COLS; j++) {
        const th = document.createElement('th');
        th.innerHTML = `<div class="header-content">${String.fromCharCode(65 + j)}<div class="resizer"></div></div>`;
        th.addEventListener('click', (e) => {
            e.stopPropagation();
            selectColumn(j);
        });
        headerRow.appendChild(th);
    }
    thead.appendChild(headerRow);

    // Data rows
    for (let i = 0; i < ROWS; i++) {
        const tr = document.createElement('tr');
        tr.dataset.row = i;

        // Row header
        const rowHeader = document.createElement('th');
        rowHeader.innerHTML = `<div class="row-header-content">${i + 1}<div class="row-resizer"></div></div>`;
        rowHeader.addEventListener('click', (e) => {
            e.stopPropagation();
            selectRow(i);
        });
        tr.appendChild(rowHeader);

        // Data cells
        for (let j = 0; j < COLS; j++) {
            const td = document.createElement('td');
            td.setAttribute('contenteditable', 'true');
            td.dataset.row = i;
            td.dataset.col = j;

            // Add click handler for cell selection
            td.addEventListener('mousedown', (e) => {
                if (e.button === 0) { // Left click
                    e.stopPropagation();
                    selectCell(td, i, j);
                }
            });

            // Handle input changes
            td.addEventListener('input', () => updateCell(td, i, j));

            // Handle keyboard navigation
            td.addEventListener('keydown', handleKeyDown);

            tr.appendChild(td);
        }
        tbody.appendChild(tr);
    }

    table.appendChild(thead);
    table.appendChild(tbody);
    console.log('Appending table to container');
    container.appendChild(table);
    console.log('Grid created successfully');
}

// Initialize resizable columns
export function initResizableColumns() {
    const container = document.getElementById('spreadsheet-container');
    const ths = container.querySelectorAll('th');

    ths.forEach(th => {
        const resizer = document.createElement('div');
        resizer.classList.add('resizer');
        th.appendChild(resizer);

        resizer.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();

            isResizing = true;
            currentResizer = resizer;
            startX = e.clientX;
            startWidth = th.offsetWidth;

            document.body.style.cursor = 'col-resize';
            resizer.classList.add('active');

            document.addEventListener('mousemove', handleResize);
            document.addEventListener('mouseup', stopResize);
        });
    });
}

// Initialize resizable rows
export function initResizableRows() {
    const container = document.getElementById('spreadsheet-container');
    const rowHeaders = container.querySelectorAll('.row-header-content');

    rowHeaders.forEach(header => {
        const resizer = header.querySelector('.row-resizer');
        if (resizer) {
            resizer.addEventListener('mousedown', (e) => {
                e.preventDefault();
                e.stopPropagation();

                isResizing = true;
                currentResizer = resizer;
                startY = e.clientY;
                startHeight = header.offsetHeight;

                document.body.style.cursor = 'row-resize';
                resizer.classList.add('active');

                document.addEventListener('mousemove', handleRowResize);
                document.addEventListener('mouseup', stopResize);
            });
        }
    });
}

// Initialize resizable rows and columns
export function initResizableGrid() {
    initResizableColumns();
    initResizableRows();
}

// Global variables for resizing (shared with main script)
let isResizing = false;
let currentResizer = null;
let startX, startWidth, startY, startHeight;

function handleResize(e) {
    if (!isResizing) return;

    const th = currentResizer.parentElement;
    const newWidth = startWidth + (e.clientX - startX);

    if (newWidth > 50) { // Minimum width
        th.style.width = `${newWidth}px`;

        // Update all cells in the column
        const colIndex = Array.from(th.parentElement.children).indexOf(th);
        const container = document.getElementById('spreadsheet-container');
        const rows = container.querySelectorAll('tbody tr');

        rows.forEach(row => {
            const cell = row.cells[colIndex];
            if (cell) {
                cell.style.width = `${newWidth}px`;
            }
        });
    }
}

function handleRowResize(e) {
    if (!isResizing) return;

    const th = currentResizer.parentElement.parentElement;  // Row header th
    const newHeight = startHeight + (e.clientY - startY);

    if (newHeight > 20) { // Minimum height
        th.style.height = `${newHeight}px`;

        // Update all cells in the row
        const rowIndex = th.parentElement.rowIndex - 1;  // Adjust for thead
        const container = document.getElementById('spreadsheet-container');
        const rows = container.querySelectorAll('tbody tr');

        if (rows[rowIndex]) {
            const cells = rows[rowIndex].querySelectorAll('td');
            cells.forEach(cell => {
                cell.style.height = `${newHeight}px`;
            });
        }
    }
}

// Update row numbers after insertions/deletions
export function updateRowNumbers() {
    const container = document.getElementById('spreadsheet-container');
    const rows = container.querySelectorAll('tbody tr');
    rows.forEach((row, index) => {
        const header = row.querySelector('th .row-header-content');
        if (header) {
            header.textContent = index + 1;
        }
        row.dataset.row = index;

        // Update cell row indices
        const cells = row.querySelectorAll('td');
        cells.forEach((cell, colIndex) => {
            cell.dataset.row = index;
        });
    });
}

// Update column indices after insertions/deletions
export function updateColumnIndices() {
    const container = document.getElementById('spreadsheet-container');
    const rows = container.querySelectorAll('tbody tr');
    const headerRow = container.querySelector('thead tr');

    // Update header letters
    for (let i = 1; i < headerRow.cells.length; i++) {
        const header = headerRow.cells[i].querySelector('.header-content');
        if (header) {
            header.firstChild.textContent = colToLetter(i - 1);  // 0-based for letters
        }
    }

    // Update cell column indices
    rows.forEach((row, rowIndex) => {
        const cells = row.querySelectorAll('td');
        cells.forEach((cell, colIndex) => {
            cell.dataset.col = colIndex;
        });
    });
}

// Placeholder functions for selection (will be implemented in selection-controller.js)
function selectCell(cell, row, col) {
    // This will be overridden by the main script
    console.log('selectCell called:', row, col);
}

function selectRow(row) {
    // This will be overridden by the main script
    console.log('selectRow called:', row);
}

function selectColumn(col) {
    // This will be overridden by the main script
    console.log('selectColumn called:', col);
}

// Expose functions to be overridden
export { selectCell, selectRow, selectColumn };
