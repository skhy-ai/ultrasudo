/**
 * Spreadsheet Formula Engine
 * Ported from legacy spreadsheet-app/formula-engine.js
 */

// Parse cell reference (e.g., 'A1' -> {r: 0, c: 0})
export function parseCellRef(token) {
    const m = token.match(/^([A-Z]+)(\d+)$/i);
    if (!m) return null;
    const colLetters = m[1].toUpperCase();
    let colIndex = 0;
    for (let i = 0; i < colLetters.length; i++) {
        colIndex = colIndex * 26 + (colLetters.charCodeAt(i) - 64);
    }
    colIndex -= 1; // zero-based
    const rowIndex = parseInt(m[2], 10) - 1;
    return { r: rowIndex, c: colIndex };
}

// Get values from a range (e.g., 'A1:B2')
export function rangeValues(a, b, data) {
    const start = parseCellRef(a);
    const end = parseCellRef(b);
    if (!start || !end) return [];
    const vals = [];
    for (let r = Math.min(start.r, end.r); r <= Math.max(start.r, end.r); r++) {
        for (let c = Math.min(start.c, end.c); c <= Math.max(start.c, end.c); c++) {
            const cell = data[r]?.[c];
            const val = typeof cell === 'object' ? (cell.value ?? 0) : (cell ?? 0);
            vals.push(parseFloat(val) || 0);
        }
    }
    return vals;
}

// Resolve argument (number, cell, or range)
export function resolveArg(token, data) {
    token = token.trim();
    const rangeMatch = token.match(/^([A-Z]+\d+):([A-Z]+\d+)$/i);
    if (rangeMatch) return rangeValues(rangeMatch[1], rangeMatch[2], data);
    
    const ref = parseCellRef(token);
    if (ref) {
        const cell = data[ref.r]?.[ref.c];
        const val = typeof cell === 'object' ? (cell.value ?? 0) : (cell ?? 0);
        return parseFloat(val) || 0;
    }
    
    const num = parseFloat(token);
    if (!isNaN(num)) return num;
    return 0;
}

// Flatten arguments for functions
export function flattenArgs(args) {
    const out = [];
    args.forEach(a => {
        if (Array.isArray(a)) out.push(...a);
        else out.push(a);
    });
    return out;
}

/**
 * Evaluate a formula string (without the leading '=')
 */
export function evaluateFormula(formulaRaw, data) {
    const formula = formulaRaw.trim();
    if (!formula.includes('(')) {
        // Simple cell reference or number
        return resolveArg(formula, data);
    }

    const m = formula.match(/^(\w+)\((.*)\)$/);
    if (!m) throw new Error('Bad formula');
    const func = m[1].toUpperCase();
    const argsStr = m[2];
    const parts = argsStr.split(',').map(s => s.trim()).filter(s => s.length > 0);
    const args = parts.map(p => resolveArg(p, data));

    switch (func) {
        case 'SUM': {
            const vals = flattenArgs(args);
            return vals.reduce((a, b) => a + (parseFloat(b) || 0), 0);
        }
        case 'AVERAGE': {
            const vals = flattenArgs(args);
            return vals.length ? vals.reduce((a, b) => a + (parseFloat(b) || 0), 0) / vals.length : 0;
        }
        case 'COUNT': {
            const vals = flattenArgs(args);
            return vals.length;
        }
        case 'MAX': {
            const vals = flattenArgs(args);
            return Math.max(...vals);
        }
        case 'MIN': {
            const vals = flattenArgs(args);
            return Math.min(...vals);
        }
        // Financial functions ported
        case 'PMT': {
            const rate = +flattenArgs([args[0]])[0] || 0;
            const nper = +flattenArgs([args[1]])[0] || 0;
            const pv = +flattenArgs([args[2]])[0] || 0;
            const fv = +(flattenArgs([args[3]])[0] ?? 0);
            const type = +(flattenArgs([args[4]])[0] ?? 0);
            if (rate === 0) return -(pv + fv) / nper;
            const pvif = Math.pow(1 + rate, nper);
            let pmt = rate / (pvif - 1) * -(pv * pvif + fv);
            if (type === 1) pmt /= (1 + rate);
            return pmt;
        }
        default:
            throw new Error(`Unknown function: ${func}`);
    }
}
