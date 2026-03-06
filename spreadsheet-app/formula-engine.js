// formula-engine.js - Handles formula parsing and evaluation

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
            vals.push(parseFloat(data[r]?.[c]?.value || 0));
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
    if (ref) return parseFloat(data[ref.r]?.[ref.c]?.value || 0);
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

// Evaluate a formula
export function evaluateFormula(formulaRaw, data) {
    const formula = formulaRaw.trim();
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
        case 'PMT': {
            const rate = +args[0] || 0;
            const nper = +args[1] || 0;
            const pv = +args[2] || 0;
            const fv = +(args[3] ?? 0);
            const type = +(args[4] ?? 0);
            if (rate === 0) return -(pv + fv) / nper;
            const pvif = Math.pow(1 + rate, nper);
            let pmt = rate / (pvif - 1) * -(pv * pvif + fv);
            if (type === 1) pmt /= (1 + rate);
            return pmt;
        }
        case 'FV': {
            const rate = +args[0] || 0;
            const nper = +args[1] || 0;
            const pmt = +args[2] || 0;
            const pv = +(args[3] ?? 0);
            const type = +(args[4] ?? 0);
            if (rate === 0) return -(pv + pmt * nper);
            const pvif = Math.pow(1 + rate, nper);
            return -(pv * pvif + pmt * (1 + rate * type) * (pvif - 1) / rate);
        }
        case 'PV': {
            const rate = +args[0] || 0;
            const nper = +args[1] || 0;
            const pmt = +args[2] || 0;
            const fv = +(args[3] ?? 0);
            const type = +(args[4] ?? 0);
            if (rate === 0) return -(fv + pmt * nper);
            const pvif = Math.pow(1 + rate, nper);
            return -(fv + pmt * (1 + rate * type) * (pvif - 1) / rate) / pvif;
        }
        case 'NPV': {
            const rate = +args[0] || 0;
            const flows = flattenArgs(args.slice(1));
            let sum = 0;
            for (let t = 1; t <= flows.length; t++) {
                sum += (parseFloat(flows[t - 1]) || 0) / Math.pow(1 + rate, t);
            }
            return sum;
        }
        case 'IRR': {
            const flows = flattenArgs(args);
            let guess = 0.1;
            if (typeof flows[flows.length - 1] === 'number' && flows.length > 1) {
                guess = flows.pop();
            }
            const npvAt = (r) => flows.reduce((acc, cf, i) => acc + (cf / Math.pow(1 + r, i)), 0);
            const dNpvAt = (r) => flows.reduce((acc, cf, i) => acc + (-i * cf / Math.pow(1 + r, i + 1)), 0);
            let r = guess, iter = 0;
            while (iter++ < 50) {
                const f = npvAt(r);
                const fp = dNpvAt(r);
                if (Math.abs(f) < 1e-7) break;
                if (fp === 0) break;
                r = r - f / fp;
            }
            return r;
        }
        default:
            throw new Error('Unknown function');
    }
}
