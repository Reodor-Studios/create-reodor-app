#!/bin/bash

# Ensure transactional email dependencies are installed
# This script checks if dependencies exist in the transactional directory
# and installs them if needed

TRANSACTIONAL_DIR="transactional"

# Check if transactional directory exists
if [ ! -d "$TRANSACTIONAL_DIR" ]; then
  echo "Error: transactional directory not found"
  exit 1
fi

# Check if node_modules exists in transactional directory
if [ ! -d "$TRANSACTIONAL_DIR/node_modules" ]; then
  echo "Installing transactional email dependencies..."
  cd "$TRANSACTIONAL_DIR" && bun install

  if [ $? -ne 0 ]; then
    echo "Failed to install dependencies"
    exit 1
  fi

  echo "Dependencies installed successfully"
else
  echo "Transactional email dependencies already installed"
fi

exit 0
