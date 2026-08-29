document.addEventListener('DOMContentLoaded', () => {
    let items = [
        { desc: 'Enterprise SaaS License (UltraSudo Workstation)', qty: 5, rate: 120 },
        { desc: 'Custom Security Audit & Vulnerability Assessment', qty: 1, rate: 850 }
    ];

    const tbody = document.getElementById('invoice-items');
    const statusSelect = document.getElementById('status-select');
    const statusPill = document.getElementById('status-pill');

    // Date defaults
    const today = new Date().toISOString().split('T')[0];
    const due14 = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    document.getElementById('invoice-date').value = today;
    document.getElementById('invoice-due').value = due14;

    renderItems();

    statusSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        statusPill.textContent = val.toUpperCase();
        statusPill.className = `status-pill status-${val}`;
    });

    document.getElementById('add-line-btn').addEventListener('click', () => {
        items.push({ desc: '', qty: 1, rate: 0 });
        renderItems();
    });

    document.getElementById('btn-print').addEventListener('click', () => {
        window.print();
    });

    document.getElementById('btn-save').addEventListener('click', () => {
        const invoiceData = {
            number: document.getElementById('invoice-number').value,
            date: document.getElementById('invoice-date').value,
            client: document.getElementById('client-name').value,
            status: statusSelect.value,
            items: items,
            total: document.getElementById('inv-total').textContent
        };
        localStorage.setItem('ultrasudo_invoice_' + invoiceData.number, JSON.stringify(invoiceData));
        alert(`Invoice ${invoiceData.number} saved!`);
    });

    function renderItems() {
        tbody.innerHTML = '';
        items.forEach((item, index) => {
            const tr = document.createElement('tr');

            tr.innerHTML = `
                <td><input type="text" class="item-desc" value="${escapeHtml(item.desc)}" placeholder="Item description"></td>
                <td><input type="number" class="item-qty" value="${item.qty}" min="1" style="text-align: center;"></td>
                <td><input type="number" class="item-rate" value="${item.rate}" step="0.01" style="text-align: right;"></td>
                <td style="text-align: right; font-weight: 600;" class="item-amount">$0.00</td>
                <td class="no-print" style="text-align: center;"><button class="delete-btn"><i class="fas fa-times"></i></button></td>
            `;

            const descInput = tr.querySelector('.item-desc');
            const qtyInput = tr.querySelector('.item-qty');
            const rateInput = tr.querySelector('.item-rate');
            const deleteBtn = tr.querySelector('.delete-btn');

            descInput.addEventListener('input', (e) => { items[index].desc = e.target.value; });
            qtyInput.addEventListener('input', (e) => { items[index].qty = parseFloat(e.target.value) || 0; calculateTotals(); });
            rateInput.addEventListener('input', (e) => { items[index].rate = parseFloat(e.target.value) || 0; calculateTotals(); });

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
        let subtotal = 0;

        const rows = tbody.querySelectorAll('tr');
        rows.forEach((row, i) => {
            const item = items[i];
            if (item) {
                const amount = item.qty * item.rate;
                subtotal += amount;
                row.querySelector('.item-amount').textContent = `$${amount.toFixed(2)}`;
            }
        });

        const tax = subtotal * 0.085;
        const total = subtotal + tax;

        document.getElementById('inv-subtotal').textContent = `$${subtotal.toFixed(2)}`;
        document.getElementById('inv-tax').textContent = `$${tax.toFixed(2)}`;
        document.getElementById('inv-total').textContent = `$${total.toFixed(2)}`;
    }

    function escapeHtml(text) {
        return (text || '').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
});
