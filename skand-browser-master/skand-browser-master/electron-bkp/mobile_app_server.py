#!/usr/bin/env python3
"""
Simple Flask server to run Python services for the mobile app.
This integrates with the Cordova app for backend functionality.
"""

from flask import Flask, jsonify
import subprocess
import os
import sys
from pathlib import Path

app = Flask(__name__)

# Discover services
ROOT = Path(__file__).resolve().parent.parent  # Adjust to mobile-build/www
SERVICES_DIR = ROOT / 'services'

def discover_services():
    services = {}
    if SERVICES_DIR.exists():
        for p in SERVICES_DIR.glob('**/python_service.py'):
            name = p.parent.name
            services[name] = p
    return services

@app.route('/')
def index():
    return "Intuitive Simple Apps Mobile Server Running. Access apps via the dashboard."

@app.route('/api/services')
def list_services():
    services = discover_services()
    return jsonify(list(services.keys()))

@app.route('/api/start_service/<service_name>')
def start_service(service_name):
    services = discover_services()
    if service_name in services:
        svc_path = services[service_name]
        try:
            # Start service in background (basic; use proper management in production)
            subprocess.Popen([sys.executable, str(svc_path)], cwd=str(svc_path.parent))
            return jsonify({"status": "started", "service": service_name})
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    return jsonify({"error": "Service not found"}), 404

if __name__ == '__main__':
    print("Starting Flask server for mobile app services...")
    app.run(host='0.0.0.0', port=5000, debug=True)
