#!/bin/bash
set -e

echo "=========================================="
echo "Starting Intuitive Simple Apps (Rust Core)"
echo "=========================================="

# Check if cargo is installed
if ! command -v cargo &> /dev/null
then
    echo "[INFO] Rust not found. Launching auto-installer..."
    chmod +x install_linux.sh
    ./install_linux.sh
    
    # Reload profile in case rustup was just installed
    if [ -f "$HOME/.cargo/env" ]; then
        source "$HOME/.cargo/env"
    fi
fi

echo "Checking System Manager build..."
cd system-manager
cargo build --release
cd ..

echo ""
echo "Launching Ultrasudo..."
echo ""

# Run the Electron Application (which implicitly spawns the Rust Manager)
npm start
