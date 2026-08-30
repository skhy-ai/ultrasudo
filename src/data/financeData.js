/**
 * Centralized Financial Data Module
 * Source: FinanceHub / stock-ticker / stock-screener / investment-board
 */
export const DEFAULT_MARKET_TICKERS = [
    { symbol: "AAPL", name: "Apple Inc.", price: 224.50, change: "+1.25%", positive: true, volume: "48.2M", cap: "$3.44T" },
    { symbol: "NVDA", name: "NVIDIA Corp.", price: 128.80, change: "+3.40%", positive: true, volume: "92.1M", cap: "$3.16T" },
    { symbol: "MSFT", name: "Microsoft Corp.", price: 448.20, change: "-0.45%", positive: false, volume: "22.5M", cap: "$3.33T" },
    { symbol: "GOOGL", name: "Alphabet Inc.", price: 168.90, change: "+0.85%", positive: true, volume: "18.9M", cap: "$2.10T" },
    { symbol: "AMZN", name: "Amazon.com Inc.", price: 186.40, change: "+1.10%", positive: true, volume: "31.4M", cap: "$1.94T" },
    { symbol: "TSLA", name: "Tesla Inc.", price: 215.30, change: "-2.10%", positive: false, volume: "64.8M", cap: "$685B" }
];

export const DEFAULT_CURRENCY_PAIRS = [
    { pair: "USD/EUR", rate: 0.92, label: "US Dollar to Euro" },
    { pair: "USD/GBP", rate: 0.78, label: "US Dollar to British Pound" },
    { pair: "USD/INR", rate: 83.95, label: "US Dollar to Indian Rupee" },
    { pair: "USD/JPY", rate: 146.50, label: "US Dollar to Japanese Yen" },
    { pair: "EUR/GBP", rate: 0.85, label: "Euro to British Pound" }
];
