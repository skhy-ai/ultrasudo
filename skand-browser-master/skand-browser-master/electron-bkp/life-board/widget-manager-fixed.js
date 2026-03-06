// Widget Manager for Life Board
// Handles adding, removing, and rendering widgets

// Global storage instance
let widgetStorage;

// DOM Elements
let leftWidgetContainer;
let rightWidgetContainer;
let widgetList;
let widgetNameInput;
let widgetFileInput;
let addWidgetBtn;
let fileUploadArea;

// Initialize the widget manager
function initializeWidgetManager() {
    try {
        console.log('Initializing widget manager...');
        
        // Get DOM elements
        leftWidgetContainer = document.getElementById('left-widget-container');
        rightWidgetContainer = document.getElementById('right-widget-container');
        widgetList = document.getElementById('widgetList');
        widgetNameInput = document.getElementById('widgetName');
        widgetFileInput = document.getElementById('widgetFile');
        addWidgetBtn = document.getElementById('addWidgetBtn');
        fileUploadArea = document.getElementById('fileUploadArea');
        
        if (!leftWidgetContainer || !rightWidgetContainer || !widgetList) {
            console.error('Required DOM elements not found');
            return;
        }
        
        // Set up event listeners
        setupEventListeners();
        
        // Initialize storage
        if (window.WidgetStorage) {
            widgetStorage = new window.WidgetStorage();
            widgetStorage.init().then(() => {
                console.log('Widget storage initialized');
                // Load and render widgets
                renderWidgets();
            }).catch(error => {
                console.error('Failed to initialize widget storage:', error);
            });
        } else {
            console.error('WidgetStorage is not available');
        }
        
    } catch (error) {
        console.error('Failed to initialize widget manager:', error);
    }
}

// Set up event listeners
function setupEventListeners() {
    // Add widget button
    if (addWidgetBtn && widgetNameInput && widgetFileInput) {
        addWidgetBtn.addEventListener('click', handleAddWidget);
        widgetNameInput.addEventListener('input', updateAddButtonState);
        widgetFileInput.addEventListener('change', function() {
            handleFiles(this.files);
        });
        
        // Handle drag and drop
        if (fileUploadArea) {
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                fileUploadArea.addEventListener(eventName, preventDefaults, false);
            });

            ['dragenter', 'dragover'].forEach(eventName => {
                fileUploadArea.addEventListener(eventName, highlight, false);
            });

            ['dragleave', 'drop'].forEach(eventName => {
                fileUploadArea.addEventListener(eventName, unhighlight, false);
            });

            fileUploadArea.addEventListener('drop', handleDrop, false);
        }
    }
}

// Prevent default drag behaviors
function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

// Highlight drop area
function highlight() {
    fileUploadArea.classList.add('highlight');
}

// Remove highlight from drop area
function unhighlight() {
    fileUploadArea.classList.remove('highlight');
}

// Handle file drop
function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
}

// Handle file selection
function handleFiles(files) {
    if (files.length > 0) {
        const file = files[0];
        if (file.type === 'text/html' || file.name.endsWith('.html')) {
            const fileName = document.getElementById('selectedFileName');
            const fileError = document.getElementById('fileError');
            fileName.textContent = file.name;
            fileName.style.display = 'block';
            fileError.style.display = 'none';
            updateAddButtonState();
        } else {
            showFileError('Please select an HTML file');
        }
    }
}

// Show file error message
function showFileError(message) {
    const fileError = document.getElementById('fileError');
    if (fileError) {
        fileError.textContent = message;
        fileError.style.display = 'block';
        const fileName = document.getElementById('selectedFileName');
        if (fileName) fileName.style.display = 'none';
    }
}

// Update add button state based on form validity
function updateAddButtonState() {
    if (addWidgetBtn && widgetNameInput && widgetFileInput) {
        addWidgetBtn.disabled = !(widgetNameInput.value.trim() && widgetFileInput.files.length > 0);
    }
}

// Handle add widget button click
async function handleAddWidget() {
    if (!widgetNameInput || !widgetFileInput.files.length) return;
    
    const name = widgetNameInput.value.trim();
    const file = widgetFileInput.files[0];
    
    if (!name || !file) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    try {
        // Create a URL for the file
        const fileUrl = URL.createObjectURL(file);
        
        // Add the widget
        const widget = {
            name: name,
            url: fileUrl,
            position: 'left', // Default position
            id: Date.now().toString()
        };
        
        // Save the widget
        const widgets = await getWidgets();
        widgets.push(widget);
        await saveWidgets(widgets);
        
        // Render the widget
        await renderWidgets();
        
        // Reset the form
        widgetNameInput.value = '';
        widgetFileInput.value = '';
        const fileName = document.getElementById('selectedFileName');
        if (fileName) fileName.style.display = 'none';
        updateAddButtonState();
        
        showNotification('Widget added successfully!', 'success');
        
    } catch (error) {
        console.error('Error adding widget:', error);
        showNotification('Failed to add widget: ' + error.message, 'error');
    }
}

// Get widgets from storage
async function getWidgets() {
    if (!widgetStorage) {
        console.error('Widget storage not initialized');
        return [];
    }
    try {
        const state = await widgetStorage.load();
        return state.widgets || [];
    } catch (error) {
        console.error('Error loading widgets:', error);
        return [];
    }
}

