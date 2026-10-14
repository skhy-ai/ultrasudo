import React, { useState } from 'react';
import AppShell from '../../../components/shared/AppShell/AppShell';
import useLocalStore from '../../../hooks/useLocalStore';
import { useAppAgent } from '../../../hooks/useAppAgent';
import { GLYCEMIC_FOODS, DELIVERY_SERVICES_BY_COUNTRY } from '../../../data/groceryData';
import './Grocery.css';

export default function Grocery() {
    const [list, setList] = useLocalStore('smart_shop_list', []);
    const [country, setCountry] = useLocalStore('smart_shop_country', 'us');
    const [customItem, setCustomItem] = useState('');

    useAppAgent({
        appId: 'grocery',
        appName: 'Smart Grocery List',
        getContext: () => ({
            itemsCount: list.length,
            uncheckedCount: list.filter(i => !i.checked).length,
            country,
            items: list.map(i => ({ id: i.id, name: i.name, checked: i.checked, gi: i.gi }))
        }),
        suggestedPrompts: [
            'Add healthy ingredients: Avocados, Greek yogurt, Blueberries',
            'Suggest low glycemic dinner staples',
            'Clear all checked grocery items'
        ],
        actions: [
            {
                name: 'add_grocery_item',
                description: 'Add an item to the smart grocery shopping list',
                parameters: {
                    name: { type: 'string', description: 'Item name' },
                    type: { type: 'string', description: 'Food category or type' },
                    gi: { type: 'string', description: 'Glycemic index score (Low, Med, High)' }
                },
                handler: ({ name, type = 'general', gi = '?' }) => {
                    if (!name) throw new Error('Item name is required');
                    const newItem = {
                        id: Date.now(),
                        name: name.trim(),
                        type,
                        gi,
                        color: '#3b82f6',
                        checked: false
                    };
                    setList(prev => [...prev, newItem]);
                    return { success: true, item: newItem };
                }
            },
            {
                name: 'clear_checked',
                description: 'Clear all checked/purchased grocery items',
                parameters: {},
                isDestructive: true,
                handler: () => {
                    setList(prev => prev.filter(i => !i.checked));
                    return { success: true };
                }
            }
        ]
    });

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

    const openDeliveryService = (service) => {
        const items = list.filter(i => !i.checked).map(i => i.name).join(' ');
        if (!items) {
            alert('Your active shopping list is empty. Add items first!');
            return;
        }
        const url = service.getUrl(items);
        window.open(url, '_blank');
    };

    const activeCountryData = DELIVERY_SERVICES_BY_COUNTRY[country] || DELIVERY_SERVICES_BY_COUNTRY.us;
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

    return (
        <AppShell title="Smart Shop" icon="fas fa-shopping-basket">
            <div className="grocery-app">
                <header className="grocery-header">
                    <div className="date-display">{today}</div>
                    <div className="country-selector-wrapper">
                        <label htmlFor="grocery-country"><i className="fas fa-globe"></i> Location: </label>
                        <select 
                            id="grocery-country" 
                            className="country-select"
                            value={country} 
                            onChange={(e) => setCountry(e.target.value)}
                        >
                            {Object.entries(DELIVERY_SERVICES_BY_COUNTRY).map(([key, data]) => (
                                <option key={key} value={key}>
                                    {data.flag} {data.label}
                                </option>
                            ))}
                        </select>
                    </div>
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
                            <h2 className="section-title">
                                <i className="fas fa-truck"></i> Order Online ({activeCountryData.flag} {activeCountryData.label})
                            </h2>
                            <div className="delivery-grid">
                                {activeCountryData.services.map(svc => (
                                    <button 
                                        key={svc.name} 
                                        className="delivery-btn" 
                                        onClick={() => openDeliveryService(svc)}
                                        title={`Search shopping list on ${svc.name}`}
                                    >
                                        <i className={svc.icon}></i> {svc.name}
                                    </button>
                                ))}
                            </div>
                        </section>
                    </aside>
                </div>
            </div>
        </AppShell>
    );
}

