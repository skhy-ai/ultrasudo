const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Enable CORS for all routes
app.use(cors());

// Serve static files from the project root (parent directory) first, so shared assets like /music are accessible
app.use(express.static(path.join(__dirname, '..')));

// Also serve static files from the current directory (life-board) for app-specific assets
app.use('/life-board', express.static(__dirname));

// API endpoint to scan for HTML files
app.get('/api/scan-html-files', (req, res) => {
    try {
        const rootDir = path.join(__dirname, '..'); // Go up one level from life-board directory
        const htmlFiles = [];
        
        // Function to recursively scan directories
        function scanDirectory(dir) {
            const files = fs.readdirSync(dir);
            
            files.forEach(file => {
                const filePath = path.join(dir, file);
                const stat = fs.statSync(filePath);
                
                if (stat.isDirectory()) {
                    // Skip node_modules and .git directories
                    if (file === 'node_modules' || file === '.git') return;
                    scanDirectory(filePath);
                } else if (path.extname(file).toLowerCase() === '.html') {
                    // Calculate relative path from the root directory
                    const relativePath = path.relative(rootDir, filePath).replace(/\\/g, '/');
                    const dirName = path.dirname(relativePath).split(path.sep).pop();
                    
                    // Skip files in the root directory and hidden files
                    if (dirName && !file.startsWith('.')) {
                        htmlFiles.push({
                            name: `${dirName} - ${file}`,
                            path: relativePath
                        });
                    }
                }
            });
        }
        
        // Start scanning from the root directory
        scanDirectory(rootDir);
        
        // Add some default widgets
        const defaultWidgets = [
            { name: 'Todo List', path: 'todo-list/index.html' },
            { name: 'Hindu Calendar', path: 'life-board/hindu_calendar.html' },
            { name: 'Calendar', path: 'calendar/index.html' },
            { name: 'Kanban Board', path: 'kanban-board/index.html' },
            { name: 'Pomodoro Timer', path: 'pomodoro-timer/index.html' },
            { name: 'Markdown Editor', path: 'markdown-editor/index.html' },
            { name: 'Portfolio Manager', path: 'portfolio-manager/index.html' },
            { name: 'Stock Ticker', path: 'stock-ticker/stock-ticker.html' }
        ];
        
        // Combine found HTML files with default widgets
        const allWidgets = [...defaultWidgets, ...htmlFiles];
        
        res.json(allWidgets);
    } catch (error) {
        console.error('Error scanning for HTML files:', error);
        res.status(500).json({ error: 'Failed to scan for HTML files' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Serving project root from: ${path.join(__dirname, '..')}`);
    console.log(`Serving Life Board from: ${__dirname}`);
    console.log('Life Board is available at http://localhost:3000/life-board');
});
