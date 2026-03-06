#!/bin/bash
set -e

echo "=========================================================="
echo "Installing Intuitive Simple Apps Dependencies (Linux/Mac)"
echo "=========================================================="

# 1. Install Rust
if ! command -v cargo &> /dev/null
then
    echo "[INFO] Rust/Cargo not found. Attempting to install..."
    
    if command -v apt &> /dev/null; then
        echo "[INFO] Debian/Ubuntu system detected. Installing cargo via apt..."
        sudo apt update
        sudo apt install -y cargo rustc
    elif command -v brew &> /dev/null; then
        echo "[INFO] macOS/Homebrew detected. Installing rust via brew..."
        brew install rust
    else
        echo "[INFO] Using the default Rustup installer..."
        curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
        # Add to current path for immediate use
        source "$HOME/.cargo/env"
    fi
    
    echo "[SUCCESS] Rust successfully installed!"
else
    echo "[INFO] Rust/Cargo is already installed!"
fi

echo ""
echo "[INFO] Building the high-performance Rust System Manager ahead of time..."
cd system-manager
cargo build --release
cd ..

echo ""
echo "[INFO] Checking Node.js and NPM..."
if ! command -v npm &> /dev/null
then
    echo "[INFO] NPM not found. Attempting to install Node.js..."
    if command -v apt &> /dev/null; then
        sudo apt update
        sudo apt install -y nodejs npm
    elif command -v brew &> /dev/null; then
        brew install node
    else
        echo "[ERROR] Please manually install Node.js and NPM to run Skand Browser."
    fi
fi

echo "[INFO] Installing NPM dependencies for Skand Browser Chromium Layer..."
npm install

echo ""
echo "=========================================================="
echo "Installation Complete! You can now run ./start_linux.sh"
echo "=========================================================="
