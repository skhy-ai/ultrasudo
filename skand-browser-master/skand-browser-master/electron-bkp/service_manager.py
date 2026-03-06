#!/usr/bin/env python3
"""
Centralized Python service manager for the Intuitive Simple Apps project.

Usage:
  python service_manager.py list
  python service_manager.py start <service-name> [--port 5005]

It discovers services by scanning for files named 'python_service.py' under subdirectories.
The service name equals the parent directory name of the python_service.py file (e.g., 'stock-ticker').
"""
import argparse
import os
import subprocess
from pathlib import Path
from typing import Dict

ROOT = Path(__file__).resolve().parent


def discover_services() -> Dict[str, Path]:
    services: Dict[str, Path] = {}
    for p in ROOT.glob('**/python_service.py'):
        # Ignore files in virtual envs or hidden directories
        if '.venv' in p.parts or any(part.startswith('.') for part in p.parts):
            continue
        name = p.parent.name
        services[name] = p
    return services


def start_http_server(port: str = '8000'):
    """Start the HTTP server for serving static files."""
    print(f"Starting HTTP server on port {port}...")
    try:
        subprocess.check_call([os.sys.executable, '-m', 'http.server', port])
    except subprocess.CalledProcessError as e:
        print(f"Failed to start HTTP server: {e}")
        raise


def main():
    ap = argparse.ArgumentParser(description='Service manager')
    sub = ap.add_subparsers(dest='cmd', required=True)

    sub.add_parser('list', help='List discovered services')

    p_server = sub.add_parser('server', help='Start the HTTP server (optionally with services)')
    p_server.add_argument('--port', default='8000', help='Port for HTTP server (default: 8000)')
    p_server.add_argument('--start-services', action='store_true', help='Also start all discovered Python services')

    args = ap.parse_args()
    if args.cmd == 'list':
        svcs = discover_services()
        if not svcs:
            print('No services found.')
        else:
            print('Discovered services:')
            for name, path in sorted(svcs.items()):
                print(f"- {name}: {path}")
    elif args.cmd == 'server':
        if args.start_services:
            # Start services in background
            svcs = discover_services()
            if svcs:
                print("Starting Python services...")
                for name, svc_path in svcs.items():
                    print(f"Starting {name}...")
                    # For simplicity, start in background (this is basic; in production, use proper process management)
                    # Note: This is a simple implementation; real multi-service management might need threading or separate processes
                    subprocess.Popen([os.sys.executable, str(svc_path)], cwd=str(svc_path.parent))
            else:
                print("No Python services found to start.")
        # Start the HTTP server
        start_http_server(args.port)


if __name__ == '__main__':
    main()
