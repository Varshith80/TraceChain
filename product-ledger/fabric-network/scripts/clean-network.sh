#!/bin/bash

set -e

echo "Cleaning Hyperledger Fabric network..."

# Stop and remove containers
docker-compose down -v

# Remove generated artifacts
echo "Removing generated artifacts..."
rm -rf crypto-config channel-artifacts *.block

echo "Network cleaned successfully!"
echo "Run ./scripts/network-setup.sh to regenerate artifacts."

