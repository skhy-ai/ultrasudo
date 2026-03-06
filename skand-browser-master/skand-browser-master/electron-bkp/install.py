#!/usr/bin/env python3
"""
Cross-platform installer for the Intuitive Simple Apps project.
- Creates a Python virtual environment in .venv
- Installs Python requirements (Flask, yfinance, etc.)
- Optional: start the local HTTP server with all services via service_manager.py

Usage:
  python install.py              # setup only
  python install.py --start-server  # setup and start server with services
  # Legacy: python install.py --start-service --port 5005 (deprecated)
"""
import platform

def get_os():
    """Detect the operating system."""
    system = platform.system().lower()
    if system == 'windows':
        return 'windows'
    elif system in ['linux', 'darwin']:  # Darwin is macOS
        return 'unix'
    else:
        return 'unknown'

ROOT = Path(__file__).resolve().parent
VENV_DIR = ROOT / '.venv'
REQUIREMENTS = ROOT / 'requirements.txt'
SERVICE = ROOT / 'stock-ticker' / 'python_service.py'


def run(cmd, env=None, cwd=None):
    print('> ' + ' '.join(cmd))
    subprocess.check_call(cmd, env=env, cwd=cwd)


def ensure_venv():
    if not VENV_DIR.exists():
        print(f'Creating virtual environment at {VENV_DIR} ...')
        builder = venv.EnvBuilder(with_pip=True)
        builder.create(str(VENV_DIR))
    else:
        print(f'Virtual environment already exists at {VENV_DIR}')


def venv_python():
    os_type = get_os()
    if os_type == 'windows':
        return str(VENV_DIR / 'Scripts' / 'python.exe')
    elif os_type == 'unix':
        return str(VENV_DIR / 'bin' / 'python')
    else:
        raise ValueError(f"Unsupported OS: {os_type}. Cannot determine virtual environment Python path.")


def install_requirements():
    py = venv_python()
    print('Upgrading pip ...')
    run([py, '-m', 'pip', 'install', '--upgrade', 'pip', 'wheel', 'setuptools'])
    if REQUIREMENTS.exists():
        print(f'Installing requirements from {REQUIREMENTS} ...')
        run([py, '-m', 'pip', 'install', '-r', str(REQUIREMENTS)])
    else:
        print('requirements.txt not found, skipping Python dependency install.')


def start_server():
    py = venv_python()
    print('Starting server with services...')
    run([py, 'service_manager.py', 'server', '--start-services'])


def start_service(port: str | None = None):
    # Deprecated: starting services is handled by service_manager.py
    print('NOTE: Starting services via install.py is deprecated.')
    print('Use: python service_manager.py start stock-ticker --port 5005')


def main(argv):
    # Parse args
    start = False
    port = None
    i = 0
    while i < len(argv):
        a = argv[i]
        if a in ('--start', '--start-service'):
            start = True
        elif a == '--port' and i + 1 < len(argv):
            port = argv[i + 1]
            i += 1
        i += 1

def main(argv):
    # Parse args
    start = False
    port = None
    start_server_flag = False
    i = 0
    while i < len(argv):
        a = argv[i]
        if a in ('--start', '--start-service'):
            start = True
        elif a == '--start-server':
            start_server_flag = True
        elif a == '--port' and i + 1 < len(argv):
            port = argv[i + 1]
            i += 1
        i += 1

    print('Installing Intuitive Simple Apps (Python components)...')
    ensure_venv()
    install_requirements()

    print('\nDone. Next steps:')
    print('- Start a local service using the centralized manager, e.g.:')
    print('    python service_manager.py list')
    print('    python service_manager.py start stock-ticker --port 5005')
    print('- Or start the server with all services:')
    print('    python service_manager.py server --start-services')
    print('- Then visit http://localhost:8000 for the apps')

    if start_server_flag:
        start_server()
    elif start:
        # Deprecated path; keep for backward-compat messages only
        start_service(port)


if __name__ == '__main__':
    try:
        main(sys.argv[1:])
    except subprocess.CalledProcessError as e:
        print(f'Command failed with exit code {e.returncode}')
        sys.exit(e.returncode)