// Save widgets to storage
async function saveWidgets(widgets) {
    if (!widgetStorage) {
        console.error('Widget storage not initialized');
        return false;
    }
    try {
        const state = await widgetStorage.load();
        state.widgets = widgets;
        await widgetStorage.save(state);
        return true;
    } catch (error) {
        console.error('Error saving widgets:', error);
        return false;
    }
}

// Render all widgets
async function renderWidgets() {
    try {
        const widgets = await getWidgets();
        
        // Clear containers
        if (leftWidgetContainer) leftWidgetContainer.innerHTML = '';
        if (rightWidgetContainer) rightWidgetContainer.innerHTML = '';
        if (widgetList) widgetList.innerHTML = '';
        
        // Render each widget
        widgets.forEach((widget, index) => {
            // Add to widget list
            if (widgetList) {
                const widgetItem = document.createElement('div');
                widgetItem.className = 'widget-item';
                widgetItem.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span>${widget.name}</span>
                        <div>
                            <button class="btn btn-sm btn-outline" onclick="moveWidget('${widget.id}', '${widget.position === 'left' ? 'right' : 'left'}')">
                                Move ${widget.position === 'left' ? 'Right' : 'Left'}
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="removeWidget('${widget.id}')">
                                Remove
                            </button>
                        </div>
                    </div>
                `;
                widgetList.appendChild(widgetItem);
            }
            
            // Add to appropriate container
            const container = widget.position === 'right' ? rightWidgetContainer : leftWidgetContainer;
            if (container) {
                const widgetElement = createWidgetElement(widget);
                if (widgetElement) {
                    container.appendChild(widgetElement);
                }
            }
        });
        
    } catch (error) {
        console.error('Error rendering widgets:', error);
    }
}

// Create widget element
function createWidgetElement(widget) {
    if (!widget || !widget.url) return null;
    
    const widgetElement = document.createElement('div');
    widgetElement.className = 'widget';
    widgetElement.dataset.widgetId = widget.id;
    
    // Create header
    const header = document.createElement('div');
    header.className = 'widget-header';
    header.innerHTML = `
        <h4>${widget.name}</h4>
        <div class="widget-actions">
            <button class="btn btn-sm btn-outline" onclick="toggleFullscreen('${widget.id}')">
                <i class="fas fa-expand"></i>
            </button>
            <button class="btn btn-sm btn-danger" onclick="removeWidget('${widget.id}')">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    // Create iframe
    const iframe = document.createElement('iframe');
    iframe.src = widget.url;
    iframe.className = 'widget-frame';
    iframe.sandbox = 'allow-same-origin allow-scripts allow-popups allow-forms';
    
    // Assemble widget
    widgetElement.appendChild(header);
    widgetElement.appendChild(iframe);
    
    return widgetElement;
}

// Move widget between left and right containers
async function moveWidget(widgetId, newPosition) {
    try {
        const widgets = await getWidgets();
        const widgetIndex = widgets.findIndex(w => w.id === widgetId);
        if (widgetIndex !== -1) {
            widgets[widgetIndex].position = newPosition;
            await saveWidgets(widgets);
            await renderWidgets();
        }
    } catch (error) {
        console.error('Error moving widget:', error);
        showNotification('Failed to move widget', 'error');
    }
}

// Remove widget
async function removeWidget(widgetId) {
    if (confirm('Are you sure you want to remove this widget?')) {
        try {
            const widgets = await getWidgets();
            const updatedWidgets = widgets.filter(w => w.id !== widgetId);
            await saveWidgets(updatedWidgets);
            await renderWidgets();
            showNotification('Widget removed', 'success');
        } catch (error) {
            console.error('Error removing widget:', error);
            showNotification('Failed to remove widget', 'error');
        }
    }
}

// Toggle fullscreen for widget
function toggleFullscreen(widgetId) {
    const widget = document.querySelector(`.widget[data-widget-id="${widgetId}"]`);
    if (widget) {
        widget.classList.toggle('fullscreen');
        const iframe = widget.querySelector('iframe');
        if (iframe) {
            // Notify iframe about the size change
            iframe.contentWindow.postMessage({ 
                type: 'resize', 
                fullscreen: widget.classList.contains('fullscreen') 
            }, '*');
        }
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Use the app's notification system if available
    if (window.showNotification) {
        window.showNotification(message, type);
    } else {
        // Fallback to alert
        alert(`${type.toUpperCase()}: ${message}`);
    }
}

// Initialize when the DOM is fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        // Wait a bit to ensure all scripts are loaded
        setTimeout(initializeWidgetManager, 500);
    });
} else {
    setTimeout(initializeWidgetManager, 500);
}

// Add these functions to the global scope so they can be called from HTML
window.addWidgetFromPath = async function(name, path) {
    try {
        const widgets = await getWidgets();
        const widget = {
            name: name,
            url: path,
            position: 'left',
            id: 'predefined-' + Date.now().toString()
        };
        
        widgets.push(widget);
        await saveWidgets(widgets);
        await renderWidgets();
        showNotification(`${name} widget added successfully!`, 'success');
    } catch (error) {
        console.error('Error adding predefined widget:', error);
        showNotification(`Failed to add ${name} widget: ${error.message}`, 'error');
    }
};

// Expose other functions to the global scope
window.moveWidget = moveWidget;
window.removeWidget = removeWidget;
window.toggleFullscreen = toggleFullscreen;
