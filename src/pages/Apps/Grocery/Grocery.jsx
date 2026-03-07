import React, { useState } from 'react';
import AppShell from '../../../components/shared/AppShell/AppShell';
import useLocalStore from '../../../hooks/useLocalStore';
import './Grocery.css';

const GLYCEMIC_FOODS = [
    { name: "Rolled Oats", type: "low", gi: 55, color: "#e0c8b0" },
    { name: "Quinoa", type: "low", gi: 53, color: "#95a5a6" },
    { name: "Lentils", type: "low", gi: 32, color: "#bdc3c7" },
    { name: "Apples", type: "low", gi: 36, color: "#ff4d4d" },
    { name: "Berries", type: "low", gi: 40, color: "#9b59b6" },
    { name: "Broccoli", type: "low", gi: 15, color: "#27ae60" },
    { name: "Spinach", type: "low", gi: 15, color: "#2ecc71" },
    { name: "Avocado", type: "low", gi: 15, color: "#16a085" },
    { name: "Salmon", type: "low", gi: 0, color: "#fa8072" },
    { name: "Tofu", type: "low", gi: 15, color: "#ecf0f1" },
    { name: "Greek Yogurt", type: "low", gi: 11, color: "#f9f9f9" },
    { name: "Almonds", type: "low", gi: 0, color: "#d2b48c" },
    { name: "Sweet Potato", type: "medium", gi: 63, color: "#e67e22" },
    { name: "Banana", type: "medium", gi: 62, color: "#f1c40f" }
];

export default function Grocery() {
    const [list, setList] = useLocalStore('smart_shop_list', []);
    const [customItem, setCustomItem] = useState('');

    const addItem = (item) => {
        const existing = list.find(x => x.name === item.name);
        if (!existing) {
            setList([...list, { ...item, id: Date.now(), checked: false }]);
        }
    };

    const addCustomItem = () => {
        if (customItem.trim()) {
            setList([...list, { 
                name: customItem.trim(), 
                type: 'unknown', 
                gi: '?', 
                color: '#eee', 
                id: Date.now(),
                checked: false
            }]);
            setCustomItem('');
        }
    };

    const removeItem = (id) => {
        setList(list.filter(item => item.id !== id));
    };

    const toggleItem = (id) => {
        setList(list.map(item => 
            item.id === id ? { ...item, checked: !item.checked } : item
        ));
    };

    const openStore = (store) => {
        const items = list.filter(i => !i.checked).map(i => i.name).join(' ');
        if (!items) return;
        
        let url = '';
        if (store === 'Instacart') url = `https://www.instacart.com/store/search/${encodeURIComponent(items)}`;
        else if (store === 'Walmart') url = `https://www.walmart.com/search?q=${encodeURIComponent(items)}`;
        else if (store === 'Amazon Fresh') url = `https://www.amazon.com/s?k=${encodeURIComponent(items)}&i=amazonfresh`;

        window.open(url, '_blank');
    };

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

    return (
        <AppShell title="Smart Shop" icon="fas fa-shopping-basket">
            <div className="grocery-app">
                <header className="grocery-header">
                    <div className="date-display">{today}</div>
                </header>

                <div className="grocery-layout">
                    <main className="grocery-main">
                        <section className="card card-quick">
                            <h2 className="section-title"><i className="fas fa-magic"></i> Quick Add Healthy Choices</h2>
                            <div className="quick-add-grid">
                                {GLYCEMIC_FOODS.map(food => (
                                    <div 
                                        key={food.name}
                                        className="food-card" 
                                        style={{ 
                                            backgroundColor: food.color,
                                            color: ['#ecf0f1', '#f9f9f9', '#bdc3c7'].includes(food.color) ? '#2f3640' : 'white'
                                        }}
                                        onClick={() => addItem(food)}
                                    >
                                        <span className="food-name">{food.name}</span>
                                        <span className="gi-tag">GI: {food.gi}</span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="card card-list">
                            <h2 className="section-title"><i className="fas fa-list-ul"></i> Your Shopping List</h2>
                            {list.length === 0 ? (
                                <div className="empty-state">
                                    <i className="fas fa-clipboard-list"></i>
                                    <p>Your list is empty. Start adding items!</p>
                                </div>
                            ) : (
                                <ul className="grocery-list">
                                    {list.map(item => (
                                        <li key={item.id} className={`grocery-item ${item.checked ? 'checked' : ''}`}>
                                            <div className="item-info" onClick={() => toggleItem(item.id)}>
                                                <span className={`item-gi-dot gi-${item.type}`}></span>
                                                <span className="item-name">{item.name}</span>
                                            </div>
                                            <button className="btn-remove" onClick={() => removeItem(item.id)}>
                                                <i className="fas fa-times"></i>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>
                    </main>

                    <aside className="grocery-sidebar">
                        <section className="card card-add">
                            <h2 className="section-title"><i className="fas fa-plus-circle"></i> Add Custom Item</h2>
                            <div className="input-group">
                                <input 
                                    type="text" 
                                    placeholder="e.g. Almond Milk" 
                                    value={customItem}
                                    onChange={(e) => setCustomItem(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && addCustomItem()}
                                />
                                <button className="btn btn-primary" onClick={addCustomItem}>Add</button>
                            </div>
                            <div className="gi-legend">
                                <div className="legend-item"><span className="item-gi-dot gi-low"></span> Low GI</div>
                                <div className="legend-item"><span className="item-gi-dot gi-medium"></span> Medium</div>
                                <div className="legend-item"><span className="item-gi-dot gi-high"></span> High</div>
                            </div>
                        </section>

                        <section className="card card-delivery">
                            <h2 className="section-title"><i className="fas fa-truck"></i> Order Online</h2>
                            <div className="delivery-grid">
                                <button className="delivery-btn" onClick={() => openStore('Instacart')}>
                                    <i className="fas fa-shipping-fast"></i> Instacart
                                </button>
                                <button className="delivery-btn" onClick={() => openStore('Walmart')}>
                                    <i className="fas fa-store"></i> Walmart
                                </button>
                                <button className="delivery-btn" onClick={() => openStore('Amazon Fresh')}>
                                    <i className="fab fa-amazon"></i> Amazon Fresh
                                </button>
                            </div>
                        </section>
                    </aside>
                </div>
            </div>
        </AppShell>
    );
}
