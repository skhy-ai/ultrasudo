const express = require('express');
const cors = require('cors');
const winston = require('winston');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 4000;
const LOGS_DIR = path.join(__dirname, 'logs');

// Ensure logs directory exists
if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR);
}

// Configure Winston Logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        }),
        new winston.transports.File({ 
            filename: path.join(LOGS_DIR, 'error.log'), 
            level: 'error' 
        }),
        new winston.transports.File({ 
            filename: path.join(LOGS_DIR, 'telemetry.log') 
        })
    ]
});

// Middleware
app.use(cors({ origin: '*' })); // Allow cross-origin from the Tauri application
app.use(express.json());

// Heartbeat
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// Ingestion Endpoint
app.post('/ingest', (req, res) => {
    try {
        const payload = req.body;
        const { type, ...data } = payload;
        
        // Append IP address for rough geolocation debugging (optional)
        data.clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

        if (type === 'ERROR') {
            logger.error('Client Error', data);
        } else if (type === 'INSTALL') {
            logger.info('New Installation Configured', data);
        } else {
            logger.info('Telemetry Event', payload);
        }
        
        res.status(200).json({ success: true, message: 'Log ingested' });
    } catch (error) {
        console.error('Failed to parse incoming log', error);
        res.status(500).json({ success: false, error: 'Internal ingestion error' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Ultrasudo Telemetry Sink listening on port ${PORT}`);
    logger.info(`Server started on port ${PORT}`);
});
