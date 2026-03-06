// Function to scan for HTML files in the project directory
async function scanForHtmlFiles() {
    try {
        // This will be populated by the server-side script
        const response = await fetch('/api/scan-html-files');
        if (!response.ok) {
            throw new Error('Failed to scan for HTML files');
        }
        return await response.json();
    } catch (error) {
        console.error('Error scanning for HTML files:', error);
        // Return default widgets if scanning fails
        return [
            { name: 'Todo List', path: '../todo-list/index.html' },
            { name: 'Calendar', path: '../calendar/index.html' },
            { name: 'Hindu Calendar', path: 'hindu_calendar.html' }
        ];
    }
}

// Function to populate the widget selector dropdown
async function populateWidgetSelector() {
    const widgetSelector = document.getElementById('widgetSelector');
    if (!widgetSelector) return;
    
    const htmlFiles = await scanForHtmlFiles();
    
    // Clear existing options
    widgetSelector.innerHTML = '<option value="">Select a widget to add...</option>';
    
    // Add each HTML file as an option
    htmlFiles.forEach(file => {
        const option = document.createElement('option');
        option.value = file.path;
        option.textContent = file.name;
        widgetSelector.appendChild(option);
    });
    
    // Add event listener to add selected widget
    widgetSelector.addEventListener('change', (e) => {
        if (e.target.value) {
            const widgetName = e.target.options[e.target.selectedIndex].text;
            addWidgetFromPath(widgetName, e.target.value);
            e.target.value = ''; // Reset the selector
        }
    });
}

// Function to add a widget from a file path
function addWidgetFromPath(name, path) {
    const widgets = JSON.parse(localStorage.getItem('lifeBoardWidgets')) || [];
    
    // Check if widget already exists
    if (widgets.some(w => w.url === path)) {
        alert('This widget is already added');
        return;
    }
    
    widgets.push({ name, url: path });
    localStorage.setItem('lifeBoardWidgets', JSON.stringify(widgets));
    renderWidgets();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    populateWidgetSelector();
});
