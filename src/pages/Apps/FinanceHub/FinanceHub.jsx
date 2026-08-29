import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import './FinanceHub.css';

// Default initial data stores
const INITIAL_STOCKS = [
    { symbol: 'AAPL', name: 'Apple Inc.', price: 224.23, change: +1.85, changePct: '+0.83%', category: 'Technology', pe: 34.2, rsi: 58.4, high52: 237.23, low52: 164.08, history: [215, 218, 216, 220, 222, 221, 224.23] },
    { symbol: 'MSFT', name: 'Microsoft Corp.', price: 447.67, change: -2.10, changePct: '-0.47%', category: 'Technology', pe: 36.1, rsi: 49.2, high52: 468.35, low52: 309.45, history: [455, 452, 450, 448, 449, 446, 447.67] },
    { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 128.50, change: +4.20, changePct: '+3.38%', category: 'Technology', pe: 68.5, rsi: 65.8, high52: 140.76, low52: 40.85, history: [118, 120, 122, 121, 125, 126, 128.50] },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 168.34, change: +0.75, changePct: '+0.45%', category: 'Technology', pe: 24.8, rsi: 52.1, high52: 191.75, low52: 120.21, history: [165, 164, 166, 167, 167, 169, 168.34] },
    { symbol: 'JPM', name: 'JPMorgan Chase', price: 216.90, change: +1.10, changePct: '+0.51%', category: 'Financials', pe: 12.4, rsi: 54.3, high52: 225.40, low52: 143.50, history: [210, 212, 213, 214, 215, 216, 216.90] },
    { symbol: 'TCS.NS', name: 'Tata Consultancy Services', price: 4450.00, change: +35.00, changePct: '+0.79%', category: 'Indian Tech', pe: 31.5, rsi: 56.0, high52: 4585.00, low52: 3310.00, history: [4380, 4400, 4410, 4425, 4430, 4440, 4450] },
];

const INITIAL_HOLDINGS = [
    { id: 1, symbol: 'NVDA', name: 'NVIDIA Corp.', shares: 150, avgCost: 95.00, currentPrice: 128.50, category: 'Stocks' },
    { id: 2, symbol: 'AAPL', name: 'Apple Inc.', shares: 80, avgCost: 190.00, currentPrice: 224.23, category: 'Stocks' },
    { id: 3, symbol: 'BTC', name: 'Bitcoin', shares: 0.85, avgCost: 58000.00, currentPrice: 64200.00, category: 'Crypto' },
    { id: 4, symbol: 'ETH', name: 'Ethereum', shares: 4.5, avgCost: 2800.00, currentPrice: 3150.00, category: 'Crypto' },
    { id: 5, symbol: 'REIT', name: 'Vanguard Real Estate', shares: 200, avgCost: 82.00, currentPrice: 88.40, category: 'Real Estate' },
];

const INITIAL_TRANSACTIONS = [
    { id: 1, date: '2026-08-28', desc: 'Transfer to Alex Morgan', category: 'Transfer', amount: -250.00, status: 'Completed' },
    { id: 2, date: '2026-08-27', desc: 'Dividend Received (NVDA)', category: 'Dividend', amount: +45.00, status: 'Completed' },
    { id: 3, date: '2026-08-25', desc: 'Bought 10 AAPL @ $220.00', category: 'Investment', amount: -2200.00, status: 'Completed' },
    { id: 4, date: '2026-08-22', desc: 'Converted $500 USD -> EUR', category: 'FX', amount: -500.00, status: 'Completed' },
    { id: 5, date: '2026-08-20', desc: 'Salary Deposit', category: 'Transfer', amount: +4500.00, status: 'Completed' },
];

const FX_RATES = {
    USD: 1.0,
    EUR: 0.90,
    GBP: 0.76,
    JPY: 144.50,
    INR: 83.90,
    CAD: 1.35,
    AUD: 1.47,
};

