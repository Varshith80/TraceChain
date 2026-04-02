#!/bin/bash

set -e

echo "=========================================="
echo "Hyperledger Fabric Network Setup"
echo "=========================================="

# Check prerequisites
echo "Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker is not installed"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "ERROR: Docker Compose is not installed"
    exit 1
fi

# Check if Fabric binaries are available
if ! command -v cryptogen &> /dev/null || ! command -v configtxgen &> /dev/null; then
    echo "WARNING: Fabric binaries (cryptogen, configtxgen) not found in PATH"
    echo "Please install Hyperledger Fabric binaries from:"
    echo "https://github.com/hyperledger/fabric/releases"
    echo ""
    echo "Or use the Fabric Docker images to generate crypto material."
    echo "Continuing with Docker-based setup..."
fi

# Step 1: Generate crypto material
echo ""
echo "Step 1: Generating crypto material..."
if command -v cryptogen &> /dev/null; then
    ./scripts/generate-crypto.sh
else
    echo "Using Docker to generate crypto material..."
    docker run --rm -v ${PWD}:/data \
        hyperledger/fabric-tools:2.5 \
        cryptogen generate --config=/data/crypto-config.yaml --output=/data/crypto-config
fi

# Step 2: Generate genesis block
echo ""
echo "Step 2: Generating genesis block..."
if command -v configtxgen &> /dev/null; then
    ./scripts/generate-genesis.sh
else
    echo "Using Docker to generate genesis block..."
    docker run --rm -v ${PWD}:/data \
        -e FABRIC_CFG_PATH=/data \
        hyperledger/fabric-tools:2.5 \
        configtxgen -profile TwoOrgsOrdererGenesis -channelID system-channel -outputBlock /data/channel-artifacts/genesis.block
fi

# Step 3: Create channel transaction
echo ""
echo "Step 3: Creating channel transaction..."
CHANNEL_NAME="productledger-channel"
if command -v configtxgen &> /dev/null; then
    ./scripts/create-channel.sh $CHANNEL_NAME
    ./scripts/generate-anchor-peers.sh $CHANNEL_NAME
else
    echo "Using Docker to create channel transaction..."
    docker run --rm -v ${PWD}:/data \
        -e FABRIC_CFG_PATH=/data \
        hyperledger/fabric-tools:2.5 \
        configtxgen -profile TwoOrgsChannel -outputCreateChannelTx /data/channel-artifacts/${CHANNEL_NAME}.tx -channelID $CHANNEL_NAME
    
    echo "Generating anchor peer transactions..."
    docker run --rm -v ${PWD}:/data \
        -e FABRIC_CFG_PATH=/data \
        hyperledger/fabric-tools:2.5 \
        configtxgen -profile TwoOrgsChannel -outputAnchorPeersUpdate /data/channel-artifacts/Org1MSPanchors.tx -channelID $CHANNEL_NAME -asOrg Org1MSP
    
    docker run --rm -v ${PWD}:/data \
        -e FABRIC_CFG_PATH=/data \
        hyperledger/fabric-tools:2.5 \
        configtxgen -profile TwoOrgsChannel -outputAnchorPeersUpdate /data/channel-artifacts/Org2MSPanchors.tx -channelID $CHANNEL_NAME -asOrg Org2MSP
fi

echo ""
echo "=========================================="
echo "Network setup complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Start the network: docker-compose up -d"
echo "2. Create and join channel: ./scripts/deploy-channel.sh"
echo "3. Deploy chaincode: ./scripts/deploy-chaincode.sh"

