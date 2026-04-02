#!/bin/bash

set -e

CHANNEL_NAME=${1:-"productledger-channel"}

echo "Generating anchor peer transactions..."

export FABRIC_CFG_PATH=${PWD}

# Generate Org1 anchor peer transaction
configtxgen -profile TwoOrgsChannel -outputAnchorPeersUpdate ./channel-artifacts/Org1MSPanchors.tx -channelID $CHANNEL_NAME -asOrg Org1MSP

# Generate Org2 anchor peer transaction
configtxgen -profile TwoOrgsChannel -outputAnchorPeersUpdate ./channel-artifacts/Org2MSPanchors.tx -channelID $CHANNEL_NAME -asOrg Org2MSP

echo "Anchor peer transactions generated successfully!"

