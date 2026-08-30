/**
 * Centralized Grocery Data Module
 * Source: Grocery / life-board
 */
export const GLYCEMIC_FOODS = [
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

export const DELIVERY_SERVICES_BY_COUNTRY = {
    us: {
        flag: "🇺🇸",
        label: "United States",
        services: [
            { name: "Instacart", icon: "fas fa-shopping-basket", getUrl: (items) => `https://www.instacart.com/store/search/${encodeURIComponent(items)}` },
            { name: "Walmart", icon: "fas fa-store", getUrl: (items) => `https://www.walmart.com/search?q=${encodeURIComponent(items)}` },
            { name: "Amazon Fresh", icon: "fab fa-amazon", getUrl: (items) => `https://www.amazon.com/s?k=${encodeURIComponent(items)}&i=amazonfresh` }
        ]
    },
    uk: {
        flag: "🇬🇧",
        label: "United Kingdom",
        services: [
            { name: "Tesco", icon: "fas fa-shopping-cart", getUrl: (items) => `https://www.tesco.com/groceries/en-GB/search?query=${encodeURIComponent(items)}` },
            { name: "Sainsbury's", icon: "fas fa-store", getUrl: (items) => `https://www.sainsburys.co.uk/gol-ui/SearchDisplayView?searchTerm=${encodeURIComponent(items)}` },
            { name: "Ocado", icon: "fas fa-truck-fast", getUrl: (items) => `https://www.ocado.com/search?entry=${encodeURIComponent(items)}` },
            { name: "Asda", icon: "fas fa-basket-shopping", getUrl: (items) => `https://groceries.asda.com/search/${encodeURIComponent(items)}` }
        ]
    },
    in: {
        flag: "🇮🇳",
        label: "India",
        services: [
            { name: "Blinkit", icon: "fas fa-bolt", getUrl: (items) => `https://blinkit.com/s/?q=${encodeURIComponent(items)}` },
            { name: "Zepto", icon: "fas fa-stopwatch", getUrl: (items) => `https://www.zeptonow.com/search?q=${encodeURIComponent(items)}` },
            { name: "Swiggy Instamart", icon: "fas fa-motorcycle", getUrl: (items) => `https://www.swiggy.com/instamart/search?custom_back=true&query=${encodeURIComponent(items)}` },
            { name: "BigBasket", icon: "fas fa-shopping-bag", getUrl: (items) => `https://www.bigbasket.com/ps/?q=${encodeURIComponent(items)}` }
        ]
    },
    de: {
        flag: "🇩🇪",
        label: "Germany",
        services: [
            { name: "Rewe", icon: "fas fa-store", getUrl: (items) => `https://www.rewe.de/shop/suchergebnisse?search=${encodeURIComponent(items)}` },
            { name: "Bring", icon: "fas fa-truck-ramp-box", getUrl: (items) => `https://www.getbring.com/` },
            { name: "Flink", icon: "fas fa-person-biking", getUrl: (items) => `https://www.goflink.com/` }
        ]
    },
    au: {
        flag: "🇦🇺",
        label: "Australia",
        services: [
            { name: "Woolworths", icon: "fas fa-apple-whole", getUrl: (items) => `https://www.woolworths.com.au/shop/search/products?searchTerm=${encodeURIComponent(items)}` },
            { name: "Coles", icon: "fas fa-cart-shopping", getUrl: (items) => `https://www.coles.com.au/search?q=${encodeURIComponent(items)}` }
        ]
    },
    ca: {
        flag: "🇨🇦",
        label: "Canada",
        services: [
            { name: "Instacart CA", icon: "fas fa-truck", getUrl: (items) => `https://www.instacart.ca/store/search/${encodeURIComponent(items)}` },
            { name: "Voila", icon: "fas fa-bag-shopping", getUrl: (items) => `https://voila.ca/search?q=${encodeURIComponent(items)}` }
        ]
    }
};
