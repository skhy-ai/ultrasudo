import React, { useState, useEffect, useMemo } from 'react';
import AppShell from '../../../components/shared/AppShell/AppShell';
import useLocalStore from '../../../hooks/useLocalStore';
import './QuoteGenerator.css';

export default function QuoteGenerator() {
    const [activeTab, setActiveTab] = useState('quotes');
    const [catalog, setCatalog] = useLocalStore('quote_catalog', []);
    const [savedQuotes, setSavedQuotes] = useLocalStore('quote_saved', []);
    const [lineItems, setLineItems] = useState([{ id: 1, name: '', price: 0, qty: 1 }]);
    const [taxRate, setTaxRate] = useState(0);
    const [bizDetails, setBizDetails] = useState({ name: '', number: 'QT-001', client: '', date: new Date().toISOString().split('T')[0], notes: '' });
    const [showPreview, setShowPreview] = useState(false);

    // Catalog form state
    const [catForm, setCatForm] = useState({ name: '', price: '', desc: '' });

    // Calculations
    const subtotal = useMemo(() => lineItems.reduce((acc, item) => acc + (item.price * item.qty), 0), [lineItems]);
    const tax = useMemo(() => subtotal * (taxRate / 100), [subtotal, taxRate]);
    const total = useMemo(() => subtotal + tax, [subtotal, tax]);

    const addLineItem = (preset = null) => {
        const newItem = {
            id: Date.now(),
            name: preset?.name || '',
            price: preset?.price || 0,
            qty: preset?.qty || 1
        };
        setLineItems([...lineItems, newItem]);
    };

    const removeLineItem = (id) => {
        setLineItems(lineItems.filter(i => i.id !== id));
    };

    const updateLineItem = (id, field, val) => {
        setLineItems(lineItems.map(i => i.id === id ? { ...i, [field]: val } : i));
    };

    const addCatalogItem = () => {
        if (!catForm.name) return;
        setCatalog([...catalog, { ...catForm, id: Date.now(), price: parseFloat(catForm.price) || 0 }]);
        setCatForm({ name: '', price: '', desc: '' });
    };

    const useCatalogItem = (item) => {
        addLineItem({ name: item.name, price: item.price, qty: 1 });
        setActiveTab('quotes');
    };

    const saveQuote = () => {
        const quote = {
            id: Date.now(),
            ...bizDetails,
            items: [...lineItems],
            taxRate,
            total: total.toFixed(2)
        };
        setSavedQuotes([...savedQuotes, quote]);
        alert('Quote saved!');
    };

    const formatCurrency = (n) => `$${parseFloat(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;

    return (
        <AppShell title="Quote & Catalog" icon="fas fa-quote-left">
            <div className="quote-app">
                <nav className="tab-nav">
                    <button className={activeTab === 'quotes' ? 'active' : ''} onClick={() => setActiveTab('quotes')}>Build Quote</button>
                    <button className={activeTab === 'catalog' ? 'active' : ''} onClick={() => setActiveTab('catalog')}>Catalog</button>
                    <button className={activeTab === 'saved' ? 'active' : ''} onClick={() => setActiveTab('saved')}>History</button>
                </nav>

                <div className="tab-content">
                    {activeTab === 'quotes' && (
                        <div className="quote-builder">
                            <div className="biz-header">
                                <div className="input-group">
                                    <input type="text" placeholder="Your Business Name" value={bizDetails.name} onChange={e => setBizDetails({...bizDetails, name: e.target.value})} />
                                    <input type="text" placeholder="Quote Number" value={bizDetails.number} onChange={e => setBizDetails({...bizDetails, number: e.target.value})} />
                                </div>
                                <div className="input-group">
                                    <input type="text" placeholder="Client Name" value={bizDetails.client} onChange={e => setBizDetails({...bizDetails, client: e.target.value})} />
                                    <input type="date" value={bizDetails.date} onChange={e => setBizDetails({...bizDetails, date: e.target.value})} />
                                </div>
                            </div>

                            <div className="line-items-table">
                                <div className="table-header">
                                    <span>Description</span>
                                    <span>Price</span>
                                    <span>Qty</span>
                                    <span>Total</span>
                                    <span></span>
                                </div>
                                {lineItems.map(item => (
                                    <div key={item.id} className="line-item">
                                        <input type="text" className="li-name" placeholder="Item description" value={item.name} onChange={e => updateLineItem(item.id, 'name', e.target.value)} />
                                        <input type="number" className="li-price" placeholder="0.00" value={item.price} onChange={e => updateLineItem(item.id, 'price', parseFloat(e.target.value) || 0)} />
                                        <input type="number" className="li-qty" placeholder="1" value={item.qty} onChange={e => updateLineItem(item.id, 'qty', parseInt(e.target.value) || 0)} />
                                        <span className="li-total">{formatCurrency(item.price * item.qty)}</span>
                                        <button className="del-btn" onClick={() => removeLineItem(item.id)}><i className="fas fa-trash"></i></button>
                                    </div>
                                ))}
                                <button className="add-btn" onClick={() => addLineItem()}><i className="fas fa-plus"></i> Add Line Item</button>
                            </div>

                            <div className="quote-footer">
                                <div className="notes-area">
                                    <textarea placeholder="Notes / Terms..." value={bizDetails.notes} onChange={e => setBizDetails({...bizDetails, notes: e.target.value})}></textarea>
                                </div>
                                <div className="summary-area">
                                    <div className="summary-row"><span>Subtotal:</span> <span>{formatCurrency(subtotal)}</span></div>
                                    <div className="summary-row">
                                        <span>Tax %:</span> 
                                        <input type="number" value={taxRate} onChange={e => setTaxRate(parseFloat(e.target.value) || 0)} />
                                    </div>
                                    <div className="summary-row total"><span>Grand Total:</span> <span>{formatCurrency(total)}</span></div>
                                    <div className="action-btns">
                                        <button className="preview-btn" onClick={() => setShowPreview(true)}><i className="fas fa-eye"></i> Preview</button>
                                        <button className="save-btn" onClick={saveQuote}><i className="fas fa-save"></i> Save</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'catalog' && (
                        <div className="catalog-manager">
                            <div className="add-cat-card">
                                <h3>Add to Catalog</h3>
                                <div className="input-group">
                                    <input type="text" placeholder="Product Name" value={catForm.name} onChange={e => setCatForm({...catForm, name: e.target.value})} />
                                    <input type="number" placeholder="Default Price" value={catForm.price} onChange={e => setCatForm({...catForm, price: e.target.value})} />
                                </div>
                                <textarea placeholder="Description" value={catForm.desc} onChange={e => setCatForm({...catForm, desc: e.target.value})}></textarea>
                                <button className="add-cat-btn" onClick={addCatalogItem}>Add Item</button>
                            </div>
                            <div className="catalog-list">
                                {catalog.map(item => (
                                    <div key={item.id} className="catalog-item">
                                        <div className="item-main">
                                            <strong>{item.name}</strong>
                                            <p>{item.desc}</p>
                                        </div>
                                        <div className="item-price">{formatCurrency(item.price)}</div>
                                        <button className="use-btn" onClick={() => useCatalogItem(item)}>Use</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'saved' && (
                        <div className="saved-list">
                            {savedQuotes.map(q => (
                                <div key={q.id} className="saved-item">
                                    <div className="si-header">
                                        <strong>{q.number} — {q.client || 'Unknown'}</strong>
                                        <span className="si-total">${q.total}</span>
                                    </div>
                                    <div className="si-meta">{q.date} • {q.items.length} items</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {showPreview && (
                    <div className="preview-overlay" onClick={() => setShowPreview(false)}>
                        <div className="preview-modal" onClick={e => e.stopPropagation()}>
                            <button className="close-preview" onClick={() => setShowPreview(false)}>&times;</button>
                            <div className="printable-quote">
                                <h1>{bizDetails.name || 'QUOTATION'}</h1>
                                <div className="meta">
                                    <div><strong>Quote #:</strong> {bizDetails.number}</div>
                                    <div><strong>Date:</strong> {bizDetails.date}</div>
                                    <div><strong>To:</strong> {bizDetails.client}</div>
                                </div>
                                <table>
                                    <thead><tr><th>Description</th><th>Price</th><th>Qty</th><th>Total</th></tr></thead>
                                    <tbody>
                                        {lineItems.map(i => (
                                            <tr key={i.id}>
                                                <td>{i.name}</td>
                                                <td>{formatCurrency(i.price)}</td>
                                                <td>{i.qty}</td>
                                                <td>{formatCurrency(i.price * i.qty)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div className="preview-totals">
                                    <p>Subtotal: {formatCurrency(subtotal)}</p>
                                    {taxRate > 0 && <p>Tax ({taxRate}%): {formatCurrency(tax)}</p>}
                                    <p className="final-total">Total: {formatCurrency(total)}</p>
                                </div>
                                {bizDetails.notes && <div className="preview-notes"><strong>Notes:</strong> {bizDetails.notes}</div>}
                            </div>
                            <button className="print-btn" onClick={() => window.print()}><i className="fas fa-print"></i> Print PDF</button>
                        </div>
                    </div>
                )}
            </div>
        </AppShell>
    );
}
