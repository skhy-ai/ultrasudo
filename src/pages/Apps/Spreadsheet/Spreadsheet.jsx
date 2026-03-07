import React, { useState, useRef, useEffect, useCallback } from 'react';
import AppShell from '../../../components/shared/AppShell/AppShell';
import useLocalStore from '../../../hooks/useLocalStore';
import { evaluateFormula, parseCellRef } from './formulaEngine';
import './Spreadsheet.css';

const ROWS = 50;
const COLS = 26;

const colName = (i) => String.fromCharCode(65 + i);

export default function Spreadsheet() {
    const [sheetData, setSheetData] = useLocalStore('spreadsheet_data', 
        Array(ROWS).fill(null).map(() => Array(COLS).fill({ value: '', formula: '' }))
    );
    const [selected, setSelected] = useState({ r: 0, c: 0 });
    const [editing, setEditing] = useState(false);
    const [tempValue, setTempValue] = useState('');
    const inputRef = useRef(null);

    const activeCell = sheetData[selected.r][selected.c];

    // Handle cell selection
    const selectCell = (r, c) => {
        setSelected({ r, c });
        setEditing(false);
    };

    const startEditing = (r, c) => {
        const cell = sheetData[r][c];
        setTempValue(cell.formula || String(cell.value));
        setSelected({ r, c });
        setEditing(true);
    };

    const commitEdit = () => {
        const newData = [...sheetData];
        const newRow = [...newData[selected.r]];
        
        if (tempValue.startsWith('=')) {
            try {
                const result = evaluateFormula(tempValue.substring(1), sheetData);
                newRow[selected.c] = { formula: tempValue, value: result };
            } catch (e) {
                newRow[selected.c] = { formula: tempValue, value: '#ERROR' };
            }
        } else {
            newRow[selected.c] = { formula: '', value: tempValue };
        }
        
        newData[selected.r] = newRow;
        setSheetData(newData);
        setEditing(false);
    };

    // Auto-recalculate dependencies
    useEffect(() => {
        const recacheData = () => {
            let changed = false;
            const newData = sheetData.map((row, r) => row.map((cell, c) => {
                if (cell.formula) {
                    try {
                        const newVal = evaluateFormula(cell.formula.substring(1), sheetData);
                        if (newVal !== cell.value) {
                            changed = true;
                            return { ...cell, value: newVal };
                        }
                    } catch (e) {
                        if (cell.value !== '#ERROR') {
                            changed = true;
                            return { ...cell, value: '#ERROR' };
                        }
                    }
                }
                return cell;
            }));

            if (changed) {
                setSheetData(newData);
            }
        };

        const timer = setTimeout(recacheData, 500);
        return () => clearTimeout(timer);
    }, [sheetData, setSheetData]);

    const handleKeyDown = (e) => {
        if (!editing) {
            if (e.key === 'ArrowUp') setSelected(s => ({ ...s, r: Math.max(0, s.r - 1) }));
            if (e.key === 'ArrowDown') setSelected(s => ({ ...s, r: Math.min(ROWS - 1, s.r + 1) }));
            if (e.key === 'ArrowLeft') setSelected(s => ({ ...s, c: Math.max(0, s.c - 1) }));
            if (e.key === 'ArrowRight') setSelected(s => ({ ...s, c: Math.min(COLS - 1, s.c + 1) }));
            if (e.key === 'Enter') startEditing(selected.r, selected.c);
            if (e.key === 'Backspace' || e.key === 'Delete') {
                const newData = [...sheetData];
                newData[selected.r][selected.c] = { value: '', formula: '' };
                setSheetData(newData);
            }
        } else {
            if (e.key === 'Enter') commitEdit();
            if (e.key === 'Escape') setEditing(false);
        }
    };

    return (
        <AppShell title="Spreadsheets" icon="fas fa-table">
            <div className="sheet-app" onKeyDown={handleKeyDown} tabIndex="0">
                <div className="sheet-toolbar">
                    <div className="formula-bar">
                        <div className="active-cell-indicator">
                            {colName(selected.c)}{selected.r + 1}
                        </div>
                        <input 
                            className="formula-input"
                            value={editing ? tempValue : (activeCell.formula || activeCell.value)}
                            onChange={(e) => {
                                setEditing(true);
                                setTempValue(e.target.value);
                            }}
                            onBlur={commitEdit}
                            onKeyDown={(e) => e.key === 'Enter' && commitEdit()}
                            placeholder="Enter value or =FORMULA()"
                        />
                    </div>
                </div>

                <div className="grid-viewport">
                    <table className="spreadsheet-grid">
                        <thead>
                            <tr>
                                <th className="corner-header"></th>
                                {Array(COLS).fill(0).map((_, i) => (
                                    <th key={i} className="col-header">{colName(i)}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {sheetData.map((row, r) => (
                                <tr key={r}>
                                    <th className="row-header">{r + 1}</th>
                                    {row.map((cell, c) => {
                                        const isSelected = selected.r === r && selected.c === c;
                                        const isEdited = isSelected && editing;
                                        
                                        return (
                                            <td 
                                                key={c}
                                                className={`sheet-cell ${isSelected ? 'selected' : ''} ${cell.formula ? 'formula' : ''} ${cell.value === '#ERROR' ? 'error' : ''}`}
                                                onClick={() => selectCell(r, c)}
                                                onDoubleClick={() => startEditing(r, c)}
                                            >
                                                {isEdited ? (
                                                    <input 
                                                        ref={inputRef}
                                                        autoFocus
                                                        className="cell-editor"
                                                        value={tempValue}
                                                        onChange={(e) => setTempValue(e.target.value)}
                                                        onBlur={commitEdit}
                                                    />
                                                ) : (
                                                    <div className="cell-content" style={{ textAlign: isNaN(cell.value) ? 'left' : 'right' }}>
                                                        {cell.value}
                                                    </div>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppShell>
    );
}
