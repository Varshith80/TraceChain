#!/bin/bash

set -e

echo "Generating crypto material..."

# Check if cryptogen exists
if ! command -v cryptogen &> /dev/null; then
    echo "cryptogen not found. Please install Hyperledger Fabric binaries."
    echo "Download from: https://github.com/hyperledger/fabric/releases"
    exit 1
fi

# Generate crypto material
cryptogen generate --config=./crypto-config.yaml --output="crypto-config"

echo "Crypto material generated successfully!"