export default function FinanceHub() {
    const [searchParams, setSearchParams] = useSearchParams();
    
    // Tab state (read deep link tab param or default to 'markets')
    const activeTab = searchParams.get('tab') || 'markets';
    
    const setTab = (tab) => {
        setSearchParams({ tab });
    };

    // State Persistence
    const [stocks, setStocks] = useState(() => {
        const saved = localStorage.getItem('finance_stocks');
        return saved ? JSON.parse(saved) : INITIAL_STOCKS;
    });

    const [selectedStock, setSelectedStock] = useState(INITIAL_STOCKS[0]);

    const [holdings, setHoldings] = useState(() => {
        const saved = localStorage.getItem('finance_holdings');
        return saved ? JSON.parse(saved) : INITIAL_HOLDINGS;
    });

    const [transactions, setTransactions] = useState(() => {
        const saved = localStorage.getItem('finance_txs');
        return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
    });

    const [walletBalance, setWalletBalance] = useState(() => {
        const saved = localStorage.getItem('finance_wallet');
        return saved ? parseFloat(saved) : 12450.00;
    });

    // FX State
    const [fxFrom, setFxFrom] = useState('USD');
    const [fxTo, setFxTo] = useState('EUR');
    const [fxAmount, setFxAmount] = useState(100);

    // Modal State
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [transferRecipient, setTransferRecipient] = useState('');
    const [transferAmount, setTransferAmount] = useState('');
    const [transferNote, setTransferNote] = useState('');

    const [showAddHoldingModal, setShowAddHoldingModal] = useState(false);
    const [newSymbol, setNewSymbol] = useState('');
    const [newShares, setNewShares] = useState('');
    const [newCost, setNewCost] = useState('');

    // Screener filter state
    const [screenerCategory, setScreenerCategory] = useState('ALL');
    const [screenerSearch, setScreenerSearch] = useState('');

    // Save to localStorage
    useEffect(() => {
        localStorage.setItem('finance_stocks', JSON.stringify(stocks));
    }, [stocks]);

    useEffect(() => {
        localStorage.setItem('finance_holdings', JSON.stringify(holdings));
    }, [holdings]);

    useEffect(() => {
        localStorage.setItem('finance_txs', JSON.stringify(transactions));
    }, [transactions]);

    useEffect(() => {
        localStorage.setItem('finance_wallet', walletBalance.toString());
    }, [walletBalance]);

    // Financial calculations
    const totalPortfolioValue = holdings.reduce((sum, h) => sum + (h.shares * h.currentPrice), 0);
    const totalPortfolioCost = holdings.reduce((sum, h) => sum + (h.shares * h.avgCost), 0);
    const totalPnL = totalPortfolioValue - totalPortfolioCost;
    const totalPnLPct = totalPortfolioCost > 0 ? (totalPnL / totalPortfolioCost) * 100 : 0;
    const netWorth = totalPortfolioValue + walletBalance;

    // Handlers
    const handleSendMoney = (e) => {
        e.preventDefault();
        const amt = parseFloat(transferAmount);
        if (!amt || amt <= 0 || amt > walletBalance) {
            alert('Invalid transfer amount or insufficient wallet balance.');
            return;
        }

        const newTx = {
            id: Date.now(),
            date: new Date().toISOString().split('T')[0],
            desc: `Transfer to ${transferRecipient}${transferNote ? ` (${transferNote})` : ''}`,
            category: 'Transfer',
            amount: -amt,
            status: 'Completed'
        };

        setWalletBalance(prev => prev - amt);
        setTransactions([newTx, ...transactions]);
        setShowTransferModal(false);
        setTransferRecipient('');
        setTransferAmount('');
        setTransferNote('');
    };

    const handleAddHolding = (e) => {
        e.preventDefault();
        const shares = parseFloat(newShares);
        const cost = parseFloat(newCost);
        if (!newSymbol || !shares || shares <= 0 || !cost) {
            alert('Please fill out all required fields.');
            return;
        }

        const sym = newSymbol.toUpperCase();
        const existing = holdings.find(h => h.symbol === sym);
        if (existing) {
            const updated = holdings.map(h => {
                if (h.symbol === sym) {
                    const totalShares = h.shares + shares;
                    const avgCost = ((h.shares * h.avgCost) + (shares * cost)) / totalShares;
                    return { ...h, shares: totalShares, avgCost };
                }
                return h;
            });
            setHoldings(updated);
        } else {
            const newItem = {
                id: Date.now(),
                symbol: sym,
                name: `${sym} Corp.`,
                shares,
                avgCost: cost,
                currentPrice: cost,
                category: 'Stocks'
            };
            setHoldings([...holdings, newItem]);
        }

        setShowAddHoldingModal(false);
        setNewSymbol('');
        setNewShares('');
        setNewCost('');
    };

    const swapFx = () => {
        const temp = fxFrom;
        setFxFrom(fxTo);
        setFxTo(temp);
    };

    const convertedFx = (fxAmount * (FX_RATES[fxTo] / FX_RATES[fxFrom])).toFixed(2);

    // SVG Chart Builder
    const renderSparkline = (data, isPositive = true) => {
        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min || 1;
        const width = 500;
        const height = 180;
        const points = data.map((val, idx) => {
            const x = (idx / (data.length - 1)) * width;
            const y = height - ((val - min) / range) * (height - 30) - 15;
            return `${x},${y}`;
        }).join(' ');

        const strokeColor = isPositive ? '#34d399' : '#f87171';

        return (
            <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg">
                <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
                        <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
                    </linearGradient>
                </defs>
                <path
                    d={`M 0,${height} L ${points} L ${width},${height} Z`}
                    fill="url(#chartGradient)"
                />
                <polyline
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={points}
                />
            </svg>
        );
    };

    // Filtered stocks for screener
    const filteredStocks = stocks.filter(s => {
        const matchesCategory = screenerCategory === 'ALL' || s.category === screenerCategory;
        const matchesSearch = s.symbol.toLowerCase().includes(screenerSearch.toLowerCase()) || 
                              s.name.toLowerCase().includes(screenerSearch.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="finance-hub-container">
            {/* Header */}
            <div className="finance-header">
                <div className="finance-header-title">
                    <div className="finance-header-icon">
                        <i className="fas fa-chart-line"></i>
                    </div>
                    <div>
                        <h1>Finance Hub</h1>
                        <p>Unified Markets, Portfolio Management & P2P Banking</p>
                    </div>
                </div>

                <div className="finance-quick-stats">
                    <div className="quick-stat-card">
                        <span className="quick-stat-label">Net Worth</span>
                        <span className="quick-stat-value">${netWorth.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="quick-stat-card">
                        <span className="quick-stat-label">Portfolio Return</span>
                        <span className={`quick-stat-value ${totalPnL >= 0 ? 'positive' : 'negative'}`}>
                            {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)} ({totalPnLPct.toFixed(2)}%)
                        </span>
                    </div>
                    <div className="quick-stat-card">
                        <span className="quick-stat-label">Wallet Balance</span>
                        <span className="quick-stat-value">${walletBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="finance-tabs">
                <button 
                    className={`finance-tab-btn ${activeTab === 'markets' ? 'active' : ''}`}
                    onClick={() => setTab('markets')}
                >
                    <i className="fas fa-chart-candlestick"></i> Markets & Screener
                </button>
                <button 
                    className={`finance-tab-btn ${activeTab === 'portfolio' ? 'active' : ''}`}
                    onClick={() => setTab('portfolio')}
                >
                    <i className="fas fa-pie-chart"></i> Portfolio & Net Worth
                </button>
                <button 
                    className={`finance-tab-btn ${activeTab === 'payments' ? 'active' : ''}`}
                    onClick={() => setTab('payments')}
                >
                    <i className="fas fa-wallet"></i> Payments & FX
                </button>
                <button 
                    className={`finance-tab-btn ${activeTab === 'transactions' ? 'active' : ''}`}
                    onClick={() => setTab('transactions')}
                >
                    <i className="fas fa-history"></i> Activity Log
                </button>
            </div>

            {/* TAB 1: MARKETS & SCREENER */}
            {activeTab === 'markets' && (
                <div>
                    {/* Ticker Row */}
                    <div className="ticker-grid">
                        {stocks.map(stk => (
                            <div 
                                key={stk.symbol} 
                                className={`ticker-item ${selectedStock.symbol === stk.symbol ? 'selected' : ''}`}
                                onClick={() => setSelectedStock(stk)}
                            >
                                <div className="ticker-symbol">{stk.symbol}</div>
                                <div className="ticker-name">{stk.name}</div>
                                <div className="ticker-price-row">
                                    <span className="ticker-price">${stk.price.toFixed(2)}</span>
                                    <span className={`ticker-change ${stk.change >= 0 ? 'up' : 'down'}`}>
                                        {stk.changePct}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Chart & Selected Details */}
                    <div className="grid-2col">
                        <div className="finance-card">
                            <div className="finance-card-title">
                                <span>{selectedStock.symbol} — {selectedStock.name}</span>
                                <span className="ticker-price">${selectedStock.price.toFixed(2)}</span>
                            </div>
                            <div className="chart-container">
                                {renderSparkline(selectedStock.history, selectedStock.change >= 0)}
                            </div>
                        </div>

                        <div className="finance-card">
                            <div className="finance-card-title">Key Fundamentals</div>
                            <table className="finance-table">
                                <tbody>
                                    <tr>
                                        <td>Category</td>
                                        <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{selectedStock.category}</td>
                                    </tr>
                                    <tr>
                                        <td>P/E Ratio</td>
                                        <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{selectedStock.pe}</td>
                                    </tr>
                                    <tr>
                                        <td>RSI (14)</td>
                                        <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{selectedStock.rsi}</td>
                                    </tr>
                                    <tr>
                                        <td>52W High</td>
                                        <td style={{ textAlign: 'right', color: '#34d399' }}>${selectedStock.high52.toFixed(2)}</td>
                                    </tr>
                                    <tr>
                                        <td>52W Low</td>
                                        <td style={{ textAlign: 'right', color: '#f87171' }}>${selectedStock.low52.toFixed(2)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Screener Table */}
                    <div className="finance-card">
                        <div className="finance-card-title">
                            <span>Market Screener</span>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <input 
                                    type="text"
                                    placeholder="Search symbol or name..."
                                    className="finance-input"
                                    style={{ width: '220px', padding: '6px 12px' }}
                                    value={screenerSearch}
                                    onChange={(e) => setScreenerSearch(e.target.value)}
                                />
                                <select 
                                    className="finance-select"
                                    style={{ width: '160px', padding: '6px 12px' }}
                                    value={screenerCategory}
                                    onChange={(e) => setScreenerCategory(e.target.value)}
                                >
                                    <option value="ALL">All Categories</option>
                                    <option value="Technology">Technology</option>
                                    <option value="Financials">Financials</option>
                                    <option value="Indian Tech">Indian Tech</option>
                                </select>
                            </div>
                        </div>

                        <table className="finance-table">
                            <thead>
                                <tr>
                                    <th>Symbol</th>
                                    <th>Name</th>
                                    <th>Category</th>
                                    <th>Price</th>
                                    <th>Change</th>
                                    <th>P/E</th>
                                    <th>RSI</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStocks.map(stk => (
                                    <tr key={stk.symbol}>
                                        <td style={{ fontWeight: 'bold', color: '#38bdf8' }}>{stk.symbol}</td>
                                        <td>{stk.name}</td>
                                        <td>{stk.category}</td>
                                        <td>${stk.price.toFixed(2)}</td>
                                        <td>
                                            <span className={`ticker-change ${stk.change >= 0 ? 'up' : 'down'}`}>
                                                {stk.changePct}
                                            </span>
                                        </td>
                                        <td>{stk.pe}</td>
                                        <td>{stk.rsi}</td>
                                        <td>
                                            <button 
                                                className="finance-btn-secondary"
                                                style={{ padding: '4px 12px', fontSize: '0.85rem' }}
                                                onClick={() => {
                                                    setSelectedStock(stk);
                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                }}
                                            >
                                                Analyze
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB 2: PORTFOLIO & NET WORTH */}
            {activeTab === 'portfolio' && (
                <div>
                    <div className="grid-2col">
                        <div className="finance-card">
                            <div className="finance-card-title">
                                <span>Asset Holdings & Allocation</span>
                                <button className="finance-btn-primary" onClick={() => setShowAddHoldingModal(true)}>
                                    <i className="fas fa-plus"></i> Add Asset
                                </button>
                            </div>

                            <table className="finance-table">
                                <thead>
                                    <tr>
                                        <th>Asset</th>
                                        <th>Category</th>
                                        <th>Shares / Qty</th>
                                        <th>Avg Price</th>
                                        <th>Current Price</th>
                                        <th>Value</th>
                                        <th>Unrealized PnL</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {holdings.map(h => {
                                        const val = h.shares * h.currentPrice;
                                        const cost = h.shares * h.avgCost;
                                        const pnl = val - cost;
                                        const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
                                        return (
                                            <tr key={h.id}>
                                                <td>
                                                    <strong style={{ color: '#ffffff' }}>{h.symbol}</strong>
                                                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{h.name}</div>
                                                </td>
                                                <td>{h.category}</td>
                                                <td>{h.shares}</td>
                                                <td>${h.avgCost.toFixed(2)}</td>
                                                <td>${h.currentPrice.toFixed(2)}</td>
                                                <td style={{ fontWeight: 'bold' }}>${val.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                                <td style={{ color: pnl >= 0 ? '#34d399' : '#f87171', fontWeight: 'bold' }}>
                                                    {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)} ({pnlPct.toFixed(1)}%)
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="finance-card">
                            <div className="finance-card-title">Net Worth Breakdown</div>
                            <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#38bdf8' }}>
                                    ${netWorth.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </div>
                                <p style={{ color: '#94a3b8', margin: '6px 0 20px' }}>Total Combined Net Assets</p>
                            </div>

                            <table className="finance-table">
                                <tbody>
                                    <tr>
                                        <td>Investment Portfolio</td>
                                        <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#3b82f6' }}>
                                            ${totalPortfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Liquid Wallet Balance</td>
                                        <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#10b981' }}>
                                            ${walletBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 3: PAYMENTS & FX */}
            {activeTab === 'payments' && (
                <div>
                    <div className="grid-2col">
                        {/* P2P Wallet & Send Money */}
                        <div className="finance-card">
                            <div className="finance-card-title">
                                <span>P2P Digital Wallet</span>
                                <button className="finance-btn-primary" onClick={() => setShowTransferModal(true)}>
                                    <i className="fas fa-paper-plane"></i> Send Money
                                </button>
                            </div>

                            <div style={{
                                background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '16px',
                                padding: '24px',
                                marginBottom: '24px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div>
                                    <div style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase' }}>Primary Account</div>
                                    <div style={{ fontSize: '2rem', fontWeight: '800', color: '#10b981', marginTop: '4px' }}>
                                        ${walletBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
                                        Account #: USD-8849-2910-ULTRASUDO
                                    </div>
                                </div>
                                <i className="fas fa-credit-card" style={{ fontSize: '3rem', opacity: '0.2', color: '#ffffff' }}></i>
                            </div>

                            <h4 style={{ color: '#f1f5f9', marginTop: '20px' }}>Quick Contacts</h4>
                            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                {['Alex Morgan', 'Sarah Connor', 'David Chen', 'TechCorp Inc.'].map(contact => (
                                    <button 
                                        key={contact}
                                        className="finance-btn-secondary"
                                        style={{ padding: '8px 16px', borderRadius: '20px', fontSize: '0.85rem' }}
                                        onClick={() => {
                                            setTransferRecipient(contact);
                                            setShowTransferModal(true);
                                        }}
                                    >
                                        <i className="fas fa-user-circle"></i> {contact}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Foreign Exchange (FX) Converter */}
                        <div className="finance-card">
                            <div className="finance-card-title">
                                <span>Multi-Currency Converter</span>
                                <i className="fas fa-coins"></i>
                            </div>

                            <div className="fx-converter-box">
                                <div className="fx-field">
                                    <label>You Send</label>
                                    <input 
                                        type="number"
                                        className="finance-input"
                                        value={fxAmount}
                                        onChange={(e) => setFxAmount(parseFloat(e.target.value) || 0)}
                                    />
                                    <select 
                                        className="finance-select"
                                        style={{ marginTop: '8px' }}
                                        value={fxFrom}
                                        onChange={(e) => setFxFrom(e.target.value)}
                                    >
                                        {Object.keys(FX_RATES).map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>

                                <button className="fx-swap-btn" onClick={swapFx} title="Swap Currencies">
                                    <i className="fas fa-right-left"></i>
                                </button>

                                <div className="fx-field">
                                    <label>They Receive (Est.)</label>
                                    <input 
                                        type="text"
                                        className="finance-input"
                                        readOnly
                                        value={convertedFx}
                                    />
                                    <select 
                                        className="finance-select"
                                        style={{ marginTop: '8px' }}
                                        value={fxTo}
                                        onChange={(e) => setFxTo(e.target.value)}
                                    >
                                        {Object.keys(FX_RATES).map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div style={{ marginTop: '20px', fontSize: '0.85rem', color: '#64748b', textAlign: 'center' }}>
                                Exchange Rate: 1 {fxFrom} = {(FX_RATES[fxTo] / FX_RATES[fxFrom]).toFixed(4)} {fxTo}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 4: ACTIVITY LOG */}
            {activeTab === 'transactions' && (
                <div className="finance-card">
                    <div className="finance-card-title">
                        <span>Transaction Ledger & Activity</span>
                    </div>

                    <table className="finance-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Description</th>
                                <th>Type</th>
                                <th>Amount</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map(tx => (
                                <tr key={tx.id}>
                                    <td>{tx.date}</td>
                                    <td style={{ fontWeight: '600', color: '#ffffff' }}>{tx.desc}</td>
                                    <td>
                                        <span style={{
                                            padding: '3px 10px',
                                            borderRadius: '12px',
                                            fontSize: '0.75rem',
                                            fontWeight: '700',
                                            background: tx.category === 'Transfer' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                            color: tx.category === 'Transfer' ? '#38bdf8' : '#34d399'
                                        }}>
                                            {tx.category}
                                        </span>
                                    </td>
                                    <td style={{
                                        fontWeight: 'bold',
                                        color: tx.amount < 0 ? '#f87171' : '#34d399'
                                    }}>
                                        {tx.amount < 0 ? '' : '+'}${tx.amount.toFixed(2)}
                                    </td>
                                    <td style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{tx.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* MODAL: Send Money */}
            {showTransferModal && (
                <div className="finance-modal-overlay">
                    <div className="finance-modal">
                        <h3>Send Money (P2P Transfer)</h3>
                        <form onSubmit={handleSendMoney}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Recipient Name / ID</label>
                                <input 
                                    type="text" 
                                    className="finance-input" 
                                    required 
                                    value={transferRecipient}
                                    onChange={(e) => setTransferRecipient(e.target.value)}
                                    placeholder="e.g. Alex Morgan or USER-99"
                                />
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Amount ($ USD)</label>
                                <input 
                                    type="number" 
                                    className="finance-input" 
                                    required 
                                    min="1"
                                    max={walletBalance}
                                    step="0.01"
                                    value={transferAmount}
                                    onChange={(e) => setTransferAmount(e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Note (Optional)</label>
                                <input 
                                    type="text" 
                                    className="finance-input" 
                                    value={transferNote}
                                    onChange={(e) => setTransferNote(e.target.value)}
                                    placeholder="Dinner, project work..."
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="finance-btn-secondary" onClick={() => setShowTransferModal(false)}>Cancel</button>
                                <button type="submit" className="finance-btn-primary">Confirm Transfer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: Add Holding */}
            {showAddHoldingModal && (
                <div className="finance-modal-overlay">
                    <div className="finance-modal">
                        <h3>Add Portfolio Asset</h3>
                        <form onSubmit={handleAddHolding}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Asset Symbol</label>
                                <input 
                                    type="text" 
                                    className="finance-input" 
                                    required 
                                    value={newSymbol}
                                    onChange={(e) => setNewSymbol(e.target.value)}
                                    placeholder="e.g. TSLA, AMZN, ETH"
                                />
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Shares / Quantity</label>
                                <input 
                                    type="number" 
                                    className="finance-input" 
                                    required 
                                    step="any"
                                    value={newShares}
                                    onChange={(e) => setNewShares(e.target.value)}
                                    placeholder="10"
                                />
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Cost Basis / Buy Price ($)</label>
                                <input 
                                    type="number" 
                                    className="finance-input" 
                                    required 
                                    step="0.01"
                                    value={newCost}
                                    onChange={(e) => setNewCost(e.target.value)}
                                    placeholder="150.00"
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="finance-btn-secondary" onClick={() => setShowAddHoldingModal(false)}>Cancel</button>
                                <button type="submit" className="finance-btn-primary">Add Asset</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
