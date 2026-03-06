// grid-controller.js - Handles grid manipulation (insert/delete rows/columns, clear cells)

import { updateRowNumbers, updateColumnIndices } from './grid-view.js';
import { updateData } from './data-model.js';
import { selectCell, handleKeyDown } from './selection-controller.js';

// Define updateCell for grid creation
function updateCell(cell, row, col) {
    const value = cell.textContent;
    updateData(row, col, value);
}

// Insert a new row at the specified index
export function insertRow(index) {
    const container = document.getElementById('spreadsheet-container');
    const table = container.querySelector('table');
    const tbody = table.querySelector('tbody');
    const rowCount = tbody.rows.length;
    const colCount = tbody.rows[0].cells.length - 1; // Subtract 1 for row header

    const newRow = document.createElement('tr');
    newRow.dataset.row = index;

    // Add row header
    const rowHeader = document.createElement('th');
    rowHeader.className = 'row-header';
    rowHeader.innerHTML = `<div class="row-header-content">${index + 1}<div class="row-resizer"></div></div>`;
    newRow.appendChild(rowHeader);

    // Add cells
    for (let j = 0; j < colCount; j++) {
        const cell = document.createElement('td');
        cell.setAttribute('contenteditable', 'true');
        cell.dataset.row = index;
        cell.dataset.col = j;

        cell.addEventListener('click', (e) => {
            e.stopPropagation();
            selectCell(cell, index, j);
        });

        cell.addEventListener('input', () => updateCell(cell, index, j));
        cell.addEventListener('keydown', handleKeyDown);

        newRow.appendChild(cell);
    }

    // Insert the new row
    if (index >= rowCount) {
        tbody.appendChild(newRow);
    } else {
        tbody.insertBefore(newRow, tbody.rows[index]);
    }

    // Update row numbers
    updateRowNumbers();
}

// Delete a row at the specified index
export function deleteRow(index) {
    const container = document.getElementById('spreadsheet-container');
    const table = container.querySelector('table');
    const tbody = table.querySelector('tbody');

    if (tbody.rows.length <= 1) return; // Don't delete the last row

    tbody.deleteRow(index);
    updateRowNumbers();
}

// Insert a new column at the specified index
export function insertColumn(index) {
    const container = document.getElementById('spreadsheet-container');
    const table = container.querySelector('table');
    const thead = table.querySelector('thead');
    const tbody = table.querySelector('tbody');

    // Update header
    const headerRow = thead.rows[0];
    const newHeader = document.createElement('th');
    newHeader.className = 'column-header';
    newHeader.innerHTML = `<div class="header-content">${String.fromCharCode(65 + index)}<div class="resizer"></div></div>`;

    if (index >= headerRow.cells.length - 1) {
        headerRow.appendChild(newHeader);
    } else {
        headerRow.insertBefore(newHeader, headerRow.cells[index + 1]);
    }

    // Update all rows
    const rows = tbody.rows;
    for (let i = 0; i < rows.length; i++) {
        const cell = document.createElement('td');
        cell.setAttribute('contenteditable', 'true');
        cell.dataset.row = i;
        cell.dataset.col = index;

        cell.addEventListener('click', (e) => {
            e.stopPropagation();
            selectCell(cell, i, index);
        });

        cell.addEventListener('input', () => updateCell(cell, i, index));
        cell.addEventListener('keydown', handleKeyDown);

        if (index >= rows[i].cells.length - 1) {
            rows[i].appendChild(cell);
        } else {
            rows[i].insertBefore(cell, rows[i].cells[index + 1]);
        }
    }

    // Update column indices
    updateColumnIndices();
}

// Delete a column at the specified index
export function deleteColumn(index) {
    const container = document.getElementById('spreadsheet-container');
    const table = container.querySelector('table');
    const thead = table.querySelector('thead');
    const tbody = table.querySelector('tbody');

    // Don't delete the first column (row headers)
    if (index < 1) return;

    // Update header
    const headerRow = thead.rows[0];
    if (headerRow.cells.length <= 2) return; // Keep at least one data column
    headerRow.deleteCell(index);

    // Update all rows
    const rows = tbody.rows;
    for (let i = 0; i < rows.length; i++) {
        rows[i].deleteCell(index);
    }

    // Update column indices
    updateColumnIndices();
}

// Clear cell content
export function clearCell(row, col) {
    const cell = getCellEl(row, col);
    if (cell) {
        cell.textContent = '';
        updateData(row, col, '');
    }
}
