// script.js

document.addEventListener('DOMContentLoaded', () => {
    // Tab functionality
    window.openTab = function(evt, tabName) {
        let i, tabcontent, tablinks;
        tabcontent = document.getElementsByClassName("tab-content");
        for (i = 0; i < tabcontent.length; i++) {
            tabcontent[i].style.display = "none";
        }
        tablinks = document.getElementsByClassName("tab-link");
        for (i = 0; i < tablinks.length; i++) {
            tablinks[i].className = tablinks[i].className.replace(" active", "");
        }
        document.getElementById(tabName).style.display = "block";
        evt.currentTarget.className += " active";
    }

    // Calculator logic
    const numberButtons = document.querySelectorAll('[data-number]');
    const operationButtons = document.querySelectorAll('[data-operation]');
    const equalsButton = document.querySelector('[data-equals]');
    const deleteButton = document.querySelector('[data-delete]');
    const allClearButton = document.querySelector('[data-all-clear]');
    const previousOperandTextElement = document.querySelector('[data-previous-operand]');
    const currentOperandTextElement = document.querySelector('[data-current-operand]');

    let currentOperand = '';
    let previousOperand = '';
    let operation = undefined;

    const clear = () => {
        currentOperand = '';
        previousOperand = '';
        operation = undefined;
    };

    const del = () => {
        currentOperand = currentOperand.toString().slice(0, -1);
    };

    const appendNumber = (number) => {
        if (number === '.' && currentOperand.includes('.')) return;
        currentOperand = currentOperand.toString() + number.toString();
    };

    const chooseOperation = (op) => {
        if (currentOperand === '' && !['sin', 'cos', 'tan', 'log', 'sqrt'].includes(op)) return;
        if (previousOperand !== '') {
            compute();
        }
        operation = op;
        if (['sin', 'cos', 'tan', 'log', 'sqrt'].includes(op)) {
            compute();
        } else {
            previousOperand = currentOperand;
            currentOperand = '';
        }
    };

    const compute = () => {
        let computation;
        const prev = parseFloat(previousOperand);
        const current = parseFloat(currentOperand);

        if (['sin', 'cos', 'tan', 'log', 'sqrt'].includes(operation)) {
            if (isNaN(current)) return;
            switch (operation) {
                case 'sin': computation = Math.sin(Math.PI / 180 * current); break; // degrees to radians
                case 'cos': computation = Math.cos(Math.PI / 180 * current); break;
                case 'tan': computation = Math.tan(Math.PI / 180 * current); break;
                case 'log': computation = Math.log10(current); break;
                case 'sqrt': computation = Math.sqrt(current); break;
                default: return;
            }
            currentOperand = computation;
            operation = undefined;
            previousOperand = '';
            return;
        }

        if (isNaN(prev) || isNaN(current)) return;
        switch (operation) {
            case '+': computation = prev + current; break;
            case '-': computation = prev - current; break;
            case '*': computation = prev * current; break;
            case '÷': computation = prev / current; break;
            case '^': computation = Math.pow(prev, current); break;
            default: return;
        }
        currentOperand = computation;
        operation = undefined;
        previousOperand = '';
    };

    const updateDisplay = () => {
        currentOperandTextElement.innerText = currentOperand;
        if (operation != null) {
            previousOperandTextElement.innerText = `${previousOperand} ${operation}`;
        } else {
            previousOperandTextElement.innerText = '';
        }
    };

    numberButtons.forEach(button => {
        button.addEventListener('click', () => {
            appendNumber(button.innerText);
            updateDisplay();
        });
    });

    operationButtons.forEach(button => {
        button.addEventListener('click', () => {
            chooseOperation(button.innerText);
            updateDisplay();
        });
    });

    equalsButton.addEventListener('click', button => {
        compute();
        updateDisplay();
    });

    allClearButton.addEventListener('click', button => {
        clear();
        updateDisplay();
    });

    deleteButton.addEventListener('click', button => {
        del();
        updateDisplay();
    });

    // Unit converter logic
    const categorySelect = document.getElementById('category');
    const fromUnitSelect = document.getElementById('fromUnit');
    const toUnitSelect = document.getElementById('toUnit');
    const inputValue = document.getElementById('inputValue');
    const outputValue = document.getElementById('outputValue');

    const units = {
        length: { 'meters': 1, 'kilometers': 1000, 'centimeters': 0.01, 'millimeters': 0.001, 'miles': 1609.34, 'yards': 0.9144, 'feet': 0.3048, 'inches': 0.0254 },
        weight: { 'grams': 1, 'kilograms': 1000, 'milligrams': 0.001, 'pounds': 453.592, 'ounces': 28.3495 },
        temperature: { 'celsius': 'c', 'fahrenheit': 'f', 'kelvin': 'k' },
        area: { 'square meters': 1, 'square kilometers': 1000000, 'square miles': 2589990, 'acres': 4046.86, 'hectares': 10000 },
        volume: { 'liters': 1, 'milliliters': 0.001, 'cubic meters': 1000, 'gallons': 3.78541, 'pints': 0.473176 },
        time: { 'seconds': 1, 'minutes': 60, 'hours': 3600, 'days': 86400 }
    };

    const populateUnits = () => {
        const category = categorySelect.value;
        fromUnitSelect.innerHTML = '';
        toUnitSelect.innerHTML = '';
        for (const unit in units[category]) {
            fromUnitSelect.add(new Option(unit, unit));
            toUnitSelect.add(new Option(unit, unit));
        }
        convert();
    };

    const convert = () => {
        const category = categorySelect.value;
        const from = fromUnitSelect.value;
        const to = toUnitSelect.value;
        const input = parseFloat(inputValue.value);

        if (isNaN(input)) {
            outputValue.textContent = '-';
            return;
        }

        let result;
        if (category === 'temperature') {
            // Temperature conversion is special
            let tempC;
            if (from === 'celsius') tempC = input;
            if (from === 'fahrenheit') tempC = (input - 32) * 5/9;
            if (from === 'kelvin') tempC = input - 273.15;

            if (to === 'celsius') result = tempC;
            if (to === 'fahrenheit') result = (tempC * 9/5) + 32;
            if (to === 'kelvin') result = tempC + 273.15;
        } else {
            const fromValue = units[category][from];
            const toValue = units[category][to];
            result = input * fromValue / toValue;
        }

        outputValue.textContent = result.toFixed(5);
    };

    categorySelect.addEventListener('change', populateUnits);
    fromUnitSelect.addEventListener('change', convert);
    toUnitSelect.addEventListener('change', convert);
    inputValue.addEventListener('input', convert);

    // Initial population
    populateUnits();
});
