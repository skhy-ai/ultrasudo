import React, { useState, useEffect } from 'react';
import AppShell from '../../../components/shared/AppShell/AppShell';
import './Calculator.css';

export default function Calculator() {
    const [activeTab, setActiveTab] = useState('calculator');
    const [currentOperand, setCurrentOperand] = useState('');
    const [previousOperand, setPreviousOperand] = useState('');
    const [operation, setOperation] = useState(undefined);

    // Unit Converter State
    const [category, setCategory] = useState('length');
    const [fromUnit, setFromUnit] = useState('meters');
    const [toUnit, setToUnit] = useState('meters');
    const [inputValue, setInputValue] = useState('');
    const [outputValue, setOutputValue] = useState('-');

    const units = {
        length: { 'meters': 1, 'kilometers': 1000, 'centimeters': 0.01, 'millimeters': 0.001, 'miles': 1609.34, 'yards': 0.9144, 'feet': 0.3048, 'inches': 0.0254 },
        weight: { 'grams': 1, 'kilograms': 1000, 'milligrams': 0.001, 'pounds': 453.592, 'ounces': 28.3495 },
        temperature: { 'celsius': 'c', 'fahrenheit': 'f', 'kelvin': 'k' },
        area: { 'square meters': 1, 'square kilometers': 1000000, 'square miles': 2589990, 'acres': 4046.86, 'hectares': 10000 },
        volume: { 'liters': 1, 'milliliters': 0.001, 'cubic meters': 1000, 'gallons': 3.78541, 'pints': 0.473176 },
        time: { 'seconds': 1, 'minutes': 60, 'hours': 3600, 'days': 86400 }
    };

    // Calculator Logic
    const clear = () => { setCurrentOperand(''); setPreviousOperand(''); setOperation(undefined); };
    const del = () => { setCurrentOperand(currentOperand.toString().slice(0, -1)); };
    const appendNumber = (number) => {
        if (number === '.' && currentOperand.includes('.')) return;
        setCurrentOperand(currentOperand.toString() + number.toString());
    };

    const chooseOperation = (op) => {
        if (currentOperand === '' && !['sin', 'cos', 'tan', 'log', 'sqrt'].includes(op)) return;
        if (previousOperand !== '') compute();
        setOperation(op);
        if (['sin', 'cos', 'tan', 'log', 'sqrt'].includes(op)) {
            let computation;
            const current = parseFloat(currentOperand);
            if (isNaN(current)) return;
            switch (op) {
                case 'sin': computation = Math.sin(Math.PI / 180 * current); break;
                case 'cos': computation = Math.cos(Math.PI / 180 * current); break;
                case 'tan': computation = Math.tan(Math.PI / 180 * current); break;
                case 'log': computation = Math.log10(current); break;
                case 'sqrt': computation = Math.sqrt(current); break;
                default: return;
            }
            setCurrentOperand(computation.toString());
            setOperation(undefined);
            setPreviousOperand('');
        } else {
            setPreviousOperand(currentOperand);
            setCurrentOperand('');
        }
    };

    const compute = () => {
        let computation;
        const prev = parseFloat(previousOperand);
        const current = parseFloat(currentOperand);
        if (isNaN(prev) || isNaN(current)) return;
        switch (operation) {
            case '+': computation = prev + current; break;
            case '-': computation = prev - current; break;
            case '*': computation = prev * current; break;
            case '÷': computation = prev / current; break;
            case '^': computation = Math.pow(prev, current); break;
            default: return;
        }
        setCurrentOperand(computation.toString());
        setOperation(undefined);
        setPreviousOperand('');
    };

    // Converter Logic
    useEffect(() => {
        const availableUnits = Object.keys(units[category]);
        if (!availableUnits.includes(fromUnit)) setFromUnit(availableUnits[0]);
        if (!availableUnits.includes(toUnit)) setToUnit(availableUnits[0]);
    }, [category]);

    useEffect(() => {
        const input = parseFloat(inputValue);
        if (isNaN(input)) {
            setOutputValue('-');
            return;
        }
        let result;
        if (category === 'temperature') {
            let tempC;
            if (fromUnit === 'celsius') tempC = input;
            if (fromUnit === 'fahrenheit') tempC = (input - 32) * 5/9;
            if (fromUnit === 'kelvin') tempC = input - 273.15;

            if (toUnit === 'celsius') result = tempC;
            if (toUnit === 'fahrenheit') result = (tempC * 9/5) + 32;
            if (toUnit === 'kelvin') result = tempC + 273.15;
        } else {
            const fromValue = units[category]?.[fromUnit] || 1;
            const toValue = units[category]?.[toUnit] || 1;
            result = input * fromValue / toValue;
        }
        setOutputValue(result.toFixed(5));
    }, [inputValue, fromUnit, toUnit, category]);

    return (
        <AppShell title="Calculator" icon="fas fa-calculator">
            <div className="calculator-app">
                <div className="container">
                    <div className="tabs">
                        <button className={`tab-link ${activeTab === 'calculator' ? 'active' : ''}`} onClick={() => setActiveTab('calculator')}>Scientific Calculator</button>
                        <button className={`tab-link ${activeTab === 'converter' ? 'active' : ''}`} onClick={() => setActiveTab('converter')}>Unit Converter</button>
                    </div>

                    {activeTab === 'calculator' && (
                        <div className="tab-content" style={{ display: 'block' }}>
                            <div className="calculator-grid">
                                <div className="output">
                                    <div className="previous-operand">{previousOperand} {operation}</div>
                                    <div className="current-operand">{currentOperand || '0'}</div>
                                </div>
                                <button onClick={clear} className="span-two">AC</button>
                                <button onClick={del}>DEL</button>
                                <button onClick={() => chooseOperation('÷')}>÷</button>
                                <button onClick={() => appendNumber('1')}>1</button>
                                <button onClick={() => appendNumber('2')}>2</button>
                                <button onClick={() => appendNumber('3')}>3</button>
                                <button onClick={() => chooseOperation('*')}>*</button>
                                <button onClick={() => appendNumber('4')}>4</button>
                                <button onClick={() => appendNumber('5')}>5</button>
                                <button onClick={() => appendNumber('6')}>6</button>
                                <button onClick={() => chooseOperation('+')}>+</button>
                                <button onClick={() => appendNumber('7')}>7</button>
                                <button onClick={() => appendNumber('8')}>8</button>
                                <button onClick={() => appendNumber('9')}>9</button>
                                <button onClick={() => chooseOperation('-')}>-</button>
                                <button onClick={() => appendNumber('.')}>.</button>
                                <button onClick={() => appendNumber('0')}>0</button>
                                <button onClick={compute} className="span-two">=</button>
                                <button onClick={() => chooseOperation('sin')}>sin</button>
                                <button onClick={() => chooseOperation('cos')}>cos</button>
                                <button onClick={() => chooseOperation('tan')}>tan</button>
                                <button onClick={() => chooseOperation('log')}>log</button>
                                <button onClick={() => chooseOperation('sqrt')}>sqrt</button>
                                <button onClick={() => chooseOperation('^')}>^</button>
                                <button onClick={() => appendNumber('(')}>(</button>
                                <button onClick={() => appendNumber(')')}>)</button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'converter' && (
                        <div className="tab-content" style={{ display: 'block' }}>
                            <h2>Unit Converter</h2>
                            <div className="converter-wrapper">
                                <div className="form-group">
                                    <label>Category:</label>
                                    <select value={category} onChange={e => setCategory(e.target.value)}>
                                        <option value="length">Length</option>
                                        <option value="weight">Weight</option>
                                        <option value="temperature">Temperature</option>
                                         <option value="area">Area</option>
                                        <option value="volume">Volume</option>
                                        <option value="time">Time</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <input type="number" placeholder="Enter value" value={inputValue} onChange={e => setInputValue(e.target.value)} />
                                    <select value={fromUnit} onChange={e => setFromUnit(e.target.value)}>
                                        {Object.keys(units[category]).map(u => <option key={u} value={u}>{u}</option>)}
                                    </select>
                                </div>
                                <div className="to-section"><p>TO</p></div>
                                <div className="form-group">
                                    <p id="outputValue">{outputValue}</p>
                                    <select value={toUnit} onChange={e => setToUnit(e.target.value)}>
                                        {Object.keys(units[category]).map(u => <option key={u} value={u}>{u}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppShell>
    );
}
