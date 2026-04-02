#!/bin/bash

set -e

echo "Generating genesis block..."

# Check if configtxgen exists
if ! command -v configtxgen &> /dev/null; then
    echo "configtxgen not found. Please install Hyperledger Fabric binaries."
    echo "Download from: https://github.com/hyperledger/fabric/releases"
    exit 1
fi

# Create channel-artifacts directory
mkdir -p channel-artifacts

# Set FABRIC_CFG_PATH
export FABRIC_CFG_PATH=${PWD}

# Generate genesis block
configtxgen -profile TwoOrgsOrdererGenesis -channelID system-channel -outputBlock ./channel-artifacts/genesis.block

echo "Genesis block generated successfully!"

