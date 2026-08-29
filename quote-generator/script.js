document.addEventListener('DOMContentLoaded', () => {
    let items = [
        { description: 'UltraSudo Platform Subscription (Annual)', qty: 1, unitPrice: 299 },
        { description: 'Custom Security & Workspace Onboarding', qty: 1, unitPrice: 150 }
    ];

    const tbody = document.getElementById('items-tbody');
    const currencySelect = document.getElementById('currency-select');
    const taxInput = document.getElementById('tax-rate');
    const discountInput = document.getElementById('discount-val-input');

    // Set today's date
    const today = new Date().toISOString().split('T')[0];
    const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    document.getElementById('quote-date').value = today;
    document.getElementById('quote-valid').value = in30Days;

    renderItems();

    document.getElementById('add-item-btn').addEventListener('click', () => {
        items.push({ description: '', qty: 1, unitPrice: 0 });
        renderItems();
    });

    currencySelect.addEventListener('change', calculateTotals);
    taxInput.addEventListener('input', calculateTotals);
    discountInput.addEventListener('input', calculateTotals);

    document.getElementById('btn-print').addEventListener('click', () => {
        window.print();
    });

    document.getElementById('btn-sample').addEventListener('click', () => {
        items = [
            { description: 'Cloud Workspace Architecture Setup', qty: 1, unitPrice: 1200 },
            { description: 'AI Agent Fine-Tuning & Tool Integration', qty: 2, unitPrice: 450 },
            { description: 'Post-Quantum Vault Data Migration', qty: 1, unitPrice: 350 }
        ];
        document.getElementById('client-name').value = 'Wayne Enterprises';
        document.getElementById('client-email').value = 'bruce@wayne.com';
        document.getElementById('client-address').value = '1007 Mountain Drive, Gotham City';
        renderItems();
    });

    document.getElementById('btn-save').addEventListener('click', () => {
        const quoteData = {
            number: document.getElementById('quote-number').value,
            date: document.getElementById('quote-date').value,
            client: document.getElementById('client-name').value,
            items: items,
            grandTotal: document.getElementById('grand-total-val').textContent
        };
        localStorage.setItem('ultrasudo_quote_' + quoteData.number, JSON.stringify(quoteData));
        alert(`Quote ${quoteData.number} saved successfully!`);
    });

    function renderItems() {
        tbody.innerHTML = '';
        items.forEach((item, index) => {
            const tr = document.createElement('tr');

            tr.innerHTML = `
                <td><input type="text" class="item-desc" value="${escapeHtml(item.description)}" placeholder="Item description"></td>
                <td><input type="number" class="item-qty" value="${item.qty}" min="1" style="text-align: center;"></td>
                <td><input type="number" class="item-price" value="${item.unitPrice}" step="0.01" style="text-align: right;"></td>
                <td style="text-align: right; font-weight: 600;" class="item-total">0.00</td>
                <td class="no-print" style="text-align: center;"><button class="delete-item-btn"><i class="fas fa-times"></i></button></td>
            `;

            const descInput = tr.querySelector('.item-desc');
            const qtyInput = tr.querySelector('.item-qty');
            const priceInput = tr.querySelector('.item-price');
            const deleteBtn = tr.querySelector('.delete-item-btn');

            descInput.addEventListener('input', (e) => { items[index].description = e.target.value; });
            qtyInput.addEventListener('input', (e) => { items[index].qty = parseFloat(e.target.value) || 0; calculateTotals(); });
            priceInput.addEventListener('input', (e) => { items[index].unitPrice = parseFloat(e.target.value) || 0; calculateTotals(); });

            deleteBtn.addEventListener('click', () => {
                if (items.length > 1) {
                    items.splice(index, 1);
                    renderItems();
                }
            });

            tbody.appendChild(tr);
        });

        calculateTotals();
    }

    function calculateTotals() {
        const sym = currencySelect.value;
        let subtotal = 0;

        const rows = tbody.querySelectorAll('tr');
        rows.forEach((row, i) => {
            const item = items[i];
            if (item) {
                const total = item.qty * item.unitPrice;
                subtotal += total;
                row.querySelector('.item-total').textContent = `${sym}${total.toFixed(2)}`;
            }
        });

        const taxRate = parseFloat(taxInput.value) || 0;
        const discountRate = parseFloat(discountInput.value) || 0;

        const tax = subtotal * (taxRate / 100);
        const discount = subtotal * (discountRate / 100);
        const grandTotal = subtotal + tax - discount;

        document.getElementById('subtotal-val').textContent = `${sym}${subtotal.toFixed(2)}`;
        document.getElementById('tax-val').textContent = `${sym}${tax.toFixed(2)}`;
        document.getElementById('discount-val').textContent = `${sym}${discount.toFixed(2)}`;
        document.getElementById('grand-total-val').textContent = `${sym}${grandTotal.toFixed(2)}`;
    }

    function escapeHtml(text) {
        return (text || '').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
});
